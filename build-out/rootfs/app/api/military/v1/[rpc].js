var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/_shared/seed-envelope.ts
function unwrapEnvelope(raw) {
  if (raw == null) return { _seed: null, data: null };
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return { _seed: null, data: raw };
    }
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return { _seed: null, data: value };
  }
  const seed = value._seed;
  if (seed && typeof seed === "object" && typeof seed.fetchedAt === "number") {
    return { _seed: seed, data: value.data };
  }
  return { _seed: null, data: value };
}
var init_seed_envelope = __esm({
  "server/_shared/seed-envelope.ts"() {
    "use strict";
  }
});

// server/_shared/cache-contract.ts
function isRecord(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}
function getRpcNoStoreReasonFromPayload(payload, options = {}) {
  if (!isRecord(payload)) return null;
  if (payload.upstreamUnavailable === true) return "upstream-unavailable";
  if (payload.unavailable === true) return "unavailable";
  if (payload.dataAvailable === false) return "data-unavailable";
  if (payload.degraded === true) return "degraded";
  if (options.includeAvailableFalse !== false && payload.available === false) return "available-false";
  if (nonEmptyString(payload.error)) return "error";
  if (options.pathname === SCENARIO_STATUS_PATH && nonEmptyString(payload.status)) {
    const status = payload.status.trim().toLowerCase();
    if (!SCENARIO_TERMINAL_STATUSES.has(status)) return "nonterminal";
  }
  return null;
}
function getRpcNoStoreReasonFromJson(body, options = {}) {
  try {
    return getRpcNoStoreReasonFromPayload(JSON.parse(body), options);
  } catch {
    if (body.includes('"upstreamUnavailable":true')) return "upstream-unavailable";
    if (body.includes('"unavailable":true')) return "unavailable";
    if (body.includes('"dataAvailable":false')) return "data-unavailable";
    if (body.includes('"degraded":true')) return "degraded";
    if (options.includeAvailableFalse !== false && body.includes('"available":false')) return "available-false";
    return null;
  }
}
var SCENARIO_STATUS_PATH, SCENARIO_TERMINAL_STATUSES;
var init_cache_contract = __esm({
  "server/_shared/cache-contract.ts"() {
    "use strict";
    SCENARIO_STATUS_PATH = "/api/scenario/v1/get-scenario-status";
    SCENARIO_TERMINAL_STATUSES = /* @__PURE__ */ new Set(["done", "failed"]);
  }
});

// server/_shared/client-ip.ts
function parseIpv4(value) {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  let address = 0;
  for (const part of parts) {
    if (!/^(?:0|[1-9]\d{0,2})$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    address = address * 256 + octet;
  }
  return address >>> 0;
}
function parseIpv6(value) {
  if (!value || value.includes(".") || value.includes("%")) return null;
  const halves = value.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  if (halves.length === 1 && head.length !== 8) return null;
  if (halves.length === 2 && head.length + tail.length >= 8) return null;
  const groups = halves.length === 2 ? [...head, ...Array(8 - head.length - tail.length).fill("0"), ...tail] : head;
  if (groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))) return null;
  return groups.map((group) => Number.parseInt(group, 16));
}
function parseIpv4Cidr(cidr) {
  const [networkText = "", prefixText = ""] = cidr.split("/");
  const network = parseIpv4(networkText);
  if (network === null) throw new Error(`Invalid Cloudflare IPv4 CIDR: ${cidr}`);
  return [network, Number(prefixText)];
}
function parseIpv6Cidr(cidr) {
  const [networkText = "", prefixText = ""] = cidr.split("/");
  const network = parseIpv6(networkText);
  if (network === null) throw new Error(`Invalid Cloudflare IPv6 CIDR: ${cidr}`);
  return [network, Number(prefixText)];
}
function isInIpv4Range(address, network, prefixLength) {
  const mask = 4294967295 << 32 - prefixLength >>> 0;
  return (address & mask) >>> 0 === (network & mask) >>> 0;
}
function isInIpv6Range(address, network, prefixLength) {
  const fullGroups = Math.floor(prefixLength / 16);
  for (let i = 0; i < fullGroups; i += 1) {
    if (address[i] !== network[i]) return false;
  }
  const remainingBits = prefixLength % 16;
  if (remainingBits === 0) return true;
  const mask = 65535 << 16 - remainingBits & 65535;
  return (address[fullGroups] & mask) === (network[fullGroups] & mask);
}
function isCloudflareProxyIp(value) {
  const ipv4 = parseIpv4(value);
  if (ipv4 !== null) {
    return CLOUDFLARE_IPV4_RANGES.some(([network, prefix]) => isInIpv4Range(ipv4, network, prefix));
  }
  const ipv6 = parseIpv6(value);
  return ipv6 !== null && CLOUDFLARE_IPV6_RANGES.some(([network, prefix]) => isInIpv6Range(ipv6, network, prefix));
}
function constantTimeEqual(a, b) {
  const len = b.length;
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i += 1) diff |= (a.charCodeAt(i) || 0) ^ b.charCodeAt(i);
  return diff === 0;
}
function hasCloudflareTransitProof(request) {
  const secret = (process.env.CF_EDGE_PROOF_SECRET ?? "").trim();
  if (!secret) return false;
  return constantTimeEqual((request.headers.get(CF_EDGE_PROOF_HEADER) ?? "").trim(), secret);
}
function getEdgeProofMismatchLatch() {
  const existing = Reflect.get(globalThis, EDGE_PROOF_MISMATCH_LATCH);
  if (existing) return existing;
  const latch = { warned: false };
  Reflect.set(globalThis, EDGE_PROOF_MISMATCH_LATCH, latch);
  return latch;
}
function warnEdgeProofNotProving() {
  const latch = getEdgeProofMismatchLatch();
  if (latch.warned) return;
  latch.warned = true;
  console.warn(
    "[client-ip] cf-connecting-ip present but x-wm-edge-proof missing/mismatched \u2014 rate-limit buckets keyed by Cloudflare PoP (x-real-ip), not per user. Fix CF_EDGE_PROOF_SECRET or the Cloudflare header transform rule. Issue #6431"
  );
}
function getClientIp(request) {
  const cf = (request.headers.get("cf-connecting-ip") ?? "").trim();
  const xr = (request.headers.get("x-real-ip") ?? "").trim();
  if (cf && hasCloudflareTransitProof(request)) return cf;
  if (cf && isCloudflareProxyIp(xr)) warnEdgeProofNotProving();
  return xr || UNKNOWN_CLIENT_IP;
}
var UNKNOWN_CLIENT_IP, CF_EDGE_PROOF_HEADER, CLOUDFLARE_IPV4_CIDRS, CLOUDFLARE_IPV6_CIDRS, CLOUDFLARE_IPV4_RANGES, CLOUDFLARE_IPV6_RANGES, EDGE_PROOF_MISMATCH_LATCH;
var init_client_ip = __esm({
  "server/_shared/client-ip.ts"() {
    "use strict";
    UNKNOWN_CLIENT_IP = "unknown";
    CF_EDGE_PROOF_HEADER = "x-wm-edge-proof";
    CLOUDFLARE_IPV4_CIDRS = Object.freeze([
      "173.245.48.0/20",
      "103.21.244.0/22",
      "103.22.200.0/22",
      "103.31.4.0/22",
      "141.101.64.0/18",
      "108.162.192.0/18",
      "190.93.240.0/20",
      "188.114.96.0/20",
      "197.234.240.0/22",
      "198.41.128.0/17",
      "162.158.0.0/15",
      "104.16.0.0/13",
      "104.24.0.0/14",
      "172.64.0.0/13",
      "131.0.72.0/22"
    ]);
    CLOUDFLARE_IPV6_CIDRS = Object.freeze([
      "2400:cb00::/32",
      "2606:4700::/32",
      "2803:f800::/32",
      "2405:b500::/32",
      "2405:8100::/32",
      "2a06:98c0::/29",
      "2c0f:f248::/32"
    ]);
    CLOUDFLARE_IPV4_RANGES = Object.freeze(CLOUDFLARE_IPV4_CIDRS.map(parseIpv4Cidr));
    CLOUDFLARE_IPV6_RANGES = Object.freeze(CLOUDFLARE_IPV6_CIDRS.map(parseIpv6Cidr));
    EDGE_PROOF_MISMATCH_LATCH = /* @__PURE__ */ Symbol.for(
      "worldmonitor.client-ip.edge-proof-mismatch-warning.v1"
    );
  }
});

// server/_shared/usage.ts
function isUsageEnabled() {
  return process.env.USAGE_TELEMETRY === "1";
}
function isDevHeaderEnabled() {
  return process.env.NODE_ENV !== "production";
}
function buildRequestEvent(p) {
  return {
    _time: (/* @__PURE__ */ new Date()).toISOString(),
    event_type: "request",
    request_id: p.requestId,
    domain: p.domain,
    route: p.route,
    method: p.method,
    status: p.status,
    duration_ms: p.durationMs,
    req_bytes: p.reqBytes,
    res_bytes: p.resBytes,
    customer_id: p.customerId,
    principal_id: p.principalId,
    auth_kind: p.authKind,
    tier: p.tier,
    plan_key: p.planKey,
    country: p.country,
    ip_city: p.ipCity,
    ip_region: p.ipRegion,
    execution_region: p.executionRegion,
    execution_plane: p.executionPlane,
    origin_kind: p.originKind,
    cache_tier: p.cacheTier,
    ip: p.ip,
    user_agent: p.userAgent,
    ua_hash: p.uaHash,
    referer: p.referer,
    accept_language: p.acceptLanguage,
    host: p.host,
    sentry_trace_id: p.sentryTraceId,
    reason: p.reason
  };
}
function capHeaderValue(s) {
  if (s == null) return null;
  return s.length > MAX_HEADER_FIELD_LEN ? s.slice(0, MAX_HEADER_FIELD_LEN) : s;
}
function deriveRequestId(req) {
  return req.headers.get("x-vercel-id") ?? "";
}
function deriveExecutionRegion(req) {
  const id = req.headers.get("x-vercel-id");
  if (!id) return null;
  const sep = id.indexOf("::");
  return sep > 0 ? id.slice(0, sep) : null;
}
function deriveCountry(req) {
  if (hasCloudflareTransitProof(req)) {
    const country = req.headers.get("cf-ipcountry");
    return (country && country !== "T1" ? country : null) ?? req.headers.get("x-vercel-ip-country") ?? null;
  }
  return req.headers.get("x-vercel-ip-country") ?? null;
}
function deriveIpCity(req) {
  const raw = req.headers.get("x-vercel-ip-city");
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
function deriveIpRegion(req) {
  return req.headers.get("x-vercel-ip-country-region") ?? null;
}
function deriveIp(req) {
  const ip = getClientIp(req);
  return ip === UNKNOWN_CLIENT_IP ? null : ip;
}
function deriveUserAgent(req) {
  return capHeaderValue(req.headers.get("user-agent"));
}
function deriveReferer(req) {
  const raw = req.headers.get("referer");
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return capHeaderValue(`${u.origin}${u.pathname}`);
  } catch {
    return null;
  }
}
function deriveAcceptLanguage(req) {
  return capHeaderValue(req.headers.get("accept-language"));
}
function deriveHost(req) {
  return capHeaderValue(req.headers.get("host"));
}
function deriveReqBytes(req) {
  const len = req.headers.get("content-length");
  if (!len) return 0;
  const n = Number(len);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function deriveSentryTraceId(req) {
  return req.headers.get("sentry-trace") ?? null;
}
async function deriveUaHash(req) {
  const pepper = process.env.USAGE_UA_PEPPER;
  if (!pepper) return null;
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua) return null;
  const data = new TextEncoder().encode(`${pepper}|${ua}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
function deriveOriginKind(req) {
  const origin = req.headers.get("origin") ?? "";
  const hasApiKey = req.headers.has("x-worldmonitor-key") || req.headers.has("x-api-key");
  const hasBearer = (req.headers.get("authorization") ?? "").startsWith("Bearer ");
  if (hasApiKey) return "api-key";
  if (hasBearer) return "oauth";
  if (!origin) return null;
  try {
    const host = new URL(origin).host;
    const reqHost = new URL(req.url).host;
    return host === reqHost ? "browser-same-origin" : "browser-cross-origin";
  } catch {
    return "browser-cross-origin";
  }
}
function pruneOldSamples(now) {
  while (breakerSamples.length > 0 && now - breakerSamples[0].ts > CB_WINDOW_MS) {
    breakerSamples.shift();
  }
}
function recordSample(ok) {
  const now = Date.now();
  pruneOldSamples(now);
  breakerSamples.push({ ts: now, ok });
  if (breakerSamples.length < CB_MIN_SAMPLES) {
    breakerTripped = false;
    return;
  }
  let failures = 0;
  for (const s of breakerSamples) if (!s.ok) failures++;
  const ratio = failures / breakerSamples.length;
  const wasTripped = breakerTripped;
  breakerTripped = ratio > CB_TRIP_FAILURE_RATIO;
  if (breakerTripped && !wasTripped && now - breakerLastNotifyTs > CB_WINDOW_MS) {
    breakerLastNotifyTs = now;
    console.error("[usage-telemetry] circuit breaker tripped", {
      ratio: ratio.toFixed(3),
      samples: breakerSamples.length
    });
  }
}
function getTelemetryHealth() {
  if (!isUsageEnabled()) return "off";
  return breakerTripped ? "degraded" : "ok";
}
function maybeAttachDevHealthHeader(headers) {
  if (!isDevHeaderEnabled()) return;
  headers.set("x-usage-telemetry", getTelemetryHealth());
}
async function getScopeStore() {
  if (scopeStore) return scopeStore;
  try {
    const mod = await import("node:async_hooks");
    scopeStore = new mod.AsyncLocalStorage();
    return scopeStore;
  } catch {
    return null;
  }
}
async function runWithUsageScope(scope, fn) {
  const store2 = await getScopeStore();
  if (!store2) return fn();
  return store2.run(scope, fn);
}
async function sendToAxiom(events) {
  if (!isUsageEnabled()) return;
  if (events.length === 0) return;
  const token = process.env.AXIOM_API_TOKEN;
  if (!token) {
    if (Math.random() < SAMPLED_DROP_LOG_RATE) {
      console.warn("[usage-telemetry] drop", { reason: "no-token" });
    }
    return;
  }
  if (breakerTripped) {
    if (Math.random() < SAMPLED_DROP_LOG_RATE) {
      console.warn("[usage-telemetry] drop", { reason: "breaker-open" });
    }
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TELEMETRY_TIMEOUT_MS);
  try {
    const resp = await fetch(AXIOM_INGEST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(events),
      signal: controller.signal
    });
    if (!resp.ok) {
      recordSample(false);
      if (Math.random() < SAMPLED_DROP_LOG_RATE) {
        console.warn("[usage-telemetry] drop", { reason: `http-${resp.status}` });
      }
      return;
    }
    recordSample(true);
  } catch (err) {
    recordSample(false);
    if (Math.random() < SAMPLED_DROP_LOG_RATE) {
      const reason = err instanceof Error && err.name === "AbortError" ? "timeout" : "fetch-error";
      console.warn("[usage-telemetry] drop", { reason });
    }
  } finally {
    clearTimeout(timer);
  }
}
function deliverUsageEvents(events) {
  if (!isUsageEnabled() || events.length === 0) return Promise.resolve();
  return sendToAxiom(events);
}
var AXIOM_DATASET, AXIOM_INGEST_URL, TELEMETRY_TIMEOUT_MS, CB_WINDOW_MS, CB_TRIP_FAILURE_RATIO, CB_MIN_SAMPLES, SAMPLED_DROP_LOG_RATE, MAX_HEADER_FIELD_LEN, breakerSamples, breakerTripped, breakerLastNotifyTs, scopeStore;
var init_usage = __esm({
  "server/_shared/usage.ts"() {
    "use strict";
    init_client_ip();
    AXIOM_DATASET = "wm_api_usage";
    AXIOM_INGEST_URL = `https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`;
    TELEMETRY_TIMEOUT_MS = 1500;
    CB_WINDOW_MS = 5 * 60 * 1e3;
    CB_TRIP_FAILURE_RATIO = 0.05;
    CB_MIN_SAMPLES = 20;
    SAMPLED_DROP_LOG_RATE = 0.01;
    MAX_HEADER_FIELD_LEN = 512;
    breakerSamples = [];
    breakerTripped = false;
    breakerLastNotifyTs = 0;
    scopeStore = null;
  }
});

// server/_shared/sidecar-cache.ts
var sidecar_cache_exports = {};
__export(sidecar_cache_exports, {
  sidecarCacheGet: () => sidecarCacheGet,
  sidecarCacheSet: () => sidecarCacheSet,
  sidecarCacheStats: () => sidecarCacheStats
});
function startSweepIfNeeded() {
  if (sweepTimer) return;
  sweepTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, entry] of store) {
      if (entry.expiresAt <= now) {
        totalBytes -= entry.size;
        store.delete(k);
      }
    }
  }, SWEEP_INTERVAL_MS);
  if (typeof sweepTimer === "object" && "unref" in sweepTimer) {
    sweepTimer.unref();
  }
}
function evictLRU(incomingSize = 0) {
  const keysToEvict = [];
  for (const [k, entry] of store) {
    const nextEntryCount = store.size - keysToEvict.length + 1;
    const nextTotalBytes = totalBytes + incomingSize;
    if (nextEntryCount <= MAX_ENTRIES && nextTotalBytes <= MAX_BYTES) break;
    keysToEvict.push(k);
    totalBytes -= entry.size;
  }
  for (const k of keysToEvict) store.delete(k);
}
function sidecarCacheGet(key) {
  const entry = store.get(key);
  if (!entry) {
    missCount++;
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    totalBytes -= entry.size;
    store.delete(key);
    missCount++;
    return null;
  }
  store.delete(key);
  store.set(key, entry);
  hitCount++;
  return JSON.parse(entry.value);
}
function sidecarCacheSet(key, value, ttlSeconds) {
  const clamped = Math.max(MIN_TTL_S, Math.min(MAX_TTL_S, ttlSeconds));
  const json = JSON.stringify(value);
  const size = json.length * 2;
  if (size > MAX_SINGLE_VALUE_BYTES) {
    console.warn(`[sidecar-cache] rejecting key "${key}": ${(size / 1024 / 1024).toFixed(1)} MB exceeds 2 MB limit`);
    return;
  }
  const existing = store.get(key);
  if (existing) {
    totalBytes -= existing.size;
    store.delete(key);
  }
  if (store.size >= MAX_ENTRIES || totalBytes + size > MAX_BYTES) {
    evictLRU(size);
  }
  store.set(key, {
    value: json,
    expiresAt: Date.now() + clamped * 1e3,
    size
  });
  totalBytes += size;
  startSweepIfNeeded();
}
function sidecarCacheStats() {
  return { entries: store.size, bytes: totalBytes, hits: hitCount, misses: missCount };
}
var MAX_ENTRIES, MAX_BYTES, MAX_SINGLE_VALUE_BYTES, MIN_TTL_S, MAX_TTL_S, SWEEP_INTERVAL_MS, store, totalBytes, sweepTimer, hitCount, missCount;
var init_sidecar_cache = __esm({
  "server/_shared/sidecar-cache.ts"() {
    "use strict";
    MAX_ENTRIES = 500;
    MAX_BYTES = 50 * 1024 * 1024;
    MAX_SINGLE_VALUE_BYTES = 2 * 1024 * 1024;
    MIN_TTL_S = 10;
    MAX_TTL_S = 86400;
    SWEEP_INTERVAL_MS = 6e4;
    store = /* @__PURE__ */ new Map();
    totalBytes = 0;
    sweepTimer = null;
    hitCount = 0;
    missCount = 0;
  }
});

// server/_shared/redis.ts
function parseTimeoutEnv(raw, defaultMs) {
  const parsed = Number.parseInt(raw ?? "", 10);
  return parsed > 0 ? parsed : defaultMs;
}
function errMsg(err) {
  return err instanceof Error ? err.message : String(err);
}
function hasRemoteRedisConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
function getKeyPrefix() {
  const env = process.env.VERCEL_ENV;
  if (!env || env === "production") return "";
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "dev";
  return `${env}:${sha}:`;
}
function prefixKey(key) {
  if (cachedPrefix === void 0) cachedPrefix = getKeyPrefix();
  if (!cachedPrefix) return key;
  return `${cachedPrefix}${key}`;
}
async function readCachedJsonInternal(key, raw = false, unwrapSeedEnvelope = true) {
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    try {
      const { sidecarCacheGet: sidecarCacheGet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
      const value = sidecarCacheGet2(key);
      return value == null ? { status: "miss" } : { status: "hit", value };
    } catch (error) {
      return { status: "error", error };
    }
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { status: "miss" };
  try {
    const finalKey = raw ? key : prefixKey(key);
    const resp = await fetch(`${url}/get/${encodeURIComponent(finalKey)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REDIS_OP_TIMEOUT_MS)
    });
    if (!resp.ok) throw new Error(`Redis HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.error) throw new Error(`Redis command error: ${data.error}`);
    if (!data.result) return { status: "miss" };
    const parsed = JSON.parse(data.result);
    return {
      status: "hit",
      value: unwrapSeedEnvelope ? unwrapEnvelope(parsed).data : parsed
    };
  } catch (error) {
    return { status: "error", error };
  }
}
async function readCachedJson(key, raw = false) {
  return readCachedJsonInternal(key, raw, true);
}
function logCacheReadError(key, err) {
  const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
  if (isTimeout) {
    console.error(`[REDIS-TIMEOUT] getCachedJson key=${key} timeoutMs=${REDIS_OP_TIMEOUT_MS}`);
  } else {
    console.warn("[redis] getCachedJson failed:", errMsg(err));
  }
}
async function getRawJson(key) {
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    const { sidecarCacheGet: sidecarCacheGet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
    return sidecarCacheGet2(key);
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis credentials not configured");
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(REDIS_OP_TIMEOUT_MS)
  });
  if (!resp.ok) throw new Error(`Redis HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.error) throw new Error(`Redis command error: ${data.error}`);
  if (!data.result) return null;
  return unwrapEnvelope(JSON.parse(data.result)).data;
}
async function getCachedJson(key, raw = false) {
  const read = await readCachedJson(key, raw);
  if (read.status === "hit") return read.value;
  if (read.status === "error") logCacheReadError(key, read.error);
  return null;
}
async function setCachedJson(key, value, ttlSeconds, raw = false) {
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    const { sidecarCacheSet: sidecarCacheSet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
    sidecarCacheSet2(key, value, ttlSeconds);
    return true;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const finalKey = raw ? key : prefixKey(key);
    const resp = await fetch(`${url}/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor-server/1.0 (redis)"
      },
      body: JSON.stringify(["SET", finalKey, JSON.stringify(value), "EX", String(ttlSeconds)]),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || data?.error) {
      console.warn(`[redis] setCachedJson failed:`, data?.error ?? `HTTP ${resp.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[redis] setCachedJson failed:", errMsg(err));
    return false;
  }
}
function evictOldestLocalFallbackEntries(map) {
  while (map.size > LOCAL_FALLBACK_MAX_ENTRIES) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === void 0) return;
    map.delete(oldestKey);
  }
}
function effectiveFetchErrorNegativeTtlSeconds(negativeTtlSeconds) {
  return Math.max(1, Math.min(negativeTtlSeconds, FETCH_ERROR_NEGATIVE_TTL_SECONDS));
}
function armLocalNegativeCooldown(key, ttlSeconds) {
  localNegativeUntil.set(key, Date.now() + ttlSeconds * 1e3);
  evictOldestLocalFallbackEntries(localNegativeUntil);
}
function hasLocalNegativeCooldown(key) {
  const expiresAt = localNegativeUntil.get(key);
  if (expiresAt === void 0) return false;
  if (expiresAt > Date.now()) return true;
  localNegativeUntil.delete(key);
  return false;
}
function armLocalUnavailableBackoff(key, ttlSeconds) {
  localUnavailableUntil.set(key, Date.now() + ttlSeconds * 1e3);
  evictOldestLocalFallbackEntries(localUnavailableUntil);
}
function hasLocalUnavailableBackoff(key) {
  const expiresAt = localUnavailableUntil.get(key);
  if (expiresAt === void 0) return false;
  if (expiresAt > Date.now()) return true;
  localUnavailableUntil.delete(key);
  return false;
}
function effectiveRedisFailurePositiveTtlSeconds(ttlSeconds) {
  return Math.max(1, Math.min(ttlSeconds, REDIS_FAILURE_POSITIVE_TTL_SECONDS));
}
function armLocalPositiveFallback(key, value, ttlSeconds) {
  const effectiveTtlSeconds = effectiveRedisFailurePositiveTtlSeconds(ttlSeconds);
  localPositiveFallback.set(key, {
    value,
    expiresAt: Date.now() + effectiveTtlSeconds * 1e3
  });
  evictOldestLocalFallbackEntries(localPositiveFallback);
}
function readLocalPositiveFallback(key) {
  const cached = localPositiveFallback.get(key);
  if (cached === void 0) return void 0;
  if (cached.expiresAt > Date.now()) return cached.value;
  localPositiveFallback.delete(key);
  return void 0;
}
async function getCachedJsonBatch(keys, raw = false) {
  const result = /* @__PURE__ */ new Map();
  if (keys.length === 0) return result;
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    try {
      const { sidecarCacheGet: sidecarCacheGet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
      for (const key of keys) {
        const value = sidecarCacheGet2(key);
        if (value != null) result.set(key, value);
      }
    } catch (error) {
      console.warn("[redis] getCachedJsonBatch failed:", errMsg(error));
    }
    return result;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return result;
  try {
    const pipeline = keys.map((k) => ["GET", raw ? k : prefixKey(k)]);
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pipeline),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    if (!resp.ok) {
      console.warn(`[redis] getCachedJsonBatch HTTP ${resp.status}`);
      return result;
    }
    const data = await resp.json();
    for (let i = 0; i < keys.length; i++) {
      const rawResult = data[i]?.result;
      if (rawResult) {
        try {
          const parsed = JSON.parse(rawResult);
          if (parsed === NEG_SENTINEL) continue;
          result.set(keys[i], unwrapEnvelope(parsed).data);
        } catch {
        }
      }
    }
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    if (isTimeout) {
      console.error(`[REDIS-TIMEOUT] getCachedJsonBatch keys=${keys.length} timeoutMs=${REDIS_PIPELINE_TIMEOUT_MS}`);
    } else {
      console.warn("[redis] getCachedJsonBatch failed:", errMsg(err));
    }
  }
  return result;
}
function normalizePipelineCommand(command, raw) {
  if (raw || command.length < 2) return [...command];
  const [verb, key, ...rest] = command;
  if (typeof verb !== "string" || typeof key !== "string") return [...command];
  if (verb.toUpperCase() === "EVAL") {
    const keyCount = Number(rest[0]);
    if (!Number.isInteger(keyCount) || keyCount < 0 || rest.length < keyCount + 1) return [...command];
    const keys = rest.slice(1, keyCount + 1).map((item) => typeof item === "string" ? prefixKey(item) : item);
    return [verb, key, rest[0], ...keys, ...rest.slice(keyCount + 1)];
  }
  return [verb, prefixKey(key), ...rest];
}
async function runRedisPipeline(commands, raw = false) {
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") return [];
  if (commands.length === 0) return [];
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return [];
  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(commands.map((command) => normalizePipelineCommand(command, raw))),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    if (!response.ok) {
      console.warn(`[redis] runRedisPipeline HTTP ${response.status}`);
      return [];
    }
    return await response.json();
  } catch (err) {
    console.warn("[redis] runRedisPipeline failed:", errMsg(err));
    return [];
  }
}
function withFetcherTimeout(promise, key, timeoutMs, callerName) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new CachedFetchTimeoutError(`${callerName} timeout after ${timeoutMs}ms for "${key}"`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== void 0) clearTimeout(timer);
  });
}
async function cachedFetchJson(key, ttlSeconds, fetcher, negativeTtlSeconds = 120, opts) {
  const cached = await readCachedJson(key);
  if (cached.status === "hit") {
    if (cached.value === NEG_SENTINEL) return null;
    return cached.value;
  }
  const localPositive = readLocalPositiveFallback(key);
  if (localPositive !== void 0) return localPositive;
  const hadCacheReadError = cached.status === "error";
  if (cached.status === "error") {
    logCacheReadError(key, cached.error);
    if (hasLocalNegativeCooldown(key)) return null;
  }
  if (hasLocalUnavailableBackoff(key)) {
    throw new Error(`cachedFetchJson unavailable backoff active for "${key}"`);
  }
  const existing = inflight.get(key);
  if (existing) return existing;
  const timeoutMs = opts?.timeoutMs ?? fetcherTimeoutDefaultMs;
  const promise = withFetcherTimeout(fetcher(), key, timeoutMs, "cachedFetchJson").then(async (result) => {
    if (result != null) {
      const noStoreReason = getRpcNoStoreReasonFromPayload(result, { includeAvailableFalse: false });
      if (noStoreReason) {
        armLocalNegativeCooldown(key, negativeTtlSeconds);
        await setCachedJson(key, NEG_SENTINEL, negativeTtlSeconds);
      } else {
        const wrote = await setCachedJson(key, result, ttlSeconds);
        if (hadCacheReadError || !wrote && hasRemoteRedisConfig()) {
          armLocalPositiveFallback(key, result, ttlSeconds);
        }
      }
    } else {
      armLocalNegativeCooldown(key, negativeTtlSeconds);
      await setCachedJson(key, NEG_SENTINEL, negativeTtlSeconds);
    }
    return result;
  }).catch(async (err) => {
    if (opts?.cacheFetcherErrors !== false) {
      const errorTtlSeconds = effectiveFetchErrorNegativeTtlSeconds(negativeTtlSeconds);
      armLocalNegativeCooldown(key, errorTtlSeconds);
      await setCachedJson(key, NEG_SENTINEL, errorTtlSeconds);
      console.warn(`[redis] cachedFetchJson fetcher failed for "${key}":`, errMsg(err));
    } else {
      armLocalUnavailableBackoff(key, FETCH_ERROR_UNAVAILABLE_BACKOFF_SECONDS);
    }
    throw err;
  }).finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
async function geoSearchByBox(key, lon, lat, widthKm, heightKm, count, raw = false) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return [];
  try {
    const finalKey = raw ? key : prefixKey(key);
    const pipeline = [["GEOSEARCH", finalKey, "FROMLONLAT", String(lon), String(lat), "BYBOX", String(widthKm), String(heightKm), "km", "ASC", "COUNT", String(count)]];
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pipeline),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data[0]?.result ?? [];
  } catch (err) {
    console.warn("[redis] geoSearchByBox failed:", errMsg(err));
    return [];
  }
}
async function getHashFieldsBatch(key, fields, raw = false) {
  const result = /* @__PURE__ */ new Map();
  if (fields.length === 0) return result;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return result;
  try {
    const finalKey = raw ? key : prefixKey(key);
    const pipeline = [["HMGET", finalKey, ...fields]];
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pipeline),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    if (!resp.ok) return result;
    const data = await resp.json();
    const values = data[0]?.result;
    if (values) {
      for (let i = 0; i < fields.length; i++) {
        if (values[i] != null) result.set(fields[i], values[i]);
      }
    }
  } catch (err) {
    console.warn("[redis] getHashFieldsBatch failed:", errMsg(err));
  }
  return result;
}
async function deleteRedisKey(key, raw = false) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    const finalKey = raw ? key : prefixKey(key);
    await fetch(`${url}/del/${encodeURIComponent(finalKey)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REDIS_OP_TIMEOUT_MS)
    });
  } catch (err) {
    console.warn("[redis] deleteRedisKey failed:", errMsg(err));
  }
}
var REDIS_OP_TIMEOUT_MS, REDIS_PIPELINE_TIMEOUT_MS, cachedPrefix, NEG_SENTINEL, FETCH_ERROR_NEGATIVE_TTL_SECONDS, FETCH_ERROR_UNAVAILABLE_BACKOFF_SECONDS, REDIS_FAILURE_POSITIVE_TTL_SECONDS, LOCAL_FALLBACK_MAX_ENTRIES, localNegativeUntil, localUnavailableUntil, localPositiveFallback, inflight, FETCHER_TIMEOUT_MS_DEFAULT, fetcherTimeoutDefaultMs, CachedFetchTimeoutError;
var init_redis = __esm({
  "server/_shared/redis.ts"() {
    "use strict";
    init_seed_envelope();
    init_cache_contract();
    init_usage();
    REDIS_OP_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_OP_TIMEOUT_MS, 1500);
    REDIS_PIPELINE_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_PIPELINE_TIMEOUT_MS, 5e3);
    NEG_SENTINEL = "__WM_NEG__";
    FETCH_ERROR_NEGATIVE_TTL_SECONDS = 30;
    FETCH_ERROR_UNAVAILABLE_BACKOFF_SECONDS = 3;
    REDIS_FAILURE_POSITIVE_TTL_SECONDS = 30;
    LOCAL_FALLBACK_MAX_ENTRIES = 5e3;
    localNegativeUntil = /* @__PURE__ */ new Map();
    localUnavailableUntil = /* @__PURE__ */ new Map();
    localPositiveFallback = /* @__PURE__ */ new Map();
    inflight = /* @__PURE__ */ new Map();
    FETCHER_TIMEOUT_MS_DEFAULT = 3e4;
    fetcherTimeoutDefaultMs = FETCHER_TIMEOUT_MS_DEFAULT;
    CachedFetchTimeoutError = class extends Error {
      constructor(message2) {
        super(message2);
        this.name = "CachedFetchTimeoutError";
      }
    };
  }
});

// node_modules/@upstash/core-analytics/dist/index.js
var require_dist = __commonJS({
  "node_modules/@upstash/core-analytics/dist/index.js"(exports, module) {
    "use strict";
    var g = Object.defineProperty;
    var k = Object.getOwnPropertyDescriptor;
    var _ = Object.getOwnPropertyNames;
    var y = Object.prototype.hasOwnProperty;
    var w = (l, e) => {
      for (var t in e) g(l, t, { get: e[t], enumerable: true });
    };
    var A = (l, e, t, i) => {
      if (e && typeof e == "object" || typeof e == "function") for (let s of _(e)) !y.call(l, s) && s !== t && g(l, s, { get: () => e[s], enumerable: !(i = k(e, s)) || i.enumerable });
      return l;
    };
    var x = (l) => A(g({}, "__esModule", { value: true }), l);
    var S = {};
    w(S, { Analytics: () => b });
    module.exports = x(S);
    var p = `
local key = KEYS[1]
local field = ARGV[1]

local data = redis.call("ZRANGE", key, 0, -1, "WITHSCORES")
local count = {}

for i = 1, #data, 2 do
  local json_str = data[i]
  local score = tonumber(data[i + 1])
  local obj = cjson.decode(json_str)

  local fieldValue = obj[field]

  if count[fieldValue] == nil then
    count[fieldValue] = score
  else
    count[fieldValue] = count[fieldValue] + score
  end
end

local result = {}
for k, v in pairs(count) do
  table.insert(result, {k, v})
end

return result
`;
    var f = `
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1]) -- First timestamp to check
local increment = tonumber(ARGV[2])       -- Increment between each timestamp
local num_timestamps = tonumber(ARGV[3])  -- Number of timestampts to check (24 for a day and 24 * 7 for a week)
local num_elements = tonumber(ARGV[4])    -- Number of elements to fetch in each category
local check_at_most = tonumber(ARGV[5])   -- Number of elements to check at most.

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

-- select num_elements many items
local true_group = {}
local false_group = {}
local denied_group = {}
local true_count = 0
local false_count = 0
local denied_count = 0
local i = #result - 1

-- index to stop at after going through "checkAtMost" many items:
local cutoff_index = #result - 2 * check_at_most

-- iterate over the results
while (true_count + false_count + denied_count) < (num_elements * 3) and 1 <= i and i >= cutoff_index do
  local score = tonumber(result[i + 1])
  if score > 0 then
    local element = result[i]
    if string.find(element, "success\\":true") and true_count < num_elements then
      table.insert(true_group, {score, element})
      true_count = true_count + 1
    elseif string.find(element, "success\\":false") and false_count < num_elements then
      table.insert(false_group, {score, element})
      false_count = false_count + 1
    elseif string.find(element, "success\\":\\"denied") and denied_count < num_elements then
      table.insert(denied_group, {score, element})
      denied_count = denied_count + 1
    end
  end
  i = i - 2
end

return {true_group, false_group, denied_group}
`;
    var h = `
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1])
local increment = tonumber(ARGV[2])
local num_timestamps = tonumber(ARGV[3])

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

return result
`;
    var b = class {
      redis;
      prefix;
      bucketSize;
      constructor(e) {
        this.redis = e.redis, this.prefix = e.prefix ?? "@upstash/analytics", this.bucketSize = this.parseWindow(e.window);
      }
      validateTableName(e) {
        if (!/^[a-zA-Z0-9_-]+$/.test(e)) throw new Error(`Invalid table name: ${e}. Table names can only contain letters, numbers, dashes and underscores.`);
      }
      parseWindow(e) {
        if (typeof e == "number") {
          if (e <= 0) throw new Error(`Invalid window: ${e}`);
          return e;
        }
        let t = /^(\d+)([smhd])$/;
        if (!t.test(e)) throw new Error(`Invalid window: ${e}`);
        let [, i, s] = e.match(t), n = parseInt(i);
        switch (s) {
          case "s":
            return n * 1e3;
          case "m":
            return n * 1e3 * 60;
          case "h":
            return n * 1e3 * 60 * 60;
          case "d":
            return n * 1e3 * 60 * 60 * 24;
          default:
            throw new Error(`Invalid window unit: ${s}`);
        }
      }
      getBucket(e) {
        let t = e ?? Date.now();
        return Math.floor(t / this.bucketSize) * this.bucketSize;
      }
      async ingest(e, ...t) {
        this.validateTableName(e), await Promise.all(t.map(async (i) => {
          let s = this.getBucket(i.time), n = [this.prefix, e, s].join(":");
          await this.redis.zincrby(n, 1, JSON.stringify({ ...i, time: void 0 }));
        }));
      }
      formatBucketAggregate(e, t, i) {
        let s = {};
        return e.forEach(([n, r]) => {
          t == "success" && (n = n === 1 ? "true" : n === null ? "false" : n), s[t] = s[t] || {}, s[t][(n ?? "null").toString()] = r;
        }), { time: i, ...s };
      }
      async aggregateBucket(e, t, i) {
        this.validateTableName(e);
        let s = this.getBucket(i), n = [this.prefix, e, s].join(":"), r = await this.redis.eval(p, [n], [t]);
        return this.formatBucketAggregate(r, t, s);
      }
      async aggregateBuckets(e, t, i, s) {
        this.validateTableName(e);
        let n = this.getBucket(s), r = [];
        for (let o = 0; o < i; o += 1) r.push(this.aggregateBucket(e, t, n)), n = n - this.bucketSize;
        return Promise.all(r);
      }
      async aggregateBucketsWithPipeline(e, t, i, s, n) {
        this.validateTableName(e), n = n ?? 48;
        let r = this.getBucket(s), o = [], c = this.redis.pipeline(), u = [];
        for (let a = 1; a <= i; a += 1) {
          let d = [this.prefix, e, r].join(":");
          c.eval(p, [d], [t]), o.push(r), r = r - this.bucketSize, (a % n == 0 || a == i) && (u.push(c.exec()), c = this.redis.pipeline());
        }
        return (await Promise.all(u)).flat().map((a, d) => this.formatBucketAggregate(a, t, o[d]));
      }
      async getAllowedBlocked(e, t, i) {
        this.validateTableName(e);
        let s = [this.prefix, e].join(":"), n = this.getBucket(i), r = await this.redis.eval(h, [s], [n, this.bucketSize, t]), o = {};
        for (let c = 0; c < r.length; c += 2) {
          let u = r[c], m = u.identifier, a = +r[c + 1];
          o[m] || (o[m] = { success: 0, blocked: 0 }), o[m][u.success ? "success" : "blocked"] = a;
        }
        return o;
      }
      async getMostAllowedBlocked(e, t, i, s, n) {
        this.validateTableName(e);
        let r = [this.prefix, e].join(":"), o = this.getBucket(s), c = n ?? i * 5, [u, m, a] = await this.redis.eval(f, [r], [o, this.bucketSize, t, i, c]);
        return { allowed: this.toDicts(u), ratelimited: this.toDicts(m), denied: this.toDicts(a) };
      }
      toDicts(e) {
        let t = [];
        for (let i = 0; i < e.length; i += 1) {
          let s = +e[i][0], n = e[i][1];
          t.push({ identifier: n.identifier, count: s });
        }
        return t;
      }
    };
  }
});

// node_modules/@upstash/ratelimit/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/@upstash/ratelimit/dist/index.js"(exports, module) {
    "use strict";
    var __defProp3 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export3 = (target, all) => {
      for (var name in all)
        __defProp3(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp3(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp3({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export3(src_exports, {
      Analytics: () => Analytics2,
      IpDenyList: () => ip_deny_list_exports,
      MultiRegionRatelimit: () => MultiRegionRatelimit,
      Ratelimit: () => RegionRatelimit
    });
    module.exports = __toCommonJS(src_exports);
    var import_core_analytics = require_dist();
    var Analytics2 = class {
      analytics;
      table = "events";
      constructor(config2) {
        this.analytics = new import_core_analytics.Analytics({
          // @ts-expect-error we need to fix the types in core-analytics, it should only require the methods it needs, not the whole sdk
          redis: config2.redis,
          window: "1h",
          prefix: config2.prefix ?? "@upstash/ratelimit",
          retention: "90d"
        });
      }
      /**
       * Try to extract the geo information from the request
       *
       * This handles Vercel's `req.geo` and  and Cloudflare's `request.cf` properties
       * @param req
       * @returns
       */
      extractGeo(req) {
        if (req.geo !== void 0) {
          return req.geo;
        }
        if (req.cf !== void 0) {
          return req.cf;
        }
        return {};
      }
      async record(event) {
        await this.analytics.ingest(this.table, event);
      }
      async series(filter, cutoff) {
        const timestampCount = Math.min(
          (this.analytics.getBucket(Date.now()) - this.analytics.getBucket(cutoff)) / (60 * 60 * 1e3),
          256
        );
        return this.analytics.aggregateBucketsWithPipeline(this.table, filter, timestampCount);
      }
      async getUsage(cutoff = 0) {
        const timestampCount = Math.min(
          (this.analytics.getBucket(Date.now()) - this.analytics.getBucket(cutoff)) / (60 * 60 * 1e3),
          256
        );
        const records = await this.analytics.getAllowedBlocked(this.table, timestampCount);
        return records;
      }
      async getUsageOverTime(timestampCount, groupby) {
        const result = await this.analytics.aggregateBucketsWithPipeline(this.table, groupby, timestampCount);
        return result;
      }
      async getMostAllowedBlocked(timestampCount, getTop, checkAtMost) {
        getTop = getTop ?? 5;
        const timestamp = void 0;
        return this.analytics.getMostAllowedBlocked(this.table, timestampCount, getTop, timestamp, checkAtMost);
      }
    };
    var Cache = class {
      /**
       * Stores identifier -> reset (in milliseconds)
       */
      cache;
      constructor(cache2) {
        this.cache = cache2;
      }
      isBlocked(identifier) {
        if (!this.cache.has(identifier)) {
          return { blocked: false, reset: 0 };
        }
        const reset = this.cache.get(identifier);
        if (reset < Date.now()) {
          this.cache.delete(identifier);
          return { blocked: false, reset: 0 };
        }
        return { blocked: true, reset };
      }
      blockUntil(identifier, reset) {
        this.cache.set(identifier, reset);
      }
      set(key, value) {
        this.cache.set(key, value);
      }
      get(key) {
        return this.cache.get(key) || null;
      }
      incr(key, incrementAmount = 1) {
        let value = this.cache.get(key) ?? 0;
        value += incrementAmount;
        this.cache.set(key, value);
        return value;
      }
      pop(key) {
        this.cache.delete(key);
      }
      empty() {
        this.cache.clear();
      }
      size() {
        return this.cache.size;
      }
    };
    var DYNAMIC_LIMIT_KEY_SUFFIX = ":dynamic:global";
    var DEFAULT_PREFIX = "@upstash/ratelimit";
    function ms(d) {
      const match = d.match(/^(\d+)\s?(ms|s|m|h|d)$/);
      if (!match) {
        throw new Error(`Unable to parse window size: ${d}`);
      }
      const time = Number.parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case "ms": {
          return time;
        }
        case "s": {
          return time * 1e3;
        }
        case "m": {
          return time * 1e3 * 60;
        }
        case "h": {
          return time * 1e3 * 60 * 60;
        }
        case "d": {
          return time * 1e3 * 60 * 60 * 24;
        }
        default: {
          throw new Error(`Unable to parse window size: ${d}`);
        }
      }
    }
    var safeEval = async (ctx, script, keys, args) => {
      try {
        return await ctx.redis.evalsha(script.hash, keys, args);
      } catch (error) {
        if (`${error}`.includes("NOSCRIPT")) {
          return await ctx.redis.eval(script.script, keys, args);
        }
        throw error;
      }
    };
    var fixedWindowLimitScript = `
  local key           = KEYS[1]
  local dynamicLimitKey = KEYS[2]  -- optional: key for dynamic limit in redis
  local tokens        = tonumber(ARGV[1])  -- default limit
  local window        = ARGV[2]
  local incrementBy   = ARGV[3] -- increment rate per request at a given value, default is 1

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local r = redis.call("INCRBY", key, incrementBy)
  if r == tonumber(incrementBy) then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end

  return {r, effectiveLimit}
`;
    var fixedWindowRemainingTokensScript = `
  local key = KEYS[1]
  local dynamicLimitKey = KEYS[2]  -- optional: key for dynamic limit in redis
  local tokens = tonumber(ARGV[1])  -- default limit

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local value = redis.call('GET', key)
  local usedTokens = 0
  if value then
    usedTokens = tonumber(value)
  end
  
  return {effectiveLimit - usedTokens, effectiveLimit}
`;
    var slidingWindowLimitScript = `
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local dynamicLimitKey = KEYS[3]       -- optional: key for dynamic limit in redis
  local tokens      = tonumber(ARGV[1]) -- default tokens per window
  local now         = ARGV[2]           -- current timestamp in milliseconds
  local window      = ARGV[3]           -- interval in milliseconds
  local incrementBy = tonumber(ARGV[4]) -- increment rate per request at a given value, default is 1

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end
  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)

  -- Only check limit if not refunding (negative rate)
  if incrementBy > 0 and requestsInPreviousWindow + requestsInCurrentWindow >= effectiveLimit then
    return {-1, effectiveLimit}
  end

  local newValue = redis.call("INCRBY", currentKey, incrementBy)
  if newValue == incrementBy then
    -- The first time this key is set, the value will be equal to incrementBy.
    -- So we only need the expire command once
    redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
  end
  return {effectiveLimit - ( newValue + requestsInPreviousWindow ), effectiveLimit}
`;
    var slidingWindowRemainingTokensScript = `
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local dynamicLimitKey = KEYS[3]       -- optional: key for dynamic limit in redis
  local tokens      = tonumber(ARGV[1]) -- default tokens per window
  local now         = ARGV[2]           -- current timestamp in milliseconds
  local window      = ARGV[3]           -- interval in milliseconds

  -- Check for dynamic limit
  local effectiveLimit = tokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end

  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)

  local usedTokens = requestsInPreviousWindow + requestsInCurrentWindow
  return {effectiveLimit - usedTokens, effectiveLimit}
`;
    var tokenBucketLimitScript = `
  local key         = KEYS[1]           -- identifier including prefixes
  local dynamicLimitKey = KEYS[2]       -- optional: key for dynamic limit in redis
  local maxTokens   = tonumber(ARGV[1]) -- default maximum number of tokens
  local interval    = tonumber(ARGV[2]) -- size of the window in milliseconds
  local refillRate  = tonumber(ARGV[3]) -- how many tokens are refilled after each interval
  local now         = tonumber(ARGV[4]) -- current timestamp in milliseconds
  local incrementBy = tonumber(ARGV[5]) -- how many tokens to consume, default is 1

  -- Check for dynamic limit
  local effectiveLimit = maxTokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")
        
  local refilledAt
  local tokens

  if bucket[1] == false then
    refilledAt = now
    tokens = effectiveLimit
  else
    refilledAt = tonumber(bucket[1])
    tokens = tonumber(bucket[2])
  end
        
  if now >= refilledAt + interval then
    local numRefills = math.floor((now - refilledAt) / interval)
    tokens = math.min(effectiveLimit, tokens + numRefills * refillRate)

    refilledAt = refilledAt + numRefills * interval
  end

  -- Only reject if tokens are 0 and we're consuming (not refunding)
  if tokens == 0 and incrementBy > 0 then
    return {-1, refilledAt + interval, effectiveLimit}
  end

  local remaining = tokens - incrementBy
  local expireAt = math.ceil(((effectiveLimit - remaining) / refillRate)) * interval
        
  redis.call("HSET", key, "refilledAt", refilledAt, "tokens", remaining)

  if (expireAt > 0) then
    redis.call("PEXPIRE", key, expireAt)
  end
  return {remaining, refilledAt + interval, effectiveLimit}
`;
    var tokenBucketIdentifierNotFound = -1;
    var tokenBucketRemainingTokensScript = `
  local key         = KEYS[1]
  local dynamicLimitKey = KEYS[2]       -- optional: key for dynamic limit in redis
  local maxTokens   = tonumber(ARGV[1]) -- default maximum number of tokens

  -- Check for dynamic limit
  local effectiveLimit = maxTokens
  if dynamicLimitKey ~= "" then
    local dynamicLimit = redis.call("GET", dynamicLimitKey)
    if dynamicLimit then
      effectiveLimit = tonumber(dynamicLimit)
    end
  end
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")

  if bucket[1] == false then
    return {effectiveLimit, ${tokenBucketIdentifierNotFound}, effectiveLimit}
  end
        
  return {tonumber(bucket[2]), tonumber(bucket[1]), effectiveLimit}
`;
    var cachedFixedWindowLimitScript = `
  local key     = KEYS[1]
  local window  = ARGV[1]
  local incrementBy   = ARGV[2] -- increment rate per request at a given value, default is 1

  local r = redis.call("INCRBY", key, incrementBy)
  if r == incrementBy then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end
      
  return r
`;
    var cachedFixedWindowRemainingTokenScript = `
  local key = KEYS[1]
  local tokens = 0

  local value = redis.call('GET', key)
  if value then
      tokens = value
  end
  return tokens
`;
    var fixedWindowLimitScript2 = `
	local key           = KEYS[1]
	local id            = ARGV[1]
	local window        = ARGV[2]
	local incrementBy   = tonumber(ARGV[3])

	redis.call("HSET", key, id, incrementBy)
	local fields = redis.call("HGETALL", key)
	if #fields == 2 and tonumber(fields[2])==incrementBy then
	-- The first time this key is set, and the value will be equal to incrementBy.
	-- So we only need the expire command once
	  redis.call("PEXPIRE", key, window)
	end

	return fields
`;
    var fixedWindowRemainingTokensScript2 = `
      local key = KEYS[1]
      local tokens = 0

      local fields = redis.call("HGETALL", key)

      return fields
    `;
    var slidingWindowLimitScript2 = `
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local tokens        = tonumber(ARGV[1]) -- tokens per window
	local now           = ARGV[2]           -- current timestamp in milliseconds
	local window        = ARGV[3]           -- interval in milliseconds
	local requestId     = ARGV[4]           -- uuid for this request
	local incrementBy   = tonumber(ARGV[5]) -- custom rate, default is  1

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window

	-- Only check limit if not refunding (negative rate)
	if incrementBy > 0 and requestsInPreviousWindow * (1 - percentageInCurrent ) + requestsInCurrentWindow + incrementBy > tokens then
	  return {currentFields, previousFields, false}
	end

	redis.call("HSET", currentKey, requestId, incrementBy)

	if requestsInCurrentWindow == 0 then 
	  -- The first time this key is set, the value will be equal to incrementBy.
	  -- So we only need the expire command once
	  redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
	end
	return {currentFields, previousFields, true}
`;
    var slidingWindowRemainingTokensScript2 = `
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local now         	= ARGV[1]           -- current timestamp in milliseconds
  	local window      	= ARGV[2]           -- interval in milliseconds

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window
  	requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)
	
	return requestsInCurrentWindow + requestsInPreviousWindow
`;
    var resetScript = `
      local pattern = KEYS[1]

      -- Initialize cursor to start from 0
      local cursor = "0"

      repeat
          -- Scan for keys matching the pattern
          local scan_result = redis.call('SCAN', cursor, 'MATCH', pattern)

          -- Extract cursor for the next iteration
          cursor = scan_result[1]

          -- Extract keys from the scan result
          local keys = scan_result[2]

          for i=1, #keys do
          redis.call('DEL', keys[i])
          end

      -- Continue scanning until cursor is 0 (end of keyspace)
      until cursor == "0"
    `;
    var SCRIPTS = {
      singleRegion: {
        fixedWindow: {
          limit: {
            script: fixedWindowLimitScript,
            hash: "472e55443b62f60d0991028456c57815a387066d"
          },
          getRemaining: {
            script: fixedWindowRemainingTokensScript,
            hash: "40515c9dd0a08f8584f5f9b593935f6a87c1c1c3"
          }
        },
        slidingWindow: {
          limit: {
            script: slidingWindowLimitScript,
            hash: "977fb636fb5ceb7e98a96d1b3a1272ba018efdae"
          },
          getRemaining: {
            script: slidingWindowRemainingTokensScript,
            hash: "ee3a3265fad822f83acad23f8a1e2f5c0b156b03"
          }
        },
        tokenBucket: {
          limit: {
            script: tokenBucketLimitScript,
            hash: "b35c5bc0b7fdae7dd0573d4529911cabaf9d1d89"
          },
          getRemaining: {
            script: tokenBucketRemainingTokensScript,
            hash: "deb03663e8af5a968deee895dd081be553d2611b"
          }
        },
        cachedFixedWindow: {
          limit: {
            script: cachedFixedWindowLimitScript,
            hash: "c26b12703dd137939b9a69a3a9b18e906a2d940f"
          },
          getRemaining: {
            script: cachedFixedWindowRemainingTokenScript,
            hash: "8e8f222ccae68b595ee6e3f3bf2199629a62b91a"
          }
        }
      },
      multiRegion: {
        fixedWindow: {
          limit: {
            script: fixedWindowLimitScript2,
            hash: "a8c14f3835aa87bd70e5e2116081b81664abcf5c"
          },
          getRemaining: {
            script: fixedWindowRemainingTokensScript2,
            hash: "8ab8322d0ed5fe5ac8eb08f0c2e4557f1b4816fd"
          }
        },
        slidingWindow: {
          limit: {
            script: slidingWindowLimitScript2,
            hash: "1e7ca8dcd2d600a6d0124a67a57ea225ed62921b"
          },
          getRemaining: {
            script: slidingWindowRemainingTokensScript2,
            hash: "558c9306b7ec54abb50747fe0b17e5d44bd24868"
          }
        }
      }
    };
    var RESET_SCRIPT = {
      script: resetScript,
      hash: "54bd274ddc59fb3be0f42deee2f64322a10e2b50"
    };
    var DenyListExtension = "denyList";
    var IpDenyListKey = "ipDenyList";
    var IpDenyListStatusKey = "ipDenyListStatus";
    var checkDenyListScript = `
  -- Checks if values provideed in ARGV are present in the deny lists.
  -- This is done using the allDenyListsKey below.

  -- Additionally, checks the status of the ip deny list using the
  -- ipDenyListStatusKey below. Here are the possible states of the
  -- ipDenyListStatusKey key:
  -- * status == -1: set to "disabled" with no TTL
  -- * status == -2: not set, meaning that is was set before but expired
  -- * status  >  0: set to "valid", with a TTL
  --
  -- In the case of status == -2, we set the status to "pending" with
  -- 30 second ttl. During this time, the process which got status == -2
  -- will update the ip deny list.

  local allDenyListsKey     = KEYS[1]
  local ipDenyListStatusKey = KEYS[2]

  local results = redis.call('SMISMEMBER', allDenyListsKey, unpack(ARGV))
  local status  = redis.call('TTL', ipDenyListStatusKey)
  if status == -2 then
    redis.call('SETEX', ipDenyListStatusKey, 30, "pending")
  end

  return { results, status }
`;
    var ip_deny_list_exports = {};
    __export3(ip_deny_list_exports, {
      ThresholdError: () => ThresholdError,
      disableIpDenyList: () => disableIpDenyList,
      updateIpDenyList: () => updateIpDenyList
    });
    var MILLISECONDS_IN_HOUR = 60 * 60 * 1e3;
    var MILLISECONDS_IN_DAY = 24 * MILLISECONDS_IN_HOUR;
    var MILLISECONDS_TO_2AM = 2 * MILLISECONDS_IN_HOUR;
    var getIpListTTL = (time) => {
      const now = time || Date.now();
      const timeSinceLast2AM = (now - MILLISECONDS_TO_2AM) % MILLISECONDS_IN_DAY;
      return MILLISECONDS_IN_DAY - timeSinceLast2AM;
    };
    var baseUrl = "https://raw.githubusercontent.com/stamparm/ipsum/master/levels";
    var ThresholdError = class extends Error {
      constructor(threshold) {
        super(`Allowed threshold values are from 1 to 8, 1 and 8 included. Received: ${threshold}`);
        this.name = "ThresholdError";
      }
    };
    var getIpDenyList = async (threshold) => {
      if (typeof threshold !== "number" || threshold < 1 || threshold > 8) {
        throw new ThresholdError(threshold);
      }
      try {
        const response = await fetch(`${baseUrl}/${threshold}.txt`);
        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }
        const data = await response.text();
        const lines = data.split("\n");
        return lines.filter((value) => value.length > 0);
      } catch (error) {
        throw new Error(`Failed to fetch ip deny list: ${error}`);
      }
    };
    var updateIpDenyList = async (redis, prefix, threshold, ttl) => {
      const allIps = await getIpDenyList(threshold);
      const allDenyLists = [prefix, DenyListExtension, "all"].join(":");
      const ipDenyList = [prefix, DenyListExtension, IpDenyListKey].join(":");
      const statusKey = [prefix, IpDenyListStatusKey].join(":");
      const transaction = redis.multi();
      transaction.sdiffstore(allDenyLists, allDenyLists, ipDenyList);
      transaction.del(ipDenyList);
      transaction.sadd(ipDenyList, allIps.at(0), ...allIps.slice(1));
      transaction.sdiffstore(ipDenyList, ipDenyList, allDenyLists);
      transaction.sunionstore(allDenyLists, allDenyLists, ipDenyList);
      transaction.set(statusKey, "valid", { px: ttl ?? getIpListTTL() });
      return await transaction.exec();
    };
    var disableIpDenyList = async (redis, prefix) => {
      const allDenyListsKey = [prefix, DenyListExtension, "all"].join(":");
      const ipDenyListKey = [prefix, DenyListExtension, IpDenyListKey].join(":");
      const statusKey = [prefix, IpDenyListStatusKey].join(":");
      const transaction = redis.multi();
      transaction.sdiffstore(allDenyListsKey, allDenyListsKey, ipDenyListKey);
      transaction.del(ipDenyListKey);
      transaction.set(statusKey, "disabled");
      return await transaction.exec();
    };
    var denyListCache = new Cache(/* @__PURE__ */ new Map());
    var checkDenyListCache = (members) => {
      return members.find(
        (member) => denyListCache.isBlocked(member).blocked
      );
    };
    var blockMember = (member) => {
      if (denyListCache.size() > 1e3)
        denyListCache.empty();
      denyListCache.blockUntil(member, Date.now() + 6e4);
    };
    var checkDenyList = async (redis, prefix, members) => {
      const [deniedValues, ipDenyListStatus] = await redis.eval(
        checkDenyListScript,
        [
          [prefix, DenyListExtension, "all"].join(":"),
          [prefix, IpDenyListStatusKey].join(":")
        ],
        members
      );
      let deniedValue = void 0;
      deniedValues.map((memberDenied, index) => {
        if (memberDenied) {
          blockMember(members[index]);
          deniedValue = members[index];
        }
      });
      return {
        deniedValue,
        invalidIpDenyList: ipDenyListStatus === -2
      };
    };
    var resolveLimitPayload = (redis, prefix, [ratelimitResponse, denyListResponse], threshold) => {
      if (denyListResponse.deniedValue) {
        ratelimitResponse.success = false;
        ratelimitResponse.remaining = 0;
        ratelimitResponse.reason = "denyList";
        ratelimitResponse.deniedValue = denyListResponse.deniedValue;
      }
      if (denyListResponse.invalidIpDenyList) {
        const updatePromise = updateIpDenyList(redis, prefix, threshold);
        ratelimitResponse.pending = Promise.all([
          ratelimitResponse.pending,
          updatePromise
        ]);
      }
      return ratelimitResponse;
    };
    var defaultDeniedResponse = (deniedValue) => {
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: 0,
        pending: Promise.resolve(),
        reason: "denyList",
        deniedValue
      };
    };
    var Ratelimit3 = class {
      limiter;
      ctx;
      prefix;
      timeout;
      primaryRedis;
      analytics;
      enableProtection;
      denyListThreshold;
      dynamicLimits;
      constructor(config2) {
        this.ctx = config2.ctx;
        this.limiter = config2.limiter;
        this.timeout = config2.timeout ?? 5e3;
        this.prefix = config2.prefix ?? DEFAULT_PREFIX;
        this.dynamicLimits = config2.dynamicLimits ?? false;
        this.enableProtection = config2.enableProtection ?? false;
        this.denyListThreshold = config2.denyListThreshold ?? 6;
        this.primaryRedis = "redis" in this.ctx ? this.ctx.redis : this.ctx.regionContexts[0].redis;
        if ("redis" in this.ctx) {
          this.ctx.dynamicLimits = this.dynamicLimits;
          this.ctx.prefix = this.prefix;
        }
        this.analytics = config2.analytics ? new Analytics2({
          redis: this.primaryRedis,
          prefix: this.prefix
        }) : void 0;
        if (config2.ephemeralCache instanceof Map) {
          this.ctx.cache = new Cache(config2.ephemeralCache);
        } else if (config2.ephemeralCache === void 0) {
          this.ctx.cache = new Cache(/* @__PURE__ */ new Map());
        }
      }
      /**
       * Determine if a request should pass or be rejected based on the identifier and previously chosen ratelimit.
       *
       * Use this if you want to reject all requests that you can not handle right now.
       *
       * @example
       * ```ts
       *  const ratelimit = new Ratelimit({
       *    redis: Redis.fromEnv(),
       *    limiter: Ratelimit.slidingWindow(10, "10 s")
       *  })
       *
       *  const { success } = await ratelimit.limit(id)
       *  if (!success){
       *    return "Nope"
       *  }
       *  return "Yes"
       * ```
       *
       * @param req.rate - The rate at which tokens will be added or consumed from the token bucket. A higher rate allows for more requests to be processed. Defaults to 1 token per interval if not specified.
       *
       * Usage with `req.rate`
       * @example
       * ```ts
       *  const ratelimit = new Ratelimit({
       *    redis: Redis.fromEnv(),
       *    limiter: Ratelimit.slidingWindow(100, "10 s")
       *  })
       *
       *  const { success } = await ratelimit.limit(id, {rate: 10})
       *  if (!success){
       *    return "Nope"
       *  }
       *  return "Yes"
       * ```
       */
      limit = async (identifier, req) => {
        let timeoutId = null;
        try {
          const response = this.getRatelimitResponse(identifier, req);
          const { responseArray, newTimeoutId } = this.applyTimeout(response);
          timeoutId = newTimeoutId;
          const timedResponse = await Promise.race(responseArray);
          const finalResponse = this.submitAnalytics(timedResponse, identifier, req);
          return finalResponse;
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
      };
      /**
       * Block until the request may pass or timeout is reached.
       *
       * This method returns a promise that resolves as soon as the request may be processed
       * or after the timeout has been reached.
       *
       * Use this if you want to delay the request until it is ready to get processed.
       *
       * @example
       * ```ts
       *  const ratelimit = new Ratelimit({
       *    redis: Redis.fromEnv(),
       *    limiter: Ratelimit.slidingWindow(10, "10 s")
       *  })
       *
       *  const { success } = await ratelimit.blockUntilReady(id, 60_000)
       *  if (!success){
       *    return "Nope"
       *  }
       *  return "Yes"
       * ```
       */
      blockUntilReady = async (identifier, timeout) => {
        if (timeout <= 0) {
          throw new Error("timeout must be positive");
        }
        let res;
        const deadline = Date.now() + timeout;
        while (true) {
          res = await this.limit(identifier);
          if (res.success) {
            break;
          }
          if (res.reset === 0) {
            throw new Error("This should not happen");
          }
          const wait = Math.min(res.reset, deadline) - Date.now();
          await new Promise((r) => setTimeout(r, wait));
          if (Date.now() > deadline) {
            break;
          }
        }
        return res;
      };
      resetUsedTokens = async (identifier) => {
        const pattern = [this.prefix, identifier].join(":");
        await this.limiter().resetTokens(this.ctx, pattern);
      };
      /**
       * Returns the remaining token count together with a reset timestamps
       * 
       * @param identifier identifir to check
       * @returns object with `remaining`, `reset`, and `limit` fields. `remaining` denotes
       *          the remaining tokens, `limit` is the effective limit (considering dynamic
       *          limits if enabled), and `reset` denotes the timestamp when the tokens reset.
       */
      getRemaining = async (identifier) => {
        const pattern = [this.prefix, identifier].join(":");
        return await this.limiter().getRemaining(this.ctx, pattern);
      };
      /**
       * Checks if the identifier or the values in req are in the deny list cache.
       * If so, returns the default denied response.
       * 
       * Otherwise, calls redis to check the rate limit and deny list. Returns after
       * resolving the result. Resolving is overriding the rate limit result if
       * the some value is in deny list.
       * 
       * @param identifier identifier to block
       * @param req options with ip, user agent, country, rate and geo info
       * @returns rate limit response
       */
      getRatelimitResponse = async (identifier, req) => {
        const key = this.getKey(identifier);
        const definedMembers = this.getDefinedMembers(identifier, req);
        const deniedValue = checkDenyListCache(definedMembers);
        const result = deniedValue ? [defaultDeniedResponse(deniedValue), { deniedValue, invalidIpDenyList: false }] : await Promise.all([
          this.limiter().limit(this.ctx, key, req?.rate),
          this.enableProtection ? checkDenyList(this.primaryRedis, this.prefix, definedMembers) : { deniedValue: void 0, invalidIpDenyList: false }
        ]);
        return resolveLimitPayload(this.primaryRedis, this.prefix, result, this.denyListThreshold);
      };
      /**
       * Creates an array with the original response promise and a timeout promise
       * if this.timeout > 0.
       * 
       * @param response Ratelimit response promise
       * @returns array with the response and timeout promise. also includes the timeout id
       */
      applyTimeout = (response) => {
        let newTimeoutId = null;
        const responseArray = [response];
        if (this.timeout > 0) {
          const timeoutResponse = new Promise((resolve) => {
            newTimeoutId = setTimeout(() => {
              resolve({
                success: true,
                limit: 0,
                remaining: 0,
                reset: 0,
                pending: Promise.resolve(),
                reason: "timeout"
              });
            }, this.timeout);
          });
          responseArray.push(timeoutResponse);
        }
        return {
          responseArray,
          newTimeoutId
        };
      };
      /**
       * submits analytics if this.analytics is set
       * 
       * @param ratelimitResponse final rate limit response
       * @param identifier identifier to submit
       * @param req limit options
       * @returns rate limit response after updating the .pending field
       */
      submitAnalytics = (ratelimitResponse, identifier, req) => {
        if (this.analytics) {
          try {
            const geo = req ? this.analytics.extractGeo(req) : void 0;
            const analyticsP = this.analytics.record({
              identifier: ratelimitResponse.reason === "denyList" ? ratelimitResponse.deniedValue : identifier,
              time: Date.now(),
              success: ratelimitResponse.reason === "denyList" ? "denied" : ratelimitResponse.success,
              ...geo
            }).catch((error) => {
              let errorMessage = "Failed to record analytics";
              if (`${error}`.includes("WRONGTYPE")) {
                errorMessage = `
    Failed to record analytics. See the information below:

    This can occur when you uprade to Ratelimit version 1.1.2
    or later from an earlier version.

    This occurs simply because the way we store analytics data
    has changed. To avoid getting this error, disable analytics
    for *an hour*, then simply enable it back.

    `;
              }
              console.warn(errorMessage, error);
            });
            ratelimitResponse.pending = Promise.all([ratelimitResponse.pending, analyticsP]);
          } catch (error) {
            console.warn("Failed to record analytics", error);
          }
          ;
        }
        ;
        return ratelimitResponse;
      };
      getKey = (identifier) => {
        return [this.prefix, identifier].join(":");
      };
      /**
       * returns a list of defined values from
       * [identifier, req.ip, req.userAgent, req.country]
       * 
       * @param identifier identifier
       * @param req limit options
       * @returns list of defined values
       */
      getDefinedMembers = (identifier, req) => {
        const members = [identifier, req?.ip, req?.userAgent, req?.country];
        return members.filter(Boolean);
      };
      /**
       * Set a dynamic rate limit globally.
       * 
       * When dynamicLimits is enabled, this limit will override the default limit
       * set in the constructor for all requests.
       * 
       * @example
       * ```ts
       * const ratelimit = new Ratelimit({
       *   redis: Redis.fromEnv(),
       *   limiter: Ratelimit.slidingWindow(10, "10 s"),
       *   dynamicLimits: true
       * });
       * 
       * // Set global dynamic limit to 120 requests
       * await ratelimit.setDynamicLimit({ limit: 120 });
       * 
       * // Disable dynamic limit (falls back to default)
       * await ratelimit.setDynamicLimit({ limit: false });
       * ```
       * 
       * @param options.limit - The new rate limit to apply globally, or false to disable
       */
      setDynamicLimit = async (options) => {
        if (!this.dynamicLimits) {
          throw new Error(
            "dynamicLimits must be enabled in the Ratelimit constructor to use setDynamicLimit()"
          );
        }
        const globalKey = `${this.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}`;
        await (options.limit === false ? this.primaryRedis.del(globalKey) : this.primaryRedis.set(globalKey, options.limit));
      };
      /**
       * Get the current global dynamic rate limit.
       * 
       * @example
       * ```ts
       * const { dynamicLimit } = await ratelimit.getDynamicLimit();
       * console.log(dynamicLimit); // 120 or null if not set
       * ```
       * 
       * @returns Object containing the current global dynamic limit, or null if not set
       */
      getDynamicLimit = async () => {
        if (!this.dynamicLimits) {
          throw new Error(
            "dynamicLimits must be enabled in the Ratelimit constructor to use getDynamicLimit()"
          );
        }
        const globalKey = `${this.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}`;
        const result = await this.primaryRedis.get(globalKey);
        return { dynamicLimit: result === null ? null : Number(result) };
      };
    };
    function randomId() {
      let result = "";
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const charactersLength = characters.length;
      for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }
    var MultiRegionRatelimit = class extends Ratelimit3 {
      /**
       * Create a new Ratelimit instance by providing a `@upstash/redis` instance and the algorithn of your choice.
       */
      constructor(config2) {
        super({
          prefix: config2.prefix,
          limiter: config2.limiter,
          timeout: config2.timeout,
          analytics: config2.analytics,
          dynamicLimits: config2.dynamicLimits,
          ctx: {
            regionContexts: config2.redis.map((redis) => ({
              redis,
              prefix: config2.prefix ?? DEFAULT_PREFIX
            })),
            cache: config2.ephemeralCache ? new Cache(config2.ephemeralCache) : void 0
          }
        });
        if (config2.dynamicLimits) {
          console.warn(
            "Warning: Dynamic limits are not yet supported for multi-region rate limiters. The dynamicLimits option will be ignored."
          );
        }
      }
      /**
       * Each request inside a fixed time increases a counter.
       * Once the counter reaches the maximum allowed number, all further requests are
       * rejected.
       *
       * **Pro:**
       *
       * - Newer requests are not starved by old ones.
       * - Low storage cost.
       *
       * **Con:**
       *
       * A burst of requests near the boundary of a window can result in a very
       * high request rate because two windows will be filled with requests quickly.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - A fixed timeframe
       */
      static fixedWindow(tokens, window) {
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const requestId = randomId();
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.fixedWindow.limit,
                [key],
                [requestId, windowDuration, incrementBy]
              )
            }));
            const firstResponse = await Promise.any(dbs.map((s) => s.request));
            const usedTokens = firstResponse.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            const remaining = tokens - usedTokens;
            async function sync() {
              const individualIDs = await Promise.all(dbs.map((s) => s.request));
              const allIDs = [
                ...new Set(
                  individualIDs.flat().reduce((acc, curr, index) => {
                    if (index % 2 === 0) {
                      acc.push(curr);
                    }
                    return acc;
                  }, [])
                ).values()
              ];
              for (const db of dbs) {
                const usedDbTokensRequest = await db.request;
                const usedDbTokens = usedDbTokensRequest.reduce(
                  (accTokens, usedToken, index) => {
                    let parsedToken = 0;
                    if (index % 2) {
                      parsedToken = Number.parseInt(usedToken);
                    }
                    return accTokens + parsedToken;
                  },
                  0
                );
                const dbIdsRequest = await db.request;
                const dbIds = dbIdsRequest.reduce(
                  (ids, currentId, index) => {
                    if (index % 2 === 0) {
                      ids.push(currentId);
                    }
                    return ids;
                  },
                  []
                );
                if (usedDbTokens >= tokens) {
                  continue;
                }
                const diff = allIDs.filter((id) => !dbIds.includes(id));
                if (diff.length === 0) {
                  continue;
                }
                for (const requestId2 of diff) {
                  await db.redis.hset(key, { [requestId2]: incrementBy });
                }
              }
            }
            const success = remaining >= 0;
            const reset = (bucket + 1) * windowDuration;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: tokens,
              remaining,
              reset,
              pending: sync()
            };
          },
          async getRemaining(ctx, identifier) {
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.fixedWindow.getRemaining,
                [key],
                [null]
              )
            }));
            const firstResponse = await Promise.any(dbs.map((s) => s.request));
            const usedTokens = firstResponse.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            return {
              remaining: Math.max(0, tokens - usedTokens),
              reset: (bucket + 1) * windowDuration,
              limit: tokens
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await Promise.all(
              ctx.regionContexts.map((regionContext) => {
                safeEval(regionContext, RESET_SCRIPT, [pattern], [null]);
              })
            );
          }
        });
      }
      /**
       * Combined approach of `slidingLogs` and `fixedWindow` with lower storage
       * costs than `slidingLogs` and improved boundary behavior by calculating a
       * weighted score between two windows.
       *
       * **Pro:**
       *
       * Good performance allows this to scale to very high loads.
       *
       * **Con:**
       *
       * Nothing major.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - The duration in which the user can max X requests.
       */
      static slidingWindow(tokens, window) {
        const windowSize = ms(window);
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const requestId = randomId();
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.slidingWindow.limit,
                [currentKey, previousKey],
                [tokens, now, windowDuration, requestId, incrementBy]
                // lua seems to return `1` for true and `null` for false
              )
            }));
            const percentageInCurrent = now % windowDuration / windowDuration;
            const [current, previous, success] = await Promise.any(
              dbs.map((s) => s.request)
            );
            if (success) {
              current.push(requestId, incrementBy.toString());
            }
            const previousUsedTokens = previous.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            const currentUsedTokens = current.reduce(
              (accTokens, usedToken, index) => {
                let parsedToken = 0;
                if (index % 2) {
                  parsedToken = Number.parseInt(usedToken);
                }
                return accTokens + parsedToken;
              },
              0
            );
            const previousPartialUsed = Math.ceil(
              previousUsedTokens * (1 - percentageInCurrent)
            );
            const usedTokens = previousPartialUsed + currentUsedTokens;
            const remaining = tokens - usedTokens;
            async function sync() {
              const res = await Promise.all(dbs.map((s) => s.request));
              const allCurrentIds = [
                ...new Set(
                  res.flatMap(([current2]) => current2).reduce((acc, curr, index) => {
                    if (index % 2 === 0) {
                      acc.push(curr);
                    }
                    return acc;
                  }, [])
                ).values()
              ];
              for (const db of dbs) {
                const [current2, _previous, _success] = await db.request;
                const dbIds = current2.reduce((ids, currentId, index) => {
                  if (index % 2 === 0) {
                    ids.push(currentId);
                  }
                  return ids;
                }, []);
                const usedDbTokens = current2.reduce(
                  (accTokens, usedToken, index) => {
                    let parsedToken = 0;
                    if (index % 2) {
                      parsedToken = Number.parseInt(usedToken);
                    }
                    return accTokens + parsedToken;
                  },
                  0
                );
                if (usedDbTokens >= tokens) {
                  continue;
                }
                const diff = allCurrentIds.filter((id) => !dbIds.includes(id));
                if (diff.length === 0) {
                  continue;
                }
                for (const requestId2 of diff) {
                  await db.redis.hset(currentKey, { [requestId2]: incrementBy });
                }
              }
            }
            const reset = (currentWindow + 1) * windowDuration;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success: Boolean(success),
              limit: tokens,
              remaining: Math.max(0, remaining),
              reset,
              pending: sync()
            };
          },
          async getRemaining(ctx, identifier) {
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const dbs = ctx.regionContexts.map((regionContext) => ({
              redis: regionContext.redis,
              request: safeEval(
                regionContext,
                SCRIPTS.multiRegion.slidingWindow.getRemaining,
                [currentKey, previousKey],
                [now, windowSize]
                // lua seems to return `1` for true and `null` for false
              )
            }));
            const usedTokens = await Promise.any(dbs.map((s) => s.request));
            return {
              remaining: Math.max(0, tokens - usedTokens),
              reset: (currentWindow + 1) * windowSize,
              limit: tokens
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await Promise.all(
              ctx.regionContexts.map((regionContext) => {
                safeEval(regionContext, RESET_SCRIPT, [pattern], [null]);
              })
            );
          }
        });
      }
    };
    var RegionRatelimit = class extends Ratelimit3 {
      /**
       * Create a new Ratelimit instance by providing a `@upstash/redis` instance and the algorithm of your choice.
       */
      constructor(config2) {
        super({
          prefix: config2.prefix,
          limiter: config2.limiter,
          timeout: config2.timeout,
          analytics: config2.analytics,
          ctx: {
            redis: config2.redis,
            prefix: config2.prefix ?? DEFAULT_PREFIX
          },
          ephemeralCache: config2.ephemeralCache,
          enableProtection: config2.enableProtection,
          denyListThreshold: config2.denyListThreshold,
          dynamicLimits: config2.dynamicLimits
        });
      }
      /**
       * Each request inside a fixed time increases a counter.
       * Once the counter reaches the maximum allowed number, all further requests are
       * rejected.
       *
       * **Pro:**
       *
       * - Newer requests are not starved by old ones.
       * - Low storage cost.
       *
       * **Con:**
       *
       * A burst of requests near the boundary of a window can result in a very
       * high request rate because two windows will be filled with requests quickly.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - A fixed timeframe
       */
      static fixedWindow(tokens, window) {
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [usedTokensAfterUpdate, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.fixedWindow.limit,
              [key, dynamicLimitKey],
              [tokens, windowDuration, incrementBy]
            );
            const success = usedTokensAfterUpdate <= effectiveLimit;
            const remainingTokens = Math.max(0, effectiveLimit - usedTokensAfterUpdate);
            const reset = (bucket + 1) * windowDuration;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: effectiveLimit,
              remaining: remainingTokens,
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remaining, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.fixedWindow.getRemaining,
              [key, dynamicLimitKey],
              [tokens]
            );
            return {
              remaining: Math.max(0, remaining),
              reset: (bucket + 1) * windowDuration,
              limit: effectiveLimit
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
      /**
       * Combined approach of `slidingLogs` and `fixedWindow` with lower storage
       * costs than `slidingLogs` and improved boundary behavior by calculating a
       * weighted score between two windows.
       *
       * **Pro:**
       *
       * Good performance allows this to scale to very high loads.
       *
       * **Con:**
       *
       * Nothing major.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - The duration in which the user can max X requests.
       */
      static slidingWindow(tokens, window) {
        const windowSize = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: tokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remainingTokens, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.slidingWindow.limit,
              [currentKey, previousKey, dynamicLimitKey],
              [tokens, now, windowSize, incrementBy]
            );
            const success = remainingTokens >= 0;
            const reset = (currentWindow + 1) * windowSize;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: effectiveLimit,
              remaining: Math.max(0, remainingTokens),
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            const now = Date.now();
            const currentWindow = Math.floor(now / windowSize);
            const currentKey = [identifier, currentWindow].join(":");
            const previousWindow = currentWindow - 1;
            const previousKey = [identifier, previousWindow].join(":");
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remaining, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.slidingWindow.getRemaining,
              [currentKey, previousKey, dynamicLimitKey],
              [tokens, now, windowSize]
            );
            return {
              remaining: Math.max(0, remaining),
              reset: (currentWindow + 1) * windowSize,
              limit: effectiveLimit
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = [identifier, "*"].join(":");
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
      /**
       * You have a bucket filled with `{maxTokens}` tokens that refills constantly
       * at `{refillRate}` per `{interval}`.
       * Every request will remove one token from the bucket and if there is no
       * token to take, the request is rejected.
       *
       * **Pro:**
       *
       * - Bursts of requests are smoothed out and you can process them at a constant
       * rate.
       * - Allows to set a higher initial burst limit by setting `maxTokens` higher
       * than `refillRate`
       */
      static tokenBucket(refillRate, interval, maxTokens) {
        const intervalDuration = ms(interval);
        return () => ({
          async limit(ctx, identifier, rate) {
            const now = Date.now();
            const incrementBy = rate ?? 1;
            if (ctx.cache && incrementBy > 0) {
              const { blocked, reset: reset2 } = ctx.cache.isBlocked(identifier);
              if (blocked) {
                return {
                  success: false,
                  limit: maxTokens,
                  remaining: 0,
                  reset: reset2,
                  pending: Promise.resolve(),
                  reason: "cacheBlock"
                };
              }
            }
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remaining, reset, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.tokenBucket.limit,
              [identifier, dynamicLimitKey],
              [maxTokens, intervalDuration, refillRate, now, incrementBy]
            );
            const success = remaining >= 0;
            if (ctx.cache) {
              if (!success) {
                ctx.cache.blockUntil(identifier, reset);
              } else if (incrementBy < 0) {
                ctx.cache.pop(identifier);
              }
            }
            return {
              success,
              limit: effectiveLimit,
              remaining: Math.max(0, remaining),
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            const dynamicLimitKey = ctx.dynamicLimits ? `${ctx.prefix}${DYNAMIC_LIMIT_KEY_SUFFIX}` : "";
            const [remainingTokens, refilledAt, effectiveLimit] = await safeEval(
              ctx,
              SCRIPTS.singleRegion.tokenBucket.getRemaining,
              [identifier, dynamicLimitKey],
              [maxTokens]
            );
            const freshRefillAt = Date.now() + intervalDuration;
            const identifierRefillsAt = refilledAt + intervalDuration;
            return {
              remaining: Math.max(0, remainingTokens),
              reset: refilledAt === tokenBucketIdentifierNotFound ? freshRefillAt : identifierRefillsAt,
              limit: effectiveLimit
            };
          },
          async resetTokens(ctx, identifier) {
            const pattern = identifier;
            if (ctx.cache) {
              ctx.cache.pop(identifier);
            }
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
      /**
       * cachedFixedWindow first uses the local cache to decide if a request may pass and then updates
       * it asynchronously.
       * This is experimental and not yet recommended for production use.
       *
       * @experimental
       *
       * Each request inside a fixed time increases a counter.
       * Once the counter reaches the maximum allowed number, all further requests are
       * rejected.
       *
       * **Pro:**
       *
       * - Newer requests are not starved by old ones.
       * - Low storage cost.
       *
       * **Con:**
       *
       * A burst of requests near the boundary of a window can result in a very
       * high request rate because two windows will be filled with requests quickly.
       *
       * @param tokens - How many requests a user can make in each time window.
       * @param window - A fixed timeframe
       */
      static cachedFixedWindow(tokens, window) {
        const windowDuration = ms(window);
        return () => ({
          async limit(ctx, identifier, rate) {
            if (!ctx.cache) {
              throw new Error("This algorithm requires a cache");
            }
            if (ctx.dynamicLimits) {
              console.warn(
                "Warning: Dynamic limits are not yet supported for cachedFixedWindow algorithm. The dynamicLimits option will be ignored."
              );
            }
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const reset = (bucket + 1) * windowDuration;
            const incrementBy = rate ?? 1;
            const hit = typeof ctx.cache.get(key) === "number";
            if (hit) {
              const cachedTokensAfterUpdate = ctx.cache.incr(key, incrementBy);
              const success = cachedTokensAfterUpdate < tokens;
              const pending = success ? safeEval(
                ctx,
                SCRIPTS.singleRegion.cachedFixedWindow.limit,
                [key],
                [windowDuration, incrementBy]
              ) : Promise.resolve();
              return {
                success,
                limit: tokens,
                remaining: tokens - cachedTokensAfterUpdate,
                reset,
                pending
              };
            }
            const usedTokensAfterUpdate = await safeEval(
              ctx,
              SCRIPTS.singleRegion.cachedFixedWindow.limit,
              [key],
              [windowDuration, incrementBy]
            );
            ctx.cache.set(key, usedTokensAfterUpdate);
            const remaining = tokens - usedTokensAfterUpdate;
            return {
              success: remaining >= 0,
              limit: tokens,
              remaining,
              reset,
              pending: Promise.resolve()
            };
          },
          async getRemaining(ctx, identifier) {
            if (!ctx.cache) {
              throw new Error("This algorithm requires a cache");
            }
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            const hit = typeof ctx.cache.get(key) === "number";
            if (hit) {
              const cachedUsedTokens = ctx.cache.get(key) ?? 0;
              return {
                remaining: Math.max(0, tokens - cachedUsedTokens),
                reset: (bucket + 1) * windowDuration,
                limit: tokens
              };
            }
            const usedTokens = await safeEval(
              ctx,
              SCRIPTS.singleRegion.cachedFixedWindow.getRemaining,
              [key],
              [null]
            );
            return {
              remaining: Math.max(0, tokens - usedTokens),
              reset: (bucket + 1) * windowDuration,
              limit: tokens
            };
          },
          async resetTokens(ctx, identifier) {
            if (!ctx.cache) {
              throw new Error("This algorithm requires a cache");
            }
            const bucket = Math.floor(Date.now() / windowDuration);
            const key = [identifier, bucket].join(":");
            ctx.cache.pop(key);
            const pattern = [identifier, "*"].join(":");
            await safeEval(
              ctx,
              RESET_SCRIPT,
              [pattern],
              [null]
            );
          }
        });
      }
    };
  }
});

// node_modules/jmespath/jmespath.js
var require_jmespath = __commonJS({
  "node_modules/jmespath/jmespath.js"(exports) {
    (function(exports2) {
      "use strict";
      function isArray(obj) {
        if (obj !== null) {
          return Object.prototype.toString.call(obj) === "[object Array]";
        } else {
          return false;
        }
      }
      function isObject2(obj) {
        if (obj !== null) {
          return Object.prototype.toString.call(obj) === "[object Object]";
        } else {
          return false;
        }
      }
      function strictDeepEqual(first, second) {
        if (first === second) {
          return true;
        }
        var firstType = Object.prototype.toString.call(first);
        if (firstType !== Object.prototype.toString.call(second)) {
          return false;
        }
        if (isArray(first) === true) {
          if (first.length !== second.length) {
            return false;
          }
          for (var i = 0; i < first.length; i++) {
            if (strictDeepEqual(first[i], second[i]) === false) {
              return false;
            }
          }
          return true;
        }
        if (isObject2(first) === true) {
          var keysSeen = {};
          for (var key in first) {
            if (hasOwnProperty.call(first, key)) {
              if (strictDeepEqual(first[key], second[key]) === false) {
                return false;
              }
              keysSeen[key] = true;
            }
          }
          for (var key2 in second) {
            if (hasOwnProperty.call(second, key2)) {
              if (keysSeen[key2] !== true) {
                return false;
              }
            }
          }
          return true;
        }
        return false;
      }
      function isFalse(obj) {
        if (obj === "" || obj === false || obj === null) {
          return true;
        } else if (isArray(obj) && obj.length === 0) {
          return true;
        } else if (isObject2(obj)) {
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              return false;
            }
          }
          return true;
        } else {
          return false;
        }
      }
      function objValues(obj) {
        var keys = Object.keys(obj);
        var values = [];
        for (var i = 0; i < keys.length; i++) {
          values.push(obj[keys[i]]);
        }
        return values;
      }
      function merge2(a, b) {
        var merged = {};
        for (var key in a) {
          merged[key] = a[key];
        }
        for (var key2 in b) {
          merged[key2] = b[key2];
        }
        return merged;
      }
      var trimLeft;
      if (typeof String.prototype.trimLeft === "function") {
        trimLeft = function(str) {
          return str.trimLeft();
        };
      } else {
        trimLeft = function(str) {
          return str.match(/^\s*(.*)/)[1];
        };
      }
      var TYPE_NUMBER = 0;
      var TYPE_ANY = 1;
      var TYPE_STRING = 2;
      var TYPE_ARRAY = 3;
      var TYPE_OBJECT = 4;
      var TYPE_BOOLEAN = 5;
      var TYPE_EXPREF = 6;
      var TYPE_NULL = 7;
      var TYPE_ARRAY_NUMBER = 8;
      var TYPE_ARRAY_STRING = 9;
      var TYPE_NAME_TABLE = {
        0: "number",
        1: "any",
        2: "string",
        3: "array",
        4: "object",
        5: "boolean",
        6: "expression",
        7: "null",
        8: "Array<number>",
        9: "Array<string>"
      };
      var TOK_EOF = "EOF";
      var TOK_UNQUOTEDIDENTIFIER = "UnquotedIdentifier";
      var TOK_QUOTEDIDENTIFIER = "QuotedIdentifier";
      var TOK_RBRACKET = "Rbracket";
      var TOK_RPAREN = "Rparen";
      var TOK_COMMA = "Comma";
      var TOK_COLON = "Colon";
      var TOK_RBRACE = "Rbrace";
      var TOK_NUMBER = "Number";
      var TOK_CURRENT = "Current";
      var TOK_EXPREF = "Expref";
      var TOK_PIPE = "Pipe";
      var TOK_OR = "Or";
      var TOK_AND = "And";
      var TOK_EQ = "EQ";
      var TOK_GT = "GT";
      var TOK_LT = "LT";
      var TOK_GTE = "GTE";
      var TOK_LTE = "LTE";
      var TOK_NE = "NE";
      var TOK_FLATTEN = "Flatten";
      var TOK_STAR = "Star";
      var TOK_FILTER = "Filter";
      var TOK_DOT = "Dot";
      var TOK_NOT = "Not";
      var TOK_LBRACE = "Lbrace";
      var TOK_LBRACKET = "Lbracket";
      var TOK_LPAREN = "Lparen";
      var TOK_LITERAL = "Literal";
      var basicTokens = {
        ".": TOK_DOT,
        "*": TOK_STAR,
        ",": TOK_COMMA,
        ":": TOK_COLON,
        "{": TOK_LBRACE,
        "}": TOK_RBRACE,
        "]": TOK_RBRACKET,
        "(": TOK_LPAREN,
        ")": TOK_RPAREN,
        "@": TOK_CURRENT
      };
      var operatorStartToken = {
        "<": true,
        ">": true,
        "=": true,
        "!": true
      };
      var skipChars = {
        " ": true,
        "	": true,
        "\n": true
      };
      function isAlpha(ch) {
        return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "_";
      }
      function isNum(ch) {
        return ch >= "0" && ch <= "9" || ch === "-";
      }
      function isAlphaNum(ch) {
        return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch >= "0" && ch <= "9" || ch === "_";
      }
      function Lexer() {
      }
      Lexer.prototype = {
        tokenize: function(stream) {
          var tokens = [];
          this._current = 0;
          var start;
          var identifier;
          var token;
          while (this._current < stream.length) {
            if (isAlpha(stream[this._current])) {
              start = this._current;
              identifier = this._consumeUnquotedIdentifier(stream);
              tokens.push({
                type: TOK_UNQUOTEDIDENTIFIER,
                value: identifier,
                start
              });
            } else if (basicTokens[stream[this._current]] !== void 0) {
              tokens.push({
                type: basicTokens[stream[this._current]],
                value: stream[this._current],
                start: this._current
              });
              this._current++;
            } else if (isNum(stream[this._current])) {
              token = this._consumeNumber(stream);
              tokens.push(token);
            } else if (stream[this._current] === "[") {
              token = this._consumeLBracket(stream);
              tokens.push(token);
            } else if (stream[this._current] === '"') {
              start = this._current;
              identifier = this._consumeQuotedIdentifier(stream);
              tokens.push({
                type: TOK_QUOTEDIDENTIFIER,
                value: identifier,
                start
              });
            } else if (stream[this._current] === "'") {
              start = this._current;
              identifier = this._consumeRawStringLiteral(stream);
              tokens.push({
                type: TOK_LITERAL,
                value: identifier,
                start
              });
            } else if (stream[this._current] === "`") {
              start = this._current;
              var literal = this._consumeLiteral(stream);
              tokens.push({
                type: TOK_LITERAL,
                value: literal,
                start
              });
            } else if (operatorStartToken[stream[this._current]] !== void 0) {
              tokens.push(this._consumeOperator(stream));
            } else if (skipChars[stream[this._current]] !== void 0) {
              this._current++;
            } else if (stream[this._current] === "&") {
              start = this._current;
              this._current++;
              if (stream[this._current] === "&") {
                this._current++;
                tokens.push({ type: TOK_AND, value: "&&", start });
              } else {
                tokens.push({ type: TOK_EXPREF, value: "&", start });
              }
            } else if (stream[this._current] === "|") {
              start = this._current;
              this._current++;
              if (stream[this._current] === "|") {
                this._current++;
                tokens.push({ type: TOK_OR, value: "||", start });
              } else {
                tokens.push({ type: TOK_PIPE, value: "|", start });
              }
            } else {
              var error = new Error("Unknown character:" + stream[this._current]);
              error.name = "LexerError";
              throw error;
            }
          }
          return tokens;
        },
        _consumeUnquotedIdentifier: function(stream) {
          var start = this._current;
          this._current++;
          while (this._current < stream.length && isAlphaNum(stream[this._current])) {
            this._current++;
          }
          return stream.slice(start, this._current);
        },
        _consumeQuotedIdentifier: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (stream[this._current] !== '"' && this._current < maxLength) {
            var current = this._current;
            if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === '"')) {
              current += 2;
            } else {
              current++;
            }
            this._current = current;
          }
          this._current++;
          return JSON.parse(stream.slice(start, this._current));
        },
        _consumeRawStringLiteral: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (stream[this._current] !== "'" && this._current < maxLength) {
            var current = this._current;
            if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "'")) {
              current += 2;
            } else {
              current++;
            }
            this._current = current;
          }
          this._current++;
          var literal = stream.slice(start + 1, this._current - 1);
          return literal.replace("\\'", "'");
        },
        _consumeNumber: function(stream) {
          var start = this._current;
          this._current++;
          var maxLength = stream.length;
          while (isNum(stream[this._current]) && this._current < maxLength) {
            this._current++;
          }
          var value = parseInt(stream.slice(start, this._current));
          return { type: TOK_NUMBER, value, start };
        },
        _consumeLBracket: function(stream) {
          var start = this._current;
          this._current++;
          if (stream[this._current] === "?") {
            this._current++;
            return { type: TOK_FILTER, value: "[?", start };
          } else if (stream[this._current] === "]") {
            this._current++;
            return { type: TOK_FLATTEN, value: "[]", start };
          } else {
            return { type: TOK_LBRACKET, value: "[", start };
          }
        },
        _consumeOperator: function(stream) {
          var start = this._current;
          var startingChar = stream[start];
          this._current++;
          if (startingChar === "!") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_NE, value: "!=", start };
            } else {
              return { type: TOK_NOT, value: "!", start };
            }
          } else if (startingChar === "<") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_LTE, value: "<=", start };
            } else {
              return { type: TOK_LT, value: "<", start };
            }
          } else if (startingChar === ">") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_GTE, value: ">=", start };
            } else {
              return { type: TOK_GT, value: ">", start };
            }
          } else if (startingChar === "=") {
            if (stream[this._current] === "=") {
              this._current++;
              return { type: TOK_EQ, value: "==", start };
            }
          }
        },
        _consumeLiteral: function(stream) {
          this._current++;
          var start = this._current;
          var maxLength = stream.length;
          var literal;
          while (stream[this._current] !== "`" && this._current < maxLength) {
            var current = this._current;
            if (stream[current] === "\\" && (stream[current + 1] === "\\" || stream[current + 1] === "`")) {
              current += 2;
            } else {
              current++;
            }
            this._current = current;
          }
          var literalString = trimLeft(stream.slice(start, this._current));
          literalString = literalString.replace("\\`", "`");
          if (this._looksLikeJSON(literalString)) {
            literal = JSON.parse(literalString);
          } else {
            literal = JSON.parse('"' + literalString + '"');
          }
          this._current++;
          return literal;
        },
        _looksLikeJSON: function(literalString) {
          var startingChars = '[{"';
          var jsonLiterals = ["true", "false", "null"];
          var numberLooking = "-0123456789";
          if (literalString === "") {
            return false;
          } else if (startingChars.indexOf(literalString[0]) >= 0) {
            return true;
          } else if (jsonLiterals.indexOf(literalString) >= 0) {
            return true;
          } else if (numberLooking.indexOf(literalString[0]) >= 0) {
            try {
              JSON.parse(literalString);
              return true;
            } catch (ex) {
              return false;
            }
          } else {
            return false;
          }
        }
      };
      var bindingPower = {};
      bindingPower[TOK_EOF] = 0;
      bindingPower[TOK_UNQUOTEDIDENTIFIER] = 0;
      bindingPower[TOK_QUOTEDIDENTIFIER] = 0;
      bindingPower[TOK_RBRACKET] = 0;
      bindingPower[TOK_RPAREN] = 0;
      bindingPower[TOK_COMMA] = 0;
      bindingPower[TOK_RBRACE] = 0;
      bindingPower[TOK_NUMBER] = 0;
      bindingPower[TOK_CURRENT] = 0;
      bindingPower[TOK_EXPREF] = 0;
      bindingPower[TOK_PIPE] = 1;
      bindingPower[TOK_OR] = 2;
      bindingPower[TOK_AND] = 3;
      bindingPower[TOK_EQ] = 5;
      bindingPower[TOK_GT] = 5;
      bindingPower[TOK_LT] = 5;
      bindingPower[TOK_GTE] = 5;
      bindingPower[TOK_LTE] = 5;
      bindingPower[TOK_NE] = 5;
      bindingPower[TOK_FLATTEN] = 9;
      bindingPower[TOK_STAR] = 20;
      bindingPower[TOK_FILTER] = 21;
      bindingPower[TOK_DOT] = 40;
      bindingPower[TOK_NOT] = 45;
      bindingPower[TOK_LBRACE] = 50;
      bindingPower[TOK_LBRACKET] = 55;
      bindingPower[TOK_LPAREN] = 60;
      function Parser() {
      }
      Parser.prototype = {
        parse: function(expression) {
          this._loadTokens(expression);
          this.index = 0;
          var ast = this.expression(0);
          if (this._lookahead(0) !== TOK_EOF) {
            var t = this._lookaheadToken(0);
            var error = new Error(
              "Unexpected token type: " + t.type + ", value: " + t.value
            );
            error.name = "ParserError";
            throw error;
          }
          return ast;
        },
        _loadTokens: function(expression) {
          var lexer = new Lexer();
          var tokens = lexer.tokenize(expression);
          tokens.push({ type: TOK_EOF, value: "", start: expression.length });
          this.tokens = tokens;
        },
        expression: function(rbp) {
          var leftToken = this._lookaheadToken(0);
          this._advance();
          var left = this.nud(leftToken);
          var currentToken = this._lookahead(0);
          while (rbp < bindingPower[currentToken]) {
            this._advance();
            left = this.led(currentToken, left);
            currentToken = this._lookahead(0);
          }
          return left;
        },
        _lookahead: function(number) {
          return this.tokens[this.index + number].type;
        },
        _lookaheadToken: function(number) {
          return this.tokens[this.index + number];
        },
        _advance: function() {
          this.index++;
        },
        nud: function(token) {
          var left;
          var right;
          var expression;
          switch (token.type) {
            case TOK_LITERAL:
              return { type: "Literal", value: token.value };
            case TOK_UNQUOTEDIDENTIFIER:
              return { type: "Field", name: token.value };
            case TOK_QUOTEDIDENTIFIER:
              var node = { type: "Field", name: token.value };
              if (this._lookahead(0) === TOK_LPAREN) {
                throw new Error("Quoted identifier not allowed for function names.");
              }
              return node;
            case TOK_NOT:
              right = this.expression(bindingPower.Not);
              return { type: "NotExpression", children: [right] };
            case TOK_STAR:
              left = { type: "Identity" };
              right = null;
              if (this._lookahead(0) === TOK_RBRACKET) {
                right = { type: "Identity" };
              } else {
                right = this._parseProjectionRHS(bindingPower.Star);
              }
              return { type: "ValueProjection", children: [left, right] };
            case TOK_FILTER:
              return this.led(token.type, { type: "Identity" });
            case TOK_LBRACE:
              return this._parseMultiselectHash();
            case TOK_FLATTEN:
              left = { type: TOK_FLATTEN, children: [{ type: "Identity" }] };
              right = this._parseProjectionRHS(bindingPower.Flatten);
              return { type: "Projection", children: [left, right] };
            case TOK_LBRACKET:
              if (this._lookahead(0) === TOK_NUMBER || this._lookahead(0) === TOK_COLON) {
                right = this._parseIndexExpression();
                return this._projectIfSlice({ type: "Identity" }, right);
              } else if (this._lookahead(0) === TOK_STAR && this._lookahead(1) === TOK_RBRACKET) {
                this._advance();
                this._advance();
                right = this._parseProjectionRHS(bindingPower.Star);
                return {
                  type: "Projection",
                  children: [{ type: "Identity" }, right]
                };
              }
              return this._parseMultiselectList();
            case TOK_CURRENT:
              return { type: TOK_CURRENT };
            case TOK_EXPREF:
              expression = this.expression(bindingPower.Expref);
              return { type: "ExpressionReference", children: [expression] };
            case TOK_LPAREN:
              var args = [];
              while (this._lookahead(0) !== TOK_RPAREN) {
                if (this._lookahead(0) === TOK_CURRENT) {
                  expression = { type: TOK_CURRENT };
                  this._advance();
                } else {
                  expression = this.expression(0);
                }
                args.push(expression);
              }
              this._match(TOK_RPAREN);
              return args[0];
            default:
              this._errorToken(token);
          }
        },
        led: function(tokenName, left) {
          var right;
          switch (tokenName) {
            case TOK_DOT:
              var rbp = bindingPower.Dot;
              if (this._lookahead(0) !== TOK_STAR) {
                right = this._parseDotRHS(rbp);
                return { type: "Subexpression", children: [left, right] };
              }
              this._advance();
              right = this._parseProjectionRHS(rbp);
              return { type: "ValueProjection", children: [left, right] };
            case TOK_PIPE:
              right = this.expression(bindingPower.Pipe);
              return { type: TOK_PIPE, children: [left, right] };
            case TOK_OR:
              right = this.expression(bindingPower.Or);
              return { type: "OrExpression", children: [left, right] };
            case TOK_AND:
              right = this.expression(bindingPower.And);
              return { type: "AndExpression", children: [left, right] };
            case TOK_LPAREN:
              var name = left.name;
              var args = [];
              var expression, node;
              while (this._lookahead(0) !== TOK_RPAREN) {
                if (this._lookahead(0) === TOK_CURRENT) {
                  expression = { type: TOK_CURRENT };
                  this._advance();
                } else {
                  expression = this.expression(0);
                }
                if (this._lookahead(0) === TOK_COMMA) {
                  this._match(TOK_COMMA);
                }
                args.push(expression);
              }
              this._match(TOK_RPAREN);
              node = { type: "Function", name, children: args };
              return node;
            case TOK_FILTER:
              var condition = this.expression(0);
              this._match(TOK_RBRACKET);
              if (this._lookahead(0) === TOK_FLATTEN) {
                right = { type: "Identity" };
              } else {
                right = this._parseProjectionRHS(bindingPower.Filter);
              }
              return { type: "FilterProjection", children: [left, right, condition] };
            case TOK_FLATTEN:
              var leftNode = { type: TOK_FLATTEN, children: [left] };
              var rightNode = this._parseProjectionRHS(bindingPower.Flatten);
              return { type: "Projection", children: [leftNode, rightNode] };
            case TOK_EQ:
            case TOK_NE:
            case TOK_GT:
            case TOK_GTE:
            case TOK_LT:
            case TOK_LTE:
              return this._parseComparator(left, tokenName);
            case TOK_LBRACKET:
              var token = this._lookaheadToken(0);
              if (token.type === TOK_NUMBER || token.type === TOK_COLON) {
                right = this._parseIndexExpression();
                return this._projectIfSlice(left, right);
              }
              this._match(TOK_STAR);
              this._match(TOK_RBRACKET);
              right = this._parseProjectionRHS(bindingPower.Star);
              return { type: "Projection", children: [left, right] };
            default:
              this._errorToken(this._lookaheadToken(0));
          }
        },
        _match: function(tokenType) {
          if (this._lookahead(0) === tokenType) {
            this._advance();
          } else {
            var t = this._lookaheadToken(0);
            var error = new Error("Expected " + tokenType + ", got: " + t.type);
            error.name = "ParserError";
            throw error;
          }
        },
        _errorToken: function(token) {
          var error = new Error("Invalid token (" + token.type + '): "' + token.value + '"');
          error.name = "ParserError";
          throw error;
        },
        _parseIndexExpression: function() {
          if (this._lookahead(0) === TOK_COLON || this._lookahead(1) === TOK_COLON) {
            return this._parseSliceExpression();
          } else {
            var node = {
              type: "Index",
              value: this._lookaheadToken(0).value
            };
            this._advance();
            this._match(TOK_RBRACKET);
            return node;
          }
        },
        _projectIfSlice: function(left, right) {
          var indexExpr = { type: "IndexExpression", children: [left, right] };
          if (right.type === "Slice") {
            return {
              type: "Projection",
              children: [indexExpr, this._parseProjectionRHS(bindingPower.Star)]
            };
          } else {
            return indexExpr;
          }
        },
        _parseSliceExpression: function() {
          var parts = [null, null, null];
          var index = 0;
          var currentToken = this._lookahead(0);
          while (currentToken !== TOK_RBRACKET && index < 3) {
            if (currentToken === TOK_COLON) {
              index++;
              this._advance();
            } else if (currentToken === TOK_NUMBER) {
              parts[index] = this._lookaheadToken(0).value;
              this._advance();
            } else {
              var t = this._lookahead(0);
              var error = new Error("Syntax error, unexpected token: " + t.value + "(" + t.type + ")");
              error.name = "Parsererror";
              throw error;
            }
            currentToken = this._lookahead(0);
          }
          this._match(TOK_RBRACKET);
          return {
            type: "Slice",
            children: parts
          };
        },
        _parseComparator: function(left, comparator) {
          var right = this.expression(bindingPower[comparator]);
          return { type: "Comparator", name: comparator, children: [left, right] };
        },
        _parseDotRHS: function(rbp) {
          var lookahead = this._lookahead(0);
          var exprTokens = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER, TOK_STAR];
          if (exprTokens.indexOf(lookahead) >= 0) {
            return this.expression(rbp);
          } else if (lookahead === TOK_LBRACKET) {
            this._match(TOK_LBRACKET);
            return this._parseMultiselectList();
          } else if (lookahead === TOK_LBRACE) {
            this._match(TOK_LBRACE);
            return this._parseMultiselectHash();
          }
        },
        _parseProjectionRHS: function(rbp) {
          var right;
          if (bindingPower[this._lookahead(0)] < 10) {
            right = { type: "Identity" };
          } else if (this._lookahead(0) === TOK_LBRACKET) {
            right = this.expression(rbp);
          } else if (this._lookahead(0) === TOK_FILTER) {
            right = this.expression(rbp);
          } else if (this._lookahead(0) === TOK_DOT) {
            this._match(TOK_DOT);
            right = this._parseDotRHS(rbp);
          } else {
            var t = this._lookaheadToken(0);
            var error = new Error("Sytanx error, unexpected token: " + t.value + "(" + t.type + ")");
            error.name = "ParserError";
            throw error;
          }
          return right;
        },
        _parseMultiselectList: function() {
          var expressions = [];
          while (this._lookahead(0) !== TOK_RBRACKET) {
            var expression = this.expression(0);
            expressions.push(expression);
            if (this._lookahead(0) === TOK_COMMA) {
              this._match(TOK_COMMA);
              if (this._lookahead(0) === TOK_RBRACKET) {
                throw new Error("Unexpected token Rbracket");
              }
            }
          }
          this._match(TOK_RBRACKET);
          return { type: "MultiSelectList", children: expressions };
        },
        _parseMultiselectHash: function() {
          var pairs = [];
          var identifierTypes = [TOK_UNQUOTEDIDENTIFIER, TOK_QUOTEDIDENTIFIER];
          var keyToken, keyName, value, node;
          for (; ; ) {
            keyToken = this._lookaheadToken(0);
            if (identifierTypes.indexOf(keyToken.type) < 0) {
              throw new Error("Expecting an identifier token, got: " + keyToken.type);
            }
            keyName = keyToken.value;
            this._advance();
            this._match(TOK_COLON);
            value = this.expression(0);
            node = { type: "KeyValuePair", name: keyName, value };
            pairs.push(node);
            if (this._lookahead(0) === TOK_COMMA) {
              this._match(TOK_COMMA);
            } else if (this._lookahead(0) === TOK_RBRACE) {
              this._match(TOK_RBRACE);
              break;
            }
          }
          return { type: "MultiSelectHash", children: pairs };
        }
      };
      function TreeInterpreter(runtime) {
        this.runtime = runtime;
      }
      TreeInterpreter.prototype = {
        search: function(node, value) {
          return this.visit(node, value);
        },
        visit: function(node, value) {
          var matched, current, result, first, second, field, left, right, collected, i;
          switch (node.type) {
            case "Field":
              if (value !== null && isObject2(value)) {
                field = value[node.name];
                if (field === void 0) {
                  return null;
                } else {
                  return field;
                }
              }
              return null;
            case "Subexpression":
              result = this.visit(node.children[0], value);
              for (i = 1; i < node.children.length; i++) {
                result = this.visit(node.children[1], result);
                if (result === null) {
                  return null;
                }
              }
              return result;
            case "IndexExpression":
              left = this.visit(node.children[0], value);
              right = this.visit(node.children[1], left);
              return right;
            case "Index":
              if (!isArray(value)) {
                return null;
              }
              var index = node.value;
              if (index < 0) {
                index = value.length + index;
              }
              result = value[index];
              if (result === void 0) {
                result = null;
              }
              return result;
            case "Slice":
              if (!isArray(value)) {
                return null;
              }
              var sliceParams = node.children.slice(0);
              var computed = this.computeSliceParams(value.length, sliceParams);
              var start = computed[0];
              var stop = computed[1];
              var step = computed[2];
              result = [];
              if (step > 0) {
                for (i = start; i < stop; i += step) {
                  result.push(value[i]);
                }
              } else {
                for (i = start; i > stop; i += step) {
                  result.push(value[i]);
                }
              }
              return result;
            case "Projection":
              var base = this.visit(node.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              collected = [];
              for (i = 0; i < base.length; i++) {
                current = this.visit(node.children[1], base[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "ValueProjection":
              base = this.visit(node.children[0], value);
              if (!isObject2(base)) {
                return null;
              }
              collected = [];
              var values = objValues(base);
              for (i = 0; i < values.length; i++) {
                current = this.visit(node.children[1], values[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "FilterProjection":
              base = this.visit(node.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              var filtered = [];
              var finalResults = [];
              for (i = 0; i < base.length; i++) {
                matched = this.visit(node.children[2], base[i]);
                if (!isFalse(matched)) {
                  filtered.push(base[i]);
                }
              }
              for (var j = 0; j < filtered.length; j++) {
                current = this.visit(node.children[1], filtered[j]);
                if (current !== null) {
                  finalResults.push(current);
                }
              }
              return finalResults;
            case "Comparator":
              first = this.visit(node.children[0], value);
              second = this.visit(node.children[1], value);
              switch (node.name) {
                case TOK_EQ:
                  result = strictDeepEqual(first, second);
                  break;
                case TOK_NE:
                  result = !strictDeepEqual(first, second);
                  break;
                case TOK_GT:
                  result = first > second;
                  break;
                case TOK_GTE:
                  result = first >= second;
                  break;
                case TOK_LT:
                  result = first < second;
                  break;
                case TOK_LTE:
                  result = first <= second;
                  break;
                default:
                  throw new Error("Unknown comparator: " + node.name);
              }
              return result;
            case TOK_FLATTEN:
              var original = this.visit(node.children[0], value);
              if (!isArray(original)) {
                return null;
              }
              var merged = [];
              for (i = 0; i < original.length; i++) {
                current = original[i];
                if (isArray(current)) {
                  merged.push.apply(merged, current);
                } else {
                  merged.push(current);
                }
              }
              return merged;
            case "Identity":
              return value;
            case "MultiSelectList":
              if (value === null) {
                return null;
              }
              collected = [];
              for (i = 0; i < node.children.length; i++) {
                collected.push(this.visit(node.children[i], value));
              }
              return collected;
            case "MultiSelectHash":
              if (value === null) {
                return null;
              }
              collected = {};
              var child;
              for (i = 0; i < node.children.length; i++) {
                child = node.children[i];
                collected[child.name] = this.visit(child.value, value);
              }
              return collected;
            case "OrExpression":
              matched = this.visit(node.children[0], value);
              if (isFalse(matched)) {
                matched = this.visit(node.children[1], value);
              }
              return matched;
            case "AndExpression":
              first = this.visit(node.children[0], value);
              if (isFalse(first) === true) {
                return first;
              }
              return this.visit(node.children[1], value);
            case "NotExpression":
              first = this.visit(node.children[0], value);
              return isFalse(first);
            case "Literal":
              return node.value;
            case TOK_PIPE:
              left = this.visit(node.children[0], value);
              return this.visit(node.children[1], left);
            case TOK_CURRENT:
              return value;
            case "Function":
              var resolvedArgs = [];
              for (i = 0; i < node.children.length; i++) {
                resolvedArgs.push(this.visit(node.children[i], value));
              }
              return this.runtime.callFunction(node.name, resolvedArgs);
            case "ExpressionReference":
              var refNode = node.children[0];
              refNode.jmespathType = TOK_EXPREF;
              return refNode;
            default:
              throw new Error("Unknown node type: " + node.type);
          }
        },
        computeSliceParams: function(arrayLength, sliceParams) {
          var start = sliceParams[0];
          var stop = sliceParams[1];
          var step = sliceParams[2];
          var computed = [null, null, null];
          if (step === null) {
            step = 1;
          } else if (step === 0) {
            var error = new Error("Invalid slice, step cannot be 0");
            error.name = "RuntimeError";
            throw error;
          }
          var stepValueNegative = step < 0 ? true : false;
          if (start === null) {
            start = stepValueNegative ? arrayLength - 1 : 0;
          } else {
            start = this.capSliceRange(arrayLength, start, step);
          }
          if (stop === null) {
            stop = stepValueNegative ? -1 : arrayLength;
          } else {
            stop = this.capSliceRange(arrayLength, stop, step);
          }
          computed[0] = start;
          computed[1] = stop;
          computed[2] = step;
          return computed;
        },
        capSliceRange: function(arrayLength, actualValue, step) {
          if (actualValue < 0) {
            actualValue += arrayLength;
            if (actualValue < 0) {
              actualValue = step < 0 ? -1 : 0;
            }
          } else if (actualValue >= arrayLength) {
            actualValue = step < 0 ? arrayLength - 1 : arrayLength;
          }
          return actualValue;
        }
      };
      function Runtime(interpreter) {
        this._interpreter = interpreter;
        this.functionTable = {
          // name: [function, <signature>]
          // The <signature> can be:
          //
          // {
          //   args: [[type1, type2], [type1, type2]],
          //   variadic: true|false
          // }
          //
          // Each arg in the arg list is a list of valid types
          // (if the function is overloaded and supports multiple
          // types.  If the type is "any" then no type checking
          // occurs on the argument.  Variadic is optional
          // and if not provided is assumed to be false.
          abs: { _func: this._functionAbs, _signature: [{ types: [TYPE_NUMBER] }] },
          avg: { _func: this._functionAvg, _signature: [{ types: [TYPE_ARRAY_NUMBER] }] },
          ceil: { _func: this._functionCeil, _signature: [{ types: [TYPE_NUMBER] }] },
          contains: {
            _func: this._functionContains,
            _signature: [
              { types: [TYPE_STRING, TYPE_ARRAY] },
              { types: [TYPE_ANY] }
            ]
          },
          "ends_with": {
            _func: this._functionEndsWith,
            _signature: [{ types: [TYPE_STRING] }, { types: [TYPE_STRING] }]
          },
          floor: { _func: this._functionFloor, _signature: [{ types: [TYPE_NUMBER] }] },
          length: {
            _func: this._functionLength,
            _signature: [{ types: [TYPE_STRING, TYPE_ARRAY, TYPE_OBJECT] }]
          },
          map: {
            _func: this._functionMap,
            _signature: [{ types: [TYPE_EXPREF] }, { types: [TYPE_ARRAY] }]
          },
          max: {
            _func: this._functionMax,
            _signature: [{ types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING] }]
          },
          "merge": {
            _func: this._functionMerge,
            _signature: [{ types: [TYPE_OBJECT], variadic: true }]
          },
          "max_by": {
            _func: this._functionMaxBy,
            _signature: [{ types: [TYPE_ARRAY] }, { types: [TYPE_EXPREF] }]
          },
          sum: { _func: this._functionSum, _signature: [{ types: [TYPE_ARRAY_NUMBER] }] },
          "starts_with": {
            _func: this._functionStartsWith,
            _signature: [{ types: [TYPE_STRING] }, { types: [TYPE_STRING] }]
          },
          min: {
            _func: this._functionMin,
            _signature: [{ types: [TYPE_ARRAY_NUMBER, TYPE_ARRAY_STRING] }]
          },
          "min_by": {
            _func: this._functionMinBy,
            _signature: [{ types: [TYPE_ARRAY] }, { types: [TYPE_EXPREF] }]
          },
          type: { _func: this._functionType, _signature: [{ types: [TYPE_ANY] }] },
          keys: { _func: this._functionKeys, _signature: [{ types: [TYPE_OBJECT] }] },
          values: { _func: this._functionValues, _signature: [{ types: [TYPE_OBJECT] }] },
          sort: { _func: this._functionSort, _signature: [{ types: [TYPE_ARRAY_STRING, TYPE_ARRAY_NUMBER] }] },
          "sort_by": {
            _func: this._functionSortBy,
            _signature: [{ types: [TYPE_ARRAY] }, { types: [TYPE_EXPREF] }]
          },
          join: {
            _func: this._functionJoin,
            _signature: [
              { types: [TYPE_STRING] },
              { types: [TYPE_ARRAY_STRING] }
            ]
          },
          reverse: {
            _func: this._functionReverse,
            _signature: [{ types: [TYPE_STRING, TYPE_ARRAY] }]
          },
          "to_array": { _func: this._functionToArray, _signature: [{ types: [TYPE_ANY] }] },
          "to_string": { _func: this._functionToString, _signature: [{ types: [TYPE_ANY] }] },
          "to_number": { _func: this._functionToNumber, _signature: [{ types: [TYPE_ANY] }] },
          "not_null": {
            _func: this._functionNotNull,
            _signature: [{ types: [TYPE_ANY], variadic: true }]
          }
        };
      }
      Runtime.prototype = {
        callFunction: function(name, resolvedArgs) {
          var functionEntry = this.functionTable[name];
          if (functionEntry === void 0) {
            throw new Error("Unknown function: " + name + "()");
          }
          this._validateArgs(name, resolvedArgs, functionEntry._signature);
          return functionEntry._func.call(this, resolvedArgs);
        },
        _validateArgs: function(name, args, signature) {
          var pluralized;
          if (signature[signature.length - 1].variadic) {
            if (args.length < signature.length) {
              pluralized = signature.length === 1 ? " argument" : " arguments";
              throw new Error("ArgumentError: " + name + "() takes at least" + signature.length + pluralized + " but received " + args.length);
            }
          } else if (args.length !== signature.length) {
            pluralized = signature.length === 1 ? " argument" : " arguments";
            throw new Error("ArgumentError: " + name + "() takes " + signature.length + pluralized + " but received " + args.length);
          }
          var currentSpec;
          var actualType;
          var typeMatched;
          for (var i = 0; i < signature.length; i++) {
            typeMatched = false;
            currentSpec = signature[i].types;
            actualType = this._getTypeName(args[i]);
            for (var j = 0; j < currentSpec.length; j++) {
              if (this._typeMatches(actualType, currentSpec[j], args[i])) {
                typeMatched = true;
                break;
              }
            }
            if (!typeMatched) {
              var expected = currentSpec.map(function(typeIdentifier) {
                return TYPE_NAME_TABLE[typeIdentifier];
              }).join(",");
              throw new Error("TypeError: " + name + "() expected argument " + (i + 1) + " to be type " + expected + " but received type " + TYPE_NAME_TABLE[actualType] + " instead.");
            }
          }
        },
        _typeMatches: function(actual, expected, argValue) {
          if (expected === TYPE_ANY) {
            return true;
          }
          if (expected === TYPE_ARRAY_STRING || expected === TYPE_ARRAY_NUMBER || expected === TYPE_ARRAY) {
            if (expected === TYPE_ARRAY) {
              return actual === TYPE_ARRAY;
            } else if (actual === TYPE_ARRAY) {
              var subtype;
              if (expected === TYPE_ARRAY_NUMBER) {
                subtype = TYPE_NUMBER;
              } else if (expected === TYPE_ARRAY_STRING) {
                subtype = TYPE_STRING;
              }
              for (var i = 0; i < argValue.length; i++) {
                if (!this._typeMatches(
                  this._getTypeName(argValue[i]),
                  subtype,
                  argValue[i]
                )) {
                  return false;
                }
              }
              return true;
            }
          } else {
            return actual === expected;
          }
        },
        _getTypeName: function(obj) {
          switch (Object.prototype.toString.call(obj)) {
            case "[object String]":
              return TYPE_STRING;
            case "[object Number]":
              return TYPE_NUMBER;
            case "[object Array]":
              return TYPE_ARRAY;
            case "[object Boolean]":
              return TYPE_BOOLEAN;
            case "[object Null]":
              return TYPE_NULL;
            case "[object Object]":
              if (obj.jmespathType === TOK_EXPREF) {
                return TYPE_EXPREF;
              } else {
                return TYPE_OBJECT;
              }
          }
        },
        _functionStartsWith: function(resolvedArgs) {
          return resolvedArgs[0].lastIndexOf(resolvedArgs[1]) === 0;
        },
        _functionEndsWith: function(resolvedArgs) {
          var searchStr = resolvedArgs[0];
          var suffix = resolvedArgs[1];
          return searchStr.indexOf(suffix, searchStr.length - suffix.length) !== -1;
        },
        _functionReverse: function(resolvedArgs) {
          var typeName = this._getTypeName(resolvedArgs[0]);
          if (typeName === TYPE_STRING) {
            var originalStr = resolvedArgs[0];
            var reversedStr = "";
            for (var i = originalStr.length - 1; i >= 0; i--) {
              reversedStr += originalStr[i];
            }
            return reversedStr;
          } else {
            var reversedArray = resolvedArgs[0].slice(0);
            reversedArray.reverse();
            return reversedArray;
          }
        },
        _functionAbs: function(resolvedArgs) {
          return Math.abs(resolvedArgs[0]);
        },
        _functionCeil: function(resolvedArgs) {
          return Math.ceil(resolvedArgs[0]);
        },
        _functionAvg: function(resolvedArgs) {
          var sum = 0;
          var inputArray = resolvedArgs[0];
          for (var i = 0; i < inputArray.length; i++) {
            sum += inputArray[i];
          }
          return sum / inputArray.length;
        },
        _functionContains: function(resolvedArgs) {
          return resolvedArgs[0].indexOf(resolvedArgs[1]) >= 0;
        },
        _functionFloor: function(resolvedArgs) {
          return Math.floor(resolvedArgs[0]);
        },
        _functionLength: function(resolvedArgs) {
          if (!isObject2(resolvedArgs[0])) {
            return resolvedArgs[0].length;
          } else {
            return Object.keys(resolvedArgs[0]).length;
          }
        },
        _functionMap: function(resolvedArgs) {
          var mapped = [];
          var interpreter = this._interpreter;
          var exprefNode = resolvedArgs[0];
          var elements = resolvedArgs[1];
          for (var i = 0; i < elements.length; i++) {
            mapped.push(interpreter.visit(exprefNode, elements[i]));
          }
          return mapped;
        },
        _functionMerge: function(resolvedArgs) {
          var merged = {};
          for (var i = 0; i < resolvedArgs.length; i++) {
            var current = resolvedArgs[i];
            for (var key in current) {
              merged[key] = current[key];
            }
          }
          return merged;
        },
        _functionMax: function(resolvedArgs) {
          if (resolvedArgs[0].length > 0) {
            var typeName = this._getTypeName(resolvedArgs[0][0]);
            if (typeName === TYPE_NUMBER) {
              return Math.max.apply(Math, resolvedArgs[0]);
            } else {
              var elements = resolvedArgs[0];
              var maxElement = elements[0];
              for (var i = 1; i < elements.length; i++) {
                if (maxElement.localeCompare(elements[i]) < 0) {
                  maxElement = elements[i];
                }
              }
              return maxElement;
            }
          } else {
            return null;
          }
        },
        _functionMin: function(resolvedArgs) {
          if (resolvedArgs[0].length > 0) {
            var typeName = this._getTypeName(resolvedArgs[0][0]);
            if (typeName === TYPE_NUMBER) {
              return Math.min.apply(Math, resolvedArgs[0]);
            } else {
              var elements = resolvedArgs[0];
              var minElement = elements[0];
              for (var i = 1; i < elements.length; i++) {
                if (elements[i].localeCompare(minElement) < 0) {
                  minElement = elements[i];
                }
              }
              return minElement;
            }
          } else {
            return null;
          }
        },
        _functionSum: function(resolvedArgs) {
          var sum = 0;
          var listToSum = resolvedArgs[0];
          for (var i = 0; i < listToSum.length; i++) {
            sum += listToSum[i];
          }
          return sum;
        },
        _functionType: function(resolvedArgs) {
          switch (this._getTypeName(resolvedArgs[0])) {
            case TYPE_NUMBER:
              return "number";
            case TYPE_STRING:
              return "string";
            case TYPE_ARRAY:
              return "array";
            case TYPE_OBJECT:
              return "object";
            case TYPE_BOOLEAN:
              return "boolean";
            case TYPE_EXPREF:
              return "expref";
            case TYPE_NULL:
              return "null";
          }
        },
        _functionKeys: function(resolvedArgs) {
          return Object.keys(resolvedArgs[0]);
        },
        _functionValues: function(resolvedArgs) {
          var obj = resolvedArgs[0];
          var keys = Object.keys(obj);
          var values = [];
          for (var i = 0; i < keys.length; i++) {
            values.push(obj[keys[i]]);
          }
          return values;
        },
        _functionJoin: function(resolvedArgs) {
          var joinChar = resolvedArgs[0];
          var listJoin = resolvedArgs[1];
          return listJoin.join(joinChar);
        },
        _functionToArray: function(resolvedArgs) {
          if (this._getTypeName(resolvedArgs[0]) === TYPE_ARRAY) {
            return resolvedArgs[0];
          } else {
            return [resolvedArgs[0]];
          }
        },
        _functionToString: function(resolvedArgs) {
          if (this._getTypeName(resolvedArgs[0]) === TYPE_STRING) {
            return resolvedArgs[0];
          } else {
            return JSON.stringify(resolvedArgs[0]);
          }
        },
        _functionToNumber: function(resolvedArgs) {
          var typeName = this._getTypeName(resolvedArgs[0]);
          var convertedValue;
          if (typeName === TYPE_NUMBER) {
            return resolvedArgs[0];
          } else if (typeName === TYPE_STRING) {
            convertedValue = +resolvedArgs[0];
            if (!isNaN(convertedValue)) {
              return convertedValue;
            }
          }
          return null;
        },
        _functionNotNull: function(resolvedArgs) {
          for (var i = 0; i < resolvedArgs.length; i++) {
            if (this._getTypeName(resolvedArgs[i]) !== TYPE_NULL) {
              return resolvedArgs[i];
            }
          }
          return null;
        },
        _functionSort: function(resolvedArgs) {
          var sortedArray = resolvedArgs[0].slice(0);
          sortedArray.sort();
          return sortedArray;
        },
        _functionSortBy: function(resolvedArgs) {
          var sortedArray = resolvedArgs[0].slice(0);
          if (sortedArray.length === 0) {
            return sortedArray;
          }
          var interpreter = this._interpreter;
          var exprefNode = resolvedArgs[1];
          var requiredType = this._getTypeName(
            interpreter.visit(exprefNode, sortedArray[0])
          );
          if ([TYPE_NUMBER, TYPE_STRING].indexOf(requiredType) < 0) {
            throw new Error("TypeError");
          }
          var that = this;
          var decorated = [];
          for (var i = 0; i < sortedArray.length; i++) {
            decorated.push([i, sortedArray[i]]);
          }
          decorated.sort(function(a, b) {
            var exprA = interpreter.visit(exprefNode, a[1]);
            var exprB = interpreter.visit(exprefNode, b[1]);
            if (that._getTypeName(exprA) !== requiredType) {
              throw new Error(
                "TypeError: expected " + requiredType + ", received " + that._getTypeName(exprA)
              );
            } else if (that._getTypeName(exprB) !== requiredType) {
              throw new Error(
                "TypeError: expected " + requiredType + ", received " + that._getTypeName(exprB)
              );
            }
            if (exprA > exprB) {
              return 1;
            } else if (exprA < exprB) {
              return -1;
            } else {
              return a[0] - b[0];
            }
          });
          for (var j = 0; j < decorated.length; j++) {
            sortedArray[j] = decorated[j][1];
          }
          return sortedArray;
        },
        _functionMaxBy: function(resolvedArgs) {
          var exprefNode = resolvedArgs[1];
          var resolvedArray = resolvedArgs[0];
          var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
          var maxNumber = -Infinity;
          var maxRecord;
          var current;
          for (var i = 0; i < resolvedArray.length; i++) {
            current = keyFunction(resolvedArray[i]);
            if (current > maxNumber) {
              maxNumber = current;
              maxRecord = resolvedArray[i];
            }
          }
          return maxRecord;
        },
        _functionMinBy: function(resolvedArgs) {
          var exprefNode = resolvedArgs[1];
          var resolvedArray = resolvedArgs[0];
          var keyFunction = this.createKeyFunction(exprefNode, [TYPE_NUMBER, TYPE_STRING]);
          var minNumber = Infinity;
          var minRecord;
          var current;
          for (var i = 0; i < resolvedArray.length; i++) {
            current = keyFunction(resolvedArray[i]);
            if (current < minNumber) {
              minNumber = current;
              minRecord = resolvedArray[i];
            }
          }
          return minRecord;
        },
        createKeyFunction: function(exprefNode, allowedTypes) {
          var that = this;
          var interpreter = this._interpreter;
          var keyFunc = function(x) {
            var current = interpreter.visit(exprefNode, x);
            if (allowedTypes.indexOf(that._getTypeName(current)) < 0) {
              var msg = "TypeError: expected one of " + allowedTypes + ", received " + that._getTypeName(current);
              throw new Error(msg);
            }
            return current;
          };
          return keyFunc;
        }
      };
      function compile(stream) {
        var parser = new Parser();
        var ast = parser.parse(stream);
        return ast;
      }
      function tokenize(stream) {
        var lexer = new Lexer();
        return lexer.tokenize(stream);
      }
      function search(data, expression) {
        var parser = new Parser();
        var runtime = new Runtime();
        var interpreter = new TreeInterpreter(runtime);
        runtime._interpreter = interpreter;
        var node = parser.parse(expression);
        return interpreter.search(node, data);
      }
      exports2.tokenize = tokenize;
      exports2.compile = compile;
      exports2.search = search;
      exports2.strictDeepEqual = strictDeepEqual;
    })(typeof exports === "undefined" ? exports.jmespath = {} : exports);
  }
});

// node_modules/jose/dist/webapi/lib/buffer_utils.js
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
var encoder, decoder, MAX_INT32;
var init_buffer_utils = __esm({
  "node_modules/jose/dist/webapi/lib/buffer_utils.js"() {
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    MAX_INT32 = 2 ** 32;
  }
});

// node_modules/jose/dist/webapi/lib/base64.js
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
var init_base64 = __esm({
  "node_modules/jose/dist/webapi/lib/base64.js"() {
  }
});

// node_modules/jose/dist/webapi/util/base64url.js
function decode2(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
var init_base64url = __esm({
  "node_modules/jose/dist/webapi/util/base64url.js"() {
    init_buffer_utils();
    init_base64();
  }
});

// node_modules/jose/dist/webapi/lib/crypto_key.js
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
function checkHashLength(algorithm, expected) {
  const actual = getHashLength(algorithm.hash);
  if (actual !== expected)
    throw unusable(`SHA-${expected}`, "algorithm.hash");
}
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
var unusable, isAlgorithm;
var init_crypto_key = __esm({
  "node_modules/jose/dist/webapi/lib/crypto_key.js"() {
    unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
    isAlgorithm = (algorithm, name) => algorithm.name === name;
  }
});

// node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
var invalidKeyInput, withAlg;
var init_invalid_key_input = __esm({
  "node_modules/jose/dist/webapi/lib/invalid_key_input.js"() {
    invalidKeyInput = (actual, ...types) => message("Key must be ", actual, ...types);
    withAlg = (alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types);
  }
});

// node_modules/jose/dist/webapi/util/errors.js
var JOSEError, JWTClaimValidationFailed, JWTExpired, JOSEAlgNotAllowed, JOSENotSupported, JWSInvalid, JWTInvalid, JWKSInvalid, JWKSNoMatchingKey, JWKSMultipleMatchingKeys, JWKSTimeout, JWSSignatureVerificationFailed;
var init_errors = __esm({
  "node_modules/jose/dist/webapi/util/errors.js"() {
    JOSEError = class extends Error {
      static code = "ERR_JOSE_GENERIC";
      code = "ERR_JOSE_GENERIC";
      constructor(message2, options) {
        super(message2, options);
        this.name = this.constructor.name;
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    JWTClaimValidationFailed = class extends JOSEError {
      static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      claim;
      reason;
      payload;
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    JWTExpired = class extends JOSEError {
      static code = "ERR_JWT_EXPIRED";
      code = "ERR_JWT_EXPIRED";
      claim;
      reason;
      payload;
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    JOSEAlgNotAllowed = class extends JOSEError {
      static code = "ERR_JOSE_ALG_NOT_ALLOWED";
      code = "ERR_JOSE_ALG_NOT_ALLOWED";
    };
    JOSENotSupported = class extends JOSEError {
      static code = "ERR_JOSE_NOT_SUPPORTED";
      code = "ERR_JOSE_NOT_SUPPORTED";
    };
    JWSInvalid = class extends JOSEError {
      static code = "ERR_JWS_INVALID";
      code = "ERR_JWS_INVALID";
    };
    JWTInvalid = class extends JOSEError {
      static code = "ERR_JWT_INVALID";
      code = "ERR_JWT_INVALID";
    };
    JWKSInvalid = class extends JOSEError {
      static code = "ERR_JWKS_INVALID";
      code = "ERR_JWKS_INVALID";
    };
    JWKSNoMatchingKey = class extends JOSEError {
      static code = "ERR_JWKS_NO_MATCHING_KEY";
      code = "ERR_JWKS_NO_MATCHING_KEY";
      constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
        super(message2, options);
      }
    };
    JWKSMultipleMatchingKeys = class extends JOSEError {
      [Symbol.asyncIterator];
      static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
        super(message2, options);
      }
    };
    JWKSTimeout = class extends JOSEError {
      static code = "ERR_JWKS_TIMEOUT";
      code = "ERR_JWKS_TIMEOUT";
      constructor(message2 = "request timed out", options) {
        super(message2, options);
      }
    };
    JWSSignatureVerificationFailed = class extends JOSEError {
      static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      constructor(message2 = "signature verification failed", options) {
        super(message2, options);
      }
    };
  }
});

// node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey, isKeyObject, isKeyLike;
var init_is_key_like = __esm({
  "node_modules/jose/dist/webapi/lib/is_key_like.js"() {
    isCryptoKey = (key) => {
      if (key?.[Symbol.toStringTag] === "CryptoKey")
        return true;
      try {
        return key instanceof CryptoKey;
      } catch {
        return false;
      }
    };
    isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
    isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);
  }
});

// node_modules/jose/dist/webapi/lib/helpers.js
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode2(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
var init_helpers = __esm({
  "node_modules/jose/dist/webapi/lib/helpers.js"() {
    init_base64url();
  }
});

// node_modules/jose/dist/webapi/lib/type_checks.js
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
var isObjectLike, isJWK, isPrivateJWK, isPublicJWK, isSecretJWK;
var init_type_checks = __esm({
  "node_modules/jose/dist/webapi/lib/type_checks.js"() {
    isObjectLike = (value) => typeof value === "object" && value !== null;
    isJWK = (key) => isObject(key) && typeof key.kty === "string";
    isPrivateJWK = (key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string");
    isPublicJWK = (key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0;
    isSecretJWK = (key) => key.kty === "oct" && typeof key.k === "string";
  }
});

// node_modules/jose/dist/webapi/lib/signing.js
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
function subtleAlgorithm(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
var init_signing = __esm({
  "node_modules/jose/dist/webapi/lib/signing.js"() {
    init_errors();
    init_crypto_key();
    init_invalid_key_input();
  }
});

// node_modules/jose/dist/webapi/lib/jwk_to_key.js
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
        case "ES384":
        case "ES512":
          algorithm = {
            name: "ECDSA",
            namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[jwk.alg]
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
var unsupportedAlg;
var init_jwk_to_key = __esm({
  "node_modules/jose/dist/webapi/lib/jwk_to_key.js"() {
    init_errors();
    unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
  }
});

// node_modules/jose/dist/webapi/lib/normalize_key.js
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode2(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
var unusableForAlg, cache, handleJWK, handleKeyObject;
var init_normalize_key = __esm({
  "node_modules/jose/dist/webapi/lib/normalize_key.js"() {
    init_type_checks();
    init_base64url();
    init_jwk_to_key();
    init_is_key_like();
    unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
    handleJWK = async (key, jwk, alg, freeze = false) => {
      cache ||= /* @__PURE__ */ new WeakMap();
      let cached = cache.get(key);
      if (cached?.[alg]) {
        return cached[alg];
      }
      const cryptoKey = await jwkToKey({ ...jwk, alg });
      if (freeze)
        Object.freeze(key);
      if (!cached) {
        cache.set(key, { [alg]: cryptoKey });
      } else {
        cached[alg] = cryptoKey;
      }
      return cryptoKey;
    };
    handleKeyObject = (keyObject, alg) => {
      cache ||= /* @__PURE__ */ new WeakMap();
      let cached = cache.get(keyObject);
      if (cached?.[alg]) {
        return cached[alg];
      }
      const isPublic = keyObject.type === "public";
      const extractable = isPublic ? true : false;
      let cryptoKey;
      if (keyObject.asymmetricKeyType === "x25519") {
        switch (alg) {
          case "ECDH-ES":
          case "ECDH-ES+A128KW":
          case "ECDH-ES+A192KW":
          case "ECDH-ES+A256KW":
            break;
          default:
            throw new TypeError(unusableForAlg);
        }
        cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
      }
      if (keyObject.asymmetricKeyType === "ed25519") {
        if (alg !== "EdDSA" && alg !== "Ed25519") {
          throw new TypeError(unusableForAlg);
        }
        cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
          isPublic ? "verify" : "sign"
        ]);
      }
      switch (keyObject.asymmetricKeyType) {
        case "ml-dsa-44":
        case "ml-dsa-65":
        case "ml-dsa-87": {
          if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
            throw new TypeError(unusableForAlg);
          }
          cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
            isPublic ? "verify" : "sign"
          ]);
        }
      }
      if (keyObject.asymmetricKeyType === "rsa") {
        let hash;
        switch (alg) {
          case "RSA-OAEP":
            hash = "SHA-1";
            break;
          case "RS256":
          case "PS256":
          case "RSA-OAEP-256":
            hash = "SHA-256";
            break;
          case "RS384":
          case "PS384":
          case "RSA-OAEP-384":
            hash = "SHA-384";
            break;
          case "RS512":
          case "PS512":
          case "RSA-OAEP-512":
            hash = "SHA-512";
            break;
          default:
            throw new TypeError(unusableForAlg);
        }
        if (alg.startsWith("RSA-OAEP")) {
          return keyObject.toCryptoKey({
            name: "RSA-OAEP",
            hash
          }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
        }
        cryptoKey = keyObject.toCryptoKey({
          name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
          hash
        }, extractable, [isPublic ? "verify" : "sign"]);
      }
      if (keyObject.asymmetricKeyType === "ec") {
        const nist = /* @__PURE__ */ new Map([
          ["prime256v1", "P-256"],
          ["secp384r1", "P-384"],
          ["secp521r1", "P-521"]
        ]);
        const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
        if (!namedCurve) {
          throw new TypeError(unusableForAlg);
        }
        const expectedCurve = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
        if (expectedCurve[alg] && namedCurve === expectedCurve[alg]) {
          cryptoKey = keyObject.toCryptoKey({
            name: "ECDSA",
            namedCurve
          }, extractable, [isPublic ? "verify" : "sign"]);
        }
        if (alg.startsWith("ECDH-ES")) {
          cryptoKey = keyObject.toCryptoKey({
            name: "ECDH",
            namedCurve
          }, extractable, isPublic ? [] : ["deriveBits"]);
        }
      }
      if (!cryptoKey) {
        throw new TypeError(unusableForAlg);
      }
      if (!cached) {
        cache.set(keyObject, { [alg]: cryptoKey });
      } else {
        cached[alg] = cryptoKey;
      }
      return cryptoKey;
    };
  }
});

// node_modules/jose/dist/webapi/key/import.js
async function importJWK(jwk, alg, options) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  let ext;
  alg ??= jwk.alg;
  ext ??= options?.extractable ?? jwk.ext;
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode2(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
      return jwkToKey({ ...jwk, alg, ext });
    case "AKP": {
      if (typeof jwk.alg !== "string" || !jwk.alg) {
        throw new TypeError('missing "alg" (Algorithm) Parameter value');
      }
      if (alg !== void 0 && alg !== jwk.alg) {
        throw new TypeError("JWK alg and alg option value mismatch");
      }
      return jwkToKey({ ...jwk, ext });
    }
    case "EC":
    case "OKP":
      return jwkToKey({ ...jwk, alg, ext });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
var init_import = __esm({
  "node_modules/jose/dist/webapi/key/import.js"() {
    init_base64url();
    init_jwk_to_key();
    init_errors();
    init_type_checks();
  }
});

// node_modules/jose/dist/webapi/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
var init_validate_crit = __esm({
  "node_modules/jose/dist/webapi/lib/validate_crit.js"() {
    init_errors();
  }
});

// node_modules/jose/dist/webapi/lib/validate_algorithms.js
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
var init_validate_algorithms = __esm({
  "node_modules/jose/dist/webapi/lib/validate_algorithms.js"() {
  }
});

// node_modules/jose/dist/webapi/lib/check_key_type.js
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
var tag, jwkMatchesOp, symmetricTypeCheck, asymmetricTypeCheck;
var init_check_key_type = __esm({
  "node_modules/jose/dist/webapi/lib/check_key_type.js"() {
    init_invalid_key_input();
    init_is_key_like();
    init_type_checks();
    tag = (key) => key?.[Symbol.toStringTag];
    jwkMatchesOp = (alg, key, usage) => {
      if (key.use !== void 0) {
        let expected;
        switch (usage) {
          case "sign":
          case "verify":
            expected = "sig";
            break;
          case "encrypt":
          case "decrypt":
            expected = "enc";
            break;
        }
        if (key.use !== expected) {
          throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
        }
      }
      if (key.alg !== void 0 && key.alg !== alg) {
        throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
      }
      if (Array.isArray(key.key_ops)) {
        let expectedKeyOp;
        switch (true) {
          case (usage === "sign" || usage === "verify"):
          case alg === "dir":
          case alg.includes("CBC-HS"):
            expectedKeyOp = usage;
            break;
          case alg.startsWith("PBES2"):
            expectedKeyOp = "deriveBits";
            break;
          case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
            if (!alg.includes("GCM") && alg.endsWith("KW")) {
              expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
            } else {
              expectedKeyOp = usage;
            }
            break;
          case (usage === "encrypt" && alg.startsWith("RSA")):
            expectedKeyOp = "wrapKey";
            break;
          case usage === "decrypt":
            expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
            break;
        }
        if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
          throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
        }
      }
      return true;
    };
    symmetricTypeCheck = (alg, key, usage) => {
      if (key instanceof Uint8Array)
        return;
      if (isJWK(key)) {
        if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
      }
      if (!isKeyLike(key)) {
        throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
      }
      if (key.type !== "secret") {
        throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
      }
    };
    asymmetricTypeCheck = (alg, key, usage) => {
      if (isJWK(key)) {
        switch (usage) {
          case "decrypt":
          case "sign":
            if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
          case "encrypt":
          case "verify":
            if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
        }
      }
      if (!isKeyLike(key)) {
        throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
      }
      if (key.type === "secret") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
      }
      if (key.type === "public") {
        switch (usage) {
          case "sign":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
          case "decrypt":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
        }
      }
      if (key.type === "private") {
        switch (usage) {
          case "verify":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
          case "encrypt":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
        }
      }
    };
  }
});

// node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode2(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  const signature = decodeBase64url(jws.signature, "signature", JWSInvalid);
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    payload = decodeBase64url(jws.payload, "payload", JWSInvalid);
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
var init_verify = __esm({
  "node_modules/jose/dist/webapi/jws/flattened/verify.js"() {
    init_base64url();
    init_signing();
    init_errors();
    init_buffer_utils();
    init_helpers();
    init_type_checks();
    init_type_checks();
    init_check_key_type();
    init_validate_crit();
    init_validate_algorithms();
    init_normalize_key();
  }
});

// node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
var init_verify2 = __esm({
  "node_modules/jose/dist/webapi/jws/compact/verify.js"() {
    init_verify();
    init_errors();
    init_buffer_utils();
  }
});

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
var epoch, minute, hour, day, week, year, REGEX, normalizeTyp, checkAudiencePresence;
var init_jwt_claims_set = __esm({
  "node_modules/jose/dist/webapi/lib/jwt_claims_set.js"() {
    init_errors();
    init_buffer_utils();
    init_type_checks();
    epoch = (date) => Math.floor(date.getTime() / 1e3);
    minute = 60;
    hour = minute * 60;
    day = hour * 24;
    week = day * 7;
    year = day * 365.25;
    REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
    normalizeTyp = (value) => {
      if (value.includes("/")) {
        return value.toLowerCase();
      }
      return `application/${value.toLowerCase()}`;
    };
    checkAudiencePresence = (audPayload, audOption) => {
      if (typeof audPayload === "string") {
        return audOption.includes(audPayload);
      }
      if (Array.isArray(audPayload)) {
        return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
      }
      return false;
    };
  }
});

// node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
var init_verify3 = __esm({
  "node_modules/jose/dist/webapi/jwt/verify.js"() {
    init_verify2();
    init_jwt_claims_set();
    init_errors();
  }
});

// node_modules/jose/dist/webapi/jwks/local.js
function getKtyFromAlg(alg) {
  switch (typeof alg === "string" && alg.slice(0, 2)) {
    case "RS":
    case "PS":
      return "RSA";
    case "ES":
      return "EC";
    case "Ed":
      return "OKP";
    case "ML":
      return "AKP";
    default:
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
  }
}
function isJWKSLike(jwks) {
  return jwks && typeof jwks === "object" && Array.isArray(jwks.keys) && jwks.keys.every(isJWKLike);
}
function isJWKLike(key) {
  return isObject(key);
}
async function importWithAlgCache(cache2, jwk, alg) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk);
  if (cached[alg] === void 0) {
    const key = await importJWK({ ...jwk, ext: true }, alg);
    if (key instanceof Uint8Array || key.type !== "public") {
      throw new JWKSInvalid("JSON Web Key Set members must be public keys");
    }
    cached[alg] = key;
  }
  return cached[alg];
}
function createLocalJWKSet(jwks) {
  const set = new LocalJWKSet(jwks);
  const localJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(localJWKSet, {
    jwks: {
      value: () => structuredClone(set.jwks()),
      enumerable: false,
      configurable: false,
      writable: false
    }
  });
  return localJWKSet;
}
var LocalJWKSet;
var init_local = __esm({
  "node_modules/jose/dist/webapi/jwks/local.js"() {
    init_import();
    init_errors();
    init_type_checks();
    LocalJWKSet = class {
      #jwks;
      #cached = /* @__PURE__ */ new WeakMap();
      constructor(jwks) {
        if (!isJWKSLike(jwks)) {
          throw new JWKSInvalid("JSON Web Key Set malformed");
        }
        this.#jwks = structuredClone(jwks);
      }
      jwks() {
        return this.#jwks;
      }
      async getKey(protectedHeader, token) {
        const { alg, kid } = { ...protectedHeader, ...token?.header };
        const kty = getKtyFromAlg(alg);
        const candidates = this.#jwks.keys.filter((jwk2) => {
          let candidate = kty === jwk2.kty;
          if (candidate && typeof kid === "string") {
            candidate = kid === jwk2.kid;
          }
          if (candidate && (typeof jwk2.alg === "string" || kty === "AKP")) {
            candidate = alg === jwk2.alg;
          }
          if (candidate && typeof jwk2.use === "string") {
            candidate = jwk2.use === "sig";
          }
          if (candidate && Array.isArray(jwk2.key_ops)) {
            candidate = jwk2.key_ops.includes("verify");
          }
          if (candidate) {
            switch (alg) {
              case "ES256":
                candidate = jwk2.crv === "P-256";
                break;
              case "ES384":
                candidate = jwk2.crv === "P-384";
                break;
              case "ES512":
                candidate = jwk2.crv === "P-521";
                break;
              case "Ed25519":
              case "EdDSA":
                candidate = jwk2.crv === "Ed25519";
                break;
            }
          }
          return candidate;
        });
        const { 0: jwk, length } = candidates;
        if (length === 0) {
          throw new JWKSNoMatchingKey();
        }
        if (length !== 1) {
          const error = new JWKSMultipleMatchingKeys();
          const _cached = this.#cached;
          error[Symbol.asyncIterator] = async function* () {
            for (const jwk2 of candidates) {
              try {
                yield await importWithAlgCache(_cached, jwk2, alg);
              } catch {
              }
            }
          };
          throw error;
        }
        return importWithAlgCache(this.#cached, jwk, alg);
      }
    };
  }
});

// node_modules/jose/dist/webapi/jwks/remote.js
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
async function fetchJwks(url, headers, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers
  }).catch((err) => {
    if (err.name === "TimeoutError") {
      throw new JWKSTimeout();
    }
    throw err;
  });
  if (response.status !== 200) {
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  }
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
function isFreshJwksCache(input, cacheMaxAge) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge) {
    return false;
  }
  if (!("jwks" in input) || !isObject(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, isObject)) {
    return false;
  }
  return true;
}
function createRemoteJWKSet(url, options) {
  const set = new RemoteJWKSet(url, options);
  const remoteJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
  Object.defineProperties(remoteJWKSet, {
    coolingDown: {
      get: () => set.coolingDown(),
      enumerable: true,
      configurable: false
    },
    fresh: {
      get: () => set.fresh(),
      enumerable: true,
      configurable: false
    },
    reload: {
      value: () => set.reload(),
      enumerable: true,
      configurable: false,
      writable: false
    },
    reloading: {
      get: () => set.pendingFetch(),
      enumerable: true,
      configurable: false
    },
    jwks: {
      value: () => set.jwks(),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return remoteJWKSet;
}
var USER_AGENT, customFetch, jwksCache, RemoteJWKSet;
var init_remote = __esm({
  "node_modules/jose/dist/webapi/jwks/remote.js"() {
    init_errors();
    init_local();
    init_type_checks();
    if (typeof navigator === "undefined" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) {
      const NAME = "jose";
      const VERSION2 = "v6.2.2";
      USER_AGENT = `${NAME}/${VERSION2}`;
    }
    customFetch = /* @__PURE__ */ Symbol();
    jwksCache = /* @__PURE__ */ Symbol();
    RemoteJWKSet = class {
      #url;
      #timeoutDuration;
      #cooldownDuration;
      #cacheMaxAge;
      #jwksTimestamp;
      #pendingFetch;
      #headers;
      #customFetch;
      #local;
      #cache;
      constructor(url, options) {
        if (!(url instanceof URL)) {
          throw new TypeError("url must be an instance of URL");
        }
        this.#url = new URL(url.href);
        this.#timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5e3;
        this.#cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 3e4;
        this.#cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 6e5;
        this.#headers = new Headers(options?.headers);
        if (USER_AGENT && !this.#headers.has("User-Agent")) {
          this.#headers.set("User-Agent", USER_AGENT);
        }
        if (!this.#headers.has("accept")) {
          this.#headers.set("accept", "application/json");
          this.#headers.append("accept", "application/jwk-set+json");
        }
        this.#customFetch = options?.[customFetch];
        if (options?.[jwksCache] !== void 0) {
          this.#cache = options?.[jwksCache];
          if (isFreshJwksCache(options?.[jwksCache], this.#cacheMaxAge)) {
            this.#jwksTimestamp = this.#cache.uat;
            this.#local = createLocalJWKSet(this.#cache.jwks);
          }
        }
      }
      pendingFetch() {
        return !!this.#pendingFetch;
      }
      coolingDown() {
        return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cooldownDuration : false;
      }
      fresh() {
        return typeof this.#jwksTimestamp === "number" ? Date.now() < this.#jwksTimestamp + this.#cacheMaxAge : false;
      }
      jwks() {
        return this.#local?.jwks();
      }
      async getKey(protectedHeader, token) {
        if (!this.#local || !this.fresh()) {
          await this.reload();
        }
        try {
          return await this.#local(protectedHeader, token);
        } catch (err) {
          if (err instanceof JWKSNoMatchingKey) {
            if (this.coolingDown() === false) {
              await this.reload();
              return this.#local(protectedHeader, token);
            }
          }
          throw err;
        }
      }
      async reload() {
        if (this.#pendingFetch && isCloudflareWorkers()) {
          this.#pendingFetch = void 0;
        }
        this.#pendingFetch ||= fetchJwks(this.#url.href, this.#headers, AbortSignal.timeout(this.#timeoutDuration), this.#customFetch).then((json) => {
          this.#local = createLocalJWKSet(json);
          if (this.#cache) {
            this.#cache.uat = Date.now();
            this.#cache.jwks = json;
          }
          this.#jwksTimestamp = Date.now();
          this.#pendingFetch = void 0;
        }).catch((err) => {
          this.#pendingFetch = void 0;
          throw err;
        });
        await this.#pendingFetch;
      }
    };
  }
});

// node_modules/jose/dist/webapi/index.js
var init_webapi = __esm({
  "node_modules/jose/dist/webapi/index.js"() {
    init_verify3();
    init_remote();
  }
});

// server/auth-session.ts
var auth_session_exports = {};
__export(auth_session_exports, {
  __resetJwksForTests: () => __resetJwksForTests,
  getClerkJwtVerifyBaseOptions: () => getClerkJwtVerifyBaseOptions,
  getClerkJwtVerifyOptions: () => getClerkJwtVerifyOptions,
  getJWKS: () => getJWKS,
  parsePlanLookupTimeoutMs: () => parsePlanLookupTimeoutMs,
  validateBearerToken: () => validateBearerToken
});
function getClerkJwtVerifyBaseOptions() {
  return {
    // Read lazily (not from the module-scope const) for the same reason as
    // getJWKS(): both halves of issuer handling must read the env at the same
    // time. A module evaluated before CLERK_JWT_ISSUER_DOMAIN is set would
    // otherwise pin issuer '' here — and jose skips the issuer VALUE check
    // entirely on a falsy issuer — while the lazily-built JWKS still resolves.
    issuer: process.env.CLERK_JWT_ISSUER_DOMAIN ?? "",
    algorithms: ["RS256"],
    clockTolerance: CLERK_JWT_CLOCK_TOLERANCE_SECONDS,
    // The bounded tolerance above is only a bound if expiry is evaluated at
    // all: jose skips the whole `exp` check (tolerance included) when the
    // claim is absent. Clerk always mints `exp`, so requiring it rejects
    // nothing real — it makes the stated bound enforced rather than assumed.
    requiredClaims: ["exp"]
  };
}
function getJWKS() {
  if (!_jwks) {
    const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
    if (issuerDomain) {
      const jwksUrl = new URL("/.well-known/jwks.json", issuerDomain);
      _jwks = createRemoteJWKSet(jwksUrl);
    }
  }
  return _jwks;
}
function __resetJwksForTests() {
  _jwks = null;
}
function isJwksFetchFailure(err) {
  if (err instanceof TypeError) return true;
  const code = err?.code;
  return code === "ERR_JWKS_TIMEOUT";
}
function getAllowedAudiences() {
  const configured = [
    process.env.CLERK_JWT_AUDIENCE,
    process.env.CLERK_PUBLISHABLE_KEY
  ].flatMap((value) => (value ?? "").split(",")).map((value) => value.trim()).filter(Boolean);
  return Array.from(/* @__PURE__ */ new Set(["convex", ...configured]));
}
function getClerkJwtVerifyOptions() {
  return {
    ...getClerkJwtVerifyBaseOptions(),
    audience: getAllowedAudiences()
  };
}
function extractOrgId(payload) {
  const orgClaim = payload.org;
  return (typeof orgClaim?.id === "string" ? orgClaim.id : null) ?? (typeof payload.org_id === "string" ? payload.org_id : null);
}
function parsePlanLookupTimeoutMs(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= MAX_ABORT_SIGNAL_TIMEOUT_MS ? parsed : DEFAULT_PLAN_LOOKUP_TIMEOUT_MS;
}
async function lookupPlanFromClerk(userId) {
  const cached = _planCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) return cached.role;
  if (!CLERK_SECRET_KEY) return "free";
  try {
    const resp = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        // AGENTS.md: always set User-Agent on server-side fetches. Matches the
        // sibling auth lookups (entitlement-check.ts, _shared/user-api-key.ts).
        "User-Agent": "worldmonitor-gateway/1.0"
      },
      signal: AbortSignal.timeout(PLAN_LOOKUP_TIMEOUT_MS)
    });
    if (!resp.ok) return "free";
    const user = await resp.json();
    const role = user.public_metadata?.plan === "pro" ? "pro" : "free";
    _planCache.set(userId, { role, expiresAt: Date.now() + PLAN_CACHE_TTL_MS });
    return role;
  } catch (err) {
    console.warn(
      "[auth-session] lookupPlanFromClerk failed, degrading to free:",
      err instanceof Error ? err.message : String(err)
    );
    return "free";
  }
}
async function validateBearerToken(token) {
  const jwks = getJWKS();
  if (!jwks) return { valid: false, reason: "unverifiable" };
  try {
    let payload;
    try {
      ({ payload } = await jwtVerify(token, jwks, getClerkJwtVerifyOptions()));
    } catch (audErr) {
      if (audErr.message?.includes('missing required "aud"')) {
        ({ payload } = await jwtVerify(token, jwks, getClerkJwtVerifyBaseOptions()));
      } else {
        throw audErr;
      }
    }
    const userId = payload.sub;
    if (!userId) return { valid: false, reason: "invalid" };
    const rawPlan = payload.plan;
    const role = rawPlan !== void 0 ? rawPlan === "pro" ? "pro" : "free" : await lookupPlanFromClerk(userId);
    const email = typeof payload.email === "string" ? payload.email : void 0;
    const givenName = typeof payload.given_name === "string" ? payload.given_name : void 0;
    const familyName = typeof payload.family_name === "string" ? payload.family_name : void 0;
    const name = [givenName, familyName].filter(Boolean).join(" ") || void 0;
    const orgId = extractOrgId(payload);
    const expMs = typeof payload.exp === "number" ? payload.exp * 1e3 : null;
    const withinTolerance = expMs !== null && expMs <= Date.now();
    return {
      valid: true,
      userId,
      orgId,
      role,
      email,
      name,
      ...withinTolerance ? { acceptedWithinClockTolerance: true } : {}
    };
  } catch (err) {
    return { valid: false, reason: isJwksFetchFailure(err) ? "unverifiable" : "invalid" };
  }
}
var CLERK_SECRET_KEY, CLERK_JWT_CLOCK_TOLERANCE_SECONDS, _jwks, _planCache, PLAN_CACHE_TTL_MS, DEFAULT_PLAN_LOOKUP_TIMEOUT_MS, MAX_ABORT_SIGNAL_TIMEOUT_MS, PLAN_LOOKUP_TIMEOUT_MS;
var init_auth_session = __esm({
  "server/auth-session.ts"() {
    "use strict";
    init_webapi();
    CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
    CLERK_JWT_CLOCK_TOLERANCE_SECONDS = 5;
    _jwks = null;
    _planCache = /* @__PURE__ */ new Map();
    PLAN_CACHE_TTL_MS = 5 * 60 * 1e3;
    DEFAULT_PLAN_LOOKUP_TIMEOUT_MS = 3e3;
    MAX_ABORT_SIGNAL_TIMEOUT_MS = 2147483647;
    PLAN_LOOKUP_TIMEOUT_MS = parsePlanLookupTimeoutMs(process.env.CLERK_PLAN_LOOKUP_TIMEOUT_MS);
  }
});

// shared/company-monitoring-contract.ts
var COMPANY_MONITORING_LIMITS, COMPANY_MONITORING_RPC_SCOPES, encoder2;
var init_company_monitoring_contract = __esm({
  "shared/company-monitoring-contract.ts"() {
    "use strict";
    COMPANY_MONITORING_LIMITS = {
      maxCompaniesPerAccount: 500,
      maxRequestBytes: 256 * 1024,
      maxImportBatchBytes: 256 * 1024,
      maxImportRows: 100,
      maxImportRowBytes: 8 * 1024,
      maxClientImportIdBytes: 64,
      maxNameBytes: 256,
      maxCustomerReferenceBytes: 128,
      maxAliasBytes: 256,
      maxDomainBytes: 253,
      maxIdentifierBytes: 512,
      maxXHandleBytes: 15,
      maxXHandleInputBytes: 16,
      maxXAccountIdBytes: 32,
      maxLocationBytes: 256,
      maxAliases: 20,
      maxDomains: 10,
      maxIdentifiers: 20,
      maxXHandles: 5,
      maxLocations: 20,
      maxClaimsPerCompany: 81,
      maxEvidenceReferences: 20,
      maxPageSize: 100,
      maxCursorBytes: 2048,
      maxCursorTtlMs: 24 * 60 * 60 * 1e3,
      maxCursorClockSkewMs: 60 * 1e3
    };
    COMPANY_MONITORING_RPC_SCOPES = {
      CreateMonitoredCompany: "company_monitoring:write",
      UpdateMonitoredCompany: "company_monitoring:write",
      SetMonitoredCompanyState: "company_monitoring:write",
      ImportMonitoredCompanyBatch: "company_monitoring:write",
      ListMonitoredCompanies: "company_monitoring:read",
      ListCompanyEventImpacts: "company_monitoring:read",
      ListCompanyEventChanges: "company_monitoring:read",
      GetCompanyMaterialEvent: "company_monitoring:read",
      GetCompanyCoverage: "company_monitoring:read",
      GetCompanyMonitoringStatus: "company_monitoring:read"
    };
    encoder2 = new TextEncoder();
  }
});

// server/_shared/user-api-key.ts
var user_api_key_exports = {};
__export(user_api_key_exports, {
  UserApiKeyUnavailableError: () => UserApiKeyUnavailableError,
  invalidateApiKeyCache: () => invalidateApiKeyCache,
  isUserApiKeyUnavailableError: () => isUserApiKeyUnavailableError,
  validateUserApiKey: () => validateUserApiKey
});
function isUserApiKeyUnavailableError(err) {
  return err instanceof UserApiKeyUnavailableError;
}
function isUserKeyResult(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  if (!Object.prototype.hasOwnProperty.call(value, "userId")) return false;
  const userId = value.userId;
  if (typeof userId !== "string" || userId.length === 0) return false;
  const candidate = value;
  if (candidate.scopes === void 0 && candidate.companyMonitoringAccountId === void 0) return true;
  if (!Array.isArray(candidate.scopes) || candidate.scopes.length === 0) return false;
  if (typeof candidate.companyMonitoringAccountId !== "string" || candidate.companyMonitoringAccountId.length === 0) return false;
  return new Set(candidate.scopes).size === candidate.scopes.length && candidate.scopes.every((scope) => typeof scope === "string" && COMPANY_MONITORING_SCOPES.has(scope));
}
function isGenericUserKeyResult(value) {
  return value.scopes === void 0 && value.companyMonitoringAccountId === void 0;
}
async function sha256Hex3(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
function toUnavailableError(err) {
  if (err instanceof UserApiKeyUnavailableError) return err;
  const message2 = err instanceof Error ? err.message : String(err);
  return new UserApiKeyUnavailableError(
    message2.startsWith("Convex user API key validation unavailable") ? message2 : `Convex user API key validation unavailable: ${message2}`
  );
}
async function validateUserApiKey(key) {
  if (!USER_API_KEY_RE.test(key ?? "")) return null;
  const keyHash = await sha256Hex3(key);
  const cacheKey = `${CACHE_KEY_PREFIX}${keyHash}`;
  try {
    const result = await cachedFetchJson(
      cacheKey,
      CACHE_TTL_SECONDS,
      () => fetchFromConvex(keyHash),
      NEG_TTL_SECONDS,
      { cacheFetcherErrors: false }
    );
    if (result === null) return null;
    if (!isUserKeyResult(result)) {
      console.warn(`[user-api-key] discarding non-conforming validation payload (type=${Array.isArray(result) ? "array" : typeof result})`);
      return null;
    }
    if (!isGenericUserKeyResult(result)) return null;
    return result;
  } catch (err) {
    const unavailable = toUnavailableError(err);
    console.warn("[user-api-key] validateUserApiKey unavailable:", unavailable.message);
    throw unavailable;
  }
}
async function fetchFromConvex(keyHash) {
  const convexSiteUrl = process.env.CONVEX_SITE_URL;
  const convexSharedSecret = process.env.CONVEX_SERVER_SHARED_SECRET;
  if (!convexSiteUrl || !convexSharedSecret) {
    throw new UserApiKeyUnavailableError("Convex user API key validation unavailable: missing-config");
  }
  let resp;
  try {
    resp = await fetch(`${convexSiteUrl}/api/internal-validate-api-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor-gateway/1.0",
        "x-convex-shared-secret": convexSharedSecret
      },
      body: JSON.stringify({ keyHash }),
      signal: AbortSignal.timeout(3e3)
    });
  } catch {
    throw new UserApiKeyUnavailableError("Convex user API key validation unavailable: fetch-error");
  }
  if (!resp.ok) {
    throw new UserApiKeyUnavailableError(
      `Convex user API key validation unavailable: http-${resp.status}`
    );
  }
  let value;
  try {
    value = await resp.json();
  } catch {
    throw new UserApiKeyUnavailableError("Convex user API key validation unavailable: invalid-json");
  }
  if (value === null) return null;
  if (!isUserKeyResult(value)) {
    throw new UserApiKeyUnavailableError("Convex user API key validation unavailable: invalid-payload");
  }
  return value;
}
async function invalidateApiKeyCache(keyHash) {
  await deleteRedisKey(`${CACHE_KEY_PREFIX}${keyHash}`);
}
var COMPANY_MONITORING_SCOPES, UserApiKeyUnavailableError, USER_API_KEY_RE, CACHE_TTL_SECONDS, NEG_TTL_SECONDS, CACHE_KEY_PREFIX;
var init_user_api_key = __esm({
  "server/_shared/user-api-key.ts"() {
    "use strict";
    init_redis();
    init_company_monitoring_contract();
    COMPANY_MONITORING_SCOPES = new Set(Object.values(COMPANY_MONITORING_RPC_SCOPES));
    UserApiKeyUnavailableError = class extends Error {
      code = "validation_unavailable";
      constructor(message2) {
        super(message2);
        this.name = "UserApiKeyUnavailableError";
      }
    };
    USER_API_KEY_RE = /^wm_[a-f0-9]{40}$/;
    CACHE_TTL_SECONDS = 60;
    NEG_TTL_SECONDS = 60;
    CACHE_KEY_PREFIX = "user-api-key:";
  }
});

// server/router.ts
function createRouter(allRoutes) {
  const staticTable = /* @__PURE__ */ new Map();
  const staticPaths = /* @__PURE__ */ new Map();
  const dynamicRoutes = [];
  for (const route of allRoutes) {
    if (route.path.includes("{")) {
      const parts = route.path.split("/").filter(Boolean);
      dynamicRoutes.push({
        method: route.method,
        segmentCount: parts.length,
        segments: parts.map((p) => p.startsWith("{") && p.endsWith("}") ? null : p),
        handler: route.handler
      });
    } else {
      const key = `${route.method} ${route.path}`;
      staticTable.set(key, route.handler);
      if (!staticPaths.has(route.path)) staticPaths.set(route.path, /* @__PURE__ */ new Set());
      staticPaths.get(route.path).add(route.method);
    }
  }
  function normalizePath(raw) {
    return raw.length > 1 && raw.endsWith("/") ? raw.slice(0, -1) : raw;
  }
  return {
    match(req) {
      const url = new URL(req.url);
      const pathname = normalizePath(url.pathname);
      const key = `${req.method} ${pathname}`;
      const staticHandler = staticTable.get(key);
      if (staticHandler) return staticHandler;
      const parts = pathname.split("/").filter(Boolean);
      for (const route of dynamicRoutes) {
        if (route.method !== req.method) continue;
        if (route.segmentCount !== parts.length) continue;
        let matched = true;
        for (let i = 0; i < route.segmentCount; i++) {
          if (route.segments[i] !== null && route.segments[i] !== parts[i]) {
            matched = false;
            break;
          }
        }
        if (matched) return route.handler;
      }
      return null;
    },
    allowedMethods(pathname) {
      const normalized = normalizePath(pathname);
      const methods = staticPaths.get(normalized);
      if (methods) {
        const result = Array.from(methods);
        if (result.includes("GET") && !result.includes("HEAD")) result.push("HEAD");
        return result;
      }
      const parts = normalized.split("/").filter(Boolean);
      const found = /* @__PURE__ */ new Set();
      for (const route of dynamicRoutes) {
        if (route.segmentCount !== parts.length) continue;
        let matched = true;
        for (let i = 0; i < route.segmentCount; i++) {
          if (route.segments[i] !== null && route.segments[i] !== parts[i]) {
            matched = false;
            break;
          }
        }
        if (matched) found.add(route.method);
      }
      if (found.has("GET")) found.add("HEAD");
      return Array.from(found);
    }
  };
}

// server/cors.ts
var PRODUCTION_PATTERNS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  // Vercel preview deployments under the "eliewm" team scope, e.g.
  //   worldmonitor-git-<branch>-eliewm.vercel.app  (git-branch alias)
  //   worldmonitor-<hash>-eliewm.vercel.app        (deployment URL)
  // Tight on purpose: never a bare *.vercel.app (this is a security allowlist).
  /^https:\/\/worldmonitor-[a-z0-9-]+-eliewm\.vercel\.app$/,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/
];
var DEV_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/
];
var ALLOWED_ORIGIN_PATTERNS = process.env.NODE_ENV === "production" ? PRODUCTION_PATTERNS : [...PRODUCTION_PATTERNS, ...DEV_PATTERNS];
var ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-WorldMonitor-Key",
  "X-Api-Key",
  "X-Widget-Key",
  "X-Pro-Key",
  "X-WorldMonitor-Desktop-Timestamp",
  "X-WorldMonitor-Desktop-Signature",
  "Idempotency-Key",
  "Mcp-Session-Id",
  "MCP-Protocol-Version",
  "Last-Event-ID"
].join(", ");
var EXPOSED_HEADERS = [
  "Mcp-Session-Id",
  "WWW-Authenticate",
  "Retry-After",
  "Idempotency-Key",
  "Idempotent-Replayed",
  "Location",
  // See api/_cors.js — the gateway emits this on every billing-verification
  // denial and cross-origin clients could not read it (#5622).
  "X-Billing-Verification",
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
  "X-WorldMonitor-Bbox",
  "X-WorldMonitor-Bbox-Missing",
  "X-WorldMonitor-Bbox-Invalid",
  "X-Military-Bbox"
].join(", ");
function isAllowedOrigin(origin) {
  return Boolean(origin) && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}
function getCorsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = isAllowedOrigin(origin) ? origin : "https://worldmonitor.app";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin"
  };
}
function isDisallowedOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}

// src/shared/public-rpc-cache.ts
var PUBLIC_SHARED_RPC_PATHS = /* @__PURE__ */ new Set([
  "/api/news/v1/list-feed-digest",
  "/api/displacement/v1/get-displacement-summary",
  "/api/forecast/v1/get-forecasts",
  "/api/military/v1/get-defense-industrial-base"
]);
var NEWS_VARIANTS = /* @__PURE__ */ new Set(["full", "tech", "finance", "happy", "commodity", "energy"]);
var NEWS_LANGUAGES = /* @__PURE__ */ new Set([
  "en",
  "bg",
  "cs",
  "fr",
  "de",
  "el",
  "es",
  "hr",
  "hu",
  "it",
  "pl",
  "pt",
  "nl",
  "sv",
  "sw",
  "ru",
  "uk",
  "ar",
  "fa",
  "zh",
  "ja",
  "ko",
  "ro",
  "tr",
  "th",
  "vi",
  "hi"
]);
var NEWS_QUERY_KEYS = /* @__PURE__ */ new Set(["variant", "lang", "public"]);
var DISPLACEMENT_PUBLIC_SEARCH = "flow_limit=50&public=1";
var FORECASTS_PUBLIC_SEARCH = "public=1";
var DEFENSE_INDUSTRIAL_QUERY_KEYS = /* @__PURE__ */ new Set(["country_code", "public"]);
function hasSingleValue(params, key) {
  return params.getAll(key).length === 1;
}
function stripRouterInjectedRpcEcho(url) {
  const raw = url.search.startsWith("?") ? url.search.slice(1) : url.search;
  if (!raw) return "";
  const segments = url.pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? "";
  const echo = `rpc=${lastSegment}`;
  const parts = raw.split("&");
  const rpcParts = parts.filter((part) => part === "rpc" || part.startsWith("rpc="));
  if (rpcParts.length === 0) return raw;
  if (!rpcParts.every((part) => part === echo)) return raw;
  return parts.filter((part) => part !== echo).join("&");
}
function hasOnlyKeys(params, allowed) {
  return Array.from(params.keys()).every((key) => allowed.has(key));
}
function isNewsDigestShape(params) {
  return hasOnlyKeys(params, NEWS_QUERY_KEYS) && hasSingleValue(params, "variant") && hasSingleValue(params, "lang") && NEWS_VARIANTS.has(params.get("variant") ?? "") && NEWS_LANGUAGES.has(params.get("lang") ?? "");
}
function isDefenseIndustrialShape(params) {
  return hasOnlyKeys(params, DEFENSE_INDUSTRIAL_QUERY_KEYS) && hasSingleValue(params, "country_code") && /^[A-Z]{2}$/.test(params.get("country_code") ?? "");
}
function isPublicSharedRpcRequest(urlLike, method = "GET") {
  if (method.toUpperCase() !== "GET") return false;
  let url;
  try {
    url = urlLike instanceof URL ? urlLike : new URL(urlLike, "https://worldmonitor.invalid");
  } catch {
    return false;
  }
  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  if (!PUBLIC_SHARED_RPC_PATHS.has(pathname)) return false;
  const search = stripRouterInjectedRpcEcho(url);
  const params = new URLSearchParams(search);
  if (!hasSingleValue(params, "public") || params.get("public") !== "1") return false;
  if (pathname === "/api/news/v1/list-feed-digest") return isNewsDigestShape(params);
  if (pathname === "/api/forecast/v1/get-forecasts") return search === FORECASTS_PUBLIC_SEARCH;
  if (pathname === "/api/military/v1/get-defense-industrial-base") return isDefenseIndustrialShape(params);
  return search === DISPLACEMENT_PUBLIC_SEARCH;
}

// src/shared/pro-fresh-rpc.ts
var PRO_FRESH_CACHE_RPC_PATHS = /* @__PURE__ */ new Set([
  "/api/market/v1/list-market-quotes",
  "/api/market/v1/list-crypto-quotes",
  "/api/market/v1/list-commodity-quotes",
  "/api/market/v1/list-stablecoin-markets",
  "/api/market/v1/list-gulf-quotes"
]);

// api/_session.js
var SESSION_TTL_MS = 12 * 60 * 60 * 1e3;
var PREFIX = "wms_";
var enc = new TextEncoder();
function getSecret() {
  const s = process.env.WM_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("WM_SESSION_SECRET must be set (min 32 chars)");
  }
  return s;
}
async function importHmacKey() {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}
function bufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlToBytes(s) {
  const pad = (4 - s.length % 4) % 4;
  const b64 = (s + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function base64UrlToString(s) {
  const bytes = base64UrlToBytes(s);
  return new TextDecoder().decode(bytes);
}
function isSessionTokenShape(token) {
  return typeof token === "string" && token.startsWith(PREFIX);
}
async function validateSessionToken(token) {
  if (!isSessionTokenShape(token)) return false;
  const tail = token.slice(PREFIX.length);
  const dot = tail.indexOf(".");
  if (dot < 0) return false;
  const body = tail.slice(0, dot);
  const sig = tail.slice(dot + 1);
  if (!body || !sig) return false;
  let key;
  try {
    key = await importHmacKey();
  } catch {
    return false;
  }
  let expectedBuf;
  try {
    expectedBuf = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  } catch {
    return false;
  }
  let providedBytes;
  try {
    providedBytes = base64UrlToBytes(sig);
  } catch {
    return false;
  }
  if (bufferToBase64Url(providedBytes.buffer) !== sig) return false;
  const expected = new Uint8Array(expectedBuf);
  if (expected.length !== providedBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ providedBytes[i];
  if (diff !== 0) return false;
  let payload;
  try {
    payload = JSON.parse(base64UrlToString(body));
  } catch {
    return false;
  }
  if (typeof payload.exp !== "number") return false;
  if (!Number.isFinite(payload.exp)) return false;
  if (Date.now() >= payload.exp) return false;
  return true;
}

// api/_crypto.js
async function timingSafeIncludes(candidate, validKeys) {
  if (typeof candidate !== "string" || !candidate || !Array.isArray(validKeys) || !validKeys.length || validKeys.some((key) => typeof key !== "string")) {
    return false;
  }
  const enc2 = new TextEncoder();
  const candidateHash = await crypto.subtle.digest("SHA-256", enc2.encode(candidate));
  const candidateBytes = new Uint8Array(candidateHash);
  let found = false;
  for (const k of validKeys) {
    const kHash = await crypto.subtle.digest("SHA-256", enc2.encode(k));
    const kBytes = new Uint8Array(kHash);
    let diff = 0;
    for (let i = 0; i < kBytes.length; i++) diff |= candidateBytes[i] ^ kBytes[i];
    if (diff === 0) found = true;
  }
  return found;
}
async function timingSafeEqualSecret(candidate, expected) {
  if (!candidate || !expected) return false;
  return timingSafeIncludes(candidate, [expected]);
}

// api/_api-key.js
var USER_API_KEY_GATEWAY_VALIDATION_ERROR = "User API key requires gateway validation";
var DESKTOP_ORIGIN_PATTERNS = [
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/
];
function isDesktopOrigin(origin) {
  return Boolean(origin) && DESKTOP_ORIGIN_PATTERNS.some((p) => p.test(origin));
}
function getHeaderApiKey(req) {
  return req.headers.get("X-WorldMonitor-Key") || req.headers.get("X-Api-Key") || "";
}
async function isValidEnterpriseKey(key) {
  if (!key) return false;
  const validKeys = (process.env.WORLDMONITOR_VALID_KEYS || "").split(",").filter(Boolean);
  return timingSafeIncludes(key, validKeys);
}
function getCookie(req, name) {
  const raw = req.headers.get("Cookie") || req.headers.get("cookie") || "";
  if (!raw) return "";
  const prefix = `${name}=`;
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(prefix)) continue;
    try {
      return decodeURIComponent(trimmed.slice(prefix.length));
    } catch {
      return trimmed.slice(prefix.length);
    }
  }
  return "";
}
async function validateApiKey(req, options = {}) {
  const forceKey = options.forceKey === true;
  const headerKey = getHeaderApiKey(req);
  const sessionCookie = getCookie(req, "wm-session");
  const testerCookie = getCookie(req, "wm-pro-key") || getCookie(req, "wm-widget-key");
  const key = headerKey || testerCookie || sessionCookie;
  const origin = req.headers.get("Origin") || "";
  if (isDesktopOrigin(origin)) {
    if (!headerKey) return { valid: false, required: true, error: "API key required for desktop access" };
    if (!await isValidEnterpriseKey(headerKey)) return { valid: false, required: true, error: "Invalid API key" };
    return { valid: true, required: true, kind: "enterprise" };
  }
  if (isSessionTokenShape(key)) {
    if (forceKey) {
      return { valid: false, required: true, error: "Pro authentication required" };
    }
    if (await validateSessionToken(key)) {
      return { valid: true, required: false, kind: "session" };
    }
    return { valid: false, required: true, error: "Invalid session token" };
  }
  if (key && await isValidEnterpriseKey(key)) {
    return { valid: true, required: true, kind: "enterprise" };
  }
  if (key && key.startsWith("wm_")) {
    return { valid: false, required: true, error: USER_API_KEY_GATEWAY_VALIDATION_ERROR };
  }
  if (key) {
    return { valid: false, required: true, error: "Invalid API key" };
  }
  return { valid: false, required: true, error: "API key required" };
}

// api/_sentry-common.js
var _key = "";
var _envelopeUrl = "";
(function parseDsn() {
  if (process.env.NODE_TEST_CONTEXT) return;
  const dsn = process.env.VITE_SENTRY_DSN ?? "";
  if (!dsn) return;
  try {
    const u = new URL(dsn);
    _key = u.username;
    const projectId = u.pathname.replace(/^\//, "");
    _envelopeUrl = `${u.protocol}//${u.host}/api/${projectId}/envelope/`;
  } catch {
  }
})();
function parseStack(stack) {
  const lines = stack.split("\n").slice(1, 30);
  const frames = [];
  for (const line of lines) {
    const m = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
    if (!m) continue;
    frames.push({
      function: m[1] || "<anonymous>",
      filename: m[2],
      lineno: Number(m[3]),
      colno: Number(m[4])
    });
  }
  return frames.reverse();
}
function buildEnvelope(err, ctx, runtimeCfg) {
  const errMsg2 = err instanceof Error ? err.message : String(err);
  const errType = err instanceof Error ? err.constructor.name : "Error";
  const stack = err instanceof Error && err.stack ? err.stack : void 0;
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const level = ctx?.level === "warning" || ctx?.level === "info" || ctx?.level === "fatal" ? ctx.level : "error";
  const event = {
    event_id: eventId,
    timestamp,
    level,
    platform: runtimeCfg.platform,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "production",
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    exception: {
      values: [
        {
          type: errType,
          value: errMsg2,
          ...stack ? { stacktrace: { frames: parseStack(stack) } } : {}
        }
      ]
    },
    tags: { surface: "api", runtime: runtimeCfg.runtime, ...ctx?.tags ?? {} },
    extra: ctx?.extra,
    // Caller-supplied fingerprint overrides Sentry's default grouping.
    // Use when the error message contains a high-cardinality token (request id,
    // ephemeral hash) that would otherwise split one logical issue into many.
    ...Array.isArray(ctx?.fingerprint) && ctx.fingerprint.length > 0 ? { fingerprint: ctx.fingerprint } : {}
  };
  const header = JSON.stringify({ event_id: eventId, sent_at: timestamp });
  const itemHeader = JSON.stringify({ type: "event" });
  const itemPayload = JSON.stringify(event);
  return `${header}
${itemHeader}
${itemPayload}
`;
}
async function deliver(body, logPrefix) {
  if (!_envelopeUrl || !_key) return;
  try {
    const res = await fetch(_envelopeUrl, {
      method: "POST",
      keepalive: true,
      signal: AbortSignal.timeout(2e3),
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${_key}`
      },
      body
    });
    if (!res.ok) {
      const hint = res.status === 401 || res.status === 403 ? " \u2014 check VITE_SENTRY_DSN and auth key" : res.status === 429 ? " \u2014 rate limited by Sentry" : " \u2014 Sentry outage or transient error";
      console.warn(`${logPrefix} non-2xx response ${res.status}${hint}`);
    }
  } catch (fetchErr) {
    console.warn(
      `${logPrefix} failed to deliver event:`,
      fetchErr instanceof Error ? fetchErr.message : fetchErr
    );
  }
}
function makeCaptureSilentError({ runtime, platform, logPrefix }) {
  const runtimeCfg = { runtime, platform };
  return function captureSilentError2(err, opts) {
    if (!_envelopeUrl || !_key) return Promise.resolve();
    const promise = deliver(buildEnvelope(err, opts, runtimeCfg), logPrefix);
    if (opts?.ctx && typeof opts.ctx.waitUntil === "function") {
      opts.ctx.waitUntil(promise);
    } else {
      promise.catch(() => {
      });
    }
    return promise;
  };
}

// api/_sentry-edge.js
var captureSilentError = makeCaptureSilentError({
  runtime: "edge",
  platform: "javascript",
  logPrefix: "[sentry-edge]"
});

// server/_shared/entitlement-check.ts
init_redis();
var ENDPOINT_ENTITLEMENTS = {
  "/api/forecast/v1/trigger-simulation": 1,
  "/api/intelligence/v1/classify-event": 1,
  "/api/intelligence/v1/get-country-intel-brief": 1,
  "/api/intelligence/v1/search-intel-history": 1,
  "/api/intelligence/v1/get-intel-timeline": 1,
  "/api/intelligence/v1/get-similar-events": 1,
  "/api/market/v1/analyze-stock": 1,
  "/api/market/v1/get-stock-analysis-history": 1,
  "/api/market/v1/backtest-stock": 1,
  "/api/market/v1/list-stored-stock-backtests": 1,
  "/api/economic/v1/list-global-tenders": 1,
  "/api/sanctions/v1/list-sanctions-pressure": 1,
  "/api/scenario/v1/run-scenario": 1,
  "/api/scenario/v1/get-scenario-status": 1,
  "/api/supply-chain/v1/get-country-chokepoint-index": 1,
  "/api/supply-chain/v1/get-bypass-options": 1,
  "/api/supply-chain/v1/get-country-cost-shock": 1,
  "/api/supply-chain/v1/get-route-explorer-lane": 1,
  "/api/supply-chain/v1/get-route-impact": 1,
  "/api/supply-chain/v1/get-country-products": 1,
  "/api/supply-chain/v1/get-multi-sector-cost-shock": 1,
  "/api/supply-chain/v1/get-sector-dependency": 1,
  "/api/trade/v1/list-comtrade-flows": 1,
  "/api/trade/v1/get-tariff-trends": 1,
  "/api/resilience/v1/get-food-stocks": 1
};
var CONVEX_INTERNAL_ENTITLEMENTS_PATH = "/api/internal-entitlements";
var _didWarnMissingConvexSharedSecret = false;
var _didWarnMissingConvexSiteUrl = false;
function getConvexSharedSecret() {
  const secret = process.env.CONVEX_SERVER_SHARED_SECRET ?? "";
  if (!secret && !_didWarnMissingConvexSharedSecret) {
    _didWarnMissingConvexSharedSecret = true;
    console.warn("[entitlement-check] CONVEX_SERVER_SHARED_SECRET not set; Convex fallback disabled");
  }
  return secret;
}
function getConvexSiteUrl() {
  const siteUrl = process.env.CONVEX_SITE_URL ?? "";
  if (!siteUrl && !_didWarnMissingConvexSiteUrl) {
    _didWarnMissingConvexSiteUrl = true;
    console.warn("[entitlement-check] CONVEX_SITE_URL not set; Convex fallback disabled");
  }
  return siteUrl;
}
var _inFlight = /* @__PURE__ */ new Map();
var UNAVAILABLE_NEGATIVE_CACHE_TTL_MS = 3e3;
var UNAVAILABLE_NEGATIVE_CACHE_MAX_ENTRIES = 1e3;
var _unavailableUntil = /* @__PURE__ */ new Map();
function rememberVerificationUnavailable(userId, retryAfterSeconds) {
  const now = Date.now();
  if (_unavailableUntil.size >= UNAVAILABLE_NEGATIVE_CACHE_MAX_ENTRIES) {
    for (const [key, entry] of _unavailableUntil) {
      if (entry.expiresAt <= now) _unavailableUntil.delete(key);
    }
    while (_unavailableUntil.size >= UNAVAILABLE_NEGATIVE_CACHE_MAX_ENTRIES) {
      const oldest = _unavailableUntil.keys().next();
      if (oldest.done) break;
      _unavailableUntil.delete(oldest.value);
    }
  }
  _unavailableUntil.set(userId, {
    expiresAt: now + UNAVAILABLE_NEGATIVE_CACHE_TTL_MS,
    retryAfterSeconds
  });
}
var ENV_PREFIX = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live" : "test";
var ENTITLEMENT_CACHE_TTL_SECONDS = 900;
var LAPSED_BILLING_MARKER_TTL_SECONDS = 60;
var NOT_APPLICABLE_VERIFICATION_TTL_SECONDS = 60;
function isEntitlementBackendConfigured() {
  return Boolean(process.env.CONVEX_SITE_URL && getConvexSharedSecret());
}
function clampRetryAfterSeconds(raw) {
  return Number.isFinite(raw) ? Math.max(1, Math.min(60, Math.ceil(raw))) : 5;
}
function isBillingVerificationStatus(value) {
  return value === "subscription_lapsed" || value === "renewal_verification_pending" || value === "renewal_verification_failed";
}
function billingMarkerTtlSeconds(entitlements) {
  if (!isBillingVerificationStatus(entitlements.billingStatus)) return null;
  if (entitlements.billingStatus === "subscription_lapsed") {
    return LAPSED_BILLING_MARKER_TTL_SECONDS;
  }
  return clampRetryAfterSeconds(entitlements.retryAfterSeconds);
}
function notApplicableVerificationTtlSeconds(entitlements) {
  const marker = entitlements.renewalVerificationFreshness;
  if (marker?.status !== "not_applicable" || !Number.isFinite(marker.checkedAt)) {
    return null;
  }
  const remainingMs = marker.checkedAt + NOT_APPLICABLE_VERIFICATION_TTL_SECONDS * 1e3 - Date.now();
  return remainingMs > 0 ? Math.max(1, Math.min(
    NOT_APPLICABLE_VERIFICATION_TTL_SECONDS,
    Math.ceil(remainingMs / 1e3)
  )) : null;
}
function entitlementMarkerTtlSeconds(entitlements) {
  return billingMarkerTtlSeconds(entitlements) ?? notApplicableVerificationTtlSeconds(entitlements);
}
function getRequiredTier(pathname) {
  return ENDPOINT_ENTITLEMENTS[pathname] ?? null;
}
var TIER_GATED_PATHS = new Set(Object.keys(ENDPOINT_ENTITLEMENTS));
async function getEntitlements(userId) {
  const unavailable = _unavailableUntil.get(userId);
  if (unavailable !== void 0) {
    if (unavailable.expiresAt > Date.now()) {
      return unavailableEntitlements(unavailable.retryAfterSeconds);
    }
    _unavailableUntil.delete(userId);
  }
  const existing = _inFlight.get(userId);
  if (existing) return existing;
  const promise = _getEntitlementsImpl(userId);
  _inFlight.set(userId, promise);
  try {
    const result = await promise;
    if (result?.verificationUnavailable) {
      rememberVerificationUnavailable(userId, result.retryAfterSeconds);
    }
    return result;
  } finally {
    _inFlight.delete(userId);
  }
}
function unavailableEntitlements(retryAfterSeconds) {
  return {
    planKey: "free",
    features: {
      tier: 0,
      apiAccess: false,
      apiRateLimit: 0,
      maxDashboards: 3,
      prioritySupport: false,
      exportFormats: ["csv"],
      mcpAccess: false
    },
    validUntil: 0,
    verificationUnavailable: true,
    ...retryAfterSeconds === void 0 ? {} : { retryAfterSeconds }
  };
}
function parseRetryAfterSeconds(header) {
  if (!header) return void 0;
  const seconds = Number(header.trim());
  return Number.isFinite(seconds) && seconds > 0 ? seconds : void 0;
}
async function _getEntitlementsImpl(userId) {
  try {
    const cached = await getCachedJson(`entitlements:${ENV_PREFIX}:${userId}`, true);
    if (cached && typeof cached === "object") {
      const ent = cached;
      if (entitlementMarkerTtlSeconds(ent) !== null) return ent;
      if (ent.validUntil >= Date.now() && typeof ent.features.mcpAccess === "boolean" && ent.features.planLimits?.dashboardAiCallsPerDay !== void 0) {
        return ent;
      }
    }
    const convexSiteUrl = getConvexSiteUrl();
    const convexSharedSecret = getConvexSharedSecret();
    if (!convexSiteUrl || !convexSharedSecret) return null;
    const response = await fetch(`${convexSiteUrl}${CONVEX_INTERNAL_ENTITLEMENTS_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor-gateway/1.0",
        "x-convex-shared-secret": convexSharedSecret
      },
      body: JSON.stringify({ userId }),
      signal: AbortSignal.timeout(3e3)
    });
    if (!response.ok) {
      return unavailableEntitlements(
        response.status === 429 ? parseRetryAfterSeconds(response.headers.get("Retry-After")) : void 0
      );
    }
    const result = await response.json();
    if (result) {
      try {
        await setCachedJson(
          `entitlements:${ENV_PREFIX}:${userId}`,
          result,
          entitlementMarkerTtlSeconds(result) ?? ENTITLEMENT_CACHE_TTL_SECONDS,
          true
        );
      } catch (cacheErr) {
        console.warn("[entitlement-check] cache write failed (non-fatal):", cacheErr instanceof Error ? cacheErr.message : String(cacheErr));
      }
      return result;
    }
    return null;
  } catch (err) {
    console.warn("[entitlement-check] getEntitlements failed:", err instanceof Error ? err.message : String(err));
    return unavailableEntitlements();
  }
}
function isBillingVerificationCode(value) {
  return value === "entitlement_verification_unavailable" || isBillingVerificationStatus(value);
}
function unverifiableEntitlementDenial(retryAfterSeconds) {
  return {
    retryable: true,
    code: "entitlement_verification_unavailable",
    retryAfterSeconds: clampRetryAfterSeconds(retryAfterSeconds),
    message: "Unable to verify API access",
    status: 503
  };
}
function classifyBillingVerification(entitlements) {
  if (entitlements?.verificationUnavailable) {
    return unverifiableEntitlementDenial(entitlements.retryAfterSeconds);
  }
  const status = entitlements?.billingStatus;
  if (!isBillingVerificationStatus(status)) return null;
  if (status === "subscription_lapsed") {
    return {
      retryable: false,
      code: status,
      retryAfterSeconds: 0,
      message: "Subscription lapsed",
      status: 403
    };
  }
  return {
    retryable: true,
    code: status,
    retryAfterSeconds: clampRetryAfterSeconds(entitlements?.retryAfterSeconds),
    message: status === "renewal_verification_pending" ? "Renewal verification pending" : "Renewal verification failed",
    status: 503
  };
}
function getBillingVerificationDenial(entitlements, corsHeaders, requiredTier) {
  const denial = classifyBillingVerification(entitlements);
  return denial ? renderBillingVerificationDenial(denial, corsHeaders, requiredTier) : null;
}
function renderBillingVerificationDenial(denial, corsHeaders, requiredTier) {
  return new Response(
    JSON.stringify({
      error: denial.message,
      code: denial.code,
      ...requiredTier == null ? {} : { requiredTier }
    }),
    {
      status: denial.status,
      headers: {
        // corsHeaders FIRST: the contract headers below are this function's own
        // output and must win. The pre-#5622 version was inconsistent about it
        // (a corsHeaders map could clobber X-Billing-Verification but not
        // Retry-After); no cors helper in the repo emits either name, so this is
        // inert today and pinned by test so it stays that way.
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Billing-Verification": denial.code,
        // Terminal denials carry no Retry-After — advertising one would invite
        // a lapsed subscriber into an infinite retry instead of a resubscribe.
        ...denial.retryable ? { "Retry-After": String(denial.retryAfterSeconds) } : {}
      }
    }
  );
}
async function checkEntitlementDetailed(userId, pathname, corsHeaders, options = {}) {
  const requiredTier = getRequiredTier(pathname);
  if (requiredTier === null) {
    return { response: null, entitlements: null };
  }
  if (!userId) {
    return {
      response: new Response(
        JSON.stringify({ error: "Authentication required", requiredTier }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      ),
      entitlements: null
    };
  }
  if (options.clerkRole === "pro" && requiredTier <= 1) {
    return { response: null, entitlements: null };
  }
  const ent = await getEntitlements(userId);
  if (!ent) {
    if (!isEntitlementBackendConfigured()) {
      return {
        response: renderBillingVerificationDenial(
          unverifiableEntitlementDenial(),
          corsHeaders,
          requiredTier
        ),
        entitlements: null
      };
    }
    return {
      response: new Response(
        JSON.stringify({ error: "Unable to verify entitlements", requiredTier }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      ),
      entitlements: null
    };
  }
  if (ent.features.tier >= requiredTier && ent.validUntil >= Date.now()) {
    return { response: null, entitlements: ent };
  }
  const billingDenial = getBillingVerificationDenial(ent, corsHeaders, requiredTier);
  if (billingDenial) {
    return { response: billingDenial, entitlements: ent };
  }
  return {
    response: new Response(
      JSON.stringify({
        error: "Upgrade required",
        requiredTier,
        currentTier: ent.features.tier,
        planKey: ent.planKey
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    ),
    entitlements: ent
  };
}

// server/error-mapper.ts
function isNetworkError(error) {
  if (!(error instanceof TypeError)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("fetch") || msg.includes("network") || msg.includes("connect") || msg.includes("econnrefused") || msg.includes("enotfound") || msg.includes("socket");
}
function jsonMessageResponse(message2, status, extras, headers) {
  return new Response(JSON.stringify({ message: message2, ...extras ?? {} }), {
    status,
    headers: { "Content-Type": "application/json", ...headers ?? {} }
  });
}
function mapErrorToResponse(error, _req) {
  if (error instanceof Error && "statusCode" in error) {
    const statusCode = error.statusCode;
    const retryAfter = (statusCode === 429 || statusCode === 503) && "retryAfter" in error ? Number(error.retryAfter) : null;
    const billingCodeCandidate = "billingVerificationCode" in error ? error.billingVerificationCode : null;
    const billingVerificationCode = isBillingVerificationCode(billingCodeCandidate) ? billingCodeCandidate : null;
    const exposesRetryableUnavailable = statusCode === 503 && retryAfter != null && Number.isFinite(retryAfter) && error.exposeMessage === true;
    const message2 = statusCode >= 400 && statusCode < 500 || exposesRetryableUnavailable ? error.message : "Internal server error";
    const extras = {};
    const headers = {};
    if (retryAfter != null && Number.isFinite(retryAfter)) {
      extras.retryAfter = retryAfter;
      headers["Retry-After"] = String(retryAfter);
    }
    if (billingVerificationCode) {
      extras.code = billingVerificationCode;
      headers["X-Billing-Verification"] = billingVerificationCode;
    }
    if (statusCode >= 500) {
      const apiBody = "body" in error ? String(error.body).slice(0, 500) : "";
      console.error(`[error-mapper] ${statusCode}:`, error.message, apiBody ? `| body: ${apiBody}` : "");
    }
    return jsonMessageResponse(
      message2,
      statusCode,
      Object.keys(extras).length > 0 ? extras : void 0,
      Object.keys(headers).length > 0 ? headers : void 0
    );
  }
  if (error instanceof SyntaxError) {
    return jsonMessageResponse("Invalid request body", 400);
  }
  if (isNetworkError(error)) {
    console.error("[error-mapper] Network error (502):", error.message);
    return jsonMessageResponse("Upstream unavailable", 502);
  }
  console.error("[error-mapper] Unhandled error:", error instanceof Error ? error.message : error);
  return jsonMessageResponse("Internal server error", 500);
}

// server/_shared/rate-limit.ts
var import_ratelimit = __toESM(require_dist2(), 1);

// node_modules/uncrypto/dist/crypto.node.mjs
import nodeCrypto from "node:crypto";
var subtle = nodeCrypto.webcrypto?.subtle || {};

// node_modules/@upstash/redis/chunk-IH7W44G6.mjs
var __defProp2 = Object.defineProperty;
var __export2 = (target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
};
var error_exports = {};
__export2(error_exports, {
  UpstashError: () => UpstashError,
  UpstashJSONParseError: () => UpstashJSONParseError,
  UrlError: () => UrlError
});
var UpstashError = class extends Error {
  constructor(message2, options) {
    super(message2, options);
    this.name = "UpstashError";
  }
};
var UrlError = class extends Error {
  constructor(url) {
    super(
      `Upstash Redis client was passed an invalid URL. You should pass a URL starting with https. Received: "${url}". `
    );
    this.name = "UrlError";
  }
};
var UpstashJSONParseError = class extends UpstashError {
  constructor(body, options) {
    const truncatedBody = body.length > 200 ? body.slice(0, 200) + "..." : body;
    super(`Unable to parse response body: ${truncatedBody}`, options);
    this.name = "UpstashJSONParseError";
  }
};
function parseRecursive(obj) {
  const parsed = Array.isArray(obj) ? obj.map((o) => {
    try {
      return parseRecursive(o);
    } catch {
      return o;
    }
  }) : JSON.parse(obj);
  if (typeof parsed === "number" && parsed.toString() !== obj) {
    return obj;
  }
  return parsed;
}
function parseResponse(result) {
  try {
    return parseRecursive(result);
  } catch {
    return result;
  }
}
function deserializeScanResponse(result) {
  return [result[0], ...parseResponse(result.slice(1))];
}
function deserializeScanWithTypesResponse(result) {
  const [cursor, keys] = result;
  const parsedKeys = [];
  for (let i = 0; i < keys.length; i += 2) {
    parsedKeys.push({ key: keys[i], type: keys[i + 1] });
  }
  return [cursor, parsedKeys];
}
function mergeHeaders(...headers) {
  const merged = {};
  for (const header of headers) {
    if (!header) continue;
    for (const [key, value] of Object.entries(header)) {
      if (value !== void 0 && value !== null) {
        merged[key] = value;
      }
    }
  }
  return merged;
}
function kvArrayToObject(v) {
  if (typeof v === "object" && v !== null && !Array.isArray(v)) return v;
  if (!Array.isArray(v)) return {};
  const obj = {};
  for (let i = 0; i < v.length; i += 2) {
    if (typeof v[i] === "string") obj[v[i]] = v[i + 1];
  }
  return obj;
}
var MAX_BUFFER_SIZE = 1024 * 1024;
var HttpClient = class {
  baseUrl;
  headers;
  options;
  readYourWrites;
  upstashSyncToken = "";
  hasCredentials;
  retry;
  constructor(config2) {
    this.options = {
      backend: config2.options?.backend,
      agent: config2.agent,
      responseEncoding: config2.responseEncoding ?? "base64",
      // default to base64
      cache: config2.cache,
      signal: config2.signal,
      keepAlive: config2.keepAlive ?? true
    };
    this.upstashSyncToken = "";
    this.readYourWrites = config2.readYourWrites ?? true;
    this.baseUrl = (config2.baseUrl || "").replace(/\/$/, "");
    const urlRegex = /^https?:\/\/[^\s#$./?].\S*$/;
    if (this.baseUrl && !urlRegex.test(this.baseUrl)) {
      throw new UrlError(this.baseUrl);
    }
    this.headers = {
      "Content-Type": "application/json",
      ...config2.headers
    };
    this.hasCredentials = Boolean(this.baseUrl && this.headers.authorization.split(" ")[1]);
    if (this.options.responseEncoding === "base64") {
      this.headers["Upstash-Encoding"] = "base64";
    }
    this.retry = typeof config2.retry === "boolean" && !config2.retry ? {
      attempts: 1,
      backoff: () => 0
    } : {
      attempts: config2.retry?.retries ?? 5,
      backoff: config2.retry?.backoff ?? ((retryCount) => Math.exp(retryCount) * 50)
    };
  }
  mergeTelemetry(telemetry) {
    this.headers = merge(this.headers, "Upstash-Telemetry-Runtime", telemetry.runtime);
    this.headers = merge(this.headers, "Upstash-Telemetry-Platform", telemetry.platform);
    this.headers = merge(this.headers, "Upstash-Telemetry-Sdk", telemetry.sdk);
  }
  async request(req) {
    const requestHeaders = mergeHeaders(this.headers, req.headers ?? {});
    const requestUrl = [this.baseUrl, ...req.path ?? []].join("/");
    const isEventStream = requestHeaders.Accept === "text/event-stream";
    const signal = req.signal ?? this.options.signal;
    const isSignalFunction = typeof signal === "function";
    const requestOptions = {
      cache: this.options.cache,
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(req.body),
      keepalive: this.options.keepAlive,
      agent: this.options.agent,
      signal: isSignalFunction ? signal() : signal,
      /**
       * Fastly specific
       */
      backend: this.options.backend
    };
    if (!this.hasCredentials) {
      console.warn(
        "[Upstash Redis] Redis client was initialized without url or token. Failed to execute command."
      );
    }
    if (this.readYourWrites) {
      const newHeader = this.upstashSyncToken;
      this.headers["upstash-sync-token"] = newHeader;
    }
    let res = null;
    let error = null;
    for (let i = 0; i <= this.retry.attempts; i++) {
      try {
        res = await fetch(requestUrl, requestOptions);
        break;
      } catch (error_) {
        if (requestOptions.signal?.aborted && isSignalFunction) {
          throw error_;
        } else if (requestOptions.signal?.aborted) {
          const myBlob = new Blob([
            JSON.stringify({ result: requestOptions.signal.reason ?? "Aborted" })
          ]);
          const myOptions = {
            status: 200,
            statusText: requestOptions.signal.reason ?? "Aborted"
          };
          res = new Response(myBlob, myOptions);
          break;
        }
        error = error_;
        if (i < this.retry.attempts) {
          await new Promise((r) => setTimeout(r, this.retry.backoff(i)));
        }
      }
    }
    if (!res) {
      throw error ?? new Error("Exhausted all retries");
    }
    if (!res.ok) {
      let body2;
      const rawBody2 = await res.text();
      try {
        body2 = JSON.parse(rawBody2);
      } catch (error2) {
        throw new UpstashJSONParseError(rawBody2, { cause: error2 });
      }
      throw new UpstashError(`${body2.error}, command was: ${JSON.stringify(req.body)}`);
    }
    if (this.readYourWrites) {
      const headers = res.headers;
      this.upstashSyncToken = headers.get("upstash-sync-token") ?? "";
    }
    if (isEventStream && req && req.onMessage && res.body) {
      const reader = res.body.getReader();
      const decoder2 = new TextDecoder();
      (async () => {
        try {
          let buffer = "";
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder2.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            if (buffer.length > MAX_BUFFER_SIZE) {
              throw new Error("Buffer size exceeded (1MB)");
            }
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                req.onMessage?.(data);
              }
            }
          }
        } catch (error2) {
          if (error2 instanceof Error && error2.name === "AbortError") {
          } else {
            console.error("Stream reading error:", error2);
          }
        } finally {
          try {
            await reader.cancel();
          } catch {
          }
        }
      })();
      return { result: 1 };
    }
    let body;
    const rawBody = await res.text();
    try {
      body = JSON.parse(rawBody);
    } catch (error2) {
      throw new UpstashJSONParseError(rawBody, { cause: error2 });
    }
    if (this.readYourWrites) {
      const headers = res.headers;
      this.upstashSyncToken = headers.get("upstash-sync-token") ?? "";
    }
    if (this.options.responseEncoding === "base64") {
      if (Array.isArray(body)) {
        return body.map(({ result: result2, error: error2 }) => ({
          result: decode(result2),
          error: error2
        }));
      }
      const result = decode(body.result);
      return { result, error: body.error };
    }
    return body;
  }
};
function base64decode(b64) {
  let dec = "";
  try {
    const binString = atob(b64);
    const size = binString.length;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    dec = new TextDecoder().decode(bytes);
  } catch {
    dec = b64;
  }
  return dec;
}
function decode(raw) {
  let result = void 0;
  switch (typeof raw) {
    case "undefined": {
      return raw;
    }
    case "number": {
      result = raw;
      break;
    }
    case "object": {
      if (Array.isArray(raw)) {
        result = raw.map(
          (v) => typeof v === "string" ? base64decode(v) : Array.isArray(v) ? v.map((element) => decode(element)) : v
        );
      } else {
        result = null;
      }
      break;
    }
    case "string": {
      result = raw === "OK" ? "OK" : base64decode(raw);
      break;
    }
    default: {
      break;
    }
  }
  return result;
}
function merge(obj, key, value) {
  if (!value) {
    return obj;
  }
  obj[key] = obj[key] ? [obj[key], value].join(",") : value;
  return obj;
}
var defaultSerializer = (c) => {
  switch (typeof c) {
    case "string":
    case "number":
    case "boolean": {
      return c;
    }
    default: {
      return JSON.stringify(c);
    }
  }
};
var Command = class {
  command;
  serialize;
  deserialize;
  headers;
  path;
  onMessage;
  isStreaming;
  signal;
  /**
   * Create a new command instance.
   *
   * You can define a custom `deserialize` function. By default we try to deserialize as json.
   */
  constructor(command, opts) {
    this.serialize = defaultSerializer;
    this.deserialize = opts?.automaticDeserialization === void 0 || opts.automaticDeserialization ? opts?.deserialize ?? parseResponse : (x) => x;
    this.command = command.map((c) => this.serialize(c));
    this.headers = opts?.headers;
    this.path = opts?.path;
    this.onMessage = opts?.streamOptions?.onMessage;
    this.isStreaming = opts?.streamOptions?.isStreaming ?? false;
    this.signal = opts?.streamOptions?.signal;
    if (opts?.latencyLogging) {
      const originalExec = this.exec.bind(this);
      this.exec = async (client) => {
        const start = performance.now();
        const result = await originalExec(client);
        const end = performance.now();
        const loggerResult = (end - start).toFixed(2);
        console.log(
          `Latency for \x1B[38;2;19;185;39m${this.command[0].toString().toUpperCase()}\x1B[0m: \x1B[38;2;0;255;255m${loggerResult} ms\x1B[0m`
        );
        return result;
      };
    }
  }
  /**
   * Execute the command using a client.
   */
  async exec(client) {
    const { result, error } = await client.request({
      body: this.command,
      path: this.path,
      upstashSyncToken: client.upstashSyncToken,
      headers: this.headers,
      onMessage: this.onMessage,
      isStreaming: this.isStreaming,
      signal: this.signal
    });
    if (error) {
      throw new UpstashError(error);
    }
    if (result === void 0) {
      throw new TypeError("Request did not return a result");
    }
    return this.deserialize(result);
  }
};
var ExecCommand = class extends Command {
  constructor(cmd, opts) {
    const normalizedCmd = cmd.map((arg) => typeof arg === "string" ? arg : String(arg));
    super(normalizedCmd, opts);
  }
};
var FIELD_TYPES = [
  "TEXT",
  "U64",
  "I64",
  "F64",
  "BOOL",
  "DATE",
  "KEYWORD",
  "FACET"
];
function isFieldType(value) {
  return typeof value === "string" && FIELD_TYPES.includes(value);
}
function isDetailedField(value) {
  return typeof value === "object" && value !== null && "type" in value && isFieldType(value.type);
}
function isNestedSchema(value) {
  return typeof value === "object" && value !== null && !isDetailedField(value);
}
function flattenSchema(schema, pathPrefix = []) {
  const fields = [];
  for (const [key, value] of Object.entries(schema)) {
    const currentPath = [...pathPrefix, key];
    const pathString = currentPath.join(".");
    if (isFieldType(value)) {
      fields.push({
        path: pathString,
        type: value
      });
    } else if (isDetailedField(value)) {
      fields.push({
        path: pathString,
        type: value.type,
        fast: "fast" in value ? value.fast : void 0,
        noTokenize: "noTokenize" in value ? value.noTokenize : void 0,
        noStem: "noStem" in value ? value.noStem : void 0,
        from: "from" in value ? value.from : void 0
      });
    } else if (isNestedSchema(value)) {
      const nestedFields = flattenSchema(value, currentPath);
      fields.push(...nestedFields);
    }
  }
  return fields;
}
function deserializeQueryResponse(rawResponse) {
  return rawResponse.map((itemRaw) => {
    const raw = itemRaw;
    const key = raw[0];
    const score = Number(raw[1]);
    const rawFields = raw[2];
    if (rawFields === void 0) {
      return { key, score };
    }
    if (!Array.isArray(rawFields) || rawFields.length === 0) {
      return { key, score, data: {} };
    }
    let data = {};
    for (const fieldRaw of rawFields) {
      const key2 = fieldRaw[0];
      const value = fieldRaw[1];
      const pathParts = key2.split(".");
      if (pathParts.length === 1) {
        data[key2] = value;
      } else {
        let currentObj = data;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const pathPart = pathParts[i];
          if (!(pathPart in currentObj)) {
            currentObj[pathPart] = {};
          }
          currentObj = currentObj[pathPart];
        }
        currentObj[pathParts.at(-1)] = value;
      }
    }
    if ("$" in data) {
      data = data["$"];
    }
    return { key, score, data };
  });
}
function deserializeDescribeResponse(rawResponse) {
  const description = {};
  for (let i = 0; i < rawResponse.length; i += 2) {
    const descriptor = rawResponse[i];
    switch (descriptor) {
      case "name": {
        description["name"] = rawResponse[i + 1];
        break;
      }
      case "type": {
        description["dataType"] = rawResponse[i + 1].toLowerCase();
        break;
      }
      case "prefixes": {
        description["prefixes"] = rawResponse[i + 1];
        break;
      }
      case "language": {
        description["language"] = rawResponse[i + 1];
        break;
      }
      case "schema": {
        const schema = {};
        for (const fieldDescription of rawResponse[i + 1]) {
          const fieldName = fieldDescription[0];
          const fieldInfo = { type: fieldDescription[1] };
          if (fieldDescription.length > 2) {
            for (let j = 2; j < fieldDescription.length; j++) {
              const fieldOption = fieldDescription[j];
              switch (fieldOption) {
                case "NOSTEM": {
                  fieldInfo.noStem = true;
                  break;
                }
                case "NOTOKENIZE": {
                  fieldInfo.noTokenize = true;
                  break;
                }
                case "FAST": {
                  fieldInfo.fast = true;
                  break;
                }
                case "FROM": {
                  fieldInfo.from = fieldDescription[++j];
                  break;
                }
              }
            }
          }
          schema[fieldName] = fieldInfo;
        }
        description["schema"] = schema;
        break;
      }
    }
  }
  return description;
}
function parseCountResponse(rawResponse) {
  return typeof rawResponse === "number" ? rawResponse : Number.parseInt(rawResponse, 10);
}
function deserializeAggregateResponse(rawResponse) {
  return parseAggregationArray(rawResponse);
}
function parseAggregationArray(arr) {
  const result = {};
  for (let i = 0; i < arr.length; i += 2) {
    const key = arr[i];
    const value = arr[i + 1];
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "string") {
        result[key] = value[0] === "buckets" ? parseBucketsValue(value) : parseStatsValue(value);
      } else {
        result[key] = parseAggregationArray(value);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}
function coerceNumericString(value) {
  if (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}
function parseStatsValue(arr) {
  const result = {};
  for (let i = 0; i < arr.length; i += 2) {
    const key = arr[i];
    const value = arr[i + 1];
    if (Array.isArray(value) && value.length > 0) {
      if (typeof value[0] === "string") {
        result[key] = parseStatsValue(value);
      } else if (Array.isArray(value[0]) && typeof value[0][0] === "string") {
        result[key] = value.map((item) => parseStatsValue(item));
      } else {
        result[key] = value;
      }
    } else {
      result[key] = coerceNumericString(value);
    }
  }
  return result;
}
function parseBucketsValue(arr) {
  if (arr[0] === "buckets" && Array.isArray(arr[1])) {
    const result = {
      buckets: arr[1].map((bucket) => {
        const bucketObj = {};
        for (let i = 0; i < bucket.length; i += 2) {
          const key = bucket[i];
          const value = bucket[i + 1];
          bucketObj[key] = Array.isArray(value) && value.length > 0 && typeof value[0] === "string" ? parseStatsValue(value) : value;
        }
        return bucketObj;
      })
    };
    for (let i = 2; i < arr.length; i += 2) {
      result[arr[i]] = arr[i + 1];
    }
    return result;
  }
  return arr;
}
function buildQueryCommand(redisCommand, name, options) {
  const query = JSON.stringify(options?.filter ?? {});
  const command = [redisCommand, name, query];
  if (options?.limit !== void 0) {
    command.push("LIMIT", options.limit.toString());
  }
  if (options?.offset !== void 0) {
    command.push("OFFSET", options.offset.toString());
  }
  if (options?.select && Object.keys(options.select).length === 0) {
    command.push("NOCONTENT");
  }
  if (options) {
    if ("orderBy" in options && options.orderBy) {
      command.push("ORDERBY");
      for (const [field, direction] of Object.entries(options.orderBy)) {
        command.push(field, direction);
      }
    } else if ("scoreFunc" in options && options.scoreFunc) {
      command.push("SCOREFUNC", ...buildScoreFunc(options.scoreFunc));
    }
  }
  if (options?.highlight) {
    command.push(
      "HIGHLIGHT",
      "FIELDS",
      options.highlight.fields.length.toString(),
      ...options.highlight.fields
    );
    if (options.highlight.preTag && options.highlight.postTag) {
      command.push("TAGS", options.highlight.preTag, options.highlight.postTag);
    }
  }
  if (options?.select && Object.keys(options.select).length > 0) {
    command.push(
      "SELECT",
      Object.keys(options.select).length.toString(),
      ...Object.keys(options.select)
    );
  }
  return command;
}
function buildScoreFunc(scoreBy) {
  const result = [];
  if (typeof scoreBy === "string") {
    result.push("FIELDVALUE", scoreBy);
  } else if ("fields" in scoreBy) {
    if (scoreBy.combineMode) {
      result.push("COMBINEMODE", scoreBy.combineMode.toUpperCase());
    }
    if (scoreBy.scoreMode) {
      result.push("SCOREMODE", scoreBy.scoreMode.toUpperCase());
    }
    for (const field of scoreBy.fields) {
      result.push(...buildScoreFuncField(field));
    }
  } else {
    result.push(...buildScoreFuncField(scoreBy));
  }
  return result;
}
function buildScoreFuncField(field) {
  const result = [];
  if (typeof field === "string") {
    result.push("FIELDVALUE", field);
  } else {
    if (field.scoreMode) {
      result.push("SCOREMODE", field.scoreMode.toUpperCase());
    }
    result.push("FIELDVALUE", field.field);
    if (field.modifier) {
      result.push("MODIFIER", field.modifier.toUpperCase());
    }
    if (field.factor !== void 0) {
      result.push("FACTOR", field.factor.toString());
    }
    if (field.missing !== void 0) {
      result.push("MISSING", field.missing.toString());
    }
  }
  return result;
}
function buildCreateIndexCommand(params) {
  const { name, schema, dataType, prefix, language, skipInitialScan, existsOk } = params;
  const prefixArray = Array.isArray(prefix) ? prefix : [prefix];
  const payload = [
    name,
    ...skipInitialScan ? ["SKIPINITIALSCAN"] : [],
    ...existsOk ? ["EXISTSOK"] : [],
    "ON",
    dataType.toUpperCase(),
    "PREFIX",
    prefixArray.length.toString(),
    ...prefixArray,
    ...language ? ["LANGUAGE", language] : [],
    "SCHEMA"
  ];
  const fields = flattenSchema(schema);
  for (const field of fields) {
    payload.push(field.path, field.type);
    if (field.fast) {
      payload.push("FAST");
    }
    if (field.noTokenize) {
      payload.push("NOTOKENIZE");
    }
    if (field.noStem) {
      payload.push("NOSTEM");
    }
    if (field.from) {
      payload.push("FROM", field.from);
    }
  }
  return ["SEARCH.CREATE", ...payload];
}
function buildAggregateCommand(name, options) {
  const query = JSON.stringify(options?.filter ?? {});
  const aggregations = JSON.stringify(options.aggregations);
  return ["SEARCH.AGGREGATE", name, query, aggregations];
}
var SearchIndex = class {
  name;
  schema;
  client;
  constructor({ name, schema, client }) {
    this.name = name;
    this.schema = schema;
    this.client = client;
  }
  async waitIndexing() {
    const command = ["SEARCH.WAITINDEXING", this.name];
    return await new ExecCommand(command).exec(this.client);
  }
  async describe() {
    const command = ["SEARCH.DESCRIBE", this.name];
    const rawResult = await new ExecCommand(command).exec(
      this.client
    );
    if (!rawResult) return null;
    return deserializeDescribeResponse(rawResult);
  }
  async query(options) {
    const command = buildQueryCommand("SEARCH.QUERY", this.name, options);
    const rawResult = await new ExecCommand(command).exec(
      this.client
    );
    if (!rawResult) return rawResult;
    return deserializeQueryResponse(rawResult);
  }
  async aggregate(options) {
    const command = buildAggregateCommand(this.name, options);
    const rawResult = await new ExecCommand(
      command
    ).exec(this.client);
    return deserializeAggregateResponse(rawResult);
  }
  async count({ filter }) {
    const command = buildQueryCommand("SEARCH.COUNT", this.name, { filter });
    const rawResult = await new ExecCommand(command).exec(
      this.client
    );
    return { count: parseCountResponse(rawResult) };
  }
  async drop() {
    const command = ["SEARCH.DROP", this.name];
    const result = await new ExecCommand(command).exec(this.client);
    return result;
  }
  async addAlias({ alias }) {
    const command = ["SEARCH.ALIASADD", alias, this.name];
    const result = await new ExecCommand(command).exec(this.client);
    return result;
  }
};
async function createIndex(client, params) {
  const { name, schema } = params;
  const createIndexCommand = buildCreateIndexCommand(params);
  await new ExecCommand(createIndexCommand).exec(client);
  return initIndex(client, { name, schema });
}
function initIndex(client, params) {
  const { name, schema } = params;
  return new SearchIndex({ name, schema, client });
}
async function listAliases(client) {
  const command = ["SEARCH.LISTALIASES"];
  const rawResult = await new ExecCommand(command).exec(client);
  if (rawResult === 0 || Array.isArray(rawResult) && rawResult.length === 0) {
    return {};
  }
  if (!Array.isArray(rawResult)) {
    return {};
  }
  const aliases = {};
  for (const pair of rawResult) {
    if (Array.isArray(pair) && pair.length === 2) {
      const [alias, index] = pair;
      aliases[alias] = index;
    }
  }
  return aliases;
}
async function addAlias(client, { indexName, alias }) {
  const command = ["SEARCH.ALIASADD", alias, indexName];
  const result = await new ExecCommand(command).exec(client);
  return result;
}
async function delAlias(client, { alias }) {
  const command = ["SEARCH.ALIASDEL", alias];
  const result = await new ExecCommand(command).exec(client);
  return result;
}
function deserialize(result) {
  if (result.length === 0) {
    return null;
  }
  const obj = {};
  for (let i = 0; i < result.length; i += 2) {
    const key = result[i];
    const value = result[i + 1];
    try {
      obj[key] = JSON.parse(value);
    } catch {
      obj[key] = value;
    }
  }
  return obj;
}
var HRandFieldCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["hrandfield", cmd[0]];
    if (typeof cmd[1] === "number") {
      command.push(cmd[1]);
    }
    if (cmd[2]) {
      command.push("WITHVALUES");
    }
    super(command, {
      // @ts-expect-error to silence compiler
      deserialize: cmd[2] ? (result) => deserialize(result) : opts?.deserialize,
      ...opts
    });
  }
};
var AppendCommand = class extends Command {
  constructor(cmd, opts) {
    super(["append", ...cmd], opts);
  }
};
var BitCountCommand = class extends Command {
  constructor([key, start, end], opts) {
    const command = ["bitcount", key];
    if (typeof start === "number") {
      command.push(start);
    }
    if (typeof end === "number") {
      command.push(end);
    }
    super(command, opts);
  }
};
var BitFieldCommand = class {
  constructor(args, client, opts, execOperation = (command) => command.exec(this.client)) {
    this.client = client;
    this.opts = opts;
    this.execOperation = execOperation;
    this.command = ["bitfield", ...args];
  }
  command;
  chain(...args) {
    this.command.push(...args);
    return this;
  }
  get(...args) {
    return this.chain("get", ...args);
  }
  set(...args) {
    return this.chain("set", ...args);
  }
  incrby(...args) {
    return this.chain("incrby", ...args);
  }
  overflow(overflow) {
    return this.chain("overflow", overflow);
  }
  exec() {
    const command = new Command(this.command, this.opts);
    return this.execOperation(command);
  }
};
var BitOpCommand = class extends Command {
  constructor(cmd, opts) {
    super(["bitop", ...cmd], opts);
  }
};
var BitPosCommand = class extends Command {
  constructor(cmd, opts) {
    super(["bitpos", ...cmd], opts);
  }
};
var ClientSetInfoCommand = class extends Command {
  constructor([attribute, value], opts) {
    super(["CLIENT", "SETINFO", attribute.toUpperCase(), value], opts);
  }
};
var CopyCommand = class extends Command {
  constructor([key, destinationKey, opts], commandOptions) {
    super(["COPY", key, destinationKey, ...opts?.replace ? ["REPLACE"] : []], {
      ...commandOptions,
      deserialize(result) {
        if (result > 0) {
          return "COPIED";
        }
        return "NOT_COPIED";
      }
    });
  }
};
var DBSizeCommand = class extends Command {
  constructor(opts) {
    super(["dbsize"], opts);
  }
};
var DecrCommand = class extends Command {
  constructor(cmd, opts) {
    super(["decr", ...cmd], opts);
  }
};
var DecrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["decrby", ...cmd], opts);
  }
};
var DelCommand = class extends Command {
  constructor(cmd, opts) {
    super(["del", ...cmd], opts);
  }
};
var EchoCommand = class extends Command {
  constructor(cmd, opts) {
    super(["echo", ...cmd], opts);
  }
};
var EvalROCommand = class extends Command {
  constructor([script, keys, args], opts) {
    super(["eval_ro", script, keys.length, ...keys, ...args ?? []], opts);
  }
};
var EvalCommand = class extends Command {
  constructor([script, keys, args], opts) {
    super(["eval", script, keys.length, ...keys, ...args ?? []], opts);
  }
};
var EvalshaROCommand = class extends Command {
  constructor([sha, keys, args], opts) {
    super(["evalsha_ro", sha, keys.length, ...keys, ...args ?? []], opts);
  }
};
var EvalshaCommand = class extends Command {
  constructor([sha, keys, args], opts) {
    super(["evalsha", sha, keys.length, ...keys, ...args ?? []], opts);
  }
};
var ExistsCommand = class extends Command {
  constructor(cmd, opts) {
    super(["exists", ...cmd], opts);
  }
};
var ExpireCommand = class extends Command {
  constructor(cmd, opts) {
    super(["expire", ...cmd.filter(Boolean)], opts);
  }
};
var ExpireAtCommand = class extends Command {
  constructor(cmd, opts) {
    super(["expireat", ...cmd], opts);
  }
};
var FCallCommand = class extends Command {
  constructor([functionName, keys, args], opts) {
    super(["fcall", functionName, ...keys ? [keys.length, ...keys] : [0], ...args ?? []], opts);
  }
};
var FCallRoCommand = class extends Command {
  constructor([functionName, keys, args], opts) {
    super(
      ["fcall_ro", functionName, ...keys ? [keys.length, ...keys] : [0], ...args ?? []],
      opts
    );
  }
};
var FlushAllCommand = class extends Command {
  constructor(args, opts) {
    const command = ["flushall"];
    if (args && args.length > 0 && args[0].async) {
      command.push("async");
    }
    super(command, opts);
  }
};
var FlushDBCommand = class extends Command {
  constructor([opts], cmdOpts) {
    const command = ["flushdb"];
    if (opts?.async) {
      command.push("async");
    }
    super(command, cmdOpts);
  }
};
var FunctionDeleteCommand = class extends Command {
  constructor([libraryName], opts) {
    super(["function", "delete", libraryName], opts);
  }
};
var FunctionFlushCommand = class extends Command {
  constructor(opts) {
    super(["function", "flush"], opts);
  }
};
var FunctionListCommand = class extends Command {
  constructor([args], opts) {
    const command = ["function", "list"];
    if (args?.libraryName) {
      command.push("libraryname", args.libraryName);
    }
    if (args?.withCode) {
      command.push("withcode");
    }
    super(command, { deserialize: deserialize2, ...opts });
  }
};
function deserialize2(result) {
  if (!Array.isArray(result)) return [];
  return result.map((libRaw) => {
    const lib = kvArrayToObject(libRaw);
    const functionsParsed = lib.functions.map(
      (fnRaw) => kvArrayToObject(fnRaw)
    );
    return {
      libraryName: lib.library_name,
      engine: lib.engine,
      functions: functionsParsed.map((fn) => ({
        name: fn.name,
        description: fn.description ?? void 0,
        flags: fn.flags
      })),
      libraryCode: lib.library_code
    };
  });
}
var FunctionLoadCommand = class extends Command {
  constructor([args], opts) {
    super(["function", "load", ...args.replace ? ["replace"] : [], args.code], opts);
  }
};
var FunctionStatsCommand = class extends Command {
  constructor(opts) {
    super(["function", "stats"], { deserialize: deserialize3, ...opts });
  }
};
function deserialize3(result) {
  const rawEngines = kvArrayToObject(kvArrayToObject(result).engines);
  const parsedEngines = Object.fromEntries(
    Object.entries(rawEngines).map(([key, value]) => [key, kvArrayToObject(value)])
  );
  const final = {
    engines: Object.fromEntries(
      Object.entries(parsedEngines).map(([key, value]) => [
        key,
        {
          librariesCount: value.libraries_count,
          functionsCount: value.functions_count
        }
      ])
    )
  };
  return final;
}
var GeoAddCommand = class extends Command {
  constructor([key, arg1, ...arg2], opts) {
    const command = ["geoadd", key];
    if ("nx" in arg1 && arg1.nx) {
      command.push("nx");
    } else if ("xx" in arg1 && arg1.xx) {
      command.push("xx");
    }
    if ("ch" in arg1 && arg1.ch) {
      command.push("ch");
    }
    if ("latitude" in arg1 && arg1.latitude) {
      command.push(arg1.longitude, arg1.latitude, arg1.member);
    }
    command.push(
      ...arg2.flatMap(({ latitude, longitude, member }) => [longitude, latitude, member])
    );
    super(command, opts);
  }
};
var GeoDistCommand = class extends Command {
  constructor([key, member1, member2, unit = "M"], opts) {
    super(["GEODIST", key, member1, member2, unit], opts);
  }
};
var GeoHashCommand = class extends Command {
  constructor(cmd, opts) {
    const [key] = cmd;
    const members = Array.isArray(cmd[1]) ? cmd[1] : cmd.slice(1);
    super(["GEOHASH", key, ...members], opts);
  }
};
var GeoPosCommand = class extends Command {
  constructor(cmd, opts) {
    const [key] = cmd;
    const members = Array.isArray(cmd[1]) ? cmd[1] : cmd.slice(1);
    super(["GEOPOS", key, ...members], {
      deserialize: (result) => transform(result),
      ...opts
    });
  }
};
function transform(result) {
  const final = [];
  for (const pos of result) {
    if (!pos?.[0] || !pos?.[1]) {
      continue;
    }
    final.push({ lng: Number.parseFloat(pos[0]), lat: Number.parseFloat(pos[1]) });
  }
  return final;
}
var GeoSearchCommand = class extends Command {
  constructor([key, centerPoint, shape, order, opts], commandOptions) {
    const command = ["GEOSEARCH", key];
    if (centerPoint.type === "FROMMEMBER" || centerPoint.type === "frommember") {
      command.push(centerPoint.type, centerPoint.member);
    }
    if (centerPoint.type === "FROMLONLAT" || centerPoint.type === "fromlonlat") {
      command.push(centerPoint.type, centerPoint.coordinate.lon, centerPoint.coordinate.lat);
    }
    if (shape.type === "BYRADIUS" || shape.type === "byradius") {
      command.push(shape.type, shape.radius, shape.radiusType);
    }
    if (shape.type === "BYBOX" || shape.type === "bybox") {
      command.push(shape.type, shape.rect.width, shape.rect.height, shape.rectType);
    }
    command.push(order);
    if (opts?.count) {
      command.push("COUNT", opts.count.limit, ...opts.count.any ? ["ANY"] : []);
    }
    const transform2 = (result) => {
      if (!opts?.withCoord && !opts?.withDist && !opts?.withHash) {
        return result.map((member) => {
          try {
            return { member: JSON.parse(member) };
          } catch {
            return { member };
          }
        });
      }
      return result.map((members) => {
        let counter = 1;
        const obj = {};
        try {
          obj.member = JSON.parse(members[0]);
        } catch {
          obj.member = members[0];
        }
        if (opts.withDist) {
          obj.dist = Number.parseFloat(members[counter++]);
        }
        if (opts.withHash) {
          obj.hash = members[counter++].toString();
        }
        if (opts.withCoord) {
          obj.coord = {
            long: Number.parseFloat(members[counter][0]),
            lat: Number.parseFloat(members[counter][1])
          };
        }
        return obj;
      });
    };
    super(
      [
        ...command,
        ...opts?.withCoord ? ["WITHCOORD"] : [],
        ...opts?.withDist ? ["WITHDIST"] : [],
        ...opts?.withHash ? ["WITHHASH"] : []
      ],
      {
        deserialize: transform2,
        ...commandOptions
      }
    );
  }
};
var GeoSearchStoreCommand = class extends Command {
  constructor([destination, key, centerPoint, shape, order, opts], commandOptions) {
    const command = ["GEOSEARCHSTORE", destination, key];
    if (centerPoint.type === "FROMMEMBER" || centerPoint.type === "frommember") {
      command.push(centerPoint.type, centerPoint.member);
    }
    if (centerPoint.type === "FROMLONLAT" || centerPoint.type === "fromlonlat") {
      command.push(centerPoint.type, centerPoint.coordinate.lon, centerPoint.coordinate.lat);
    }
    if (shape.type === "BYRADIUS" || shape.type === "byradius") {
      command.push(shape.type, shape.radius, shape.radiusType);
    }
    if (shape.type === "BYBOX" || shape.type === "bybox") {
      command.push(shape.type, shape.rect.width, shape.rect.height, shape.rectType);
    }
    command.push(order);
    if (opts?.count) {
      command.push("COUNT", opts.count.limit, ...opts.count.any ? ["ANY"] : []);
    }
    super([...command, ...opts?.storeDist ? ["STOREDIST"] : []], commandOptions);
  }
};
var GetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["get", ...cmd], opts);
  }
};
var GetBitCommand = class extends Command {
  constructor(cmd, opts) {
    super(["getbit", ...cmd], opts);
  }
};
var GetDelCommand = class extends Command {
  constructor(cmd, opts) {
    super(["getdel", ...cmd], opts);
  }
};
var GetExCommand = class extends Command {
  constructor([key, opts], cmdOpts) {
    const command = ["getex", key];
    if (opts) {
      if ("ex" in opts && typeof opts.ex === "number") {
        command.push("ex", opts.ex);
      } else if ("px" in opts && typeof opts.px === "number") {
        command.push("px", opts.px);
      } else if ("exat" in opts && typeof opts.exat === "number") {
        command.push("exat", opts.exat);
      } else if ("pxat" in opts && typeof opts.pxat === "number") {
        command.push("pxat", opts.pxat);
      } else if ("persist" in opts && opts.persist) {
        command.push("persist");
      }
    }
    super(command, cmdOpts);
  }
};
var GetRangeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["getrange", ...cmd], opts);
  }
};
var GetSetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["getset", ...cmd], opts);
  }
};
var HDelCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hdel", ...cmd], opts);
  }
};
var HExistsCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hexists", ...cmd], opts);
  }
};
var HExpireCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields, seconds, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hexpire",
        key,
        seconds,
        ...option ? [option] : [],
        "FIELDS",
        fieldArray.length,
        ...fieldArray
      ],
      opts
    );
  }
};
var HExpireAtCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields, timestamp, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hexpireat",
        key,
        timestamp,
        ...option ? [option] : [],
        "FIELDS",
        fieldArray.length,
        ...fieldArray
      ],
      opts
    );
  }
};
var HExpireTimeCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["hexpiretime", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HPersistCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["hpersist", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HPExpireCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields, milliseconds, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hpexpire",
        key,
        milliseconds,
        ...option ? [option] : [],
        "FIELDS",
        fieldArray.length,
        ...fieldArray
      ],
      opts
    );
  }
};
var HPExpireAtCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields, timestamp, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hpexpireat",
        key,
        timestamp,
        ...option ? [option] : [],
        "FIELDS",
        fieldArray.length,
        ...fieldArray
      ],
      opts
    );
  }
};
var HPExpireTimeCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["hpexpiretime", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HPTtlCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["hpttl", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HGetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hget", ...cmd], opts);
  }
};
function deserialize4(result) {
  if (result.length === 0) {
    return null;
  }
  const obj = {};
  for (let i = 0; i < result.length; i += 2) {
    const key = result[i];
    const value = result[i + 1];
    try {
      const valueIsNumberAndNotSafeInteger = !Number.isNaN(Number(value)) && !Number.isSafeInteger(Number(value));
      obj[key] = valueIsNumberAndNotSafeInteger ? value : JSON.parse(value);
    } catch {
      obj[key] = value;
    }
  }
  return obj;
}
var HGetAllCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hgetall", ...cmd], {
      deserialize: (result) => deserialize4(result),
      ...opts
    });
  }
};
function deserialize5(fields, result) {
  if (result.every((field) => field === null)) {
    return null;
  }
  const obj = {};
  for (const [i, field] of fields.entries()) {
    try {
      obj[field] = JSON.parse(result[i]);
    } catch {
      obj[field] = result[i];
    }
  }
  return obj;
}
var HMGetCommand = class extends Command {
  constructor([key, ...fields], opts) {
    super(["hmget", key, ...fields], {
      deserialize: (result) => deserialize5(fields, result),
      ...opts
    });
  }
};
var HGetDelCommand = class extends Command {
  constructor([key, ...fields], opts) {
    super(["hgetdel", key, "FIELDS", fields.length, ...fields], {
      deserialize: (result) => deserialize5(fields.map(String), result),
      ...opts
    });
  }
};
var HGetExCommand = class extends Command {
  constructor([key, opts, ...fields], cmdOpts) {
    const command = ["hgetex", key];
    if ("ex" in opts && typeof opts.ex === "number") {
      command.push("EX", opts.ex);
    } else if ("px" in opts && typeof opts.px === "number") {
      command.push("PX", opts.px);
    } else if ("exat" in opts && typeof opts.exat === "number") {
      command.push("EXAT", opts.exat);
    } else if ("pxat" in opts && typeof opts.pxat === "number") {
      command.push("PXAT", opts.pxat);
    } else if ("persist" in opts && opts.persist) {
      command.push("PERSIST");
    }
    command.push("FIELDS", fields.length, ...fields);
    super(command, {
      deserialize: (result) => deserialize5(fields.map(String), result),
      ...cmdOpts
    });
  }
};
var HIncrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hincrby", ...cmd], opts);
  }
};
var HIncrByFloatCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hincrbyfloat", ...cmd], opts);
  }
};
var HKeysCommand = class extends Command {
  constructor([key], opts) {
    super(["hkeys", key], opts);
  }
};
var HLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hlen", ...cmd], opts);
  }
};
var HMSetCommand = class extends Command {
  constructor([key, kv], opts) {
    super(["hmset", key, ...Object.entries(kv).flatMap(([field, value]) => [field, value])], opts);
  }
};
var HScanCommand = class extends Command {
  constructor([key, cursor, cmdOpts], opts) {
    const command = ["hscan", key, cursor];
    if (cmdOpts?.match) {
      command.push("match", cmdOpts.match);
    }
    if (typeof cmdOpts?.count === "number") {
      command.push("count", cmdOpts.count);
    }
    super(command, {
      deserialize: deserializeScanResponse,
      ...opts
    });
  }
};
var HSetCommand = class extends Command {
  constructor([key, kv], opts) {
    super(["hset", key, ...Object.entries(kv).flatMap(([field, value]) => [field, value])], opts);
  }
};
var HSetExCommand = class extends Command {
  constructor([key, opts, kv], cmdOpts) {
    const command = ["hsetex", key];
    if (opts.conditional) {
      command.push(opts.conditional.toUpperCase());
    }
    if (opts.expiration) {
      if ("ex" in opts.expiration && typeof opts.expiration.ex === "number") {
        command.push("EX", opts.expiration.ex);
      } else if ("px" in opts.expiration && typeof opts.expiration.px === "number") {
        command.push("PX", opts.expiration.px);
      } else if ("exat" in opts.expiration && typeof opts.expiration.exat === "number") {
        command.push("EXAT", opts.expiration.exat);
      } else if ("pxat" in opts.expiration && typeof opts.expiration.pxat === "number") {
        command.push("PXAT", opts.expiration.pxat);
      } else if ("keepttl" in opts.expiration && opts.expiration.keepttl) {
        command.push("KEEPTTL");
      }
    }
    const entries = Object.entries(kv);
    command.push("FIELDS", entries.length);
    for (const [field, value] of entries) {
      command.push(field, value);
    }
    super(command, cmdOpts);
  }
};
var HSetNXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hsetnx", ...cmd], opts);
  }
};
var HStrLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hstrlen", ...cmd], opts);
  }
};
var HTtlCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, fields] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(["httl", key, "FIELDS", fieldArray.length, ...fieldArray], opts);
  }
};
var HValsCommand = class extends Command {
  constructor(cmd, opts) {
    super(["hvals", ...cmd], opts);
  }
};
var IncrCommand = class extends Command {
  constructor(cmd, opts) {
    super(["incr", ...cmd], opts);
  }
};
var IncrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["incrby", ...cmd], opts);
  }
};
var IncrByFloatCommand = class extends Command {
  constructor(cmd, opts) {
    super(["incrbyfloat", ...cmd], opts);
  }
};
var JsonArrAppendCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRAPPEND", ...cmd], opts);
  }
};
var JsonArrIndexCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRINDEX", ...cmd], opts);
  }
};
var JsonArrInsertCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRINSERT", ...cmd], opts);
  }
};
var JsonArrLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRLEN", cmd[0], cmd[1] ?? "$"], opts);
  }
};
var JsonArrPopCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.ARRPOP", ...cmd], opts);
  }
};
var JsonArrTrimCommand = class extends Command {
  constructor(cmd, opts) {
    const path = cmd[1] ?? "$";
    const start = cmd[2] ?? 0;
    const stop = cmd[3] ?? 0;
    super(["JSON.ARRTRIM", cmd[0], path, start, stop], opts);
  }
};
var JsonClearCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.CLEAR", ...cmd], opts);
  }
};
var JsonDelCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.DEL", ...cmd], opts);
  }
};
var JsonForgetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.FORGET", ...cmd], opts);
  }
};
var JsonGetCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["JSON.GET"];
    if (typeof cmd[1] === "string") {
      command.push(...cmd);
    } else {
      command.push(cmd[0]);
      if (cmd[1]) {
        if (cmd[1].indent) {
          command.push("INDENT", cmd[1].indent);
        }
        if (cmd[1].newline) {
          command.push("NEWLINE", cmd[1].newline);
        }
        if (cmd[1].space) {
          command.push("SPACE", cmd[1].space);
        }
      }
      command.push(...cmd.slice(2));
    }
    super(command, opts);
  }
};
var JsonMergeCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["JSON.MERGE", ...cmd];
    super(command, opts);
  }
};
var JsonMGetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.MGET", ...cmd[0], cmd[1]], opts);
  }
};
var JsonMSetCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["JSON.MSET"];
    for (const c of cmd) {
      command.push(c.key, c.path, c.value);
    }
    super(command, opts);
  }
};
var JsonNumIncrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.NUMINCRBY", ...cmd], opts);
  }
};
var JsonNumMultByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.NUMMULTBY", ...cmd], opts);
  }
};
var JsonObjKeysCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.OBJKEYS", ...cmd], opts);
  }
};
var JsonObjLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.OBJLEN", ...cmd], opts);
  }
};
var JsonRespCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.RESP", ...cmd], opts);
  }
};
var JsonSetCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["JSON.SET", cmd[0], cmd[1], cmd[2]];
    if (cmd[3]) {
      if (cmd[3].nx) {
        command.push("NX");
      } else if (cmd[3].xx) {
        command.push("XX");
      }
    }
    super(command, opts);
  }
};
var JsonStrAppendCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.STRAPPEND", ...cmd], opts);
  }
};
var JsonStrLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.STRLEN", ...cmd], opts);
  }
};
var JsonToggleCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.TOGGLE", ...cmd], opts);
  }
};
var JsonTypeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["JSON.TYPE", ...cmd], opts);
  }
};
var KeysCommand = class extends Command {
  constructor(cmd, opts) {
    super(["keys", ...cmd], opts);
  }
};
var LIndexCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lindex", ...cmd], opts);
  }
};
var LInsertCommand = class extends Command {
  constructor(cmd, opts) {
    super(["linsert", ...cmd], opts);
  }
};
var LLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["llen", ...cmd], opts);
  }
};
var LMoveCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lmove", ...cmd], opts);
  }
};
var LmPopCommand = class extends Command {
  constructor(cmd, opts) {
    const [numkeys, keys, direction, count] = cmd;
    super(["LMPOP", numkeys, ...keys, direction, ...count ? ["COUNT", count] : []], opts);
  }
};
var LPopCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lpop", ...cmd], opts);
  }
};
var LPosCommand = class extends Command {
  constructor(cmd, opts) {
    const args = ["lpos", cmd[0], cmd[1]];
    if (typeof cmd[2]?.rank === "number") {
      args.push("rank", cmd[2].rank);
    }
    if (typeof cmd[2]?.count === "number") {
      args.push("count", cmd[2].count);
    }
    if (typeof cmd[2]?.maxLen === "number") {
      args.push("maxLen", cmd[2].maxLen);
    }
    super(args, opts);
  }
};
var LPushCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lpush", ...cmd], opts);
  }
};
var LPushXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lpushx", ...cmd], opts);
  }
};
var LRangeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lrange", ...cmd], opts);
  }
};
var LRemCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lrem", ...cmd], opts);
  }
};
var LSetCommand = class extends Command {
  constructor(cmd, opts) {
    super(["lset", ...cmd], opts);
  }
};
var LTrimCommand = class extends Command {
  constructor(cmd, opts) {
    super(["ltrim", ...cmd], opts);
  }
};
var MGetCommand = class extends Command {
  constructor(cmd, opts) {
    const keys = Array.isArray(cmd[0]) ? cmd[0] : cmd;
    super(["mget", ...keys], opts);
  }
};
var MSetCommand = class extends Command {
  constructor([kv], opts) {
    super(["mset", ...Object.entries(kv).flatMap(([key, value]) => [key, value])], opts);
  }
};
var MSetNXCommand = class extends Command {
  constructor([kv], opts) {
    super(["msetnx", ...Object.entries(kv).flat()], opts);
  }
};
var PersistCommand = class extends Command {
  constructor(cmd, opts) {
    super(["persist", ...cmd], opts);
  }
};
var PExpireCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pexpire", ...cmd], opts);
  }
};
var PExpireAtCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pexpireat", ...cmd], opts);
  }
};
var PfAddCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pfadd", ...cmd], opts);
  }
};
var PfCountCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pfcount", ...cmd], opts);
  }
};
var PfMergeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pfmerge", ...cmd], opts);
  }
};
var PingCommand = class extends Command {
  constructor(cmd, opts) {
    const command = ["ping"];
    if (cmd?.[0] !== void 0) {
      command.push(cmd[0]);
    }
    super(command, opts);
  }
};
var PSetEXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["psetex", ...cmd], opts);
  }
};
var PTtlCommand = class extends Command {
  constructor(cmd, opts) {
    super(["pttl", ...cmd], opts);
  }
};
var PublishCommand = class extends Command {
  constructor(cmd, opts) {
    super(["publish", ...cmd], opts);
  }
};
var RandomKeyCommand = class extends Command {
  constructor(opts) {
    super(["randomkey"], opts);
  }
};
var RenameCommand = class extends Command {
  constructor(cmd, opts) {
    super(["rename", ...cmd], opts);
  }
};
var RenameNXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["renamenx", ...cmd], opts);
  }
};
var RPopCommand = class extends Command {
  constructor(cmd, opts) {
    super(["rpop", ...cmd], opts);
  }
};
var RPushCommand = class extends Command {
  constructor(cmd, opts) {
    super(["rpush", ...cmd], opts);
  }
};
var RPushXCommand = class extends Command {
  constructor(cmd, opts) {
    super(["rpushx", ...cmd], opts);
  }
};
var SAddCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sadd", ...cmd], opts);
  }
};
var ScanCommand = class extends Command {
  constructor([cursor, opts], cmdOpts) {
    const command = ["scan", cursor];
    if (opts?.match) {
      command.push("match", opts.match);
    }
    if (typeof opts?.count === "number") {
      command.push("count", opts.count);
    }
    if (opts && "withType" in opts && opts.withType === true) {
      command.push("withtype");
    } else if (opts && "type" in opts && opts.type && opts.type.length > 0) {
      command.push("type", opts.type);
    }
    super(command, {
      // @ts-expect-error ignore types here
      deserialize: opts?.withType ? deserializeScanWithTypesResponse : deserializeScanResponse,
      ...cmdOpts
    });
  }
};
var SCardCommand = class extends Command {
  constructor(cmd, opts) {
    super(["scard", ...cmd], opts);
  }
};
var ScriptExistsCommand = class extends Command {
  constructor(hashes, opts) {
    super(["script", "exists", ...hashes], {
      deserialize: (result) => result,
      ...opts
    });
  }
};
var ScriptFlushCommand = class extends Command {
  constructor([opts], cmdOpts) {
    const cmd = ["script", "flush"];
    if (opts?.sync) {
      cmd.push("sync");
    } else if (opts?.async) {
      cmd.push("async");
    }
    super(cmd, cmdOpts);
  }
};
var ScriptLoadCommand = class extends Command {
  constructor(args, opts) {
    super(["script", "load", ...args], opts);
  }
};
var SDiffCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sdiff", ...cmd], opts);
  }
};
var SDiffStoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sdiffstore", ...cmd], opts);
  }
};
var SetCommand = class extends Command {
  constructor([key, value, opts], cmdOpts) {
    const command = ["set", key, value];
    if (opts) {
      if ("nx" in opts && opts.nx) {
        command.push("nx");
      } else if ("xx" in opts && opts.xx) {
        command.push("xx");
      }
      if ("get" in opts && opts.get) {
        command.push("get");
      }
      if ("ex" in opts && typeof opts.ex === "number") {
        command.push("ex", opts.ex);
      } else if ("px" in opts && typeof opts.px === "number") {
        command.push("px", opts.px);
      } else if ("exat" in opts && typeof opts.exat === "number") {
        command.push("exat", opts.exat);
      } else if ("pxat" in opts && typeof opts.pxat === "number") {
        command.push("pxat", opts.pxat);
      } else if ("keepTtl" in opts && opts.keepTtl) {
        command.push("keepTtl");
      }
    }
    super(command, cmdOpts);
  }
};
var SetBitCommand = class extends Command {
  constructor(cmd, opts) {
    super(["setbit", ...cmd], opts);
  }
};
var SetExCommand = class extends Command {
  constructor(cmd, opts) {
    super(["setex", ...cmd], opts);
  }
};
var SetNxCommand = class extends Command {
  constructor(cmd, opts) {
    super(["setnx", ...cmd], opts);
  }
};
var SetRangeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["setrange", ...cmd], opts);
  }
};
var SInterCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sinter", ...cmd], opts);
  }
};
var SInterCardCommand = class extends Command {
  constructor(cmd, cmdOpts) {
    const [keys, opts] = cmd;
    const command = ["sintercard", keys.length, ...keys];
    if (opts?.limit !== void 0) {
      command.push("LIMIT", opts.limit);
    }
    super(command, cmdOpts);
  }
};
var SInterStoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sinterstore", ...cmd], opts);
  }
};
var SIsMemberCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sismember", ...cmd], opts);
  }
};
var SMembersCommand = class extends Command {
  constructor(cmd, opts) {
    super(["smembers", ...cmd], opts);
  }
};
var SMIsMemberCommand = class extends Command {
  constructor(cmd, opts) {
    super(["smismember", cmd[0], ...cmd[1]], opts);
  }
};
var SMoveCommand = class extends Command {
  constructor(cmd, opts) {
    super(["smove", ...cmd], opts);
  }
};
var SPopCommand = class extends Command {
  constructor([key, count], opts) {
    const command = ["spop", key];
    if (typeof count === "number") {
      command.push(count);
    }
    super(command, opts);
  }
};
var SRandMemberCommand = class extends Command {
  constructor([key, count], opts) {
    const command = ["srandmember", key];
    if (typeof count === "number") {
      command.push(count);
    }
    super(command, opts);
  }
};
var SRemCommand = class extends Command {
  constructor(cmd, opts) {
    super(["srem", ...cmd], opts);
  }
};
var SScanCommand = class extends Command {
  constructor([key, cursor, opts], cmdOpts) {
    const command = ["sscan", key, cursor];
    if (opts?.match) {
      command.push("match", opts.match);
    }
    if (typeof opts?.count === "number") {
      command.push("count", opts.count);
    }
    super(command, {
      deserialize: deserializeScanResponse,
      ...cmdOpts
    });
  }
};
var StrLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["strlen", ...cmd], opts);
  }
};
var SUnionCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sunion", ...cmd], opts);
  }
};
var SUnionStoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["sunionstore", ...cmd], opts);
  }
};
var TimeCommand = class extends Command {
  constructor(opts) {
    super(["time"], opts);
  }
};
var TouchCommand = class extends Command {
  constructor(cmd, opts) {
    super(["touch", ...cmd], opts);
  }
};
var TtlCommand = class extends Command {
  constructor(cmd, opts) {
    super(["ttl", ...cmd], opts);
  }
};
var TypeCommand = class extends Command {
  constructor(cmd, opts) {
    super(["type", ...cmd], opts);
  }
};
var UnlinkCommand = class extends Command {
  constructor(cmd, opts) {
    super(["unlink", ...cmd], opts);
  }
};
var XAckCommand = class extends Command {
  constructor([key, group, id], opts) {
    const ids = Array.isArray(id) ? [...id] : [id];
    super(["XACK", key, group, ...ids], opts);
  }
};
var XAckDelCommand = class extends Command {
  constructor([key, group, opts, ...ids], cmdOpts) {
    const command = ["XACKDEL", key, group];
    command.push(opts.toUpperCase(), "IDS", ids.length, ...ids);
    super(command, cmdOpts);
  }
};
var XAddCommand = class extends Command {
  constructor([key, id, entries, opts], commandOptions) {
    const command = ["XADD", key];
    if (opts) {
      if (opts.nomkStream) {
        command.push("NOMKSTREAM");
      }
      if (opts.trim) {
        command.push(opts.trim.type, opts.trim.comparison, opts.trim.threshold);
        if (opts.trim.limit !== void 0) {
          command.push("LIMIT", opts.trim.limit);
        }
      }
    }
    command.push(id);
    for (const [k, v] of Object.entries(entries)) {
      command.push(k, v);
    }
    super(command, commandOptions);
  }
};
var XAutoClaim = class extends Command {
  constructor([key, group, consumer, minIdleTime, start, options], opts) {
    const commands = [];
    if (options?.count) {
      commands.push("COUNT", options.count);
    }
    if (options?.justId) {
      commands.push("JUSTID");
    }
    super(["XAUTOCLAIM", key, group, consumer, minIdleTime, start, ...commands], opts);
  }
};
var XClaimCommand = class extends Command {
  constructor([key, group, consumer, minIdleTime, id, options], opts) {
    const ids = Array.isArray(id) ? [...id] : [id];
    const commands = [];
    if (options?.idleMS) {
      commands.push("IDLE", options.idleMS);
    }
    if (options?.idleMS) {
      commands.push("TIME", options.timeMS);
    }
    if (options?.retryCount) {
      commands.push("RETRYCOUNT", options.retryCount);
    }
    if (options?.force) {
      commands.push("FORCE");
    }
    if (options?.justId) {
      commands.push("JUSTID");
    }
    if (options?.lastId) {
      commands.push("LASTID", options.lastId);
    }
    super(["XCLAIM", key, group, consumer, minIdleTime, ...ids, ...commands], opts);
  }
};
var XDelCommand = class extends Command {
  constructor([key, ids], opts) {
    const cmds = Array.isArray(ids) ? [...ids] : [ids];
    super(["XDEL", key, ...cmds], opts);
  }
};
var XDelExCommand = class extends Command {
  constructor([key, opts, ...ids], cmdOpts) {
    const command = ["XDELEX", key];
    if (opts) {
      command.push(opts.toUpperCase());
    }
    command.push("IDS", ids.length, ...ids);
    super(command, cmdOpts);
  }
};
var XGroupCommand = class extends Command {
  constructor([key, opts], commandOptions) {
    const command = ["XGROUP"];
    switch (opts.type) {
      case "CREATE": {
        command.push("CREATE", key, opts.group, opts.id);
        if (opts.options) {
          if (opts.options.MKSTREAM) {
            command.push("MKSTREAM");
          }
          if (opts.options.ENTRIESREAD !== void 0) {
            command.push("ENTRIESREAD", opts.options.ENTRIESREAD.toString());
          }
        }
        break;
      }
      case "CREATECONSUMER": {
        command.push("CREATECONSUMER", key, opts.group, opts.consumer);
        break;
      }
      case "DELCONSUMER": {
        command.push("DELCONSUMER", key, opts.group, opts.consumer);
        break;
      }
      case "DESTROY": {
        command.push("DESTROY", key, opts.group);
        break;
      }
      case "SETID": {
        command.push("SETID", key, opts.group, opts.id);
        if (opts.options?.ENTRIESREAD !== void 0) {
          command.push("ENTRIESREAD", opts.options.ENTRIESREAD.toString());
        }
        break;
      }
      default: {
        throw new Error("Invalid XGROUP");
      }
    }
    super(command, commandOptions);
  }
};
var XInfoCommand = class extends Command {
  constructor([key, options], opts) {
    const cmds = [];
    if (options.type === "CONSUMERS") {
      cmds.push("CONSUMERS", key, options.group);
    } else {
      cmds.push("GROUPS", key);
    }
    super(["XINFO", ...cmds], opts);
  }
};
var XLenCommand = class extends Command {
  constructor(cmd, opts) {
    super(["XLEN", ...cmd], opts);
  }
};
var XPendingCommand = class extends Command {
  constructor([key, group, start, end, count, options], opts) {
    const consumers = options?.consumer === void 0 ? [] : Array.isArray(options.consumer) ? [...options.consumer] : [options.consumer];
    super(
      [
        "XPENDING",
        key,
        group,
        ...options?.idleTime ? ["IDLE", options.idleTime] : [],
        start,
        end,
        count,
        ...consumers
      ],
      opts
    );
  }
};
function deserialize6(result) {
  const obj = {};
  for (const e of result) {
    for (let i = 0; i < e.length; i += 2) {
      const streamId = e[i];
      const entries = e[i + 1];
      if (!(streamId in obj)) {
        obj[streamId] = {};
      }
      for (let j = 0; j < entries.length; j += 2) {
        const field = entries[j];
        const value = entries[j + 1];
        try {
          obj[streamId][field] = JSON.parse(value);
        } catch {
          obj[streamId][field] = value;
        }
      }
    }
  }
  return obj;
}
var XRangeCommand = class extends Command {
  constructor([key, start, end, count], opts) {
    const command = ["XRANGE", key, start, end];
    if (typeof count === "number") {
      command.push("COUNT", count);
    }
    super(command, {
      deserialize: (result) => deserialize6(result),
      ...opts
    });
  }
};
var UNBALANCED_XREAD_ERR = "ERR Unbalanced XREAD list of streams: for each stream key an ID or '$' must be specified";
var XReadCommand = class extends Command {
  constructor([key, id, options], opts) {
    if (Array.isArray(key) && Array.isArray(id) && key.length !== id.length) {
      throw new Error(UNBALANCED_XREAD_ERR);
    }
    const commands = [];
    if (typeof options?.count === "number") {
      commands.push("COUNT", options.count);
    }
    if (typeof options?.blockMS === "number") {
      commands.push("BLOCK", options.blockMS);
    }
    commands.push(
      "STREAMS",
      ...Array.isArray(key) ? [...key] : [key],
      ...Array.isArray(id) ? [...id] : [id]
    );
    super(["XREAD", ...commands], opts);
  }
};
var UNBALANCED_XREADGROUP_ERR = "ERR Unbalanced XREADGROUP list of streams: for each stream key an ID or '$' must be specified";
var XReadGroupCommand = class extends Command {
  constructor([group, consumer, key, id, options], opts) {
    if (Array.isArray(key) && Array.isArray(id) && key.length !== id.length) {
      throw new Error(UNBALANCED_XREADGROUP_ERR);
    }
    const commands = [];
    if (typeof options?.count === "number") {
      commands.push("COUNT", options.count);
    }
    if (typeof options?.blockMS === "number") {
      commands.push("BLOCK", options.blockMS);
    }
    if (typeof options?.NOACK === "boolean" && options.NOACK) {
      commands.push("NOACK");
    }
    commands.push(
      "STREAMS",
      ...Array.isArray(key) ? [...key] : [key],
      ...Array.isArray(id) ? [...id] : [id]
    );
    super(["XREADGROUP", "GROUP", group, consumer, ...commands], opts);
  }
};
var XRevRangeCommand = class extends Command {
  constructor([key, end, start, count], opts) {
    const command = ["XREVRANGE", key, end, start];
    if (typeof count === "number") {
      command.push("COUNT", count);
    }
    super(command, {
      deserialize: (result) => deserialize7(result),
      ...opts
    });
  }
};
function deserialize7(result) {
  const obj = {};
  for (const e of result) {
    for (let i = 0; i < e.length; i += 2) {
      const streamId = e[i];
      const entries = e[i + 1];
      if (!(streamId in obj)) {
        obj[streamId] = {};
      }
      for (let j = 0; j < entries.length; j += 2) {
        const field = entries[j];
        const value = entries[j + 1];
        try {
          obj[streamId][field] = JSON.parse(value);
        } catch {
          obj[streamId][field] = value;
        }
      }
    }
  }
  return obj;
}
var XTrimCommand = class extends Command {
  constructor([key, options], opts) {
    const { limit, strategy, threshold, exactness = "~" } = options;
    super(["XTRIM", key, strategy, exactness, threshold, ...limit ? ["LIMIT", limit] : []], opts);
  }
};
var ZAddCommand = class extends Command {
  constructor([key, arg1, ...arg2], opts) {
    const command = ["zadd", key];
    if ("nx" in arg1 && arg1.nx) {
      command.push("nx");
    } else if ("xx" in arg1 && arg1.xx) {
      command.push("xx");
    }
    if ("ch" in arg1 && arg1.ch) {
      command.push("ch");
    }
    if ("incr" in arg1 && arg1.incr) {
      command.push("incr");
    }
    if ("lt" in arg1 && arg1.lt) {
      command.push("lt");
    } else if ("gt" in arg1 && arg1.gt) {
      command.push("gt");
    }
    if ("score" in arg1 && "member" in arg1) {
      command.push(arg1.score, arg1.member);
    }
    command.push(...arg2.flatMap(({ score, member }) => [score, member]));
    super(command, opts);
  }
};
var ZCardCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zcard", ...cmd], opts);
  }
};
var ZCountCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zcount", ...cmd], opts);
  }
};
var ZIncrByCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zincrby", ...cmd], opts);
  }
};
var ZInterStoreCommand = class extends Command {
  constructor([destination, numKeys, keyOrKeys, opts], cmdOpts) {
    const command = ["zinterstore", destination, numKeys];
    if (Array.isArray(keyOrKeys)) {
      command.push(...keyOrKeys);
    } else {
      command.push(keyOrKeys);
    }
    if (opts) {
      if ("weights" in opts && opts.weights) {
        command.push("weights", ...opts.weights);
      } else if ("weight" in opts && typeof opts.weight === "number") {
        command.push("weights", opts.weight);
      }
      if ("aggregate" in opts) {
        command.push("aggregate", opts.aggregate);
      }
    }
    super(command, cmdOpts);
  }
};
var ZLexCountCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zlexcount", ...cmd], opts);
  }
};
var ZPopMaxCommand = class extends Command {
  constructor([key, count], opts) {
    const command = ["zpopmax", key];
    if (typeof count === "number") {
      command.push(count);
    }
    super(command, opts);
  }
};
var ZPopMinCommand = class extends Command {
  constructor([key, count], opts) {
    const command = ["zpopmin", key];
    if (typeof count === "number") {
      command.push(count);
    }
    super(command, opts);
  }
};
var ZRangeCommand = class extends Command {
  constructor([key, min, max, opts], cmdOpts) {
    const command = ["zrange", key, min, max];
    if (opts?.byScore) {
      command.push("byscore");
    }
    if (opts?.byLex) {
      command.push("bylex");
    }
    if (opts?.rev) {
      command.push("rev");
    }
    if (opts?.count !== void 0 && opts.offset !== void 0) {
      command.push("limit", opts.offset, opts.count);
    }
    if (opts?.withScores) {
      command.push("withscores");
    }
    super(command, cmdOpts);
  }
};
var ZRankCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zrank", ...cmd], opts);
  }
};
var ZRemCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zrem", ...cmd], opts);
  }
};
var ZRemRangeByLexCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zremrangebylex", ...cmd], opts);
  }
};
var ZRemRangeByRankCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zremrangebyrank", ...cmd], opts);
  }
};
var ZRemRangeByScoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zremrangebyscore", ...cmd], opts);
  }
};
var ZRevRankCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zrevrank", ...cmd], opts);
  }
};
var ZScanCommand = class extends Command {
  constructor([key, cursor, opts], cmdOpts) {
    const command = ["zscan", key, cursor];
    if (opts?.match) {
      command.push("match", opts.match);
    }
    if (typeof opts?.count === "number") {
      command.push("count", opts.count);
    }
    super(command, {
      deserialize: deserializeScanResponse,
      ...cmdOpts
    });
  }
};
var ZScoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zscore", ...cmd], opts);
  }
};
var ZUnionCommand = class extends Command {
  constructor([numKeys, keyOrKeys, opts], cmdOpts) {
    const command = ["zunion", numKeys];
    if (Array.isArray(keyOrKeys)) {
      command.push(...keyOrKeys);
    } else {
      command.push(keyOrKeys);
    }
    if (opts) {
      if ("weights" in opts && opts.weights) {
        command.push("weights", ...opts.weights);
      } else if ("weight" in opts && typeof opts.weight === "number") {
        command.push("weights", opts.weight);
      }
      if ("aggregate" in opts) {
        command.push("aggregate", opts.aggregate);
      }
      if (opts.withScores) {
        command.push("withscores");
      }
    }
    super(command, cmdOpts);
  }
};
var ZUnionStoreCommand = class extends Command {
  constructor([destination, numKeys, keyOrKeys, opts], cmdOpts) {
    const command = ["zunionstore", destination, numKeys];
    if (Array.isArray(keyOrKeys)) {
      command.push(...keyOrKeys);
    } else {
      command.push(keyOrKeys);
    }
    if (opts) {
      if ("weights" in opts && opts.weights) {
        command.push("weights", ...opts.weights);
      } else if ("weight" in opts && typeof opts.weight === "number") {
        command.push("weights", opts.weight);
      }
      if ("aggregate" in opts) {
        command.push("aggregate", opts.aggregate);
      }
    }
    super(command, cmdOpts);
  }
};
var ZDiffStoreCommand = class extends Command {
  constructor(cmd, opts) {
    super(["zdiffstore", ...cmd], opts);
  }
};
var ZMScoreCommand = class extends Command {
  constructor(cmd, opts) {
    const [key, members] = cmd;
    super(["zmscore", key, ...members], opts);
  }
};
var Pipeline = class {
  client;
  commands;
  commandOptions;
  multiExec;
  constructor(opts) {
    this.client = opts.client;
    this.commands = [];
    this.commandOptions = opts.commandOptions;
    this.multiExec = opts.multiExec ?? false;
    if (this.commandOptions?.latencyLogging) {
      const originalExec = this.exec.bind(this);
      this.exec = async (options) => {
        const start = performance.now();
        const result = await (options ? originalExec(options) : originalExec());
        const end = performance.now();
        const loggerResult = (end - start).toFixed(2);
        console.log(
          `Latency for \x1B[38;2;19;185;39m${this.multiExec ? ["MULTI-EXEC"] : ["PIPELINE"].toString().toUpperCase()}\x1B[0m: \x1B[38;2;0;255;255m${loggerResult} ms\x1B[0m`
        );
        return result;
      };
    }
  }
  exec = async (options) => {
    if (this.commands.length === 0) {
      throw new Error("Pipeline is empty");
    }
    const path = this.multiExec ? ["multi-exec"] : ["pipeline"];
    const res = await this.client.request({
      path,
      body: Object.values(this.commands).map((c) => c.command)
    });
    return options?.keepErrors ? res.map(({ error, result }, i) => {
      return {
        error,
        result: this.commands[i].deserialize(result)
      };
    }) : res.map(({ error, result }, i) => {
      if (error) {
        throw new UpstashError(
          `Command ${i + 1} [ ${this.commands[i].command[0]} ] failed: ${error}`
        );
      }
      return this.commands[i].deserialize(result);
    });
  };
  /**
   * Returns the length of pipeline before the execution
   */
  length() {
    return this.commands.length;
  }
  /**
   * Pushes a command into the pipeline and returns a chainable instance of the
   * pipeline
   */
  chain(command) {
    this.commands.push(command);
    return this;
  }
  /**
   * @see https://redis.io/commands/append
   */
  append = (...args) => this.chain(new AppendCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/bitcount
   */
  bitcount = (...args) => this.chain(new BitCountCommand(args, this.commandOptions));
  /**
   * Returns an instance that can be used to execute `BITFIELD` commands on one key.
   *
   * @example
   * ```typescript
   * redis.set("mykey", 0);
   * const result = await redis.pipeline()
   *   .bitfield("mykey")
   *   .set("u4", 0, 16)
   *   .incr("u4", "#1", 1)
   *   .exec();
   * console.log(result); // [[0, 1]]
   * ```
   *
   * @see https://redis.io/commands/bitfield
   */
  bitfield = (...args) => new BitFieldCommand(args, this.client, this.commandOptions, this.chain.bind(this));
  /**
   * @see https://redis.io/commands/bitop
   */
  bitop = (op, destinationKey, sourceKey, ...sourceKeys) => this.chain(
    new BitOpCommand([op, destinationKey, sourceKey, ...sourceKeys], this.commandOptions)
  );
  /**
   * @see https://redis.io/commands/bitpos
   */
  bitpos = (...args) => this.chain(new BitPosCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/client-setinfo
   */
  clientSetinfo = (...args) => this.chain(new ClientSetInfoCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/copy
   */
  copy = (...args) => this.chain(new CopyCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zdiffstore
   */
  zdiffstore = (...args) => this.chain(new ZDiffStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/dbsize
   */
  dbsize = () => this.chain(new DBSizeCommand(this.commandOptions));
  /**
   * @see https://redis.io/commands/decr
   */
  decr = (...args) => this.chain(new DecrCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/decrby
   */
  decrby = (...args) => this.chain(new DecrByCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/del
   */
  del = (...args) => this.chain(new DelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/echo
   */
  echo = (...args) => this.chain(new EchoCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/eval_ro
   */
  evalRo = (...args) => this.chain(new EvalROCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/eval
   */
  eval = (...args) => this.chain(new EvalCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/evalsha_ro
   */
  evalshaRo = (...args) => this.chain(new EvalshaROCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/evalsha
   */
  evalsha = (...args) => this.chain(new EvalshaCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/exists
   */
  exists = (...args) => this.chain(new ExistsCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/expire
   */
  expire = (...args) => this.chain(new ExpireCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/expireat
   */
  expireat = (...args) => this.chain(new ExpireAtCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/flushall
   */
  flushall = (args) => this.chain(new FlushAllCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/flushdb
   */
  flushdb = (...args) => this.chain(new FlushDBCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geoadd
   */
  geoadd = (...args) => this.chain(new GeoAddCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geodist
   */
  geodist = (...args) => this.chain(new GeoDistCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geopos
   */
  geopos = (...args) => this.chain(new GeoPosCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geohash
   */
  geohash = (...args) => this.chain(new GeoHashCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geosearch
   */
  geosearch = (...args) => this.chain(new GeoSearchCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/geosearchstore
   */
  geosearchstore = (...args) => this.chain(new GeoSearchStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/get
   */
  get = (...args) => this.chain(new GetCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getbit
   */
  getbit = (...args) => this.chain(new GetBitCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getdel
   */
  getdel = (...args) => this.chain(new GetDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getex
   */
  getex = (...args) => this.chain(new GetExCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getrange
   */
  getrange = (...args) => this.chain(new GetRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/getset
   */
  getset = (key, value) => this.chain(new GetSetCommand([key, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/hdel
   */
  hdel = (...args) => this.chain(new HDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hexists
   */
  hexists = (...args) => this.chain(new HExistsCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hexpire
   */
  hexpire = (...args) => this.chain(new HExpireCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hexpireat
   */
  hexpireat = (...args) => this.chain(new HExpireAtCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hexpiretime
   */
  hexpiretime = (...args) => this.chain(new HExpireTimeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/httl
   */
  httl = (...args) => this.chain(new HTtlCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpexpire
   */
  hpexpire = (...args) => this.chain(new HPExpireCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpexpireat
   */
  hpexpireat = (...args) => this.chain(new HPExpireAtCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpexpiretime
   */
  hpexpiretime = (...args) => this.chain(new HPExpireTimeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpttl
   */
  hpttl = (...args) => this.chain(new HPTtlCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hpersist
   */
  hpersist = (...args) => this.chain(new HPersistCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hget
   */
  hget = (...args) => this.chain(new HGetCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hgetall
   */
  hgetall = (...args) => this.chain(new HGetAllCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hgetdel
   */
  hgetdel = (...args) => this.chain(new HGetDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hgetex
   */
  hgetex = (...args) => this.chain(new HGetExCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hincrby
   */
  hincrby = (...args) => this.chain(new HIncrByCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hincrbyfloat
   */
  hincrbyfloat = (...args) => this.chain(new HIncrByFloatCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hkeys
   */
  hkeys = (...args) => this.chain(new HKeysCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hlen
   */
  hlen = (...args) => this.chain(new HLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hmget
   */
  hmget = (...args) => this.chain(new HMGetCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hmset
   */
  hmset = (key, kv) => this.chain(new HMSetCommand([key, kv], this.commandOptions));
  /**
   * @see https://redis.io/commands/hrandfield
   */
  hrandfield = (key, count, withValues) => this.chain(new HRandFieldCommand([key, count, withValues], this.commandOptions));
  /**
   * @see https://redis.io/commands/hscan
   */
  hscan = (...args) => this.chain(new HScanCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hset
   */
  hset = (key, kv) => this.chain(new HSetCommand([key, kv], this.commandOptions));
  /**
   * @see https://redis.io/commands/hsetex
   */
  hsetex = (...args) => this.chain(new HSetExCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hsetnx
   */
  hsetnx = (key, field, value) => this.chain(new HSetNXCommand([key, field, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/hstrlen
   */
  hstrlen = (...args) => this.chain(new HStrLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/hvals
   */
  hvals = (...args) => this.chain(new HValsCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/incr
   */
  incr = (...args) => this.chain(new IncrCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/incrby
   */
  incrby = (...args) => this.chain(new IncrByCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/incrbyfloat
   */
  incrbyfloat = (...args) => this.chain(new IncrByFloatCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/keys
   */
  keys = (...args) => this.chain(new KeysCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lindex
   */
  lindex = (...args) => this.chain(new LIndexCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/linsert
   */
  linsert = (key, direction, pivot, value) => this.chain(new LInsertCommand([key, direction, pivot, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/llen
   */
  llen = (...args) => this.chain(new LLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lmove
   */
  lmove = (...args) => this.chain(new LMoveCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lpop
   */
  lpop = (...args) => this.chain(new LPopCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lmpop
   */
  lmpop = (...args) => this.chain(new LmPopCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lpos
   */
  lpos = (...args) => this.chain(new LPosCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lpush
   */
  lpush = (key, ...elements) => this.chain(new LPushCommand([key, ...elements], this.commandOptions));
  /**
   * @see https://redis.io/commands/lpushx
   */
  lpushx = (key, ...elements) => this.chain(new LPushXCommand([key, ...elements], this.commandOptions));
  /**
   * @see https://redis.io/commands/lrange
   */
  lrange = (...args) => this.chain(new LRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/lrem
   */
  lrem = (key, count, value) => this.chain(new LRemCommand([key, count, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/lset
   */
  lset = (key, index, value) => this.chain(new LSetCommand([key, index, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/ltrim
   */
  ltrim = (...args) => this.chain(new LTrimCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/mget
   */
  mget = (...args) => this.chain(new MGetCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/mset
   */
  mset = (kv) => this.chain(new MSetCommand([kv], this.commandOptions));
  /**
   * @see https://redis.io/commands/msetnx
   */
  msetnx = (kv) => this.chain(new MSetNXCommand([kv], this.commandOptions));
  /**
   * @see https://redis.io/commands/persist
   */
  persist = (...args) => this.chain(new PersistCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pexpire
   */
  pexpire = (...args) => this.chain(new PExpireCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pexpireat
   */
  pexpireat = (...args) => this.chain(new PExpireAtCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pfadd
   */
  pfadd = (...args) => this.chain(new PfAddCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pfcount
   */
  pfcount = (...args) => this.chain(new PfCountCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/pfmerge
   */
  pfmerge = (...args) => this.chain(new PfMergeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/ping
   */
  ping = (args) => this.chain(new PingCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/psetex
   */
  psetex = (key, ttl, value) => this.chain(new PSetEXCommand([key, ttl, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/pttl
   */
  pttl = (...args) => this.chain(new PTtlCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/publish
   */
  publish = (...args) => this.chain(new PublishCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/randomkey
   */
  randomkey = () => this.chain(new RandomKeyCommand(this.commandOptions));
  /**
   * @see https://redis.io/commands/rename
   */
  rename = (...args) => this.chain(new RenameCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/renamenx
   */
  renamenx = (...args) => this.chain(new RenameNXCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/rpop
   */
  rpop = (...args) => this.chain(new RPopCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/rpush
   */
  rpush = (key, ...elements) => this.chain(new RPushCommand([key, ...elements], this.commandOptions));
  /**
   * @see https://redis.io/commands/rpushx
   */
  rpushx = (key, ...elements) => this.chain(new RPushXCommand([key, ...elements], this.commandOptions));
  /**
   * @see https://redis.io/commands/sadd
   */
  sadd = (key, member, ...members) => this.chain(new SAddCommand([key, member, ...members], this.commandOptions));
  /**
   * @see https://redis.io/commands/scan
   */
  scan = (...args) => this.chain(new ScanCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/scard
   */
  scard = (...args) => this.chain(new SCardCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/script-exists
   */
  scriptExists = (...args) => this.chain(new ScriptExistsCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/script-flush
   */
  scriptFlush = (...args) => this.chain(new ScriptFlushCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/script-load
   */
  scriptLoad = (...args) => this.chain(new ScriptLoadCommand(args, this.commandOptions));
  /*)*
   * @see https://redis.io/commands/sdiff
   */
  sdiff = (...args) => this.chain(new SDiffCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sdiffstore
   */
  sdiffstore = (...args) => this.chain(new SDiffStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/set
   */
  set = (key, value, opts) => this.chain(new SetCommand([key, value, opts], this.commandOptions));
  /**
   * @see https://redis.io/commands/setbit
   */
  setbit = (...args) => this.chain(new SetBitCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/setex
   */
  setex = (key, ttl, value) => this.chain(new SetExCommand([key, ttl, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/setnx
   */
  setnx = (key, value) => this.chain(new SetNxCommand([key, value], this.commandOptions));
  /**
   * @see https://redis.io/commands/setrange
   */
  setrange = (...args) => this.chain(new SetRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sinter
   */
  sinter = (...args) => this.chain(new SInterCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sintercard
   */
  sintercard = (...args) => this.chain(new SInterCardCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sinterstore
   */
  sinterstore = (...args) => this.chain(new SInterStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sismember
   */
  sismember = (key, member) => this.chain(new SIsMemberCommand([key, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/smembers
   */
  smembers = (...args) => this.chain(new SMembersCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/smismember
   */
  smismember = (key, members) => this.chain(new SMIsMemberCommand([key, members], this.commandOptions));
  /**
   * @see https://redis.io/commands/smove
   */
  smove = (source, destination, member) => this.chain(new SMoveCommand([source, destination, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/spop
   */
  spop = (...args) => this.chain(new SPopCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/srandmember
   */
  srandmember = (...args) => this.chain(new SRandMemberCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/srem
   */
  srem = (key, ...members) => this.chain(new SRemCommand([key, ...members], this.commandOptions));
  /**
   * @see https://redis.io/commands/sscan
   */
  sscan = (...args) => this.chain(new SScanCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/strlen
   */
  strlen = (...args) => this.chain(new StrLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sunion
   */
  sunion = (...args) => this.chain(new SUnionCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/sunionstore
   */
  sunionstore = (...args) => this.chain(new SUnionStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/time
   */
  time = () => this.chain(new TimeCommand(this.commandOptions));
  /**
   * @see https://redis.io/commands/touch
   */
  touch = (...args) => this.chain(new TouchCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/ttl
   */
  ttl = (...args) => this.chain(new TtlCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/type
   */
  type = (...args) => this.chain(new TypeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/unlink
   */
  unlink = (...args) => this.chain(new UnlinkCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zadd
   */
  zadd = (...args) => {
    if ("score" in args[1]) {
      return this.chain(
        new ZAddCommand([args[0], args[1], ...args.slice(2)], this.commandOptions)
      );
    }
    return this.chain(
      new ZAddCommand(
        [args[0], args[1], ...args.slice(2)],
        this.commandOptions
      )
    );
  };
  /**
   * @see https://redis.io/commands/xadd
   */
  xadd = (...args) => this.chain(new XAddCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xack
   */
  xack = (...args) => this.chain(new XAckCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xackdel
   */
  xackdel = (...args) => this.chain(new XAckDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xdel
   */
  xdel = (...args) => this.chain(new XDelCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xdelex
   */
  xdelex = (...args) => this.chain(new XDelExCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xgroup
   */
  xgroup = (...args) => this.chain(new XGroupCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xread
   */
  xread = (...args) => this.chain(new XReadCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xreadgroup
   */
  xreadgroup = (...args) => this.chain(new XReadGroupCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xinfo
   */
  xinfo = (...args) => this.chain(new XInfoCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xlen
   */
  xlen = (...args) => this.chain(new XLenCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xpending
   */
  xpending = (...args) => this.chain(new XPendingCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xclaim
   */
  xclaim = (...args) => this.chain(new XClaimCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xautoclaim
   */
  xautoclaim = (...args) => this.chain(new XAutoClaim(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xtrim
   */
  xtrim = (...args) => this.chain(new XTrimCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xrange
   */
  xrange = (...args) => this.chain(new XRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/xrevrange
   */
  xrevrange = (...args) => this.chain(new XRevRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zcard
   */
  zcard = (...args) => this.chain(new ZCardCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zcount
   */
  zcount = (...args) => this.chain(new ZCountCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zincrby
   */
  zincrby = (key, increment, member) => this.chain(new ZIncrByCommand([key, increment, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/zinterstore
   */
  zinterstore = (...args) => this.chain(new ZInterStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zlexcount
   */
  zlexcount = (...args) => this.chain(new ZLexCountCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zmscore
   */
  zmscore = (...args) => this.chain(new ZMScoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zpopmax
   */
  zpopmax = (...args) => this.chain(new ZPopMaxCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zpopmin
   */
  zpopmin = (...args) => this.chain(new ZPopMinCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zrange
   */
  zrange = (...args) => this.chain(new ZRangeCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zrank
   */
  zrank = (key, member) => this.chain(new ZRankCommand([key, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/zrem
   */
  zrem = (key, ...members) => this.chain(new ZRemCommand([key, ...members], this.commandOptions));
  /**
   * @see https://redis.io/commands/zremrangebylex
   */
  zremrangebylex = (...args) => this.chain(new ZRemRangeByLexCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zremrangebyrank
   */
  zremrangebyrank = (...args) => this.chain(new ZRemRangeByRankCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zremrangebyscore
   */
  zremrangebyscore = (...args) => this.chain(new ZRemRangeByScoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zrevrank
   */
  zrevrank = (key, member) => this.chain(new ZRevRankCommand([key, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/zscan
   */
  zscan = (...args) => this.chain(new ZScanCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zscore
   */
  zscore = (key, member) => this.chain(new ZScoreCommand([key, member], this.commandOptions));
  /**
   * @see https://redis.io/commands/zunionstore
   */
  zunionstore = (...args) => this.chain(new ZUnionStoreCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/zunion
   */
  zunion = (...args) => this.chain(new ZUnionCommand(args, this.commandOptions));
  /**
   * @see https://redis.io/commands/?group=json
   */
  get json() {
    return {
      /**
       * @see https://redis.io/commands/json.arrappend
       */
      arrappend: (...args) => this.chain(new JsonArrAppendCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrindex
       */
      arrindex: (...args) => this.chain(new JsonArrIndexCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrinsert
       */
      arrinsert: (...args) => this.chain(new JsonArrInsertCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrlen
       */
      arrlen: (...args) => this.chain(new JsonArrLenCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrpop
       */
      arrpop: (...args) => this.chain(new JsonArrPopCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.arrtrim
       */
      arrtrim: (...args) => this.chain(new JsonArrTrimCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.clear
       */
      clear: (...args) => this.chain(new JsonClearCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.del
       */
      del: (...args) => this.chain(new JsonDelCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.forget
       */
      forget: (...args) => this.chain(new JsonForgetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.get
       */
      get: (...args) => this.chain(new JsonGetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.merge
       */
      merge: (...args) => this.chain(new JsonMergeCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.mget
       */
      mget: (...args) => this.chain(new JsonMGetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.mset
       */
      mset: (...args) => this.chain(new JsonMSetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.numincrby
       */
      numincrby: (...args) => this.chain(new JsonNumIncrByCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.nummultby
       */
      nummultby: (...args) => this.chain(new JsonNumMultByCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.objkeys
       */
      objkeys: (...args) => this.chain(new JsonObjKeysCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.objlen
       */
      objlen: (...args) => this.chain(new JsonObjLenCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.resp
       */
      resp: (...args) => this.chain(new JsonRespCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.set
       */
      set: (...args) => this.chain(new JsonSetCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.strappend
       */
      strappend: (...args) => this.chain(new JsonStrAppendCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.strlen
       */
      strlen: (...args) => this.chain(new JsonStrLenCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.toggle
       */
      toggle: (...args) => this.chain(new JsonToggleCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/commands/json.type
       */
      type: (...args) => this.chain(new JsonTypeCommand(args, this.commandOptions))
    };
  }
  get functions() {
    return {
      /**
       * @see https://redis.io/docs/latest/commands/function-load/
       */
      load: (...args) => this.chain(new FunctionLoadCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/function-list/
       */
      list: (...args) => this.chain(new FunctionListCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/function-delete/
       */
      delete: (...args) => this.chain(new FunctionDeleteCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/function-flush/
       */
      flush: () => this.chain(new FunctionFlushCommand(this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/function-stats/
       */
      stats: () => this.chain(new FunctionStatsCommand(this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/fcall/
       */
      call: (...args) => this.chain(new FCallCommand(args, this.commandOptions)),
      /**
       * @see https://redis.io/docs/latest/commands/fcall_ro/
       */
      callRo: (...args) => this.chain(new FCallRoCommand(args, this.commandOptions))
    };
  }
};
var EXCLUDE_COMMANDS = /* @__PURE__ */ new Set([
  "scan",
  "keys",
  "flushdb",
  "flushall",
  "dbsize",
  "hscan",
  "hgetall",
  "hkeys",
  "lrange",
  "sscan",
  "smembers",
  "xrange",
  "xrevrange",
  "zscan",
  "zrange",
  "exec"
]);
function createAutoPipelineProxy(_redis, namespace = "root") {
  const redis = _redis;
  if (!redis.autoPipelineExecutor) {
    redis.autoPipelineExecutor = new AutoPipelineExecutor(redis);
  }
  return new Proxy(redis, {
    get: (redis2, command) => {
      if (command === "pipelineCounter") {
        return redis2.autoPipelineExecutor.pipelineCounter;
      }
      if (namespace === "root" && command === "json") {
        return createAutoPipelineProxy(redis2, "json");
      }
      if (namespace === "root" && command === "functions") {
        return createAutoPipelineProxy(redis2, "functions");
      }
      if (namespace === "root") {
        const commandInRedisButNotPipeline = command in redis2 && !(command in redis2.autoPipelineExecutor.pipeline);
        const isCommandExcluded = EXCLUDE_COMMANDS.has(command);
        if (commandInRedisButNotPipeline || isCommandExcluded) {
          return redis2[command];
        }
      }
      const pipeline = redis2.autoPipelineExecutor.pipeline;
      const targetFunction = namespace === "json" ? pipeline.json[command] : namespace === "functions" ? pipeline.functions[command] : pipeline[command];
      const isFunction = typeof targetFunction === "function";
      if (isFunction) {
        return (...args) => {
          return redis2.autoPipelineExecutor.withAutoPipeline((pipeline2) => {
            const targetFunction2 = namespace === "json" ? pipeline2.json[command] : namespace === "functions" ? pipeline2.functions[command] : pipeline2[command];
            targetFunction2(...args);
          });
        };
      }
      return targetFunction;
    }
  });
}
var AutoPipelineExecutor = class {
  pipelinePromises = /* @__PURE__ */ new WeakMap();
  activePipeline = null;
  indexInCurrentPipeline = 0;
  redis;
  pipeline;
  // only to make sure that proxy can work
  pipelineCounter = 0;
  // to keep track of how many times a pipeline was executed
  constructor(redis) {
    this.redis = redis;
    this.pipeline = redis.pipeline();
  }
  async withAutoPipeline(executeWithPipeline) {
    const pipeline = this.activePipeline ?? this.redis.pipeline();
    if (!this.activePipeline) {
      this.activePipeline = pipeline;
      this.indexInCurrentPipeline = 0;
    }
    const index = this.indexInCurrentPipeline++;
    executeWithPipeline(pipeline);
    const pipelineDone = this.deferExecution().then(() => {
      if (!this.pipelinePromises.has(pipeline)) {
        const pipelinePromise = pipeline.exec({ keepErrors: true });
        this.pipelineCounter += 1;
        this.pipelinePromises.set(pipeline, pipelinePromise);
        this.activePipeline = null;
      }
      return this.pipelinePromises.get(pipeline);
    });
    const results = await pipelineDone;
    const commandResult = results[index];
    if (commandResult.error) {
      throw new UpstashError(`Command failed: ${commandResult.error}`);
    }
    return commandResult.result;
  }
  async deferExecution() {
    await Promise.resolve();
    await Promise.resolve();
  }
};
var PSubscribeCommand = class extends Command {
  constructor(cmd, opts) {
    const sseHeaders = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    };
    super([], {
      ...opts,
      headers: sseHeaders,
      path: ["psubscribe", ...cmd],
      streamOptions: {
        isStreaming: true,
        onMessage: opts?.streamOptions?.onMessage,
        signal: opts?.streamOptions?.signal
      }
    });
  }
};
var Subscriber = class extends EventTarget {
  subscriptions;
  client;
  listeners;
  opts;
  constructor(client, channels, isPattern = false, opts) {
    super();
    this.client = client;
    this.subscriptions = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Map();
    this.opts = opts;
    for (const channel2 of channels) {
      if (isPattern) {
        this.subscribeToPattern(channel2);
      } else {
        this.subscribeToChannel(channel2);
      }
    }
  }
  subscribeToChannel(channel2) {
    const controller = new AbortController();
    const command = new SubscribeCommand([channel2], {
      streamOptions: {
        signal: controller.signal,
        onMessage: (data) => this.handleMessage(data, false)
      }
    });
    command.exec(this.client).catch((error) => {
      if (error.name !== "AbortError") {
        this.dispatchToListeners("error", error);
      }
    });
    this.subscriptions.set(channel2, {
      command,
      controller,
      isPattern: false
    });
  }
  subscribeToPattern(pattern) {
    const controller = new AbortController();
    const command = new PSubscribeCommand([pattern], {
      streamOptions: {
        signal: controller.signal,
        onMessage: (data) => this.handleMessage(data, true)
      }
    });
    command.exec(this.client).catch((error) => {
      if (error.name !== "AbortError") {
        this.dispatchToListeners("error", error);
      }
    });
    this.subscriptions.set(pattern, {
      command,
      controller,
      isPattern: true
    });
  }
  handleMessage(data, isPattern) {
    const messageData = data.replace(/^data:\s*/, "");
    const firstCommaIndex = messageData.indexOf(",");
    const secondCommaIndex = messageData.indexOf(",", firstCommaIndex + 1);
    const thirdCommaIndex = isPattern ? messageData.indexOf(",", secondCommaIndex + 1) : -1;
    if (firstCommaIndex !== -1 && secondCommaIndex !== -1) {
      const type = messageData.slice(0, firstCommaIndex);
      if (isPattern && type === "pmessage" && thirdCommaIndex !== -1) {
        const pattern = messageData.slice(firstCommaIndex + 1, secondCommaIndex);
        const channel2 = messageData.slice(secondCommaIndex + 1, thirdCommaIndex);
        const messageStr = messageData.slice(thirdCommaIndex + 1);
        try {
          const message2 = this.opts?.automaticDeserialization === false ? messageStr : JSON.parse(messageStr);
          this.dispatchToListeners("pmessage", { pattern, channel: channel2, message: message2 });
          this.dispatchToListeners(`pmessage:${pattern}`, { pattern, channel: channel2, message: message2 });
        } catch (error) {
          this.dispatchToListeners("error", new Error(`Failed to parse message: ${error}`));
        }
      } else {
        const channel2 = messageData.slice(firstCommaIndex + 1, secondCommaIndex);
        const messageStr = messageData.slice(secondCommaIndex + 1);
        try {
          if (type === "subscribe" || type === "psubscribe" || type === "unsubscribe" || type === "punsubscribe") {
            const count = Number.parseInt(messageStr);
            this.dispatchToListeners(type, count);
          } else {
            const message2 = this.opts?.automaticDeserialization === false ? messageStr : parseWithTryCatch(messageStr);
            this.dispatchToListeners(type, { channel: channel2, message: message2 });
            this.dispatchToListeners(`${type}:${channel2}`, { channel: channel2, message: message2 });
          }
        } catch (error) {
          this.dispatchToListeners("error", new Error(`Failed to parse message: ${error}`));
        }
      }
    }
  }
  dispatchToListeners(type, data) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }
  on(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, /* @__PURE__ */ new Set());
    }
    this.listeners.get(type)?.add(listener);
  }
  removeAllListeners() {
    this.listeners.clear();
  }
  async unsubscribe(channels) {
    if (channels) {
      for (const channel2 of channels) {
        const subscription = this.subscriptions.get(channel2);
        if (subscription) {
          try {
            subscription.controller.abort();
          } catch {
          }
          this.subscriptions.delete(channel2);
        }
      }
    } else {
      for (const subscription of this.subscriptions.values()) {
        try {
          subscription.controller.abort();
        } catch {
        }
      }
      this.subscriptions.clear();
      this.removeAllListeners();
    }
  }
  getSubscribedChannels() {
    return [...this.subscriptions.keys()];
  }
};
var SubscribeCommand = class extends Command {
  constructor(cmd, opts) {
    const sseHeaders = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    };
    super([], {
      ...opts,
      headers: sseHeaders,
      path: ["subscribe", ...cmd],
      streamOptions: {
        isStreaming: true,
        onMessage: opts?.streamOptions?.onMessage,
        signal: opts?.streamOptions?.signal
      }
    });
  }
};
var parseWithTryCatch = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};
var Script = class {
  script;
  /**
   * @deprecated This property is initialized to an empty string and will be set in the init method
   * asynchronously. Do not use this property immidiately after the constructor.
   *
   * This property is only exposed for backwards compatibility and will be removed in the
   * future major release.
   */
  sha1;
  initPromise;
  redis;
  constructor(redis, script) {
    this.redis = redis;
    this.script = script;
    this.sha1 = "";
    void this.init(script);
  }
  /**
   * Initialize the script by computing its SHA-1 hash.
   */
  init(script) {
    if (!this.initPromise) {
      this.initPromise = this.digest(script).then((sha1) => {
        this.sha1 = sha1;
      });
    }
    return this.initPromise;
  }
  /**
   * Send an `EVAL` command to redis.
   */
  async eval(keys, args) {
    await this.init(this.script);
    return await this.redis.eval(this.script, keys, args);
  }
  /**
   * Calculates the sha1 hash of the script and then calls `EVALSHA`.
   */
  async evalsha(keys, args) {
    await this.init(this.script);
    return await this.redis.evalsha(this.sha1, keys, args);
  }
  /**
   * Optimistically try to run `EVALSHA` first.
   * If the script is not loaded in redis, it will fall back and try again with `EVAL`.
   *
   * Following calls will be able to use the cached script
   */
  async exec(keys, args) {
    await this.init(this.script);
    const res = await this.redis.evalsha(this.sha1, keys, args).catch(async (error) => {
      if (error instanceof Error && error.message.toLowerCase().includes("noscript")) {
        return await this.redis.eval(this.script, keys, args);
      }
      throw error;
    });
    return res;
  }
  /**
   * Compute the sha1 hash of the script and return its hex representation.
   */
  async digest(s) {
    const data = new TextEncoder().encode(s);
    const hashBuffer = await subtle.digest("SHA-1", data);
    const hashArray = [...new Uint8Array(hashBuffer)];
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
};
var ScriptRO = class {
  script;
  /**
   * @deprecated This property is initialized to an empty string and will be set in the init method
   * asynchronously. Do not use this property immidiately after the constructor.
   *
   * This property is only exposed for backwards compatibility and will be removed in the
   * future major release.
   */
  sha1;
  initPromise;
  redis;
  constructor(redis, script) {
    this.redis = redis;
    this.sha1 = "";
    this.script = script;
    void this.init(script);
  }
  init(script) {
    if (!this.initPromise) {
      this.initPromise = this.digest(script).then((sha1) => {
        this.sha1 = sha1;
      });
    }
    return this.initPromise;
  }
  /**
   * Send an `EVAL_RO` command to redis.
   */
  async evalRo(keys, args) {
    await this.init(this.script);
    return await this.redis.evalRo(this.script, keys, args);
  }
  /**
   * Calculates the sha1 hash of the script and then calls `EVALSHA_RO`.
   */
  async evalshaRo(keys, args) {
    await this.init(this.script);
    return await this.redis.evalshaRo(this.sha1, keys, args);
  }
  /**
   * Optimistically try to run `EVALSHA_RO` first.
   * If the script is not loaded in redis, it will fall back and try again with `EVAL_RO`.
   *
   * Following calls will be able to use the cached script
   */
  async exec(keys, args) {
    await this.init(this.script);
    const res = await this.redis.evalshaRo(this.sha1, keys, args).catch(async (error) => {
      if (error instanceof Error && error.message.toLowerCase().includes("noscript")) {
        return await this.redis.evalRo(this.script, keys, args);
      }
      throw error;
    });
    return res;
  }
  /**
   * Compute the sha1 hash of the script and return its hex representation.
   */
  async digest(s) {
    const data = new TextEncoder().encode(s);
    const hashBuffer = await subtle.digest("SHA-1", data);
    const hashArray = [...new Uint8Array(hashBuffer)];
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
};
var Redis = class {
  client;
  opts;
  enableTelemetry;
  enableAutoPipelining;
  /**
   * Create a new redis client
   *
   * @example
   * ```typescript
   * const redis = new Redis({
   *  url: "<UPSTASH_REDIS_REST_URL>",
   *  token: "<UPSTASH_REDIS_REST_TOKEN>",
   * });
   * ```
   */
  constructor(client, opts) {
    this.client = client;
    this.opts = opts;
    this.enableTelemetry = opts?.enableTelemetry ?? true;
    if (opts?.readYourWrites === false) {
      this.client.readYourWrites = false;
    }
    this.enableAutoPipelining = opts?.enableAutoPipelining ?? true;
  }
  get readYourWritesSyncToken() {
    return this.client.upstashSyncToken;
  }
  set readYourWritesSyncToken(session) {
    this.client.upstashSyncToken = session;
  }
  get json() {
    return {
      /**
       * @see https://redis.io/commands/json.arrappend
       */
      arrappend: (...args) => new JsonArrAppendCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrindex
       */
      arrindex: (...args) => new JsonArrIndexCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrinsert
       */
      arrinsert: (...args) => new JsonArrInsertCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrlen
       */
      arrlen: (...args) => new JsonArrLenCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrpop
       */
      arrpop: (...args) => new JsonArrPopCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.arrtrim
       */
      arrtrim: (...args) => new JsonArrTrimCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.clear
       */
      clear: (...args) => new JsonClearCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.del
       */
      del: (...args) => new JsonDelCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.forget
       */
      forget: (...args) => new JsonForgetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.get
       */
      get: (...args) => new JsonGetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.merge
       */
      merge: (...args) => new JsonMergeCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.mget
       */
      mget: (...args) => new JsonMGetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.mset
       */
      mset: (...args) => new JsonMSetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.numincrby
       */
      numincrby: (...args) => new JsonNumIncrByCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.nummultby
       */
      nummultby: (...args) => new JsonNumMultByCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.objkeys
       */
      objkeys: (...args) => new JsonObjKeysCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.objlen
       */
      objlen: (...args) => new JsonObjLenCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.resp
       */
      resp: (...args) => new JsonRespCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.set
       */
      set: (...args) => new JsonSetCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.strappend
       */
      strappend: (...args) => new JsonStrAppendCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.strlen
       */
      strlen: (...args) => new JsonStrLenCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.toggle
       */
      toggle: (...args) => new JsonToggleCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/commands/json.type
       */
      type: (...args) => new JsonTypeCommand(args, this.opts).exec(this.client)
    };
  }
  get functions() {
    return {
      /**
       * @see https://redis.io/docs/latest/commands/function-load/
       */
      load: (...args) => new FunctionLoadCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/function-list/
       */
      list: (...args) => new FunctionListCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/function-delete/
       */
      delete: (...args) => new FunctionDeleteCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/function-flush/
       */
      flush: () => new FunctionFlushCommand(this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/function-stats/
       *
       * Note: `running_script` field is not supported and therefore not included in the type.
       */
      stats: () => new FunctionStatsCommand(this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/fcall/
       */
      call: (...args) => new FCallCommand(args, this.opts).exec(this.client),
      /**
       * @see https://redis.io/docs/latest/commands/fcall_ro/
       */
      callRo: (...args) => new FCallRoCommand(args, this.opts).exec(this.client)
    };
  }
  /**
   * Wrap a new middleware around the HTTP client.
   */
  use = (middleware) => {
    const makeRequest = this.client.request.bind(this.client);
    this.client.request = (req) => middleware(req, makeRequest);
  };
  /**
   * Technically this is not private, we can hide it from intellisense by doing this
   */
  addTelemetry = (telemetry) => {
    if (!this.enableTelemetry) {
      return;
    }
    try {
      this.client.mergeTelemetry(telemetry);
    } catch {
    }
  };
  /**
   * Creates a new script.
   *
   * Scripts offer the ability to optimistically try to execute a script without having to send the
   * entire script to the server. If the script is loaded on the server, it tries again by sending
   * the entire script. Afterwards, the script is cached on the server.
   *
   * @param script - The script to create
   * @param opts - Optional options to pass to the script `{ readonly?: boolean }`
   * @returns A new script
   *
   * @example
   * ```ts
   * const redis = new Redis({...})
   *
   * const script = redis.createScript<string>("return ARGV[1];")
   * const arg1 = await script.eval([], ["Hello World"])
   * expect(arg1, "Hello World")
   * ```
   * @example
   * ```ts
   * const redis = new Redis({...})
   *
   * const script = redis.createScript<string>("return ARGV[1];", { readonly: true })
   * const arg1 = await script.evalRo([], ["Hello World"])
   * expect(arg1, "Hello World")
   * ```
   */
  createScript(script, opts) {
    return opts?.readonly ? new ScriptRO(this, script) : new Script(this, script);
  }
  get search() {
    return {
      createIndex: (params) => {
        return createIndex(this.client, params);
      },
      index: (params) => {
        return initIndex(this.client, params);
      },
      alias: {
        list: () => {
          return listAliases(this.client);
        },
        add: ({ indexName, alias }) => {
          return addAlias(this.client, { indexName, alias });
        },
        delete: ({ alias }) => {
          return delAlias(this.client, { alias });
        }
      }
    };
  }
  /**
   * Create a new pipeline that allows you to send requests in bulk.
   *
   * @see {@link Pipeline}
   */
  pipeline = () => new Pipeline({
    client: this.client,
    commandOptions: this.opts,
    multiExec: false
  });
  autoPipeline = () => {
    return createAutoPipelineProxy(this);
  };
  /**
   * Create a new transaction to allow executing multiple steps atomically.
   *
   * All the commands in a transaction are serialized and executed sequentially. A request sent by
   * another client will never be served in the middle of the execution of a Redis Transaction. This
   * guarantees that the commands are executed as a single isolated operation.
   *
   * @see {@link Pipeline}
   */
  multi = () => new Pipeline({
    client: this.client,
    commandOptions: this.opts,
    multiExec: true
  });
  /**
   * Returns an instance that can be used to execute `BITFIELD` commands on one key.
   *
   * @example
   * ```typescript
   * redis.set("mykey", 0);
   * const result = await redis.bitfield("mykey")
   *   .set("u4", 0, 16)
   *   .incr("u4", "#1", 1)
   *   .exec();
   * console.log(result); // [0, 1]
   * ```
   *
   * @see https://redis.io/commands/bitfield
   */
  bitfield = (...args) => new BitFieldCommand(args, this.client, this.opts);
  /**
   * @see https://redis.io/commands/append
   */
  append = (...args) => new AppendCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/bitcount
   */
  bitcount = (...args) => new BitCountCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/bitop
   */
  bitop = (op, destinationKey, sourceKey, ...sourceKeys) => new BitOpCommand([op, destinationKey, sourceKey, ...sourceKeys], this.opts).exec(
    this.client
  );
  /**
   * @see https://redis.io/commands/bitpos
   */
  bitpos = (...args) => new BitPosCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/client-setinfo
   */
  clientSetinfo = (...args) => new ClientSetInfoCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/copy
   */
  copy = (...args) => new CopyCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/dbsize
   */
  dbsize = () => new DBSizeCommand(this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/decr
   */
  decr = (...args) => new DecrCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/decrby
   */
  decrby = (...args) => new DecrByCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/del
   */
  del = (...args) => new DelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/echo
   */
  echo = (...args) => new EchoCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/eval_ro
   */
  evalRo = (...args) => new EvalROCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/eval
   */
  eval = (...args) => new EvalCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/evalsha_ro
   */
  evalshaRo = (...args) => new EvalshaROCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/evalsha
   */
  evalsha = (...args) => new EvalshaCommand(args, this.opts).exec(this.client);
  /**
   * Generic method to execute any Redis command.
   */
  exec = (args) => new ExecCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/exists
   */
  exists = (...args) => new ExistsCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/expire
   */
  expire = (...args) => new ExpireCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/expireat
   */
  expireat = (...args) => new ExpireAtCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/flushall
   */
  flushall = (args) => new FlushAllCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/flushdb
   */
  flushdb = (...args) => new FlushDBCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geoadd
   */
  geoadd = (...args) => new GeoAddCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geopos
   */
  geopos = (...args) => new GeoPosCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geodist
   */
  geodist = (...args) => new GeoDistCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geohash
   */
  geohash = (...args) => new GeoHashCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geosearch
   */
  geosearch = (...args) => new GeoSearchCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/geosearchstore
   */
  geosearchstore = (...args) => new GeoSearchStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/get
   */
  get = (...args) => new GetCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getbit
   */
  getbit = (...args) => new GetBitCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getdel
   */
  getdel = (...args) => new GetDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getex
   */
  getex = (...args) => new GetExCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getrange
   */
  getrange = (...args) => new GetRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/getset
   */
  getset = (key, value) => new GetSetCommand([key, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hdel
   */
  hdel = (...args) => new HDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hexists
   */
  hexists = (...args) => new HExistsCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hexpire
   */
  hexpire = (...args) => new HExpireCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hexpireat
   */
  hexpireat = (...args) => new HExpireAtCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hexpiretime
   */
  hexpiretime = (...args) => new HExpireTimeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/httl
   */
  httl = (...args) => new HTtlCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpexpire
   */
  hpexpire = (...args) => new HPExpireCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpexpireat
   */
  hpexpireat = (...args) => new HPExpireAtCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpexpiretime
   */
  hpexpiretime = (...args) => new HPExpireTimeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpttl
   */
  hpttl = (...args) => new HPTtlCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hpersist
   */
  hpersist = (...args) => new HPersistCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hget
   */
  hget = (...args) => new HGetCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hgetall
   */
  hgetall = (...args) => new HGetAllCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hgetdel
   */
  hgetdel = (...args) => new HGetDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hgetex
   */
  hgetex = (...args) => new HGetExCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hincrby
   */
  hincrby = (...args) => new HIncrByCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hincrbyfloat
   */
  hincrbyfloat = (...args) => new HIncrByFloatCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hkeys
   */
  hkeys = (...args) => new HKeysCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hlen
   */
  hlen = (...args) => new HLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hmget
   */
  hmget = (...args) => new HMGetCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hmset
   */
  hmset = (key, kv) => new HMSetCommand([key, kv], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hrandfield
   */
  hrandfield = (key, count, withValues) => new HRandFieldCommand([key, count, withValues], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hscan
   */
  hscan = (...args) => new HScanCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hset
   */
  hset = (key, kv) => new HSetCommand([key, kv], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hsetex
   */
  hsetex = (...args) => new HSetExCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hsetnx
   */
  hsetnx = (key, field, value) => new HSetNXCommand([key, field, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hstrlen
   */
  hstrlen = (...args) => new HStrLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/hvals
   */
  hvals = (...args) => new HValsCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/incr
   */
  incr = (...args) => new IncrCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/incrby
   */
  incrby = (...args) => new IncrByCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/incrbyfloat
   */
  incrbyfloat = (...args) => new IncrByFloatCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/keys
   */
  keys = (...args) => new KeysCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lindex
   */
  lindex = (...args) => new LIndexCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/linsert
   */
  linsert = (key, direction, pivot, value) => new LInsertCommand([key, direction, pivot, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/llen
   */
  llen = (...args) => new LLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lmove
   */
  lmove = (...args) => new LMoveCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lpop
   */
  lpop = (...args) => new LPopCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lmpop
   */
  lmpop = (...args) => new LmPopCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lpos
   */
  lpos = (...args) => new LPosCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lpush
   */
  lpush = (key, ...elements) => new LPushCommand([key, ...elements], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lpushx
   */
  lpushx = (key, ...elements) => new LPushXCommand([key, ...elements], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lrange
   */
  lrange = (...args) => new LRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lrem
   */
  lrem = (key, count, value) => new LRemCommand([key, count, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/lset
   */
  lset = (key, index, value) => new LSetCommand([key, index, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/ltrim
   */
  ltrim = (...args) => new LTrimCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/mget
   */
  mget = (...args) => new MGetCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/mset
   */
  mset = (kv) => new MSetCommand([kv], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/msetnx
   */
  msetnx = (kv) => new MSetNXCommand([kv], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/persist
   */
  persist = (...args) => new PersistCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pexpire
   */
  pexpire = (...args) => new PExpireCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pexpireat
   */
  pexpireat = (...args) => new PExpireAtCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pfadd
   */
  pfadd = (...args) => new PfAddCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pfcount
   */
  pfcount = (...args) => new PfCountCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/pfmerge
   */
  pfmerge = (...args) => new PfMergeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/ping
   */
  ping = (args) => new PingCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/psetex
   */
  psetex = (key, ttl, value) => new PSetEXCommand([key, ttl, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/psubscribe
   */
  psubscribe = (patterns) => {
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    return new Subscriber(this.client, patternArray, true, this.opts);
  };
  /**
   * @see https://redis.io/commands/pttl
   */
  pttl = (...args) => new PTtlCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/publish
   */
  publish = (...args) => new PublishCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/randomkey
   */
  randomkey = () => new RandomKeyCommand().exec(this.client);
  /**
   * @see https://redis.io/commands/rename
   */
  rename = (...args) => new RenameCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/renamenx
   */
  renamenx = (...args) => new RenameNXCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/rpop
   */
  rpop = (...args) => new RPopCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/rpush
   */
  rpush = (key, ...elements) => new RPushCommand([key, ...elements], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/rpushx
   */
  rpushx = (key, ...elements) => new RPushXCommand([key, ...elements], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sadd
   */
  sadd = (key, member, ...members) => new SAddCommand([key, member, ...members], this.opts).exec(this.client);
  scan(cursor, opts) {
    return new ScanCommand([cursor, opts], this.opts).exec(this.client);
  }
  /**
   * @see https://redis.io/commands/scard
   */
  scard = (...args) => new SCardCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/script-exists
   */
  scriptExists = (...args) => new ScriptExistsCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/script-flush
   */
  scriptFlush = (...args) => new ScriptFlushCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/script-load
   */
  scriptLoad = (...args) => new ScriptLoadCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sdiff
   */
  sdiff = (...args) => new SDiffCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sdiffstore
   */
  sdiffstore = (...args) => new SDiffStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/set
   */
  set = (key, value, opts) => new SetCommand([key, value, opts], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/setbit
   */
  setbit = (...args) => new SetBitCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/setex
   */
  setex = (key, ttl, value) => new SetExCommand([key, ttl, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/setnx
   */
  setnx = (key, value) => new SetNxCommand([key, value], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/setrange
   */
  setrange = (...args) => new SetRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sinter
   */
  sinter = (...args) => new SInterCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sintercard
   */
  sintercard = (...args) => new SInterCardCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sinterstore
   */
  sinterstore = (...args) => new SInterStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sismember
   */
  sismember = (key, member) => new SIsMemberCommand([key, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/smismember
   */
  smismember = (key, members) => new SMIsMemberCommand([key, members], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/smembers
   */
  smembers = (...args) => new SMembersCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/smove
   */
  smove = (source, destination, member) => new SMoveCommand([source, destination, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/spop
   */
  spop = (...args) => new SPopCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/srandmember
   */
  srandmember = (...args) => new SRandMemberCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/srem
   */
  srem = (key, ...members) => new SRemCommand([key, ...members], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sscan
   */
  sscan = (...args) => new SScanCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/strlen
   */
  strlen = (...args) => new StrLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/subscribe
   */
  subscribe = (channels) => {
    const channelArray = Array.isArray(channels) ? channels : [channels];
    return new Subscriber(this.client, channelArray, false, this.opts);
  };
  /**
   * @see https://redis.io/commands/sunion
   */
  sunion = (...args) => new SUnionCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/sunionstore
   */
  sunionstore = (...args) => new SUnionStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/time
   */
  time = () => new TimeCommand().exec(this.client);
  /**
   * @see https://redis.io/commands/touch
   */
  touch = (...args) => new TouchCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/ttl
   */
  ttl = (...args) => new TtlCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/type
   */
  type = (...args) => new TypeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/unlink
   */
  unlink = (...args) => new UnlinkCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xadd
   */
  xadd = (...args) => new XAddCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xack
   */
  xack = (...args) => new XAckCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xackdel
   */
  xackdel = (...args) => new XAckDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xdel
   */
  xdel = (...args) => new XDelCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xdelex
   */
  xdelex = (...args) => new XDelExCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xgroup
   */
  xgroup = (...args) => new XGroupCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xread
   */
  xread = (...args) => new XReadCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xreadgroup
   */
  xreadgroup = (...args) => new XReadGroupCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xinfo
   */
  xinfo = (...args) => new XInfoCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xlen
   */
  xlen = (...args) => new XLenCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xpending
   */
  xpending = (...args) => new XPendingCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xclaim
   */
  xclaim = (...args) => new XClaimCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xautoclaim
   */
  xautoclaim = (...args) => new XAutoClaim(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xtrim
   */
  xtrim = (...args) => new XTrimCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xrange
   */
  xrange = (...args) => new XRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/xrevrange
   */
  xrevrange = (...args) => new XRevRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zadd
   */
  zadd = (...args) => {
    if ("score" in args[1]) {
      return new ZAddCommand([args[0], args[1], ...args.slice(2)], this.opts).exec(
        this.client
      );
    }
    return new ZAddCommand(
      [args[0], args[1], ...args.slice(2)],
      this.opts
    ).exec(this.client);
  };
  /**
   * @see https://redis.io/commands/zcard
   */
  zcard = (...args) => new ZCardCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zcount
   */
  zcount = (...args) => new ZCountCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zdiffstore
   */
  zdiffstore = (...args) => new ZDiffStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zincrby
   */
  zincrby = (key, increment, member) => new ZIncrByCommand([key, increment, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zinterstore
   */
  zinterstore = (...args) => new ZInterStoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zlexcount
   */
  zlexcount = (...args) => new ZLexCountCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zmscore
   */
  zmscore = (...args) => new ZMScoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zpopmax
   */
  zpopmax = (...args) => new ZPopMaxCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zpopmin
   */
  zpopmin = (...args) => new ZPopMinCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zrange
   */
  zrange = (...args) => new ZRangeCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zrank
   */
  zrank = (key, member) => new ZRankCommand([key, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zrem
   */
  zrem = (key, ...members) => new ZRemCommand([key, ...members], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zremrangebylex
   */
  zremrangebylex = (...args) => new ZRemRangeByLexCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zremrangebyrank
   */
  zremrangebyrank = (...args) => new ZRemRangeByRankCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zremrangebyscore
   */
  zremrangebyscore = (...args) => new ZRemRangeByScoreCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zrevrank
   */
  zrevrank = (key, member) => new ZRevRankCommand([key, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zscan
   */
  zscan = (...args) => new ZScanCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zscore
   */
  zscore = (key, member) => new ZScoreCommand([key, member], this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zunion
   */
  zunion = (...args) => new ZUnionCommand(args, this.opts).exec(this.client);
  /**
   * @see https://redis.io/commands/zunionstore
   */
  zunionstore = (...args) => new ZUnionStoreCommand(args, this.opts).exec(this.client);
};
var VERSION = "v1.30.2";

// node_modules/@upstash/redis/nodejs.mjs
var BUILD = /* @__PURE__ */ Symbol("build");
var TextFieldBuilder = class _TextFieldBuilder {
  _noTokenize;
  _noStem;
  _from;
  constructor(noTokenize = { noTokenize: false }, noStem = { noStem: false }, from = { from: null }) {
    this._noTokenize = noTokenize;
    this._noStem = noStem;
    this._from = from;
  }
  noTokenize() {
    return new _TextFieldBuilder({ noTokenize: true }, this._noStem, this._from);
  }
  noStem() {
    return new _TextFieldBuilder(this._noTokenize, { noStem: true }, this._from);
  }
  from(field) {
    return new _TextFieldBuilder(this._noTokenize, this._noStem, { from: field });
  }
  [BUILD]() {
    return {
      type: "TEXT",
      ...this._noTokenize.noTokenize ? { noTokenize: true } : {},
      ...this._noStem.noStem ? { noStem: true } : {},
      ...this._from.from ? { from: this._from.from } : {}
    };
  }
};
var NumericFieldBuilder = class _NumericFieldBuilder {
  type;
  _from;
  constructor(type, from = { from: null }) {
    this.type = type;
    this._from = from;
  }
  from(field) {
    return new _NumericFieldBuilder(this.type, { from: field });
  }
  [BUILD]() {
    return this._from.from ? {
      type: this.type,
      fast: true,
      from: this._from.from
    } : {
      type: this.type,
      fast: true
    };
  }
};
var BoolFieldBuilder = class _BoolFieldBuilder {
  _fast;
  _from;
  constructor(fast = { fast: false }, from = { from: null }) {
    this._fast = fast;
    this._from = from;
  }
  fast() {
    return new _BoolFieldBuilder({ fast: true }, this._from);
  }
  from(field) {
    return new _BoolFieldBuilder(this._fast, { from: field });
  }
  [BUILD]() {
    const hasFast = this._fast.fast;
    const hasFrom = Boolean(this._from.from);
    if (hasFast && hasFrom) {
      return {
        type: "BOOL",
        fast: true,
        from: this._from.from
      };
    }
    if (hasFast) {
      return {
        type: "BOOL",
        fast: true
      };
    }
    if (hasFrom) {
      return {
        type: "BOOL",
        from: this._from.from
      };
    }
    return { type: "BOOL" };
  }
};
var DateFieldBuilder = class _DateFieldBuilder {
  _fast;
  _from;
  constructor(fast = { fast: false }, from = { from: null }) {
    this._fast = fast;
    this._from = from;
  }
  fast() {
    return new _DateFieldBuilder({ fast: true }, this._from);
  }
  from(field) {
    return new _DateFieldBuilder(this._fast, { from: field });
  }
  [BUILD]() {
    const hasFast = this._fast.fast;
    const hasFrom = Boolean(this._from.from);
    if (hasFast && hasFrom) {
      return {
        type: "DATE",
        fast: true,
        from: this._from.from
      };
    }
    if (hasFast) {
      return {
        type: "DATE",
        fast: true
      };
    }
    if (hasFrom) {
      return {
        type: "DATE",
        from: this._from.from
      };
    }
    return { type: "DATE" };
  }
};
var KeywordFieldBuilder = class {
  [BUILD]() {
    return { type: "KEYWORD" };
  }
};
var FacetFieldBuilder = class {
  [BUILD]() {
    return { type: "FACET" };
  }
};
if (typeof atob === "undefined") {
  global.atob = (b64) => Buffer.from(b64, "base64").toString("utf8");
}
var Redis2 = class _Redis extends Redis {
  /**
   * Create a new redis client by providing a custom `Requester` implementation
   *
   * @example
   * ```ts
   *
   * import { UpstashRequest, Requester, UpstashResponse, Redis } from "@upstash/redis"
   *
   *  const requester: Requester = {
   *    request: <TResult>(req: UpstashRequest): Promise<UpstashResponse<TResult>> => {
   *      // ...
   *    }
   *  }
   *
   * const redis = new Redis(requester)
   * ```
   */
  constructor(configOrRequester) {
    if ("request" in configOrRequester) {
      super(configOrRequester);
      return;
    }
    if (!configOrRequester.url) {
      console.warn(
        `[Upstash Redis] The 'url' property is missing or undefined in your Redis config.`
      );
    } else if (configOrRequester.url.startsWith(" ") || configOrRequester.url.endsWith(" ") || /\r|\n/.test(configOrRequester.url)) {
      console.warn(
        "[Upstash Redis] The redis url contains whitespace or newline, which can cause errors!"
      );
    }
    if (!configOrRequester.token) {
      console.warn(
        `[Upstash Redis] The 'token' property is missing or undefined in your Redis config.`
      );
    } else if (configOrRequester.token.startsWith(" ") || configOrRequester.token.endsWith(" ") || /\r|\n/.test(configOrRequester.token)) {
      console.warn(
        "[Upstash Redis] The redis token contains whitespace or newline, which can cause errors!"
      );
    }
    const client = new HttpClient({
      baseUrl: configOrRequester.url,
      retry: configOrRequester.retry,
      headers: { authorization: `Bearer ${configOrRequester.token}` },
      agent: configOrRequester.agent,
      responseEncoding: configOrRequester.responseEncoding,
      cache: configOrRequester.cache ?? "no-store",
      signal: configOrRequester.signal,
      keepAlive: configOrRequester.keepAlive,
      readYourWrites: configOrRequester.readYourWrites
    });
    const safeEnv = typeof process === "object" && process && typeof process.env === "object" && process.env ? process.env : {};
    super(client, {
      automaticDeserialization: configOrRequester.automaticDeserialization,
      enableTelemetry: configOrRequester.enableTelemetry ?? !safeEnv.UPSTASH_DISABLE_TELEMETRY,
      latencyLogging: configOrRequester.latencyLogging,
      enableAutoPipelining: configOrRequester.enableAutoPipelining
    });
    const nodeVersion = typeof process === "object" && process ? process.version : void 0;
    this.addTelemetry({
      runtime: (
        // @ts-expect-error to silence compiler
        typeof EdgeRuntime === "string" ? "edge-light" : nodeVersion ? `node@${nodeVersion}` : "unknown"
      ),
      platform: safeEnv.UPSTASH_CONSOLE ? "console" : safeEnv.VERCEL ? "vercel" : safeEnv.AWS_REGION ? "aws" : "unknown",
      sdk: `@upstash/redis@${VERSION}`
    });
    if (this.enableAutoPipelining) {
      return this.autoPipeline();
    }
  }
  /**
   * Create a new Upstash Redis instance from environment variables.
   *
   * Use this to automatically load connection secrets from your environment
   * variables. For instance when using the Vercel integration.
   *
   * This tries to load connection details from your environment using `process.env`:
   * - URL: `UPSTASH_REDIS_REST_URL` or fallback to `KV_REST_API_URL`
   * - Token: `UPSTASH_REDIS_REST_TOKEN` or fallback to `KV_REST_API_TOKEN`
   *
   * The fallback variables provide compatibility with Vercel KV and other platforms
   * that may use different naming conventions.
   */
  static fromEnv(config2) {
    if (typeof process !== "object" || !process || typeof process.env !== "object" || !process.env) {
      throw new TypeError(
        '[Upstash Redis] Unable to get environment variables, `process.env` is undefined. If you are deploying to cloudflare, please import from "@upstash/redis/cloudflare" instead'
      );
    }
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    if (!url) {
      console.warn("[Upstash Redis] Unable to find environment variable: `UPSTASH_REDIS_REST_URL`");
    }
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    if (!token) {
      console.warn(
        "[Upstash Redis] Unable to find environment variable: `UPSTASH_REDIS_REST_TOKEN`"
      );
    }
    return new _Redis({ ...config2, url, token });
  }
};

// server/_shared/rate-limit.ts
init_client_ip();

// api/_upstash-json.js
function getRedisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}
async function redisPipeline(commands, timeoutMs = 5e3) {
  const creds = getRedisCredentials();
  if (!creds) return null;
  if (!Array.isArray(commands)) return null;
  try {
    const resp = await fetch(`${creds.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor-edge/1.0"
      },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!resp.ok) return null;
    const entries = await resp.json();
    if (!Array.isArray(entries) || entries.length !== commands.length) return null;
    return entries;
  } catch {
    return null;
  }
}

// api/_rate-limit-fallback.js
var FALLBACK_REDIS_TIMEOUT_MS = 1e3;
var luaUnsupported = false;
function durationToSeconds(window) {
  const match = /^(\d+)\s?(ms|s|m|h|d)$/.exec(window);
  if (!match) throw new Error(`Unable to parse rate-limit window: ${window}`);
  const value = Number(match[1]);
  const unit = match[2] ?? "s";
  const unitSeconds = { ms: 1e-3, s: 1, m: 60, h: 3600, d: 86400 };
  return Math.max(1, Math.ceil(value * (unitSeconds[unit] ?? 1)));
}
function commandError(entry, command) {
  if (!entry?.error) return null;
  return new Error(`rate-limit fallback: ${command} failed: ${entry.error}`);
}
async function fixedWindowLimit(key, limit, windowSeconds) {
  const result = await redisPipeline([
    ["INCR", key],
    ["EXPIRE", key, String(windowSeconds), "NX"],
    ["TTL", key]
  ], FALLBACK_REDIS_TIMEOUT_MS);
  if (!result) throw new Error("rate-limit fallback: Redis pipeline unavailable");
  const incrError = commandError(result[0], "INCR");
  if (incrError) throw incrError;
  const expireError = commandError(result[1], "EXPIRE");
  if (expireError) throw expireError;
  const ttlError = commandError(result[2], "TTL");
  if (ttlError) throw ttlError;
  const count = Number(result[0]?.result ?? 0);
  if (!Number.isFinite(count) || count < 1) {
    throw new Error(`rate-limit fallback: invalid Redis counter (${String(result[0]?.result)})`);
  }
  const ttlRaw = Number(result[2]?.result ?? -1);
  if (!Number.isFinite(ttlRaw) || ttlRaw < 0) {
    throw new Error(`rate-limit fallback: Redis key has no expiry (ttl=${String(result[2]?.result ?? "missing")})`);
  }
  return { success: count <= limit, limit, reset: Date.now() + ttlRaw * 1e3 };
}
async function limitWithFallback(rl, identifier, fallbackKey, limit, windowSeconds) {
  if (!luaUnsupported) {
    try {
      return await rl.limit(identifier);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/Command not allowed: (EVAL|EVALSHA|SCRIPT)\b/i.test(msg)) throw err;
      luaUnsupported = true;
      console.warn("[rate-limit] EVAL/EVALSHA rejected by this Redis endpoint \u2014 switching to the non-Lua fixed-window fallback for the rest of this process");
    }
  }
  try {
    return await fixedWindowLimit(fallbackKey, limit, windowSeconds);
  } catch (err) {
    throw new Error("rate-limit fallback: Redis unavailable", { cause: err });
  }
}

// server/_shared/rate-limit.ts
init_client_ip();
var REDIS_TEST_RETRY_OPTS = process.env.NODE_TEST_CONTEXT ? { retry: false } : {};
var ENDPOINT_RATE_LIMIT_TIMEOUT_MS = process.env.NODE_TEST_CONTEXT ? 250 : 5e3;
var ENDPOINT_REDIS_ABORT_TIMEOUT_MS = process.env.NODE_TEST_CONTEXT ? 20 : 4500;
var __ENDPOINT_LIMITER_DEADLINES_FOR_TEST = Object.freeze({
  decisionMs: ENDPOINT_RATE_LIMIT_TIMEOUT_MS,
  abortMs: ENDPOINT_REDIS_ABORT_TIMEOUT_MS
});
var ratelimit = null;
var GLOBAL_RATE_LIMIT = 600;
var GLOBAL_RATE_WINDOW = "60 s";
var GLOBAL_RATE_WINDOW_SECONDS = durationToSeconds(GLOBAL_RATE_WINDOW);
function getRatelimit() {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  ratelimit = new import_ratelimit.Ratelimit({
    redis: new Redis2({ url, token, ...REDIS_TEST_RETRY_OPTS }),
    limiter: import_ratelimit.Ratelimit.slidingWindow(GLOBAL_RATE_LIMIT, GLOBAL_RATE_WINDOW),
    prefix: "rl",
    analytics: false
  });
  return ratelimit;
}
function rateLimitErrorLevel(stage, msg) {
  if (stage.includes("missing-config")) return "error";
  if (/Error running script|execution timed out|Command failed|ETIMEDOUT|ECONNRESET|ENOTFOUND|fetch failed|network|timed out|aborted due to timeout|TimeoutError|socket hang up|Redis unavailable|Redis unreachable/i.test(msg)) {
    return "warning";
  }
  return "error";
}
var RATE_LIMIT_SENTRY_DEDUP_MS = 6e4;
var lastRateLimitSentryCaptureAt = /* @__PURE__ */ new Map();
var RATE_LIMIT_FINGERPRINT_SUFFIXES = /* @__PURE__ */ new Set(["missing-config", "timeout"]);
function rateLimitFingerprintStage(stage) {
  const parts = String(stage ?? "").split(":");
  const head = parts[0] || "rate-limit";
  const last = (parts.length > 1 ? parts[parts.length - 1] : "") ?? "";
  return RATE_LIMIT_FINGERPRINT_SUFFIXES.has(last) ? `${head}:${last}` : head;
}
function logRateLimitDegraded(stage, err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[rate-limit] redis-error stage=${stage} msg=${msg}`);
  const now = Date.now();
  const lastCaptureAt = lastRateLimitSentryCaptureAt.get(stage);
  if (lastCaptureAt !== void 0 && now - lastCaptureAt < RATE_LIMIT_SENTRY_DEDUP_MS) return;
  lastRateLimitSentryCaptureAt.set(stage, now);
  captureSilentError(err, {
    tags: { surface: "server", component: "rate-limit", stage },
    fingerprint: ["rate-limit", "redis-error", rateLimitFingerprintStage(stage)],
    level: rateLimitErrorLevel(stage, msg)
  });
}
var scopedMissingConfigStages = /* @__PURE__ */ new Set();
function logScopedRateLimitMissingConfig(scope) {
  const stage = `checkScopedRateLimit:${scope}:missing-config`;
  if (scopedMissingConfigStages.has(stage)) return;
  scopedMissingConfigStages.add(stage);
  logRateLimitDegraded(stage, new Error("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing"));
}
var RATE_LIMIT_DEGRADED_HEADERS = {
  "X-RateLimit-Mode": "degraded",
  // Short Retry-After encourages clients to retry once the limiter is back,
  // rather than treating the 503 as a hard outage.
  "Retry-After": "5"
};
function tooManyRequestsResponse(limit, reset, corsHeaders, windowSeconds) {
  const resetSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1e3));
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      // IETF RateLimit fields (draft-ietf-httpapi-ratelimit-headers). The
      // combined RateLimit member references the "default" policy advertised on
      // every API response via vercel.json so agents can self-throttle. Mirrors
      // api/_rate-limit.js.
      "RateLimit-Policy": `"default";q=${limit};w=${windowSeconds}`,
      "RateLimit-Limit": String(limit),
      "RateLimit-Remaining": "0",
      "RateLimit-Reset": String(resetSeconds),
      RateLimit: `"default";r=0;t=${resetSeconds}`,
      // Legacy X-RateLimit-* retained for back-compat (Reset is epoch-ms).
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(reset),
      "Retry-After": String(resetSeconds),
      ...corsHeaders
    }
  });
}
function rateLimitDegradedResponse(corsHeaders) {
  return new Response(JSON.stringify({ error: "Rate-limit service temporarily unavailable" }), {
    status: 503,
    headers: {
      "Content-Type": "application/json",
      ...RATE_LIMIT_DEGRADED_HEADERS,
      ...corsHeaders
    }
  });
}
function getPrincipalRateLimitIdentifier(principalUserId) {
  return principalUserId ? `user:${principalUserId}` : null;
}
async function checkRateLimit(request, corsHeaders, opts = {}) {
  const rl = getRatelimit();
  if (!rl) {
    if (opts.failClosed) {
      logRateLimitDegraded("checkRateLimit:missing-config", new Error("Upstash Redis is not configured"));
      return rateLimitDegradedResponse(corsHeaders);
    }
    return null;
  }
  const identifier = getPrincipalRateLimitIdentifier(opts.principalUserId) ?? getClientIp(request);
  try {
    const { success, limit, reset } = await limitWithFallback(
      rl,
      identifier,
      `rl:fw:${identifier}`,
      GLOBAL_RATE_LIMIT,
      GLOBAL_RATE_WINDOW_SECONDS
    );
    if (!success) {
      return tooManyRequestsResponse(limit, reset, corsHeaders, GLOBAL_RATE_WINDOW_SECONDS);
    }
    return null;
  } catch (err) {
    logRateLimitDegraded("checkRateLimit", err);
    if (opts.failClosed) return rateLimitDegradedResponse(corsHeaders);
    return null;
  }
}
var ENDPOINT_RATE_POLICIES = {
  // LLM article summarization is Pro-gated, but still needs a scoped,
  // fail-closed budget so Redis degradation cannot silently lift the
  // per-endpoint spend control.
  "/api/news/v1/summarize-article": { limit: 30, window: "60 s" },
  "/api/news/v1/summarize-article-cache": { limit: 3e3, window: "60 s" },
  "/api/intelligence/v1/classify-event": { limit: 600, window: "60 s" },
  // LLM-backed situational deduction (imports callLlmReasoning) can drive
  // provider spend on cache misses, so it must fail closed on Redis outage
  // rather than inherit the global fail-open fallback. Mirror the sibling
  // classify-event budget (same limit/window) — both are AI-backed Intelligence
  // RPCs. (#4676)
  "/api/intelligence/v1/deduct-situation": { limit: 600, window: "60 s" },
  // Historical intelligence memory (#5694): both semantic routes embed the
  // caller's free text through the OpenRouter embeddings API on every cache
  // miss, so they are provider-backed spend, not pure reads. They are also
  // premium-gated, which means the gateway serves them with no CDN cache — a
  // The three intel-history reads. All are Pro-gated and reach the function on
  // every request, but they spend two different budgets, so they are sized
  // against two different ceilings.
  //
  // search + similar-events each embed their input on a paid provider. They
  // share ONE budget while the registry is keyed per PATH, so a caller
  // alternating them gets the sum, not the cap — 30/min each holds the
  // combined worst case at the 60/min per-principal embeddings bill this is
  // sized for. Still generous for interactive use (a search plus follow-ups),
  // and far under the LLM routes' 600/min because nothing here runs in a
  // page-load fan-out.
  //
  // timeline embeds nothing, which is why it originally carried no policy at
  // all. That reasoning was right about money and wrong about the resource
  // that actually scales with retention: Convex reads whole documents, and
  // every intelHistory row carries a 512-float embedding the projection
  // immediately discards. One limit=200 call scoped by both domain and
  // country scans TIMELINE_MAX_SCAN=800 rows (4x over-fetch for the
  // post-filter) — roughly 3MB of Convex read budget, which the 600/min
  // availability-first fallback did not bound. 120/min keeps a timeline read
  // comfortable while capping that worst case.
  "/api/intelligence/v1/search-intel-history": { limit: 30, window: "60 s" },
  "/api/intelligence/v1/get-similar-events": { limit: 30, window: "60 s" },
  "/api/intelligence/v1/get-intel-timeline": { limit: 120, window: "60 s" },
  // Batch humanitarian-summary fans out to the external HAPI (humdata) provider
  // on cache miss — up to 25 countries per request, 5 concurrent upstream
  // fetches. Batch aircraft-details fans out to the external Wingbits provider —
  // up to 10 ICAO24 lookups per request. Both proxy external providers, so keep
  // them at the same 30/min budget as the other provider-proxy routes
  // (sanctions lookup / resilience ranking); conservative because a single
  // request already amplifies into many upstream calls. (#4676)
  "/api/conflict/v1/get-humanitarian-summary-batch": { limit: 30, window: "60 s" },
  "/api/military/v1/get-aircraft-details-batch": { limit: 30, window: "60 s" },
  // Generic batch fan-out: one request re-dispatches up to 20 gateway GETs, so
  // cap the multiplier at the same 30/min budget as the other batch routes.
  "/api/batch/v1/execute": { limit: 30, window: "60 s" },
  // Legacy /api/sanctions-entity-search rate limit was 30/min per IP. Preserve
  // that budget now that LookupSanctionEntity proxies OpenSanctions live.
  "/api/sanctions/v1/lookup-sanction-entity": { limit: 30, window: "60 s" },
  // Corporate intelligence (#5695): each cache miss proxies SEC EDGAR and/or
  // Finnhub on the caller's behalf, and the per-company inputs are effectively
  // unbounded (any ticker/name/domain), so these cannot inherit the fail-open
  // global fallback. Same 30/min provider-proxy budget as the sanctions lookup
  // and batch fan-out routes above.
  "/api/intelligence/v1/get-company-enrichment": { limit: 30, window: "60 s" },
  "/api/intelligence/v1/list-company-signals": { limit: 30, window: "60 s" },
  "/api/intelligence/v1/search-sec-filings": { limit: 30, window: "60 s" },
  // Public market/economic provider proxies (#6236): caller-controlled symbols,
  // indicators, and year ranges create unbounded cache-key cardinality; the
  // country-index route is bounded to the 45-country contract but still
  // proxies Yahoo Finance on a cache miss. None may inherit the global
  // fail-open budget. The dashboard can legitimately fan out across 50 Pro
  // watchlist symbols, so those three per-symbol routes admit one full load
  // plus headroom. analyze-stock remains separately constrained by the
  // fail-closed per-user daily direct-LLM quota.
  "/api/market/v1/analyze-stock": { limit: 60, window: "60 s" },
  "/api/market/v1/backtest-stock": { limit: 60, window: "60 s" },
  "/api/market/v1/get-insider-transactions": { limit: 60, window: "60 s" },
  "/api/market/v1/get-country-stock-index": { limit: 30, window: "60 s" },
  // Stablecoins are seed-backed for the DEFAULT request, but naming coins the
  // snapshot does not carry reaches CoinGecko, and the caller picks the IDs —
  // unbounded cardinality, so the per-ID-set cache cannot bound spend alone.
  //
  // Sized against the dashboard, not the provider: this path is in
  // PRO_FRESH_CACHE_RPC_PATHS, so it carries a panel that refreshes on a timer
  // for every open dashboard, and the limit is per-IP for anonymous traffic —
  // one office NAT is one bucket. 60/min matches the sibling per-symbol market
  // routes, which are likewise sized to admit a full legitimate load plus
  // headroom rather than to price the upstream call.
  //
  // Note this makes the route fail closed on a Redis outage, which the four
  // other panels in PRO_FRESH_CACHE_RPC_PATHS are not. That is survivable
  // because the handler cannot serve data during that outage either (the seed
  // read is the same Redis) — and it deliberately performs no provider work
  // when that read fails, so the fail-closed 503 is a second line, not the
  // only thing standing between a Redis outage and a CoinGecko fan-out. (#6308)
  "/api/market/v1/list-stablecoin-markets": { limit: 60, window: "60 s" },
  "/api/economic/v1/list-world-bank-indicators": { limit: 30, window: "60 s" },
  // #6305: list-market-quotes stopped being a pure seed read. The fixed seed
  // still answers the default universe with no upstream call, but a symbol the
  // seed does not carry (a custom watchlist ticker) now resolves through the
  // bounded, Redis-cached Finnhub gap fetch — so caller-controlled symbols can
  // reach a paid provider and this route can no longer inherit the fail-open
  // global budget. Same 60/min as the sibling per-symbol market routes: the
  // dashboard issues one multi-symbol call per refresh and the response is
  // CDN-cached (medium tier), so 60/min is far above any legitimate per-IP
  // load. Provider spend is separately capped at MARKET_QUOTES_UPSTREAM_LIMIT
  // lookups per request.
  "/api/market/v1/list-market-quotes": { limit: 60, window: "60 s" },
  // Company Monitoring is contract-only and remains unrouted until #6003
  // passes, but generated mutation routes still need a fail-closed policy
  // before any later lane can wire them. Import can carry 100 rows, so keep its
  // request budget lower than the single-company mutations.
  "/api/company-monitoring/v1/create-monitored-company": { limit: 30, window: "60 s" },
  "/api/company-monitoring/v1/update-monitored-company": { limit: 30, window: "60 s" },
  "/api/company-monitoring/v1/set-monitored-company-state": { limit: 30, window: "60 s" },
  "/api/company-monitoring/v1/import-monitored-company-batch": { limit: 10, window: "60 s" },
  // Lead capture: preserve the 3/hr and 5/hr budgets from legacy api/contact.js
  // and api/register-interest.js. Lower limits than normal IP rate limit since
  // these hit Convex + Resend per request.
  "/api/leads/v1/submit-contact": { limit: 3, window: "1 h" },
  "/api/leads/v1/register-interest": { limit: 5, window: "1 h" },
  // Scenario engine: legacy /api/scenario/v1/run capped at 10 jobs/min/IP via
  // inline Upstash INCR. Gateway preserves the same budget while using a
  // trusted paid-user principal when available, otherwise the client IP.
  "/api/scenario/v1/run-scenario": { limit: 10, window: "60 s" },
  // #3734: trigger-simulation PRO endpoint, same shape as run-scenario.
  // It follows the same trusted-principal-or-IP attribution contract.
  "/api/forecast/v1/trigger-simulation": { limit: 10, window: "60 s" },
  // Live tanker map (Energy Atlas): one user with 6 chokepoints × 1 call/min
  // = 6 req/min/IP base load. 60/min headroom covers tab refreshes + zoom
  // pans within a single user without flagging legitimate traffic.
  "/api/maritime/v1/get-vessel-snapshot": { limit: 60, window: "60 s" },
  // Country Resilience ranking can synchronously warm the full country table
  // on cold/stale cache paths; keep it well below the global 600/min fallback.
  "/api/resilience/v1/get-resilience-ranking": { limit: 30, window: "60 s" },
  // #3805 / PR #3821: MCP proxy is a top-level Vercel Edge Function in
  // `api/mcp-proxy.ts` (registered as `external-protocol` in
  // api/api-route-exceptions.json — JSON-RPC shape dictated by the MCP spec),
  // so it does NOT flow through the gateway and `checkEndpointRateLimit`
  // never fires for it. The handler reads this policy and enforces it
  // in-handler via `checkScopedRateLimit` — keeping the registry as the
  // single source of truth so future audit additions (and the
  // enforce-rate-limit-policies lint) see the endpoint. The audit script
  // resolves edge-function paths via api/api-route-exceptions.json instead
  // of the OpenAPI specs.
  "/api/mcp-proxy": { limit: 30, window: "60 s" },
  // Docs MCP facade (`api/docs-mcp.ts`, external-protocol exception — serves
  // /docs/mcp, proxying the Mintlify docs MCP server and lifting its
  // protocol-level tool-call failures into proper JSON-RPC error objects).
  // Anonymous by design (upstream is fully public), so the per-IP minute
  // limit is the whole abuse defence; 60/min mirrors the MCP public-method
  // posture. Enforced in-handler via `checkScopedRateLimit`, same pattern as
  // /api/mcp-proxy.
  "/api/docs-mcp": { limit: 60, window: "60 s" },
  // A2A concierge endpoint (`api/a2a.ts`, external-protocol exception —
  // JSON-RPC shape dictated by the A2A spec, served at /a2a). Anonymous and
  // quota-free by design (routes over the public tool catalog + public
  // freshness envelope only), so the per-IP minute limit is the whole abuse
  // defence; 60/min mirrors the MCP public-method posture. Enforced
  // in-handler via `checkScopedRateLimit`, same pattern as /api/mcp-proxy.
  "/api/a2a": { limit: 60, window: "60 s" },
  // NLWeb /ask endpoint (`api/ask.ts`, external-protocol exception — request/
  // response shape dictated by the NLWeb spec, served at /ask). Same anonymous
  // cheap-catalog posture as /api/a2a, same in-handler enforcement.
  "/api/ask": { limit: 60, window: "60 s" },
  // Agent-skills import proxy (`api/skills/fetch-agentskills.ts`, registered
  // as `migration-pending` in api/api-route-exceptions.json). Fetches one
  // skill definition from a fixed three-host allowlist on agentskills.io.
  // Anonymous by design (the settings importer calls it same-origin before
  // the user has done anything privileged), so the per-IP minute limit is the
  // whole abuse defence; 30/min is the provider-proxy budget above, and the
  // handler also caches the fetched payload so repeat imports never leave our
  // edge. Enforced in-handler via `checkScopedRateLimit`, same pattern as
  // /api/docs-mcp. (#6234)
  "/api/skills/fetch-agentskills": { limit: 30, window: "60 s" },
  // Legacy `api/*.js` provider proxies (`api/youtube/live.js`,
  // `api/reverse-geocode.js`), both registered in
  // api/api-route-exceptions.json. Neither flows through the gateway, and
  // AGENTS.md forbids `api/*.js` from importing `../server/`, so unlike
  // /api/mcp-proxy they cannot read this registry at runtime: each handler
  // carries the same numbers as literal constants and enforces them with
  // `checkRateLimit` from `api/_rate-limit.js`. The registry stays the single
  // source of truth for the audit script and the docs, and
  // tests/rate-limit.test.mts fails if the two copies drift. (#6234)
  //
  // youtube/live: one request can fan out to the Railway relay AND a full
  // live-page HTML scrape of youtube.com, so it takes the same 30/min
  // provider-proxy budget as the batch fan-out routes above.
  "/api/youtube/live": { limit: 30, window: "60 s" },
  // reverse-geocode: already Upstash-cached on a 0.1-degree grid and memoized
  // per cell in the browser (src/utils/reverse-geocode.ts), so 60/min is a
  // floor against scripted coordinate sweeps rather than a throttle on real
  // map use. Nominatim's usage policy is the strictest in our stack and is
  // enforced by egress-IP ban, and there are two callers sharing one egress:
  // the legacy `api/reverse-geocode.js` edge function (which carries these
  // same numbers as literal constants and enforces them in-handler via
  // checkRateLimit — api/*.js cannot import ../server/) and the gateway RPC
  // below. Both use the shared `geocode:` cache namespace (604800 s TTL), so
  // a hit on either serves the other and the budget is a floor against
  // scripted sweeps, not a throttle on real map use. (#6234, #6432)
  "/api/reverse-geocode": { limit: 60, window: "60 s" },
  // Gateway reverse-geocode RPC (#6432): the second Nominatim caller. Same
  // provider, same shared 0.1-degree grid cache, same egress IPs — must carry
  // the same 60/min budget as the legacy edge route, and it now does. Both are
  // per-IP budgets, so they bound any one caller but do not cap aggregate
  // egress to Nominatim (60/min from a single IP is Nominatim's whole
  // documented allowance for the application); a global companion budget
  // keyed on 'reverse-geocode:global' is still required but is out of scope
  // for this change. Fail-closed on
  // Redis outage (default) — Nominatim's enforcement is an egress-IP ban, so
  // a degraded limiter must 503 rather than inherit the fail-open fallback.
  "/api/infrastructure/v1/reverse-geocode": { limit: 60, window: "60 s" }
};
var endpointLimiters = /* @__PURE__ */ new Map();
function getEndpointRatelimit(pathname) {
  const policy = ENDPOINT_RATE_POLICIES[pathname];
  if (!policy) return null;
  const cached = endpointLimiters.get(pathname);
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const rl = new import_ratelimit.Ratelimit({
    redis: new Redis2({
      url,
      token,
      ...REDIS_TEST_RETRY_OPTS,
      signal: () => AbortSignal.timeout(ENDPOINT_REDIS_ABORT_TIMEOUT_MS)
    }),
    limiter: import_ratelimit.Ratelimit.slidingWindow(policy.limit, policy.window),
    prefix: "rl:ep",
    analytics: false,
    timeout: ENDPOINT_RATE_LIMIT_TIMEOUT_MS
  });
  endpointLimiters.set(pathname, rl);
  return rl;
}
function hasEndpointRatePolicy(pathname) {
  return pathname in ENDPOINT_RATE_POLICIES;
}
async function checkEndpointRateLimit(request, pathname, corsHeaders, opts = {}) {
  if (!hasEndpointRatePolicy(pathname)) return null;
  const rl = getEndpointRatelimit(pathname);
  if (!rl) {
    const failClosed = opts.failClosed ?? true;
    if (failClosed) {
      logRateLimitDegraded(`checkEndpointRateLimit:${pathname}:missing-config`, new Error("Upstash Redis is not configured"));
      return rateLimitDegradedResponse(corsHeaders);
    }
    return null;
  }
  const identifier = getPrincipalRateLimitIdentifier(opts.principalUserId) ?? `ip:${getClientIp(request)}`;
  const policy = ENDPOINT_RATE_POLICIES[pathname];
  if (!policy) return null;
  try {
    const result = await limitWithFallback(rl, `${pathname}:${identifier}`, `rl:ep:fw:${pathname}:${identifier}`, policy.limit, durationToSeconds(policy.window));
    if (result.reason === "timeout") {
      throw new Error("Upstash endpoint rate-limit decision timed out");
    }
    const { success, limit, reset } = result;
    if (!success) {
      return tooManyRequestsResponse(limit, reset, corsHeaders, durationToSeconds(policy.window));
    }
    return null;
  } catch (err) {
    logRateLimitDegraded(`checkEndpointRateLimit:${pathname}`, err);
    const failClosed = opts.failClosed ?? true;
    if (failClosed) return rateLimitDegradedResponse(corsHeaders);
    return null;
  }
}
var scopedLimiters = /* @__PURE__ */ new Map();
function getScopedRatelimit(scope, limit, window) {
  const cacheKey = `${scope}|${limit}|${window}`;
  const cached = scopedLimiters.get(cacheKey);
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const rl = new import_ratelimit.Ratelimit({
    redis: new Redis2({ url, token, ...REDIS_TEST_RETRY_OPTS }),
    limiter: import_ratelimit.Ratelimit.slidingWindow(limit, window),
    prefix: "rl:scope",
    analytics: false
  });
  scopedLimiters.set(cacheKey, rl);
  return rl;
}
async function checkScopedRateLimit(scope, limit, window, identifier) {
  const rl = getScopedRatelimit(scope, limit, window);
  if (!rl) {
    logScopedRateLimitMissingConfig(scope);
    return { allowed: true, limit, reset: 0, degraded: true };
  }
  try {
    const result = await limitWithFallback(rl, `${scope}:${identifier}`, `rl:scope:fw:${scope}:${identifier}`, limit, durationToSeconds(window));
    if (result.reason === "timeout") {
      logRateLimitDegraded(`checkScopedRateLimit:${scope}`, new Error("Upstash scoped rate-limit decision timed out"));
      return { allowed: true, limit, reset: 0, degraded: true };
    }
    return {
      allowed: result.success,
      limit: result.limit,
      reset: result.reset,
      degraded: false
    };
  } catch (err) {
    logRateLimitDegraded(`checkScopedRateLimit:${scope}`, err);
    return { allowed: true, limit, reset: 0, degraded: true };
  }
}
async function checkFailClosedScopedIpRateLimit(request, scope, limit, window, corsHeaders) {
  const result = await checkScopedRateLimit(scope, limit, window, getClientIp(request));
  if (result.degraded) return rateLimitDegradedResponse(corsHeaders);
  if (!result.allowed) {
    return tooManyRequestsResponse(result.limit, result.reset, corsHeaders, durationToSeconds(window));
  }
  return null;
}

// server/_shared/response-headers.ts
var channel = /* @__PURE__ */ new WeakMap();
var retryableResponses = /* @__PURE__ */ new WeakSet();
function setResponseHeader(req, key, value) {
  let headers = channel.get(req);
  if (!headers) {
    headers = {};
    channel.set(req, headers);
  }
  headers[key] = value;
}
function markNoCacheResponse(req) {
  setResponseHeader(req, "X-No-Cache", "1");
}
function markNoStoreFallbackResponse(req, payload) {
  markNoCacheResponse(req);
  return payload;
}
function drainResponseHeaders(req) {
  const headers = channel.get(req);
  if (headers) channel.delete(req);
  return headers;
}
function drainRetryableResponse(req) {
  const retryable = retryableResponses.has(req);
  if (retryable) retryableResponses.delete(req);
  return retryable;
}
var statusOverrides = /* @__PURE__ */ new WeakMap();
function drainSuccessStatusOverride(req) {
  const status = statusOverrides.get(req);
  if (status !== void 0) statusOverrides.delete(req);
  return status;
}

// server/_shared/response-projection.ts
var import_jmespath = __toESM(require_jmespath(), 1);
var REST_JMESPATH_MAX_EXPR_BYTES = 1024;
var REST_JMESPATH_MAX_OUTPUT_BYTES = 256 * 1024;
function utf8ByteLength(value) {
  return new TextEncoder().encode(value).length;
}
function originalKeys(value) {
  if (Array.isArray(value)) return [`<array length=${value.length}>`];
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length <= 50) return keys;
    return [...keys.slice(0, 50), `...<${keys.length - 50} more>`];
  }
  return [`<${typeof value}>`];
}
function projectJsonResponse(bodyStr, expr) {
  const exprBytes = utf8ByteLength(expr);
  if (exprBytes > REST_JMESPATH_MAX_EXPR_BYTES) {
    let parsed = null;
    try {
      parsed = JSON.parse(bodyStr);
    } catch {
    }
    return {
      ok: false,
      envelope: {
        _jmespath_error: `expression_too_long: ${exprBytes} > ${REST_JMESPATH_MAX_EXPR_BYTES}`,
        original_keys: originalKeys(parsed)
      }
    };
  }
  let value;
  try {
    value = JSON.parse(bodyStr);
  } catch {
    return { ok: true, body: bodyStr };
  }
  let projected;
  try {
    projected = import_jmespath.default.search(value, expr);
  } catch (err) {
    const message2 = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      envelope: {
        _jmespath_error: `invalid_expression: ${message2}`,
        original_keys: originalKeys(value)
      }
    };
  }
  const text = JSON.stringify(projected);
  const body = text === void 0 ? "null" : text;
  const outputBytes = utf8ByteLength(body);
  if (outputBytes > REST_JMESPATH_MAX_OUTPUT_BYTES) {
    return {
      ok: false,
      envelope: {
        _jmespath_error: `projection_too_large: ${outputBytes} > ${REST_JMESPATH_MAX_OUTPUT_BYTES}`,
        original_keys: originalKeys(value)
      }
    };
  }
  return { ok: true, body };
}

// server/gateway.ts
init_cache_contract();

// server/_shared/pro-mcp-gate.ts
function checkProMcpAccess(entitlements, now, opts) {
  if (entitlements && entitlements.features && entitlements.features.tier >= 1 && entitlements.features.mcpAccess === true && entitlements.validUntil >= now) {
    return null;
  }
  if (!entitlements && opts?.backendConfigured === false) {
    return { kind: "billing_verification", denial: unverifiableEntitlementDenial() };
  }
  const billingInput = entitlements ? {
    ...entitlements,
    verificationUnavailable: entitlements.verificationUnavailable === true ? true : void 0
  } : entitlements;
  const denial = classifyBillingVerification(billingInput);
  return denial ? { kind: "billing_verification", denial } : { kind: "insufficient_tier" };
}

// server/_shared/auth-session.ts
init_auth_session();
async function resolveClerkSession(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const session = await validateBearerToken(authHeader.slice(7));
    if (!session.valid || !session.userId) return null;
    return {
      userId: session.userId,
      orgId: session.orgId ?? null,
      role: session.role ?? "free"
    };
  } catch (err) {
    console.warn(
      "[auth-session] JWT verification failed:",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}

// server/_shared/mcp-internal-hmac.ts
var INTERNAL_MCP_SIG_HEADER = "X-WM-MCP-Internal";
var INTERNAL_MCP_USER_ID_HEADER = "X-WM-MCP-User-Id";
var INTERNAL_MCP_NONCE_HEADER = "X-WM-MCP-Nonce";
var INTERNAL_MCP_VERIFIED_HEADER = "x-wm-mcp-internal-verified";
var TRUSTED_USER_ID_HEADER = "x-user-id";
var _verifiedNonce = null;
function getInternalMcpVerifiedNonce() {
  if (_verifiedNonce !== null) return _verifiedNonce;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  _verifiedNonce = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return _verifiedNonce;
}
var INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS = 30;
var INTERNAL_MCP_REPLAY_CACHE_TTL_SECONDS = 2 * INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS + 5;
async function sha256Hex(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function canonicalQueryString(searchOrUrl) {
  let search;
  if (searchOrUrl instanceof URL) {
    search = searchOrUrl.search;
  } else if (typeof searchOrUrl === "string") {
    if (searchOrUrl.startsWith("http://") || searchOrUrl.startsWith("https://")) {
      try {
        search = new URL(searchOrUrl).search;
      } catch {
        return "";
      }
    } else {
      search = searchOrUrl;
    }
  } else {
    return "";
  }
  if (!search || search === "?") return "";
  const trimmed = search.startsWith("?") ? search.slice(1) : search;
  if (!trimmed) return "";
  const params = new URLSearchParams(trimmed);
  const entries = [];
  for (const [k, v] of params) entries.push([k, v]);
  entries.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}
function buildHmacPayload(args) {
  return `${args.ts}:${args.method.toUpperCase()}:${args.pathname}:${args.queryHash}:${args.bodyHash}:${args.userId}:${args.nonce}`;
}
async function importHmacKey2(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
function bufferToBase64Url2(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function hmacSha256Base64Url(secret, payload) {
  const key = await importHmacKey2(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bufferToBase64Url2(sig);
}
function isValidInternalMcpNonce(nonce) {
  return /^[A-Za-z0-9_-]{16,128}$/.test(nonce);
}
async function timingSafeStringEqual(a, b) {
  const enc2 = new TextEncoder();
  const aHash = new Uint8Array(await crypto.subtle.digest("SHA-256", enc2.encode(a)));
  const bHash = new Uint8Array(await crypto.subtle.digest("SHA-256", enc2.encode(b)));
  let diff = 0;
  for (let i = 0; i < aHash.length; i++) diff |= aHash[i] ^ bHash[i];
  return diff === 0;
}
function parseSignatureHeader(value) {
  if (!value) return null;
  const dotIdx = value.indexOf(".");
  if (dotIdx <= 0 || dotIdx === value.length - 1) return null;
  if (value.indexOf(".", dotIdx + 1) !== -1) return null;
  const tsStr = value.slice(0, dotIdx);
  const sigB64u = value.slice(dotIdx + 1);
  if (!/^[0-9]{1,15}$/.test(tsStr)) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(sigB64u)) return null;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts) || ts < 0) return null;
  return { ts, sigB64u };
}
async function verifyInternalMcpRequest(req, secret, now) {
  if (!secret) return null;
  const sigHeader = req.headers.get(INTERNAL_MCP_SIG_HEADER);
  const userId = req.headers.get(INTERNAL_MCP_USER_ID_HEADER);
  const nonce = req.headers.get(INTERNAL_MCP_NONCE_HEADER);
  if (!sigHeader || !userId || !nonce || !isValidInternalMcpNonce(nonce)) return null;
  const parsed = parseSignatureHeader(sigHeader);
  if (!parsed) return null;
  const { ts, sigB64u } = parsed;
  const nowSec = Math.floor(now ?? Date.now() / 1e3);
  if (Math.abs(nowSec - ts) > INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS) return null;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return null;
  }
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] ?? "";
  const rpcParams = url.searchParams.getAll("rpc");
  if (rpcParams.length > 0 && rpcParams.every((v) => v === lastSegment)) {
    url.searchParams.delete("rpc");
  }
  let bodyBytes;
  try {
    const buf = await req.clone().arrayBuffer();
    bodyBytes = new Uint8Array(buf);
  } catch {
    return null;
  }
  const bodyAsString = bodyBytes.length === 0 ? "" : new TextDecoder().decode(bodyBytes);
  const queryHash = await sha256Hex(canonicalQueryString(url));
  const bodyHash = await sha256Hex(bodyAsString);
  const expectedPayload = buildHmacPayload({
    ts,
    method: req.method,
    pathname: url.pathname,
    queryHash,
    bodyHash,
    userId,
    nonce
  });
  const expectedSig = await hmacSha256Base64Url(secret, expectedPayload);
  const ok = await timingSafeStringEqual(expectedSig, sigB64u);
  if (!ok) return null;
  return { userId, nonce };
}

// server/_shared/usage-identity.ts
var ENTERPRISE_KEY_TO_CUSTOMER = {
  // 'wm_ent_xxxx': 'acme-corp',
};
function buildUsageIdentity(input) {
  const tier = input.tier ?? 0;
  if (input.isUserApiKey) {
    return {
      auth_kind: "user_api_key",
      principal_id: input.sessionUserId,
      customer_id: input.userApiKeyCustomerRef ?? input.sessionUserId,
      tier,
      plan_key: input.planKey
    };
  }
  if (input.sessionUserId) {
    return {
      auth_kind: "clerk_jwt",
      principal_id: input.sessionUserId,
      customer_id: input.clerkOrgId ?? input.sessionUserId,
      tier,
      plan_key: input.planKey
    };
  }
  if (input.enterpriseApiKey) {
    const customer = ENTERPRISE_KEY_TO_CUSTOMER[input.enterpriseApiKey] ?? "enterprise-unmapped";
    return {
      auth_kind: "enterprise_api_key",
      principal_id: hashKeySync(input.enterpriseApiKey),
      customer_id: customer,
      tier,
      plan_key: input.planKey ?? "enterprise"
    };
  }
  if (input.widgetKey) {
    return {
      auth_kind: "widget_key",
      principal_id: hashKeySync(input.widgetKey),
      customer_id: input.widgetKey,
      tier,
      plan_key: null
    };
  }
  return {
    auth_kind: "anon",
    principal_id: null,
    customer_id: null,
    tier: 0,
    plan_key: null
  };
}
function hashKeySync(key) {
  let h1 = 2166136261;
  let h2 = 2166136261 ^ 2746401236;
  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619);
    h2 ^= c + 2654435761;
    h2 = Math.imul(h2, 16777619);
  }
  const lo = (h1 >>> 0).toString(36);
  const hi = (h2 >>> 0).toString(36);
  return `${hi}${lo}`;
}

// server/gateway.ts
init_redis();

// server/_shared/idempotency.ts
init_redis();
var IDEMPOTENCY_HEADER = "Idempotency-Key";
var IDEMPOTENT_REPLAYED_HEADER = "Idempotent-Replayed";
var IDEMPOTENCY_EXEMPT_RPC_PATHS = /* @__PURE__ */ new Set([
  "/api/company-monitoring/v1/import-monitored-company-batch"
]);
var KEY_MAX_LENGTH = 255;
var KEY_PATTERN = /^[\x21-\x7e]{1,255}$/;
var PROCESSING_TTL_SECONDS = 180;
var COMPLETED_TTL_SECONDS = 24 * 60 * 60;
var MAX_STORED_BODY_BYTES = 256 * 1024;
var PROCESSING_MARKER = JSON.stringify({ state: "processing" });
function isValidIdempotencyKey(key) {
  return key.length <= KEY_MAX_LENGTH && KEY_PATTERN.test(key);
}
async function sha256Hex2(input) {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function isReplayableTextBody(contentType) {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return ct.includes("json") || ct.startsWith("text/");
}
function isRetryableStatus(status) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}
function anonScope(request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}
function jsonResponse(status, body, corsHeaders, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders,
      ...extraHeaders
    }
  });
}
async function getRequestHashAndRedisKey(request, pathname, scope, idempotencyKey) {
  try {
    const bodyBuf = await request.clone().arrayBuffer();
    const reqHash = await sha256Hex2(bodyBuf);
    const effectiveScope = scope || anonScope(request);
    const redisKey = `idem:v1:${await sha256Hex2(`${effectiveScope}
${pathname}
${idempotencyKey}`)}`;
    return { reqHash, redisKey };
  } catch {
    return null;
  }
}
function outcomeFromStoredRecord(raw, reqHash, idempotencyKey, corsHeaders) {
  if (raw == null) return { kind: "miss" };
  let record = null;
  if (typeof raw === "string") {
    try {
      record = JSON.parse(raw);
    } catch {
      record = null;
    }
  }
  if (!record) {
    return { kind: "disabled" };
  }
  if (record.state === "processing") {
    return {
      kind: "conflict",
      response: jsonResponse(
        409,
        {
          error: "idempotency_conflict",
          message: `A request with this ${IDEMPOTENCY_HEADER} is still being processed. Retry shortly.`
        },
        corsHeaders,
        { "Retry-After": "2", [IDEMPOTENCY_HEADER]: idempotencyKey }
      )
    };
  }
  if (record.reqHash !== reqHash) {
    return {
      kind: "mismatch",
      response: jsonResponse(
        422,
        {
          error: "idempotency_key_reused",
          message: `This ${IDEMPOTENCY_HEADER} was already used with a different request body.`
        },
        corsHeaders,
        { [IDEMPOTENCY_HEADER]: idempotencyKey }
      )
    };
  }
  return {
    kind: "replay",
    response: new Response(record.body, {
      status: record.status,
      headers: {
        "Content-Type": record.contentType ?? "application/json",
        "Cache-Control": "no-store",
        ...corsHeaders,
        [IDEMPOTENCY_HEADER]: idempotencyKey,
        [IDEMPOTENT_REPLAYED_HEADER]: "true"
      }
    })
  };
}
function isPipelineSuccess(entry, expected) {
  return entry?.error == null && entry?.result === expected;
}
async function releaseProcessingLock(redisKey) {
  await runRedisPipeline([["DEL", redisKey]]);
}
async function peekIdempotency(args) {
  const { request, pathname, scope, idempotencyKey, corsHeaders } = args;
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return {
      kind: "invalid",
      response: jsonResponse(
        400,
        {
          error: "invalid_idempotency_key",
          message: `The ${IDEMPOTENCY_HEADER} header must be 1-${KEY_MAX_LENGTH} printable ASCII characters.`
        },
        corsHeaders
      )
    };
  }
  const resolved = await getRequestHashAndRedisKey(request, pathname, scope, idempotencyKey);
  if (!resolved) return { kind: "disabled" };
  const pipeline = await runRedisPipeline([["GET", resolved.redisKey]]);
  if (pipeline.length < 1) return { kind: "disabled" };
  const entry = pipeline[0];
  if (entry?.error) return { kind: "disabled" };
  return outcomeFromStoredRecord(entry?.result, resolved.reqHash, idempotencyKey, corsHeaders);
}
async function beginIdempotency(args) {
  const { request, pathname, scope, idempotencyKey, corsHeaders } = args;
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return {
      kind: "invalid",
      response: jsonResponse(
        400,
        {
          error: "invalid_idempotency_key",
          message: `The ${IDEMPOTENCY_HEADER} header must be 1-${KEY_MAX_LENGTH} printable ASCII characters.`
        },
        corsHeaders
      )
    };
  }
  const resolved = await getRequestHashAndRedisKey(request, pathname, scope, idempotencyKey);
  if (!resolved) return { kind: "disabled" };
  const pipeline = await runRedisPipeline([
    ["SET", resolved.redisKey, PROCESSING_MARKER, "NX", "EX", String(PROCESSING_TTL_SECONDS)],
    ["GET", resolved.redisKey]
  ]);
  if (pipeline.length < 2) return { kind: "disabled" };
  const claim = pipeline[0];
  if (claim?.error) return { kind: "disabled" };
  const claimed = claim?.result === "OK";
  if (claimed) {
    return {
      kind: "proceed",
      key: idempotencyKey,
      store: (status, body, contentType) => storeResult(resolved.redisKey, status, body, contentType, resolved.reqHash)
    };
  }
  const raw = pipeline[1]?.result;
  const outcome = outcomeFromStoredRecord(raw, resolved.reqHash, idempotencyKey, corsHeaders);
  return outcome.kind === "miss" ? { kind: "disabled" } : outcome;
}
async function storeResult(redisKey, status, body, contentType, reqHash) {
  try {
    if (isRetryableStatus(status) || body.byteLength > MAX_STORED_BODY_BYTES || !isReplayableTextBody(contentType)) {
      await releaseProcessingLock(redisKey);
      return;
    }
    const record = {
      state: "completed",
      status,
      contentType,
      reqHash,
      body: new TextDecoder().decode(body)
    };
    const pipeline = await runRedisPipeline([
      ["SET", redisKey, JSON.stringify(record), "EX", String(COMPLETED_TTL_SECONDS)]
    ]);
    if (!isPipelineSuccess(pipeline[0], "OK")) {
      await releaseProcessingLock(redisKey);
    }
  } catch {
    try {
      await releaseProcessingLock(redisKey);
    } catch {
    }
  }
}

// server/_shared/api-key-rate-limit.ts
var import_ratelimit2 = __toESM(require_dist2(), 1);
init_redis();

// server/_shared/pro-mcp-token.ts
init_redis();
function secondsUntilUtcMidnight(now) {
  const d = now ?? /* @__PURE__ */ new Date();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0));
  return Math.max(1, Math.ceil((next.getTime() - d.getTime()) / 1e3));
}
var PRO_DAILY_QUOTA_TTL_SECONDS = 172800;

// server/_shared/api-key-rate-limit.ts
var ENTERPRISE_API_RATE_LIMIT = 1e3;
var redisSingleton = null;
var burstLimiters = /* @__PURE__ */ new Map();
function getRedis() {
  if (redisSingleton) return redisSingleton;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redisSingleton = process.env.NODE_TEST_CONTEXT ? new Redis2({ url, token, retry: false }) : new Redis2({ url, token });
  return redisSingleton;
}
function getBurstLimiter(perMinute) {
  const existing = burstLimiters.get(perMinute);
  if (existing) return existing;
  const redis = getRedis();
  if (!redis) return null;
  const limiter = new import_ratelimit2.Ratelimit({
    redis,
    limiter: import_ratelimit2.Ratelimit.slidingWindow(perMinute, "60 s"),
    // Env-scope the prefix exactly like the daily meter (runRedisPipeline's
    // prefixKey) so a preview deployment sharing one Upstash database doesn't
    // consume/pollute the production burst namespace. Empty in production.
    prefix: `${getKeyPrefix()}rl:apikey:min`,
    analytics: false
  });
  burstLimiters.set(perMinute, limiter);
  return limiter;
}
async function checkBurst(perMinute, identity) {
  const limiter = getBurstLimiter(perMinute);
  if (!limiter) return { ok: true };
  try {
    const { success, limit, reset } = await limiter.limit(identity);
    if (!success) return { ok: false, limit, reset };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
function apiKeyDailyKey(userId, date) {
  if (!userId) return "";
  const d = date ?? /* @__PURE__ */ new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `rl:apikey:day:${userId}:${yyyy}-${mm}-${dd}`;
}
var API_DAILY_TTL_SECONDS = 172800;
async function reserveDailyMeter(opts) {
  const { userId, allowance, pipeline, date } = opts;
  const noop = async () => {
  };
  const retryAfterSec = secondsUntilUtcMidnight(date);
  if (allowance <= 0) {
    return { count: 0, overLimit: false, metered: false, retryAfterSec, rollback: noop };
  }
  const key = apiKeyDailyKey(userId, date);
  if (!key) {
    return { count: 0, overLimit: false, metered: false, retryAfterSec, rollback: noop };
  }
  let pipeResult;
  try {
    pipeResult = await pipeline([
      ["INCR", key],
      ["EXPIRE", key, API_DAILY_TTL_SECONDS]
    ]);
  } catch {
    pipeResult = null;
  }
  if (!pipeResult || !Array.isArray(pipeResult) || pipeResult.length === 0) {
    return { count: 0, overLimit: false, metered: false, retryAfterSec, rollback: noop };
  }
  const incrRaw = pipeResult[0]?.result;
  const count = typeof incrRaw === "number" ? incrRaw : Number(incrRaw);
  if (!Number.isFinite(count) || count < 1) {
    return { count: 0, overLimit: false, metered: false, retryAfterSec, rollback: noop };
  }
  let rolledBack = false;
  const rollback = async () => {
    if (rolledBack) return;
    rolledBack = true;
    try {
      await pipeline([["DECR", key]]);
    } catch {
    }
  };
  return { count, overLimit: count > allowance, metered: true, retryAfterSec, rollback };
}
function rateLimitHeaders(opts) {
  const remaining = Math.max(0, opts.remaining);
  const resetSeconds = Math.max(0, Math.ceil((opts.resetMs - Date.now()) / 1e3));
  const windowSec = opts.windowSec ?? 60;
  return {
    // IETF RateLimit fields.
    "RateLimit-Policy": `"default";q=${opts.limit};w=${windowSec}`,
    "RateLimit-Limit": String(opts.limit),
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(resetSeconds),
    RateLimit: `"default";r=${remaining};t=${resetSeconds}`,
    // Legacy X-RateLimit-* retained for back-compat (Reset is epoch-ms).
    "X-RateLimit-Limit": String(opts.limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(opts.resetMs),
    "Retry-After": String(Math.max(1, opts.retryAfterSec))
  };
}

// server/_shared/direct-llm-quota.ts
init_redis();
var DIRECT_LLM_DAILY_QUOTA_LIMIT = 500;
var DIRECT_LLM_REDIS_UNAVAILABLE_RETRY_AFTER_SECONDS = 30;
var DIRECT_LLM_UNVERIFIED_DAILY_QUOTA_LIMIT = 50;
function resolveDirectLlmDailyLimit(planDailyLimit) {
  if (planDailyLimit === null) return null;
  if (typeof planDailyLimit === "number" && Number.isFinite(planDailyLimit) && planDailyLimit >= 0) {
    return planDailyLimit;
  }
  return DIRECT_LLM_DAILY_QUOTA_LIMIT;
}
function directLlmDailyLimitFromEntitlements(entitlements) {
  return entitlements?.features?.planLimits?.dashboardAiCallsPerDay;
}
function isActivePaidEntitlement(ent) {
  if (!ent || ent.verificationUnavailable) return false;
  const tier = ent.features?.tier;
  if (typeof tier !== "number" || tier < 1) return false;
  return typeof ent.validUntil === "number" && ent.validUntil >= Date.now();
}
function resolveActiveDirectLlmLimit(ent) {
  if (!isActivePaidEntitlement(ent)) return DIRECT_LLM_UNVERIFIED_DAILY_QUOTA_LIMIT;
  return resolveDirectLlmDailyLimit(directLlmDailyLimitFromEntitlements(ent));
}
var DIRECT_LLM_GATEWAY_QUOTA_PATHS = /* @__PURE__ */ new Set([
  "/api/intelligence/v1/classify-event",
  "/api/intelligence/v1/deduct-situation",
  "/api/intelligence/v1/get-country-intel-brief",
  "/api/market/v1/analyze-stock",
  "/api/news/v1/summarize-article"
]);
var DIRECT_LLM_SELF_METERED_QUOTA_PATHS = /* @__PURE__ */ new Set([
  "/api/chat-analyst"
]);
var DIRECT_LLM_QUOTA_PATHS = /* @__PURE__ */ new Set([
  ...DIRECT_LLM_GATEWAY_QUOTA_PATHS,
  ...DIRECT_LLM_SELF_METERED_QUOTA_PATHS
]);
function directLlmDailyQuotaKey(userId, date) {
  if (!userId) return "";
  const d = date ?? /* @__PURE__ */ new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${getKeyPrefix()}llm:direct-usage:${userId}:${yyyy}-${mm}-${dd}`;
}
async function reserveDirectLlmQuota(opts) {
  const limit = resolveDirectLlmDailyLimit(opts.limit);
  const retryAfterSec = secondsUntilUtcMidnight(opts.date);
  const key = directLlmDailyQuotaKey(opts.userId, opts.date);
  if (!key) {
    return {
      ok: false,
      reason: "redis-unavailable",
      retryAfterSec: DIRECT_LLM_REDIS_UNAVAILABLE_RETRY_AFTER_SECONDS
    };
  }
  let pipeResult;
  try {
    pipeResult = await opts.pipeline([
      ["INCR", key],
      ["EXPIRE", key, PRO_DAILY_QUOTA_TTL_SECONDS]
    ]);
  } catch {
    pipeResult = null;
  }
  if (!pipeResult || !Array.isArray(pipeResult) || pipeResult.length === 0) {
    return {
      ok: false,
      reason: "redis-unavailable",
      retryAfterSec: DIRECT_LLM_REDIS_UNAVAILABLE_RETRY_AFTER_SECONDS
    };
  }
  const incrRaw = pipeResult[0]?.result;
  const newCount = typeof incrRaw === "number" ? incrRaw : Number(incrRaw);
  if (!Number.isFinite(newCount) || newCount < 1) {
    return {
      ok: false,
      reason: "redis-unavailable",
      retryAfterSec: DIRECT_LLM_REDIS_UNAVAILABLE_RETRY_AFTER_SECONDS
    };
  }
  let rolledBack = false;
  const rollback = async () => {
    if (rolledBack) return;
    rolledBack = true;
    try {
      await opts.pipeline([["DECR", key]]);
    } catch {
    }
  };
  if (limit !== null && newCount > limit) {
    await rollback();
    return {
      ok: false,
      reason: "cap-exceeded",
      floor: limit,
      retryAfterSec
    };
  }
  return { ok: true, newCount, rollback };
}

// server/gateway.ts
init_usage();

// server/_shared/internal-auth.ts
async function timingSafeEqual(a, b) {
  const encoder3 = new TextEncoder();
  const aHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder3.encode(a)));
  const bHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder3.encode(b)));
  const n = bHash.length;
  let diff = 0;
  for (let i = 0; i < n; i++) {
    diff |= aHash[i] ^ bHash[i];
  }
  return diff === 0;
}

// src/generated/server/request_validation.ts
var GENERATED_REQUEST_TYPES = {
  "analyzeStock": "worldmonitor.market.v1.AnalyzeStockRequest",
  "backtestStock": "worldmonitor.market.v1.BacktestStockRequest",
  "classifyEvent": "worldmonitor.intelligence.v1.ClassifyEventRequest",
  "computeEnergyShockScenario": "worldmonitor.intelligence.v1.ComputeEnergyShockScenarioRequest",
  "createMonitoredCompany": "worldmonitor.company_monitoring.v1.CreateMonitoredCompanyRequest",
  "deductSituation": "worldmonitor.intelligence.v1.DeductSituationRequest",
  "executeBatch": "worldmonitor.batch.v1.ExecuteBatchRequest",
  "getAircraftDetails": "worldmonitor.military.v1.GetAircraftDetailsRequest",
  "getAircraftDetailsBatch": "worldmonitor.military.v1.GetAircraftDetailsBatchRequest",
  "getAirportOpsSummary": "worldmonitor.aviation.v1.GetAirportOpsSummaryRequest",
  "getBlsSeries": "worldmonitor.economic.v1.GetBlsSeriesRequest",
  "getBootstrapData": "worldmonitor.infrastructure.v1.GetBootstrapDataRequest",
  "getBypassOptions": "worldmonitor.supply_chain.v1.GetBypassOptionsRequest",
  "getCarrierOps": "worldmonitor.aviation.v1.GetCarrierOpsRequest",
  "getChokepointHistory": "worldmonitor.supply_chain.v1.GetChokepointHistoryRequest",
  "getCompanyCoverage": "worldmonitor.company_monitoring.v1.GetCompanyCoverageRequest",
  "getCompanyEnrichment": "worldmonitor.intelligence.v1.GetCompanyEnrichmentRequest",
  "getCompanyMaterialEvent": "worldmonitor.company_monitoring.v1.GetCompanyMaterialEventRequest",
  "getConsumerPriceBasketSeries": "worldmonitor.consumer_prices.v1.GetConsumerPriceBasketSeriesRequest",
  "getConsumerPriceFreshness": "worldmonitor.consumer_prices.v1.GetConsumerPriceFreshnessRequest",
  "getConsumerPriceOverview": "worldmonitor.consumer_prices.v1.GetConsumerPriceOverviewRequest",
  "getCountryChokepointIndex": "worldmonitor.supply_chain.v1.GetCountryChokepointIndexRequest",
  "getCountryCostShock": "worldmonitor.supply_chain.v1.GetCountryCostShockRequest",
  "getCountryEnergyProfile": "worldmonitor.intelligence.v1.GetCountryEnergyProfileRequest",
  "getCountryFacts": "worldmonitor.intelligence.v1.GetCountryFactsRequest",
  "getCountryIntelBrief": "worldmonitor.intelligence.v1.GetCountryIntelBriefRequest",
  "getCountryPortActivity": "worldmonitor.intelligence.v1.GetCountryPortActivityRequest",
  "getCountryProducts": "worldmonitor.supply_chain.v1.GetCountryProductsRequest",
  "getCountryRisk": "worldmonitor.intelligence.v1.GetCountryRiskRequest",
  "getCountryStockIndex": "worldmonitor.market.v1.GetCountryStockIndexRequest",
  "getDefenseIndustrialBase": "worldmonitor.military.v1.GetDefenseIndustrialBaseRequest",
  "getDisplacementSummary": "worldmonitor.displacement.v1.GetDisplacementSummaryRequest",
  "getEconomicCalendar": "worldmonitor.economic.v1.GetEconomicCalendarRequest",
  "getEnergyCapacity": "worldmonitor.economic.v1.GetEnergyCapacityRequest",
  "getEnergyCrisisPolicies": "worldmonitor.economic.v1.GetEnergyCrisisPoliciesRequest",
  "getEnergyPrices": "worldmonitor.economic.v1.GetEnergyPricesRequest",
  "getFlightStatus": "worldmonitor.aviation.v1.GetFlightStatusRequest",
  "getFoodStocks": "worldmonitor.resilience.v1.GetFoodStocksRequest",
  "getForecasts": "worldmonitor.forecast.v1.GetForecastsRequest",
  "getFredSeries": "worldmonitor.economic.v1.GetFredSeriesRequest",
  "getFredSeriesBatch": "worldmonitor.economic.v1.GetFredSeriesBatchRequest",
  "getFuelShortageDetail": "worldmonitor.supply_chain.v1.GetFuelShortageDetailRequest",
  "getGdeltTopicTimeline": "worldmonitor.intelligence.v1.GetGdeltTopicTimelineRequest",
  "getGivingSummary": "worldmonitor.giving.v1.GetGivingSummaryRequest",
  "getHumanitarianSummary": "worldmonitor.conflict.v1.GetHumanitarianSummaryRequest",
  "getHumanitarianSummaryBatch": "worldmonitor.conflict.v1.GetHumanitarianSummaryBatchRequest",
  "getInsiderTransactions": "worldmonitor.market.v1.GetInsiderTransactionsRequest",
  "getIntelTimeline": "worldmonitor.intelligence.v1.GetIntelTimelineRequest",
  "getMineralProduction": "worldmonitor.supply_chain.v1.GetMineralProductionRequest",
  "getMultiSectorCostShock": "worldmonitor.supply_chain.v1.GetMultiSectorCostShockRequest",
  "getPipelineDetail": "worldmonitor.supply_chain.v1.GetPipelineDetailRequest",
  "getPizzintStatus": "worldmonitor.intelligence.v1.GetPizzintStatusRequest",
  "getPopulationExposure": "worldmonitor.displacement.v1.GetPopulationExposureRequest",
  "getRegimeHistory": "worldmonitor.intelligence.v1.GetRegimeHistoryRequest",
  "getRegionalBrief": "worldmonitor.intelligence.v1.GetRegionalBriefRequest",
  "getRegionalSnapshot": "worldmonitor.intelligence.v1.GetRegionalSnapshotRequest",
  "getResilienceScore": "worldmonitor.resilience.v1.GetResilienceScoreRequest",
  "getRiskScores": "worldmonitor.intelligence.v1.GetRiskScoresRequest",
  "getRouteExplorerLane": "worldmonitor.supply_chain.v1.GetRouteExplorerLaneRequest",
  "getRouteImpact": "worldmonitor.supply_chain.v1.GetRouteImpactRequest",
  "getScenarioStatus": "worldmonitor.scenario.v1.GetScenarioStatusRequest",
  "getSectorDependency": "worldmonitor.supply_chain.v1.GetSectorDependencyRequest",
  "getSectorSummary": "worldmonitor.market.v1.GetSectorSummaryRequest",
  "getSimilarEvents": "worldmonitor.intelligence.v1.GetSimilarEventsRequest",
  "getSimulationOutcome": "worldmonitor.forecast.v1.GetSimulationOutcomeRequest",
  "getSimulationPackage": "worldmonitor.forecast.v1.GetSimulationPackageRequest",
  "getStockAnalysisHistory": "worldmonitor.market.v1.GetStockAnalysisHistoryRequest",
  "getStorageFacilityDetail": "worldmonitor.supply_chain.v1.GetStorageFacilityDetailRequest",
  "getSummarizeArticleCache": "worldmonitor.news.v1.GetSummarizeArticleCacheRequest",
  "getTariffTrends": "worldmonitor.trade.v1.GetTariffTrendsRequest",
  "getTemporalBaseline": "worldmonitor.infrastructure.v1.GetTemporalBaselineRequest",
  "getTheaterPosture": "worldmonitor.military.v1.GetTheaterPostureRequest",
  "getTradeBarriers": "worldmonitor.trade.v1.GetTradeBarriersRequest",
  "getTradeFlows": "worldmonitor.trade.v1.GetTradeFlowsRequest",
  "getTradeRestrictions": "worldmonitor.trade.v1.GetTradeRestrictionsRequest",
  "getUSNIFleetReport": "worldmonitor.military.v1.GetUSNIFleetReportRequest",
  "getVesselSnapshot": "worldmonitor.maritime.v1.GetVesselSnapshotRequest",
  "getWebcamImage": "worldmonitor.webcam.v1.GetWebcamImageRequest",
  "getWingbitsLiveFlight": "worldmonitor.military.v1.GetWingbitsLiveFlightRequest",
  "getYoutubeLiveStreamInfo": "worldmonitor.aviation.v1.GetYoutubeLiveStreamInfoRequest",
  "importMonitoredCompanyBatch": "worldmonitor.company_monitoring.v1.ImportMonitoredCompanyBatchRequest",
  "listAcledEvents": "worldmonitor.conflict.v1.ListAcledEventsRequest",
  "listAirportDelays": "worldmonitor.aviation.v1.ListAirportDelaysRequest",
  "listAirportFlights": "worldmonitor.aviation.v1.ListAirportFlightsRequest",
  "listArxivPapers": "worldmonitor.research.v1.ListArxivPapersRequest",
  "listAviationNews": "worldmonitor.aviation.v1.ListAviationNewsRequest",
  "listClimateAnomalies": "worldmonitor.climate.v1.ListClimateAnomaliesRequest",
  "listClimateDisasters": "worldmonitor.climate.v1.ListClimateDisastersRequest",
  "listCommodityQuotes": "worldmonitor.market.v1.ListCommodityQuotesRequest",
  "listCompanyEventChanges": "worldmonitor.company_monitoring.v1.ListCompanyEventChangesRequest",
  "listCompanyEventImpacts": "worldmonitor.company_monitoring.v1.ListCompanyEventImpactsRequest",
  "listCompanySignals": "worldmonitor.intelligence.v1.ListCompanySignalsRequest",
  "listComtradeFlows": "worldmonitor.trade.v1.ListComtradeFlowsRequest",
  "listConsumerPriceCategories": "worldmonitor.consumer_prices.v1.ListConsumerPriceCategoriesRequest",
  "listConsumerPriceMovers": "worldmonitor.consumer_prices.v1.ListConsumerPriceMoversRequest",
  "listCryptoQuotes": "worldmonitor.market.v1.ListCryptoQuotesRequest",
  "listCyberThreats": "worldmonitor.cyber.v1.ListCyberThreatsRequest",
  "listDefensePatents": "worldmonitor.military.v1.ListDefensePatentsRequest",
  "listEarningsCalendar": "worldmonitor.market.v1.ListEarningsCalendarRequest",
  "listEarthquakes": "worldmonitor.seismology.v1.ListEarthquakesRequest",
  "listEnergyDisruptions": "worldmonitor.supply_chain.v1.ListEnergyDisruptionsRequest",
  "listFeedDigest": "worldmonitor.news.v1.ListFeedDigestRequest",
  "listFireDetections": "worldmonitor.wildfire.v1.ListFireDetectionsRequest",
  "listFuelShortages": "worldmonitor.supply_chain.v1.ListFuelShortagesRequest",
  "listGlobalTenders": "worldmonitor.economic.v1.ListGlobalTendersRequest",
  "listGpsInterference": "worldmonitor.intelligence.v1.ListGpsInterferenceRequest",
  "listHackernewsItems": "worldmonitor.research.v1.ListHackernewsItemsRequest",
  "listInternetOutages": "worldmonitor.infrastructure.v1.ListInternetOutagesRequest",
  "listInternetTrafficAnomalies": "worldmonitor.infrastructure.v1.ListInternetTrafficAnomaliesRequest",
  "listMarketImplications": "worldmonitor.intelligence.v1.ListMarketImplicationsRequest",
  "listMarketQuotes": "worldmonitor.market.v1.ListMarketQuotesRequest",
  "listMaterialEvents": "worldmonitor.intelligence.v1.ListMaterialEventsRequest",
  "listMilitaryBases": "worldmonitor.military.v1.ListMilitaryBasesRequest",
  "listMilitaryFlights": "worldmonitor.military.v1.ListMilitaryFlightsRequest",
  "listMonitoredCompanies": "worldmonitor.company_monitoring.v1.ListMonitoredCompaniesRequest",
  "listNaturalEvents": "worldmonitor.natural.v1.ListNaturalEventsRequest",
  "listNavigationalWarnings": "worldmonitor.maritime.v1.ListNavigationalWarningsRequest",
  "listOrefAlerts": "worldmonitor.intelligence.v1.ListOrefAlertsRequest",
  "listPipelines": "worldmonitor.supply_chain.v1.ListPipelinesRequest",
  "listPredictionMarkets": "worldmonitor.prediction.v1.ListPredictionMarketsRequest",
  "listRadiationObservations": "worldmonitor.radiation.v1.ListRadiationObservationsRequest",
  "listRetailerPriceSpreads": "worldmonitor.consumer_prices.v1.ListRetailerPriceSpreadsRequest",
  "listSanctionsPressure": "worldmonitor.sanctions.v1.ListSanctionsPressureRequest",
  "listSatellites": "worldmonitor.intelligence.v1.ListSatellitesRequest",
  "listServiceStatuses": "worldmonitor.infrastructure.v1.ListServiceStatusesRequest",
  "listStablecoinMarkets": "worldmonitor.market.v1.ListStablecoinMarketsRequest",
  "listStorageFacilities": "worldmonitor.supply_chain.v1.ListStorageFacilitiesRequest",
  "listStoredStockBacktests": "worldmonitor.market.v1.ListStoredStockBacktestsRequest",
  "listTechEvents": "worldmonitor.research.v1.ListTechEventsRequest",
  "listTelegramFeed": "worldmonitor.intelligence.v1.ListTelegramFeedRequest",
  "listThermalEscalations": "worldmonitor.thermal.v1.ListThermalEscalationsRequest",
  "listTrendingRepos": "worldmonitor.research.v1.ListTrendingReposRequest",
  "listUcdpEvents": "worldmonitor.conflict.v1.ListUcdpEventsRequest",
  "listUnrestEvents": "worldmonitor.unrest.v1.ListUnrestEventsRequest",
  "listWebcams": "worldmonitor.webcam.v1.ListWebcamsRequest",
  "listWorldBankIndicators": "worldmonitor.economic.v1.ListWorldBankIndicatorsRequest",
  "lookupSanctionEntity": "worldmonitor.sanctions.v1.LookupSanctionEntityRequest",
  "recordBaselineSnapshot": "worldmonitor.infrastructure.v1.RecordBaselineSnapshotRequest",
  "registerInterest": "worldmonitor.leads.v1.RegisterInterestRequest",
  "registerWebhook": "worldmonitor.shipping.v2.RegisterWebhookRequest",
  "reverseGeocode": "worldmonitor.infrastructure.v1.ReverseGeocodeRequest",
  "routeIntelligence": "worldmonitor.shipping.v2.RouteIntelligenceRequest",
  "runScenario": "worldmonitor.scenario.v1.RunScenarioRequest",
  "searchFlightPrices": "worldmonitor.aviation.v1.SearchFlightPricesRequest",
  "searchGdeltDocuments": "worldmonitor.intelligence.v1.SearchGdeltDocumentsRequest",
  "searchGoogleDates": "worldmonitor.aviation.v1.SearchGoogleDatesRequest",
  "searchGoogleFlights": "worldmonitor.aviation.v1.SearchGoogleFlightsRequest",
  "searchImagery": "worldmonitor.imagery.v1.SearchImageryRequest",
  "searchIntelHistory": "worldmonitor.intelligence.v1.SearchIntelHistoryRequest",
  "searchSecFilings": "worldmonitor.intelligence.v1.SearchSecFilingsRequest",
  "setMonitoredCompanyState": "worldmonitor.company_monitoring.v1.SetMonitoredCompanyStateRequest",
  "submitContact": "worldmonitor.leads.v1.SubmitContactRequest",
  "summarizeArticle": "worldmonitor.news.v1.SummarizeArticleRequest",
  "trackAircraft": "worldmonitor.aviation.v1.TrackAircraftRequest",
  "triggerSimulation": "worldmonitor.forecast.v1.TriggerSimulationRequest",
  "updateMonitoredCompany": "worldmonitor.company_monitoring.v1.UpdateMonitoredCompanyRequest"
};
var GENERATED_MESSAGE_RULES = {
  "worldmonitor.aviation.v1.GetAirportOpsSummaryRequest": {
    "fields": {
      "airports": {
        "kind": "string",
        "repeated": true,
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "repeatedMinItems": 1,
        "repeatedMaxItems": 20
      }
    }
  },
  "worldmonitor.aviation.v1.GetCarrierOpsRequest": {
    "fields": {
      "airports": {
        "kind": "string",
        "repeated": true,
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "repeatedMinItems": 1,
        "repeatedMaxItems": 20
      },
      "minFlights": {
        "kind": "int32",
        "numberGte": 0
      }
    }
  },
  "worldmonitor.aviation.v1.GetFlightStatusRequest": {
    "fields": {
      "flightNumber": {
        "kind": "string",
        "required": true,
        "stringMinLen": 3,
        "stringMaxLen": 10
      },
      "date": {
        "kind": "string",
        "required": true,
        "stringLen": 10
      }
    }
  },
  "worldmonitor.aviation.v1.GetYoutubeLiveStreamInfoRequest": {
    "fields": {}
  },
  "worldmonitor.aviation.v1.ListAirportDelaysRequest": {
    "fields": {}
  },
  "worldmonitor.aviation.v1.ListAirportFlightsRequest": {
    "fields": {
      "airport": {
        "kind": "string",
        "required": true,
        "stringMinLen": 3,
        "stringMaxLen": 4
      },
      "limit": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 100
      }
    }
  },
  "worldmonitor.aviation.v1.ListAviationNewsRequest": {
    "fields": {
      "entities": {
        "kind": "string",
        "repeated": true,
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "repeatedMinItems": 1,
        "repeatedMaxItems": 10
      },
      "windowHours": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 168
      },
      "maxItems": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 50
      }
    }
  },
  "worldmonitor.aviation.v1.SearchFlightPricesRequest": {
    "fields": {
      "origin": {
        "kind": "string",
        "required": true,
        "stringMinLen": 3,
        "stringMaxLen": 4
      },
      "destination": {
        "kind": "string",
        "required": true,
        "stringMinLen": 3,
        "stringMaxLen": 4
      },
      "departureDate": {
        "kind": "string",
        "required": true,
        "stringLen": 10
      },
      "adults": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 9
      },
      "maxResults": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 50
      }
    }
  },
  "worldmonitor.aviation.v1.SearchGoogleDatesRequest": {
    "fields": {}
  },
  "worldmonitor.aviation.v1.SearchGoogleFlightsRequest": {
    "fields": {}
  },
  "worldmonitor.aviation.v1.TrackAircraftRequest": {
    "fields": {}
  },
  "worldmonitor.batch.v1.BatchOperation": {
    "fields": {
      "id": {
        "kind": "string",
        "stringMaxLen": 64
      },
      "path": {
        "kind": "string",
        "required": true,
        "stringMaxLen": 2048
      }
    }
  },
  "worldmonitor.batch.v1.ExecuteBatchRequest": {
    "fields": {
      "operations": {
        "kind": "message",
        "repeated": true,
        "messageType": "worldmonitor.batch.v1.BatchOperation",
        "repeatedMinItems": 1,
        "repeatedMaxItems": 20
      }
    }
  },
  "worldmonitor.climate.v1.ListClimateAnomaliesRequest": {
    "fields": {}
  },
  "worldmonitor.climate.v1.ListClimateDisastersRequest": {
    "fields": {}
  },
  "worldmonitor.company_monitoring.v1.CompanyClaimInput": {
    "fields": {
      "type": {
        "kind": "enum",
        "enumValues": [
          "COMPANY_CLAIM_TYPE_UNSPECIFIED",
          "COMPANY_CLAIM_TYPE_ALIAS",
          "COMPANY_CLAIM_TYPE_DOMAIN",
          "COMPANY_CLAIM_TYPE_LEGAL_IDENTIFIER",
          "COMPANY_CLAIM_TYPE_X_ACCOUNT_ID",
          "COMPANY_CLAIM_TYPE_X_HANDLE",
          "COMPANY_CLAIM_TYPE_LOCATION",
          "COMPANY_CLAIM_TYPE_CUSTOMER_REFERENCE"
        ],
        "required": true,
        "enumDefinedOnly": true
      },
      "value": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxBytes": 512
      }
    }
  },
  "worldmonitor.company_monitoring.v1.CreateMonitoredCompanyRequest": {
    "fields": {
      "company": {
        "kind": "message",
        "messageType": "worldmonitor.company_monitoring.v1.MonitoredCompanyInput",
        "required": true
      },
      "clientRequestId": {
        "kind": "string",
        "stringMaxBytes": 64
      }
    }
  },
  "worldmonitor.company_monitoring.v1.GetCompanyCoverageRequest": {
    "fields": {
      "companyId": {
        "kind": "string",
        "required": true,
        "stringPattern": "^cm_company_[0-9A-HJKMNP-TV-Z]{26}$"
      }
    }
  },
  "worldmonitor.company_monitoring.v1.GetCompanyMaterialEventRequest": {
    "fields": {
      "impactId": {
        "kind": "string",
        "required": true,
        "stringPattern": "^cm_impact_[0-9A-HJKMNP-TV-Z]{26}$"
      }
    }
  },
  "worldmonitor.company_monitoring.v1.ImportMonitoredCompanyBatchRequest": {
    "fields": {
      "contractVersion": {
        "kind": "string",
        "required": true,
        "stringConst": "cm-import-v1"
      },
      "clientImportId": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxBytes": 64
      },
      "rows": {
        "kind": "message",
        "repeated": true,
        "messageType": "worldmonitor.company_monitoring.v1.MonitoredCompanyImportRow",
        "repeatedMinItems": 1,
        "repeatedMaxItems": 100
      }
    }
  },
  "worldmonitor.company_monitoring.v1.ListCompanyEventChangesRequest": {
    "fields": {
      "cursor": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxBytes": 2048,
        "stringPattern": "^cmc1\\.[A-Za-z0-9_-]{16,1000}[A-Za-z0-9_-]{0,536}\\.[A-Za-z0-9_-]{43}$"
      },
      "pageSize": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 100
      }
    }
  },
  "worldmonitor.company_monitoring.v1.ListCompanyEventImpactsRequest": {
    "fields": {
      "companyIds": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 100,
        "stringPattern": "^cm_company_[0-9A-HJKMNP-TV-Z]{26}$"
      },
      "directions": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 3,
        "stringPattern": "^(?:positive|negative|mixed|MATERIAL_IMPACT_DIRECTION_(?:POSITIVE|NEGATIVE|MIXED))$"
      },
      "lifecycles": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 3,
        "stringPattern": "^(?:admitted|corrected|retracted|MATERIAL_IMPACT_LIFECYCLE_(?:ADMITTED|CORRECTED|RETRACTED))$"
      },
      "pageSize": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 100
      },
      "cursor": {
        "kind": "string",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "stringMaxBytes": 2048,
        "stringPattern": "^cmc1\\.[A-Za-z0-9_-]{16,1000}[A-Za-z0-9_-]{0,536}\\.[A-Za-z0-9_-]{43}$"
      }
    }
  },
  "worldmonitor.company_monitoring.v1.ListMonitoredCompaniesRequest": {
    "fields": {
      "lifecycles": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 3,
        "stringPattern": "^(?:active|paused|removed|MONITORED_COMPANY_LIFECYCLE_(?:ACTIVE|PAUSED|REMOVED))$"
      },
      "coverageStates": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 6,
        "stringPattern": "^(?:awaiting_first_scan|adequate|partial|stale|unavailable|needs_confirmation|COMPANY_COVERAGE_STATE_(?:AWAITING_FIRST_SCAN|ADEQUATE|PARTIAL|STALE|UNAVAILABLE|NEEDS_CONFIRMATION))$"
      },
      "pageSize": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 100
      },
      "cursor": {
        "kind": "string",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "stringMaxBytes": 2048,
        "stringPattern": "^cmc1\\.[A-Za-z0-9_-]{16,1000}[A-Za-z0-9_-]{0,536}\\.[A-Za-z0-9_-]{43}$"
      }
    }
  },
  "worldmonitor.company_monitoring.v1.MonitoredCompanyImportRow": {
    "fields": {
      "ordinal": {
        "kind": "int32",
        "numberGte": 0,
        "numberLte": 99
      },
      "company": {
        "kind": "message",
        "messageType": "worldmonitor.company_monitoring.v1.MonitoredCompanyInput",
        "required": true
      }
    }
  },
  "worldmonitor.company_monitoring.v1.MonitoredCompanyInput": {
    "fields": {
      "name": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxBytes": 256
      },
      "domicileCountry": {
        "kind": "enum",
        "enumValues": [
          "DOMICILE_COUNTRY_UNSPECIFIED",
          "DOMICILE_COUNTRY_US",
          "DOMICILE_COUNTRY_GB"
        ],
        "required": true,
        "enumDefinedOnly": true
      },
      "aliases": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 20,
        "stringMinLen": 1,
        "stringMaxBytes": 256
      },
      "domains": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 10,
        "stringMinLen": 1,
        "stringMaxBytes": 253,
        "stringPattern": "^(?:www\\.)?(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.?$"
      },
      "identifiers": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 20,
        "stringMinLen": 1,
        "stringMaxBytes": 512
      },
      "xHandles": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 5,
        "stringMaxBytes": 16,
        "stringPattern": "^@?[A-Za-z0-9_]{1,15}$"
      },
      "locations": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 20,
        "stringMinLen": 1,
        "stringMaxBytes": 256
      },
      "customerReference": {
        "kind": "string",
        "stringMaxBytes": 128
      }
    }
  },
  "worldmonitor.company_monitoring.v1.MonitoredCompanyPatch": {
    "fields": {
      "name": {
        "kind": "string",
        "optional": true,
        "stringMinLen": 1,
        "stringMaxBytes": 256
      },
      "domicileCountry": {
        "kind": "enum",
        "optional": true,
        "enumValues": [
          "DOMICILE_COUNTRY_UNSPECIFIED",
          "DOMICILE_COUNTRY_US",
          "DOMICILE_COUNTRY_GB"
        ],
        "enumDefinedOnly": true,
        "enumNotIn": [
          "DOMICILE_COUNTRY_UNSPECIFIED"
        ]
      },
      "addClaims": {
        "kind": "message",
        "repeated": true,
        "messageType": "worldmonitor.company_monitoring.v1.CompanyClaimInput",
        "repeatedMaxItems": 81
      },
      "removeClaimIds": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 81,
        "stringPattern": "^cm_claim_[0-9A-HJKMNP-TV-Z]{26}$"
      },
      "customerReference": {
        "kind": "string",
        "optional": true,
        "stringMaxBytes": 128
      }
    }
  },
  "worldmonitor.company_monitoring.v1.SetMonitoredCompanyStateRequest": {
    "fields": {
      "companyId": {
        "kind": "string",
        "required": true,
        "stringPattern": "^cm_company_[0-9A-HJKMNP-TV-Z]{26}$"
      },
      "targetLifecycle": {
        "kind": "enum",
        "enumValues": [
          "MONITORED_COMPANY_LIFECYCLE_UNSPECIFIED",
          "MONITORED_COMPANY_LIFECYCLE_ACTIVE",
          "MONITORED_COMPANY_LIFECYCLE_PAUSED",
          "MONITORED_COMPANY_LIFECYCLE_REMOVED"
        ],
        "required": true,
        "enumDefinedOnly": true
      }
    }
  },
  "worldmonitor.company_monitoring.v1.UpdateMonitoredCompanyRequest": {
    "fields": {
      "companyId": {
        "kind": "string",
        "required": true,
        "stringPattern": "^cm_company_[0-9A-HJKMNP-TV-Z]{26}$"
      },
      "patch": {
        "kind": "message",
        "messageType": "worldmonitor.company_monitoring.v1.MonitoredCompanyPatch",
        "required": true
      }
    }
  },
  "worldmonitor.conflict.v1.GetHumanitarianSummaryBatchRequest": {
    "fields": {
      "countryCodes": {
        "kind": "string",
        "repeated": true,
        "repeatedMinItems": 1,
        "repeatedMaxItems": 25
      }
    }
  },
  "worldmonitor.conflict.v1.GetHumanitarianSummaryRequest": {
    "fields": {
      "countryCode": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      }
    }
  },
  "worldmonitor.conflict.v1.ListAcledEventsRequest": {
    "fields": {}
  },
  "worldmonitor.conflict.v1.ListUcdpEventsRequest": {
    "fields": {}
  },
  "worldmonitor.consumer_prices.v1.GetConsumerPriceBasketSeriesRequest": {
    "fields": {}
  },
  "worldmonitor.consumer_prices.v1.GetConsumerPriceFreshnessRequest": {
    "fields": {}
  },
  "worldmonitor.consumer_prices.v1.GetConsumerPriceOverviewRequest": {
    "fields": {}
  },
  "worldmonitor.consumer_prices.v1.ListConsumerPriceCategoriesRequest": {
    "fields": {}
  },
  "worldmonitor.consumer_prices.v1.ListConsumerPriceMoversRequest": {
    "fields": {}
  },
  "worldmonitor.consumer_prices.v1.ListRetailerPriceSpreadsRequest": {
    "fields": {}
  },
  "worldmonitor.cyber.v1.ListCyberThreatsRequest": {
    "fields": {}
  },
  "worldmonitor.displacement.v1.GetDisplacementSummaryRequest": {
    "fields": {
      "year": {
        "kind": "int32",
        "numberGte": 0
      },
      "countryLimit": {
        "kind": "int32",
        "numberGte": 0
      },
      "flowLimit": {
        "kind": "int32",
        "numberGte": 0
      }
    }
  },
  "worldmonitor.displacement.v1.GetPopulationExposureRequest": {
    "fields": {
      "lat": {
        "kind": "double",
        "numberGte": -90,
        "numberLte": 90
      },
      "lon": {
        "kind": "double",
        "numberGte": -180,
        "numberLte": 180
      },
      "radius": {
        "kind": "double",
        "numberGte": 0
      }
    }
  },
  "worldmonitor.economic.v1.GetBlsSeriesRequest": {
    "fields": {}
  },
  "worldmonitor.economic.v1.GetEconomicCalendarRequest": {
    "fields": {}
  },
  "worldmonitor.economic.v1.GetEnergyCapacityRequest": {
    "fields": {}
  },
  "worldmonitor.economic.v1.GetEnergyCrisisPoliciesRequest": {
    "fields": {}
  },
  "worldmonitor.economic.v1.GetEnergyPricesRequest": {
    "fields": {}
  },
  "worldmonitor.economic.v1.GetFredSeriesBatchRequest": {
    "fields": {
      "seriesIds": {
        "kind": "string",
        "repeated": true,
        "repeatedMinItems": 1,
        "repeatedMaxItems": 20
      }
    }
  },
  "worldmonitor.economic.v1.GetFredSeriesRequest": {
    "fields": {
      "seriesId": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      }
    }
  },
  "worldmonitor.economic.v1.ListGlobalTendersRequest": {
    "fields": {}
  },
  "worldmonitor.economic.v1.ListWorldBankIndicatorsRequest": {
    "fields": {
      "indicatorCode": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      }
    }
  },
  "worldmonitor.forecast.v1.GetForecastsRequest": {
    "fields": {}
  },
  "worldmonitor.forecast.v1.GetSimulationOutcomeRequest": {
    "fields": {}
  },
  "worldmonitor.forecast.v1.GetSimulationPackageRequest": {
    "fields": {}
  },
  "worldmonitor.forecast.v1.TriggerSimulationRequest": {
    "fields": {}
  },
  "worldmonitor.giving.v1.GetGivingSummaryRequest": {
    "fields": {}
  },
  "worldmonitor.imagery.v1.SearchImageryRequest": {
    "fields": {}
  },
  "worldmonitor.infrastructure.v1.BaselineUpdate": {
    "fields": {
      "type": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      }
    }
  },
  "worldmonitor.infrastructure.v1.GetBootstrapDataRequest": {
    "fields": {}
  },
  "worldmonitor.infrastructure.v1.GetTemporalBaselineRequest": {
    "fields": {
      "type": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      }
    }
  },
  "worldmonitor.infrastructure.v1.ListInternetOutagesRequest": {
    "fields": {}
  },
  "worldmonitor.infrastructure.v1.ListInternetTrafficAnomaliesRequest": {
    "fields": {}
  },
  "worldmonitor.infrastructure.v1.ListServiceStatusesRequest": {
    "fields": {}
  },
  "worldmonitor.infrastructure.v1.RecordBaselineSnapshotRequest": {
    "fields": {
      "updates": {
        "kind": "message",
        "repeated": true,
        "messageType": "worldmonitor.infrastructure.v1.BaselineUpdate"
      }
    }
  },
  "worldmonitor.infrastructure.v1.ReverseGeocodeRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.ClassifyEventRequest": {
    "fields": {
      "title": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      }
    }
  },
  "worldmonitor.intelligence.v1.ComputeEnergyShockScenarioRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.DeductSituationRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.GetCompanyEnrichmentRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.GetCountryEnergyProfileRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.GetCountryFactsRequest": {
    "fields": {
      "countryCode": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      }
    }
  },
  "worldmonitor.intelligence.v1.GetCountryIntelBriefRequest": {
    "fields": {
      "countryCode": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      }
    }
  },
  "worldmonitor.intelligence.v1.GetCountryPortActivityRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.GetCountryRiskRequest": {
    "fields": {
      "countryCode": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      }
    }
  },
  "worldmonitor.intelligence.v1.GetGdeltTopicTimelineRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.GetIntelTimelineRequest": {
    "fields": {
      "domain": {
        "kind": "string",
        "stringPattern": "^(conflict|military|energy)?$"
      },
      "country": {
        "kind": "string",
        "stringPattern": "^([A-Z]{2})?$"
      },
      "from": {
        "kind": "int64",
        "int64Encoding": "number",
        "numberGte": 0
      },
      "to": {
        "kind": "int64",
        "int64Encoding": "number",
        "numberGte": 0
      },
      "limit": {
        "kind": "int32",
        "numberGte": 0,
        "numberLte": 200
      }
    }
  },
  "worldmonitor.intelligence.v1.GetPizzintStatusRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.GetRegimeHistoryRequest": {
    "fields": {
      "regionId": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxLen": 32,
        "stringPattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$"
      },
      "limit": {
        "kind": "int32",
        "numberGte": 0,
        "numberLte": 100
      }
    }
  },
  "worldmonitor.intelligence.v1.GetRegionalBriefRequest": {
    "fields": {
      "regionId": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxLen": 32,
        "stringPattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$"
      }
    }
  },
  "worldmonitor.intelligence.v1.GetRegionalSnapshotRequest": {
    "fields": {
      "regionId": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxLen": 32,
        "stringPattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$"
      }
    }
  },
  "worldmonitor.intelligence.v1.GetRiskScoresRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.GetSimilarEventsRequest": {
    "fields": {
      "situation": {
        "kind": "string",
        "required": true,
        "stringMinLen": 10,
        "stringMaxLen": 1e3
      },
      "domain": {
        "kind": "string",
        "stringPattern": "^(conflict|military|energy)?$"
      },
      "country": {
        "kind": "string",
        "stringPattern": "^([A-Z]{2})?$"
      },
      "limit": {
        "kind": "int32",
        "numberGte": 0,
        "numberLte": 32
      }
    }
  },
  "worldmonitor.intelligence.v1.ListCompanySignalsRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.ListGpsInterferenceRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.ListMarketImplicationsRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.ListMaterialEventsRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.ListOrefAlertsRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.ListSatellitesRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.ListTelegramFeedRequest": {
    "fields": {}
  },
  "worldmonitor.intelligence.v1.SearchGdeltDocumentsRequest": {
    "fields": {
      "query": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      },
      "maxRecords": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 250
      }
    }
  },
  "worldmonitor.intelligence.v1.SearchIntelHistoryRequest": {
    "fields": {
      "query": {
        "kind": "string",
        "required": true,
        "stringMinLen": 2,
        "stringMaxLen": 500
      },
      "domain": {
        "kind": "string",
        "stringPattern": "^(conflict|military|energy)?$"
      },
      "country": {
        "kind": "string",
        "stringPattern": "^([A-Z]{2})?$"
      },
      "from": {
        "kind": "int64",
        "int64Encoding": "number",
        "numberGte": 0
      },
      "to": {
        "kind": "int64",
        "int64Encoding": "number",
        "numberGte": 0
      },
      "limit": {
        "kind": "int32",
        "numberGte": 0,
        "numberLte": 64
      }
    }
  },
  "worldmonitor.intelligence.v1.SearchSecFilingsRequest": {
    "fields": {
      "query": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      }
    }
  },
  "worldmonitor.leads.v1.RegisterInterestRequest": {
    "fields": {
      "email": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.leads.v1.SubmitContactRequest": {
    "fields": {
      "email": {
        "kind": "string",
        "required": true
      },
      "name": {
        "kind": "string",
        "required": true
      },
      "organization": {
        "kind": "string",
        "required": true
      },
      "phone": {
        "kind": "string",
        "required": true
      },
      "turnstileToken": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.maritime.v1.GetVesselSnapshotRequest": {
    "fields": {}
  },
  "worldmonitor.maritime.v1.ListNavigationalWarningsRequest": {
    "fields": {}
  },
  "worldmonitor.market.v1.AnalyzeStockRequest": {
    "fields": {
      "symbol": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxLen": 32
      },
      "name": {
        "kind": "string",
        "stringMaxLen": 120
      }
    }
  },
  "worldmonitor.market.v1.BacktestStockRequest": {
    "fields": {
      "symbol": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxLen": 32
      },
      "name": {
        "kind": "string",
        "stringMaxLen": 120
      },
      "evalWindowDays": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 3,
        "numberLte": 30
      }
    }
  },
  "worldmonitor.market.v1.GetCountryStockIndexRequest": {
    "fields": {
      "countryCode": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      }
    }
  },
  "worldmonitor.market.v1.GetInsiderTransactionsRequest": {
    "fields": {
      "symbol": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxLen": 32
      }
    }
  },
  "worldmonitor.market.v1.GetSectorSummaryRequest": {
    "fields": {}
  },
  "worldmonitor.market.v1.GetStockAnalysisHistoryRequest": {
    "fields": {
      "limitPerSymbol": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 1,
        "numberLte": 32
      }
    }
  },
  "worldmonitor.market.v1.ListCommodityQuotesRequest": {
    "fields": {}
  },
  "worldmonitor.market.v1.ListCryptoQuotesRequest": {
    "fields": {
      "ids": {
        "kind": "string",
        "repeated": true,
        "repeatedMaxItems": 25
      }
    }
  },
  "worldmonitor.market.v1.ListEarningsCalendarRequest": {
    "fields": {}
  },
  "worldmonitor.market.v1.ListMarketQuotesRequest": {
    "fields": {}
  },
  "worldmonitor.market.v1.ListStablecoinMarketsRequest": {
    "fields": {}
  },
  "worldmonitor.market.v1.ListStoredStockBacktestsRequest": {
    "fields": {
      "evalWindowDays": {
        "kind": "int32",
        "ignore": "IGNORE_IF_ZERO_VALUE",
        "numberGte": 3,
        "numberLte": 30
      }
    }
  },
  "worldmonitor.military.v1.GetAircraftDetailsBatchRequest": {
    "fields": {
      "icao24s": {
        "kind": "string",
        "repeated": true,
        "repeatedMinItems": 1,
        "repeatedMaxItems": 20
      }
    }
  },
  "worldmonitor.military.v1.GetAircraftDetailsRequest": {
    "fields": {
      "icao24": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      }
    }
  },
  "worldmonitor.military.v1.GetDefenseIndustrialBaseRequest": {
    "fields": {
      "countryCode": {
        "kind": "string",
        "required": true,
        "stringPattern": "^[A-Z]{2}$"
      }
    }
  },
  "worldmonitor.military.v1.GetTheaterPostureRequest": {
    "fields": {}
  },
  "worldmonitor.military.v1.GetUSNIFleetReportRequest": {
    "fields": {}
  },
  "worldmonitor.military.v1.GetWingbitsLiveFlightRequest": {
    "fields": {
      "icao24": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      }
    }
  },
  "worldmonitor.military.v1.ListDefensePatentsRequest": {
    "fields": {}
  },
  "worldmonitor.military.v1.ListMilitaryBasesRequest": {
    "fields": {}
  },
  "worldmonitor.military.v1.ListMilitaryFlightsRequest": {
    "fields": {}
  },
  "worldmonitor.natural.v1.ListNaturalEventsRequest": {
    "fields": {}
  },
  "worldmonitor.news.v1.GetSummarizeArticleCacheRequest": {
    "fields": {}
  },
  "worldmonitor.news.v1.ListFeedDigestRequest": {
    "fields": {}
  },
  "worldmonitor.news.v1.SummarizeArticleRequest": {
    "fields": {
      "provider": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1
      },
      "headlines": {
        "kind": "string",
        "repeated": true,
        "repeatedMinItems": 1
      }
    }
  },
  "worldmonitor.prediction.v1.ListPredictionMarketsRequest": {
    "fields": {}
  },
  "worldmonitor.radiation.v1.ListRadiationObservationsRequest": {
    "fields": {}
  },
  "worldmonitor.research.v1.ListArxivPapersRequest": {
    "fields": {}
  },
  "worldmonitor.research.v1.ListHackernewsItemsRequest": {
    "fields": {}
  },
  "worldmonitor.research.v1.ListTechEventsRequest": {
    "fields": {
      "limit": {
        "kind": "int32",
        "numberGte": 0,
        "numberLte": 500
      },
      "days": {
        "kind": "int32",
        "numberGte": 0
      }
    }
  },
  "worldmonitor.research.v1.ListTrendingReposRequest": {
    "fields": {}
  },
  "worldmonitor.resilience.v1.GetFoodStocksRequest": {
    "fields": {}
  },
  "worldmonitor.resilience.v1.GetResilienceScoreRequest": {
    "fields": {}
  },
  "worldmonitor.sanctions.v1.ListSanctionsPressureRequest": {
    "fields": {}
  },
  "worldmonitor.sanctions.v1.LookupSanctionEntityRequest": {
    "fields": {}
  },
  "worldmonitor.scenario.v1.GetScenarioStatusRequest": {
    "fields": {
      "jobId": {
        "kind": "string",
        "required": true,
        "stringPattern": "^scenario:[0-9]{13}:[a-z0-9]{8}$"
      }
    }
  },
  "worldmonitor.scenario.v1.RunScenarioRequest": {
    "fields": {
      "scenarioId": {
        "kind": "string",
        "required": true,
        "stringMinLen": 1,
        "stringMaxLen": 128
      },
      "iso2": {
        "kind": "string",
        "stringPattern": "^([A-Z]{2})?$"
      }
    }
  },
  "worldmonitor.seismology.v1.ListEarthquakesRequest": {
    "fields": {}
  },
  "worldmonitor.shipping.v2.RegisterWebhookRequest": {
    "fields": {
      "callbackUrl": {
        "kind": "string",
        "required": true,
        "stringMinLen": 8,
        "stringMaxLen": 2048
      },
      "alertThreshold": {
        "kind": "int32",
        "optional": true,
        "numberGte": 0,
        "numberLte": 100
      }
    }
  },
  "worldmonitor.shipping.v2.RouteIntelligenceRequest": {
    "fields": {
      "fromIso2": {
        "kind": "string",
        "required": true,
        "stringPattern": "^[A-Z]{2}$"
      },
      "toIso2": {
        "kind": "string",
        "required": true,
        "stringPattern": "^[A-Z]{2}$"
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetBypassOptionsRequest": {
    "fields": {
      "chokepointId": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetChokepointHistoryRequest": {
    "fields": {
      "chokepointId": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetCountryChokepointIndexRequest": {
    "fields": {
      "iso2": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetCountryCostShockRequest": {
    "fields": {
      "iso2": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      },
      "chokepointId": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetCountryProductsRequest": {
    "fields": {
      "iso2": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetFuelShortageDetailRequest": {
    "fields": {
      "shortageId": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetMineralProductionRequest": {
    "fields": {}
  },
  "worldmonitor.supply_chain.v1.GetMultiSectorCostShockRequest": {
    "fields": {
      "iso2": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      },
      "chokepointId": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetPipelineDetailRequest": {
    "fields": {
      "pipelineId": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetRouteExplorerLaneRequest": {
    "fields": {
      "fromIso2": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      },
      "toIso2": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      },
      "hs2": {
        "kind": "string",
        "required": true
      },
      "cargoType": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetRouteImpactRequest": {
    "fields": {
      "fromIso2": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      },
      "toIso2": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      },
      "hs2": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetSectorDependencyRequest": {
    "fields": {
      "iso2": {
        "kind": "string",
        "required": true,
        "stringLen": 2,
        "stringPattern": "^[A-Z]{2}$"
      },
      "hs2": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.GetStorageFacilityDetailRequest": {
    "fields": {
      "facilityId": {
        "kind": "string",
        "required": true
      }
    }
  },
  "worldmonitor.supply_chain.v1.ListEnergyDisruptionsRequest": {
    "fields": {}
  },
  "worldmonitor.supply_chain.v1.ListFuelShortagesRequest": {
    "fields": {}
  },
  "worldmonitor.supply_chain.v1.ListPipelinesRequest": {
    "fields": {}
  },
  "worldmonitor.supply_chain.v1.ListStorageFacilitiesRequest": {
    "fields": {}
  },
  "worldmonitor.thermal.v1.ListThermalEscalationsRequest": {
    "fields": {}
  },
  "worldmonitor.trade.v1.GetTariffTrendsRequest": {
    "fields": {
      "reportingCountry": {
        "kind": "string",
        "stringPattern": "^([0-9]{3})?$"
      },
      "partnerCountry": {
        "kind": "string",
        "stringPattern": "^([0-9]{3})?$"
      },
      "productSector": {
        "kind": "string",
        "stringPattern": "^([a-zA-Z0-9_-]{0,16})?$"
      },
      "years": {
        "kind": "int32",
        "numberGte": 0,
        "numberLte": 30
      }
    }
  },
  "worldmonitor.trade.v1.GetTradeBarriersRequest": {
    "fields": {}
  },
  "worldmonitor.trade.v1.GetTradeFlowsRequest": {
    "fields": {
      "reportingCountry": {
        "kind": "string",
        "stringPattern": "^([0-9]{3})?$"
      },
      "partnerCountry": {
        "kind": "string",
        "stringPattern": "^([0-9]{3})?$"
      },
      "years": {
        "kind": "int32",
        "numberGte": 0,
        "numberLte": 30
      }
    }
  },
  "worldmonitor.trade.v1.GetTradeRestrictionsRequest": {
    "fields": {}
  },
  "worldmonitor.trade.v1.ListComtradeFlowsRequest": {
    "fields": {}
  },
  "worldmonitor.unrest.v1.ListUnrestEventsRequest": {
    "fields": {}
  },
  "worldmonitor.webcam.v1.GetWebcamImageRequest": {
    "fields": {}
  },
  "worldmonitor.webcam.v1.ListWebcamsRequest": {
    "fields": {}
  },
  "worldmonitor.wildfire.v1.ListFireDetectionsRequest": {
    "fields": {}
  }
};

// server/request-validator.ts
var requestTypes = GENERATED_REQUEST_TYPES;
var messageRules = GENERATED_MESSAGE_RULES;
var patternCache = /* @__PURE__ */ new Map();
var utf8Encoder = new TextEncoder();
var hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
function exceedsUtf8ByteLimit(value, limit) {
  if (value.length > limit) return true;
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) > 127) return utf8Encoder.encode(value).byteLength > limit;
  }
  return false;
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function addViolation(violations, field, description) {
  violations.push({ field, description });
}
function isRequiredValueMissing(value) {
  return value == null || value === "" || Array.isArray(value) && value.length === 0;
}
function isZeroValue(value) {
  return value == null || value === "" || value === 0 || value === false || Array.isArray(value) && value.length === 0;
}
function defaultScalarValue(rule) {
  if (rule.optional) return void 0;
  if (rule.kind === "string") return "";
  if (rule.kind === "double" || rule.kind === "float") return 0;
  if (rule.kind === "enum") return rule.enumValues?.[0];
  if (/^(?:s?fixed|s?int|uint)/.test(rule.kind)) {
    return rule.kind === "int64" && rule.int64Encoding !== "number" ? "0" : 0;
  }
  return void 0;
}
function validateEnum(rule, value, path, violations) {
  if (typeof value !== "string") {
    addViolation(
      violations,
      path,
      "value must be an enum name (this API does not accept the numeric proto3-JSON enum form)"
    );
    return;
  }
  if (rule.enumValues && !rule.enumValues.includes(value)) {
    addViolation(violations, path, "enum value must be defined");
    return;
  }
  if (rule.enumNotIn?.includes(value)) {
    addViolation(violations, path, `enum value must not be ${value}`);
  }
}
var ADJACENT_CLASS_QUANTIFIERS = /(\[(?:[^\]\\]|\\.)*\])\{(\d+),(\d+)\}\1\{(\d+),(\d+)\}/;
function collapseAdjacentClassQuantifiers(source) {
  let out = source;
  for (let guard = 0; guard < 16; guard += 1) {
    const next = out.replace(
      ADJACENT_CLASS_QUANTIFIERS,
      (_match, cls, a, b, c, d) => `${cls}{${Number(a) + Number(c)},${Number(b) + Number(d)}}`
    );
    if (next === out) break;
    out = next;
  }
  return out;
}
function compilePattern(source) {
  let pattern = patternCache.get(source);
  if (!pattern) {
    pattern = new RegExp(collapseAdjacentClassQuantifiers(source));
    patternCache.set(source, pattern);
  }
  return pattern;
}
function validateString(rule, value, path, violations) {
  if (typeof value !== "string") {
    addViolation(violations, path, "value must be a string");
    return;
  }
  const length = [...value].length;
  let oversized = false;
  if (rule.stringLen != null && length !== rule.stringLen) {
    addViolation(violations, path, `string length must be exactly ${rule.stringLen}`);
    if (length > rule.stringLen) oversized = true;
  }
  if (rule.stringMinLen != null && length < rule.stringMinLen) {
    addViolation(violations, path, `string length must be at least ${rule.stringMinLen}`);
  }
  if (rule.stringMaxLen != null && length > rule.stringMaxLen) {
    addViolation(violations, path, `string length must be at most ${rule.stringMaxLen}`);
    oversized = true;
  }
  if (rule.stringMaxBytes != null && exceedsUtf8ByteLimit(value, rule.stringMaxBytes)) {
    addViolation(violations, path, `string UTF-8 length must be at most ${rule.stringMaxBytes} bytes`);
    oversized = true;
  }
  if (rule.stringConst != null && value !== rule.stringConst) {
    addViolation(violations, path, `string must equal ${rule.stringConst}`);
  }
  if (rule.stringPattern != null && !oversized) {
    if (!compilePattern(rule.stringPattern).test(value)) {
      addViolation(violations, path, `string must match pattern ${rule.stringPattern}`);
    }
  }
}
function validateNumber(rule, value, path, violations) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    addViolation(violations, path, "value must be a finite number");
    return;
  }
  if (rule.kind !== "double" && rule.kind !== "float" && !Number.isInteger(value)) {
    addViolation(violations, path, "value must be an integer");
    return;
  }
  if (rule.numberGte != null && value < rule.numberGte) {
    addViolation(violations, path, `number must be greater than or equal to ${rule.numberGte}`);
  }
  if (rule.numberLte != null && value > rule.numberLte) {
    addViolation(violations, path, `number must be less than or equal to ${rule.numberLte}`);
  }
}
function validateStringEncodedInt64(rule, value, path, violations) {
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
    addViolation(violations, path, "value must be a base-10 integer string");
    return;
  }
  const integer = BigInt(value);
  if (rule.numberGte != null && integer < BigInt(rule.numberGte)) {
    addViolation(violations, path, `number must be greater than or equal to ${rule.numberGte}`);
  }
  if (rule.numberLte != null && integer > BigInt(rule.numberLte)) {
    addViolation(violations, path, `number must be less than or equal to ${rule.numberLte}`);
  }
}
function validateSingleValue(rule, value, path, violations, ancestors) {
  if (rule.kind === "message") {
    if (!isRecord2(value)) {
      addViolation(violations, path, "value must be an object");
      return;
    }
    if (!rule.messageType) {
      throw new Error(`Generated request-validation rule for ${path} is missing its message type.`);
    }
    validateMessage(rule.messageType, value, path, violations, ancestors);
    return;
  }
  if (rule.kind === "string") {
    validateString(rule, value, path, violations);
    return;
  }
  if (rule.kind === "enum") {
    validateEnum(rule, value, path, violations);
    return;
  }
  if (rule.kind === "int64" && rule.int64Encoding !== "number") {
    validateStringEncodedInt64(rule, value, path, violations);
    return;
  }
  validateNumber(rule, value, path, violations);
}
function validateField(rule, value, present, path, violations, ancestors) {
  if (rule.ignore === "IGNORE_IF_ZERO_VALUE" && (!present || isZeroValue(value))) {
    return;
  }
  const enumZeroValue = rule.kind === "enum" && value === rule.enumValues?.[0];
  if (rule.required && (isRequiredValueMissing(value) || enumZeroValue)) {
    addViolation(violations, path, "value is required");
    return;
  }
  if (rule.repeated) {
    const repeatedValue = present ? value : [];
    if (!Array.isArray(repeatedValue)) {
      addViolation(violations, path, "value must be an array");
      return;
    }
    if (rule.repeatedMinItems != null && repeatedValue.length < rule.repeatedMinItems) {
      addViolation(violations, path, `array must contain at least ${rule.repeatedMinItems} item(s)`);
    }
    if (rule.repeatedMaxItems != null && repeatedValue.length > rule.repeatedMaxItems) {
      addViolation(violations, path, `array must contain at most ${rule.repeatedMaxItems} item(s)`);
    }
    repeatedValue.forEach((item, index) => {
      validateSingleValue(rule, item, `${path}[${index}]`, violations, ancestors);
    });
    return;
  }
  if (!present) {
    if (rule.kind === "message" || rule.optional) return;
    value = defaultScalarValue(rule);
  }
  if (value === void 0) return;
  validateSingleValue(rule, value, path, violations, ancestors);
}
function validateMessage(typeName, body, parentPath, violations, ancestors) {
  const schema = messageRules[typeName];
  if (!schema) {
    throw new Error(`No generated message-validation schema for ${typeName}.`);
  }
  if (ancestors.has(body)) {
    addViolation(violations, parentPath || "$request", "value must not contain circular references");
    return;
  }
  ancestors.add(body);
  for (const [fieldName, rule] of Object.entries(schema.fields)) {
    const path = parentPath ? `${parentPath}.${fieldName}` : fieldName;
    validateField(rule, body[fieldName], hasOwn(body, fieldName), path, violations, ancestors);
  }
  ancestors.delete(body);
}
function validateGeneratedRequest(methodName, body) {
  const requestType = requestTypes[methodName];
  if (!hasOwn(requestTypes, methodName) || typeof requestType !== "string") {
    throw new Error(`No generated request-validation schema for RPC method ${methodName}.`);
  }
  if (!isRecord2(body)) {
    return [{ field: "$request", description: "value must be an object" }];
  }
  const violations = [];
  validateMessage(requestType, body, "", violations, /* @__PURE__ */ new Set());
  return violations.length > 0 ? violations : void 0;
}

// src/shared/premium-paths.ts
var PREMIUM_RPC_PATHS = /* @__PURE__ */ new Set([
  "/api/market/v1/analyze-stock",
  "/api/market/v1/get-stock-analysis-history",
  "/api/market/v1/backtest-stock",
  "/api/market/v1/list-stored-stock-backtests",
  // /api/intelligence/v1/classify-event: LLM-backed classifier. Keep in the
  // premium path set so browser Pro callers attach the Clerk Bearer and
  // anonymous wms_ sessions cannot mint cache-miss LLM spend.
  "/api/intelligence/v1/classify-event",
  "/api/intelligence/v1/deduct-situation",
  // Browser calls must attach Clerk auth and bypass wm-session recovery:
  // anonymous 401s here are expected Pro denials, not dead session cookies.
  "/api/intelligence/v1/get-country-intel-brief",
  "/api/intelligence/v1/list-market-implications",
  "/api/intelligence/v1/get-regional-snapshot",
  "/api/intelligence/v1/get-regime-history",
  "/api/intelligence/v1/get-regional-brief",
  // Historical intelligence memory (#5694). Read-only over the Convex history
  // store; the two semantic routes also spend one embeddings call per cache
  // miss, which is why they carry fail-closed rate policies as well.
  "/api/intelligence/v1/search-intel-history",
  "/api/intelligence/v1/get-intel-timeline",
  "/api/intelligence/v1/get-similar-events",
  "/api/resilience/v1/get-resilience-score",
  "/api/resilience/v1/get-resilience-ranking",
  "/api/resilience/v1/get-food-stocks",
  "/api/supply-chain/v1/get-country-chokepoint-index",
  "/api/supply-chain/v1/get-bypass-options",
  "/api/supply-chain/v1/get-country-cost-shock",
  "/api/supply-chain/v1/get-route-explorer-lane",
  "/api/supply-chain/v1/get-route-impact",
  "/api/supply-chain/v1/get-country-products",
  "/api/supply-chain/v1/get-multi-sector-cost-shock",
  "/api/supply-chain/v1/get-sector-dependency",
  "/api/economic/v1/get-national-debt",
  // Global procurement is a Pro product surface. Keep this in the shared
  // registry so premiumFetch attaches the Clerk bearer and the gateway enforces
  // the same route as the entitlement map.
  "/api/economic/v1/list-global-tenders",
  "/api/sanctions/v1/list-sanctions-pressure",
  "/api/trade/v1/list-comtrade-flows",
  "/api/trade/v1/get-tariff-trends",
  "/api/scenario/v1/run-scenario",
  "/api/scenario/v1/get-scenario-status",
  // #3734: PRO-gated mutation that enqueues a simulation task. Companion
  // /get-simulation-outcome remains public (existing convention).
  "/api/forecast/v1/trigger-simulation",
  "/api/v2/shipping/route-intelligence",
  "/api/v2/shipping/webhooks",
  // /api/mcp-proxy: Pro-gated outbound MCP proxy (PR #3768, issue #3723).
  // Path-gated here so premiumFetch attaches the Clerk Bearer for normal
  // web Pro users; the server gate in api/mcp-proxy.ts uses isCallerPremium
  // which validates enterprise key, wm_ user key, or Bearer JWT.
  "/api/mcp-proxy",
  // /api/chat-analyst: Pro-gated streaming SSE endpoint for WM Analyst panel.
  // ChatAnalystPanel.send() calls premiumFetch('/api/chat-analyst', ...) and
  // the server uses isCallerPremium; without this entry premiumFetch never
  // attaches the Clerk Bearer for browser Pro users → every send returned
  // 403 "Pro subscription required" despite a valid subscription. Symptom
  // stayed hidden until PR #3797 fixed the unlock-wipe so users could
  // actually type and click Send.
  "/api/chat-analyst"
]);

// server/gateway.ts
var serverOptions = {
  onError: mapErrorToResponse,
  validateRequest: validateGeneratedRequest
};
var MAX_INTERNAL_MCP_BODY = 256 * 1024;
function getRateLimitTelemetryReason(response, rejectedReason) {
  return response.status === 503 && response.headers.get("X-RateLimit-Mode") === "degraded" ? "rate_limit_degraded" : rejectedReason;
}
async function claimInternalMcpReplayNonce(userId, nonce) {
  const digest = await sha256Hex(`${userId}:${nonce}`);
  const key = `internal-mcp-replay:v1:${digest}`;
  const result = await runRedisPipeline([
    ["SET", key, "1", "EX", INTERNAL_MCP_REPLAY_CACHE_TTL_SECONDS, "NX"]
  ]);
  if (result.length === 0) return "unavailable";
  const claim = result[0];
  if (claim?.error) return "unavailable";
  return claim?.result === "OK" ? "fresh" : "replay";
}
var TIER_HEADERS = {
  fast: "public, max-age=60, s-maxage=300, stale-while-revalidate=60, stale-if-error=600",
  medium: "public, max-age=120, s-maxage=600, stale-while-revalidate=120, stale-if-error=900",
  slow: "public, max-age=300, s-maxage=1800, stale-while-revalidate=300, stale-if-error=3600",
  "slow-browser": "max-age=300, stale-while-revalidate=60, stale-if-error=1800",
  "live-browser": "private, max-age=30, stale-while-revalidate=60, stale-if-error=300",
  static: "public, max-age=600, s-maxage=3600, stale-while-revalidate=600, stale-if-error=14400",
  daily: "public, max-age=3600, s-maxage=14400, stale-while-revalidate=7200, stale-if-error=172800",
  "no-store": "no-store",
  live: "public, max-age=30, s-maxage=60, stale-while-revalidate=60, stale-if-error=300"
};
var TIER_CDN_CACHE = {
  fast: "public, s-maxage=600, stale-while-revalidate=300, stale-if-error=1200",
  medium: "public, s-maxage=1200, stale-while-revalidate=600, stale-if-error=1800",
  slow: "public, s-maxage=3600, stale-while-revalidate=900, stale-if-error=7200",
  "slow-browser": "public, s-maxage=900, stale-while-revalidate=60, stale-if-error=1800",
  "live-browser": null,
  static: "public, s-maxage=14400, stale-while-revalidate=3600, stale-if-error=28800",
  daily: "public, s-maxage=86400, stale-while-revalidate=14400, stale-if-error=172800",
  "no-store": null,
  live: "public, s-maxage=60, stale-while-revalidate=60, stale-if-error=300"
};
var RPC_CACHE_TIER = {
  // 'live' tier — bbox-quantized + tanker-aware caching upstream of the
  // 60s in-handler cache, absorbing identical-bbox requests at the CDN
  // before they hit this Vercel function. Energy Atlas live-tanker layer.
  "/api/maritime/v1/get-vessel-snapshot": "live",
  "/api/market/v1/list-market-quotes": "medium",
  "/api/market/v1/list-crypto-quotes": "medium",
  "/api/market/v1/list-crypto-sectors": "slow",
  "/api/market/v1/list-defi-tokens": "slow",
  "/api/market/v1/list-ai-tokens": "slow",
  "/api/market/v1/list-other-tokens": "slow",
  "/api/market/v1/list-commodity-quotes": "medium",
  "/api/market/v1/list-stablecoin-markets": "medium",
  "/api/market/v1/get-sector-summary": "medium",
  "/api/market/v1/get-fear-greed-index": "slow",
  "/api/market/v1/get-market-breadth-history": "daily",
  "/api/market/v1/list-gulf-quotes": "medium",
  "/api/market/v1/analyze-stock": "slow",
  "/api/market/v1/get-stock-analysis-history": "medium",
  "/api/market/v1/backtest-stock": "slow",
  "/api/market/v1/list-stored-stock-backtests": "medium",
  "/api/infrastructure/v1/list-service-statuses": "slow",
  "/api/seismology/v1/list-earthquakes": "slow",
  "/api/infrastructure/v1/list-internet-outages": "slow",
  "/api/infrastructure/v1/list-internet-ddos-attacks": "slow",
  "/api/infrastructure/v1/list-internet-traffic-anomalies": "slow",
  "/api/forecast/v1/get-forecast-scorecard": "fast",
  "/api/unrest/v1/list-unrest-events": "slow",
  "/api/cyber/v1/list-cyber-threats": "static",
  "/api/conflict/v1/list-acled-events": "slow",
  "/api/military/v1/get-theater-posture": "slow",
  "/api/military/v1/get-defense-industrial-base": "daily",
  "/api/infrastructure/v1/get-temporal-baseline": "slow",
  "/api/aviation/v1/list-airport-delays": "static",
  "/api/aviation/v1/get-airport-ops-summary": "static",
  "/api/aviation/v1/list-airport-flights": "static",
  "/api/aviation/v1/get-carrier-ops": "slow",
  "/api/aviation/v1/get-flight-status": "fast",
  "/api/aviation/v1/track-aircraft": "no-store",
  "/api/aviation/v1/search-flight-prices": "medium",
  "/api/aviation/v1/search-google-flights": "no-store",
  "/api/aviation/v1/search-google-dates": "medium",
  "/api/aviation/v1/list-aviation-news": "slow",
  "/api/market/v1/get-country-stock-index": "slow",
  "/api/natural/v1/list-natural-events": "slow",
  "/api/wildfire/v1/list-fire-detections": "static",
  "/api/maritime/v1/list-navigational-warnings": "static",
  "/api/supply-chain/v1/get-china-corridor-control-towers": "medium",
  "/api/supply-chain/v1/get-shipping-rates": "daily",
  "/api/supply-chain/v1/list-pipelines": "static",
  "/api/supply-chain/v1/get-pipeline-detail": "static",
  "/api/supply-chain/v1/list-storage-facilities": "static",
  "/api/supply-chain/v1/get-storage-facility-detail": "static",
  "/api/supply-chain/v1/list-fuel-shortages": "medium",
  "/api/supply-chain/v1/get-fuel-shortage-detail": "medium",
  "/api/supply-chain/v1/list-energy-disruptions": "medium",
  "/api/economic/v1/get-fred-series": "static",
  "/api/economic/v1/get-bls-series": "daily",
  "/api/economic/v1/get-energy-prices": "static",
  "/api/research/v1/list-arxiv-papers": "static",
  "/api/research/v1/list-trending-repos": "static",
  "/api/giving/v1/get-giving-summary": "static",
  "/api/intelligence/v1/get-country-intel-brief": "static",
  // The canonical Railway projection refreshes every 15 minutes. Keep the
  // public composition route's Vercel TTL (10m on fast) inside that cadence so
  // the seeder cannot keep re-publishing a two-hour-old medium-tier response.
  "/api/intelligence/v1/get-china-decision-signals": "fast",
  "/api/intelligence/v1/get-gdelt-topic-timeline": "medium",
  "/api/climate/v1/list-climate-anomalies": "daily",
  "/api/climate/v1/list-climate-disasters": "daily",
  "/api/climate/v1/get-co2-monitoring": "daily",
  "/api/climate/v1/get-ocean-ice-data": "daily",
  "/api/climate/v1/list-air-quality-data": "fast",
  "/api/climate/v1/list-climate-news": "slow",
  "/api/sanctions/v1/list-sanctions-pressure": "daily",
  "/api/sanctions/v1/lookup-sanction-entity": "no-store",
  "/api/radiation/v1/list-radiation-observations": "slow",
  "/api/thermal/v1/list-thermal-escalations": "slow",
  "/api/research/v1/list-tech-events": "daily",
  "/api/military/v1/get-usni-fleet-report": "daily",
  "/api/military/v1/list-defense-patents": "daily",
  "/api/conflict/v1/list-ucdp-events": "daily",
  "/api/conflict/v1/get-humanitarian-summary": "daily",
  "/api/conflict/v1/list-iran-events": "slow",
  "/api/displacement/v1/get-displacement-summary": "daily",
  "/api/displacement/v1/get-population-exposure": "daily",
  "/api/economic/v1/get-bis-policy-rates": "daily",
  "/api/economic/v1/get-bis-exchange-rates": "daily",
  "/api/economic/v1/get-bis-credit": "daily",
  "/api/trade/v1/get-tariff-trends": "daily",
  "/api/trade/v1/get-trade-flows": "daily",
  "/api/trade/v1/get-trade-barriers": "daily",
  "/api/trade/v1/get-trade-restrictions": "daily",
  "/api/trade/v1/get-customs-revenue": "daily",
  "/api/trade/v1/list-comtrade-flows": "daily",
  "/api/economic/v1/list-world-bank-indicators": "daily",
  "/api/economic/v1/get-energy-capacity": "daily",
  "/api/economic/v1/list-grocery-basket-prices": "daily",
  "/api/economic/v1/list-bigmac-prices": "daily",
  "/api/economic/v1/list-fuel-prices": "daily",
  "/api/economic/v1/get-fao-food-price-index": "daily",
  "/api/economic/v1/get-crude-inventories": "daily",
  "/api/economic/v1/get-nat-gas-storage": "daily",
  "/api/economic/v1/get-eu-yield-curve": "daily",
  "/api/supply-chain/v1/get-critical-minerals": "daily",
  "/api/supply-chain/v1/get-mineral-production": "daily",
  "/api/military/v1/get-aircraft-details": "static",
  "/api/military/v1/get-wingbits-status": "static",
  "/api/military/v1/get-wingbits-live-flight": "no-store",
  "/api/military/v1/list-military-flights": "slow",
  "/api/market/v1/list-etf-flows": "slow",
  "/api/research/v1/list-hackernews-items": "slow",
  "/api/intelligence/v1/get-country-risk": "slow",
  "/api/intelligence/v1/get-risk-scores": "slow",
  "/api/intelligence/v1/get-pizzint-status": "slow",
  "/api/intelligence/v1/classify-event": "static",
  "/api/intelligence/v1/search-gdelt-documents": "slow",
  "/api/infrastructure/v1/get-cable-health": "slow",
  "/api/positive-events/v1/list-positive-geo-events": "slow",
  "/api/military/v1/list-military-bases": "daily",
  "/api/economic/v1/get-macro-signals": "medium",
  "/api/economic/v1/get-national-debt": "daily",
  "/api/prediction/v1/list-prediction-markets": "medium",
  "/api/forecast/v1/get-forecasts": "medium",
  "/api/forecast/v1/get-simulation-package": "slow",
  "/api/forecast/v1/get-simulation-outcome": "slow",
  "/api/supply-chain/v1/get-chokepoint-status": "medium",
  "/api/supply-chain/v1/get-chokepoint-history": "slow",
  "/api/news/v1/list-feed-digest": "slow",
  "/api/intelligence/v1/get-country-facts": "daily",
  "/api/intelligence/v1/list-security-advisories": "slow",
  "/api/intelligence/v1/list-satellites": "static",
  "/api/intelligence/v1/list-gps-interference": "slow",
  "/api/intelligence/v1/list-cross-source-signals": "medium",
  "/api/intelligence/v1/list-oref-alerts": "fast",
  "/api/intelligence/v1/list-telegram-feed": "fast",
  "/api/intelligence/v1/get-company-enrichment": "slow",
  "/api/intelligence/v1/list-company-signals": "slow",
  "/api/intelligence/v1/search-sec-filings": "medium",
  "/api/intelligence/v1/list-material-events": "medium",
  "/api/news/v1/summarize-article-cache": "slow",
  "/api/imagery/v1/search-imagery": "static",
  "/api/infrastructure/v1/list-temporal-anomalies": "medium",
  "/api/infrastructure/v1/get-ip-geo": "no-store",
  "/api/infrastructure/v1/reverse-geocode": "slow",
  "/api/infrastructure/v1/get-bootstrap-data": "no-store",
  "/api/webcam/v1/get-webcam-image": "no-store",
  "/api/webcam/v1/list-webcams": "no-store",
  "/api/consumer-prices/v1/get-consumer-price-overview": "slow",
  "/api/consumer-prices/v1/get-consumer-price-basket-series": "slow",
  "/api/consumer-prices/v1/list-consumer-price-categories": "slow",
  "/api/consumer-prices/v1/list-consumer-price-movers": "slow",
  "/api/consumer-prices/v1/list-retailer-price-spreads": "slow",
  "/api/consumer-prices/v1/get-consumer-price-freshness": "slow",
  "/api/aviation/v1/get-youtube-live-stream-info": "fast",
  "/api/market/v1/list-earnings-calendar": "slow",
  "/api/market/v1/get-cot-positioning": "slow",
  "/api/market/v1/get-gold-intelligence": "slow",
  "/api/market/v1/get-hyperliquid-flow": "medium",
  "/api/market/v1/get-insider-transactions": "slow",
  "/api/economic/v1/get-economic-calendar": "slow",
  "/api/economic/v1/get-china-macro-snapshot": "slow",
  "/api/economic/v1/get-china-activity-nowcast": "medium",
  "/api/intelligence/v1/list-market-implications": "slow",
  "/api/economic/v1/get-ecb-fx-rates": "slow",
  "/api/economic/v1/get-eurostat-country-data": "slow",
  "/api/economic/v1/get-eu-gas-storage": "slow",
  "/api/economic/v1/get-oil-stocks-analysis": "static",
  "/api/economic/v1/get-oil-inventories": "slow",
  "/api/economic/v1/get-energy-crisis-policies": "static",
  "/api/economic/v1/list-global-tenders": "medium",
  "/api/economic/v1/get-eu-fsi": "slow",
  "/api/economic/v1/get-economic-stress": "slow",
  "/api/supply-chain/v1/get-shipping-stress": "medium",
  "/api/supply-chain/v1/get-country-chokepoint-index": "slow-browser",
  "/api/supply-chain/v1/get-bypass-options": "slow-browser",
  "/api/supply-chain/v1/get-country-cost-shock": "slow-browser",
  "/api/supply-chain/v1/get-country-products": "slow-browser",
  "/api/supply-chain/v1/get-multi-sector-cost-shock": "slow-browser",
  "/api/supply-chain/v1/get-sector-dependency": "slow-browser",
  "/api/supply-chain/v1/get-route-explorer-lane": "slow-browser",
  "/api/supply-chain/v1/get-route-impact": "slow-browser",
  // Scenario engine: list-scenario-templates is a compile-time constant catalog;
  // daily tier gives browser max-age=3600 matching the legacy /api/scenario/v1/templates
  // endpoint header. get-scenario-status is premium-gated — gateway short-circuits
  // to 'slow-browser' but the entry is still required by tests/route-cache-tier.test.mjs.
  "/api/scenario/v1/list-scenario-templates": "daily",
  "/api/scenario/v1/get-scenario-status": "slow-browser",
  "/api/health/v1/list-disease-outbreaks": "slow",
  "/api/health/v1/list-air-quality-alerts": "fast",
  "/api/intelligence/v1/get-social-velocity": "fast",
  "/api/intelligence/v1/get-country-energy-profile": "slow",
  "/api/intelligence/v1/compute-energy-shock": "fast",
  "/api/intelligence/v1/get-country-port-activity": "slow",
  // NOTE: get-regional-snapshot is premium-gated via PREMIUM_RPC_PATHS; the
  // gateway short-circuits to 'slow-browser' before consulting this map. The
  // entry below exists to satisfy the parity contract enforced by
  // tests/route-cache-tier.test.mjs (every generated GET route needs a tier)
  // and documents the intended tier if the endpoint ever becomes non-premium.
  "/api/intelligence/v1/get-regional-snapshot": "slow",
  // get-regime-history is premium-gated same as get-regional-snapshot; this
  // entry is required by tests/route-cache-tier.test.mjs even though the
  // gateway short-circuits premium paths to slow-browser.
  "/api/intelligence/v1/get-regime-history": "slow",
  // get-regional-brief is premium-gated; slow-browser in practice, slow entry for route-parity.
  "/api/intelligence/v1/get-regional-brief": "slow",
  // Historical intelligence memory (#5694) — the timeline is a generated GET
  // and therefore requires an explicit gateway cache tier. The two semantic
  // reads are POSTs and cache successful results inside their handlers.
  "/api/intelligence/v1/get-intel-timeline": "slow",
  "/api/resilience/v1/get-resilience-score": "slow",
  "/api/resilience/v1/get-resilience-ranking": "slow",
  "/api/resilience/v1/get-food-stocks": "slow",
  "/api/resilience/v1/get-runtime-manifest": "no-store",
  // Partner-facing shipping/v2. route-intelligence is premium-gated; gateway
  // short-circuits to slow-browser. Entry required by tests/route-cache-tier.test.mjs.
  "/api/v2/shipping/route-intelligence": "slow-browser",
  // GET /webhooks lists caller's webhooks — premium-gated; short-circuited to
  // slow-browser. Entry required by tests/route-cache-tier.test.mjs.
  "/api/v2/shipping/webhooks": "slow-browser",
  // Company Monitoring is account-private and remains unrouted until #6003.
  // Keep every generated read no-store so future activation cannot inherit a
  // shared CDN tier before its account isolation is proven end to end.
  "/api/company-monitoring/v1/get-company-coverage": "no-store",
  "/api/company-monitoring/v1/get-company-material-event": "no-store",
  "/api/company-monitoring/v1/get-company-monitoring-status": "no-store",
  "/api/company-monitoring/v1/list-company-event-changes": "no-store",
  "/api/company-monitoring/v1/list-company-event-impacts": "no-store",
  "/api/company-monitoring/v1/list-monitored-companies": "no-store"
};
var PUBLIC_NO_AUTH_RPC_PATHS = /* @__PURE__ */ new Set([
  "/api/conflict/v1/list-acled-events",
  "/api/natural/v1/list-natural-events",
  "/api/intelligence/v1/get-china-decision-signals",
  "/api/resilience/v1/get-runtime-manifest",
  "/api/seismology/v1/list-earthquakes",
  "/api/unrest/v1/list-unrest-events",
  // Lead-capture RPCs serve ANONYMOUS prospects by definition: the /pro
  // marketing page contact form and the waitlist/desktop signup both POST
  // without a wms_ session or API key (see pro-test/src/App.tsx onSubmit and
  // src/services/runtime.ts isKeyFreeApiTarget). A freely-mintable anonymous
  // session token would add zero abuse protection here — the real gates live
  // in the handlers: server-side Turnstile (fails closed in production),
  // honeypot, free-email-domain rejection, per-IP endpoint rate limits
  // (server/_shared/rate-limit.ts: 3/h and 5/h), and the Convex per-email
  // throttle. Pinned by tests/leads-gateway-public.test.mts.
  "/api/leads/v1/submit-contact",
  "/api/leads/v1/register-interest"
]);
var RELAY_WARM_PING_PATHS = /* @__PURE__ */ new Set([
  "/api/infrastructure/v1/list-service-statuses",
  "/api/infrastructure/v1/get-cable-health",
  "/api/infrastructure/v1/list-temporal-anomalies",
  "/api/intelligence/v1/get-risk-scores",
  "/api/supply-chain/v1/get-chokepoint-status"
]);
var POST_TO_GET_MAX_BODY_BYTES = 1048576;
var POST_TO_GET_MAX_ARRAY_VALUES_PER_KEY = 200;
var REQUIRED_BBOX_QUERY_PARAMS = ["sw_lat", "sw_lon", "ne_lat", "ne_lon"];
var REQUIRED_BBOX_RPC_PATHS = [
  "/api/military/v1/list-military-bases",
  "/api/military/v1/list-military-flights"
];
var REQUIRED_BBOX_RPC_PATH_SET = new Set(REQUIRED_BBOX_RPC_PATHS);
var MILITARY_BBOX_DIAGNOSTIC_PATH_SET = new Set(REQUIRED_BBOX_RPC_PATHS);
function isPostToGetCompatibleBodySize(headers) {
  const rawContentLength = headers.get("Content-Length");
  if (rawContentLength === null || !/^\d+$/.test(rawContentLength)) return false;
  const contentLength = Number(rawContentLength);
  return Number.isSafeInteger(contentLength) && contentLength < POST_TO_GET_MAX_BODY_BYTES;
}
function getRequiredBboxQueryProblems(searchParams) {
  const absent = [];
  const invalid = [];
  const values = [];
  for (const param of REQUIRED_BBOX_QUERY_PARAMS) {
    const raw = searchParams.get(param);
    if (raw == null) {
      absent.push(param);
      continue;
    }
    if (raw.trim() === "") {
      invalid.push(param);
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      invalid.push(param);
      continue;
    }
    values.push(value);
  }
  const missing = absent.length === REQUIRED_BBOX_QUERY_PARAMS.length ? [...REQUIRED_BBOX_QUERY_PARAMS] : [];
  return {
    missing,
    invalid,
    allZero: absent.length === 0 && invalid.length === 0 && values.every((value) => value === 0)
  };
}
function getRequiredBboxDiagnostic(request, pathname) {
  if (!REQUIRED_BBOX_RPC_PATH_SET.has(pathname)) return null;
  const { searchParams } = new URL(request.url);
  const { missing, invalid, allZero } = getRequiredBboxQueryProblems(searchParams);
  if (missing.length === 0 && invalid.length === 0 && !allZero) return null;
  return {
    status: missing.length > 0 ? "missing" : "invalid",
    missing,
    invalid: allZero ? [...REQUIRED_BBOX_QUERY_PARAMS] : invalid
  };
}
function attachRequiredBboxDiagnosticHeaders(headers, pathname, diagnostic) {
  if (!diagnostic) return;
  headers.set("X-WorldMonitor-Bbox", diagnostic.status);
  if (diagnostic.missing.length > 0) headers.set("X-WorldMonitor-Bbox-Missing", diagnostic.missing.join(","));
  if (diagnostic.invalid.length > 0) headers.set("X-WorldMonitor-Bbox-Invalid", diagnostic.invalid.join(","));
  if (MILITARY_BBOX_DIAGNOSTIC_PATH_SET.has(pathname)) {
    headers.set("X-Military-Bbox", diagnostic.status);
  }
}
function cloneRequestWithHeaders(request, headers) {
  return new Request(request, { headers });
}
function stripClientUserIdHeader(request) {
  if (!request.headers.has(TRUSTED_USER_ID_HEADER)) return request;
  const headers = new Headers(request.headers);
  headers.delete(TRUSTED_USER_ID_HEADER);
  return cloneRequestWithHeaders(request, headers);
}
function withAuthenticatedUserId(request, userId) {
  const headers = new Headers(request.headers);
  headers.set(TRUSTED_USER_ID_HEADER, userId);
  return cloneRequestWithHeaders(request, headers);
}
function normalizeAuthError(error) {
  if (!error || error === USER_API_KEY_GATEWAY_VALIDATION_ERROR) return "Invalid API key";
  return error;
}
function createGatewayAuthErrorResponse(status, error, corsHeaders) {
  return new Response(JSON.stringify({ error: normalizeAuthError(error) }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...corsHeaders
    }
  });
}
var GATEWAY_DIRECT_LLM_QUOTA_METHODS = {
  "/api/intelligence/v1/classify-event": "GET",
  "/api/intelligence/v1/deduct-situation": "POST",
  "/api/intelligence/v1/get-country-intel-brief": "GET",
  "/api/market/v1/analyze-stock": "GET",
  "/api/news/v1/summarize-article": "POST"
};
async function shouldReserveGatewayDirectLlmQuota(request, pathname) {
  if (!DIRECT_LLM_GATEWAY_QUOTA_PATHS.has(pathname)) return false;
  if (GATEWAY_DIRECT_LLM_QUOTA_METHODS[pathname] !== request.method) return false;
  if (pathname !== "/api/news/v1/summarize-article") return true;
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength >= POST_TO_GET_MAX_BODY_BYTES) {
    return true;
  }
  try {
    const body = await request.clone().json();
    return body.mode !== "translate";
  } catch {
    return false;
  }
}
function createDirectLlmQuotaFailureResponse(reservation, corsHeaders) {
  if (reservation.ok) {
    throw new Error("createDirectLlmQuotaFailureResponse called for successful reservation");
  }
  if (reservation.reason === "cap-exceeded") {
    return new Response(JSON.stringify({
      error: "Direct LLM daily quota exceeded",
      limit: reservation.floor ?? DIRECT_LLM_DAILY_QUOTA_LIMIT,
      resetsAt: "next UTC midnight"
    }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Retry-After": String(reservation.retryAfterSec),
        ...corsHeaders
      }
    });
  }
  return new Response(JSON.stringify({ error: "Direct LLM quota unavailable" }), {
    status: 503,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Retry-After": String(reservation.retryAfterSec),
      ...corsHeaders
    }
  });
}
function markAuthErrorNoStore(response) {
  response.headers.set("Cache-Control", "no-store");
  response.headers.delete("CDN-Cache-Control");
  response.headers.delete("Vercel-CDN-Cache-Control");
  return response;
}
function hasCredentialBearingHeader(request) {
  return Boolean(
    request.headers.get("Authorization") || request.headers.get("X-WorldMonitor-Key") || request.headers.get("X-Api-Key") || request.headers.get("Cookie")
  );
}
async function isResilienceRankingSeedRefreshRequest(request, pathname) {
  if (pathname !== "/api/resilience/v1/get-resilience-ranking") return false;
  const expected = process.env.WORLDMONITOR_SEED_REFRESH_KEY?.trim() ?? "";
  if (!expected) return false;
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("refresh") !== "1") return false;
  } catch {
    return false;
  }
  const candidate = request.headers.get("X-WorldMonitor-Key") ?? "";
  return timingSafeEqual(candidate, expected);
}
async function isRelayWarmPingRequest(request, pathname) {
  if (!RELAY_WARM_PING_PATHS.has(pathname)) return false;
  const expected = process.env.WORLDMONITOR_RELAY_KEY?.trim() ?? "";
  if (!expected) return false;
  const candidate = request.headers.get("X-WorldMonitor-Key") ?? "";
  return timingSafeEqual(candidate, expected);
}
function assertProMcpGatewayHmacConfig() {
  const proGrantSecret = process.env.MCP_PRO_GRANT_HMAC_SECRET?.trim() ?? "";
  const internalSecret = process.env.MCP_INTERNAL_HMAC_SECRET?.trim() ?? "";
  if (proGrantSecret && !internalSecret) {
    throw new Error("MCP_INTERNAL_HMAC_SECRET must be configured when MCP_PRO_GRANT_HMAC_SECRET is set");
  }
}
function createDomainGateway(routes) {
  assertProMcpGatewayHmacConfig();
  const router = createRouter(routes);
  return async function handler(originalRequest, ctx) {
    let request = stripClientUserIdHeader(originalRequest);
    const rawPathname = new URL(request.url).pathname;
    const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, "") : rawPathname;
    const t0 = Date.now();
    const rawWidgetKey = request.headers.get("x-widget-key") ?? null;
    const widgetAgentKey = process.env.WIDGET_AGENT_KEY ?? "";
    const validatedWidgetKey = await timingSafeEqualSecret(rawWidgetKey, widgetAgentKey) ? rawWidgetKey : null;
    const usage = {
      sessionUserId: null,
      isUserApiKey: false,
      enterpriseApiKey: null,
      widgetKey: validatedWidgetKey,
      clerkOrgId: null,
      userApiKeyCustomerRef: null,
      tier: null,
      planKey: null
    };
    function recordUsageEntitlement(ent) {
      if (!ent) return;
      if (ent.verificationUnavailable) return;
      usage.tier = typeof ent.features.tier === "number" ? ent.features.tier : 0;
      usage.planKey = ent.planKey;
    }
    const _parts = pathname.split("/");
    const domain = (/^v\d+$/.test(_parts[2] ?? "") ? _parts[3] : _parts[2]) ?? "";
    const reqBytes = deriveReqBytes(request);
    let pendingShadowReason = null;
    function denyForBillingVerification(ent, cors, capabilityCovered = false) {
      if (capabilityCovered) return null;
      const billingDenial = getBillingVerificationDenial(ent, cors);
      if (!billingDenial) return null;
      emitRequest(
        billingDenial.status,
        billingDenial.status === 503 ? "billing_verification_503" : "tier_403",
        null
      );
      return billingDenial;
    }
    function emitRequest(status, reason, cacheTier, resBytes = 0) {
      if (!ctx?.waitUntil) return;
      const effectiveReason = pendingShadowReason && status < 400 ? pendingShadowReason : reason;
      const identity = buildUsageIdentity(usage);
      ctx.waitUntil((async () => {
        const uaHash = await deriveUaHash(originalRequest);
        await deliverUsageEvents([
          buildRequestEvent({
            requestId: deriveRequestId(originalRequest),
            domain,
            route: pathname,
            method: originalRequest.method,
            status,
            durationMs: Date.now() - t0,
            reqBytes,
            resBytes,
            customerId: identity.customer_id,
            principalId: identity.principal_id,
            authKind: identity.auth_kind,
            tier: identity.tier,
            planKey: identity.plan_key,
            country: deriveCountry(originalRequest),
            ipCity: deriveIpCity(originalRequest),
            ipRegion: deriveIpRegion(originalRequest),
            executionRegion: deriveExecutionRegion(originalRequest),
            executionPlane: "vercel-edge",
            originKind: deriveOriginKind(originalRequest),
            cacheTier,
            ip: deriveIp(originalRequest),
            userAgent: deriveUserAgent(originalRequest),
            uaHash,
            referer: deriveReferer(originalRequest),
            acceptLanguage: deriveAcceptLanguage(originalRequest),
            host: deriveHost(originalRequest),
            sentryTraceId: deriveSentryTraceId(originalRequest),
            reason: effectiveReason
          })
        ]);
      })());
    }
    if (isDisallowedOrigin(request)) {
      emitRequest(403, "origin_403", null);
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    let corsHeaders;
    try {
      corsHeaders = getCorsHeaders(request);
    } catch (err) {
      const captured = captureSilentError(err, {
        tags: { route: "gateway", step: "cors_headers" }
      });
      ctx?.waitUntil(captured);
      emitRequest(500, "cors_error", null);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          // Prevent CDN/edge from caching the 500 — a transient CORS
          // failure must not be pinned for downstream callers.
          "Cache-Control": "no-store"
        }
      });
    }
    if (request.method === "OPTIONS") {
      emitRequest(204, "preflight", null);
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    {
      const inboundHeaders = request.headers;
      if (inboundHeaders.has(INTERNAL_MCP_VERIFIED_HEADER) || inboundHeaders.has(TRUSTED_USER_ID_HEADER)) {
        const stripped = new Headers(inboundHeaders);
        stripped.delete(INTERNAL_MCP_VERIFIED_HEADER);
        stripped.delete(TRUSTED_USER_ID_HEADER);
        const reInit = { method: request.method, headers: stripped };
        if (request.method !== "GET" && request.method !== "HEAD") {
          const contentLen = parseInt(request.headers.get("Content-Length") ?? "0", 10);
          if (Number.isFinite(contentLen) && contentLen > MAX_INTERNAL_MCP_BODY) {
            emitRequest(413, "malformed_request", null);
            return new Response(JSON.stringify({ error: "payload_too_large" }), {
              status: 413,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          try {
            const bytes = await request.clone().arrayBuffer();
            if (bytes.byteLength > MAX_INTERNAL_MCP_BODY) {
              emitRequest(413, "malformed_request", null);
              return new Response(JSON.stringify({ error: "payload_too_large" }), {
                status: 413,
                headers: { "Content-Type": "application/json", ...corsHeaders }
              });
            }
            reInit.body = bytes;
          } catch {
            emitRequest(400, "malformed_request", null);
            return new Response(JSON.stringify({ error: "malformed_request" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
        }
        request = new Request(request.url, reInit);
      }
    }
    let internalMcpVerified = false;
    if (request.headers.has(INTERNAL_MCP_SIG_HEADER)) {
      const hmacSecret = process.env.MCP_INTERNAL_HMAC_SECRET ?? "";
      if (!hmacSecret) {
        emitRequest(500, "auth_401", null);
        return new Response(
          JSON.stringify({ error: "CONFIGURATION", detail: "MCP_INTERNAL_HMAC_SECRET not configured" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      let bodyBytes = null;
      if (request.method !== "GET" && request.method !== "HEAD") {
        const contentLen = parseInt(request.headers.get("Content-Length") ?? "0", 10);
        if (Number.isFinite(contentLen) && contentLen > MAX_INTERNAL_MCP_BODY) {
          emitRequest(413, "malformed_request", null);
          return new Response(JSON.stringify({ error: "payload_too_large" }), {
            status: 413,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        try {
          bodyBytes = await request.clone().arrayBuffer();
        } catch {
          emitRequest(401, "auth_401", null);
          return new Response(
            JSON.stringify({ error: "invalid_internal_mcp_signature" }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        if (bodyBytes.byteLength > MAX_INTERNAL_MCP_BODY) {
          emitRequest(413, "malformed_request", null);
          return new Response(JSON.stringify({ error: "payload_too_large" }), {
            status: 413,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        request = new Request(request.url, {
          method: request.method,
          headers: request.headers,
          body: bodyBytes
        });
      }
      const verified = await verifyInternalMcpRequest(request, hmacSecret);
      if (!verified) {
        emitRequest(401, "auth_401", null);
        return new Response(
          JSON.stringify({ error: "invalid_internal_mcp_signature" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const replayClaim = await claimInternalMcpReplayNonce(verified.userId, verified.nonce);
      if (replayClaim === "unavailable") {
        emitRequest(503, "replay_cache_unavailable", null);
        return new Response(
          JSON.stringify({ error: "internal_mcp_replay_cache_unavailable" }),
          { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      if (replayClaim === "replay") {
        emitRequest(401, "auth_401", null);
        return new Response(
          JSON.stringify({ error: "invalid_internal_mcp_signature" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const ent = await getEntitlements(verified.userId);
      const gate = checkProMcpAccess(ent, Date.now());
      const mcpCovered = gate === null;
      const billingDenial = denyForBillingVerification(
        ent,
        corsHeaders,
        mcpCovered
      );
      if (billingDenial) return billingDenial;
      if (!mcpCovered) {
        emitRequest(401, "auth_401", null);
        return new Response(
          JSON.stringify({ error: "insufficient_entitlement" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      const trusted = new Headers(request.headers);
      trusted.delete(INTERNAL_MCP_SIG_HEADER);
      trusted.delete(INTERNAL_MCP_USER_ID_HEADER);
      trusted.delete(INTERNAL_MCP_NONCE_HEADER);
      trusted.set(INTERNAL_MCP_VERIFIED_HEADER, getInternalMcpVerifiedNonce());
      trusted.set(TRUSTED_USER_ID_HEADER, verified.userId);
      const rebuildInit = { method: request.method, headers: trusted };
      if (bodyBytes !== null) rebuildInit.body = bodyBytes;
      request = new Request(request.url, rebuildInit);
      usage.sessionUserId = verified.userId;
      recordUsageEntitlement(ent);
      internalMcpVerified = true;
    }
    const isPublicNoAuthRpc = PUBLIC_NO_AUTH_RPC_PATHS.has(pathname) || isPublicSharedRpcRequest(request.url, request.method);
    const seedRefreshVerified = await isResilienceRankingSeedRefreshRequest(request, pathname);
    const relayWarmPingVerified = await isRelayWarmPingRequest(request, pathname);
    const requiresDirectLlmQuota = !internalMcpVerified && await shouldReserveGatewayDirectLlmQuota(request, pathname);
    const isTierGated = !internalMcpVerified && !isPublicNoAuthRpc && !seedRefreshVerified && !relayWarmPingVerified && getRequiredTier(pathname) !== null;
    const needsLegacyProBearerGate = !internalMcpVerified && !isPublicNoAuthRpc && PREMIUM_RPC_PATHS.has(pathname) && !isTierGated;
    const isProFreshCacheRpc = PRO_FRESH_CACHE_RPC_PATHS.has(pathname);
    const needsProFreshnessResolution = !internalMcpVerified && !isPublicNoAuthRpc && isProFreshCacheRpc && request.headers.get("Authorization")?.startsWith("Bearer ") === true;
    let rateLimitPrincipalUserId;
    let sessionUserId = null;
    let sessionRole = null;
    let quotaEntitlements = null;
    let directLlmDailyLimit;
    if (isTierGated || requiresDirectLlmQuota || needsProFreshnessResolution) {
      const session = await resolveClerkSession(request);
      sessionUserId = session?.userId ?? null;
      sessionRole = session?.role ?? null;
      usage.sessionUserId = sessionUserId;
      usage.clerkOrgId = session?.orgId ?? null;
      if (sessionUserId) {
        request = withAuthenticatedUserId(request, sessionUserId);
      }
    }
    let keyCheck = internalMcpVerified || isPublicNoAuthRpc || seedRefreshVerified || relayWarmPingVerified ? { valid: true, required: false } : await validateApiKey(request, {
      forceKey: isTierGated && !sessionUserId || needsLegacyProBearerGate
    });
    let isUserApiKey = false;
    const wmKey = request.headers.get("X-WorldMonitor-Key") ?? request.headers.get("X-Api-Key") ?? "";
    if (keyCheck.required && !keyCheck.valid && wmKey.startsWith("wm_")) {
      const validationGuardResponse = await checkFailClosedScopedIpRateLimit(
        request,
        "user-api-key:pre-auth-validation",
        600,
        "60 s",
        corsHeaders
      );
      if (validationGuardResponse) {
        const reason = getRateLimitTelemetryReason(
          validationGuardResponse,
          "rate_limit_429"
        );
        emitRequest(validationGuardResponse.status, reason, null);
        return validationGuardResponse;
      }
      const { validateUserApiKey: validateUserApiKey2 } = await Promise.resolve().then(() => (init_user_api_key(), user_api_key_exports));
      try {
        const userKeyResult = await validateUserApiKey2(wmKey);
        if (userKeyResult) {
          isUserApiKey = true;
          usage.isUserApiKey = true;
          usage.userApiKeyCustomerRef = userKeyResult.userId;
          keyCheck = { valid: true, required: true };
          sessionUserId = userKeyResult.userId;
          sessionRole = null;
          usage.sessionUserId = sessionUserId;
          usage.clerkOrgId = null;
          request = withAuthenticatedUserId(request, sessionUserId);
        }
      } catch (err) {
        const code = typeof err === "object" && err !== null ? err.code : void 0;
        if (code === "validation_unavailable") {
          emitRequest(503, "validation_unavailable", null);
          return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
            status: 503,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
              "Retry-After": "5",
              "X-Validation-Mode": "degraded",
              ...corsHeaders
            }
          });
        }
        throw err;
      }
    }
    if ((isTierGated || requiresDirectLlmQuota || needsProFreshnessResolution) && sessionUserId && keyCheck.required && !keyCheck.valid) {
      keyCheck = { valid: true, required: false };
    }
    if (keyCheck.valid && wmKey && !isUserApiKey && keyCheck.kind === "enterprise") {
      usage.enterpriseApiKey = wmKey;
    }
    let userKeyEntitlement;
    if (isUserApiKey && sessionUserId) {
      userKeyEntitlement = await getEntitlements(sessionUserId);
      recordUsageEntitlement(userKeyEntitlement);
      const apiAccessCovered = !!userKeyEntitlement && userKeyEntitlement.features.apiAccess && (userKeyEntitlement.validUntil ?? 0) >= Date.now();
      const billingDenial = denyForBillingVerification(
        userKeyEntitlement,
        corsHeaders,
        apiAccessCovered
      );
      if (billingDenial) return billingDenial;
      if (!userKeyEntitlement) {
        if (isEntitlementBackendConfigured()) {
          emitRequest(503, "billing_verification_503", null);
          return new Response(
            JSON.stringify({
              error: "Unable to verify API access",
              code: "entitlement_verification_unavailable"
            }),
            {
              status: 503,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
                "Retry-After": "5",
                "X-Billing-Verification": "entitlement_verification_unavailable"
              }
            }
          );
        }
        console.error(
          "[gateway] entitlement backend unconfigured (CONVEX_SITE_URL / shared secret missing) \u2014 serving wm_-key request fail-open"
        );
      } else if (!userKeyEntitlement.features.apiAccess || (userKeyEntitlement.validUntil ?? 0) < Date.now()) {
        emitRequest(403, "tier_403", null);
        return createGatewayAuthErrorResponse(
          403,
          "API access requires an active subscription",
          corsHeaders
        );
      } else {
        rateLimitPrincipalUserId = sessionUserId;
      }
    }
    let hasProFreshCacheAccess = internalMcpVerified && isProFreshCacheRpc;
    if (!hasProFreshCacheAccess && isProFreshCacheRpc && sessionUserId) {
      const ent = userKeyEntitlement !== void 0 ? userKeyEntitlement : await getEntitlements(sessionUserId);
      recordUsageEntitlement(ent);
      hasProFreshCacheAccess = !!ent && ent.features.tier >= 1 && ent.validUntil >= Date.now();
      if (hasProFreshCacheAccess) {
        rateLimitPrincipalUserId = sessionUserId;
      }
    }
    if (keyCheck.required && !keyCheck.valid) {
      if (needsLegacyProBearerGate) {
        const authHeader = request.headers.get("Authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const { validateBearerToken: validateBearerToken2 } = await Promise.resolve().then(() => (init_auth_session(), auth_session_exports));
          const session = await validateBearerToken2(authHeader.slice(7));
          if (!session.valid) {
            emitRequest(401, "auth_401", null);
            return createGatewayAuthErrorResponse(401, "Invalid or expired session", corsHeaders);
          }
          if (session.userId) {
            sessionUserId = session.userId;
            usage.sessionUserId = session.userId;
            request = withAuthenticatedUserId(request, session.userId);
          }
          let allowed = session.role === "pro";
          if (!allowed && session.userId) {
            const ent = await getEntitlements(session.userId);
            recordUsageEntitlement(ent);
            const proCovered = !!ent && ent.features.tier >= 1 && ent.validUntil >= Date.now();
            const billingDenial = denyForBillingVerification(
              ent,
              corsHeaders,
              proCovered
            );
            if (billingDenial) return billingDenial;
            allowed = !!ent && ent.features.tier >= 1 && ent.validUntil >= Date.now();
          }
          if (!allowed) {
            emitRequest(403, "tier_403", null);
            return createGatewayAuthErrorResponse(403, "Pro subscription required", corsHeaders);
          }
          rateLimitPrincipalUserId = session.userId;
        } else {
          emitRequest(401, "auth_401", null);
          return createGatewayAuthErrorResponse(401, keyCheck.error, corsHeaders);
        }
      } else {
        emitRequest(401, "auth_401", null);
        return createGatewayAuthErrorResponse(401, keyCheck.error, corsHeaders);
      }
    }
    const isEnterpriseAuth = keyCheck.valid && wmKey && !isUserApiKey && keyCheck.kind === "enterprise";
    if (!isEnterpriseAuth && !internalMcpVerified && !seedRefreshVerified && !relayWarmPingVerified) {
      const entitlementCheck = await checkEntitlementDetailed(sessionUserId, pathname, corsHeaders, {
        clerkRole: sessionRole
      });
      quotaEntitlements = entitlementCheck.entitlements;
      recordUsageEntitlement(entitlementCheck.entitlements);
      const entitlementResponse = entitlementCheck.response;
      if (entitlementResponse) {
        const entReason = entitlementResponse.status === 401 ? "auth_401" : entitlementResponse.status === 403 ? "tier_403" : entitlementResponse.status === 503 ? "billing_verification_503" : "ok";
        emitRequest(entitlementResponse.status, entReason, null);
        return entitlementResponse.status === 401 || entitlementResponse.status === 403 ? markAuthErrorNoStore(entitlementResponse) : entitlementResponse;
      }
      if (sessionUserId && isTierGated) {
        rateLimitPrincipalUserId = sessionUserId;
      }
      if (pathname === "/api/news/v1/summarize-article" && requiresDirectLlmQuota && sessionUserId) {
        const attributionGuardResponse = await checkFailClosedScopedIpRateLimit(
          request,
          "summarize-article:principal-attribution",
          600,
          "60 s",
          corsHeaders
        );
        if (attributionGuardResponse) {
          const reason = getRateLimitTelemetryReason(
            attributionGuardResponse,
            "rate_limit_429"
          );
          emitRequest(attributionGuardResponse.status, reason, null);
          return attributionGuardResponse;
        }
        const ent = entitlementCheck.entitlements ?? (userKeyEntitlement !== void 0 ? userKeyEntitlement : await getEntitlements(sessionUserId));
        quotaEntitlements = ent;
        recordUsageEntitlement(ent);
        if (ent && ent.features.tier >= 1 && ent.validUntil >= Date.now()) {
          rateLimitPrincipalUserId = sessionUserId;
        }
      }
    }
    let matchedHandler = router.match(request);
    if (!matchedHandler && request.method === "POST") {
      if (isPostToGetCompatibleBodySize(request.headers)) {
        const url = new URL(request.url);
        let oversizedKey = null;
        try {
          const bodyText = await request.clone().text();
          if (new TextEncoder().encode(bodyText).byteLength >= POST_TO_GET_MAX_BODY_BYTES) {
            emitRequest(400, "malformed_request", null);
            return new Response(JSON.stringify({ error: "malformed_request" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }
          const body = JSON.parse(bodyText);
          const isScalar = (x) => typeof x === "string" || typeof x === "number" || typeof x === "boolean";
          for (const [k, v] of Object.entries(body)) {
            if (Array.isArray(v)) {
              if (v.length > POST_TO_GET_MAX_ARRAY_VALUES_PER_KEY) {
                oversizedKey = k;
                break;
              }
              v.forEach((item) => {
                if (isScalar(item)) url.searchParams.append(k, String(item));
              });
            } else if (isScalar(v)) url.searchParams.set(k, String(v));
          }
        } catch {
        }
        if (oversizedKey !== null) {
          emitRequest(400, "malformed_request", null);
          return new Response(JSON.stringify({
            error: "Too many values for POST compatibility parameter",
            parameter: oversizedKey,
            maxValues: POST_TO_GET_MAX_ARRAY_VALUES_PER_KEY
          }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const getReq = new Request(url.toString(), { method: "GET", headers: request.headers });
        matchedHandler = router.match(getReq);
        if (matchedHandler) request = getReq;
      }
    }
    if (!matchedHandler) {
      const allowed = router.allowedMethods(new URL(request.url).pathname);
      if (allowed.length > 0) {
        emitRequest(405, "method_not_allowed", null);
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json", Allow: allowed.join(", "), ...corsHeaders }
        });
      }
      emitRequest(404, "unknown_route", null);
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const requiredBboxDiagnostic = getRequiredBboxDiagnostic(request, pathname);
    const identityForScope = buildUsageIdentity(usage);
    let idempotency = null;
    const hasIdempotencyKey = request.method === "POST" && request.headers.has(IDEMPOTENCY_HEADER) && !IDEMPOTENCY_EXEMPT_RPC_PATHS.has(pathname);
    const idScope = identityForScope.principal_id ?? identityForScope.customer_id;
    const idempotencyScope = idScope ? `${identityForScope.auth_kind}:${idScope}` : null;
    if (hasIdempotencyKey) {
      const peek = await peekIdempotency({
        request,
        pathname,
        scope: idempotencyScope,
        idempotencyKey: request.headers.get(IDEMPOTENCY_HEADER) ?? "",
        corsHeaders
      });
      switch (peek.kind) {
        case "invalid":
          emitRequest(400, "idempotency_invalid", null);
          return peek.response;
        case "replay":
          emitRequest(peek.response.status, "idempotent_replay", null);
          return peek.response;
        case "conflict":
          emitRequest(409, "idempotency_conflict", null);
          return peek.response;
        case "mismatch":
          emitRequest(422, "idempotency_mismatch", null);
          return peek.response;
      }
    }
    if (!internalMcpVerified) {
      const endpointRlResponse = rateLimitPrincipalUserId ? await checkEndpointRateLimit(request, pathname, corsHeaders, {
        principalUserId: rateLimitPrincipalUserId
      }) : await checkEndpointRateLimit(request, pathname, corsHeaders);
      if (endpointRlResponse) {
        const reason = getRateLimitTelemetryReason(
          endpointRlResponse,
          "rate_limit_429_endpoint"
        );
        emitRequest(endpointRlResponse.status, reason, null);
        return endpointRlResponse;
      }
      let governedByApiKeyLayer = false;
      if (keyCheck.valid && (isUserApiKey || isEnterpriseAuth)) {
        const enforce = process.env.API_RATE_LIMIT_ENFORCE === "true";
        let perMinute = 0;
        let allowance = -1;
        let identity = "";
        let planKey = "";
        if (isEnterpriseAuth) {
          perMinute = ENTERPRISE_API_RATE_LIMIT;
          allowance = -1;
          planKey = "enterprise";
          usage.tier = 3;
          identity = wmKey ? hashKeySync(wmKey) : "";
        } else if (sessionUserId) {
          const ent = userKeyEntitlement !== void 0 ? userKeyEntitlement : await getEntitlements(sessionUserId);
          if (ent) {
            recordUsageEntitlement(ent);
          }
          if (ent && ent.features.apiAccess && ent.features.apiRateLimit > 0) {
            perMinute = ent.features.apiRateLimit;
            allowance = typeof ent.features.apiDailyAllowance === "number" ? ent.features.apiDailyAllowance : -1;
            planKey = ent.planKey;
            identity = sessionUserId;
          }
        }
        if (perMinute > 0 && identity) {
          const upgradeUrl = planKey && planKey !== "enterprise" ? "https://worldmonitor.app/" : void 0;
          const burst = await checkBurst(perMinute, identity);
          if (!burst.ok) {
            if (enforce) {
              const retryAfterSec = Math.max(1, Math.ceil((burst.reset - Date.now()) / 1e3));
              emitRequest(429, "rl_min_429", null);
              return new Response(JSON.stringify({
                error: "Too many requests",
                plan: planKey || void 0,
                limit: burst.limit,
                limit_type: "per_minute",
                reset: new Date(burst.reset).toISOString(),
                upgrade_url: upgradeUrl
              }), {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "no-store",
                  ...rateLimitHeaders({ limit: burst.limit, remaining: 0, resetMs: burst.reset, retryAfterSec, windowSec: 60 }),
                  ...corsHeaders
                }
              });
            }
            pendingShadowReason = "rl_min_shadow";
          } else if (allowance >= 0) {
            const meter = await reserveDailyMeter({
              userId: identity,
              allowance,
              pipeline: (cmds) => runRedisPipeline(cmds)
            });
            if (meter.overLimit) {
              if (enforce) {
                await meter.rollback();
                emitRequest(429, "rl_ceiling_429", null);
                return new Response(JSON.stringify({
                  error: "Daily request limit reached",
                  plan: planKey || void 0,
                  limit: allowance,
                  limit_type: "daily",
                  reset: new Date(Date.now() + meter.retryAfterSec * 1e3).toISOString(),
                  upgrade_url: upgradeUrl
                }), {
                  status: 429,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                    ...rateLimitHeaders({
                      limit: allowance,
                      remaining: 0,
                      resetMs: Date.now() + meter.retryAfterSec * 1e3,
                      retryAfterSec: meter.retryAfterSec,
                      // Daily ceiling window (24 h) for the advertised policy.
                      windowSec: 86400
                    }),
                    ...corsHeaders
                  }
                });
              }
              pendingShadowReason = "rl_ceiling_shadow";
            }
          }
          if (enforce) governedByApiKeyLayer = true;
        }
      }
      if (!governedByApiKeyLayer && !hasEndpointRatePolicy(pathname)) {
        const rateLimitResponse = rateLimitPrincipalUserId ? await checkRateLimit(request, corsHeaders, {
          principalUserId: rateLimitPrincipalUserId
        }) : await checkRateLimit(request, corsHeaders);
        if (rateLimitResponse) {
          const reason = getRateLimitTelemetryReason(
            rateLimitResponse,
            "rate_limit_429_global"
          );
          emitRequest(rateLimitResponse.status, reason, null);
          return rateLimitResponse;
        }
      }
    }
    if (requiresDirectLlmQuota && !isEnterpriseAuth) {
      if (!sessionUserId) {
        emitRequest(401, "auth_401", null);
        return createGatewayAuthErrorResponse(401, "Pro authentication required", corsHeaders);
      }
      const ent = quotaEntitlements ?? (userKeyEntitlement !== void 0 ? userKeyEntitlement : await getEntitlements(sessionUserId));
      if (ent) recordUsageEntitlement(ent);
      directLlmDailyLimit = resolveActiveDirectLlmLimit(ent);
      if (directLlmDailyLimit !== null) {
        const reservation = await reserveDirectLlmQuota({
          userId: sessionUserId,
          limit: directLlmDailyLimit,
          pipeline: (cmds) => runRedisPipeline(cmds, true)
        });
        if (!reservation.ok) {
          const response2 = createDirectLlmQuotaFailureResponse(reservation, corsHeaders);
          emitRequest(
            response2.status,
            response2.status === 429 ? "rate_limit_429_direct_llm" : "rate_limit_degraded",
            null
          );
          return response2;
        }
      }
    }
    if (hasIdempotencyKey) {
      idempotency = await beginIdempotency({
        request,
        pathname,
        // Tag the scope with the auth kind so value spaces (Clerk id vs hashed
        // key vs customer ref) can never collide across authentication methods.
        scope: idempotencyScope,
        idempotencyKey: request.headers.get(IDEMPOTENCY_HEADER) ?? "",
        corsHeaders
      });
      switch (idempotency.kind) {
        case "invalid":
          emitRequest(400, "idempotency_invalid", null);
          return idempotency.response;
        case "replay":
          emitRequest(idempotency.response.status, "idempotent_replay", null);
          return idempotency.response;
        case "conflict":
          emitRequest(409, "idempotency_conflict", null);
          return idempotency.response;
        case "mismatch":
          emitRequest(422, "idempotency_mismatch", null);
          return idempotency.response;
      }
    }
    let response;
    const handlerCall = matchedHandler;
    const requestForHandler = request;
    try {
      response = await runWithUsageScope(
        {
          ctx: ctx ?? { waitUntil: () => {
          } },
          requestId: deriveRequestId(originalRequest),
          customerId: identityForScope.customer_id,
          route: pathname,
          tier: identityForScope.tier
        },
        () => handlerCall(requestForHandler)
      );
    } catch (err) {
      console.error("[gateway] Unhandled handler error:", err);
      response = new Response(JSON.stringify({ message: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const mergedHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      mergedHeaders.set(key, value);
    }
    const extraHeaders = drainResponseHeaders(request);
    if (extraHeaders) {
      for (const [key, value] of Object.entries(extraHeaders)) {
        mergedHeaders.set(key, value);
      }
    }
    const retryableResponse = drainRetryableResponse(request);
    attachRequiredBboxDiagnosticHeaders(mergedHeaders, pathname, requiredBboxDiagnostic);
    const statusOverride = drainSuccessStatusOverride(request);
    const finalStatus = statusOverride !== void 0 && request.method === "POST" && response.status === 200 ? statusOverride : response.status;
    let resolvedCacheTier = null;
    if (response.status === 200 && request.method === "GET" && response.body) {
      const bodyBytes = await response.arrayBuffer();
      const bodyStr = new TextDecoder().decode(bodyBytes);
      const noStoreReason = getRpcNoStoreReasonFromJson(bodyStr, { pathname });
      if (mergedHeaders.get("X-No-Cache") || noStoreReason) {
        mergedHeaders.set("Cache-Control", "no-store");
        mergedHeaders.delete("CDN-Cache-Control");
        mergedHeaders.delete("Vercel-CDN-Cache-Control");
        mergedHeaders.set("X-Cache-Tier", "no-store");
        resolvedCacheTier = "no-store";
      } else {
        const rpcName = pathname.split("/").pop() ?? "";
        const envOverride = process.env[`CACHE_TIER_OVERRIDE_${rpcName.replace(/-/g, "_").toUpperCase()}`];
        const isPremium = PREMIUM_RPC_PATHS.has(pathname) || getRequiredTier(pathname) !== null;
        const hasCredentialedNonPublicGet = !isPublicNoAuthRpc && hasCredentialBearingHeader(request);
        const tier = hasProFreshCacheAccess ? "live-browser" : isPremium || hasCredentialedNonPublicGet ? "slow-browser" : (envOverride && envOverride in TIER_HEADERS ? envOverride : null) ?? RPC_CACHE_TIER[pathname] ?? "medium";
        resolvedCacheTier = tier;
        mergedHeaders.set("Cache-Control", TIER_HEADERS[tier]);
        const reqOrigin = request.headers.get("origin") || "";
        const cdnCache = !hasProFreshCacheAccess && !isPremium && !hasCredentialedNonPublicGet && isAllowedOrigin(reqOrigin) ? TIER_CDN_CACHE[tier] : null;
        mergedHeaders.delete("CDN-Cache-Control");
        mergedHeaders.delete("Vercel-CDN-Cache-Control");
        if (cdnCache) mergedHeaders.set("CDN-Cache-Control", cdnCache);
        mergedHeaders.set("X-Cache-Tier", tier);
      }
      mergedHeaders.delete("X-No-Cache");
      if (!new URL(request.url).searchParams.has("_debug")) {
        mergedHeaders.delete("X-Cache-Tier");
      }
      let responseView = new Uint8Array(bodyBytes);
      const jmespathExpr = new URL(request.url).searchParams.get("jmespath");
      if (jmespathExpr && (mergedHeaders.get("Content-Type") ?? "").includes("application/json")) {
        const projection = projectJsonResponse(bodyStr, jmespathExpr);
        if (!projection.ok) {
          const errorBody = JSON.stringify(projection.envelope);
          emitRequest(400, "malformed_request", null, errorBody.length);
          maybeAttachDevHealthHeader(mergedHeaders);
          return new Response(errorBody, {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json; charset=utf-8",
              "X-Content-Type-Options": "nosniff",
              "Cache-Control": "no-store"
            }
          });
        }
        responseView = new TextEncoder().encode(projection.body);
        mergedHeaders.delete("Content-Length");
      }
      let hash = 2166136261;
      const view = responseView;
      for (let i = 0; i < view.length; i++) {
        hash ^= view[i];
        hash = Math.imul(hash, 16777619);
      }
      const etag = `"${(hash >>> 0).toString(36)}-${view.length.toString(36)}"`;
      mergedHeaders.set("ETag", etag);
      const ifNoneMatch = request.headers.get("If-None-Match");
      if (ifNoneMatch === etag) {
        emitRequest(304, "ok", resolvedCacheTier, 0);
        maybeAttachDevHealthHeader(mergedHeaders);
        return new Response(null, { status: 304, headers: mergedHeaders });
      }
      emitRequest(response.status, "ok", resolvedCacheTier, view.length);
      maybeAttachDevHealthHeader(mergedHeaders);
      return new Response(responseView, {
        status: response.status,
        statusText: response.statusText,
        headers: mergedHeaders
      });
    }
    if (response.status === 200 && request.method === "GET") {
      if (mergedHeaders.get("X-No-Cache")) {
        mergedHeaders.set("Cache-Control", "no-store");
      }
      mergedHeaders.delete("X-No-Cache");
    }
    if (idempotency?.kind === "proceed") {
      const bodyBytes = response.body ? await response.arrayBuffer() : new ArrayBuffer(0);
      mergedHeaders.set(IDEMPOTENCY_HEADER, idempotency.key);
      mergedHeaders.set(IDEMPOTENT_REPLAYED_HEADER, "false");
      await idempotency.store(
        retryableResponse ? 503 : finalStatus,
        bodyBytes,
        response.headers.get("content-type")
      );
      emitRequest(finalStatus, "ok", resolvedCacheTier, bodyBytes.byteLength);
      maybeAttachDevHealthHeader(mergedHeaders);
      return new Response(bodyBytes, {
        status: finalStatus,
        statusText: response.statusText,
        headers: mergedHeaders
      });
    }
    const finalContentLen = response.headers.get("content-length");
    const finalResBytes = finalContentLen ? Number(finalContentLen) || 0 : 0;
    emitRequest(finalStatus, "ok", resolvedCacheTier, finalResBytes);
    maybeAttachDevHealthHeader(mergedHeaders);
    return new Response(response.body, {
      status: finalStatus,
      statusText: response.statusText,
      headers: mergedHeaders
    });
  };
}

// src/generated/server/worldmonitor/military/v1/service_server.ts
var ValidationError = class extends Error {
  violations;
  constructor(violations) {
    super("Validation failed");
    this.name = "ValidationError";
    this.violations = violations;
  }
};
function createMilitaryServiceRoutes(handler, options) {
  return [
    {
      method: "GET",
      path: "/api/military/v1/list-military-flights",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            pageSize: Number(params.get("page_size") ?? "0"),
            cursor: params.get("cursor") ?? "",
            neLat: Number(params.get("ne_lat") ?? "0"),
            neLon: Number(params.get("ne_lon") ?? "0"),
            swLat: Number(params.get("sw_lat") ?? "0"),
            swLon: Number(params.get("sw_lon") ?? "0"),
            operator: params.get("operator") ?? "MILITARY_OPERATOR_UNSPECIFIED",
            aircraftType: params.get("aircraft_type") ?? "MILITARY_AIRCRAFT_TYPE_UNSPECIFIED"
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("listMilitaryFlights", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listMilitaryFlights(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/military/v1/get-theater-posture",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            theater: params.get("theater") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getTheaterPosture", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getTheaterPosture(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/military/v1/get-aircraft-details",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            icao24: params.get("icao24") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getAircraftDetails", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getAircraftDetails(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "POST",
      path: "/api/military/v1/get-aircraft-details-batch",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = await req.json();
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getAircraftDetailsBatch", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getAircraftDetailsBatch(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/military/v1/get-wingbits-status",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getWingbitsStatus(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/military/v1/get-usni-fleet-report",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            forceRefresh: params.get("force_refresh") === "true"
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getUSNIFleetReport", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getUSNIFleetReport(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/military/v1/list-military-bases",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            neLat: Number(params.get("ne_lat") ?? "0"),
            neLon: Number(params.get("ne_lon") ?? "0"),
            swLat: Number(params.get("sw_lat") ?? "0"),
            swLon: Number(params.get("sw_lon") ?? "0"),
            zoom: Number(params.get("zoom") ?? "0"),
            type: params.get("type") ?? "",
            kind: params.get("kind") ?? "",
            country: params.get("country") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("listMilitaryBases", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listMilitaryBases(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/military/v1/get-wingbits-live-flight",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            icao24: params.get("icao24") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getWingbitsLiveFlight", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getWingbitsLiveFlight(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/military/v1/list-defense-patents",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            cpcCode: params.get("cpc_code") ?? "",
            assignee: params.get("assignee") ?? "",
            limit: Number(params.get("limit") ?? "0")
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("listDefensePatents", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listDefensePatents(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    },
    {
      method: "GET",
      path: "/api/military/v1/get-defense-industrial-base",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            countryCode: params.get("country_code") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getDefenseIndustrialBase", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getDefenseIndustrialBase(ctx, body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } catch (err) {
          if (err instanceof ValidationError) {
            return new Response(JSON.stringify({ violations: err.violations }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (options?.onError) {
            return options.onError(err, req);
          }
          const message2 = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ message: message2 }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }
  ];
}

// server/worldmonitor/military/v1/_shared.ts
var _HEX_PACKED = "473c0b800e89507fa07434c6704f803b769b0c404b87c8443b768648d8a4505f6743c91b49849187c8493b768387c8483b77ceae292b3b766d7a42a84a3613738bf0507f897a42a73b75ae152af587c8457585d43b75e987c825152bebe8065fae69d4468103497c9548088048da433b766f3b75bf4a35ceae6ce73b9bdf146634e80699152bdf44ed82505f784a35ad3ac4214850a7afca1e3b77d63b7f9f4682ef731bcdaf4057683251e400d1ae6bd4e49560ae81a54060e5ae5d1fae5d264b7fb87a44107a4940ae27a50101a90101970101aa0200a30200c4ae1860ae52e5ae52ff04c03004c1a67585d18014758015104681577cf8877cf8d87cf8dd7cf8ef7cf9a77cf9d07cf9e27cfa0b7cfa117cfa3f7cfa437cfa62ae6db4ae73e8ae744dae747bae748fae749fae74b8ae74c3ae74e2ae87ed4a35ea4a360cae525ee499243b7b6e3b9bf6457c32457c3300601506439806a25f06a2930a400a0a403d0ac0ac0ac8f60d05d90d81a5140530151d0c152886152894152afe152b68152c041533da155376194e9732001c32003633fde133fe7833ffc73422d63430833474163530563532c53553153571cd3aaad23aab053aab0f3aab443aab5f3aabbe3aabc53aac1a3b76483b76573b76763b77843b77f93b7b663b9bd63e9daf3ea6533eaed63f45203f765a3f841b3fb113400ee0400ee443c15343c2ae43c31743c32643c36443c39543c45843c55443c55c43c5df43c67143c70b43c79c43c8b743c8ea43c8f643c90843c933447d1d447d3b447d50447d52447d5344f18344f66845f42445f43145f43545f439467890477fca477fcc477fd447812848042f48047c48047f48080448080d48085848085d48086748087a48088b48d8ac48d920497c10497c2a497c484984324a82f84a83174b7f5b4b7f634b7f734b7fab4b7fbb4b7fd04b7fd44b7fd74b82024b82174c550f4ca330505f765080665111217061f671028871028c71f01271f902738a007434cb76e31376e72276e72779c23c7a42197a425c7a49557a49df7b70127cf3da7cf83d7cf8567cf85a7cf8687cf86a7cf886800279800325800e14800e4187c40387c40f87c83687cc3f87cc408804068804098805a3881405881b6a881b81881ba2881bc68840068880bc8953f28967dd896c21896c22896c2d8a01338a05e58a073c8a073e8a08438a09338a4501a82420abe1e9adfc60adfc63adfcc1adfcd6adfce2adfd01adfd89adfdc1adfdd6adfe72adfe78adfea3adfea9adff06adffbaadffc4adfff1ae000cae001eae0022ae0035ae0044ae0054ae0062ae006dae007eae0089ae009dae00a7ae0159ae018aae01c0ae01f3ae01f4ae022dae0259ae0266ae02c6ae02efae0374ae037cae0381ae03d3ae03d7ae0404ae0408ae040fae0449ae0451ae045cae046dae0479ae04d8ae04feae056eae057cae0581ae0583ae05d1ae0610ae0629ae07a6ae07a9ae07c0ae07c3ae07f4ae07f7ae080fae0859ae0889ae08f1ae093dae095aae0966ae09b0ae0a24ae0a3dae0a54ae0aa6ae0ac0ae0b36ae0b79ae0b9dae0c02ae0c4aae0c81ae0c82ae0cccae0cdeae0ce8ae0d08ae0d1eae0d24ae0d53ae0d98ae0e0dae0e28ae0e3fae0e67ae0e93ae0e97ae0ea9ae10e6ae10fcae1106ae1116ae1141ae1152ae1159ae116aae1198ae1389ae1393ae13b2ae13ffae1462ae146fae14c0ae14cbae1520ae1710ae172aae1739ae17acae17c0ae17fbae1924ae1975ae19b9ae19ddae1b91ae1beeae1c15ae1c1fae1ccbae1d6bae1d8aae1dabae1e44ae1e47ae1e67ae1e68ae1e90ae1eaaae1ec2ae1ed1ae1f24ae1f42ae1f4cae1fffae2005ae2014ae2018ae2038ae2039ae20c6ae20caae211eae214aae21cdae2670ae2695ae2696ae26b8ae26c7ae27a6ae27f9ae27fcae2ee9ae2eeeae2f56ae3406ae4793ae4798ae4799ae47b8ae47e2ae4887ae4888ae49c7ae49f7ae4a1aae4a60ae4b7eae4ba2ae4ba3ae4baaae4be0ae4be8ae4cf4ae4efeae4f13ae4f3fae4f64ae4f6aae4fb7ae4ff0ae50b8ae50ebae515dae5198ae51b3ae51d1ae51deae5209ae5243ae5245ae52b6ae52c5ae535dae54b4ae564fae568bae56b5ae579dae57d9ae5879ae589cae598dae599fae59daae59dbae59e7ae5a1bae5a4eae5a60ae5a65ae5a7cae5a8fae5ab5ae5ac5ae5ac9ae5ad5ae5b35ae5b6eae5c64ae5cb8ae5d3cae5d49ae5d4aae5d5aae5d6eae5d77ae5dedae5dfbae5e59ae5e87ae5ea1ae5ea2ae5ed1ae5ee4ae6024ae6027ae6072ae60f7ae618eae61fdae6211ae623bae6251ae6341ae6373ae6389ae649eae64b3ae660aae6953ae695cae6a4fae6a95ae6aa5ae6b7cae6c1cae6c1dae6c57ae6cbfae6d4dae6d50ae6d78c2b0c1c2bcfbc2bde1c87f04e48c8ae49182e49378e494a7e847d0e847fae84a270100820200b80200fc02ba6406428b0642fb08af3f0a40190a40240a40540a40580a40610ac0e70ac3ee0ac7e30ac7e60ac88f0ac9060ac9370aca0a0b427f0d05e70d082d0d09430d0bf1149c77151cf6152b041533fd1533ff154065154db21d334432002a32003e33fcab33fcae33fd0a33fd3e33fd6e33fd8833fd9233fd9833fda833fe7d33ffd033ffd233ffd93571ce3aaaae3aaac33aab413aab433aab853aab8d3aabcc3aabcf3aabd23aabde3aabe03b75393b763c3b76563b77b93e8b353e8b413f52db3f751b3f85803f85d2400ee343c1b643c1c643c2af43c32043c39b43c49443c4ad43c60a43c60f43c6bd43c6c043c6d043c72d43c79f43c7a843c7aa43c7e143c87c43c8c543c8c8447d3c44f12244f12744f64444f67244f67944f829451e92456789457c2346f483477fcf47811447812147812548040748040d48041e48047348084248088148104948d84448d895497c49497cb14984304984a44984c74a34d64a34e24a35e34a82f04a82f74aecbc4b7f6f4b7fdc4b80154b822b4b82a44b82d44b82e84b83444c2c3a501f8f502fa5505f6c505f72506e6d506f5f507f8e50807250ffc07102597102a87102e371030871030d71038071f90871fa01738a4a738b4975023b75867476103f76e72e781d697a427e7a428c7a43ea7a44507b006c7b09497cf8487cf8747cf87d7cf8d07cf9a97cf9df7cf9ef7cfaa48000d68002158002398002488002b08002d680031d80032f80033c8004fd800791800e2380151187cc0887cc1088140a883801896c13896c26896c3b896c498a09808a2901901010a1af83adfcd3adfc75adfcd7adfce8adfcf2adfcfaadfdc8adfe5eadfe89adff00adff43adff88adffb3adffcdae0004ae0010ae004cae0068ae0073ae0083ae017aae01ccae01d0ae01e7ae01e9ae01feae023dae0250ae02d1ae02edae035eae0363ae040aae047fae0486ae04f3ae04f7ae051aae0577ae0589ae066eae06e4ae07edae07ffae0803ae0868ae08baae0964ae0995ae09eeae0a0fae0a39ae0a47ae0a48ae0a88ae0b69ae0b6dae0b72ae0bfbae0bfcae0c11ae0c1fae0c40ae0c62ae0c74ae0d44ae0e3dae0e66ae0ebdae0f03ae10bcae10e9ae112cae1132ae1135ae117aae11baae11c6ae11e0ae1217ae1283ae12aeae135fae13b9ae13eeae1408ae143fae1467ae151aae151fae1733ae1743ae1790ae17f7ae1aaeae1bfcae1da9ae1db8ae1e4fae1e55ae1e8aae1eb3ae1f23ae1f32ae1f5aae1f61ae1f84ae1fa5ae1fc6ae1fc9ae202cae202dae20e4ae20f5ae215bae21c1ae223fae23bdae2606ae2708ae270aae272cae2760ae2762ae2863ae2f67ae3408ae4788ae47dbae4a0aae4a25ae4a7cae4b4bae4b85ae4bb0ae4bddae4cfeae4d2cae4ebdae4ec1ae4eebae4f5fae4f69ae4f76ae4fabae4fd9ae4fdcae4fe1ae4ff8ae50c3ae50d4ae510cae5110ae511bae517eae51b5ae51dfae525fae52dfae5313ae5641ae564bae5663ae5667ae5668ae566fae567bae5699ae56acae56b3ae574fae5788ae57c8ae57cdae5882ae58a2ae58a8ae593fae59dcae59f0ae5a7fae5b14ae5bc8ae5c1fae5c6bae5c9dae5ca0ae5cc4ae5d3dae5d4cae5d52ae5de5ae5e4aae5e5cae5ed4ae5ed7ae5ed8ae5ef3ae5f16ae5f18ae5f41ae5f96ae5f9dae5f9eae603bae6052ae6207ae6217ae622eae634cae6352ae6374ae638bae63b8ae6478ae648dae6490ae6494ae64a9ae65faae660eae690cae6914ae6998ae6a98ae6aadae6b96ae6baaae6bd3ae6bf7ae6c06ae6c33ae6c53ae6c60ae6c64ae6cc7ae6ce8ae6dc1ae73dcae7485ae7489ae74adae74b1ae77a0af04fcc2b085c2bcc9c87f23e4008ce400e9e483afe49413e4992fe49936e806420101a102003506a26406a28d06a28fc87f3908af3d0a40140a40390ac0ea0ac3170ac33f0ac3f50ac7da0ac8210ac92b0ac93d0ac9ed0acaf20ba0380c21430d05460d07dc0d08a7142b1d142e9b142f53142f6114f127150095151ced151cf2152b00152b03154069154e52156ee61f704032001f32002132003033fcc133fccc33fd2533fd2c33fd5533fd6233fd9333fdc333fdfc34308b3435cd34738d3474d43571c93571d13571d239a84039a8483aaaba3aaaca3aaacc3aab1d3aab203aab353aab4e3aab4f3aab663aab773aabb63aabb73aabe33aac1e3aac223aac2c3b76353b764a3b764d3b7b673b7b7c3b9bd03b9bf43e88193eb6b33f4f0f3f60053f6e703f8249400ea8400ee5447d1743c0b443c25443c2b343c31143c44043c4bf43c4dc43c5e243c69143c69743c6c643c6cc43c6f643c76643c76743c76a43c7a143c7d243c85343c8d843c8de43c8f843c91d43c92743c94e447d5144f04144f04244f16644f60244f61a44f806457c0e45f43846789b4681524682a648048348048a48048c48084548d88e48da604984ad4a36154a82fc4a8312506f65507f8c50ff3c60180068306a70626370c08070c0907102827102dd7102fe71034d7103ae71f9c471fe507433957586237586c97600e976e30576e30a76e7237a42527a42537a427f7a429e7bd03d7cf88a7cf9247cf9907cf99e7cf9d17cf9db7cf9e07cf9e57cf9ed7cfaaa800079800221800274800795800e8a87c40a87c82e883ac18953fd896c678a06e68a0a01ae26bbae277a0b4151adfca8adfcafadfdbeadfe1badfe4aadfe76adfea1adfed5adff77adff8aadff90adffa1adffd3adffd7adffe1adffffae000fae0055ae0072ae00b7ae00b9ae00baae00bdae00d1ae00e3ae0102ae013fae01fbae0230ae0243ae02cbae02d6ae0362ae0370ae0372ae03d6ae03ecae0413ae0419ae041fae0423ae0489ae049eae04a7ae04eaae04eeae055bae0582ae0597ae05a9ae0665ae068dae06d8ae07deae088aae0899ae08a3ae08aaae08aeae09deae0a31ae0a75ae0a79ae0a80ae0a85ae0ab9ae0b03ae0b84ae0b89ae0ba2ae0c00ae0c2fae0c67ae0cbfae0cf1ae0d00ae0d88ae0dc3ae0dc5ae0e03ae0e12ae0e17ae0e50ae10a7ae10b9ae10f6ae1113ae1121ae1150ae11b0ae11c8ae11d7ae123cae12aaae13b0ae13c5ae13c7ae1465ae1466ae1480ae14fcae1524ae1530ae1727ae1752ae178eae17e9ae183dae1859ae1897ae18bcae18daae19aaae1bffae1c1eae1c31ae1c35ae1d89ae1dbfae1e79ae1eafae1f3aae1f43ae1f50ae1f55ae1f94ae1fcbae201bae20bbae2107ae2141ae2148ae21beae24ecae2663ae268bae268dae269dae26b9ae2914ae2938ae2bebae2beeae2ee3ae2fa0ae34bfae47f7ae481fae49caae4a26ae4b66ae4b76ae4b94ae4b9bae4ba0ae4bf2ae4caeae4d37ae4e03ae4e15ae4ea9ae4eb8ae4ec5ae4edcae4fa3ae4fbfae4fc2ae4fcfae4fe2ae50b5ae50bdae50cfae50d0ae519bae51adae51b8ae51e9ae51edae5244ae5248ae5273ae52a9ae52b5ae52c4ae52e1ae52e8ae5300ae5317ae531fae54cbae54e9ae54efae54f1ae54f6ae5639ae566dae56a7ae56dfae5737ae574dae5787ae59a3ae59c3ae59c6ae59e8ae59efae59fcae5a18ae5a31ae5a37ae5a4bae5a53ae5a9dae5ad0ae5ae4ae5aebae5b38ae5b42ae5b70ae5b84ae5baaae5c68ae5c71ae5ca3ae5cdaae5cedae5d0cae5d30ae5d36ae5d3eae5d3fae5d76ae5d93ae5dbfae5e76ae5ec8ae5ef1ae5f95ae5fa3ae604dae61deae6234ae6255ae627dae63f8ae647cae649bae64a7ae64baae68b7ae6963ae698cae6a31ae6a34ae6a39ae6a8aae6a97ae6ac0ae6ba9ae6bd1ae6befae6c54ae6c72ae6cbeae6cdeae6d75ae6da5ae6e7aae73e3ae73eeae7473ae747eae74b5ae74c5ae77c5ae7811af38bec2afd1c2b1d9c87f0ee400a3e4012de4015be4955ce4993ce80675e8cfbae8cfc601018b0101920101980200630200b00200bc0200f002010902b261034443038f4304403f04c03f06a20906a21f06a25109012c0ac3c50ac8f30ba03914b3b714fbf81501c6152890152b091533e215535d32000232002632004432005533fca433fcee33fd0c33fd2233fd5133fdd633fdfe33fe2b33ff143571c13571c33571d03591813aaacf3aab023aab253aab2b3aab363aab883aabbb3aabd33b762d3b77753b7b863b7f6d3b9bb63b9bde3b9be03f43683f476b3f717c3fa50c3fa9333fa93b400eec43c22643c2a643c46143c4a543c4bb43c4c843c56343c5ec43c5f443c69f43c6c743c6d843c6f943c70d43c76443c7e543c7e843c8c143c91a43c92044f10744f16444f60344f67844f67f45f42245f4404678a3468111473c0c477f8e477f9e4781294804044804194804b64804b948080a480c2a480c2c48104de4992348d82348d82d48d8af48d91048da4c497c02497c26497ca6497cb649843349848b4a35e14a35e24a81144b7f7b4b7fa54b7fad4b7fb24b7fc94b7fcc4b7fd64b82994b82d34c2c3b4d03c6506f22506f44506f5d506f6950ff3d50ff3f683000683248702c0470428071012c71025d71039871fa14728132738a4c738a55738a9275050975862a7a42487a424e7a42a37a44117a44457a49437a496f7bc0127bd0327be0367cf8457cf84c7cf8557cf8577cf8cc7cf9d97cf9ea7cfa478002ad8002e780078e800e1f800f328014768016e887cc1987cd05881403881bf48835d2884017896c05896c47896c58896c66a11cf8ae5af0adfca4adfcaaadfcb7adfcc4adfce1adfd0dadfdbfadfe51adfe97adfeabadfebdadff09adff0cadff52adff5aadff83adff8dadffd9ae0030ae0038ae004fae0052ae008bae0093ae00b1ae00c6ae00d4ae00eeae00ffae0104ae0116ae016dae01caae01edae0221ae0222ae022eae0240ae02c8ae02ecae02f5ae0308ae035dae0385ae0386ae038dae0420ae042bae045eae0482ae04beae04dbae04e8ae04f6ae055fae05a8ae05e3ae0657ae07e1ae0823ae086fae0880ae089dae08f9ae0968ae099eae09a0ae09baae2698ae09dbae0a0cae0a3aae0a3bae0afdae0b70ae0b75ae0c29ae0c4cae0c6aae0c77ae0d28ae0d91ae0dbdae0dd3ae0e16ae0e53ae0e59ae0e5eae0f00ae10bdae10ecae1105ae110eae110fae111cae114dae1151ae1164ae119bae12a5ae12a6ae12c5ae130fae13acae13c3ae13f0ae1407ae1418ae142bae1437ae143eae14b3ae14baae14bbae1568ae1734ae1798ae1802ae1828ae184aae18c7ae18d9ae18e6ae18e9ae18eeae18faae1900ae1af9ae1c0eae1d61ae1dd0ae1dd3ae1e6aae1ecdae1f3fae1f49ae1f73ae1f81ae1f83ae1f97ae1fb1ae1fc5ae1fecae2010ae2016ae2036ae203cae2041ae2049ae204eae205cae212fae2132ae2146ae21c9ae220bae223dae23feae2651ae267cae26b1ae26bcae2918ae2bffae2ed6ae2ee6ae2efcae2f61ae2fa2ae2fb0ae2fd3ae478aae47a9ae47d8ae47f4ae4826ae482bae4835ae4859ae4880ae488cae49f0ae4a24ae4a51ae4ae5ae4b54ae4b75ae4b89ae4bf1ae4c04ae4d38ae4d66ae4d6aae4e12ae4e1cae4e9cae4ee1ae4f2fae4f4fae4ffdae50bfae50d1ae50d3ae5137ae5199ae51bdae51c2ae51d5ae51e6ae52bbae52d4ae52d6ae5302ae535fae5375ae54caae54e8ae54edae5643ae56c9ae5738ae5766ae577eae578cae57b4ae5872ae588aae58f1ae5966ae598eae59a6ae59cbae59dfae59ecae59f7ae5a29ae5a6bae5a7bae5abbae5ae5ae5bd4ae5bdaae5ccbae5d27ae5d2fae5d43ae5d63ae5d8bae5dbcae5dc6ae5e69ae5e90ae5ed3ae5f9aae6015ae601eae60c9ae60eaae60fcae6195ae61ccae61dbae621bae6257ae6284ae63beae63dcae63dfae63f0ae6496ae64a0ae64b8ae64c2ae6600ae660dae6966ae6990ae6999ae6a2cae6a32ae6a38ae6aa3ae6aaaae6aaeae6b8cae6b90ae6ba5ae6bafae6bf5ae6c10ae6c19ae6c25ae6cadae6cb6ae6cc2ae6d7fae73d7ae73daae74bfae74d8ae74e8ae77baae77c0aeaaafaed8b5aed9b7af3c5fc2c04dc87f08c87f22e20049e400c3e400cde47dfee48444e48750e48f43e48ff4e494a2e49932e49945e80674e8cfc7e8cfcbe8cfdb01008b0101640200c504c1a70940150a40150a404d0ac7ab0ac7d00ac7e10ac88c0ac9410acaf80c215b0d08ab0d0e1c33fd4c14247014247114343314345a151cf91526c8152bda1533c5154c3132001932002e33fca333fce733fd7033fd7733ff513431133543c33571cb35919439a8473aaab93aaace3aaaf13aab0e3b762f3b779c3b7b3b3b7b5c3b9bac3e826f3f4e273f5aac3f61aa3f6c263f80063f86ad3f88443f8d2e3fa1be3fbefc505f7743c07d43c20843c21943c39743c39a43c40a43c44443c44b43c45b43c47e43c60343c61843c67043c6bc43c75e43c78343c7cf43c8e243c92c447d05447d1f447d2c44f18444f68244f6834682d946f48446f592473c054781174804114804824804b348084948084e480c04480c4348d84248d89148da62497ca2497cbd4984934984964b7f654b7fa04b8209507f8350ffcb613133702c2570626770c08b70c08c71012d71025c71030271030671039c71f90171f90c71fa0271fa0871fc047386c07500d475837b76e30d76e7287a42847a42857a428d7a44037a49427a49de7cf87b7cf8987cf89d7cf8ec7cf9227cf9dd7cf9e67cfa087cfa8780026f8002758002be80079380079780171587c82b87cc1f87cc32881b72881ba58967da896c1f8a097f8a098eae0c42a3ad35ae08b2ae0c52ae0d0aae0d10adfc7badfc8dadfcacadfccbadfcceadfd11adfd7eadfd86adfdd4adfe4cadfe6dadfe74adfe7fadfe83adfea5adfecdadff50adff54adff5fadff66adff9dadffa6adffaaadffadae0080ae010dae015eae015fae0160ae0191ae01deae01ebae0236ae0265ae0269ae02d0ae02dcae035fae03f4ae0401ae0460ae048dae049aae04a8ae04c9ae04e1ae04fcae04ffae052cae05b8ae0627ae06ddae07e0ae0800ae0804ae0863ae08a4ae08b6ae08ebae094eae0997ae0a11ae0a6bae0b07ae0b0aae0becae0bf9ae0c2cae0c72ae0ccaae0cd5ae0cf2ae0cf4ae0cfdae0d29ae0da5ae0dc0ae0ddfae0df5ae0e92ae0e9dae0eb7ae0edbae0ee6ae10b3ae10baae10f7ae10fbae1118ae1128ae116fae1177ae117bae11adae120aae120bae1242ae1255ae128fae1290ae13baae13f5ae140dae1413ae143aae144dae144fae1458ae146eae1723ae1814ae182aae18f7ae1908ae1946ae19c2ae19e7ae19f7ae1b70ae1c06ae1c1bae1d52ae1d5dae1dc9ae1de2ae1e62ae1e63ae1e65ae1ebeae1fa4ae1fa6ae1fd6ae1fe6ae1fe9ae1ffbae2003ae2055ae2064ae2067ae20c0ae20c8ae20e3ae212bae215cae215eae21c8ae21d8ae23a0ae24c7ae268cae269aae26aaae26aeae2767ae2783ae2906ae2913ae2917ae29fcae2bf1ae2edcae2edeae2f63ae2f66ae2f6fae3403ae45c3ae478fae47efae483dae4878ae488bae4a09ae4a0cae4a18ae4b5aae4be5ae4cecae4cfaae4cfdae4e8dae4eb5ae4ed4ae4f78ae4f8bae4fc9ae4fceae4feaae4feeae50baae50d8ae5113ae5115ae51beae526aae526fae527bae5283ae5293ae5296ae52e0ae52eaae52efae52f6ae5378ae538dae540dae54d0ae54d2ae54d7ae54deae5644ae565fae568fae5696ae56b7ae56bcae56dbae56f2ae5729ae5735ae5751ae577aae57bcae58b0ae58efae5960ae596dae5970ae59a7ae59acae59d6ae5a20ae5a21ae5a6eae5a72ae5a7aae5ae2ae5b1fae5bcdae5bddae5c20ae5c7bae5c91ae5cd6ae5d10ae5d1dae5d2eae5d68ae5d6fae5d70ae5d73ae5e0fae5ea9ae5ebbae5edaae5eeaae5eebae5efcae5f3aae5f42ae5f98ae6011ae6037ae61b7ae61daae61e0ae6232ae627aae6340ae6358ae637bae6382ae6395ae63dbae6489ae6495ae64abae64b5ae690eae695bae6a70ae6a77ae6b95ae6b98ae6ba4ae6be8ae6c47ae6c4aae6c76ae6cddae6d3cae6d4aae6d5bae6dadae6e7fae7477ae749eae74b3ae74daae74dfae779aae77a4c2b049c87f29e2005de40050e400e5e40139e40489e483ade4993ae806a6e8cfc200b89b0101ae0101f40180a7038f4e06405106a21306a25406a27806a29106a29c06a39207007a0700dd0900f90940110a40100a402a0a403b0a40530ac7aa0ac8930acadc0d06bc142bfc142c17142ca114b57a14f1201501c71533d61533ef15535b32002932004032005333fca533fcc333fd2033fd2733fd2f33fd4533fd5633fd5d33fd6f33fdd433fe0333fe3733fe7b33fec633ff9933ffb433ffbb33ffbf33ffc233ffcd33ffce3415893421993535413aaaaf3aaae13aaae83aab1c3aab423aaba13b76343b7bf63b9b2c3b9bdc3b9bff3eb1a63f64f643c07143c1e343c43543c4de43c69043c6e243c6f343c74143c78443c7d943c7e443c8d643c92343c93843c93b43c93e43cae3447d27447d33447d3d44c1e944f02544f1a644f63644f68444f6a144f82745f42d45f432468196473c02477f85480440480c2848d8a648d96148d98048da82497c2d497c30497ca7497cc049843749848249848a4984b28a08674a34d94a35c14a35cf4a82fd4a82ff4b7f704b7f774b82d04ca3324ca41a506f425082af7061f770621670626f70c07870c07a70c07c71025a71fa0e738a9176410476e72f7a42827a494f7cf8407cf8467cf85b7cf99f7cf9b77cf9f17cfa107cfa517cfa5780020580024d800337800e3287c40587cc0b87cc1a87cc1c87cc1e87cd0488040b88040f881b85882248896c10896c728a08ce8a08d18a100e901016ae12b9ae5a07adfc77adfc7eadfcadadfcbaadfcc6adfd09adfd75adfd80adfdb6adfdc3adfe52adfe5cadfec0adfecfadff5badff5eae002aae0058ae006aae008cae0105ae0117ae0136ae0140ae0178ae0189ae01aaae01aeae0226ae0248ae024dae0307ae03f6ae046bae04a2ae04e5ae04faae0580ae0593ae05dbae060aae0624ae0674ae068bae068fae07cdae07d0ae07e4ae085aae08bdae0967ae09c1ae09dcae09ebae0a0aae0a7dae0ab5ae0ae4ae0bc1ae0b28ae0b77ae0baeae0bb9ae0c2eae0c44ae0c5eae0c70ae0cc5ae0d1dae0d25ae0d32ae0d36ae0d66ae0deaae0df3ae0e06ae0e1aae0e1dae0e88ae0e9bae109aae1179ae6cc1ae1193ae11f0ae1209ae1238ae138eae13aeae13beae140bae1441ae14a0ae14b4ae14c9ae14d7ae1526ae161dae178bae1795ae17bbae17cbae1838ae1841ae1872ae196dae1becae1c17ae1c26ae1d7cae5a13ae1db3ae1e61ae1e7cae1e85ae1e8bae1e9bae1ea4ae1eb8ae1ebfae1ecbae1f41ae1f7cae200aae200dae2031ae203fae2050ae2108ae21c6ae2208ae24e8ae2667ae266aae2684ae2694ae26d9ae26e0ae2909ae29dcae2be0ae2bf8ae2bfbae2ef9ae2facae47f0ae4815ae4816ae4823ae485eae4879ae498dae49dcae49dfae4a2cae4afeae4b4aae4b4eae4b69ae4b8bae4be1ae4cf8ae4d98ae4e0cae4e13ae4e9aae4ea4ae4ec4ae4eceae4ed9ae4ee3ae4f99ae4f9eae4fa6ae4fc6ae4fc7ae4fe8ae50d5ae51c9ae51dcae51ddae526eae527fae52adae530cae5311ae531aae5361ae5370ae539eae54c7ae54f3ae565aae56b8ae56baae56c4ae571bae5777ae5784ae57c7ae5997ae59c1ae59f9ae59feae5a14ae5a3fae5a61ae5ac1ae5ad8ae5b86ae5c16ae5c6dae5c9aae5caaae5ce0ae5d47ae5d5bae5d72ae5d7eae5d8aae5eaaae5ec3ae5edcae5ee7ae5f46ae5f50ae5fafae6007ae6020ae60ffae61c1ae61ceae620fae6222ae6236ae632aae6347ae6388ae63ebae6408ae647eae6487ae648fae6497ae64a1ae64adae64b0ae68bfae68f0ae6910ae698eae6a23ae6a30ae6a71ae6a8dae6aafae6ba1ae6beeae6c3bae6cabae6d3dae6d7cae6d7eae6d80ae6daeae73d8ae73deae7448ae7484ae749bae74cfae74deae74e0ae77a3ae77ddafa827c2b053c87f2ce485e8e4891fe48c89e80647e84801e8480306a2560100750101b00101d006a24f06a2520741fa0a40250a40260ac3f40ac82a0c40540d836e14633d15279c1528851528921533f815405d1540761d33f533fc9e33fca733fdb633fe1033fe2333fe6f33fe7033fe7333ff1733ffc933ffda3474d53474d835350d3aaab03aab6c3aab9a3b76493b76883b76b43b7b3f3b7f723b9bb13b9bcd3b9bd83eac693f431a3f532c3f65333f727c3f881c3f89353f927c3fa82a3fa9353fab7643c06e43c07743c31443c48143c4b043c56843c61543c67443c68243c6a343c6e343c6ea43c74743c7a343c7e943c88543c8ce43c8d343c8d443c8e843c8f743c92243c92443c93243c94243cb0b447d09447d1944f10246788d46789d46815046830c47813048040848041048042048048e48048f48081148d82c48d88148d8e048d90c48d9cd497c054a34d74a35fa4a82f24a830a4b7f4c4b7f8b4b7fa64b7fcb4b822c4ca1ea4ca331505f68507f845082565110eb702c2070622e70625d70626b70c07b70c08f7103057103b071dd2371f904738b42738b437434c57434d4ae4f2076e30c76e73378cf957a428f7a44007a44167bb1537bd0697cf8367cf9cd7cfa157cfa7f80027b8002a08002ae8002c3800e1e800e26800e69800e79800e8c87c84187cc0287cc27881b63881c0c884005884008896c04896c17896c68ae4f65adfc6eadfc7fadfc92adfcf9adfcfcadfd72adfdb4adfdf9adfe1aadfe20adfe53adfe55adfe64adfe7aadfe7cadfe8dadfecaadff64adff72adff9fadffa7ae0016ae002fae0031ae0036ae0111ae0137ae0167ae01cdae01d5ae01f0ae01f7ae0272ae0394ae03faae0462ae050aae0572ae0598ae063fae0650ae0664ae067aae06dbae074fae079fae07d5ae0882ae0884ae09acae09bcae09f9ae0a1dae0a25ae0a30ae0a8cae0aafae0b73ae0b7aae0b99ae0ba0ae0bc4ae0bdbae0c18ae0c1dae0c3bae0c47ae0c60ae0c86ae0cb5ae0cf9ae0d16ae0d83ae0dd1ae0de3ae0e02ae0e13ae0e23ae0e4aae0e61ae0e6bae0e74ae0efeae10f4ae10faae1108ae1134ae11afae11b8ae11bbae11ceae11e1ae1292ae12a9ae13a8ae13fbae1414ae145dae1470ae14a4ae14c2ae14d5ae1730ae1747ae1755ae17a2ae17abae1805ae1856ae185dae18edae1972ae1bf1ae1c16ae1c25ae1d13ae1d78ae1dbeae1dd6ae1ddeae1e49ae1e56ae1ec6ae1f4dae1f6fae1f74ae1f89ae1f9eae1fbeae1fc0ae1fc8ae2001ae2021ae203eae2119ae2129ae2138ae220aae2238ae223cae2697ae26b7ae26edae26f7ae2741ae275eae2901ae2915ae2f72ae2f73ae2faeae478bae4790ae4791ae47e9ae47eaae481aae481cae4827ae482aae4843ae4870ae4992ae4a52ae4af9ae4b46ae4b71ae4bbaae4bffae4c5eae4d67ae4e95ae4ea1ae4ee4ae4f9fae4fbbae4fefae503dae50aeae510bae5116ae5181ae51baae51e5ae523cae5250ae528cae5298ae52ddae52e7ae52f5ae531eae5369ae537eae53a2ae5647ae5653ae5662ae567fae56a8ae56adae5724ae5739ae574aae577dae5793ae57a6ae57a8ae57b7ae57d1ae5877ae58acae58e3ae58e9ae58faae597cae59adae59b3ae5a11ae5a30ae5a48ae5a80ae5a89ae5a96ae5a9eae5ab9ae5ae8ae5b41ae5bc1ae5bc3ae5cb4ae5cfeae5d2aae5d64ae5d71ae5d99ae5dd6ae5de4ae5e10ae5e8aae5e92ae5ee6ae5f09ae5fa2ae606eae60d2ae60d6ae6101ae61b3ae61b4ae6200ae620bae6210ae621cae63baae6a3cae6aa1ae6abcae6ba0ae6ba2ae6bb2ae6bb9ae6bd2ae6cdbae6cf9ae6d5fae6da1ae73e7ae74b9ae74ecaedb4faef94baf8601af9ba5afa82bc2bd05e20004e4007be4010be80643e8064d010083038f4404c20c06a20e06a24706a25806a27a06a27c0ac88b0ac8dc0ac9fe0aca240acadd0d06150d07c70d09450d0a20142d8514f11614f124151cd7151cdd151cea1526eb15405a15520a32007333fcad33fd3233fd5233fda333fda433fdd233fe0033fe3633fe7533febc33ffb733ffd533ffe933fffb3425d63532c63563433aaaec3aab163aab193aab323aab3a3aab793aabb93aabd43aabe93aabf63aac123aac173b766b3b76893b77833b9bd23b9bf13b9bf83e80c03e865f3e8b133f65213fa9383fb0e63fb2b243c25143c2a143c33f43c4ab43c4d343c4d643c54b43c56143c5e343c6b943c6d543c73843c77043c77d43c78243c79743c7af43c8b543c8f343c90b43cae848104a447d07447d28447d2e44f0e244f42944f42e44f65344f66344f66a457c03457c1845f42e46788e46788f4678a74682e548049548080948086048086c8016ee48c45e48d960497c04497c28497c2e497c2f497c35497c3e497c3f497c84497cab497fa24984434a35a24a35c84a81994a83014aecbf4b7f5e4b7f764b7f9b4b7fb34b7ff94d03cd501fbb505f6a505f6b6831f2702c49702c8770626270626a70c09671037e71039771f9c1730903738a5a738a5d758628758659762bf4766048ae6c1a7a44187a443f7a48937a491a7a49347bb1697be0487cf8527cf87a7cf8ed7cf98f7cf9b07cf9c87cf9da7cf9e77cfa0f7cfa147cfaab8002918002988002cb8003248003e58003e687c81e87c82887c82987cc22881b6d881ba48967db896c06896c1a896c57896c5f8a07078a09e2ae6c5dae0468ae2793ae04acadfca6adfccdadfcdbadfd12adfdf8adfe81adff05adffa3adffa4adffa5adffdcae0000ae0046ae00d6ae0115ae013aae0162ae01efae025cae02daae0368ae0436ae0457ae045aae045dae04d7ae04f4ae0505ae0570ae057dae059bae0681ae06dfae07aeae07b4ae07ddae0818ae0885ae089fae08deae08e8ae0996ae09aaae09c5ae0a04ae0a05ae0a13ae0a46ae0aa0ae0ac7ae0b65ae0bfeae0c3fae0c45ae0c58ae0c92ae0c9cae0cedae0d1fae0dcbae0dcdae0de0ae0dfbae0e56ae0e5fae0e6cae0e94ae0e95ae0ea6ae10f3ae10f5ae10f8ae1100ae113cae119aae119dae11f8ae1234ae127cae1346ae13a2ae13a6ae13bcae140cae1449ae1452ae1453ae14bfae16f1ae170cae179aae179bae189aae18c1ae18f1ae18fbae1921ae19fbae1bf0ae1d8cae1d97ae1e45ae1e50ae1eaeae1f1bae1f26ae1f2fae1f47ae1f79ae1f7aae1f9cae1fbaae1fc2ae1ff3ae2015ae206dae6bc9ae20c9ae2136ae21e8ae23e3ae264fae26a7ae26a9ae2796ae27faae2beaae2c39ae47aaae47b3ae47bcae483eae485fae4860ae4872ae4883ae4a0eae4a4eae4b27ae4b41ae4b60ae4b9dae4cfbae4d27ae4d63ae4e8eae4ea7ae4ebeae4eddae4fdbae5118ae516fae5262ae526cae52dbae5371ae5382ae538eae53caae5645ae568eae56cfae56d5ae5775ae5785ae57a0ae58f6ae596fae59a2ae59f2ae5a15ae5a66ae5a78ae5a79ae5acdae5ad6ae5aedae5b17ae5b75ae5be0ae5c90ae5cb3ae5ce5ae5d5eae5dcaae5deaae5e51ae5e9eae5edeae5f0cae5f11ae6008ae601bae6034ae60ebae6191ae61c9ae633cae634eae637aae638dae6392ae63f4ae641bae6477ae6483ae6485ae6488ae64a4ae64a6ae64bfae6911ae69c5ae6a1dae6ab8ae6c66ae6c7aae6c83ae6cfdae6d59ae6d79ae6d82ae6dbfae6ed5ae7402ae7488ae74bcae74edaf5149af61caaf8458af847ac2b0ade47f5be49181e494a5e49947e80673e847ff0101b10201b206a20a06a27506a28c06a2970a402d0a403a0ac89d0ac9280acb5f0ba0040d07cf0d088c0d09460d0a3114f11d1501771501cd15288a152bc41533d91533fc1f333f31ff3c32004832005233fcb033fcb333fd3a33fd3d33fd6a33fd9c33fdd033ff1633ff1933ffa133ffbe33ffeb34308734308834738b34738c3594053aaaaa3aaaab3aaab23aaae23aaae33aab3e3aac253b75c83b75cc3b75cf3b75e03b763e3b76413b77783b7b743b7b763b9bdb3b9be13e801e3e81823e8a4a3e8c6b3eade845f44d3f4b1f3f6cc93f81e33f984f3f9ae83fa9403fb96c400eea43c13643c15543c1e543c26a43c2a343c32343c48743c4cc43c51e43c55143c55a43c5fc43c61d43c6d643c70c43c79643c7cd43c88943c8be43c8ca43c8cd43c8e343c8f443c92a43c92b43c92f43c963447d2f447d6844f16844f64344f65044f66b44f67444f68646789346789446789a468100477f9d477ff547811647812b47812c48041348042348044848d84148d84348d85348d903497c99ae5f174a35a84a35d04a36104a81854a82f94b7f614b7f954b7f974b82064b820d4b82104b82c64ca1584ca3364ca41b4ca41e4d03c84d03c9702c3270626970626e7102617103b50ac9ea71d87071f90671f9c371faf371fc017434c17585d57585d775862276e31476e72176e73079193a7a43ff7a44027bc0377cf87f7cf89e7cf8c87cf8d97cf8db7cf9a87cf9d57cf9f48002aa800e2187c81a87c837881402881404881b6f881b848836d3883b84884007884b038853328967d1896c1d8990018a01318a2908901011a6fa0ba9a198adfc9badfcabadfccaadfcdfadfce0adfd8aadfe0fadfeceadfed1adfedcadfef1adff75adffacadffefae0001ae003aae0045ae005fae0065ae007fae008fae00edae00f3ae0139ae01c8ae0212ae0227ae0242ae02d2ae02dfae02e0ae0313ae0364ae0366ae0375ae0384ae03f7ae03f8ae0403ae0409ae0441ae04ecae055dae058aae05abae05adae05deae0614ae0661ae0685ae07b3ae07daae07efae088dae088fae0893ae0897ae093fae0945ae094cae09b1ae09bfae09c8ae09fcae0a15ae0a1aae0a3fae0a41ae0a83ae0b00ae0b40ae0b68ae0b83ae0bbaae0c4bae0ca4ae0cd4ae0cebae0d4fae0dbbae0dd4ae0dedae0e25ae0e44ae0ea8ae0f04ae115dae11c9ae11e9ae12b7ae13b7ae13cbae13ceae1404ae144eae145aae147eae14d0ae14d4ae15efae1689ae178cae17b9ae17efae1849ae186dae1898ae18f8ae1c34ae1daaae1e46ae1e59ae1e5bae1e74ae1ea8ae1f1dae1f33ae1f3bae1f86ae1f8fae1fa7ae1fabae2047ae2053ae205eae205fae2066ae2071ae20bfae20c7ae2130ae214cae215dae216eae21efae2230ae266dae26e2ae2794ae2797ae2907ae290aae291aae2c3aae2f23ae2f9eae4796ae479cae47e8ae4834ae4867ae4871ae487eae4885ae49c6ae49ecae49fbae4a0fae4a15ae4a20ae4b2dae4cadae4cefae4d3eae4e94ae4ebfae4ed0ae4ed2ae4ed7ae4edaae4f68ae4f8aae4f95ae4fd3ae4fd6ae51a7ae523eae52e6ae5367ae537aae5392ae543eae54eeae5684ae56a1ae56b2ae56c0ae56f0ae578eae57c2ae57d4ae5964ae596cae5995ae59e0ae59e9ae59f4ae59fdae5a0fae5a28ae5ab2ae5ac7ae5adfae5b0fae5b3fae5b49ae5b6fae5bf5ae5c67ae5ca8ae5cafae5cbbae5ceaae5d0bae5d13ae5d18ae5d4dae5d74ae5d94ae5dc2ae5df7ae5e12ae5e57ae5e9aae5eafae5ee3ae5eedae5f37ae601cae6021ae6039ae6041ae6106ae618cae6209ae623aae624cae625bae625cae636dae637eae63e6ae63f1ae63f6ae6404ae6405ae649aae64b6ae6997ae6aabae6b9bae6c15ae6c16ae6c44ae6c63ae6c84ae6ca7ae6cbaae6cc4ae6e75ae6e77ae73ddae7479ae74b2ae74e3ae77d3ae77feaedb53af3c88c87f0bc87f38c87f3fe14c32e200c7e4007de4010ce40110e41aa3e49258e49593e4992601007e0200330200380200c706428a06a21806a21906a27e0a404f0ac0710ac0e60ac8970ac9300acaf60d05680d07c50d0e6b142c1a142c9414fc0315287e152afa1533ee15508215537c32001532004a32005e33fcaa33fcdb33fd2833fd4033fd7533fdb833fddf33fdeb33fe6c33ffee34151734738e3532c935464b39a84f3aaabf3aaac43aaacd3aaad83aaae93aab123aab133aab173aab373aab493aab6f3aab743aac1c3b76393b7b3d3b7b753b9bfa43c43643c49e3f551d3f60073f85693f89b03f8a643f9c843fa9963fb3163fb34d400ee143c67c43c4a243c67f43c09843c0db43c19843c21843c29043c2a943c31943c56543c5e143c5ed43c6d743c70643c73e43c8ef43c93543c96743caed447d1644b2ad44f10444f10644f14144f18944f1a344f66e44f67344f68744f68844f6a344f8464678a646807946807a46815146815b477f9248040c48041648041d48044648050848050e48080c480854480861480882480c22480c2448104b48d82548d8e2497c2c4984294984b64a36014a830b71f8814b7f6e4b7f814b7fb04b7fb94b7fdf4b82074b82084b82214b82d14ca1ec4d03c54d23b3503fd5505f69506f68507f8150813150ffcc702c2a70c0927102e271030c7103847103d574358b7500c57503f87504357586b976e30976e30e76e72c7836057a42187a427c7a427d7a42a27a44017a493d7a49d27b0fcd7bb1527bcaac7be0247be0457cf8327cf8517cf89b7cf9a67cf9b67cf9c47cf9d87cf9de7cf9f77cfa487cfa848002288002b58002fa8002fb87cc30881b96881bb1881bc8884016896c25896c4c8a05808a0846adfc6cadfc91adfcb3adfcdaadfdcbadfe5badfe68adfe80adfea0adfeb4adfed6adfed7adff45adff56adff86adffb5adffb8adffdbae000bae0027ae002bae007aae0092ae0095ae00d3ae00f6ae00fcae00fdae0197ae01c9ae01d9ae01e6ae02c7ae02f2ae02f3ae0383ae0387ae03d5ae03fbae041aae0426ae04a1ae04aeae04c4ae0500ae0564ae0573ae059fae05aaae05baae0607ae0611ae061cae0658ae065fae0668ae0673ae0752ae07afae07d7ae0810ae088eae08bcae08e3ae095cae0961ae0965ae09a1ae0a16ae0a28ae0a38ae0a44ae0aabae0ae6ae0b19ae0b7bae0b7eae0b80ae0bacae0bb4ae0be1ae0c0aae0c32ae0c36ae0c5aae0c64ae0cbbae0d31ae0d39ae0d3aae0d61ae0d80ae0e1bae0e42ae0e4eae0e7eae0eb4ae10b8ae10e7ae1149ae1155ae1160ae1196ae11e3ae11f2ae1205ae139bae13a0ae1401ae1406ae1443ae1450ae1477ae14b5ae14cdae14d6ae14f8ae1514ae15c9ae16f4ae16fbae1728ae179eae17a1ae17ffae184eae59a4ae18f3ae1948ae194eae1951ae19eeae19f6ae1b77ae1bf3ae1d3eae1e53ae1e70ae1e8dae1e93ae1eb2ae1f72ae1f92ae1fb8ae1fd2ae1ff0ae201933fd4eae2030ae203bae2046ae20deae2178ae21a1ae21f0ae223bae24f1ae2680ae26baae26f5ae276fae27a4ae27f7ae2900ae293aae2bf3ae2bf6ae2c00ae2ed5ae2ed9ae2fabae479bae4817ae483bae487fae4882ae4a19ae4a2aae4b35ae4b5bae4bb9ae4beeae4cb1ae4cf0ae4d56ae4ddeae4e17ae4e18ae4e97ae4ecdae4eeaae4fa8ae4fb0ae50beae50ddae51d3ae51e3ae5251ae5272ae528aae52b3ae5362ae536bae5657ae5676ae567eae5680ae56ceae5723ae5750ae577bae578dae579eae57a1ae5894ae589aae58a0ae58a6ae5940ae595eae596eae59b6ae59ccae59f1ae5a02ae5a03ae5a04ae5a75ae5a8bae5a8cae5a91ae5abeae5b26ae5b2cae5b2fae5b74ae5bb0ae5bbdae5c6eae5c98ae5ca7ae5ce1ae5d2bae5d31ae5d4bae5d86ae5de6ae5decae5e04ae5e8eae5e9dae5ea7ae5eaeae5ebdae5f03ae5f08ae5f1aae5f40ae5f85ae600eae602cae60f4ae61c2ae6215ae62f8ae6337ae6344ae6359ae6370ae63b1ae63ccae63f2ae63f5ae64aeae6601ae690aae6a16ae6a2bae6a2fae6b86ae6c41ae6c70ae6c88ae6cfaae6dbcae748eae77c6c2b0b7c2b39bc87f0dc87f26c87f2ac87f32e2002ae4009de400a1e49286e9406000eafd01007b0100870100890100d301012c0101ac02003b0200f3038ff006a24906a25506a299480c050a404c0ac33b0ac9430acbb20c20da0c40520d0ab0142e22142e46146849151cd415271515533732000a32001732002032003132003432004332005c32006333fd3733fe0b33fe0c33fe1833fe1b33ffb233ffcc3aaad63aaaf43aaaf93aab463aab6d3aaba23aabd93aabf33b76013b76253b76263b76523b9bfe3df5bf3ea1cc3eb86643c27b3f47fa3f62fc3f9a923fb1793fba0643c28b43c39443c0cc43c1be43c26543c4af43c68543c6b843c73d43c76343c7a043c87b43c8c743c8e043c8e543c93c43c94f44f0a644f16044f16944f66544f8014678a14682eb477fa148044a48080748085748d88748d892497c24497c32497c814984264984574984874aecba4b7f784b7f9d4b7fbd4b7feb4b82c54d03c1505f6f506f61506f66516204516205702c6a7061f570621770626671021d7102ae7102c471031171df0171f29b74358775012e7502a876172576410276e3067a42467a44197a48967a495d7a49ee7b005f7b0eab7b70277bc0107be02a7cf8307cf84e7cf8807cf8927cf99c7cf9a37cfa017cfa047cfa0d7cfaa57cfaa67cfaa980028f8002b88002c58002cd800796800e42801478896c5687c41387c41687c41a87c83187cc1b87cc4988140188140c884361896c09896c59896c648a01328a08bc901012ae0b7ca2172eae0bbdae0bbeae0c20ae606aadfc64adfc93adfc94adfc9fadfcbeadfcf1adfcfdadfdc2adfdcdadfe77adfe7eadfe84adfe87adfec9adfed3adffa9ae001dae0050ae005bae0077ae0085ae008aae009eae00c9ae00dbae00f9ae00faae0163ae0179ae01c2ae024fae02d5ae038cae03cfae03f2ae0415ae0425ae0456ae04cdae04dfae04e9ae0592ae059cae05a0ae05e1ae060eae061bae0620ae066bae0694ae07f1ae0805ae0816ae0888ae089bae08ecae094dae09a2ae09d1ae0a29ae0a7bae0a87ae0a9eae0abfae0ae2ae0af9ae0b09ae0b30ae0b32ae0b3fae0c53ae0c6dae0cb9ae0dacae0db6ae0dbaae0e04ae0e0cae0e0eae0e1fae0e24ae0e2bae0e36ae0e5bae0e5cae0e68ae0e6aae0e96ae0e98ae0e9aae0ed0ae0edeae110cae113bae114cae115aae116cae1174ae1175ae11b1ae11c2ae11ebae11f6ae123eae1245ae1294ae13a4ae13adae13f9ae1400ae140aae1415ae1417ae141dae1479ae1482ae14b8ae16f5ae1700ae1702ae171fae174cae17a8ae17b1ae1852ae1866ae189cae18aeae1b86ae1c0cae1d7bae1db5ae1e7bae1e81ae1e83ae1e88ae1ebcae1ecfae1f87ae1fb9ae1fd1ae1fddae1fe0ae204cae2058ae2134ae2142ae2151ae220dae2660ae269cae26f1ae2774ae27fdae29d5ae2ef4ae2f13ae2f5fae2f6cae2f71ae2f97ae2f98ae2fa6ae2fafae35ccae479aae47acae47adae47b9ae47bdae47e6ae47ffae4820ae4821ae4849ae487aae488aae498bae49daae49deae4a1cae4a7aae4ae2ae4af1ae4af8ae4afcae4b31ae4b49ae4bb8ae4cf7ae4d60ae4d9bae4e10ae4e90ae4ee2ae4ee8ae4f29ae4f7bae4f88ae50e8ae51c4ae51cfae51d9ae51e4ae5247ae524eae525bae52daae536dae53feae54cfae54eaae5646ae5672ae56e9ae5720ae5768ae579aae57bdae57c1ae57c3ae57ceae5875ae58aeae58b8ae58d3ae58ebae595dae59d5ae59eeae5a70ae5ae9ae5b36ae5b8cae5bd0ae5c55ae5c63ae5d5dae5d66ae5d88ae5d91ae5d96ae5dbdae5e0bae5e6fae5e84ae5ea0ae5ea8ae5edbae5eddae5ee2ae5f3eae5f47ae5f93ae5f9bae600bae600cae603eae60ecae6197ae61bfae6221ae623eae624dae6383ae63b7ae63e0ae6402ae6407ae6471ae660cae690dae698aae6a75ae6a89ae6a8bae6a92ae6a9aae6abfae6bffae6c0bae6cccae6d3eae6d54ae6d8eae6da7ae6dbaae6dbeae6dc0ae6dc2ae6dcaae6dcdae7449ae746dae747fae7483ae748cae74c0ae74d6ae74e6ae77caae7801af3c49c2bfc1c87f10c87f2fc87f40e20018e40093e483d2e49287e4992be8065ee8068ee8cfd8e8cfda01007702003a02005f0200b502011a06a25c06a27d0900fc09cd450ab0420ac3f20ac9320ac93c0acb180d82130d8216142c4f142e12150011152b37152bb2154068154071154eb632001432004532005d32007433fc9233fcb233fce033fd3133fd4233fdd733fdf333ffdb34158b3426953571ca3f9b113aaab43aaac03aaad93aab153aab453aab4c3aab9e3aaba43aabb43aabc13aabc83aabe83b7b5e3b9bcf3ea12c3f81fa3fa9393fb4aa43c07c43c17543c17c43c1b343c1cc43c1ff43c29e43c2b543c31043c39943c4e043c5db43c5e943c5fb43c66f43c6e043c6e443c70043c70743c73a43c74943c75b43c78143c79843c8b443c95043c9b343caef43cf30447d21447d54447d5844ed8344f14744f67a4680784681764682bd477fcd478131480414480478480499480810480859480c2d48104748104f48d82448d82848d845497cc7497cdd4984484984974984a74a82fb4a830e4a83154b7f434b7fda4b7ff54b7ffe4b82c04b82db4d206a505f75506f4350ffee704f8171027d7102fa7102fb71df03738a03738b4a7500bd7502a57503f77a429d7a429f7a492e7bb15c7be0167cf83b7cf88b7cf8977cf9b57cf9ce7cf9d37cf9f37cf9f87cfa007cfa097cfa3280020480020e8002ab8002cc80033387c40187c41087c826880029881ba38967d3896c15896c24896c2e896c41896c63896c6c8a00028a02dc8a0328adfc73adfc7aadfc9cadfc9eadfce6adfcf8adfdb7adfe59adfe6cadfe7badfeaaadfed9adff4eadff76adff8fadffe5adffecae0006ae0008ae000dae0057ae0067ae0069ae0076ae00e4ae0143ae014fae01fcae0234ae0252ae0253ae0310ae0314ae0355ae036aae03eaae03fdae0484ae04e7ae0560ae057aae0595ae05a7ae065aae0750ae07a5ae07c6ae080dae0815ae0819ae094bae09c9ae0a0bae0a3eae0a74ae0a9cae0a9dae0afaae0afeae0b3dae0be3ae0c2aae0c7dae0cdbae0d38ae0d3bae0d64ae0dc9ae0e14ae0e3bae0e8cae10bfae10fdae1114ae1154ae11b5ae11c1ae11faae13b1ae13b4ae13e6ae13f4ae1410ae1456ae1459ae147fae14a2ae14ccae1532ae1724ae1731ae1738ae186aae18acae18ecae18f4ae194fae19c1ae1bebae1bf8ae1bfdae1dafae1db7ae1dc2ae1e96ae1e99ae1ed9ae1f39ae1f51ae1f56ae1f57ae1f78ae1fa3ae1fafae1fb3ae1fd4ae1ff8ae2043ae2057ae20bcae20c1ae2114ae213fae222eae2482ae24e4ae2650ae2674ae268eae26a3ae26acae26d8ae275bae290dae290fae29d4ae2be5ae2ed2ae2ed7ae2ef6ae47a4ae47b7ae47d9ae47dfae47e7ae47edae49c8ae4a13ae4a1fae4a7dae4b50ae4b74ae4bd9ae4bdfae4cb0ae4cf1ae4d2dae4d5bae4e93ae4ea0ae4ea6ae4eb2ae4f27ae4fadae4faeae5026ae509fae50b0ae50e9ae5112ae51a2ae5208ae5240ae5269ae528bae5292ae52ecae52f1ae530bae536cae5395ae5664ae566aae5673ae5679ae569bae56ccae57a7ae57d0ae595cae596bae5996ae59abae59d2ae5a23ae5a5aae5a64ae5aa1ae5ad4ae5ae6ae5aefae5b8dae5bb1ae5be1ae5be3ae5c54ae5c76ae5c8dae5c93ae5ce2ae5d3aae5d3bae5d7bae5d7dae5d80ae5d90ae5d97ae5dfcae5e00ae5e05ae5e9cae5eb7ae5f04ae5f4dae5fa5ae5fa9ae6010ae6036ae6047ae604fae61dfae620eae622bae623dae6298ae633fae634aae634fae6350ae63ceae63d9ae6403ae647bae648aae64b4ae68b9ae6987ae6a2eae6a78ae6a7fae6abeae6b94ae6ba6ae6ba8ae6c0eae6c48ae6c6eae6c75ae6ccbae6ccdae6cfbae6d4cae6dc3ae7470ae747aae7481ae74d5ae74d7ae74eaaf61c6c2bcf1c2b07bc2bd19c2bd23c87f00c87f06c87f2be14d73e20028e200efe40109e485e9e487d4e4916de494a63aab04e84919e88022e8cfc10101a302003e02004006a21606a25006a25d06a29407007b0ac77b0ac78e0ac8300ac93e0d06d90d08963aab1b0d821814fbc614fc071526be1526db152897152b0a1533de15340215405c15508532000e32004b32007c33fcc633fd0b33fd3433fd4333fd4933fd5033fd5733fd9933fdc133fe1a33fe2c33ffad3546413571cf3aaabd3aaac23aab283aab733aab823aab8e3aab933aab953aaba93aabb53aac133aac1d3b76403b77793b7b433b9bab3b9baf3ea5563f49e63f4dca3f89763f8b8e3fa9343fa93c43c11743c14843c16843c1e443c29543c29943c32b43c49643c4bc43c4cf43c4d043c4d543c4d743c54f43c5f943c67e43c69943c6d143c72e43c75743c76e43c79243c79e43c7e743c87943c87d43c8b343c8cc43c8e143c93644982544ed8144f10944f64244f6a044f82146789148043248044548080548b15e48d82e48d89848d8a548d90948d98149842e4984424984884984b14a35a54a36144a81824a81884b7f724b7fae4b7fb54b821f4b829a4b82a706a26b4ca41d503fd0503fdb506e1c507f826831f1683243702c3b70626571026f71030a06a27771f90b738a8f7503277610527a42037a42077a42237a42437a42837a44757a448f7a48957be04c7cf8677cf8797cf8f07cf98d7cf9f07cf9fb8002768002c480079c800e16800e20800e7080150d80151c80151e87c41587cc0087cc2187cc3187cd0387cd23881b68881bee881c02894087896028896c07896c2c896c3d896c40896c46896c7406a2988a0a00ae07c8a6fa32a7cae8ae6330ae636fadfc83adfc89adfc8aadfcaeadfcccadfdb5adfdbaadfdd1adfdecadfe63adfe82adfeaeadfebcadff55adff6fadff79adffdeadffe4ae0047ae005dae008dae01ceae01d7ae01e3ae0203ae0237ae0264ae02ddae0325ae0356ae0376ae03efae0407ae0487ae04b2ae04c1ae04deae055cae0662ae0663ae0679ae0689ae07abae07bdae63bdae07e9ae0883ae08b8ae09aeae09b4ae09d8ae09f5ae0a17ae0a43ae0abaae0affae0b01ae0b6bae0bc8ae0be8ae0c22ae0c7fae0c83ae0d23ae0d63ae0d6fae0da7ae0dcfae0decae0e0bae0e10ae0e32ae0e40ae0e55ae0e5dae0e73ae0eb6ae10ffae1109ae1138ae1139ae113dae1147ae1153ae1162ae12b6ae1396ae13f3ae1403ae1405ae1425ae149eae14a6ae14a9ae14c8ae1521ae173aae1758ae179fae17b8ae17f3ae183bae1873ae18e5ae18fdae197dae19bbae19e3ae1bf4ae1d00ae1d5bae1e4dae1e54ae1e5cae1e8fae1e98ae1ebbae1eceae1f31ae1f45ae1f4aae1f4fae1f65ae1f95ae1fb5ae1fdaae2008ae200bae2040ae206fae215fae2209ae2237ae23e1ae24e6ae24ebae267bae63c1ae26f3ae2709ae27f3ae27f8ae2becae2ee7ae2f19ae2fd7ae47beae47f6ae47fcae485bae49c5ae49e6ae4a4dae4a81ae4b3bae4b57ae4b58ae4caaae4e01ae4e11ae4e1fae4edeae4ef1ae4f36ae4f83ae4f96ae4f9cae4fa0ae4fc3ae4fdfae4fe0ae4febae513bae51b1ae5268ae528fae52a0ae52abae52f2ae5305ae5315ae5316ae5321ae5374ae5381ae55a0ae567cae5681ae5683ae56a0ae56d1ae56e4ae571aae5790ae5796ae57b8ae57ccae58b2ae598fae5998ae59f5ae5a57ae5a8aae5aadae5ab0ae5ac8ae5adbae5b45ae5b69ae5b89ae5bdeae5be6ae5be7ae5cb9ae5d37ae5d55ae5d57ae5d7aae5d7fae5d8dae5dc5ae5dc7ae5dc8ae5e14ae5e50ae614aae5e91ae5eb0ae5ebfae5ec1ae5ec7ae5ee0ae5f51ae6194ae61c5ae61ffae6201ae6237ae63ddae6473ae65f6ae6902ae6915ae695eae6960ae6965ae6a28ae6a29ae6a35ae6a81ae6a93ae6aa8ae6b9aae6b9eae6babae6c6aae6c7cae6cb5ae6cc0ae6cd2ae6d40ae6d76ae6d86ae6da6ae6da8ae6dafae6db8ae6dc9ae73efae7427ae746fae7482ae74aeae74e4ae74eeaf551baf9babc2bcabe2001ce200aee4007ce4008be400c2e40142e48c6ce49174e49af8e84930e84931e8800401007902005e0200610200ee0344450640f206a3930901380940130ac1520ac3c40ac7c90ac7db0ac8280ac88e0ac8960ac9260ac9400acaf70b603e0b603f0c215a0d08a80d0bf4142da0142f6414a127150099154c831553411d334532000f32003b32005833fd1033fd3b33fd4f33fd6d33fd8033fdc233ff1a3532cb3532cc35350c3571c53591c63593cc3aaabc3aaae63aab243aab263aab333aab4b3aab603aabf23b76003b762e3b7b5d3b7b6a3b9bae3b9be33e857e3e8ef23e8f0f3f43e63f62193f86dc3f89753fbba93fbc8343c17443c1e243c25843c2aa43c32743c39343c39c43c40343c42143c4c543c5e443c5f543c66d43c68a43c6da43c72943c79d43c7ea43c80943c8b943c8c043c8c343c94843cf2e43cf3a447d2644c1e444f66d44f67644f67b457c2045f446467801477f7147812448041c48051248080248083748083a480c4548d84648d88648da61497c03497c0649842c4984614984d24a34e14a35b64aecb94b7f8f4b7f964b7fc34b7ff24b82254b822a4b82c44b82d54ca13e4d03d04d20de507f9d50ff3e6008816831f77102a171030471030e71fe5c743591763b2c76e31076e72b7a424d7a42547a431a7a438b7a443a7a49cf7b059f7b704f7be04e7cf8357cf83e7cf85d7cf8897cf8ee7cf9957cf9ab7cf9b38002448002658002688002c98002f7800332800e3e800e8b800f338016ec87c00287c40c87cc1888140b881b668880bd896c2f896c628991828a041b8a042b8a042c8a055d8a07088a0935a7cabea7ce16adfc6aadfc8cadfcbcadfcbfadfcd5adfcecadfcf3adfcf4adfcf7adfde6adfe10adfe15adfe65adfe6fadfe92adfebbadff08adff58adff7dadffa0adffe0adffe6ae0013ae006bae007dae00a1ae00b3ae00c4ae00daae0164ae01a4ae01f9ae023bae023eae0244ae025aae02caae03c2ae03ebae0406ae0418ae044dae0488ae048aae04bcae04c7ae04cbae04f8ae0504ae0509ae0559ae0563ae0565ae0635ae066fae0690ae0691ae0692ae06d9ae07adae07cbae07e5ae07eeae088bae089cae08eaae094fae0950ae095bae098eae0993ae09a8ae09d4ae0a09ae0a12ae0a1fae0a8dae0aadae0b08ae0b1eae0b20ae0ba9ae6c02ae0baaae0bc2ae0c0fae0c39ae0c43ae0c4fae0c71ae0ca5ae0ccdae0d1cae0d90ae0dc6ae0dc8ae0de6ae0e29ae0e34ae0e35ae0e4bae0e62ae0e64ae0ebaae1119ae111dae1146ae11d5ae11d6ae11e2ae123dae130dae139fae13c4ae140fae14c5ae172cae1732ae173fae1789ae17a4ae17aeae18f6ae1976ae19e8ae1c07ae1c08ae1c32ae1d19ae1dc4ae1dc8ae1e60ae1e77ae1e86ae1eabae1f1fae1f27ae1f60ae1f76ae1f9bae1fa8ae1fc1ae2024ae2054ae20c5ae20fdae210fae21d6ae24c5ae26abae26caae272dae2742ae2770ae2771ae2772ae2937ae293bae29cfae29daae29fdae2ef2ae2ef3ae2f9fae479eae47e4ae4829ae487bae487dae488dae49c2ae4a0dae4a1eae4a4cae4a53ae4a94ae6c58ae4b80ae4bd7ae4d32ae4dfeae4e14ae4e92ae4eefae4f3cae4fc5ae50b2ae51a3ae51a8ae51b9ae51bbae51ceae5282ae5289ae52ccae5373ae5383ae5393ae539bae5421ae54e3ae5648ae5661ae566eae5694ae56c2ae56eeae5718ae571cae5726ae5783ae57cbae5870ae587aae5899ae58b5ae58b6ae58edae58f4ae5941ae599aae59c7ae59cfae5a0aae5a42ae5a4dae5ac6ae5acaae5b16ae5b80ae5bd5ae5c77ae5d53ae5dccae5e16ae5e97ae5eabae5ed5ae5f0eae5f4eae5f92ae5f97ae5f9cae5fa1ae6042ae60b0ae60cbae6203ae623cae6334ae638aae63deae63edae6413ae6475ae647dae64b7ae64c3ae65f5ae68bdae6989ae698dae6a14ae6a2dae6a3eae6a7cae6a80ae6aa9ae6b9dae6bcaae6bf3ae6d3fae6d7bae6da4ae73ebae748dae74b4ae74b7ae74c2aed61daf09c4afc66ac2b08fc87f2dc87f36e14d34e400b0e847f8e8cfb9e8cfbfe8cfce0101780101910200b70200c102010706a26306a2920a40050a400b0a40230a405e0ac3180ac7e20ac89e0ac8d90ac9860acb170d09140d0b280d8212142280142d8614b67014b67314b8ee14f11b1533ba154c8f1d333d32001332002432006133fccb33fd7633fdb433fdbc33fde533fe1433fe2e33fe9d33ff1833ff1c33ff8c33ffb53426933474d23532c73532ce3565953571d43593cb39a85539a8573aab033aab643aab7d3aab813aabca3aabcb3aabd83b769c3b77903b77aa3b9baa3b9bb93e854f3e95dc3f6eea3f6f023f793f3f88563f892a3f96663f97fd3f9e5b3fa1963fa9363facfe400ee243c06a43c14443c1d543c1fa43c20c43c22543c31843c38c43c39643c40843c4db43c55343c73b43c76043c76143c79343c8bf43c90f43c93443c972447d0044c1e844f64944f662457c0d46789c46f801473c07477f7b47819d4804124804444804914804b548080848084f480c2148d82148d84948d8e3497c4a497cb34984a54984a64984c84a35a44a81f84b7f5f4b7f8a4b7f9a4b7fc14b7fdd4b7fe04b82a14b82b14b82e14b82ea4ca31a505f6d506e1d506f45507f8650ff39702c3170c08d71002871025e71026d71034e71039d7103b671dd1871f88075032875032976209a76e7327a42227a42897a43fa7a49c47be0517cf8377cf8437cf86b7cf8937cf9a57cf9aa7cfa0c7cfa3380026a80027e80029f8002a78002ca8002da8002ea80041480079480079b800e15800e2f800f3087cc2687cd018805b088140688140e881bb8881bb9881bc78967d08967dc896c658a02d88a09378a0a36ae4fdeaa94bcadfc6fadfc86adfc87adfc99adfca2adfcb5adfcbbadfcc7adfceeadfe1cadfe95adfeccadfed4adff4aadff53adffb9adffc8ae0017ae0021ae0040ae00d5ae00e9ae0149ae015dae01cfae01d8ae01e4ae0229ae0256ae0271ae02f9ae030cae0319ae0320ae0389ae03caae03d0ae046cae047eae0483ae04b1ae04b3ae04b8ae04d9ae04daae04e2ae04f9ae0599ae062cae0659ae065eae0666ae068cae06e9ae07acae07feae0809ae080aae0817ae0875ae08b3ae08b5ae08fbae0944ae09d9ae09fdae0af5ae0b94ae0bbcae0bc3ae0bffae0c5dae0cd0ae0cd7ae0d6bae0d71ae0d8bae0d94ae0dd0ae0de9ae0e19ae0e22ae0e4dae0e4fae0ebeae1163ae116eae1170ae11b7ae11dcae11ecae11eeae1233ae1275ae1397ae13afae143cae1481ae149cae149fae14afae14c3ae14c7ae1525ae1577ae15a4ae171eae17b4ae17bfae1869ae1901ae1920ae1926ae1997ae19a6ae19c4ae19d3ae1b6dae1c11ae1d81ae1e4bae1e66ae1e71ae1e73ae1ea9ae1eb7ae1ec7ae1f1eae1f28ae1f4eae1f5eae1f82ae1f9aae1fa1ae1fe8ae1ff9ae2013ae2023ae2026ae2027ae20fbae223aae24e2ae24f7ae266fae2679ae267eae268fae26a2ae275fae2784ae27a2ae27a7ae27f4ae27ffae2902ae2919ae29d8ae29d9ae2f10ae2f18ae2f25ae2f5bae2fadae47a1ae47b6ae47e3ae4814ae4a7fae4b56ae4ceeae4d50ae4d64ae4d68ae4e1bae4ec9ae4f5aae4f77ae4fc4ae4ffeae50d9ae5114ae511eae51b4ae523bae5299ae529cae52c0ae52c7ae537dae539cae539dae540cae54e6ae54ecae54f5ae54f9ae5623ae5678ae56a2ae56b4ae56bfae56d4ae56deae5722ae5780ae5782ae578bae5795ae5797ae57a9ae57aaae5889ae5897ae5973ae59b9ae59e4ae5a2eae5a4cae5ab1ae5aecae5b3bae5b40ae5b6bae5b8bae5bbeae5bc5ae5bd2ae5c62ae5c6aae5c96ae5d17ae5d48ae5e7eae5ebcae5ec6ae5ee9ae5eefae5efdae5f3cae5fadae6018ae6028ae60c8ae60d3ae622dae68b2ae634bae6371ae6375ae63bfae647fae64a5ae65f9ae68aeae68bcae6918ae699aae6a1cae6a33ae6b9fae6c46ae6c5fae6c6dae6ccaae6cf3ae6cfcae6d7aae74b0ae74d0ae74e9ae77faaf6c50af8486c2b003c2bd2d33fdd5c87f11e4009be400f7e8066be847f4e8483401007c01008d0101900200bb05cc10062f0f06a2480940140a40120a401e0ac3c30ac7450ac7d90ac9330ac93a0d082e0d094414b9331501c0151cd8151cfa1526da152882152bc71533f31553491f2bca1f33951f6fa932001e32003332003c33fcd133fcfd33fd0333fd5a33fd6c33fde233fe1233fe9e33ff1f33ffcf33ffd43425993430853571cc3591d03591d939a84d3aaaa83aab0b3aab5b3aab7f3aabdb3aabdd3aabf03aabf73b769d3b77743b7b643b9bb243c7093e9cd643c70e3f43d43f4d0c3f66823f79f93fb7973fb88a43c00943c04143c17d43c1fb43c1fc43c22d43c24a43c31c43c31d43c32243c49a43c4bd43c4da43c55b43c56643c5dd43c5e843c5ee43c6a643c6e743c8bd43c8cf43c8f543c943447d04447d24447d4544c1e144f12844f68145f42c4680754682f046fbe947819f4804094804154804224804ad48086d480c01480c03480c26480c27480c2948104648312348d8a948d8ee497c9a497ca1497ca3497cc8497ce449842d4984394984474984ae4a35b74a35d14a81874a82f34a83094aebd34b7f5a4b7f5d4b7f674b7f714b7f804b7f8e4b7f914b7fa24b7faa4b7fc04b7ff44b82054b82154b82a34b82a54b82ad4b82df4b82e94c01554ca1e84d03cb501f9d506f675100e76831f6702c3070626170626871013771035071f9c2738a907434ce79141c7a42217a42587a429b7a44557a49377cf86f7cf8917cf8f17cf9e480022980024f80025e80026980029a8002a28002b68002b7800f0587c84087cd0287cd2e881b86896c3e8a04278a0a4cae0ddbac17c9adfc96adfc9dadfca5adfdb8adfdd3adfdeaadfe49adfe67adfe91adfeadadff62adff7aadff87adffafadffb0adffc6adffd1adffe2adffe9adfffbae0039ae003bae0061ae0086ae009bae00a5ae00b4ae00b6ae00ceae00d9ae0100ae0146ae01abae01b0ae01cbae01d1ae01f2ae021bae025fae0263ae02fbae0369ae03e2ae0424ae045fae0466ae046aae047dae0485ae048cae049bae04aaae04ceae04f1ae04fdae0586ae058cae05acae07eaae08acae08f4ae095fae09bdae0a8bae0a93ae0acbae0b3eae0b76ae0bafae0c0cae0c0eae0c23ae0c49ae0c5bae0cbeae0cd3ae0d0bae0d33ae0d4eae0db4ae0dccae0debae10b5ae5290ae10efae111bae1137ae1140ae1194ae11e5ae1258ae12b0ae13c0ae13f1ae141fae1423ae1445ae1451ae16e3ae172dae1740ae1749ae17a6ae1829ae1911ae1b61ae1b6eae1c2dae1d71ae1d7aae1e43ae1e57ae1e58ae1e7dae1ea5ae1eb0ae1f38ae1f54ae1f63ae1f70ae1fa9ae1fb7ae1fccae1fd5ae1ff6ae2009ae205bae20c4ae20eeae214bae2174ae21e0ae21f1ae24a8ae24e3ae24f0ae24f2ae266bae2672ae2686ae2693ae26afae274bae2ee2ae2ee4ae2ef7ae2ef8ae2f5aae47b4ae47bbae47faae4825ae4832ae4842ae4847ae4863ae4876ae4a7eae4ae6ae4b33ae4bacae4be7ae4d33ae4d69ae4e99ae4ec7ae4ee6ae4f54ae4facae4fecae4ff6ae5156ae519533fcb6ae51d8ae528dae52f4ae5310ae5377ae5396ae539aae53d2ae54cdae54dcae54e4ae55d5ae5660ae5685ae56d7ae56e1ae5721ae5772ae578aae57a3ae57d7ae5885ae58a7ae5967ae5990ae59b8ae59c8ae59d0ae59d3ae59eaae5a63ae5a6fae5a94ae5a9fae5aa4ae5accae5adeae5b1bae5b3dae5b68ae5b81ae5baeae5be2ae5bedae5c5eae5ca6ae5cadae5cc9ae5ccfae5cd7ae5d1cae5d50ae5d54ae5d85ae5ec9ae5ef7ae5f80ae5faeae6004ae6026ae6029ae6035ae61faae620dae621aae621dae622fae634dae637dae63b9ae63bbae63c0ae63e3ae63ecae6479ae6486ae6959ae695fae699bae69c7ae6a1bae6a86ae6c22ae6c61ae6c67ae6c79ae6cbcae6cbdae6d81ae6da9ae6dc5ae6e80ae73d5ae7475ae749cae74c1ae74c6ae77d4ae77f333fd19c2b3a5c87f2ec87f3be20008e48443e48c6ee4916ae49217e4992ee8068ae88d54e8cfc30060370100710100800200390200b202013106800206a20c08af3e0a403c0ac3410ac7d30ac7d80ac9340ac9c70acafa0b41160d05e60d07db0d08aa0d08b50d0e26142c81142ec114f91f1500c5152884152895152be8154f531d333c32000732004132004f32005733fdde33fde033fded33fe0e33fe1e33fec83426943430d83442c43571c43aaab73aaad43aab083aab213aab2a3aab403aab473aab613aabdf3aabe43aac273b75c03b76503b779f3b7b6b3b9bb73b9bce3b9bf73e83d43e8e963ebd413f69313f8fbe434ca943c0e243c10f43c14b43c17343c25643c28f43c42443c45243c4c043c56243c6a043c6bb43c6cb43c6f543c6f843c70843c71043c7e043c8f143c92e43c93743c94a43c95544c1ea44f0a745f44846789746800746807b4680fb46815e477fc9477ff048040e48043e48048048048448080648083c480868480c2b48d84b48d88d48d89648d8ad48d90648d90b497024497ca5497cb2497cb4497cb74984584984894a34d84a82204b7f8c4b7f904b7fc64b7fce4b7fe54b82134ca1e94d03c34d232d503fd9516203600b5d68324c702c0270625f7102a97102de7102e07102fc7102fd71fa0671fa11738a53738a6374359475012d75015676103076105176e72678044878ccaf7a426c7a445f7b700a7bb17e7cf8477cf8347cf84d7cf8737cf9257cf9917cf9a07cf9ad7cf9b47cf9d67cf9fe7cfa167cfa4f7cfa8380027380027c80027d80033180033687c84e881407884b01896c12896c438a032a8a06578a0842ae6bb5adfc8fadfcb1adfcc5adfcddadfdc0adfddcadfe19adfe75adfea8adff42adff5dadff63adff6eadff71adff7eadffc1adffc7adfff7ae0029ae0033ae0042ae0043ae00aaae00c7ae00cbae0206ae0262ae0267ae02d4ae0329ae037aae03e5ae03edae0402ae046eae0472ae049fae04bbae0501ae0566ae056aae05ddae0654ae0667ae07f5ae0874ae08a8ae08e2ae08edae093aae09abae0a32ae0a4bae0a78ae0a86ae0a8fae6b92ae0ab2ae0af4ae0bceae0bebae0c0bae0cc4ae0cc7ae0cc8ae0d35ae0d8dae0db5ae0dc2ae0ddcae0df9ae0e2aae0e2dae0e30ae0e41ae0e86ae0ec5ae0efcae10beae1107ae110bae1112ae1123ae1130ae113aae11daae1201ae1235ae1240ae1254ae138fae13a9ae13c2ae1439ae144aae1455ae1469ae149aae14ffae1736ae1742ae17b6ae1839ae184fae1850ae1864ae186bae1871ae18ccae191fae1925ae1b8eae1bf5ae1c38ae1dbdae1e5fae1e89ae1ec3ae1ed5ae1ed8ae1f35ae1f53ae1f5fae1f6aae1fa0ae1faaae1fcfae1fd9ae1ffdae2000ae200cae2137ae222dae2604ae267fae2edbae2eddae2eeaae2ef1ae2f57ae2f58ae2fd6ae478eae47feae4819ae4862ae4866ae499dae49c1ae4a4bae4aeaae4af2ae4af3ae4b6cae4b6fae4babae4d54ae4e00ae4e0dae4e1dae4eb3ae4ebaae4fb2ae4fd5ae4ff1ae50b1ae5193ae5196ae52aaae52baae52caae52f8ae53c1ae54e7ae54f4ae54f8ae564cae567dae5686ae56b0ae56c8ae56dcae56e5ae572cae5778ae577cae57d5ae57d8ae58e4ae595fae5965ae59afae59bdae59c4ae59c5ae59deae5a01ae5a1cae5a2fae5a47ae5a54ae5a59ae5a68ae5a8eae5abfae5ad2ae5b6aae5c5cae5c60ae5ca4ae5cabae5d1eae5d4eae5eb1ae5eb5ae5eb9ae5effae5f14ae5f8fae6019ae601fae60b2ae60f0ae6332ae6346ae6353ae636eae63bcae63d8ae63daae63e1ae63e8ae63eeae6484ae6961ae698bae698fae699cae6a13ae6a1eae6a36ae6a73ae6a7eae6aa6ae6be7ae6bf9ae6c45ae6cb7ae6cf1ae7458ae7476ae7478ae74bdae74ceae77a7aed1cdaf3c55af8602afca18c2b03fc2b071c2bdc3c2c07fe4009ee49254e49929e84035e847f7e8c00702006003e32506a21206a24e06a26506a26c0a40110a40350a40550a40570ac38e0ac3c20ac7440ac7460ac82f0ac89c0b44530c4053142dc7142e3b142f6914f126151cd3151d0b152bc91533111533be1533fa15405b1b4f5f1d33431d334632000b32001132002c32003232004c32005633fc8233fc9833fceb33fd0833fd4633fda033fda533fde733fe0133ff9233ffc533ffe53592133aaaa23aaaa43aaad73aaada3aabe23b76243b77403b777a3b77b73f722e3e89983e8b023f4ba93f55723fa9ff3fb37b3fbdfc43c22243c27343c27643c29143c30443c38e43c45143c55643c55d43c56443c61143c68f43c69c43c6dc43c6e943c76543c76b43c78043c79443c79943c87f43c8eb43c8fa447d1844f67e44f69244f6a4457c1746788b46789e46789f4682c046ec4b473c08477f73477f9148042948044348044b48083b48084b48d8ae497c014984274984594984b54a35ef4a822a4a83144b7fd14b7fef4b801f4b820b4b82a84b82b04b82bf4b82d24b82da4b82e7505f74506f24506f41506f64506f6b507fa970c09171026771029171029d7102a27102d571030f7103b271041e7281317434cf74368c75032a76410376e30b76e725777e0d7913697a42017a42877a42a67a49c37a49da7bb1557be01f7cf8397cf8587cf8647cf8657cf8787cf8827cf8837cf8847cf8f27cf9dc7cf9fa80024b8002778003c180041580147780150f87cd20881b6b884015896c2b8a08cfe20007ae04fbae058dae0590adfc6dadfc84adfc97adfca1adfca7adfca9adfcf0adfcfeadfd08adfd6fadfdc6adfe1fadfe8fadfea2adfeacadfebfadfef2adff57adffd2adffebadffedae004aae00b0ae00d8ae00fbae0101ae012eae0131ae0132ae0134ae0145ae0148ae014bae014cae014dae0153ae01b3ae01c7ae01d2ae0204ae021fae0232ae0246ae0260ae026bae02d3ae031bae032bae035cae037fae038aae03feae0410ae04adae04c5ae04e3ae05b9ae05d4ae05e4ae0608ae0623ae0626ae0672ae0687ae0798ae07a8ae07b7ae07bcae07d2ae0813ae0832ae0840ae0842ae085bae0892ae08beae0940ae09adae09d2ae0a10ae0a55ae0a92ae0aaaae0bb5ae0bedae0c25ae0c37ae0d12ae0d34ae0d51ae0d68ae0de1ae0de5ae0de7ae0df0ae0e38ae0e46ae10f2ae111aae1165ae1171ae11b3ae11beae11caae1293ae138dae13f8ae13fcae145fae1464ae14acae14b0ae14bcae14beae1597ae16edae16fdae1746ae174bae174eae17a9ae17b7ae183aae18e7ae197cae19caae19f0ae1c2bae1c30ae1d03ae1dc1ae1df0ae1e94ae1eb4ae1f4bae1f91ae1ff4ae201eae2025ae202aae21ceae21e7ae23d4ae23ecae2657ae2690ae269fae26bfae2791ae29d0ae29d1ae29d2ae2eedae2efaae2f5dae2f5eae2fd4ae35cdae47baae47ddae47ecae47f9ae4812ae483aae4848ae4861ae4889ae49f2ae4abfae4af0ae4b34ae4ba9ae4beaae4cf9ae4eaeae4eafae4ed8ae4eecae4fafae50c4ae50ccae51cdae5263ae5267ae528eae5291ae529aae52a7ae52bcae52cdae52f0ae5306ae5363ae5379ae5387ae5391ae53d8ae54e5ae564dae5675ae5690ae5698ae56a3ae5792ae5794ae57a2ae57acae57bbae5887ae58e2ae58e6ae5985ae59a8ae59e5ae59fbae5a58ae5a81ae5ab6ae5addae5ae7ae5b28ae5b67ae5b76ae5bc4ae5bd8ae5cb2ae5cd1ae5cfaae5d0eae5d4fae5d67ae5dd4ae5df2ae5e9fae5ecbae5eceae5f13ae5f44ae5f56ae5fa7ae602fae60b1ae60f1ae60f6ae6169ae6193ae61fbae6213ae6214ae6219ae6226ae6227ae622cae626bae628bae632bae633dae6349ae6385ae63e5ae6401ae6406ae6474ae6493ae68b8ae68bbae6a18ae6a19ae6a3bae6a6dae6a99ae6ac3ae6bebae6c13ae6c14ae6c17ae6c6cae6c73ae6cacae6d53ae6d56ae6d58ae6d5aae6daaae74a7ae74abae74baae74cbaedae5c2bdffe483d1e48f41e84800e84802e8490d01008c01016602010a038f4f06409806a24d06a25906a27606a29a07007e0982250ac0f60ac7510b43000c404e0d05470d065f0d08a90d09420d09610d8032142f5c14f1191500941501c815287f152888152bcb1533c8154c5c155335155342155353155356197cd032001b32005032007b33fc9633fd0e33fd4a33fd4b33fd6533fdab33fdcf33fdd333fe1333fe2233ffb333ffc33424533530413530553532c33aaaa73aaaa93aab653aab9b3aaba03aabd63aabe13aabe73b761c3b76313b764c3b76cb3b77853b7b6f3b7b703b7b723b9bef3ea74d3ead633f54073f67323f6e573f7b3c3f7dc13f7dec3f8c413fa9413fbd82405f354060d643c04c43c08143c0ae43c16343c27443c27543c39243c46e43c49d43c4c243c4d143c55e43c5ef43c61443c68043c69243c75943c7ac43c7ad43c7ce43c7e243c87e43c8d543c8e943c91e43c93a43c94b43c951447d23447d6944c1e544f64544f64c44f66f45f4374678954680fa46ec4c4781a048041a48050d480513480c4848104148c15e48d82b48da6348da83497c09497c2b497c334984214984954984b04a34e94a360e4a81f44a821f4b7f9f4b7fc54b7fd34b82144b82184b82d9506f23506f6250ff3a516206600bb76831ce683307702c4670c0817102807103007103ad71d87171dd1771f90371fa10738a49738a62738a647586247610477a43f27a49487bb0e27bc7b77bd0367bd04c7be0297cf8317cf8717cf8757cf88d7cf8d77cf9ae7cf9d47cf9f27cf9ff7cfa1b7cfa4680027a8002958002ce800323800dbb80150e87c41187c835880404881bba89602a896c0f8a00248a090cae4d65ae779eae0a77adfc88adfcedadfd0fadfdceadfe60adfe71adfeb3adff6cadff8badff99adffc9adfffcadfffeae0007ae0015ae0032ae0041ae008eae00a0ae00a9ae0133ae013cae014eae0152ae0192ae01acae01f1ae0201ae0202ae0224ae026dae02d9ae0358ae0371ae038eae03ccae03e6ae03e7ae03e8ae0411ae0417ae041cae0440ae0446ae044bae0455ae0473ae04baae04e4ae04edae0506ae057eae0591ae060dae061dae0622ae066cae0676ae07ceae07d4ae07f2ae0801ae080bae080cae088cae0977ae099fae0a18ae0a2bae0a89ae0af3ae0b04ae0ba6ae0bb6ae0c08ae0c98ae0ca8ae0cbdae0cc9ae0d03ae0d93ae0e15ae0e71ae0e85ae0ea7ae10c1ae110aae112bae112fae1142ae1143ae1144ae11bfae11d3ae1204ae1239ae1241ae1274ae12a1ae12a8ae12acae13bbae1419ae1442ae1533ae1536ae1595ae15c4ae16f3ae1753ae1793ae1870ae1905ae1927ae193cae198aae199cae1ae8ae1befae1bf6ae1d1cae1db0ae1e4aae1e6dae1e78ae1e82ae1ea6ae1ec0ae1f37ae1f5bae1f7eae1f8aae1f8dae1f90ae1fd3ae1fe2ae1ffaae202eae203dae205aae20b6ae21e9ae223eae24e9ae2656ae266cae26d4ae5140ae2f1aae2fa5ae47a0ae47b0ae47b5ae47e1ae47f2ae4831ae4840ae486aae4881ae4d2bae4d30ae4dddae4e8fae4e98ae4ea5ae4ea8ae4ebcae4ec8ae4f16ae4fb8ae4fd4ae4fe6ae4ff4ae4ffcae50c5ae50e1ae5183ae519aae51a9ae51acae51b0ae51bcae51c7ae5254ae5261ae5274ae5288ae52d2ae52f7ae54b6ae5665ae568dae5871ae5880ae588eae58c0ae58c7ae5961ae59aaae59c0ae59d7ae59f3ae5a08ae5a0dae5a1fae5a7dae5a82ae5a92ae5ae0ae5b2eae5c73ae5d25ae5dfaae5dffae5e01ae5e08ae5e11ae5ec4ae5ee1ae5f10ae5f4fae6012ae6014ae6017ae602aae61b8ae6205ae6231ae6240ae6328ae632dae633eae6372ae6381ae63b2ae63c2ae63e7ae63eaae63fdae63feae63ffae64b1ae64bbae6901ae6903ae6996ae6a3fae6a7aae6bc6ae6c0cae6c0fae6c4cae6cf2ae6d41ae6e7bae73d6ae7412ae744cae747dae74aaae74c7ae74c8ae74e73f8686e20017e2005ee4009fe4015ae48e5de494a3e4955de8cfbee940500101a00200a20200fd0640f106a21406a21706a21e09012b0940100a40180ac3150ac7a40ac9a00ac9e90ba0090d01e03f9359142deb14f90d1528891533e11533f6154ee715534f15537e1d334932000632001232001d32002232002732003832007e33fcbd33fd6433fd7433fd9b33fdb533fddd33fde633fe1933fe7933fe7a33feca33ff4b33ffc634308634738a3aaac93aaaf03aaaff3aab013aab593aab723aabae3b75b53b76373b76463b76663b76683b76743b767f3b77733b777f3b77803b7b853b7bf93b9be73b9bfb3b9bfc3e90c83ebd9a3f43463f56e63f66b03f853b3fbdc443c06d43c07043c0bf43c17243c1a243c25043c26e43c27743c2b043c30843c32843c42d43c4d943c60e43c61a43c68143c6df43c6eb43c6f743c6fa43c73f43c7da43c81043c88043c8c443c8f943c92643c94943c96243c96543c99f447d3a44f02844f16744f1a544f42b44f845451c4245f42646812e477fd348040648041f48042b48042c48048148048d48049b48083648083948084a48104348105448d88548d894497c27497c73497c784984534984544984564984994984b34a81e64b7f7f4b82044b820a4b820c4b82974b82dc4b82e04b82e24b82e34b83a94c2c2a501fbc506e21506e22506f5e6831f4702c66702c67702c8871f88371fa0f71fc02738a0474358d76105d777e0b7a426b7a42a07a44407a495a7a495b7cf83c7cf8427cf8857cf8907cf9967cf9e97cfa027cfa317cfa3780020a80022580026d800270800790800e13800e54800e63800e71800f3480171687c40e87c82287c82487c84d87cd1b881409881b61881ba68880d1896c0d896c4889900289910f8a06eb8a08668a08918a08948a08dc8a2907a1b361ae1120ae5284ae068eadfcd8adfcf6adfd0badfdc4adfdd5adfe1eadfe4dadfe54adfe6eadfeddadff07adff40adff59adffcaadfff9ae0005ae001aae003dae0056ae0074ae0079ae0099ae00e7ae010eae0113ae0147ae01faae0238ae0261ae036fae038bae03deae03f9ae040eae0422ae0428ae044eae04c0ae04caae04f2ae059dae05a5ae0618ae061eae0655ae0669ae07c1ae07c2ae07e6ae0806ae08adae60e9ae08dcae08feae09a4ae09b5ae09c4ae0a35ae0a49ae0a53ae0ab6ae0abeae0acaae0aedae0b35ae0b3cae0b71ae0b8aae0b92ae0b9aae0bd7ae0c14ae0c33ae0c9aae0cf5ae0d37ae0d6aae0d6cae0dbfae0de8ae0e2cae10e2ae111eae1158ae11b6ae11c0ae123fae1276ae138aae13cdae13faae1416ae1446ae144bae1460ae149dae14adae14c1ae1517ae1534ae1729ae178dae185eae198bae198dae1a05ae1ba9ae1cc8ae1cf9ae1d8fae1d91ae1dc7ae1e4cae1e4eae1e5aae1e6eae1f48ae1f6bae1f6cae1f71ae1f8bae1f93ae1f96ae1fbdae1ffeae200eae2044ae2052ae2060ae20bdae20c2ae2131ae216fae2486ae265eae2675ae2681ae26b2ae2730ae277dae29ceae2bf9ae2bfaae2ed8ae2eefae2fa4ae3409ae449bae47a5ae47e0ae4822ae484bae499fae49e1ae4a16ae4a21ae4ae0ae4af6ae4b83ae4e16ae4e1eae4f23ae4f26ae4f42ae4f8fae4f94ae4f97ae4fe5ae50dbae5119ae514eae51b7ae51bfae51dbae5275ae5312ae531dae5360ae54dbae565bae565cae5670ae56b1ae56c6ae56e0ae577fae5781ae57abae57b5ae587dae588fae58e5ae58eaae598bae59b0ae59bfae59d8ae59e2ae59e3ae5a19ae5a77ae5a7eae5a85ae5aabae5b2dae5b3eae5b47ae5b71ae5b7fae5bc2ae5c17ae5c99ae5c9bae5c9cae5ca2ae5d15ae5d38ae5d84ae5d9bae5dfdae5e03ae5e4cae5e65ae5e9bae5eb3ae5f39ae5f3fae5f45ae5f94ae5f9fae5fe7ae6006ae602bae605fae6060ae60d1ae61b6ae6229ae6329ae6354ae6376ae6384ae63f9ae6499ae64a8ae65f8ae68afae6904ae6a12ae6a7dae6ab9ae6bacae6c18ae6c34ae6c68ae6c6bae6cb1ae6cc8ae6cd7ae6d74ae6db2ae6e76ae6e7eae73e5ae7457ae74caae74e1ae77c4af4fb3afb23cc2b067c87f09c87f24e20022e20094e4014de402d0e47e40e48bd9e4916ce49273e49d16e80688e8068be8800ae940fae940fb0200ff02b26d04c20d06a21106a26906a27b0a40060a40090a401a0a401c0aca230b41170b42270b42900d05c20d06da0d08240d09aa15008f152be215406415534032005132007733fcfe33fd0633fd2433fd4d33fd6833fd8f33fdf533fe0833fe0d33fe1d33fe1f33ffae33ffec34264f34269734314c3432ce3434d634360334738f3532c43aaabe3aaaf63aab233aab633b75463b765a3b766a3b773f3b7b6c3b9bb83b9bd73f52cd3f89053f8c623f99c63fbe24400ee843c40743c42b43c00043c09943c13e43c27243c31f43c36b43c39843c39f43c3a143c42f43c46343c49b43c4a943c5eb43c5f743c67743c67843c69443c6bf43c6fb43c70a43c76943c76c43c7a243c7a543c7d343c7d743c93943c964447d1a447d31447d3f44f14644f18144f1a144f42144f60144f60544f67c457c21457c3145f42b45f44246810246815a46831346ec4d473c06477fd047812747812e48044148050948051448080148084d48c0de48d8a848d982497c714a34e34a35d54b7f454b7f6d4b7f7d4b7f994b7fa94b7fbe4b7fc24b7fc74b82034b820e4b82cc4ca41c4d03c0501f9c501fba505f71506e20506e6c71027c7102a77102dc7102e171030771037f71039b71f01171f90571fa09744a6275002676104b76e31276e7247830707a42267a428a7a42b27a486d7a49317a49397aa30b7cf8547cf88e7cf8f47cf98e7cf99a7cfa737cfad280022680027180027f800290800318800602800792800dc0800dc187c81b87c83487cc0487cc098805a5881b6e881b83881b8988401a884b02888005888006894011896c02896c6b8a04208a042d8a08bd8a09e7a2de5cae1ae0adfc66adfcb0adfcc2adfcdeadfd04adfdc7adfdd7adfdddae6a74adfe13adfe4badfe5aadfe5fadfed8adff8cadff98adffd5adffeeadfff2ae001bae0026ae003eae0090ae009fae00cdae00d0ae00f5ae0200ae0239ae023cae025dae025eae02deae0359ae038fae03c4ae03e9ae03eeae040dae0414ae041eae0467ae0477ae04ccae04d0ae04ebae0576ae05a4ae0628ae066aae06e0ae06e6ae07b0ae07d1ae07e7ae0847ae0865ae086aae0881ae0894ae08cfae08e9ae08f8ae093bae096aae098cae09c0ae09f7ae0a19ae0a33ae0a42ae0a76ae0a7aae0a8eae0afcae0b48ae0b52ae0b95ae0c05ae0c13ae0c54ae0cd8ae0ce1ae0d0dae0d2eae0d62ae0d7cae0d9dae0db9ae0defae0e01ae0e3aae0e54ae0edfae0eedae0f02ae10bbae10e1ae10e3ae110dae116bae11bcae11efae135dae1390ae1394ae139eae13a5ae13abae13bdae13c1ae13cfae1402ae140eae1431ae1461ae14a1ae14aaae151dae152cae161cae16e4ae171dae1788ae178aae17a3ae17e8ae1857ae185fae1923ae1959ae1b4eae1baaae1c02ae1d2aae1d2bae1d85ae1db2ae1e6cae1e84ae1ea1ae1eb5ae1ec1ae1ec9ae1f3dae1f8cae1fb2ae1fcdae2011ae212cae21ebae222fae24eeae2673ae2678ae2685ae2687ae26a5ae2764ae277eae2798ae2911ae2939ae2bd7ae2c3bae2eebae2f2aae2f9cae2fa9ae47a6ae47a8ae47aeae47bfae4845ae485aae4864ae486fae499cae49c3ae4b00ae4b53ae4b77ae4b8cae4b8eae4b91ae4ba5ae4bb1ae4c62ae4d2aae4d5aae4e9bae4e9fae4eaaae4ebbae4ec6ae4ee5ae4ef0ae4f1eae4f7fae4fa1ae4fb6ae4fb9ae4ff2ae4ff5ae50b9ae5187ae519dae51b2ae51e2ae5238ae5287ae52a8ae52bfae52c8ae52d1ae5304ae530fae5376ae5394ae564aae566bae5671ae567aae5695ae569aae56e2ae5776ae5786ae57beae5878ae587cae587eae587fae5895ae58a5ae58f3ae5962ae5963ae59aeae59cdae59edae59f6ae5a46ae5a84ae5a88ae5a97ae5ab7ae5acfae5b27ae5b37ae5b72ae5b73ae5b77ae5b87ae5b8aae5badae5c5aae5c94ae5cacae5cb0ae5cb1ae5cd0ae5cf1ae5d0fae5d39ae5d62ae5d6aae5d75ae5dceae5df6ae5dfeae5e0dae5e13ae5eb4ae5ee8ae5ef9ae5f0dae5f19ae5f31ae6043ae61dcae6223ae633aae63b6ae63c3ae6603ae68baae68beae68c0ae6a20ae6a88ae6a8eae6a96ae6b87ae6baeae6c5cae6ca9ae6caeae6cafae6cdfae6da2ae6db5ae73e9ae7447ae744aae7466ae74afae74beae77daaf0a4daf351faf4fabaff009c2b02bc2bb7fc2bd41c2bd4bc87f02c87f28c87f3de2002fe40410e49592e49934e8066ce8cfc4e8cfcc01007a06a26206a2950941090a401b0ac37e0ac3ef0ac79d0ac9020ac9ec0c404914247e142f4f1432a814f1231501ad151cd2152b9e152ba4152bb01540661540731551e015522132000432001832002f32005933fc8c33fc9133fcd233fd8d33fdc633fe2433fe3a33fea933ff4733ff4f33ffd33426143474143532ca35350f3571c83571d73aaacb3aaad53aaae03aaaeb3aaaed3aab003aab3c3aab5d3aab6e3aab7e3aabf13aac163aac343b76723b77ab3b9bf93b9bfd3ea5413f80193f814b3f85ca3f8bd0400eed43c04e43c20743c21c43c25743c48e43c4ac43c5e043c61643c61e43c6a743c6db43c8d743c91f43c94743c97a43c98c447d1b447d20447d3444f02744f18744f1a244f64144f67745f436467892468158473c0a47811a47812f4781a14781a348040548044c4804b248050a48050b48083d48085c480883480c4148104248105148d82748d84048d84c48d8e4497c21497c42497c4b497c724984944a81f94a83064b7f444b7f664b7f744b7f984b7fa84b7fb64b7fec4b82164b82cf501d13502faf505f875100c2702c2670626c7102df71034f71039f71f80171f90971fa07738a8d7435897503f97585db764101791cad79c1047a427b7a493c7a49597b70267cf86c7cf9a27cf9ac7cf9eb7cfa348002eb800dc380145087cc3e881b67881bab883b86896c5c8a063d8a08d28a2902ae5e8cadfc7dadfc85adfc9aadfcc0adfce5adfce7adfd0cadfdccadfe86adfe8aadfe8eadfea4adfeb6adfedeadff3fadff4badff4fadff78adff80adffa2adfff5ae0053ae005eae0075ae0084ae0097ae00a3ae00f0ae0150ae0156ae0181ae0193ae01c4ae01e8ae01eaae0247ae037eae040bae0474ae0478ae04a6ae04c2ae04dcae053eae0569ae0571ae0588ae05afae05b0ae05e2ae0649ae0651ae066dae07a7ae07bbae07dbae08a2ae08a5ae08afae08faae0943ae0992ae0999ae09beae0b0dae0b15ae0b39ae0b9cae0b9eae0ba8ae0bc0ae0bc5ae0c50ae0c59ae0c5cae0c73ae0cbaae0db2ae0e39ae0e57ae0e5aae0e8aae0ea4ae0eabae10f9ae113eae1d5aae1199ae11abae11cbae13f7ae1454ae1463ae14abae14faae1547ae173eae1744ae1750ae1797ae17adae17f5ae1803ae186eae1936ae1943ae1949ae1962ae1980ae1b92ae1b9aae1c10ae1c22ae1c27ae1d5eae1d5fae1d88ae1db9ae1e48ae1e52ae1e64ae1e76ae1e8eae1e92ae1eb9ae1f3cae1f62ae202fae2063ae2140ae21cfae21d7ae2676ae2677ae2683ae26c9ae27f6ae290eae2923ae29dbae2ee0ae2f69ae2f6dae4789ae478cae47b2ae47f3ae4830ae4839ae499bae4a1bae4b3eae4b95ae4cedae4cf5ae4d5fae4de1ae4e9eae4f2dae4f5cae4f93ae4fd1ae4fd2ae50adae50e3ae51c3ae51d6ae5258ae527cae529dae529fae52b8ae52c1ae54b5ae54d4ae54e0ae564eae5650ae5688ae5693ae569dae569fae56d2ae56d9ae5744ae5799ae57c6ae58dfae596aae5981ae59b7ae59faae5a2dae5a3cae5a56ae5a6cae5a93ae5b44ae5b88ae5bb2ae5c5bae5cdcae5cfbae5d08ae5d45ae5d5cae5d65ae5d89ae5d92ae5dc0ae5dcfae5debae5df9ae5e15ae5ea6ae5ed9ae5ef2ae5f4cae5f53ae5fa8ae600fae6023ae605aae61f6ae61f8ae6216ae6335ae6356ae6378ae63f3ae6481ae6498ae649fae68b3ae6916ae6919ae6a1aae6a26ae6a3dae6a84ae6a85ae6aa2ae6c12ae6c1bae6c1eae6c82ae6cbbae6cc9ae6d72ae6dacae6ed7ae73edae74bbae74d1ae74ddae7798ae77d0ae77d5ae77fcae8953aed618aef550af4fa7af7831af85fbaf8603af9ba1c2b035c2b05dc87f0fc87f25e14c70e40550e48932e48e51e849c402003702003c02004c0200b60200bf0200e202012f03e3e604403e06a21c06a25e0ac8940acad80b41130c217e142e6714667214757e14a12c1500981501b815287c15288d152b051533e0154e6532003f32007933fcbe33fd1b33fece33ffcb3424903530423563413571d33aaae73aab073aab143aab223aab3d3aab913aab923aab9d3aab9f3aabb33aabc03aabc63aabda3e91ee3ea5bc3f447a3f44883f56853f619c3f6ee13f8d1f3fa2573fa5ea43c21643c22743c25a43c29f43c30c43c32a43c36c43c3a443c4e143c60b43c60d43c69b43c6c543c6d343c75f43c77b43c7db43c87a43c8ba43c8bb43c8d043c8d243c8f043c91c447d5644f14244f666457c0f457c3045f44345f4474780ee47811548083f480853480864480c0648d8567cf89c48d8a748d908497c11497c4049843149848f4984a24984a34a35a74a35c74a83024aecc94b7f624b7f754b7f944b7fc44b82124b82984c2c1b4ca13f50807f4d03cc503fdc505f6e505fa0505fa17cf8eb507f8750fd8a702c6870626d7103147103a8738a597434c374358274358a74359374359575050a76603876e72d78059d7a42497a429c7a42a47a49467aa03a7be9037cf86e7cf8707cf8967cf89a7cf9b17cf9c57cf9cf7cfa1780021e8002788002c78002f8800440800c3d800e1987c83f87c84c87cc0187cc2487cc4a88040188140d896c0b896c1e8a05608a05a58a0845a1b22eadfc74adfd00adfdcaadfdcfadfde8adfe14adfe61adfe85adfe9aadfeb7adfebaadff46adff4dadff74adffa8adffe7adfff8ae000aae000eae004bae007bae0081ae00c3ae00d7ae00feae013eae01c6ae01e0ae01f6ae01f8ae0219ae021aae0228ae0257ae02d8ae03d4ae03e0ae044fae0458ae047bae049cae04e0ae0503ae056cae0574ae0584ae058bae05b1ae05bcae06daae07dcae07f3ae07fbae0895ae089eae08a1ae08bbae0953ae09b3ae09c7ae0a2aae0a3cae0ac9ae0b6eae0b6fae0beeae0c27ae0c9fae0caaae0d41ae0d82ae0e52ae0e8bae0e9eae0eb8ae0ed4ae0ef9ae10b6ae115eae1172ae1197ae11bdae11dbae1259ae139aae13b5ae13efae1409ae145cae1478ae1704ae1708ae1718ae1792ae179dae17baae183cae18ebae1932ae1945ae1974ae1afbae1b8fae1d6cae1d92ae1d98ae1dbaae1dc3ae1ddbae1e91ae1eadae1ed6ae1f30ae1f34ae1f3eae1f46ae1fa2ae1fbcae1fcaae1fceae1fd8ae2007ae2012ae2061ae2068ae20beae20f9ae212dae21bdae21f8ae265cae26b0ae26d6ae26dbae291eae2befae2edaae2f6bae47e5ae47fdae4818ae4846ae488eae4a0bae4b30ae4be9ae4d49ae4d52ae4dffae4eb4ae4eb6ae4eb7ae4f12ae4f25ae4f92ae4fc1ae4fe3ae4ffbae50e0ae50e5ae510fae5121ae5148ae51afae51c5ae52a4ae52aeae52b9ae5320ae5365ae5366ae5372ae537fae5422ae54ccae54ceae54d6ae54f7ae56c5ae5752ae578fae57a4ae57b9ae57baae57d2ae57d3ae5890ae58f2ae599bae599dae59c9ae59d1ae59d9ae5a12ae5a17ae5a1aae5a1eae5a3eae5a5cae5a5dae5b3aae5bcfae5be4ae5c74ae5c8fae5c9fae5d51ae5d61ae5d69ae5d6bae5d7cae5de2ae5e18ae5e94ae5e99ae5ebeae5ec2ae5f15ae5f38ae5feaae6025ae6033ae6044ae6045ae60e8ae6224ae6235ae624bae633bae6391ae6393ae63fbae6400ae6482ae6491ae64c5ae65f7ae65feae6a79ae6bd6ae6bdcae6becae6c0dae6c59ae6cb3ae6ce4ae6d4eae6db1ae6e78ae73eaae73f1ae740cae74a6ae74cdae74d3ae77d2ae77f8ae77f9ae86acaecb47aef4c4aefcdfafa18bc87f03e400ece40135e483aae483abe48920e49210e49925e8064be8cfc9e8cfcf00cbac0200d5062f0106a21a06a26806a2720900fa0a400d0a400e0a40170ac82b0ac8910ac89a0ac8f40ac9270ac9e80b20140d04c20d08e4142c5e142d51142e96142ea915002515287b152887152b5815508332000532000d32001632001a32002533fc8d33fce933fd2133fd3333fd3c33fd4833fdbe33fe2633fea333ff1e33ff7c33ffbc33ffd83426163433923553163aaab83aaac63aaad33aaaef3aab0d3aab3b3aab833aab903aabc73aabd03aac373b76283b76473b76543b9bd13b9bdd3e920f3f402a3f57273f57e93f59f33f66313f80b13f81a53f84e83f9dac3fa48343c94543c02443c17643c22a43c25b43c26843c2a543c31543c43943c4c443c56043c68443c6c243c7e643c8b643c8dc43c8f243c94643c960447d06447d3244f63544f63a45f42845f44546788c473c03473c09477f72477fcb48042d48043d48080e48083848085f480c1b480c4448b0de48d85548da4248da84497fa149842b49844149847449848d4984924a34e64a35a64a35ac4a82ee4a830c4b7f894b7fa14b7faf4b7fb14b7fed4b7ff84b82014c5c00503fd2505fbb7062647103097103157103a471f00f71fc03738a617434c2750415758736762af37a420c7a424f7a425e7a426d7a427a7a43fe7a44447a444f7a44657a49147a495c7cf84b7cf8957cf9c97cf9ee7cfa307cfa448000788000e38002a580031e80033587c808881408881baa881bb3885337896c308991818a055e8a055f8a09328a093633fea833fec433ff1133ff75adfc98adfca0adfcb4adfd88adfdebadfdeeadfe0dadfe17adfe18adfe73adfed0adfedaadff10adff3cadff5cadff7cadff7fadff93adff9eadffcbadffd0adffeaadfffdae0012ae0025ae0063ae0078ae007cae00deae00f2ae00f4ae01fdae026cae02f0ae0324ae0391ae03d1ae03dbae03f0ae0421ae0453ae0469ae0470ae04a9ae04abae04bfae04f5ae057bae059eae05b7ae062dae0677ae0686ae06e5ae07bfae07d8ae07d9ae07dfae07e2ae07f8ae0807ae08d5ae093cae0952ae0978ae09c2ae09ffae0a7fae0aa8ae0ae3ae0b85ae0b86ae0b93ae0b9bae0bbfae0c21ae0c63ae0c65ae0c6cae0cafae0cbcae0cc0ae0cf6ae0d15ae0d26ae0d57ae0d6dae0d7dae0e51ae0e8fae10deae1129ae112aae1133ae1145ae114eae11e4ae127bae127dae145bae145eae14a7ae14feae151eae1531ae1535ae16e5ae1725ae172bae173dae17b2ae17beae182bae1836ae18e0ae18f5ae1991ae19c5ae1ba8ae1c0aae1c19ae1d46ae1d56ae1d94ae1de0ae1e6fae1e9dae1f6dae1f9dae1f9fae1faeae1fc3ae1fe1ae2004ae2022ae203aae2048ae212eae24e7ae2662ae2665ae266eae26daae2746ae2761ae2779ae2912ae29feae2ee1ae2f65ae47daae47f8ae481bae481eae4844ae484eae485cae4a2233ffd1ae4afaae4b47ae4b88ae4cf3ae4cf6ae4d36ae4d3aae4d48ae4de2ae4e0bae4e58ae4e91ae4ec2ae4ee9ae4eedae4f14ae4f31ae4f4cae4f80ae4f8cae4f91ae4fb5ae4fddae5004ae50b6ae50c1ae50c2ae50ceae50d6ae50e6ae5117ae511aae5120ae519eae51d0ae51e1ae525cae526dae52e4ae530eae53a5ae53d4ae5407ae541aae54c9ae54daae5655ae568aae56ddae5725ae576bae5789ae57b6ae5873ae589dae58adae58f7ae58f8ae5968ae59b5ae59f8ae5a71ae5a86ae5ab4ae5ae3ae5b39ae5bffae5c66ae5ca9ae5d14ae5d24ae5d28ae5d6dae5dc1ae5dd0ae5df8ae5e02ae5e09ae5e0aae5e0cae5e95ae5e98ae5eb2ae5ebaae5ecaae5ef8ae5f00ae5f06ae5f0fae5facae6005ae6016ae6022ae60edae60f3ae6212ae6218ae6220ae6249ae6336ae6345ae6380ae6394ae63c7ae63f7ae6492ae68b4ae690fae6917ae6a8fae6aa7ae6ac2ae6bb0ae6bc7ae6c0aae6c1fae6c5aae6cb4ae6d7dae743cae746eae748aae74ccae7800ae7813c2b09933ffd6c87f07e400a0e400b4e494a4e806b9e847f100c7f601007201007d0101d30200310200e50680b006a26006a26a06a27407007f0a401f0ab0280ac3f10ac3f30ac82e0ac8950ac8980b43560d08e50d0bf014311e14b5761500c1151cef1526e8152b0815407815520b15535215535731ff0a32000832002832003a32003d32005433fca233fcda33fd0533fd7e33fdc433fdd833fde833fe1733fe2833fe3033fe923422cc3533443aab293aab5a3aab753aab783aab8c3aabe53aac243b76553b7b693b7b713b7f753b9bd33b9bd93b9bf34a36073e87643f55ad3f5d913f60013f75883fafb63fb3a43fbebf43c76d43c7d8406f5043c07343c07543c22443c28743c29243c30743c31343c38d43c40f43c49743c6e643c74843c75d43c8db43c8ee43c96843cb58447d2244c1e344f0c944f1a444f652457c0545f42945f430467898477f8f48040248051048051148083e480843480879480c4048105348d88448d89048d8ab497cdc497cde49842249846f4984764984b44a35ae4b7f9c4b7fbc4b7fd54b7fde4b82ac4ca1e74ca1eb4ca2044d03ce506f6060003c702c0b7101ae71025b7102837102e471dd2171f28771fa13738a01738b4c738b4d7434c875837876604776e301777e0f7a424b7a426f7a42807a429a7a44177a44317a444d7a493a7a49527a49dc7cf85c7cf8767cf8777cf8947cf8f57cf91d7cf9f97cfa6c7cfa717cfad48002378002a4800338800dbd800f2fae0ef587c40487c84287c84a87cc3887cc3987cc3b87cd2287cde4881bc48840048967d2896c03896c14896c20896c23896c3189900c8a08448a08d48a290943c309ae0ddaae0e1cae60d4ae0e3cadfc70adfcefadfd02adfdb9adfde0adfe47adfe5dadfe66adfe93adfebeadff04adff4cadff60adff9aadffaeadffc3adffc5adffd8ae0018ae002eae005cae009aae0151ae0157ae01d4ae01d6ae0225ae022cae0241ae0268ae02c9ae02dbae02ebae02faae0377ae0388ae0393ae03e1ae0412ae0429ae042dae044aae047cae04b4ae04b9ae04c8ae04d1ae051dae0567ae0575ae0596ae05a3ae05e5ae05ecae061fae06e1ae07b9ae07beae07c4ae07e8ae0812ae0814ae08b0ae08e6ae0998ae099aae099cae0a23ae0a70ae0aa9ae0b0bae0b21ae0b88ae0bb2ae0bfdae0c03ae0c15ae0cb3ae0dd8ae10eaae10ebae10f0ae10feae117cae11c5ae11cfae11d1ae11d9ae1200ae123aae13ccae1438ae1447ae146aae146dae14b1ae14b2ae14b6ae1537ae16f2ae170aae1737ae173bae1748ae1796ae17bdae1868ae18d6ae1916ae1c2aae1c33ae1e97ae1e9eae1eacae1ebaae1f40ae1f52ae1f64ae1f7bae1f88ae1fd7ae1fedae2037ae2042ae20b7ae20baae20d0ae21f3ae220eae2600ae265dae26a0ae26cdae2756ae2768ae2f11ae2fa1ae478dae47abae47b1ae4828ae4836ae4a2bae4ae1ae4afdae4b52ae4be3ae4d58ae4e0eae4e96ae4eb9ae4ee7ae4eeeae4f6cae4f85ae4fbeae5003ae5122ae5153ae5242ae5256ae5260ae52cbae52cfae52d7ae52ebae531cae535eae5397ae53c3ae54d1ae569cae56a4ae56a9ae56daae571dae58a3ae58d9ae595bae5993ae59e6ae5a2aae5a3bae5a4fae5a62ae5a69ae5a73ae5aa6ae5ab3ae5adcae5b43ae5b6dae5bceae5c5fae5c95ae5d1aae5d35ae5d60ae5d81ae5d83ae5d87ae5d8cae5dbeae5dd2ae5e06ae5e07ae5e54ae5eadae5ed2ae5f0aae5f52ae6038ae603cae61cfae61f9ae6202ae620cae6225ae624eae6338ae6339ae6357ae63caae63e2ae641aae6472ae6476ae648cae64bdae6605ae695aae6a91ae6b99ae6bfcae6c01ae6c43ae6c5bae6c5eae6c80ae6c86ae6cb8ae6d9cae6dc4ae73dfae73ecae744fae7487ae77d7ae77f2af4dd8c87f01c87f05e200f0e40168e49376e847f60200c902b26203e326062f0506a20f06a2670a40210a40220a403e0a40600ac0f50ac3da0ac7dd0ac93b0aca140ba0000c4050152bb40d08790d0958142f9a14681114f11c15287d152b3c1540751553711b6c0330012632000932003932005f33fc9f33fd8133fdb333fdff33fe0f33fe7233fe9533ff1533ff4033ff4d33ffe434245534308934338a3453053474d73532c83532cd3aaaac3aaac73aaac83aaafb3aab943b76383b76993b7b393b9bb53e953a3ea0483eb57b3ebe1243c2713f90bc3f9e9b3fa93d3fbbc543c2b240535843c07443c16143c18643c20a43c23743c49843c4c743c4dd43c5da43c5e643c61b43c6dd43c76843c78543c79a43c7ab43c88743c8cb43c8e443c8ec43c90c43c91843c92143c93d43c953447d15447d4244c1e744f0e044f12544f14944f67d44f6a64678a5473c0e47819e480431480442480c23480c25480c4748104548d82248d82648d88b48f3a67a4230497c07497c23497cd1497cd64a35aa4a81844b7f794b7f9e4b7fca4b7fee4b82ae4b82af4ca3354d03c24d03c44d03ca503fd3506f3f7062607101317101357101a771020a71030b71038871f00e738a4b7434c47435887435977502a675050b76398776e7297a42567a425b7a425f7a426e7a431c7a48de7bba297cf8337cf87e7cf8887cf9e17cf9ec7cf9fc7cfa127cfa727cfaa77cfaac7cfad37cfad58002b38002e980030b800321800e1280152187c82387c84687c84787c84b87cc2087cc2587cd1987cd24880db688140f881bb5881be8881c06884019896c27896c3f8a06e98a09438a0961a1926aaaaef7ae74d4ae11c4adfc80adfc8eadfc95adfcd4adfce4adfd06adfd0aadfeb5adff0dadff41adff51adff81adff9cadffb6adffbfadffcfae0014ae0023ae0049ae006cae006eae0096ae00a6ae00b2ae00ccae013bae013dae01b9ae021dae0251ae0258ae030aae03a0ae03beae03c9ae03d2ae03dcae03ffae0416ae042eae0443ae0463ae0475ae0476ae0481ae049dae04bdae0561ae0579ae0587ae058eae060cae0631ae07cfae08fdae09a3ae09e8ae0a08ae0a20ae0a2eae0a84ae0a90ae0aacae0ab8ae0b16ae0b59ae0b96ae0babae0c3cae0c61ae0c69ae0cb7ae0ccfae0d20ae0d4bae0e0fae0e81ae0eddae10c2ae10dfae1104ae1124ae1125ae1161ae11deae11edae1256ae1279ae127aae127eae129aae12bdae1386ae139cae13c8ae13f6ae13feae1422ae1440ae146bae14cfae1579ae1589ae16e9ae1719ae174fae17afae17b3ae1842ae186fae1899ae189eae18b6ae1928ae1935ae1987ae1ab7ae1bf2ae1c23ae1c2fae1d95ae1dbbae1e7eae1e8cae1ed2ae1ed7ae1f0cae1f1cae1f29ae1f2dae1f67ae1f7dae1fc7ae1fdbae1feeae1ff7ae202bae2045ae204fae2076ae220fae222cae24efae2659ae2669ae269eae26a4ae26a6ae26d1ae26e3ae29d6ae29d7ae2bf0ae2bf2ae2bfeae2ed3ae2eecae2f99ae4499ae4795ae4865ae49e9ae4b67ae4b6bae4bb7ae4bdaae4ec3ae4ed6ae4f32ae4f41ae4f4bae50bcae50c9ae50daae50e7ae51e0ae5294ae52c6ae52e9ae5364ae536fae53a0ae54c8ae54d3ae5654ae5656ae5689ae5691ae5697ae56cbae5749ae57aeae57bfae5891ae5898ae58a1ae58f9ae593eae5975ae59ebae5a00ae5a0cae5a22ae5a2bae5a83ae5a87ae5b46ae5abcae5ae1ae5b7cae5bafae5bc9ae5bd1ae5bd9ae5bdcae5c9eae5ca5ae5cbcae5cbdae5cf0ae5d41ae5d42ae5d8eae5e83ae5e8fae5eb6ae5ecdae5eeeae5ef0ae5ef4ae5efaae5f43ae5fabae601dae603dae60cdae60efae61b9ae61d0ae61e6ae6245ae632cae638eae6409ae64bcae6602ae6909ae6913ae6a2aae6a37ae6a4dae6a72ae6a90ae6b81ae6b91ae6b9cae6c11ae6c7bae6db9ae6dbdae6e74ae6e79ae73dbae748bae74dbae77beae77cdaedab9aedb4eaf0a4aaf8023afaba9c2b0cbc87f13c87f21c87f3ee200abe400e0e40106e41aa2e485e7e48de1e49060e49927e49931e49948e8065ce80672e8c23701007801008a0200c60200fe06a27f0ac7500ac7dc0ac82c0ac82d0ac9380d077f0d0bf5142baa142d9414a11614f12515009115009a152b5e15406c154c32154ed015521f32000332001032002332004932006033fcea33fcec33fd4133fd5e33fd6b33fd9033fda633fdc733fe0933fe3233fe7733ffba3456073535423563423571d53571d63aaaa63aaaea3aaaf53aab103aab2e3aab703aaba53b75aa3b76713b76a23b77b63b7b3a3b7b3c3b7b3e3b7b6d3e97eb3e9bf73ea34a3f4efe3f6e1f3f8fed3f9c813fa6573fb65b3fbe34400eee43c17143c1f143c23943c2ad43c47a43c4f443c55743c61043c61243c68c43c79543c79b43c7a943c7dd43c88643c91743c94443caf043cf31447d01447d1044f10344f63844f65444f66c44f67144f685457c08457c0c4678a9477ff1477ff448044948047e4804b748050f480869480c4648104848105248d84748d8524984344984864a35d24aecbb4b7f834b7f854b7f924b7f934b7fc84b7fd24b82aa4ca1ed501fb9502fa7505f88506f4050ff4070625c70c07970c0d67102097103137103857103a971fa03738a4d74358c7435987583797586297587377610d878022478059e78c84d7a42627a426a7a438c7a444e7a483a7a49237a493f7b0b317cbc677cf84f7cf8667cf88c7cf88f7cf8f37cf9b27cf9d27cfa2f7cfa4980021f80023180026b8002d98002db8002f28002f680033080079d800e3080147487c41b87c84387cc3787cd21880405880416881b64881b65881b69881bb28960268960be896c08896c32896c3a896c44896c4a8a01008a07158a10108a5182a1b798ae0c0932007aadfc61adfc78adfc8badfc90adfcc3adfcc9adfcfbadfd03adfd05adfd10adfd6cadfe48adfe62adfe70adfe90adfed2adfedbadff44adff47adff82adff94ae001fae0070ae0082ae0087ae0098ae00cfae00dcae00ecae0154ae0158ae01dbae0215ae022bae022fae02ccae0304ae0321ae0323ae0326ae032dae03cbae03d8ae03daae03f1ae042cae0465ae0594ae05beae0632ae065dae0683ae06deae07d3ae0808ae0878ae0896ae08b9ae08e7ae09daae09faae0a0eae0a40ae0a45ae0ab3ae0af8ae0ba7ae0bb0ae0bd2ae0bfaae0c3eae0c55ae0c5fae0c66ae0cb6ae0dd5ae0e09ae0e47ae0e80ae0eb5ae0ee5ae10e0ae10e8ae1102ae1117ae113fae114aae114bae1156ae1176ae117dae1192ae11b2ae11b4ae11e633fd3fae127fae129eae1392ae139dae13a3ae13ecae144cae14a3ae14c4ae151cae159aae1613ae1726ae172fae1830ae19c8ae19ccae19d1ae1b9cae1bedae1c18ae1cfeae1d47ae1d80ae1dadae1db4ae1ec8ae1f36ae1fbbae1fe5ae201dae2028ae2033ae20d9ae2144ae21eeae21f2ae220cae2661ae267aae2682ae26b6ae275aae2775ae278bae27fbae2817ae2be6ae2efbae2f70ae2f9bae2fa8ae340aae47dcae47f5ae4824ae4837ae4869ae4886ae49e5ae4a23ae4a27ae4b5fae4b6eae4bdcae4cabae4ceaae4cfcae4e0aae4e20ae4e9dae4ea3ae4eb1ae4f44ae4fb1ae4fbcae50b3ae50d7ae511dae51c0ae51cbae51daae51eaae523aae527eae52c9ae52d5ae536aae538fae53bdae53ffae540aae54c6ae54ddae54ebae5666ae56e3ae5728ae579cae57adae57c0ae586dae58e0ae58e1ae58ecae599eae59a1ae59a5ae59ffae5a5bae5a74ae5a98ae5aa0ae5aacae5ac4ae5acbae5b85ae5ba9ae5bcaae5c57ae5c8eae5c97ae5d44ae5d95ae5dcdae5ea4ae5eb8ae5ec0ae5eccae5ed6ae5f3dae5f79ae5faaae5fe8ae6013ae602eae6046ae61d3ae629fae632eae63b4ae63e4ae64b9ae65ffae6a1fae6abaae6bcdae6c55ae6d43ae6d84ae6dabae6dbbae73f3ae74d9ae7797ae77a1aee57aaf3c51afa187afa18cafa191c2b00dc87f14c87f33e40095e40138e49288e8068de806b8e84901e84a5ae880e9e8c2350100d20101a20201b002b26e06a21b06a25a06a26f06a29b0a40280a404a0a40560ac9000ac92d0acafc0b41250b41960b603b0c2178142c0f142e9114f121151d05152756152b06152bdd15405e15407732000132004d33fd6033fd6333fd6633fd8a33fe2133fe2f33fe7433fe9433ffb933ffbd33ffc43426963432cd3435cc3453043532c13532c23592093593c83aaaf73aab0a3aab0c3aab763aab7a3aab893aabd13aac1b3b76593b76673b77913b7b633b7b733b9bb03b9bd443c8bc3e80df3e85c43e875e3e9fd23f568c3f80863f88483f91383fa9373fac0e3fb95043c07643c17043c30d43c31643c46543c4c343c4c643c4d243c55243c5dc43c5de43c5f843c60c43c61743c6a143c6ba43c6e543c73943c76f43c77c43c7a443c7ae43c7d143c7d443c88243c8b843c8c643c8c943c8d143c8da43c8e643c91943c93f43c94043cf2f447d02447d3644c1e244f04444f18644f42444f661457c0945f42f4678964680d14682f548043548044748047948047a48049348049748050c480862480866480c4248d82948d82f48d9c5497c08497c25497c4349842849843a4a36044a82f14b7f684b7f874b7fa74b7fb44b7fba4b7fcf4b820f4ca41f4ca44b505f66506f21507fab6831f368324a7062707062717101ab7102087102a371030371035d7103a071041c71041f71d87371f90771f90a738a41738a44738a60738a65738b4874359675865a76e30876e72a7836067a42477a449c7a49d87bb1817cf8537cf87c7cf91a7cf99d7cf9cb7cf9f67cfa067cfa807cfa8580029e8002b9800dbc800e1787c40287c81887c83287cc23881b71881b7a881b88881c018853368953fc896c288990078a02d98a02db8a2904901015a92aedadfc72adfcc8adfce9adfdd0adfddfadfde1adfe94adfee0adff48adff89adffabadffdaadffddadfff0ae0020ae0034ae0037ae0088ae0094ae00a2ae00b8ae00e1ae00f1ae0112ae0155ae015aae015bae01a1ae01c3ae01ffae0255ae0360ae036dae0382ae03c0ae03e4ae03f3ae041bae041dae0427ae0454ae0464ae04b0ae058fae05a6ae05b6ae05d3ae05e7ae0656ae0660ae06e8ae07aaae07b1ae07b6ae07ebae07faae0898ae08a9ae08b1ae08b4ae0949ae098bae09a7ae09f8ae0a1bae0a7cae0a8aae0afbae0b60ae0b82ae0b91ae0bb3ae0c1bae0c56ae0c6eae0c99ae0caeae0cb4ae0cc3ae0d42ae0d47ae0d5cae0d84ae0d92ae0db7ae0df4ae0e18ae0e49ae0e99ae0eb2ae0ebfae1127ae118aae11c3ae11d8ae11ddae1253ae13a1ae13b6ae13caae13d1ae13e5ae13fdae1412ae1421ae1457ae1472ae16e6ae1721ae174dae1791ae179cae17a5ae1804ae1862ae18feae192dae1c09ae1c12ae1c20ae1c2cae1cfaae1de4ae1e6bae1e72ae1e7fae1e87ae1e9cae1ea0ae1ec4ae1eccae1f2c152baeae1f99ae1facae1fb4ae1fbfae1fc4ae1feaae1ff5ae2002ae201aae2034ae204dae20e6ae2160ae21bcae21ccae21daae2210ae24e5ae2688ae2689ae2699ae269bae26a8ae26b4ae26d2ae2776ae278cae2903ae2904ae2908ae290cae2916ae2936ae2bdcae2bedae2bf4ae2bfcae2ee5ae2ef5ae2f59ae2f64ae2f9aae2fa3ae4792ae47a3ae47deae481dae4841ae498aae4999ae4a14ae4adfae4ae3ae4b5cae4b62ae4b86ae4b8aae4b90ae4d34ae4e21ae4eabae4ed3ae4edfae4f2cae4f40ae4f90ae4fdaae50b4ae50cbae510dae511fae51a4ae51abae51b6ae51d4ae51e8ae5278ae52e3ae5301ae530dae531bae5368ae53b8ae54dfae54e1ae54e2ae55ddae5631ae5652ae56b9ae56caae56d6ae5791ae58b3152be3ae58eeae598cae59ceae5a2cae5a4aae5ad9ae5b19ae5b6cae5bc0ae5bccae5cc6ae5cefae5d34ae5d5fae5d79ae5d98ae5e4dae5e55ae5e56ae5e6aae5ed0ae5f12ae5f29ae5f48ae5f99ae600aae600dae6030ae61feae621eae6228ae6230ae6247ae6348ae637fae68b1ae6988ae6a15ae6a17ae6a47ae6a82ae6abdae6ac1ae6b84ae6b97ae6bb1ae6c65ae6c7eae6caaae6cc3ae6d42ae6d85ae6db3ae6dceae73e2ae73e6ae73fdae77d1ae77ffaf2136af4a7bafc664c2b82dc87f0ae4010de48c6fe4992ae8068fe8c2340100860101f50200b1046000058f0006439706a27006a28a06a2960ac76e0ac7e00ac8220ac8900ac9390ac93f0ac9450ba0330d087f0d089514247d142c9c142d84142f6514f9e714fc0d151cf1151d04152b7c15535a31fed732000c32004e32005b32007233fcb933fd3033fd3633fd5f33fd8233fd9433fdac33ffb634158a34261534308c3aaaa33aaac13aaae53aab5e3aab993aaba33aabbc3aabbd3aabc23aac143b76273b76303b76923b769a3b769e3b76a13b77203b77763b7f6843c7433ea7643f43a03f88cc3f9e543fa3423fa93f43c15f43c1ae43c22f43c25243c26743c26f43c3a243c4be43c4c143c4ca43c55043c55543c61943c69843c69d43c6be43c6c443c6e843c6f443c77f43c7d643c88343c90e43c94d43c96643c971447d0e447d5744f02444f10144f42344f64e44f6a744f80244f82345f4444678a046801d4680ff46815c477fd2477ff648d85448d8e148d90e497c12497ca8497cac497ccd497cd249842f49843549844f4a35eb4a360f4b7f694b7fcd4b7fe24b82ab4b82ce4b82e54ca31e501fa050800f50821350ffd8702c6e70625b70c0767102f971f01071fa0b71fa0d738a5f744a637500d27a42157a42447a42867a428e7a42a17a442b7a44607a49577a49657bb1727bd0467bd0667cf8387cf83a7cf99b7cf9e87cf9f57cfa197cfa3b7cfa4e80021080022c8002558002668002a18002af8002b480031a800326800e228a059687c41c87c82187cc0387cc1d8880048967d48a041e8a05a78a06e08a07098a08d08a0a35adfc62adfc68adfc79adfc7cadfcb2adfcb6adfcd0adfcd2adfcd9adfcf5adfd83adfdc9adfdd8adfeb8adfeb9adfedfadff91ae0024ae002cae003cae0059ae0060ae0066ae006fae009cae00bfae00c0ae00e6ae00e8ae01e2ae01e5ae01f5ae0254ae026fae0270ae02f6ae036cae03c5ae0433ae047aae048bae0499ae04a3ae04afae04b5ae04b7ae04e6ae0532ae05bdae0612ae062aae062fae065cae0671ae0693ae0696ae06dcae06e7ae0751ae075cae07a3ae07ecae07f0ae07f6ae07f9ae0802ae0811ae0891ae08b7ae08fcae094aae0957ae09fbae0a4aae0a7eae0a97ae0af2ae0b02ae0b18ae0b1bae0b1dae0b1fae0b2bae0b3bae0b7dae0b87ae0c68ae0c84ae0cc2ae0d69ae0d76ae0dceae0dd2ae0e43ae0e4cae0e69ae0e84ae0e8eae0e91ae0eacae1167ae117eae11aeae11b9ae11ccae11cdae1232ae1236ae123bae12c4ae141aae1471ae14aeae14c6ae1703ae1722ae172eae1741ae1799ae17b0ae1851ae192bae1babae1c24ae1d64ae1dd2ae1e51ae1e75ae1e7aae1ea2ae1eb6ae1ec5ae1ecaae1f59ae1f5cae1f66ae1f6eae1f7fae1f80ae1f98ae1fb6ae1fe4ae1fefae2032ae2035ae20b9ae216aae2173ae21baae21e1ae23deae24f4ae2605ae2652ae2664ae26cfae2905ae2910ae29ddae2be7ae2be8ae2be9ae2ed4ae2ee8ae2f5cae4794ae47f1ae4810ae4838ae484aae486bae486dae4873ae4884ae4a17ae4af4ae4afbae4b25ae4b29ae4b9aae4be6ae4befae4d2fae4e0fae4ea2ae4eb0ae4f15ae4f33ae4fbaae4fe4ae50b7ae50cdae50e2ae50eaae5180ae518bae519cae51aaae51d2ae51ebae5295ae5297ae52a2ae52fcae537bae5384ae5406ae5420ae54f0ae5658ae565dae5677ae5719ae5773ae5774ae57c5ae589fae58f5ae5969ae59bbae59bcae59ddae5a3aae5a52ae5a67ae5a90ae5ac2ae5b48ae5bc7ae5bdfae5be5ae5c5dae5c69ae5cbaae5cc5ae5ccaae5d16ae5d46ae5d59ae5d82ae5d8fae5dc4ae5defae5e53ae5ea5ae5eacae5efbae5f54ae603aae603fae6051ae605dae61f7ae61fcae6204ae6206ae620aae6275ae6278ae6351ae636cae63c8ae63e9ae63efae63faae648bae649cae64aaae65f4ae65fcae68adae69c4ae6a25ae6a27ae6a76ae6a83ae6a8cae6a94ae6ab7ae6badae6bf2ae6c08ae6c20ae6c26ae6c77ae6c7fae6c81ae6d60ae6da3ae6e7dae7480ae7486ae74a9ae74c4ae77d9ae7812ae9ff8aed15baef94eaf53b8afb238c2bedbe40137e40141e4015fe48ff5e4916be49928e80648e806b4e847f20100740200b4058f0106a20406a21006a24c06a26606a273084fe00ac0050ac7470ac7df0ac92f0ac9360ac9420acab30acada0b42800ba0360d0931142dde142ed81526d8152b611533c015406715406e1551df15522c32003732007833fd5433fd5933fdbf33fddc33fdfd33fe0233fe1133feab33ff1333ff1b33fffe3571c23aaaa53aaaad3aaab53aaad13aab683aac183b76073b76293b765c3b77773b7f933e95ca3ea3833eb6f83f46db3f87433f88033f9d553fa0163fad9d3fb27e400ee640642143c0f743c18443c22e43c23543c25543c25c43c28343c2b443c30643c30b43c30e43c39143c39d43c49f43c4cb43c4df43c55843c5f643c60943c69643c6c143c6c343c74643c7d043c7d543c8c243c8df43c8e743c8ed43c93143cf33447d29447d4444f0e744f6a5467899468159473c0d477fd148040348040f48047b48084c48086548d88f48da8548f3a5497c31497c82497c9849842a4984af4b7f6b4b7fac4b7fb74b821a4c5c1a4ca1ee4d2117501f9e501f9f505f70506f46506f6a5080de50ffdf702c6570c07e710310728130738a027435927502a975862075870376e3077801587a443e7a449b7a49587bca5d7be0597cf8447cf84a7cf8697cf8817cf9e37cfa037cfa057cfa0e8003a0800f31881b82881ba1896c0e896c3c8990098a041f8a06ea8a0a27a3652bae63c5adfc67adfc6badfc82adfcb8adfce3adfceaadfcebadfd0eadfd6dadfdbbadfe0eadfe88adff65adff92adff96adff97adffb4adffd4adffd6adffe8adfff4adfffaae0009ae002dae00a4ae00c2ae00eaae0103ae0110ae0114ae0141ae0144ae014aae0207ae021eae022aae0245ae0361ae0365ae0367ae0378ae0380ae0392ae03c3ae0452ae0459ae045bae04c3ae04ddae0507ae056bae056fae0578ae05c6ae05cfae05e8ae064eae07a1ae07b5ae07d6ae07fcae080eae087fae089aae08bfae0955ae095eae0976ae09d6ae0a03ae0a71ae0abbae0b0cae0b22ae0b6cae0bb7ae0c01ae0c07ae0c4eae0c6bae0cc6ae0cf3ae0d4dae0da8ae0e08ae0e6dae1111ae1122ae112dae112eae1131ae1136ae1148ae114fae1191ae11acae11d2ae11dfae1206ae1207ae120cae1211ae1252ae12adae1395ae13aaae13b3ae1411ae1424ae143dae1444ae1468ae146cae14b7ae14b9ae170dae173cae1794ae1827ae182cae1837ae184dae1854ae191cae1c0bae1c21ae1cfbae1d41ae1d53ae1d58ae1d90ae1e5dae1e95ae1ea3ae1eb1ae1ed3ae1ed4ae1f2aae1f58ae1fadae1ff2ae200fae2017ae201cae2029ae204bae211bae213eae21c5ae21c7ae21caae21cbae21fcae2207ae26cbae26ccae2778ae2bd3ae2bfdae2ef0ae2f54ae2f62ae2faaae479dae47a7ae47eeae4833ae483fae49edae4a10ae4a28ae4a8fae4ae8ae4b3dae4b6dae4b78ae4be2ae4bebae4becae4cacae4d9aae4e4fae4eadae4ec0ae4ed1ae4ed5ae4f21ae4f53ae4f55ae4fb3ae4fe9ae4ff3ae502cae50c8ae510eae5111ae5197ae51a5ae51caae51d7ae51e7ae523dae5265ae5280ae52d0ae52d9ae5314ae5318ae5319ae5386ae53d3ae5659ae566cae56a6ae56abae56c7ae573bae57a5ae57c4ae5876ae5892ae58a9ae58deae58e7ae58f0ae59b4ae5a06ae5a1dae5a6aae5a6dae5a8dae5a95ae5aa8ae5ab8ae5ac0ae5ad1ae5aeaae5b7eae5bcbae5bd3ae5bdbae5bf4ae5bfbae5c58ae5c61ae5c65ae5cdfae5d33ae5d58ae5dcbae5e0eae5e93ae5e96ae5ea3ae5eecae5f01ae5f05ae5f3bae5f49ae5fa0ae606fae60f2ae61beae6239ae6333ae63fcae65fdae6604ae695dae6a55ae6a7bae6aa4ae6c56ae6c69ae6c74ae6c78ae6c87ae6cb9ae6cd6ae6d57ae6db0ae6e7cae6ed6ae6edaae73e4ae73f0ae73f5ae746cae74acae74c9ae74d2ae77bfae77c1ae77cfae77fbae77fdae7e91c87f3ac87f3ce400a2e400f8e48f4243c7a6e49063e49949e80645e80676e8068ce8493fe88102e8cfc50101650101770101d10101d20200b30200e40200f102019704c1a80640f00680b706a21506a24a06a26e0ac3220ac3650ac88d0ac8920ac89b0ac92a0b41140b42910ba0030c204e0c20d00c404c0d06120d07da0d08720d0bf8142d8c142d9a14f11e1526fc152a261533cc15406f15407215508415537a1577661d33411d334a32003532007633fc8b33fd3533fd3933fd4433fd8333fd9133fe2533fec733fff834158134245734338f3543c53552903571c643c7a739d62c3aab6a3aabc93aac0f3aac193b761a3b779e3b77e83b7b653eb52243c7b03f70013f8b7d7cf85945f42a43c07243c0ee43c12a43c1bb43c24b43c27943c45c43c45f43c47b43c49343c4ce43c55943c55f43c5e743c5ea43c5fa43c61343c67a43c68743c6e143c75a43c79143c88443c92d43c94c43c98f43cf3243cf34447d1c447d437cf99244f14344f14444f84445f42545f43446fbea477ff2477ff3477ff747812a4781324804894804a8480884497c22497cb54a36114a81864b7f7e4b7f824b7f884b7f8d4b7fa44b7fe14b82284b82954c5c1b4ca28b4ca420505f65506e1b506e1e506f63507f9c50800c50ff9b70625e7101aa71038e7103d471bc6571be4371f00d71f882738b4b74359975872576e3117802447a42457a424c7a425a7a425d7a42887a492c7a493e7bb0e17cf8417cf9a17cfa077cfa0a7cfa137cfa7e7cfaa380023580026e80029780031b80150c87c40d87cc0a87cd1a881b6c881b70881bc5881bf5884018896c738a0329adff8eaaecf3aaf4e7adff9bae77c2adfc65adfc69adfc71adfc76adfca3adfcffadfd13adfd70adfda3adfe31adfe69adfe7dadfe98adfe99adfea7adfec1adff61adff68adffb2adffbbadffbcadffc0adffccadffdfae0003ae0011ae003fae004eae0064ae0091ae00c8ae012fae01ecae020eae0231ae02e1ae02e4ae0316ae031dae0379ae03e3ae044cae0480ae0568ae056dae05bbae05e0ae060fae0630ae064dae0698ae074eae07baae07e3ae07fdae08a6ae08abae08e0ae08e1ae0959ae0994ae09bbae09f3ae0a07ae0a14ae0a21ae0a2fae0a67ae0a72ae0ab7ae0b8fae0ba3ae0badae0be2ae0c17ae0c28ae0c41ae0cc1ae0d2fae0d6eae0d70ae0d8fae0deeae0df1ae0dfaae0e37ae0e45ae0e7fae0e8dae0eb9ae0ed5ae0efaae10e5ae1110ae1115ae111fae1126ae1178ae1180ae1195ae119cae11c7ae11d0ae11e7ae1237ae1251ae12b8ae130cae1388ae13c9ae141bae141eae142fae147aae14bdae14ceae1528ae152fae15d0ae16faae1720ae174aae1754ae178fae17a0ae17aaae18c8ae1995ae19a5ae1bfbae1c05ae1c0fae1c13ae1c36ae1d60ae1d79ae1db1ae1dd5ae1e69ae1f5dae1f68ae1fb0ae1fd0ae1fdeae201fae204aae2051ae2116ae2139ae21b9ae21e4ae265bae2691ae2692ae26a1ae26adae26c4ae2707ae27feae29d3ae2bf7ae2c3dae2edfae2f68ae2f9dae47a2ae47ebae4811ae483cae49c4ae49e7ae4af5ae4af7ae4b45ae4b4dae4b59ae4b92ae4b93ae4bb6ae4bdeae4c63ae4e08ae4e09ae4e1aae4eacae4eccae4edbae4ef3ae4f98ae4f9aae4fcdae4fe7ae4fedae4ffaae511cae51c8ae51ccae524fae5266ae526bae5276ae5285ae52a5ae5303ae536eae5398ae5399ae53a1ae54d8ae54d9ae54f2ae54faae5649ae5651ae565eae569eae56a5ae56eaae5798ae587bae5883ae58a4ae598aae599cae59b1ae59beae5a0bae5a50ae5a51ae5abaae5abdae5aceae5ad3ae5aeeae5bc6ae5bd7ae5cceae5cddae5cebae5d09ae5d32ae5d56ae5dd9ae5deeae5df1ae5e17ae5ec5ae5edfae5f4bae6009ae6032ae6040ae6049ae60afae60eeae6331ae6342ae6355ae63b3ae649dae64acae64beae68b6ae68e0ae6962ae6a22ae6a3aae6a9bae6bb6ae6bd7ae6c2dae6c6fae6c7dae6c85ae6ca8ae6cc5ae6cc6ae6d4bae6db6ae6ed8ae77c7ae77d6c2b017c2b021c87f27c87f41e2002ee47d79e8068902004106a20d06a21d06a25706a25b06a26d06a27106a28e0a405f0ac8240acafe0acb160b60360d806c142dd414b92f151d071526d6152b6a154ca315532915533b1b4f6032002b32002d32004732005a32007132007d33fd6933fe2033fe3833fe3933fe9933ff1233ff4933ffb83425cb34308a3571c738203b3aaab33aaac53aaaf33aab483aab5c3aab983aabb83b762c3b76703b778f3b7b5a3b9b1a3b9b603b9bcc3b9bf03e82ea3f40df3f4ddf3f77aa3f80323fab93400ed0400ee943c06f43c09a43c17e43c1fd43c28e43c34243c34443c38f43c39043c4d843c50043c56743c5e543c6d443c74043c75c43c76243c93043c94143c96143c99d447d0d447d0f447d1e44f04044f04344f0c844f12444f42c44f5a144f6a244f825457c1545f4334678a44678b1477f9047812d48040a48041b48049648105048d82048d96348da8048da81497c29497caa4984364984554984624a35ab4a36187cf9cc4b7f864b7fa34b82114b82194b82204b822d4b830450815f50ff3b50ffb65110d86832497062727101a971020471031271fa0a738a69738b4e7434c77436ac7586cc76030376e7317cf83f781a867a42657a42817a431b7a432d7a48f97bc0177cf8497cf86d7cf8997cf9a47cf9af7cf9fd7cfa407cfa8280021380028780029c8002ac8002dc8002e080031c80033a80078f80079e87c00387c40087c41287c41488002c88040c881c0b888001894088896c16896c4b8a00298a01348a06588a08578a0872ae56d3ae1169ae1173aa94a3ae11eaadfcbdadfccfadfcd1adfcdcadfd07adfddeadfde7adfdedadfe12adfe79adfea6adfecbadff3eadff49adffb7adffe3ae0028ae0051ae0071ae00d2ae00e5ae0171ae0175ae0195ae01c5ae01eeae0208ae024eae026eae035bae036eae03ceae03f5ae0405ae0471ae04c6ae04cfae0502ae055eae0562ae057fae0585ae05aeae062bae07ccae0890ae08a7ae08c0ae08d6ae08daae08eeae08f0ae0954ae0990ae09b6ae09b9ae09d3ae0a6eae0aa7ae0abcae0b0eae0b6aae0b7fae0b98ae0c12ae0c26ae0c38ae0cadae0d2bae0d65ae0d67ae0d7eae0d81ae0d89ae0ddeae0df7ae0df8ae0e00ae0e1eae0e20ae0e26ae0ea5ae0eaaae10b7ae10c0ae1157ae1202ae1273ae138bae13a7ae13b8ae13bfae13c6ae13f2ae141cae1420ae1448ae14a5ae14a8ae14caae1527ae1735ae1751ae17edae184bae184cae1903ae19cdae1c2eae1d75ae1dacae1dcbae1e5eae1e9fae1ed0ae1f25ae1f2bae1f2eae1f85ae1f8eae1fe3ae1febae2006ae2059ae2062ae2065ae20b8ae20c3ae213cae213dae2666ae2668ae268aae26b3ae26b5ae26beae2731ae2763ae27f2ae2c3cae2f60ae2f6aae2fa7ae484dae4998ae4a08ae4a11ae4a12ae4a1dae4a29ae4b37ae4b55ae4b8fae4bb5ae4bbbae4d4eae4d5cae4e19ae4f28ae4f82ae4fa9ae4fb4ae50c0ae50dcae50dfae50e4ae51a6ae51aeae51c6ae524cae5277ae53a3ae54d5ae5642ae5674ae5682ae56bbae56c1ae56cdae56d0ae56edae571eae571fae5741ae5779ae579bae579fae57caae5874ae5881ae588cae589eae58b7ae58e8ae5991ae5999ae59caae59d4ae59e1ae5a05ae5a49ae5a5eae5a5fae5ac3ae5b79ae5b7bae5bd6ae5be8ae5c8cae5cccae5cdeae5ceeae5d40ae5d6cae5d9aae5f02ae5f0bae5f55ae601aae602dae6031ae60d5ae60f5ae61adae61b5ae61c0ae61c3ae6238ae625dae62fcae63b5ae63c6ae647aae648eae64afae6609ae68b5ae6912ae6a21ae6a24ae6a87ae6ba3ae6ba7ae6bfeae6c62ae6c71ae6cb0ae6d51ae6d63ae6ed9ae7474ae74a8ae74b6ae74dcae77c8ae77ceaed610af848cafa82ac2b0a3c87f0cc87f12c87f31c87f42e40096e400b3e497d7e49933e49da4e84902e88101e909fb7c79a97c79aaa37718a39a9fa651e9ab333ca3a9e1a7f1d0ac71ba0acb7d0ac7720ac7730ac7a30ac3940ac7a533fff93aac063b77d24b7fd90ac3eb0ac75c0ac1aa0ac7a23aac383b753c3b75503b76da0200a80ac3920ac3d70ac7600aca033b76a43b76a53b76ca3b7b800ac3350ac7880ac79e0ac8630ac9043aac293b761048104e0ac3360ac3ea0ac75d0ac7a60ac9053aac093aac233aac303b75523b76be3b771f7103940ac75a0ac7670ac79a0ac7e40ac99c0acba73b75a93b76d20ac1640ac7790acaca0ac7bb0ac8ad0ac8c40acad63aac323b76130200cc0ac8670ac8f83b754e0ac7893542c53aac023aac0e3b76b33b76c83b76d53b77e43b7b413b9b1f0ac3380ac7a70ac7ba0ac9160201250ac74e0ac74f0ac7803542c33b75253b770d71010a3b75373b760d3b76ba0ac76f0ac7810aca790acb7c3b76a03b76c93b77e53b7b568940163aac043b75c64c80927103870ac75b0ac7740ac8270ac9443b76bb3b7b203b9b2102008e0ac3f00ac7780ac7b70ac8af0ac8bf0ac8f70ac91d0ac3780ac77a0ac8a13aac2a3b75380ac7630ac9010aca4c3b76c20ac0000ac3dc0ac74c0ac7a00ac8f90ac9130acb943b76b60ac9080ac99b0aca470aca530acb553b75233b75b60ac0390ac3430ac3d90ac7770ac9710ac9900acaa73413903b75310ac3850ac4050ac9310ac9d10acb533b76c00ac1980ac7550ac7750ac9193aac117101360ac0cb0ac7b10ac7b90ac8b00ac9150ac9490aca523b75403b76c63b76d40ac74d0ac8b80acad90acb364b839c7103930ac8530ac8f50ac92c0ac9720acafd3aac2d3b76c10900ae0ac1570ac7590ac8c53542c47103860200ac0ac9177101a80ac3a80ac9c83b7b230ac7573b76b53b7b400ac37d0ac94b0aca870acacf3aac053b75350ac35a0ac3ed0ac76b3aac033b76d90ac7700ac9243b75490ac3ec0ac9030acac73b76d80ac9140aca6e0acb543b76113b76d03b7b220200590ac7a10ac7c20ac9eb33ffc03aac0b3b75543b77d30ac3930ac3a90ac7850ac7bc0ac9923b76d60ac3d40ac94a0acb3433ffc13aac073aac313b75343b76c50ac8a00d088b3413913aac083b7556e498420ac37f0ac7bd0ac8bc0ac9183b76b73b76b83b76dd3b7b5900aec90ac7680ac91c0acb9533ffaf3b76123b76c73b9b1e7103910ac3960ac3d60aca490aca4b3b753f3b76143b9b1d0ac3370ac7b60ac8be0ac9070acadb3b76cc3b76d13aac0c3b76c33b7b213b9b220ac3340ac7b80ac8b90ac8c00ac9223b75ba3b76d73b7b583b9b290ac0280ac3dd0ac8b30ac99e0acb353b76ae0ac7490ac7540ac75f0ac7690ac9470ac9993aac0a0ac33d0ac76d0ac8650ac91b0aca4a0acb933b75333b76db0ac2040ac3950ac7710ac77f0ac8b10aca780aca883aac280ac7650ac7860ac37c0ac8c20aca300aca483b75263b753a0ac37b0ac7980ac8bd3aac2f3b75b83b7b5771039602012d0ac33c0ac7610ac76a0ac91a3b76bf3b9b200ac7960201360ac99a0ac9c63aac153b75323b76220ac8c3e880e80200ab0201300ac7760ac7a83b753d3b76c43b771e0ac9480ac3880ac7de0ac8b50ac96f0aca500ac7e70ac9230ac9fc3b75b70ac33a0ac35d0ac74a0ac7830ac7910ac8b60ac8b70ac8bb35455648c65e0ac1a30ac9700ac78a3545553b769f3b76bd0ac8c10aca4e0acb693b75e54cc468766021ae513f3b77cb3b77ca3b77c83b77cf3b77c53b77c73b77c6ae660771f4ef71f4f071f4f271f4f471f4f671f4f771f4f8c2c363c2b3ffae626fae6262ae6263ae626eae62a2ae62a3ae62a4ae62a6ae62a7ae62a8ae62a9ae62b2ae62b3ae62b73b77d83b77d73b76ad3b76acae62bb3b76ab3b77d53b76aaae78023b76a93b76a83b76a7ae62c5c2b107ae62d245f45bae5130ae4d61ae04a0c2b111c2b11bc2b125c2b12f3b76a6c2b139c2b143c2b14dc2b157ae6d83c2b161c2b16bae5919c2b17fc2b1897cfaa17cfaa07cfa9fae64cca7e84eae56f4084f00881bc97103a3155bcf51005e51002b03e01503e004c2b1754b840808cbab35951648da8f1577113b77d07a4447af4f34683037af04676831ed70c0b470c04d70c05770c0b770c0ba70c0200180190180218990087bc0063b7ba77103a73591ca3b75ed3b7530ae2930ae62c6ae3988505c063b77e7ae74263b77103b771c3b771b3b771a3b77193b77183b77173b77163b77153b77143b77133b77123b7711ae7803ae4f1aae59833b77e6ae5980ae24daae24e03b75ec0201a7ae2744ae24c63b77cd3b77cc3b77c33b77df3b77de3b77d93b77dd3b77dc3b77db3b77daae4f19ae5984ae1e103b75653b75433b75443b77c9ae62c7ae5f8d3b7ba53b77ee3b77f13b77f03b77ef3b77ed3aabfb3b77eb3b77fd3aabfc3aabfa3aabfd3aabf83aabff3aabf93aaa983b77fa3b775d3b7ba63b7baa3b7ba43b7ba33b7ba23b7ba13b7ba03b7b9f3b7b9e3b7b9d3b7b9c3b7b9b3b7b9a3b7b983b7b973b7b963b7b953b7b943b7b933b7b923b7b913b7b903b780f3b7b8e3b7b8d3b7b8c3b7b8b3b7b523b7b513b7b503b7b4b3b7b4a3b7b49ae6ca43b77f83b77f63b77f53b77f33b77f23b77ec3b75273aabfe3b77f73b773c3b773b3b77393b77373b77293b76583b772c3b772d3b772e3b772f3b77303b77323b77333b77353b773e3b7731ae586cc2b1a7c2b2e7c2b2ddc2b2d3c2b3693b9bb43b9bb3c87f1ac87f16c87f1745104cae5736c2c1f1c87f19c87f18c2b0fdae5982c2af81c2af8bc2af27c2afbdc2afb3c2af95c2c223c2b517c2b413c2b41dc2b43bc2b427c2b431c2b445c2b44fc2b459c2b463c2b46d3b77223b77233b77243b77253b77263b7728c2b373c2af4f4984bac2af59c2af63c2af6dc2b477c2b481c2b48bc2b49fc2b4a9c2b4b3c2b4bdc2b4c7c2b4dbc2b4e5c2b4efc2b50dc2b4f9c2b495c2b215c2b229c2b23dc2b251c2b355c2b3b9c2b37dc2b535ae1e16c2b549c2b553c2b1edc2b3c3c2b585c2b5714b83a3c2b5adc2b5b7c2b5c1c2b21fc2bb25c2bb2fc2bb39c2b20bc2b247c2b233c2c1fbc2b567c2b55dc2b1cfc2b1c5c2b1bbae2926ae2929c2b52bae4a04c2b35fc2bb43c2bb4dc2bb57c2bb61c2bb6bc2bb75c2bb89c2bb93c2bb9dc2bba7c2bbb1ae62cbaea045497c9fae62ccae1b4dae62d5c2c237c2b3f5c2b3ebc2afc7c2b3d7ae2927ae292ac2c313ae4f56ae62e0ae21dcae3c3cae2f47c2bffdae61d4c2c093ae61d6ae5002aed615ae5a41ae21f7ae214dae5b18ae62d4ae538cae1716ae2759ae4fcbae73fcae73faae62b5ae62b4ae626dae5d21ae61e2ae62ceae62d6ae62dbc2bce7ae62e5ae62e7ae62f4ae6316ae631aae631bae631eae5253adff0bae6bd0ae501eae63d2ae2788ae205dae4d55ae2755ae61bdae60d7ae4b9cae4f9bae68a6ae689bae0e0aae0019ae5893ae1a5dae62cfae62ddae4ef4ae1ea7ae6190ae142eae4ba1ae00c5ae292c48104cae09623b7475affd5eaedb55ae4bb2ae62f5738bebae7816ae1826ae0c3dae61c4ae62e8ae4f87ae5ba8ae6307ae275cae1b8cc2c309ae62d0ae62d8ae108dae592dae2be1ae292d45f469ae6174ae086bae4e7271f0e2ae5e25ae6d77ae6a41ae2740ae18dbae6d87ae525aae58b1ae5d2caed1d0ae5a76ae1ab5ae5385ae7450ae62d143c30fae62daae62de7cfa1f7cfa2cae4d5eae52fdae4d4bae4f9dae62caae2056ae4ddfae62d9ae2751ae5888ae5635ae612bae613eae0bb1ae62b0ae62b8ae276eaf213caef553ae2799ae62c8ae62ebae1dd7ae1844a60ba5ae57c9ae4f5eae4f70ae4d57ae631fae4d31ae6ca1ae1dcfae4fd7af8504ae276dae183fae62cdaeeb9aae52a1ae57ddae6ce9ae4d9948d962ae62a5a71706ae010fae62b6ae58aaae6261ae60e2ae273bae62f3ae5e85ae52feae277bae2fd2ae2fd1ae6317ae740aae2541ae626cae6264ae615fae524bae62b1ae6140ae4f1fae62d7aed9b8ae2748ae4f8eae412bae62beae62bcae62bdae62bfae62c0ae62c3ae62c2ae64c4ae62c4ae62d343c9bbae62dcae62e6ae62eaae6308ae6318ae6319ae09caae631cae275dae4d29adfff6af9ba83571d8ae62baaeb3b5ae61e7ae0cd1ae4d40ae0fc4ae62df702c0aae586eafabadae2787ae5bb7ae68a4ae2bd4ae63c9af6c56ae68a0ae4f52ae3fdfae27a0ae73feae00caae63c4ae62acae73f2ae00eb71f26dae097aae1dc6ae4f60ae73f7ae5637a74e67ae1e3471ff72ae5638a9add7ae2925ae1b5bae0e65ae0ceeae74ebae74e5ae7451ae744eae744bae7411ae7408ae7409ae7407ae7406ae7405ae7404ae7403ae7401ae7400ae73ffae73fbae73f9ae73f8ae73f6ae73f4ae73e1ae73e0ae73d9ae6db7e80685ae5632ae6c42ae6d8bae6d8cae6d8dae6d8fae6d9dae6d55ae6d52ae6d4fae6d49ae6d48ae6d47ae6d46ae6d45ae6d44ae6cf8ae6cf7ae6cf6ae6cf5ae6cf4ae6c4bae6c49ae6c40ae6c3fae6c3eae6c3dae6c3cae6c3aae6c39ae6c09ae6c07ae6d892e1719ae6c05ae6c00ae6bfdae6bfaae6bfbae6bf8ae6bf6ae6bf4ae6bf0ae6bf1ae6bedae6bd8ae6bb3ae6bb4ae6abbafc663aed61aae189daef953ae5633e49218ae6a4eae6a4cae6a48ae6a49ae6a4aae6a4bae6a50ae6a51ae6a53ae6a52ae6a54ae690bae68a5ae68acae68abae68aaae68a9ae68a8ae68a7ae68a3ae68a2ae68a1ae689fae689eae689dae689cae689aae5884ae5dd8ae62f7ae2928ae58beae5286ae60e4ae4b97ae277cae6050c2c31dae4d3d7cfa1dae4f387585d98a08408a08418a083fae779fae16f8ae5d22ae4f84ae63cbae1ab6ae1def3593c93b76cf8a02daae5a09ae4797ae479fae47afae1ddcae0161ae5977ae5d29ae64c0ae4d41ae68f2ae6156ae4d42ae4d43ae4d44ae4d45ae4d46ae4d47ae4d4a758625ae4f5bae6260ae629eae6294ae1436ae61c8ae6159507fa8ae4985ae591d43c45943c40daedb51ae4d2eaea0f97cfa27ae2602aeeba1ae4d350d09a8ae5c0baebbcbaeeb9c3b75284b84183b762badffbeae7413e4008a71f104353607afcdadae6208ae6be1ae26f43b7608ae4b403aac10ae5634aec22f48da4580030dae4f3bae604ce49930ae5c56ae56363b7529ae4b4cadff7bae6322ae5630ae11f706a20bae4b26ae4b28ae4b2aae4b2bae4b2eae4b2fae4b32ae4b36ae4b39ae4b38ae4b3a4b836cae4b3c710399af84873593ceae292eae56bd43c96eae60deae5aaac2b31943c9bd7cfa1e43c9adae1aa4ae18e8ae4f453b752c4b841180030ea8b6beae747c094020ae53f0ae138caef9508a10114b8417ae4f79ae1dceae2bdaae2bdeae292f3b752aae5e88ae293180030fae604eae4f2e3b752bae09583aaabbae116643c9aa3b752dae2932ae5d19ae6279ae5d2d3b770fae4bb47cfaa23b752eae4f49ae4f4aae4f47ae4f48800310ae68f10d09990c217f4683b4ae7414adfd74adfd73adfd7f702c09ae4f46ae56f5ae520f3b752fadfd79ae4fd843c9940d540880031143c96f43c970adfd7dadfd7badfd76adfd713b755dae54bfae6289ae6280ae2933ae74523b7681ae60ddae60e3ae60e7ae60e5ae60e6ae60e1ae60e0ae60dfae60daae60dbae60d8ae60d9ae60dc3b9b04ae60ceae60cfae60d0ae60ccae60caae5e8dae60c7ae5e8bae5e89ae5e86ae5e7fae5e80ae5e81ae5e82ae5dd7ae5dd5ae5dd3ae5dd1ae5aa9ae5aa7ae5aa5ae5aa2ae5aa3ae5a9cae5a9bae5a9aae5a99ae5727ae53f5ae53f8ae4e70ae4e71ae5929ae29343b7697ae13e8ae0048ae6b6dae53f1aee372ae5978ae4fffae5000ae5001ae4ff9ae4fcaae4fc8ae4fa2ae4f8dae4f89ae4f86ae4f7cae4f7dae4f7eae4f7aae4b5eadff7375862baf38c4359403ae5979af3bbc8a042243c9b83aab3fae4b87ae7415ae74163b775cae597a7103177103533b77feae597b8016f8ae74423b77ff4b8415884802ae61e3ae61e1ae61e4ae62908016f9ae2777a99660a7fdeca8055aa99a17a34723a0f56ba0f922a0fcd9a10090a10447a2b320a2ec0cae6b10a9e9f7a67024abcac9abf0fdaa7e20a66b3ba8b2fca033a9a0979da09aacae034dad3226a4b786a20bae4678afaabad3a0a530a0b34fa1fa1ea2a399a33d5ca3c6663b9bf23533c3a57edfa5e6c8a628caa62cc7a630e7a68fb2a6d883a6da81a6dff4a71981a71b04a71b1da74181a7855ba966b1a966b2aa690eaa7e89aa7eacaa7ecfaa7ef2aaaa07aaaa2aaaacecaaad32aaad55aab0e9aaad78aab198aabab0aabba54b8392a7a451a52994a69a4bae6500a39981a412baab17ddac544aac5801acc1c5acfbb7ada4d5adc44faddd7a87cd2fae5cf6ae59184b833aa87889adc21eadd70aadedbeae53884b83a74b839b4b8414ab05f200fe014b83344b833b4b83554b83474b83974b83384b834a4b83464b83494b83544b833d3591997585d8ae2757ae743bae0d27ae0d2a4b83394b833c3f4994ae2752ae2753ae2754ae275871f664ae188ba3685da4207fa89bb0a8b80aa8bbc1adce1aac96dfa9844fae77dbae5a24a1a131a1a4e8a335eea339a5a34113a34adaa3c2afa68426a63df9a641b0a64567a3ca1da6692fa66ce6a693d2a801a370c07d70c08eae5a26ae4f1dae5bb4ae0d5bae52b0aa8bbea93240a9f290a77ae7ae0106ae6272ae6273ae6274ae189bae4ddc43c9b943c9c7ae21ea8a042a8a055bae7417ae52b4ae5a25ae52b1ae52b2ae52b7ae52bdae52beae6d6dae5a27ae1939ae1b498a04214b800f7cf9997cfa25ae0c1aae0c19896c11896c18896c1b896c197cfa2b80026caf3c5bae572eae2fd08a0428ae2786ae2780ae2781ae2782ae2785ae2789ae278aae278dae278eae278fae2790ae2792ae279bae279aae279cae279dae27a1ae27a3ae0cd2ae0cd6af54c4ae69d17cfa28ae21ddae21deae21dfae0b4c35919aaf9e24ae43ddaf384c3b75e43b75caae238c3591d34b82ff4b82e63dd2ce02003402003202003602003dae6bbaae61cbae61cdae69daae6192ae618fae618dae618bae618aae6189ae6188ae6187ae6186ae6185ae6184ae61c7ae61d2ae61d5ae61d7ae61d8ae61d9ae61ddae630eae36f6ae4b68af665aae6ced0d05d70d05ae0d05af0d05d88a1012af1644ae69dcae5279ae5270ae5271ae527aae527dae5281ae529eae52a3ae52a6ae52afae52c2ae52c3ae52d3ae52d8ae52dcae52deae52e2ae52edae52eeae52f9ae52faae52fbaae4efae196b4b83aeae52ac0a80214b835f4b83ac4b83adae52394b83354b83364b83374b83aa7585da7586217586267586274b83d64b83d54b83934b83944b83954b83964b83984b83994b839a7586b7ae5241ae5246ae5249ae524aae524d7cf9937cf9943b7f6fae472f3df5c17103607cfa2a7cfa267cfa297cfa2d7cfa2e7cfa247cfa237cfa227cfa217cfa207cfa187cfa1a7cfa1caf843908cbbb0b14403543c2ae5e4b71035a710359ae5bbaae4f6dae60c6ae60c5ae60c4ae60c3ae60c2ae60c1ae60c0ae60bfae60beae60bdae60bcae60b9ae60baae60bbae60b8ae60b7ae606b71035bae5e3b710358ae606cae606dae6061ae6062ae6063ae6064ae6065ae6066ae6067ae6068ae6069aedab7ae2bd8ae2bd5ae2bd6ae2bd9ae2bdbae2bddae2bdfae2be2ae2be3ae2be4ae17cdae5bbbae4f71ae4f72ae4f73ae4f74ae4f75ae4f61ae4f62ae4f63ae4f66ae4f67ae4f6bae4f6eae4f6fae6b4d359413881c66ae7418af85ffae00ddae5e4eae5e4fae5e52ae5e58ae5e49ae5e48ae1887af77c9aed80bae5bb9ae5bb5ae5bb6ae5bb8ae5bbcae2fd5ae2fd9ae5fb1ae5fb2ae5fb3ae5fb4ae5fb5ae5fb6ae5c72ae5c75ae17c2ae1dddae1dd4ae1dd1ae1dd8ae1dd9ae1ddaae1ddfae1de1ae1de3ae19db7a4299ae6b6eae1b16ae6bb7ae1b6920103f3594047102ffae7441ae6cceae6ccfafb674e4955fae5858c2b2f1ae181fae11f9ae1168ae637775861fae6cd07585d6758718ae5a0e80021bc2bcb5c2bcd3c2bcdd48088a48088c48088e45f4664984bdae5fb7ae5fb8ae5fb9ae5fbaae5fbbae5fbcae5fbdae5fbeae5fbfae5fc0ae5fc1ae5fc2ae5fc3ae5fc4ae5fc5ae5fc6ae5fc7ae5fc8ae5fc9ae5fcaae5fcbae5fccae5fcdae5fceae5fcfae58fbae1762ae1763ae176eae1764ae1765ae1766ae1767ae1768ae5c29ae5c2bae5c34ae5c35ae5c3aae5c3cae5c47ae176f4b83a5ae502b8a095f4b83abae1b18ae77b8aab2faa3ad38a57b3502b26c3b7f67a6692ba3e624a8649ba8574180030c800312800313ae5006ae5005ae5007ae5008ae5009ae500aae500bae500cae500dae500eae500fae5010ae5011ae5012aae4f6aeb3023aabef3aabeec2bf3f3aabec3aabebae1b19ae5c07ae5c08ae5c09ae5c0aae5c03ae5c04ae5c06ae5c05ae5c0cae5c0dae5c0eae5c0f704282881c08ae16f0ae4f17ae4d3fae4d39ae4d3bae4d3c3e9808ae50bb71039a4984b8ae1b1a4984bbae6d67ae4e634984a171031e71031a43c9d88991803dd2cb3b757b710355710357af3a67af84344984b9ae64c1ae538aae5389ae538bae0a0043c9a5a6fd49ae6ab14b84864b8413ae132ba75993ae6ca3e4992ce49938ae5bbf3b9b5e3b9b5a3b9b5b43c988ae4b65ae09d0af551eaf7ffe48d9237103814984bc46781f3dd2cf447d6587cdffae23f0af2bc5ae6ab0ae2101ae741971f8eb3b7becaf3c02ae062eae08efae5a388a070aae56be71f814ae5aaeae5aafae26ecae5931ae77b9ae5754ae5753497c9e3aab1aae6ca5ae1845ae18434a35f94984beae592e3b7be8c2c269ae5f89780328ae1b1bae4e61ae91d2ae616eae2126ae2125ae4e3baf259c4984c0ae61968848048880d3ae63cd881bafae412cae5855b1e8967cfa94ae62ab4984c14984c3e4922dae2c074984ea88480770c05548d8804844bb4844acae00bb884806884808ae4e5bae4e55ae4e56881c05aeeba2af20c1881c04ae6cfeae4e57ae4e51ae4e52ae4e5fae16ebae175bae77dc884805ae740bae740dae740eae740f884809ae2773ae277faf08a2ae1c1dae50f73df5c0ae5c6c3aab6bae52f3ae5bacaee828ae6809ae0437ae0442ae0434ae0430ae6820adff6aae4b6a06a29dae6b590a4048353606ae1b51ae1b56ae1b52ae1b53ae1b54ae1b5548088548d88348088948088848088d48088faec784ae749dae6905ae6906ae6907ae6908ae00acae2391ae1b1cae63064b829bae1953af6c00ae4e48ae4e44ae11fb738bf4702c22497ce3ae7453aecb4aae6d88ae62690d0980ae4baeb1e87dae5936ae4f50ae4f51ae5202ae1c04ae53efae00beae5e78ae5e77ae6d68ae5e79ae1e00aeeb98ae7410ae4f3dae4f3eae22113b77fbaed92202d483aed12aae67f4aeeba3ae4cf2ae0cb8ae69f8afb23aae4e59ae741aaf2172ae0c8aae6783ae1dc03aaadcae6421ae5ba4ae741bae741cae5ba7ae5ba6ae5ba5ae5ba3ae5ba2ae5babae541bae77b5ae4e64b1e796ae49e3710363ae5e428014813aabed3b7521ae779933fcb43b75f03b75f43b75f7ae62e4adfec4ae58abae0bc6ae4903ae0a34a755dcae4b82ae4bfb7103a1ae498971031f3aaaddae0941ae4cebaecaa3ae520cae2bc6ae5e7aae26f2ae2765ae0c2d4b8296ae1902af1cb702d060adff03ae4f1bae0942ae743dae53ceae4e4c0d84c133fcbc68330568330606a2794b7fbf3b7bee35360b4b82cdae4e46ae626a33fcbfae54b880029b4aecbeae77cc502fadae8372ae6056ae1fdfae5fa4c87f377103657103a535360171035ee40088ae5bfeae4e5aae4e60af0df6e40089ae6d01359517ae4ecaae0e77ae741dae741e683d90c2c255c2c20fc2c219c2c22dc2c241c2c24bc2c25fc2c273c2c27dc2c287c2c291c2c29bc2c2a5c2c2af896c5a447d4fc2bf2b48d91148d91448d91548d91348d91648da86c2bfd5af3bc9ae4f22ae5b21aaf011ae2bc4ae592aae4a88ae64b2aecef7ae2f150d08770d000f0d0878ae6cebaed60dae4c0dae2bc8154e3d3aabceae58d2ae7454ae5b23ae58d1881bccae64a371f76f7080203b7520ae60530a40043474d3ae5b1aae5b1cae5b1dae5b1eae4a89ae5b20ae5b22ae5b24ae5b25ae5b29ae5b2aaf4bb4ae593aae1b4cae589ba9d660ae57b1ae4bfaae5e3fae4dd5ae532cae4daeae5343ae5b65ae5e44ae5fdfae4da2ae4de643c81b7cf929ae69be43c812ae5921e20100ae753d43c811ae5923ae5927ae592bae592cae592fae414fae412eae4980ae13e9ae0e2eadfdafae6d2fae19b8ae13eaae6da0ae070fae18eaaff733ae62aeae62adae4e3eae593cae1b50ae412aae21b3ae2170aeeba0ae1b15a10635ae1b4fae5a55ae7499ae6a6eae6813ae2bccae6d33ae69c1ae2f4d010137ae1b57ae6a6fae627eae5fe9ae628eae62673533c2ae18abe0b2d8aed55fae49dbae1b17ae627cae1b99010148ae2f1dae2f12ae2f14c2bdcdae5b58af8437af47dfae0867ae628cae1b1dae62f2ae195d4b8362ae1b1e4bd24bae69bfae4ef2ae1b9fae7420ae58b4ae6bb8ae1b1f43c957ae098dae1103ae6c210101d7aedb4c010179ae62f0ae6304ae409370c094e80677ae77b7ae77b6ae4f57600039ae11e8ae0d0fafe1a0ae27f5ae741fae59a0ae18e1ae1b0fae62afae8955ae1b0048d922e88888e88887ae4d62ae4e4a43c956ae5de3ae54c2af8482ae54c3b3e2c2ae54c4ae54c5ae59330d095dae115cae6268ae2143ae76a6ae4d513b7721ae632143c958ae9d8743c81443c816ae4f4d3aabf4a279c5ae4e04ae85fe3b7617af8420ae62faae62f9e2005bae10f1ae4f4eae279eae34bdae69c043c80643c81575837775862d76e302ae7421ae7423ae518daf3bc23536043591c98016e5507f8aae44c98016e64aec62457c04477f953b7660ae6d8aae7815ae7814ae77a571ff4248da46ae4513ae1b0248d90434165406a24b4a34e8ae4e4bae0dc1aed33487c40bae6b6c76602aae4de043c81707037ee40086702c6dae63cfae1b03aec6ac43c818aed56b0d09e8a79b150d0998ae1b0da9add6407d90ae4e4dae1b04ae1b0e4b822933fff2af875aad237935360a45f45d43c88a46815646815dae4bf843c80743c98a43c8193b75f23b75ee3b75f13b75f53b75f83b75fa3b75fb3b75fd46f80315771015771515771714fa3914fbfa14fc0414fc0515fc0c14fc0814fc0a14fc0b14fc0e14fc0f14fc10a7e839af3bdd8a04263b9b0643c81aae18d3af8b3a43c88b43c98bae5e408016ebae7804ae4f5d7586a87586a7af878bae7425af84214b8371348089738a88af848343c81c511122ae4f2bae604b43c98943c81d400edaae6283ae6302ae5c14400eb5ae6266881c10ae625eae6281ae62a1ae62ff400ea2afc662400edc43c6cf71035fae630071038214fc0c14fc110d003fae574eae743480152202016b447d39400ed3ae4e3fae6a43af9ba443c81f400eb4400ebc43c6d23f8c79783132ac6bd0ae591b8a0a2943c81343c82043c82106a29e06a23006a23106a23b738a86e483bbe200fd400eb7e40144881bcf7586b68a06598a065a497fa306a23275835cae1b01ae1b05ae1b0c8a065b3b75ef3b75f33b75f63b75f93b75fc3b75fe710409ae5c3615771215770e15770c15771315771415771615771814fa3b800e3b783162ae6a440700bbaeeb9e7103a28a067cae1b06ae1b0b447d4eae1b58ae57cfaeeba5ae00f74b836135918e447d3545f4688a067d06a2344b83a4ae5e6d06a23eae540471031902016615771914fc09ae77bdaf9904447d598a067e06a23506a23f881c09ae51713ea427ae5770ae5767ae1b07ae5769ae576fae2f35ae2f3143c95bae77bb06a236710366710318881bb7ae77bc06a23789900506a23cae576c71f5d07832037a442cae1b08ae6a45ae5e7daf0a4c15cd2806a23806a23dae45c6ae1b0aae1b5aae1b9bae1ba080150b683d00ae576d7586f5ae5e6e0ac31e06a2393b75b933fcb1ae69cfae4c1906a233ae1b0906a29fae1afa06a290ae5e6bae5e6cae1b80ae1b8aae576eae1b60ae1b6cae1b72aedaacae1b7aae1b7bb1e7ac06a23a7a442dae62edae576a800e38ae5e67b1e877e200f906a22906a22c080010ae2bc5ae5e6806a22f06a22be847fcae62fbae630a3b7f740428daae5e6606a22eae630906a22a706047ae6ceeae51f2ae2795ae4ef5ae043fae0abdad5caa06a22dae6a46aeebabae588dae521f02c540af53a4ae63d1ae62b98a0a47ac5ba3ae60f9881bd1881bb47103abafa162aee731ae62507a4298ae54c0ae05a28a0a483b7bd28006b23b7fbcae1afcae1b62ae1b6fae1b73ae1b7cae1b81ae6292ae62964682e6ae630dae630caef04739913bae627baec2f2ae20a0ae57640acb790acb770acb7887cdf4ae69ccae6176ae5992aeffc47cfa74ae509eae509daf2ec0af3378af1a94aef8b333fcb8ae1688ae597e096025ad5af4a9a196ae751f8016e7ae4f243aab8baba78cac0a69ae195eadff6dae00e2ae4c09ae2bc2ae77b2ae77b1ae77b0ae77adae77abae77acae77a83b7f8b3b7fde3aaafaae17ce43c878ae64c8ae77b4ae77afae77aaaebe960d5430702c6cae1ae2ae4ef80d0a220d6118adffb1ae77b3ae77aeae5255ae77a9ae19a9af8026ae23aea08cfcae5127a1b9fcae1ae4881bd4881bd2ae520dc2c377ae1ae5010057ae621fae7424ae7422af4fa800856b0d064f7103acae1ae6a053fdafe1be71ff7baf9e53ae6293ae6297aef94d4b8412adfe8cae1ae7ae5212ae6aacae743e505c07ae1ae180062a71031d71031baf4fa13acbb1881bd3505c08505c0971031633ffef33fff333ffe333ffe1ae58074a34ea010024896c4f4b85cbae1aff80058508001f0d064e0d064d0d06507a43f075026d48ad0748ad0633fff1ae5c7e717c9f33ffe071f4f1010230ae4d5d68324f04200a06a03806a05a4984c233fff033ffed0d087aae4caf33ffeaae4bfe0c404fae4e6c71f4f3ae20fa3593d98a0a2cae4b444810f633ffe88a0429ae6edb3b7ba871033d0ac7c833ffe78a0424ae9a98e8cfc8ae5938aeede98a041daf84de33ffe2ae4bf98a070671f4f93b75a70be2b07a43ef78c5ac71f005af8db748da96ae81bfaf4f60a24e31aee8a1c2b323ae5803ae1b8450042f407d8faf8447ae1b65ae1b764b8c2e4bd2b20641e16008018a0a3f0983a1ae61bbae540eaf4f364ba674407dfc044037a0e824a134a60900f5ae61bcae61baa3bbabae60faae540f881bd5468101710320a6d58b14fc1714fc16b1e7a1038f42a967be0386133b7b8a71f007ae6105ae1b66ae1b78ae1b85c2b201c2c36dab87c170c056038ffe038f47038f45ae6244ae60fd038f46038fffae1b67ae1b79ae1b87a9aa6bae5c44ae5c21ae5c22ae5c2dae5c2eae5c2fae5c30ae5c31ae5c32ae5c33ae5c37ae5c38ae5c39ae5c3bae5c3dae5c40ae5c48038615038f4aae5c23ae5c3eae5c41ae5c49ae5c4caae8e0ae5e647103923b7766ae77c33b77653aab8fae53da8002d8ae239fafab96adff3badff3aae5c24ae5c3fae5c42ae5c4aae5c5071f0003b9bd5af9b75ae5c53adff3dae5c25ae5c43ae5c4bae5c51896c1cae1b6871f4edae1b88ae407371f00102c5443f992bae501dae5c26e4955571f5ea71f4c971f4c171f4ee71f4cf71f65c71f4cb71f4ca71f4c771f4c271f4c371f4c571f4c671f4c471f4c871f4cc71f4cd71f4ce71f4d071f4d471f4d571f4d671f4d771f64d71f4d871f4d971f4db71f4dc71f64a71fc0571f4dd71f4de71f4df71f4e171f4e271f4e071f4e371f4e571f4e671f4e771f4e871f4e971f4ea71f4eb71f4ec71f4d171f4da71f4e4728520ae5c27ae5c45ae5c4dae5c52717cbcae60feaf653171f4d271f4f571f4fa71f40071f40171f40271f403ae5c46ae5c4eae0e82728521ae1b6aae1b89ae60fbae24eaaf6ec3ae6100ae6102ae6104ae274fae4aecae62463aab84ae5c4fafbfee71f4d3ae6bdaae2383ae6057ae62efae63d7ae1afdae1b5dae1b5eae1b5fae1b63ae1b6bae1b7eae1b82ae1b83af3f84ae5f88af05d9ae53e1ae6233ae5616ae1c03ae5b5fae6243ae5228ae5bf671f267ae6d0668324daee660aeea98ae6103adfee1ae4d28ae5e5aae5e5baf841caf4faaae470e0d0bf2ae62aaae62fdae62fe7806fdae6311ae44f7ae6313717ca6ae6412af0930ae3341afa189ae6277ae1aecaf5356ae6dcbaaec2445f462ae6edcae23ab780039ae5e617a43f1ae5706ae23acae56f6ae23aaae6606ae517bae6055ae6bcbae23adae4e69ae4e62ae4e653aab97ae4e67ae742eae568c14fc1214fc1314fc1414fc15151d41151d42ae4e66155bd0155bea155beb14f113147991148000152a8d152c29152c2d152baf152ba97324e57324e17324e37324e47324e67500d5467807ae4130ae2769ae1b31ae6291ae6295ae6301af266f46782d46782eae651e80069baf231333ffe6ae6c2370002f46784746781246781346781d46783744f0e148d882ae26eeae6000ae7428ae49ad43c81eae4f8104c1e8ae5f1bae6993084003ae5f1c084004ae5f1dae4ae4be09c0728135ae779bae03fc06804eae779c76603571f006ae6242ae6241ae1b32467808e40123ae0cb0ae570746784446781446782046782f46783844f12104c1e9ae1b3300fe05ae624f467809467843ae694aae6994ae5f1e46781546782146783087c8570703fa71f251881b798a042380152004c20e3591853593d4447d2d3b7f76447d5571f88846783a04c1eaafb23e3b76a346780a46784246781646782246783171f253447d66ae5f24ae5f1fae6790ae1b3446780c46784146781746782346783246783baece5dae604aae77f64b83b5ae77f5ae591cafc65fafb89cae9f44800314800e0c800dbe800315aff006ae591eaec91f46780d467818ae1b71ae74554678244678333d9340800e0e447d0b728523ae17c5ae1b3546783cae591f0d07d571035ce4993d477fb6881bd771f2d3ae5606ae591aae5916e9019171f003ae5915ae53edae53f9ae1b3609008846781946782646783446783d71f008ae1b3746780f884803e200dde0164546781a467827467835ae6b7dae63d0ae742aaf662d89630246783e71f00271f009ae59170a404bae4ecb0180003aaae4884009896c45ae63d4ae641446781146781b46782946783646783f45f461ae5a16ae5a10738bf5ae6410ae6415ae6416ae53b7ae53b0ae53c0ae53c2ae53a9ae1afe46780bae63d546782aae6411467840ae0f9245f463ae6417ae53b1ae53baae53c4ae53a8ae53aaae1b39ae1b64ae1b75ae1b7fae1b8bae1b9dae1ba10e1838ae53bbae53c5ae617fae53abae17f80360b2ae1b2dae1b203aaaee3aaadf3aaadb467839ae5bf7ae63d6ae6418ae5bf8ae53b20800ccae5bfcae1b25afb721ae1b2bae1b2eae1b10ae1b12af3df3ae1b21ae1b26ae1b2cae1b1171f14eae5bfaae5bfdae6419ae53b3ae53bcaa0cf5ae53c6ae53acaea9f6ae53b4881bb6adff95ae0de4ae53beae440bae53c7ae53adae0a5fae4409ae53a4ae1b59ae4f0aae640bae0f0cae1b27aeeba4ae77cbac817fac810fac738fa4d9aaae6320af6bcbae1b23aefc4dae53b5ae53bfae53c8aedaa643c5c5ae5f20ae53ae485920ae640c710002ae1b28ae1b2fae1b13ae5de0ae5de1ae2480ae24817cfb0bae2483ae53c9ae53afae640dae55a2a444d6af2a7aae5f21084017ae55a1c2b59971f09eae5e6371f14571f142ae4e4971f09dae629bae2484ae2485e483baae5930afffbeae2f45ae2f2cae2080ae159eae15e3030006ae6a57ae53cbae5f22ae53a7ae640e8a0855396084ae56aaa6d0a8ae53ccae640fae7e67ae1b29ae1b1406a3cf894082ae1b24ae6b1b02b26b02b26a89602ba71feca7478eaf8606a6f84aaf8489ae53cdae0956ae742cac9cfeaee737e404094984bf3b7faf33fc973b7771ae6285ae5f23ae53b6fedd2f71f013af50e9af564ba0ec9806a2c3717c73ae53d5ae7817ae5de7ae5de83b9b5cae62f1ae5d23ae62e3ae6303601142ae53dbae62eea9aa23afe21dae1b2aa9adf8896c42aae8d0afb234afb673ae11f4ae4e42ae5bb3b1e7d9ae53e9ae40bcafdfe2afdcd3ae77efae5befae073cae20e8ae20e9ae20f0ae20f1ae20fcae20ffae2100ae6470ae2110ae2117ae211aae211d71f112ae2120515001ae2122ae20e7ae5bebae573071f0d6ae5be9aeffd8a6b8b3ae699f3b776cae20eaae50a8adfec7018047ae20f2ae20feae2102ae2112ae2118ae2121ae20e5ae5bec71fa6caf4f43ae562faf3bde80151fae4bc2a010efae20ebaef51fae62e9ae68d3ae5c15ae2123adff27ae6be5aedaa5ae743fae7440ae23a2ae20ec601861ae20f4ae2104ae20e1ae5133e40113ae5beeae77edae20edae20f3ae2105ae20e0ae59c2c2c007ae1b7d8964c90ac7ea3aac00ae09a9506e18af3c4eae2106ae20e202016a02016735940e3b7fb47a43ed880417ae20efae2109ae211c06a0a2ae5fa6ae210aae6288ae742bae1b30ae1b8dae1b9eaf9ba9ae210bae211fae62c9ae58bcae77eeae629aae210caeda3eae5028ae077168325070604a60181a89629f09cd55ae77f0601819ae210d4713bfae65f30201653b7772ae1b3aae1b3bae1b40af76c5af3d52ae210e6018033b7564ae21033b77c400a272aeeba7ae5937ae2bc0ae0541ae6b54ae1b3cae1b41ae1b93ae1b96ae6b360d83733b77fc5002cbae4a79ae4c07c2b58f0ac8c6ae6d03af3fe93b7fd7ae1b3dae1b42ae1b94ae1b97ae36ea43caee7cfafeafea5f3b7559ae780771f171ae5986ae6bbdadff6bc2b503ae5b3171f106ae6bbcae1b3eae1b43ae1b98896572ae5191c2b409ae4f0bae693eae6248ae5beaae622aae623fae5dbbae4b99ae624a7cfafc7cfaff7cfb00ae5dbaae5db90201a671f2b7ae6171ae0a37ae5df0ae6451ae09afae248c480850ae0ba1ae0e11c032e3af85fcae4a80ae440cae19fcae840faf7645ae6177afd871480886ae51758016edae1b3fae68eaae63d3c2c09d480887ae1b45e847fdae4bafc032e5ae610aae18f970604cc032ecae6d02ae6cffae6d003b75633b7761ae49f6ae4e45ae6d07ae6d0407c001ae6d0571f004afb79f800218800e1b800208c032edae5913ae5920ae5922ae5925ae5926ae1b46ae5928ae6324ae6325c2bf71ae5813ae4c02ae4c03ae4bfcae4bfdae4c00afca17a7e796ae2f40ae5172c032eeae5924ae2f41ae6326ae7498ae6970ae18cbc032f2ae632706a00fae1b47a62a05a97166ab334349844cc032f9ae5201ae4c10ae2353afa161ae5165881bcd738a484810f870c12eaf2567ae2655ae0c4d314c65af3bceaf843ca33d33ae5174ae5176ae517fae5182ae5188ae518aae518eae5190ae5192ae5194ae6bdfaeecf1ae51664b8681ae5173ae5177ae51843b756aae5189ae518cae518fae52204b8268aed554aa0fffae5ddd7cfa97afa55371f020ae5167af0811ae5178ae518571f2e6ae5224ae522baeeaf0aeeba6ae5932ae4e6aae4e6dae4e6e45f467ae6b82ae5e7bae4e3a7cfafdae4e4eae0dd6ae0eeeaf1dccaf1c26ae6ce2ae5f7fae5f7dae5ddbae4e6ba5c52dae512aae5f7ea88e57aaaa7006a01c7cfa93af20a2af1cdbadb8c0ae5168ae5179a1f5f1ae5186ae5ddcae5169ae517aae1b48af83a7afa16ce489baadfdabae5ddec0532cae516aae516bae4e5cae5ddfadff35ae4e53ba4e53e4014087cc05ae1a26ae516c507c4f896c53ae5939ae5934ae9d45aea33caf9a2eae6cecae516dae1c014b9c300e07183b7760ae6386ae516eafa8223aab96a88e473b7763ae4e5d46f593aaecfbc041fec02044c041f5c041fcc041fbae5f84aae7fd485694c041fac0204bc0204cc0204ac02043ae2bcac041f7c02047c032f3ae64deafe89aaf973d7101e203001271010bc041f6c020457101e9b1e50c45f464affa2dae0b17ae5974ae5976aec97e71f0fac041f3af54bbc2b57b894081aeb7f27101953b7769ae8c2402016804200306430c71f01fc2b5a3348088881c684b80173b776eae6a597101f0ae24f3ae24f5ae5e62ae24fc3b7b89afc735afead17a433ac2bf8fae24f6084002af6beeaf3bcfaf78fda3ed57e400d9aa228d738a89881bea7a43eeafb22cae6d6cafa7e9ae24f9ae24fbaf4f46738be8ae6286afdbcc710362ae24faae24fdae6287afa80fafef5fafdaa4896c75ae563aafd81eafe62fae4e50ae4e5eae5886ae4e54ae0778ae50deafb66c71f0dfafdfacae2115ae09b8afa5d371151d71f10caf85c6e49532ae8915ad7069ae4d4dae7b14ae851eae5f87ae5f864aec63ae2111ae2113ae6bbba9ad72aaec6e738bf2ab5ab9ae616dae610cae78054856f3ae7806717cde3b776bae7fffae2399ae2398ae5ba0ae637cae6bc871019bae5bf9aee81fae88a8af3bc6ae6153ae6b1faf987bae22c6ae6183ae617dae617bae617aae614bae6147ae6173ae6175ae6168ae6163ae6155ae613cae613bae613aae5765ae5204e20026afca98afde2cafbab843c575e20027e20025ae61800d81ecb9c2cfae2bc7062f2eaf9e29ae6114ae6113adff85aed556ae2658ae33f73b7620aed558ae53eee2001f6830ed08a081ae6167ae5de9ae1484ae274ec02829ae50feaf9fdfaebb0b1e3c8ac032fac02835c0282cae53d9ae53d7ae5f81ae5f8aae5f8bae56f3c06ccbae6a58ae6a56ae53eba1e9530100d1af9b683b7770c032e4018098ae585dae26f6ae2f2eae92bd3b7b88728522ae4b70ae5211ae4c0ac0282bae53d6ae5f82ae099dae5f8cc02825c02833ae58d73b7b87ae58d4ae58daae58dbc02834c032f8ae5f83ae5170ae517c01008fae517dae58d5ae58dcae58d6ae58ddae1904afc669af6063ae6d6eae58d8af382188436f87c851c2be9587c8523f9640ae16cb87c84fae5e7c87c853ae57dcae3549ae276671ffadae74a0a3293e87c85071ffaf87c854459901ae2f21ae2f20ae2f22ae2f16ae2f1bae2f1cae2f0fae2f0aae2f0cae43e787c855ae53e6ae6dc7ae53e2ae53e887c819ae0c51c2b53fae6dc80ae044ae6d09ae2f173b7f66aed90c87c856ae53e3ae2f1e87c81cae2f0daf85b8af3beaafb21bae2f1fae2f0e87c85887c81dae2f0387c85987c81f3b7764ae53e4ae53ea3b776287c82087c82787c82a87c82c87c82d87c82f87c8304243fd87c8338960b4459902ae53e56830a53b776daf3294ae53e7ae04efc2af77aeac73ae7de7497cd5ae53f4ae53f6ae5e60ae53f74b83684b83644b8365c2af9fae0cceae23afae23a3c02828ae6d6ac032f4c0282aaed0950acc67ae4b7c497fa487cdf3afca20ae23a4c02820afb9daae5f90a68b92ae01d371032cae586aae6d08ae23a5af486aae23a6a60693aee4e4ae23a73b7767ae18fcae59144b8b32ae6d69ae6cefae4bc0ae4bc1ae4bc3af532a7cfb0c89636eae23a8ae2f34ae4bc4ae23a9ae4bc57586faab009dae50f0aaf443ae4bc6ae6b23ae77f1ae0d3fa0299ea1bbe571f01aaada4cae086c71f01bae00efaafaaaae0862ae0864ae0870adff20ae4e3cae0400ae10e4ae291fae60f8ae7433af080eae0cfcae4bc7ae0866ae086dae0871adff19ae4e3dae6dccae6b8dae53deae53dfae6314ae631543c6a9aed8afae49d7ae086eae0872adff1eaf6379706049ae4bc8ae0873ae4bd8af0fd0ae4bc9aff00eae53f33b7768ae0876ae53dd4b90300900b5ae53dc717ca706a0013b775faf3bbeae2739ae5f4aae5669c032efc2c2ebae1bfeaf476eae0c30c041efc0282dc06ce0c082f060182589404d3b77d43b776aa73d39ae40717cfaa8ae4c0cae4c0baefb00ae55c9ae55ccae5526ae55ffae5704ae572dae572aae572fae6a00ae6d70ae6d6f042088ae4e8bae2387ae69c6ae69d0ae5705ae572bae4e8c71154aaf63f57101e3717c7989407faab59571f2a1ae2bd0c2be27ae169faf9b733b9b19ae66083b77ac0201c80201c9ae74560200ba0c405c0c405aaf7f780200bd0200c002018e0200c30200c20201a90201aa02014dae77f4af0a53afca1f02018f020192020194020161020181ae7431ae23640b4354af0db60b4150af4f2faef1c78962647060243b775e600be9ae69d2a808e7a7f654a983a3a97feca97c35a81055a30beca23027ae53f2aff785af6164ae08c30201900201930200be0201ad02014f020195ae1985a80c9e3b775ba7fa0b717cb53b76b0896636710334a7f29d0201910201ae02015eaaf024ae52374b8410020074ae4c01ae5935ae593bae61540c405b600bc0894049a022e54b8c4b600be8600bc43b7522a2fad10201520201534678ac3534480d082c07037dae5b9dc053257586f6881762881764881766800f21800f2b800f25800f24800f2a800f13800f10800e3d80028280028e80028880028980028a800280800283800dc4800dc280148280148380148a800e648007a08007a2507f9e4b838280034a80035080035a80075880078880075a80075b400ebd7586f47586f7881761881763881765881767800f28800f2d800f1480028480028102014ca7a2be3b7566800285801484800e658007a180034980034b80035180035b80075980078980028d80028b80075c80078a80075da43bea800f29800f15800286af486f801485800e6680034c80035280035c801486800e6780034d80035380035d80078b80075e60183e71022bc2b5cb0c21d0e4a32e801487800e6880034e80035480078c80075fa56a0060185a8a042580148880035580078d3b75694246a970604b7101905003eb3b75dd80034f80035671152a48448c6008078003578940148003588960b1ae182d8a0705aff79eae182faff005ae1aafaf6b67ae198eae7808af65cc800359aaf34cae182eae1ab0ae1ab2ae1ab371f0f7afb8a2ae6cf0ae4a01711516896571aed0d7ae4c084b83b04b83a6ae630bae630fe200fe71f027ae6cb2a7c0f23b762106a0213b7567ae1ab1ae1ab43b776f3b75a802000f3b75453b756b3b75420420015160018940c07101e73b7568502fab502fac4b8331507c537103334246b14599034599048940c8a21be11d3340";
var MILITARY_HEX_SET = new Set(
  Array.from({ length: _HEX_PACKED.length / 6 }, (_, i) => _HEX_PACKED.slice(i * 6, i * 6 + 6))
);
function isMilitaryHex(hexId) {
  if (!hexId) return false;
  return MILITARY_HEX_SET.has(String(hexId).replace(/^~/, "").toLowerCase());
}
var MILITARY_PREFIXES = [
  "RCH",
  "REACH",
  "MOOSE",
  "EVAC",
  "DUSTOFF",
  "PEDRO",
  "DUKE",
  "HAVOC",
  "KNIFE",
  "WARHAWK",
  "VIPER",
  "RAGE",
  "FURY",
  "SHELL",
  "TEXACO",
  "ARCO",
  "ESSO",
  "PETRO",
  "SENTRY",
  "AWACS",
  "MAGIC",
  "DISCO",
  "DARKSTAR",
  "COBRA",
  "PYTHON",
  "RAPTOR",
  "EAGLE",
  "HAWK",
  "TALON",
  "BOXER",
  "OMNI",
  "TOPCAT",
  "SKULL",
  "REAPER",
  "HUNTER",
  "ARMY",
  "NAVY",
  "USAF",
  "USMC",
  "USCG",
  "CNV",
  "EXEC",
  "NATO",
  "GAF",
  "RRF",
  "RAF",
  "FAF",
  "IAF",
  "RNLAF",
  "BAF",
  "DAF",
  "HAF",
  "PAF",
  "SWORD",
  "LANCE",
  "ARROW",
  "SPARTAN",
  "RSAF",
  "EMIRI",
  "UAEAF",
  "KAF",
  "QAF",
  "BAHAF",
  "OMAAF",
  "IRIAF",
  "IRGC",
  "TUAF",
  "RSD",
  "RFF",
  "VKS",
  "CHN",
  "PLAAF",
  "PLA"
];
var SHORT_MILITARY_PREFIXES = ["AE", "RF", "TF", "PAT", "SAM", "OPS", "CTF", "IRG", "TAF"];
var AIRLINE_CODES = /* @__PURE__ */ new Set([
  "SVA",
  "QTR",
  "THY",
  "UAE",
  "ETD",
  "GFA",
  "MEA",
  "RJA",
  "KAC",
  "ELY",
  "IAW",
  "IRA",
  "MSR",
  "SYR",
  "PGT",
  "AXB",
  "FDB",
  "KNE",
  "FAD",
  "ADY",
  "OMA",
  "ABQ",
  "ABY",
  "NIA",
  "FJA",
  "SWR",
  "HZA",
  "OMS",
  "EGF",
  "NOS",
  "SXD",
  "BAW",
  "AFR",
  "DLH",
  "KLM",
  "AUA",
  "SAS",
  "FIN",
  "LOT",
  "AZA",
  "TAP",
  "IBE",
  "VLG",
  "RYR",
  "EZY",
  "WZZ",
  "NOZ",
  "BEL",
  "AEE",
  "ROT",
  "AIC",
  "CPA",
  "SIA",
  "MAS",
  "THA",
  "VNM",
  "JAL",
  "ANA",
  "KAL",
  "AAR",
  "EVA",
  "CAL",
  "CCA",
  "CES",
  "CSN",
  "HDA",
  "CHH",
  "CXA",
  "GIA",
  "PAL",
  "SLK",
  "AAL",
  "DAL",
  "UAL",
  "SWA",
  "JBU",
  "FFT",
  "ASA",
  "NKS",
  "WJA",
  "ACA",
  "FDX",
  "UPS",
  "GTI",
  "ABW",
  "CLX",
  "MPH",
  "AIR",
  "SKY",
  "JET"
]);
function isMilitaryCallsign(callsign) {
  if (!callsign) return false;
  const cs = callsign.toUpperCase().trim();
  for (const prefix of MILITARY_PREFIXES) {
    if (cs.startsWith(prefix)) return true;
  }
  for (const prefix of SHORT_MILITARY_PREFIXES) {
    if (cs.startsWith(prefix) && cs.length > prefix.length && /\d/.test(cs.charAt(prefix.length))) return true;
  }
  if (/^[A-Z]{3}\d{1,2}$/.test(cs)) {
    const prefix = cs.slice(0, 3);
    if (!AIRLINE_CODES.has(prefix)) return true;
  }
  return false;
}
function detectAircraftType(callsign) {
  if (!callsign) return "unknown";
  const cs = callsign.toUpperCase().trim();
  if (/^(SHELL|TEXACO|ARCO|ESSO|PETRO|KC|STRAT)/.test(cs)) return "tanker";
  if (/^(SENTRY|AWACS|MAGIC|DISCO|DARKSTAR|E3|E8|E6)/.test(cs)) return "awacs";
  if (/^(RCH|REACH|MOOSE|EVAC|DUSTOFF|C17|C5|C130|C40)/.test(cs)) return "transport";
  if (/^(HOMER|OLIVE|JAKE|PSEUDO|GORDO|RC|U2|SR)/.test(cs)) return "reconnaissance";
  if (/^(RQ|MQ|REAPER|PREDATOR|GLOBAL)/.test(cs)) return "drone";
  if (/^(DEATH|BONE|DOOM|B52|B1|B2)/.test(cs)) return "bomber";
  return "unknown";
}
var UPSTREAM_TIMEOUT_MS = 2e4;
function mapWingbitsDetails(icao24, data) {
  return {
    icao24,
    registration: String(data.registration ?? ""),
    manufacturerIcao: String(data.manufacturerIcao ?? ""),
    manufacturerName: String(data.manufacturerName ?? ""),
    model: String(data.model ?? ""),
    typecode: String(data.typecode ?? ""),
    serialNumber: String(data.serialNumber ?? ""),
    icaoAircraftType: String(data.icaoAircraftType ?? ""),
    operator: String(data.operator ?? ""),
    operatorCallsign: String(data.operatorCallsign ?? ""),
    operatorIcao: String(data.operatorIcao ?? ""),
    owner: String(data.owner ?? ""),
    built: String(data.built ?? ""),
    engines: String(data.engines ?? ""),
    categoryDescription: String(data.categoryDescription ?? "")
  };
}

// server/worldmonitor/military/v1/list-military-flights.ts
init_redis();

// server/_shared/constants.ts
var CHROME_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var YAHOO_MIN_GAP_MS = process.env.NODE_TEST_CONTEXT ? 1 : 600;
var yahooQueue = Promise.resolve();
var FINNHUB_MIN_GAP_MS = process.env.NODE_TEST_CONTEXT ? 1 : 350;
var finnhubQueue = Promise.resolve();

// server/_shared/relay.ts
function getRelayBaseUrl() {
  const relayUrl = process.env.WS_RELAY_URL;
  if (!relayUrl) return null;
  return relayUrl.replace(/^ws(s?):\/\//, "http$1://").replace(/\/$/, "");
}
function getRelayHeaders(extra = {}) {
  const headers = {
    Accept: "application/json",
    "User-Agent": CHROME_UA,
    ...extra
  };
  const relaySecret = process.env.RELAY_SHARED_SECRET;
  if (!relaySecret) return headers;
  const relayHeader = (process.env.RELAY_AUTH_HEADER || "x-relay-key").toLowerCase();
  headers[relayHeader] = relaySecret;
  if (relayHeader !== "authorization") {
    headers.Authorization = `Bearer ${relaySecret}`;
  }
  return headers;
}

// server/worldmonitor/military/v1/list-military-flights.ts
var REDIS_CACHE_KEY = "military:flights:v1";
var REDIS_CACHE_TTL = 600;
var REDIS_STALE_KEY = "military:flights:stale:v1";
var STABLE_STALE_CACHE_KEY = "military:flights:stable-stale:v1";
var STALE_SNAPSHOT_CACHE_TTL = 120;
var STALE_SNAPSHOT_NEG_TTL = 30;
var quantize = (v, step) => Math.round(v / step) * step;
var clamp = (v, min, max) => Math.min(max, Math.max(min, v));
var BBOX_GRID_STEP = 1;
var GLOBAL_COVERAGE = [
  { south: -90, north: 90, west: -180, east: 180 }
];
var REGIONAL_COVERAGE = [
  { south: 10, north: 46, west: 107, east: 143 },
  { south: 13, north: 85, west: -10, east: 57 }
];
function seedCovers(coverage, bounds) {
  const regions = coverage === "global" ? GLOBAL_COVERAGE : REGIONAL_COVERAGE;
  return regions.some(
    (region) => region.south <= bounds.south && region.north >= bounds.north && region.west <= bounds.west && region.east >= bounds.east
  );
}
function normalizeBounds(req) {
  return {
    south: Math.min(req.swLat, req.neLat),
    north: Math.max(req.swLat, req.neLat),
    west: Math.min(req.swLon, req.neLon),
    east: Math.max(req.swLon, req.neLon)
  };
}
function filterFlightsToBounds(flights, bounds) {
  return flights.filter((flight) => {
    const lat = flight.location?.latitude;
    const lon = flight.location?.longitude;
    if (lat == null || lon == null) return false;
    return lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east;
  });
}
var DEFAULT_PAGE_SIZE = 100;
var MAX_PAGE_SIZE = 100;
function resolvePageSize(pageSize) {
  if (typeof pageSize !== "number" || !Number.isInteger(pageSize) || pageSize <= 0) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(pageSize, MAX_PAGE_SIZE);
}
function resolveOffset(cursor) {
  if (typeof cursor !== "string" || !/^\d+$/.test(cursor)) return 0;
  const offset = Number(cursor);
  return Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
}
function emptyResponse() {
  return { flights: [], clusters: [], pagination: { nextCursor: "", totalCount: 0 } };
}
function buildCacheKey(req) {
  const quantizedBB = [
    quantize(req.swLat, BBOX_GRID_STEP),
    quantize(req.swLon, BBOX_GRID_STEP),
    quantize(req.neLat, BBOX_GRID_STEP),
    quantize(req.neLon, BBOX_GRID_STEP)
  ].join(":");
  return `${REDIS_CACHE_KEY}:${quantizedBB}:${req.operator || ""}:${req.aircraftType || ""}`;
}
function paginateResponse(flights, clusters, bounds, req) {
  const filtered = filterFlightsToBounds(flights, bounds);
  const pageSize = resolvePageSize(req.pageSize);
  const offset = resolveOffset(req.cursor);
  const page = filtered.slice(offset, offset + pageSize);
  const nextOffset = offset + page.length;
  const nextCursor = nextOffset < filtered.length ? String(nextOffset) : "";
  return {
    flights: page,
    clusters: clusters ?? [],
    pagination: { nextCursor, totalCount: filtered.length }
  };
}
var AIRCRAFT_TYPE_MAP = {
  tanker: "MILITARY_AIRCRAFT_TYPE_TANKER",
  awacs: "MILITARY_AIRCRAFT_TYPE_AWACS",
  transport: "MILITARY_AIRCRAFT_TYPE_TRANSPORT",
  reconnaissance: "MILITARY_AIRCRAFT_TYPE_RECONNAISSANCE",
  drone: "MILITARY_AIRCRAFT_TYPE_DRONE",
  bomber: "MILITARY_AIRCRAFT_TYPE_BOMBER",
  fighter: "MILITARY_AIRCRAFT_TYPE_FIGHTER",
  helicopter: "MILITARY_AIRCRAFT_TYPE_HELICOPTER",
  vip: "MILITARY_AIRCRAFT_TYPE_VIP",
  special_ops: "MILITARY_AIRCRAFT_TYPE_SPECIAL_OPS"
};
var OPERATOR_MAP = {
  usaf: "MILITARY_OPERATOR_USAF",
  raf: "MILITARY_OPERATOR_RAF",
  faf: "MILITARY_OPERATOR_FAF",
  gaf: "MILITARY_OPERATOR_GAF",
  iaf: "MILITARY_OPERATOR_IAF",
  nato: "MILITARY_OPERATOR_NATO",
  other: "MILITARY_OPERATOR_OTHER"
};
var CONFIDENCE_MAP = {
  high: "MILITARY_CONFIDENCE_HIGH",
  medium: "MILITARY_CONFIDENCE_MEDIUM",
  low: "MILITARY_CONFIDENCE_LOW"
};
function seedToProto(f) {
  if (f.lat == null || f.lon == null) return null;
  const icao = (f.hexCode || f.id || "").toUpperCase();
  if (!icao) return null;
  return {
    id: (f.id || icao).trim(),
    callsign: (f.callsign || "").trim(),
    hexCode: icao,
    registration: f.registration || "",
    aircraftType: AIRCRAFT_TYPE_MAP[f.aircraftType || ""] || "MILITARY_AIRCRAFT_TYPE_UNKNOWN",
    aircraftModel: f.aircraftModel || "",
    operator: OPERATOR_MAP[f.operator || ""] || "MILITARY_OPERATOR_OTHER",
    operatorCountry: f.operatorCountry || "",
    location: { latitude: f.lat, longitude: f.lon },
    altitude: f.altitude ?? 0,
    heading: f.heading ?? 0,
    speed: f.speed ?? 0,
    verticalRate: f.verticalRate ?? 0,
    onGround: f.onGround ?? false,
    squawk: f.squawk || "",
    origin: f.origin || "",
    destination: f.destination || "",
    lastSeenAt: f.lastSeenMs ?? Date.now(),
    firstSeenAt: f.firstSeenMs ?? 0,
    confidence: CONFIDENCE_MAP[f.confidence || ""] || "MILITARY_CONFIDENCE_LOW",
    isInteresting: f.isInteresting ?? false,
    note: f.note || "",
    enrichment: void 0,
    source: f.sourceMeta?.source || ""
  };
}
function seedPayloadToProto(raw) {
  if (!raw || !Array.isArray(raw.flights)) return null;
  if (raw.flights.length === 0) return [];
  const flights = raw.flights.map(seedToProto).filter((flight) => flight != null);
  return flights.length > 0 ? flights : null;
}
var LIVE_SEED_NEG_TTL_MS = 3e4;
var liveSeedNegUntil = 0;
var liveSeedNegStatus = "miss";
var liveSeedReadPromise = null;
async function fetchLiveSeedSnapshot() {
  const now = Date.now();
  if (now < liveSeedNegUntil) return { status: liveSeedNegStatus };
  if (liveSeedReadPromise) return liveSeedReadPromise;
  liveSeedReadPromise = (async () => {
    const read = await readCachedJson(REDIS_CACHE_KEY, true);
    if (read.status === "error") {
      liveSeedNegStatus = "error";
      liveSeedNegUntil = now + LIVE_SEED_NEG_TTL_MS;
      return { status: "error" };
    }
    const payload = read.status === "hit" ? read.value : null;
    const flights = payload ? seedPayloadToProto(payload) : null;
    if (flights === null) {
      liveSeedNegStatus = "miss";
      liveSeedNegUntil = now + LIVE_SEED_NEG_TTL_MS;
      return { status: "miss" };
    }
    const coverage = payload?.coverage === "global" ? "global" : "regional";
    return { status: "hit", flights, coverage };
  })();
  try {
    return await liveSeedReadPromise;
  } finally {
    liveSeedReadPromise = null;
  }
}
var STALE_NEG_TTL_MS = 3e4;
var staleNegUntil = 0;
var staleSnapshotLocalCache = null;
var staleSnapshotInflight = null;
async function fetchStaleFallback() {
  const now = Date.now();
  if (now < staleNegUntil) return null;
  try {
    const raw = await getRawJson(REDIS_STALE_KEY);
    const flights = seedPayloadToProto(raw);
    if (!flights || flights.length === 0) {
      staleNegUntil = now + STALE_NEG_TTL_MS;
      return null;
    }
    return {
      flights,
      coverage: raw?.coverage === "global" ? "global" : "regional"
    };
  } catch {
    staleNegUntil = now + STALE_NEG_TTL_MS;
    return null;
  }
}
function parseStaleSnapshotCacheEntry(value) {
  if (!value || typeof value !== "object") return null;
  const entry = value;
  if (entry.status === "miss") return { status: "miss" };
  if (entry.status !== "hit" || !entry.result || !Array.isArray(entry.result.flights) || entry.coverage !== "global" && entry.coverage !== "regional") return null;
  return { status: "hit", result: entry.result, coverage: entry.coverage };
}
function staleResultForBounds(entry, requestBounds) {
  if (entry.status !== "hit") return null;
  if (seedCovers(entry.coverage, requestBounds)) return entry.result;
  const isGlobalRequest = requestBounds.south === -90 && requestBounds.north === 90 && requestBounds.west === -180 && requestBounds.east === 180;
  return isGlobalRequest ? entry.result : null;
}
async function fetchStableStaleSnapshot(requestBounds) {
  const now = Date.now();
  const local = staleSnapshotLocalCache;
  if (local && local.expiresAt > now) {
    return staleResultForBounds(local.entry, requestBounds);
  }
  staleSnapshotLocalCache = null;
  const existing = staleSnapshotInflight;
  if (existing) {
    const entry2 = await existing;
    return staleResultForBounds(entry2, requestBounds);
  }
  const promise = (async () => {
    const cached = await readCachedJson(STABLE_STALE_CACHE_KEY);
    if (cached.status === "hit") {
      const entry3 = parseStaleSnapshotCacheEntry(cached.value);
      if (entry3) {
        const ttl2 = entry3.status === "hit" ? STALE_SNAPSHOT_CACHE_TTL : STALE_SNAPSHOT_NEG_TTL;
        staleSnapshotLocalCache = { entry: entry3, expiresAt: Date.now() + ttl2 * 1e3 };
        return entry3;
      }
    }
    const stale = await fetchStaleFallback();
    const entry2 = stale ? {
      status: "hit",
      result: { flights: stale.flights, clusters: [], pagination: void 0 },
      coverage: stale.coverage
    } : { status: "miss" };
    const ttl = entry2.status === "hit" ? STALE_SNAPSHOT_CACHE_TTL : STALE_SNAPSHOT_NEG_TTL;
    staleSnapshotLocalCache = { entry: entry2, expiresAt: Date.now() + ttl * 1e3 };
    await setCachedJson(STABLE_STALE_CACHE_KEY, entry2, ttl);
    return entry2;
  })().finally(() => {
    staleSnapshotInflight = null;
  });
  staleSnapshotInflight = promise;
  const entry = await promise;
  return staleResultForBounds(entry, requestBounds);
}
async function listMilitaryFlights(ctx, req) {
  try {
    if (!req.neLat && !req.neLon && !req.swLat && !req.swLon) return emptyResponse();
    const requestBounds = normalizeBounds(req);
    const cacheKey = buildCacheKey(req);
    const fullResult = await cachedFetchJson(
      cacheKey,
      REDIS_CACHE_TTL,
      async () => {
        const seeded = await fetchLiveSeedSnapshot();
        if (seeded.status === "error") {
          throw new Error("military live seed read failed");
        }
        if (seeded.status === "hit" && seedCovers(seeded.coverage, requestBounds)) {
          return { flights: seeded.flights, clusters: [], pagination: void 0 };
        }
        const isSidecar = (process.env.LOCAL_API_MODE || "").includes("sidecar");
        const relayBase = isSidecar ? null : getRelayBaseUrl();
        const baseUrl = isSidecar ? "https://opensky-network.org/api/states/all" : relayBase ? relayBase + "/opensky" : null;
        if (!baseUrl) return null;
        const fetchBB = {
          lamin: clamp(quantize(req.swLat, BBOX_GRID_STEP) - BBOX_GRID_STEP / 2, -90, 90),
          lamax: clamp(quantize(req.neLat, BBOX_GRID_STEP) + BBOX_GRID_STEP / 2, -90, 90),
          lomin: clamp(quantize(req.swLon, BBOX_GRID_STEP) - BBOX_GRID_STEP / 2, -180, 180),
          lomax: clamp(quantize(req.neLon, BBOX_GRID_STEP) + BBOX_GRID_STEP / 2, -180, 180)
        };
        const params = new URLSearchParams();
        params.set("lamin", String(fetchBB.lamin));
        params.set("lamax", String(fetchBB.lamax));
        params.set("lomin", String(fetchBB.lomin));
        params.set("lomax", String(fetchBB.lomax));
        const url = `${baseUrl}${params.toString() ? "?" + params.toString() : ""}`;
        const resp = await fetch(url, {
          headers: getRelayHeaders(),
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (!data.states) return null;
        const flights = [];
        for (const state of data.states) {
          const [icao24, callsign, , , , lon, lat, altitude, onGround, velocity, heading, verticalRate] = state;
          if (lat == null || lon == null || onGround) continue;
          if (!isMilitaryCallsign(callsign) && !isMilitaryHex(icao24)) continue;
          const aircraftType = detectAircraftType(callsign);
          const hex = icao24.toUpperCase();
          flights.push({
            id: hex,
            callsign: (callsign || "").trim(),
            hexCode: hex,
            registration: "",
            aircraftType: AIRCRAFT_TYPE_MAP[aircraftType] || "MILITARY_AIRCRAFT_TYPE_UNKNOWN",
            aircraftModel: "",
            operator: "MILITARY_OPERATOR_OTHER",
            operatorCountry: "",
            location: { latitude: lat, longitude: lon },
            altitude: altitude != null ? Math.round(altitude * 3.28084) : 0,
            heading: heading ?? 0,
            speed: velocity != null ? Math.round(velocity * 1.94384) : 0,
            verticalRate: verticalRate != null ? Math.round(verticalRate * 196.85) : 0,
            onGround: false,
            squawk: "",
            origin: "",
            destination: "",
            lastSeenAt: Date.now(),
            firstSeenAt: 0,
            confidence: "MILITARY_CONFIDENCE_LOW",
            isInteresting: false,
            note: "",
            enrichment: void 0,
            source: "opensky"
          });
        }
        return flights.length > 0 ? { flights, clusters: [], pagination: void 0 } : null;
      }
    );
    if (!fullResult) {
      const staleResult = await fetchStableStaleSnapshot(requestBounds);
      if (staleResult) {
        return paginateResponse(staleResult.flights, staleResult.clusters, requestBounds, req);
      }
      markNoCacheResponse(ctx.request);
      return emptyResponse();
    }
    return paginateResponse(fullResult.flights, fullResult.clusters, requestBounds, req);
  } catch {
    const requestBounds = normalizeBounds(req);
    const staleResult = await fetchStableStaleSnapshot(requestBounds);
    if (staleResult) {
      return paginateResponse(staleResult.flights, staleResult.clusters, requestBounds, req);
    }
    markNoCacheResponse(ctx.request);
    return emptyResponse();
  }
}

// server/worldmonitor/military/v1/get-theater-posture.ts
init_redis();
var CACHE_KEY = "theater-posture:sebuf:v1";
var STALE_CACHE_KEY = "theater_posture:sebuf:stale:v1";
var BACKUP_CACHE_KEY = "theater-posture:sebuf:backup:v1";
async function getTheaterPosture(ctx, _req) {
  try {
    const live = await getCachedJson(CACHE_KEY, true);
    if (live?.theaters?.length) return live;
  } catch {
  }
  try {
    const stale = await getCachedJson(STALE_CACHE_KEY, true);
    if (stale?.theaters?.length) return stale;
  } catch {
  }
  try {
    const backup = await getCachedJson(BACKUP_CACHE_KEY, true);
    if (backup?.theaters?.length) return backup;
  } catch {
  }
  return markNoStoreFallbackResponse(ctx.request, { theaters: [] });
}

// server/worldmonitor/military/v1/_wingbits-aircraft-details.ts
var AIRCRAFT_DETAILS_CACHE_KEY = "military:aircraft:v1";
var AIRCRAFT_DETAILS_CACHE_TTL = 24 * 60 * 60;
async function fetchWingbitsAircraftDetails(icao24, apiKey) {
  const resp = await fetch(`https://customer-api.wingbits.com/v1/flights/details/${icao24}`, {
    headers: { "x-api-key": apiKey, Accept: "application/json", "User-Agent": CHROME_UA },
    signal: AbortSignal.timeout(1e4)
  });
  if (resp.status === 404) {
    return { details: null, configured: true };
  }
  if (!resp.ok) return null;
  const data = await resp.json();
  return {
    details: mapWingbitsDetails(icao24, data),
    configured: true
  };
}

// server/worldmonitor/military/v1/get-aircraft-details.ts
init_redis();
async function getAircraftDetails(_ctx, req) {
  if (!req.icao24) return { details: void 0, configured: false };
  const apiKey = process.env.WINGBITS_API_KEY;
  if (!apiKey) return { details: void 0, configured: false };
  const icao24 = req.icao24.toLowerCase();
  const cacheKey = `${AIRCRAFT_DETAILS_CACHE_KEY}:${icao24}`;
  try {
    const result = await cachedFetchJson(
      cacheKey,
      AIRCRAFT_DETAILS_CACHE_TTL,
      async () => fetchWingbitsAircraftDetails(icao24, apiKey)
    );
    if (!result || !result.details) {
      return { details: void 0, configured: true };
    }
    return {
      details: result.details,
      configured: true
    };
  } catch {
    return { details: void 0, configured: true };
  }
}

// server/worldmonitor/military/v1/get-aircraft-details-batch.ts
init_redis();

// server/_shared/normalize-list.ts
function toUniqueSortedLimited(values, limit) {
  return Array.from(new Set(values)).sort().slice(0, limit);
}

// server/_shared/aircraft-details-batch.ts
var AIRCRAFT_DETAILS_BATCH_LIMIT = 10;

// server/worldmonitor/military/v1/get-aircraft-details-batch.ts
async function getAircraftDetailsBatch(_ctx, req) {
  try {
    const apiKey = process.env.WINGBITS_API_KEY;
    if (!apiKey) return { results: {}, fetched: 0, requested: 0, configured: false };
    const normalized = req.icao24s.map((id) => id.trim().toLowerCase()).filter((id) => id.length > 0);
    const limitedList = toUniqueSortedLimited(normalized, AIRCRAFT_DETAILS_BATCH_LIMIT);
    const results = {};
    const toFetch = [];
    const cacheKeys = limitedList.map((icao24) => `${AIRCRAFT_DETAILS_CACHE_KEY}:${icao24}`);
    const cachedMap = await getCachedJsonBatch(cacheKeys);
    for (let i = 0; i < limitedList.length; i++) {
      const icao24 = limitedList[i];
      const cached = cachedMap.get(cacheKeys[i]);
      if (cached && typeof cached === "object" && "details" in cached) {
        const details = cached.details;
        if (details) {
          results[icao24] = details;
        }
      } else {
        toFetch.push(icao24);
      }
    }
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < toFetch.length; i++) {
      const icao24 = toFetch[i];
      const cacheResult = await cachedFetchJson(
        `${AIRCRAFT_DETAILS_CACHE_KEY}:${icao24}`,
        AIRCRAFT_DETAILS_CACHE_TTL,
        async () => {
          try {
            return await fetchWingbitsAircraftDetails(icao24, apiKey);
          } catch {
          }
          return null;
        }
      );
      if (cacheResult?.details) results[icao24] = cacheResult.details;
      if (i < toFetch.length - 1) await delay(100);
    }
    return {
      results,
      fetched: Object.keys(results).length,
      requested: limitedList.length,
      configured: true
    };
  } catch {
    return { results: {}, fetched: 0, requested: 0, configured: true };
  }
}

// server/worldmonitor/military/v1/get-wingbits-status.ts
async function getWingbitsStatus(_ctx, _req) {
  const apiKey = process.env.WINGBITS_API_KEY;
  return { configured: !!apiKey };
}

// server/worldmonitor/military/v1/get-usni-fleet-report.ts
init_redis();
var USNI_CACHE_KEY = "usni-fleet:sebuf:v1";
var USNI_STALE_CACHE_KEY = "usni-fleet:sebuf:stale:v1";
function buildUSNIFleetReportForceRefreshResponse() {
  return {
    report: void 0,
    cached: false,
    stale: false,
    error: "forceRefresh is no longer supported (data is seeded by Railway relay)"
  };
}
function buildUSNIFleetReportCacheResponse(report, stale) {
  if (report) {
    return { report, cached: true, stale: false, error: "" };
  }
  if (stale) {
    return { report: stale, cached: true, stale: true, error: "Using cached data" };
  }
  return {
    report: void 0,
    cached: false,
    stale: false,
    error: "No USNI fleet data in cache (waiting for seed)"
  };
}
async function getUSNIFleetReport(_ctx, req) {
  if (req.forceRefresh) {
    return buildUSNIFleetReportForceRefreshResponse();
  }
  try {
    const report = await getCachedJson(USNI_CACHE_KEY);
    if (report) {
      return buildUSNIFleetReportCacheResponse(report, null);
    }
    const stale = await getCachedJson(USNI_STALE_CACHE_KEY);
    return buildUSNIFleetReportCacheResponse(null, stale);
  } catch (err) {
    const message2 = err instanceof Error ? err.message : String(err);
    console.warn("[USNI Fleet] Error:", message2);
    return { report: void 0, cached: false, stale: false, error: message2 };
  }
}

// shared/openapi-filter-param-contracts.json
var openapi_filter_param_contracts_default = {
  economicBlsSeriesIds: [
    "USPRIV",
    "ECIALLCIV"
  ],
  forecastDomains: [
    "conflict",
    "market",
    "supply_chain",
    "political",
    "military",
    "cyber",
    "infrastructure"
  ],
  infrastructureTemporalBaselineTypes: [
    "military_flights",
    "vessels",
    "protests",
    "news",
    "ais_gaps",
    "satellite_fires"
  ],
  intelligenceChokepointIds: [
    "hormuz_strait",
    "malacca_strait",
    "suez",
    "bab_el_mandeb"
  ],
  intelligenceFuelModes: [
    "oil",
    "gas",
    "both"
  ],
  marketCountryStockIndexes: {
    US: {
      symbol: "^GSPC",
      name: "S&P 500"
    },
    GB: {
      symbol: "^FTSE",
      name: "FTSE 100"
    },
    DE: {
      symbol: "^GDAXI",
      name: "DAX"
    },
    FR: {
      symbol: "^FCHI",
      name: "CAC 40"
    },
    JP: {
      symbol: "^N225",
      name: "Nikkei 225"
    },
    CN: {
      symbol: "000001.SS",
      name: "SSE Composite"
    },
    HK: {
      symbol: "^HSI",
      name: "Hang Seng"
    },
    IN: {
      symbol: "^BSESN",
      name: "BSE Sensex"
    },
    KR: {
      symbol: "^KS11",
      name: "KOSPI"
    },
    TW: {
      symbol: "^TWII",
      name: "TAIEX"
    },
    AU: {
      symbol: "^AXJO",
      name: "ASX 200"
    },
    BR: {
      symbol: "^BVSP",
      name: "Bovespa"
    },
    CA: {
      symbol: "^GSPTSE",
      name: "TSX Composite"
    },
    MX: {
      symbol: "^MXX",
      name: "IPC Mexico"
    },
    AR: {
      symbol: "^MERV",
      name: "MERVAL"
    },
    RU: {
      symbol: "IMOEX.ME",
      name: "MOEX"
    },
    ZA: {
      symbol: "^J203.JO",
      name: "JSE All Share"
    },
    SA: {
      symbol: "^TASI.SR",
      name: "Tadawul"
    },
    AE: {
      symbol: "DFMGI.AE",
      name: "DFM General"
    },
    IL: {
      symbol: "^TA125.TA",
      name: "TA-125"
    },
    TR: {
      symbol: "XU100.IS",
      name: "BIST 100"
    },
    PL: {
      symbol: "^WIG20",
      name: "WIG 20"
    },
    NL: {
      symbol: "^AEX",
      name: "AEX"
    },
    CH: {
      symbol: "^SSMI",
      name: "SMI"
    },
    ES: {
      symbol: "^IBEX",
      name: "IBEX 35"
    },
    IT: {
      symbol: "FTSEMIB.MI",
      name: "FTSE MIB"
    },
    SE: {
      symbol: "^OMX",
      name: "OMX Stockholm 30"
    },
    NO: {
      symbol: "^OSEAX",
      name: "Oslo All Share"
    },
    SG: {
      symbol: "^STI",
      name: "STI"
    },
    TH: {
      symbol: "^SET.BK",
      name: "SET"
    },
    MY: {
      symbol: "^KLSE",
      name: "KLCI"
    },
    ID: {
      symbol: "^JKSE",
      name: "Jakarta Composite"
    },
    PH: {
      symbol: "PSEI.PS",
      name: "PSEi"
    },
    NZ: {
      symbol: "^NZ50",
      name: "NZX 50"
    },
    EG: {
      symbol: "^EGX30.CA",
      name: "EGX 30"
    },
    CL: {
      symbol: "^IPSA",
      name: "IPSA"
    },
    PE: {
      symbol: "^SPBLPGPT",
      name: "S&P Lima"
    },
    AT: {
      symbol: "^ATX",
      name: "ATX"
    },
    BE: {
      symbol: "^BFX",
      name: "BEL 20"
    },
    FI: {
      symbol: "^OMXH25",
      name: "OMX Helsinki 25"
    },
    DK: {
      symbol: "^OMXC25",
      name: "OMX Copenhagen 25"
    },
    IE: {
      symbol: "^ISEQ",
      name: "ISEQ Overall"
    },
    PT: {
      symbol: "^PSI20",
      name: "PSI 20"
    },
    CZ: {
      symbol: "^PX",
      name: "PX Prague"
    },
    HU: {
      symbol: "^BUX",
      name: "BUX"
    }
  },
  militaryBaseTypes: [
    "us-nato",
    "china",
    "russia",
    "uk",
    "france",
    "india",
    "italy",
    "uae",
    "turkey",
    "japan",
    "other"
  ],
  militaryBaseKinds: [
    "base",
    "airfield",
    "naval_base",
    "military",
    "barracks",
    "bunker",
    "trench",
    "training_area",
    "checkpoint",
    "shelter",
    "ammunition",
    "office",
    "obstacle_course",
    "nuclear_explosion_site",
    "range"
  ],
  newsSummarizeArticleCacheKeyPattern: "^summary:v\\d+:[a-z0-9:_-]{3,120}$",
  predictionMarketTechCategories: [
    "ai",
    "tech",
    "crypto",
    "science"
  ],
  predictionMarketFinanceCategories: [
    "economy",
    "fed",
    "inflation",
    "interest-rates",
    "recession",
    "trade",
    "tariffs",
    "debt-ceiling"
  ],
  researchTechEventTypes: [
    "all",
    "conference",
    "earnings",
    "ipo",
    "other"
  ],
  researchHackerNewsFeedTypes: [
    "top",
    "new",
    "best",
    "ask",
    "show",
    "job"
  ],
  tradeComtradeCmdCodePattern: "^\\d{4,6}$"
};

// server/worldmonitor/military/v1/list-military-bases.ts
init_redis();
var VALID_TYPES = new Set(openapi_filter_param_contracts_default.militaryBaseTypes);
var VALID_KINDS = new Set(openapi_filter_param_contracts_default.militaryBaseKinds);
var COUNTRY_RE = /^[A-Z]{2}$/;
var quantize2 = (v, step) => Math.round(v / step) * step;
var MAX_FILTER_LENGTH = 20;
function normalizeOptionalFilter(value, transform2) {
  if (!value) return "";
  return transform2(value).trim().slice(0, MAX_FILTER_LENGTH);
}
function getBboxGridStep(zoom) {
  if (zoom < 5) return 5;
  if (zoom <= 7) return 1;
  return 0.5;
}
function haversineDistKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function bboxDimensionsKm(swLat, swLon, neLat, neLon) {
  const centerLat = (swLat + neLat) / 2;
  const centerLon = (swLon + neLon) / 2;
  const heightKm = haversineDistKm(swLat, centerLon, neLat, centerLon);
  const widthKm = haversineDistKm(centerLat, swLon, centerLat, neLon);
  return { centerLat, centerLon, widthKm: Math.max(widthKm, 1), heightKm: Math.max(heightKm, 1) };
}
function getGeoSearchCap(zoom) {
  if (zoom < 5) return 2e3;
  if (zoom <= 7) return 5e3;
  return 1e4;
}
function getClusterCellSize(zoom) {
  if (zoom < 4) return 5;
  if (zoom < 6) return 2;
  if (zoom < 8) return 0.5;
  return 0;
}
function clusterBases(bases, cellSize) {
  if (cellSize === 0 || bases.length <= 200) return { entries: bases, clusters: [] };
  const cells = /* @__PURE__ */ new Map();
  for (const b of bases) {
    const ck = `${Math.floor(b.latitude / cellSize)}:${Math.floor(b.longitude / cellSize)}`;
    let arr = cells.get(ck);
    if (!arr) {
      arr = [];
      cells.set(ck, arr);
    }
    arr.push(b);
  }
  const entries = [];
  const clusters = [];
  for (const group of cells.values()) {
    if (group.length === 1) {
      entries.push(group[0]);
      continue;
    }
    let latSum = 0, lonSum = 0;
    const typeCounts = /* @__PURE__ */ new Map();
    for (const b of group) {
      latSum += b.latitude;
      lonSum += b.longitude;
      typeCounts.set(b.type, (typeCounts.get(b.type) || 0) + 1);
    }
    let dominantType = "other";
    let maxCount = 0;
    for (const [t, c] of typeCounts) {
      if (c > maxCount) {
        maxCount = c;
        dominantType = t;
      }
    }
    clusters.push({
      latitude: latSum / group.length,
      longitude: lonSum / group.length,
      count: group.length,
      dominantType,
      expansionZoom: cellSize >= 2 ? 6 : cellSize >= 0.5 ? 8 : 10
    });
  }
  return { entries, clusters };
}
async function listMilitaryBases(ctx, req) {
  try {
    const empty = { bases: [], clusters: [], totalInView: 0, truncated: false };
    if (!req.neLat && !req.neLon && !req.swLat && !req.swLon) return empty;
    const swLat = Math.max(-90, Math.min(90, req.swLat));
    const neLat = Math.max(-90, Math.min(90, req.neLat));
    const swLon = Math.max(-180, Math.min(180, req.swLon));
    const neLon = Math.max(-180, Math.min(180, req.neLon));
    const zoom = Math.max(0, Math.min(22, req.zoom || 3));
    const typeFilter = normalizeOptionalFilter(req.type, (v2) => v2.toLowerCase());
    const kindFilter = normalizeOptionalFilter(req.kind, (v2) => v2.toLowerCase());
    const countryFilter = normalizeOptionalFilter(req.country, (v2) => v2.toUpperCase());
    if (typeFilter && !VALID_TYPES.has(typeFilter)) return empty;
    if (kindFilter && !VALID_KINDS.has(kindFilter)) return empty;
    if (countryFilter && !COUNTRY_RE.test(countryFilter)) return empty;
    let activeVersion = await getCachedJson("military:bases:active");
    let rawKeys = false;
    if (!activeVersion) {
      activeVersion = await getCachedJson("military:bases:active", true);
      rawKeys = true;
    }
    if (!activeVersion) {
      markNoCacheResponse(ctx.request);
      setResponseHeader(ctx.request, "X-Bases-Debug", "no-active-version");
      console.warn("military:bases:active key missing \u2014 run seed script");
      return empty;
    }
    const v = String(activeVersion);
    setResponseHeader(ctx.request, "X-Bases-Debug", `v=${v},raw=${rawKeys}`);
    const geoKey = `military:bases:geo:${v}`;
    const metaKey = `military:bases:meta:${v}`;
    const gridStep = getBboxGridStep(zoom);
    const qBB = [
      quantize2(swLat, gridStep),
      quantize2(swLon, gridStep),
      quantize2(neLat, gridStep),
      quantize2(neLon, gridStep)
    ].join(":");
    const cacheKey = `military:bases:v1:${qBB}:${zoom}:${typeFilter}:${kindFilter}:${countryFilter}:${v}`;
    const result = await cachedFetchJson(
      cacheKey,
      3600,
      async () => {
        const antimeridian = swLon > neLon;
        let allIds;
        if (antimeridian) {
          const dims1 = bboxDimensionsKm(swLat, swLon, neLat, 180);
          const dims2 = bboxDimensionsKm(swLat, -180, neLat, neLon);
          const cap = getGeoSearchCap(zoom);
          const [ids1, ids2] = await Promise.all([
            geoSearchByBox(geoKey, dims1.centerLon, dims1.centerLat, dims1.widthKm, dims1.heightKm, cap, rawKeys),
            geoSearchByBox(geoKey, dims2.centerLon, dims2.centerLat, dims2.widthKm, dims2.heightKm, cap, rawKeys)
          ]);
          const seen = /* @__PURE__ */ new Set();
          allIds = [];
          for (const id of [...ids1, ...ids2]) {
            if (!seen.has(id)) {
              seen.add(id);
              allIds.push(id);
            }
          }
        } else {
          const dims = bboxDimensionsKm(swLat, swLon, neLat, neLon);
          const cap = getGeoSearchCap(zoom);
          allIds = await geoSearchByBox(geoKey, dims.centerLon, dims.centerLat, dims.widthKm, dims.heightKm, cap, rawKeys);
        }
        const truncated = allIds.length >= getGeoSearchCap(zoom);
        if (allIds.length === 0) return { bases: [], clusters: [], totalInView: 0, truncated: false };
        const metaMap = await getHashFieldsBatch(metaKey, allIds, rawKeys);
        const bases = [];
        for (const id of allIds) {
          const raw = metaMap.get(id);
          if (!raw) continue;
          let meta;
          try {
            meta = JSON.parse(raw);
          } catch {
            continue;
          }
          const tier = meta.tier || 2;
          if (zoom < 5 && tier > 1) continue;
          if (zoom >= 5 && zoom < 8 && tier > 2) continue;
          if (typeFilter && meta.type !== typeFilter) continue;
          if (kindFilter && meta.kind !== kindFilter) continue;
          if (countryFilter && meta.countryIso2 !== countryFilter) continue;
          bases.push({
            id: String(meta.id || id),
            name: String(meta.name || ""),
            latitude: Number(meta.lat) || 0,
            longitude: Number(meta.lon) || 0,
            kind: String(meta.kind || ""),
            countryIso2: String(meta.countryIso2 || ""),
            type: String(meta.type || "other"),
            tier,
            catAirforce: Boolean(meta.catAirforce),
            catNaval: Boolean(meta.catNaval),
            catNuclear: Boolean(meta.catNuclear),
            catSpace: Boolean(meta.catSpace),
            catTraining: Boolean(meta.catTraining),
            branch: String(meta.branch || ""),
            status: String(meta.status || "")
          });
        }
        const cellSize = getClusterCellSize(zoom);
        const { entries, clusters } = clusterBases(bases, cellSize);
        return {
          bases: entries,
          clusters,
          totalInView: bases.length,
          truncated
        };
      }
    );
    if (!result) {
      markNoCacheResponse(ctx.request);
      return empty;
    }
    return result;
  } catch (err) {
    markNoCacheResponse(ctx.request);
    setResponseHeader(ctx.request, "X-Bases-Debug", `error:${err instanceof Error ? err.message : String(err)}`);
    return { bases: [], clusters: [], totalInView: 0, truncated: false };
  }
}

// server/worldmonitor/military/v1/get-wingbits-live-flight.ts
init_redis();

// server/_shared/airline-codes.ts
var OVERRIDE = {
  SWR: { iata: "LX", name: "Swiss International Air Lines" },
  TGW: { iata: "TR", name: "Scoot" }
};
var GENERATED = {
  "AAA": { iata: "AN", name: "Ansett Australia" },
  "AAF": { iata: "ZI", name: "Aigle Azur" },
  "AAH": { iata: "AQ", name: "Aloha Airlines" },
  "AAL": { iata: "AA", name: "American Airlines" },
  "AAN": { iata: "WD", name: "Amsterdam Airlines" },
  "AAR": { iata: "OZ", name: "Asiana Airlines" },
  "AAS": { iata: "4K", name: "Askari Aviation" },
  "AAW": { iata: "8U", name: "Afriqiyah Airways" },
  "AAY": { iata: "G4", name: "Allegiant Air" },
  "ABD": { iata: "CC", name: "Air Atlanta Icelandic" },
  "ABI": { iata: "U1", name: "Aviabus" },
  "ABL": { iata: "BX", name: "Air Busan" },
  "ABQ": { iata: "ED", name: "Airblue" },
  "ABS": { iata: "9T", name: "Transwest Air" },
  "ABY": { iata: "G9", name: "Air Arabia" },
  "ACA": { iata: "AC", name: "Air Canada" },
  "ACI": { iata: "SB", name: "Air Caledonie International" },
  "ACP": { iata: "8V", name: "Astral Aviation" },
  "ADE": { iata: "ZY", name: "Ada Air" },
  "ADH": { iata: "AP", name: "Air One" },
  "ADO": { iata: "HD", name: "Hokkaido International Airlines" },
  "ADR": { iata: "JP", name: "Adria Airways" },
  "AEA": { iata: "UX", name: "Air Europa" },
  "AEB": { iata: "EM", name: "Aero Benin" },
  "AEE": { iata: "A3", name: "Aegean Airlines" },
  "AEL": { iata: "PE", name: "Air Europe" },
  "AER": { iata: "KO", name: "Alaska Central Express" },
  "AEU": { iata: "5W", name: "Astraeus" },
  "AEW": { iata: "VV", name: "Aerosvit Airlines" },
  "AEY": { iata: "I9", name: "Air Italy" },
  "AFG": { iata: "FG", name: "Ariana Afghan Airlines" },
  "AFL": { iata: "SU", name: "Aeroflot Russian Airlines" },
  "AFR": { iata: "AF", name: "Air France" },
  "AGV": { iata: "7T", name: "Air Glaciers" },
  "AHO": { iata: "HH", name: "Air Hamburg (AHO)" },
  "AHY": { iata: "J2", name: "Azerbaijan Airlines" },
  "AIA": { iata: "U3", name: "Avies" },
  "AIC": { iata: "AI", name: "Air India Limited" },
  "AIQ": { iata: "FD", name: "Thai AirAsia" },
  "AIZ": { iata: "IZ", name: "Arkia Israel Airlines" },
  "AJM": { iata: "JM", name: "Air Jamaica" },
  "AJX": { iata: "NQ", name: "Air Japan" },
  "AKL": { iata: "4A", name: "Air Kiribati" },
  "ALK": { iata: "UL", name: "SriLankan Airlines" },
  "AMC": { iata: "KM", name: "Air Malta" },
  "AML": { iata: "QM", name: "Air Malawi" },
  "AMU": { iata: "NX", name: "Air Macau" },
  "AMX": { iata: "AM", name: "AeroM\xE9xico" },
  "ANA": { iata: "NH", name: "All Nippon Airways" },
  "ANE": { iata: "YW", name: "Air Nostrum" },
  "ANG": { iata: "PX", name: "Air Niugini" },
  "ANK": { iata: "EL", name: "Air Nippon" },
  "ANO": { iata: "TL", name: "Airnorth" },
  "ANT": { iata: "4N", name: "Air North Charter - Canada" },
  "ANZ": { iata: "NZ", name: "Air New Zealand" },
  "APW": { iata: "JW", name: "Arrow Air" },
  "ARD": { iata: "2B", name: "Aerocondor" },
  "ARE": { iata: "4C", name: "Aires" },
  "ARF": { iata: "GV", name: "Aero Flight" },
  "ARG": { iata: "AR", name: "Aerolineas Argentinas" },
  "ASA": { iata: "AS", name: "Alaska Airlines" },
  "ASD": { iata: "4D", name: "Air Sinai" },
  "ASH": { iata: "YV", name: "Mesa Airlines" },
  "ASL": { iata: "JU", name: "Air Serbia" },
  "ASQ": { iata: "EV", name: "Atlantic Southeast Airlines" },
  "ASZ": { iata: "OB", name: "Astrakhan Airlines" },
  "ATC": { iata: "TC", name: "Air Tanzania" },
  "ATM": { iata: "FO", name: "Airlines Of Tasmania" },
  "AUA": { iata: "OS", name: "Austrian Airlines" },
  "AUB": { iata: "IQ", name: "Augsburg Airways" },
  "AUH": { iata: "MO", name: "Abu Dhabi Amiri Flight" },
  "AUI": { iata: "PS", name: "Ukraine International Airlines" },
  "AUL": { iata: "5N", name: "Aeroflot-Nord" },
  "AUR": { iata: "GR", name: "Aurigny Air Services" },
  "AUT": { iata: "AU", name: "Austral Lineas Aereas" },
  "AVA": { iata: "AV", name: "Avianca - Aerovias Nacionales de Colombia" },
  "AVN": { iata: "NF", name: "Air Vanuatu" },
  "AWA": { iata: "Y5", name: "Asia Wings" },
  "AWE": { iata: "HP", name: "America West Airlines" },
  "AWI": { iata: "ZW", name: "Air Wisconsin" },
  "AWM": { iata: "AW", name: "Asian Wings Airways" },
  "AWQ": { iata: "QZ", name: "Indonesia AirAsia" },
  "AWU": { iata: "7E", name: "Aeroline GmbH" },
  "AWW": { iata: "6G", name: "Air Wales" },
  "AXB": { iata: "IX", name: "Air India Express" },
  "AXL": { iata: "XT", name: "Air Exel" },
  "AXM": { iata: "AK", name: "AirAsia" },
  "AXZ": { iata: "JY", name: "Aereonautica militare" },
  "AYZ": { iata: "3G", name: "Atlant-Soyuz Airlines" },
  "AZA": { iata: "AZ", name: "Alitalia" },
  "AZN": { iata: "Z8", name: "Amaszonas" },
  "AZU": { iata: "AD", name: "Azul" },
  "AZW": { iata: "UM", name: "Air Zimbabwe" },
  "BAG": { iata: "DI", name: "dba" },
  "BAW": { iata: "BA", name: "British Airways" },
  "BBC": { iata: "BG", name: "Biman Bangladesh Airlines" },
  "BBO": { iata: "F7", name: "Flybaboo" },
  "BBR": { iata: "S3", name: "Santa Barbara Airlines" },
  "BCC": { iata: "8B", name: "BusinessAir" },
  "BCY": { iata: "WX", name: "CityJet" },
  "BEE": { iata: "BE", name: "Flybe" },
  "BER": { iata: "AB", name: "Air Berlin" },
  "BGD": { iata: "B9", name: "Air Bangladesh" },
  "BHP": { iata: "4T", name: "Belair Airlines" },
  "BHS": { iata: "UP", name: "Bahamasair" },
  "BIE": { iata: "DR", name: "Air Mediterranee" },
  "BIH": { iata: "BS", name: "British International Helicopters" },
  "BKP": { iata: "PG", name: "Bangkok Airways" },
  "BLF": { iata: "KF", name: "Blue1" },
  "BLS": { iata: "JV", name: "Bearskin Lake Air Service" },
  "BLV": { iata: "B3", name: "Bellview Airlines" },
  "BLX": { iata: "6B", name: "TUIfly Nordic" },
  "BMA": { iata: "BD", name: "bmi" },
  "BMI": { iata: "WW", name: "bmibaby" },
  "BMJ": { iata: "CH", name: "Bemidji Airlines" },
  "BMM": { iata: "8A", name: "Atlas Blue" },
  "BON": { iata: "JA", name: "Air Bosna" },
  "BOT": { iata: "BP", name: "Air Botswana" },
  "BPA": { iata: "BV", name: "Blue Panorama Airlines" },
  "BQB": { iata: "BQ", name: "Buquebus L\xEDneas A\xE9reas" },
  "BRG": { iata: "8E", name: "Bering Air" },
  "BRQ": { iata: "UZ", name: "El-Buraq Air Transport" },
  "BRU": { iata: "B2", name: "Belavia Belarusian Airlines" },
  "BSA": { iata: "BZ", name: "Black Stallion Airways" },
  "BSX": { iata: "5B", name: "Bassaka airlines" },
  "BTA": { iata: "XE", name: "ExpressJet" },
  "BTI": { iata: "BT", name: "Air Baltic" },
  "BTQ": { iata: "4B", name: "Boutique Air (Priv)" },
  "BTV": { iata: "7P", name: "Metro Batavia" },
  "BUB": { iata: "ZB", name: "Air Bourbon" },
  "BUU": { iata: "BU", name: "Baikotovitchestrian Airlines" },
  "BVT": { iata: "J8", name: "Berjaya Air" },
  "BWA": { iata: "BW", name: "Caribbean Airlines" },
  "BWG": { iata: "QW", name: "Blue Wings" },
  "BZE": { iata: "GB", name: "BRAZIL AIR" },
  "BZH": { iata: "DB", name: "Brit Air" },
  "CAL": { iata: "CI", name: "China Airlines" },
  "CAP": { iata: "C2", name: "CanXplorer" },
  "CAW": { iata: "MN", name: "Comair" },
  "CAY": { iata: "KX", name: "Cayman Airways" },
  "CCA": { iata: "CA", name: "Air China" },
  "CCC": { iata: "CB", name: "CCML Airlines" },
  "CCM": { iata: "XK", name: "Corse-Mediterranee" },
  "CDG": { iata: "SC", name: "Shandong Airlines" },
  "CDN": { iata: "CP", name: "Canadian Airlines" },
  "CDP": { iata: "Q6", name: "Aero Condor Peru" },
  "CEB": { iata: "5J", name: "Cebu Pacific" },
  "CES": { iata: "MU", name: "China Eastern Airlines" },
  "CFE": { iata: "CJ", name: "BA CityFlyer" },
  "CFG": { iata: "DE", name: "Condor Flugdienst" },
  "CGP": { iata: "8L", name: "Cargo Plus Aviation" },
  "CHB": { iata: "PN", name: "West Air China" },
  "CHH": { iata: "HU", name: "Hainan Airlines" },
  "CHP": { iata: "6A", name: "Consorcio Aviaxsa" },
  "CHQ": { iata: "RP", name: "Chautauqua Airlines" },
  "CIF": { iata: "1F", name: "CB Airways UK ( Interliging Flights )" },
  "CIM": { iata: "QI", name: "Cimber Air" },
  "CIX": { iata: "G3", name: "City Connexion Airlines" },
  "CJC": { iata: "9L", name: "Colgan Air" },
  "CLH": { iata: "CL", name: "Lufthansa CityLine" },
  "CLI": { iata: "XG", name: "Calima Aviacion" },
  "CLW": { iata: "C0", name: "Centralwings" },
  "CMI": { iata: "CS", name: "Continental Micronesia" },
  "CMP": { iata: "CM", name: "Copa Airlines" },
  "COA": { iata: "CO", name: "Continental Airlines" },
  "COM": { iata: "OH", name: "Comair" },
  "CPA": { iata: "CX", name: "Cathay Pacific" },
  "CPN": { iata: "RV", name: "Caspian Airlines" },
  "CPZ": { iata: "CP", name: "Compass Airlines" },
  "CQH": { iata: "9S", name: "Spring Airlines" },
  "CQN": { iata: "OQ", name: "Chongqing Airlines" },
  "CRK": { iata: "HX", name: "Hong Kong Airlines" },
  "CRL": { iata: "SS", name: "Corsairfly" },
  "CSA": { iata: "OK", name: "Czech Airlines" },
  "CSC": { iata: "3U", name: "Sichuan Airlines" },
  "CSH": { iata: "FM", name: "Shanghai Airlines" },
  "CSN": { iata: "CZ", name: "China Southern Airlines" },
  "CSZ": { iata: "ZH", name: "Shenzhen Airlines" },
  "CTN": { iata: "OU", name: "Croatia Airlines" },
  "CUA": { iata: "HR", name: "China United Airlines" },
  "CUB": { iata: "CU", name: "Cubana de Aviaci\xF3n" },
  "CVA": { iata: "CV", name: "Air Chathams" },
  "CWK": { iata: "KR", name: "Comores Airlines" },
  "CWM": { iata: "CW", name: "Air Marshall Islands" },
  "CXA": { iata: "MF", name: "Xiamen Airlines" },
  "CYD": { iata: "ZA", name: "Access Air" },
  "CYH": { iata: "3Q", name: "Yunnan Airlines" },
  "CYP": { iata: "CY", name: "Cyprus Airways" },
  "CZV": { iata: "6V", name: "Via Conectia Airlines" },
  "DAH": { iata: "AH", name: "Air Algerie" },
  "DAL": { iata: "DL", name: "Delta Air Lines" },
  "DAO": { iata: "D3", name: "Daallo Airlines" },
  "DAT": { iata: "SN", name: "Brussels Airlines" },
  "DHI": { iata: "KI", name: "Adam Air" },
  "DJB": { iata: "D8", name: "Djibouti Airlines" },
  "DKH": { iata: "HO", name: "Juneyao Airlines" },
  "DLA": { iata: "EN", name: "Air Dolomiti" },
  "DLH": { iata: "LH", name: "Lufthansa" },
  "DMO": { iata: "E3", name: "Domodedovo Airlines" },
  "DNV": { iata: "D9", name: "Aeroflot-Don" },
  "DOA": { iata: "DO", name: "Dominicana de Aviaci" },
  "DOB": { iata: "QD", name: "Dobrolet" },
  "DRD": { iata: "NM", name: "Air Madrid" },
  "DRK": { iata: "KB", name: "Druk Air" },
  "DRU": { iata: "6R", name: "Alrosa Mirny Air Enterprise" },
  "DSM": { iata: "4M", name: "LAN Argentina" },
  "DSY": { iata: "DH", name: "Dennis Sky" },
  "DTA": { iata: "DT", name: "TAAG Angola Airlines" },
  "DTR": { iata: "DX", name: "DAT Danish Air Transport" },
  "DWA": { iata: "KP", name: "Dense Airways" },
  "DWT": { iata: "0D", name: "Darwin Airline" },
  "EAL": { iata: "EA", name: "European Air Express" },
  "EAV": { iata: "13", name: "Eastern Atlantic Virtual Airlines" },
  "ECA": { iata: "UI", name: "Eurocypria Airlines" },
  "EDW": { iata: "WK", name: "Edelweiss Air" },
  "EEA": { iata: "EU", name: "Empresa Ecuatoriana De Aviacion" },
  "EEU": { iata: "GJ", name: "Eurofly Service" },
  "EFA": { iata: "EF", name: "Far Eastern Air Transport" },
  "EGF": { iata: "MQ", name: "American Eagle Airlines" },
  "EIA": { iata: "EZ", name: "Evergreen International Airlines" },
  "EIN": { iata: "EI", name: "Aer Lingus" },
  "EJA": { iata: "1I", name: "NetJets" },
  "ELA": { iata: "DK", name: "Eastland Air" },
  "ELL": { iata: "OV", name: "Estonian Air" },
  "ELO": { iata: "K2", name: "Eurolot" },
  "ELY": { iata: "LY", name: "El Al Israel Airlines" },
  "ERO": { iata: "7L", name: "Sun D'Or" },
  "ERR": { iata: "7H", name: "Era Alaska" },
  "ERT": { iata: "B8", name: "Eritrean Airlines" },
  "ESK": { iata: "NE", name: "SkyEurope" },
  "ESR": { iata: "ZE", name: "Eastar Jet" },
  "ETD": { iata: "EY", name: "Etihad Airways" },
  "ETH": { iata: "ET", name: "Ethiopian Airlines" },
  "EUV": { iata: "ES", name: "EuropeSky" },
  "EVA": { iata: "BR", name: "EVA Air" },
  "EWG": { iata: "EW", name: "Eurowings" },
  "EXS": { iata: "LS", name: "Jet2.com" },
  "EZE": { iata: "T3", name: "Eastern Airways" },
  "EZY": { iata: "U2", name: "easyJet" },
  "FAB": { iata: "7F", name: "First Air" },
  "FBL": { iata: "F1", name: "Fly Brasil" },
  "FCA": { iata: "DP", name: "First Choice Airways" },
  "FDB": { iata: "FZ", name: "Fly Dubai" },
  "FFM": { iata: "FY", name: "Firefly" },
  "FFT": { iata: "F9", name: "Frontier Airlines" },
  "FFV": { iata: "5H", name: "Fly540" },
  "FHE": { iata: "HW", name: "Hello" },
  "FHI": { iata: "FH", name: "FlyHigh Airlines Ireland (FH)" },
  "FIF": { iata: "OF", name: "Air Finland" },
  "FIN": { iata: "AY", name: "Finnair" },
  "FJI": { iata: "FJ", name: "Air Pacific" },
  "FLG": { iata: "9E", name: "Pinnacle Airlines" },
  "FLI": { iata: "RC", name: "Atlantic Airways" },
  "FLT": { iata: "B5", name: "Flightline" },
  "FLZ": { iata: "QH", name: "Air Florida" },
  "FOS": { iata: "VY", name: "Formosa Airlines" },
  "FOX": { iata: "FX", name: "FOX Linhas Aereas" },
  "FPT": { iata: "PO", name: "FlyPortugal" },
  "FRE": { iata: "FP", name: "Freedom Air" },
  "FRF": { iata: "FF", name: "Fly France" },
  "FTA": { iata: "2F", name: "Frontier Flying Service" },
  "FWI": { iata: "TX", name: "Air Cara\xEFbes" },
  "FWL": { iata: "RF", name: "Florida West International Airways" },
  "FXI": { iata: "NY", name: "Air Iceland" },
  "FXX": { iata: "FU", name: "Felix Airways" },
  "GAI": { iata: "3R", name: "Moskovia Airlines" },
  "GAO": { iata: "DC", name: "Golden Air" },
  "GAP": { iata: "2P", name: "Air Philippines" },
  "GBA": { iata: "GF", name: "Gulf Air Bahrain" },
  "GBK": { iata: "GY", name: "Gabon Airlines" },
  "GBL": { iata: "GT", name: "GB Airways" },
  "GDR": { iata: "GP", name: "Gadair European Airlines" },
  "GEC": { iata: "LH", name: "Lufthansa Cargo" },
  "GER": { iata: "GM", name: "German International Air Lines" },
  "GFG": { iata: "QB", name: "Georgian National Airlines" },
  "GFY": { iata: "XX", name: "Greenfly" },
  "GHB": { iata: "G0", name: "Ghana International Airlines" },
  "GIA": { iata: "GA", name: "Garuda Indonesia" },
  "GIE": { iata: "E4", name: "Elysian Airlines" },
  "GIP": { iata: "2U", name: "Air Guinee Express" },
  "GJS": { iata: "G7", name: "GoJet Airlines" },
  "GLA": { iata: "ZK", name: "Great Lakes Airlines" },
  "GLG": { iata: "2K", name: "Aerolineas Galapagos (Aerogal)" },
  "GLO": { iata: "G3", name: "Gol Transportes A\xE9reos" },
  "GLP": { iata: "GH", name: "Globus" },
  "GMI": { iata: "ST", name: "Germania" },
  "GOW": { iata: "G8", name: "Go Air" },
  "GRL": { iata: "GL", name: "Air Greenland" },
  "GSM": { iata: "B4", name: "Flyglobespan" },
  "GTA": { iata: "E8", name: "City Airways" },
  "GTI": { iata: "5Y", name: "Atlas Air" },
  "GUY": { iata: "GG", name: "Air Guyane" },
  "GWI": { iata: "4U", name: "Germanwings" },
  "GWY": { iata: "U5", name: "USA3000 Airlines" },
  "GXG": { iata: "GX", name: "GermanXL" },
  "GZP": { iata: "4G", name: "Gazpromavia" },
  "HAG": { iata: "H6", name: "Hageland Aviation Services" },
  "HAL": { iata: "HA", name: "Hawaiian Airlines" },
  "HAM": { iata: "2T", name: "Haiti Ambassador Airlines" },
  "HCW": { iata: "V9", name: "Star1 Airlines" },
  "HDA": { iata: "KA", name: "Dragonair" },
  "HEJ": { iata: "T4", name: "Hellas Jet" },
  "HER": { iata: "UD", name: "Hex'Air" },
  "HFR": { iata: "8H", name: "Heli France" },
  "HHI": { iata: "4R", name: "Hamburg International" },
  "HKE": { iata: "UO", name: "Hong Kong Express Airways" },
  "HLF": { iata: "HF", name: "Hapagfly" },
  "HLX": { iata: "X3", name: "TUIfly" },
  "HNX": { iata: "HN", name: "Hankook Airline" },
  "HVN": { iata: "VN", name: "Vietnam Airlines" },
  "HYM": { iata: "HC", name: "Himalayan Airlines" },
  "HZA": { iata: "BN", name: "Horizon Airlines" },
  "IAA": { iata: "IO", name: "Indonesian Airlines" },
  "IAC": { iata: "IC", name: "Indian Airlines" },
  "IAW": { iata: "IA", name: "Iraqi Airways" },
  "IBB": { iata: "NT", name: "Binter Canarias" },
  "IBE": { iata: "IB", name: "Iberia Airlines" },
  "IBS": { iata: "I2", name: "Iberia Express" },
  "IBU": { iata: "I9", name: "Indigo" },
  "IBX": { iata: "FW", name: "Ibex Airlines" },
  "ICE": { iata: "FI", name: "Icelandair" },
  "ICL": { iata: "5C", name: "CAL Cargo Air Lines" },
  "IDS": { iata: "I5", name: "Indonesia Sky" },
  "IGO": { iata: "6E", name: "IndiGo Airlines" },
  "IIR": { iata: "Z5", name: "INAVIA Internacional" },
  "IKA": { iata: "GI", name: "Itek Air" },
  "ILN": { iata: "D6", name: "Interair South Africa" },
  "IMP": { iata: "HT", name: "Hellenic Imperial Airways" },
  "INE": { iata: "9I", name: "International Europe" },
  "IPV": { iata: "PA", name: "Parmiss Airlines (IPV)" },
  "IRA": { iata: "IR", name: "Iran Air" },
  "IRC": { iata: "EP", name: "Iran Aseman Airlines" },
  "IRK": { iata: "Y9", name: "Kish Air" },
  "IRM": { iata: "W5", name: "Mahan Air" },
  "ISK": { iata: "3L", name: "Intersky" },
  "ISR": { iata: "6H", name: "Israir" },
  "ISS": { iata: "IG", name: "Meridiana" },
  "ISV": { iata: "WC", name: "Islena De Inversiones" },
  "ISW": { iata: "IF", name: "Islas Airways" },
  "ISX": { iata: "IP", name: "Island Spirit" },
  "ITK": { iata: "ID", name: "Interlink Airlines" },
  "ITX": { iata: "IK", name: "Imair Airlines" },
  "IWA": { iata: "ZM", name: "Apache Air" },
  "IWD": { iata: "TY", name: "Iberworld" },
  "IYE": { iata: "IY", name: "Yemenia" },
  "JAA": { iata: "EG", name: "Japan Asia Airways" },
  "JAB": { iata: "W9", name: "Air Bagan" },
  "JAF": { iata: "JF", name: "Jetairfly" },
  "JAI": { iata: "9W", name: "Jet Airways" },
  "JAL": { iata: "JL", name: "Japan Airlines Domestic" },
  "JAS": { iata: "JD", name: "Japan Air System" },
  "JAZ": { iata: "JO", name: "JALways" },
  "JBA": { iata: "JB", name: "Helijet" },
  "JBU": { iata: "B6", name: "JetBlue Airways" },
  "JET": { iata: "IV", name: "Wind Jet" },
  "JEX": { iata: "JC", name: "JAL Express" },
  "JFU": { iata: "8J", name: "Jet4You" },
  "JJA": { iata: "7C", name: "Jeju Air" },
  "JKK": { iata: "JK", name: "Spanair" },
  "JNA": { iata: "LJ", name: "Jin Air" },
  "JOR": { iata: "0B", name: "Blue Air" },
  "JOY": { iata: "JR", name: "Joy Air" },
  "JSA": { iata: "3K", name: "Jetstar Asia Airways" },
  "JSR": { iata: "JX", name: "Jusur airways" },
  "JST": { iata: "JQ", name: "Jetstar Airways" },
  "JTA": { iata: "NU", name: "Japan Transocean Air" },
  "JTO": { iata: "NR", name: "Jettor Airlines" },
  "JZA": { iata: "QK", name: "Air Canada Jazz" },
  "JZR": { iata: "J9", name: "Jazeera Airways" },
  "KAC": { iata: "KU", name: "Kuwait Airways" },
  "KAL": { iata: "KE", name: "Korean Air" },
  "KAP": { iata: "9K", name: "Cape Air" },
  "KBR": { iata: "K7", name: "KoralBlue Airlines" },
  "KEN": { iata: "M5", name: "Kenmore Air" },
  "KFR": { iata: "IT", name: "Kingfisher Airlines" },
  "KGL": { iata: "7K", name: "Kogalymavia Air Company" },
  "KGO": { iata: "ZC", name: "Korongo Airlines" },
  "KHB": { iata: "H8", name: "Dalavia" },
  "KHK": { iata: "KH", name: "Kharkiv Airlines" },
  "KIL": { iata: "GW", name: "Kuban Airlines" },
  "KIS": { iata: "C3", name: "Contact Air" },
  "KJC": { iata: "7B", name: "Krasnojarsky Airlines" },
  "KKK": { iata: "KK", name: "Atlasjet" },
  "KLC": { iata: "WA", name: "KLM Cityhopper" },
  "KLM": { iata: "KL", name: "KLM Royal Dutch Airlines" },
  "KMF": { iata: "RQ", name: "Kam Air" },
  "KNE": { iata: "XY", name: "Nas Air" },
  "KNI": { iata: "KD", name: "KD Avia" },
  "KOL": { iata: "CQ", name: "SOCHI AIR" },
  "KOQ": { iata: "K1", name: "Kostromskie avialinii" },
  "KOR": { iata: "JS", name: "Air Koryo" },
  "KQA": { iata: "KQ", name: "Kenya Airways" },
  "KRP": { iata: "V3", name: "Carpatair" },
  "KSY": { iata: "KY", name: "KSY" },
  "KZK": { iata: "9Y", name: "Air Kazakhstan" },
  "KZR": { iata: "KC", name: "Air Astana" },
  "KZU": { iata: "GO", name: "Kuzu Airlines Cargo" },
  "LAA": { iata: "LN", name: "Libyan Arab Airlines" },
  "LAJ": { iata: "KJ", name: "British Mediterranean Airways" },
  "LAM": { iata: "LM", name: "Linhas A" },
  "LAN": { iata: "LA", name: "LAN Airlines" },
  "LAO": { iata: "QV", name: "Lao Airlines" },
  "LAP": { iata: "PZ", name: "TAM Mercosur" },
  "LBC": { iata: "LV", name: "Albanian Airlines" },
  "LBL": { iata: "L8", name: "Line Blue" },
  "LBT": { iata: "BJ", name: "Nouvel Air Tunisie" },
  "LDA": { iata: "NG", name: "Lauda Air" },
  "LGL": { iata: "LG", name: "Luxair" },
  "LGW": { iata: "HE", name: "Luftfahrtgesellschaft Walter" },
  "LHN": { iata: "EO", name: "Express One International" },
  "LIA": { iata: "LI", name: "Leeward Islands Air Transport" },
  "LIL": { iata: "TE", name: "FlyLal" },
  "LIX": { iata: "C4", name: "LionXpress" },
  "LJJ": { iata: "L4", name: "Luchsh Airlines" },
  "LLM": { iata: "YL", name: "Yamal Airlines" },
  "LMM": { iata: "LQ", name: "LCM AIRLINES" },
  "LMU": { iata: "UJ", name: "AlMasria Universal Airlines" },
  "LNE": { iata: "XL", name: "Aerolane" },
  "LNI": { iata: "JT", name: "Lion Mentari Airlines" },
  "LOC": { iata: "ZQ", name: "Locair" },
  "LOF": { iata: "AX", name: "Trans States Airlines" },
  "LOO": { iata: "PQ", name: "LSM Airlines" },
  "LOT": { iata: "LO", name: "LOT Polish Airlines" },
  "LPE": { iata: "LP", name: "LAN Peru" },
  "LPR": { iata: "MJ", name: "L" },
  "LRC": { iata: "LR", name: "LACSA" },
  "LTE": { iata: "XO", name: "LTE International Airways" },
  "LTO": { iata: "L3", name: "LTU Austria" },
  "LTR": { iata: "L5", name: "Lufttransport" },
  "LTU": { iata: "LT", name: "Air Lituanica" },
  "LTY": { iata: "LE", name: "Liberty Airways" },
  "LUR": { iata: "TD", name: "Atlantis European Airways" },
  "LXP": { iata: "LU", name: "LAN Express" },
  "LXR": { iata: "LK", name: "Air Luxor" },
  "LZB": { iata: "FB", name: "Bulgaria Air" },
  "MAA": { iata: "M7", name: "MasAir" },
  "MAC": { iata: "R5", name: "Malta Air Charter" },
  "MAH": { iata: "MA", name: "Mal\xE9v" },
  "MAI": { iata: "L6", name: "Mauritania Airlines International" },
  "MAK": { iata: "IN", name: "MAT Macedonian Airlines" },
  "MAS": { iata: "MH", name: "Malaysia Airlines" },
  "MAU": { iata: "MK", name: "Air Mauritius" },
  "MAV": { iata: "ML", name: "Maldivo Airlines" },
  "MCK": { iata: "CC", name: "Macair Airlines" },
  "MDA": { iata: "AE", name: "Mandarin Airlines" },
  "MDG": { iata: "MD", name: "Air Madagascar" },
  "MDL": { iata: "RI", name: "Mandala Airlines" },
  "MDO": { iata: "D1", name: "Domenican Airlines" },
  "MDV": { iata: "2M", name: "Moldavian Airlines" },
  "MDW": { iata: "JI", name: "Midway Airlines" },
  "MEA": { iata: "ME", name: "Middle East Airlines" },
  "MEP": { iata: "YX", name: "Midwest Airlines" },
  "MES": { iata: "XJ", name: "Mesaba Airlines" },
  "MGL": { iata: "OM", name: "MIAT Mongolian Airlines" },
  "MGX": { iata: "YM", name: "Montenegro Airlines" },
  "MJG": { iata: "DF", name: "Michael Airlines" },
  "MJX": { iata: "4L", name: "Euroline" },
  "MKD": { iata: "6F", name: "MAT Airways" },
  "MKG": { iata: "P8", name: "Air Mekong" },
  "MKU": { iata: "WP", name: "Island Air (WP)" },
  "MLA": { iata: "Q5", name: "40-Mile Air" },
  "MLD": { iata: "9U", name: "Air Moldova" },
  "MMM": { iata: "8M", name: "Myanmar Airways International" },
  "MNA": { iata: "MZ", name: "Merpati Nusantara Airlines" },
  "MNB": { iata: "MB", name: "MNG Airlines" },
  "MNO": { iata: "JE", name: "Mango" },
  "MNP": { iata: "SM", name: "Spirit of Manila Airlines" },
  "MON": { iata: "ZB", name: "Monarch Airlines" },
  "MOV": { iata: "NN", name: "VIM Airlines" },
  "MPD": { iata: "A7", name: "Air Plus Comet" },
  "MPE": { iata: "5T", name: "Canadian North" },
  "MPH": { iata: "MP", name: "Martinair" },
  "MRS": { iata: "Y8", name: "Marusya Airways" },
  "MSI": { iata: "M9", name: "Motor Sich" },
  "MSR": { iata: "MS", name: "Egyptair" },
  "MVD": { iata: "KV", name: "Kavminvodyavia" },
  "MWA": { iata: "MY", name: "Midwest Airlines (Egypt)" },
  "MXA": { iata: "MX", name: "Mexicana de Aviaci" },
  "MXD": { iata: "OD", name: "Malindo Air" },
  "MXI": { iata: "I6", name: "MexicanaLink" },
  "MXL": { iata: "8M", name: "Maxair" },
  "MYD": { iata: "MW", name: "Maya Island Air" },
  "MYT": { iata: "VZ", name: "MyTravel Airways" },
  "NAK": { iata: "Q9", name: "Arik Niger" },
  "NAS": { iata: "UE", name: "Nasair" },
  "NAX": { iata: "DY", name: "Norwegian Air Shuttle" },
  "NCR": { iata: "N8", name: "National Air Cargo" },
  "NDC": { iata: "LF", name: "FlyNordic" },
  "NEA": { iata: "EJ", name: "New England Airlines" },
  "NGB": { iata: "NJ", name: "Nordic Global Airlines" },
  "NIA": { iata: "NP", name: "Nile Air" },
  "NIG": { iata: "AJ", name: "Aero Contractors" },
  "NJS": { iata: "NC", name: "National Jet Systems" },
  "NKF": { iata: "8N", name: "Barents AirLink" },
  "NKS": { iata: "NK", name: "Spirit Airlines" },
  "NLH": { iata: "DU", name: "Norwegian Long Haul AS" },
  "NLY": { iata: "HG", name: "Niki" },
  "NMB": { iata: "SW", name: "Air Namibia" },
  "NMI": { iata: "LW", name: "Pacific Wings" },
  "NOK": { iata: "DD", name: "Nok Air" },
  "NSE": { iata: "9R", name: "SATENA" },
  "NTJ": { iata: "2N", name: "NextJet" },
  "NTW": { iata: "CE", name: "Nationwide Airlines" },
  "NVR": { iata: "1I", name: "Novair" },
  "NWA": { iata: "NW", name: "Northwest Airlines" },
  "NXB": { iata: "XB", name: "NEXT Brasil" },
  "OAB": { iata: "O1", name: "Orbit Airlines Azerbaijan" },
  "OAE": { iata: "OY", name: "Omni Air International" },
  "OAL": { iata: "OA", name: "Olympic Airlines" },
  "OAW": { iata: "2L", name: "Helvetic Airways" },
  "OCA": { iata: "R7", name: "Aserca Airlines" },
  "OEA": { iata: "OX", name: "Orient Thai Airlines" },
  "OGN": { iata: "QO", name: "Origin Pacific Airways" },
  "OHK": { iata: "O8", name: "Oasis Hong Kong Airlines" },
  "OHY": { iata: "8Q", name: "Onur Air" },
  "OLA": { iata: "OJ", name: "Overland Airways" },
  "OLT": { iata: "OL", name: "Ostfriesische Lufttransport" },
  "OMA": { iata: "WY", name: "Oman Air" },
  "OME": { iata: "MR", name: "Homer Air" },
  "ONE": { iata: "O6", name: "Oceanair" },
  "OOM": { iata: "Z4", name: "Zoom Airlines" },
  "ORB": { iata: "R2", name: "Orenburg Airlines" },
  "ORC": { iata: "OI", name: "Orchid Airlines" },
  "OTJ": { iata: "X5", name: "Fly Romania" },
  "OZJ": { iata: "O7", name: "Ozjet Airlines" },
  "PAL": { iata: "PR", name: "Philippine Airlines" },
  "PAO": { iata: "PH", name: "Polynesian Airlines" },
  "PBA": { iata: "9Q", name: "PB Air" },
  "PCO": { iata: "8P", name: "Pacific Coastal Airline" },
  "PDC": { iata: "BK", name: "Potomac Air" },
  "PDT": { iata: "PI", name: "Piedmont Airlines (1948-1989)" },
  "PEC": { iata: "Q8", name: "Pacific East Asia Cargo Airlines" },
  "PEL": { iata: "OT", name: "Aeropelican Air Services" },
  "PEN": { iata: "KS", name: "Peninsula Airways" },
  "PGA": { iata: "NI", name: "Portugalia" },
  "PGT": { iata: "PC", name: "Pegasus Airlines" },
  "PIA": { iata: "PK", name: "Pakistan International Airlines" },
  "PIC": { iata: "BL", name: "Jetstar Pacific" },
  "PLI": { iata: "PL", name: "Aeroper" },
  "PLR": { iata: "J3", name: "Northwestern Air" },
  "PMT": { iata: "U4", name: "PMTair" },
  "PMW": { iata: "I7", name: "Paramount Airways" },
  "PNR": { iata: "PV", name: "PAN Air" },
  "POE": { iata: "PD", name: "Porter Airlines" },
  "PPL": { iata: "OP", name: "Air Pegasus" },
  "PQW": { iata: "WQ", name: "PanAm World Airways" },
  "PRF": { iata: "PW", name: "Precision Air" },
  "PUA": { iata: "PU", name: "PLUNA" },
  "PYB": { iata: "0P", name: "All America BOPY" },
  "QAX": { iata: "C3", name: "QatXpress" },
  "QER": { iata: "Q3", name: "SOCHI AIR CHATER" },
  "QFA": { iata: "QF", name: "Qantas" },
  "QTR": { iata: "QR", name: "Qatar Airways" },
  "QXE": { iata: "QX", name: "Horizon Air" },
  "RAB": { iata: "RN", name: "Rainbow Air (RAI)" },
  "RAC": { iata: "VJ", name: "Royal Air Cambodge" },
  "RAE": { iata: "YS", name: "R\xE9gional" },
  "RAM": { iata: "AT", name: "Royal Air Maroc" },
  "RAR": { iata: "GZ", name: "Air Rarotonga" },
  "RAW": { iata: "KG", name: "Royal Airways" },
  "RAY": { iata: "RY", name: "Rainbow Air Canada" },
  "RBA": { iata: "BI", name: "Royal Brunei Airlines" },
  "RBG": { iata: "E5", name: "Air Arabia Egypt" },
  "RBY": { iata: "V2", name: "Vision Airlines (V2)" },
  "REA": { iata: "RE", name: "Aer Arann" },
  "REP": { iata: "P7", name: "Regional Paraguaya" },
  "REU": { iata: "UU", name: "Air Austral" },
  "RFJ": { iata: "RL", name: "Royal Falcon" },
  "RGG": { iata: "1E", name: "TransRussiaAirlines" },
  "RIT": { iata: "6K", name: "Asian Spirit" },
  "RJA": { iata: "RJ", name: "Royal Jordanian" },
  "RKA": { iata: "RK", name: "Air Afrique" },
  "RLA": { iata: "A5", name: "Airlinair" },
  "RLN": { iata: "QL", name: "Aero Lanka" },
  "RNA": { iata: "RA", name: "Royal Nepal Airlines" },
  "RNE": { iata: "20", name: "Air Salone" },
  "RNV": { iata: "U8", name: "Armavia" },
  "RNX": { iata: "1T", name: "1Time Airline" },
  "RNY": { iata: "RM", name: "Rainbow Air US" },
  "RON": { iata: "ON", name: "Nauru Air Corporation" },
  "ROT": { iata: "RO", name: "Tarom" },
  "RPA": { iata: "RW", name: "Republic Airlines" },
  "RPB": { iata: "P5", name: "AeroRep" },
  "RPH": { iata: "RH", name: "Republic Express Airlines" },
  "RPO": { iata: "RX", name: "Rainbow Air Polynesia" },
  "RRJ": { iata: "R8", name: "AirRussia" },
  "RSH": { iata: "S2", name: "Air Sahara" },
  "RSR": { iata: "BF", name: "Aero-Service" },
  "RSU": { iata: "5L", name: "Aerosur" },
  "RSY": { iata: "H5", name: "I-Fly" },
  "RUE": { iata: "RU", name: "Rainbow Air Euro" },
  "RUS": { iata: "C9", name: "Cirrus Airlines" },
  "RWD": { iata: "WB", name: "Rwandair Express" },
  "RWW": { iata: "ER", name: "Fly Europa" },
  "RWZ": { iata: "WZ", name: "Red Wings" },
  "RXA": { iata: "ZL", name: "Regional Express" },
  "RXR": { iata: "RR", name: "REXAIR VIRTUEL" },
  "RYN": { iata: "RD", name: "Ryan International Airlines" },
  "RYR": { iata: "FR", name: "Ryanair" },
  "RZO": { iata: "S4", name: "SATA International" },
  "SAA": { iata: "SA", name: "South African Airways" },
  "SAE": { iata: "Q4", name: "SOCHI AIR EXPRESS" },
  "SAI": { iata: "NL", name: "Shaheen Air International" },
  "SAL": { iata: "S0", name: "Spike Airlines" },
  "SAS": { iata: "SK", name: "Scandinavian Airlines System" },
  "SAT": { iata: "SP", name: "SATA Air Acores" },
  "SBD": { iata: "S8", name: "Snowbird Airlines" },
  "SBI": { iata: "S7", name: "S7 Airlines" },
  "SBS": { iata: "BB", name: "Seaborne Airlines" },
  "SCO": { iata: "TZ", name: "Scoot" },
  "SCW": { iata: "TF", name: "Malm\xF6 Aviation" },
  "SCX": { iata: "SY", name: "Sun Country Airlines" },
  "SDM": { iata: "FV", name: "Rossiya-Russian Airlines" },
  "SDR": { iata: "CF", name: "City Airline" },
  "SEH": { iata: "G3", name: "Sky Express" },
  "SEJ": { iata: "SG", name: "Spicejet" },
  "SEU": { iata: "SE", name: "XL Airways France" },
  "SEY": { iata: "HM", name: "Air Seychelles" },
  "SFJ": { iata: "7G", name: "Star Flyer" },
  "SGG": { iata: "DN", name: "Senegal Airlines" },
  "SGY": { iata: "N5", name: "Skagway Air Service" },
  "SHA": { iata: "SH", name: "Sharp Airlines" },
  "SIA": { iata: "SQ", name: "Singapore Airlines" },
  "SIB": { iata: "5M", name: "Sibaviatrans" },
  "SIH": { iata: "SI", name: "Skynet Airlines" },
  "SJM": { iata: "7R", name: "Svyaz Rossiya" },
  "SJO": { iata: "IJ", name: "Spring Airlines Japan" },
  "SJS": { iata: "76", name: "Southjet" },
  "SJU": { iata: "UQ", name: "Skyjet Airlines" },
  "SJY": { iata: "SJ", name: "Sriwijaya Air" },
  "SKU": { iata: "H2", name: "Sky Airline" },
  "SKV": { iata: "RS", name: "Sky Regional" },
  "SKW": { iata: "OO", name: "SkyWest" },
  "SKX": { iata: "JZ", name: "Skyways Express" },
  "SKY": { iata: "BC", name: "Skymark Airlines" },
  "SLC": { iata: "SO", name: "Salsa d\\\\'Haiti" },
  "SLI": { iata: "5D", name: "Aerolitoral" },
  "SLK": { iata: "MI", name: "SilkAir" },
  "SLM": { iata: "PY", name: "Surinam Airways" },
  "SMJ": { iata: "Z3", name: "Avient Aviation" },
  "SMX": { iata: "XM", name: "Alitalia Express" },
  "SMY": { iata: "ZS", name: "Sama Airlines" },
  "SNB": { iata: "NB", name: "Sterling Airlines" },
  "SNC": { iata: "2Q", name: "Air Cargo Carriers" },
  "SNJ": { iata: "6J", name: "Skynet Asia Airways" },
  "SOL": { iata: "IE", name: "Solomon Airlines" },
  "SOV": { iata: "6W", name: "Saratov Aviation Division" },
  "SOZ": { iata: "HZ", name: "Sat Airlines" },
  "SPM": { iata: "PJ", name: "Air Saint Pierre" },
  "SQC": { iata: "SQ", name: "Singapore Airlines Cargo" },
  "SQH": { iata: "K5", name: "SeaPort Airlines" },
  "SRH": { iata: "FT", name: "Siem Reap Airways" },
  "SRQ": { iata: "DG", name: "South East Asian Airlines" },
  "SSA": { iata: "AG", name: "All America US" },
  "SSV": { iata: "5G", name: "Skyservice Airlines" },
  "STP": { iata: "8F", name: "STP Airways" },
  "STU": { iata: "FS", name: "Servicios de Transportes A" },
  "SUD": { iata: "SD", name: "Sudan Airways" },
  "SUW": { iata: "ZA", name: "Interavia Airlines" },
  "SVA": { iata: "SV", name: "Saudi Arabian Airlines" },
  "SVR": { iata: "U6", name: "Ural Airlines" },
  "SWA": { iata: "WN", name: "Southwest Airlines" },
  "SWD": { iata: "A4", name: "Southern Winds Airlines" },
  "SWR": { iata: "SR", name: "Swissair" },
  "SWV": { iata: "WV", name: "Swe Fly" },
  "SXR": { iata: "XW", name: "Sky Express" },
  "SXS": { iata: "XQ", name: "SunExpress" },
  "SYL": { iata: "R3", name: "Aircompany Yakutia" },
  "SYR": { iata: "RB", name: "Syrian Arab Airlines" },
  "SYX": { iata: "AL", name: "Skywalk Airlines" },
  "TAE": { iata: "EQ", name: "TAME" },
  "TAK": { iata: "U9", name: "Tatarstan Airlines" },
  "TAM": { iata: "JJ", name: "TAM Brazilian Airlines" },
  "TAO": { iata: "VW", name: "Aeromar" },
  "TAP": { iata: "TP", name: "TAP Portugal" },
  "TAR": { iata: "TU", name: "Tunisair" },
  "TAT": { iata: "TA", name: "Grupo TACA" },
  "TBZ": { iata: "TB", name: "TrasBrasil" },
  "TCF": { iata: "S5", name: "Shuttle America" },
  "TCG": { iata: "T2", name: "Thai Air Cargo" },
  "TCV": { iata: "VR", name: "TACV" },
  "TCW": { iata: "FQ", name: "Thomas Cook Airlines" },
  "TCX": { iata: "MT", name: "Thomas Cook Airlines" },
  "TFL": { iata: "OR", name: "Arkefly" },
  "TGW": { iata: "TT", name: "Tiger Airways Australia" },
  "TGZ": { iata: "A9", name: "Georgian Airways" },
  "THA": { iata: "TG", name: "Thai Airways International" },
  "THI": { iata: "TI", name: "TransHolding" },
  "THS": { iata: "TH", name: "TransBrasil Airlines" },
  "THT": { iata: "TN", name: "Air Tahiti Nui" },
  "THY": { iata: "TK", name: "Turkish Airlines" },
  "TIB": { iata: "8R", name: "TRIP Linhas A" },
  "TJA": { iata: "TJ", name: "T.J. Air" },
  "TJT": { iata: "T7", name: "Twin Jet" },
  "TMA": { iata: "TL", name: "Trans Mediterranean Airlines" },
  "TNA": { iata: "GE", name: "TransAsia Airways" },
  "TNM": { iata: "3P", name: "Tiara Air" },
  "TNU": { iata: "M8", name: "TransNusa Air" },
  "TOK": { iata: "CG", name: "Airlines PNG" },
  "TOM": { iata: "BY", name: "Thomsonfly" },
  "TOS": { iata: "PM", name: "Tropic Air" },
  "TPA": { iata: "QT", name: "TAMPA" },
  "TRA": { iata: "HV", name: "Transavia Holland" },
  "TRS": { iata: "FL", name: "AirTran Airways" },
  "TSC": { iata: "TS", name: "Air Transat" },
  "TSO": { iata: "UN", name: "Transaero Airlines" },
  "TUA": { iata: "T5", name: "Turkmenistan Airlines" },
  "TUI": { iata: "UG", name: "Tuninter" },
  "TUS": { iata: "M3", name: "ABSA - Aerolinhas Brasileiras" },
  "TVF": { iata: "TO", name: "Transavia France" },
  "TVS": { iata: "QS", name: "Travel Service" },
  "TWB": { iata: "TW", name: "Tway Airlines" },
  "TWN": { iata: "EC", name: "Avialeasing Aviation Company" },
  "TXW": { iata: "TQ", name: "Texas Wings" },
  "TYR": { iata: "VO", name: "Tyrolean Airways" },
  "TYS": { iata: "YO", name: "TransHolding System" },
  "UAE": { iata: "EK", name: "Emirates" },
  "UAL": { iata: "UA", name: "United Airlines" },
  "UBA": { iata: "UB", name: "Myanma Airways" },
  "UBD": { iata: "4H", name: "United Airways" },
  "UCA": { iata: "C5", name: "CommutAir" },
  "UDC": { iata: "5D", name: "DonbassAero" },
  "UGX": { iata: "QU", name: "East African" },
  "UIA": { iata: "B7", name: "Uni Air" },
  "UKM": { iata: "UF", name: "UM Airlines" },
  "UPA": { iata: "GS", name: "Air Foyle" },
  "URN": { iata: "3T", name: "Turan Air" },
  "USA": { iata: "US", name: "US Airways" },
  "UTA": { iata: "UT", name: "UTair Aviation" },
  "UTY": { iata: "QQ", name: "Alliance Airlines" },
  "UWW": { iata: "II", name: "LSM International" },
  "UZB": { iata: "HY", name: "Uzbekistan Airways" },
  "VAS": { iata: "V8", name: "ATRAN Cargo Airlines" },
  "VAX": { iata: "ZV", name: "V Air" },
  "VBW": { iata: "2J", name: "Air Burkina" },
  "VCV": { iata: "V0", name: "Conviasa" },
  "VDA": { iata: "VI", name: "Volga-Dnepr Airlines" },
  "VEX": { iata: "TV", name: "Virgin Express" },
  "VGN": { iata: "VK", name: "Virgin Nigeria Airways" },
  "VIA": { iata: "V1", name: "VIA L\xEDneas A\xE9reas" },
  "VIM": { iata: "VL", name: "Air VIA" },
  "VIR": { iata: "VS", name: "Virgin Atlantic Airways" },
  "VKH": { iata: "VQ", name: "Viking Hellas" },
  "VKJ": { iata: "KT", name: "VickJet" },
  "VLE": { iata: "VE", name: "Volare Airlines" },
  "VLG": { iata: "VY", name: "Vueling Airlines" },
  "VLK": { iata: "XF", name: "Vladivostok Air" },
  "VLM": { iata: "VG", name: "VLM Airlines" },
  "VLO": { iata: "LC", name: "Varig Log" },
  "VLU": { iata: "VF", name: "Valuair" },
  "VNP": { iata: "VH", name: "Virgin Pacific" },
  "VOE": { iata: "V7", name: "VOLOTEA Airways" },
  "VOI": { iata: "Y4", name: "Volaris" },
  "VOZ": { iata: "VA", name: "Virgin Australia" },
  "VRD": { iata: "VX", name: "Virgin America" },
  "VRN": { iata: "RG", name: "VRG Linhas Aereas" },
  "VSP": { iata: "VP", name: "VASP" },
  "VSV": { iata: "DV", name: "Scat Air" },
  "VTA": { iata: "VT", name: "Air Tahiti" },
  "VTI": { iata: "UK", name: "Air Vistara" },
  "VUN": { iata: "VU", name: "Air Ivoire" },
  "VVC": { iata: "5Z", name: "VivaColombia" },
  "VVM": { iata: "ZG", name: "Viva Macau" },
  "VVN": { iata: "47", name: "88" },
  "VWA": { iata: "YY", name: "Virginwings" },
  "WAL": { iata: "WA", name: "Western Airlines" },
  "WAU": { iata: "WU", name: "Wizz Air Ukraine" },
  "WBA": { iata: "FC", name: "Finncomm Airlines" },
  "WEB": { iata: "WJ", name: "WebJet Linhas A" },
  "WEN": { iata: "WR", name: "WestJet Encore" },
  "WER": { iata: "W4", name: "AeroWorld" },
  "WIF": { iata: "WF", name: "Wider\xF8e" },
  "WJA": { iata: "WS", name: "WestJet" },
  "WLC": { iata: "2W", name: "Welcome Air" },
  "WOA": { iata: "WO", name: "World Airways" },
  "WON": { iata: "IW", name: "Wings Air" },
  "WSS": { iata: "W3", name: "World Scale Airlines" },
  "WTA": { iata: "FK", name: "Africa West" },
  "WVL": { iata: "8Z", name: "Wizz Air Hungary" },
  "WZZ": { iata: "W6", name: "Wizz Air" },
  "XAN": { iata: "78", name: "Southjet cargo" },
  "XAU": { iata: "XA", name: "XAIR USA" },
  "XAX": { iata: "D7", name: "AirAsia X" },
  "XLA": { iata: "JN", name: "Excel Airways" },
  "XPT": { iata: "XP", name: "XPTO" },
  "YCC": { iata: "YC", name: "Ciel Canadien" },
  "YCP": { iata: "CN", name: "Canadian National Airways" },
  "YEL": { iata: "YE", name: "Yellowtail" },
  "YZZ": { iata: "YZ", name: "LSM AIRLINES" },
  "ZCS": { iata: "77", name: "Southjet connect" },
  "ZNA": { iata: "ZN", name: "Zenith International Airline" },
  "ZTF": { iata: "7M", name: "Mongolian International Air Lines" },
  "ZTT": { iata: "Z6", name: "ZABAIKAL AIRLINES" },
  "ZXY": { iata: "ZX", name: "Japan Regio" },
  "ZZZ": { iata: "ZP", name: "Zabaykalskii Airlines" }
};
var AIRLINES = new Map(Object.entries(GENERATED));
for (const [key, val] of Object.entries(OVERRIDE)) {
  AIRLINES.set(key, val);
}
function parseCallsign(cs) {
  const trimmed = cs.trim().toUpperCase();
  const m = trimmed.match(/^([A-Z]{2,4})(\d.*)$/);
  if (!m) return null;
  return { prefix: m[1] ?? "", number: m[2] ?? "" };
}
function icaoToIata(icaoPrefix) {
  return AIRLINES.get(icaoPrefix.toUpperCase());
}
function toIataCallsign(cs) {
  const p = parseCallsign(cs);
  if (!p) return null;
  const a = icaoToIata(p.prefix);
  if (!a) return null;
  return { callsign: a.iata + p.number, name: a.name };
}

// server/worldmonitor/military/v1/get-wingbits-live-flight.ts
var ECS_API_BASE = "https://ecs-api.wingbits.com/v1/flights";
var PLANESPOTTERS_API = "https://api.planespotters.net/pub/photos/hex";
var LIVE_FLIGHT_CACHE_TTL = 30;
var SCHEDULE_CACHE_TTL = 60;
var PHOTO_CACHE_TTL = 86400;
function mapEcsFlight(icao24, raw) {
  const raTsMs = raw.ra ? new Date(raw.ra).getTime() : Number.NaN;
  const lastSeenTs = raw.lastSeen ?? raw.last_seen ?? (Number.isFinite(raTsMs) ? Math.floor(raTsMs / 1e3) : 0);
  const cs = raw.callsign ?? raw.f ?? "";
  const iataInfo = toIataCallsign(cs);
  return {
    icao24: raw.icao24 ?? raw.h ?? icao24,
    callsign: cs,
    lat: raw.lat ?? raw.la ?? 0,
    lon: raw.lon ?? raw.lo ?? 0,
    altitude: raw.altitude ?? raw.ab ?? 0,
    speed: raw.speed ?? raw.gs ?? 0,
    heading: raw.heading ?? raw.tr ?? 0,
    verticalRate: raw.verticalRate ?? raw.vertical_rate ?? raw.rs ?? 0,
    registration: raw.registration ?? "",
    model: raw.model ?? "",
    operator: raw.operator ?? "",
    onGround: raw.onGround ?? raw.on_ground ?? raw.og ?? false,
    lastSeen: String(lastSeenTs),
    // Schedule fields — populated later by fetchSchedule
    depIata: "",
    arrIata: "",
    depTimeUtc: "",
    arrTimeUtc: "",
    depEstimatedUtc: "",
    arrEstimatedUtc: "",
    depDelayedMin: 0,
    arrDelayedMin: 0,
    flightStatus: "",
    flightDurationMin: 0,
    arrTerminal: "",
    // Photo fields — populated later by fetchPhoto
    photoUrl: "",
    photoLink: "",
    photoCredit: "",
    // Airline — resolved from ICAO callsign prefix
    callsignIata: iataInfo?.callsign ?? "",
    airlineName: iataInfo?.name ?? ""
  };
}
async function fetchSchedule(callsign) {
  const resp = await fetch(`${ECS_API_BASE}/schedule/${encodeURIComponent(callsign)}`, {
    headers: { Accept: "application/json", "User-Agent": CHROME_UA },
    signal: AbortSignal.timeout(6e3)
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.schedule ?? null;
}
async function fetchPhoto(icao24) {
  const resp = await fetch(`${PLANESPOTTERS_API}/${icao24}`, {
    headers: { Accept: "application/json", "User-Agent": CHROME_UA },
    signal: AbortSignal.timeout(6e3)
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.photos?.[0] ?? null;
}
async function fetchWingbitsLiveFlight(icao24) {
  const resp = await fetch(`${ECS_API_BASE}/${icao24}`, {
    headers: { Accept: "application/json", "User-Agent": CHROME_UA },
    signal: AbortSignal.timeout(8e3)
  });
  if (!resp.ok) {
    if (resp.status === 404) return null;
    throw new Error(`Wingbits ECS ${resp.status}`);
  }
  const data = await resp.json();
  if (!data.flight) return null;
  return mapEcsFlight(icao24, data.flight);
}
async function getWingbitsLiveFlight(_ctx, req) {
  if (!req.icao24) return { flight: void 0 };
  const icao24 = req.icao24.toLowerCase().trim();
  if (!/^[0-9a-f]{6}$/.test(icao24)) return { flight: void 0 };
  try {
    const liveResult = await cachedFetchJson(
      `military:wingbits-live:v1:${icao24}`,
      LIVE_FLIGHT_CACHE_TTL,
      async () => ({ flight: await fetchWingbitsLiveFlight(icao24) })
    );
    const flight = liveResult?.flight ?? null;
    if (!flight) return { flight: void 0 };
    const callsign = flight.callsign?.trim().toUpperCase() || "";
    const iataCs = flight.callsignIata || null;
    const [scheduleResult, photoResult] = await Promise.allSettled([
      callsign ? cachedFetchJson(
        `military:wingbits-sched:v1:${callsign}`,
        SCHEDULE_CACHE_TTL,
        async () => {
          const sched2 = await fetchSchedule(callsign);
          if (sched2) return { schedule: sched2 };
          if (iataCs) return { schedule: await fetchSchedule(iataCs) };
          return { schedule: null };
        }
      ) : Promise.resolve(null),
      cachedFetchJson(
        `military:wingbits-photo:v1:${icao24}`,
        PHOTO_CACHE_TTL,
        async () => ({ photo: await fetchPhoto(icao24) })
      )
    ]);
    const sched = scheduleResult.status === "fulfilled" ? scheduleResult.value?.schedule ?? null : null;
    const photo = photoResult.status === "fulfilled" ? photoResult.value?.photo ?? null : null;
    return {
      flight: {
        ...flight,
        // Schedule
        ...sched && {
          depIata: sched.depIata ?? "",
          arrIata: sched.arrIata ?? "",
          depTimeUtc: sched.depTimeUtc ?? "",
          arrTimeUtc: sched.arrTimeUtc ?? "",
          depEstimatedUtc: sched.depEstimated ?? "",
          arrEstimatedUtc: sched.arrEstimated ?? "",
          depDelayedMin: sched.depDelayed ?? 0,
          arrDelayedMin: sched.arrDelayed ?? 0,
          flightStatus: sched.status ?? "",
          flightDurationMin: sched.duration ?? 0,
          arrTerminal: sched.arrTerminal ?? ""
        },
        // Photo
        ...photo && {
          photoUrl: photo.thumbnail_large?.src ?? "",
          photoLink: photo.link ?? "",
          photoCredit: photo.photographer ?? ""
        }
      }
    };
  } catch {
    return { flight: void 0 };
  }
}

// server/worldmonitor/military/v1/list-defense-patents.ts
init_redis();
var SEED_KEY = "patents:defense:latest";
var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;
async function listDefensePatents(ctx, req) {
  try {
    const result = await getCachedJson(SEED_KEY, true);
    if (!result || !Array.isArray(result.patents)) {
      return markNoStoreFallbackResponse(ctx.request, { patents: [], total: 0, fetchedAt: "" });
    }
    const total = result.patents.length;
    let patents = result.patents;
    if (req.cpcCode) {
      const code = req.cpcCode.toUpperCase();
      patents = patents.filter((p) => p.cpcCode.startsWith(code));
    }
    if (req.assignee) {
      const kw = req.assignee.toLowerCase();
      patents = patents.filter((p) => p.assignee.toLowerCase().includes(kw));
    }
    const limit = req.limit > 0 ? Math.min(req.limit, MAX_LIMIT) : DEFAULT_LIMIT;
    patents = patents.slice(0, limit);
    return { patents, total, fetchedAt: result.fetchedAt ?? "" };
  } catch {
    return markNoStoreFallbackResponse(ctx.request, { patents: [], total: 0, fetchedAt: "" });
  }
}

// shared/defense-industrial-response.ts
function toDefenseIndustrialMetric(metric) {
  const available = Number.isFinite(metric?.value) && Number.isInteger(metric?.year);
  return {
    available,
    value: available ? Number(metric?.value) : 0,
    year: available ? Number(metric?.year) : 0,
    previousValue: Number.isFinite(metric?.previousValue) ? Number(metric?.previousValue) : 0,
    previousYear: Number.isInteger(metric?.previousYear) ? Number(metric?.previousYear) : 0,
    source: available ? String(metric?.source || "") : ""
  };
}
function emptyResponse2(countryCode) {
  const empty = toDefenseIndustrialMetric();
  return {
    countryCode,
    available: false,
    expenditurePctGdp: empty,
    expenditureUsd: empty,
    personnel: empty,
    armsExportsTiv: empty,
    armsImportsTiv: empty,
    suppliers: [],
    supplierHhi: 0,
    windowStartYear: 0,
    windowEndYear: 0,
    supplierSource: "",
    fetchedAt: "",
    industrialFetchedAt: "",
    supplierFetchedAt: "",
    supplierRetained: false,
    supplierMappingCoverage: 0
  };
}
function validTimestamp(value) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return "";
  return value;
}
function oldestTimestamp(...values) {
  return values.filter(Boolean).sort((left, right) => Date.parse(left) - Date.parse(right))[0] || "";
}
function buildDefenseIndustrialResponse(countryCode, industrial, dependencies) {
  const country = industrial?.countries?.[countryCode];
  const dependency = dependencies?.importers?.[countryCode];
  if (!country && !dependency) return emptyResponse2(countryCode);
  const suppliers = (dependency?.suppliers || []).filter((entry) => /^[A-Z]{2}$/.test(String(entry.supplierIso2 || "")) && Number.isFinite(entry.tivShare) && Number(entry.tivShare) >= 0 && Number(entry.tivShare) <= 1).map((entry) => ({ supplierIso2: String(entry.supplierIso2), tivShare: Number(entry.tivShare) }));
  const rawHhi = Number(dependency?.supplierHhi);
  const rawMappingCoverage = Number(dependency?.mappingCoverage);
  const industrialFetchedAt = country ? validTimestamp(industrial?.fetchedAt) : "";
  const supplierFetchedAt = dependency ? validTimestamp(dependency.fetchedAt) || validTimestamp(dependencies?.fetchedAt) : "";
  return {
    countryCode,
    available: true,
    expenditurePctGdp: toDefenseIndustrialMetric(country?.expenditurePctGdp),
    expenditureUsd: toDefenseIndustrialMetric(country?.expenditureUsd),
    personnel: toDefenseIndustrialMetric(country?.personnel),
    armsExportsTiv: toDefenseIndustrialMetric(country?.armsExportsTiv),
    armsImportsTiv: toDefenseIndustrialMetric(country?.armsImportsTiv),
    suppliers,
    supplierHhi: Number.isFinite(rawHhi) ? Math.max(0, Math.min(1, rawHhi)) : 0,
    windowStartYear: Number.isInteger(dependency?.window?.startYear) ? Number(dependency?.window?.startYear) : 0,
    windowEndYear: Number.isInteger(dependency?.window?.endYear) ? Number(dependency?.window?.endYear) : 0,
    supplierSource: String(dependency?.source || ""),
    // Backward-compatible aggregate freshness means "oldest source served".
    // The additive clocks below are the authoritative source-specific values.
    fetchedAt: oldestTimestamp(industrialFetchedAt, supplierFetchedAt),
    industrialFetchedAt,
    supplierFetchedAt,
    supplierRetained: Boolean(dependency?.retained),
    supplierMappingCoverage: Number.isFinite(rawMappingCoverage) ? Math.max(0, Math.min(1, rawMappingCoverage)) : 0
  };
}

// server/worldmonitor/military/v1/get-defense-industrial-base.ts
init_redis();
var INDUSTRIAL_BASE_KEY = "military:industrial-base:v1";
var ARMS_SUPPLIERS_KEY = "military:arms-suppliers:v1";
async function getDefenseIndustrialBaseWithReader(ctx, req, reader) {
  const countryCode = String(req.countryCode || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return markNoStoreFallbackResponse(ctx.request, buildDefenseIndustrialResponse(countryCode, null, null));
  }
  try {
    const [industrialRead, dependenciesRead] = await Promise.all([
      reader(INDUSTRIAL_BASE_KEY, true),
      reader(ARMS_SUPPLIERS_KEY, true)
    ]);
    const industrial = industrialRead.status === "hit" ? industrialRead.value : null;
    const dependencies = dependenciesRead.status === "hit" ? dependenciesRead.value : null;
    const response = buildDefenseIndustrialResponse(countryCode, industrial, dependencies);
    const cacheComplete = industrialRead.status === "hit" && dependenciesRead.status === "hit";
    return response.available && cacheComplete ? response : markNoStoreFallbackResponse(ctx.request, response);
  } catch {
    return markNoStoreFallbackResponse(ctx.request, buildDefenseIndustrialResponse(countryCode, null, null));
  }
}
async function getDefenseIndustrialBase(ctx, req) {
  return getDefenseIndustrialBaseWithReader(ctx, req, readCachedJson);
}

// server/worldmonitor/military/v1/handler.ts
var militaryHandler = {
  listMilitaryFlights,
  getTheaterPosture,
  getAircraftDetails,
  getAircraftDetailsBatch,
  getWingbitsStatus,
  getUSNIFleetReport,
  listMilitaryBases,
  getWingbitsLiveFlight,
  listDefensePatents,
  getDefenseIndustrialBase
};

// api/military/v1/[rpc].ts
var config = { runtime: "edge" };
var rpc_default = createDomainGateway(
  createMilitaryServiceRoutes(militaryHandler, serverOptions)
);
export {
  config,
  rpc_default as default
};
