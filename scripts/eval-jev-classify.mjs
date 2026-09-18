#!/usr/bin/env node
/**
 * Phase 0 eval for docs/plans/2026-09-18-001-jev-headline-classification-plan.md.
 *
 * Classifies the live digest's headlines with Jev and compares against the
 * LLM labels already cached for the same titles. Reads Redis, never writes.
 *
 *   node --env-file=.env.local scripts/eval-jev-classify.mjs \
 *     [--variants full,tech] [--limit 300] [--shapes single,batch] [--batch 50] [--out report.json]
 *
 * --golden <file> scores against a saved judged set instead (no Redis needed). Rerun it
 * whenever JEV_MODEL or the criteria change:
 *   node --env-file=.env.local scripts/eval-jev-classify.mjs --golden tests/fixtures/jev-classify-golden-2026-09-18.json --shapes single
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import {
  JEV_ENDPOINT, THREAT_LEVELS, buildJevRequest, parseJevAnswers,
} from '../shared/jev-classify.js';

const args = Object.fromEntries(
  process.argv.slice(2).join(' ').split('--').filter(Boolean).map((a) => {
    const [k, ...v] = a.trim().split(/\s+/);
    return [k, v.join(' ') || 'true'];
  }),
);
const VARIANTS = (args.variants ?? 'full,tech,finance,happy,commodity').split(',');
const LIMIT = Number(args.limit ?? 300);
const SHAPES = (args.shapes ?? 'single,batch').split(',');
const BATCH = Number(args.batch ?? 50);
const SINGLE_CONCURRENCY = 25;
const USD_PER_M_INPUT = 0.042;

const { TYPESAFE_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
const required = args.golden ? { TYPESAFE_API_KEY } : { TYPESAFE_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN };
for (const [k, v] of Object.entries(required)) {
  if (!v) { console.error(`missing ${k}`); process.exit(2); }
}

async function redis(command) {
  const r = await fetch(UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error(`redis ${command[0]} HTTP ${r.status}`);
  return (await r.json()).result;
}

const parseMaybe = (v) => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return null; } };
const cacheKey = (title) =>
  `classify:sebuf:v6:${crypto.createHash('sha256').update(title.toLowerCase()).digest('hex').slice(0, 16)}`;

async function loadLabelledTitles() {
  const titles = new Map();
  for (const variant of VARIANTS) {
    const digest = parseMaybe(await redis(['GET', `news:digest:v1:${variant}:en`]));
    const payload = digest?.data ?? digest;
    for (const bucket of Object.values(payload?.categories ?? {})) {
      for (const item of bucket?.items ?? []) {
        if (item?.title && !titles.has(item.title)) titles.set(item.title, variant);
      }
    }
  }
  const all = [...titles.keys()];
  const labelled = [];
  for (let i = 0; i < all.length; i += 200) {
    const chunk = all.slice(i, i + 200);
    const hits = await redis(['MGET', ...chunk.map(cacheKey)]);
    chunk.forEach((title, j) => {
      const hit = parseMaybe(hits[j]);
      if (hit && THREAT_LEVELS.includes(hit.level) && hit.category) {
        labelled.push({ title, variant: titles.get(title), llm: { l: hit.level, c: hit.category } });
      }
    });
  }
  return { digestTitles: all.length, labelled };
}

async function callJev(titles) {
  const t0 = performance.now();
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(JEV_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TYPESAFE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildJevRequest(titles)),
      signal: AbortSignal.timeout(60_000),
    }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }));
    if (r.ok) {
      const body = await r.json();
      return { labels: parseJevAnswers(body, titles.length), ms: performance.now() - t0, tokens: body?.usage?.input_tokens ?? 0 };
    }
    if ((r.status === 429 || r.status === 529) && attempt < 3) {
      await new Promise((res) => setTimeout(res, 1000 * 2 ** attempt));
      continue;
    }
    return { labels: [], ms: performance.now() - t0, tokens: 0, error: `HTTP ${r.status} ${(await r.text()).slice(0, 200)}` };
  }
}

async function runShape(shape, rows) {
  const size = shape === 'single' ? 1 : BATCH;
  const groups = [];
  for (let i = 0; i < rows.length; i += size) groups.push(rows.slice(i, i + size));
  const out = new Array(rows.length).fill(null);
  const calls = [];
  let next = 0;
  const wallStart = performance.now();
  const worker = async () => {
    while (next < groups.length) {
      const g = next++;
      const res = await callJev(groups[g].map((r) => r.title));
      calls.push(res);
      for (const label of res.labels) out[g * size + label.i] = label;
    }
  };
  await Promise.all(Array.from({ length: shape === 'single' ? SINGLE_CONCURRENCY : 4 }, worker));
  return { out, calls, wallMs: performance.now() - wallStart };
}

const pct = (n, d) => (d ? Math.round((1000 * n) / d) / 10 : 0);
const quantile = (xs, q) => { const s = [...xs].sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(q * s.length))]) : 0; };
const isAlert = (l) => l === 'critical' || l === 'high';
const nonLatin = (t) => /(?=\p{L})\P{Script=Latin}/u.test(t);

function score(rows, out, calls, wallMs) {
  const answered = rows.map((r, i) => ({ ...r, jev: out[i] })).filter((r) => r.jev);
  const confusion = Object.fromEntries(THREAT_LEVELS.map((a) => [a, Object.fromEntries(THREAT_LEVELS.map((b) => [b, 0]))]));
  for (const r of answered) confusion[r.llm.l][r.jev.l]++;
  const llmAlerts = answered.filter((r) => isAlert(r.llm.l));
  const jevAlerts = answered.filter((r) => isAlert(r.jev.l));
  const within1 = answered.filter((r) => Math.abs(THREAT_LEVELS.indexOf(r.llm.l) - THREAT_LEVELS.indexOf(r.jev.l)) <= 1);

  const sweep = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((tau) => {
    const kept = answered.filter((r) => r.jev.levelConf >= tau);
    const keptLlmAlerts = kept.filter((r) => isAlert(r.llm.l));
    return {
      tau,
      escalationPct: pct(rows.length - kept.length, rows.length),
      keptLevelAgreePct: pct(kept.filter((r) => r.jev.l === r.llm.l).length, kept.length),
      // Escalated titles get the LLM label by construction, so only kept misses cost recall.
      alertRecallAfterEscalationPct: pct(
        llmAlerts.length - keptLlmAlerts.filter((r) => !isAlert(r.jev.l)).length, llmAlerts.length),
      keptJevAlertsLlmDisagrees: kept.filter((r) => isAlert(r.jev.l) && !isAlert(r.llm.l)).length,
    };
  });

  const tokens = calls.reduce((n, c) => n + c.tokens, 0);
  const foreign = answered.filter((r) => nonLatin(r.title));
  return {
    titles: rows.length,
    answered: answered.length,
    callErrors: calls.filter((c) => c.error).map((c) => c.error).slice(0, 3),
    levelAgreePct: pct(answered.filter((r) => r.jev.l === r.llm.l).length, answered.length),
    levelWithinOnePct: pct(within1.length, answered.length),
    categoryAgreePct: pct(answered.filter((r) => r.jev.c === r.llm.c).length, answered.length),
    alertRecallPct: pct(llmAlerts.filter((r) => isAlert(r.jev.l)).length, llmAlerts.length),
    alertPrecisionPct: pct(jevAlerts.filter((r) => isAlert(r.llm.l)).length, jevAlerts.length),
    llmAlerts: llmAlerts.length,
    jevAlerts: jevAlerts.length,
    meanLevelConf: { agree: mean(answered.filter((r) => r.jev.l === r.llm.l)), disagree: mean(answered.filter((r) => r.jev.l !== r.llm.l)) },
    nonLatin: { n: foreign.length, levelAgreePct: pct(foreign.filter((r) => r.jev.l === r.llm.l).length, foreign.length) },
    latencyMs: { p50: quantile(calls.map((c) => c.ms), 0.5), p95: quantile(calls.map((c) => c.ms), 0.95), wall: Math.round(wallMs) },
    inputTokens: tokens,
    usdPer1kTitles: Math.round((tokens / rows.length) * 1000 * (USD_PER_M_INPUT / 1e6) * 1e5) / 1e5,
    confusionLlmRowsJevCols: confusion,
    sweep,
    perTitle: answered.map((r) => ({ title: r.title, llm: r.llm.l, jev: r.jev.l, conf: r.jev.levelConf, pAlert: r.jev.pAlert })),
    alertDisagreements: answered
      .filter((r) => isAlert(r.jev.l) !== isAlert(r.llm.l))
      .slice(0, 40)
      .map((r) => ({ title: r.title.slice(0, 110), llm: r.llm.l, jev: r.jev.l, conf: r.jev.levelConf, pAlert: Math.round(r.jev.pAlert * 100) / 100 })),
  };
}
function mean(rs) { return rs.length ? Math.round((100 * rs.reduce((n, r) => n + r.jev.levelConf, 0)) / rs.length) / 100 : null; }

function loadGolden(file) {
  const { rows: golden } = JSON.parse(fs.readFileSync(file, 'utf8'));
  // The reference label is the judge's; the category was not judged, so it carries the LLM's.
  return { digestTitles: golden.length, labelled: golden.map((g) => ({ title: g.title, variant: 'golden', llm: { l: g.judge, c: null } })) };
}

const { digestTitles, labelled } = args.golden ? loadGolden(args.golden) : await loadLabelledTitles();
const rows = labelled.slice(0, LIMIT);
console.error(`digest titles=${digestTitles} with LLM label=${labelled.length} evaluating=${rows.length}`);
if (rows.length === 0) process.exit(1);

const report = { model: buildJevRequest(['x']).model, variants: VARIANTS, digestTitles, labelled: labelled.length, shapes: {} };
for (const shape of SHAPES) {
  const { out, calls, wallMs } = await runShape(shape, rows);
  report.shapes[shape] = score(rows, out, calls, wallMs);
}
if (args.out) fs.writeFileSync(args.out, JSON.stringify(report, null, 2));
for (const [shape, s] of Object.entries(report.shapes)) {
  const { confusionLlmRowsJevCols, sweep, alertDisagreements, perTitle, ...head } = s;
  console.log(`\n=== ${shape} ===`);
  console.log(JSON.stringify(head, null, 1));
  console.table(confusionLlmRowsJevCols);
  console.table(sweep);
}
