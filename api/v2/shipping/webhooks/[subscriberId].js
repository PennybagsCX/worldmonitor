var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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

// api/_cors.js
var ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  // Vercel preview deployments under the "eliewm" team scope, e.g.
  //   worldmonitor-git-<branch>-eliewm.vercel.app  (git-branch alias)
  //   worldmonitor-<hash>-eliewm.vercel.app        (deployment URL)
  // Tight on purpose: never a bare *.vercel.app (this is a security allowlist).
  /^https:\/\/worldmonitor-[a-z0-9-]+-eliewm\.vercel\.app$/,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/,
  // Only allow bare localhost/127.0.0.1 in non-production (matches server/cors.ts)
  ...process.env.NODE_ENV === "production" ? [] : [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/
  ]
];
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
  // Billing-verification denials (server/_shared/entitlement-check.ts) carry
  // the reason here alongside `Retry-After`. Docs advertise the header
  // (docs/usage-errors.mdx) but it was not exposed, so a cross-origin browser
  // client — the Tauri desktop shell, widget embeds, anything on
  // api.worldmonitor.app — could not read it and had to parse `code` from the
  // body to tell a retryable verification blip from a terminal lapse (#5622).
  "X-Billing-Verification",
  // IETF RateLimit fields (draft-ietf-httpapi-ratelimit-headers): RateLimit-Policy
  // + RateLimit-Limit are advertised on every API response (vercel.json); the
  // combined RateLimit member and RateLimit-Remaining/Reset appear on a 429.
  // Exposed so browser-context agents can read them cross-origin and self-throttle.
  "RateLimit",
  "RateLimit-Policy",
  "RateLimit-Limit",
  "RateLimit-Remaining",
  "RateLimit-Reset",
  // Legacy X-RateLimit-* retained for back-compat with existing consumers.
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
function getCorsHeaders(req, methods = "GET, OPTIONS") {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = isAllowedOrigin(origin) ? origin : "https://worldmonitor.app";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin"
  };
}

// node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
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

// node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
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

// node_modules/jose/dist/webapi/lib/crypto_key.js
var unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
var isAlgorithm = (algorithm, name) => algorithm.name === name;
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
var invalidKeyInput = (actual, ...types) => message("Key must be ", actual, ...types);
var withAlg = (alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types);

// node_modules/jose/dist/webapi/util/errors.js
var JOSEError = class extends Error {
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
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
var JWTExpired = class extends JOSEError {
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
var JOSEAlgNotAllowed = class extends JOSEError {
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWKSInvalid = class extends JOSEError {
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
};
var JWKSNoMatchingKey = class extends JOSEError {
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSMultipleMatchingKeys = class extends JOSEError {
  [Symbol.asyncIterator];
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSTimeout = class extends JOSEError {
  static code = "ERR_JWKS_TIMEOUT";
  code = "ERR_JWKS_TIMEOUT";
  constructor(message2 = "request timed out", options) {
    super(message2, options);
  }
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey = (key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
};
var isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
var isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);

// node_modules/jose/dist/webapi/lib/helpers.js
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}

// node_modules/jose/dist/webapi/lib/type_checks.js
var isObjectLike = (value) => typeof value === "object" && value !== null;
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
var isJWK = (key) => isObject(key) && typeof key.kty === "string";
var isPrivateJWK = (key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string");
var isPublicJWK = (key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0;
var isSecretJWK = (key) => key.kty === "oct" && typeof key.k === "string";

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

// node_modules/jose/dist/webapi/lib/jwk_to_key.js
var unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
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

// node_modules/jose/dist/webapi/lib/normalize_key.js
var unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
var cache;
var handleJWK = async (key, jwk, alg, freeze = false) => {
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
var handleKeyObject = (keyObject, alg) => {
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
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}

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
      return decode(jwk.k);
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

// node_modules/jose/dist/webapi/lib/check_key_type.js
var tag = (key) => key?.[Symbol.toStringTag];
var jwkMatchesOp = (alg, key, usage) => {
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
var symmetricTypeCheck = (alg, key, usage) => {
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
var asymmetricTypeCheck = (alg, key, usage) => {
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
      const protectedHeader = decode(jws.protected);
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

// node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var epoch = (date) => Math.floor(date.getTime() / 1e3);
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
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
var normalizeTyp = (value) => {
  if (value.includes("/")) {
    return value.toLowerCase();
  }
  return `application/${value.toLowerCase()}`;
};
var checkAudiencePresence = (audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
};
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
var LocalJWKSet = class {
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

// node_modules/jose/dist/webapi/jwks/remote.js
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
var USER_AGENT;
if (typeof navigator === "undefined" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) {
  const NAME = "jose";
  const VERSION = "v6.2.2";
  USER_AGENT = `${NAME}/${VERSION}`;
}
var customFetch = /* @__PURE__ */ Symbol();
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
var jwksCache = /* @__PURE__ */ Symbol();
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
var RemoteJWKSet = class {
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

// server/auth-session.ts
var CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
var CLERK_JWT_CLOCK_TOLERANCE_SECONDS = 5;
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
var _jwks = null;
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
var _planCache = /* @__PURE__ */ new Map();
var PLAN_CACHE_TTL_MS = 5 * 60 * 1e3;
var DEFAULT_PLAN_LOOKUP_TIMEOUT_MS = 3e3;
var MAX_ABORT_SIGNAL_TIMEOUT_MS = 2147483647;
function parsePlanLookupTimeoutMs(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= MAX_ABORT_SIGNAL_TIMEOUT_MS ? parsed : DEFAULT_PLAN_LOOKUP_TIMEOUT_MS;
}
var PLAN_LOOKUP_TIMEOUT_MS = parsePlanLookupTimeoutMs(process.env.CLERK_PLAN_LOOKUP_TIMEOUT_MS);
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

// server/_shared/cache-contract.ts
var SCENARIO_STATUS_PATH = "/api/scenario/v1/get-scenario-status";
var SCENARIO_TERMINAL_STATUSES = /* @__PURE__ */ new Set(["done", "failed"]);
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

// server/_shared/client-ip.ts
var CLOUDFLARE_IPV4_CIDRS = Object.freeze([
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
var CLOUDFLARE_IPV6_CIDRS = Object.freeze([
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32"
]);
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
var CLOUDFLARE_IPV4_RANGES = Object.freeze(CLOUDFLARE_IPV4_CIDRS.map(parseIpv4Cidr));
var CLOUDFLARE_IPV6_RANGES = Object.freeze(CLOUDFLARE_IPV6_CIDRS.map(parseIpv6Cidr));

// server/_shared/usage.ts
var AXIOM_DATASET = "wm_api_usage";
var AXIOM_INGEST_URL = `https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`;
var CB_WINDOW_MS = 5 * 60 * 1e3;

// server/_shared/redis.ts
function parseTimeoutEnv(raw, defaultMs) {
  const parsed = Number.parseInt(raw ?? "", 10);
  return parsed > 0 ? parsed : defaultMs;
}
var REDIS_OP_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_OP_TIMEOUT_MS, 1500);
var REDIS_PIPELINE_TIMEOUT_MS = parseTimeoutEnv(process.env.REDIS_PIPELINE_TIMEOUT_MS, 5e3);
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
var cachedPrefix;
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
var NEG_SENTINEL = "__WM_NEG__";
var FETCH_ERROR_NEGATIVE_TTL_SECONDS = 30;
var FETCH_ERROR_UNAVAILABLE_BACKOFF_SECONDS = 3;
var REDIS_FAILURE_POSITIVE_TTL_SECONDS = 30;
var LOCAL_FALLBACK_MAX_ENTRIES = 5e3;
var localNegativeUntil = /* @__PURE__ */ new Map();
var localUnavailableUntil = /* @__PURE__ */ new Map();
var localPositiveFallback = /* @__PURE__ */ new Map();
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
var inflight = /* @__PURE__ */ new Map();
var FETCHER_TIMEOUT_MS_DEFAULT = 3e4;
var fetcherTimeoutDefaultMs = FETCHER_TIMEOUT_MS_DEFAULT;
var CachedFetchTimeoutError = class extends Error {
  constructor(message2) {
    super(message2);
    this.name = "CachedFetchTimeoutError";
  }
};
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

// server/_shared/entitlement-check.ts
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

// server/_shared/mcp-internal-hmac.ts
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

// shared/company-monitoring-contract.ts
var COMPANY_MONITORING_LIMITS = {
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
var COMPANY_MONITORING_RPC_SCOPES = {
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
var encoder2 = new TextEncoder();

// server/_shared/user-api-key.ts
var COMPANY_MONITORING_SCOPES = new Set(Object.values(COMPANY_MONITORING_RPC_SCOPES));
var UserApiKeyUnavailableError = class extends Error {
  code = "validation_unavailable";
  constructor(message2) {
    super(message2);
    this.name = "UserApiKeyUnavailableError";
  }
};
var USER_API_KEY_RE = /^wm_[a-f0-9]{40}$/;
var CACHE_TTL_SECONDS = 60;
var NEG_TTL_SECONDS = 60;
var CACHE_KEY_PREFIX = "user-api-key:";
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
async function sha256Hex(input) {
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
  const keyHash = await sha256Hex(key);
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

// server/_shared/direct-llm-quota.ts
var DIRECT_LLM_DAILY_QUOTA_LIMIT = 500;
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

// server/_shared/premium-check.ts
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

// server/_shared/chokepoint-registry.ts
var CHOKEPOINT_REGISTRY = [
  {
    id: "suez",
    displayName: "Suez Canal",
    geoId: "suez",
    relayName: "Suez Canal",
    portwatchName: "Suez Canal",
    corridorRiskName: "Suez",
    baselineId: "suez",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-europe-oil", "qatar-europe-lng", "singapore-med", "india-europe"],
    lat: 30.5,
    lon: 32.3
  },
  {
    id: "malacca_strait",
    displayName: "Strait of Malacca",
    geoId: "malacca_strait",
    relayName: "Malacca Strait",
    portwatchName: "Malacca Strait",
    corridorRiskName: "Malacca",
    baselineId: "malacca",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-asia-oil", "qatar-asia-lng", "india-se-asia", "china-africa", "cpec-route"],
    lat: 2.5,
    lon: 101.5
  },
  {
    id: "hormuz_strait",
    displayName: "Strait of Hormuz",
    geoId: "hormuz_strait",
    relayName: "Strait of Hormuz",
    portwatchName: "Strait of Hormuz",
    corridorRiskName: "Hormuz",
    baselineId: "hormuz",
    shockModelSupported: true,
    routeIds: ["gulf-europe-oil", "gulf-asia-oil", "qatar-europe-lng", "qatar-asia-lng", "gulf-americas-cape"],
    lat: 26.5,
    lon: 56.5
  },
  {
    id: "bab_el_mandeb",
    displayName: "Bab el-Mandeb",
    geoId: "bab_el_mandeb",
    relayName: "Bab el-Mandeb Strait",
    portwatchName: "Bab el-Mandeb Strait",
    corridorRiskName: "Bab el-Mandeb",
    baselineId: "babelm",
    shockModelSupported: true,
    routeIds: ["china-europe-suez", "china-us-east-suez", "gulf-europe-oil", "qatar-europe-lng", "singapore-med", "india-europe"],
    lat: 12.5,
    lon: 43.3
  },
  {
    id: "panama",
    displayName: "Panama Canal",
    geoId: "panama",
    relayName: "Panama Canal",
    portwatchName: "Panama Canal",
    corridorRiskName: "Panama",
    baselineId: "panama",
    shockModelSupported: false,
    routeIds: ["china-us-east-panama", "panama-transit"],
    lat: 9.1,
    lon: -79.7
  },
  {
    id: "taiwan_strait",
    displayName: "Taiwan Strait",
    geoId: "taiwan_strait",
    relayName: "Taiwan Strait",
    portwatchName: "Taiwan Strait",
    corridorRiskName: "Taiwan",
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["china-us-west", "intra-asia-container"],
    lat: 24,
    lon: 119.5
  },
  {
    id: "cape_of_good_hope",
    displayName: "Cape of Good Hope",
    geoId: "cape_of_good_hope",
    relayName: "Cape of Good Hope",
    portwatchName: "Cape of Good Hope",
    corridorRiskName: "Cape of Good Hope",
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["brazil-china-bulk", "gulf-americas-cape", "asia-europe-cape"],
    lat: -34.36,
    lon: 18.49
  },
  {
    id: "gibraltar",
    displayName: "Strait of Gibraltar",
    geoId: "gibraltar",
    relayName: "Gibraltar Strait",
    portwatchName: "Gibraltar Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: ["gulf-europe-oil", "singapore-med", "india-europe", "asia-europe-cape"],
    lat: 35.9,
    lon: -5.6
  },
  {
    id: "bosphorus",
    displayName: "Bosporus Strait",
    geoId: "bosphorus",
    relayName: "Bosporus Strait",
    portwatchName: "Bosporus Strait",
    corridorRiskName: null,
    baselineId: "turkish",
    shockModelSupported: false,
    routeIds: ["russia-med-oil"],
    lat: 41.1,
    lon: 29
  },
  {
    id: "korea_strait",
    displayName: "Korea Strait",
    geoId: "korea_strait",
    relayName: "Korea Strait",
    portwatchName: "Korea Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: 34,
    lon: 129
  },
  {
    id: "dover_strait",
    displayName: "Dover Strait",
    geoId: "dover_strait",
    relayName: "Dover Strait",
    portwatchName: "Dover Strait",
    corridorRiskName: null,
    baselineId: "danish",
    shockModelSupported: false,
    routeIds: [],
    lat: 51,
    lon: 1.5
  },
  {
    id: "kerch_strait",
    displayName: "Kerch Strait",
    geoId: "kerch_strait",
    relayName: "Kerch Strait",
    portwatchName: "Kerch Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: 45.3,
    lon: 36.6
  },
  {
    id: "lombok_strait",
    displayName: "Lombok Strait",
    geoId: "lombok_strait",
    relayName: "Lombok Strait",
    portwatchName: "Lombok Strait",
    corridorRiskName: null,
    baselineId: null,
    shockModelSupported: false,
    routeIds: [],
    lat: -8.5,
    lon: 115.7
  }
];
var CANONICAL_CHOKEPOINT_IDS = new Set(CHOKEPOINT_REGISTRY.map((c) => c.id));
var SHOCK_MODEL_CHOKEPOINTS = CHOKEPOINT_REGISTRY.filter((c) => c.shockModelSupported);

// server/worldmonitor/shipping/v2/webhook-shared.ts
var WEBHOOK_TTL = 86400 * 30;
var VALID_CHOKEPOINT_IDS = new Set(CHOKEPOINT_REGISTRY.map((c) => c.id));
function webhookKey(subscriberId) {
  return `webhook:sub:${subscriberId}:v1`;
}
async function callerFingerprint(req) {
  const key = req.headers.get("X-WorldMonitor-Key") ?? req.headers.get("X-Api-Key") ?? "";
  if (!key) return "anon";
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// api/v2/shipping/webhooks/[subscriberId].ts
var config = { runtime: "edge" };
async function handler(req) {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const apiKeyResult = await validateApiKey(req, { forceKey: true });
  if (apiKeyResult.required && !apiKeyResult.valid) {
    return new Response(JSON.stringify({ error: apiKeyResult.error ?? "API key required" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const isPro = await isCallerPremium(req);
  if (!isPro) {
    return new Response(JSON.stringify({ error: "PRO subscription required" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const url = new URL(req.url);
  const parts = url.pathname.replace(/\/+$/, "").split("/");
  const subscriberId = parts[parts.length - 1];
  if (!subscriberId || !subscriberId.startsWith("wh_")) {
    return new Response(JSON.stringify({ error: "Webhook not found" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const record = await getCachedJson(webhookKey(subscriberId)).catch(() => null);
  if (!record) {
    return new Response(JSON.stringify({ error: "Webhook not found" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  const ownerHash = await callerFingerprint(req);
  if (record.ownerTag !== ownerHash) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
  return new Response(
    JSON.stringify({
      subscriberId: record.subscriberId,
      callbackUrl: record.callbackUrl,
      chokepointIds: record.chokepointIds,
      alertThreshold: record.alertThreshold,
      createdAt: record.createdAt,
      active: record.active
    }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
  );
}
export {
  config,
  handler as default
};
