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
  JEV_ENDPOINT, buildJevRequest, parseJevAnswers,
} = require('../../shared/jev-classify.js');

// P(critical) + P(high) a Jev-labelled alert needs before it pages anyone:
// 83% precision at 89% recall on the judged set, against 46% for the LLM path.
const JEV_NOTIFY_MIN_P_ALERT = 0.7;
const JEV_CONCURRENCY = 16;
const JEV_TIMEOUT_MS = 10_000;
const JEV_RETRY_STATUSES = new Set([429, 529]);

// The judged set held no non-Latin-script headlines and TypeSafe documents
// other scripts as weaker, so those titles stay on the LLM until measured.
const hasNonLatinLetters = (title) => /(?=\p{L})\P{Script=Latin}/u.test(title);

async function fetchJevLabel(title, maxTextChars, {
  apiKey, fetchFn = fetch, timeoutMs = JEV_TIMEOUT_MS, retryDelayMs = 1000,
} = {}) {
  const body = JSON.stringify(buildJevRequest([title], { maxTextChars }));
  for (let attempt = 0; attempt < 2; attempt++) {
    let resp;
    try {
      resp = await fetchFn(JEV_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
    if (!JEV_RETRY_STATUSES.has(resp.status) || attempt === 1) return null;
    await new Promise((r) => setTimeout(r, retryDelayMs));
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
function createClassifyChunk({ env = process.env, fetchJevLabel: fetchLabel, fetchLlm, warn = console.warn }) {
  return async function classifyChunk(titles, maxTextChars = 200) {
    if (!env.TYPESAFE_API_KEY) return fetchLlm(titles, maxTextChars);

    const labels = await mapWithConcurrency(titles, JEV_CONCURRENCY, async (title) => {
      if (hasNonLatinLetters(title)) return null;
      try { return await fetchLabel(title, maxTextChars); } catch { return null; }
    });

    const out = [];
    const fallback = [];
    labels.forEach((label, i) => {
      if (label) out.push({ i, l: label.l, c: label.c, src: 'jev', conf: label.levelConf, pAlert: label.pAlert });
      else fallback.push(i);
    });
    if (fallback.length === 0) return out;

    if (fallback.length === titles.length) warn(`[Classify] Jev labelled 0/${titles.length}, using LLM chain`);
    const llm = await fetchLlm(fallback.map((i) => titles[i]), maxTextChars);
    if (Array.isArray(llm)) {
      for (const entry of llm) {
        const i = fallback[entry?.i];
        if (i !== undefined) out.push({ ...entry, i });
      }
    }
    return out.length > 0 ? out : null;
  };
}

function shouldPublishClassifiedAlert(entry) {
  if (entry.l !== 'critical' && entry.l !== 'high') return false;
  if (entry.src !== 'jev') return true;
  return Number(entry.pAlert) >= JEV_NOTIFY_MIN_P_ALERT;
}

function classifyCacheValue(entry, level, category, now) {
  const value = { level, category, timestamp: now };
  if (entry.src === 'jev') {
    value.src = 'jev';
    value.conf = Math.round(entry.conf * 100) / 100;
  }
  return value;
}

function countLabelSource(tally, entry) {
  tally[entry.src === 'jev' ? 'jev' : 'llm'] += 1;
}

module.exports = {
  JEV_NOTIFY_MIN_P_ALERT,
  createClassifyChunk,
  fetchJevLabel,
  shouldPublishClassifiedAlert,
  classifyCacheValue,
  countLabelSource,
};
