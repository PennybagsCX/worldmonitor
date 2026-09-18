'use strict';

// Jev-first headline classification for the relay's classify seed.
//
// Lives outside ais-relay.cjs because the relay boots a live server on
// require, so nothing inside it can be unit-tested. The relay injects its
// LLM chain and this module decides, per title, who labels it.
//
// Measured on 2026-09-18 against a blind-judged set of 255 live headlines
// (tests/fixtures/jev-classify-golden-2026-09-18.json, rerun with
// scripts/eval-jev-classify.mjs --golden):
//   - Jev beat the production LLM on exact level (71.8% vs 64.3%) and on
//     critical|high precision (66.7% vs 46.4%) at equal recall.
//   - Escalating Jev's low-confidence titles to the LLM made precision WORSE
//     at every threshold, so the LLM is a fallback for Jev failures only.
//   - One title per request beat 50 per request on accuracy and latency.

const {
  JEV_ENDPOINT, JEV_NOTIFY_MIN_P_ALERT, buildJevRequest, parseJevAnswers, hasNonLatinLetters, jevGateAllowsAlert,
} = require('../../shared/jev-classify.js');

// TypeSafe allows 1,200 req/min. At the measured 374ms p50, 6 in flight is
// ~16 req/s (~960/min); 16 in flight would be ~2,500/min.
const JEV_CONCURRENCY = 6;
const JEV_TIMEOUT_MS = 5_000;
const JEV_RETRY_STATUSES = new Set([429, 529]);
const JEV_MAX_RETRY_WAIT_MS = 5_000;
// A chunk where Jev answered none of at least this many titles means it is
// down or the key is bad; stop paying its timeout per title for a while.
const JEV_BREAKER_MIN_ATTEMPTS = 5;
const JEV_BREAKER_COOLDOWN_MS = 10 * 60 * 1000;
const JEV_USER_AGENT = 'WorldMonitor-Relay/1.0';

const jevApiKey = (env = process.env) => (typeof env.TYPESAFE_API_KEY === 'string' ? env.TYPESAFE_API_KEY.trim() : '');

async function fetchJevLabel(title, maxTextChars, {
  apiKey, fetchFn = fetch, timeoutMs = JEV_TIMEOUT_MS, retryDelayMs = 1000,
} = {}) {
  const body = JSON.stringify(buildJevRequest([title], { maxTextChars }));
  for (let attempt = 0; attempt < 2; attempt++) {
    let resp;
    try {
      resp = await fetchFn(JEV_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'User-Agent': JEV_USER_AGENT },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return null;
    }
    if (resp.ok) {
      const [label] = parseJevAnswers(await resp.json().catch(() => null), 1);
      return label ?? null;
    }
    resp.body?.cancel?.().catch(() => {});
    if (!JEV_RETRY_STATUSES.has(resp.status) || attempt === 1) return null;
    // Spending the one retry before the provider's cooldown ends wastes it; a
    // long cooldown is cheaper to hand to the LLM chain than to wait out.
    const retryAfterMs = Number(resp.headers?.get?.('retry-after')) * 1000;
    if (retryAfterMs > JEV_MAX_RETRY_WAIT_MS) return null;
    await new Promise((r) => setTimeout(r, Math.max(retryAfterMs || 0, retryDelayMs * (0.5 + Math.random()))));
  }
  return null;
}

async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * Drop-in for the relay's classifyFetchLlm(titles, maxTextChars): same
 * `[{i, l, c}] | null` contract, with `src: 'jev'`, `conf` and `pAlert` added
 * to the entries Jev labelled. With TYPESAFE_API_KEY unset it IS fetchLlm.
 */
function createClassifyChunk({ env = process.env, fetchJevLabel: fetchLabel, fetchLlm, warn = console.warn, now = Date.now }) {
  let jevPausedUntil = 0;

  return async function classifyChunk(titles, maxTextChars = 200) {
    if (!jevApiKey(env) || now() < jevPausedUntil) return fetchLlm(titles, maxTextChars);

    let attempted = 0;
    const labels = await mapWithConcurrency(titles, JEV_CONCURRENCY, async (title) => {
      if (hasNonLatinLetters(title)) return null;
      attempted += 1;
      try { return await fetchLabel(title, maxTextChars); } catch { return null; }
    });

    const out = [];
    const fallback = [];
    labels.forEach((label, i) => {
      if (label) out.push({ i, l: label.l, c: label.c, src: 'jev', conf: label.levelConf, pAlert: label.pAlert });
      else fallback.push(i);
    });
    if (fallback.length === 0) return out;

    if (attempted >= JEV_BREAKER_MIN_ATTEMPTS && out.length === 0) {
      jevPausedUntil = now() + JEV_BREAKER_COOLDOWN_MS;
      warn(`[Classify] Jev labelled 0/${attempted}; using the LLM chain for ${JEV_BREAKER_COOLDOWN_MS / 60000}min`);
    }
    const llm = await fetchLlm(fallback.map((i) => titles[i]), maxTextChars);
    if (Array.isArray(llm)) {
      for (const entry of llm) {
        const i = fallback[entry?.i];
        if (i !== undefined) out.push({ i, l: entry.l, c: entry.c });
      }
    }
    return out.length > 0 ? out : null;
  };
}

function shouldPublishClassifiedAlert(entry) {
  if (entry.l !== 'critical' && entry.l !== 'high') return false;
  return jevGateAllowsAlert(entry);
}

function classifyCacheValue(entry, level, category, now) {
  const value = { level, category, timestamp: now };
  if (entry.src === 'jev') {
    value.src = 'jev';
    value.conf = Math.round(entry.conf * 100) / 100;
    value.pAlert = Math.round(entry.pAlert * 100) / 100;
  }
  return value;
}

function countLabelSource(tally, entry) {
  tally[entry.src === 'jev' ? 'jev' : 'llm'] += 1;
}

const isHeldJevAlert = (entry) =>
  entry.src === 'jev' && (entry.l === 'critical' || entry.l === 'high') && !shouldPublishClassifiedAlert(entry);

module.exports = {
  JEV_NOTIFY_MIN_P_ALERT,
  jevApiKey,
  isHeldJevAlert,
  createClassifyChunk,
  fetchJevLabel,
  shouldPublishClassifiedAlert,
  classifyCacheValue,
  countLabelSource,
};
