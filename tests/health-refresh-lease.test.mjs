import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.UPSTASH_REDIS_REST_URL = 'https://mock-upstash.test';
process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
const { default: handler, __testing__: keys } = await import('../api/health.js');
const realFetch = globalThis.fetch;
const realNow = Date.now;
afterEach(() => { globalThis.fetch = realFetch; Date.now = realNow; });
const request = () => handler(new Request('https://api.worldmonitor.app/api/health?compact=1'));
const deferred = () => Promise.withResolvers();

// Stateful Redis transport double: real handler, election, polling, classifier,
// persistence and release execute; only external Redis commands are simulated.
function redisFixture({ holdFirstSweep = false, failFirstSweep = false, failRelease = false } = {}) {
  let now = realNow();
  Date.now = () => now;
  const store = new Map();
  let lock = null;
  let sweeps = 0;
  const started = deferred();
  const release = deferred();
  const publications = [];
  const acquire = [];
  globalThis.fetch = async (_url, init) => {
    const commands = JSON.parse(init.body);
    const sweep = commands.some(([op]) => op === 'STRLEN' || op === 'LLEN');
    if (sweep) {
      sweeps++;
      assert.ok(lock && lock.until > now, 'every sweep must start under a live lease');
      if (sweeps === 1) {
        started.resolve();
        if (holdFirstSweep) await release.promise;
        if (failFirstSweep) return new Response(null, { status: 503 });
      }
    }
    const results = commands.map(([op, key, ...args]) => {
      if (op === 'SET' && key === keys.HEALTH_VERDICT_REFRESH_LOCK_KEY) {
        if (lock && lock.until > now) return { result: null };
        lock = { token: args[0], until: now + Number(args[2]) * 1_000 };
        acquire.push(lock.token);
        return { result: 'OK' };
      }
      if (op === 'EVAL' && key === keys.HEALTH_VERDICT_WRITE_SNAPSHOT_SCRIPT) {
        const [count, lockKey, snapshotKey, token, value] = args;
        assert.equal(count, '2');
        assert.equal(lockKey, keys.HEALTH_VERDICT_REFRESH_LOCK_KEY);
        if (!lock || lock.until <= now || lock.token !== token) return { result: null };
        store.set(snapshotKey, value);
        publications.push(token);
        return { result: 'OK' };
      }
      if (op === 'EVAL' && key === keys.HEALTH_VERDICT_RELEASE_LOCK_SCRIPT) {
        if (failRelease) return { error: 'release unavailable' };
        if (lock?.token === args[2]) lock = null;
        return { result: 1 };
      }
      if (op === 'GET' && [keys.HEALTH_VERDICT_SNAPSHOT_KEY, keys.HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY].includes(key)) {
        return { result: store.get(key) ?? null };
      }
      if (op === 'STRLEN') return { result: 100 };
      if (op === 'LLEN') return { result: 1 };
      if (op === 'GET') return { result: JSON.stringify({ fetchedAt: now, recordCount: 1 }) };
      if (op === 'EXISTS') return { result: 0 };
      return { result: 'OK' };
    });
    return Response.json(results);
  };
  return {
    started: started.promise, release: () => release.resolve(),
    advance: (ms) => { now += ms; },
    get sweeps() { return sweeps; }, get lock() { return lock; },
    allowRelease: () => { failRelease = false; },
    store, publications, acquire,
  };
}

test('slow owner keeps concurrent misses pending without unowned sweeps', async () => {
  const f = redisFixture({ holdFirstSweep: true });
  const owner = request();
  await f.started;
  const followers = Promise.all(Array.from({ length: 4 }, request));
  // Move the real contention clock past its budget while the owner is held.
  await new Promise((resolve) => setTimeout(resolve, 150));
  f.advance(3_100);
  const responses = await followers;
  assert.equal(f.sweeps, 1);
  for (const response of responses) {
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Retry-After'), '3');
    assert.match(response.headers.get('Cache-Control'), /no-store/);
    const body = await response.json();
    assert.equal(body.status, 'REFRESH_PENDING');
    assert.equal(body.checkedAt, undefined);
    assert.equal(body.summary, undefined);
  }
  f.release();
  const result = await owner;
  assert.equal(result.status, 200);
  assert.equal((await request()).status, 200);
  assert.equal(f.sweeps, 1, 'subsequent retry uses the owner snapshot');
});

test('failed owner releases its lease and the next request can refresh', async () => {
  const f = redisFixture({ failFirstSweep: true });
  const response = await request();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, 'REDIS_DOWN');
  assert.equal(f.lock, null);
  assert.equal((await request()).status, 200);
  assert.equal(f.sweeps, 2);
  assert.equal(f.acquire.length, 2);
});

test('failed release leaves a bounded lease that a later owner can acquire', async () => {
  const f = redisFixture({ failFirstSweep: true, failRelease: true });
  assert.equal((await request()).status, 503);
  assert.ok(f.lock);
  f.advance(30_001);
  assert.equal((await request()).status, 200);
  assert.equal(f.acquire.length, 2);
});

test('expired owner cannot overwrite snapshots or delete a successor lease', async () => {
  const f = redisFixture({ holdFirstSweep: true, failRelease: true });
  const owner = request();
  await f.started;
  f.advance(30_001);
  assert.equal((await request()).status, 200);
  const successor = f.lock.token;
  const snapshot = f.store.get(keys.HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY);
  f.allowRelease();
  f.release();
  assert.equal((await owner).status, 200, 'computed live verdict remains usable');
  assert.equal(f.lock.token, successor);
  assert.equal(f.store.get(keys.HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY), snapshot);
  assert.deepEqual(f.publications, [successor, successor]);
});

test('malformed lease reply is unavailable, not pending and never sweeps', async () => {
  let calls = 0;
  globalThis.fetch = async () => Response.json(++calls === 1 ? [{ result: null }] : []);
  const response = await request();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, 'REDIS_DOWN');
  assert.equal(calls, 2);
});

test('snapshot read exhausting wait budget does not start another lock request', async () => {
  let now = realNow();
  Date.now = () => now;
  let reads = 0;
  let claims = 0;
  globalThis.fetch = async (_url, init) => {
    const [[op]] = JSON.parse(init.body);
    if (op === 'GET') {
      if (++reads > 1) now += 3_001;
      return Response.json([{ result: null }]);
    }
    assert.equal(op, 'SET');
    claims++;
    return Response.json([{ result: null }]);
  };
  const response = await request();
  assert.equal((await response.json()).status, 'REFRESH_PENDING');
  assert.equal(claims, 1);
});

test('an active waiter can acquire the lease after its owner fails', async () => {
  const f = redisFixture({ holdFirstSweep: true, failFirstSweep: true });
  const owner = request();
  await f.started;
  const follower = request();
  f.release();
  assert.equal((await owner).status, 503);
  assert.equal((await follower).status, 200);
  assert.equal(f.sweeps, 2);
  assert.equal(f.acquire.length, 2);
});

test('a lock acknowledgement arriving after lease expiry cannot start a sweep', async () => {
  let now = realNow();
  Date.now = () => now;
  const operations = [];
  globalThis.fetch = async (_url, init) => {
    const [[op]] = JSON.parse(init.body);
    operations.push(op);
    if (op === 'SET') now += 30_000;
    return Response.json([{ result: op === 'GET' ? null : 'OK' }]);
  };
  const response = await request();
  assert.equal((await response.json()).status, 'REFRESH_PENDING');
  assert.deepEqual(operations, ['GET', 'SET', 'EVAL']);
});
