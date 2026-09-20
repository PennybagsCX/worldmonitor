// api/health.js
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
var CII_RISK_SCORE_CACHE_KEYS = Object.freeze({
  live: "risk:scores:sebuf:v8",
  stale: "risk:scores:sebuf:stale:v8",
  trendHistoryPrefix: "risk:scores:sebuf:trend-history:v8"
});
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
var config = { runtime: "edge" };
var RESILIENCE_INTERVAL_METHODOLOGY = "weight-perturbation-sensitivity-v3";
var RESILIENCE_INTERVAL_MIN_RECORD_COUNT = 180;
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
function assessResilienceCacheState(meta) {
  const formula = meta?._formula === "pc" || meta?._formula === "d6" ? meta._formula : null;
  const educationState = meta?._educationState === "education-on" || meta?._educationState === "education-off" ? meta._educationState : null;
  const intervalMethodology = meta?._intervalMethodology === RESILIENCE_INTERVAL_METHODOLOGY ? meta._intervalMethodology : null;
  const requiredFormula = currentResilienceCacheFormula();
  const requiredEducationState = currentResilienceEducationState();
  return {
    ok: formula === requiredFormula && educationState === requiredEducationState && intervalMethodology === RESILIENCE_INTERVAL_METHODOLOGY,
    formula,
    requiredFormula,
    educationState,
    requiredEducationState,
    intervalMethodology,
    requiredIntervalMethodology: RESILIENCE_INTERVAL_METHODOLOGY
  };
}
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
var HEALTH_VERDICT_SNAPSHOT_BASE_KEY = "health:verdict:v2";
function healthVerdictRedisKey(baseKey, vercelEnv, commitSha) {
  if (!vercelEnv || vercelEnv === "production") return baseKey;
  return `${vercelEnv}:${commitSha?.slice(0, 8) || "dev"}:${baseKey}`;
}
var HEALTH_VERDICT_SNAPSHOT_KEY = healthVerdictRedisKey(
  HEALTH_VERDICT_SNAPSHOT_BASE_KEY,
  process.env.VERCEL_ENV,
  process.env.VERCEL_GIT_COMMIT_SHA
);
var HEALTH_VERDICT_COMPACT_SNAPSHOT_BASE_KEY = "health:verdict:compact:v2";
var HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY = healthVerdictRedisKey(
  HEALTH_VERDICT_COMPACT_SNAPSHOT_BASE_KEY,
  process.env.VERCEL_ENV,
  process.env.VERCEL_GIT_COMMIT_SHA
);
var HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS = 60;
var CHINA_COVERAGE_SUMMARY_KEY = "health:china-coverage:v1";
var HEALTH_VERDICT_SNAPSHOT_TTL_MS = HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS * 1e3;
var HEALTH_VERDICT_REFRESH_LOCK_KEY = `${HEALTH_VERDICT_SNAPSHOT_KEY}:refresh-lock`;
var HEALTH_VERDICT_REFRESH_LOCK_TTL_SECONDS = 30;
var HEALTH_VERDICT_REFRESH_WAIT_ATTEMPTS = 45;
var HEALTH_VERDICT_REFRESH_WAIT_MS = 3e3;
var HEALTH_VERDICT_MIN_REDIS_TIMEOUT_MS = 100;
var RUNTIME_ROLLOUT_PENDING_POLICIES = Object.freeze({
  fredRatesSeeder: Object.freeze({
    deadlineKey: "health:rollout-deadline:economic:fred-rates:v1",
    durationMs: 24 * 60 * 60 * 1e3
  })
});
var FRED_RATES_ROLLOUT_DEADLINE_KEY = RUNTIME_ROLLOUT_PENDING_POLICIES.fredRatesSeeder.deadlineKey;
var FRED_RATES_ROLLOUT_DURATION_MS = RUNTIME_ROLLOUT_PENDING_POLICIES.fredRatesSeeder.durationMs;
var HEALTH_VERDICT_RELEASE_LOCK_SCRIPT = [
  "if redis.call('get', KEYS[1]) == ARGV[1] then",
  "  return redis.call('del', KEYS[1])",
  "end",
  "return 0"
].join("\n");
var IRAN_EVENTS_ENABLED = (process.env.IRAN_EVENTS_ENABLED ?? "false").toLowerCase() === "true";
var BOOTSTRAP_KEYS = {
  earthquakes: "seismology:earthquakes:v1",
  outages: "infra:outages:v1",
  sectors: "market:sectors:v2",
  etfFlows: "market:etf-flows:v1",
  climateAnomalies: "climate:anomalies:v2",
  climateDisasters: "climate:disasters:v1",
  climateAirQuality: "climate:air-quality:v1",
  co2Monitoring: "climate:co2-monitoring:v1",
  oceanIce: "climate:ocean-ice:v1",
  wildfires: "wildfire:fires:v1",
  wildfiresBootstrap: "wildfire:fires-bootstrap:v1",
  marketQuotes: "market:stocks-bootstrap:v1",
  commodityQuotes: "market:commodities-bootstrap:v1",
  cyberThreats: "cyber:threats-bootstrap:v2",
  techReadiness: "economic:worldbank-techreadiness:v1",
  progressData: "economic:worldbank-progress:v1",
  renewableEnergy: "economic:worldbank-renewable:v1",
  positiveGeoEvents: "positive_events:geo-bootstrap:v1",
  riskScores: CII_RISK_SCORE_CACHE_KEYS.stale,
  naturalEvents: "natural:events:v1",
  flightDelays: "aviation:delays-bootstrap:v2",
  newsInsights: "news:insights:v1",
  predictionMarkets: "prediction:markets-bootstrap:v1",
  cryptoQuotes: "market:crypto:v1",
  gulfQuotes: "market:gulf-quotes:v1",
  stablecoinMarkets: "market:stablecoins:v1",
  unrestEvents: "unrest:events:v1",
  iranEvents: "conflict:iran-events:v1",
  ucdpEvents: "conflict:ucdp-events:v1",
  ucdpEventsBootstrap: "conflict:ucdp-events-bootstrap:v1",
  weatherAlerts: "weather:alerts:v1",
  spending: "economic:spending:v1",
  techEvents: "research:tech-events-bootstrap:v1",
  gdeltIntel: "intelligence:gdelt-intel:v1",
  correlationCards: "correlation:cards-bootstrap:v1",
  crossStraitActivity: "military:cross-strait-activity:v1",
  crossStraitActivityBootstrap: "military:cross-strait-activity-bootstrap:v1",
  forecasts: "forecast:predictions:v2",
  forecastsBootstrap: "forecast:predictions-bootstrap:v1",
  securityAdvisories: "intelligence:advisories-bootstrap:v1",
  customsRevenue: "trade:customs-revenue:v1",
  comtradeFlows: "comtrade:flows:v1",
  blsSeries: "bls:series:v1",
  sanctionsPressure: "sanctions:pressure:v1",
  crossSourceSignals: "intelligence:cross-source-signals:v1",
  sanctionsEntities: "sanctions:entities:v1",
  radiationWatch: "radiation:observations:v1",
  consumerPricesOverview: "consumer-prices:overview:ae",
  consumerPricesCategories: "consumer-prices:categories:ae:30d",
  consumerPricesMovers: "consumer-prices:movers:ae:30d",
  consumerPricesSpread: "consumer-prices:retailer-spread:ae:essentials-ae",
  consumerPricesFreshness: "consumer-prices:freshness:ae",
  consumerPricesCoverage: "consumer-prices:coverage:ae",
  groceryBasket: "economic:grocery-basket:v1",
  bigmac: "economic:bigmac:v1",
  fuelPrices: "economic:fuel-prices:v1",
  faoFoodPriceIndex: "economic:fao-ffpi:v1",
  nationalDebt: "economic:national-debt:v1",
  defiTokens: "market:defi-tokens:v1",
  aiTokens: "market:ai-tokens:v1",
  otherTokens: "market:other-tokens:v1",
  fredBatch: "economic:fred:v1:FEDFUNDS:0",
  ecbEstr: "economic:fred:v1:ESTR:0",
  ecbEuribor3m: "economic:fred:v1:EURIBOR3M:0",
  ecbEuribor6m: "economic:fred:v1:EURIBOR6M:0",
  ecbEuribor1y: "economic:fred:v1:EURIBOR1Y:0",
  fearGreedIndex: "market:fear-greed:v1",
  breadthHistory: "market:breadth-history:v1",
  euYieldCurve: "economic:yield-curve-eu:v1",
  earningsCalendar: "market:earnings-calendar:v1",
  econCalendar: "economic:econ-calendar:v1",
  chinaMacro: BOOTSTRAP_CACHE_KEYS.chinaMacro,
  chinaReleaseCalendar: BOOTSTRAP_CACHE_KEYS.chinaReleaseCalendar,
  chinaCorporateDisclosures: "market:china:corporate-disclosures:v1",
  chinaPolicyEvents: "china:policy-events:v1",
  chinaDecisionSignals: BOOTSTRAP_CACHE_KEYS.chinaDecisionSignals,
  cotPositioning: "market:cot:v1",
  hyperliquidFlow: "market:hyperliquid:flow:v1",
  crudeInventories: "economic:crude-inventories:v1",
  natGasStorage: "economic:nat-gas-storage:v1",
  spr: "economic:spr:v1",
  refineryInputs: "economic:refinery-inputs:v1",
  ecbFxRates: "economic:ecb-fx-rates:v1",
  eurostatCountryData: "economic:eurostat-country-data:v1",
  eurostatHousePrices: "economic:eurostat:house-prices:v1",
  eurostatGovDebtQ: "economic:eurostat:gov-debt-q:v1",
  eurostatIndProd: "economic:eurostat:industrial-production:v1",
  euGasStorage: "economic:eu-gas-storage:v1",
  euFsi: "economic:fsi-eu:v1",
  shippingStress: "supply_chain:shipping_stress:v1",
  diseaseOutbreaks: "health:disease-outbreaks:v1",
  healthAirQuality: "health:air-quality:v1",
  socialVelocity: "intelligence:social:reddit:v1",
  wsbTickers: "intelligence:wsb-tickers:v1",
  vpdTrackerRealtime: "health:vpd-tracker:realtime:v1",
  vpdTrackerHistorical: "health:vpd-tracker:historical:v1",
  electricityPrices: "energy:electricity:v1:index",
  gasStorageCountries: "energy:gas-storage:v1:_countries",
  aaiiSentiment: "market:aaii-sentiment:v1",
  cryptoSectors: "market:crypto-sectors:v1",
  ddosAttacks: "cf:radar:ddos:v1",
  economicStress: "economic:stress-index:v1",
  trafficAnomalies: "cf:radar:traffic-anomalies:v1"
};
var STANDALONE_KEYS = {
  chinaCoverage: CHINA_COVERAGE_SUMMARY_KEY,
  // Control-plane heartbeat only. Convex owns every durable scan lease,
  // checkpoint, receipt, and replay decision; this Redis value is disposable.
  companyMonitoringWorker: "company-monitoring:worker-health:v1",
  // Seeded and health-monitored; no dashboard consumer yet (#6155 is the
  // data layer only), so it is standalone rather than bootstrap-tiered.
  chinaStockConnect: "market:china:stock-connect:v1",
  hkoWarnings: "weather:hko-warnings:v1",
  humanitarianSummary: "conflict:humanitarian:v1",
  // #4920 completeness measurement (daily GH Actions publishers) — ops
  // keys: health-monitored but NOT bootstrap-hydrated into page loads.
  newsFeedHealth: "news:feed-health:v1",
  newsRecallBenchmark: "news:recall-benchmark:v1",
  serviceStatuses: "infra:service-statuses:v1",
  macroSignals: "economic:macro-signals:v1",
  energyPrices: "economic:energy:v1:all",
  bisPolicy: "economic:bis:policy:v1",
  bisExchange: "economic:bis:eer:v1",
  fxYoy: "economic:fx:yoy:v1",
  sharedFxRates: "shared:fx-rates:v1",
  // Operational batch written by seed-fred-rates. The UI and MCP surfaces
  // consume the individual FRED series keys, not this producer envelope.
  fredRatesSeeder: "economic:fred:batch:v1",
  bisCredit: "economic:bis:credit:v1",
  bisDsr: "economic:bis:dsr:v1",
  // Bank of Russia official rates: health-monitored but deliberately NOT a
  // bootstrap key. Its dashboard consumer (the FX panel's RUB tab, #6231)
  // reads it on demand through the credential-less per-key bootstrap URL, so
  // registering it in a tier would add ~6KB to a payload every client
  // downloads and only the opt-in panel consumes.
  cbrRates: "economic:cbr-rates:v1",
  bisPropertyResidential: "economic:bis:property-residential:v1",
  bisPropertyCommercial: "economic:bis:property-commercial:v1",
  imfMacro: "economic:imf:macro:v2",
  imfGrowth: "economic:imf:growth:v1",
  imfLabor: "economic:imf:labor:v1",
  imfExternal: "economic:imf:external:v1",
  // plan 2026-04-25-004 Phase 2: financialSystemExposure data keys.
  wbExternalDebt: "economic:wb-external-debt:v1",
  bisLbs: "economic:bis-lbs:v1",
  fatfListing: "economic:fatf-listing:v1",
  climateZoneNormals: "climate:zone-normals:v1",
  shippingRates: "supply_chain:shipping:v2",
  chokepoints: "supply_chain:chokepoints:v4",
  minerals: "supply_chain:minerals:v2",
  mineralProduction: "supply-chain:mineral-production:v1",
  giving: "giving:summary:v2",
  gpsjam: "intelligence:gpsjam:v2",
  // Corporate intelligence (issue #5695): SEC ticker→CIK registry + 8-K
  // material-events stream. Health-monitored, not bootstrap-hydrated.
  secCikMap: "intelligence:sec-cik-map:v1",
  sec8kStream: "intelligence:sec-8k-stream:v1",
  theaterPosture: "theater_posture:sebuf:stale:v1",
  theaterPostureLive: "theater-posture:sebuf:v1",
  theaterPostureBackup: "theater-posture:sebuf:backup:v1",
  riskScoresLive: CII_RISK_SCORE_CACHE_KEYS.live,
  usniFleet: "usni-fleet:sebuf:v1",
  usniFleetStale: "usni-fleet:sebuf:stale:v1",
  faaDelays: "aviation:delays:faa:v1",
  intlDelays: "aviation:delays:intl:v3",
  notamClosures: "aviation:notam:closures:v2",
  positiveEventsLive: "positive-events:geo:v1",
  cableHealth: "cable-health-v1",
  submarineCables: "infrastructure:submarine-cables:v1",
  cyberThreatsRpc: "cyber:threats:v2",
  militaryBases: "military:bases:active",
  militaryFlights: "military:flights:v1",
  militaryFlightsStale: "military:flights:stale:v1",
  // STANDALONE (not BOOTSTRAP) by design — value is a single keyed payload
  // (asOf + per-country aggregate), no per-record gating needed; health just
  // verifies existence + freshness via the matching SEED_META entry. Same
  // shape as militaryFlights above.
  militaryCii: "intelligence:military-cii:v1",
  globalTendersSam: "economic:global-tenders:v1:source:sam",
  globalTendersTed: "economic:global-tenders:v1:source:ted",
  globalTendersContractsFinder: "economic:global-tenders:v1:source:contracts-finder",
  globalTendersCanadaBuys: "economic:global-tenders:v1:source:canada-buys",
  globalTendersGets: "economic:global-tenders:v1:source:gets",
  globalTendersWorldBank: "economic:global-tenders:v1:source:world-bank",
  crossStraitActivityTaiwanMnd: "military:cross-strait-activity:v1:source:taiwan-mnd",
  crossStraitActivityJapanMod: "military:cross-strait-activity:v1:source:japan-mod",
  defensePatents: "patents:defense:latest",
  temporalAnomalies: "temporal:anomalies:v1",
  displacement: `displacement:summary:v1:${(/* @__PURE__ */ new Date()).getUTCFullYear()}`,
  displacementPrev: `displacement:summary:v1:${(/* @__PURE__ */ new Date()).getUTCFullYear() - 1}`,
  acledIntel: "conflict:acled:v1:all:0:0",
  satellites: "intelligence:satellites:tle:v1",
  portwatch: "supply_chain:portwatch:v1",
  portwatchDisruptions: "portwatch:disruptions:active:v1",
  portwatchPortActivity: "supply_chain:portwatch-ports:v1:_countries",
  corridorrisk: "supply_chain:corridorrisk:v1",
  chokepointTransits: "supply_chain:chokepoint_transits:v1",
  transitSummaries: "supply_chain:transit-summaries:v1",
  // Meta-only aggregate: payloads are sharded by country, so use the seed-meta
  // key as the probe target rather than pretending one country key is global.
  comtradeBilateralHs4: "seed-meta:comtrade:bilateral-hs4",
  thermalEscalation: "thermal:escalation:v1",
  thermalEscalationBootstrap: "thermal:escalation-bootstrap:v1",
  // Meta-only aggregate: payloads are sharded one key per reporter, so probe
  // the seed-meta key rather than electing one reporter (or one lookback) to
  // stand for the fleet. Pre-#6316 this pointed at the US years=10 data key.
  tariffTrendsUs: "seed-meta:trade:tariffs",
  // Meta-only aggregate: payloads are sharded one key per reporter, so probe
  // the seed-meta key rather than electing one reporter to stand for the fleet.
  tradeFlows: "seed-meta:trade:flows",
  militaryForecastInputs: "military:forecast-inputs:stale:v1",
  militarySurges: "military:surges:stale:v1",
  gscpi: "economic:fred:v1:GSCPI:0",
  forecastFredWalcl: "economic:fred:v1:WALCL:0",
  forecastFredT10y2y: "economic:fred:v1:T10Y2Y:0",
  forecastFredUnrate: "economic:fred:v1:UNRATE:0",
  forecastFredCpiaucsl: "economic:fred:v1:CPIAUCSL:0",
  forecastFredDgs10: "economic:fred:v1:DGS10:0",
  forecastFredVixcls: "economic:fred:v1:VIXCLS:0",
  forecastFredGdp: "economic:fred:v1:GDP:0",
  forecastFredM2sl: "economic:fred:v1:M2SL:0",
  forecastFredDcoilwtico: "economic:fred:v1:DCOILWTICO:0",
  marketImplications: "intelligence:market-implications:v1",
  hormuzTracker: "supply_chain:hormuz_tracker:v1",
  simulationPackageLatest: "forecast:simulation-package:latest",
  simulationOutcomeLatest: "forecast:simulation-outcome:latest",
  newsThreatSummary: "news:threat:summary:v1",
  climateNews: "climate:news-intelligence:v1",
  pizzint: "intelligence:pizzint:seed:v1",
  resilienceStaticIndex: "resilience:static:index:v1",
  resilienceStaticFao: "resilience:static:fao",
  // USDA PSD food stocks + FAOSTAT production fill (#6440). RPC/MCP only —
  // not bootstrap-hydrated; country deep-dive fetches on demand.
  foodStocks: "resilience:food-stocks:v1",
  resilienceRanking: "resilience:ranking:v28",
  productCatalog: "product-catalog:v3",
  energySpineCountries: "energy:spine:v1:_countries",
  energyExposure: "energy:exposure:v1:index",
  energyMixAll: "energy:mix:v1:_all",
  regulatoryActions: "regulatory:actions:v1",
  energyIntelligence: "energy:intelligence:feed:v1",
  ieaOilStocks: "energy:iea-oil-stocks:v1:index",
  oilStocksAnalysis: "energy:oil-stocks-analysis:v1",
  eiaPetroleum: "energy:eia-petroleum:v1",
  jodiGas: "energy:jodi-gas:v1:_countries",
  lngVulnerability: "energy:lng-vulnerability:v1",
  jodiOil: "energy:jodi-oil:v1:_countries",
  chokepointBaselines: "energy:chokepoint-baselines:v1",
  portwatchChokepointsRef: "portwatch:chokepoints:ref:v1",
  chokepointFlows: "energy:chokepoint-flows:v1",
  emberElectricity: "energy:ember:v1:_all",
  resilienceIntervals: "resilience:intervals:v11:US",
  sprPolicies: "energy:spr-policies:v1",
  pipelinesGas: "energy:pipelines:gas:v1",
  pipelinesOil: "energy:pipelines:oil:v1",
  storageFacilities: "energy:storage-facilities:v1",
  fuelShortages: "energy:fuel-shortages:v1",
  energyDisruptions: "energy:disruptions:v1",
  energyCrisisPolicies: "energy:crisis-policies:v1",
  regionalSnapshots: "intelligence:regional-snapshots:summary:v1",
  regionalBriefs: "intelligence:regional-briefs:summary:v1",
  recoveryFiscalSpace: "resilience:recovery:fiscal-space:v1",
  recoveryReserveAdequacy: "resilience:recovery:reserve-adequacy:v1",
  recoveryExternalDebt: "resilience:recovery:external-debt:v1",
  recoveryImportHhi: "resilience:recovery:import-hhi:v1",
  // recoveryFuelStocks: probe removed. The seeder
  // (seed-recovery-fuel-stocks.mjs) still runs in seed-bundle-resilience-
  // recovery so the data is preserved for a future replacement dimension,
  // but `scoreFuelStockDays` in _dimension-scorers.ts is hard-wired to
  // return coverage=0/imputationClass=null (retired in PR 3 §3.5) and
  // never calls getCachedJson on this key. Probing it surfaced a green
  // STATUS:OK that meant "the cron ran", not "the data is used"; that's
  // an actively-misleading signal so it's gone. Re-add this slot if and
  // when a future PR wires scoreFuelStockDays to read real data again.
  recoveryReexportShare: "resilience:recovery:reexport-share:v1",
  recoverySovereignWealth: "resilience:recovery:sovereign-wealth:v1",
  // PR 1 v2 energy-construct seeds. STRICT SEED_META (not ON_DEMAND):
  // plan 2026-04-24-001 removed these from ON_DEMAND_KEYS so /api/health
  // reports CRIT (not WARN) when they are absent. This is the intended
  // alarm on the Railway bundle-not-provisioned state. See the ON_DEMAND_KEYS
  // comment block below for the full rationale.
  lowCarbonGeneration: "resilience:low-carbon-generation:v1",
  fossilElectricityShare: "resilience:fossil-electricity-share:v1",
  powerLosses: "resilience:power-losses:v1",
  // Same strict treatment as the v2 energy seeds above: the education seeder is
  // a seed-bundle-macro member, so an absent key means the bundle stopped
  // publishing, which is a real outage and must read CRIT rather than WARN.
  educationAttainment: "resilience:education-attainment:v1",
  goldExtended: "market:gold-extended:v1",
  goldEtfFlows: "market:gold-etf-flows:v1",
  goldCbReserves: "market:gold-cb-reserves:v1",
  // Relay-side loop heartbeats. ais-relay.cjs writes these on successful child
  // exit for the two execFile-spawned seeders (chokepoint-flows, climate-news).
  // A stale heartbeat means the relay loop itself is broken (child dying at
  // import, parent event-loop blocked, container in a restart loop, etc.)
  // and alarms earlier than the underlying seed-meta staleness window.
  chokepointFlowsRelayHeartbeat: "relay:heartbeat:chokepoint-flows",
  climateNewsRelayHeartbeat: "relay:heartbeat:climate-news",
  telegramFeed: "intelligence:telegram-feed:v1",
  digestNotifications: "digest:last-run",
  webcams: "webcam:cameras:active",
  forecastResolutions: "forecast:resolutions:v1",
  forecastScorecard: "forecast:scorecard:v1",
  forecastBets: "forecast:bets:history:v1",
  forecastFunnel: "forecast:funnel:health:v1",
  researchArxivHnTrending: "research:arxiv:v1:cs.AI::50",
  // #5736 — historical-intelligence ingest health, one record per collector.
  // These are NOT the collectors' canonical keys: scripts/_seed-history.mjs
  // appends to the Convex intel-history store fail-open, so a permanently
  // broken relay leg (missing RELAY_SHARED_SECRET, rejecting relay, dead
  // embedder) left every canonical key fresh and the store empty. The paired
  // seed-meta below carries the last HEALTHY append, so "history stopped
  // accumulating" ages into STALE_SEED while canonical publication stays OK.
  intelHistoryIngestConflictAcled: "intel-history:ingest-health:conflict:acled-intel:v1",
  intelHistoryIngestMilitaryCrossStrait: "intel-history:ingest-health:military:cross-strait-activity:v1",
  intelHistoryIngestEnergyIntelligence: "intel-history:ingest-health:energy:intelligence:v1"
};
var SEED_META = {
  // scripts/seed-conflict-intel.mjs cron runs every 15min, while HAPI is gated
  // to one bulk refresh every 2h. Bounded above by
  // HAPI_TTL (360min / 6h) — the per-country data key's own Redis TTL — not
  // by cron headroom alone: this MUST fire before a per-country key can expire,
  // or users see empty data for up to 6h before health notices (#5554 review;
  // an earlier 720min value left exactly that blind spot). 300 (5h) is ~10x
  // the HAPI refresh interval (headroom for missed/lock-contended ticks) while staying
  // a full hour below the 6h data-expiry floor.
  humanitarianSummary: { key: "seed-meta:conflict:humanitarian", maxStaleMin: 300, minRecordCount: 23 },
  chinaCoverage: { key: "seed-meta:health:china-coverage", maxStaleMin: 180 },
  // Always-on loop publishes every few seconds. Five minutes tolerates deploy
  // churn while still detecting a stopped worker well before leases age out.
  companyMonitoringWorker: { key: "seed-meta:company-monitoring:worker", maxStaleMin: 5, workerControl: true },
  earthquakes: { key: "seed-meta:seismology:earthquakes", maxStaleMin: 30 },
  wildfires: { key: "seed-meta:wildfire:fires", maxStaleMin: 360 },
  // FIRMS NRT resets at midnight UTC; new-day data takes 3-6h to accumulate
  wildfiresBootstrap: { key: "seed-meta:wildfire:fires-bootstrap", maxStaleMin: 360 },
  // Compact CDN payload is a distinct publish target; monitor it so canonical fallback cannot hide transform/write failures.
  outages: { key: "seed-meta:infra:outages", maxStaleMin: 30 },
  climateAnomalies: { key: "seed-meta:climate:anomalies", maxStaleMin: 540 },
  // bundled into seed-bundle-climate (cron `0 */3 * * *`, every 3h); 540 = 3× cron cadence per project convention. Prior 240 (1.33× cron) flipped to silent-EMPTY between minute 180 (TTL_DATA expiry) and 240 (alarm trigger) on every routine cron-jitter cycle — see scripts/seed-climate-anomalies.mjs CACHE_TTL comment.
  climateDisasters: { key: "seed-meta:climate:disasters", maxStaleMin: 720 },
  // runs every 6h; 720min = 2x interval
  climateAirQuality: { key: "seed-meta:health:air-quality", maxStaleMin: 180 },
  // hourly cron; 180 = 3x interval — shares meta key with healthAirQuality (same seeder run)
  climateZoneNormals: { key: "seed-meta:climate:zone-normals", maxStaleMin: 89280 },
  // monthly cron on the 1st; 62d = 2x 31-day cadence
  co2Monitoring: { key: "seed-meta:climate:co2-monitoring", maxStaleMin: 4320 },
  // daily cron at 06:00 UTC; 72h tolerates two missed runs
  oceanIce: { key: "seed-meta:climate:ocean-ice", maxStaleMin: 2880 },
  // daily cron at 08:00 UTC; 48h = 2× interval, tolerates one missed run
  climateNews: { key: "seed-meta:climate:news-intelligence", maxStaleMin: 90 },
  // relay loop every 30min; 90 = 3× interval
  unrestEvents: { key: "seed-meta:unrest:events", maxStaleMin: 120 },
  // 45min cron; 120 = 2h grace (was 75 = 30min buffer, too tight)
  cyberThreats: { key: "seed-meta:cyber:threats", maxStaleMin: 240 },
  // 2h interval; 240min = 2x interval
  cryptoQuotes: { key: "seed-meta:market:crypto", maxStaleMin: 30 },
  etfFlows: { key: "seed-meta:market:etf-flows", maxStaleMin: 60 },
  gulfQuotes: { key: "seed-meta:market:gulf-quotes", maxStaleMin: 30 },
  stablecoinMarkets: { key: "seed-meta:market:stablecoins", maxStaleMin: 60 },
  naturalEvents: { key: "seed-meta:natural:events", maxStaleMin: 540 },
  // 3h Railway climate bundle; 3x cadence preserves a full missed run.
  hkoWarnings: { key: "seed-meta:weather:hko-warnings", maxStaleMin: 540 },
  // successful HKO responses publish a snapshot even when no tropical-cyclone warning is active.
  flightDelays: { key: "seed-meta:aviation:faa", maxStaleMin: 90 },
  // CACHE_TTL=7200s; matches notamClosures from same cron
  notamClosures: { key: "seed-meta:aviation:notam", maxStaleMin: 240 },
  // 2h interval; 240min = 2x interval
  predictionMarkets: {
    key: "seed-meta:prediction:markets",
    maxStaleMin: 90,
    minRecordCount: 20,
    // #5875: one is the narrowest floor that detects a dead category signal
    // without treating ordinary pool-volume variation as an incident.
    minPoolCounts: PREDICTION_MARKET_MIN_POOL_COUNTS
  },
  newsInsights: {
    key: "seed-meta:news:insights",
    maxStaleMin: 30,
    // `fetchedAt` is deliberately held at the served LKG timestamp when a
    // synthesis is rejected. This separate bounded contract warns before the
    // generic 30-minute seed-age gate when repeated attempts keep failing.
    synthesisFailure: {
      warnAfterConsecutive: 2,
      warnAfterAgeMin: 20,
      warnWithoutSuccess: true,
      // Declared explicitly rather than relying on readSeedMeta's fallback:
      // an omitted pattern silently DROPS every code the producer writes, so
      // the contract is only safe if each key names its own vocabulary. A test
      // asserts every synthesisFailure entry declares one.
      //
      // #5947: the LEAD_* codes and COMPOSER_ERROR name WHICH editorial gate
      // rejected the synthesis — GATE stays as the producer's residual bucket.
      // This list is the second source of truth for that vocabulary, and an
      // unmatched code is dropped SILENTLY, so widening the seeder's codes
      // without widening this makes them invisible in health. A test asserts
      // every INSIGHTS_SYNTHESIS_FAILURE_CODES value matches this pattern.
      failureCodePattern: /^INSIGHTS_SYNTHESIS_(PARSE|GATE|MISSING_CLUSTER|PROVIDER|COMPOSER_ERROR|LEAD_(EMPTY|UNCITED|PROPER_NOUN|NUMERIC_FACT|GROUNDING))$/
    }
  },
  // #4920: daily GH Actions cadence; 2880 = 2x — one fully missed day alarms
  newsFeedHealth: { key: "seed-meta:news:feed-health", maxStaleMin: 2880 },
  newsRecallBenchmark: { key: "seed-meta:news:recall-benchmark", maxStaleMin: 2880 },
  marketQuotes: { key: "seed-meta:market:stocks", maxStaleMin: 30 },
  // #6235: the country-index RPC is seeded for the whole 45-country enum. The
  // seeding pass is deliberately best-effort (one country's provider failure
  // must not cost the other 44 their refresh) and therefore never throws — so
  // without this entry a run where every country failed would leave
  // seed-meta:market:stocks fresh and health green while the country caches
  // expired and the RPC silently reverted to per-request Yahoo fetches.
  // minRecordCount measured 2026-08-05: 37/45 symbols return usable 1mo daily
  // closes; RU, PL, EG, CL, PE, PT, CZ and HU fail permanently on Yahoo's side
  // (see #6240). 30 leaves headroom for ~7 transient failures below that
  // measured floor without alarming on the known-dead eight.
  countryStockIndexes: { key: "seed-meta:market:country-indexes", maxStaleMin: 30, minRecordCount: 30 },
  commodityQuotes: { key: "seed-meta:market:commodities", maxStaleMin: 30 },
  goldExtended: { key: "seed-meta:market:gold-extended", maxStaleMin: 30 },
  goldEtfFlows: { key: "seed-meta:market:gold-etf-flows", maxStaleMin: 2880 },
  // SPDR publishes daily; 2× = 48h tolerance
  goldCbReserves: { key: "seed-meta:market:gold-cb-reserves", maxStaleMin: 44640 },
  // IMF IFS is monthly w/ ~2-3mo lag; 31d tolerance
  // RPC/warm-ping keys — seed-meta written by relay loops or handlers
  // serviceStatuses: moved to ON_DEMAND — RPC-populated, no dedicated seed, goes stale when no users visit
  cableHealth: { key: "seed-meta:cable-health", maxStaleMin: 90 },
  // ais-relay warm-ping runs every 30min; 90min = 3× interval catches missed pings without false positives
  submarineCables: { key: "seed-meta:infrastructure:submarine-cables", maxStaleMin: 25200 },
  macroSignals: { key: "seed-meta:economic:macro-signals", maxStaleMin: 150 },
  // seed-economy afterPublish-derived stress/macro key
  chinaMacro: { key: "seed-meta:economic:china-macro-transport", maxStaleMin: 4320 },
  // oldest required-source last success; preserved failures do not refresh it
  chinaReleaseCalendar: { key: "seed-meta:economic:china-release-calendar", maxStaleMin: 4320 },
  chinaCorporateDisclosures: { key: "seed-meta:market:china-corporate-disclosures", maxStaleMin: 180 },
  chinaStockConnect: { key: "seed-meta:market:china-stock-connect", maxStaleMin: 180 },
  crossStraitActivity: { key: "seed-meta:military:cross-strait-activity", maxStaleMin: 720 },
  crossStraitActivityBootstrap: { key: "seed-meta:military:cross-strait-activity-bootstrap", maxStaleMin: 720 },
  crossStraitActivityTaiwanMnd: { key: "seed-meta:military:cross-strait-activity:taiwan-mnd", maxStaleMin: 720 },
  crossStraitActivityJapanMod: { key: "seed-meta:military:cross-strait-activity:japan-mod", maxStaleMin: 720 },
  chinaPolicyEvents: { key: "seed-meta:china:policy-events", maxStaleMin: 2160 },
  // decisionGroups (#6060): the seeder's afterPublish diagnostics name which
  // groups are quiet, stale, or unavailable, so a shortfall is actionable
  // rather than a bare 4/6. minRecordCount stays the verdict — it counts
  // operationally covered groups, which now includes a healthy quiet
  // disclosure window (the exchanges answered; there was nothing to report)
  // but no other unavailable cause.
  chinaDecisionSignals: {
    key: "seed-meta:intelligence:china-decision-signals",
    maxStaleMin: 60,
    minRecordCount: 6,
    decisionGroups: CHINA_DECISION_SIGNAL_GROUP_IDS
  },
  energyPrices: { key: "seed-meta:economic:energy-prices", maxStaleMin: 150 },
  // seed-economy primary runSeed resource
  bisPolicy: { key: "seed-meta:economic:bis", maxStaleMin: 10080 },
  // runSeed('economic','bis',...) writes seed-meta:economic:bis
  // seed-bis-extended.mjs is a child-process section spawned by
  // scripts/seed-bundle-macro.mjs. The bundle's Railway cron fires more
  // often than the per-section `intervalMs: 12 * HOUR` gate (production
  // logs 2026-04-26T08:00:45 show "BIS-Extended Skipped, last seeded
  // 175min ago, interval: 720min" — gate actively load-bearing on every
  // bundle tick). So the EFFECTIVE write cadence is governed by the 12h
  // gate, not the bundle cron. Per-dataset seed-meta is only written when
  // THAT dataset published fresh entries — so a single-dataset BIS outage
  // (e.g. WS_DSR 500s) goes STALE in health without dragging down the
  // healthy ones.
  //
  // The previous 1440 (= 2× the 12h gate, but only 1× the actual rolled-up
  // cadence after typical cron drift) had ZERO grace. All three keys
  // flipped to STALE_SEED synchronously at minute 1442 on 2026-04-27
  // (gate-eligible run delayed by ~24h after one failed intermediate cron).
  // 2160min = 3× the 12h gate covers cron drift + one degraded-to-24h
  // cycle, fires within 36h on a real outage.
  bisDsr: { key: "seed-meta:economic:bis-dsr", maxStaleMin: 2160 },
  bisPropertyResidential: { key: "seed-meta:economic:bis-property-residential", maxStaleMin: 2160 },
  bisPropertyCommercial: { key: "seed-meta:economic:bis-property-commercial", maxStaleMin: 2160 },
  imfMacro: { key: "seed-meta:economic:imf-macro", maxStaleMin: 100800 },
  // monthly seed; 100800min = 70 days = 2× interval (absorbs one missed run)
  imfGrowth: { key: "seed-meta:economic:imf-growth", maxStaleMin: 100800 },
  // monthly seed; 70d threshold matches imfMacro (same WEO release cadence)
  imfLabor: { key: "seed-meta:economic:imf-labor", maxStaleMin: 100800 },
  // monthly seed; 70d threshold matches imfMacro
  imfExternal: { key: "seed-meta:economic:imf-external", maxStaleMin: 100800 },
  // monthly seed; 70d threshold matches imfMacro
  // plan 2026-04-25-004 Phase 2: financialSystemExposure component seeders.
  // Bundle: scripts/seed-bundle-macro.mjs (Codex R1 #5, Option A).
  wbExternalDebt: { key: "seed-meta:economic:wb-external-debt", maxStaleMin: 100800 },
  // annual WB IDS publication; 70d threshold matches IMF cadence pattern
  bisLbs: { key: "seed-meta:economic:bis-lbs", maxStaleMin: 14400 },
  // BIS LBS quarterly publication; 10d threshold = ~1× publish lag tolerance after macro bundle daily refresh
  fatfListing: { key: "seed-meta:economic:fatf-listing", maxStaleMin: 60480 },
  // FATF plenary 3×/year; 42d threshold = >1 plenary cycle (catches missed-update if cron silently fails)
  shippingRates: { key: "seed-meta:supply_chain:shipping", maxStaleMin: 420 },
  chokepoints: { key: "seed-meta:supply_chain:chokepoints", maxStaleMin: 60, minRecordCount: 13 },
  // 13 canonical chokepoints; get-chokepoint-status writes covered-count → < 13 = upstream partial (portwatch/ArcGIS dropped some)
  // minerals + giving: on-demand cachedFetchJson only, no seed-meta writer — freshness checked via TTL
  // bisExchange + bisCredit: extras written by same BIS script via writeExtraKey, no dedicated seed-meta
  fxYoy: { key: "seed-meta:economic:fx-yoy", maxStaleMin: 1500 },
  // daily cron; 25h tolerance + 1h drift
  sharedFxRates: { key: "seed-meta:shared:fx-rates", maxStaleMin: 3600 },
  // daily seed; 60h tolerance covers a missed 25h cache refresh
  gpsjam: { key: "seed-meta:intelligence:gpsjam", maxStaleMin: 1440 },
  // Wingbits API (scripts/fetch-gpsjam.mjs); 1440min = 24h tolerance gives operator headroom to handle upstream outages and monthly quota exhaustion (HTTP 402 observed 2026-04-29) without dashboard noise. Seeder catch-block extends TTL on fail without refreshing fetchedAt, so STALE_SEED via age is the only alarm path.
  positiveGeoEvents: { key: "seed-meta:positive-events:geo", maxStaleMin: 60 },
  riskScores: { key: "seed-meta:intelligence:risk-scores", maxStaleMin: 30, minRecordCount: 3 },
  // CII warm-ping every 8min; recordCount is realtime signal-density coverage for score-relevant conflict (ACLED or UCDP), news, and cyber families, not raw feed availability; quiet-but-fresh feeds may warn COVERAGE_PARTIAL.
  iranEvents: { key: "seed-meta:conflict:iran-events", maxStaleMin: 20160 },
  // manual seed from LiveUAMap; 20160 = 14d = 2× weekly cadence
  ucdpEvents: { key: "seed-meta:conflict:ucdp-events", maxStaleMin: 420 },
  ucdpEventsBootstrap: { key: "seed-meta:conflict:ucdp-events-bootstrap", maxStaleMin: 420 },
  // Same cron. Monitored separately because the bootstrap tier now hydrates from the compact projection, and a transform/write failure there must not hide behind a healthy canonical key (#5300).
  acledIntel: { key: "seed-meta:conflict:acled-intel", maxStaleMin: 38 },
  // conflict:acled:v1:all:0:0, now ACLED-or-GDELT fallback for the forecast EMA input (#5099).
  militaryFlights: { key: "seed-meta:military:flights", maxStaleMin: 30 },
  // cron ~10min (LIVE_TTL=600s); 30min = 3x interval,
  // These are late-stage outputs of the same ~10min seeder. Keep their
  // budgets tied to the cron rather than the payload TTL (24h), so a run that
  // writes flights and then dies still becomes visible as the downstream
  // snapshots age.
  militaryForecastInputs: { key: "seed-meta:military-forecast-inputs", maxStaleMin: 30 },
  militarySurges: { key: "seed-meta:military-surges", maxStaleMin: 30 },
  militaryCii: { key: "seed-meta:intelligence:military-cii", maxStaleMin: 45 },
  // seed-military-cii cron ~10min; 45 = generous grace (relay-dependent; preserve-last-good runs still refresh meta)
  defensePatents: { key: "seed-meta:military:defense-patents", maxStaleMin: 25200 },
  satellites: { key: "seed-meta:intelligence:satellites", maxStaleMin: 240 },
  // CelesTrak every 120min; 240min = absorbs one missed cycle
  temporalAnomalies: { key: "seed-meta:temporal:anomalies", maxStaleMin: 45 },
  // request-driven producer kept warm by seed-infra; data TTL is 60min so health reaches STALE_SEED before EMPTY
  weatherAlerts: { key: "seed-meta:weather:alerts", maxStaleMin: 45 },
  // relay loop every 15min; 45 = 3× interval (was 30 = 2×, too tight on relay hiccup)
  spending: { key: "seed-meta:economic:spending", maxStaleMin: 120 },
  globalTenders: { key: "seed-meta:economic:global-tenders", maxStaleMin: 180 },
  globalTendersSam: { key: "seed-meta:economic:global-tenders:sam", maxStaleMin: 240 },
  // 150min request pacing + hourly member gate yields ~180min publishes; 240min leaves one gate of scheduling jitter without raising the 10/day SAM budget.
  globalTendersTed: { key: "seed-meta:economic:global-tenders:ted", maxStaleMin: 180 },
  globalTendersContractsFinder: { key: "seed-meta:economic:global-tenders:contracts-finder", maxStaleMin: 180 },
  globalTendersCanadaBuys: { key: "seed-meta:economic:global-tenders:canada-buys", maxStaleMin: 180 },
  globalTendersGets: { key: "seed-meta:economic:global-tenders:gets", maxStaleMin: 180 },
  globalTendersWorldBank: { key: "seed-meta:economic:global-tenders:world-bank", maxStaleMin: 180 },
  techEvents: { key: "seed-meta:research:tech-events", maxStaleMin: 480 },
  researchArxivHnTrending: { key: "seed-meta:research:arxiv-hn-trending", maxStaleMin: 150 },
  gdeltIntel: { key: "seed-meta:intelligence:gdelt-intel", maxStaleMin: 45 },
  // 15min bulk materializer; 45min = 3× cadence and expires before the 24h canonical key.
  telegramFeed: { key: "seed-meta:intelligence:telegram-feed:v1", maxStaleMin: 10 },
  // 60s poll interval; 10min grace catches poll failures before they go stale in the panel
  digestNotifications: { key: "seed-meta:digest:last-run", maxStaleMin: 90 },
  // Railway digest-notifications cron runs every 30min; 90 = 3x cadence and detects a dead cron before daily digests are missed.
  forecasts: { key: "seed-meta:forecast:predictions", maxStaleMin: 90 },
  forecastsBootstrap: { key: "seed-meta:forecast:predictions-bootstrap", maxStaleMin: 90 },
  // Same cron. Monitored separately: the fast tier now hydrates from the dashboard list, and a transform/write failure there must not hide behind a healthy canonical key (#5300).
  forecastResolutions: { key: "seed-meta:forecast:resolutions", maxStaleMin: 2160 },
  // daily Bet-2 resolver; 36h catches a missed cron without flapping on normal daily jitter
  forecastScorecard: { key: "seed-meta:forecast:scorecard", maxStaleMin: 2160 },
  // scorecard extra key written by seed-forecast-resolutions
  forecastBets: { key: "seed-meta:forecast:bets", maxStaleMin: 2880 },
  // #5233 shadow bet-engine seeder; daily cron (05:00 UTC), 48h = 2× interval
  forecastMarketsResolution: { key: "seed-meta:prediction:markets-resolution", maxStaleMin: 2160 },
  // #5525 market settlement feed; written every resolver run (even zero-due), so it shares the resolver's 36h window
  forecastFunnel: { key: "seed-meta:forecast:funnel:health:v1", maxStaleMin: 180 },
  // funnel-diversity guardrail (#5233); written by seed-forecasts afterPublish each hourly run (3× cadence). status:'error' → SEED_ERROR when the published funnel collapses (too few domains / mostly synthetic)
  sectors: { key: "seed-meta:market:sectors", maxStaleMin: 30 },
  techReadiness: { key: "seed-meta:economic:worldbank-techreadiness:v1", maxStaleMin: 10080 },
  progressData: { key: "seed-meta:economic:worldbank-progress:v1", maxStaleMin: 10080 },
  renewableEnergy: { key: "seed-meta:economic:worldbank-renewable:v1", maxStaleMin: 10080 },
  intlDelays: { key: "seed-meta:aviation:intl", maxStaleMin: 90 },
  // faaDelays shares seed-meta key with flightDelays — no duplicate entry needed here
  theaterPosture: { key: "seed-meta:theater-posture", maxStaleMin: 60 },
  correlationCards: { key: "seed-meta:correlation:cards", maxStaleMin: 30 },
  // 5min cron (seed-bundle-derived-signals); 30min = 6× interval. Was 15 (3× = gold-standard floor) — overnight UptimeRobot flips when bundle jitter spaced two consecutive runs ~9-10min apart, producing 15-19min gaps that tripped STALE_SEED briefly. See WM 2026-05-10 health:failure-log.
  portwatch: { key: "seed-meta:supply_chain:portwatch", maxStaleMin: 720 },
  portwatchDisruptions: { key: "seed-meta:portwatch:disruptions", maxStaleMin: 150 },
  // 12h cron; 36h = 3x interval; #3613 requires full 174-country coverage before OK.
  // requireContentFreshness (#6060): cardinality and transport freshness alone
  // let a 174/174 run report healthy while China's cached observation was 170h
  // old — past the 144h budget the China corridor adapter and activity-nowcast
  // enforce. The seeder publishes contentFreshness; a missing block is
  // COVERAGE_DEGRADED, a stale country is STALE_CONTENT.
  //
  // The value is the country set health REQUIRES the producer to cover, not a
  // bare `true`: it mirrors PORTWATCH_DECISION_CRITICAL_COUNTRIES in
  // scripts/seed-portwatch-port-activity.mjs and CHINA_CORRIDOR_KEYS in
  // get-china-corridor-control-towers.ts, and it exists so a producer-side
  // change cannot narrow the alarm scope without health noticing.
  portwatchPortActivity: { key: "seed-meta:supply_chain:portwatch-ports", maxStaleMin: 2160, minRecordCount: 174, requireContentFreshness: { countries: ["CN", "HK"], budgetMinutes: 2 * 72 * 60 }, contentFreshnessActivation: "portwatchContentFreshness" },
  corridorrisk: { key: "seed-meta:supply_chain:corridorrisk", maxStaleMin: 120 },
  chokepointTransits: { key: "seed-meta:supply_chain:chokepoint_transits", maxStaleMin: 30 },
  // relay every 10min; 30min = 3x interval,
  transitSummaries: { key: "seed-meta:supply_chain:transit-summaries", maxStaleMin: 30 },
  // relay every 10min; 30min = 3x interval,
  usniFleet: { key: "seed-meta:military:usni-fleet", maxStaleMin: 720 },
  // relay loop every 6h; 720 = 2× interval (was 480 = 1.3×, too tight)
  securityAdvisories: { key: "seed-meta:intelligence:advisories", maxStaleMin: 120 },
  secCikMap: { key: "seed-meta:intelligence:sec-cik-map", maxStaleMin: 2880, minRecordCount: 5e3 },
  // daily bundle section; 2880min = 48h = 2x interval. minRecordCount mirrors MIN_CIK_ENTRIES in scripts/seed-sec-cik-map.mjs.
  sec8kStream: { key: "seed-meta:intelligence:sec-8k-stream", maxStaleMin: 120, minRecordCount: 50 },
  // 30min bundle section; 120min = 4x interval. minRecordCount mirrors MIN_STREAM_EVENTS in scripts/seed-sec-8k-stream.mjs — a drained window means Atom-parse decay, not a quiet market.
  customsRevenue: { key: "seed-meta:trade:customs-revenue", maxStaleMin: 1440 },
  comtradeFlows: { key: "seed-meta:trade:comtrade-flows", maxStaleMin: 2880 },
  // 24h cron; 2880min = 48h = 2x interval
  comtradeBilateralHs4: { key: "seed-meta:comtrade:bilateral-hs4", maxStaleMin: 50400, minRecordCount: 110 },
  // 35d health budget for monthly seed; 40d payload/meta TTL leaves a 5d stale-but-queryable warning window. minRecordCount mirrors MIN_COUNTRY_COVERAGE in scripts/seed-comtrade-bilateral-hs4.mjs (110 of 197 clusters) so a shrunken run reads COVERAGE_PARTIAL, not OK — without it 3-of-197 and 197-of-197 were indistinguishable for the full 35d window.
  blsSeries: { key: "seed-meta:economic:bls-series", maxStaleMin: 2880 },
  // daily seed; 2880min = 48h = 2x interval
  sanctionsPressure: { key: "seed-meta:sanctions:pressure", maxStaleMin: 720 },
  // 6h cron; 12h = 2× interval, before the 18h data TTL
  crossSourceSignals: { key: "seed-meta:intelligence:cross-source-signals", maxStaleMin: 30 },
  // 15min cron; 30min = 2x interval
  regionalSnapshots: { key: "seed-meta:intelligence:regional-snapshots", maxStaleMin: 720 },
  // 6h cron via seed-bundle-derived-signals; 720min = 12h = 2x interval
  regionalBriefs: { key: "seed-meta:intelligence:regional-briefs", maxStaleMin: 20160 },
  // weekly cron; 20160min = 14 days = 2x interval
  sanctionsEntities: { key: "seed-meta:sanctions:entities", maxStaleMin: 720 },
  // same 6h producer; co-pinned with pressure so both alarm before the 18h TTL
  radiationWatch: { key: "seed-meta:radiation:observations", maxStaleMin: 30 },
  groceryBasket: { key: "seed-meta:economic:grocery-basket", maxStaleMin: 10080 },
  // weekly seed; 10080 = 7 days
  bigmac: { key: "seed-meta:economic:bigmac", maxStaleMin: 10080 },
  // weekly seed; 10080 = 7 days
  fuelPrices: { key: "seed-meta:economic:fuel-prices", maxStaleMin: 10080 },
  // weekly seed; 10080 = 7 days
  faoFoodPriceIndex: { key: "seed-meta:economic:fao-ffpi", maxStaleMin: 86400 },
  // monthly seed; 86400 = 60 days (2x interval)
  thermalEscalation: { key: "seed-meta:thermal:escalation", maxStaleMin: 360 },
  // cron every 2h; 360 = 3x interval (was 240 = 2x)
  thermalEscalationBootstrap: { key: "seed-meta:thermal:escalation-bootstrap", maxStaleMin: 360 },
  // Same cron as above. Monitored separately because the bootstrap tier now hydrates from the compact projection, and a transform/write failure there must not hide behind a healthy canonical key (#5300).
  nationalDebt: { key: "seed-meta:economic:national-debt", maxStaleMin: 86400 },
  // monthly seed (seed-bundle-macro intervalMs: 30 * DAY); 60d = 2x interval absorbs one missed run. Prior 10080 (7d) was narrower than the cron interval so every cron past day 7 alarmed STALE_SEED.
  // recordCount is the number of reporter/World pairs actually published, so a
  // shortfall reads as COVERAGE_PARTIAL (warn) while a dead seeder still reads
  // as STALE_SEED — which is the distinction #6309 needs: "WTO never had this
  // combination" and "the seeder stopped" must not share one verdict.
  // Floor derived from measurement, not from the fixture, and measured against
  // the rule THIS change ships rather than the one it replaced: a 47-reporter
  // spread (every 6th of the 278 the WTO /reporters endpoint advertises) driven
  // through the real fetchFlowPair on 2026-08-07 published 46, a 97.9% rate,
  // projecting ~272 pairs. That is above the 256 the old seeder held in Redis —
  // the both-indicators gate costs nothing in practice (0 one-sided years across
  // the sample) while the 30-year window picks up reporters with no recent data.
  // 200 leaves ~26% headroom for reporter-list drift and still fires well before
  // a real collapse.
  // maxStaleMin sits INSIDE the 480min (8h) TRADE_TTL, not outside it. This is
  // a meta-only probe (STANDALONE_KEYS.tradeFlows is the seed-meta key itself,
  // because the payload is sharded one key per reporter), so the hasData/EMPTY
  // backstop watches the meta record — which writeSeedMeta gives a 7-day TTL —
  // and not the 8h data keys. Nothing else would notice the data expiring. A
  // budget past 480 would therefore be silently green while every flow key was
  // already gone. 420 = the 6h cron plus one hour of grace, so health reaches
  // STALE_SEED an hour BEFORE the keys it vouches for lapse. Same shape as the
  // meta-only comtradeBilateralHs4 entry above (35d budget, 40d payload TTL).
  tradeFlows: { key: "seed-meta:trade:flows", maxStaleMin: 420, minRecordCount: 200, dominantFailureMode: true },
  // Same meta-only shape as tradeFlows above (#6316 moved tariffs off the
  // single-key US years=10 probe). maxStaleMin 420 sits inside TARIFF_TTL
  // (480min); minRecordCount 150 leaves headroom under a ~200+ reporter fleet.
  tariffTrendsUs: { key: "seed-meta:trade:tariffs", maxStaleMin: 420, minRecordCount: 150 },
  // publish.ts runs once daily (02:30 UTC); seed-meta TTL=52h — maxStaleMin must cover the full 24h cycle
  consumerPricesOverview: { key: "seed-meta:consumer-prices:overview:ae", maxStaleMin: 1500, minSuccessRate: 0.5 },
  // 25h = 24h cadence + 1h grace; warn when <50% snapshots succeeded
  consumerPricesCategories: { key: "seed-meta:consumer-prices:categories:ae:30d", maxStaleMin: 1500 },
  consumerPricesMovers: { key: "seed-meta:consumer-prices:movers:ae:30d", maxStaleMin: 1500 },
  consumerPricesSpread: { key: "seed-meta:consumer-prices:retailer-spread:ae:essentials-ae", maxStaleMin: 1500 },
  consumerPricesFreshness: { key: "seed-meta:consumer-prices:freshness:ae", maxStaleMin: 1500 },
  consumerPricesCoverage: { key: "seed-meta:consumer-prices:coverage:ae", maxStaleMin: 1500, minSuccessRate: 0.5, requireCoverage: true },
  // defiTokens/aiTokens/otherTokens all share one seed run (seed-token-panels cron, every 30min)
  defiTokens: { key: "seed-meta:market:token-panels", maxStaleMin: 90 },
  aiTokens: { key: "seed-meta:market:token-panels", maxStaleMin: 90 },
  otherTokens: { key: "seed-meta:market:token-panels", maxStaleMin: 90 },
  fredBatch: { key: "seed-meta:economic:fred:v1:FEDFUNDS:0", maxStaleMin: 1500 },
  // daily cron
  fredRatesSeeder: { key: "seed-meta:economic:fred-rates", maxStaleMin: 180, minRecordCount: 24 },
  // independent hourly FRED/rates seeder; publication accepts 18/24, but health requires full consumer coverage
  forecastFredWalcl: { key: "seed-meta:economic:fred:v1:WALCL:0", maxStaleMin: 1500 },
  forecastFredT10y2y: { key: "seed-meta:economic:fred:v1:T10Y2Y:0", maxStaleMin: 1500 },
  forecastFredUnrate: { key: "seed-meta:economic:fred:v1:UNRATE:0", maxStaleMin: 1500 },
  forecastFredCpiaucsl: { key: "seed-meta:economic:fred:v1:CPIAUCSL:0", maxStaleMin: 1500 },
  forecastFredDgs10: { key: "seed-meta:economic:fred:v1:DGS10:0", maxStaleMin: 1500 },
  forecastFredVixcls: { key: "seed-meta:economic:fred:v1:VIXCLS:0", maxStaleMin: 1500 },
  forecastFredGdp: { key: "seed-meta:economic:fred:v1:GDP:0", maxStaleMin: 1500 },
  forecastFredM2sl: { key: "seed-meta:economic:fred:v1:M2SL:0", maxStaleMin: 1500 },
  forecastFredDcoilwtico: { key: "seed-meta:economic:fred:v1:DCOILWTICO:0", maxStaleMin: 1500 },
  ecbEstr: { key: "seed-meta:economic:ecb-short-rates", maxStaleMin: 4320 },
  // daily ECB publish; 4320min = 3d = TTL/interval
  ecbEuribor3m: { key: "seed-meta:economic:ecb-short-rates", maxStaleMin: 4320 },
  // shared meta key with ecbEstr
  ecbEuribor6m: { key: "seed-meta:economic:ecb-short-rates", maxStaleMin: 4320 },
  // shared meta key with ecbEstr
  ecbEuribor1y: { key: "seed-meta:economic:ecb-short-rates", maxStaleMin: 4320 },
  // shared meta key with ecbEstr
  gscpi: { key: "seed-meta:economic:gscpi", maxStaleMin: 2880 },
  // 24h interval; 2880min = 48h = 2x interval
  fearGreedIndex: { key: "seed-meta:market:fear-greed", maxStaleMin: 720 },
  // 6h cron; 720min = 12h = 2x interval
  breadthHistory: { key: "seed-meta:market:breadth-history", maxStaleMin: 5760 },
  // cron at 02:00 UTC, Tue-Sat (captures Mon-Fri market close); max gap Sat→Tue = 72h + 24h miss buffer = 96h = 5760min. 48h was wrong — alarmed every Monday morning when Sun+Mon are intentionally skipped.
  marketCorrelationSeries: {
    key: "seed-meta:market:correlation-series",
    maxStaleMin: 45,
    minRecordCount: 6,
    cutover: {
      mode: "expiring-ack",
      fromKey: null,
      issue: 6418,
      status: "EMPTY"
    }
  },
  // 15min bundle member; three missed runs should alert before the 14d chart ages materially.
  hormuzTracker: { key: "seed-meta:supply_chain:hormuz_tracker", maxStaleMin: 2880 },
  // daily cron; 2880min = 48h = 2x interval
  earningsCalendar: { key: "seed-meta:market:earnings-calendar", maxStaleMin: 1440 },
  // 12h cron; 1440min = 24h = 2x interval
  econCalendar: { key: "seed-meta:economic:econ-calendar", maxStaleMin: 1440 },
  // 12h cron; 1440min = 24h = 2x interval
  cotPositioning: { key: "seed-meta:market:cot", maxStaleMin: 14400 },
  // weekly CFTC release; 14400min = 10d = 1.4x interval (weekend + delay buffer)
  hyperliquidFlow: { key: "seed-meta:market:hyperliquid-flow", maxStaleMin: 30 },
  // 5min cron (bundled in seed-bundle-market-backup); 30min = 6× interval. Was 15 (3× = gold-standard floor with zero safety margin) — same exposure as correlationCards. Pre-fix comment said "Railway cron" but it's bundle-driven, so subject to the 80% skip-gate that produced 9-19min jitter under load.
  crudeInventories: { key: "seed-meta:economic:crude-inventories", maxStaleMin: 20160 },
  // weekly EIA data; 20160min = 14 days = 2x weekly cadence
  natGasStorage: { key: "seed-meta:economic:nat-gas-storage", maxStaleMin: 20160 },
  // weekly EIA data; 20160min = 14 days = 2x weekly cadence
  spr: { key: "seed-meta:economic:spr", maxStaleMin: 20160 },
  // weekly EIA data; 20160min = 14 days = 2x weekly cadence
  refineryInputs: { key: "seed-meta:economic:refinery-inputs", maxStaleMin: 20160 },
  // weekly EIA data; 20160min = 14 days = 2x weekly cadence
  ecbFxRates: { key: "seed-meta:economic:ecb-fx-rates", maxStaleMin: 5760 },
  // daily seed (weekdays + holidays); 5760min = 96h = covers Wed→Mon Easter gap
  // daily seed (seed-bundle-macro); 4320min = 72h = 3x interval, and below the 4d
  // canonical TTL so the key outlives its own gate. minRecordCount mirrors
  // MIN_RATE_COUNT in scripts/seed-cbr-rates.mjs (30 currencies + the key rate):
  // a truncated cbr.ru body still parses into a handful of well-formed rows, so
  // a shrunken table must surface as COVERAGE_PARTIAL rather than OK.
  cbrRates: { key: "seed-meta:economic:cbr-rates", maxStaleMin: 4320, minRecordCount: 31 },
  eurostatCountryData: { key: "seed-meta:economic:eurostat-country-data", maxStaleMin: 4320 },
  // daily seed; 4320min = 3 days = 3x interval
  eurostatHousePrices: { key: "seed-meta:economic:eurostat-house-prices", maxStaleMin: 60 * 24 * 50 },
  // weekly cron, annual data; 50d threshold = 35d TTL + 15d buffer
  eurostatGovDebtQ: { key: "seed-meta:economic:eurostat-gov-debt-q", maxStaleMin: 60 * 24 * 14 },
  // 2d cron, quarterly data; 14d threshold matches TTL + quarterly release drift
  eurostatIndProd: { key: "seed-meta:economic:eurostat-industrial-production", maxStaleMin: 60 * 24 * 5 },
  // daily cron, monthly data; 5d threshold matches TTL
  euGasStorage: { key: "seed-meta:economic:eu-gas-storage", maxStaleMin: 2880 },
  // daily seed (T+1); 2880min = 48h = 2x interval
  euYieldCurve: { key: "seed-meta:economic:yield-curve-eu", maxStaleMin: 4320 },
  // daily seed (weekdays only); 4320min = 72h = covers Fri→Mon gap
  euFsi: { key: "seed-meta:economic:fsi-eu", maxStaleMin: 5760 },
  // daily seed (weekdays + holidays); 5760min = 96h = covers Wed→Mon Easter gap. Data freshness is tracked separately via content-age (STALE_CONTENT) — see seed-fsi-eu.mjs.
  newsThreatSummary: { key: "seed-meta:news:threat-summary", maxStaleMin: 60 },
  // relay classify every ~20min; 60min = 3x interval
  shippingStress: { key: "seed-meta:supply_chain:shipping_stress", maxStaleMin: 45 },
  // relay loop every 15min; 45 = 3x interval (was 30 = 2×, too tight on relay hiccup)
  diseaseOutbreaks: { key: "seed-meta:health:disease-outbreaks", maxStaleMin: 2880 },
  // daily seed; 2880 = 48h = 2x interval
  healthAirQuality: { key: "seed-meta:health:air-quality", maxStaleMin: 180 },
  // hourly cron; 180 = 3x interval for shared health/climate seed
  socialVelocity: { key: "seed-meta:intelligence:social-reddit", maxStaleMin: 540 },
  // relay loop every 180min (3h; was 60min, dropped now that ScrapeCreators handles Reddit); 540 = 3x interval. Co-pinned with SOCIAL_VELOCITY_TTL=43200 (ais-relay.cjs): the data-key TTL must STRICTLY exceed this (720min > 540min) so a dead relay shows STALE_SEED before the key expires to EMPTY.
  wsbTickers: { key: "seed-meta:intelligence:wsb-tickers", maxStaleMin: 540 },
  // relay loop every 180min (3h); 540 = 3x interval. Co-pinned with WSB_TICKERS_TTL=43200 (ais-relay.cjs); TTL strictly > maxStaleMin (see socialVelocity note).
  pizzint: { key: "seed-meta:intelligence:pizzint", maxStaleMin: 30 },
  // relay loop every 10min; 30 = 3x interval
  productCatalog: { key: "seed-meta:product-catalog", maxStaleMin: 1080 },
  // relay loop every 6h; 1080 = 18h = 3x interval
  vpdTrackerRealtime: { key: "seed-meta:health:vpd-tracker", maxStaleMin: 2880 },
  // daily seed (0 2 * * *); 2880min = 48h = 2x interval
  vpdTrackerHistorical: { key: "seed-meta:health:vpd-tracker", maxStaleMin: 2880 },
  // shares seed-meta key with vpdTrackerRealtime (same run)
  resilienceStaticIndex: { key: "seed-meta:resilience:static", maxStaleMin: 576e3, projectFailedDatasets: true },
  // annual October snapshot; 400d threshold matches TTL and preserves prior-year data on source outages
  resilienceStaticFao: { key: "seed-meta:resilience:static", maxStaleMin: 576e3 },
  // same seeder + same heartbeat as resilienceStaticIndex; required so EMPTY_DATA_OK + missing data degrades to STALE_SEED instead of silent OK
  foodStocks: {
    key: "seed-meta:resilience:food-stocks",
    maxStaleMin: 86400,
    // monthly WASDE cycle; 86400min = 60d = 2× interval. Content-age is marketing-year presence (see seed-food-stocks.mjs), not this fetch clock.
    cutover: {
      mode: "expiring-ack",
      fromKey: null,
      issue: 6440,
      status: "EMPTY"
    }
  },
  resilienceRanking: { key: "seed-meta:resilience:ranking", maxStaleMin: 840, requireResilienceCacheState: true },
  // RPC cache (12h TTL, refreshed every 6h by seed-resilience-scores cron); 14h budget tolerates 1 missed tick (12h gap) + ~2h jitter for in-flight deploys that preempt a scheduled tick; alerts at 2 missed ticks (18h gap). Bumped from 720 — see comment below.
  resilienceIntervals: { key: "seed-meta:resilience:intervals", maxStaleMin: 840, minRecordCount: RESILIENCE_INTERVAL_MIN_RECORD_COUNT, requireResilienceCacheState: true },
  // bundled into seed-bundle-resilience, written by the Resilience-Scores section. Real Railway cron is `0 */6 * * *` (every 6h on the hour, UTC) — empirically verified 2026-04-28 via Railway logs showing 6h gaps between successful runs (the prior `intervalMs=2h with hourly fires` claim did not match what's deployed; either the bundle interval gate or the Railway service schedule makes the effective cadence 6h). 840 = 14h staleness ≈ 2.33× cadence: tolerates 1 missed tick (12h gap) + ~2h jitter for in-flight deploys; alerts at 2 missed ticks (18h gap). The 180-record floor matches the atomic publisher: a fresh probe cannot hide a mixed or shrunken fleet. Matches resilienceRanking above (same Resilience-Scores section writes both). Prior values: 20160 (14d, 168× — silent on real outage), 1080 (18h, 3× — over-permissive: masks a 12h outage), 720 (12h, 2× — exact floor; flipped UptimeRobot WARNING for ~1min on every Railway-deploy-preempted tick: 2026-05-10 incident at 18:02 UTC, seedAgeMin=722 vs maxStale=720 after the 12:00 UTC tick was skipped during an in-flight deploy), 360 (1× — false-positive on routine jitter, 2026-04-28: seedAgeMin=367 vs maxStale=360). Re-tighten ONLY if/when the actual Railway cron schedule is verified sub-6h.
  energyExposure: { key: "seed-meta:economic:owid-energy-mix", maxStaleMin: 50400 },
  // monthly cron on 1st; 50400min = 35d = TTL matches cron cadence + 5d buffer
  energyMixAll: { key: "seed-meta:economic:owid-energy-mix", maxStaleMin: 50400 },
  // same seed run as energyExposure; shares seed-meta key
  regulatoryActions: { key: "seed-meta:regulatory:actions", maxStaleMin: 360 },
  // 2h cron; 360min = 3x interval
  energySpineCountries: { key: "seed-meta:energy:spine", maxStaleMin: 2880 },
  // daily cron (06:00 UTC); 2880min = 48h = 2x interval
  electricityPrices: { key: "seed-meta:energy:electricity-prices", maxStaleMin: 2880 },
  // daily cron (14:00 UTC); 2880min = 48h = 2x interval
  gasStorageCountries: { key: "seed-meta:energy:gas-storage-countries", maxStaleMin: 2880 },
  // daily cron at 10:30 UTC; 2880min = 48h = 2x interval
  energyIntelligence: { key: "seed-meta:energy:intelligence", maxStaleMin: 720 },
  // 6h cron; 720min = 2x interval
  // `chinaCoverage` opts these three into the producer diagnostic below. An
  // unusable China row no longer withholds the JODI publish (#6395), so the
  // freshness verdict now describes the 51-63 countries that DID publish and
  // the China gap rides alongside it, named, instead of surfacing 40 days
  // later as a generic STALE_SEED. Content age is producer-declared
  // (newestItemAt/maxContentAgeMin in seed-meta) — a frozen upstream file
  // reads STALE_CONTENT rather than passing as fresh.
  jodiOil: { key: "seed-meta:energy:jodi-oil", maxStaleMin: 60 * 24 * 40, chinaRow: true },
  // monthly cron on 25th; 40d threshold matches 35d TTL + 5d buffer
  ieaOilStocks: { key: "seed-meta:energy:iea-oil-stocks", maxStaleMin: 60 * 24 * 40 },
  // monthly cron on 15th; 40d threshold = TTL_SECONDS
  oilStocksAnalysis: { key: "seed-meta:energy:oil-stocks-analysis", maxStaleMin: 60 * 24 * 50 },
  // afterPublish of ieaOilStocks; 50d = matches seed-meta TTL (exceeds 40d data TTL)
  eiaPetroleum: { key: "seed-meta:energy:eia-petroleum", maxStaleMin: 4320 },
  // daily bundle cron (seed-bundle-energy-sources); 72h = 3× interval, well under 7d data TTL
  jodiGas: { key: "seed-meta:energy:jodi-gas", maxStaleMin: 60 * 24 * 40, chinaRow: true },
  // monthly cron on 25th; 40d threshold matches 35d TTL + 5d buffer
  lngVulnerability: { key: "seed-meta:energy:jodi-gas", maxStaleMin: 60 * 24 * 40, chinaRow: true },
  // written by jodi-gas seeder afterPublish; shares seed-meta key
  chokepointBaselines: { key: "seed-meta:energy:chokepoint-baselines", maxStaleMin: 60 * 24 * 400 },
  // 400 days
  // maxStaleMin is 120d = 2x the 60-day bundle interval, matching the repo's
  // 2-3x norm. The data is annual but the PUBLISHER runs every 60 days, so the
  // previous 400-day budget (6.7x cadence) would have let a dead seeder read OK
  // until ~2027-09; the 540-day content-age gate would not have covered it
  // either. Sized to the publisher, not the source.
  // Keep `key` and `maxStaleMin` adjacent: the coverage guard in
  // tests/seed-ttl-outlives-staleness-fleet.test.mjs matches them with a single
  // regex that only tolerates whitespace between the two, so a comment placed
  // between them drops this gate from the parsed set.
  mineralProduction: {
    key: "seed-meta:supply-chain:mineral-production",
    maxStaleMin: 60 * 24 * 120,
    cutover: {
      mode: "expiring-ack",
      fromKey: null,
      issue: 6439,
      status: "EMPTY"
    }
  },
  sprPolicies: { key: "seed-meta:energy:spr-policies", maxStaleMin: 60 * 24 * 400 },
  // 400 days; static registry, same cadence as chokepoint baselines
  pipelinesGas: { key: "seed-meta:energy:pipelines-gas", maxStaleMin: 20160 },
  // 14d — weekly cron (7d) × 2 headroom
  pipelinesOil: { key: "seed-meta:energy:pipelines-oil", maxStaleMin: 20160 },
  // 14d — same seed-pipelines.mjs publishes both keys
  storageFacilities: { key: "seed-meta:energy:storage-facilities", maxStaleMin: 20160 },
  // 14d — weekly cron (7d) × 2 headroom
  fuelShortages: { key: "seed-meta:energy:fuel-shortages", maxStaleMin: 2880 },
  // 2d — daily cron × 2 headroom (classifier-driven post-launch)
  energyDisruptions: { key: "seed-meta:energy:disruptions", maxStaleMin: 20160 },
  // 14d — weekly cron × 2 headroom
  energyCrisisPolicies: { key: "seed-meta:energy:crisis-policies", maxStaleMin: 60 * 24 * 400 },
  // static data, ~400d TTL matches seeder
  aaiiSentiment: { key: "seed-meta:market:aaii-sentiment", maxStaleMin: 20160 },
  // weekly cron; 20160min = 14 days = 2x weekly cadence
  portwatchChokepointsRef: { key: "seed-meta:portwatch:chokepoints-ref", maxStaleMin: 60 * 24 * 14 },
  // seed-bundle-portwatch runs this at WEEK cadence; 14d = 2× interval
  chokepointFlows: { key: "seed-meta:energy:chokepoint-flows", maxStaleMin: 720 },
  // 6h cron; 720min = 2x interval
  // Relay-side heartbeat written by ais-relay.cjs on successful child exit.
  // Detects "relay loop fires but child dies at import/runtime" failures
  // (e.g. ERR_MODULE_NOT_FOUND from a missing Dockerfile COPY) 4h earlier
  // than the 720min seed-meta threshold above. TTL is 18h on the writer.
  chokepointFlowsRelayHeartbeat: { key: "relay:heartbeat:chokepoint-flows", maxStaleMin: 480 },
  // 6h loop; 8h alarm
  climateNewsRelayHeartbeat: { key: "relay:heartbeat:climate-news", maxStaleMin: 60 },
  // 30m loop; 60m alarm
  emberElectricity: { key: "seed-meta:energy:ember", maxStaleMin: 2880 },
  // daily cron (08:00 UTC); 2880min = 48h = 2x interval
  cryptoSectors: { key: "seed-meta:market:crypto-sectors", maxStaleMin: 120 },
  // relay loop every ~30min; 120min = 2h = 4x interval
  ddosAttacks: { key: "seed-meta:cf:radar:ddos", maxStaleMin: 60 },
  // written by seed-internet-outages afterPublish; outages cron ~15min; 60 = 4x interval
  economicStress: { key: "seed-meta:economic:stress-index", maxStaleMin: 180 },
  // computed in seed-economy afterPublish; cron ~1h; 180min = 3x interval
  marketImplications: {
    key: "seed-meta:intelligence:market-implications",
    maxStaleMin: 120,
    // LLM-generated in seed-forecasts; cron ~1h; 120min = 2x interval
    // The tail LLM stage misses regularly — an observed five-attempt window
    // produced three publications and two provider timeouts — while the cards
    // it publishes stay useful for hours. seed-forecasts holds `fetchedAt` at
    // the served vintage on a miss (so the 120min gate above still governs)
    // and records the streak here. Thresholds are sized to the SAME hourly
    // cadence as maxStaleMin: two consecutive misses is ~2h without a fresh
    // generation, and a failure with no follow-up attempt for 120min means
    // the stage stopped running at all. `warnWithoutSuccess` is deliberately
    // absent: the producer only records a streak when it has a served payload
    // to point at, which is itself proof of an earlier success, so the flag
    // could never fire here.
    synthesisFailure: {
      warnAfterConsecutive: 2,
      warnAfterAgeMin: 120,
      failureCodePattern: /^MARKET_IMPLICATIONS_(LLM_NO_RESPONSE|NO_PARSEABLE_CARDS|VALIDATION|UNKNOWN)$/
    }
  },
  trafficAnomalies: { key: "seed-meta:cf:radar:traffic-anomalies", maxStaleMin: 60 },
  // written by seed-internet-outages afterPublish; outages cron ~15min; 60 = 4x interval
  chokepointExposure: { key: "seed-meta:supply_chain:chokepoint-exposure", maxStaleMin: 2880 },
  // daily cron; 2880min = 48h = 2x interval
  recoveryFiscalSpace: { key: "seed-meta:resilience:recovery:fiscal-space", maxStaleMin: 129600 },
  // monthly cron; 129600min = 90d = 3x interval (bumped from 86400/60d = 2x in PR #3669 for month-2 hiccup margin)
  recoveryReserveAdequacy: { key: "seed-meta:resilience:recovery:reserve-adequacy", maxStaleMin: 86400 },
  // monthly cron; 86400min = 60d = 2x interval
  recoveryExternalDebt: { key: "seed-meta:resilience:recovery:external-debt", maxStaleMin: 86400 },
  // monthly cron; 86400min = 60d = 2x interval
  recoveryImportHhi: { key: "seed-meta:resilience:recovery:import-hhi", maxStaleMin: 50400 },
  // monthly cron; 50400min = 35d catches missed import-HHI runs before stale country coverage lingers for 46d+
  // recoveryFuelStocks: probe removed (PR #3764). See STANDALONE_KEYS comment.
  recoveryReexportShare: { key: "seed-meta:resilience:recovery:reexport-share", maxStaleMin: 86400 },
  // monthly cron; 86400min = 60d = 2x interval
  recoverySovereignWealth: { key: "seed-meta:resilience:recovery:sovereign-wealth", maxStaleMin: 86400 },
  // monthly cron; 86400min = 60d = 2x interval
  // PR 1 v2 energy seeds — weekly cron (8d * 1440 = 11520min = 2x interval).
  // STRICT SEED_META (not ON_DEMAND): plan 2026-04-24-001 made /api/health
  // CRIT on absent/stale so operators see the Railway-bundle gap before
  // the flag flips. See the ON_DEMAND_KEYS "do not add back" note below.
  lowCarbonGeneration: { key: "seed-meta:resilience:low-carbon-generation", maxStaleMin: 11520 },
  fossilElectricityShare: { key: "seed-meta:resilience:fossil-electricity-share", maxStaleMin: 11520 },
  powerLosses: { key: "seed-meta:resilience:power-losses", maxStaleMin: 11520 },
  // Education attainment — 8d budget. The bundle runs a DAILY Railway cron and
  // gates each member on its own intervalMs (7d here), so a failed attempt
  // retries on the next daily tick rather than a week later; 8d is the 7d
  // interval plus roughly one day of retry headroom, not "2x interval". The
  // budget alarms on the SEEDER being dead, not on the data being old —
  // content-age staleness is the seeder's own 48-month maxContentAgeMin.
  educationAttainment: {
    key: "seed-meta:resilience:education-attainment",
    maxStaleMin: 11520,
    minRankableRecordCount: EDUCATION_MIN_RANKABLE_RECORD_COUNT,
    // Pre-seed evidence per scripts/check-health-probe-cutovers.mts. #6450 shipped
    // the seeder but Railway refused the merge commit (its post-merge check suite
    // was red on two unrelated tests), so seed-bundle-macro ran an image without
    // the script and the probe could not be registered then. The service was
    // deployed to a green head on 2026-08-11 and this entry cites its first real
    // publish. See docs/methodology/education-flag-flip-runbook.md.
    cutover: {
      mode: "preseed",
      fromKey: null,
      issue: 6452,
      verifiedAt: "2026-08-11T08:03:25.357Z",
      evidence: {
        platform: "railway",
        service: "seed-bundle-macro",
        probeKey: "seed-meta:resilience:education-attainment",
        compactHealthStatus: "OK",
        reference: "https://github.com/koala73/worldmonitor/issues/6452#issuecomment-5252687464"
      }
    }
  },
  webcams: { key: "seed-meta:webcam:cameras:geo", maxStaleMin: 1440 },
  // seed-webcams writes 24h geo/meta keys plus a 30h active pointer; stale at 24h before the layer goes blank.
  // #5736 — history-ingest freshness per collector. `fetchedAt` here is the
  // last HEALTHY append (success, or a correctly-detected unconfigured run),
  // NEVER the last attempt, so a relay that rejects every chunk ages this out
  // while the collector's own seed-meta stays fresh. Budgets mirror each
  // collector's canonical maxStaleMin above — the hook runs once per successful
  // publish, so a tighter budget would alarm on the parent's cadence, not on
  // history. Keep in step with api/seed-health.js (intervalMin = maxStaleMin/2).
  intelHistoryIngestConflictAcled: { key: "seed-meta:intel-history:conflict:acled-intel", maxStaleMin: 38 },
  // mirrors acledIntel
  intelHistoryIngestMilitaryCrossStrait: { key: "seed-meta:intel-history:military:cross-strait-activity", maxStaleMin: 720 },
  // mirrors crossStraitActivity
  intelHistoryIngestEnergyIntelligence: { key: "seed-meta:intel-history:energy:intelligence", maxStaleMin: 720 }
  // mirrors energyIntelligence
};
var CONSUMER_PRICE_HEALTH_MARKETS = Object.freeze(["ae", "au", "br", "gb", "in", "sa", "sg", "us"]);
var consumerPriceCoverageHealthName = (market) => market === "ae" ? "consumerPricesCoverage" : `consumerPricesCoverage${market.toUpperCase()}`;
for (const market of CONSUMER_PRICE_HEALTH_MARKETS) {
  if (market === "ae") continue;
  const name = consumerPriceCoverageHealthName(market);
  BOOTSTRAP_KEYS[name] = `consumer-prices:coverage:${market}`;
  SEED_META[name] = {
    key: `seed-meta:consumer-prices:coverage:${market}`,
    maxStaleMin: 1500,
    minSuccessRate: 0.5,
    requireCoverage: true
  };
}
if (!IRAN_EVENTS_ENABLED) {
  delete BOOTSTRAP_KEYS.iranEvents;
  delete SEED_META.iranEvents;
}
var ON_DEMAND_KEYS = /* @__PURE__ */ new Set([
  // Deployment-order bridge: Vercel can ship this reader before Railway's
  // hourly bundle publishes the first summary. The seeder writes a durable
  // activation marker after its first successful publish; after that, a
  // missing/stale summary is strict forever.
  "chinaCoverage",
  // Deployment-order bridge. The worker writes a permanent activation marker
  // on its first healthy loop report; absence becomes strict immediately after.
  "companyMonitoringWorker",
  // Same deployment-order bridge as chinaCoverage: Vercel can ship this reader
  // before seed-bundle-macro's next 08:00 UTC tick publishes the first CBR
  // table, and the every-15-minute freshness monitor would otherwise report an
  // unactionable EMPTY/CRIT for up to a day. seed-cbr-rates.mjs SETs the durable
  // marker after its first successful publish; from then on it is strict forever.
  "cbrRates",
  "riskScoresLive",
  "usniFleetStale",
  "positiveEventsLive",
  "bisPolicy",
  "bisExchange",
  "bisCredit",
  // bisDsr/bisPropertyResidential/bisPropertyCommercial have dedicated SEED_META
  // entries (seed-bis-extended.mjs), so they are not on-demand.
  // shippingRates is a scheduled 6h producer and FAST bootstrap key;
  // absence must be EMPTY/CRIT rather than on-demand.
  "macroSignals",
  "chokepoints",
  "minerals",
  "giving",
  "cyberThreatsRpc",
  "militaryBases",
  "displacement",
  "corridorrisk",
  // intermediate key; data flows through transit-summaries:v1
  "serviceStatuses",
  // RPC-populated; seed-meta written on fresh fetch only, goes stale between visits
  // marketImplications removed 2026-05-01 — see policy block above. Homepage panel,
  // chronic LLM-provider failures must surface as CRIT.
  "simulationPackageLatest",
  // written by writeSimulationPackage after deep forecast runs; only present after first successful deep run
  "simulationOutcomeLatest",
  // written by writeSimulationOutcome after simulation runs; only present after first successful simulation
  // #4927 review P1: activation-gated on the operator adding UPSTASH_* as GH
  // Actions secrets — the publishers skip silently without them, so a
  // never-activated key must read as soft EMPTY_ON_DEMAND, not EMPTY/CRIT,
  // while the workflow stays green. On-demand softening is REVOKED once the
  // durable activation marker exists (see ACTIVATION_MARKERS): after the
  // first publish, missing data/meta is EMPTY/STALE_SEED like any other key.
  "newsFeedHealth",
  "newsRecallBenchmark",
  "newsThreatSummary",
  // relay classify loop — only written when mergedByCountry has entries; absent on quiet news periods
  "resilienceRanking",
  // on-demand RPC cache populated after ranking requests; missing before first Pro use is expected
  "recoveryFiscalSpace",
  "recoveryReserveAdequacy",
  "recoveryExternalDebt",
  // NOTE (2026-04-24, plan 2026-04-24-001): the PR 1 v2 energy seeds
  // (`lowCarbonGeneration`, `fossilElectricityShare`, `powerLosses`)
  // are INTENTIONALLY NOT listed in ON_DEMAND_KEYS. They stay strict
  // SEED_META so `/api/health` returns CRIT (not WARN) when they are
  // absent — which is the alarm a future operator needs before flipping
  // `RESILIENCE_ENERGY_V2_ENABLED=true`. The scorer fails closed via
  // ResilienceConfigurationError if the flag flips before the seeds
  // populate (server/worldmonitor/resilience/v1/_dimension-scorers.ts
  // #scoreEnergy). Do NOT add these labels back to ON_DEMAND_KEYS
  // without revisiting that plan.
  "displacementPrev",
  // covered by cascade onto current-year displacement; empty most of the year
  // #6070 retired six expired deployment-order bridges after live producer
  // verification. Future temporary softening needs an activation marker or an
  // enforced wall-clock expiry; a prose-only removal reminder is not a control.
  // #5736 deployment-order bridge, activation-gated like chinaCoverage: Vercel
  // ships this registry the moment the PR merges, but the record only exists
  // after the collector's next Railway tick (up to 6h for energy/intelligence).
  // Softening is revoked the instant the durable marker appears — after the
  // first report, an absent record is EMPTY and a stalled one is STALE_SEED.
  "intelHistoryIngestConflictAcled",
  "intelHistoryIngestMilitaryCrossStrait",
  "intelHistoryIngestEnergyIntelligence"
]);
var ACTIVATION_MARKERS = {
  chinaCoverage: "seed-activated:health:china-coverage",
  companyMonitoringWorker: "seed-activated:company-monitoring:worker",
  // Written by scripts/seed-cbr-rates.mjs (CBR_ACTIVATION_KEY) in runSeed's
  // afterPublish hook, so it exists only once a real table has been published.
  cbrRates: "seed-activated:economic:cbr-rates",
  newsFeedHealth: "seed-activated:news:feed-health",
  newsRecallBenchmark: "seed-activated:news:recall-benchmark",
  // Written by scripts/_seed-history.mjs on every ingest-health report,
  // including an `unconfigured` one — "the hook ran" is the activation signal,
  // not "the relay answered". See historyIngestActivationKey there.
  intelHistoryIngestConflictAcled: "seed-activated:intel-history:conflict:acled-intel",
  intelHistoryIngestMilitaryCrossStrait: "seed-activated:intel-history:military:cross-strait-activity",
  intelHistoryIngestEnergyIntelligence: "seed-activated:intel-history:energy:intelligence",
  // #6060 deployment-order softening. This Edge function redeploys within
  // minutes of merge; the producer is a 12h Railway cron. The marker is written
  // on the first run that publishes a contentFreshness block, so "the producer
  // has never shipped this field" reads as pending rather than as a fault —
  // while a block that DISAPPEARS after activation still fails closed.
  portwatchContentFreshness: PORTWATCH_CONTENT_FRESHNESS_ACTIVATION_KEY,
  // Written without a TTL by scripts/seed-fred-rates.mjs only after runSeed
  // successfully publishes the version-1 canonical batch. The marker makes
  // first publication one-way: a later disappearance is strict forever.
  fredRatesSeeder: "seed-activated:economic:fred-rates:v1"
};
var CONSUMER_PRICE_COVERAGE_SCHEMA_VERSION = 1;
var consumerPriceCoverageActivationKey = (market) => `seed-activated:consumer-prices:coverage:v${CONSUMER_PRICE_COVERAGE_SCHEMA_VERSION}:${market}`;
var COVERAGE_FAILURE_REASONS = Object.freeze([
  "provider-cooldown",
  "provider-error",
  "missing-price",
  "price-evidence-missing",
  "quantity-as-price",
  "currency-mismatch",
  "title-mismatch",
  "validator-rejected",
  "parsed-zero-products",
  "pin-validator-rejected",
  "unknown-error"
]);
function sanitizeCoverageFailureReasons(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const clean = {};
  for (const reason of COVERAGE_FAILURE_REASONS) {
    const count = Number(raw[reason]);
    if (Number.isSafeInteger(count) && count > 0) clean[reason] = count;
  }
  return clean;
}
var CONSUMER_PRICE_COVERAGE_ROLLOUT = Object.freeze({
  ae: { from: "2026-08-02T10:54:58Z", until: "2026-08-03T06:00:00Z" },
  au: { from: "2026-08-02T10:54:58Z", until: "2026-08-03T06:00:00Z" },
  br: { from: "2026-08-02T10:54:58Z", until: "2026-08-03T06:00:00Z" },
  gb: { from: "2026-08-02T10:54:58Z", until: "2026-08-03T06:00:00Z" },
  in: { from: "2026-08-02T10:54:58Z", until: "2026-08-03T06:00:00Z" },
  sa: { from: "2026-08-02T10:54:58Z", until: "2026-08-03T06:00:00Z" },
  sg: { from: "2026-08-02T10:54:58Z", until: "2026-08-03T06:00:00Z" },
  us: { from: "2026-08-02T10:54:58Z", until: "2026-08-03T06:00:00Z" }
});
var ROLLOUT_PENDING_UNTIL_MS = {};
var ROLLOUT_PENDING_FROM_MS = {};
for (const market of CONSUMER_PRICE_HEALTH_MARKETS) {
  const name = consumerPriceCoverageHealthName(market);
  ACTIVATION_MARKERS[name] = consumerPriceCoverageActivationKey(market);
  const window = CONSUMER_PRICE_COVERAGE_ROLLOUT[market];
  const until = Date.parse(window?.until ?? "");
  const from = Date.parse(window?.from ?? "");
  if (Number.isFinite(until)) ROLLOUT_PENDING_UNTIL_MS[name] = until;
  if (Number.isFinite(from)) ROLLOUT_PENDING_FROM_MS[name] = from;
}
function fredRatesRolloutCommands(now, vercelEnv = process.env.VERCEL_ENV) {
  if (vercelEnv !== "production") return [];
  const candidateUntil = now + FRED_RATES_ROLLOUT_DURATION_MS;
  return [
    ["SET", FRED_RATES_ROLLOUT_DEADLINE_KEY, String(candidateUntil), "NX"],
    ["GET", FRED_RATES_ROLLOUT_DEADLINE_KEY]
  ];
}
function parseFredRatesRolloutUntil(results) {
  if (!Array.isArray(results) || results.length !== 2) return null;
  if (results[0]?.error || results[1]?.error) return null;
  const until = Number(results[1]?.result);
  return Number.isSafeInteger(until) && until > 0 ? until : null;
}
var EMPTY_DATA_OK_KEYS = /* @__PURE__ */ new Set([
  "notamClosures",
  "faaDelays",
  "intlDelays",
  "gpsjam",
  "positiveGeoEvents",
  "weatherAlerts",
  "earningsCalendar",
  "econCalendar",
  "cotPositioning",
  "usniFleet",
  // usniFleetStale covers the fallback; relay outages → WARN not CRIT
  "newsThreatSummary",
  // only written when classify produces country matches; quiet news periods = 0 countries, no write
  "recoveryFiscalSpace",
  "ddosAttacks",
  "trafficAnomalies",
  // zero events during quiet periods is valid, not critical
  "resilienceStaticFao",
  // empty aggregate = no IPC Phase 3+ countries this year (possible in theory); the key must exist but count=0 is fine
  "cableHealth",
  // `cables: {}` = no active subsea cable disruptions per NGA NAVAREA warnings — all cables implicitly healthy. Also covers NGA-upstream-down windows where get-cable-health writes back the fallback response (empty cables); without this, those would alarm EMPTY_DATA.
  "forecastBets",
  // #5233 shadow bet-engine stream; absent before the cron ships it and empty on weeks the energy feed yields no bet — tolerate as STALE_SEED (warn), not EMPTY (crit).
  "forecastFunnel",
  // #5233 funnel guardrail is a new afterPublish side-write; before the first seed-forecasts run ships it the key is absent — tolerate as STALE_SEED (warn), not EMPTY (crit). A COLLAPSED funnel still surfaces via seed-meta status:'error' → SEED_ERROR, which classifyKey checks before this branch.
  // Compact projections stay STALE_SEED before their first producer tick or
  // after metadata turns stale. Fresh metadata plus a missing payload is
  // deliberately strict: MISSING_DATA_IS_FAILURE_KEYS reports EMPTY (crit).
  "thermalEscalationBootstrap",
  "ucdpEventsBootstrap",
  "forecastsBootstrap",
  "wildfiresBootstrap",
  "crossStraitActivityBootstrap"
]);
var MISSING_DATA_IS_FAILURE_KEYS = /* @__PURE__ */ new Set([
  // These sparse feeds publish an explicit canonical payload on every
  // successful cycle, including valid zero-record cycles. Fresh metadata
  // therefore cannot excuse a vanished data key.
  "cableHealth",
  "notamClosures",
  "thermalEscalationBootstrap",
  "ucdpEventsBootstrap",
  "wildfiresBootstrap",
  "forecastsBootstrap",
  "positiveGeoEvents",
  "crossStraitActivityBootstrap"
]);
var ZERO_RECORD_DATA_OK_KEYS = /* @__PURE__ */ new Set([
  ...EMPTY_DATA_OK_KEYS,
  "globalTendersSam",
  "globalTendersTed",
  "globalTendersContractsFinder",
  "globalTendersCanadaBuys",
  "globalTendersGets",
  "globalTendersWorldBank",
  // retailer-spread is SUPPRESSED to an explicit 0 by the aggregate job when a
  // market's retailers share < MIN_SPREAD_ITEMS (4) common basket items —
  // consumer-prices-core/src/jobs/aggregate.ts writes `retailer_spread_pct: 0`
  // ("prevent stale noisy value persisting") and logs "spread suppressed
  // (N/4 common items)". That is a valid data-coverage state, not a pipeline
  // outage: the AE basket's cross-retailer overlap shrank 2/4 → 1/4 → 0/4 over
  // late-May 2026 while the seeder kept running fresh (seedAgeMin well inside
  // maxStaleMin) and the sibling keys (overview/categories/movers/basket-series)
  // published normally. Treat 0 records as OK while fresh; STALE_SEED still
  // fires if the publish job itself stops.
  "consumerPricesSpread",
  // CF Radar curated outage annotations (seed-internet-outages, zeroIsValid)
  // are sparse — most 28d windows publish an empty {outages:[]} envelope with
  // recordCount=0 (hasData=true). NARROW set, not EMPTY_DATA_OK_KEYS: the
  // seeder always publishes the array, so a MISSING canonical key is a real
  // publish failure → still EMPTY (crit). Siblings ddosAttacks/trafficAnomalies
  // sit in the broad set because their data key can be wholly absent on quiet
  // (writeSeedMeta-only path).
  "outages",
  // Official disclosure categories are sparse. The canonical snapshot always
  // exists after a successful query, but a quiet 90-day window can validly
  // contain zero owned-category events.
  "chinaCorporateDisclosures",
  // #5736 ingest-health records. `recordCount` is the volume the relay accepted
  // on the last successful append, and zero is legitimate — a run whose records
  // were all deduped, or one with no noteworthy records at all. The record key
  // itself must still exist, so this is the NARROW set: a vanished record is a
  // real gap, not a quiet period.
  "intelHistoryIngestConflictAcled",
  "intelHistoryIngestMilitaryCrossStrait",
  "intelHistoryIngestEnergyIntelligence",
  // A completed surge calculation can legitimately contain no surge events;
  // the canonical snapshot must still exist and remain fresh.
  "militarySurges"
]);
var CASCADE_GROUPS = {
  theaterPosture: ["theaterPosture", "theaterPostureLive", "theaterPostureBackup"],
  theaterPostureLive: ["theaterPosture", "theaterPostureLive", "theaterPostureBackup"],
  theaterPostureBackup: ["theaterPosture", "theaterPostureLive", "theaterPostureBackup"],
  militaryFlights: ["militaryFlights", "militaryFlightsStale"],
  militaryFlightsStale: ["militaryFlights", "militaryFlightsStale"],
  // Displacement key embeds UTC year — on Jan 1 the new-year key may be empty
  // for hours until the seed runs. Cascade onto the previous-year snapshot.
  displacement: ["displacement", "displacementPrev"],
  displacementPrev: ["displacement", "displacementPrev"]
};
var NEG_SENTINEL = "__WM_NEG__";
function parseRedisValue(raw) {
  if (!raw || raw === NEG_SENTINEL) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
function strlenIsData(strlen) {
  return strlen > 0 && strlen !== NEG_SENTINEL.length;
}
var LIST_DATA_KEYS = /* @__PURE__ */ new Set([
  STANDALONE_KEYS.forecastBets
  // LPUSH/LTRIM — scripts/seed-forecast-bets.mjs
]);
function dataLenCommand(redisKey) {
  return [LIST_DATA_KEYS.has(redisKey) ? "LLEN" : "STRLEN", redisKey];
}
function keyHasData(redisKey, len) {
  return LIST_DATA_KEYS.has(redisKey) ? len > 0 : strlenIsData(len);
}
var TRADE_FLOW_DOMINANT_FAILURE_MODES = /* @__PURE__ */ new Set([
  "run-failed",
  "upstream",
  "empty",
  "incomplete-years",
  "mixed",
  "none"
]);
var COMPANY_MONITORING_WORKER_STATUSES = /* @__PURE__ */ new Set(["ok", "error"]);
var COMPANY_MONITORING_SCAN_OUTCOMES = /* @__PURE__ */ new Set([
  "starting",
  "disabled",
  "idle",
  "completed",
  "non_reassuring",
  "fenced",
  "replayed",
  "claim_error",
  "finalize_error"
]);
var COMPANY_MONITORING_ADMISSION_OUTCOMES = /* @__PURE__ */ new Set([
  "disabled",
  "idle",
  "admission_recorded",
  "admission_replayed",
  "admission_transport_failure",
  "admission_claim_error",
  "admission_finalize_error"
]);
var COMPANY_MONITORING_WORKER_OUTCOMES = /* @__PURE__ */ new Set([
  ...COMPANY_MONITORING_SCAN_OUTCOMES,
  ...COMPANY_MONITORING_ADMISSION_OUTCOMES
]);
var COMPANY_MONITORING_WORKER_COUNTERS = Object.freeze([
  "loops",
  "claims",
  "completed",
  "nonReassuring",
  "fenced",
  "replayed",
  "executorErrors",
  "claimErrors",
  "finalizeErrors",
  "admissionClaims",
  "admissionRecorded",
  "admissionReplayed",
  "admissionTransportFailures",
  "admissionClaimErrors",
  "admissionFinalizeErrors"
]);
function projectCompanyMonitoringWorkerSubsystem(raw, outcomes) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || !COMPANY_MONITORING_WORKER_STATUSES.has(raw.status) || !outcomes.has(raw.outcome)) return null;
  return { status: raw.status, outcome: raw.outcome };
}
function projectCompanyMonitoringWorkerControl(meta, enabled) {
  if (!enabled || !COMPANY_MONITORING_WORKER_STATUSES.has(meta?.status) || !COMPANY_MONITORING_WORKER_OUTCOMES.has(meta?.outcome)) return null;
  let subsystems;
  if (meta.subsystems !== void 0) {
    if (!meta.subsystems || typeof meta.subsystems !== "object" || Array.isArray(meta.subsystems)) return null;
    const scan = projectCompanyMonitoringWorkerSubsystem(
      meta.subsystems.scan,
      COMPANY_MONITORING_SCAN_OUTCOMES
    );
    const admission = projectCompanyMonitoringWorkerSubsystem(
      meta.subsystems.admission,
      COMPANY_MONITORING_ADMISSION_OUTCOMES
    );
    if (!scan || !admission) return null;
    subsystems = { scan, admission };
  }
  const counters = {};
  for (const name of COMPANY_MONITORING_WORKER_COUNTERS) {
    const value = meta?.counters?.[name];
    counters[name] = Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 9999999999) : 0;
  }
  return {
    status: meta.status,
    outcome: meta.outcome,
    ...subsystems ? { subsystems } : {},
    counters
  };
}
var JODI_CHINA_ROW_REASONS = /* @__PURE__ */ new Set([
  "china-missing",
  "china-invalid-month",
  "china-stale",
  "china-no-measurements"
]);
function projectJodiChinaRow(meta, enabled) {
  if (!enabled) return null;
  const raw = meta?.chinaRow;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const ok = raw.ok === true;
  const ageMonths = typeof raw.ageMonths === "number" ? raw.ageMonths : NaN;
  const unavailableSince = typeof raw.unavailableSince === "number" ? raw.unavailableSince : NaN;
  return {
    ok,
    reason: !ok && typeof raw.reason === "string" && JODI_CHINA_ROW_REASONS.has(raw.reason) ? raw.reason : null,
    dataMonth: typeof raw.dataMonth === "string" && /^\d{4}-\d{2}$/.test(raw.dataMonth) ? raw.dataMonth : null,
    ageMonths: Number.isSafeInteger(ageMonths) && ageMonths >= 0 ? ageMonths : null,
    unavailableSince: !ok && Number.isFinite(unavailableSince) && unavailableSince > 0 ? unavailableSince : null
  };
}
function parseFiniteRecordCount(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 ? raw : null;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  return null;
}
function readSeedMeta(seedCfg, keyMetaValues, keyMetaErrors, now) {
  if (!seedCfg) {
    return { hasMeta: false, seedAge: null, seedStale: null, seedError: false, sourceUnavailable: false, sourceBlocked: false, metaReadFailed: false, metaCount: null, contentAge: null, coverage: null, synthesisFailure: null, dominantFailureMode: null, chinaRow: null, workerControl: null, resilienceCacheState: null };
  }
  if (keyMetaErrors.get(seedCfg.key)) {
    return { hasMeta: false, seedAge: null, seedStale: null, seedError: false, sourceUnavailable: false, sourceBlocked: false, metaReadFailed: true, metaCount: null, contentAge: null, coverage: null, synthesisFailure: null, dominantFailureMode: null, chinaRow: null, workerControl: null, resilienceCacheState: null };
  }
  const meta = unwrapEnvelope(parseRedisValue(keyMetaValues.get(seedCfg.key))).data;
  const metaCount = parseFiniteRecordCount(meta?.count ?? meta?.recordCount ?? null);
  const failedDatasets = [];
  const seenFailedDatasets = /* @__PURE__ */ new Set();
  if (seedCfg.projectFailedDatasets && Array.isArray(meta?.failedDatasets)) {
    for (const entry of meta.failedDatasets) {
      if (typeof entry !== "string" || entry.length === 0 || entry.length > 100 || seenFailedDatasets.has(entry)) continue;
      seenFailedDatasets.add(entry);
      failedDatasets.push(entry);
      if (failedDatasets.length === 50) break;
    }
  }
  const metaRankableCount = parseRankableRecordCount(meta);
  const poolCounts = parsePoolCounts(meta?.poolCounts, seedCfg.minPoolCounts);
  const errorCode = typeof meta?.errorCode === "string" && /^[A-Z0-9_]{1,64}$/.test(meta.errorCode) ? meta.errorCode : null;
  const workerControl = projectCompanyMonitoringWorkerControl(meta, seedCfg.workerControl);
  const resilienceCacheState = seedCfg.requireResilienceCacheState ? assessResilienceCacheState(meta) : null;
  if (meta?.status === "error") {
    return {
      hasMeta: true,
      seedAge: null,
      seedStale: true,
      seedError: true,
      sourceUnavailable: false,
      sourceBlocked: false,
      metaReadFailed: false,
      metaCount,
      metaRankableCount,
      poolCounts,
      contentAge: null,
      contentFreshness: null,
      decisionGroups: null,
      coverage: null,
      errorCode,
      synthesisFailure: null,
      dominantFailureMode: null,
      // A producer that reported `status: 'error'` never got far enough to
      // assess China this run; relaying the previous run's verdict here would
      // read as current.
      chinaRow: null,
      workerControl,
      resilienceCacheState,
      failedDatasets
    };
  }
  let seedAge = null;
  let seedStale = true;
  const fetchedAt = Number(meta?.fetchedAt);
  if (Number.isFinite(fetchedAt) && fetchedAt > 0) {
    seedAge = Math.round((now - fetchedAt) / 6e4);
    seedStale = seedAge > seedCfg.maxStaleMin;
  }
  if (resilienceCacheState?.ok === false) seedStale = true;
  const sourceUnavailable = meta?.sourceState === "unavailable";
  const sourceBlocked = meta?.sourceState === "blocked";
  const sourceDegraded = typeof meta?.sourceState === "string" && meta.sourceState !== "ok" && !sourceUnavailable && !sourceBlocked;
  let contentAge = null;
  if (meta && typeof meta.maxContentAgeMin === "number") {
    const newestItemAt = typeof meta.newestItemAt === "number" ? meta.newestItemAt : null;
    const contentAgeMin = newestItemAt == null ? null : Math.round((now - newestItemAt) / 6e4);
    const isFutureDated = contentAgeMin != null && contentAgeMin < 0;
    contentAge = {
      newestItemAt,
      oldestItemAt: typeof meta.oldestItemAt === "number" ? meta.oldestItemAt : null,
      maxContentAgeMin: meta.maxContentAgeMin,
      contentAgeMin,
      contentStale: contentAgeMin == null || isFutureDated || contentAgeMin > meta.maxContentAgeMin
    };
  }
  const contentFreshness = buildContentFreshnessAssessment(
    meta,
    seedCfg.requireContentFreshness,
    now
  );
  const decisionDiagnostics = seedCfg.decisionGroups ? projectChinaDecisionGroupDiagnostics(meta, {
    groupIds: seedCfg.decisionGroups,
    allowedStates: CHINA_DECISION_SIGNAL_STATES,
    healthyQuietCause: CHINA_DECISION_HEALTHY_QUIET_CAUSE
  }) : null;
  const decisionGroups = decisionDiagnostics ? {
    ...decisionDiagnostics.groupCounts,
    groupStates: decisionDiagnostics.groupStates,
    quietGroups: decisionDiagnostics.quietGroups,
    partialGroups: decisionDiagnostics.partialGroups,
    staleGroups: decisionDiagnostics.staleGroups,
    unavailableGroups: decisionDiagnostics.unavailableGroups
  } : null;
  const coverageRetailers = Array.isArray(meta?.coverage?.retailers) ? meta.coverage.retailers.slice(0, 100).map((retailer) => ({
    slug: typeof retailer?.slug === "string" ? retailer.slug.slice(0, 80) : null,
    name: typeof retailer?.name === "string" ? retailer.name.slice(0, 120) : null,
    coverageStatus: typeof retailer?.coverageStatus === "string" ? retailer.coverageStatus : "unknown",
    pagesAttempted: Number(retailer?.pagesAttempted) || 0,
    pagesSucceeded: Number(retailer?.pagesSucceeded) || 0,
    failedPages: Number(retailer?.failedPages) || 0,
    rejectedCount: Number(retailer?.rejectedCount) || 0,
    completionRatio: retailer?.completionRatio == null ? null : Number(retailer.completionRatio) || 0,
    failureReasons: sanitizeCoverageFailureReasons(retailer?.failureReasons)
  })) : null;
  const coverage = meta?.coverage && typeof meta.coverage === "object" ? {
    status: typeof meta.coverage.status === "string" ? meta.coverage.status : null,
    completedPages: Number(meta.coverage.completedPages) || 0,
    failedPages: Number(meta.coverage.failedPages) || 0,
    completionRatio: meta.coverage.completionRatio == null ? null : Number(meta.coverage.completionRatio) || 0,
    rejectedCount: Number(meta.coverage.rejectedCount) || 0,
    failureReasons: sanitizeCoverageFailureReasons(meta.coverage.failureReasons),
    retailers: coverageRetailers
  } : null;
  let synthesisFailure = null;
  if (seedCfg.synthesisFailure) {
    const consecutiveFailures = Number.isInteger(meta?.consecutiveFailures) && meta.consecutiveFailures >= 0 ? Math.min(meta.consecutiveFailures, 100) : 0;
    const lastAttemptAt = Number.isFinite(Number(meta?.lastAttemptAt)) && Number(meta.lastAttemptAt) > 0 ? Number(meta.lastAttemptAt) : null;
    const lastSuccessAt = Number.isFinite(Number(meta?.lastSuccessAt)) && Number(meta.lastSuccessAt) > 0 ? Number(meta.lastSuccessAt) : null;
    const synthesisFailureAgeMin = lastAttemptAt == null ? null : Math.round((now - lastAttemptAt) / 6e4);
    const failureCodePattern = seedCfg.synthesisFailure.failureCodePattern ?? /^INSIGHTS_SYNTHESIS_(PARSE|GATE|MISSING_CLUSTER|PROVIDER)$/;
    const lastSynthesisFailureCode = typeof meta?.lastSynthesisFailureCode === "string" && failureCodePattern.test(meta.lastSynthesisFailureCode) ? meta.lastSynthesisFailureCode : null;
    const servedGeneratedAt = typeof meta?.servedGeneratedAt === "string" && meta.servedGeneratedAt.length <= 64 ? meta.servedGeneratedAt : null;
    const warning = consecutiveFailures > 0 && (consecutiveFailures >= seedCfg.synthesisFailure.warnAfterConsecutive || synthesisFailureAgeMin != null && synthesisFailureAgeMin >= seedCfg.synthesisFailure.warnAfterAgeMin || seedCfg.synthesisFailure.warnWithoutSuccess && lastSuccessAt == null);
    synthesisFailure = {
      consecutiveFailures,
      lastAttemptAt,
      lastSuccessAt,
      servedGeneratedAt,
      synthesisFailureAgeMin,
      lastSynthesisFailureCode,
      warning
    };
  }
  let dominantFailureMode = null;
  if (seedCfg?.dominantFailureMode && typeof meta?.dominantFailureMode === "string" && TRADE_FLOW_DOMINANT_FAILURE_MODES.has(meta.dominantFailureMode)) {
    dominantFailureMode = meta.dominantFailureMode;
  }
  const chinaRow = projectJodiChinaRow(meta, seedCfg?.chinaRow);
  return {
    hasMeta: meta != null,
    seedAge,
    seedStale,
    seedError: sourceDegraded || failedDatasets.length > 0,
    sourceUnavailable,
    sourceBlocked,
    metaReadFailed: false,
    metaCount,
    metaRankableCount,
    poolCounts,
    contentAge,
    contentFreshness,
    decisionGroups,
    coverage,
    errorCode,
    synthesisFailure,
    dominantFailureMode,
    chinaRow,
    workerControl,
    resilienceCacheState,
    failedDatasets
  };
}
function isCascadeCovered(name, hasData, keyStrens, keyErrors) {
  const siblings = CASCADE_GROUPS[name];
  if (!siblings || hasData) return false;
  for (const sibling of siblings) {
    if (sibling === name) continue;
    const sibKey = STANDALONE_KEYS[sibling] ?? BOOTSTRAP_KEYS[sibling];
    if (!sibKey) continue;
    if (keyErrors.get(sibKey)) continue;
    if (keyHasData(sibKey, keyStrens.get(sibKey) ?? 0)) return true;
  }
  return false;
}
function classifyKey(name, redisKey, opts, ctx) {
  const { keyStrens, keyErrors, keyMetaValues, keyMetaErrors, now } = ctx;
  const seedCfg = SEED_META[name];
  const isOnDemand = !!opts.allowOnDemand && ON_DEMAND_KEYS.has(name) && ctx.activationStates?.get(name) !== true;
  const rolloutPendingUntil = ctx.rolloutPendingUntilMs?.get(name) ?? ROLLOUT_PENDING_UNTIL_MS[name];
  const isRolloutPending = rolloutPendingUntil != null && now < rolloutPendingUntil && ctx.activationStates?.get(name) !== true;
  const activationUnknown = Boolean(ctx.activationStates) && [
    ACTIVATION_MARKERS[name] ? name : null,
    seedCfg?.contentFreshnessActivation ?? null
  ].some((markerName) => markerName !== null && !ctx.activationStates.has(markerName));
  const meta = readSeedMeta(seedCfg, keyMetaValues, keyMetaErrors, now);
  if (keyErrors.get(redisKey) || meta.metaReadFailed || name === "educationAttainment" && ctx.educationPayloadReadFailed) {
    const entry2 = { status: "REDIS_PARTIAL", records: null };
    if (seedCfg) entry2.maxStaleMin = seedCfg.maxStaleMin;
    return entry2;
  }
  const strlen = keyStrens.get(redisKey) ?? 0;
  const hasData = keyHasData(redisKey, strlen);
  const {
    hasMeta,
    seedAge,
    seedStale,
    seedError,
    sourceUnavailable,
    sourceBlocked,
    metaCount,
    metaRankableCount,
    poolCounts,
    contentAge,
    contentFreshness,
    decisionGroups,
    coverage,
    errorCode,
    synthesisFailure,
    dominantFailureMode,
    chinaRow,
    workerControl,
    resilienceCacheState,
    failedDatasets
  } = meta;
  const rankableRecordCount = name === "educationAttainment" && Object.hasOwn(ctx, "educationPayloadRankableCount") ? ctx.educationPayloadRankableCount : metaRankableCount;
  const contentFreshnessActivationWindow = seedCfg?.requireContentFreshness && contentFreshness && !contentFreshness.fieldPresent && seedCfg.contentFreshnessActivation ? getActiveContentFreshnessActivationWindow(
    ACTIVATION_MARKERS[seedCfg.contentFreshnessActivation],
    ctx.activationStates?.get(seedCfg.contentFreshnessActivation),
    now
  ) : null;
  const contentFreshnessPending = contentFreshnessActivationWindow !== null;
  const records = hasData ? metaCount ?? 1 : 0;
  const cascadeCovered = isCascadeCovered(name, hasData, keyStrens, keyErrors);
  let fault = null;
  if (!sourceUnavailable) {
    if (sourceBlocked && name !== "crossStraitActivityJapanMod") {
      fault = "SEED_ERROR";
    } else if (sourceBlocked && hasData && records > 0 && seedStale !== true) fault = "SOURCE_BLOCKED";
    else if (synthesisFailure?.warning) fault = "SEED_ERROR";
    else if (seedError) fault = "SEED_ERROR";
  }
  let status;
  if (sourceUnavailable) status = "NOT_CONFIGURED";
  else if (!hasData) {
    let absent;
    if (cascadeCovered) absent = "OK_CASCADE";
    else if (MISSING_DATA_IS_FAILURE_KEYS.has(name) && hasMeta && (seedStale !== true || fault)) absent = "EMPTY";
    else if (EMPTY_DATA_OK_KEYS.has(name)) absent = seedStale === true ? "STALE_SEED" : "OK";
    else if (isOnDemand) absent = "EMPTY_ON_DEMAND";
    else if (isRolloutPending) absent = "ROLLOUT_PENDING";
    else absent = "EMPTY";
    status = fault && statusSeverityRank(absent) <= statusSeverityRank(fault) ? fault : absent;
  } else if (fault) status = fault;
  else if (records === 0) {
    if (ZERO_RECORD_DATA_OK_KEYS.has(name)) status = seedStale === true ? "STALE_SEED" : "OK";
    else if (isOnDemand) status = "EMPTY_ON_DEMAND";
    else status = "EMPTY_DATA";
  } else if (seedStale === true) status = "STALE_SEED";
  else if (seedCfg?.minRecordCount != null && (metaCount == null || metaCount < seedCfg.minRecordCount)) status = "COVERAGE_PARTIAL";
  else if (seedCfg?.minRankableRecordCount != null && (rankableRecordCount == null || rankableRecordCount < seedCfg.minRankableRecordCount)) status = "COVERAGE_PARTIAL";
  else if (hasPoolCoverageShortfall(poolCounts, seedCfg?.minPoolCounts)) status = "COVERAGE_PARTIAL";
  else if (seedCfg?.requireCoverage && !coverage) status = "COVERAGE_DEGRADED";
  else if (seedCfg?.requireContentFreshness && !contentFreshness?.usable && !contentFreshnessPending) {
    status = "COVERAGE_DEGRADED";
  } else if (seedCfg?.minSuccessRate != null && coverage && (coverage.completionRatio < seedCfg.minSuccessRate || coverage.status === "degraded")) status = "COVERAGE_DEGRADED";
  else if (coverage && coverage.status === "partial") status = "COVERAGE_PARTIAL";
  else if (contentAge && contentAge.contentStale) status = "STALE_CONTENT";
  else if (contentFreshness?.contentStale) status = "STALE_CONTENT";
  else status = "OK";
  const entry = { status, records };
  if (isOnDemand) entry.onDemand = true;
  if (activationUnknown) entry.activationUnknown = true;
  if (status === "ROLLOUT_PENDING") entry.rolloutPendingUntil = new Date(rolloutPendingUntil).toISOString();
  if (contentFreshnessActivationWindow) {
    entry.contentFreshnessPendingUntil = new Date(contentFreshnessActivationWindow.untilMs).toISOString();
  }
  if (rolloutPendingUntil != null) {
    entry.activated = ctx.activationStates?.get(name) === true;
  }
  if (seedAge !== null) entry.seedAgeMin = seedAge;
  if (seedCfg) entry.maxStaleMin = seedCfg.maxStaleMin;
  if (seedCfg?.minRecordCount != null) entry.minRecordCount = seedCfg.minRecordCount;
  if (seedCfg?.minRankableRecordCount != null) {
    entry.rankableRecordCount = rankableRecordCount;
    entry.minRankableRecordCount = seedCfg.minRankableRecordCount;
  }
  if (seedCfg?.minPoolCounts) entry.minPoolCounts = seedCfg.minPoolCounts;
  if (poolCounts) entry.poolCounts = poolCounts;
  if (coverage || seedCfg?.requireCoverage) entry.coverage = coverage;
  if (fault === "SEED_ERROR" && errorCode) entry.errorCode = errorCode;
  if (dominantFailureMode) entry.dominantFailureMode = dominantFailureMode;
  if (chinaRow) entry.chinaRow = chinaRow;
  if (workerControl) entry.workerControl = workerControl;
  if (resilienceCacheState) entry.cacheState = resilienceCacheState;
  if (failedDatasets?.length > 0) entry.failedDatasets = failedDatasets;
  if (contentAge) {
    entry.contentAgeMin = contentAge.contentAgeMin;
    entry.maxContentAgeMin = contentAge.maxContentAgeMin;
  }
  if (contentFreshness && !contentFreshnessPending) {
    entry.contentFreshness = projectContentFreshnessForWire(contentFreshness);
  }
  if (decisionGroups) entry.decisionGroups = decisionGroups;
  if (synthesisFailure) {
    entry.consecutiveFailures = synthesisFailure.consecutiveFailures;
    if (synthesisFailure.lastAttemptAt != null) entry.lastAttemptAt = synthesisFailure.lastAttemptAt;
    if (synthesisFailure.lastSuccessAt != null || synthesisFailure.consecutiveFailures > 0) {
      entry.lastSuccessAt = synthesisFailure.lastSuccessAt;
    }
    if (synthesisFailure.servedGeneratedAt != null) entry.servedGeneratedAt = synthesisFailure.servedGeneratedAt;
    if (synthesisFailure.synthesisFailureAgeMin != null && synthesisFailure.consecutiveFailures > 0) {
      entry.synthesisFailureAgeMin = synthesisFailure.synthesisFailureAgeMin;
    }
    if (synthesisFailure.lastSynthesisFailureCode) {
      entry.lastSynthesisFailureCode = synthesisFailure.lastSynthesisFailureCode;
    }
  }
  return entry;
}
var STATUS_COUNTS = {
  OK: "ok",
  OK_CASCADE: "ok",
  // An optional source adapter this deployment never supplied a credential for
  // (producer wrote sourceState:'unavailable'). Buckets to `ok` because there is
  // no fault and no operator action that would clear it other than opting in.
  // Must stay registered here: the summary does `STATUS_COUNTS[status] ?? 'warn'`,
  // so an unlisted status would silently re-become the warn this exists to stop.
  NOT_CONFIGURED: "ok",
  // The producer ran and classified an external transport refusal with a
  // documented reason. Retained reviewed data remains usable, and retrying the
  // same bounded paths cannot clear it, so this is informational rather than a
  // fleet-health warning.
  SOURCE_BLOCKED: "ok",
  STALE_SEED: "warn",
  SEED_ERROR: "warn",
  EMPTY_ON_DEMAND: "warn",
  REDIS_PARTIAL: "warn",
  COVERAGE_PARTIAL: "warn",
  COVERAGE_DEGRADED: "warn",
  // Content-age signal — seeder is healthy but upstream stopped publishing.
  // Operator can't fix upstream cadence, so de-rank vs. STALE_SEED in alerting
  // (both bucket to 'warn' — overall status is `degraded`, not `critical`).
  // 2026-05-04 health-readiness plan, Sprint 1.
  STALE_CONTENT: "warn",
  // Bounded deploy-before-cron window (#6059): the schema is live but its
  // producer has not reached its first scheduled run yet. Warn — NOT ok — so
  // the interim state is visible and flips `overall` to WARNING; and NOT
  // subtracted from realWarnCount the way EMPTY_ON_DEMAND is, because unlike
  // an unrequested RPC cache this one is on a clock and must be watched.
  ROLLOUT_PENDING: "warn",
  CHINA_DEGRADED: "warn",
  CHINA_UNAVAILABLE: "crit",
  EMPTY: "crit",
  EMPTY_DATA: "crit"
};
var STATUS_SEVERITY_RANK = { ok: 0, warn: 1, crit: 2 };
function statusSeverityRank(status) {
  return STATUS_SEVERITY_RANK[STATUS_COUNTS[status] ?? "warn"];
}
function isValidChinaCoverageSummary(candidate) {
  if (!candidate || typeof candidate !== "object" || candidate.schemaVersion !== 1 || candidate.countryCode !== "CN" || !["healthy", "degraded", "unavailable"].includes(candidate.status) || typeof candidate.evaluatedAt !== "string" || !Number.isFinite(Date.parse(candidate.evaluatedAt)) || !Array.isArray(candidate.entries) || candidate.entries.length === 0 || candidate.entries.length > 100 || !candidate.counts || typeof candidate.counts !== "object") {
    return false;
  }
  const ids = /* @__PURE__ */ new Set();
  const actual = {
    total: candidate.entries.length,
    launched: 0,
    planned: 0,
    blocked: 0,
    healthy: 0,
    degraded: 0,
    unavailable: 0
  };
  for (const entry of candidate.entries) {
    if (!entry || typeof entry !== "object" || typeof entry.id !== "string" || entry.id.length === 0 || entry.id.length > 100 || ids.has(entry.id) || !["launched", "planned", "blocked"].includes(entry.launchStatus) || !Array.isArray(entry.reasonCodes) || entry.reasonCodes.length > 16 || entry.reasonCodes.some((reason) => typeof reason !== "string" || reason.length > 64)) {
      return false;
    }
    ids.add(entry.id);
    actual[entry.launchStatus]++;
    if (entry.launchStatus === "launched") {
      if (!["healthy", "degraded", "unavailable"].includes(entry.status)) return false;
      actual[entry.status]++;
    } else if (entry.status !== entry.launchStatus) {
      return false;
    }
  }
  if (actual.launched === 0) return false;
  for (const [name, value] of Object.entries(actual)) {
    if (candidate.counts[name] !== value) return false;
  }
  const expectedStatus = actual.unavailable === actual.launched ? "unavailable" : actual.degraded > 0 || actual.unavailable > 0 ? "degraded" : "healthy";
  return candidate.status === expectedStatus;
}
function projectChinaCoverageStatus(raw, readError = false) {
  if (readError) {
    return { status: "REDIS_PARTIAL", chinaStatus: null, reason: "SUMMARY_READ_FAILED" };
  }
  const candidate = typeof raw === "string" ? unwrapEnvelope(parseRedisValue(raw)).data : unwrapEnvelope(raw).data;
  if (!isValidChinaCoverageSummary(candidate)) {
    return { status: "CHINA_UNAVAILABLE", chinaStatus: "unavailable", reason: "SUMMARY_INVALID" };
  }
  const status = {
    healthy: "OK",
    degraded: "CHINA_DEGRADED",
    unavailable: "CHINA_UNAVAILABLE"
  }[candidate.status] ?? "CHINA_UNAVAILABLE";
  const problems = Array.isArray(candidate.entries) ? candidate.entries.filter((entry) => entry?.launchStatus === "launched" && entry?.status !== "healthy").map((entry) => ({ id: entry.id, status: entry.status, reasonCodes: entry.reasonCodes ?? [] })) : [];
  return {
    status,
    chinaStatus: candidate.status,
    evaluatedAt: candidate.evaluatedAt ?? null,
    counts: candidate.counts ?? null,
    ...problems.length > 0 ? { problems } : {}
  };
}
function composeChinaCoverageStatus(entry, raw, readError = false) {
  if (!entry || !["OK", "STALE_SEED", "SEED_ERROR"].includes(entry.status)) return entry;
  const seedStatus = entry.status;
  const projected = projectChinaCoverageStatus(raw, readError);
  if (seedStatus === "OK") return { ...entry, ...projected };
  if (projected.status === "OK") {
    return { ...entry, ...projected, status: seedStatus, seedStatus };
  }
  return { ...entry, ...projected, seedStatus };
}
function parseHealthVerdictSnapshot(raw, now, { requireChecks = true } = {}) {
  if (typeof raw !== "string") return null;
  const snapshot = parseRedisValue(raw);
  if (!snapshot || typeof snapshot !== "object") return null;
  if (typeof snapshot.status !== "string" || typeof snapshot.checkedAt !== "string") return null;
  if (!snapshot.summary || typeof snapshot.summary !== "object") return null;
  if (requireChecks && (!snapshot.checks || typeof snapshot.checks !== "object")) return null;
  const checkedAtMs = Date.parse(snapshot.checkedAt);
  const ageMs = now - checkedAtMs;
  if (!Number.isFinite(checkedAtMs) || ageMs < 0 || ageMs > HEALTH_VERDICT_SNAPSHOT_TTL_MS) return null;
  return snapshot;
}
async function releaseHealthVerdictRefreshLock(lockToken) {
  if (!lockToken) return;
  await redisPipeline([[
    "EVAL",
    HEALTH_VERDICT_RELEASE_LOCK_SCRIPT,
    "1",
    HEALTH_VERDICT_REFRESH_LOCK_KEY,
    lockToken
  ]], 4e3).catch(() => null);
}
function isProblemStatus(status) {
  return STATUS_COUNTS[status] !== "ok";
}
function isExpiredDeadline(raw, now) {
  const until = Date.parse(typeof raw === "string" ? raw : "");
  return !Number.isFinite(until) || now >= until;
}
function hasExpiredActivationGrace(snapshot, now, { includeRollout = true, includeContent = true } = {}) {
  const entries = snapshot?.checks ?? snapshot?.problems;
  if (entries && typeof entries === "object") {
    for (const entry of Object.values(entries)) {
      if (includeRollout && entry?.status === "ROLLOUT_PENDING" && isExpiredDeadline(entry.rolloutPendingUntil, now)) return true;
      if (includeContent && Object.prototype.hasOwnProperty.call(entry ?? {}, "contentFreshnessPendingUntil") && isExpiredDeadline(entry.contentFreshnessPendingUntil, now)) return true;
    }
  }
  if (includeContent) {
    const summaryDeadlines = snapshot?.summary?.contentFreshnessPendingUntil;
    if (summaryDeadlines && typeof summaryDeadlines === "object") {
      for (const deadline of Object.values(summaryDeadlines)) {
        if (isExpiredDeadline(deadline, now)) return true;
      }
    }
  }
  return false;
}
function hasExpiredRolloutPending(snapshot, now) {
  return hasExpiredActivationGrace(snapshot, now, { includeContent: false });
}
function nearestActivationDeadlineMs(snapshot, now) {
  let nearest = Infinity;
  const consider = (raw) => {
    const parsed = Date.parse(typeof raw === "string" ? raw : "");
    const deadline = Number.isFinite(parsed) ? parsed : now;
    if (deadline < nearest) nearest = deadline;
  };
  const entries = snapshot?.checks ?? snapshot?.problems;
  if (entries && typeof entries === "object") {
    for (const entry of Object.values(entries)) {
      if (entry?.status === "ROLLOUT_PENDING") consider(entry.rolloutPendingUntil);
      if (Object.prototype.hasOwnProperty.call(entry ?? {}, "contentFreshnessPendingUntil")) {
        consider(entry.contentFreshnessPendingUntil);
      }
    }
  }
  const summaryDeadlines = snapshot?.summary?.contentFreshnessPendingUntil;
  if (summaryDeadlines && typeof summaryDeadlines === "object") {
    for (const deadline of Object.values(summaryDeadlines)) consider(deadline);
  }
  return nearest;
}
function snapshotTtlSeconds(snapshot, now) {
  const nearest = nearestActivationDeadlineMs(snapshot, now);
  if (nearest === Infinity) return HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS;
  const secondsUntilDeadline = Math.floor((nearest - now) / 1e3);
  return Math.min(HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS, Math.max(1, secondsUntilDeadline));
}
function computeOverallStatus(counts, totalChecks) {
  const realWarnCount = counts.warn - counts.onDemandWarn;
  const critCount = counts.crit;
  let overall;
  if (critCount === 0 && realWarnCount === 0) overall = "HEALTHY";
  else if (critCount === 0) overall = "WARNING";
  else if (critCount / totalChecks <= 0.03) overall = "DEGRADED";
  else overall = "UNHEALTHY";
  return { overall, realWarnCount, critCount };
}
function collectFailureLogProblems(checks) {
  const entries = Object.entries(checks).filter(([, c]) => isProblemStatus(c.status) && c.status !== "EMPTY_ON_DEMAND");
  return {
    problemKeys: entries.map(([k, c]) => `${k}:${c.status}${c.seedAgeMin != null ? `(${c.seedAgeMin}min)` : ""}`),
    // The dedupe signature uses only key:status (no age) so a long STALE_SEED
    // window doesn't produce a new log entry on every poll.
    sigKeys: entries.map(([k, c]) => `${k}:${c.status}`).sort()
  };
}
function healthResponseBody(snapshot, compact) {
  const body = {
    status: snapshot.status,
    summary: snapshot.summary,
    checkedAt: snapshot.checkedAt
  };
  if (!compact) {
    body.checks = snapshot.checks;
    return body;
  }
  const problems = snapshot.checks ? Object.fromEntries(Object.entries(snapshot.checks).filter(
    ([name, check]) => name !== "chinaDecisionSignals" && isProblemStatus(check.status)
  )) : { ...snapshot.problems ?? {} };
  delete problems.chinaDecisionSignals;
  for (const [name, check] of Object.entries(problems)) {
    if (check?.contentFreshness === void 0 && check?.decisionGroups === void 0 && check?.chinaRow === void 0) continue;
    const {
      contentFreshness: _detail,
      decisionGroups: _groups,
      chinaRow: _chinaRow,
      ...publicFields
    } = check;
    problems[name] = publicFields;
  }
  if (Object.keys(problems).length > 0) body.problems = problems;
  return body;
}
function buildCompactVerdictSnapshot(snapshot) {
  return healthResponseBody(snapshot, true);
}
function healthResponse(snapshot, compact, headers) {
  let responseHeaders = headers;
  if (compact) {
    const { "CF-Cache-Status": _bypassMarker, ...base } = headers;
    responseHeaders = {
      ...base,
      "Cache-Control": "no-store, max-age=0",
      "CDN-Cache-Control": "no-store"
    };
  }
  return new Response(JSON.stringify(healthResponseBody(snapshot, compact), null, compact ? 0 : 2), {
    status: 200,
    headers: responseHeaders
  });
}
async function handleHealth(req, ctx, options = {}) {
  const hasInjectedClock = Object.prototype.hasOwnProperty.call(options, "now");
  const now = hasInjectedClock ? options.now : Date.now();
  const snapshotNow = () => hasInjectedClock ? now : Date.now();
  if (isDisallowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }
  const cors = getCorsHeaders(req, "GET, OPTIONS");
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "CF-Cache-Status": "BYPASS",
    ...cors
  };
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  const url = new URL(req.url);
  const compact = url.searchParams.get("compact") === "1";
  const wantsHistory = url.searchParams.get("history") === "1";
  if (!compact || wantsHistory) {
    const keyCheck = await validateApiKey(req, { forceKey: true });
    if (keyCheck.required && !keyCheck.valid) {
      const error = keyCheck.error === USER_API_KEY_GATEWAY_VALIDATION_ERROR ? "Invalid API key" : keyCheck.error;
      return jsonResponse(
        {
          error,
          hint: "Detailed health requires an operator/enterprise API key. Public status: /api/health?compact=1"
        },
        401,
        {
          ...headers,
          "WWW-Authenticate": 'ApiKey realm="worldmonitor-health", header="X-WorldMonitor-Key"'
        }
      );
    }
  }
  if (wantsHistory) {
    const results2 = await redisPipeline(
      [
        ["GET", "health:last-failure"],
        ["LRANGE", "health:failure-log", "0", "-1"]
      ],
      4e3
    );
    const parseJson = (raw) => {
      if (typeof raw !== "string") return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };
    const lastFailureRaw = results2?.[0]?.result;
    const failureLogRaw = results2?.[1]?.result;
    const body = {
      lastFailure: parseJson(lastFailureRaw),
      failureLog: Array.isArray(failureLogRaw) ? failureLogRaw.map(parseJson).filter((e) => e !== null) : [],
      checkedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return new Response(JSON.stringify(body, null, 2), { status: 200, headers });
  }
  let refreshLockToken = null;
  let ownsSnapshotRefreshLock = false;
  try {
    if (!getRedisCredentials()) throw new Error("Redis not configured");
    const snapshotKey = compact ? HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY : HEALTH_VERDICT_SNAPSHOT_KEY;
    const snapshotResult = await redisPipeline([["GET", snapshotKey]], 4e3);
    if (!snapshotResult) throw new Error("Redis request failed");
    if (snapshotResult[0]?.error) throw new Error("Redis snapshot read failed");
    const cachedSnapshot = parseHealthVerdictSnapshot(snapshotResult[0]?.result, snapshotNow(), { requireChecks: !compact });
    if (cachedSnapshot && !hasExpiredActivationGrace(cachedSnapshot, snapshotNow())) {
      return healthResponse(cachedSnapshot, compact, headers);
    }
    refreshLockToken = `${now}:${crypto.randomUUID()}`;
    let lockResult = await redisPipeline([[
      "SET",
      HEALTH_VERDICT_REFRESH_LOCK_KEY,
      refreshLockToken,
      "EX",
      String(HEALTH_VERDICT_REFRESH_LOCK_TTL_SECONDS),
      "NX"
    ]], 4e3);
    if (!lockResult || lockResult[0]?.error) throw new Error("Redis snapshot lock failed");
    ownsSnapshotRefreshLock = lockResult[0]?.result === "OK";
    if (!ownsSnapshotRefreshLock) {
      const waitDeadline = Date.now() + HEALTH_VERDICT_REFRESH_WAIT_MS;
      for (let attempt = 0; attempt < HEALTH_VERDICT_REFRESH_WAIT_ATTEMPTS && Date.now() < waitDeadline; attempt++) {
        const backoffMs = Math.min(100 * 2 ** attempt, 1e3);
        const jitterMs = Math.floor(Math.random() * 50);
        const sleepMs = Math.min(backoffMs + jitterMs, Math.max(0, waitDeadline - Date.now()));
        await new Promise((resolve) => setTimeout(resolve, sleepMs));
        const remainingMs = waitDeadline - Date.now();
        if (remainingMs < HEALTH_VERDICT_MIN_REDIS_TIMEOUT_MS) break;
        const redisTimeoutMs = Math.min(4e3, remainingMs);
        const refreshedResult = await redisPipeline([["GET", snapshotKey]], redisTimeoutMs);
        if (!refreshedResult || refreshedResult[0]?.error) throw new Error("Redis snapshot wait failed");
        const refreshedSnapshot = parseHealthVerdictSnapshot(refreshedResult[0]?.result, snapshotNow(), { requireChecks: !compact });
        if (refreshedSnapshot && !hasExpiredActivationGrace(refreshedSnapshot, snapshotNow())) {
          return healthResponse(refreshedSnapshot, compact, headers);
        }
        lockResult = await redisPipeline([[
          "SET",
          HEALTH_VERDICT_REFRESH_LOCK_KEY,
          refreshLockToken,
          "EX",
          String(HEALTH_VERDICT_REFRESH_LOCK_TTL_SECONDS),
          "NX"
        ]], redisTimeoutMs);
        if (!lockResult || lockResult[0]?.error) throw new Error("Redis snapshot lock retry failed");
        ownsSnapshotRefreshLock = lockResult[0]?.result === "OK";
        if (ownsSnapshotRefreshLock) break;
      }
    }
  } catch (err) {
    if (ownsSnapshotRefreshLock) await releaseHealthVerdictRefreshLock(refreshLockToken);
    return jsonResponse({
      status: "REDIS_DOWN",
      error: err.message,
      checkedAt: new Date(now).toISOString()
    }, 503, headers);
  }
  const allDataKeys = [
    ...Object.values(BOOTSTRAP_KEYS),
    ...Object.values(STANDALONE_KEYS)
  ];
  const allMetaKeys = Object.values(SEED_META).map((s) => s.key);
  const activationEntries = Object.entries(ACTIVATION_MARKERS);
  const fredRolloutCommands = fredRatesRolloutCommands(now);
  let results;
  try {
    const commands = [
      ...allDataKeys.map(dataLenCommand),
      ...allMetaKeys.map((k) => ["GET", k]),
      ...activationEntries.map(([, marker]) => ["EXISTS", marker]),
      ["GET", CHINA_COVERAGE_SUMMARY_KEY],
      ["GET", STANDALONE_KEYS.educationAttainment],
      ...fredRolloutCommands
    ];
    if (!getRedisCredentials()) throw new Error("Redis not configured");
    results = await redisPipeline(commands, 8e3);
    if (!results) throw new Error("Redis request failed");
  } catch (err) {
    if (ownsSnapshotRefreshLock) await releaseHealthVerdictRefreshLock(refreshLockToken);
    return jsonResponse({
      status: "REDIS_DOWN",
      error: err.message,
      checkedAt: new Date(now).toISOString()
    }, 503, headers);
  }
  const evaluationNow = snapshotNow();
  const keyStrens = /* @__PURE__ */ new Map();
  const keyErrors = /* @__PURE__ */ new Map();
  for (let i = 0; i < allDataKeys.length; i++) {
    const r = results[i];
    if (r?.error) keyErrors.set(allDataKeys[i], r.error);
    keyStrens.set(allDataKeys[i], r?.result ?? 0);
  }
  const keyMetaValues = /* @__PURE__ */ new Map();
  const keyMetaErrors = /* @__PURE__ */ new Map();
  for (let i = 0; i < allMetaKeys.length; i++) {
    const r = results[allDataKeys.length + i];
    if (r?.error) keyMetaErrors.set(allMetaKeys[i], r.error);
    keyMetaValues.set(allMetaKeys[i], r?.result ?? null);
  }
  const activationOffset = allDataKeys.length + allMetaKeys.length;
  const activationStates = readExistsFlags(
    results.slice(activationOffset, activationOffset + activationEntries.length),
    activationEntries.map(([name]) => name)
  );
  const chinaCoverageResult = results[allDataKeys.length + allMetaKeys.length + activationEntries.length];
  const chinaCoverageRaw = chinaCoverageResult?.error ? null : chinaCoverageResult?.result;
  const educationPayloadResult = results[allDataKeys.length + allMetaKeys.length + activationEntries.length + 1];
  const educationPayload = unwrapEnvelope(parseRedisValue(educationPayloadResult?.result)).data;
  const educationPayloadRankableCount = parseEducationPayloadRankableRecordCount(educationPayload);
  const fredRolloutOffset = allDataKeys.length + allMetaKeys.length + activationEntries.length + 2;
  const fredRatesRolloutUntil = parseFredRatesRolloutUntil(
    results.slice(fredRolloutOffset, fredRolloutOffset + fredRolloutCommands.length)
  );
  const rolloutPendingUntilMs = /* @__PURE__ */ new Map();
  if (fredRatesRolloutUntil !== null) {
    rolloutPendingUntilMs.set("fredRatesSeeder", fredRatesRolloutUntil);
  }
  const classifyCtx = {
    keyStrens,
    keyErrors,
    keyMetaValues,
    keyMetaErrors,
    activationStates,
    rolloutPendingUntilMs,
    educationPayloadReadFailed: Boolean(educationPayloadResult?.error),
    educationPayloadRankableCount,
    now: evaluationNow
  };
  const checks = {};
  const contentFreshnessPendingUntil = {};
  const counts = { ok: 0, warn: 0, onDemandWarn: 0, staleContent: 0, rolloutPending: 0, crit: 0 };
  let totalChecks = 0;
  const sources = [
    [BOOTSTRAP_KEYS, { allowOnDemand: false }],
    [STANDALONE_KEYS, { allowOnDemand: true }]
  ];
  for (const [registry, opts] of sources) {
    for (const [name, redisKey] of Object.entries(registry)) {
      totalChecks++;
      let entry = classifyKey(name, redisKey, opts, classifyCtx);
      if (name === "chinaCoverage") {
        entry = composeChinaCoverageStatus(entry, chinaCoverageRaw, Boolean(chinaCoverageResult?.error));
      }
      checks[name] = entry;
      if (typeof entry.contentFreshnessPendingUntil === "string") {
        contentFreshnessPendingUntil[name] = entry.contentFreshnessPendingUntil;
      }
      const bucket = STATUS_COUNTS[entry.status] ?? "warn";
      counts[bucket]++;
      if (entry.status === "EMPTY_ON_DEMAND") counts.onDemandWarn++;
      if (entry.status === "STALE_CONTENT") counts.staleContent++;
      if (entry.status === "ROLLOUT_PENDING") counts.rolloutPending++;
    }
  }
  const { overall, realWarnCount, critCount } = computeOverallStatus(counts, totalChecks);
  if (overall !== "HEALTHY") {
    const { problemKeys, sigKeys } = collectFailureLogProblems(checks);
    console.log("[health] %s problems=[%s]", overall, problemKeys.join(", "));
    const failureLogEntry = {
      at: new Date(evaluationNow).toISOString(),
      status: overall,
      critCount,
      warnCount: realWarnCount,
      problems: problemKeys
    };
    const sig = `${overall}|${sigKeys.join(",")}`;
    const prevSigResult = await redisPipeline([["GET", "health:failure-log-sig"]], 4e3).catch(() => null);
    const prevSig = prevSigResult?.[0]?.result ?? "";
    const persistCmds = [
      ["SET", "health:last-failure", JSON.stringify(failureLogEntry), "EX", 86400]
    ];
    if (sig !== prevSig) {
      persistCmds.push(
        ["LPUSH", "health:failure-log", JSON.stringify(failureLogEntry)],
        ["LTRIM", "health:failure-log", 0, 49],
        ["EXPIRE", "health:failure-log", 86400 * 7],
        ["SET", "health:failure-log-sig", sig, "EX", 86400]
      );
    }
    const persist = redisPipeline(persistCmds, 4e3).catch(() => {
    });
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(persist);
  } else {
    const clear = redisPipeline([["DEL", "health:failure-log-sig"]], 4e3).catch(() => {
    });
    if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(clear);
  }
  const verdictSnapshot = {
    status: overall,
    summary: {
      total: totalChecks,
      ok: counts.ok,
      // `warn` excludes on-demand-empty (cosmetic warns); `onDemandWarn` is
      // surfaced separately so readers can reconcile against `overall`.
      warn: realWarnCount,
      onDemandWarn: counts.onDemandWarn,
      // `staleContent` is a SUBSET of `warn` (fresh seeder, frozen upstream
      // data — issue #3845). Surfaced so a frozen feed is visible without
      // walking every check entry.
      staleContent: counts.staleContent,
      // `rolloutPending` is a SUBSET of `warn` (#6059) — a newly deployed
      // schema whose producer has not reached its first scheduled run yet.
      // Bounded: each entry carries a `rolloutPendingUntil` deadline, after
      // which it becomes EMPTY (crit).
      rolloutPending: counts.rolloutPending,
      ...Object.keys(contentFreshnessPendingUntil).length > 0 ? { contentFreshnessPendingUntil } : {},
      crit: critCount
    },
    checkedAt: new Date(evaluationNow).toISOString(),
    checks
  };
  const snapshotTtl = String(snapshotTtlSeconds(verdictSnapshot, snapshotNow()));
  const snapshotWriteResult = await redisPipeline([
    [
      "SET",
      HEALTH_VERDICT_SNAPSHOT_KEY,
      JSON.stringify(verdictSnapshot),
      "EX",
      snapshotTtl
    ],
    [
      "SET",
      HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY,
      JSON.stringify(buildCompactVerdictSnapshot(verdictSnapshot)),
      "EX",
      snapshotTtl
    ]
  ], 4e3).catch(() => null);
  const snapshotWriteFailed = !snapshotWriteResult || snapshotWriteResult.length !== 2 || snapshotWriteResult.some((entry) => entry?.error);
  if (ownsSnapshotRefreshLock) await releaseHealthVerdictRefreshLock(refreshLockToken);
  if (snapshotWriteFailed) console.warn("[health] verdict snapshot write failed");
  return healthResponse(verdictSnapshot, compact, headers);
}
async function handler(req, ctx) {
  return handleHealth(req, ctx);
}
var __testing__ = {
  readSeedMeta,
  classifyKey,
  healthResponseBody,
  collectFailureLogProblems,
  ACTIVATION_MARKERS,
  CONTENT_FRESHNESS_ROLLOUT_UNTIL_MS,
  ROLLOUT_PENDING_UNTIL_MS,
  ROLLOUT_PENDING_FROM_MS,
  RUNTIME_ROLLOUT_PENDING_POLICIES,
  FRED_RATES_ROLLOUT_DEADLINE_KEY,
  FRED_RATES_ROLLOUT_DURATION_MS,
  fredRatesRolloutCommands,
  parseFredRatesRolloutUntil,
  computeOverallStatus,
  hasExpiredRolloutPending,
  hasExpiredActivationGrace,
  snapshotTtlSeconds,
  CONSUMER_PRICE_HEALTH_MARKETS,
  consumerPriceCoverageActivationKey,
  consumerPriceCoverageHealthName,
  STATUS_COUNTS,
  // List-typed data keys + the command builder that measures them with LLEN
  // instead of STRLEN (tests/health-list-data-keys.test.mjs).
  LIST_DATA_KEYS,
  dataLenCommand,
  HEALTH_VERDICT_SNAPSHOT_KEY,
  HEALTH_VERDICT_COMPACT_SNAPSHOT_KEY,
  buildCompactVerdictSnapshot,
  HEALTH_VERDICT_SNAPSHOT_TTL_SECONDS,
  HEALTH_VERDICT_REFRESH_LOCK_KEY,
  HEALTH_VERDICT_REFRESH_WAIT_MS,
  CHINA_COVERAGE_SUMMARY_KEY,
  projectChinaCoverageStatus,
  composeChinaCoverageStatus,
  healthVerdictRedisKey,
  parseHealthVerdictSnapshot,
  // U7 (Tier 3 parity test): exposed for tests/mcp-bootstrap-parity.test.mjs
  // to walk the canonical seeded-data inventory. Both consts are unexported
  // at module scope by design — this is the test-only escape hatch.
  BOOTSTRAP_KEYS,
  STANDALONE_KEYS,
  SEED_META,
  EMPTY_DATA_OK_KEYS,
  MISSING_DATA_IS_FAILURE_KEYS,
  ZERO_RECORD_DATA_OK_KEYS,
  // Exposed so a registration test can prove a key's deployment-order softening
  // is actually wired — membership here is what keeps a not-yet-published key
  // out of CRIT, and nothing could assert it before (#5736).
  ON_DEMAND_KEYS
};
export {
  COVERAGE_FAILURE_REASONS,
  __testing__,
  config,
  handler as default,
  handleHealth
};
