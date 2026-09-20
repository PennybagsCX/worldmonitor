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
function buildUpstreamEvent(p) {
  return {
    _time: (/* @__PURE__ */ new Date()).toISOString(),
    event_type: "upstream",
    request_id: p.requestId,
    customer_id: p.customerId,
    route: p.route,
    tier: p.tier,
    provider: p.provider,
    operation: p.operation,
    host: p.host,
    status: p.status,
    duration_ms: p.durationMs,
    request_bytes: p.requestBytes,
    response_bytes: p.responseBytes,
    cache_status: p.cacheStatus
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
function getUsageScope() {
  return scopeStore?.getStore();
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
async function readCachedJsonList(key, limit, raw = false) {
  const boundedLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 1;
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    try {
      const { sidecarCacheGet: sidecarCacheGet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
      const value = sidecarCacheGet2(key);
      if (!Array.isArray(value) || value.length === 0) return { status: "miss" };
      return { status: "hit", value: value.slice(0, boundedLimit) };
    } catch (error) {
      return { status: "error", error };
    }
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { status: "miss" };
  const finalKey = raw ? key : prefixKey(key);
  try {
    const response = await fetch(`${url}/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor-server/1.0 (redis)"
      },
      body: JSON.stringify(["LRANGE", finalKey, "0", String(boundedLimit - 1)]),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.error) {
      return {
        status: "error",
        error: new Error(data?.error ?? `Redis HTTP ${response.status}`)
      };
    }
    if (!Array.isArray(data?.result)) {
      return {
        status: "error",
        error: new Error("Redis LRANGE returned a malformed result")
      };
    }
    if (data.result.length === 0) return { status: "miss" };
    return {
      status: "hit",
      value: data.result.map((item) => {
        if (typeof item !== "string") return item;
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      })
    };
  } catch (error) {
    return { status: "error", error };
  }
}
async function prependCachedJsonList(key, value, limit, ttlSeconds, raw = false) {
  const boundedLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 1;
  const boundedTtlSeconds = Number.isFinite(ttlSeconds) ? Math.max(1, Math.floor(ttlSeconds)) : 1;
  let encoded;
  try {
    const serialized = JSON.stringify(value);
    if (serialized === void 0) return false;
    encoded = serialized;
  } catch {
    return false;
  }
  if (process.env.LOCAL_API_MODE === "tauri-sidecar") {
    try {
      const { sidecarCacheGet: sidecarCacheGet2, sidecarCacheSet: sidecarCacheSet2 } = await Promise.resolve().then(() => (init_sidecar_cache(), sidecar_cache_exports));
      const existing = sidecarCacheGet2(key);
      const retained = Array.isArray(existing) ? existing.filter((item) => JSON.stringify(item) !== encoded) : [];
      sidecarCacheSet2(key, [value, ...retained].slice(0, boundedLimit), boundedTtlSeconds);
      return true;
    } catch (err) {
      console.warn("[redis] prependCachedJsonList failed:", errMsg(err));
      return false;
    }
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  const finalKey = raw ? key : prefixKey(key);
  const commands = [
    ["LREM", finalKey, "0", encoded],
    ["LPUSH", finalKey, encoded],
    ["LTRIM", finalKey, "0", String(boundedLimit - 1)],
    ["EXPIRE", finalKey, String(boundedTtlSeconds)]
  ];
  try {
    const response = await fetch(`${url}/multi-exec`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor-server/1.0 (redis)"
      },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(REDIS_PIPELINE_TIMEOUT_MS)
    });
    const data = await response.json().catch(() => null);
    const failedCommand = Array.isArray(data) ? data.find((item) => item.error || item.result === "ERR") : void 0;
    if (!response.ok || !Array.isArray(data) || data.length !== commands.length || failedCommand !== void 0) {
      console.warn(
        "[redis] prependCachedJsonList failed:",
        Array.isArray(data) ? failedCommand?.error ?? failedCommand?.result ?? `HTTP ${response.status}` : data?.error ?? `HTTP ${response.status}`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[redis] prependCachedJsonList failed:", errMsg(err));
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
async function cachedFetchJsonWithMeta(key, ttlSeconds, fetcher, negativeTtlSeconds = 120, opts) {
  const cached = await readCachedJson(key);
  if (cached.status === "hit") {
    if (cached.value === NEG_SENTINEL) return { data: null, source: "cache", leader: false };
    return { data: cached.value, source: "cache", leader: false };
  }
  const localPositive = readLocalPositiveFallback(key);
  if (localPositive !== void 0) return { data: localPositive, source: "cache", leader: false };
  const hadCacheReadError = cached.status === "error";
  if (cached.status === "error") {
    logCacheReadError(key, cached.error);
    if (hasLocalNegativeCooldown(key)) return { data: null, source: "cache", leader: false };
  }
  if (hasLocalUnavailableBackoff(key)) {
    throw new Error(`cachedFetchJsonWithMeta unavailable backoff active for "${key}"`);
  }
  const inflightKey = opts?.inflightKey ?? key;
  const existing = inflight.get(inflightKey);
  if (existing) {
    const data2 = await existing;
    return { data: data2, source: "fresh", leader: false };
  }
  if (opts?.shouldFetch && !opts.shouldFetch()) {
    return { data: null, source: "skipped", leader: false };
  }
  const fetchT0 = Date.now();
  let upstreamStatus = 0;
  let cacheStatus = "miss";
  const timeoutMs = opts?.timeoutMs ?? fetcherTimeoutDefaultMs;
  const promise = withFetcherTimeout(fetcher(), key, timeoutMs, "cachedFetchJsonWithMeta").then(async (result) => {
    if (result != null) {
      const noStoreReason = getRpcNoStoreReasonFromPayload(result, { includeAvailableFalse: false });
      if (noStoreReason) {
        upstreamStatus = 0;
        if (opts?.cacheFailures !== false) {
          cacheStatus = "neg-sentinel";
          armLocalNegativeCooldown(key, negativeTtlSeconds);
          await setCachedJson(key, NEG_SENTINEL, negativeTtlSeconds);
        }
      } else {
        upstreamStatus = 200;
        const wrote = await setCachedJson(key, result, ttlSeconds);
        if (hadCacheReadError || !wrote && hasRemoteRedisConfig()) {
          armLocalPositiveFallback(key, result, ttlSeconds);
        }
      }
    } else {
      upstreamStatus = 0;
      if (opts?.cacheFailures !== false) {
        cacheStatus = "neg-sentinel";
        armLocalNegativeCooldown(key, negativeTtlSeconds);
        await setCachedJson(key, NEG_SENTINEL, negativeTtlSeconds);
      }
    }
    return result;
  }).catch(async (err) => {
    upstreamStatus = 0;
    if (opts?.cacheFailures === false) {
    } else if (opts?.cacheFetcherErrors !== false) {
      cacheStatus = "neg-sentinel";
      const errorTtlSeconds = effectiveFetchErrorNegativeTtlSeconds(negativeTtlSeconds);
      armLocalNegativeCooldown(key, errorTtlSeconds);
      await setCachedJson(key, NEG_SENTINEL, errorTtlSeconds);
      console.warn(`[redis] cachedFetchJsonWithMeta fetcher failed for "${key}":`, errMsg(err));
    } else {
      armLocalUnavailableBackoff(key, FETCH_ERROR_UNAVAILABLE_BACKOFF_SECONDS);
    }
    throw err;
  }).finally(() => {
    inflight.delete(inflightKey);
  });
  inflight.set(inflightKey, promise);
  let data;
  try {
    data = await promise;
  } finally {
    emitUpstreamFromHook(opts?.usage, upstreamStatus, Date.now() - fetchT0, cacheStatus);
  }
  return { data, source: "fresh", leader: true };
}
function emitUpstreamFromHook(usage, status, durationMs, cacheStatus) {
  if (!usage?.provider) return;
  const scope = getUsageScope();
  const ctx = usage.ctx ?? scope?.ctx;
  if (!ctx) return;
  const event = buildUpstreamEvent({
    requestId: usage.requestId ?? scope?.requestId ?? "",
    customerId: usage.customerId ?? scope?.customerId ?? null,
    route: usage.route ?? scope?.route ?? "",
    tier: usage.tier ?? scope?.tier ?? 0,
    provider: usage.provider,
    operation: usage.operation ?? "fetch",
    host: usage.host ?? "",
    status,
    durationMs,
    requestBytes: 0,
    responseBytes: 0,
    cacheStatus
  });
  try {
    ctx.waitUntil(sendToAxiom([event]));
  } catch {
  }
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
        const records3 = await this.analytics.getAllowedBlocked(this.table, timestampCount);
        return records3;
      }
      async getUsageOverTime(timestampCount, groupby) {
        const result = await this.analytics.aggregateBucketsWithPipeline(this.table, groupby, timestampCount);
        return result;
      }
      async getMostAllowedBlocked(timestampCount, getTop, checkAtMost) {
        getTop = getTop ?? 5;
        const timestamp2 = void 0;
        return this.analytics.getMostAllowedBlocked(this.table, timestampCount, getTop, timestamp2, checkAtMost);
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
              var node2 = { type: "Field", name: token.value };
              if (this._lookahead(0) === TOK_LPAREN) {
                throw new Error("Quoted identifier not allowed for function names.");
              }
              return node2;
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
              var expression, node2;
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
              node2 = { type: "Function", name, children: args };
              return node2;
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
            var node2 = {
              type: "Index",
              value: this._lookaheadToken(0).value
            };
            this._advance();
            this._match(TOK_RBRACKET);
            return node2;
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
          var keyToken, keyName, value, node2;
          for (; ; ) {
            keyToken = this._lookaheadToken(0);
            if (identifierTypes.indexOf(keyToken.type) < 0) {
              throw new Error("Expecting an identifier token, got: " + keyToken.type);
            }
            keyName = keyToken.value;
            this._advance();
            this._match(TOK_COLON);
            value = this.expression(0);
            node2 = { type: "KeyValuePair", name: keyName, value };
            pairs.push(node2);
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
        search: function(node2, value) {
          return this.visit(node2, value);
        },
        visit: function(node2, value) {
          var matched, current, result, first, second, field, left, right, collected, i;
          switch (node2.type) {
            case "Field":
              if (value !== null && isObject2(value)) {
                field = value[node2.name];
                if (field === void 0) {
                  return null;
                } else {
                  return field;
                }
              }
              return null;
            case "Subexpression":
              result = this.visit(node2.children[0], value);
              for (i = 1; i < node2.children.length; i++) {
                result = this.visit(node2.children[1], result);
                if (result === null) {
                  return null;
                }
              }
              return result;
            case "IndexExpression":
              left = this.visit(node2.children[0], value);
              right = this.visit(node2.children[1], left);
              return right;
            case "Index":
              if (!isArray(value)) {
                return null;
              }
              var index = node2.value;
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
              var sliceParams = node2.children.slice(0);
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
              var base = this.visit(node2.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              collected = [];
              for (i = 0; i < base.length; i++) {
                current = this.visit(node2.children[1], base[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "ValueProjection":
              base = this.visit(node2.children[0], value);
              if (!isObject2(base)) {
                return null;
              }
              collected = [];
              var values = objValues(base);
              for (i = 0; i < values.length; i++) {
                current = this.visit(node2.children[1], values[i]);
                if (current !== null) {
                  collected.push(current);
                }
              }
              return collected;
            case "FilterProjection":
              base = this.visit(node2.children[0], value);
              if (!isArray(base)) {
                return null;
              }
              var filtered = [];
              var finalResults = [];
              for (i = 0; i < base.length; i++) {
                matched = this.visit(node2.children[2], base[i]);
                if (!isFalse(matched)) {
                  filtered.push(base[i]);
                }
              }
              for (var j = 0; j < filtered.length; j++) {
                current = this.visit(node2.children[1], filtered[j]);
                if (current !== null) {
                  finalResults.push(current);
                }
              }
              return finalResults;
            case "Comparator":
              first = this.visit(node2.children[0], value);
              second = this.visit(node2.children[1], value);
              switch (node2.name) {
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
                  throw new Error("Unknown comparator: " + node2.name);
              }
              return result;
            case TOK_FLATTEN:
              var original = this.visit(node2.children[0], value);
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
              for (i = 0; i < node2.children.length; i++) {
                collected.push(this.visit(node2.children[i], value));
              }
              return collected;
            case "MultiSelectHash":
              if (value === null) {
                return null;
              }
              collected = {};
              var child;
              for (i = 0; i < node2.children.length; i++) {
                child = node2.children[i];
                collected[child.name] = this.visit(child.value, value);
              }
              return collected;
            case "OrExpression":
              matched = this.visit(node2.children[0], value);
              if (isFalse(matched)) {
                matched = this.visit(node2.children[1], value);
              }
              return matched;
            case "AndExpression":
              first = this.visit(node2.children[0], value);
              if (isFalse(first) === true) {
                return first;
              }
              return this.visit(node2.children[1], value);
            case "NotExpression":
              first = this.visit(node2.children[0], value);
              return isFalse(first);
            case "Literal":
              return node2.value;
            case TOK_PIPE:
              left = this.visit(node2.children[0], value);
              return this.visit(node2.children[1], left);
            case TOK_CURRENT:
              return value;
            case "Function":
              var resolvedArgs = [];
              for (i = 0; i < node2.children.length; i++) {
                resolvedArgs.push(this.visit(node2.children[i], value));
              }
              return this.runtime.callFunction(node2.name, resolvedArgs);
            case "ExpressionReference":
              var refNode = node2.children[0];
              refNode.jmespathType = TOK_EXPREF;
              return refNode;
            default:
              throw new Error("Unknown node type: " + node2.type);
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
        var node2 = parser.parse(expression);
        return interpreter.search(node2, data);
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
    const unavailable2 = toUnavailableError(err);
    console.warn("[user-api-key] validateUserApiKey unavailable:", unavailable2.message);
    throw unavailable2;
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
      const normalized2 = normalizePath(pathname);
      const methods = staticPaths.get(normalized2);
      if (methods) {
        const result = Array.from(methods);
        if (result.includes("GET") && !result.includes("HEAD")) result.push("HEAD");
        return result;
      }
      const parts = normalized2.split("/").filter(Boolean);
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
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
  const level = ctx?.level === "warning" || ctx?.level === "info" || ctx?.level === "fatal" ? ctx.level : "error";
  const event = {
    event_id: eventId,
    timestamp: timestamp2,
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
  const header = JSON.stringify({ event_id: eventId, sent_at: timestamp2 });
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
  const unavailable2 = _unavailableUntil.get(userId);
  if (unavailable2 !== void 0) {
    if (unavailable2.expiresAt > Date.now()) {
      return unavailableEntitlements(unavailable2.retryAfterSeconds);
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
    const [key, fields, timestamp2, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hexpireat",
        key,
        timestamp2,
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
    const [key, fields, timestamp2, option] = cmd;
    const fieldArray = Array.isArray(fields) ? fields : [fields];
    super(
      [
        "hpexpireat",
        key,
        timestamp2,
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
  let record4 = null;
  if (typeof raw === "string") {
    try {
      record4 = JSON.parse(raw);
    } catch {
      record4 = null;
    }
  }
  if (!record4) {
    return { kind: "disabled" };
  }
  if (record4.state === "processing") {
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
  if (record4.reqHash !== reqHash) {
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
    response: new Response(record4.body, {
      status: record4.status,
      headers: {
        "Content-Type": record4.contentType ?? "application/json",
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
    const record4 = {
      state: "completed",
      status,
      contentType,
      reqHash,
      body: new TextDecoder().decode(body)
    };
    const pipeline = await runRedisPipeline([
      ["SET", redisKey, JSON.stringify(record4), "EX", String(COMPLETED_TTL_SECONDS)]
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

// src/generated/server/worldmonitor/economic/v1/service_server.ts
var ValidationError = class extends Error {
  violations;
  constructor(violations) {
    super("Validation failed");
    this.name = "ValidationError";
    this.violations = violations;
  }
};
function createEconomicServiceRoutes(handler, options) {
  return [
    {
      method: "GET",
      path: "/api/economic/v1/get-fred-series",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            seriesId: params.get("series_id") ?? "",
            limit: Number(params.get("limit") ?? "0")
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getFredSeries", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getFredSeries(ctx, body);
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
      path: "/api/economic/v1/list-world-bank-indicators",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            indicatorCode: params.get("indicator_code") ?? "",
            countryCode: params.get("country_code") ?? "",
            year: Number(params.get("year") ?? "0"),
            pageSize: Number(params.get("page_size") ?? "0"),
            cursor: params.get("cursor") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("listWorldBankIndicators", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listWorldBankIndicators(ctx, body);
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
      path: "/api/economic/v1/get-energy-prices",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            commodities: params.getAll("commodities")
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getEnergyPrices", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEnergyPrices(ctx, body);
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
      path: "/api/economic/v1/get-macro-signals",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getMacroSignals(ctx, body);
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
      path: "/api/economic/v1/get-china-macro-snapshot",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getChinaMacroSnapshot(ctx, body);
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
      path: "/api/economic/v1/get-china-activity-nowcast",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getChinaActivityNowcast(ctx, body);
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
      path: "/api/economic/v1/get-energy-capacity",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            energySources: params.getAll("energy_sources"),
            years: Number(params.get("years") ?? "0")
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getEnergyCapacity", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEnergyCapacity(ctx, body);
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
      path: "/api/economic/v1/get-bis-policy-rates",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getBisPolicyRates(ctx, body);
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
      path: "/api/economic/v1/get-bis-exchange-rates",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getBisExchangeRates(ctx, body);
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
      path: "/api/economic/v1/get-bis-credit",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getBisCredit(ctx, body);
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
      path: "/api/economic/v1/get-fred-series-batch",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = await req.json();
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getFredSeriesBatch", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getFredSeriesBatch(ctx, body);
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
      path: "/api/economic/v1/list-grocery-basket-prices",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listGroceryBasketPrices(ctx, body);
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
      path: "/api/economic/v1/list-bigmac-prices",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listBigMacPrices(ctx, body);
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
      path: "/api/economic/v1/get-national-debt",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getNationalDebt(ctx, body);
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
      path: "/api/economic/v1/list-fuel-prices",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listFuelPrices(ctx, body);
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
      path: "/api/economic/v1/get-bls-series",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            seriesId: params.get("series_id") ?? "",
            limit: Number(params.get("limit") ?? "0")
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getBlsSeries", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getBlsSeries(ctx, body);
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
      path: "/api/economic/v1/get-economic-calendar",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            fromDate: params.get("fromDate") ?? "",
            toDate: params.get("toDate") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getEconomicCalendar", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEconomicCalendar(ctx, body);
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
      path: "/api/economic/v1/get-crude-inventories",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getCrudeInventories(ctx, body);
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
      path: "/api/economic/v1/get-nat-gas-storage",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getNatGasStorage(ctx, body);
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
      path: "/api/economic/v1/get-ecb-fx-rates",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEcbFxRates(ctx, body);
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
      path: "/api/economic/v1/get-eurostat-country-data",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEurostatCountryData(ctx, body);
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
      path: "/api/economic/v1/get-eu-gas-storage",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEuGasStorage(ctx, body);
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
      path: "/api/economic/v1/get-eu-yield-curve",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEuYieldCurve(ctx, body);
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
      path: "/api/economic/v1/get-eu-fsi",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEuFsi(ctx, body);
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
      path: "/api/economic/v1/get-economic-stress",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEconomicStress(ctx, body);
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
      path: "/api/economic/v1/get-fao-food-price-index",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getFaoFoodPriceIndex(ctx, body);
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
      path: "/api/economic/v1/get-oil-stocks-analysis",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getOilStocksAnalysis(ctx, body);
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
      path: "/api/economic/v1/get-oil-inventories",
      handler: async (req) => {
        try {
          const pathParams = {};
          const body = {};
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getOilInventories(ctx, body);
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
      path: "/api/economic/v1/get-energy-crisis-policies",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            countryCode: params.get("country_code") ?? "",
            category: params.get("category") ?? ""
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("getEnergyCrisisPolicies", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.getEnergyCrisisPolicies(ctx, body);
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
      path: "/api/economic/v1/list-global-tenders",
      handler: async (req) => {
        try {
          const pathParams = {};
          const url = new URL(req.url, "http://localhost");
          const params = url.searchParams;
          const body = {
            country: params.get("country") ?? "",
            countries: params.getAll("countries"),
            region: params.get("region") ?? "",
            source: params.get("source") ?? "",
            status: params.get("status") ?? "",
            deadlineFrom: params.get("deadline_from") ?? "",
            deadlineTo: params.get("deadline_to") ?? "",
            minValue: Number(params.get("min_value") ?? "0"),
            maxValue: Number(params.get("max_value") ?? "0"),
            currency: params.get("currency") ?? "",
            category: params.get("category") ?? "",
            query: params.get("query") ?? "",
            pageSize: Number(params.get("page_size") ?? "0"),
            cursor: params.get("cursor") ?? "",
            sort: params.get("sort") ?? "",
            buyer: params.get("buyer") ?? "",
            publishedFrom: params.get("published_from") ?? "",
            publishedTo: params.get("published_to") ?? "",
            minAutomationScore: Number(params.get("min_automation_score") ?? "0")
          };
          if (options?.validateRequest) {
            const bodyViolations = options.validateRequest("listGlobalTenders", body);
            if (bodyViolations) {
              throw new ValidationError(bodyViolations);
            }
          }
          const ctx = {
            request: req,
            pathParams,
            headers: Object.fromEntries(req.headers.entries())
          };
          const result = await handler.listGlobalTenders(ctx, body);
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

// server/worldmonitor/economic/v1/get-fred-series.ts
init_redis();

// server/worldmonitor/economic/v1/_fred-shared.ts
var FRED_KEY_PREFIX = "economic:fred:v1";
function fredSeedKey(seriesId) {
  return `${FRED_KEY_PREFIX}:${seriesId}:0`;
}
function normalizeFredLimit(limit) {
  return limit > 0 ? Math.min(limit, 1e3) : 120;
}
function applyFredObservationLimit(series, limit) {
  if (limit > 0 && series.observations.length > limit) {
    return { ...series, observations: series.observations.slice(-limit) };
  }
  return series;
}

// server/worldmonitor/economic/v1/get-fred-series.ts
async function getFredSeries(_ctx, req) {
  if (!req.seriesId) return { series: void 0 };
  try {
    const seedKey = fredSeedKey(req.seriesId);
    const result = await getCachedJson(seedKey, true);
    if (!result?.series) return { series: void 0 };
    const limit = normalizeFredLimit(req.limit);
    return { series: applyFredObservationLimit(result.series, limit) };
  } catch {
    return { series: void 0 };
  }
}

// server/worldmonitor/economic/v1/get-fred-series-batch.ts
init_redis();

// server/_shared/normalize-list.ts
function toUniqueSortedLimited(values, limit) {
  return Array.from(new Set(values)).sort().slice(0, limit);
}

// server/worldmonitor/economic/v1/get-fred-series-batch.ts
var ALLOWED_SERIES = /* @__PURE__ */ new Set([
  "WALCL",
  "FEDFUNDS",
  "T10Y2Y",
  "UNRATE",
  "CPIAUCSL",
  "DGS10",
  "VIXCLS",
  "GDP",
  "M2SL",
  "DCOILWTICO",
  "BAMLH0A0HYM2",
  "ICSA",
  "MORTGAGE30US",
  "GSCPI",
  // NY Fed Global Supply Chain Pressure Index (seeded by ais-relay, not FRED API)
  "T10Y3M",
  "STLFSI4",
  // Economic Stress Index components (seeded by seed-economy.mjs)
  "DGS1MO",
  "DGS3MO",
  "DGS6MO",
  "DGS1",
  "DGS2",
  "DGS5",
  "DGS30",
  // yield curve tenors
  "BAMLC0A0CM",
  "SOFR",
  // IG OAS spread + Secured Overnight Financing Rate (seeded by seed-economy.mjs)
  "ESTR",
  "EURIBOR3M",
  "EURIBOR6M",
  "EURIBOR1Y"
  // ECB short rates (seeded by seed-ecb-short-rates.mjs)
]);
async function getFredSeriesBatch(_ctx, req) {
  try {
    const normalized2 = req.seriesIds.map((id) => id.trim().toUpperCase()).filter((id) => ALLOWED_SERIES.has(id));
    const limitedList = toUniqueSortedLimited(normalized2, 20);
    const limit = normalizeFredLimit(req.limit);
    const keysById = new Map(limitedList.map((id) => [id, fredSeedKey(id)]));
    const cachedByKey = await getCachedJsonBatch([...keysById.values()], true);
    const results = {};
    for (const id of limitedList) {
      const cached = cachedByKey.get(keysById.get(id));
      if (cached?.series) results[id] = applyFredObservationLimit(cached.series, limit);
    }
    return {
      results,
      fetched: Object.keys(results).length,
      requested: limitedList.length
    };
  } catch {
    return { results: {}, fetched: 0, requested: 0 };
  }
}

// server/_shared/constants.ts
var CHROME_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var YAHOO_MIN_GAP_MS = process.env.NODE_TEST_CONTEXT ? 1 : 600;
var yahooQueue = Promise.resolve();
var FINNHUB_MIN_GAP_MS = process.env.NODE_TEST_CONTEXT ? 1 : 350;
var finnhubQueue = Promise.resolve();

// server/worldmonitor/economic/v1/list-world-bank-indicators.ts
init_redis();
var REDIS_CACHE_KEY = "economic:worldbank:v1";
var REDIS_CACHE_TTL = 86400;
var TECH_COUNTRIES = [
  "USA",
  "CHN",
  "JPN",
  "DEU",
  "KOR",
  "GBR",
  "IND",
  "ISR",
  "SGP",
  "TWN",
  "FRA",
  "CAN",
  "SWE",
  "NLD",
  "CHE",
  "FIN",
  "IRL",
  "AUS",
  "BRA",
  "IDN",
  "ARE",
  "SAU",
  "QAT",
  "BHR",
  "EGY",
  "TUR",
  "MYS",
  "THA",
  "VNM",
  "PHL",
  "ESP",
  "ITA",
  "POL",
  "CZE",
  "DNK",
  "NOR",
  "AUT",
  "BEL",
  "PRT",
  "EST",
  "MEX",
  "ARG",
  "CHL",
  "COL",
  "ZAF",
  "NGA",
  "KEN"
];
async function fetchWorldBankIndicators(req) {
  try {
    const indicator = req.indicatorCode;
    if (!indicator) return [];
    const countryList = req.countryCode || TECH_COUNTRIES.join(";");
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const years = req.year > 0 ? req.year : 5;
    const startYear = currentYear - years;
    const wbUrl = `https://api.worldbank.org/v2/country/${countryList}/indicator/${indicator}?format=json&date=${startYear}:${currentYear}&per_page=1000`;
    const response = await fetch(wbUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": CHROME_UA
      },
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (!data || !Array.isArray(data) || data.length < 2 || !data[1]) return [];
    const records3 = data[1];
    const indicatorName = records3[0]?.indicator?.value || indicator;
    return records3.filter((r) => r.countryiso3code && r.value !== null).map((r) => ({
      countryCode: r.countryiso3code || r.country?.id || "",
      countryName: r.country?.value || "",
      indicatorCode: indicator,
      indicatorName,
      year: parseInt(r.date, 10) || 0,
      value: r.value
    }));
  } catch {
    return [];
  }
}
async function listWorldBankIndicators(_ctx, req) {
  try {
    const cacheKey = `${REDIS_CACHE_KEY}:${req.indicatorCode}:${req.countryCode || "all"}:${req.year || 0}`;
    const result = await cachedFetchJson(cacheKey, REDIS_CACHE_TTL, async () => {
      const data = await fetchWorldBankIndicators(req);
      return data.length > 0 ? { data, pagination: void 0 } : null;
    });
    return result || { data: [], pagination: void 0 };
  } catch {
    return { data: [], pagination: void 0 };
  }
}

// server/worldmonitor/economic/v1/get-energy-prices.ts
init_redis();
var SEED_CACHE_KEY = "economic:energy:v1:all";
async function getEnergyPrices(ctx, req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY, true);
    if (!result?.prices?.length) return markNoStoreFallbackResponse(ctx.request, { prices: [] });
    if (req.commodities.length > 0) {
      return { prices: result.prices.filter((p) => req.commodities.includes(p.commodity)) };
    }
    return result;
  } catch {
    return markNoStoreFallbackResponse(ctx.request, { prices: [] });
  }
}

// server/worldmonitor/economic/v1/get-macro-signals.ts
init_redis();
var SEED_CACHE_KEY2 = "economic:macro-signals:v1";
function buildFallbackResult() {
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    verdict: "UNKNOWN",
    bullishCount: 0,
    totalCount: 0,
    signals: {
      liquidity: { status: "UNKNOWN", sparkline: [] },
      flowStructure: { status: "UNKNOWN" },
      macroRegime: { status: "UNKNOWN" },
      technicalTrend: { status: "UNKNOWN", sparkline: [] },
      hashRate: { status: "UNKNOWN" },
      priceMomentum: { status: "UNKNOWN" },
      fearGreed: { status: "UNKNOWN", history: [] }
    },
    meta: { qqqSparkline: [] },
    unavailable: true
  };
}
async function getMacroSignals(_ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY2, true);
    if (result && !result.unavailable && result.totalCount > 0) return result;
    return buildFallbackResult();
  } catch {
    return buildFallbackResult();
  }
}

// server/worldmonitor/economic/v1/get-energy-capacity.ts
init_redis();
var SEED_CACHE_KEY3 = "economic:capacity:v1:COL,SUN,WND:20";
async function getEnergyCapacity(ctx, req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY3, true);
    if (!result?.series?.length) return markNoStoreFallbackResponse(ctx.request, { series: [] });
    if (req.energySources.length > 0) {
      return { series: result.series.filter((s) => req.energySources.includes(s.energySource)) };
    }
    return result;
  } catch {
    return markNoStoreFallbackResponse(ctx.request, { series: [] });
  }
}

// server/worldmonitor/economic/v1/get-bis-policy-rates.ts
init_redis();
var SEED_CACHE_KEY4 = "economic:bis:policy:v1";
async function getBisPolicyRates(ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY4, true);
    return result || markNoStoreFallbackResponse(ctx.request, { rates: [] });
  } catch {
    return markNoStoreFallbackResponse(ctx.request, { rates: [] });
  }
}

// server/worldmonitor/economic/v1/get-bis-exchange-rates.ts
init_redis();
var SEED_CACHE_KEY5 = "economic:bis:eer:v1";
async function getBisExchangeRates(ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY5, true);
    return result || markNoStoreFallbackResponse(ctx.request, { rates: [] });
  } catch {
    return markNoStoreFallbackResponse(ctx.request, { rates: [] });
  }
}

// server/worldmonitor/economic/v1/get-bis-credit.ts
init_redis();
var SEED_CACHE_KEY6 = "economic:bis:credit:v1";
async function getBisCredit(ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY6, true);
    return result || markNoStoreFallbackResponse(ctx.request, { entries: [] });
  } catch {
    return markNoStoreFallbackResponse(ctx.request, { entries: [] });
  }
}

// server/worldmonitor/economic/v1/list-grocery-basket-prices.ts
init_redis();
var SEED_CACHE_KEY7 = "economic:grocery-basket:v1";
async function listGroceryBasketPrices(_ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY7, true);
    if (!result?.countries?.length) {
      return { countries: [], fetchedAt: "", cheapestCountry: "", mostExpensiveCountry: "", upstreamUnavailable: true, wowAvgPct: 0, wowAvailable: false, prevFetchedAt: "" };
    }
    return result;
  } catch {
    return { countries: [], fetchedAt: "", cheapestCountry: "", mostExpensiveCountry: "", upstreamUnavailable: true, wowAvgPct: 0, wowAvailable: false, prevFetchedAt: "" };
  }
}

// server/worldmonitor/economic/v1/list-bigmac-prices.ts
init_redis();
var SEED_CACHE_KEY8 = "economic:bigmac:v1";
async function listBigMacPrices(ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY8, true);
    if (!result?.countries?.length) {
      return markNoStoreFallbackResponse(ctx.request, { countries: [], fetchedAt: "", cheapestCountry: "", mostExpensiveCountry: "", wowAvgPct: 0, wowAvailable: false, prevFetchedAt: "" });
    }
    return result;
  } catch {
    return markNoStoreFallbackResponse(ctx.request, { countries: [], fetchedAt: "", cheapestCountry: "", mostExpensiveCountry: "", wowAvgPct: 0, wowAvailable: false, prevFetchedAt: "" });
  }
}

// server/worldmonitor/economic/v1/get-national-debt.ts
init_redis();

// server/_shared/premium-check.ts
init_auth_session();
init_user_api_key();
var DENIED = Object.freeze({
  isPremium: false,
  userId: null,
  kind: null,
  quotaExempt: false
});
var UNAUTHENTICATED = Object.freeze({
  isPremium: false,
  userId: null,
  kind: null,
  quotaExempt: false,
  unauthenticated: true
});
function denyFor(entitlements) {
  if (!entitlements && !isEntitlementBackendConfigured()) {
    return { ...DENIED, billingDenial: unverifiableEntitlementDenial() };
  }
  const billingDenial = classifyBillingVerification(entitlements);
  return billingDenial ? { ...DENIED, billingDenial } : DENIED;
}
async function resolvePremiumCallerIdentity(request) {
  const verifiedMarker = request.headers.get(INTERNAL_MCP_VERIFIED_HEADER);
  const trustedUserId = request.headers.get(TRUSTED_USER_ID_HEADER);
  if (verifiedMarker && trustedUserId) {
    const expectedNonce = getInternalMcpVerifiedNonce();
    let diff = verifiedMarker.length ^ expectedNonce.length;
    const len = Math.max(verifiedMarker.length, expectedNonce.length);
    for (let i = 0; i < len; i++) {
      const a = i < verifiedMarker.length ? verifiedMarker.charCodeAt(i) : 0;
      const b = i < expectedNonce.length ? expectedNonce.charCodeAt(i) : 0;
      diff |= a ^ b;
    }
    if (diff === 0) {
      const ent = await getEntitlements(trustedUserId);
      if (ent && ent.features.tier >= 1 && // mcpAccess lands in U10. Until then the field is undefined for
      // existing entitlement rows; treat undefined as false (fail-closed)
      // so a misconfigured / pre-U10 row cannot grant premium semantics
      // through the internal-MCP path.
      ent.features.mcpAccess === true) {
        return { isPremium: true, userId: trustedUserId, kind: "internal-mcp", quotaExempt: true };
      }
      return denyFor(ent);
    }
  }
  const wmKey = request.headers.get("X-WorldMonitor-Key") ?? request.headers.get("X-Api-Key") ?? "";
  let userKeyLookupUnavailable = false;
  if (wmKey) {
    const validKeys = (process.env.WORLDMONITOR_VALID_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean);
    if (await timingSafeIncludes(wmKey, validKeys)) {
      return { isPremium: true, userId: null, kind: "enterprise", quotaExempt: true };
    }
    try {
      const userKey = await validateUserApiKey(wmKey);
      if (userKey) {
        const ent = await getEntitlements(userKey.userId);
        if (ent && ent.features.apiAccess === true) {
          return {
            isPremium: true,
            userId: userKey.userId,
            kind: "user-api-key",
            quotaExempt: false,
            // apiAccess proves the plan sells API access; it does NOT prove the
            // subscription is still current. resolveActiveDirectLlmLimit
            // re-checks tier + validUntil so a lapsed row cannot keep spending
            // its old allowance against the shared daily counter.
            directLlmDailyLimit: resolveActiveDirectLlmLimit(ent)
          };
        }
        return denyFor(ent);
      }
    } catch {
      userKeyLookupUnavailable = true;
    }
  }
  const keyCheck = await validateApiKey(request, {});
  if (keyCheck.valid && keyCheck.required) {
    return { isPremium: true, userId: null, kind: "enterprise", quotaExempt: true };
  }
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const session = await validateBearerToken(authHeader.slice(7));
    if (!session.valid) {
      if (session.reason === "unverifiable") {
        return { ...DENIED, billingDenial: unverifiableEntitlementDenial() };
      }
      return UNAUTHENTICATED;
    }
    if (session.role === "pro" && session.userId) {
      return {
        isPremium: true,
        userId: session.userId,
        kind: "bearer",
        quotaExempt: false,
        directLlmDailyLimit: DIRECT_LLM_UNVERIFIED_DAILY_QUOTA_LIMIT
      };
    }
    if (session.userId) {
      const ent = await getEntitlements(session.userId);
      if (ent && ent.features.tier >= 1) {
        return {
          isPremium: true,
          userId: session.userId,
          kind: "bearer",
          quotaExempt: false,
          // Premium-ness here keys on tier alone (pre-existing contract). The
          // SPEND limit is stricter on purpose: a lapsed row must not keep its
          // paid allowance, and an Enterprise row's null must not skip the
          // meter once it has expired.
          directLlmDailyLimit: resolveActiveDirectLlmLimit(ent)
        };
      }
      return denyFor(ent);
    }
  }
  if (userKeyLookupUnavailable) {
    return { ...DENIED, billingDenial: unverifiableEntitlementDenial() };
  }
  return UNAUTHENTICATED;
}
async function isCallerPremium(request) {
  return (await resolvePremiumCallerIdentity(request)).isPremium;
}

// server/worldmonitor/economic/v1/get-national-debt.ts
var SEED_CACHE_KEY9 = "economic:national-debt:v1";
function buildFallbackResult2() {
  return {
    entries: [],
    seededAt: "",
    unavailable: true
  };
}
async function getNationalDebt(ctx, _req) {
  const isPro = await isCallerPremium(ctx.request);
  if (!isPro) return buildFallbackResult2();
  try {
    const result = await getCachedJson(SEED_CACHE_KEY9, true);
    if (result && !result.unavailable && result.entries && result.entries.length > 0) return result;
    return buildFallbackResult2();
  } catch {
    return buildFallbackResult2();
  }
}

// server/worldmonitor/economic/v1/list-fuel-prices.ts
init_redis();
var SEED_CACHE_KEY10 = "economic:fuel-prices:v1";
async function listFuelPrices(ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY10, true);
    if (!result?.countries?.length) {
      return markNoStoreFallbackResponse(ctx.request, { countries: [], fetchedAt: "", cheapestGasoline: "", cheapestDiesel: "", mostExpensiveGasoline: "", mostExpensiveDiesel: "", wowAvailable: false, prevFetchedAt: "", sourceCount: 0, countryCount: 0 });
    }
    return result;
  } catch {
    return markNoStoreFallbackResponse(ctx.request, { countries: [], fetchedAt: "", cheapestGasoline: "", cheapestDiesel: "", mostExpensiveGasoline: "", mostExpensiveDiesel: "", wowAvailable: false, prevFetchedAt: "", sourceCount: 0, countryCount: 0 });
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

// server/worldmonitor/economic/v1/get-bls-series.ts
init_redis();
var BLS_KEY_PREFIX = "bls:series";
var KNOWN_SERIES_IDS = new Set(openapi_filter_param_contracts_default.economicBlsSeriesIds);
function normalizeLimit(limit) {
  return limit > 0 ? Math.min(limit, 500) : 60;
}
async function getBlsSeries(_ctx, req) {
  if (!req.seriesId) return { series: void 0 };
  if (!KNOWN_SERIES_IDS.has(req.seriesId)) return { series: void 0 };
  try {
    const seedKey = `${BLS_KEY_PREFIX}:${req.seriesId}`;
    const result = await getCachedJson(seedKey, true);
    if (!result?.series) return { series: void 0 };
    const limit = normalizeLimit(req.limit);
    const obs = result.series.observations;
    const sliced = obs.length > limit ? obs.slice(-limit) : obs;
    return { series: { ...result.series, observations: sliced } };
  } catch {
    return { series: void 0 };
  }
}

// server/worldmonitor/economic/v1/get-economic-calendar.ts
init_redis();
var SEED_CACHE_KEY11 = "economic:econ-calendar:v1";
function buildFallbackResult3() {
  return {
    events: [],
    fromDate: "",
    toDate: "",
    total: 0,
    unavailable: true
  };
}
async function getEconomicCalendar(_ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY11, true);
    if (result && !result.unavailable && Array.isArray(result.events) && result.events.length > 0) {
      return {
        events: result.events,
        fromDate: result.fromDate ?? "",
        toDate: result.toDate ?? "",
        total: result.total ?? result.events.length,
        unavailable: false
      };
    }
    return buildFallbackResult3();
  } catch {
    return buildFallbackResult3();
  }
}

// server/worldmonitor/economic/v1/get-crude-inventories.ts
init_redis();
var SEED_CACHE_KEY12 = "economic:crude-inventories:v1";
async function getCrudeInventories(ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY12, true);
    if (!result?.weeks?.length) return markNoStoreFallbackResponse(ctx.request, { weeks: [], latestPeriod: "" });
    return result;
  } catch (err) {
    console.error("[getCrudeInventories] Redis read failed:", err);
    return markNoStoreFallbackResponse(ctx.request, { weeks: [], latestPeriod: "" });
  }
}

// server/worldmonitor/economic/v1/get-nat-gas-storage.ts
init_redis();
var SEED_CACHE_KEY13 = "economic:nat-gas-storage:v1";
async function getNatGasStorage(ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY13, true);
    if (!result?.weeks?.length) return markNoStoreFallbackResponse(ctx.request, { weeks: [], latestPeriod: "" });
    return result;
  } catch (err) {
    console.error("[getNatGasStorage] Redis read failed:", err);
    return markNoStoreFallbackResponse(ctx.request, { weeks: [], latestPeriod: "" });
  }
}

// server/worldmonitor/economic/v1/get-ecb-fx-rates.ts
init_redis();
var SEED_CACHE_KEY14 = "economic:ecb-fx-rates:v1";
function buildFallback() {
  return { rates: [], updatedAt: "", seededAt: "0", unavailable: true };
}
async function getEcbFxRates(_ctx, _req) {
  try {
    const cached = await getCachedJson(SEED_CACHE_KEY14, true);
    if (!cached?.rates || Object.keys(cached.rates).length === 0) {
      return buildFallback();
    }
    const rates = Object.entries(cached.rates).map(([pair, r]) => ({
      pair,
      rate: r.rate,
      date: r.date,
      change1d: r.change1d
    }));
    return {
      rates,
      updatedAt: cached.updatedAt ?? "",
      seededAt: String(cached.seededAt ?? 0),
      unavailable: false
    };
  } catch {
    return buildFallback();
  }
}

// server/worldmonitor/economic/v1/get-eurostat-country-data.ts
init_redis();
var SEED_CACHE_KEY15 = "economic:eurostat-country-data:v1";
function buildFallbackResult4() {
  return {
    countries: {},
    seededAt: "0",
    unavailable: true
  };
}
async function getEurostatCountryData(_ctx, _req) {
  try {
    const raw = await getCachedJson(SEED_CACHE_KEY15, true);
    if (!raw || !raw.countries || Object.keys(raw.countries).length === 0) {
      return buildFallbackResult4();
    }
    return {
      countries: raw.countries,
      seededAt: String(raw.seededAt ?? "0"),
      unavailable: false
    };
  } catch {
    return buildFallbackResult4();
  }
}

// server/worldmonitor/economic/v1/get-eu-gas-storage.ts
init_redis();
var SEED_CACHE_KEY16 = "economic:eu-gas-storage:v1";
function buildFallbackResult5() {
  return {
    fillPct: 0,
    fillPctChange1d: 0,
    gasDaysConsumption: 0,
    trend: "",
    history: [],
    seededAt: "0",
    updatedAt: "",
    unavailable: true
  };
}
async function getEuGasStorage(_ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY16, true);
    if (result && !result.unavailable && typeof result.fillPct === "number" && result.fillPct > 0) {
      return {
        ...result,
        // proto int64 seeded_at → string; normalize in case older seed wrote a number
        seededAt: String(result.seededAt ?? "0"),
        // coerce nulls → 0 for older cached blobs that pre-date the null-guard fix
        fillPctChange1d: result.fillPctChange1d ?? 0,
        gasDaysConsumption: result.gasDaysConsumption ?? 0
      };
    }
    return buildFallbackResult5();
  } catch {
    return buildFallbackResult5();
  }
}

// server/worldmonitor/economic/v1/get-eu-yield-curve.ts
init_redis();
var CACHE_KEY = "economic:yield-curve-eu:v1";
async function getEuYieldCurve(_ctx, _req) {
  try {
    const cached = await getCachedJson(CACHE_KEY, true);
    if (!cached) return { unavailable: true };
    const data = cached;
    if (!data.rates || Object.keys(data.rates).length === 0) return { unavailable: true };
    return { data, unavailable: false };
  } catch {
    return { unavailable: true };
  }
}

// server/worldmonitor/economic/v1/get-eu-fsi.ts
init_redis();

// src/shared/ciss-staleness.ts
var CISS_STALE_THRESHOLD_DAYS = 10;
var CISS_STALE_THRESHOLD_MS = CISS_STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1e3;

// server/worldmonitor/economic/v1/get-eu-fsi.ts
var SEED_CACHE_KEY17 = "economic:fsi-eu:v1";
function isStale(latestDate) {
  const ts = Date.parse(latestDate);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts > CISS_STALE_THRESHOLD_MS;
}
function buildFallbackResult6() {
  return {
    latestValue: 0,
    latestDate: "",
    label: "",
    history: [],
    seededAt: "",
    unavailable: true,
    stale: false
  };
}
async function getEuFsi(_ctx, _req) {
  try {
    const raw = await getCachedJson(SEED_CACHE_KEY17, true);
    if (!raw || raw.unavailable) return buildFallbackResult6();
    const history = Array.isArray(raw.history) ? raw.history : [];
    const latestDate = String(raw.latestDate ?? "");
    return {
      latestValue: Number(raw.latestValue ?? 0),
      latestDate,
      label: String(raw.label ?? ""),
      history,
      seededAt: String(raw.seededAt ?? ""),
      unavailable: false,
      stale: isStale(latestDate)
    };
  } catch {
    return buildFallbackResult6();
  }
}

// server/worldmonitor/economic/v1/get-economic-stress.ts
init_redis();
var SEED_CACHE_KEY18 = "economic:stress-index:v1";
function buildFallbackResult7() {
  return {
    compositeScore: 0,
    label: "",
    components: [],
    seededAt: "",
    unavailable: true
  };
}
async function getEconomicStress(_ctx, _req) {
  try {
    const raw = await getCachedJson(SEED_CACHE_KEY18, true);
    if (!raw || raw.unavailable) return buildFallbackResult7();
    const components = (Array.isArray(raw.components) ? raw.components : []).map(
      (c) => {
        const isMissing = c.missing === true || c.rawValue === null || c.rawValue === void 0;
        return {
          id: String(c.id ?? ""),
          label: String(c.label ?? ""),
          rawValue: isMissing ? 0 : Number(c.rawValue),
          score: Number(c.score ?? 0),
          weight: Number(c.weight ?? 0),
          missing: isMissing
        };
      }
    );
    return {
      compositeScore: Number(raw.compositeScore ?? 0),
      label: String(raw.label ?? ""),
      components,
      seededAt: String(raw.seededAt ?? ""),
      unavailable: false
    };
  } catch {
    return buildFallbackResult7();
  }
}

// server/worldmonitor/economic/v1/get-fao-food-price-index.ts
init_redis();
var SEED_CACHE_KEY19 = "economic:fao-ffpi:v1";
var EMPTY = {
  points: [],
  fetchedAt: "",
  currentFfpi: 0,
  momPct: 0,
  yoyPct: 0
};
async function getFaoFoodPriceIndex(ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY19, true);
    if (!result?.points?.length) return markNoStoreFallbackResponse(ctx.request, EMPTY);
    return result;
  } catch {
    return markNoStoreFallbackResponse(ctx.request, EMPTY);
  }
}

// server/worldmonitor/economic/v1/get-oil-stocks-analysis.ts
init_redis();
var SEED_CACHE_KEY20 = "energy:oil-stocks-analysis:v1";
function buildFallbackResult8() {
  return {
    updatedAt: "",
    dataMonth: "",
    ieaMembers: [],
    belowObligation: [],
    unavailable: true
  };
}
async function getOilStocksAnalysis(_ctx, _req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY20, true);
    if (result && Array.isArray(result.ieaMembers) && result.ieaMembers.length > 0) {
      return { ...result, unavailable: false };
    }
    return buildFallbackResult8();
  } catch {
    return buildFallbackResult8();
  }
}

// server/worldmonitor/economic/v1/get-oil-inventories.ts
init_redis();
var CRUDE_KEY = "economic:crude-inventories:v1";
var SPR_KEY = "economic:spr:v1";
var NAT_GAS_KEY = "economic:nat-gas-storage:v1";
var EU_GAS_KEY = "economic:eu-gas-storage:v1";
var IEA_KEY = "energy:oil-stocks-analysis:v1";
var REFINERY_KEY = "economic:refinery-inputs:v1";
async function getOilInventories(_ctx, _req) {
  try {
    const [crudeRaw, sprRaw, natGasRaw, euGasRaw, ieaRaw, refineryRaw] = await Promise.all([
      getCachedJson(CRUDE_KEY, true),
      getCachedJson(SPR_KEY, true),
      getCachedJson(NAT_GAS_KEY, true),
      getCachedJson(EU_GAS_KEY, true),
      getCachedJson(IEA_KEY, true),
      getCachedJson(REFINERY_KEY, true)
    ]);
    const crudeWeeks = crudeRaw?.weeks?.map((w) => ({
      period: w.period,
      stocksMb: w.stocksMb,
      weeklyChangeMb: w.weeklyChangeMb
    })) ?? [];
    const spr = sprRaw ? {
      latestStocksMb: sprRaw.barrels ?? 0,
      changeWow: sprRaw.changeWoW ?? 0,
      weeks: sprRaw.weeks?.map((w) => ({
        period: w.period,
        stocksMb: w.barrels
      })) ?? []
    } : void 0;
    const natGasWeeks = natGasRaw?.weeks?.map((w) => ({
      period: w.period,
      storBcf: w.storBcf,
      weeklyChangeBcf: w.weeklyChangeBcf
    })) ?? [];
    const euGas = euGasRaw ? {
      fillPct: euGasRaw.fillPct ?? 0,
      fillPctChange1d: euGasRaw.fillPctChange1d ?? 0,
      trend: euGasRaw.trend ?? "",
      history: euGasRaw.history?.map((d) => ({
        date: d.date,
        fillPct: d.fillPct
      })) ?? []
    } : void 0;
    const mapRegion = (r) => r ? { avgDays: r.avgDays, minDays: r.minDays, countBelowObligation: r.countBelowObligation } : void 0;
    const ieaStocks = ieaRaw ? {
      dataMonth: ieaRaw.dataMonth ?? "",
      members: ieaRaw.ieaMembers?.map((m) => ({
        iso2: m.iso2,
        daysOfCover: m.daysOfCover,
        netExporter: m.netExporter ?? false,
        belowObligation: m.belowObligation ?? false
      })) ?? [],
      europe: mapRegion(ieaRaw.regionalSummary?.europe),
      asiaPacific: mapRegion(ieaRaw.regionalSummary?.asiaPacific),
      northAmerica: mapRegion(ieaRaw.regionalSummary?.northAmerica)
    } : void 0;
    const refinery = refineryRaw?.inputsMbblpd != null ? { inputsMbpd: refineryRaw.inputsMbblpd, period: refineryRaw.latestPeriod ?? "" } : void 0;
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return {
      crudeWeeks,
      spr,
      natGasWeeks,
      euGas,
      ieaStocks,
      refinery,
      updatedAt
    };
  } catch (err) {
    console.error("[getOilInventories] Redis read failed:", err);
    return { crudeWeeks: [], natGasWeeks: [], updatedAt: "" };
  }
}

// server/worldmonitor/economic/v1/get-energy-crisis-policies.ts
init_redis();
var SEED_CACHE_KEY21 = "energy:crisis-policies:v1";
async function getEnergyCrisisPolicies(_ctx, req) {
  try {
    const result = await getCachedJson(SEED_CACHE_KEY21, true);
    if (!result?.policies?.length) {
      return { source: "", sourceUrl: "", context: "", policies: [], updatedAt: "", unavailable: true };
    }
    let policies = result.policies;
    if (req.countryCode) {
      policies = policies.filter((p) => p.countryCode === req.countryCode);
    }
    if (req.category) {
      policies = policies.filter((p) => p.category === req.category);
    }
    return { ...result, policies, unavailable: false };
  } catch {
    return { source: "", sourceUrl: "", context: "", policies: [], updatedAt: "", unavailable: true };
  }
}

// server/worldmonitor/economic/v1/list-global-tenders.ts
init_redis();
var SEED_CACHE_KEY22 = "economic:global-tenders:v1";
var DEFAULT_PAGE_SIZE = 25;
var MAX_PAGE_SIZE = 100;
var STALE_AFTER_MS = 180 * 6e4;
function snapshotTimestamp(value) {
  if (typeof value === "number") return value;
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}
function applySnapshotFreshness(snapshot, now = Date.now()) {
  const fetchedAt = snapshotTimestamp(snapshot.fetchedAt);
  const stale = snapshot.dataAvailable === true && (snapshot.availability === "stale" || !fetchedAt || now - fetchedAt > STALE_AFTER_MS);
  if (!stale) return snapshot;
  return {
    ...snapshot,
    availability: "stale",
    sourceStatuses: (snapshot.sourceStatuses || []).map((status) => status.state === "ok" ? { ...status, state: "stale", stale: true, lastSuccessfulAt: status.lastSuccessfulAt || status.fetchedAt } : status)
  };
}
function normalized(value) {
  return (value || "").trim().toLowerCase();
}
function asTimestamp(value, fallback2) {
  const timestamp2 = Date.parse(value || "");
  return Number.isFinite(timestamp2) ? timestamp2 : fallback2;
}
function pageOffset(cursor) {
  if (!/^\d{1,6}$/.test(cursor || "")) return 0;
  const value = Number(cursor);
  return Number.isSafeInteger(value) ? value : 0;
}
function pageSize(value) {
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Number.isInteger(value) && value > 0 ? value : DEFAULT_PAGE_SIZE));
}
function matchesText(tender, query) {
  if (!query) return true;
  return [tender.title, tender.description, tender.buyer, tender.source, ...tender.categoryCodes, ...tender.sectors].filter(Boolean).join(" ").toLowerCase().includes(query);
}
function compareTenders(sort, left, right) {
  const byId = left.id.localeCompare(right.id);
  if (sort === "closing_soon") {
    return asTimestamp(left.deadline, Number.MAX_SAFE_INTEGER) - asTimestamp(right.deadline, Number.MAX_SAFE_INTEGER) || byId;
  }
  if (sort === "estimated_value") return (right.money?.amount || 0) - (left.money?.amount || 0) || byId;
  if (sort === "relevance") return (right.automationFit?.score || 0) - (left.automationFit?.score || 0) || byId;
  return asTimestamp(right.publishedAt || right.updatedAt, 0) - asTimestamp(left.publishedAt || left.updatedAt, 0) || byId;
}
function filterAndPaginateTenders(tenders, req) {
  const countries = new Set([req.country, ...req.countries || []].map((value) => normalized(value)).filter(Boolean));
  const region = normalized(req.region);
  const source = normalized(req.source);
  const status = normalized(req.status);
  const currency = normalized(req.currency);
  const category = normalized(req.category);
  const query = normalized(req.query);
  const buyer = normalized(req.buyer);
  const deadlineFrom = asTimestamp(req.deadlineFrom, Number.NEGATIVE_INFINITY);
  const deadlineTo = asTimestamp(req.deadlineTo, Number.POSITIVE_INFINITY);
  const publishedFrom = asTimestamp(req.publishedFrom, Number.NEGATIVE_INFINITY);
  const publishedTo = asTimestamp(req.publishedTo, Number.POSITIVE_INFINITY);
  const hasDeadlineFrom = Boolean(req.deadlineFrom);
  const hasDeadlineTo = Boolean(req.deadlineTo);
  const hasPublishedFrom = Boolean(req.publishedFrom);
  const hasPublishedTo = Boolean(req.publishedTo);
  const minValue = req.minValue > 0 ? req.minValue : null;
  const maxValue = req.maxValue > 0 ? req.maxValue : null;
  const minAutomationScore = Number.isInteger(req.minAutomationScore) && req.minAutomationScore > 0 ? Math.min(100, req.minAutomationScore) : null;
  const sort = ["newest", "closing_soon", "estimated_value", "relevance"].includes(req.sort) ? req.sort : "newest";
  const appliedFilters = [
    countries.size && "country",
    region && "region",
    source && "source",
    status && "status",
    hasDeadlineFrom && "deadline_from",
    hasDeadlineTo && "deadline_to",
    minValue !== null && "min_value",
    maxValue !== null && "max_value",
    currency && "currency",
    category && "category",
    query && "query",
    buyer && "buyer",
    hasPublishedFrom && "published_from",
    hasPublishedTo && "published_to",
    minAutomationScore !== null && "min_automation_score"
  ].filter((value) => Boolean(value));
  const filtered = tenders.filter((tender) => {
    const amount = tender.money?.amount;
    const deadline = asTimestamp(tender.deadline, Number.NaN);
    const published = asTimestamp(tender.publishedAt, Number.NaN);
    return (!countries.size || countries.has(normalized(tender.countryCode))) && (!region || normalized(tender.region) === region) && (!source || normalized(tender.source) === source) && (!status || normalized(tender.status) === status) && (!buyer || normalized(tender.buyer).includes(buyer)) && (!hasDeadlineFrom || Number.isFinite(deadline) && deadline >= deadlineFrom) && (!hasDeadlineTo || Number.isFinite(deadline) && deadline <= deadlineTo) && (!hasPublishedFrom || Number.isFinite(published) && published >= publishedFrom) && (!hasPublishedTo || Number.isFinite(published) && published <= publishedTo) && (minValue === null || typeof amount === "number" && amount >= minValue) && (maxValue === null || typeof amount === "number" && amount <= maxValue) && (!currency || normalized(tender.money?.currency) === currency) && (!category || [...tender.categoryCodes, ...tender.sectors].some((value) => normalized(value).includes(category))) && (minAutomationScore === null || (tender.automationFit?.score || 0) >= minAutomationScore) && matchesText(tender, query);
  }).sort((left, right) => compareTenders(sort, left, right));
  const observedCountries = new Set(tenders.map((tender) => normalized(tender.countryCode)).filter(Boolean));
  const countryCoverage = countries.size === 0 ? "not_requested" : [...countries].every((country) => observedCountries.has(country)) ? "observed" : "unknown";
  const size = pageSize(req.pageSize);
  const start = pageOffset(req.cursor);
  const page = start < filtered.length ? filtered.slice(start, start + size) : [];
  const next = start + page.length;
  return { tenders: page, nextCursor: next < filtered.length ? String(next) : "", total: filtered.length, appliedFilters, countryCoverage };
}
function unavailable(ctx) {
  return markNoStoreFallbackResponse(ctx.request, {
    tenders: [],
    nextCursor: "",
    fetchedAt: "",
    dataAvailable: false,
    availability: "unavailable",
    sourceStatuses: [],
    total: 0,
    appliedFilters: [],
    countryCoverage: "unknown"
  });
}
async function listGlobalTenders(ctx, req) {
  try {
    const snapshot = await getCachedJson(SEED_CACHE_KEY22, true);
    if (!snapshot || !Array.isArray(snapshot.tenders) || !Array.isArray(snapshot.sourceStatuses)) return unavailable(ctx);
    const freshSnapshot = applySnapshotFreshness(snapshot);
    const page = filterAndPaginateTenders(freshSnapshot.tenders || [], req);
    return {
      ...page,
      fetchedAt: freshSnapshot.fetchedAt ? new Date(freshSnapshot.fetchedAt).toISOString() : "",
      dataAvailable: freshSnapshot.dataAvailable === true,
      availability: freshSnapshot.availability || "unavailable",
      sourceStatuses: freshSnapshot.sourceStatuses || []
    };
  } catch {
    return unavailable(ctx);
  }
}

// server/worldmonitor/economic/v1/get-china-macro-snapshot.ts
init_redis();

// shared/bootstrap-tier-keys.js
var BOOTSTRAP_CACHE_KEYS = Object.freeze({
  earthquakes: "seismology:earthquakes:v1",
  outages: "infra:outages:v1",
  serviceStatuses: "infra:service-statuses:v1",
  ddosAttacks: "cf:radar:ddos:v1",
  trafficAnomalies: "cf:radar:traffic-anomalies:v1",
  marketQuotes: "market:stocks-bootstrap:v1",
  commodityQuotes: "market:commodities-bootstrap:v1",
  sectors: "market:sectors:v2",
  etfFlows: "market:etf-flows:v1",
  macroSignals: "economic:macro-signals:v1",
  bisPolicy: "economic:bis:policy:v1",
  bisExchange: "economic:bis:eer:v1",
  bisCredit: "economic:bis:credit:v1",
  bisDsr: "economic:bis:dsr:v1",
  bisPropertyResidential: "economic:bis:property-residential:v1",
  bisPropertyCommercial: "economic:bis:property-commercial:v1",
  imfMacro: "economic:imf:macro:v2",
  imfGrowth: "economic:imf:growth:v1",
  imfLabor: "economic:imf:labor:v1",
  imfExternal: "economic:imf:external:v1",
  chinaMacro: "economic:china:macro:v2",
  chinaReleaseCalendar: "economic:china:release-calendar:v1",
  chinaCorporateDisclosures: "market:china:corporate-disclosures:v1",
  chinaPolicyEvents: "china:policy-events:v1",
  chinaDecisionSignals: "intelligence:china-decision-signals:v1",
  shippingRates: "supply_chain:shipping:v2",
  chokepoints: "supply_chain:chokepoints:v4",
  minerals: "supply_chain:minerals:v2",
  giving: "giving:summary:v2",
  climateAnomalies: "climate:anomalies:v2",
  climateDisasters: "climate:disasters:v1",
  co2Monitoring: "climate:co2-monitoring:v1",
  oceanIce: "climate:ocean-ice:v1",
  climateNews: "climate:news-intelligence:v1",
  radiationWatch: "radiation:observations:v1",
  thermalEscalation: "thermal:escalation-bootstrap:v1",
  crossSourceSignals: "intelligence:cross-source-signals:v1",
  wildfires: "wildfire:fires-bootstrap:v1",
  cyberThreats: "cyber:threats-bootstrap:v2",
  techReadiness: "economic:worldbank-techreadiness:v1",
  progressData: "economic:worldbank-progress:v1",
  renewableEnergy: "economic:worldbank-renewable:v1",
  positiveGeoEvents: "positive_events:geo-bootstrap:v1",
  theaterPosture: "theater_posture:sebuf:stale:v1",
  riskScores: "risk:scores:sebuf:stale:v8",
  naturalEvents: "natural:events:v1",
  flightDelays: "aviation:delays-bootstrap:v2",
  insights: "news:insights:v1",
  predictions: "prediction:markets-bootstrap:v1",
  cryptoQuotes: "market:crypto:v1",
  cryptoSectors: "market:crypto-sectors:v1",
  defiTokens: "market:defi-tokens:v1",
  aiTokens: "market:ai-tokens:v1",
  otherTokens: "market:other-tokens:v1",
  gulfQuotes: "market:gulf-quotes:v1",
  stablecoinMarkets: "market:stablecoins:v1",
  unrestEvents: "unrest:events:v1",
  iranEvents: "conflict:iran-events:v1",
  ucdpEvents: "conflict:ucdp-events-bootstrap:v1",
  temporalAnomalies: "temporal:anomalies:v1",
  weatherAlerts: "weather:alerts:v1",
  spending: "economic:spending:v1",
  techEvents: "research:tech-events-bootstrap:v1",
  gdeltIntel: "intelligence:gdelt-intel:v1",
  correlationCards: "correlation:cards-bootstrap:v1",
  crossStraitActivity: "military:cross-strait-activity-bootstrap:v1",
  forecasts: "forecast:predictions-bootstrap:v1",
  securityAdvisories: "intelligence:advisories-bootstrap:v1",
  customsRevenue: "trade:customs-revenue:v1",
  sanctionsPressure: "sanctions:pressure:v1",
  consumerPricesOverview: "consumer-prices:overview:ae",
  consumerPricesCategories: "consumer-prices:categories:ae:30d",
  consumerPricesMovers: "consumer-prices:movers:ae:30d",
  consumerPricesSpread: "consumer-prices:retailer-spread:ae:essentials-ae",
  groceryBasket: "economic:grocery-basket:v1",
  bigmac: "economic:bigmac:v1",
  fuelPrices: "economic:fuel-prices:v1",
  faoFoodPriceIndex: "economic:fao-ffpi:v1",
  nationalDebt: "economic:national-debt:v1",
  euGasStorage: "economic:eu-gas-storage:v1",
  eurostatCountryData: "economic:eurostat-country-data:v1",
  eurostatHousePrices: "economic:eurostat:house-prices:v1",
  eurostatGovDebtQ: "economic:eurostat:gov-debt-q:v1",
  eurostatIndProd: "economic:eurostat:industrial-production:v1",
  marketImplications: "intelligence:market-implications:v1",
  fearGreedIndex: "market:fear-greed:v1",
  hyperliquidFlow: "market:hyperliquid:flow:v1",
  crudeInventories: "economic:crude-inventories:v1",
  natGasStorage: "economic:nat-gas-storage:v1",
  ecbFxRates: "economic:ecb-fx-rates:v1",
  cbrRates: "economic:cbr-rates:v1",
  fxYoy: "economic:fx:yoy:v1",
  sharedFxRates: "shared:fx-rates:v1",
  euFsi: "economic:fsi-eu:v1",
  shippingStress: "supply_chain:shipping_stress:v1",
  socialVelocity: "intelligence:social:reddit:v1",
  wsbTickers: "intelligence:wsb-tickers:v1",
  pizzint: "intelligence:pizzint:seed:v1",
  diseaseOutbreaks: "health:disease-outbreaks:v1",
  economicStress: "economic:stress-index:v1",
  electricityPrices: "energy:electricity:v1:index",
  jodiOil: "energy:jodi-oil:v1:_countries",
  chokepointBaselines: "energy:chokepoint-baselines:v1",
  portwatchChokepointsRef: "portwatch:chokepoints:ref:v1",
  portwatchPortActivity: "supply_chain:portwatch-ports:v1:_countries",
  oilStocksAnalysis: "energy:oil-stocks-analysis:v1",
  lngVulnerability: "energy:lng-vulnerability:v1",
  sprPolicies: "energy:spr-policies:v1",
  pipelinesGas: "energy:pipelines:gas:v1",
  pipelinesOil: "energy:pipelines:oil:v1",
  storageFacilities: "energy:storage-facilities:v1",
  fuelShortages: "energy:fuel-shortages:v1",
  energyDisruptions: "energy:disruptions:v1",
  energyCrisisPolicies: "energy:crisis-policies:v1",
  aaiiSentiment: "market:aaii-sentiment:v1",
  breadthHistory: "market:breadth-history:v1",
  marketCorrelationSeries: "market:correlation-series:v1"
});
var SLOW_KEY_NAMES = /* @__PURE__ */ new Set([
  "bisPolicy",
  "bisExchange",
  "bisCredit",
  "chinaMacro",
  "chinaReleaseCalendar",
  "chinaCorporateDisclosures",
  "minerals",
  "giving",
  "sectors",
  "etfFlows",
  "wildfires",
  "climateAnomalies",
  "climateDisasters",
  "co2Monitoring",
  "oceanIce",
  "climateNews",
  "radiationWatch",
  "thermalEscalation",
  "crossSourceSignals",
  "crossStraitActivity",
  "techReadiness",
  "progressData",
  "renewableEnergy",
  "naturalEvents",
  "cryptoQuotes",
  "cryptoSectors",
  "defiTokens",
  "aiTokens",
  "otherTokens",
  "gulfQuotes",
  "stablecoinMarkets",
  "unrestEvents",
  "ucdpEvents",
  "techEvents",
  "securityAdvisories",
  "customsRevenue",
  "sanctionsPressure",
  "consumerPricesOverview",
  "consumerPricesCategories",
  "consumerPricesMovers",
  "consumerPricesSpread",
  "groceryBasket",
  "bigmac",
  "fuelPrices",
  "faoFoodPriceIndex",
  "nationalDebt",
  "euGasStorage",
  "eurostatCountryData",
  "marketImplications",
  "fearGreedIndex",
  "hyperliquidFlow",
  "crudeInventories",
  "natGasStorage",
  "ecbFxRates",
  "euFsi",
  "diseaseOutbreaks",
  "economicStress",
  "pizzint",
  "oilStocksAnalysis",
  "lngVulnerability",
  "pipelinesGas",
  "pipelinesOil",
  "storageFacilities",
  "fuelShortages",
  "energyCrisisPolicies",
  "aaiiSentiment",
  "breadthHistory"
]);
var FAST_KEY_NAMES = /* @__PURE__ */ new Set([
  "earthquakes",
  "outages",
  "serviceStatuses",
  "ddosAttacks",
  "trafficAnomalies",
  "macroSignals",
  "chokepoints",
  "marketQuotes",
  "commodityQuotes",
  "positiveGeoEvents",
  "riskScores",
  "flightDelays",
  "insights",
  "predictions",
  "iranEvents",
  "temporalAnomalies",
  "weatherAlerts",
  "spending",
  "theaterPosture",
  "gdeltIntel",
  "correlationCards",
  "forecasts",
  "shippingRates",
  "shippingStress",
  "socialVelocity",
  "wsbTickers"
]);
var ON_DEMAND_KEY_NAMES = /* @__PURE__ */ new Set([
  "cyberThreats",
  "chinaPolicyEvents",
  "chinaDecisionSignals",
  "bisDsr",
  "bisPropertyResidential",
  "bisPropertyCommercial",
  // One row of this feeds the Central Banks tab's policy-rate list, which BIS
  // cannot supply for Russia. On-demand rather than tiered: the tab fetches it
  // through the credential-less per-key URL when it renders, so the ~8KB never
  // rides a payload every visitor downloads.
  "cbrRates",
  "imfMacro",
  "imfGrowth",
  "imfLabor",
  "imfExternal",
  "eurostatHousePrices",
  "eurostatGovDebtQ",
  "eurostatIndProd",
  "electricityPrices",
  "jodiOil",
  "chokepointBaselines",
  "portwatchChokepointsRef",
  "portwatchPortActivity",
  "sprPolicies",
  "energyDisruptions",
  // Both back the opt-in FX panel (#6199). On-demand rather than tiered
  // because that panel ships disabled by default: neither payload should ride
  // a tier every visitor downloads to render a surface almost nobody has on.
  // NOTE: no apostrophes in this block. scripts/docs-stats.mjs scans these
  // Sets with a bare quote matcher, so one apostrophe in prose opens a phantom
  // string and gets registered as a duplicate key.
  "fxYoy",
  "sharedFxRates",
  "marketCorrelationSeries"
]);
function tierForKey(name) {
  if (FAST_KEY_NAMES.has(name)) return "fast";
  if (SLOW_KEY_NAMES.has(name)) return "slow";
  if (ON_DEMAND_KEY_NAMES.has(name)) return "on-demand";
  throw new Error(`Bootstrap cache key "${name}" has no tier assignment`);
}
var BOOTSTRAP_TIERS = Object.freeze(Object.fromEntries(
  Object.keys(BOOTSTRAP_CACHE_KEYS).map((name) => [name, tierForKey(name)])
));

// server/_shared/cache-keys.ts
var CHINA_MACRO_KEY = BOOTSTRAP_CACHE_KEYS.chinaMacro;
var CHINA_RELEASE_CALENDAR_KEY = BOOTSTRAP_CACHE_KEYS.chinaReleaseCalendar;
var CHINA_CORRIDOR_CONTROL_TOWERS_KEY = "supply_chain:china-corridor-control-towers:v1";
var CHINA_ACTIVITY_NOWCAST_KEY = "economic:china:activity-nowcast:v1";
var CHINA_CORRIDOR_DIRECTIONAL_HISTORY_KEY = "economic:china:corridor-directional-history:v1";

// shared/china-macro-contract.js
var CHINA_MACRO_SCHEMA_VERSION = 2;
var CHINA_MACRO_PROVENANCE_FAMILY = "china_macro_official_numeric_observation";
var CHINA_MACRO_MAX_TRANSPORT_AGE_MIN = 3 * 24 * 60;
var CHINA_MACRO_MAX_CONTENT_AGE_MIN = 45 * 24 * 60;
var CHINA_MACRO_REQUIRED_SERIES = Object.freeze([
  "nbs_industrial_value_added_yoy",
  "nbs_fixed_asset_investment_yoy",
  "nbs_real_estate_investment_yoy",
  "safe_fx_reserves",
  "safe_bank_fx_settlement"
]);
var CHINA_MACRO_SERIES_MAX_AGE_DAYS = Object.freeze({
  nbs_industrial_value_added_yoy: 75,
  nbs_fixed_asset_investment_yoy: 75,
  nbs_real_estate_investment_yoy: 75,
  safe_fx_reserves: 45,
  safe_bank_fx_settlement: 45
});
var CHINA_MACRO_PUBLISHER_IDS = Object.freeze({
  nbs: "publisher:nbs-cn",
  pboc: "publisher:pboc-cn",
  safe: "publisher:safe-cn",
  gacc: "publisher:gacc-cn"
});
var CHINA_MACRO_SERIES_CONTRACT = Object.freeze({
  nbs_industrial_value_added_yoy: Object.freeze({
    pillar: "activity",
    unit: "%",
    periodKind: "month",
    source: "National Bureau of Statistics of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.nbs,
    sourceHost: "www.stats.gov.cn",
    sourcePathPrefix: "/english/PressRelease/"
  }),
  nbs_fixed_asset_investment_yoy: Object.freeze({
    pillar: "investment_property",
    unit: "%",
    periodKind: "cumulative_year",
    source: "National Bureau of Statistics of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.nbs,
    sourceHost: "www.stats.gov.cn",
    sourcePathPrefix: "/english/PressRelease/"
  }),
  nbs_real_estate_investment_yoy: Object.freeze({
    pillar: "investment_property",
    unit: "%",
    periodKind: "cumulative_year",
    source: "National Bureau of Statistics of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.nbs,
    sourceHost: "www.stats.gov.cn",
    sourcePathPrefix: "/english/PressRelease/"
  }),
  safe_fx_reserves: Object.freeze({
    pillar: "external_pressure",
    unit: "USD 100 million",
    periodKind: "point_in_time",
    source: "State Administration of Foreign Exchange",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.safe,
    sourceHost: "www.safe.gov.cn",
    sourcePathPrefix: "/safe/"
  }),
  safe_bank_fx_settlement: Object.freeze({
    pillar: "external_pressure",
    unit: "CNY 100 million",
    periodKind: "month",
    source: "State Administration of Foreign Exchange",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.safe,
    sourceHost: "www.safe.gov.cn",
    sourcePathPrefix: "/safe/"
  }),
  pboc_aggregate_financing_flow: Object.freeze({
    pillar: "credit_liquidity",
    unit: "CNY 100 million",
    periodKind: "month",
    source: "People\u2019s Bank of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.pboc,
    sourceHost: "www.pbc.gov.cn",
    sourcePathPrefix: "/"
  }),
  pboc_new_rmb_loans: Object.freeze({
    pillar: "credit_liquidity",
    unit: "CNY 100 million",
    periodKind: "month",
    source: "People\u2019s Bank of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.pboc,
    sourceHost: "www.pbc.gov.cn",
    sourcePathPrefix: "/"
  }),
  pboc_m2_yoy: Object.freeze({
    pillar: "credit_liquidity",
    unit: "%",
    periodKind: "month",
    source: "People\u2019s Bank of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.pboc,
    sourceHost: "www.pbc.gov.cn",
    sourcePathPrefix: "/"
  }),
  pboc_policy_liquidity_operation: Object.freeze({
    pillar: "credit_liquidity",
    unit: "CNY 100 million",
    periodKind: "point_in_time",
    source: "People\u2019s Bank of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.pboc,
    sourceHost: "www.pbc.gov.cn",
    sourcePathPrefix: "/"
  }),
  gacc_exports: Object.freeze({
    pillar: "trade",
    unit: "USD million",
    periodKind: "month",
    source: "General Administration of Customs of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.gacc,
    sourceHost: "english.customs.gov.cn",
    sourcePathPrefix: "/"
  }),
  gacc_imports: Object.freeze({
    pillar: "trade",
    unit: "USD million",
    periodKind: "month",
    source: "General Administration of Customs of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.gacc,
    sourceHost: "english.customs.gov.cn",
    sourcePathPrefix: "/"
  }),
  gacc_trade_balance: Object.freeze({
    pillar: "trade",
    unit: "USD million",
    periodKind: "month",
    source: "General Administration of Customs of China",
    publisherId: CHINA_MACRO_PUBLISHER_IDS.gacc,
    sourceHost: "english.customs.gov.cn",
    sourcePathPrefix: "/"
  })
});
var CHINA_MACRO_SERIES_IDS = Object.freeze(Object.keys(CHINA_MACRO_SERIES_CONTRACT));
function chinaMacroObservationDateMs(value) {
  if (typeof value !== "string" || !value) return null;
  const month = /^(\d{4})-(\d{2})$/.exec(value);
  const parsed = month ? Date.UTC(Number(month[1]), Number(month[2]), 0, 23, 59, 59) : Date.parse(`${value}${/^\d{4}-\d{2}-\d{2}$/.test(value) ? "T23:59:59Z" : ""}`);
  return Number.isFinite(parsed) ? parsed : null;
}
function isChinaMacroObservationStale(seriesId, observationPeriod, now = Date.now()) {
  const maxAgeDays = CHINA_MACRO_SERIES_MAX_AGE_DAYS[seriesId];
  const observedAt = chinaMacroObservationDateMs(observationPeriod);
  return !Number.isFinite(maxAgeDays) || observedAt == null || now - observedAt > maxAgeDays * 864e5;
}

// shared/decision-signal-provenance-contract.ts
var DECISION_SIGNAL_PROVENANCE_CONTRACT_VERSION = "decision-signal-provenance/v1";
var DECISION_SIGNAL_PROVENANCE_DIMENSIONS = [
  "publisher",
  "source_url",
  "original_reference",
  "original_language",
  "translation",
  "observation_time",
  "effective_time",
  "publication_time",
  "retrieval_time",
  "revision",
  "supersession",
  "extraction_confidence",
  "classification_confidence",
  "corroboration",
  "transport_freshness",
  "content_freshness",
  "derivation"
];
var DECISION_SIGNAL_PROVENANCE_CLAIM_STATUSES = [
  "known",
  "unknown",
  "not_applicable"
];
var DECISION_SIGNAL_PUBLISHER_TYPES = [
  "official_government",
  "state_controlled_media",
  "official_exchange",
  "independent_observation",
  "independent_media",
  "wire_service",
  "market_publisher",
  "derived_output",
  "unknown"
];
var DECISION_SIGNAL_ORIGINAL_REFERENCE_KINDS = [
  "document",
  "text",
  "observation",
  "event",
  "dataset"
];
var DECISION_SIGNAL_TRANSLATION_STATES = [
  "unavailable",
  "not_translated",
  "machine_assisted",
  "human_reviewed"
];
var DECISION_SIGNAL_TIME_PRECISIONS = [
  "instant",
  "day",
  "month",
  "year"
];
var DECISION_SIGNAL_REVISION_STATES = [
  "preliminary",
  "original",
  "revised",
  "corrected"
];
var DECISION_SIGNAL_SUPERSESSION_STATES = [
  "current",
  "corrected",
  "cancelled",
  "superseded"
];
var DECISION_SIGNAL_CORROBORATION_STATES = [
  "single_source",
  "multi_source",
  "independently_corroborated",
  "contradicted"
];
var DECISION_SIGNAL_TRANSPORT_FRESHNESS_STATES = [
  "fresh",
  "stale",
  "missing",
  "error"
];
var DECISION_SIGNAL_CONTENT_FRESHNESS_STATES = [
  "current",
  "stale",
  "unavailable",
  "partial",
  "timestamp_unknown"
];
var DECISION_SIGNAL_PROVENANCE_SURFACES = [
  "cache_storage",
  "api",
  "mcp",
  "ui"
];

// shared/decision-signal-provenance-families.ts
function dimensions(policies) {
  return Object.freeze(policies);
}
function declaration(id, kind, description, policies) {
  return Object.freeze({
    id,
    kind,
    description,
    dimensions: dimensions(policies)
  });
}
var DECISION_SIGNAL_PROVENANCE_FAMILY_DECLARATIONS = Object.freeze({
  official_numeric_observation: declaration(
    "official_numeric_observation",
    "official_numeric_observation",
    "A revision-aware numeric observation released by an official publisher.",
    {
      publisher: "required",
      source_url: "required",
      original_reference: "required",
      original_language: "unknown_allowed",
      translation: "not_applicable",
      observation_time: "required",
      effective_time: "unknown_allowed",
      publication_time: "required",
      retrieval_time: "required",
      revision: "required",
      supersession: "required",
      extraction_confidence: "required",
      classification_confidence: "not_applicable",
      corroboration: "unknown_allowed",
      transport_freshness: "required",
      content_freshness: "required",
      derivation: "not_applicable"
    }
  ),
  china_macro_official_numeric_observation: declaration(
    "china_macro_official_numeric_observation",
    "official_numeric_observation",
    "A revision-aware China macro-financial observation from a bounded official release.",
    {
      publisher: "required",
      source_url: "required",
      original_reference: "required",
      original_language: "unknown_allowed",
      translation: "not_applicable",
      observation_time: "required",
      effective_time: "unknown_allowed",
      publication_time: "required",
      retrieval_time: "required",
      revision: "required",
      supersession: "required",
      extraction_confidence: "required",
      classification_confidence: "not_applicable",
      corroboration: "unknown_allowed",
      transport_freshness: "required",
      content_freshness: "required",
      derivation: "not_applicable"
    }
  ),
  typed_document_event: declaration(
    "typed_document_event",
    "typed_document_event",
    "A typed event extracted from a policy, enforcement, or other source document.",
    {
      publisher: "required",
      source_url: "required",
      original_reference: "required",
      original_language: "required",
      translation: "required",
      observation_time: "not_applicable",
      effective_time: "unknown_allowed",
      publication_time: "required",
      retrieval_time: "required",
      revision: "unknown_allowed",
      supersession: "required",
      extraction_confidence: "required",
      classification_confidence: "required",
      corroboration: "unknown_allowed",
      transport_freshness: "required",
      content_freshness: "required",
      derivation: "not_applicable"
    }
  ),
  operational_activity_record: declaration(
    "operational_activity_record",
    "operational_activity_record",
    "A time-bounded operational observation such as activity, movement, or disruption.",
    {
      publisher: "required",
      source_url: "required",
      original_reference: "required",
      original_language: "unknown_allowed",
      translation: "unknown_allowed",
      observation_time: "required",
      effective_time: "unknown_allowed",
      publication_time: "unknown_allowed",
      retrieval_time: "required",
      revision: "unknown_allowed",
      supersession: "required",
      extraction_confidence: "required",
      classification_confidence: "required",
      corroboration: "unknown_allowed",
      transport_freshness: "required",
      content_freshness: "required",
      derivation: "not_applicable"
    }
  ),
  exchange_disclosure: declaration(
    "exchange_disclosure",
    "exchange_disclosure",
    "An issuer disclosure or correction published through an official market authority.",
    {
      publisher: "required",
      source_url: "required",
      original_reference: "required",
      original_language: "required",
      translation: "required",
      observation_time: "not_applicable",
      effective_time: "unknown_allowed",
      publication_time: "required",
      retrieval_time: "required",
      revision: "required",
      supersession: "required",
      extraction_confidence: "required",
      classification_confidence: "required",
      corroboration: "unknown_allowed",
      transport_freshness: "required",
      content_freshness: "required",
      derivation: "not_applicable"
    }
  ),
  composed_corridor_condition: declaration(
    "composed_corridor_condition",
    "composed_corridor_condition",
    "A derived corridor state composed from explicitly identified operational inputs.",
    {
      publisher: "required",
      source_url: "not_applicable",
      original_reference: "not_applicable",
      original_language: "not_applicable",
      translation: "not_applicable",
      observation_time: "required",
      effective_time: "required",
      publication_time: "not_applicable",
      retrieval_time: "required",
      revision: "required",
      supersession: "required",
      extraction_confidence: "not_applicable",
      classification_confidence: "required",
      corroboration: "required",
      transport_freshness: "required",
      content_freshness: "required",
      derivation: "required"
    }
  ),
  derived_comparison: declaration(
    "derived_comparison",
    "derived_comparison",
    "A transparent comparison derived from time-aligned source observations.",
    {
      publisher: "required",
      source_url: "not_applicable",
      original_reference: "not_applicable",
      original_language: "not_applicable",
      translation: "not_applicable",
      observation_time: "required",
      effective_time: "required",
      publication_time: "not_applicable",
      retrieval_time: "required",
      revision: "required",
      supersession: "required",
      extraction_confidence: "not_applicable",
      classification_confidence: "required",
      corroboration: "required",
      transport_freshness: "required",
      content_freshness: "required",
      derivation: "required"
    }
  )
});
var DECISION_SIGNAL_PROVENANCE_FAMILY_REGISTRATIONS = Object.freeze({
  official_numeric_observation: Object.freeze({
    launchStatus: "reference",
    serializationFixtureId: "official-numeric-revised"
  }),
  china_macro_official_numeric_observation: Object.freeze({
    launchStatus: "launched",
    serializationFixtureId: "china-macro-official-numeric"
  }),
  typed_document_event: Object.freeze({
    launchStatus: "launched",
    serializationFixtureId: "typed-document-translated"
  }),
  operational_activity_record: Object.freeze({
    // Launched by the cross-Strait official-activity lane (#5575). Domain
    // fixtures validate daily Taiwan MND claims and reviewed Japan MOD records.
    launchStatus: "launched",
    serializationFixtureId: "operational-stale-transport"
  }),
  exchange_disclosure: Object.freeze({
    launchStatus: "launched",
    serializationFixtureId: "exchange-disclosure-superseded"
  }),
  composed_corridor_condition: Object.freeze({
    launchStatus: "launched",
    serializationFixtureId: "corridor-stale-content"
  }),
  derived_comparison: Object.freeze({
    // Launched by the final China decision-parity composition (#5580). The
    // comparison method remains owned by its source lane; this registration
    // only admits its already-reviewed deterministic result to API/MCP/UI.
    launchStatus: "launched",
    serializationFixtureId: "derived-comparison"
  })
});

// shared/source-provenance-declarations.ts
var CONFIGURED_SOURCE_PROVENANCE_DECLARATIONS = Object.freeze({
  "20VC Episodes": { risk: "unknown", type: "unknown" },
  "24.hu": { risk: "unknown", type: "reviewed" },
  "36Kr English": { risk: "unknown", type: "reviewed" },
  "444.hu": { risk: "unknown", type: "reviewed" },
  "500 Global News": { risk: "unknown", type: "unknown" },
  "a16z Blog": { risk: "unknown", type: "unknown" },
  "a16z Insights": { risk: "unknown", type: "unknown" },
  "Aaj Tak": { risk: "unknown", type: "reviewed" },
  "ABC News": { risk: "unknown", type: "unknown" },
  "ABC News Australia": { risk: "unknown", type: "unknown" },
  "Acquired Episodes": { risk: "unknown", type: "unknown" },
  "Actualite.cd": { risk: "unknown", type: "unknown" },
  "Africa News": { risk: "unknown", type: "unknown" },
  "Africa Startups": { risk: "unknown", type: "unknown" },
  "Africa Tech News": { risk: "unknown", type: "unknown" },
  "Africanews": { risk: "unknown", type: "unknown" },
  "Aftenposten": { risk: "reviewed", type: "reviewed" },
  "Agriculture": { risk: "unknown", type: "unknown" },
  "AI Interviews": { risk: "unknown", type: "unknown" },
  "AI News": { risk: "unknown", type: "reviewed" },
  "AI Now Institute": { risk: "unknown", type: "reviewed" },
  "AI Podcasts": { risk: "unknown", type: "unknown" },
  "AI Regulation": { risk: "unknown", type: "unknown" },
  "AI Weekly": { risk: "unknown", type: "unknown" },
  "Al Arabiya": { risk: "reviewed", type: "unknown" },
  "Al Jazeera": { risk: "reviewed", type: "reviewed" },
  "All-In Podcast": { risk: "unknown", type: "reviewed" },
  "Aluminum & Zinc": { risk: "unknown", type: "unknown" },
  "Amar Ujala": { risk: "unknown", type: "reviewed" },
  "AngelList News": { risk: "unknown", type: "unknown" },
  "ANSA": { risk: "unknown", type: "reviewed" },
  "Anthropic News": { risk: "unknown", type: "unknown" },
  "AP Mexico": { risk: "unknown", type: "unknown" },
  "AP News": { risk: "reviewed", type: "reviewed" },
  "Arab News": { risk: "unknown", type: "unknown" },
  "Arabian Business": { risk: "unknown", type: "unknown" },
  "Arctic Today": { risk: "reviewed", type: "reviewed" },
  "Armenpress": { risk: "reviewed", type: "reviewed" },
  "Arms Control Assn": { risk: "unknown", type: "reviewed" },
  "Ars Technica": { risk: "unknown", type: "reviewed" },
  "ArXiv AI": { risk: "unknown", type: "reviewed" },
  "ArXiv ML": { risk: "unknown", type: "unknown" },
  "Asahi Shimbun": { risk: "unknown", type: "unknown" },
  "Asharq Business": { risk: "unknown", type: "unknown" },
  "Asharq News": { risk: "unknown", type: "unknown" },
  "Asia News": { risk: "unknown", type: "unknown" },
  "Asia Pacific Tech": { risk: "unknown", type: "unknown" },
  "Asia VC News": { risk: "unknown", type: "unknown" },
  "Atlantic Council": { risk: "unknown", type: "reviewed" },
  "ATV": { risk: "unknown", type: "reviewed" },
  "Australian Mining": { risk: "unknown", type: "unknown" },
  "AWS Status": { risk: "unknown", type: "unknown" },
  "Axios": { risk: "unknown", type: "reviewed" },
  "Azertag": { risk: "reviewed", type: "reviewed" },
  "Balkan Insight": { risk: "unknown", type: "reviewed" },
  "Bangkok Post": { risk: "unknown", type: "unknown" },
  "Bank Research": { risk: "unknown", type: "unknown" },
  "Banking Rules": { risk: "unknown", type: "unknown" },
  "BBC Africa": { risk: "unknown", type: "unknown" },
  "BBC Afrique": { risk: "unknown", type: "unknown" },
  "BBC Asia": { risk: "unknown", type: "unknown" },
  "BBC Hindi": { risk: "unknown", type: "reviewed" },
  "BBC Latin America": { risk: "unknown", type: "unknown" },
  "BBC Middle East": { risk: "reviewed", type: "reviewed" },
  "BBC Mundo": { risk: "unknown", type: "reviewed" },
  "BBC Persian": { risk: "unknown", type: "unknown" },
  "BBC Russian": { risk: "unknown", type: "unknown" },
  "BBC Turkce": { risk: "unknown", type: "unknown" },
  "BBC World": { risk: "reviewed", type: "reviewed" },
  "Bellingcat": { risk: "reviewed", type: "reviewed" },
  "Benchmark Mineral": { risk: "unknown", type: "unknown" },
  "BHP News": { risk: "unknown", type: "unknown" },
  "Bihus.Info": { risk: "reviewed", type: "reviewed" },
  "Bild": { risk: "unknown", type: "unknown" },
  "Bitcoin Magazine": { risk: "unknown", type: "unknown" },
  "Blockchain Finance": { risk: "unknown", type: "unknown" },
  "Bloomberg Commodities": { risk: "unknown", type: "unknown" },
  "Bloomberg Crypto": { risk: "unknown", type: "unknown" },
  "Bloomberg Energy": { risk: "unknown", type: "unknown" },
  "Bloomberg Markets": { risk: "unknown", type: "unknown" },
  "BoE Watch": { risk: "unknown", type: "unknown" },
  "BoJ Watch": { risk: "unknown", type: "unknown" },
  "Bond Market": { risk: "unknown", type: "unknown" },
  "Brasil Paralelo": { risk: "reviewed", type: "reviewed" },
  "Brazil Tech": { risk: "unknown", type: "unknown" },
  "Breaking Defense": { risk: "unknown", type: "reviewed" },
  "Brookings": { risk: "unknown", type: "reviewed" },
  "Brookings Tech": { risk: "unknown", type: "reviewed" },
  "Bulletin of Atomic Scientists": { risk: "unknown", type: "reviewed" },
  "Carnegie": { risk: "unknown", type: "reviewed" },
  "CB Insights": { risk: "unknown", type: "unknown" },
  "CB Insights Unicorn": { risk: "unknown", type: "unknown" },
  "CBC News": { risk: "reviewed", type: "reviewed" },
  "CBS News": { risk: "unknown", type: "unknown" },
  "CDC": { risk: "unknown", type: "reviewed" },
  "Central Bank Rates": { risk: "unknown", type: "unknown" },
  "Changelog": { risk: "unknown", type: "unknown" },
  "Channels TV": { risk: "unknown", type: "unknown" },
  "Chatham House": { risk: "unknown", type: "unknown" },
  "Chatham House Tech": { risk: "unknown", type: "reviewed" },
  "China Commodity Imports": { risk: "unknown", type: "unknown" },
  "China Mineral Policy": { risk: "unknown", type: "unknown" },
  "China Startups": { risk: "unknown", type: "unknown" },
  "China Tech Analysis": { risk: "unknown", type: "unknown" },
  "China Tech Giants": { risk: "unknown", type: "unknown" },
  "China Tech Policy": { risk: "unknown", type: "unknown" },
  "Chosun Ilbo": { risk: "unknown", type: "unknown" },
  "CISA": { risk: "unknown", type: "reviewed" },
  "Citi Newsroom": { risk: "unknown", type: "unknown" },
  "Civil.ge": { risk: "reviewed", type: "reviewed" },
  "Clar\xEDn": { risk: "unknown", type: "unknown" },
  "Cloud Outages": { risk: "unknown", type: "unknown" },
  "CNA": { risk: "unknown", type: "unknown" },
  "CNAS": { risk: "unknown", type: "reviewed" },
  "CNBC": { risk: "unknown", type: "reviewed" },
  "CNBC Commodities": { risk: "unknown", type: "unknown" },
  "CNBC Tech": { risk: "unknown", type: "unknown" },
  "CNN World": { risk: "unknown", type: "reviewed" },
  "Cobalt Market": { risk: "unknown", type: "unknown" },
  "CoinDesk": { risk: "unknown", type: "unknown" },
  "Cointelegraph": { risk: "unknown", type: "unknown" },
  "Commodity Futures": { risk: "unknown", type: "unknown" },
  "Commodity Trading": { risk: "unknown", type: "unknown" },
  "Conservation Optimism": { risk: "unknown", type: "unknown" },
  "Copper Market": { risk: "unknown", type: "unknown" },
  "Corporate Bonds": { risk: "unknown", type: "unknown" },
  "Correctiv": { risk: "unknown", type: "reviewed" },
  "Corriere della Sera": { risk: "unknown", type: "reviewed" },
  "CrisisWatch": { risk: "unknown", type: "reviewed" },
  "Critical Mineral Companies": { risk: "unknown", type: "unknown" },
  "Crunchbase News": { risk: "unknown", type: "unknown" },
  "Crypto News": { risk: "unknown", type: "unknown" },
  "Crypto Regulation": { risk: "unknown", type: "unknown" },
  "CryptoSlate": { risk: "unknown", type: "unknown" },
  "CSIS": { risk: "unknown", type: "reviewed" },
  "CSIS Tech": { risk: "unknown", type: "reviewed" },
  "Dabanga Sudan": { risk: "unknown", type: "unknown" },
  "Dagens Nyheter": { risk: "unknown", type: "reviewed" },
  "Daily Sabah": { risk: "reviewed", type: "reviewed" },
  "Daily Trust": { risk: "unknown", type: "unknown" },
  "DailyGood": { risk: "unknown", type: "unknown" },
  "Dark Reading": { risk: "unknown", type: "unknown" },
  "Dawn": { risk: "unknown", type: "reviewed" },
  "De Telegraaf": { risk: "unknown", type: "reviewed" },
  "Decacorn News": { risk: "unknown", type: "unknown" },
  "Decrypt": { risk: "unknown", type: "unknown" },
  "Defense News": { risk: "unknown", type: "reviewed" },
  "Defense One": { risk: "unknown", type: "reviewed" },
  "DeFi News": { risk: "unknown", type: "unknown" },
  "Demo Day News": { risk: "unknown", type: "unknown" },
  "Der Spiegel": { risk: "unknown", type: "reviewed" },
  "Dev Events": { risk: "unknown", type: "unknown" },
  "Dev.to": { risk: "unknown", type: "unknown" },
  "DevOps.com": { risk: "unknown", type: "unknown" },
  "DFRLab": { risk: "unknown", type: "reviewed" },
  "DHS": { risk: "unknown", type: "reviewed" },
  "Die Zeit": { risk: "unknown", type: "reviewed" },
  "Digi24": { risk: "reviewed", type: "reviewed" },
  "DigiChina": { risk: "unknown", type: "reviewed" },
  "DL News": { risk: "unknown", type: "unknown" },
  "Dnevnik": { risk: "reviewed", type: "reviewed" },
  "DOJ": { risk: "unknown", type: "reviewed" },
  "Dollar Watch": { risk: "unknown", type: "unknown" },
  "DR Nyheder": { risk: "reviewed", type: "reviewed" },
  "DW News": { risk: "reviewed", type: "reviewed" },
  "DW Turkish": { risk: "unknown", type: "unknown" },
  "Earnings Reports": { risk: "unknown", type: "unknown" },
  "ECB Watch": { risk: "unknown", type: "unknown" },
  "ECFR": { risk: "unknown", type: "unknown" },
  "Economic Data": { risk: "unknown", type: "unknown" },
  "EFF News": { risk: "unknown", type: "reviewed" },
  "EIA Reports": { risk: "unknown", type: "unknown" },
  "El Mundo": { risk: "unknown", type: "reviewed" },
  "El Pa\xEDs": { risk: "unknown", type: "reviewed" },
  "El Tiempo": { risk: "unknown", type: "unknown" },
  "El Universo": { risk: "unknown", type: "unknown" },
  "Energy Crisis & Shortages": { risk: "unknown", type: "unknown" },
  "Energy Intel": { risk: "unknown", type: "unknown" },
  "Energy Sanctions": { risk: "unknown", type: "unknown" },
  "Engadget": { risk: "unknown", type: "unknown" },
  "ERR News": { risk: "reviewed", type: "reviewed" },
  "ESG in Mining": { risk: "unknown", type: "unknown" },
  "Ethiopia Insight": { risk: "unknown", type: "unknown" },
  "EU Commission Digital": { risk: "unknown", type: "unknown" },
  "EU Digital Policy": { risk: "unknown", type: "unknown" },
  "EU ISS": { risk: "unknown", type: "reviewed" },
  "EU Startups": { risk: "unknown", type: "reviewed" },
  "EU Tech Policy": { risk: "unknown", type: "unknown" },
  "Euractiv Digital": { risk: "unknown", type: "unknown" },
  "Eurasianet": { risk: "reviewed", type: "reviewed" },
  "EuroNews": { risk: "reviewed", type: "reviewed" },
  "EV Battery Supply": { risk: "unknown", type: "unknown" },
  "FAO GIEWS": { risk: "unknown", type: "reviewed" },
  "FAO News": { risk: "unknown", type: "unknown" },
  "Fars News": { risk: "unknown", type: "unknown" },
  "FAS": { risk: "unknown", type: "unknown" },
  "Fast Company": { risk: "unknown", type: "unknown" },
  "Federal Reserve": { risk: "unknown", type: "reviewed" },
  "FEMA": { risk: "unknown", type: "reviewed" },
  "Financial Regulation": { risk: "unknown", type: "unknown" },
  "Financial Times": { risk: "reviewed", type: "reviewed" },
  "FinTech LATAM": { risk: "unknown", type: "unknown" },
  "Fintech News": { risk: "unknown", type: "unknown" },
  "First Round Review": { risk: "unknown", type: "unknown" },
  "Focus Taiwan": { risk: "unknown", type: "reviewed" },
  "Folha de S.Paulo": { risk: "unknown", type: "unknown" },
  "Foreign Affairs": { risk: "unknown", type: "reviewed" },
  "Foreign Policy": { risk: "unknown", type: "reviewed" },
  "Forex News": { risk: "unknown", type: "unknown" },
  "Fortune Term Sheet": { risk: "unknown", type: "unknown" },
  "Fox News": { risk: "unknown", type: "unknown" },
  "FPRI": { risk: "unknown", type: "reviewed" },
  "France 24": { risk: "reviewed", type: "reviewed" },
  "France 24 LatAm": { risk: "unknown", type: "unknown" },
  "Freeport & Copper Miners": { risk: "unknown", type: "unknown" },
  "FT Energy": { risk: "unknown", type: "unknown" },
  "Futures Trading": { risk: "unknown", type: "unknown" },
  "FwdStart Newsletter": { risk: "unknown", type: "unknown" },
  "FX Empire Gold": { risk: "unknown", type: "unknown" },
  "G4Media": { risk: "reviewed", type: "reviewed" },
  "gCaptain": { risk: "unknown", type: "reviewed" },
  "Geo News": { risk: "unknown", type: "reviewed" },
  "GitHub Blog": { risk: "unknown", type: "unknown" },
  "GitHub Trending": { risk: "unknown", type: "unknown" },
  "GITOC": { risk: "unknown", type: "reviewed" },
  "Glencore & Vale": { risk: "unknown", type: "unknown" },
  "Global Central Banks": { risk: "unknown", type: "unknown" },
  "Global News": { risk: "reviewed", type: "reviewed" },
  "Globe and Mail": { risk: "reviewed", type: "reviewed" },
  "GMF": { risk: "unknown", type: "reviewed" },
  "GNN Animals": { risk: "unknown", type: "unknown" },
  "GNN Earth": { risk: "unknown", type: "unknown" },
  "GNN Health": { risk: "unknown", type: "unknown" },
  "GNN Heroes": { risk: "unknown", type: "unknown" },
  "GNN Heroes Spotlight": { risk: "unknown", type: "unknown" },
  "GNN Science": { risk: "unknown", type: "unknown" },
  "Gold & Metals": { risk: "unknown", type: "unknown" },
  "Gold Majors": { risk: "unknown", type: "unknown" },
  "Gold Price News": { risk: "unknown", type: "unknown" },
  "Gold Silver Worlds": { risk: "unknown", type: "unknown" },
  "GoldSeek": { risk: "unknown", type: "unknown" },
  "Good Good Good": { risk: "unknown", type: "unknown" },
  "GOOD Magazine": { risk: "unknown", type: "unknown" },
  "Good News Network": { risk: "unknown", type: "unknown" },
  "Greater Good (Berkeley)": { risk: "unknown", type: "unknown" },
  "Guardian Americas": { risk: "unknown", type: "unknown" },
  "Guardian Australia": { risk: "unknown", type: "unknown" },
  "Guardian ME": { risk: "unknown", type: "reviewed" },
  "Guardian World": { risk: "reviewed", type: "reviewed" },
  "Gulf FDI": { risk: "unknown", type: "unknown" },
  "Gulf Investments": { risk: "unknown", type: "unknown" },
  "Haaretz": { risk: "unknown", type: "unknown" },
  "Hacker News": { risk: "unknown", type: "reviewed" },
  "Hard Fork (NYT)": { risk: "unknown", type: "reviewed" },
  "Hedge Fund News": { risk: "unknown", type: "unknown" },
  "Hiiraan Online": { risk: "unknown", type: "unknown" },
  "H\xEDrad\xF3": { risk: "unknown", type: "reviewed" },
  "HotNews": { risk: "reviewed", type: "reviewed" },
  "Housing Market": { risk: "unknown", type: "unknown" },
  "How I Built This": { risk: "unknown", type: "reviewed" },
  "Hromadske": { risk: "reviewed", type: "reviewed" },
  "Hromadske EN": { risk: "reviewed", type: "reviewed" },
  "Human Progress": { risk: "unknown", type: "unknown" },
  "Hurriyet": { risk: "unknown", type: "unknown" },
  "HVG": { risk: "unknown", type: "reviewed" },
  "IAEA": { risk: "unknown", type: "reviewed" },
  "IEA Critical Minerals": { risk: "unknown", type: "unknown" },
  "IEA News": { risk: "unknown", type: "unknown" },
  "iefimerida": { risk: "unknown", type: "unknown" },
  "in.gr": { risk: "unknown", type: "unknown" },
  "Inc42 (India)": { risk: "unknown", type: "reviewed" },
  "Index.hr": { risk: "unknown", type: "reviewed" },
  "Index.hu": { risk: "unknown", type: "reviewed" },
  "India News Network": { risk: "unknown", type: "unknown" },
  "India Startups": { risk: "unknown", type: "unknown" },
  "India Tech News": { risk: "unknown", type: "unknown" },
  "India Tech Policy": { risk: "unknown", type: "unknown" },
  "Indian Express": { risk: "unknown", type: "unknown" },
  "Indonesia Nickel Policy": { risk: "unknown", type: "unknown" },
  "Indonesia Tech": { risk: "unknown", type: "unknown" },
  "Infobae Americas": { risk: "unknown", type: "unknown" },
  "InfoQ": { risk: "unknown", type: "unknown" },
  "InSight Crime": { risk: "unknown", type: "unknown" },
  "Investing.com News": { risk: "unknown", type: "unknown" },
  "IPO News": { risk: "unknown", type: "unknown" },
  "Iran International": { risk: "unknown", type: "unknown" },
  "IRNA": { risk: "reviewed", type: "unknown" },
  "Iron Ore Market": { risk: "unknown", type: "unknown" },
  "Irrawaddy": { risk: "unknown", type: "reviewed" },
  "ISEAS (Singapore)": { risk: "unknown", type: "unknown" },
  "Island Times (Palau)": { risk: "unknown", type: "unknown" },
  "ISW": { risk: "reviewed", type: "reviewed" },
  "Jakarta Post": { risk: "unknown", type: "reviewed" },
  "Jamestown": { risk: "unknown", type: "reviewed" },
  "JAMnews": { risk: "reviewed", type: "reviewed" },
  "Janes": { risk: "unknown", type: "reviewed" },
  "Japan Startups": { risk: "unknown", type: "unknown" },
  "Japan Tech News": { risk: "unknown", type: "unknown" },
  "Japan Today": { risk: "unknown", type: "unknown" },
  "Jerusalem Post": { risk: "reviewed", type: "unknown" },
  "Jeune Afrique": { risk: "unknown", type: "unknown" },
  "Jutarnji list": { risk: "unknown", type: "reviewed" },
  "Kathimerini": { risk: "unknown", type: "unknown" },
  "Kitco Gold": { risk: "unknown", type: "unknown" },
  "Kitco News": { risk: "unknown", type: "unknown" },
  "Korea Startups": { risk: "unknown", type: "unknown" },
  "Korea Tech News": { risk: "unknown", type: "unknown" },
  "KrASIA": { risk: "unknown", type: "unknown" },
  "Krebs Security": { risk: "unknown", type: "reviewed" },
  "Kyiv Independent": { risk: "reviewed", type: "reviewed" },
  "La Silla Vac\xEDa": { risk: "unknown", type: "unknown" },
  "LATAM Startups": { risk: "unknown", type: "unknown" },
  "Latin America": { risk: "unknown", type: "unknown" },
  "LAVCA (LATAM)": { risk: "unknown", type: "unknown" },
  "Layoffs News": { risk: "unknown", type: "reviewed" },
  "Layoffs.fyi": { risk: "unknown", type: "reviewed" },
  "Le Monde": { risk: "reviewed", type: "reviewed" },
  "Le Quotidien": { risk: "unknown", type: "unknown" },
  "Lenny's Newsletter": { risk: "unknown", type: "unknown" },
  "Lex Fridman Tech": { risk: "unknown", type: "unknown" },
  "Lighthouse Reports": { risk: "unknown", type: "reviewed" },
  "Lithium Market": { risk: "unknown", type: "unknown" },
  "Live Science": { risk: "unknown", type: "unknown" },
  "LME Metals": { risk: "unknown", type: "unknown" },
  "Lobsters": { risk: "unknown", type: "unknown" },
  "Lowy Institute": { risk: "unknown", type: "reviewed" },
  "LRT English": { risk: "reviewed", type: "reviewed" },
  "LSM English": { risk: "reviewed", type: "reviewed" },
  "M&A News": { risk: "unknown", type: "unknown" },
  "Market Outlook": { risk: "unknown", type: "unknown" },
  "MarketWatch": { risk: "unknown", type: "reviewed" },
  "MarketWatch Tech": { risk: "unknown", type: "unknown" },
  "Masters of Scale": { risk: "unknown", type: "reviewed" },
  "Meduza": { risk: "reviewed", type: "reviewed" },
  "Mehr News": { risk: "reviewed", type: "unknown" },
  "MENA Startups": { risk: "unknown", type: "unknown" },
  "MENA Tech News": { risk: "unknown", type: "unknown" },
  "Messari": { risk: "unknown", type: "unknown" },
  "Metals Bulletin": { risk: "unknown", type: "unknown" },
  "Mexico News Daily": { risk: "unknown", type: "unknown" },
  "Mexico Security": { risk: "unknown", type: "unknown" },
  "Middle East Institute": { risk: "unknown", type: "unknown" },
  "MIIT (China)": { risk: "reviewed", type: "reviewed" },
  "Military Times": { risk: "unknown", type: "reviewed" },
  "Mine Web (SNL)": { risk: "unknown", type: "unknown" },
  "Mining & Resources": { risk: "unknown", type: "unknown" },
  "Mining Journal": { risk: "unknown", type: "unknown" },
  "Mining Regulation": { risk: "unknown", type: "unknown" },
  "Mining Technology": { risk: "unknown", type: "unknown" },
  "Mining Weekly": { risk: "unknown", type: "unknown" },
  "Mining.com": { risk: "unknown", type: "unknown" },
  "MIT Research": { risk: "unknown", type: "unknown" },
  "MIT Tech Policy": { risk: "unknown", type: "unknown" },
  "MIT Tech Review": { risk: "unknown", type: "reviewed" },
  "MOFCOM (China)": { risk: "reviewed", type: "reviewed" },
  "Mongabay": { risk: "unknown", type: "unknown" },
  "Moscow Times": { risk: "reviewed", type: "reviewed" },
  "MyJoyOnline": { risk: "unknown", type: "unknown" },
  "N1 Croatia": { risk: "unknown", type: "reviewed" },
  "Naftemporiki": { risk: "unknown", type: "unknown" },
  "Natural Gas & LNG": { risk: "unknown", type: "unknown" },
  "Natural Gas News": { risk: "unknown", type: "unknown" },
  "Nature News": { risk: "unknown", type: "unknown" },
  "NBC News": { risk: "unknown", type: "unknown" },
  "NDTV": { risk: "unknown", type: "unknown" },
  "NDTV India": { risk: "unknown", type: "reviewed" },
  "New Scientist": { risk: "unknown", type: "unknown" },
  "New Unicorns": { risk: "unknown", type: "unknown" },
  "News24": { risk: "unknown", type: "unknown" },
  "NewsMaker": { risk: "reviewed", type: "reviewed" },
  "NFT News": { risk: "unknown", type: "unknown" },
  "Nickel News": { risk: "unknown", type: "unknown" },
  "Nikkei Asia": { risk: "unknown", type: "reviewed" },
  "Nikkei Tech": { risk: "unknown", type: "reviewed" },
  "Northern Miner": { risk: "unknown", type: "unknown" },
  "NOS Nieuws": { risk: "unknown", type: "reviewed" },
  "Novaya Gazeta Europe": { risk: "unknown", type: "unknown" },
  "NPR News": { risk: "unknown", type: "reviewed" },
  "NRC": { risk: "unknown", type: "reviewed" },
  "NRK": { risk: "reviewed", type: "reviewed" },
  "NTI": { risk: "unknown", type: "unknown" },
  "Nuclear Energy": { risk: "unknown", type: "unknown" },
  "NV EN": { risk: "reviewed", type: "reviewed" },
  "O Globo": { risk: "unknown", type: "unknown" },
  "OC Media": { risk: "reviewed", type: "reviewed" },
  "OCCRP": { risk: "unknown", type: "reviewed" },
  "OECD Digital": { risk: "unknown", type: "reviewed" },
  "Oil & Gas": { risk: "unknown", type: "unknown" },
  "OilPrice.com": { risk: "unknown", type: "unknown" },
  "Oman Observer": { risk: "unknown", type: "unknown" },
  "OPEC & Crude": { risk: "unknown", type: "unknown" },
  "OPEC News": { risk: "unknown", type: "unknown" },
  "Open Source News": { risk: "unknown", type: "unknown" },
  "OpenAI News": { risk: "unknown", type: "unknown" },
  "Optimist Daily": { risk: "unknown", type: "unknown" },
  "Options Market": { risk: "unknown", type: "unknown" },
  "ORF Tech (India)": { risk: "unknown", type: "unknown" },
  "Oryx OSINT": { risk: "unknown", type: "reviewed" },
  "Paul Graham Essays": { risk: "unknown", type: "unknown" },
  "PBoC Watch": { risk: "unknown", type: "unknown" },
  "PBS NewsHour": { risk: "unknown", type: "unknown" },
  "Pentagon": { risk: "unknown", type: "reviewed" },
  "Pipelines & Chokepoints": { risk: "unknown", type: "unknown" },
  "PitchBook News": { risk: "unknown", type: "unknown" },
  "Pivot Podcast": { risk: "unknown", type: "unknown" },
  "Politico": { risk: "unknown", type: "reviewed" },
  "Politico Tech": { risk: "unknown", type: "reviewed" },
  "Polsat News": { risk: "unknown", type: "unknown" },
  "Port & Logistics": { risk: "unknown", type: "unknown" },
  "Port & Terminal": { risk: "unknown", type: "unknown" },
  "Portfolio.hu": { risk: "unknown", type: "reviewed" },
  "Positive.News": { risk: "unknown", type: "unknown" },
  "Precious Metals": { risk: "unknown", type: "unknown" },
  "Premium Times": { risk: "unknown", type: "unknown" },
  "Primicias": { risk: "unknown", type: "unknown" },
  "Private Equity": { risk: "unknown", type: "unknown" },
  "Product Hunt": { risk: "unknown", type: "unknown" },
  "Proto Thema": { risk: "unknown", type: "unknown" },
  "Radio Okapi": { risk: "unknown", type: "unknown" },
  "Radio Tamazuj": { risk: "unknown", type: "unknown" },
  "RAND": { risk: "unknown", type: "reviewed" },
  "Ransomware.live": { risk: "unknown", type: "unknown" },
  "Rappler": { risk: "unknown", type: "reviewed" },
  "Rare Earths News": { risk: "unknown", type: "unknown" },
  "Reasons to be Cheerful": { risk: "unknown", type: "unknown" },
  "Refinery & Disruptions": { risk: "unknown", type: "unknown" },
  "Renaissance IPO": { risk: "unknown", type: "unknown" },
  "Repubblica": { risk: "unknown", type: "reviewed" },
  "Resource World": { risk: "unknown", type: "unknown" },
  "Responsible Statecraft": { risk: "unknown", type: "reviewed" },
  "Reuters Asia": { risk: "unknown", type: "unknown" },
  "Reuters Business": { risk: "unknown", type: "reviewed" },
  "Reuters Commodities": { risk: "unknown", type: "unknown" },
  "Reuters Crypto": { risk: "unknown", type: "unknown" },
  "Reuters Energy": { risk: "unknown", type: "unknown" },
  "Reuters LatAm": { risk: "unknown", type: "unknown" },
  "Reuters Markets": { risk: "unknown", type: "unknown" },
  "Reuters US": { risk: "unknown", type: "unknown" },
  "Reuters World": { risk: "unknown", type: "reviewed" },
  "RFE/RL Central Asia": { risk: "reviewed", type: "reviewed" },
  "RFI Afrique": { risk: "unknown", type: "unknown" },
  "RIETI (Japan)": { risk: "unknown", type: "unknown" },
  "Rigzone": { risk: "unknown", type: "unknown" },
  "Rio Tinto News": { risk: "unknown", type: "unknown" },
  "Risk & Volatility": { risk: "unknown", type: "unknown" },
  "RT": { risk: "reviewed", type: "reviewed" },
  "RT Russia": { risk: "reviewed", type: "reviewed" },
  "Rudaw": { risk: "unknown", type: "unknown" },
  "RUSI": { risk: "unknown", type: "reviewed" },
  "Rzeczpospolita": { risk: "unknown", type: "unknown" },
  "S&P Global Commodity": { risk: "unknown", type: "unknown" },
  "S&P Global Platts": { risk: "unknown", type: "unknown" },
  "SaaStr": { risk: "unknown", type: "unknown" },
  "Sahel Crisis": { risk: "unknown", type: "unknown" },
  "Schneier": { risk: "unknown", type: "unknown" },
  "ScienceDaily": { risk: "unknown", type: "unknown" },
  "SEA Startups": { risk: "unknown", type: "unknown" },
  "SEA Tech News": { risk: "unknown", type: "unknown" },
  "SEC": { risk: "unknown", type: "reviewed" },
  "SEC Filings": { risk: "unknown", type: "unknown" },
  "Seed & Pre-Seed": { risk: "unknown", type: "unknown" },
  "Seeking Alpha": { risk: "unknown", type: "unknown" },
  "Seeking Alpha Metals": { risk: "unknown", type: "unknown" },
  "Seeking Alpha Tech": { risk: "unknown", type: "unknown" },
  "SemiAnalysis": { risk: "unknown", type: "unknown" },
  "Semiconductor News": { risk: "unknown", type: "unknown" },
  "Sequoia Blog": { risk: "unknown", type: "unknown" },
  "Seznam Zpr\xE1vy": { risk: "reviewed", type: "reviewed" },
  "Shareable": { risk: "unknown", type: "unknown" },
  "Shipping & Freight": { risk: "unknown", type: "unknown" },
  "Show HN": { risk: "unknown", type: "unknown" },
  "Sifted (Europe)": { risk: "unknown", type: "reviewed" },
  "Silver Price News": { risk: "unknown", type: "unknown" },
  "SilverSeek": { risk: "unknown", type: "unknown" },
  "Singularity Hub": { risk: "unknown", type: "unknown" },
  "Slidstvo.Info": { risk: "reviewed", type: "reviewed" },
  "South China Morning Post": { risk: "unknown", type: "unknown" },
  "Sovereign Wealth": { risk: "unknown", type: "unknown" },
  "Stablecoin Policy": { risk: "unknown", type: "unknown" },
  "Stanford HAI": { risk: "unknown", type: "reviewed" },
  "Startup Funding": { risk: "unknown", type: "unknown" },
  "Startup School": { risk: "unknown", type: "unknown" },
  "Startups LATAM": { risk: "unknown", type: "unknown" },
  "State Dept": { risk: "unknown", type: "reviewed" },
  "Stimson Center": { risk: "unknown", type: "reviewed" },
  "Stratechery": { risk: "unknown", type: "reviewed" },
  "Strategic Chokepoints": { risk: "unknown", type: "unknown" },
  "Sunny Skyz": { risk: "unknown", type: "unknown" },
  "Suspilne": { risk: "reviewed", type: "reviewed" },
  "Svenska Dagbladet": { risk: "unknown", type: "reviewed" },
  "SVT Nyheter": { risk: "unknown", type: "reviewed" },
  "Tagesschau": { risk: "unknown", type: "reviewed" },
  "Taipei Times": { risk: "unknown", type: "reviewed" },
  "Taiwan News": { risk: "unknown", type: "reviewed" },
  "Taiwan Tech": { risk: "unknown", type: "unknown" },
  "Tanker & Shipping": { risk: "unknown", type: "unknown" },
  "Task & Purpose": { risk: "unknown", type: "reviewed" },
  "TASS": { risk: "reviewed", type: "reviewed" },
  "Tech Antitrust": { risk: "unknown", type: "unknown" },
  "Tech in Asia": { risk: "unknown", type: "reviewed" },
  "Tech IPO News": { risk: "unknown", type: "unknown" },
  "Tech Newsletters": { risk: "unknown", type: "unknown" },
  "Tech.eu": { risk: "unknown", type: "reviewed" },
  "TechCabal (Africa)": { risk: "unknown", type: "reviewed" },
  "TechCrunch": { risk: "unknown", type: "unknown" },
  "TechCrunch Layoffs": { risk: "unknown", type: "reviewed" },
  "TechCrunch Startups": { risk: "unknown", type: "unknown" },
  "TechCrunch Venture": { risk: "unknown", type: "unknown" },
  "TechMeme": { risk: "unknown", type: "unknown" },
  "Techstars News": { risk: "unknown", type: "unknown" },
  "Telex": { risk: "unknown", type: "reviewed" },
  "Thai PBS": { risk: "unknown", type: "unknown" },
  "The Astana Times": { risk: "reviewed", type: "reviewed" },
  "The Better India": { risk: "unknown", type: "unknown" },
  "The Block": { risk: "unknown", type: "unknown" },
  "The Defiant": { risk: "unknown", type: "unknown" },
  "The Diplomat": { risk: "unknown", type: "reviewed" },
  "The Hacker News": { risk: "unknown", type: "unknown" },
  "The Hill": { risk: "unknown", type: "unknown" },
  "The Hindu": { risk: "unknown", type: "unknown" },
  "The Information": { risk: "unknown", type: "unknown" },
  "The National": { risk: "unknown", type: "unknown" },
  "The New Stack": { risk: "unknown", type: "unknown" },
  "The Next Web": { risk: "unknown", type: "reviewed" },
  "The Reporter Ethiopia": { risk: "unknown", type: "unknown" },
  "The Sentry": { risk: "unknown", type: "reviewed" },
  "The Star (Malaysia)": { risk: "unknown", type: "reviewed" },
  "The Times of Central Asia": { risk: "reviewed", type: "reviewed" },
  "The Verge": { risk: "unknown", type: "reviewed" },
  "The Verge AI": { risk: "unknown", type: "reviewed" },
  "The War Zone": { risk: "unknown", type: "reviewed" },
  "ThisDay": { risk: "unknown", type: "unknown" },
  "Tom's Hardware": { risk: "unknown", type: "unknown" },
  "Trade & Tariffs": { risk: "unknown", type: "unknown" },
  "Trade Routes": { risk: "unknown", type: "unknown" },
  "Trading Tech": { risk: "unknown", type: "unknown" },
  "Treasury": { risk: "unknown", type: "reviewed" },
  "Treasury Watch": { risk: "unknown", type: "unknown" },
  "Trump - Truth Social": { risk: "unknown", type: "unknown" },
  "Tuoi Tre News": { risk: "unknown", type: "unknown" },
  "TVN24": { risk: "unknown", type: "unknown" },
  "TWIST Episodes": { risk: "unknown", type: "unknown" },
  "UK MOD": { risk: "unknown", type: "reviewed" },
  "UK Tech Policy": { risk: "unknown", type: "unknown" },
  "Ukrainska Pravda": { risk: "reviewed", type: "reviewed" },
  "Ukrainska Pravda EN": { risk: "reviewed", type: "reviewed" },
  "Ukrinform": { risk: "reviewed", type: "reviewed" },
  "UN News": { risk: "unknown", type: "reviewed" },
  "Unchained": { risk: "unknown", type: "unknown" },
  "UNHCR": { risk: "unknown", type: "reviewed" },
  "Unicorn News": { risk: "unknown", type: "unknown" },
  "Upworthy": { risk: "unknown", type: "unknown" },
  "Uranium Market": { risk: "unknown", type: "unknown" },
  "USNI News": { risk: "unknown", type: "reviewed" },
  "Vanguard Nigeria": { risk: "unknown", type: "unknown" },
  "VC Insights": { risk: "unknown", type: "unknown" },
  "VC News": { risk: "unknown", type: "unknown" },
  "VentureBeat": { risk: "unknown", type: "unknown" },
  "VentureBeat AI": { risk: "unknown", type: "reviewed" },
  "Verge Shows": { risk: "unknown", type: "unknown" },
  "Vietnam Tech": { risk: "unknown", type: "unknown" },
  "Vision 2030": { risk: "unknown", type: "unknown" },
  "VnExpress": { risk: "unknown", type: "unknown" },
  "VSquare": { risk: "unknown", type: "reviewed" },
  "Wall Street Journal": { risk: "unknown", type: "unknown" },
  "War on the Rocks": { risk: "unknown", type: "reviewed" },
  "White House": { risk: "unknown", type: "reviewed" },
  "White House Actions": { risk: "unknown", type: "reviewed" },
  "WHO": { risk: "unknown", type: "reviewed" },
  "Wilson Center": { risk: "unknown", type: "reviewed" },
  "World Gold Council": { risk: "unknown", type: "unknown" },
  "Wu Blockchain": { risk: "unknown", type: "unknown" },
  "Xinhua": { risk: "reviewed", type: "reviewed" },
  "Y Combinator Blog": { risk: "unknown", type: "unknown" },
  "Yahoo Finance": { risk: "unknown", type: "reviewed" },
  "YC Launches": { risk: "unknown", type: "unknown" },
  "YC News": { risk: "unknown", type: "unknown" },
  "Yes! Magazine": { risk: "unknown", type: "unknown" },
  "Yle News": { risk: "reviewed", type: "reviewed" },
  "Ynetnews": { risk: "reviewed", type: "unknown" },
  "Yonhap News": { risk: "unknown", type: "unknown" },
  "YourStory": { risk: "unknown", type: "reviewed" },
  "ZDNet": { risk: "unknown", type: "unknown" },
  "Zerkalo": { risk: "reviewed", type: "reviewed" },
  "Ziarul de Gard\u0103": { risk: "reviewed", type: "reviewed" },
  "ZN.UA": { risk: "reviewed", type: "reviewed" }
});

// shared/source-provenance.ts
var SOURCE_TYPES = {
  // Wire services - fastest, most authoritative
  "Reuters": "wire",
  "Reuters World": "wire",
  "Reuters Business": "wire",
  "AP News": "wire",
  "AFP": "wire",
  "Bloomberg": "wire",
  // Government & International Org sources
  "White House": "gov",
  "White House Actions": "gov",
  "State Dept": "gov",
  "Pentagon": "gov",
  "Treasury": "gov",
  "DOJ": "gov",
  "DHS": "gov",
  "CDC": "gov",
  "FEMA": "gov",
  "Federal Reserve": "gov",
  "SEC": "gov",
  "UN News": "gov",
  "CISA": "gov",
  // Direct official military publishers. Their claims remain publisher claims,
  // not independent ADS-B/AIS observations.
  "Taiwan Ministry of National Defense": "gov",
  "Japan Joint Staff": "gov",
  // Chinese government ministries (Tier 1 official sources — not wire/verified outlets)
  "CAC (China)": "gov",
  "SAMR (China)": "gov",
  "MIIT (China)": "gov",
  "MOFCOM (China)": "gov",
  "NDRC (China)": "gov",
  "NBS (China)": "gov",
  "PBoC (China)": "gov",
  "SAFE (China)": "gov",
  "GACC (China)": "gov",
  // Intel/Defense specialty
  "Defense One": "intel",
  "Breaking Defense": "intel",
  "The War Zone": "intel",
  "Defense News": "intel",
  "Janes": "intel",
  "Military Times": "intel",
  "Task & Purpose": "intel",
  "USNI News": "intel",
  "gCaptain": "intel",
  "Oryx OSINT": "intel",
  "UK MOD": "gov",
  "Bellingcat": "intel",
  "Krebs Security": "intel",
  "Foreign Policy": "intel",
  "The Diplomat": "intel",
  "Atlantic Council": "intel",
  "Foreign Affairs": "intel",
  "CrisisWatch": "intel",
  "CSIS": "intel",
  "RAND": "intel",
  "Brookings": "intel",
  "Carnegie": "intel",
  "IAEA": "gov",
  "WHO": "gov",
  "UNHCR": "gov",
  "Xinhua": "wire",
  "TASS": "wire",
  "RT": "wire",
  "RT Russia": "wire",
  "NHK World": "mainstream",
  "Nikkei Asia": "market",
  // Independent RU exile / UA English primary (default-eligible under #5950 balance rule)
  "Meduza": "mainstream",
  "Moscow Times": "mainstream",
  "Kyiv Independent": "mainstream",
  // Ukraine depth pack (#5951) + uk native pack (#5959)
  "Ukrinform": "wire",
  "Suspilne": "mainstream",
  "Ukrainska Pravda EN": "mainstream",
  "NV EN": "mainstream",
  "Hromadske EN": "mainstream",
  "ISW": "intel",
  "Ukrainska Pravda": "mainstream",
  "Hromadske": "mainstream",
  "Bihus.Info": "intel",
  "Slidstvo.Info": "intel",
  "ZN.UA": "mainstream",
  // Mainstream outlets
  "BBC World": "mainstream",
  "BBC Middle East": "mainstream",
  "Guardian World": "mainstream",
  "Guardian ME": "mainstream",
  "NPR News": "mainstream",
  "Al Jazeera": "mainstream",
  "CNN World": "mainstream",
  "Politico": "mainstream",
  "Axios": "mainstream",
  "EuroNews": "mainstream",
  "France 24": "mainstream",
  "Le Monde": "mainstream",
  // European Addition
  "El Pa\xEDs": "mainstream",
  "El Mundo": "mainstream",
  "BBC Mundo": "mainstream",
  "Tagesschau": "mainstream",
  "Der Spiegel": "mainstream",
  "Die Zeit": "mainstream",
  "DW News": "mainstream",
  "ANSA": "wire",
  "Corriere della Sera": "mainstream",
  "Repubblica": "mainstream",
  "NOS Nieuws": "mainstream",
  "NRC": "mainstream",
  "De Telegraaf": "mainstream",
  // Croatian (HR)
  "N1 Croatia": "mainstream",
  "Index.hr": "mainstream",
  "Jutarnji list": "mainstream",
  "Balkan Insight": "intel",
  // Romanian (RO) — Eastern flank (#5952)
  "Digi24": "mainstream",
  "HotNews": "mainstream",
  "G4Media": "mainstream",
  // Bulgarian (BG) — Black Sea flank (#5952)
  "Dnevnik": "mainstream",
  // Baltic states — Eastern flank (#5952)
  "ERR News": "mainstream",
  "LRT English": "mainstream",
  "LSM English": "mainstream",
  // Turkey EN path (#5952)
  "Daily Sabah": "mainstream",
  // Czech (CS) — V4 balance (#5952)
  "Seznam Zpr\xE1vy": "mainstream",
  // Hindi (HI)
  "BBC Hindi": "mainstream",
  "Aaj Tak": "mainstream",
  "NDTV India": "mainstream",
  "Amar Ujala": "mainstream",
  // Hungarian (HU)
  "Telex": "mainstream",
  "Index.hu": "mainstream",
  "HVG": "mainstream",
  "444.hu": "mainstream",
  "24.hu": "mainstream",
  "H\xEDrad\xF3": "mainstream",
  "ATV": "mainstream",
  "Portfolio.hu": "market",
  "SVT Nyheter": "mainstream",
  "Dagens Nyheter": "mainstream",
  "Svenska Dagbladet": "mainstream",
  // Canada + Arctic/Nordic pack (#5960)
  "CBC News": "mainstream",
  "Globe and Mail": "mainstream",
  "Global News": "mainstream",
  "Yle News": "mainstream",
  "NRK": "mainstream",
  "Aftenposten": "mainstream",
  "DR Nyheder": "mainstream",
  "Arctic Today": "mainstream",
  // Brazilian Addition
  "Brasil Paralelo": "mainstream",
  // Market/Finance
  "CNBC": "market",
  "MarketWatch": "market",
  "Yahoo Finance": "market",
  "Financial Times": "market",
  "Shanghai Stock Exchange": "market",
  "Shenzhen Stock Exchange": "market",
  // Tech
  "Hacker News": "tech",
  "Ars Technica": "tech",
  "The Verge": "tech",
  "The Verge AI": "tech",
  "MIT Tech Review": "tech",
  "TechCrunch Layoffs": "tech",
  "AI News": "tech",
  "ArXiv AI": "tech",
  "VentureBeat AI": "tech",
  "Layoffs.fyi": "tech",
  "Layoffs News": "tech",
  // Regional Tech Startups
  "EU Startups": "tech",
  "Tech.eu": "tech",
  "Sifted (Europe)": "tech",
  "The Next Web": "tech",
  "Tech in Asia": "tech",
  "e27 (SEA)": "tech",
  "DealStreetAsia": "tech",
  "Pandaily (China)": "tech",
  "36Kr English": "tech",
  "TechNode (China)": "tech",
  "The Bridge (Japan)": "tech",
  "Nikkei Tech": "tech",
  "Inc42 (India)": "tech",
  "YourStory": "tech",
  "TechCabal (Africa)": "tech",
  "Wamda (MENA)": "tech",
  "Magnitt": "tech",
  // Think Tanks & Policy
  "Brookings Tech": "intel",
  "CSIS Tech": "intel",
  "Stanford HAI": "intel",
  "AI Now Institute": "intel",
  "OECD Digital": "intel",
  "Bruegel (EU)": "intel",
  "Chatham House Tech": "intel",
  "DigiChina": "intel",
  "Lowy Institute": "intel",
  "EFF News": "intel",
  "Politico Tech": "intel",
  // Security/Defense Think Tanks
  "RUSI": "intel",
  "Wilson Center": "intel",
  "GMF": "intel",
  "Stimson Center": "intel",
  "CNAS": "intel",
  // Nuclear & Arms Control
  "Arms Control Assn": "intel",
  "Bulletin of Atomic Scientists": "intel",
  // Food Security & Regional
  "FAO GIEWS": "gov",
  "EU ISS": "intel",
  // Investigative journalism & accountability
  "OCCRP": "intel",
  "DFRLab": "intel",
  "Lighthouse Reports": "intel",
  "The Sentry": "intel",
  "GITOC": "intel",
  "VSquare": "intel",
  "Correctiv": "intel",
  // New verified think tanks
  "War on the Rocks": "intel",
  "AEI": "intel",
  "Responsible Statecraft": "intel",
  "FPRI": "intel",
  "Jamestown": "intel",
  // Podcasts & Newsletters
  "Acquired Podcast": "tech",
  "All-In Podcast": "tech",
  "a16z Podcast": "tech",
  "This Week in Startups": "tech",
  "The Twenty Minute VC": "tech",
  "Hard Fork (NYT)": "tech",
  "Pivot (Vox)": "tech",
  "Stratechery": "tech",
  "Benedict Evans": "tech",
  "How I Built This": "tech",
  "Masters of Scale": "tech",
  // Periphery packs (#5953) — Caucasus
  "Civil.ge": "mainstream",
  "OC Media": "mainstream",
  "JAMnews": "mainstream",
  "Azertag": "wire",
  "Armenpress": "wire",
  // Periphery packs (#5953) — Belarus / Moldova
  "Zerkalo": "mainstream",
  "NewsMaker": "mainstream",
  "Ziarul de Gard\u0103": "mainstream",
  // Periphery packs (#5953) — Central Asia
  "Eurasianet": "mainstream",
  "RFE/RL Central Asia": "mainstream",
  "The Astana Times": "mainstream",
  "The Times of Central Asia": "mainstream",
  // Indo-Pacific feeds (#5954)
  "Focus Taiwan": "wire",
  "Taipei Times": "mainstream",
  "Taiwan News": "mainstream",
  "Dawn": "mainstream",
  "Geo News": "mainstream",
  "Jakarta Post": "mainstream",
  "Rappler": "mainstream",
  "The Star (Malaysia)": "mainstream",
  "Irrawaddy": "mainstream"
};
function getSourceType(sourceName) {
  return SOURCE_TYPES[sourceName] ?? "unknown";
}
function hasReviewedSourceType(sourceName) {
  return Object.prototype.hasOwnProperty.call(SOURCE_TYPES, sourceName);
}
function hasDeclaredSourceType(sourceName) {
  return hasReviewedSourceType(sourceName) || Object.prototype.hasOwnProperty.call(CONFIGURED_SOURCE_PROVENANCE_DECLARATIONS, sourceName);
}
var UNREVIEWED_SOURCE_RISK = Object.freeze({
  risk: "unknown",
  note: "Provenance not yet reviewed \u2014 do not treat as independent journalism"
});
var SOURCE_PROPAGANDA_RISK = {
  // High risk - State-controlled media
  "Xinhua": { risk: "high", stateAffiliated: "China", note: "Official CCP news agency" },
  "TASS": { risk: "high", stateAffiliated: "Russia", note: "Russian state news agency" },
  "RT": { risk: "high", stateAffiliated: "Russia", note: "Russian state media, banned in EU" },
  "RT Russia": { risk: "high", stateAffiliated: "Russia", note: "Russian state media, Russia desk" },
  "Sputnik": { risk: "high", stateAffiliated: "Russia", note: "Russian state media" },
  "CGTN": { risk: "high", stateAffiliated: "China", note: "Chinese state broadcaster" },
  "Press TV": { risk: "high", stateAffiliated: "Iran", note: "Iranian state media" },
  "IRNA": { risk: "high", stateAffiliated: "Iran", note: "Iranian state news agency (Islamic Republic News Agency)" },
  "Mehr News": { risk: "high", stateAffiliated: "Iran", note: "Iranian state-affiliated, Basij-linked" },
  "KCNA": { risk: "high", stateAffiliated: "North Korea", note: "North Korean state media" },
  // Official Chinese ministry feeds (government sources, not independent media)
  "MIIT (China)": {
    risk: "high",
    stateAffiliated: "China",
    note: "Chinese Ministry of Industry and Information Technology official feed"
  },
  "MOFCOM (China)": {
    risk: "high",
    stateAffiliated: "China",
    note: "Chinese Ministry of Commerce official feed"
  },
  // Official exchange authorities. These are authoritative primary publishers,
  // not independent journalism; omit stateAffiliated so the shared validator
  // does not conflate an exchange authority with state-controlled media.
  "Shanghai Stock Exchange": {
    risk: "high",
    note: "Official mainland China exchange authority; metadata-only source"
  },
  "Shenzhen Stock Exchange": {
    risk: "high",
    note: "Official mainland China exchange authority; metadata-only source"
  },
  "Taiwan Ministry of National Defense": {
    risk: "high",
    stateAffiliated: "Taiwan",
    note: "Direct government activity reports; treat values as official publisher claims, not independent observations"
  },
  "Japan Joint Staff": {
    risk: "high",
    stateAffiliated: "Japan",
    note: "Direct government activity reports; only manually reviewed documents are admitted as regional augmentation"
  },
  "CAC (China)": {
    risk: "high",
    stateAffiliated: "China",
    note: "Cyberspace Administration of China official publication"
  },
  "SAMR (China)": {
    risk: "high",
    stateAffiliated: "China",
    note: "State Administration for Market Regulation official publication"
  },
  "NDRC (China)": {
    risk: "high",
    stateAffiliated: "China",
    note: "National Development and Reform Commission official publication"
  },
  "NBS (China)": {
    risk: "high",
    stateAffiliated: "China",
    note: "National Bureau of Statistics of China official data release"
  },
  "PBoC (China)": {
    risk: "high",
    stateAffiliated: "China",
    note: "People's Bank of China official publication"
  },
  "SAFE (China)": {
    risk: "high",
    stateAffiliated: "China",
    note: "State Administration of Foreign Exchange official data release"
  },
  "GACC (China)": {
    risk: "high",
    stateAffiliated: "China",
    note: "General Administration of Customs of China official data release"
  },
  // Medium risk - State-affiliated or known bias
  "Al Jazeera": { risk: "medium", stateAffiliated: "Qatar", note: "Qatari state-funded, independent editorial" },
  "Al Arabiya": { risk: "medium", stateAffiliated: "Saudi Arabia", note: "Saudi-owned, reflects Gulf perspective" },
  "TRT World": { risk: "medium", stateAffiliated: "Turkey", note: "Turkish state broadcaster" },
  "France 24": { risk: "medium", stateAffiliated: "France", note: "French state-funded, editorially independent" },
  "EuroNews": { risk: "low", note: "European public broadcaster consortium", knownBiases: ["Pro-EU"] },
  "Le Monde": { risk: "low", note: "French newspaper of record" },
  "DW News": { risk: "medium", stateAffiliated: "Germany", note: "German state-funded, editorially independent" },
  "Voice of America": { risk: "medium", stateAffiliated: "USA", note: "US government-funded" },
  "Kyiv Independent": { risk: "medium", knownBiases: ["Pro-Ukraine"], note: "Ukrainian English-language primary on Russia-Ukraine war (#5950 balance: dedicated UA voice)" },
  // Ukraine depth pack (#5951) — local institutions + frontline assessment
  "Ukrinform": { risk: "high", stateAffiliated: "Ukraine", note: "Ukrainian national state news agency (UKRINFORM)" },
  "Suspilne": { risk: "medium", stateAffiliated: "Ukraine", note: "Ukrainian public broadcaster, state-funded" },
  "Ukrainska Pravda EN": { risk: "medium", knownBiases: ["Pro-Ukraine"], note: "Independent Ukrainian outlet, high-signal English edition" },
  "NV EN": { risk: "medium", knownBiases: ["Pro-Ukraine"], note: "New Voice of Ukraine English edition, independent" },
  "Hromadske EN": { risk: "medium", knownBiases: ["Pro-Ukraine"], note: "Ukrainian independent public broadcaster (English)" },
  // Ukrainian native outlets (#5959) — locale-boosted for uk UI
  "Ukrainska Pravda": { risk: "medium", knownBiases: ["Pro-Ukraine"], note: "Independent Ukrainian outlet, Ukrainian-language edition" },
  "Hromadske": { risk: "medium", knownBiases: ["Pro-Ukraine"], note: "Ukrainian independent public broadcaster (Ukrainian)" },
  "Bihus.Info": { risk: "medium", knownBiases: ["Pro-Ukraine"], note: "Ukrainian investigative anti-corruption outlet" },
  "Slidstvo.Info": { risk: "medium", knownBiases: ["Pro-Ukraine"], note: "Ukrainian investigative journalism project (Radio Free Europe partnership)" },
  "ZN.UA": { risk: "medium", knownBiases: ["Pro-Ukraine"], note: "Dzerkalo Tyzhnia \u2014 Ukrainian weekly analytical newspaper" },
  "ISW": { risk: "low", note: "Institute for the Study of War, nonpartisan research nonprofit, daily frontline assessments" },
  "Moscow Times": { risk: "medium", knownBiases: ["Anti-Kremlin"], note: "Independent English-language Russian outlet, critical of Kremlin" },
  // Independent RU exile press — not state media; eligible for EN defaults (#5950)
  "Meduza": { risk: "low", knownBiases: ["Anti-Kremlin"], note: "Independent Russian exile outlet (Riga); English + Russian RSS" },
  // Low risk - Independent with editorial standards (explicit)
  "Jerusalem Post": { risk: "low", knownBiases: ["Israeli centre-right"], note: "English-language Israeli daily of record" },
  "Ynetnews": { risk: "low", knownBiases: ["Israeli mainstream"], note: "Yedioth Ahronoth English edition" },
  "Digi24": { risk: "low", note: "Romanian independent news channel, member of ERNO" },
  "HotNews": { risk: "low", note: "Romanian independent online news portal" },
  "G4Media": { risk: "low", note: "Romanian independent investigative outlet" },
  "Dnevnik": { risk: "low", note: "Bulgarian independent daily newspaper" },
  "ERR News": { risk: "low", note: "Estonian Public Broadcasting English service" },
  "LRT English": { risk: "low", note: "Lithuanian Public Broadcasting English service" },
  "LSM English": { risk: "low", note: "Latvian Public Broadcasting English service" },
  // Canada + Arctic/Nordic pack (#5960)
  "CBC News": { risk: "medium", stateAffiliated: "Canada", note: "Canadian public broadcaster (CBC/Radio-Canada), editorially independent charter" },
  "Globe and Mail": { risk: "low", note: "Canadian newspaper of record" },
  "Global News": { risk: "low", note: "Canadian national news network (Corus Entertainment)" },
  "Yle News": { risk: "medium", stateAffiliated: "Finland", note: "Finnish public broadcaster English service (Yle)" },
  "NRK": { risk: "medium", stateAffiliated: "Norway", note: "Norwegian public broadcaster" },
  "Aftenposten": { risk: "low", note: "Norwegian newspaper of record (Schibsted)" },
  "DR Nyheder": { risk: "medium", stateAffiliated: "Denmark", note: "Danish public broadcaster (DR)" },
  "Arctic Today": { risk: "low", note: "Independent High North / Arctic security and business news" },
  "Daily Sabah": { risk: "medium", stateAffiliated: "Turkey", note: "Turkish pro-government daily, English edition" },
  "Seznam Zpr\xE1vy": { risk: "low", note: "Czech independent online news outlet" },
  "Reuters": { risk: "low", note: "Wire service, strict editorial standards" },
  "AP News": { risk: "low", note: "Wire service, nonprofit cooperative" },
  "AFP": { risk: "low", note: "Wire service, editorially independent" },
  "BBC World": { risk: "low", note: "Public broadcaster, editorial independence charter" },
  "BBC Middle East": { risk: "low", note: "Public broadcaster, editorial independence charter" },
  "Guardian World": { risk: "low", knownBiases: ["Center-left"], note: "Scott Trust ownership, no shareholders" },
  "Financial Times": { risk: "low", note: "Business focus, Nikkei-owned" },
  "Bellingcat": { risk: "low", note: "Open-source investigations, methodology transparent" },
  "Brasil Paralelo": { risk: "low", note: "Independent media company: no political ties, no public funding, 100% subscriber-funded." },
  // Periphery packs (#5953) — Caucasus
  "Civil.ge": { risk: "low", note: "Independent Georgian English-language news outlet" },
  "OC Media": { risk: "low", note: "Independent South Caucasus regional news outlet" },
  "JAMnews": { risk: "medium", note: "Regional Caucasus news platform, limited editorial transparency" },
  "Azertag": { risk: "high", stateAffiliated: "Azerbaijan", note: "Azerbaijani state news agency (AZERTAC)" },
  "Armenpress": { risk: "high", stateAffiliated: "Armenia", note: "Armenian state news agency" },
  // Periphery packs (#5953) — Belarus / Moldova
  "Zerkalo": { risk: "low", note: "Independent Belarusian exile news outlet (formerly TUT.BY)" },
  "NewsMaker": { risk: "medium", note: "Moldovan independent news outlet; configured Russian-language feed" },
  "Ziarul de Gard\u0103": { risk: "medium", note: "Moldovan investigative journalism outlet, Romanian-language" },
  // Periphery packs (#5953) — Central Asia
  "Eurasianet": { risk: "medium", note: "Nonprofit regional news covering Eurasia, Carnegie-funded" },
  "RFE/RL Central Asia": { risk: "medium", stateAffiliated: "USA", note: "US government-funded Central Asia desk (Radio Free Europe)" },
  "The Astana Times": { risk: "medium", stateAffiliated: "Kazakhstan", note: "Kazakhstan government-funded English-language news" },
  "The Times of Central Asia": { risk: "medium", note: "Independent English-language Central Asia news outlet" }
};
function getSourcePropagandaRisk(sourceName) {
  return SOURCE_PROPAGANDA_RISK[sourceName] ?? UNREVIEWED_SOURCE_RISK;
}
function hasReviewedPropagandaRisk(sourceName) {
  return Object.prototype.hasOwnProperty.call(SOURCE_PROPAGANDA_RISK, sourceName);
}
function hasDeclaredPropagandaRisk(sourceName) {
  return hasReviewedPropagandaRisk(sourceName) || Object.prototype.hasOwnProperty.call(CONFIGURED_SOURCE_PROVENANCE_DECLARATIONS, sourceName);
}
function getSourceProvenanceState(sourceName) {
  const profile = getSourcePropagandaRisk(sourceName);
  return {
    risk: profile.risk,
    type: getSourceType(sourceName),
    riskDeclared: hasDeclaredPropagandaRisk(sourceName),
    typeDeclared: hasDeclaredSourceType(sourceName),
    riskReviewed: hasReviewedPropagandaRisk(sourceName),
    typeReviewed: hasReviewedSourceType(sourceName),
    ...profile.stateAffiliated ? { stateAffiliated: profile.stateAffiliated } : {},
    ...profile.note ? { note: profile.note } : {}
  };
}

// shared/decision-signal-provenance.ts
function hasOwn2(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
var TOP_LEVEL_KEYS = ["contractVersion", "signalId", "familyId", "claims"];
var CLAIM_KNOWN_KEYS = ["status", "value"];
var CLAIM_UNAVAILABLE_KEYS = ["status", "reason"];
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function pushIssue(errors, path, code, message2) {
  errors.push({ path, code, message: message2 });
}
function validateExactKeys(value, allowed, path, errors) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      pushIssue(errors, `${path}.${key}`, "INVALID_SHAPE", `Unexpected field ${key}`);
    }
  }
}
function validateRequiredString(value, path, errors) {
  if (!isNonEmptyString(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Expected a non-empty string");
    return false;
  }
  return true;
}
function isIsoInstant(value) {
  if (typeof value !== "string") return false;
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/
  );
  if (!match) return false;
  return isValidCalendarDate(Number(match[1]), Number(match[2]), Number(match[3])) && Number(match[4]) <= 23 && Number(match[5]) <= 59 && Number(match[6]) <= 59;
}
function isValidCalendarDate(year2, month, day2) {
  if (month < 1 || month > 12 || day2 < 1) return false;
  const isLeapYear = year2 % 4 === 0 && (year2 % 100 !== 0 || year2 % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31
  ];
  return day2 <= (daysInMonth[month - 1] ?? 0);
}
function isCalendarMonth(value) {
  if (typeof value !== "string") return false;
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}
function isCalendarDay(value) {
  if (typeof value !== "string") return false;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  return isValidCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
}
function isProvenanceTimestamp(value) {
  return isIsoInstant(value) || isCalendarDay(value) || isCalendarMonth(value) || typeof value === "string" && /^\d{4}$/.test(value);
}
function validateTimestampValue(value, precision, path, errors) {
  let valid = false;
  if (precision === "instant") valid = isIsoInstant(value);
  if (precision === "day") valid = isCalendarDay(value);
  if (precision === "month") valid = isCalendarMonth(value);
  if (precision === "year") valid = typeof value === "string" && /^\d{4}$/.test(value);
  if (!valid) {
    pushIssue(errors, path, "INVALID_VALUE", `Invalid ${String(precision)} timestamp`);
  }
}
function validatePublisher(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Publisher must be an object");
    return false;
  }
  validateExactKeys(value, ["id", "name", "type", "registryReference"], path, errors);
  validateRequiredString(value.id, `${path}.id`, errors);
  validateRequiredString(value.name, `${path}.name`, errors);
  if (!DECISION_SIGNAL_PUBLISHER_TYPES.includes(value.type)) {
    pushIssue(errors, `${path}.type`, "INVALID_STATUS_VOCABULARY", "Unknown publisher type");
  }
  if (value.type === "derived_output") {
    if (value.registryReference !== null) {
      pushIssue(
        errors,
        `${path}.registryReference`,
        "INVALID_SOURCE_REFERENCE",
        "Derived outputs must not masquerade as a source-registry publisher"
      );
    }
    return true;
  }
  if (!isRecord3(value.registryReference)) {
    pushIssue(
      errors,
      `${path}.registryReference`,
      "UNKNOWN_SOURCE_REFERENCE",
      "Source-backed publishers require a #5571 registry reference"
    );
    return false;
  }
  const registryReference = value.registryReference;
  validateExactKeys(
    registryReference,
    ["sourceName", "sourceType", "propagandaRisk"],
    `${path}.registryReference`,
    errors
  );
  if (!validateRequiredString(
    registryReference.sourceName,
    `${path}.registryReference.sourceName`,
    errors
  )) {
    return false;
  }
  const registryState = getSourceProvenanceState(registryReference.sourceName);
  if (!registryState.typeDeclared || !registryState.riskDeclared) {
    pushIssue(
      errors,
      `${path}.registryReference.sourceName`,
      "UNKNOWN_SOURCE_REFERENCE",
      `${registryReference.sourceName} is not explicitly declared in the #5571 source registry`
    );
    return false;
  }
  if (registryReference.sourceType !== registryState.type || registryReference.propagandaRisk !== registryState.risk) {
    pushIssue(
      errors,
      `${path}.registryReference`,
      "STALE_SOURCE_REFERENCE",
      "Publisher registry snapshot no longer matches the canonical #5571 source registry"
    );
  }
  if (value.type === "official_government" && registryState.type !== "gov") {
    pushIssue(
      errors,
      `${path}.type`,
      "PUBLISHER_CLASS_MISMATCH",
      "Official-government publishers must resolve to a government registry type"
    );
  }
  if (value.type === "state_controlled_media" && (!registryState.stateAffiliated || registryState.type === "gov")) {
    pushIssue(
      errors,
      `${path}.type`,
      "PUBLISHER_CLASS_MISMATCH",
      "State-controlled media must remain distinct from direct government publishers"
    );
  }
  if ((value.type === "independent_media" || value.type === "independent_observation") && (registryState.risk !== "low" || registryState.type === "gov" || registryState.type === "wire" || registryState.type === "market")) {
    pushIssue(
      errors,
      `${path}.type`,
      "PUBLISHER_CLASS_MISMATCH",
      "Independent publisher claims require a low-risk non-government, non-wire, non-market registry entry"
    );
  }
  if (registryState.risk === "high" && registryState.stateAffiliated && registryState.type !== "gov" && value.type !== "state_controlled_media" && value.type !== "unknown") {
    pushIssue(
      errors,
      `${path}.type`,
      "PUBLISHER_CLASS_MISMATCH",
      "State-controlled media cannot be relabeled as a wire or independent publisher"
    );
  }
  if (value.type === "wire_service" && (registryState.type !== "wire" || registryState.risk === "high")) {
    pushIssue(
      errors,
      `${path}.type`,
      "PUBLISHER_CLASS_MISMATCH",
      "Wire-service claims require a non-state-controlled wire registry entry"
    );
  }
  if (value.type === "market_publisher" && registryState.type !== "market") {
    pushIssue(
      errors,
      `${path}.type`,
      "PUBLISHER_CLASS_MISMATCH",
      "Market-publisher claims require a market registry entry"
    );
  }
  if (value.type === "official_exchange" && registryState.type !== "market" && registryState.type !== "gov") {
    pushIssue(
      errors,
      `${path}.type`,
      "PUBLISHER_CLASS_MISMATCH",
      "Official-exchange claims require a market or government registry entry"
    );
  }
  return true;
}
function validateSourceUrl(value, path, errors) {
  if (!validateRequiredString(value, path, errors)) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("unsafe URL");
  } catch {
    pushIssue(errors, path, "INVALID_VALUE", "Source URL must be an absolute credential-free HTTPS URL");
    return false;
  }
  return true;
}
function validateOriginalReference(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Original reference must be an object");
    return false;
  }
  validateExactKeys(value, ["kind", "id", "contentHash"], path, errors);
  if (!DECISION_SIGNAL_ORIGINAL_REFERENCE_KINDS.includes(
    value.kind
  )) {
    pushIssue(errors, `${path}.kind`, "INVALID_STATUS_VOCABULARY", "Unknown original-reference kind");
  }
  validateRequiredString(value.id, `${path}.id`, errors);
  if (value.contentHash !== void 0 && (typeof value.contentHash !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value.contentHash))) {
    pushIssue(errors, `${path}.contentHash`, "INVALID_VALUE", "Expected a lowercase sha256 content hash");
  }
  return true;
}
function validateTranslation(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Translation must be an object");
    return false;
  }
  validateExactKeys(value, ["state", "targetLanguage"], path, errors);
  if (!DECISION_SIGNAL_TRANSLATION_STATES.includes(
    value.state
  )) {
    pushIssue(errors, `${path}.state`, "INVALID_STATUS_VOCABULARY", "Unknown translation state");
  }
  if (value.state === "machine_assisted" || value.state === "human_reviewed") {
    validateRequiredString(value.targetLanguage, `${path}.targetLanguage`, errors);
  } else if (value.targetLanguage !== void 0) {
    pushIssue(
      errors,
      `${path}.targetLanguage`,
      "INVALID_VALUE",
      "Unavailable or untranslated evidence cannot claim a target language"
    );
  }
  return true;
}
var TIME_ROLES = {
  observation_time: "observation",
  effective_time: "effective",
  publication_time: "publication",
  retrieval_time: "retrieval"
};
function validateTimeReference(dimension, value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Time reference must be an object");
    return false;
  }
  validateExactKeys(value, ["role", "value", "precision"], path, errors);
  if (value.role !== TIME_ROLES[dimension]) {
    pushIssue(
      errors,
      `${path}.role`,
      "TIMESTAMP_ROLE_MISMATCH",
      `${dimension} must retain its ${TIME_ROLES[dimension]} semantic role`
    );
  }
  if (!DECISION_SIGNAL_TIME_PRECISIONS.includes(
    value.precision
  )) {
    pushIssue(errors, `${path}.precision`, "INVALID_STATUS_VOCABULARY", "Unknown timestamp precision");
  } else {
    validateTimestampValue(value.value, value.precision, `${path}.value`, errors);
  }
  return true;
}
function validateRevision(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Revision must be an object");
    return false;
  }
  validateExactKeys(value, ["vintageId", "sequence", "state"], path, errors);
  validateRequiredString(value.vintageId, `${path}.vintageId`, errors);
  if (!Number.isInteger(value.sequence) || Number(value.sequence) < 1) {
    pushIssue(errors, `${path}.sequence`, "INVALID_VALUE", "Revision sequence must be a positive integer");
  }
  if (!DECISION_SIGNAL_REVISION_STATES.includes(
    value.state
  )) {
    pushIssue(errors, `${path}.state`, "INVALID_STATUS_VOCABULARY", "Unknown revision state");
  }
  if ((value.state === "preliminary" || value.state === "original") && value.sequence !== 1) {
    pushIssue(errors, `${path}.sequence`, "INVALID_LINEAGE", "Preliminary and original vintages must use sequence 1");
  }
  if ((value.state === "revised" || value.state === "corrected") && Number(value.sequence) < 2) {
    pushIssue(errors, `${path}.sequence`, "INVALID_LINEAGE", "Revised vintages must advance the sequence");
  }
  return true;
}
function validateSupersession(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Supersession must be an object");
    return false;
  }
  validateExactKeys(value, ["state", "relatedSignalId", "reason"], path, errors);
  if (!DECISION_SIGNAL_SUPERSESSION_STATES.includes(
    value.state
  )) {
    pushIssue(errors, `${path}.state`, "INVALID_STATUS_VOCABULARY", "Unknown supersession state");
  }
  if (value.state === "corrected" || value.state === "superseded") {
    validateRequiredString(value.relatedSignalId, `${path}.relatedSignalId`, errors);
  }
  if (value.state === "cancelled") {
    validateRequiredString(value.reason, `${path}.reason`, errors);
  }
  if (value.state === "current" && (value.relatedSignalId !== void 0 || value.reason !== void 0)) {
    pushIssue(
      errors,
      path,
      "INVALID_LINEAGE",
      "Current signals cannot carry correction, cancellation, or supersession metadata"
    );
  }
  return true;
}
function validateConfidence(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Confidence must be an object");
    return false;
  }
  validateExactKeys(value, ["score", "method"], path, errors);
  if (typeof value.score !== "number" || !Number.isFinite(value.score) || value.score < 0 || value.score > 1) {
    pushIssue(errors, `${path}.score`, "INVALID_VALUE", "Confidence score must be finite and between 0 and 1");
  }
  validateRequiredString(value.method, `${path}.method`, errors);
  return true;
}
function validateSignalIds(value, path, errors) {
  if (!Array.isArray(value) || value.some((item) => !isNonEmptyString(item))) {
    pushIssue(errors, path, "INVALID_VALUE", "Expected an array of non-empty signal IDs");
    return false;
  }
  if (new Set(value).size !== value.length) {
    pushIssue(errors, path, "INVALID_VALUE", "Signal IDs must be unique");
    return false;
  }
  return true;
}
function validateCorroboration(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Corroboration must be an object");
    return false;
  }
  validateExactKeys(value, ["state", "sourceSignalIds"], path, errors);
  if (!DECISION_SIGNAL_CORROBORATION_STATES.includes(
    value.state
  )) {
    pushIssue(errors, `${path}.state`, "INVALID_STATUS_VOCABULARY", "Unknown corroboration state");
  }
  if (validateSignalIds(value.sourceSignalIds, `${path}.sourceSignalIds`, errors)) {
    const count = value.sourceSignalIds.length;
    if (value.state === "single_source" && count !== 1) {
      pushIssue(errors, `${path}.sourceSignalIds`, "INVALID_VALUE", "single_source requires exactly one source");
    }
    if ((value.state === "multi_source" || value.state === "independently_corroborated" || value.state === "contradicted") && count < 2) {
      pushIssue(errors, `${path}.sourceSignalIds`, "INVALID_VALUE", `${String(value.state)} requires two sources`);
    }
  }
  return true;
}
function validateTransportFreshness(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Transport freshness must be an object");
    return false;
  }
  validateExactKeys(value, ["state", "assessedAt", "lastSuccessAt"], path, errors);
  if (!DECISION_SIGNAL_TRANSPORT_FRESHNESS_STATES.includes(
    value.state
  )) {
    pushIssue(errors, `${path}.state`, "INVALID_STATUS_VOCABULARY", "Unknown transport-freshness state");
  }
  if (!isIsoInstant(value.assessedAt)) {
    pushIssue(errors, `${path}.assessedAt`, "INVALID_VALUE", "assessedAt must be an ISO instant");
  }
  if (value.lastSuccessAt !== void 0 && !isIsoInstant(value.lastSuccessAt)) {
    pushIssue(errors, `${path}.lastSuccessAt`, "INVALID_VALUE", "lastSuccessAt must be an ISO instant");
  }
  return true;
}
function validateContentFreshness(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Content freshness must be an object");
    return false;
  }
  validateExactKeys(value, ["state", "assessedAt", "contentAsOf"], path, errors);
  if (!DECISION_SIGNAL_CONTENT_FRESHNESS_STATES.includes(
    value.state
  )) {
    pushIssue(errors, `${path}.state`, "INVALID_STATUS_VOCABULARY", "Unknown content-freshness state");
  }
  if (!isIsoInstant(value.assessedAt)) {
    pushIssue(errors, `${path}.assessedAt`, "INVALID_VALUE", "assessedAt must be an ISO instant");
  }
  if (value.contentAsOf !== void 0 && !isProvenanceTimestamp(value.contentAsOf)) {
    pushIssue(
      errors,
      `${path}.contentAsOf`,
      "INVALID_VALUE",
      "contentAsOf must be a valid instant, day, month, or year"
    );
  }
  if ((value.state === "current" || value.state === "stale") && !isNonEmptyString(value.contentAsOf)) {
    pushIssue(errors, `${path}.contentAsOf`, "INVALID_VALUE", `${String(value.state)} content requires contentAsOf`);
  }
  if (value.state === "timestamp_unknown" && value.contentAsOf !== void 0) {
    pushIssue(
      errors,
      `${path}.contentAsOf`,
      "INVALID_VALUE",
      "timestamp_unknown content cannot carry a known content timestamp"
    );
  }
  return true;
}
function validateDerivation(value, path, errors) {
  if (!isRecord3(value)) {
    pushIssue(errors, path, "INVALID_VALUE", "Derivation must be an object");
    return false;
  }
  validateExactKeys(value, ["methodId", "methodVersion", "computedAt", "inputSignalIds"], path, errors);
  validateRequiredString(value.methodId, `${path}.methodId`, errors);
  validateRequiredString(value.methodVersion, `${path}.methodVersion`, errors);
  if (!isIsoInstant(value.computedAt)) {
    pushIssue(errors, `${path}.computedAt`, "INVALID_VALUE", "computedAt must be an ISO instant");
  }
  if (validateSignalIds(value.inputSignalIds, `${path}.inputSignalIds`, errors) && value.inputSignalIds.length === 0) {
    pushIssue(errors, `${path}.inputSignalIds`, "INVALID_VALUE", "Derived outputs require at least one input signal");
  }
  return true;
}
function validateKnownClaimValue(dimension, value, path, errors) {
  if (dimension === "publisher") validatePublisher(value, path, errors);
  if (dimension === "source_url") validateSourceUrl(value, path, errors);
  if (dimension === "original_reference") validateOriginalReference(value, path, errors);
  if (dimension === "original_language") validateRequiredString(value, path, errors);
  if (dimension === "translation") validateTranslation(value, path, errors);
  if (dimension in TIME_ROLES) {
    validateTimeReference(dimension, value, path, errors);
  }
  if (dimension === "revision") validateRevision(value, path, errors);
  if (dimension === "supersession") validateSupersession(value, path, errors);
  if (dimension === "extraction_confidence" || dimension === "classification_confidence") {
    validateConfidence(value, path, errors);
  }
  if (dimension === "corroboration") validateCorroboration(value, path, errors);
  if (dimension === "transport_freshness") validateTransportFreshness(value, path, errors);
  if (dimension === "content_freshness") validateContentFreshness(value, path, errors);
  if (dimension === "derivation") validateDerivation(value, path, errors);
}
function validateClaim(dimension, claim, declaration2, errors) {
  const path = `claims.${dimension}`;
  if (!isRecord3(claim)) {
    pushIssue(errors, path, "INVALID_CLAIM", "Claim must be an object");
    return;
  }
  if (!DECISION_SIGNAL_PROVENANCE_CLAIM_STATUSES.includes(claim.status)) {
    pushIssue(errors, `${path}.status`, "INVALID_STATUS_VOCABULARY", "Unknown claim status");
    return;
  }
  const policy = declaration2.dimensions[dimension];
  if (policy === "required" && claim.status !== "known" || policy === "not_applicable" && claim.status !== "not_applicable" || policy === "unknown_allowed" && claim.status === "not_applicable") {
    pushIssue(
      errors,
      `${path}.status`,
      "CLAIM_STATUS_VIOLATES_DECLARATION",
      `${claim.status} is not allowed by ${policy}`
    );
    return;
  }
  if (claim.status === "known") {
    validateExactKeys(claim, CLAIM_KNOWN_KEYS, path, errors);
    if (!hasOwn2(claim, "value")) {
      pushIssue(errors, `${path}.value`, "MISSING_CLAIM_VALUE", "Known claims require a value");
      return;
    }
    validateKnownClaimValue(dimension, claim.value, `${path}.value`, errors);
    return;
  }
  validateExactKeys(claim, CLAIM_UNAVAILABLE_KEYS, path, errors);
  validateRequiredString(claim.reason, `${path}.reason`, errors);
  if (hasOwn2(claim, "value")) {
    pushIssue(
      errors,
      `${path}.value`,
      "INVALID_CLAIM",
      "Unknown or not-applicable claims cannot carry an inferred value"
    );
  }
}
function validateDecisionSignalProvenance(input) {
  const errors = [];
  if (!isRecord3(input)) {
    return {
      ok: false,
      errors: [{ path: "$", code: "INVALID_SHAPE", message: "Provenance must be an object" }]
    };
  }
  validateExactKeys(input, TOP_LEVEL_KEYS, "$", errors);
  if (input.contractVersion !== DECISION_SIGNAL_PROVENANCE_CONTRACT_VERSION) {
    pushIssue(
      errors,
      "contractVersion",
      "UNSUPPORTED_CONTRACT_VERSION",
      `Expected ${DECISION_SIGNAL_PROVENANCE_CONTRACT_VERSION}`
    );
  }
  validateRequiredString(input.signalId, "signalId", errors);
  const familyId = input.familyId;
  const hasFamilyId = validateRequiredString(familyId, "familyId", errors);
  const declaration2 = hasFamilyId ? DECISION_SIGNAL_PROVENANCE_FAMILY_DECLARATIONS[familyId] : void 0;
  if (!declaration2) {
    pushIssue(errors, "familyId", "UNKNOWN_FAMILY", "Signal family has no provenance declaration");
  }
  if (!isRecord3(input.claims)) {
    pushIssue(errors, "claims", "INVALID_SHAPE", "Claims must be an object");
  } else if (declaration2) {
    validateExactKeys(input.claims, DECISION_SIGNAL_PROVENANCE_DIMENSIONS, "claims", errors);
    for (const dimension of DECISION_SIGNAL_PROVENANCE_DIMENSIONS) {
      if (!hasOwn2(input.claims, dimension)) {
        pushIssue(
          errors,
          `claims.${dimension}`,
          "MISSING_CLAIM",
          "Every provenance dimension must be declared explicitly"
        );
        continue;
      }
      validateClaim(dimension, input.claims[dimension], declaration2, errors);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input };
}
var DecisionSignalProvenanceValidationError = class extends Error {
  errors;
  constructor(errors) {
    super(errors.map((error) => `${error.path}: ${error.message}`).join("; "));
    this.name = "DecisionSignalProvenanceValidationError";
    this.errors = errors;
  }
};
function requireValidDecisionSignalProvenance(input) {
  const result = validateDecisionSignalProvenance(input);
  if (!result.ok) throw new DecisionSignalProvenanceValidationError(result.errors);
  return result.value;
}
function serializeDecisionSignalProvenance(input) {
  return JSON.stringify(requireValidDecisionSignalProvenance(input));
}
function serializeSurface(input) {
  return JSON.parse(serializeDecisionSignalProvenance(input));
}
function deserializeSurface(input) {
  return requireValidDecisionSignalProvenance(input);
}
function surfaceAdapter() {
  return Object.freeze({
    serialize: serializeSurface,
    deserialize: deserializeSurface
  });
}
var CANONICAL_SURFACE_ADAPTER = surfaceAdapter();
var DECISION_SIGNAL_PROVENANCE_SURFACE_ADAPTERS = Object.freeze({
  cache_storage: CANONICAL_SURFACE_ADAPTER,
  api: CANONICAL_SURFACE_ADAPTER,
  mcp: CANONICAL_SURFACE_ADAPTER,
  ui: CANONICAL_SURFACE_ADAPTER
});
if (Object.keys(DECISION_SIGNAL_PROVENANCE_SURFACE_ADAPTERS).length !== DECISION_SIGNAL_PROVENANCE_SURFACES.length) {
  throw new Error("Decision-signal provenance surface adapter registry is incomplete");
}

// shared/china-macro-normalization.ts
var CHINA_MACRO_PILLARS = [
  "activity",
  "investment_property",
  "credit_liquidity",
  "external_pressure",
  "trade"
];
var MAX_CLOCK_SKEW_MS = 5 * 6e4;
var CHINA_MACRO_PREFLIGHTS = [
  {
    publisherId: CHINA_MACRO_PUBLISHER_IDS.nbs,
    source: "National Bureau of Statistics of China",
    host: "www.stats.gov.cn",
    requestBudget: 8,
    mayAccept: true,
    path: (pathname) => pathname.startsWith("/english/PressRelease/")
  },
  {
    publisherId: CHINA_MACRO_PUBLISHER_IDS.safe,
    source: "State Administration of Foreign Exchange",
    host: "www.safe.gov.cn",
    requestBudget: 6,
    mayAccept: true,
    path: (pathname) => pathname.startsWith("/safe/")
  },
  {
    publisherId: CHINA_MACRO_PUBLISHER_IDS.pboc,
    source: "People\u2019s Bank of China",
    host: "www.pbc.gov.cn",
    requestBudget: 2,
    mayAccept: false,
    path: (pathname) => pathname === "/"
  },
  {
    publisherId: CHINA_MACRO_PUBLISHER_IDS.gacc,
    source: "General Administration of Customs of China",
    host: "english.customs.gov.cn",
    requestBudget: 2,
    mayAccept: false,
    path: (pathname) => pathname === "/"
  }
];
function asRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asString(value) {
  return typeof value === "string" ? value : "";
}
function asNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function isIsoInstant2(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
}
function validTemporalOrder(row, generatedAtMs) {
  const observedAt = chinaMacroObservationDateMs(asString(row.observationPeriod));
  const publishedAt = Date.parse(asString(row.releaseTime));
  const retrievedAt = Date.parse(asString(row.retrievalTime));
  return observedAt != null && Number.isFinite(publishedAt) && Number.isFinite(retrievedAt) && observedAt <= publishedAt && publishedAt <= retrievedAt && (generatedAtMs === void 0 || retrievedAt <= generatedAtMs);
}
function validProvenance(value) {
  const result = validateDecisionSignalProvenance(value);
  return result.ok && result.value.familyId === CHINA_MACRO_PROVENANCE_FAMILY;
}
function validBoundProvenance(row, expectedSeriesId) {
  const seriesId = asString(row.seriesId);
  if (expectedSeriesId !== void 0 && seriesId !== expectedSeriesId) return false;
  const seriesContract = CHINA_MACRO_SERIES_CONTRACT[seriesId];
  if (!seriesContract) return false;
  if (!validProvenance(row.provenance)) return false;
  const provenance = asRecord(row.provenance);
  const claims = asRecord(provenance.claims);
  const sourceUrl = asRecord(claims.source_url).value;
  const originalReference = asRecord(asRecord(claims.original_reference).value);
  const observationTime = asRecord(asRecord(claims.observation_time).value);
  const publicationTime = asRecord(asRecord(claims.publication_time).value);
  const retrievalTime = asRecord(asRecord(claims.retrieval_time).value);
  const revision = asRecord(asRecord(claims.revision).value);
  const publisher = asRecord(asRecord(claims.publisher).value);
  const transport = asRecord(asRecord(claims.transport_freshness).value);
  const content = asRecord(asRecord(claims.content_freshness).value);
  let parsedSource;
  try {
    parsedSource = new URL(asString(row.sourceUrl));
  } catch {
    return false;
  }
  const vintageId = asString(row.vintageId);
  return validTemporalOrder(row) && vintageId.startsWith(`${seriesId}:`) && (row.pillar === void 0 || row.pillar === seriesContract.pillar) && (row.unit === void 0 || row.unit === seriesContract.unit) && row.periodKind === seriesContract.periodKind && (row.source === void 0 || row.source === seriesContract.source) && publisher.id === seriesContract.publisherId && parsedSource.protocol === "https:" && parsedSource.hostname === seriesContract.sourceHost && parsedSource.pathname.startsWith(seriesContract.sourcePathPrefix) && parsedSource.username === "" && parsedSource.password === "" && sourceUrl === row.sourceUrl && originalReference.id === vintageId && observationTime.value === row.observationPeriod && publicationTime.value === row.releaseTime && retrievalTime.value === row.retrievalTime && revision.vintageId === vintageId && revision.sequence === row.sequence && revision.state === row.state && isIsoInstant2(transport.lastSuccessAt) && isIsoInstant2(transport.assessedAt) && Date.parse(asString(transport.assessedAt)) >= Date.parse(asString(row.retrievalTime)) && Date.parse(asString(transport.lastSuccessAt)) >= Date.parse(asString(row.retrievalTime)) && Date.parse(asString(transport.lastSuccessAt)) <= Date.parse(asString(transport.assessedAt)) && (typeof row.transportStatus !== "string" || transport.state === row.transportStatus) && content.assessedAt === transport.assessedAt && (typeof row.stale !== "boolean" || content.state === (row.stale ? "stale" : "current")) && provenance.signalId === `signal:${vintageId}`;
}
function validVintageLineage(row, vintages) {
  if (vintages.length === 0 || vintages.length > 24) return false;
  const records3 = vintages.map(asRecord);
  const seriesId = asString(row.seriesId);
  if (records3.some((vintage) => asString(vintage.seriesId) !== seriesId)) return false;
  const ids = records3.map((vintage) => asString(vintage.vintageId));
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return false;
  const current = records3.filter((vintage) => vintage.vintageId === row.vintageId);
  if (current.length !== 1) return false;
  const active = current[0];
  if (!active) return false;
  if (active.value !== row.value || active.observationPeriod !== row.observationPeriod || active.periodKind !== row.periodKind || active.releaseTime !== row.releaseTime || active.retrievalTime !== row.retrievalTime || active.sourceUrl !== row.sourceUrl || active.sequence !== row.revisionSequence || active.state !== row.revisionState) return false;
  const byPeriod = /* @__PURE__ */ new Map();
  for (const vintage of records3) {
    const period = asString(vintage.observationPeriod);
    const group = byPeriod.get(period) ?? [];
    group.push(vintage);
    byPeriod.set(period, group);
  }
  for (const periodVintages of byPeriod.values()) {
    const ordered = [...periodVintages].sort(
      (left, right) => (asNumber(left.sequence) ?? 0) - (asNumber(right.sequence) ?? 0)
    );
    const sequences = ordered.map((vintage) => asNumber(vintage.sequence) ?? 0);
    if (new Set(sequences).size !== sequences.length || sequences.some((sequence, index) => {
      const previous = sequences[index - 1];
      return index > 0 && (previous === void 0 || sequence !== previous + 1);
    })) return false;
    const periodIds = new Map(ordered.map((vintage, index) => [
      `signal:${asString(vintage.vintageId)}`,
      index
    ]));
    for (const [index, vintage] of ordered.entries()) {
      const provenance = asRecord(vintage.provenance);
      const claims = asRecord(provenance.claims);
      const supersession = asRecord(asRecord(claims.supersession).value);
      const supersededBy = asString(vintage.supersededBy);
      const isPeriodCurrent = index === ordered.length - 1;
      if (isPeriodCurrent) {
        if (supersededBy !== "" || supersession.state !== "current") return false;
        continue;
      }
      const targetIndex = periodIds.get(supersededBy);
      if (supersededBy === "" || supersession.state !== "superseded" || supersession.relatedSignalId !== supersededBy || targetIndex === void 0 || targetIndex <= index) return false;
    }
  }
  return true;
}
function normalizeProvenanceForRead(value, {
  contentStale,
  contentAsOf,
  retrievalTime,
  transportStatus,
  now
}) {
  if (!validProvenance(value)) return { provenanceJson: "", transportStatus };
  const provenance = structuredClone(asRecord(value));
  const claims = asRecord(provenance.claims);
  const assessedAt = new Date(now).toISOString();
  const transport = asRecord(asRecord(claims.transport_freshness).value);
  const lastSuccessAtMs = Date.parse(asString(transport.lastSuccessAt) || retrievalTime);
  const transportStale = !Number.isFinite(lastSuccessAtMs) || now - lastSuccessAtMs > CHINA_MACRO_MAX_TRANSPORT_AGE_MIN * 6e4;
  const effectiveTransportStatus = transportStatus === "error" || transportStatus === "blocked" ? transportStatus : transportStale ? "stale" : "fresh";
  claims.transport_freshness = {
    status: "known",
    value: {
      state: effectiveTransportStatus,
      assessedAt,
      ...Number.isFinite(lastSuccessAtMs) ? { lastSuccessAt: new Date(lastSuccessAtMs).toISOString() } : {}
    }
  };
  claims.content_freshness = {
    status: "known",
    value: {
      state: contentStale ? "stale" : "current",
      assessedAt,
      contentAsOf
    }
  };
  provenance.claims = claims;
  return {
    provenanceJson: JSON.stringify(provenance),
    transportStatus: effectiveTransportStatus
  };
}
function normalizeVintage(value, {
  currentVintageId,
  seriesId,
  transportStatus,
  now
}) {
  const row = asRecord(value);
  const current = asNumber(row.value);
  if (current === null || !validBoundProvenance(row, seriesId)) return null;
  const isCurrent = row.vintageId === currentVintageId;
  const provenanceJson = isCurrent ? normalizeProvenanceForRead(row.provenance, {
    contentStale: isChinaMacroObservationStale(
      seriesId,
      asString(row.observationPeriod),
      now
    ),
    contentAsOf: asString(row.observationPeriod),
    retrievalTime: asString(row.retrievalTime),
    transportStatus,
    now
  }).provenanceJson : JSON.stringify(row.provenance);
  return {
    vintageId: asString(row.vintageId),
    sequence: Math.max(0, Math.trunc(asNumber(row.sequence) ?? 0)),
    state: asString(row.state),
    value: current,
    hasValue: true,
    observationPeriod: asString(row.observationPeriod),
    periodKind: asString(row.periodKind),
    releaseTime: asString(row.releaseTime),
    retrievalTime: asString(row.retrievalTime),
    supersededBy: asString(row.supersededBy),
    provenanceJson
  };
}
function normalizeChinaMacroObservation(value, now = Date.now()) {
  const row = asRecord(value);
  const current = asNumber(row.value);
  const provenanceRow = {
    ...row,
    sequence: row.revisionSequence,
    state: row.revisionState
  };
  const provenanceIsValid = validBoundProvenance(provenanceRow);
  const rawVintages = Array.isArray(row.vintages) ? row.vintages : [];
  const seriesId = asString(row.seriesId);
  const vintages = rawVintages.map((vintage) => normalizeVintage(vintage, {
    currentVintageId: asString(row.vintageId),
    seriesId,
    transportStatus: asString(row.transportStatus),
    now
  }));
  if (current === null && row.provenance != null || current !== null && (!provenanceIsValid || vintages.some((item) => item === null) || !validVintageLineage(row, rawVintages))) return null;
  const observationPeriod = asString(row.observationPeriod);
  const stale = current !== null ? isChinaMacroObservationStale(seriesId, observationPeriod, now) : row.stale === true;
  const unavailableReason = current !== null && stale ? "STALE_OBSERVATION" : asString(row.unavailableReason);
  const comparison = asNumber(row.comparisonValue);
  const normalizedProvenance = normalizeProvenanceForRead(row.provenance, {
    contentStale: stale,
    contentAsOf: observationPeriod,
    retrievalTime: asString(row.retrievalTime),
    transportStatus: asString(row.transportStatus),
    now
  });
  return {
    id: seriesId,
    label: asString(row.label),
    category: asString(row.pillar),
    value: current ?? 0,
    hasValue: current !== null,
    priorValue: 0,
    hasPriorValue: false,
    unit: asString(row.unit),
    observationDate: observationPeriod,
    source: asString(row.source),
    sourceUrl: asString(row.sourceUrl),
    stale,
    unavailableReason,
    contextOnly: false,
    geography: asString(row.geography),
    seasonalAdjustment: asString(row.seasonalAdjustment),
    periodKind: asString(row.periodKind),
    observationPeriod,
    releaseTime: asString(row.releaseTime),
    retrievalTime: asString(row.retrievalTime),
    direction: stale ? "unavailable" : asString(row.direction),
    directionReason: stale ? "STALE_OBSERVATION" : asString(row.directionReason),
    comparisonBasis: asString(row.comparisonBasis),
    comparisonValue: comparison ?? 0,
    hasComparisonValue: comparison !== null,
    revisionState: asString(row.revisionState),
    vintageId: asString(row.vintageId),
    revisionSequence: Math.max(0, Math.trunc(asNumber(row.revisionSequence) ?? 0)),
    provenanceJson: provenanceIsValid ? normalizedProvenance.provenanceJson : "",
    vintages: vintages.filter((item) => item !== null),
    transportStatus: normalizedProvenance.transportStatus,
    transportFailureReason: asString(row.transportFailureReason)
  };
}
function normalizeChinaMacroObservations(values, now = Date.now(), generatedAt) {
  let generatedAtMs;
  if (generatedAt !== void 0) {
    if (!isIsoInstant2(generatedAt)) return null;
    generatedAtMs = Date.parse(generatedAt);
    if (generatedAtMs > now + MAX_CLOCK_SKEW_MS) return null;
  }
  if (values.length !== CHINA_MACRO_SERIES_IDS.length || values.some((value, index) => {
    const row = asRecord(value);
    const seriesId = asString(row.seriesId);
    const contract = CHINA_MACRO_SERIES_CONTRACT[seriesId];
    if (seriesId !== CHINA_MACRO_SERIES_IDS[index] || !contract || row.pillar !== contract.pillar || row.geography !== "CN" || row.unit !== contract.unit || row.periodKind !== contract.periodKind || row.source !== contract.source) return true;
    try {
      const sourceUrl = new URL(asString(row.sourceUrl));
      return sourceUrl.protocol !== "https:" || sourceUrl.hostname !== contract.sourceHost || !sourceUrl.pathname.startsWith(contract.sourcePathPrefix) || sourceUrl.username !== "" || sourceUrl.password !== "";
    } catch {
      return true;
    }
  })) return null;
  if (generatedAtMs !== void 0 && values.some((value) => {
    const row = asRecord(value);
    if (asNumber(row.value) === null) return false;
    if (!validTemporalOrder(row, generatedAtMs)) return true;
    const vintages = Array.isArray(row.vintages) ? row.vintages : [];
    return vintages.some((vintage) => !validTemporalOrder(asRecord(vintage), generatedAtMs));
  })) return null;
  if (generatedAtMs !== void 0 && values.some((value) => {
    const row = asRecord(value);
    if (asNumber(row.value) === null) return false;
    const rows = [row, ...Array.isArray(row.vintages) ? row.vintages.map(asRecord) : []];
    return rows.some((candidate) => {
      const claims = asRecord(asRecord(candidate.provenance).claims);
      const transport = asRecord(asRecord(claims.transport_freshness).value);
      const content = asRecord(asRecord(claims.content_freshness).value);
      return Date.parse(asString(transport.assessedAt)) > generatedAtMs || Date.parse(asString(content.assessedAt)) > generatedAtMs;
    });
  })) return null;
  const normalized2 = values.map((value) => normalizeChinaMacroObservation(value, now));
  return normalized2.some((value) => value === null) ? null : normalized2.filter((value) => value !== null);
}
function normalizeChinaMacroSourceDecision(value) {
  const row = asRecord(value);
  return {
    source: asString(row.source),
    host: asString(row.host),
    status: asString(row.status),
    reason: asString(row.reason),
    checkedAt: asString(row.checkedAt),
    optional: row.optional === true,
    requestCount: Math.max(0, Math.trunc(asNumber(row.requestCount) ?? 0)),
    publisherId: asString(row.publisherId),
    redirectBehavior: asString(row.redirectBehavior),
    requestBudget: Math.max(0, Math.trunc(asNumber(row.requestBudget) ?? 0)),
    robotsStatus: asString(row.robotsStatus),
    termsStatus: asString(row.termsStatus),
    sourceUrl: asString(row.sourceUrl)
  };
}
function normalizeChinaMacroPreflight(values, generatedAt, now = Date.now()) {
  const generatedAtMs = Date.parse(generatedAt);
  if (!isIsoInstant2(generatedAt) || generatedAtMs > now + MAX_CLOCK_SKEW_MS || values.length !== CHINA_MACRO_PREFLIGHTS.length) return null;
  const normalized2 = values.map(normalizeChinaMacroSourceDecision);
  const valid = CHINA_MACRO_PREFLIGHTS.every((expected) => {
    const matches = normalized2.filter((decision2) => decision2.publisherId === expected.publisherId);
    if (matches.length !== 1) return false;
    const decision = matches[0];
    if (!decision) return false;
    let sourceUrl;
    try {
      sourceUrl = new URL(decision.sourceUrl);
    } catch {
      return false;
    }
    const checkedAt = Date.parse(decision.checkedAt);
    const minimumRequests = decision.status === "accepted" ? expected.publisherId === CHINA_MACRO_PUBLISHER_IDS.nbs ? 5 : 4 : 1;
    const validPolicyReview = expected.publisherId === CHINA_MACRO_PUBLISHER_IDS.nbs ? decision.termsStatus === "reviewed_2026-07-25_attribution_required" && ["allows_candidate_paths", "no_rules_published", "unavailable"].includes(decision.robotsStatus) : expected.publisherId === CHINA_MACRO_PUBLISHER_IDS.safe ? decision.termsStatus === "reviewed_2026-07-25_facts_only_attribution_required" && ["allows_candidate_paths", "no_rules_published", "unavailable"].includes(decision.robotsStatus) : expected.publisherId === CHINA_MACRO_PUBLISHER_IDS.pboc ? decision.termsStatus === (decision.reason === "ROBOTS_DISALLOW" ? "not_evaluated_robots_blocked" : "review_required") : decision.termsStatus === "reviewed_all_rights_reserved_chinese_authoritative";
    return decision.source === expected.source && decision.host === expected.host && decision.status !== "" && (decision.status === "accepted" || decision.status === "blocked") && (expected.mayAccept || decision.status === "blocked") && decision.reason !== "" && (decision.status === "accepted" ? decision.reason === "OK" : decision.reason !== "OK") && isIsoInstant2(decision.checkedAt) && checkedAt <= generatedAtMs && checkedAt <= now + MAX_CLOCK_SKEW_MS && decision.optional === false && Number.isInteger(decision.requestCount) && decision.requestCount >= minimumRequests && decision.requestCount <= expected.requestBudget && decision.requestBudget === expected.requestBudget && ["none", "followed", "rejected"].includes(decision.redirectBehavior) && (decision.redirectBehavior !== "followed" || decision.requestCount >= 2) && validPolicyReview && sourceUrl.protocol === "https:" && sourceUrl.hostname === expected.host && sourceUrl.username === "" && sourceUrl.password === "" && expected.path(sourceUrl.pathname);
  });
  return valid ? normalized2 : null;
}
function validateChinaMacroAvailabilityBindings(values, decisions) {
  return values.every((value) => {
    const row = asRecord(value);
    const contract = CHINA_MACRO_SERIES_CONTRACT[asString(row.seriesId)];
    const decision = decisions.find((entry) => entry.publisherId === contract?.publisherId);
    if (asNumber(row.value) !== null) {
      return decision?.status === "accepted" ? row.transportStatus === "fresh" && row.transportFailureReason === "" : decision?.status === "blocked" && row.transportStatus === "error" && row.transportFailureReason === decision.reason;
    }
    return row.value === null && decision?.status === "blocked" && row.unavailableReason === decision.reason && row.transportStatus === "blocked" && row.transportFailureReason === decision.reason && row.provenance === null && Array.isArray(row.vintages) && row.vintages.length === 0 && row.observationPeriod === "" && row.releaseTime === "" && row.retrievalTime === "";
  });
}
function normalizeChinaReleaseEvent(value) {
  const row = asRecord(value);
  return {
    id: asString(row.id),
    event: asString(row.event),
    countryCode: asString(row.countryCode),
    releaseDate: asString(row.releaseDate),
    releaseTime: asString(row.releaseTime),
    timezone: asString(row.timezone),
    kind: asString(row.kind),
    status: asString(row.status),
    source: asString(row.source),
    sourceUrl: asString(row.sourceUrl)
  };
}
function recomputeChinaMacroPillars(observations) {
  return CHINA_MACRO_PILLARS.map((pillar) => {
    const candidates = observations.filter((observation) => observation.category === pillar);
    const comparable = candidates.filter((observation) => observation.hasValue && !observation.stale && observation.direction !== "unavailable");
    const comparisonFrames = new Set(comparable.map((observation) => `${observation.observationPeriod}|${observation.periodKind}|${observation.comparisonBasis}`));
    const directions = [...new Set(comparable.map((observation) => observation.direction))];
    const comparableFrame = comparisonFrames.size <= 1;
    return {
      pillar,
      direction: comparableFrame && directions.length === 1 ? directions[0] ?? "unavailable" : "unavailable",
      reason: !comparableFrame ? "INCOMPARABLE_PERIOD_OR_BASIS" : directions.length === 0 ? "NO_AVAILABLE_OFFICIAL_OBSERVATION" : directions.length === 1 ? "CONSISTENT_AVAILABLE_OBSERVATIONS" : "MIXED_OFFICIAL_SIGNALS",
      observationIds: candidates.map((observation) => observation.id)
    };
  });
}

// server/worldmonitor/economic/v1/get-china-macro-snapshot.ts
function asRecord2(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asString2(value) {
  return typeof value === "string" ? value : "";
}
function fallback() {
  return {
    countryCode: "CN",
    generatedAt: "",
    status: "unavailable",
    launchReady: false,
    contentObservationDate: "",
    latestObservationDate: "",
    indicators: [],
    sourceDecisions: [],
    releaseEvents: [],
    unavailable: true,
    schemaVersion: CHINA_MACRO_SCHEMA_VERSION,
    pillars: []
  };
}
async function getChinaMacroSnapshot(_ctx, _req) {
  const cached = await getCachedJsonBatch([CHINA_MACRO_KEY, CHINA_RELEASE_CALENDAR_KEY], true);
  const macro = asRecord2(cached.get(CHINA_MACRO_KEY));
  const calendar = asRecord2(cached.get(CHINA_RELEASE_CALENDAR_KEY));
  const rawIndicators = Array.isArray(macro.observations) ? macro.observations : [];
  const rawEvents = Array.isArray(calendar.events) ? calendar.events : [];
  if (macro.schemaVersion !== CHINA_MACRO_SCHEMA_VERSION || macro.countryCode !== "CN" || rawIndicators.length === 0) return fallback();
  const generatedAt = asString2(macro.generatedAt);
  const indicators = normalizeChinaMacroObservations(rawIndicators, Date.now(), generatedAt);
  if (indicators === null) return fallback();
  const macroDecisions = normalizeChinaMacroPreflight(
    Array.isArray(macro.sourceDecisions) ? macro.sourceDecisions : [],
    generatedAt
  );
  if (macroDecisions === null) return fallback();
  if (!validateChinaMacroAvailabilityBindings(rawIndicators, macroDecisions)) return fallback();
  const launchReady = macro.launchReady === true && CHINA_MACRO_REQUIRED_SERIES.every((seriesId) => indicators.some((indicator) => indicator.id === seriesId && indicator.hasValue && !indicator.stale && !indicator.unavailableReason && indicator.transportStatus === "fresh"));
  const calendarDecisions = Array.isArray(calendar.sourceDecisions) ? calendar.sourceDecisions : [];
  const degraded = indicators.some((indicator) => !indicator.hasValue || indicator.stale || indicator.unavailableReason !== "" || indicator.transportStatus !== "fresh") || macroDecisions.some((decision) => decision.status !== "accepted") || rawEvents.length === 0;
  const requiredPeriods = CHINA_MACRO_REQUIRED_SERIES.map((seriesId) => indicators.find((indicator) => indicator.id === seriesId)?.observationPeriod ?? "").filter(Boolean).sort();
  return {
    countryCode: "CN",
    generatedAt,
    status: launchReady && !degraded ? "ready" : "degraded",
    launchReady,
    contentObservationDate: requiredPeriods[0] ?? "",
    latestObservationDate: requiredPeriods[requiredPeriods.length - 1] ?? "",
    indicators,
    sourceDecisions: [
      ...macroDecisions,
      ...calendarDecisions.map(normalizeChinaMacroSourceDecision)
    ],
    releaseEvents: rawEvents.map(normalizeChinaReleaseEvent),
    unavailable: false,
    schemaVersion: CHINA_MACRO_SCHEMA_VERSION,
    pillars: recomputeChinaMacroPillars(indicators)
  };
}

// shared/china-activity-nowcast-registry.ts
var CHINA_ACTIVITY_PROXY_FAMILIES = [
  "freight",
  "maritime",
  "aviation",
  "energy",
  "commodity",
  "corridor",
  "market"
];
function proxyDefinition(definition) {
  return Object.freeze({
    ...definition,
    transformation: Object.freeze(definition.transformation),
    lagRule: Object.freeze(definition.lagRule),
    alignment: Object.freeze(definition.alignment),
    source: Object.freeze(definition.source)
  });
}
var CHINA_ACTIVITY_PROXY_REGISTRY = Object.freeze([
  proxyDefinition({
    id: "ccfi_freight_rate_change",
    label: "China Containerized Freight Index change",
    family: "freight",
    decisionRationale: "Container freight-rate direction is retained as a bounded logistics-price proxy, while the panel warns that capacity shocks can move rates without matching activity.",
    unit: "% change",
    frequency: "weekly",
    transformation: {
      kind: "signed_value",
      direction: "same",
      description: "Use the exchange's own published period-over-period percentage change, or the change between two period levels it published; never infer a change from a single index level."
    },
    lagRule: {
      days: 0,
      description: "Align to the published weekly observation without a hidden lead or lag."
    },
    alignment: {
      window: "latest_point_in_window",
      forwardFill: false,
      interpolate: false,
      description: "Use only an observed weekly point inside the comparison window; never carry a rate forward."
    },
    freshnessBudgetMinutes: 28 * 24 * 60,
    source: {
      publisherId: "publisher:shanghai-shipping-exchange",
      publisherName: "Shanghai Shipping Exchange",
      url: "https://en.sse.net.cn/indices/ccfinew.jsp",
      provenance: "Consumed from the reviewed #5578 corridor trade signal and its source envelope."
    }
  }),
  proxyDefinition({
    id: "portwatch_tanker_calls_trend",
    label: "Reviewed China port activity trend",
    family: "maritime",
    decisionRationale: "The mean reviewed PortWatch trend delta captures broad maritime activity direction across configured China gateways without turning vessel calls into a GDP level.",
    unit: "trend delta",
    frequency: "daily",
    transformation: {
      kind: "signed_value",
      direction: "same",
      description: "Average only explicit finite trend deltas across reviewed port nodes; positive means strengthening."
    },
    lagRule: {
      days: 0,
      description: "Align to each underlying port observation date with no synthetic lag."
    },
    alignment: {
      window: "latest_point_in_window",
      forwardFill: false,
      interpolate: false,
      description: "Use the latest reviewed aggregate inside the window and expose missing nodes separately."
    },
    freshnessBudgetMinutes: 2 * 72 * 60,
    source: {
      publisherId: "publisher:imf-portwatch",
      publisherName: "IMF PortWatch",
      url: "https://portwatch.imf.org/",
      provenance: "Consumed from the reviewed #5578 port condition and exact source-signal timestamps."
    }
  }),
  proxyDefinition({
    id: "aviation_hub_disruption_balance",
    label: "Reviewed China aviation hub balance",
    family: "aviation",
    decisionRationale: "The normal-versus-disrupted balance across configured hubs is a transparent operational proxy and is not treated as passenger volume or verified output.",
    unit: "normal minus disrupted share",
    frequency: "intra-day",
    transformation: {
      kind: "signed_value",
      direction: "same",
      description: "Compute the reviewed-hub normal share minus disrupted share; omitted hubs remain missing."
    },
    lagRule: {
      days: 0,
      description: "Align to the provider coverage timestamp without a hidden lead or lag."
    },
    alignment: {
      window: "latest_point_in_window",
      forwardFill: false,
      interpolate: false,
      description: "Use a contemporaneous reviewed-hub snapshot only; never interpolate provider status."
    },
    freshnessBudgetMinutes: 180,
    source: {
      publisherId: "publisher:aviationstack",
      publisherName: "AviationStack",
      url: "https://aviationstack.com/",
      provenance: "Consumed from the reviewed #5578 aviation condition with configured IATA selectors."
    }
  }),
  proxyDefinition({
    id: "china_energy_demand_change",
    label: "China energy-demand change",
    family: "energy",
    decisionRationale: "Observed energy-demand change can corroborate industrial direction, but mere source coverage or generation mix is never converted into an activity contribution.",
    unit: "% change",
    frequency: "monthly",
    transformation: {
      kind: "signed_value",
      direction: "same",
      description: "Use an explicitly published demand change; source-availability booleans do not become zero."
    },
    lagRule: {
      days: 30,
      description: "Apply the documented one-month publication lag before the observation is eligible."
    },
    alignment: {
      window: "latest_point_in_window",
      forwardFill: false,
      interpolate: false,
      description: "Use the latest released monthly change inside the live 210-day window; do not fill absent months."
    },
    freshnessBudgetMinutes: 210 * 24 * 60,
    source: {
      publisherId: "publisher:worldmonitor-energy-spine",
      publisherName: "WorldMonitor energy spine",
      url: "https://www.worldmonitor.app/docs/data-sources",
      provenance: "Consumed only when the reviewed #5578 energy condition exposes a directional observed metric. The value sums TOTDEMO for the available GASOLINE, GASDIES, JETKERO, RESFUEL, and LPG products; at least three matching products are required and absolute changes above 50% are refused."
    }
  }),
  proxyDefinition({
    id: "china_input_commodity_change",
    label: "China-sensitive input commodity change",
    family: "commodity",
    decisionRationale: "A transparent mean of China-sensitive copper and aluminium moves provides market corroboration, while the output preserves that prices also reflect global supply shocks.",
    unit: "% change",
    frequency: "daily",
    transformation: {
      kind: "signed_value",
      direction: "same",
      description: "Average finite published percentage changes for the reviewed copper and aluminium symbols."
    },
    lagRule: {
      days: 0,
      description: "Align to the quote snapshot timestamp without a hidden lead or lag."
    },
    alignment: {
      window: "latest_point_in_window",
      forwardFill: false,
      interpolate: false,
      description: "Use only a current quote snapshot and disclose absent symbols rather than filling them."
    },
    freshnessBudgetMinutes: 180,
    source: {
      publisherId: "publisher:alphavantage-yahoo",
      publisherName: "Alpha Vantage and Yahoo Finance",
      url: "https://www.worldmonitor.app/docs/data-sources",
      provenance: "Consumed from the canonical market commodity seed with its independent seed-health record."
    }
  }),
  proxyDefinition({
    id: "corridor_activity_breadth_change",
    label: "China corridor activity-breadth change",
    family: "corridor",
    decisionRationale: "Change in signed source-derived activity across corridor families can show broadening or narrowing, while directional availability transitions are explicitly excluded as activity.",
    unit: "family-count change",
    frequency: "daily",
    transformation: {
      kind: "signed_value",
      direction: "same",
      description: "Use the change in strengthening-family count minus weakening-family count versus a prior comparable snapshot; availability alone is never a value."
    },
    lagRule: {
      days: 0,
      description: "Align comparable corridor snapshots by their assessed timestamps with no hidden lag."
    },
    alignment: {
      window: "latest_point_in_window",
      forwardFill: false,
      interpolate: false,
      description: "Require two comparable snapshots; never convert missing families into unchanged activity."
    },
    freshnessBudgetMinutes: 72 * 60,
    source: {
      publisherId: "publisher:worldmonitor-china-corridors",
      publisherName: "WorldMonitor China corridor control towers",
      url: "https://www.worldmonitor.app/docs/data-sources",
      provenance: "Derived only from reproducible #5578 corridor snapshots whose conditions retain source provenance."
    }
  }),
  proxyDefinition({
    id: "sse_composite_week_change",
    label: "SSE Composite weekly change",
    family: "market",
    decisionRationale: "The published weekly equity-market move is retained as a sentiment and financing proxy, not as proof of hidden real-economy activity.",
    unit: "% change",
    frequency: "daily",
    transformation: {
      kind: "signed_value",
      direction: "same",
      description: "Use the bounded weekly percentage change from the seeded SSE Composite snapshot."
    },
    lagRule: {
      days: 0,
      description: "Align to the market snapshot timestamp without a hidden lead or lag."
    },
    alignment: {
      window: "latest_point_in_window",
      forwardFill: false,
      interpolate: false,
      description: "Use a current seeded market snapshot; do not carry a prior close series across outages."
    },
    freshnessBudgetMinutes: 10 * 24 * 60,
    source: {
      publisherId: "publisher:yahoo-finance",
      publisherName: "Yahoo Finance",
      url: "https://finance.yahoo.com/quote/000001.SS/",
      provenance: "Consumed from the Railway-owned China country-index snapshot and its explicit fetchedAt timestamp."
    }
  })
]);

// shared/china-activity-nowcast.ts
var CHINA_ACTIVITY_NOWCAST_METHOD_VERSION = "china-activity-nowcast/v1";
var CHINA_ACTIVITY_COMPARISON_STATES = [
  "agreement",
  "proxy_leading_divergence",
  "official_leading_divergence",
  "mixed_signals",
  "insufficient_data"
];
var CHINA_ACTIVITY_DIRECTIONS = [
  "strengthening",
  "weakening",
  "unchanged"
];
var registryById = new Map(
  CHINA_ACTIVITY_PROXY_REGISTRY.map((definition) => [definition.id, definition])
);
var validDirections = new Set(CHINA_ACTIVITY_DIRECTIONS);
var validStates = new Set(CHINA_ACTIVITY_COMPARISON_STATES);
var MILLISECONDS_PER_DAY = 864e5;
function instant(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function hasProvenance(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function selectOfficial(observations, evaluatedAtMs) {
  return observations.filter((observation) => {
    const periodEnd = instant(observation.periodEnd);
    const releaseTime = instant(observation.releaseTime);
    const retrievalTime = instant(observation.retrievalTime);
    return periodEnd !== null && releaseTime !== null && retrievalTime !== null && periodEnd <= releaseTime && releaseTime <= retrievalTime && retrievalTime <= evaluatedAtMs && observation.available && !observation.stale && finite(observation.value) && validDirections.has(observation.direction) && hasProvenance(observation.provenance);
  }).sort((left, right) => {
    const period = (instant(right.periodEnd) ?? 0) - (instant(left.periodEnd) ?? 0);
    if (period !== 0) return period;
    return (instant(right.retrievalTime) ?? 0) - (instant(left.retrievalTime) ?? 0);
  })[0] ?? null;
}
function transformedValue(definition, observation) {
  if (!finite(observation.value)) return null;
  const value = definition.transformation.kind === "signed_value" ? observation.value : finite(observation.priorValue) && observation.priorValue !== 0 ? (observation.value - observation.priorValue) / Math.abs(observation.priorValue) * 100 : null;
  if (value === null) return null;
  return definition.transformation.direction === "inverse" ? -value : value;
}
function directionFromValue(value) {
  if (value > 1e-9) return "strengthening";
  if (value < -1e-9) return "weakening";
  return "unchanged";
}
function excludedContribution(definition, reason, observation = null) {
  return {
    family: definition.family,
    seriesId: definition.id,
    registry: definition,
    observationId: observation?.observationId ?? null,
    observedAt: observation?.observedAt ?? null,
    alignedAt: null,
    rawValue: observation?.value ?? null,
    priorValue: observation?.priorValue ?? null,
    transformedValue: null,
    direction: null,
    included: false,
    exclusionReason: reason,
    provenance: observation?.provenance ?? null
  };
}
function contributionFor(definition, observations, evaluatedAtMs, windowStartsAtMs) {
  const latest = observations.filter((observation) => observation.seriesId === definition.id).filter((observation) => {
    const observedAt = instant(observation.observedAt);
    const releasedAt = instant(observation.releasedAt);
    const retrievedAt = instant(observation.retrievedAt);
    return observedAt !== null && releasedAt !== null && retrievedAt !== null && observedAt <= releasedAt && releasedAt <= retrievedAt && retrievedAt <= evaluatedAtMs;
  }).sort((left, right) => (instant(right.observedAt) ?? 0) - (instant(left.observedAt) ?? 0))[0] ?? null;
  if (latest === null) return excludedContribution(definition, "no_observation");
  const observedAtMs = instant(latest.observedAt);
  if (latest.structuralBreak) {
    return excludedContribution(definition, "structural_break", latest);
  }
  if (!latest.available) {
    return excludedContribution(definition, "unavailable", latest);
  }
  if (latest.stale) {
    return excludedContribution(definition, "marked_stale", latest);
  }
  if (!hasProvenance(latest.provenance)) {
    return excludedContribution(definition, "missing_provenance", latest);
  }
  const alignedAtMs = observedAtMs + definition.lagRule.days * MILLISECONDS_PER_DAY;
  if (alignedAtMs > evaluatedAtMs) {
    return excludedContribution(definition, "lag_not_elapsed", latest);
  }
  if (alignedAtMs < windowStartsAtMs) {
    return excludedContribution(definition, "outside_comparison_window_no_fill", latest);
  }
  if (evaluatedAtMs - observedAtMs > definition.freshnessBudgetMinutes * 6e4) {
    return excludedContribution(definition, "freshness_budget_exceeded", latest);
  }
  const transformed = transformedValue(definition, latest);
  if (transformed === null) {
    return excludedContribution(
      definition,
      definition.transformation.kind === "percentage_change" ? "missing_comparable_prior" : "missing_directional_value",
      latest
    );
  }
  return {
    family: definition.family,
    seriesId: definition.id,
    registry: definition,
    observationId: latest.observationId,
    observedAt: latest.observedAt,
    alignedAt: new Date(alignedAtMs).toISOString(),
    rawValue: latest.value,
    priorValue: latest.priorValue,
    transformedValue: transformed,
    direction: directionFromValue(transformed),
    included: true,
    exclusionReason: null,
    provenance: latest.provenance
  };
}
function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2 : sorted[middle] ?? null;
}
function classify(official, contributions, minimumProxyFamilies) {
  if (official === null || official.direction === "unchanged") return "insufficient_data";
  const directional = contributions.filter((contribution) => contribution.included && contribution.direction !== "unchanged");
  const families = new Set(directional.map((contribution) => contribution.family));
  if (families.size < minimumProxyFamilies) return "insufficient_data";
  const strengthening = directional.filter((item) => item.direction === "strengthening").length;
  const weakening = directional.filter((item) => item.direction === "weakening").length;
  const total = strengthening + weakening;
  const leading = Math.max(strengthening, weakening);
  if (total === 0 || leading / total < 2 / 3) return "mixed_signals";
  const proxyDirection = strengthening > weakening ? "strengthening" : "weakening";
  if (proxyDirection === official.direction) return "agreement";
  const proxyMedian = median(directional.map((item) => item.alignedAt === null ? null : instant(item.alignedAt)).filter((value) => value !== null));
  const officialPeriodEnd = instant(official.periodEnd);
  return proxyMedian !== null && officialPeriodEnd !== null && proxyMedian > officialPeriodEnd ? "proxy_leading_divergence" : "official_leading_divergence";
}
function confidenceFor(state, official, contributions, sensitivity, minimumProxyFamilies) {
  const eligibleFamilies = new Set(
    contributions.filter((item) => item.included).map((item) => item.family)
  ).size;
  if (state === "insufficient_data") {
    const directionalFamilies = new Set(
      contributions.filter((item) => item.included && item.direction !== "unchanged").map((item) => item.family)
    ).size;
    const reason = official === null ? "One eligible official vintage is required." : official.direction === "unchanged" ? "The eligible official vintage is unchanged; a directional comparison requires strengthening or weakening." : `At least ${minimumProxyFamilies} non-flat proxy families are required; ${directionalFamilies} are eligible.`;
    return {
      level: "insufficient",
      reason,
      eligibleFamilies,
      totalFamilies: CHINA_ACTIVITY_PROXY_FAMILIES.length
    };
  }
  const conclusionSensitive = sensitivity.some((item) => item.changesConclusion);
  const coverage = eligibleFamilies / CHINA_ACTIVITY_PROXY_FAMILIES.length;
  const level = !conclusionSensitive && coverage >= 0.75 ? "high" : coverage >= 0.5 ? "medium" : "low";
  return {
    level,
    reason: conclusionSensitive ? "At least one proxy family changes the leave-one-family-out conclusion." : `Eligible proxy-family coverage is ${eligibleFamilies}/${CHINA_ACTIVITY_PROXY_FAMILIES.length}.`,
    eligibleFamilies,
    totalFamilies: CHINA_ACTIVITY_PROXY_FAMILIES.length
  };
}
function sensitivityFor(official, contributions, state, minimumProxyFamilies) {
  const includedCount = contributions.filter((item) => item.included).length;
  return CHINA_ACTIVITY_PROXY_FAMILIES.map((family2) => {
    const withoutFamily = contributions.filter((item) => item.family !== family2);
    const contributionCount = contributions.filter((item) => item.family === family2 && item.included).length;
    const stateWithoutFamily = classify(official, withoutFamily, minimumProxyFamilies);
    return {
      family: family2,
      contributionCount,
      contributionShare: includedCount === 0 ? 0 : contributionCount / includedCount,
      stateWithoutFamily,
      changesConclusion: contributionCount > 0 && stateWithoutFamily !== state
    };
  });
}
function evaluateChinaActivityNowcast(input) {
  const evaluatedAtMs = instant(input.evaluatedAt);
  if (evaluatedAtMs === null) throw new Error("Invalid China activity nowcast evaluation time");
  const comparisonWindowDays = Math.max(1, Math.trunc(input.comparisonWindowDays ?? 90));
  const minimumProxyFamilies = Math.max(1, Math.trunc(input.minimumProxyFamilies ?? 3));
  const windowStartsAtMs = evaluatedAtMs - comparisonWindowDays * MILLISECONDS_PER_DAY;
  const official = selectOfficial(input.officialObservations, evaluatedAtMs);
  const contributions = CHINA_ACTIVITY_PROXY_REGISTRY.map((definition) => contributionFor(
    definition,
    input.proxyObservations,
    evaluatedAtMs,
    windowStartsAtMs
  ));
  const state = classify(official, contributions, minimumProxyFamilies);
  const sensitivity = sensitivityFor(
    official,
    contributions,
    state,
    minimumProxyFamilies
  );
  const excludedFutureObservationIds = input.proxyObservations.filter((observation) => {
    const observed = instant(observation.observedAt);
    const released = instant(observation.releasedAt);
    const retrieved = instant(observation.retrievedAt);
    return observed === null || released === null || retrieved === null || observed > evaluatedAtMs || released > evaluatedAtMs || retrieved > evaluatedAtMs;
  }).map((observation) => observation.observationId).sort();
  return {
    methodVersion: CHINA_ACTIVITY_NOWCAST_METHOD_VERSION,
    evaluatedAt: new Date(evaluatedAtMs).toISOString(),
    comparisonWindow: {
      days: comparisonWindowDays,
      startsAt: new Date(windowStartsAtMs).toISOString(),
      endsAt: new Date(evaluatedAtMs).toISOString(),
      forwardFill: false,
      interpolate: false
    },
    state,
    official,
    contributions,
    missingInputs: contributions.filter((item) => !item.included).map((item) => ({
      family: item.family,
      seriesId: item.seriesId,
      reason: item.exclusionReason ?? "unavailable"
    })),
    confidence: confidenceFor(
      state,
      official,
      contributions,
      sensitivity,
      minimumProxyFamilies
    ),
    sensitivity,
    historicalEvaluation: {
      available: false,
      reason: "The live cache does not yet contain a bounded historical proxy ledger; no backtest is inferred from current-only snapshots.",
      noLookahead: true,
      attempted: 0,
      evaluated: 0,
      coverage: 0,
      directionalAgreement: null
    },
    limitations: [
      "This is a directional comparison, not a replacement GDP estimate or a hidden-activity verification.",
      "Market prices and freight rates can move for global supply, capacity, and risk reasons unrelated to China activity.",
      "Missing, stale, structurally changed, or provenance-free inputs are excluded rather than treated as neutral."
    ],
    audit: {
      deterministic: true,
      llmNumericComputation: false,
      noLookahead: true,
      excludedFutureObservationIds,
      officialCandidatesConsidered: input.officialObservations.length
    }
  };
}
function isChinaActivityNowcastUpstreamUnavailable(response) {
  return response.official === null && response.contributions.every((contribution) => !contribution.included);
}

// shared/china-logistics-corridors.ts
var CHINA_CORRIDOR_SIGNAL_FAMILIES = [
  "port",
  "aviation",
  "hazard",
  "power_energy",
  "strategic_industry",
  "trade"
];
var CHINA_LOGISTICS_CORRIDOR_IDS = [
  "china-yangtze-river-delta",
  "china-greater-bay-area",
  "china-bohai-rim",
  "china-western-land-sea-corridor"
];
var CHINA_CORRIDOR_NODE_TYPES = [
  "port",
  "airport",
  "crossing",
  "industrial"
];
var allSignalFamilies = [...CHINA_CORRIDOR_SIGNAL_FAMILIES];
function node(id, name, type, lat, lon, sourceOwner, sourceSelector) {
  return { id: `china-node:${id}`, name, type, lat, lon, sourceOwner, sourceSelector };
}
function selectorsFromNodes(nodes) {
  return nodes.flatMap((item) => item.sourceSelector ? [item.sourceSelector] : []);
}
function corridor(definition) {
  const sourceSelectors = [
    ...selectorsFromNodes(definition.nodes),
    ...definition.sourceSelectors ?? []
  ];
  return Object.freeze({
    ...definition,
    signalFamilies: allSignalFamilies,
    sourceSelectors: Object.freeze(sourceSelectors)
  });
}
var yrdNodes = [
  node("yrd-port-shanghai", "Shanghai", "port", 31.1918, 121.6442, "IMF PortWatch", { family: "port", id: "port1188" }),
  node("yrd-port-yangshan", "Shanghai Yangshan", "port", 30.6151, 122.0748, "IMF PortWatch", { family: "port", id: "port2027" }),
  node("yrd-port-ningbo", "Ningbo", "port", 29.9208, 121.8818, "IMF PortWatch", { family: "port", id: "port824" }),
  node("yrd-port-zhoushan", "Zhoushan", "port", 30.0564, 122.1008, "IMF PortWatch", { family: "port", id: "port1429" }),
  node("yrd-port-taicang", "Suzhou Taicang", "port", 31.65, 121.2, "IMF PortWatch", { family: "port", id: "port1253" }),
  node("yrd-port-nanjing", "Nanjing", "port", 32.08, 118.77, "IMF PortWatch", { family: "port", id: "port2020" }),
  node("yrd-airport-pvg", "Shanghai Pudong International", "airport", 31.1443, 121.8083, "AviationStack", { family: "aviation", id: "PVG" }),
  node("yrd-industry-shanghai", "Shanghai advanced manufacturing cluster", "industrial", 31.2304, 121.4737, "Reviewed WorldMonitor configuration"),
  node("yrd-industry-suzhou", "Suzhou industrial cluster", "industrial", 31.2989, 120.5853, "Reviewed WorldMonitor configuration"),
  node("yrd-industry-ningbo", "Ningbo-Zhoushan industrial cluster", "industrial", 29.8683, 121.544, "Reviewed WorldMonitor configuration")
];
var gbaNodes = [
  node("gba-port-shekou", "Shekou Shenzhen", "port", 22.47, 113.9, "IMF PortWatch", { family: "port", id: "port1189" }),
  node("gba-port-yantian", "Yantian", "port", 22.58, 114.27, "IMF PortWatch", { family: "port", id: "port1414" }),
  node("gba-port-mawan", "Mawan", "port", 22.49, 113.87, "IMF PortWatch", { family: "port", id: "port2028" }),
  node("gba-port-dachan-bay", "Dachan Bay", "port", 22.55, 113.8, "IMF PortWatch", { family: "port", id: "port2029" }),
  node("gba-port-qianhai-bay", "Qianhai Bay", "port", 22.53, 113.89, "IMF PortWatch", { family: "port", id: "port2030" }),
  node("gba-port-nansha", "Guangzhou Nansha", "port", 22.63, 113.67, "IMF PortWatch", { family: "port", id: "port425" }),
  node("gba-port-huangpu", "Guangzhou Huangpu", "port", 23.1, 113.46, "IMF PortWatch", { family: "port", id: "port2401" }),
  node("gba-port-zhuhai", "Zhuhai", "port", 22.27, 113.58, "IMF PortWatch", { family: "port", id: "port2112" }),
  node("gba-port-hong-kong", "Hong Kong", "port", 22.3351, 114.0967, "IMF PortWatch", { family: "port", id: "port474" }),
  node("gba-airport-can", "Guangzhou Baiyun International", "airport", 23.3924, 113.2988, "AviationStack", { family: "aviation", id: "CAN" }),
  node("gba-airport-szx", "Shenzhen Bao\u2019an International", "airport", 22.6393, 113.8107, "AviationStack", { family: "aviation", id: "SZX" }),
  node("gba-airport-hkg", "Hong Kong International", "airport", 22.308, 113.9185, "AviationStack", { family: "aviation", id: "HKG" }),
  node("gba-industry-shenzhen", "Shenzhen technology manufacturing cluster", "industrial", 22.5431, 114.0579, "Reviewed WorldMonitor configuration"),
  node("gba-industry-guangzhou", "Guangzhou-Foshan industrial cluster", "industrial", 23.1291, 113.2644, "Reviewed WorldMonitor configuration"),
  node("gba-industry-hong-kong", "Hong Kong trade and finance gateway", "industrial", 22.3193, 114.1694, "Reviewed WorldMonitor configuration")
];
var bohaiNodes = [
  node("bohai-port-qingdao", "Qingdao", "port", 36.07, 120.32, "IMF PortWatch", { family: "port", id: "port1069" }),
  node("bohai-port-tianjin", "Tianjin Xin Gang", "port", 38.98, 117.75, "IMF PortWatch", { family: "port", id: "port1297" }),
  node("bohai-port-qinhuangdao", "Qinhuangdao", "port", 39.91, 119.6, "IMF PortWatch", { family: "port", id: "port1072" }),
  node("bohai-port-tangshan", "Tangshan Jingtang", "port", 39.22, 119, "IMF PortWatch", { family: "port", id: "port1266" }),
  node("bohai-port-shougang", "Shougang Jingtang", "port", 39.2, 119, "IMF PortWatch", { family: "port", id: "port1195" }),
  node("bohai-port-dalian", "Dalian", "port", 38.92, 121.64, "IMF PortWatch", { family: "port", id: "port273" }),
  node("bohai-port-huanghua", "Huanghua", "port", 38.32, 117.87, "IMF PortWatch", { family: "port", id: "port154" }),
  node("bohai-airport-pek", "Beijing Capital International", "airport", 40.0799, 116.6031, "AviationStack", { family: "aviation", id: "PEK" }),
  node("bohai-industry-beijing-tianjin", "Beijing-Tianjin industrial cluster", "industrial", 39.5, 117.2, "Reviewed WorldMonitor configuration"),
  node("bohai-industry-shandong", "Shandong manufacturing cluster", "industrial", 36.6512, 117.1201, "Reviewed WorldMonitor configuration"),
  node("bohai-industry-liaoning", "Liaoning heavy-industry cluster", "industrial", 41.8057, 123.4315, "Reviewed WorldMonitor configuration")
];
var westernNodes = [
  node("western-port-qinzhou", "Qinzhou", "port", 21.6788, 108.6383, "IMF PortWatch", { family: "port", id: "port1071" }),
  node("western-port-fangcheng", "Fangcheng", "port", 21.6142, 108.3643, "IMF PortWatch", { family: "port", id: "port339" }),
  node("western-port-beibu-gulf", "Guangxi Beibu Gulf Port", "port", 21.5109, 109.5385, "IMF PortWatch", { family: "port", id: "port424" }),
  node("western-airport-ctu", "Chengdu Shuangliu International", "airport", 30.5785, 103.9471, "AviationStack", { family: "aviation", id: "CTU" }),
  node("western-airport-kmg", "Kunming Changshui International", "airport", 25.1019, 102.9292, "AviationStack", { family: "aviation", id: "KMG" }),
  node("western-airport-urc", "\xDCr\xFCmqi Diwopu International", "airport", 43.9071, 87.4742, "AviationStack", { family: "aviation", id: "URC" }),
  node("western-crossing-khorgos", "Khorgos land crossing", "crossing", 44.214, 80.41, "Reviewed WorldMonitor configuration"),
  node("western-crossing-alashankou", "Alashankou land crossing", "crossing", 45.17, 82.57, "Reviewed WorldMonitor configuration"),
  node("western-crossing-pingxiang", "Pingxiang land crossing", "crossing", 22.108, 106.756, "Reviewed WorldMonitor configuration"),
  node("western-industry-chengdu", "Chengdu manufacturing cluster", "industrial", 30.5728, 104.0668, "Reviewed WorldMonitor configuration"),
  node("western-industry-chongqing", "Chongqing manufacturing cluster", "industrial", 29.563, 106.5516, "Reviewed WorldMonitor configuration"),
  node("western-industry-urumqi", "\xDCr\xFCmqi western logistics hub", "industrial", 43.8256, 87.6168, "Reviewed WorldMonitor configuration")
];
var CHINA_LOGISTICS_CORRIDORS = Object.freeze([
  corridor({
    id: "china-yangtze-river-delta",
    name: "Yangtze River Delta",
    description: "Reviewed coastal logistics corridor joining Shanghai, Jiangsu, and Zhejiang port, aviation, and advanced-manufacturing nodes.",
    boundary: Object.freeze([
      { lat: 28.4, lon: 118.2 },
      { lat: 28.4, lon: 123.2 },
      { lat: 33.4, lon: 123.2 },
      { lat: 33.4, lon: 118.2 },
      { lat: 28.4, lon: 118.2 }
    ]),
    nodes: yrdNodes
  }),
  corridor({
    id: "china-greater-bay-area",
    name: "Greater Bay Area",
    description: "Reviewed Pearl River Delta corridor connecting Guangdong, Hong Kong, and Macao-facing port, airport, and industrial gateways.",
    boundary: Object.freeze([
      { lat: 20.5, lon: 111.5 },
      { lat: 20.5, lon: 115.8 },
      { lat: 24.8, lon: 115.8 },
      { lat: 24.8, lon: 111.5 },
      { lat: 20.5, lon: 111.5 }
    ]),
    nodes: gbaNodes,
    sourceSelectors: [{ family: "hazard", id: "hazard:hko-warnings" }]
  }),
  corridor({
    id: "china-bohai-rim",
    name: "Bohai Rim",
    description: "Reviewed northern maritime-industrial corridor spanning Beijing-Tianjin, Hebei, Shandong, Liaoning, and their major gateways.",
    boundary: Object.freeze([
      { lat: 35.5, lon: 116 },
      { lat: 35.5, lon: 123.5 },
      { lat: 42.2, lon: 123.5 },
      { lat: 42.2, lon: 116 },
      { lat: 35.5, lon: 116 }
    ]),
    nodes: bohaiNodes
  }),
  corridor({
    id: "china-western-land-sea-corridor",
    name: "Western Land-Sea Corridor",
    description: "Reviewed western corridor linking inland manufacturing hubs, Xinjiang land crossings, and Guangxi gateways to regional and maritime routes.",
    boundary: Object.freeze([
      { lat: 20.4, lon: 106.2 },
      { lat: 20.4, lon: 110.4 },
      { lat: 32.5, lon: 110.4 },
      { lat: 47, lon: 91 },
      { lat: 47, lon: 78.5 },
      { lat: 41, lon: 78.5 },
      { lat: 27, lon: 99.7 },
      { lat: 22, lon: 105.8 },
      { lat: 20.4, lon: 106.2 }
    ]),
    nodes: westernNodes
  })
]);
var NATIONAL_SOURCE_SELECTORS = Object.freeze([
  { family: "power_energy", id: "energy:spine:v1:CN" },
  { family: "strategic_industry", id: "comtrade:reporter:156:strategic-products" },
  { family: "trade", id: "comtrade:reporter:156" },
  { family: "trade", id: "supply_chain:shipping:v2:CCFI" }
]);
function findCorridorsForSourceSelector(family2, selectorId) {
  if (NATIONAL_SOURCE_SELECTORS.some((selector) => selector.family === family2 && selector.id === selectorId)) {
    return [...CHINA_LOGISTICS_CORRIDOR_IDS];
  }
  return CHINA_LOGISTICS_CORRIDORS.filter((item) => item.sourceSelectors.some((selector) => selector.family === family2 && selector.id === selectorId)).map((item) => item.id);
}
function pointOnSegment(point, a, b) {
  if (a.lat === b.lat && a.lon === b.lon) {
    return point.lat === a.lat && point.lon === a.lon;
  }
  const cross = (point.lon - a.lon) * (b.lat - a.lat) - (point.lat - a.lat) * (b.lon - a.lon);
  if (Math.abs(cross) > 1e-9) return false;
  const dot = (point.lon - a.lon) * (b.lon - a.lon) + (point.lat - a.lat) * (b.lat - a.lat);
  if (dot < 0) return false;
  const squaredLength = (b.lon - a.lon) ** 2 + (b.lat - a.lat) ** 2;
  return dot <= squaredLength;
}
function pointInPolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    if (!a || !b) continue;
    if (pointOnSegment(point, a, b)) return true;
    const intersects = a.lat > point.lat !== b.lat > point.lat && point.lon < (b.lon - a.lon) * (point.lat - a.lat) / (b.lat - a.lat) + a.lon;
    if (intersects) inside = !inside;
  }
  return inside;
}
function resolveCorridorForPoint(point) {
  if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return null;
  const matches = CHINA_LOGISTICS_CORRIDORS.filter((item) => pointInPolygon(point, item.boundary));
  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

// shared/china-corridor-control-towers.ts
var CHINA_CORRIDOR_AVAILABILITIES = [
  "available",
  "partial",
  "stale",
  "unavailable"
];
var CHINA_CORRIDOR_SIGNAL_AVAILABILITIES = [
  "available",
  "stale",
  "unavailable"
];
var CHINA_CORRIDOR_TIME_PRECISIONS = [
  "instant",
  "day",
  "month",
  "year",
  "unknown"
];
var CHINA_CORRIDOR_PUBLISHER_TYPES = [
  "official",
  "market",
  "independent",
  "derived",
  "unknown"
];
var CHINA_CORRIDOR_SOURCE_SCOPES = [
  "node",
  "regional",
  "national"
];
var CHINA_CORRIDOR_REVISION_STATES = [
  "original",
  "revised",
  "corrected"
];
var CHINA_ENERGY_DEMAND_METRIC_KEYS = Object.freeze({
  /** Period end of the demand series, published whether or not a change exists. */
  periodEnd: "demandPeriodEnd",
  percent: "demandChangePercent",
  basis: "demandChangeBasis",
  unit: "demandChangeUnit",
  currentMonth: "demandChangeCurrentMonth",
  priorMonth: "demandChangePriorMonth",
  changePeriodEnd: "demandChangePeriodEnd",
  changePriorPeriodEnd: "demandChangePriorPeriodEnd",
  productCount: "demandChangeProductCount",
  products: "demandChangeProducts",
  currentDemandKbd: "demandChangeCurrentDemandKbd",
  priorDemandKbd: "demandChangePriorDemandKbd"
});
function deriveChinaCorridorAvailability(conditions) {
  if (conditions.every((condition) => condition.availability === "unavailable")) {
    return "unavailable";
  }
  if (conditions.every((condition) => condition.availability === "available")) {
    return "available";
  }
  if (conditions.every((condition) => condition.availability === "available" || condition.availability === "stale") && conditions.some((condition) => condition.availability === "stale")) {
    return "stale";
  }
  return "partial";
}
function deriveChinaCorridorConditionAvailability(signals) {
  const available = signals.filter((signal) => signal.availability !== "unavailable");
  if (available.length === 0) return "unavailable";
  if (available.length !== signals.length) return "partial";
  if (signals.some((signal) => signal.transportFreshness === "missing" || signal.transportFreshness === "error" || signal.contentFreshness === "partial" || signal.contentFreshness === "unavailable" || signal.contentFreshness === "timestamp_unknown")) {
    return "partial";
  }
  if (signals.some((signal) => signal.availability === "stale" || signal.transportFreshness === "stale" || signal.contentFreshness === "stale")) {
    return "stale";
  }
  return "available";
}
var PROVENANCE_VALIDATION_FAILURE_REASON = "Condition provenance failed validation; this condition is partial until a valid envelope is published.";
function validateChinaCorridorProvenanceForSurface(response, surface) {
  const adapter = DECISION_SIGNAL_PROVENANCE_SURFACE_ADAPTERS[surface];
  return {
    ...response,
    corridors: response.corridors.map((corridor2) => {
      const conditions = corridor2.conditions.map((condition) => {
        if (condition.provenance === null) return condition;
        try {
          return {
            ...condition,
            provenance: adapter.deserialize(adapter.serialize(condition.provenance))
          };
        } catch {
          return {
            ...condition,
            availability: condition.availability === "unavailable" ? "unavailable" : "partial",
            reason: PROVENANCE_VALIDATION_FAILURE_REASON,
            provenance: null
          };
        }
      });
      return {
        ...corridor2,
        availability: deriveChinaCorridorAvailability(conditions),
        conditions
      };
    })
  };
}
var CORRIDOR_AVAILABILITIES = /* @__PURE__ */ new Set([
  ...CHINA_CORRIDOR_AVAILABILITIES
]);
var SIGNAL_AVAILABILITIES = /* @__PURE__ */ new Set([
  ...CHINA_CORRIDOR_SIGNAL_AVAILABILITIES
]);
var TIME_PRECISIONS = /* @__PURE__ */ new Set([
  ...CHINA_CORRIDOR_TIME_PRECISIONS
]);
var TRANSPORT_FRESHNESS = /* @__PURE__ */ new Set([
  ...DECISION_SIGNAL_TRANSPORT_FRESHNESS_STATES
]);
var CONTENT_FRESHNESS = /* @__PURE__ */ new Set([
  ...DECISION_SIGNAL_CONTENT_FRESHNESS_STATES
]);
var CORRIDOR_IDS = new Set(CHINA_LOGISTICS_CORRIDOR_IDS);
var SIGNAL_FAMILIES = new Set(CHINA_CORRIDOR_SIGNAL_FAMILIES);
var NODE_TYPES = /* @__PURE__ */ new Set([
  ...CHINA_CORRIDOR_NODE_TYPES
]);
var REVISION_STATES = /* @__PURE__ */ new Set([
  ...CHINA_CORRIDOR_REVISION_STATES
]);
var PUBLISHER_TYPES = /* @__PURE__ */ new Set([
  ...CHINA_CORRIDOR_PUBLISHER_TYPES
]);
var SOURCE_SCOPES = /* @__PURE__ */ new Set([
  ...CHINA_CORRIDOR_SOURCE_SCOPES
]);

// server/worldmonitor/economic/v1/get-china-activity-nowcast.ts
init_redis();

// server/worldmonitor/supply-chain/v1/get-china-corridor-control-towers.ts
init_redis();

// server/worldmonitor/supply-chain/v1/china-corridor-control-towers.ts
var transportRank = {
  fresh: 0,
  stale: 1,
  missing: 2,
  error: 3
};
var contentRank = {
  current: 0,
  timestamp_unknown: 1,
  stale: 2,
  partial: 3,
  unavailable: 4
};
function worstState(values, rank) {
  return values.reduce((worst, item) => rank[item] > rank[worst] ? item : worst);
}
function latestTimedSignal(signals, field) {
  const present = signals.filter((signal) => {
    const timestamp2 = signal[field];
    return timestamp2 !== null && Number.isFinite(Date.parse(timestamp2));
  });
  if (present.length === 0) return null;
  return present.reduce((latest, signal) => Date.parse(signal[field] ?? "") > Date.parse(latest[field] ?? "") ? signal : latest);
}
function timestampAtPrecision(timestamp2, precision) {
  if (precision === "year") return timestamp2.slice(0, 4);
  if (precision === "month") return timestamp2.slice(0, 7);
  if (precision === "day") return timestamp2.slice(0, 10);
  return timestamp2;
}
function buildProvenance(corridorId, family2, signals, assessedAt) {
  const usable = signals.filter((signal) => signal.availability !== "unavailable");
  const observationSignal = latestTimedSignal(usable, "observationTime");
  if (usable.length === 0 || observationSignal === null || observationSignal.observationTime === null) return null;
  const observationTime = observationSignal.observationTime;
  const observationPrecision = observationSignal.observationTimePrecision;
  if (observationPrecision === "unknown") return null;
  const observationValue = timestampAtPrecision(observationTime, observationPrecision);
  const retrievalSignal = latestTimedSignal(usable, "retrievalTime");
  const retrievalTime = retrievalSignal?.retrievalTime ?? assessedAt;
  const retrievalPrecision = retrievalSignal?.retrievalTimePrecision ?? "instant";
  if (retrievalPrecision === "unknown") return null;
  const retrievalValue = timestampAtPrecision(retrievalTime, retrievalPrecision);
  const inputSignalIds = usable.map((signal) => signal.id);
  const publisherIds = new Set(usable.map((signal) => signal.publisher.id));
  const transportState = worstState(
    usable.map((signal) => signal.transportFreshness),
    transportRank
  );
  const contentState = worstState(
    usable.map((signal) => signal.contentFreshness),
    contentRank
  );
  const signalId = `signal:corridor-condition:${corridorId}:${family2}:${observationTime}`;
  const provenance = {
    contractVersion: DECISION_SIGNAL_PROVENANCE_CONTRACT_VERSION,
    signalId,
    familyId: "composed_corridor_condition",
    claims: {
      publisher: {
        status: "known",
        value: {
          id: "publisher:worldmonitor-derived",
          name: "WorldMonitor derived output",
          type: "derived_output",
          registryReference: null
        }
      },
      source_url: {
        status: "not_applicable",
        reason: "The corridor condition links source URLs through its input signals."
      },
      original_reference: {
        status: "not_applicable",
        reason: "The corridor condition is composed from multiple source records."
      },
      original_language: {
        status: "not_applicable",
        reason: "The deterministic composition has no original-language text."
      },
      translation: {
        status: "not_applicable",
        reason: "The deterministic composition has no translated source text."
      },
      observation_time: {
        status: "known",
        value: { role: "observation", value: observationValue, precision: observationPrecision }
      },
      effective_time: {
        status: "known",
        value: { role: "effective", value: observationValue, precision: observationPrecision }
      },
      publication_time: {
        status: "not_applicable",
        reason: "The computed condition is not a publisher release."
      },
      retrieval_time: {
        status: "known",
        value: { role: "retrieval", value: retrievalValue, precision: retrievalPrecision }
      },
      revision: {
        status: "known",
        value: {
          vintageId: `${corridorId}:${family2}:${observationTime}`,
          sequence: 1,
          state: "original"
        }
      },
      supersession: { status: "known", value: { state: "current" } },
      extraction_confidence: {
        status: "not_applicable",
        reason: "Each input signal owns its extraction confidence."
      },
      classification_confidence: {
        status: "known",
        value: {
          score: 1,
          method: "exact-reviewed-selector/v1"
        }
      },
      corroboration: {
        status: "known",
        value: {
          state: publisherIds.size > 1 ? "multi_source" : "single_source",
          sourceSignalIds: publisherIds.size > 1 ? inputSignalIds : inputSignalIds.slice(0, 1)
        }
      },
      transport_freshness: {
        status: "known",
        value: {
          state: transportState,
          assessedAt,
          ...transportState === "fresh" || transportState === "stale" ? { lastSuccessAt: retrievalTime } : {}
        }
      },
      content_freshness: {
        status: "known",
        value: {
          state: contentState,
          assessedAt,
          ...contentState === "timestamp_unknown" ? {} : { contentAsOf: observationValue }
        }
      },
      derivation: {
        status: "known",
        value: {
          methodId: "worldmonitor:china-corridor-condition",
          methodVersion: "1",
          computedAt: assessedAt,
          inputSignalIds
        }
      }
    }
  };
  return DECISION_SIGNAL_PROVENANCE_SURFACE_ADAPTERS.api.deserialize(
    DECISION_SIGNAL_PROVENANCE_SURFACE_ADAPTERS.api.serialize(provenance)
  );
}
function composeCondition(corridorId, family2, source, assessedAt) {
  const sourceSignals = source.signals.filter((signal) => signal.family === family2 && (signal.corridorIds?.includes(corridorId) || findCorridorsForSourceSelector(family2, signal.selectorId).includes(corridorId)));
  if (sourceSignals.length === 0) {
    return {
      family: family2,
      providerId: source.providerId,
      availability: "unavailable",
      reason: source.reason ?? "No reviewed source signal is available for this corridor.",
      sourceSignals: [],
      provenance: null
    };
  }
  if (sourceSignals.every((signal) => signal.availability === "unavailable")) {
    return {
      family: family2,
      providerId: source.providerId,
      availability: "unavailable",
      reason: source.reason ?? "Provider unavailable",
      sourceSignals,
      provenance: null
    };
  }
  const availability = deriveChinaCorridorConditionAvailability(sourceSignals);
  let provenance = null;
  let provenanceFailed = false;
  try {
    provenance = buildProvenance(corridorId, family2, sourceSignals, assessedAt);
  } catch {
    provenanceFailed = true;
  }
  return {
    family: family2,
    providerId: source.providerId,
    availability: provenance === null && availability !== "unavailable" ? "partial" : availability,
    reason: provenanceFailed ? "Source provenance failed validation for this corridor condition." : provenance === null ? "Source observations lack the timestamps required for a composed provenance envelope." : availability === "available" ? null : source.reason ?? null,
    sourceSignals,
    provenance
  };
}
function composeChinaCorridorControlTowers(bundle) {
  const corridors = CHINA_LOGISTICS_CORRIDORS.map((definition) => {
    const conditions = CHINA_CORRIDOR_SIGNAL_FAMILIES.map((family2) => composeCondition(definition.id, family2, bundle.families[family2], bundle.assessedAt));
    return {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      boundary: definition.boundary,
      nodes: definition.nodes,
      availability: deriveChinaCorridorAvailability(conditions),
      conditions
    };
  });
  return {
    generatedAt: bundle.assessedAt,
    corridors
  };
}

// server/worldmonitor/supply-chain/v1/china-corridor-source-adapters.ts
function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}
function records(value) {
  return Array.isArray(value) ? value.map(record).filter((item) => item !== null) : [];
}
function stringValue(value) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function booleanValue(value) {
  return typeof value === "boolean" ? value : null;
}
function isoTimestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const epochMs = value < 1e10 ? value * 1e3 : value;
    const date = new Date(epochMs);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
function dateOnlyTimestamp(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year2 = Number(match[1]);
  const month = Number(match[2]);
  const day2 = Number(match[3]);
  const date = new Date(Date.UTC(year2, month - 1, day2));
  return date.getUTCFullYear() === year2 && date.getUTCMonth() === month - 1 && date.getUTCDate() === day2 ? date.toISOString() : null;
}
function yearTimestamp(value) {
  const year2 = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(year2) || year2 < 1900 || year2 > 2200) return null;
  return `${year2}-12-31T23:59:59Z`;
}
function timestampPrecision(value) {
  if (typeof value === "number") return "instant";
  if (typeof value !== "string") return "unknown";
  if (/^\d{4}$/.test(value)) return "year";
  if (/^\d{4}-\d{2}$/.test(value)) return "month";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "day";
  return Number.isFinite(Date.parse(value)) ? "instant" : "unknown";
}
function ageMinutes(timestamp2, assessedAt) {
  return Math.max(0, Date.parse(assessedAt) - Date.parse(timestamp2)) / 6e4;
}
function metaTimestamp(meta) {
  const metadata = record(meta);
  if (metadata?.status !== void 0 && metadata.status !== "ok") return null;
  return isoTimestamp(metadata?.fetchedAt);
}
function transportFreshness(meta, maxAgeMinutes, assessedAt) {
  const status = record(meta)?.status;
  if (status !== void 0 && status !== "ok") return "stale";
  const fetchedAt = metaTimestamp(meta);
  if (fetchedAt === null) return "missing";
  return ageMinutes(fetchedAt, assessedAt) > maxAgeMinutes ? "stale" : "fresh";
}
function contentFreshness(observedAt, maxAgeMinutes, assessedAt) {
  if (observedAt === null) return "timestamp_unknown";
  return ageMinutes(observedAt, assessedAt) > maxAgeMinutes ? "stale" : "current";
}
function periodicContentFreshness(observedAt, precision, assessedAt) {
  if (precision === "unknown") return "timestamp_unknown";
  const maxAgeDays = precision === "year" ? 550 : precision === "month" ? 210 : 90;
  return contentFreshness(observedAt, maxAgeDays * 1440, assessedAt);
}
function metrics(entries) {
  return Object.fromEntries(entries.filter(([, value]) => value !== null));
}
function sourceSignal(input) {
  return {
    releaseTime: null,
    releaseTimePrecision: "unknown",
    revision: null,
    ...input
  };
}
function unavailableSignal(input) {
  return sourceSignal({
    ...input,
    availability: "unavailable",
    observationTime: null,
    observationTimePrecision: "unknown",
    retrievalTimePrecision: input.retrievalTime ? "instant" : "unknown",
    transportFreshness: input.transportFreshness,
    contentFreshness: "unavailable",
    metrics: {}
  });
}
function reviewedNodeSelectors(family2) {
  const seen = /* @__PURE__ */ new Set();
  return CHINA_LOGISTICS_CORRIDORS.flatMap((corridor2) => corridor2.nodes.flatMap((node2) => {
    if (node2.sourceSelector?.family !== family2 || seen.has(node2.sourceSelector.id)) return [];
    seen.add(node2.sourceSelector.id);
    return [{ selectorId: node2.sourceSelector.id, nodeName: node2.name }];
  }));
}
function family(providerId, signals, reason) {
  return {
    providerId,
    reason,
    signals
  };
}
function adaptPortwatch(snapshots, assessedAt) {
  const transport = transportFreshness(snapshots.portwatchMeta, 36 * 60, assessedAt);
  const retrievalTime = metaTimestamp(snapshots.portwatchMeta);
  const signals = [];
  for (const payloadValue of [snapshots.portwatchChina, snapshots.portwatchHongKong]) {
    const payload = record(payloadValue);
    if (!payload) continue;
    const observedAt = isoTimestamp(payload.contentAsOfChangedAt) ?? isoTimestamp(payload.fetchedAt);
    for (const port of records(payload.ports)) {
      const selectorId = stringValue(port.portId);
      if (!selectorId) continue;
      const portName = stringValue(port.portName) ?? selectorId;
      signals.push(sourceSignal({
        id: `signal:portwatch:${selectorId}:${observedAt ?? "timestamp-unknown"}`,
        family: "port",
        selectorId,
        availability: observedAt === null ? "stale" : "available",
        publisher: {
          id: "publisher:imf-portwatch",
          name: "IMF PortWatch",
          type: "official"
        },
        sourceUrl: "https://portwatch.imf.org/",
        sourceScope: "node",
        observationTime: observedAt,
        observationTimePrecision: observedAt ? "instant" : "unknown",
        retrievalTime,
        retrievalTimePrecision: retrievalTime ? "instant" : "unknown",
        transportFreshness: transport,
        contentFreshness: contentFreshness(observedAt, 2 * 72 * 60, assessedAt),
        summary: `PortWatch activity observation available for ${portName}.`,
        metrics: metrics([
          ["tankerCalls30d", numberValue(port.tankerCalls30d)],
          ["trendDelta", numberValue(port.trendDelta)],
          ["importTankerDwt30d", numberValue(port.importTankerDwt30d)],
          ["exportTankerDwt30d", numberValue(port.exportTankerDwt30d)],
          ["anomalySignal", booleanValue(port.anomalySignal)]
        ])
      }));
    }
  }
  const present = new Set(signals.map((signal) => signal.selectorId));
  for (const expected of reviewedNodeSelectors("port")) {
    if (present.has(expected.selectorId)) continue;
    signals.push(unavailableSignal({
      id: `signal:portwatch:${expected.selectorId}:unavailable`,
      family: "port",
      selectorId: expected.selectorId,
      publisher: {
        id: "publisher:imf-portwatch",
        name: "IMF PortWatch",
        type: "official"
      },
      sourceUrl: "https://portwatch.imf.org/",
      sourceScope: "node",
      retrievalTime,
      transportFreshness: transport,
      summary: `PortWatch observation unavailable for configured node ${expected.nodeName}.`
    }));
  }
  return family("portwatch", signals, "PortWatch corridor coverage is missing or stale.");
}
function adaptAviation(snapshots, assessedAt) {
  const payload = record(snapshots.aviation);
  const transport = transportFreshness(snapshots.aviationMeta, 90, assessedAt);
  const retrievalTime = metaTimestamp(snapshots.aviationMeta);
  const signals = records(payload?.coverage).flatMap((coverage) => {
    const selectorId = stringValue(coverage.iata);
    const status = stringValue(coverage.status);
    if (!selectorId || !status) return [];
    const observedAt = isoTimestamp(coverage.updatedAt);
    const covered = status === "normal" || status === "disruption";
    const flightCount = covered ? numberValue(coverage.flightCount) : null;
    return [sourceSignal({
      id: `signal:aviationstack:${selectorId}:${observedAt ?? "timestamp-unknown"}`,
      family: "aviation",
      selectorId,
      availability: covered ? "available" : "unavailable",
      publisher: {
        id: "publisher:aviationstack",
        name: "AviationStack",
        type: "market"
      },
      sourceUrl: "https://aviationstack.com/",
      sourceScope: "node",
      observationTime: observedAt,
      observationTimePrecision: observedAt ? "instant" : "unknown",
      retrievalTime,
      retrievalTimePrecision: retrievalTime ? "instant" : "unknown",
      transportFreshness: transport,
      contentFreshness: covered ? contentFreshness(observedAt, 180, assessedAt) : "unavailable",
      summary: covered ? `${selectorId} provider status: ${status}.` : `${selectorId} provider coverage unavailable (${status}).`,
      metrics: metrics([
        ["providerStatus", status],
        ["flightCount", flightCount]
      ])
    })];
  });
  const present = new Set(signals.map((signal) => signal.selectorId));
  for (const expected of reviewedNodeSelectors("aviation")) {
    if (present.has(expected.selectorId)) continue;
    signals.push(unavailableSignal({
      id: `signal:aviationstack:${expected.selectorId}:unavailable`,
      family: "aviation",
      selectorId: expected.selectorId,
      publisher: {
        id: "publisher:aviationstack",
        name: "AviationStack",
        type: "market"
      },
      sourceUrl: "https://aviationstack.com/",
      sourceScope: "node",
      retrievalTime,
      transportFreshness: transport,
      summary: `Aviation provider coverage unavailable for configured hub ${expected.nodeName}.`
    }));
  }
  return family("aviationstack", signals, "Aviation provider coverage is missing, omitted, or stale.");
}
function adaptHazards(snapshots, assessedAt) {
  const cycloneSnapshot = record(snapshots.westernPacificCyclones);
  const cycloneTransport = transportFreshness(
    snapshots.westernPacificCyclonesMeta,
    540,
    assessedAt
  );
  const cycloneRetrieval = metaTimestamp(snapshots.westernPacificCyclonesMeta);
  const eventSignals = records(cycloneSnapshot?.events).flatMap((event) => {
    const lat = numberValue(event.lat);
    const lon = numberValue(event.lon);
    if (lat === null || lon === null) return [];
    const corridorId = resolveCorridorForPoint({ lat, lon });
    if (corridorId === null) return [];
    const eventId = stringValue(event.id);
    if (!eventId) return [];
    const observedAt = isoTimestamp(event.date);
    return [sourceSignal({
      id: `signal:western-pacific-hazard:${eventId}`,
      family: "hazard",
      selectorId: `hazard:event:${eventId}`,
      corridorIds: [corridorId],
      availability: observedAt ? "available" : "stale",
      publisher: {
        id: `publisher:${String(event.sourceName ?? "hazard-source").toLowerCase()}`,
        name: stringValue(event.sourceName) ?? "Western Pacific hazard source",
        type: "official"
      },
      sourceUrl: stringValue(event.sourceUrl),
      sourceScope: "regional",
      observationTime: observedAt,
      observationTimePrecision: observedAt ? timestampPrecision(event.date) : "unknown",
      retrievalTime: cycloneRetrieval,
      retrievalTimePrecision: cycloneRetrieval ? "instant" : "unknown",
      transportFreshness: cycloneTransport,
      contentFreshness: contentFreshness(observedAt, 540, assessedAt),
      summary: stringValue(event.title) ?? "Western Pacific hazard event.",
      metrics: metrics([
        ["category", stringValue(event.category)],
        ["closed", booleanValue(event.closed)],
        ["windKt", numberValue(event.windKt)],
        ["lat", lat],
        ["lon", lon]
      ])
    })];
  });
  const signals = [...eventSignals];
  const cycloneAvailable = cycloneSnapshot?.dataAvailable === true;
  const cycloneObservedAt = isoTimestamp(
    cycloneSnapshot?.latestObservationAt ?? cycloneSnapshot?.evaluatedAt
  );
  for (const corridorId of CHINA_LOGISTICS_CORRIDOR_IDS) {
    const reviewedEventCount = eventSignals.filter((signal) => signal.corridorIds?.includes(corridorId)).length;
    signals.push(cycloneAvailable ? sourceSignal({
      id: `signal:western-pacific-hazard-coverage:${corridorId}:${cycloneObservedAt ?? "timestamp-unknown"}`,
      family: "hazard",
      selectorId: `hazard:western-pacific-coverage:${corridorId}`,
      corridorIds: [corridorId],
      availability: cycloneObservedAt ? "available" : "stale",
      publisher: {
        id: "publisher:worldmonitor-western-pacific-coverage",
        name: "WorldMonitor Western Pacific hazard coverage",
        type: "derived"
      },
      sourceUrl: null,
      sourceScope: "regional",
      observationTime: cycloneObservedAt,
      observationTimePrecision: cycloneObservedAt ? "instant" : "unknown",
      retrievalTime: cycloneRetrieval,
      retrievalTimePrecision: cycloneRetrieval ? "instant" : "unknown",
      transportFreshness: cycloneTransport,
      contentFreshness: contentFreshness(cycloneObservedAt, 540, assessedAt),
      summary: `Western Pacific hazard feed available with ${reviewedEventCount} event${reviewedEventCount === 1 ? "" : "s"} inside this reviewed corridor boundary.`,
      metrics: { reviewedEventCount }
    }) : unavailableSignal({
      id: `signal:western-pacific-hazard-coverage:${corridorId}:unavailable`,
      family: "hazard",
      selectorId: `hazard:western-pacific-coverage:${corridorId}`,
      corridorIds: [corridorId],
      publisher: {
        id: "publisher:worldmonitor-western-pacific-coverage",
        name: "WorldMonitor Western Pacific hazard coverage",
        type: "derived"
      },
      sourceUrl: null,
      sourceScope: "regional",
      retrievalTime: cycloneRetrieval,
      transportFreshness: cycloneTransport,
      summary: "Western Pacific hazard feed coverage is unavailable for this reviewed corridor."
    }));
  }
  const hkoSnapshot = record(snapshots.hkoWarnings);
  const hkoTransport = transportFreshness(snapshots.hkoWarningsMeta, 540, assessedAt);
  const hkoRetrieval = metaTimestamp(snapshots.hkoWarningsMeta);
  const hkoAvailable = hkoSnapshot?.dataAvailable === true;
  const hkoItems = records(hkoSnapshot?.warnings ?? hkoSnapshot?.events);
  const hkoObservedAt = isoTimestamp(hkoSnapshot?.latestObservationAt ?? hkoSnapshot?.evaluatedAt);
  if (hkoAvailable) {
    const item = hkoItems[0];
    signals.push(sourceSignal({
      id: `signal:hko-warnings:${hkoObservedAt ?? "timestamp-unknown"}`,
      family: "hazard",
      selectorId: "hazard:hko-warnings",
      availability: hkoObservedAt ? "available" : "stale",
      publisher: {
        id: "publisher:hong-kong-observatory",
        name: "Hong Kong Observatory",
        type: "official"
      },
      sourceUrl: stringValue(item?.sourceUrl) ?? "https://www.hko.gov.hk/en/wxinfo/dailywx/warnsummary.htm",
      sourceScope: "regional",
      observationTime: hkoObservedAt,
      observationTimePrecision: hkoObservedAt ? "instant" : "unknown",
      retrievalTime: hkoRetrieval,
      retrievalTimePrecision: hkoRetrieval ? "instant" : "unknown",
      transportFreshness: hkoTransport,
      contentFreshness: contentFreshness(hkoObservedAt, 540, assessedAt),
      summary: hkoItems.length > 0 ? `${hkoItems.length} HKO warning record${hkoItems.length === 1 ? "" : "s"} in the current snapshot.` : "HKO warning feed available; no warning record is present in the snapshot.",
      metrics: { warningRecordCount: hkoItems.length }
    }));
  } else {
    signals.push(unavailableSignal({
      id: "signal:hko-warnings:unavailable",
      family: "hazard",
      selectorId: "hazard:hko-warnings",
      publisher: {
        id: "publisher:hong-kong-observatory",
        name: "Hong Kong Observatory",
        type: "official"
      },
      sourceUrl: "https://www.hko.gov.hk/en/wxinfo/dailywx/warnsummary.htm",
      sourceScope: "regional",
      retrievalTime: hkoRetrieval,
      transportFreshness: hkoTransport,
      summary: "Hong Kong Observatory warning coverage is unavailable."
    }));
  }
  return family("western-pacific-hazards", signals, "Hazard feeds are missing or stale.");
}
function latestEnergySourceObservation(value) {
  const sources = record(value);
  if (!sources) return null;
  const observations = Object.values(sources).flatMap((sourceValue) => {
    const numericYear = typeof sourceValue === "number" && Number.isInteger(sourceValue) && sourceValue >= 1900 && sourceValue <= 2200;
    const precision = numericYear ? "year" : timestampPrecision(sourceValue);
    if (precision === "unknown") return [];
    const timestamp2 = precision === "year" ? yearTimestamp(sourceValue) : isoTimestamp(sourceValue);
    return timestamp2 ? [{ timestamp: timestamp2, precision }] : [];
  });
  return observations.reduce((latest, observation) => latest === null || Date.parse(observation.timestamp) > Date.parse(latest.timestamp) ? observation : latest, null);
}
var ENERGY_DEMAND_CHANGE_BASIS = "year_over_year";
var ENERGY_DEMAND_CHANGE_UNIT = "% change";
var ENERGY_DEMAND_CHANGE_LOOKBACK_MONTHS = 12;
var MIN_DEMAND_CHANGE_PRODUCTS = 3;
var MAX_DEMAND_CHANGE_PRODUCTS = 5;
var MAX_DEMAND_CHANGE_PERCENT = 50;
function observationMonthIndex(value) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(stringValue(value) ?? "");
  return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : null;
}
function monthPeriodEnd(value) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(stringValue(value) ?? "");
  if (!match) return null;
  const year2 = Number(match[1]);
  const month = Number(match[2]);
  return new Date(Date.UTC(year2, month, 1) - 1).toISOString();
}
function jsonStringArray(value) {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(parsed)) return null;
  try {
    const values = [...new Set(parsed.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))].sort();
    return values.length === parsed.length ? values : null;
  } catch {
    return null;
  }
}
function energyDemandChangeMetrics(value, sourceDataMonth) {
  const change = record(value);
  const percentChange = numberValue(change?.percentChange);
  const observationPeriod = observationMonthIndex(change?.observationPeriod);
  const priorObservationPeriod = observationMonthIndex(change?.priorObservationPeriod);
  const observationPeriodLabel = stringValue(change?.observationPeriod);
  const priorObservationPeriodLabel = stringValue(change?.priorObservationPeriod);
  const periodEnd = isoTimestamp(stringValue(change?.periodEnd));
  const priorPeriodEnd = isoTimestamp(stringValue(change?.priorPeriodEnd));
  const expectedPeriodEnd = monthPeriodEnd(observationPeriodLabel);
  const expectedPriorPeriodEnd = monthPeriodEnd(priorObservationPeriodLabel);
  const sourceDataMonthLabel = stringValue(sourceDataMonth);
  const sourceDataMonthIndex = observationMonthIndex(sourceDataMonthLabel);
  const products = jsonStringArray(change?.products);
  const productCount = numberValue(change?.productCount);
  const currentDemandKbd = numberValue(change?.currentDemandKbd);
  const priorDemandKbd = numberValue(change?.priorDemandKbd);
  const expectedPercentChange = currentDemandKbd !== null && priorDemandKbd !== null && priorDemandKbd > 0 ? (currentDemandKbd - priorDemandKbd) / priorDemandKbd * 100 : null;
  const percentTolerance = expectedPercentChange === null ? null : 1e-9 * Math.max(1, Math.abs(expectedPercentChange), Math.abs(percentChange ?? 0));
  const arithmeticMatches = percentChange !== null && expectedPercentChange !== null && percentTolerance !== null && Math.abs(expectedPercentChange - percentChange) <= percentTolerance;
  if (percentChange === null || change?.basis !== ENERGY_DEMAND_CHANGE_BASIS || change?.unit !== ENERGY_DEMAND_CHANGE_UNIT || observationPeriod === null || priorObservationPeriod === null || observationPeriod - priorObservationPeriod !== ENERGY_DEMAND_CHANGE_LOOKBACK_MONTHS || sourceDataMonthIndex === null || observationPeriod !== sourceDataMonthIndex || periodEnd === null || priorPeriodEnd === null || expectedPeriodEnd === null || expectedPriorPeriodEnd === null || Date.parse(periodEnd) !== Date.parse(expectedPeriodEnd) || Date.parse(priorPeriodEnd) !== Date.parse(expectedPriorPeriodEnd) || products === null || productCount === null || !Number.isInteger(productCount) || productCount < MIN_DEMAND_CHANGE_PRODUCTS || productCount > MAX_DEMAND_CHANGE_PRODUCTS || products.length !== productCount || currentDemandKbd === null || currentDemandKbd < 0 || priorDemandKbd === null || priorDemandKbd <= 0 || !arithmeticMatches || Math.abs(percentChange) > MAX_DEMAND_CHANGE_PERCENT || Date.parse(priorPeriodEnd) >= Date.parse(periodEnd)) return [];
  return [
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.percent, percentChange],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.basis, ENERGY_DEMAND_CHANGE_BASIS],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.unit, ENERGY_DEMAND_CHANGE_UNIT],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.currentMonth, observationPeriodLabel],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.priorMonth, priorObservationPeriodLabel],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.changePeriodEnd, periodEnd],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.changePriorPeriodEnd, priorPeriodEnd],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.productCount, productCount],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.products, JSON.stringify(products)],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.currentDemandKbd, currentDemandKbd],
    [CHINA_ENERGY_DEMAND_METRIC_KEYS.priorDemandKbd, priorDemandKbd]
  ];
}
function adaptEnergy(snapshots, assessedAt) {
  const payload = record(snapshots.energySpine);
  const transport = transportFreshness(snapshots.energySpineMeta, 2880, assessedAt);
  const retrievalTime = metaTimestamp(snapshots.energySpineMeta);
  if (!payload) {
    return family("china-energy-spine", [unavailableSignal({
      id: "signal:energy-spine:CN:unavailable",
      family: "power_energy",
      selectorId: "energy:spine:v1:CN",
      publisher: {
        id: "publisher:worldmonitor-energy-spine",
        name: "WorldMonitor energy spine",
        type: "derived"
      },
      sourceUrl: null,
      sourceScope: "national",
      retrievalTime,
      transportFreshness: transport,
      summary: "National China energy-spine observation is unavailable."
    })], "China energy spine cache is unavailable.");
  }
  const sourceObservation = latestEnergySourceObservation(payload.sources);
  const observedAt = sourceObservation?.timestamp ?? isoTimestamp(payload.updatedAt);
  const observationPrecision = sourceObservation?.precision ?? (observedAt ? "instant" : "unknown");
  const coverage = record(payload.coverage);
  const demandChangeMetrics = energyDemandChangeMetrics(
    payload.demandChange,
    record(payload.sources)?.jodiOilMonth
  );
  return family("china-energy-spine", [sourceSignal({
    id: `signal:energy-spine:CN:${observedAt ?? "timestamp-unknown"}`,
    family: "power_energy",
    selectorId: "energy:spine:v1:CN",
    availability: observedAt ? "available" : "stale",
    publisher: {
      id: "publisher:worldmonitor-energy-spine",
      name: "WorldMonitor energy spine",
      type: "derived"
    },
    sourceUrl: null,
    sourceScope: "national",
    observationTime: observedAt,
    observationTimePrecision: observationPrecision,
    retrievalTime,
    retrievalTimePrecision: retrievalTime ? "instant" : "unknown",
    transportFreshness: transport,
    contentFreshness: periodicContentFreshness(observedAt, observationPrecision, assessedAt),
    summary: "National China energy-spine dependencies available for corridor context.",
    metrics: metrics([
      ["hasMix", booleanValue(coverage?.hasMix)],
      ["hasJodiOil", booleanValue(coverage?.hasJodiOil)],
      ["hasJodiGas", booleanValue(coverage?.hasJodiGas)],
      ["hasIeaStocks", booleanValue(coverage?.hasIeaStocks)],
      ["hasEmber", booleanValue(coverage?.hasEmber)],
      // Published whether or not a change exists, so a consumer can tell a
      // not-yet-due period from a due-but-unpublished one.
      [
        CHINA_ENERGY_DEMAND_METRIC_KEYS.periodEnd,
        isoTimestamp(stringValue(payload.demandPeriodEnd))
      ],
      ...demandChangeMetrics
    ])
  })], "China energy spine is missing or stale.");
}
function chinaComtradeFlows(snapshot) {
  return records(record(snapshot)?.flows).filter((flow) => String(flow.reporterCode) === "156");
}
function adaptStrategicIndustry(snapshots, assessedAt) {
  const flows = chinaComtradeFlows(snapshots.comtrade);
  const latestYear = flows.reduce((latest, flow) => Math.max(latest, numberValue(flow.year) ?? 0), 0);
  const observedAt = latestYear > 0 ? yearTimestamp(latestYear) : null;
  const transport = transportFreshness(snapshots.comtradeMeta, 2880, assessedAt);
  const retrievalTime = metaTimestamp(snapshots.comtradeMeta);
  const productCodes = new Set(flows.map((flow) => stringValue(flow.cmdCode)).filter(Boolean));
  const signals = flows.length === 0 ? [unavailableSignal({
    id: "signal:comtrade:156:strategic-products:unavailable",
    family: "strategic_industry",
    selectorId: "comtrade:reporter:156:strategic-products",
    publisher: {
      id: "publisher:un-comtrade",
      name: "UN Comtrade",
      type: "official"
    },
    sourceUrl: "https://comtradeplus.un.org/",
    sourceScope: "national",
    retrievalTime,
    transportFreshness: transport,
    summary: "UN Comtrade strategic-product observations for China reporter 156 are unavailable."
  })] : [sourceSignal({
    id: `signal:comtrade:156:strategic-products:${latestYear || "timestamp-unknown"}`,
    family: "strategic_industry",
    selectorId: "comtrade:reporter:156:strategic-products",
    availability: observedAt ? "available" : "stale",
    publisher: {
      id: "publisher:un-comtrade",
      name: "UN Comtrade",
      type: "official"
    },
    sourceUrl: "https://comtradeplus.un.org/",
    sourceScope: "national",
    observationTime: observedAt,
    observationTimePrecision: observedAt ? "year" : "unknown",
    retrievalTime,
    retrievalTimePrecision: retrievalTime ? "instant" : "unknown",
    transportFreshness: transport,
    contentFreshness: periodicContentFreshness(
      observedAt,
      observedAt ? "year" : "unknown",
      assessedAt
    ),
    summary: "UN Comtrade strategic-product observations for China reporter 156.",
    metrics: {
      productCount: productCodes.size,
      observationYear: latestYear || null
    }
  })];
  return family("un-comtrade-strategic-products", signals, "China strategic-product trade observations are unavailable.");
}
function adaptTrade(snapshots, assessedAt) {
  const signals = [];
  const flows = chinaComtradeFlows(snapshots.comtrade);
  const latestYear = flows.reduce((latest, flow) => Math.max(latest, numberValue(flow.year) ?? 0), 0);
  const comtradeObservedAt = latestYear > 0 ? yearTimestamp(latestYear) : null;
  const comtradeRetrieval = metaTimestamp(snapshots.comtradeMeta);
  if (flows.length > 0) {
    signals.push(sourceSignal({
      id: `signal:comtrade:156:${latestYear || "timestamp-unknown"}`,
      family: "trade",
      selectorId: "comtrade:reporter:156",
      availability: comtradeObservedAt ? "available" : "stale",
      publisher: {
        id: "publisher:un-comtrade",
        name: "UN Comtrade",
        type: "official"
      },
      sourceUrl: "https://comtradeplus.un.org/",
      sourceScope: "national",
      observationTime: comtradeObservedAt,
      observationTimePrecision: comtradeObservedAt ? "year" : "unknown",
      retrievalTime: comtradeRetrieval,
      retrievalTimePrecision: comtradeRetrieval ? "instant" : "unknown",
      transportFreshness: transportFreshness(snapshots.comtradeMeta, 2880, assessedAt),
      contentFreshness: periodicContentFreshness(
        comtradeObservedAt,
        comtradeObservedAt ? "year" : "unknown",
        assessedAt
      ),
      summary: "UN Comtrade annual trade observations for China reporter 156.",
      metrics: {
        observationCount: flows.length,
        observationYear: latestYear || null
      }
    }));
  } else {
    signals.push(unavailableSignal({
      id: "signal:comtrade:156:unavailable",
      family: "trade",
      selectorId: "comtrade:reporter:156",
      publisher: {
        id: "publisher:un-comtrade",
        name: "UN Comtrade",
        type: "official"
      },
      sourceUrl: "https://comtradeplus.un.org/",
      sourceScope: "national",
      retrievalTime: comtradeRetrieval,
      transportFreshness: transportFreshness(snapshots.comtradeMeta, 2880, assessedAt),
      summary: "UN Comtrade annual observations for China reporter 156 are unavailable."
    }));
  }
  const shipping = record(snapshots.shipping);
  const ccfi = records(shipping?.indices).find((index) => index.indexId === "CCFI");
  if (ccfi) {
    const history = records(ccfi.history);
    const latestHistory = history.map((item) => ({ item, timestamp: dateOnlyTimestamp(item.date) })).filter((item) => item.timestamp !== null).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
    const observedRaw = latestHistory?.item.date ?? null;
    const observedAt = isoTimestamp(observedRaw);
    const retrievalTime = metaTimestamp(snapshots.shippingMeta);
    signals.push(sourceSignal({
      id: `signal:ccfi:${observedAt ?? "timestamp-unknown"}`,
      family: "trade",
      selectorId: "supply_chain:shipping:v2:CCFI",
      availability: observedAt ? "available" : "stale",
      publisher: {
        id: "publisher:shanghai-shipping-exchange",
        name: "Shanghai Shipping Exchange",
        type: "market"
      },
      sourceUrl: "https://en.sse.net.cn/indices/ccfinew.jsp",
      sourceScope: "national",
      observationTime: observedAt,
      observationTimePrecision: timestampPrecision(observedRaw),
      retrievalTime,
      retrievalTimePrecision: retrievalTime ? "instant" : "unknown",
      transportFreshness: transportFreshness(snapshots.shippingMeta, 420, assessedAt),
      contentFreshness: contentFreshness(observedAt, 28 * 1440, assessedAt),
      summary: "China Containerized Freight Index observation.",
      // `periodChangePct` is a proven period-over-period move — the exchange's own
      // percentage, or the change between two levels it published, with
      // `periodChangeBasis` naming which. It is absent unless the seeder proved a
      // comparable prior (#6066). The legacy `changePct` field stays unpublished:
      // it fabricates 0 when no prior exists, so a level would silently become a
      // change.
      metrics: metrics([
        ["currentValue", numberValue(ccfi.currentValue)],
        ["periodChangePct", numberValue(ccfi.periodChangePct)],
        ["periodChangeBasis", stringValue(ccfi.periodChangeBasis)],
        ["priorPeriodValue", numberValue(ccfi.priorPeriodValue)],
        ["priorPeriodDate", stringValue(ccfi.priorPeriodDate)],
        ["unit", stringValue(ccfi.unit)]
      ])
    }));
  } else {
    const retrievalTime = metaTimestamp(snapshots.shippingMeta);
    signals.push(unavailableSignal({
      id: "signal:ccfi:unavailable",
      family: "trade",
      selectorId: "supply_chain:shipping:v2:CCFI",
      publisher: {
        id: "publisher:shanghai-shipping-exchange",
        name: "Shanghai Shipping Exchange",
        type: "market"
      },
      sourceUrl: "https://en.sse.net.cn/indices/ccfinew.jsp",
      sourceScope: "national",
      retrievalTime,
      transportFreshness: transportFreshness(snapshots.shippingMeta, 420, assessedAt),
      summary: "China Containerized Freight Index observation is unavailable."
    }));
  }
  return family("china-trade-signals", signals, "China trade and freight signals are unavailable.");
}
function buildChinaCorridorSourceBundle(snapshots, assessedAt) {
  const families = {
    port: adaptPortwatch(snapshots, assessedAt),
    aviation: adaptAviation(snapshots, assessedAt),
    hazard: adaptHazards(snapshots, assessedAt),
    power_energy: adaptEnergy(snapshots, assessedAt),
    strategic_industry: adaptStrategicIndustry(snapshots, assessedAt),
    trade: adaptTrade(snapshots, assessedAt)
  };
  return { assessedAt, families };
}

// server/worldmonitor/supply-chain/v1/get-china-corridor-control-towers.ts
var CHINA_CORRIDOR_SOURCE_KEYS = Object.freeze({
  portwatchChina: "supply_chain:portwatch-ports:v1:CN",
  portwatchHongKong: "supply_chain:portwatch-ports:v1:HK",
  portwatchMeta: "seed-meta:supply_chain:portwatch-ports",
  aviation: "aviation:delays-bootstrap:v2",
  aviationMeta: "seed-meta:aviation:intl",
  westernPacificCyclones: "natural:western-pacific-cyclones:v1",
  westernPacificCyclonesMeta: "seed-meta:natural:western-pacific-cyclones",
  hkoWarnings: "weather:hko-warnings:v1",
  hkoWarningsMeta: "seed-meta:weather:hko-warnings",
  energySpine: "energy:spine:v1:CN",
  energySpineMeta: "seed-meta:energy:spine",
  comtrade: "comtrade:flows:v1",
  comtradeMeta: "seed-meta:trade:comtrade-flows",
  shipping: "supply_chain:shipping:v2",
  shippingMeta: "seed-meta:supply_chain:shipping"
});
function allCorridorsUnavailable(response) {
  return response.corridors.every((corridor2) => corridor2.availability === "unavailable");
}
async function readIsolated(read, key) {
  try {
    return await read(key, true);
  } catch {
    return null;
  }
}
async function loadChinaCorridorRawSnapshots(read, readBatch = getCachedJsonBatch) {
  if (read === void 0) {
    let cached = /* @__PURE__ */ new Map();
    try {
      cached = await readBatch(Object.values(CHINA_CORRIDOR_SOURCE_KEYS), true);
    } catch {
    }
    return Object.fromEntries(
      Object.entries(CHINA_CORRIDOR_SOURCE_KEYS).map(([field, key]) => [field, cached.get(key) ?? null])
    );
  }
  const entries = await Promise.all(
    Object.entries(CHINA_CORRIDOR_SOURCE_KEYS).map(async ([field, key]) => [field, await readIsolated(read, key)])
  );
  return Object.fromEntries(entries);
}
async function buildChinaCorridorSnapshot(assessedAt, read, readBatch = getCachedJsonBatch) {
  const raw = await loadChinaCorridorRawSnapshots(read, readBatch);
  const response = composeChinaCorridorControlTowers(
    buildChinaCorridorSourceBundle(raw, assessedAt)
  );
  return validateChinaCorridorProvenanceForSurface(response, "cache_storage");
}
async function composeChinaCorridorSnapshot(assessedAt, read, readBatch = getCachedJsonBatch) {
  const validated = await buildChinaCorridorSnapshot(assessedAt, read, readBatch);
  return allCorridorsUnavailable(validated) ? null : validated;
}
function composeUnavailableChinaCorridorSnapshot(assessedAt) {
  return validateChinaCorridorProvenanceForSurface(
    composeChinaCorridorControlTowers(buildChinaCorridorSourceBundle({}, assessedAt)),
    "cache_storage"
  );
}
var defaultChinaCorridorSnapshotCache = (key, ttlSeconds, fetcher) => cachedFetchJson(key, ttlSeconds, fetcher);
var inFlightResolution = null;
async function resolveChinaCorridorSnapshotUncoalesced(assessedAt, cache2, read, readBatch = getCachedJsonBatch) {
  let response = null;
  let unavailableCacheMiss = null;
  try {
    response = await cache2(
      CHINA_CORRIDOR_CONTROL_TOWERS_KEY,
      300,
      async () => {
        const composed = await buildChinaCorridorSnapshot(assessedAt, read, readBatch);
        if (allCorridorsUnavailable(composed)) {
          unavailableCacheMiss = composed;
          return null;
        }
        return composed;
      }
    );
  } catch {
  }
  if (response !== null && !allCorridorsUnavailable(response)) return response;
  if (unavailableCacheMiss !== null) return unavailableCacheMiss;
  try {
    response = await composeChinaCorridorSnapshot(assessedAt, read, readBatch);
  } catch {
    response = null;
  }
  return response ?? composeUnavailableChinaCorridorSnapshot(assessedAt);
}
function resolveChinaCorridorSnapshot(assessedAt, cache2 = defaultChinaCorridorSnapshotCache, read, readBatch = getCachedJsonBatch) {
  if (inFlightResolution?.assessedAt === assessedAt && inFlightResolution.cache === cache2 && inFlightResolution.read === read && inFlightResolution.readBatch === readBatch) {
    return inFlightResolution.promise;
  }
  const promise = resolveChinaCorridorSnapshotUncoalesced(
    assessedAt,
    cache2,
    read,
    readBatch
  );
  const resolution = { assessedAt, cache: cache2, read, readBatch, promise };
  inFlightResolution = resolution;
  const clear = () => {
    if (inFlightResolution === resolution) inFlightResolution = null;
  };
  void promise.then(clear, clear);
  return promise;
}

// server/worldmonitor/economic/v1/china-corridor-breadth-history.ts
init_redis();
var CHINA_CORRIDOR_DIRECTIONAL_HISTORY_KEY2 = CHINA_CORRIDOR_DIRECTIONAL_HISTORY_KEY;
var CHINA_CORRIDOR_DIRECTIONAL_HISTORY_LIMIT = 16;
var CHINA_CORRIDOR_DIRECTIONAL_HISTORY_TTL_SECONDS = 14 * 24 * 60 * 60;
var CHINA_CORRIDOR_DIRECTIONAL_HISTORY_MAX_PRIOR_AGE_SECONDS = 72 * 60 * 60;
var validFamilies = new Set(CHINA_CORRIDOR_SIGNAL_FAMILIES);
function record2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function canonicalTimestamp(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  const canonical = new Date(parsed).toISOString();
  return canonical === value ? canonical : null;
}
function canonicalStringSet(value, allowEmpty = false) {
  if (!Array.isArray(value) || !allowEmpty && value.length === 0) return null;
  if (value.some((item) => typeof item !== "string" || item.length === 0)) return null;
  const strings = value;
  const canonical = [...new Set(strings)].sort();
  return canonical.length === strings.length && canonical.every((item, index) => item === strings[index]) ? canonical : null;
}
function membershipForKey(key, corridorIds) {
  const corridorId = corridorIds.find((candidate) => key.startsWith(`${candidate}:`));
  if (corridorId === void 0) return null;
  const family2 = key.slice(corridorId.length + 1);
  return validFamilies.has(family2) ? { corridorId, family: family2 } : null;
}
function directionalSelectorMembershipForKey(key, corridorIds) {
  const corridorId = corridorIds.find((candidate) => key.startsWith(`${candidate}:`));
  if (corridorId === void 0) return null;
  const remainder = key.slice(corridorId.length + 1);
  const family2 = CHINA_CORRIDOR_SIGNAL_FAMILIES.find((candidate) => remainder.startsWith(`${candidate}:`));
  if (family2 === void 0 || remainder.slice(family2.length + 1).length === 0) return null;
  return { corridorId, family: family2 };
}
function parseSnapshot(value) {
  const candidate = record2(value);
  if (candidate?.schemaVersion !== 3) return null;
  const generatedAt = canonicalTimestamp(candidate.generatedAt);
  const corridorIds = canonicalStringSet(candidate.corridorIds);
  const familyKeys = canonicalStringSet(candidate.familyKeys);
  const directionalFamilies = canonicalStringSet(candidate.directionalFamilies, true);
  const directionalSelectorKeys = canonicalStringSet(candidate.directionalSelectorKeys, true);
  const strengtheningFamilies = canonicalStringSet(candidate.strengtheningFamilies, true);
  const weakeningFamilies = canonicalStringSet(candidate.weakeningFamilies, true);
  if (generatedAt === null || corridorIds === null || familyKeys === null || directionalFamilies === null || directionalSelectorKeys === null || strengtheningFamilies === null || weakeningFamilies === null) return null;
  const presentFamilies = /* @__PURE__ */ new Set();
  const corridorsWithFamilies = /* @__PURE__ */ new Set();
  for (const key of familyKeys) {
    const membership = membershipForKey(key, corridorIds);
    if (membership === null) return null;
    presentFamilies.add(membership.family);
    corridorsWithFamilies.add(membership.corridorId);
  }
  if (corridorsWithFamilies.size !== corridorIds.length) return null;
  if (directionalFamilies.some((family2) => !presentFamilies.has(family2))) return null;
  const directionalSet = new Set(directionalFamilies);
  const selectorFamilies = /* @__PURE__ */ new Set();
  for (const key of directionalSelectorKeys) {
    const membership = directionalSelectorMembershipForKey(key, corridorIds);
    if (membership === null || !directionalSet.has(membership.family)) return null;
    selectorFamilies.add(membership.family);
  }
  if (directionalFamilies.some((family2) => !selectorFamilies.has(family2))) return null;
  if (strengtheningFamilies.some((family2) => !directionalSet.has(family2)) || weakeningFamilies.some((family2) => !directionalSet.has(family2)) || weakeningFamilies.some((family2) => strengtheningFamilies.includes(family2))) return null;
  return {
    schemaVersion: 3,
    generatedAt,
    corridorIds,
    familyKeys,
    directionalFamilies,
    directionalSelectorKeys,
    strengtheningFamilies,
    weakeningFamilies
  };
}
function finiteMetric(value) {
  return typeof value === "number" && Number.isFinite(value);
}
function nonEmptyMetric(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function hasDirectionalMetric(signal) {
  if (signal.availability !== "available" || signal.transportFreshness !== "fresh" || signal.contentFreshness !== "current") return false;
  switch (signal.family) {
    case "port":
      return finiteMetric(signal.metrics.trendDelta);
    case "aviation":
      return signal.metrics.providerStatus === "normal" || signal.metrics.providerStatus === "disruption";
    case "trade":
      return finiteMetric(signal.metrics.periodChangePct);
    case "power_energy":
      return finiteMetric(signal.metrics.demandChangePercent) && nonEmptyMetric(signal.metrics.demandChangeBasis) && nonEmptyMetric(signal.metrics.demandChangeCurrentMonth) && canonicalTimestamp(signal.metrics.demandChangePeriodEnd) !== null;
    case "hazard":
    case "strategic_industry":
      return false;
  }
}
function activityDirection(value) {
  if (value > 0) return "strengthening";
  if (value < 0) return "weakening";
  return "unchanged";
}
function averageMetric(signals, metric) {
  const values = signals.filter(hasDirectionalMetric).map((signal) => signal.metrics[metric]).filter((value) => finiteMetric(value));
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}
function activityDirectionForFamily(family2, signals) {
  const directionalSignals = signals.filter(hasDirectionalMetric);
  if (directionalSignals.length === 0) return null;
  switch (family2) {
    case "port": {
      const value = averageMetric(directionalSignals, "trendDelta");
      return value === null ? null : activityDirection(value);
    }
    case "aviation": {
      const normal = directionalSignals.filter((signal) => signal.metrics.providerStatus === "normal").length;
      const disruption = directionalSignals.filter((signal) => signal.metrics.providerStatus === "disruption").length;
      return activityDirection(normal - disruption);
    }
    case "trade": {
      const value = averageMetric(directionalSignals, "periodChangePct");
      return value === null ? null : activityDirection(value);
    }
    case "power_energy": {
      const value = averageMetric(directionalSignals, "demandChangePercent");
      return value === null ? null : activityDirection(value);
    }
    case "hazard":
    case "strategic_industry":
      return null;
  }
}
function signalsForFamily(response, family2) {
  const byId = /* @__PURE__ */ new Map();
  for (const corridor2 of response.corridors) {
    const condition = corridor2.conditions.find((item) => item.family === family2);
    for (const signal of condition?.sourceSignals ?? []) {
      if (!byId.has(signal.id)) byId.set(signal.id, signal);
    }
  }
  return [...byId.values()];
}
function createChinaCorridorDirectionalSnapshot(response) {
  const generatedAt = canonicalTimestamp(response.generatedAt);
  const corridorIds = [...new Set(response.corridors.map((corridor2) => corridor2.id))].sort();
  if (generatedAt === null || corridorIds.length === 0) return null;
  const familyKeys = [...new Set(response.corridors.flatMap((corridor2) => corridor2.conditions.map((condition) => `${corridor2.id}:${condition.family}`)))].sort();
  if (familyKeys.length === 0) return null;
  const directionalFamilies = CHINA_CORRIDOR_SIGNAL_FAMILIES.filter((family2) => signalsForFamily(response, family2).some(hasDirectionalMetric)).sort();
  const directionalSelectorKeys = [...new Set(response.corridors.flatMap((corridor2) => corridor2.conditions.flatMap((condition) => condition.sourceSignals.filter(hasDirectionalMetric).map((signal) => `${corridor2.id}:${condition.family}:${signal.selectorId}`))))].sort();
  const strengtheningFamilies = [];
  const weakeningFamilies = [];
  for (const family2 of directionalFamilies) {
    const direction = activityDirectionForFamily(family2, signalsForFamily(response, family2));
    if (direction === "strengthening") strengtheningFamilies.push(family2);
    if (direction === "weakening") weakeningFamilies.push(family2);
  }
  return {
    schemaVersion: 3,
    generatedAt,
    corridorIds,
    familyKeys,
    directionalFamilies,
    directionalSelectorKeys,
    strengtheningFamilies,
    weakeningFamilies
  };
}
function sameStrings(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
function activityBreadthValue(snapshot) {
  return snapshot.strengtheningFamilies.length - snapshot.weakeningFamilies.length;
}
function compareChinaCorridorDirectionalSnapshots(current, prior) {
  if (prior === null || Date.parse(prior.generatedAt) >= Date.parse(current.generatedAt)) {
    return {
      value: null,
      priorValue: null,
      exclusion: "comparable_prior_snapshot_not_available"
    };
  }
  if (!sameStrings(current.corridorIds, prior.corridorIds)) {
    return {
      value: null,
      priorValue: prior.directionalFamilies.length,
      exclusion: "corridor_set_changed"
    };
  }
  if (!sameStrings(current.familyKeys, prior.familyKeys)) {
    return {
      value: null,
      priorValue: prior.directionalFamilies.length,
      exclusion: "corridor_family_set_changed"
    };
  }
  if (current.directionalFamilies.length === 0 || prior.directionalFamilies.length === 0) {
    return {
      value: null,
      priorValue: prior.directionalFamilies.length,
      exclusion: "directional_observations_not_available"
    };
  }
  if (!sameStrings(current.directionalFamilies, prior.directionalFamilies)) {
    return {
      value: null,
      priorValue: activityBreadthValue(prior),
      exclusion: "directional_family_set_changed"
    };
  }
  if (!sameStrings(current.directionalSelectorKeys, prior.directionalSelectorKeys)) {
    return {
      value: null,
      priorValue: activityBreadthValue(prior),
      exclusion: "directional_observation_set_changed"
    };
  }
  return {
    value: activityBreadthValue(current) - activityBreadthValue(prior),
    priorValue: activityBreadthValue(prior),
    exclusion: null
  };
}
function normalizeHistory(value) {
  if (!Array.isArray(value)) return [];
  const byGeneratedAt = /* @__PURE__ */ new Map();
  for (const item of value) {
    const parsed = parseSnapshot(item);
    if (parsed !== null && !byGeneratedAt.has(parsed.generatedAt)) {
      byGeneratedAt.set(parsed.generatedAt, parsed);
    }
  }
  return [...byGeneratedAt.values()].sort((left, right) => Date.parse(right.generatedAt) - Date.parse(left.generatedAt)).slice(0, CHINA_CORRIDOR_DIRECTIONAL_HISTORY_LIMIT);
}
function selectPriorChinaCorridorDirectionalSnapshot(current, history) {
  const currentMs = Date.parse(current.generatedAt);
  if (!Number.isFinite(currentMs)) return null;
  const maxAgeMs = CHINA_CORRIDOR_DIRECTIONAL_HISTORY_MAX_PRIOR_AGE_SECONDS * 1e3;
  return normalizeHistory(history).find((candidate) => {
    const candidateMs = Date.parse(candidate.generatedAt);
    return candidateMs < currentMs && currentMs - candidateMs <= maxAgeMs;
  }) ?? null;
}
async function readChinaCorridorDirectionalHistory(read = readCachedJsonList) {
  const result = await read(
    CHINA_CORRIDOR_DIRECTIONAL_HISTORY_KEY2,
    CHINA_CORRIDOR_DIRECTIONAL_HISTORY_LIMIT
  );
  if (result.status === "error") throw result.error;
  return result.status === "hit" ? normalizeHistory(result.value) : [];
}
async function persistChinaCorridorDirectionalSnapshot(current, write = prependCachedJsonList) {
  try {
    return await write(
      CHINA_CORRIDOR_DIRECTIONAL_HISTORY_KEY2,
      current,
      CHINA_CORRIDOR_DIRECTIONAL_HISTORY_LIMIT,
      CHINA_CORRIDOR_DIRECTIONAL_HISTORY_TTL_SECONDS
    );
  } catch {
    return false;
  }
}

// server/worldmonitor/economic/v1/get-china-activity-nowcast.ts
var CHINA_ACTIVITY_NOWCAST_CACHE_KEY = CHINA_ACTIVITY_NOWCAST_KEY;
var CHINA_ACTIVITY_NOWCAST_TTL_SECONDS = 15 * 60;
var CHINA_ACTIVITY_NOWCAST_COMPARISON_WINDOW_DAYS = 210;
var CHINA_ACTIVITY_NOWCAST_MARKET_KEYS = Object.freeze({
  commodities: "market:commodities-bootstrap:v1",
  commoditiesMeta: "seed-meta:market:commodities",
  stockIndex: "market:stock-index:v1:CN"
});
function record3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function records2(value) {
  return Array.isArray(value) ? value.map(record3).filter((item) => item !== null) : [];
}
function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function timestamp(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value < 1e10 ? value * 1e3 : value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}
function parseJsonObject(value) {
  try {
    return record3(JSON.parse(value));
  } catch {
    return null;
  }
}
function officialObservations(macro) {
  if (macro.unavailable) return [];
  return macro.indicators.flatMap((indicator) => {
    const periodEndMs = chinaMacroObservationDateMs(indicator.observationPeriod);
    const provenance = parseJsonObject(indicator.provenanceJson);
    if (indicator.category !== "activity" || !indicator.hasValue || indicator.stale || periodEndMs === null || provenance === null || !["strengthening", "weakening", "unchanged"].includes(indicator.direction)) return [];
    return [{
      seriesId: indicator.id,
      label: indicator.label,
      vintageId: indicator.vintageId,
      observationPeriod: indicator.observationPeriod,
      periodEnd: new Date(periodEndMs).toISOString(),
      releaseTime: indicator.releaseTime,
      retrievalTime: indicator.retrievalTime,
      direction: indicator.direction,
      value: indicator.value,
      unit: indicator.unit,
      available: indicator.transportStatus === "fresh",
      stale: indicator.stale,
      provenance
    }];
  });
}
function uniqueSignals(corridors, family2) {
  const byId = /* @__PURE__ */ new Map();
  for (const corridor2 of corridors.corridors) {
    const condition = corridor2.conditions.find((item) => item.family === family2);
    for (const signal of condition?.sourceSignals ?? []) {
      if (!byId.has(signal.id)) byId.set(signal.id, signal);
    }
  }
  return [...byId.values()];
}
function aggregateTimes(signals, evaluatedAt) {
  const latest = (values) => {
    const sorted = values.map(timestamp).filter((value) => value !== null).sort();
    return sorted[sorted.length - 1] ?? null;
  };
  const observedAt = latest(signals.map((signal) => signal.observationTime));
  const releasedAt = latest(signals.map((signal) => signal.releaseTime)) ?? observedAt;
  const retrievedAt = latest(signals.map((signal) => signal.retrievalTime)) ?? releasedAt;
  return {
    observedAt: observedAt ?? evaluatedAt,
    releasedAt: releasedAt ?? evaluatedAt,
    retrievedAt: retrievedAt ?? evaluatedAt
  };
}
function corridorProvenance(signals, extra = {}) {
  return {
    sourceSignalIds: signals.map((signal) => signal.id),
    publishers: signals.map((signal) => signal.publisher),
    sourceUrls: [...new Set(signals.map((signal) => signal.sourceUrl).filter(Boolean))],
    observationTimes: signals.map((signal) => signal.observationTime),
    ...extra
  };
}
function corridorObservation(input) {
  const times = input.times ?? aggregateTimes(input.signals, input.evaluatedAt);
  const stale = input.signals.some((signal) => signal.availability === "stale" || signal.transportFreshness === "stale" || signal.contentFreshness === "stale");
  return {
    seriesId: input.seriesId,
    observationId: input.observationId,
    ...times,
    value: input.value,
    priorValue: null,
    available: input.signals.some((signal) => signal.availability === "available"),
    stale,
    structuralBreak: false,
    provenance: input.provenance ?? corridorProvenance(input.signals)
  };
}
function metricString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
function metricStringArray(value) {
  const serialized = metricString(value);
  if (serialized === null) return null;
  try {
    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) return null;
    const values = [...new Set(parsed.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))].sort();
    return values.length === parsed.length ? values : null;
  } catch {
    return null;
  }
}
var ENERGY_DEMAND_CHANGE_BASIS2 = "year_over_year";
var ENERGY_DEMAND_CHANGE_UNIT2 = "% change";
var ENERGY_DEMAND_CHANGE_LOOKBACK_MONTHS2 = 12;
var MIN_DEMAND_CHANGE_PRODUCTS2 = 3;
var MAX_DEMAND_CHANGE_PRODUCTS2 = 5;
var MAX_DEMAND_CHANGE_PERCENT2 = 50;
function observationMonthIndex2(value) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value ?? "");
  return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : null;
}
function monthPeriodEnd2(value) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value ?? "");
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]), 1) - 1).toISOString();
}
function publishedEnergyDemandChange(signals, evaluatedAt) {
  const evaluatedAtMs = Date.parse(evaluatedAt);
  const keys = CHINA_ENERGY_DEMAND_METRIC_KEYS;
  for (const signal of signals) {
    const percentChange = finiteNumber(signal.metrics[keys.percent]);
    const observationPeriod = metricString(signal.metrics[keys.currentMonth]);
    const priorObservationPeriod = metricString(signal.metrics[keys.priorMonth]);
    const periodEnd = timestamp(metricString(signal.metrics[keys.changePeriodEnd]));
    const priorPeriodEnd = timestamp(metricString(signal.metrics[keys.changePriorPeriodEnd]));
    const currentPeriodIndex = observationMonthIndex2(observationPeriod);
    const priorPeriodIndex = observationMonthIndex2(priorObservationPeriod);
    const expectedPeriodEnd = monthPeriodEnd2(observationPeriod);
    const expectedPriorPeriodEnd = monthPeriodEnd2(priorObservationPeriod);
    const products = metricStringArray(signal.metrics[keys.products]);
    const productCount = finiteNumber(signal.metrics[keys.productCount]);
    const currentDemandKbd = finiteNumber(signal.metrics[keys.currentDemandKbd]);
    const priorDemandKbd = finiteNumber(signal.metrics[keys.priorDemandKbd]);
    const expectedPercentChange = currentDemandKbd !== null && priorDemandKbd !== null && priorDemandKbd > 0 ? (currentDemandKbd - priorDemandKbd) / priorDemandKbd * 100 : null;
    const percentTolerance = expectedPercentChange === null ? null : 1e-9 * Math.max(1, Math.abs(expectedPercentChange), Math.abs(percentChange ?? 0));
    const arithmeticMatches = percentChange !== null && expectedPercentChange !== null && percentTolerance !== null && Math.abs(expectedPercentChange - percentChange) <= percentTolerance;
    if (percentChange === null || signal.metrics[keys.basis] !== ENERGY_DEMAND_CHANGE_BASIS2 || signal.metrics[keys.unit] !== ENERGY_DEMAND_CHANGE_UNIT2 || observationPeriod === null || priorObservationPeriod === null || periodEnd === null || priorPeriodEnd === null || currentPeriodIndex === null || priorPeriodIndex === null || currentPeriodIndex - priorPeriodIndex !== ENERGY_DEMAND_CHANGE_LOOKBACK_MONTHS2 || expectedPeriodEnd === null || expectedPriorPeriodEnd === null || Date.parse(periodEnd) !== Date.parse(expectedPeriodEnd) || Date.parse(priorPeriodEnd) !== Date.parse(expectedPriorPeriodEnd) || products === null || productCount === null || !Number.isInteger(productCount) || productCount < MIN_DEMAND_CHANGE_PRODUCTS2 || productCount > MAX_DEMAND_CHANGE_PRODUCTS2 || products.length !== productCount || currentDemandKbd === null || currentDemandKbd < 0 || priorDemandKbd === null || priorDemandKbd <= 0 || !arithmeticMatches || Math.abs(percentChange) > MAX_DEMAND_CHANGE_PERCENT2 || Date.parse(priorPeriodEnd) >= Date.parse(periodEnd)) continue;
    const times = energyObservationTimes(signal, periodEnd, evaluatedAtMs);
    if (times === null) continue;
    return {
      percentChange,
      basis: ENERGY_DEMAND_CHANGE_BASIS2,
      unit: ENERGY_DEMAND_CHANGE_UNIT2,
      observationPeriod,
      priorObservationPeriod,
      priorPeriodEnd,
      products,
      productCount,
      currentDemandKbd,
      priorDemandKbd,
      signalId: signal.id,
      times
    };
  }
  return null;
}
function unpublishedEnergyDemandTimes(signals, evaluatedAt) {
  const evaluatedAtMs = Date.parse(evaluatedAt);
  for (const signal of signals) {
    const periodEnd = timestamp(
      metricString(signal.metrics[CHINA_ENERGY_DEMAND_METRIC_KEYS.periodEnd])
    );
    if (periodEnd === null) continue;
    const times = energyObservationTimes(signal, periodEnd, evaluatedAtMs);
    if (times !== null) return times;
  }
  return null;
}
function energyObservationTimes(signal, periodEnd, evaluatedAtMs) {
  const retrievedAt = timestamp(signal.retrievalTime);
  if (retrievedAt === null) return null;
  const releasedAt = timestamp(signal.releaseTime) ?? retrievedAt;
  return Date.parse(periodEnd) <= Date.parse(releasedAt) && Date.parse(releasedAt) <= Date.parse(retrievedAt) && Date.parse(retrievedAt) <= evaluatedAtMs ? { observedAt: periodEnd, releasedAt, retrievedAt } : null;
}
function corridorProxyObservations(corridors, evaluatedAt, priorCorridorSnapshot, corridorHistoryReadFailed) {
  if (corridors.corridors.length === 0) return [];
  const observations = [];
  const portSignals = uniqueSignals(corridors, "port");
  const trendDeltas = portSignals.map((signal) => finiteNumber(signal.metrics.trendDelta)).filter((value) => value !== null);
  observations.push(corridorObservation({
    evaluatedAt,
    seriesId: "portwatch_tanker_calls_trend",
    observationId: `portwatch-trend:${corridors.generatedAt}`,
    signals: portSignals,
    value: trendDeltas.length === 0 ? null : trendDeltas.reduce((sum, value) => sum + value, 0) / trendDeltas.length,
    provenance: corridorProvenance(portSignals, {
      reviewedSignalCount: portSignals.length,
      directionalSignalCount: trendDeltas.length,
      aggregation: "arithmetic_mean_of_finite_trend_delta"
    })
  }));
  const aviationSignals = uniqueSignals(corridors, "aviation");
  const statuses = aviationSignals.map((signal) => signal.metrics.providerStatus).filter((value) => value === "normal" || value === "disruption");
  const aviationBalance = statuses.length === 0 ? null : (statuses.filter((value) => value === "normal").length - statuses.filter((value) => value === "disruption").length) / statuses.length;
  observations.push(corridorObservation({
    evaluatedAt,
    seriesId: "aviation_hub_disruption_balance",
    observationId: `aviation-balance:${corridors.generatedAt}`,
    signals: aviationSignals,
    value: aviationBalance,
    provenance: corridorProvenance(aviationSignals, {
      reviewedSignalCount: aviationSignals.length,
      directionalSignalCount: statuses.length,
      aggregation: "normal_share_minus_disruption_share"
    })
  }));
  const tradeSignals = uniqueSignals(corridors, "trade");
  const ccfi = tradeSignals.find((signal) => signal.selectorId === "supply_chain:shipping:v2:CCFI" || signal.id.startsWith("signal:ccfi:"));
  if (ccfi) {
    const periodChange = finiteNumber(ccfi.metrics.periodChangePct);
    const ccfiFreshnessStale = ccfi.availability === "stale" || ccfi.transportFreshness === "stale" || ccfi.contentFreshness === "stale";
    const exclusion = periodChange !== null ? null : ccfi.availability === "unavailable" ? "source_signal_unavailable" : ccfiFreshnessStale ? "source_signal_stale" : "missing_comparable_prior";
    observations.push(corridorObservation({
      evaluatedAt,
      seriesId: "ccfi_freight_rate_change",
      observationId: `ccfi-change:${corridors.generatedAt}`,
      signals: [ccfi],
      value: periodChange,
      provenance: corridorProvenance([ccfi], {
        currentLevel: finiteNumber(ccfi.metrics.currentValue),
        priorPeriodLevel: finiteNumber(ccfi.metrics.priorPeriodValue),
        priorPeriodDate: typeof ccfi.metrics.priorPeriodDate === "string" ? ccfi.metrics.priorPeriodDate : null,
        periodChangeBasis: typeof ccfi.metrics.periodChangeBasis === "string" ? ccfi.metrics.periodChangeBasis : null,
        ...exclusion === null ? {} : { exclusion }
      })
    }));
  }
  const energySignals = uniqueSignals(corridors, "power_energy");
  const energyChange = publishedEnergyDemandChange(energySignals, evaluatedAt);
  const energyTimes = energyChange?.times ?? unpublishedEnergyDemandTimes(energySignals, evaluatedAt);
  if (energySignals.length > 0 && energyTimes !== null) {
    observations.push(corridorObservation({
      evaluatedAt,
      seriesId: "china_energy_demand_change",
      observationId: `energy-demand-change:${energyChange?.observationPeriod ?? corridors.generatedAt}`,
      signals: energySignals,
      // Coverage flags prove data presence, not direction.
      value: energyChange?.percentChange ?? null,
      times: energyTimes,
      provenance: corridorProvenance(energySignals, energyChange === null ? { exclusion: "directional_demand_change_not_published" } : {
        demandChangeBasis: energyChange.basis,
        demandChangeUnit: energyChange.unit,
        observationPeriod: energyChange.observationPeriod,
        priorObservationPeriod: energyChange.priorObservationPeriod,
        periodEnd: energyChange.times.observedAt,
        priorPeriodEnd: energyChange.priorPeriodEnd,
        products: energyChange.products,
        productCount: energyChange.productCount,
        currentDemandKbd: energyChange.currentDemandKbd,
        priorDemandKbd: energyChange.priorDemandKbd,
        directionalSignalId: energyChange.signalId
      })
    }));
  }
  const currentCorridorSnapshot = createChinaCorridorDirectionalSnapshot(corridors);
  const breadth = currentCorridorSnapshot === null ? {
    value: null,
    priorValue: null,
    exclusion: "directional_observations_not_available"
  } : corridorHistoryReadFailed ? {
    value: null,
    priorValue: null,
    exclusion: "corridor_history_read_failed"
  } : compareChinaCorridorDirectionalSnapshots(
    currentCorridorSnapshot,
    priorCorridorSnapshot
  );
  observations.push({
    seriesId: "corridor_activity_breadth_change",
    observationId: `corridor-breadth-change:${corridors.generatedAt}`,
    observedAt: corridors.generatedAt,
    releasedAt: corridors.generatedAt,
    retrievedAt: corridors.generatedAt,
    value: breadth.value,
    priorValue: breadth.priorValue,
    available: true,
    stale: false,
    structuralBreak: false,
    provenance: {
      corridorIds: currentCorridorSnapshot?.corridorIds ?? corridors.corridors.map((corridor2) => corridor2.id).sort(),
      familyKeys: currentCorridorSnapshot?.familyKeys ?? [],
      generatedAt: corridors.generatedAt,
      ...priorCorridorSnapshot === null ? {} : {
        priorGeneratedAt: priorCorridorSnapshot.generatedAt
      },
      directionalFamilies: currentCorridorSnapshot?.directionalFamilies ?? [],
      priorDirectionalFamilies: priorCorridorSnapshot?.directionalFamilies ?? [],
      directionalSelectorKeys: currentCorridorSnapshot?.directionalSelectorKeys ?? [],
      priorDirectionalSelectorKeys: priorCorridorSnapshot?.directionalSelectorKeys ?? [],
      directionalFamilyCount: currentCorridorSnapshot?.directionalFamilies.length ?? 0,
      priorDirectionalFamilyCount: priorCorridorSnapshot?.directionalFamilies.length ?? 0,
      strengtheningFamilies: currentCorridorSnapshot?.strengtheningFamilies ?? [],
      priorStrengtheningFamilies: priorCorridorSnapshot?.strengtheningFamilies ?? [],
      weakeningFamilies: currentCorridorSnapshot?.weakeningFamilies ?? [],
      priorWeakeningFamilies: priorCorridorSnapshot?.weakeningFamilies ?? [],
      activityBreadthValue: currentCorridorSnapshot === null ? null : currentCorridorSnapshot.strengtheningFamilies.length - currentCorridorSnapshot.weakeningFamilies.length,
      priorActivityBreadthValue: priorCorridorSnapshot === null ? null : priorCorridorSnapshot.strengtheningFamilies.length - priorCorridorSnapshot.weakeningFamilies.length,
      ...breadth.exclusion === null ? { aggregation: "signed_activity_family_count_change" } : { exclusion: breadth.exclusion }
    }
  });
  return observations;
}
function marketProxyObservations(marketValues) {
  const observations = [];
  const commodities = record3(marketValues.get(CHINA_ACTIVITY_NOWCAST_MARKET_KEYS.commodities));
  const commoditiesMeta = record3(
    marketValues.get(CHINA_ACTIVITY_NOWCAST_MARKET_KEYS.commoditiesMeta)
  );
  const commodityObservedAt = timestamp(commoditiesMeta?.fetchedAt);
  const reviewedQuotes = records2(commodities?.quotes).filter((quote) => quote.symbol === "HG=F" || quote.symbol === "ALI=F");
  const commodityChanges = reviewedQuotes.map((quote) => finiteNumber(quote.change)).filter((value) => value !== null);
  if (commodityObservedAt !== null) {
    observations.push({
      seriesId: "china_input_commodity_change",
      observationId: `china-input-commodities:${commodityObservedAt}`,
      observedAt: commodityObservedAt,
      releasedAt: commodityObservedAt,
      retrievedAt: commodityObservedAt,
      value: commodityChanges.length === 0 ? null : commodityChanges.reduce((sum, value) => sum + value, 0) / commodityChanges.length,
      priorValue: null,
      available: commodityChanges.length > 0,
      stale: false,
      structuralBreak: false,
      provenance: {
        symbols: reviewedQuotes.map((quote) => quote.symbol),
        publisherId: "publisher:alphavantage-yahoo",
        seedMetaFetchedAt: commodityObservedAt,
        aggregation: "arithmetic_mean_of_finite_percentage_changes"
      }
    });
  }
  const stockIndex = record3(marketValues.get(CHINA_ACTIVITY_NOWCAST_MARKET_KEYS.stockIndex));
  const stockObservedAt = timestamp(stockIndex?.fetchedAt);
  if (stockObservedAt !== null) {
    observations.push({
      seriesId: "sse_composite_week_change",
      observationId: `sse-composite-week-change:${stockObservedAt}`,
      observedAt: stockObservedAt,
      releasedAt: stockObservedAt,
      retrievedAt: stockObservedAt,
      value: finiteNumber(stockIndex?.weekChangePercent),
      priorValue: null,
      available: stockIndex?.available === true && stockIndex?.code === "CN",
      stale: false,
      structuralBreak: false,
      provenance: {
        publisherId: "publisher:yahoo-finance",
        symbol: stockIndex?.symbol,
        fetchedAt: stockObservedAt
      }
    });
  }
  return observations;
}
function buildChinaActivityNowcastInputs(input) {
  return {
    officialObservations: officialObservations(input.macro),
    proxyObservations: [
      ...corridorProxyObservations(
        input.corridors,
        input.evaluatedAt,
        input.priorCorridorSnapshot ?? null,
        input.corridorHistoryReadFailed ?? false
      ),
      ...marketProxyObservations(input.marketValues)
    ]
  };
}
function unavailableMacro(evaluatedAt) {
  return {
    countryCode: "CN",
    generatedAt: evaluatedAt,
    status: "unavailable",
    launchReady: false,
    contentObservationDate: "",
    latestObservationDate: "",
    indicators: [],
    sourceDecisions: [],
    releaseEvents: [],
    unavailable: true,
    schemaVersion: 2,
    pillars: []
  };
}
function unavailableCorridors(evaluatedAt) {
  return { generatedAt: evaluatedAt, corridors: [] };
}
async function composeChinaActivityNowcastSnapshot(evaluatedAt, dependencies) {
  const [macroResult, corridorsResult, marketResult, corridorHistoryResult] = await Promise.allSettled([
    dependencies.getMacro(),
    dependencies.getCorridors(),
    dependencies.readMarketBatch(
      Object.values(CHINA_ACTIVITY_NOWCAST_MARKET_KEYS),
      true
    ),
    dependencies.readCorridorHistory?.() ?? Promise.resolve([])
  ]);
  const corridors = corridorsResult.status === "fulfilled" ? corridorsResult.value : unavailableCorridors(evaluatedAt);
  const corridorHistory = corridorHistoryResult.status === "fulfilled" ? corridorHistoryResult.value : [];
  const currentCorridorSnapshot = createChinaCorridorDirectionalSnapshot(corridors);
  const priorCorridorSnapshot = currentCorridorSnapshot === null ? null : selectPriorChinaCorridorDirectionalSnapshot(
    currentCorridorSnapshot,
    corridorHistory
  );
  const inputs = buildChinaActivityNowcastInputs({
    evaluatedAt,
    macro: macroResult.status === "fulfilled" ? macroResult.value : unavailableMacro(evaluatedAt),
    corridors,
    marketValues: marketResult.status === "fulfilled" ? marketResult.value : /* @__PURE__ */ new Map(),
    priorCorridorSnapshot,
    corridorHistoryReadFailed: corridorHistoryResult.status === "rejected"
  });
  const response = evaluateChinaActivityNowcast({
    evaluatedAt,
    comparisonWindowDays: CHINA_ACTIVITY_NOWCAST_COMPARISON_WINDOW_DAYS,
    officialObservations: inputs.officialObservations,
    proxyObservations: inputs.proxyObservations
  });
  if (currentCorridorSnapshot !== null && corridorHistoryResult.status === "fulfilled" && dependencies.persistCorridorSnapshot) {
    try {
      await dependencies.persistCorridorSnapshot(
        currentCorridorSnapshot
      );
    } catch {
    }
  }
  return response;
}
function insufficientChinaActivityNowcast(evaluatedAt) {
  return evaluateChinaActivityNowcast({
    evaluatedAt,
    officialObservations: [],
    proxyObservations: []
  });
}
var defaultDependencies = (evaluatedAt, ctx) => ({
  getMacro: () => getChinaMacroSnapshot(ctx, {}),
  getCorridors: () => resolveChinaCorridorSnapshot(evaluatedAt),
  readMarketBatch: getCachedJsonBatch,
  readCorridorHistory: readChinaCorridorDirectionalHistory,
  persistCorridorSnapshot: persistChinaCorridorDirectionalSnapshot
});
var defaultCache = (key, ttlSeconds, fetcher) => cachedFetchJsonWithMeta(key, ttlSeconds, fetcher);
async function resolveChinaActivityNowcastSnapshot(evaluatedAt, dependencies, cache2 = defaultCache) {
  let insufficientCacheMiss = null;
  try {
    const cached = await cache2(
      CHINA_ACTIVITY_NOWCAST_CACHE_KEY,
      CHINA_ACTIVITY_NOWCAST_TTL_SECONDS,
      async () => {
        const composed = await composeChinaActivityNowcastSnapshot(evaluatedAt, dependencies);
        if (composed.state === "insufficient_data") {
          insufficientCacheMiss = composed;
          return null;
        }
        return composed;
      }
    );
    if (cached.data !== null) return cached.data;
  } catch {
  }
  if (insufficientCacheMiss !== null) return insufficientCacheMiss;
  return insufficientChinaActivityNowcast(evaluatedAt);
}
function projectChinaActivityNowcastWireResponse(response) {
  return {
    generatedAt: response.evaluatedAt,
    methodVersion: response.methodVersion,
    comparisonState: response.state,
    upstreamUnavailable: isChinaActivityNowcastUpstreamUnavailable(response),
    payloadJson: JSON.stringify(response)
  };
}
async function getChinaActivityNowcast(ctx, _req) {
  const evaluatedAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    return projectChinaActivityNowcastWireResponse(
      await resolveChinaActivityNowcastSnapshot(
        evaluatedAt,
        defaultDependencies(evaluatedAt, ctx)
      )
    );
  } catch {
    return projectChinaActivityNowcastWireResponse(
      insufficientChinaActivityNowcast(evaluatedAt)
    );
  }
}

// server/worldmonitor/economic/v1/handler.ts
var economicHandler = {
  getFredSeries,
  getFredSeriesBatch,
  listWorldBankIndicators,
  getEnergyPrices,
  getMacroSignals,
  getEnergyCapacity,
  getBisPolicyRates,
  getBisExchangeRates,
  getBisCredit,
  listGroceryBasketPrices,
  listBigMacPrices,
  getNationalDebt,
  listFuelPrices,
  getBlsSeries,
  getEconomicCalendar,
  getCrudeInventories,
  getNatGasStorage,
  getEcbFxRates,
  getEurostatCountryData,
  getEuGasStorage,
  getEuYieldCurve,
  getEuFsi,
  getEconomicStress,
  getFaoFoodPriceIndex,
  getOilStocksAnalysis,
  getOilInventories,
  getEnergyCrisisPolicies,
  listGlobalTenders,
  getChinaMacroSnapshot,
  getChinaActivityNowcast
};

// api/economic/v1/[rpc].ts
var config = { runtime: "edge" };
var rpc_default = createDomainGateway(
  createEconomicServiceRoutes(economicHandler, serverOptions)
);
export {
  config,
  rpc_default as default
};
