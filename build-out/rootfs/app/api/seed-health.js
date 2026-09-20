// api/seed-health.js
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
function isDisallowedOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}
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
function sanitizeJsonValue(value, depth = 0) {
  if (depth > 20) return "[truncated]";
  if (value instanceof Error) {
    return { error: value.message };
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const clone = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === "stack" || key === "stackTrace" || key === "cause") continue;
      clone[key] = sanitizeJsonValue(nested, depth + 1);
    }
    return clone;
  }
  return value;
}
function jsonResponse(body, status, headers = {}) {
  return new Response(JSON.stringify(sanitizeJsonValue(body)), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
var PREDICTION_MARKET_MIN_POOL_COUNTS = Object.freeze({
  geopolitical: 1,
  tech: 1,
  finance: 1
});
function parsePoolCounts(value, minimums) {
  if (!minimums || !value || typeof value !== "object" || Array.isArray(value)) return null;
  const counts = {};
  for (const pool of Object.keys(minimums)) {
    const count = value[pool];
    if (!Number.isSafeInteger(count) || count < 0) return null;
    counts[pool] = count;
  }
  return counts;
}
function hasPoolCoverageShortfall(counts, minimums) {
  if (!minimums) return false;
  if (!counts) return true;
  return Object.entries(minimums).some(([pool, minimum]) => {
    const count = counts[pool];
    return !Number.isSafeInteger(count) || count < minimum;
  });
}
var EDUCATION_MIN_RANKABLE_RECORD_COUNT = 180;
var RANKABLE_COUNTRY_CODES = new Set(
  "AF,AL,DZ,AD,AO,AG,AR,AM,AU,AT,AZ,BS,BH,BD,BB,BY,BE,BZ,BJ,BT,BO,BA,BW,BR,BN,BG,BF,BI,CV,KH,CM,CA,CF,TD,CL,CN,CO,KM,CG,CD,CR,CI,HR,CU,CY,CZ,DK,DJ,DM,DO,EC,EG,SV,GQ,ER,EE,SZ,ET,FJ,FI,FR,GA,GM,GE,DE,GH,GR,GD,GT,GN,GW,GY,HT,HN,HU,IS,IN,ID,IR,IQ,IE,IL,IT,JM,JP,JO,KZ,KE,KI,KP,KR,KW,KG,LA,LV,LB,LS,LR,LY,LI,LT,LU,MG,MW,MY,MV,ML,MT,MH,MR,MU,MX,FM,MD,MC,MN,ME,MA,MZ,MM,NA,NR,NP,NL,NZ,NI,NE,NG,MK,NO,OM,PK,PW,PA,PG,PY,PE,PH,PL,PT,QA,RO,RU,RW,KN,LC,VC,WS,SM,ST,SA,SN,RS,SC,SL,SG,SK,SI,SB,SO,ZA,SS,ES,LK,SD,SR,SE,CH,SY,TJ,TZ,TH,TL,TG,TO,TT,TN,TR,TM,TV,UG,UA,AE,GB,US,UY,UZ,VU,VE,VN,YE,ZM,ZW,HK,MO,TW".split(",")
);
function isRankableCountryCode(value) {
  return typeof value === "string" && RANKABLE_COUNTRY_CODES.has(value);
}
function parseRankableRecordCount(meta) {
  if (meta == null || typeof meta !== "object" || Array.isArray(meta)) return null;
  const rawCount = meta.rankableRecordCount;
  if (rawCount !== null && rawCount !== "" && typeof rawCount !== "boolean") {
    const numericCount = Number(rawCount);
    if (Number.isSafeInteger(numericCount) && numericCount >= 0) return numericCount;
  }
  if (typeof meta.countrySet !== "string" || meta.countrySet.length === 0) return null;
  const codes = meta.countrySet.split(",").map((code) => code.trim());
  if (codes.length === 0 || codes.some((code) => !isRankableCountryCode(code))) return null;
  return new Set(codes).size;
}
function parseEducationPayloadRankableRecordCount(payload) {
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) return null;
  const countries = payload.countries;
  if (countries == null || typeof countries !== "object" || Array.isArray(countries)) return null;
  let count = 0;
  for (const [countryCode, record] of Object.entries(countries)) {
    if (!isRankableCountryCode(countryCode) || record == null || typeof record !== "object" || Array.isArray(record)) continue;
    const value = record.value;
    const year = record.year;
    if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 && typeof year === "number" && Number.isSafeInteger(year) && year >= 1900 && year <= 2200) {
      count += 1;
    }
  }
  return count;
}
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
function projectChinaDecisionGroupDiagnostics(meta, { groupIds = [], allowedStates, healthyQuietCause }) {
  const states = meta?.groupStates;
  const counts = meta?.groupCounts;
  if (!Array.isArray(groupIds) || groupIds.length === 0 || !states || typeof states !== "object" || Array.isArray(states) || !counts || typeof counts !== "object" || Array.isArray(counts)) return null;
  const stateSet = allowedStates instanceof Set ? allowedStates : /* @__PURE__ */ new Set(["available", "partial", "stale", "unavailable"]);
  const groupStates = Object.fromEntries(
    groupIds.map((groupId) => [groupId, states[groupId]])
  );
  if (Object.values(groupStates).some((state) => !stateSet.has(state)) || !["populated", "partial", "stale", "unavailable", "healthyQuiet", "operationallyCovered"].every(
    (key) => Number.isInteger(counts[key]) && counts[key] >= 0 && counts[key] <= groupIds.length
  )) return null;
  const unavailableCauses = meta?.unavailableCauses;
  const causeOf = (groupId) => unavailableCauses && typeof unavailableCauses === "object" && !Array.isArray(unavailableCauses) && typeof unavailableCauses[groupId] === "string" ? unavailableCauses[groupId].slice(0, 40) : "unknown";
  const quietGroups = [];
  const partialGroups = [];
  const staleGroups = [];
  const unavailableGroups = [];
  for (const groupId of groupIds) {
    const state = groupStates[groupId];
    if (state === "partial") partialGroups.push(groupId);
    if (state === "stale") staleGroups.push(groupId);
    if (state !== "unavailable") continue;
    if (causeOf(groupId) === healthyQuietCause) quietGroups.push(groupId);
    else {
      unavailableGroups.push({ id: groupId, unavailableCause: causeOf(groupId) });
    }
  }
  return {
    groupStates,
    groupCounts: {
      populated: counts.populated,
      partial: counts.partial,
      stale: counts.stale,
      unavailable: counts.unavailable,
      healthyQuiet: counts.healthyQuiet,
      operationallyCovered: counts.operationallyCovered
    },
    quietGroups,
    partialGroups,
    staleGroups,
    unavailableGroups
  };
}
function hasOwnField(value, field) {
  return value !== null && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, field);
}
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}
function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function entityList(value) {
  return Array.isArray(value) ? value.filter((entity) => typeof entity === "string").slice(0, 40).map((entity) => entity.slice(0, 8)) : [];
}
var PORTWATCH_CONTENT_FRESHNESS_ACTIVATION_KEY = "seed-activated:supply_chain:portwatch-ports:content-freshness";
var CONTENT_FRESHNESS_ROLLOUT = Object.freeze({
  [PORTWATCH_CONTENT_FRESHNESS_ACTIVATION_KEY]: Object.freeze({
    from: "2026-08-03T10:24:42Z",
    until: "2026-08-04T06:00:00Z"
  })
});
var CONTENT_FRESHNESS_ROLLOUT_WINDOWS = new Map(
  Object.entries(CONTENT_FRESHNESS_ROLLOUT).map(([key, window]) => [key, {
    ...window,
    fromMs: Date.parse(window.from),
    untilMs: Date.parse(window.until)
  }])
);
var CONTENT_FRESHNESS_ROLLOUT_UNTIL_MS = Object.freeze(
  Object.fromEntries(
    [...CONTENT_FRESHNESS_ROLLOUT_WINDOWS.entries()].filter(([, window]) => Number.isFinite(window.untilMs)).map(([key, window]) => [key, window.untilMs])
  )
);
function getContentFreshnessActivationWindow(activationKey) {
  const window = CONTENT_FRESHNESS_ROLLOUT_WINDOWS.get(activationKey);
  if (!window || !Number.isFinite(window.fromMs) || !Number.isFinite(window.untilMs)) return null;
  if (window.untilMs <= window.fromMs) return null;
  return window;
}
function getActiveContentFreshnessActivationWindow(activationKey, activationState, now) {
  const window = getContentFreshnessActivationWindow(activationKey);
  return activationState === false && window !== null && Number.isFinite(now) && now >= window.fromMs && now < window.untilMs ? window : null;
}
function buildContentFreshnessAssessment(meta, requirement, now) {
  if (!requirement) return null;
  const block = meta?.contentFreshness;
  const fieldPresent = hasOwnField(meta, "contentFreshness");
  const blockPresent = isPlainObject(block);
  const count = nonNegativeInteger;
  const coveredCount = count(block?.coveredCount);
  const freshCount = count(block?.freshCount);
  const staleCount = count(block?.staleCount);
  const unknownCount = count(block?.unknownCount);
  const criticalCountries = entityList(block?.criticalCountries);
  const criticalFreshCount = count(block?.criticalFreshCount);
  const expectedCountries = Array.isArray(requirement.countries) ? requirement.countries : [];
  const expectedBudgetMinutes = Number(requirement.budgetMinutes);
  const criticalOldestObservedAt = finiteNumber(block?.criticalOldestObservedAt);
  const criticalAgeMs = criticalOldestObservedAt === null || !Number.isFinite(now) ? null : now - criticalOldestObservedAt;
  const criticalAgeMinutes = criticalAgeMs === null ? null : Math.round(criticalAgeMs / 6e4);
  const declaredScopeCoversExpected = expectedCountries.length > 0 && expectedCountries.every((entity) => criticalCountries.includes(entity));
  const unusableReasons = [];
  if (coveredCount === null) unusableReasons.push("covered_count_unusable");
  if (freshCount === null) unusableReasons.push("fresh_count_unusable");
  else if (coveredCount !== null && freshCount > coveredCount) {
    unusableReasons.push("fresh_exceeds_covered");
  }
  if (staleCount === null) unusableReasons.push("stale_count_unusable");
  if (unknownCount === null) unusableReasons.push("unknown_count_unusable");
  if (coveredCount !== null && freshCount !== null && staleCount !== null && unknownCount !== null && freshCount + staleCount + unknownCount !== coveredCount && freshCount <= coveredCount) {
    unusableReasons.push("content_counts_inconsistent");
  }
  if (!declaredScopeCoversExpected) unusableReasons.push("declared_scope_narrowed");
  if (criticalFreshCount === null) unusableReasons.push("critical_fresh_count_unusable");
  else if (criticalFreshCount > criticalCountries.length) {
    unusableReasons.push("critical_fresh_exceeds_declared");
  }
  if (criticalFreshCount !== null && coveredCount !== null && criticalFreshCount > coveredCount) {
    unusableReasons.push("critical_fresh_exceeds_covered");
  }
  if (!Number.isFinite(expectedBudgetMinutes) || expectedBudgetMinutes <= 0) {
    unusableReasons.push("expected_budget_unusable");
  }
  if (blockPresent && criticalOldestObservedAt === null && criticalFreshCount !== null && criticalCountries.length > 0 && criticalFreshCount === criticalCountries.length) {
    unusableReasons.push("critical_observation_time_unusable");
  }
  const usable = unusableReasons.length === 0;
  const budgetMs = Number.isFinite(expectedBudgetMinutes) && expectedBudgetMinutes > 0 ? expectedBudgetMinutes * 6e4 : null;
  return {
    fieldPresent,
    usable,
    unusableReasons,
    expectedCriticalCountries: expectedCountries,
    budgetMinutes: Number.isFinite(expectedBudgetMinutes) ? expectedBudgetMinutes : null,
    coveredCount,
    freshCount,
    staleCount,
    unknownCount,
    staleCountries: entityList(block?.staleCountries),
    staleCountriesTruncated: count(block?.staleCountriesTruncated) ?? 0,
    oldestObservedAt: finiteNumber(block?.oldestObservedAt),
    oldestObservedCountry: typeof block?.oldestObservedCountry === "string" ? block.oldestObservedCountry.slice(0, 8) : null,
    oldestAgeMinutes: finiteNumber(block?.oldestAgeMinutes) === null ? null : Math.round(block.oldestAgeMinutes),
    criticalCountries,
    criticalFreshCount,
    criticalStaleCountries: entityList(block?.criticalStaleCountries),
    criticalMissingCountries: count(block?.criticalMissingCountries),
    criticalOldestObservedAt,
    criticalOldestObservedCountry: typeof block?.criticalOldestObservedCountry === "string" ? block.criticalOldestObservedCountry.slice(0, 8) : null,
    criticalOldestAgeMinutes: criticalAgeMinutes,
    // Compare raw milliseconds inclusively. The producer treats exactly-at-
    // budget as stale; rounded minutes would accept up to 29,999ms over.
    contentStale: usable ? criticalFreshCount < criticalCountries.length || criticalAgeMs === null || criticalAgeMs < 0 || budgetMs !== null && criticalAgeMs >= budgetMs : false
  };
}
function projectContentFreshnessForWire(assessment) {
  if (!assessment) return null;
  const { fieldPresent: _fieldPresent, ...wire } = assessment;
  return wire;
}
function getRedisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}
function readExistsFlags(results, keys) {
  const states = /* @__PURE__ */ new Map();
  if (!Array.isArray(results) || results.length !== keys.length) return states;
  for (let i = 0; i < keys.length; i++) {
    const entry = results[i];
    if (!entry || typeof entry !== "object" || Array.isArray(entry) || Object.prototype.hasOwnProperty.call(entry, "error") || !Object.prototype.hasOwnProperty.call(entry, "result")) {
      continue;
    }
    if (entry.result === 1 || entry.result === "1") states.set(keys[i], true);
    else if (entry.result === 0 || entry.result === "0") states.set(keys[i], false);
  }
  return states;
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
var config = { runtime: "edge" };
var RESILIENCE_INTERVAL_KEY_PREFIX = "resilience:intervals:v11:";
var RESILIENCE_INTERVAL_MIN_RECORD_COUNT = 180;
var RESILIENCE_INTERVAL_METHODOLOGY = "weight-perturbation-sensitivity-v3";
var RESILIENCE_INTERVAL_SOURCE_VERSION = `resilience-intervals:${RESILIENCE_INTERVAL_KEY_PREFIX}${RESILIENCE_INTERVAL_METHODOLOGY}`;
var RESILIENCE_INTERVAL_PROBE_KEY = `${RESILIENCE_INTERVAL_KEY_PREFIX}US`;
var RESILIENCE_INTERVAL_SCORE_MIN = 0;
var RESILIENCE_INTERVAL_SCORE_MAX = 100;
var CHINA_DECISION_SIGNAL_GROUP_IDS = Object.freeze([
  "macro",
  "policy-enforcement",
  "cross-strait-activity",
  "corporate-disclosures",
  "corridor-conditions",
  "activity-nowcast"
]);
var CHINA_DECISION_SIGNAL_STATES = /* @__PURE__ */ new Set([
  "available",
  "partial",
  "stale",
  "unavailable"
]);
var CHINA_DECISION_HEALTHY_QUIET_CAUSE = "healthy_quiet_window";
var SEED_DOMAINS = {
  "health:china-coverage": { key: "seed-meta:health:china-coverage", intervalMin: 60, activationKey: "seed-activated:health:china-coverage" },
  // Phase 1 — Snapshot endpoints
  "seismology:earthquakes": { key: "seed-meta:seismology:earthquakes", intervalMin: 15 },
  "wildfire:fires": { key: "seed-meta:wildfire:fires", intervalMin: 60 },
  "infra:outages": { key: "seed-meta:infra:outages", intervalMin: 15 },
  "climate:anomalies": { key: "seed-meta:climate:anomalies", intervalMin: 120 },
  "climate:disasters": { key: "seed-meta:climate:disasters", intervalMin: 360 },
  "climate:zone-normals": { key: "seed-meta:climate:zone-normals", intervalMin: 44640 },
  "climate:co2-monitoring": { key: "seed-meta:climate:co2-monitoring", intervalMin: 1440 },
  // daily cron; health.js maxStaleMin:4320 (3x) is intentionally higher — it's an alarm threshold, not the cron cadence
  "climate:ocean-ice": { key: "seed-meta:climate:ocean-ice", intervalMin: 1440 },
  // daily cron; health.js maxStaleMin:2880 (2x) tolerates one missed run
  "climate:news-intelligence": { key: "seed-meta:climate:news-intelligence", intervalMin: 30 },
  // #4920 completeness measurement — both run in the daily feed-validation
  // GitHub Actions workflow (00:00 UTC), not Railway. 1440-min cadence;
  // classifier stales at intervalMin*2 = one fully missed day.
  // activationKey (#4927 review P1 + re-review): published from GH Actions
  // only when the operator has added the UPSTASH secrets. 'missing' reads
  // as pending-activation (healthy) ONLY while the durable activation
  // marker is absent — publishers SET it with no TTL on first success, so
  // "has ever published" survives the 7d seed-meta TTL and a dead
  // publisher alarms as missing/stale instead of reverting to pending.
  "news:feed-health": { key: "seed-meta:news:feed-health", intervalMin: 1440, activationKey: "seed-activated:news:feed-health" },
  "news:recall-benchmark": { key: "seed-meta:news:recall-benchmark", intervalMin: 1440, activationKey: "seed-activated:news:recall-benchmark" },
  // Phase 2 — Parameterized endpoints
  "unrest:events": { key: "seed-meta:unrest:events", intervalMin: 15 },
  "cyber:threats": { key: "seed-meta:cyber:threats", intervalMin: 240 },
  "market:crypto": { key: "seed-meta:market:crypto", intervalMin: 15 },
  "market:hyperliquid-flow": { key: "seed-meta:market:hyperliquid-flow", intervalMin: 5 },
  // Railway cron 5min via seed-bundle-market-backup
  "market:etf-flows": { key: "seed-meta:market:etf-flows", intervalMin: 30 },
  // The bundle polls every 30min, but seed-health classifies at intervalMin*2.
  // Use half of /api/health's 180min alarm budget so both operator surfaces agree.
  "market:china-corporate-disclosures": { key: "seed-meta:market:china-corporate-disclosures", intervalMin: 90 },
  // Same halving rule against /api/health's 180min budget; the bundle polls
  // this member hourly, so 90min still tolerates one missed run.
  "market:china-stock-connect": { key: "seed-meta:market:china-stock-connect", intervalMin: 90 },
  "market:gulf-quotes": { key: "seed-meta:market:gulf-quotes", intervalMin: 15 },
  "market:stablecoins": { key: "seed-meta:market:stablecoins", intervalMin: 30 },
  "shared:fx-rates": { key: "seed-meta:shared:fx-rates", intervalMin: 1800 },
  // 60h staleness budget in api/health.js
  // Phase 3 — Hybrid endpoints
  "natural:events": { key: "seed-meta:natural:events", intervalMin: 270 },
  "weather:hko-warnings": { key: "seed-meta:weather:hko-warnings", intervalMin: 270 },
  "displacement:summary": { key: "seed-meta:displacement:summary", intervalMin: 360 },
  "economic:energy-prices": { key: "seed-meta:economic:energy-prices", intervalMin: 75 },
  // Independent hourly producer from scripts/seed-fred-rates.mjs. This
  // operator-only endpoint stays strict; api/health.js owns the bounded
  // deploy-before-provisioning window for public health.
  "economic:fred-rates": { key: "seed-meta:economic:fred-rates", intervalMin: 60, minRecordCount: 24 },
  // Aligned with health.js SEED_META (intervalMin = maxStaleMin / 2)
  "market:stocks": { key: "seed-meta:market:stocks", intervalMin: 15 },
  "market:commodities": { key: "seed-meta:market:commodities", intervalMin: 15 },
  "market:gold-extended": { key: "seed-meta:market:gold-extended", intervalMin: 15 },
  "market:gold-etf-flows": { key: "seed-meta:market:gold-etf-flows", intervalMin: 1440 },
  // maxStaleMin in health.js is 44640 (~31 days; IMF IFS is monthly w/ 2-3mo lag).
  // This endpoint flags stale at intervalMin*2, so keep intervalMin = 22320 to match.
  "market:gold-cb-reserves": { key: "seed-meta:market:gold-cb-reserves", intervalMin: 22320 },
  "market:sectors": { key: "seed-meta:market:sectors", intervalMin: 15 },
  "aviation:faa": { key: "seed-meta:aviation:faa", intervalMin: 45 },
  "news:insights": { key: "seed-meta:news:insights", intervalMin: 15 },
  // #6263: the sibling of news:insights above, and registered on the same
  // terms. Hourly tail LLM stage in seed-forecasts; intervalMin*2 = 120min,
  // the api/health.js marketImplications budget. Both keys also carry a
  // `synthesisFailure` contract in api/health.js that escalates on consecutive
  // misses — this endpoint models neither key's streak, so within the 120min
  // window it reports `ok` where /api/health may already report SEED_ERROR.
  // That is the same coarse-vs-detailed split news:insights has always had,
  // not a new divergence: the producer holds `fetchedAt` at the vintage it is
  // still serving, so a stage that stops entirely still ages into `stale` here
  // on exactly the budget above.
  "intelligence:market-implications": { key: "seed-meta:intelligence:market-implications", intervalMin: 60 },
  "positive-events:geo": { key: "seed-meta:positive-events:geo", intervalMin: 30 },
  "intelligence:risk-scores": { key: "seed-meta:intelligence:risk-scores", intervalMin: 15 },
  // CII warm-ping every 8min; intervalMin*2 = 30min, aligned with api/health.js riskScores.
  "conflict:iran-events": { key: "seed-meta:conflict:iran-events", intervalMin: 5040 },
  "conflict:ucdp-events": { key: "seed-meta:conflict:ucdp-events", intervalMin: 210 },
  "conflict:acled-intel": { key: "seed-meta:conflict:acled-intel", intervalMin: 19 },
  "weather:alerts": { key: "seed-meta:weather:alerts", intervalMin: 15 },
  "economic:spending": { key: "seed-meta:economic:spending", intervalMin: 60 },
  "intelligence:gpsjam": { key: "seed-meta:intelligence:gpsjam", intervalMin: 720 },
  // 720 × 2 = 1440min (24h) staleness; matches api/health.js gpsjam.maxStaleMin. Widened from 360 (12h) on 2026-04-29 alongside Wingbits API quota incident — see PR #3494 + the seeder graceful-failure path at scripts/fetch-gpsjam.mjs:258-262.
  "intelligence:satellites": { key: "seed-meta:intelligence:satellites", intervalMin: 90 },
  "military:flights": { key: "seed-meta:military:flights", intervalMin: 8 },
  "military:cross-strait-activity": { key: "seed-meta:military:cross-strait-activity", intervalMin: 180 },
  "military:cross-strait-activity-bootstrap": { key: "seed-meta:military:cross-strait-activity-bootstrap", intervalMin: 180 },
  "military:cross-strait-activity:complete": { key: "seed-meta:military:cross-strait-activity:complete", intervalMin: 180 },
  "military:cross-strait-activity:taiwan-mnd": { key: "seed-meta:military:cross-strait-activity:taiwan-mnd", intervalMin: 180 },
  "military:cross-strait-activity:japan-mod": { key: "seed-meta:military:cross-strait-activity:japan-mod", intervalMin: 180 },
  "military:defense-patents": { key: "seed-meta:military:defense-patents", intervalMin: 12600 },
  "military-forecast-inputs": { key: "seed-meta:military-forecast-inputs", intervalMin: 8 },
  "military-surges": { key: "seed-meta:military-surges", intervalMin: 8 },
  "infra:service-statuses": { key: "seed-meta:infra:service-statuses", intervalMin: 60 },
  "supply_chain:shipping": { key: "seed-meta:supply_chain:shipping", intervalMin: 120 },
  "supply_chain:chokepoints": { key: "seed-meta:supply_chain:chokepoints", intervalMin: 30 },
  // 60d static-ref bundle (intervalMin*2 = 120d, matching api/health.js maxStaleMin).
  // minRecordCount tracks minStagedCommodities() in scripts/seed-mineral-production.mjs
  // (ceil(14 * 0.7)); api/ cannot import from scripts/, so bump both together when
  // scripts/shared/mineral-commodities.json gains or loses a commodity.
  "supply-chain:mineral-production": { key: "seed-meta:supply-chain:mineral-production", intervalMin: 86400, minRecordCount: 10 },
  "cable-health": { key: "seed-meta:cable-health", intervalMin: 30 },
  "infrastructure:submarine-cables": { key: "seed-meta:infrastructure:submarine-cables", intervalMin: 12600 },
  "prediction:markets": {
    key: "seed-meta:prediction:markets",
    intervalMin: 8,
    minRecordCount: 20,
    // Mirrors api/health.js (#5875). A one-market floor detects an empty pool
    // without asserting that a naturally quiet category must sustain volume.
    minPoolCounts: PREDICTION_MARKET_MIN_POOL_COUNTS
  },
  "aviation:intl": { key: "seed-meta:aviation:intl", intervalMin: 45 },
  // intervalMin*2 = 90min staleness. seed-aviation's freshness gate (AVIATIONSTACK_MIN_REFRESH_MIN, default 55) lets fetchedAt age to ~55+cron between paid fetches; 90min matches the aviation:faa sibling + api/health.js intlDelays maxStaleMin:90. Was 15 (30min) and false-WARNed every cycle once the gate landed.
  "theater-posture": { key: "seed-meta:theater-posture", intervalMin: 8 },
  "economic:worldbank-techreadiness": { key: "seed-meta:economic:worldbank-techreadiness:v1", intervalMin: 5040 },
  "economic:worldbank-progress": { key: "seed-meta:economic:worldbank-progress:v1", intervalMin: 5040 },
  "economic:worldbank-renewable": { key: "seed-meta:economic:worldbank-renewable:v1", intervalMin: 5040 },
  "economic:bis-extended": { key: "seed-meta:economic:bis-extended", intervalMin: 720 },
  // 12h Railway cron; "seeder ran" aggregate — per-dataset freshness lives below
  "economic:china-macro": { key: "seed-meta:economic:china-macro-transport", intervalMin: 2160 },
  "economic:china-release-calendar": { key: "seed-meta:economic:china-release-calendar", intervalMin: 2160 },
  "china:policy-events": { key: "seed-meta:china:policy-events", intervalMin: 360 },
  "intelligence:china-decision-signals": { key: "seed-meta:intelligence:china-decision-signals", intervalMin: 30, minRecordCount: 6 },
  "economic:bis-dsr": { key: "seed-meta:economic:bis-dsr", intervalMin: 720 },
  // 12h cron; only written when DSR slice fetched fresh entries
  "economic:bis-property-residential": { key: "seed-meta:economic:bis-property-residential", intervalMin: 720 },
  // 12h cron; only written when SPP slice fetched fresh entries
  "economic:bis-property-commercial": { key: "seed-meta:economic:bis-property-commercial", intervalMin: 720 },
  // 12h cron; only written when CPP slice fetched fresh entries
  "economic:cbr-rates": { key: "seed-meta:economic:cbr-rates", intervalMin: 1440, minRecordCount: 31 },
  // daily cron (seed-bundle-macro); api/health.js maxStaleMin 4320 = 3x. minRecordCount mirrors MIN_RATE_COUNT (30) + the key rate.
  "research:tech-events": { key: "seed-meta:research:tech-events", intervalMin: 240 },
  "research:arxiv-hn-trending": { key: "seed-meta:research:arxiv-hn-trending", intervalMin: 75 },
  "intelligence:gdelt-intel": { key: "seed-meta:intelligence:gdelt-intel", intervalMin: 23 },
  // 15min materializer cron (#5863); intervalMin = maxStaleMin / 2 (45 / 2), matching api/health.js — was 210 against the retired 4h DOC cron.
  "correlation:cards": { key: "seed-meta:correlation:cards", intervalMin: 5 },
  "intelligence:advisories": { key: "seed-meta:intelligence:advisories", intervalMin: 60 },
  // Corporate intelligence (#5695): intervalMin = maxStaleMin / 2 (api/health.js: 2880 / 120).
  "intelligence:sec-cik-map": { key: "seed-meta:intelligence:sec-cik-map", intervalMin: 1440, minRecordCount: 5e3 },
  "intelligence:sec-8k-stream": { key: "seed-meta:intelligence:sec-8k-stream", intervalMin: 60, minRecordCount: 50 },
  "intelligence:social-reddit": { key: "seed-meta:intelligence:social-reddit", intervalMin: 270 },
  // 180min relay loop (3h; dropped from 60min now that ScrapeCreators handles Reddit); intervalMin = maxStaleMin / 2 (540 / 2), matching api/health.js
  "intelligence:wsb-tickers": { key: "seed-meta:intelligence:wsb-tickers", intervalMin: 270 },
  // 180min relay loop (3h); intervalMin = maxStaleMin / 2 (540 / 2), matching api/health.js
  "trade:customs-revenue": { key: "seed-meta:trade:customs-revenue", intervalMin: 720 },
  "comtrade:bilateral-hs4": { key: "seed-meta:comtrade:bilateral-hs4", intervalMin: 25200, minRecordCount: 110 },
  // intervalMin*2 = health.js 35d budget for the monthly Railway seed; minRecordCount matches api/health.js + MIN_COUNTRY_COVERAGE
  "thermal:escalation": { key: "seed-meta:thermal:escalation", intervalMin: 180 },
  "radiation:observations": { key: "seed-meta:radiation:observations", intervalMin: 15 },
  "sanctions:pressure": { key: "seed-meta:sanctions:pressure", intervalMin: 360 },
  "sanctions:entities": { key: "seed-meta:sanctions:entities", intervalMin: 360 },
  "health:air-quality": { key: "seed-meta:health:air-quality", intervalMin: 60 },
  // hourly cron (shared seeder writes health + climate keys)
  "economic:grocery-basket": { key: "seed-meta:economic:grocery-basket", intervalMin: 5040 },
  // weekly seed; intervalMin = maxStaleMin / 2
  "economic:bigmac": { key: "seed-meta:economic:bigmac", intervalMin: 5040 },
  // weekly seed; intervalMin = maxStaleMin / 2
  "resilience:static": { key: "seed-meta:resilience:static", intervalMin: 288e3 },
  // annual October snapshot; intervalMin = health.js maxStaleMin / 2 (400d alert threshold)
  "resilience:food-stocks": { key: "seed-meta:resilience:food-stocks", intervalMin: 43200 },
  // monthly WASDE; intervalMin = health.js maxStaleMin / 2 (86400 / 2)
  "resilience:education-attainment": {
    key: "seed-meta:resilience:education-attainment",
    intervalMin: 5760,
    // 11520min /api/health budget expressed as intervalMin * 2.
    minRankableRecordCount: EDUCATION_MIN_RANKABLE_RECORD_COUNT,
    dataProbe: {
      key: "resilience:education-attainment:v1",
      kind: "education_coverage",
      minRankableRecordCount: EDUCATION_MIN_RANKABLE_RECORD_COUNT
    }
  },
  "resilience:intervals": {
    key: "seed-meta:resilience:intervals",
    intervalMin: 420,
    // Same 840min freshness budget as api/health.js, expressed as intervalMin * 2.
    minRecordCount: RESILIENCE_INTERVAL_MIN_RECORD_COUNT,
    dataProbe: {
      key: RESILIENCE_INTERVAL_PROBE_KEY,
      kind: "resilience_interval",
      methodology: RESILIENCE_INTERVAL_METHODOLOGY,
      formula: currentResilienceCacheFormula(),
      educationState: currentResilienceEducationState(),
      sourceVersion: RESILIENCE_INTERVAL_SOURCE_VERSION
    }
  },
  "regulatory:actions": { key: "seed-meta:regulatory:actions", intervalMin: 120 },
  // 2h cron; intervalMin = maxStaleMin / 3
  "economic:owid-energy-mix": { key: "seed-meta:economic:owid-energy-mix", intervalMin: 25200 },
  // monthly cron on 1st; intervalMin = health.js maxStaleMin / 2 (50400 / 2)
  "economic:fao-ffpi": { key: "seed-meta:economic:fao-ffpi", intervalMin: 43200 },
  // monthly seed; intervalMin = health.js maxStaleMin / 2 (86400 / 2)
  "economic:imf-growth": { key: "seed-meta:economic:imf-growth", intervalMin: 50400 },
  // monthly WEO seed; intervalMin = health.js maxStaleMin / 2 (100800 / 2)
  "economic:imf-labor": { key: "seed-meta:economic:imf-labor", intervalMin: 50400 },
  // monthly WEO seed; intervalMin = health.js maxStaleMin / 2 (100800 / 2)
  "economic:imf-external": { key: "seed-meta:economic:imf-external", intervalMin: 50400 },
  // monthly WEO seed; intervalMin = health.js maxStaleMin / 2 (100800 / 2)
  // plan 2026-04-25-004 Phase 2: financialSystemExposure component seeders.
  // intervalMin = health.js maxStaleMin / 2 (mirrors the IMF-pattern). Bundle: scripts/seed-bundle-macro.mjs.
  "economic:wb-external-debt": { key: "seed-meta:economic:wb-external-debt", intervalMin: 50400 },
  // annual WB IDS publication; intervalMin = health.js maxStaleMin / 2 (100800 / 2)
  "economic:bis-lbs": { key: "seed-meta:economic:bis-lbs", intervalMin: 7200 },
  // BIS LBS quarterly; intervalMin = health.js maxStaleMin / 2 (14400 / 2)
  "economic:fatf-listing": { key: "seed-meta:economic:fatf-listing", intervalMin: 30240 },
  // FATF plenary 3×/year; intervalMin = health.js maxStaleMin / 2 (60480 / 2)
  "product-catalog": { key: "seed-meta:product-catalog", intervalMin: 360 },
  // relay loop every 6h; intervalMin = health.js maxStaleMin / 3 (1080 / 3)
  "portwatch:chokepoints-ref": { key: "seed-meta:portwatch:chokepoints-ref", intervalMin: 10080 },
  "portwatch:disruptions": { key: "seed-meta:portwatch:disruptions", intervalMin: 75 },
  // active disruptions seed; intervalMin*2 = 150min matches api/health.js
  // #6060: mirror /api/health's decision-critical content contract. The
  // heartbeat and 174-country cardinality can both be green while CN/HK's
  // cached observations are older than the corridor adapter's 144h budget.
  "supply_chain:portwatch-ports": {
    key: "seed-meta:supply_chain:portwatch-ports",
    intervalMin: 720,
    minRecordCount: 174,
    requireContentFreshness: { countries: ["CN", "HK"], budgetMinutes: 2 * 72 * 60 },
    contentFreshnessActivationKey: PORTWATCH_CONTENT_FRESHNESS_ACTIVATION_KEY
  },
  // 12h cron (0 */12 * * *); intervalMin = maxStaleMin / 3 (2160 / 3); #3613 requires 174-country coverage before OK.
  "energy:chokepoint-flows": { key: "seed-meta:energy:chokepoint-flows", intervalMin: 360 },
  // 6h relay loop; intervalMin = maxStaleMin / 2 (720 / 2)
  "energy:eia-petroleum": { key: "seed-meta:energy:eia-petroleum", intervalMin: 1440 },
  // daily bundle cron; intervalMin*3 = health.js maxStaleMin (4320)
  "energy:spine": { key: "seed-meta:energy:spine", intervalMin: 1440 },
  // daily cron (0 6 * * *); intervalMin = maxStaleMin / 2 (2880 / 2)
  "energy:ember": { key: "seed-meta:energy:ember", intervalMin: 1440 },
  // daily cron (0 8 * * *); intervalMin = maxStaleMin / 2 (2880 / 2)
  "energy:spr-policies": { key: "seed-meta:energy:spr-policies", intervalMin: 288e3 },
  // annual static registry; intervalMin = health.js maxStaleMin / 2 (576000 / 2)
  "energy:pipelines-gas": { key: "seed-meta:energy:pipelines-gas", intervalMin: 10080 },
  // weekly cron (7d); intervalMin = health.js maxStaleMin / 2 (20160 / 2)
  "energy:pipelines-oil": { key: "seed-meta:energy:pipelines-oil", intervalMin: 10080 },
  // weekly cron; same seeder writes both keys
  "energy:storage-facilities": { key: "seed-meta:energy:storage-facilities", intervalMin: 10080 },
  // weekly cron (7d); intervalMin = health.js maxStaleMin / 2 (20160 / 2)
  "energy:fuel-shortages": { key: "seed-meta:energy:fuel-shortages", intervalMin: 1440 },
  // daily cron; intervalMin = health.js maxStaleMin / 2 (2880 / 2)
  "energy:disruptions": { key: "seed-meta:energy:disruptions", intervalMin: 10080 },
  // weekly cron; intervalMin = health.js maxStaleMin / 2 (20160 / 2)
  "market:aaii-sentiment": { key: "seed-meta:market:aaii-sentiment", intervalMin: 10080 },
  // weekly cron; intervalMin = maxStaleMin / 2 (20160 / 2)
  "intelligence:regional-briefs": { key: "seed-meta:intelligence:regional-briefs", intervalMin: 10080 },
  // weekly cron; intervalMin = health.js maxStaleMin / 2 (20160 / 2)
  "economic:eurostat-house-prices": { key: "seed-meta:economic:eurostat-house-prices", intervalMin: 36e3 },
  // weekly cron, annual data; intervalMin = health.js maxStaleMin / 2 (72000 / 2)
  "economic:eurostat-gov-debt-q": { key: "seed-meta:economic:eurostat-gov-debt-q", intervalMin: 10080 },
  // 2d cron, quarterly data; intervalMin = health.js maxStaleMin / 2 (20160 / 2)
  "economic:eurostat-industrial-production": { key: "seed-meta:economic:eurostat-industrial-production", intervalMin: 3600 },
  // daily cron, monthly data; intervalMin = health.js maxStaleMin / 2 (7200 / 2)
  "resilience:recovery:reexport-share": { key: "seed-meta:resilience:recovery:reexport-share", intervalMin: 43200 },
  // monthly bundle cron (30d); intervalMin*2 = 60d matches health.js maxStaleMin
  "resilience:recovery:sovereign-wealth": { key: "seed-meta:resilience:recovery:sovereign-wealth", intervalMin: 43200 },
  // monthly bundle cron (30d); intervalMin*2 = 60d matches health.js maxStaleMin
  // #5736 — historical-intelligence ingest health. Distinct from each
  // collector's own seed key above: scripts/_seed-history.mjs appends to the
  // Convex intel-history store fail-open, so a permanently broken relay leg
  // used to leave the collector green and the store empty. `fetchedAt` on these
  // keys is the last HEALTHY append, so a prolonged rejection reads `stale`
  // here while the collector stays `ok`; `sourceState: 'unavailable'` reports
  // an un-provisioned relay as `not_configured` rather than an eternal warn.
  // activationKey: the record only exists after the collector's next Railway
  // tick, so absence before the first report is pending-activation, not a
  // degraded 503. intervalMin*2 mirrors api/health.js maxStaleMin.
  "intel-history:conflict:acled-intel": {
    key: "seed-meta:intel-history:conflict:acled-intel",
    intervalMin: 19,
    activationKey: "seed-activated:intel-history:conflict:acled-intel"
  },
  "intel-history:military:cross-strait-activity": {
    key: "seed-meta:intel-history:military:cross-strait-activity",
    intervalMin: 360,
    activationKey: "seed-activated:intel-history:military:cross-strait-activity"
  },
  "intel-history:energy:intelligence": {
    key: "seed-meta:intel-history:energy:intelligence",
    intervalMin: 360,
    activationKey: "seed-activated:intel-history:energy:intelligence"
  }
};
if ((process.env.IRAN_EVENTS_ENABLED ?? "false").toLowerCase() !== "true") {
  delete SEED_DOMAINS["conflict:iran-events"];
}
function parseJsonValue(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function parseFiniteRecordCount(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function isEnabledEnv(name, defaultValue) {
  return String(process.env[name] ?? defaultValue).toLowerCase() === "true";
}
function isResiliencePillarCombineEnabled() {
  return process.env.RESILIENCE_PILLAR_COMBINE_ENABLED?.trim().toLowerCase() !== "false";
}
function currentResilienceCacheFormula() {
  return isResiliencePillarCombineEnabled() && isEnabledEnv("RESILIENCE_SCHEMA_V2_ENABLED", "true") ? "pc" : "d6";
}
function currentResilienceEducationState() {
  return isEnabledEnv("RESILIENCE_EDUCATION_ENABLED", "true") ? "education-on" : "education-off";
}
function isValidResilienceIntervalPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  if (typeof payload.p05 !== "number" || !Number.isFinite(payload.p05)) return false;
  if (typeof payload.p95 !== "number" || !Number.isFinite(payload.p95)) return false;
  return payload.p05 >= RESILIENCE_INTERVAL_SCORE_MIN && payload.p05 <= RESILIENCE_INTERVAL_SCORE_MAX && payload.p95 >= RESILIENCE_INTERVAL_SCORE_MIN && payload.p95 <= RESILIENCE_INTERVAL_SCORE_MAX && payload.p05 <= payload.p95;
}
function evaluateDataProbe(cfg, raw) {
  if (!cfg) return null;
  const requiredFormula = cfg.kind === "resilience_interval" ? currentResilienceCacheFormula() : cfg.formula ?? null;
  const requiredEducationState = cfg.kind === "resilience_interval" ? currentResilienceEducationState() : cfg.educationState ?? null;
  if (!raw) {
    return {
      ok: false,
      status: "data_missing",
      key: cfg.key,
      requiredMethodology: cfg.methodology ?? null,
      requiredSourceVersion: cfg.sourceVersion ?? null,
      requiredFormula,
      requiredEducationState
    };
  }
  const parsed = unwrapEnvelope(parseJsonValue(raw)).data;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      status: "data_invalid",
      key: cfg.key,
      requiredMethodology: cfg.methodology ?? null,
      requiredSourceVersion: cfg.sourceVersion ?? null,
      requiredFormula,
      requiredEducationState
    };
  }
  const methodology = typeof parsed.methodology === "string" ? parsed.methodology : null;
  const formula = typeof parsed._formula === "string" ? parsed._formula : null;
  const educationState = typeof parsed._educationState === "string" ? parsed._educationState : null;
  if (cfg.kind === "education_coverage") {
    const rankableRecordCount = parseEducationPayloadRankableRecordCount(parsed);
    const ok = rankableRecordCount != null && rankableRecordCount >= cfg.minRankableRecordCount;
    return {
      ok,
      status: ok ? "ok" : "coverage_partial",
      key: cfg.key,
      rankableRecordCount,
      minRankableRecordCount: cfg.minRankableRecordCount
    };
  }
  if (cfg.methodology && methodology !== cfg.methodology) {
    return {
      ok: false,
      status: "methodology_mismatch",
      key: cfg.key,
      methodology,
      formula,
      requiredMethodology: cfg.methodology,
      requiredSourceVersion: cfg.sourceVersion ?? null,
      requiredFormula,
      educationState,
      requiredEducationState
    };
  }
  if (requiredFormula && formula !== requiredFormula) {
    return {
      ok: false,
      status: "formula_mismatch",
      key: cfg.key,
      formula,
      requiredFormula,
      educationState,
      requiredEducationState,
      methodology,
      requiredMethodology: cfg.methodology ?? null,
      requiredSourceVersion: cfg.sourceVersion ?? null
    };
  }
  const educationStateMatches = educationState === requiredEducationState;
  if (requiredEducationState && !educationStateMatches) {
    return {
      ok: false,
      status: "construct_mismatch",
      key: cfg.key,
      formula,
      requiredFormula,
      educationState,
      requiredEducationState,
      methodology,
      requiredMethodology: cfg.methodology ?? null,
      requiredSourceVersion: cfg.sourceVersion ?? null
    };
  }
  if (cfg.kind === "resilience_interval" && !isValidResilienceIntervalPayload(parsed)) {
    return {
      ok: false,
      status: "data_invalid",
      key: cfg.key,
      formula,
      requiredFormula,
      educationState,
      requiredEducationState,
      methodology,
      requiredMethodology: cfg.methodology ?? null,
      requiredSourceVersion: cfg.sourceVersion ?? null,
      p05: typeof parsed.p05 === "number" && Number.isFinite(parsed.p05) ? parsed.p05 : null,
      p95: typeof parsed.p95 === "number" && Number.isFinite(parsed.p95) ? parsed.p95 : null
    };
  }
  return {
    ok: true,
    status: "ok",
    key: cfg.key,
    methodology,
    requiredMethodology: cfg.methodology ?? null,
    requiredSourceVersion: cfg.sourceVersion ?? null,
    formula,
    requiredFormula,
    educationState,
    requiredEducationState,
    computedAt: typeof parsed.computedAt === "string" ? parsed.computedAt : null
  };
}
async function getSeedBatch(entries) {
  const commands = [];
  const metaSlots = [];
  const probeSlots = [];
  const activationSlots = [];
  const contentFreshnessActivationSlots = [];
  for (const [domain, cfg] of entries) {
    metaSlots.push({ domain, key: cfg.key, index: commands.length });
    commands.push(["GET", cfg.key]);
    if (cfg.dataProbe?.key) {
      probeSlots.push({ domain, index: commands.length });
      commands.push(["GET", cfg.dataProbe.key]);
    }
    if (cfg.activationKey) {
      activationSlots.push({ domain, index: commands.length });
      commands.push(["EXISTS", cfg.activationKey]);
    }
    if (cfg.contentFreshnessActivationKey) {
      contentFreshnessActivationSlots.push({ domain, index: commands.length });
      commands.push(["EXISTS", cfg.contentFreshnessActivationKey]);
    }
  }
  const data = await redisPipeline(commands, 3e3);
  if (!data) throw new Error("Redis not configured");
  const metaMap = /* @__PURE__ */ new Map();
  const probeMap = /* @__PURE__ */ new Map();
  for (const slot of metaSlots) {
    const raw = data[slot.index]?.result;
    if (raw) {
      const parsed = parseJsonValue(raw);
      if (parsed) metaMap.set(slot.key, parsed);
    }
  }
  for (const slot of probeSlots) {
    probeMap.set(slot.domain, data[slot.index]?.result ?? null);
  }
  const activatedMap = readExistsFlags(
    activationSlots.map((slot) => data[slot.index]),
    activationSlots.map((slot) => slot.domain)
  );
  const contentFreshnessActivatedMap = readExistsFlags(
    contentFreshnessActivationSlots.map((slot) => data[slot.index]),
    contentFreshnessActivationSlots.map((slot) => slot.domain)
  );
  return { metaMap, probeMap, activatedMap, contentFreshnessActivatedMap };
}
async function handleSeedHealth(req, options = {}) {
  const hasInjectedClock = Object.hasOwn(options, "now");
  const now = hasInjectedClock ? options.now : Date.now();
  if (isDisallowedOrigin(req))
    return new Response("Forbidden", { status: 403 });
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  const apiKeyResult = await validateApiKey(req, { forceKey: true });
  if (!apiKeyResult.valid || apiKeyResult.kind !== "enterprise")
    return jsonResponse({ error: "Operator API key required" }, 401, cors);
  const entries = Object.entries(SEED_DOMAINS);
  let metaMap;
  let activatedMap = /* @__PURE__ */ new Map();
  let contentFreshnessActivatedMap = /* @__PURE__ */ new Map();
  let probeMap;
  try {
    ({ metaMap, probeMap, activatedMap, contentFreshnessActivatedMap } = await getSeedBatch(entries));
  } catch {
    return jsonResponse({ error: "Redis unavailable" }, 503, cors);
  }
  const evaluationNow = hasInjectedClock ? now : Date.now();
  const seeds = {};
  let staleCount = 0;
  let missingCount = 0;
  for (const [domain, cfg] of entries) {
    const meta = metaMap.get(cfg.key);
    const maxStalenessMs = cfg.intervalMin * 2 * 60 * 1e3;
    const activationUnknown = cfg.activationKey && !activatedMap.has(domain) || cfg.contentFreshnessActivationKey && !contentFreshnessActivatedMap.has(domain);
    if (!meta) {
      if (cfg.activationKey && activatedMap.get(domain) !== true) {
        seeds[domain] = { status: "pending-activation", fetchedAt: null, recordCount: null, stale: false };
        if (activationUnknown) seeds[domain].activationUnknown = true;
        continue;
      }
      seeds[domain] = { status: "missing", fetchedAt: null, recordCount: null, stale: true };
      if (cfg.minRecordCount != null) seeds[domain].minRecordCount = cfg.minRecordCount;
      if (cfg.minRankableRecordCount != null) seeds[domain].minRankableRecordCount = cfg.minRankableRecordCount;
      if (cfg.minPoolCounts) seeds[domain].minPoolCounts = cfg.minPoolCounts;
      missingCount++;
      continue;
    }
    const ageMs = evaluationNow - (meta.fetchedAt || 0);
    const recordCount = parseFiniteRecordCount(meta.recordCount);
    const rankableRecordCount = parseRankableRecordCount(meta);
    const poolCounts = parsePoolCounts(meta.poolCounts, cfg.minPoolCounts);
    const recordCoveragePartial = cfg.minRecordCount != null && (recordCount == null || recordCount < cfg.minRecordCount);
    const rankableCoveragePartial = cfg.minRankableRecordCount != null && (rankableRecordCount == null || rankableRecordCount < cfg.minRankableRecordCount);
    const poolCoveragePartial = hasPoolCoverageShortfall(poolCounts, cfg.minPoolCounts);
    const coveragePartial = recordCoveragePartial || rankableCoveragePartial || poolCoveragePartial;
    const sourceUnavailable = meta.sourceState === "unavailable";
    const sourceBlocked = domain === "military:cross-strait-activity:japan-mod" && meta.sourceState === "blocked" && recordCount != null && recordCount > 0;
    const sourceError = typeof meta.sourceState === "string" && meta.sourceState !== "ok" && !sourceUnavailable && !sourceBlocked;
    const isError = meta.status === "error" || sourceError;
    const probe = evaluateDataProbe(cfg.dataProbe, probeMap.get(domain));
    const sourceMismatch = Boolean(
      cfg.dataProbe?.sourceVersion && typeof meta.sourceVersion === "string" && meta.sourceVersion !== "" && meta.sourceVersion !== cfg.dataProbe.sourceVersion
    );
    const contentFreshness = buildContentFreshnessAssessment(
      meta,
      cfg.requireContentFreshness,
      evaluationNow
    );
    const contentFreshnessActivationWindow = contentFreshness && !contentFreshness.fieldPresent && cfg.contentFreshnessActivationKey ? getActiveContentFreshnessActivationWindow(
      cfg.contentFreshnessActivationKey,
      contentFreshnessActivatedMap.get(domain),
      evaluationNow
    ) : null;
    const contentFreshnessPending = contentFreshnessActivationWindow !== null;
    const contentFreshnessInvalid = Boolean(
      cfg.requireContentFreshness && contentFreshness && !contentFreshness.usable && !contentFreshnessPending
    );
    const contentFreshnessStale = Boolean(
      contentFreshness && contentFreshness.usable && contentFreshness.contentStale && !contentFreshnessPending
    );
    const freshnessStale = ageMs > maxStalenessMs;
    const stale = freshnessStale || recordCoveragePartial || rankableCoveragePartial || isError || sourceMismatch || probe?.ok === false || contentFreshnessInvalid || contentFreshnessStale;
    if (stale || poolCoveragePartial) staleCount++;
    seeds[domain] = {
      status: sourceUnavailable ? "not_configured" : isError ? "error" : sourceMismatch ? "source_version_mismatch" : probe?.ok === false ? probe.status : freshnessStale ? "stale" : coveragePartial ? "coverage_partial" : contentFreshnessInvalid ? "coverage_degraded" : contentFreshnessStale ? "stale_content" : sourceBlocked ? "source_blocked" : "ok",
      fetchedAt: meta.fetchedAt,
      recordCount: recordCount ?? meta.recordCount ?? null,
      sourceVersion: meta.sourceVersion || null,
      ageMinutes: Math.round(ageMs / 6e4),
      stale
    };
    if (cfg.minRecordCount != null) seeds[domain].minRecordCount = cfg.minRecordCount;
    if (cfg.minRankableRecordCount != null) {
      seeds[domain].rankableRecordCount = rankableRecordCount;
      seeds[domain].minRankableRecordCount = cfg.minRankableRecordCount;
    }
    if (cfg.minPoolCounts) seeds[domain].minPoolCounts = cfg.minPoolCounts;
    if (activationUnknown) seeds[domain].activationUnknown = true;
    if (poolCounts) seeds[domain].poolCounts = poolCounts;
    if (contentFreshnessActivationWindow) {
      seeds[domain].contentFreshnessPendingUntil = new Date(
        contentFreshnessActivationWindow.untilMs
      ).toISOString();
    }
    if (contentFreshness && !contentFreshnessPending) {
      seeds[domain].contentFreshness = projectContentFreshnessForWire(contentFreshness);
    }
    if (coveragePartial) seeds[domain].coveragePartial = true;
    if (probe) seeds[domain].dataProbe = probe;
    if (typeof meta.lastErrorCode === "string" && meta.lastErrorCode) {
      seeds[domain].lastErrorCode = meta.lastErrorCode;
    }
    if (domain === "intelligence:china-decision-signals") {
      const diagnostics = projectChinaDecisionGroupDiagnostics(meta, {
        groupIds: CHINA_DECISION_SIGNAL_GROUP_IDS,
        allowedStates: CHINA_DECISION_SIGNAL_STATES,
        healthyQuietCause: CHINA_DECISION_HEALTHY_QUIET_CAUSE
      });
      if (diagnostics) Object.assign(seeds[domain], diagnostics);
    }
  }
  const overall = missingCount > 0 ? "degraded" : staleCount > 0 ? "warning" : "healthy";
  const httpStatus = overall === "healthy" ? 200 : overall === "warning" ? 200 : 503;
  return jsonResponse({ overall, seeds, checkedAt: evaluationNow }, httpStatus, {
    ...cors,
    "Cache-Control": "no-cache"
  });
}
async function handler(req) {
  return handleSeedHealth(req);
}
export {
  config,
  handler as default,
  handleSeedHealth
};
