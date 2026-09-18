import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createClassifyChunk, fetchJevLabel, shouldPublishClassifiedAlert, classifyCacheValue,
  countLabelSource, JEV_NOTIFY_MIN_P_ALERT,
} = require('../scripts/lib/jev-classify-relay.cjs');

const jevLabel = (l, pAlert = 0, levelConf = 0.9) => ({ l, c: 'general', levelConf, pAlert });

function harness({ env = { TYPESAFE_API_KEY: 'k' }, jev = async () => jevLabel('low'), llm = async (titles) => titles.map((_, i) => ({ i, l: 'medium', c: 'economic' })) } = {}) {
  const calls = { jev: [], llm: [] };
  const classifyChunk = createClassifyChunk({
    env,
    fetchJevLabel: async (title, maxTextChars) => { calls.jev.push({ title, maxTextChars }); return jev(title); },
    fetchLlm: async (titles, maxTextChars) => { calls.llm.push({ titles, maxTextChars }); return llm(titles); },
    warn: () => {},
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
    assert.ok(peak > 1 && peak <= 16, `peak ${peak}`);
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

describe('classifyCacheValue', () => {
  it('keeps the LLM record shape byte-compatible', () => {
    assert.deepEqual(classifyCacheValue({ l: 'high', c: 'conflict' }, 'high', 'conflict', 5), { level: 'high', category: 'conflict', timestamp: 5 });
  });

  it('adds provenance to a Jev record', () => {
    assert.deepEqual(
      classifyCacheValue({ src: 'jev', conf: 0.81234, pAlert: 0.9 }, 'high', 'conflict', 5),
      { level: 'high', category: 'conflict', timestamp: 5, src: 'jev', conf: 0.81 },
    );
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
    assert.deepEqual(JSON.parse(seen.init.body).state, { headline: 'Title' });
  });

  it('retries once on 429 and 529, then gives up with null', async () => {
    let n = 0;
    assert.equal((await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => (++n === 1 ? res(429) : res(200, okBody)) })).l, 'high');
    n = 0;
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => { n++; return res(529); } }), null);
    assert.equal(n, 2);
  });

  it('returns null without retrying on other statuses, invalid answers and network errors', async () => {
    let n = 0;
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => { n++; return res(401); } }), null);
    assert.equal(n, 1);
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', fetchFn: async () => res(200, { answers: {} }) }), null);
    assert.equal(await fetchJevLabel('t', 200, { apiKey: 'k', retryDelayMs: 0, fetchFn: async () => { throw new Error('net'); } }), null);
  });
});
