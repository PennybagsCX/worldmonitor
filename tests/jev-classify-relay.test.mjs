import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const {
  createClassifyChunk, fetchJevLabel, shouldPublishClassifiedAlert, classifyCacheValue,
  countLabelSource, isHeldJevAlert, jevApiKey, JEV_NOTIFY_MIN_P_ALERT,
} = require('../scripts/lib/jev-classify-relay.cjs');

const jevLabel = (l, pAlert = 0, levelConf = 0.9) => ({ l, c: 'general', levelConf, pAlert });

function harness({ env = { TYPESAFE_API_KEY: 'k' }, jev = async () => jevLabel('low'), llm = async (titles) => titles.map((_, i) => ({ i, l: 'medium', c: 'economic' })), now } = {}) {
  const calls = { jev: [], llm: [], warn: [] };
  const classifyChunk = createClassifyChunk({
    env,
    fetchJevLabel: async (title, maxTextChars) => { calls.jev.push({ title, maxTextChars }); return jev(title); },
    fetchLlm: async (titles, maxTextChars) => { calls.llm.push({ titles, maxTextChars }); return llm(titles); },
    warn: (msg) => calls.warn.push(msg),
    now,
  });
  return { classifyChunk, calls };
}

describe('createClassifyChunk', () => {
  it('never calls Jev when TYPESAFE_API_KEY is unset and returns the LLM result untouched', async () => {
    const llmResult = [{ i: 0, l: 'high', c: 'conflict' }];
    const { classifyChunk, calls } = harness({ env: {}, llm: async () => llmResult });
    assert.equal(await classifyChunk(['a'], 120), llmResult);
    assert.equal(calls.jev.length, 0);
    assert.deepEqual(calls.llm, [{ titles: ['a'], maxTextChars: 120 }]);
  });

  it('labels every title with Jev and skips the LLM when all succeed', async () => {
    const { classifyChunk, calls } = harness({ jev: async () => jevLabel('high', 0.9) });
    const out = await classifyChunk(['a', 'b']);
    assert.deepEqual(out.map((e) => [e.i, e.l, e.src]), [[0, 'high', 'jev'], [1, 'high', 'jev']]);
    assert.equal(out[0].pAlert, 0.9);
    assert.equal(calls.llm.length, 0);
  });

  it('sends only the titles Jev failed on to the LLM and remaps their indices', async () => {
    const { classifyChunk, calls } = harness({
      jev: async (title) => (title === 'b' || title === 'd' ? null : jevLabel('info')),
      llm: async () => [{ i: 0, l: 'high', c: 'conflict' }, { i: 1, l: 'low', c: 'diplomatic' }],
    });
    const out = await classifyChunk(['a', 'b', 'c', 'd']);
    assert.deepEqual(calls.llm[0].titles, ['b', 'd']);
    const byIndex = Object.fromEntries(out.map((e) => [e.i, e]));
    assert.equal(byIndex[1].l, 'high');
    assert.equal(byIndex[3].l, 'low');
    assert.equal(byIndex[1].src, undefined);
    assert.equal(byIndex[0].src, 'jev');
  });

  it('keeps the Jev labels when the LLM fallback returns null', async () => {
    const { classifyChunk } = harness({ jev: async (t) => (t === 'a' ? jevLabel('low') : null), llm: async () => null });
    assert.deepEqual((await classifyChunk(['a', 'b'])).map((e) => e.i), [0]);
  });

  it('returns null when Jev and the LLM both produced nothing, so the chunk _skips as today', async () => {
    const { classifyChunk } = harness({ jev: async () => null, llm: async () => null });
    assert.equal(await classifyChunk(['a']), null);
  });

  it('treats a throwing Jev transport as a failed title, not a failed chunk', async () => {
    const { classifyChunk, calls } = harness({ jev: async (t) => { if (t === 'a') throw new Error('boom'); return jevLabel('low'); } });
    const out = await classifyChunk(['a', 'b']);
    assert.deepEqual(calls.llm[0].titles, ['a']);
    assert.equal(out.length, 2);
  });

  it('drops LLM fallback entries whose index is out of range', async () => {
    const { classifyChunk } = harness({ jev: async () => null, llm: async () => [{ i: 5, l: 'high', c: 'conflict' }, { i: 0, l: 'low', c: 'general' }] });
    assert.deepEqual((await classifyChunk(['a'])).map((e) => [e.i, e.l]), [[0, 'low']]);
  });

  it('routes non-Latin-script titles straight to the LLM, unmeasured for Jev', async () => {
    const { classifyChunk, calls } = harness();
    const out = await classifyChunk(['Iran closes strait', 'الدفاع المدني يحذر']);
    assert.deepEqual(calls.jev.map((c) => c.title), ['Iran closes strait']);
    assert.deepEqual(calls.llm[0].titles, ['الدفاع المدني يحذر']);
    assert.equal(out.find((e) => e.i === 1).src, undefined);
  });

  it('caps concurrent Jev requests', async () => {
    let inFlight = 0; let peak = 0;
    const { classifyChunk } = harness({
      jev: async () => { inFlight++; peak = Math.max(peak, inFlight); await new Promise((r) => setTimeout(r, 2)); inFlight--; return jevLabel('info'); },
    });
    await classifyChunk(Array.from({ length: 50 }, (_, i) => `t${i}`));
    assert.ok(peak > 1 && peak <= 6, `peak ${peak}`);
  });

  it('treats a whitespace-only key as unset', async () => {
    const { classifyChunk, calls } = harness({ env: { TYPESAFE_API_KEY: '  ' } });
    await classifyChunk(['a']);
    assert.equal(calls.jev.length, 0);
    assert.equal(jevApiKey({ TYPESAFE_API_KEY: ' k ' }), 'k');
    assert.equal(jevApiKey({}), '');
  });

  it('never lets an LLM entry pass itself off as a Jev label', async () => {
    const { classifyChunk } = harness({ jev: async () => null, llm: async () => [{ i: 0, l: 'high', c: 'conflict', src: 'jev', pAlert: 0 }] });
    assert.deepEqual(await classifyChunk(['a']), [{ i: 0, l: 'high', c: 'conflict' }]);
  });

  it('pauses Jev after a chunk it answered none of, then resumes after the cooldown', async () => {
    let clock = 1_000;
    let jevUp = false;
    const { classifyChunk, calls } = harness({ now: () => clock, jev: async () => (jevUp ? jevLabel('low') : null) });
    const chunk = ['a', 'b', 'c', 'd', 'e'];
    await classifyChunk(chunk);
    assert.equal(calls.jev.length, 5);
    assert.equal(calls.warn.length, 1);
    jevUp = true;
    await classifyChunk(chunk);
    assert.equal(calls.jev.length, 5, 'paused: the second chunk must not reach Jev');
    clock += 10 * 60 * 1000;
    const out = await classifyChunk(chunk);
    assert.equal(calls.jev.length, 10);
    assert.ok(out.every((e) => e.src === 'jev'));
  });

  it('pauses across small chunks too: five straight unanswered titles, however they were chunked', async () => {
    const { classifyChunk, calls } = harness({ jev: async () => null });
    await classifyChunk(['a', 'b']);
    await classifyChunk(['c', 'd']);
    assert.equal(calls.warn.length, 0);
    await classifyChunk(['e']);
    assert.equal(calls.warn.length, 1);
    await classifyChunk(['f']);
    assert.equal(calls.jev.length, 5, 'paused after the fifth straight unanswered title');
  });

  it('a single answer resets the unanswered streak', async () => {
    let up = false;
    const { classifyChunk, calls } = harness({ jev: async () => (up ? jevLabel('low') : null) });
    await classifyChunk(['a', 'b', 'c', 'd']);
    up = true;
    await classifyChunk(['e']);
    up = false;
    await classifyChunk(['f', 'g', 'h', 'i']);
    assert.equal(calls.warn.length, 0);
  });

  it('does not pause or warn for a chunk Jev was never asked about', async () => {
    const { classifyChunk, calls } = harness();
    await classifyChunk(Array.from({ length: 6 }, () => 'الدفاع المدني'));
    assert.equal(calls.warn.length, 0);
    await classifyChunk(['plain english']);
    assert.equal(calls.jev.length, 1);
  });

  it('does not pause on a partial failure', async () => {
    const { classifyChunk, calls } = harness({ jev: async (t) => (t === 'a' ? jevLabel('low') : null) });
    await classifyChunk(['a', 'b', 'c', 'd', 'e', 'f']);
    await classifyChunk(['a']);
    assert.equal(calls.jev.length, 7);
    assert.equal(calls.warn.length, 0);
  });
});

describe('shouldPublishClassifiedAlert', () => {
  it('publishes an LLM-labelled alert exactly as before', () => {
    assert.equal(shouldPublishClassifiedAlert({ l: 'high' }), true);
    assert.equal(shouldPublishClassifiedAlert({ l: 'medium' }), false);
  });

  it('holds a Jev alert below the pAlert gate and publishes at it', () => {
    assert.equal(shouldPublishClassifiedAlert({ l: 'high', src: 'jev', pAlert: JEV_NOTIFY_MIN_P_ALERT - 0.01 }), false);
    assert.equal(shouldPublishClassifiedAlert({ l: 'critical', src: 'jev', pAlert: JEV_NOTIFY_MIN_P_ALERT }), true);
    assert.equal(shouldPublishClassifiedAlert({ l: 'high', src: 'jev' }), false);
  });
});

describe('JEV_NOTIFY_MIN_P_ALERT against the judged set', () => {
  // Jev outputs captured by `scripts/eval-jev-classify.mjs --golden <fixture> --capture`.
  const { rows } = JSON.parse(readFileSync(new URL('./fixtures/jev-classify-golden-2026-09-18.json', import.meta.url), 'utf8'));
  const isAlert = (l) => l === 'critical' || l === 'high';

  it('pages at >= 80% precision and >= 85% recall, where the ungated LLM labels page at under 50%', () => {
    const judged = rows.filter((r) => r.jev);
    assert.ok(judged.length >= 250);
    const truth = judged.filter((r) => isAlert(r.judge)).length;
    const paged = judged.filter((r) => shouldPublishClassifiedAlert({ l: r.jev.l, src: 'jev', pAlert: r.jev.pAlert }));
    const hits = paged.filter((r) => isAlert(r.judge)).length;
    assert.ok(hits / paged.length >= 0.8, `precision ${hits}/${paged.length}`);
    assert.ok(hits / truth >= 0.85, `recall ${hits}/${truth}`);
    const llmPaged = judged.filter((r) => isAlert(r.llm));
    assert.ok(llmPaged.filter((r) => isAlert(r.judge)).length / llmPaged.length < 0.5);
  });
});

describe('classifyCacheValue', () => {
  it('keeps the LLM record shape byte-compatible', () => {
    assert.deepEqual(classifyCacheValue({ l: 'high', c: 'conflict' }, 'high', 'conflict', 5), { level: 'high', category: 'conflict', timestamp: 5 });
  });

  it('adds provenance to a Jev record', () => {
    assert.deepEqual(
      classifyCacheValue({ src: 'jev', conf: 0.81234, pAlert: 0.9 }, 'high', 'conflict', 5),
      { level: 'high', category: 'conflict', timestamp: 5, src: 'jev', conf: 0.81, pAlert: 0.9 },
    );
  });

  it('never rounds a held alert up to the gate, so every reader of the row agrees with the relay', () => {
    for (const pAlert of [0.6951, 0.6999, 0.699999]) {
      const entry = { l: 'high', src: 'jev', conf: 0.5, pAlert };
      assert.equal(shouldPublishClassifiedAlert(entry), false);
      const row = classifyCacheValue(entry, 'high', 'conflict', 5);
      assert.equal(shouldPublishClassifiedAlert({ l: 'high', src: 'jev', pAlert: row.pAlert }), false, `stored ${row.pAlert}`);
    }
    assert.equal(classifyCacheValue({ src: 'jev', conf: 1, pAlert: 0.7 }, 'high', 'c', 5).pAlert, 0.7);
  });
});

describe('isHeldJevAlert', () => {
  it('is true only for a Jev alert level the gate refused', () => {
    assert.equal(isHeldJevAlert({ l: 'high', src: 'jev', pAlert: 0.55 }), true);
    assert.equal(isHeldJevAlert({ l: 'high', src: 'jev', pAlert: 0.9 }), false);
    assert.equal(isHeldJevAlert({ l: 'medium', src: 'jev', pAlert: 0.1 }), false);
    assert.equal(isHeldJevAlert({ l: 'high' }), false);
  });
});

describe('countLabelSource', () => {
  it('tallies by provider', () => {
    const tally = { jev: 0, llm: 0 };
    countLabelSource(tally, { src: 'jev' });
    countLabelSource(tally, {});
    assert.deepEqual(tally, { jev: 1, llm: 1 });
  });
});

describe('fetchJevLabel', () => {
  const okBody = { answers: {
    l0: { type: 'choice', choice: 'high', confidence: 0.8, probabilities: { high: 0.8, critical: 0.1 } },
    c0: { type: 'choice', choice: 'conflict', confidence: 0.7, probabilities: {} },
  } };
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

  it('posts one title with the bearer key and returns its label', async () => {
    let seen;
    const label = await fetchJevLabel('Title', 200, { apiKey: 'k', fetchFn: async (url, init) => { seen = { url, init }; return res(200, okBody); } });
    assert.equal(label.l, 'high');
    assert.ok(Math.abs(label.pAlert - 0.9) < 1e-9);
    assert.equal(seen.init.headers.Authorization, 'Bearer k');
    assert.match(seen.init.headers['User-Agent'], /WorldMonitor/);
    assert.deepEqual(JSON.parse(seen.init.body).state, { headline: 'Title' });
  });

  it('retries once on 429 and 529, then gives up with null', async () => {
    let n = 0;
    assert.equal((await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => (++n === 1 ? res(429) : res(200, okBody)) })).l, 'high');
    n = 0;
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => { n++; return res(529); } }), null);
    assert.equal(n, 2);
  });

  it('waits out a short Retry-After and gives up on a long one without retrying', async () => {
    const throttled = (seconds) => ({ ok: false, status: 429, headers: { get: (h) => (h === 'retry-after' ? String(seconds) : null) } });
    let n = 0;
    const t0 = Date.now();
    const label = await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => (++n === 1 ? throttled(0.05) : res(200, okBody)) });
    assert.equal(label.l, 'high');
    assert.ok(Date.now() - t0 >= 45);
    n = 0;
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => { n++; return throttled(30); } }), null);
    assert.equal(n, 1);
  });

  it('returns null without retrying on other statuses, invalid answers and network errors', async () => {
    let n = 0;
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => { n++; return res(401); } }), null);
    assert.equal(n, 1);
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', fetchFn: async () => res(200, { answers: {} }) }), null);
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => { throw new Error('net'); } }), null);
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', fetchFn: async () => ({ ok: true, status: 200, json: async () => { throw new Error('not json'); } }) }), null);
  });

  it('gives up at the timeout when the endpoint hangs', async () => {
    const hang = (_url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
    const t0 = Date.now();
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', timeoutMs: 30, fetchFn: hang }), null);
    assert.ok(Date.now() - t0 < 2000);
  });
});

describe('relay seedClassify wiring', () => {
  const relay = readFileSync(new URL('../scripts/ais-relay.cjs', import.meta.url), 'utf8');
  const start = relay.indexOf('async function seedClassify()');
  const end = relay.indexOf('\nasync function startClassifySeedLoop()', start);

  async function runSeedClassify(env, variantStats) {
    assert.ok(start > 0 && end > start);
    const writes = new Map();
    const logs = [];
    let variantCalls = 0;
    const context = {
      classifyInFlight: false, CLASSIFY_LLM_PROVIDERS: [{ envKey: 'TEST_PROVIDER' }], jevApiKey: () => jevApiKey(env),
      process: { env }, Date, console: { log: (m) => logs.push(m), warn() {} }, setTimeout: (fn) => fn(),
      telegramState: { items: [] }, publishSaudiCivilDefenseAlerts: async () => {},
      upstashGet: async () => null, upstashSet: async (key, value) => { writes.set(key, value); },
      MAX_POST_CHARS: 4096, classifyFetchLlm: async () => null, relayComputeImportanceScore: () => 0,
      publishNotificationEvent: async () => {}, CLASSIFY_VARIANTS: ['full', 'tech'], CLASSIFY_VARIANT_STAGGER_MS: 0,
      seedClassifyForVariant: async () => variantStats[variantCalls++],
      shouldWriteClassifySeedMeta: () => true, envelopeWrite: async () => {},
      NEWS_THREAT_SUMMARY_KEY: 'k', NEWS_THREAT_SUMMARY_TTL: 1,
    };
    vm.createContext(context);
    await vm.runInContext(`${relay.slice(start, end)}\nseedClassify()`, context);
    return { writes, logs, variantCalls };
  }

  it('runs on TYPESAFE_API_KEY alone and sums byProvider across variants into seed-meta', async () => {
    const { writes, variantCalls } = await runSeedClassify({ TYPESAFE_API_KEY: 'k' }, [
      { total: 9, classified: 5, skipped: 1, byProvider: { jev: 4, llm: 1, held: 2 } },
      { total: 3, classified: 0, skipped: 0 },
    ]);
    assert.equal(variantCalls, 2);
    const meta = writes.get('seed-meta:classify');
    assert.equal(meta.recordCount, 5);
    assert.deepEqual({ ...meta.byProvider }, { jev: 4, llm: 1, held: 2, skipped: 1 });
  });

  it('still skips when neither a Jev key nor an LLM key is configured', async () => {
    const { writes, variantCalls, logs } = await runSeedClassify({ TYPESAFE_API_KEY: ' ' }, []);
    assert.equal(variantCalls, 0);
    assert.equal(writes.size, 0);
    assert.ok(logs.some((m) => m.includes('no classifier keys configured')));
  });

  it('imports its level and category lists from the shared Jev module', () => {
    assert.match(relay, /THREAT_LEVELS: CLASSIFY_VALID_LEVELS,\s+THREAT_CATEGORIES: CLASSIFY_VALID_CATEGORIES,\s+\} = require\('\.\.\/shared\/jev-classify\.js'\)/);
    assert.doesNotMatch(relay, /const CLASSIFY_VALID_LEVELS = \[/);
  });

  it('caches a held Jev alert and counts it instead of publishing it', () => {
    const loopStart = relay.indexOf('const llmResult = await classifyChunk(chunk);');
    const publish = relay.indexOf('publishNotificationEvent({', loopStart);
    const block = relay.slice(loopStart, publish);
    const cacheWrite = block.indexOf('classifyCacheValue(entry, level, category');
    const held = block.indexOf('if (isHeldJevAlert({ ...entry, l: level }))');
    const gate = block.indexOf('if (shouldPublishClassifiedAlert({ ...entry, l: level }))');
    assert.ok(cacheWrite > 0 && held > cacheWrite && gate > held, 'cache write, then held tally, then the publish gate');
    assert.ok(block.slice(held, gate).includes('byProvider.held += 1'));
  });
});
