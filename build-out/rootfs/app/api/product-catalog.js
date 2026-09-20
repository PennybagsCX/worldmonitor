// api/product-catalog.js
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
async function timingSafeIncludes(candidate, validKeys) {
  if (typeof candidate !== "string" || !candidate || !Array.isArray(validKeys) || !validKeys.length || validKeys.some((key) => typeof key !== "string")) {
    return false;
  }
  const enc = new TextEncoder();
  const candidateHash = await crypto.subtle.digest("SHA-256", enc.encode(candidate));
  const candidateBytes = new Uint8Array(candidateHash);
  let found = false;
  for (const k of validKeys) {
    const kHash = await crypto.subtle.digest("SHA-256", enc.encode(k));
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
var PUBLIC_PRODUCT_FACTS = {
  "_generated": "scripts/generate-public-product-facts.mjs \u2014 do not edit by hand; run `npm run product:facts`",
  "product": {
    "name": "World Monitor",
    "lifecycle": "launched",
    "canonicalUrl": "https://www.worldmonitor.app/",
    "pricingUrl": "https://www.worldmonitor.app/pro#pricing",
    "primaryCtaLabel": "View Pro plans"
  },
  "currency": "USD",
  "plans": [
    {
      "planKey": "free",
      "name": "Free",
      "tierGroup": "free",
      "billingPeriod": "none",
      "billingDuration": null,
      "price": 0,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": false,
      "selfServe": false,
      "dashboardAiCallsPerDay": 0,
      "description": "Core dashboard panels, Global news feed, Earthquake & weather alerts, Basic map view, 3 dashboard tabs"
    },
    {
      "planKey": "pro_monthly",
      "name": "Pro Monthly",
      "tierGroup": "pro",
      "billingPeriod": "monthly",
      "billingDuration": "P1M",
      "price": 39.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": true,
      "selfServe": true,
      "dashboardAiCallsPerDay": 500,
      "description": "Everything in Free, AI stock analysis & backtesting, Daily market briefs, Military & geopolitical tracking, Custom widget builder, 10 custom dashboards (vs 3), MCP + SDK access for Claude Desktop & other AI clients (50 calls/day), Priority data refresh, Personal license"
    },
    {
      "planKey": "pro_annual",
      "name": "Pro Annual",
      "tierGroup": "pro",
      "billingPeriod": "annual",
      "billingDuration": "P1Y",
      "price": 359.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": true,
      "selfServe": true,
      "dashboardAiCallsPerDay": 500,
      "description": ""
    },
    {
      "planKey": "pro_business_monthly",
      "name": "Pro Business Monthly",
      "tierGroup": "pro_business",
      "billingPeriod": "monthly",
      "billingDuration": "P1M",
      "price": 49.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": true,
      "selfServe": true,
      "dashboardAiCallsPerDay": 2500,
      "description": "Everything in Pro, Use for client work, internal tools & reporting, Data export \u2014 CSV, JSON & PDF reports, 25 custom dashboards (vs 10), MCP + SDK: 250 calls/day (vs 50), Priority support, Commercial license included"
    },
    {
      "planKey": "pro_business_annual",
      "name": "Pro Business Annual",
      "tierGroup": "pro_business",
      "billingPeriod": "annual",
      "billingDuration": "P1Y",
      "price": 449.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": true,
      "selfServe": true,
      "dashboardAiCallsPerDay": 2500,
      "description": ""
    },
    {
      "planKey": "api_starter",
      "name": "API Starter Monthly",
      "tierGroup": "api_starter",
      "billingPeriod": "monthly",
      "billingDuration": "P1M",
      "price": 99.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": true,
      "selfServe": true,
      "dashboardAiCallsPerDay": 1e3,
      "description": "REST API + official SDKs (npm, PyPI, RubyGems, Go), License / API key included, Real-time data streams, 60 requests/minute, 1,000 requests/day included, Webhook notifications, Commercial license \u2014 for your organization"
    },
    {
      "planKey": "api_starter_annual",
      "name": "API Starter Annual",
      "tierGroup": "api_starter",
      "billingPeriod": "annual",
      "billingDuration": "P1Y",
      "price": 899.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": true,
      "selfServe": true,
      "dashboardAiCallsPerDay": 1e3,
      "description": ""
    },
    {
      "planKey": "api_business",
      "name": "API Business",
      "tierGroup": "api_business",
      "billingPeriod": "monthly",
      "billingDuration": "P1M",
      "price": 299.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": true,
      "selfServe": true,
      "dashboardAiCallsPerDay": 1e4,
      "description": "Everything in API Starter, Redistribution rights \u2014 embed our data in what you sell, 300 requests/minute, 10,000 requests/day included, 5 Pro licenses included, Priority support, Commercial license \u2014 for your customers"
    },
    {
      "planKey": "api_business_annual",
      "name": "API Business Annual",
      "tierGroup": "api_business",
      "billingPeriod": "annual",
      "billingDuration": "P1Y",
      "price": 2699.99,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": true,
      "selfServe": true,
      "dashboardAiCallsPerDay": 1e4,
      "description": ""
    },
    {
      "planKey": "enterprise",
      "name": "Enterprise",
      "tierGroup": "enterprise",
      "billingPeriod": "none",
      "billingDuration": null,
      "price": null,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.worldmonitor.app/pro#pricing",
      "currentForCheckout": false,
      "selfServe": false,
      "dashboardAiCallsPerDay": null,
      "description": "Everything in Pro + API, Unlimited API requests, Dedicated support, Custom integrations, SLA guarantee, On-premise option"
    }
  ],
  "capabilities": {
    "mcpTools": 63,
    "locales": 28,
    "variants": 6,
    "mapLayers": 56,
    "panelImplementations": 109,
    "feedDefinitions": 632,
    "freshnessTrackedSourceGroups": 35,
    "sourceAttributionHosts": 536,
    "sourceAttributionProviders": 534
  }
};
var PRODUCT_CATALOG = {
  "pdt_0Nbtt71uObulf7fGXhQup": {
    "planKey": "pro_monthly",
    "tierGroup": "pro",
    "billingPeriod": "monthly"
  },
  "pdt_0NbttMIfjLWC10jHQWYgJ": {
    "planKey": "pro_annual",
    "tierGroup": "pro",
    "billingPeriod": "annual"
  },
  "pdt_0NjyFDbhURh2oROgPIU3G": {
    "planKey": "pro_business_monthly",
    "tierGroup": "pro_business",
    "billingPeriod": "monthly"
  },
  "pdt_0Nk072fxPUcHWivZRtlQW": {
    "planKey": "pro_business_annual",
    "tierGroup": "pro_business",
    "billingPeriod": "annual"
  },
  "pdt_0NbttVmG1SERrxhygbbUq": {
    "planKey": "api_starter",
    "tierGroup": "api_starter",
    "billingPeriod": "monthly"
  },
  "pdt_0Nbu2lawHYE3dv2THgSEV": {
    "planKey": "api_starter_annual",
    "tierGroup": "api_starter",
    "billingPeriod": "annual"
  },
  "pdt_0Nbttg7NuOJrhbyBGCius": {
    "planKey": "api_business",
    "tierGroup": "api_business",
    "billingPeriod": "monthly"
  },
  "pdt_0NkHjzMhGp3m45sZLQ7BQ": {
    "planKey": "api_business_annual",
    "tierGroup": "api_business",
    "billingPeriod": "annual"
  },
  "pdt_0Nbttnqrfh51cRqhMdVLx": {
    "planKey": "enterprise",
    "tierGroup": "enterprise",
    "billingPeriod": "none"
  }
};
var TIER_CONFIG = {
  "free": {
    "name": "Free",
    "localeKey": "free",
    "description": "Get started with the essentials",
    "features": [
      "Core dashboard panels",
      "Global news feed",
      "Earthquake & weather alerts",
      "Basic map view",
      "3 dashboard tabs"
    ],
    "planLimits": {
      "apiRequestsPerDay": 0,
      "apiBurstRequestsPerMinute": 0,
      "mcpCallsPerDay": 0,
      "dashboardAiCallsPerDay": 0,
      "mcpBurstRequestsPerMinute": 0
    },
    "cta": "Get Started",
    "href": "https://worldmonitor.app/dashboard",
    "highlighted": false
  },
  "pro": {
    "name": "Pro",
    "localeKey": "pro",
    "description": "Full intelligence dashboard",
    "features": [
      "Everything in Free",
      "AI stock analysis & backtesting",
      "Daily market briefs",
      "Military & geopolitical tracking",
      "Custom widget builder",
      "10 custom dashboards (vs 3)",
      "MCP + SDK access for Claude Desktop & other AI clients (50 calls/day)",
      "Priority data refresh"
    ],
    "highlightFeatures": [
      "Personal license"
    ],
    "planLimits": {
      "apiRequestsPerDay": 0,
      "apiBurstRequestsPerMinute": 0,
      "mcpCallsPerDay": 50,
      "dashboardAiCallsPerDay": 500,
      "mcpBurstRequestsPerMinute": 60
    },
    "highlighted": true
  },
  "pro_business": {
    "name": "Pro Business",
    "localeKey": "proBusiness",
    "description": "The Pro dashboard, licensed for work",
    "features": [
      "Everything in Pro",
      "Use for client work, internal tools & reporting",
      "Data export \u2014 CSV, JSON & PDF reports",
      "25 custom dashboards (vs 10)",
      "MCP + SDK: 250 calls/day (vs 50)",
      "Priority support"
    ],
    "highlightFeatures": [
      "Commercial license included"
    ],
    "planLimits": {
      "apiRequestsPerDay": 0,
      "apiBurstRequestsPerMinute": 0,
      "mcpCallsPerDay": 250,
      "dashboardAiCallsPerDay": 2500,
      "mcpBurstRequestsPerMinute": 60
    },
    "highlighted": false
  },
  "api_starter": {
    "name": "API Starter",
    "localeKey": "api",
    "description": "Build internal tools on live intelligence data",
    "features": [
      "REST API + official SDKs (npm, PyPI, RubyGems, Go)",
      "License / API key included",
      "Real-time data streams",
      "60 requests/minute",
      "1,000 requests/day included",
      "Webhook notifications"
    ],
    "highlightFeatures": [
      "Commercial license \u2014 for your organization"
    ],
    "planLimits": {
      "apiRequestsPerDay": 1e3,
      "apiBurstRequestsPerMinute": 60,
      "mcpCallsPerDay": 1e3,
      "dashboardAiCallsPerDay": 1e3,
      "mcpBurstRequestsPerMinute": 60
    },
    "highlighted": false
  },
  "api_business": {
    "name": "API Business",
    "localeKey": "apiBusiness",
    "description": "Launch your own product on WorldMonitor data",
    "features": [
      "Everything in API Starter",
      "Redistribution rights \u2014 embed our data in what you sell",
      "300 requests/minute",
      "10,000 requests/day included",
      "5 Pro licenses included",
      "Priority support"
    ],
    "highlightFeatures": [
      "Commercial license \u2014 for your customers"
    ],
    "planLimits": {
      "apiRequestsPerDay": 1e4,
      "apiBurstRequestsPerMinute": 300,
      "mcpCallsPerDay": 1e4,
      "dashboardAiCallsPerDay": 1e4,
      "mcpBurstRequestsPerMinute": 300
    },
    "highlighted": false
  },
  "enterprise": {
    "name": "Enterprise",
    "localeKey": "enterprise",
    "description": "Custom solutions for organizations",
    "features": [
      "Everything in Pro + API",
      "Unlimited API requests",
      "Dedicated support",
      "Custom integrations",
      "SLA guarantee",
      "On-premise option"
    ],
    "planLimits": {
      "apiRequestsPerDay": null,
      "apiBurstRequestsPerMinute": 1e3,
      "mcpCallsPerDay": null,
      "dashboardAiCallsPerDay": null,
      "mcpBurstRequestsPerMinute": 1e3
    },
    "cta": "Contact Sales",
    "href": "mailto:enterprise@worldmonitor.app",
    "highlighted": false
  }
};
var PUBLIC_TIER_GROUPS = [
  "free",
  "pro",
  "pro_business",
  "api_starter",
  "api_business",
  "enterprise"
];
var FALLBACK_PRICES = {
  "pdt_0Nbtt71uObulf7fGXhQup": 3999,
  "pdt_0NbttMIfjLWC10jHQWYgJ": 35999,
  "pdt_0NjyFDbhURh2oROgPIU3G": 4999,
  "pdt_0Nk072fxPUcHWivZRtlQW": 44999,
  "pdt_0NbttVmG1SERrxhygbbUq": 9999,
  "pdt_0Nbu2lawHYE3dv2THgSEV": 89999,
  "pdt_0Nbttg7NuOJrhbyBGCius": 29999,
  "pdt_0NkHjzMhGp3m45sZLQ7BQ": 269999
};
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
var config = { runtime: "edge" };
var UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
var UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
var DODO_API_KEY = process.env.DODO_API_KEY ?? "";
var DODO_ENV = process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
var RELAY_SECRET = process.env.RELAY_SHARED_SECRET ?? "";
var CACHE_KEY = "product-catalog:v2";
var CACHE_TTL = 3600;
function json(body, status, cors, cacheControl, source) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...cacheControl ? { "Cache-Control": cacheControl } : {},
      // Signals which code-path served the response so operators + the
      // seed-contract probe can distinguish cache hits from Dodo/fallback.
      // Without this header a green probe would not prove the cached-reader
      // path is healthy — it could be silently falling through to fallback.
      ...source ? { "X-Product-Catalog-Source": source } : {},
      ...cors
    }
  });
}
function withPublicFacts(payload) {
  return { ...payload, ...PUBLIC_PRODUCT_FACTS };
}
async function getFromCache() {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(CACHE_KEY)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      signal: AbortSignal.timeout(3e3)
    });
    if (!res.ok) return null;
    const { result } = await res.json();
    if (!result) return null;
    return unwrapEnvelope(JSON.parse(result)).data;
  } catch {
    return null;
  }
}
async function purgeCache() {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    await fetch(`${UPSTASH_URL}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(["DEL", CACHE_KEY]),
      signal: AbortSignal.timeout(3e3)
    });
  } catch {
  }
}
async function fetchPricesFromDodo() {
  const baseUrl = DODO_ENV === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
  const productIds = Object.keys(PRODUCT_CATALOG);
  const results = await Promise.allSettled(
    productIds.map(async (productId) => {
      const res = await fetch(`${baseUrl}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${DODO_API_KEY}`,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(5e3)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { productId, product: await res.json() };
    })
  );
  const prices = {};
  for (const result of results) {
    if (result.status === "fulfilled") {
      const { productId, product } = result.value;
      const priceData = product.price;
      if (priceData) {
        prices[productId] = {
          priceCents: priceData.price ?? priceData.fixed_price ?? 0,
          currency: priceData.currency ?? "USD",
          name: product.name
        };
      }
    } else {
      console.warn(`[product-catalog] Dodo fetch failed:`, result.reason?.message);
    }
  }
  return prices;
}
function buildTiers(dodoPrices) {
  const tiers = [];
  for (const group of PUBLIC_TIER_GROUPS) {
    const config2 = TIER_CONFIG[group];
    if (!config2) continue;
    if (group === "free") {
      tiers.push({ ...config2, price: 0, period: "forever" });
      continue;
    }
    if (group === "enterprise") {
      tiers.push({ ...config2, price: null });
      continue;
    }
    const monthlyEntry = Object.entries(PRODUCT_CATALOG).find(([, v]) => v.tierGroup === group && v.billingPeriod === "monthly");
    const annualEntry = Object.entries(PRODUCT_CATALOG).find(([, v]) => v.tierGroup === group && v.billingPeriod === "annual");
    const tier = { ...config2 };
    if (monthlyEntry) {
      const [monthlyId] = monthlyEntry;
      const monthlyPrice = dodoPrices[monthlyId];
      if (monthlyPrice) {
        tier.monthlyPrice = monthlyPrice.priceCents / 100;
      } else if (FALLBACK_PRICES[monthlyId] != null) {
        tier.monthlyPrice = FALLBACK_PRICES[monthlyId] / 100;
        console.warn(`[product-catalog] FALLBACK price for ${monthlyId} ($${tier.monthlyPrice}) \u2014 Dodo fetch failed`);
      }
      tier.monthlyProductId = monthlyId;
    }
    if (annualEntry) {
      const [annualId] = annualEntry;
      const annualPrice = dodoPrices[annualId];
      if (annualPrice) {
        tier.annualPrice = annualPrice.priceCents / 100;
      } else if (FALLBACK_PRICES[annualId] != null) {
        tier.annualPrice = FALLBACK_PRICES[annualId] / 100;
        console.warn(`[product-catalog] FALLBACK price for ${annualId} ($${tier.annualPrice}) \u2014 Dodo fetch failed`);
      }
      tier.annualProductId = annualId;
    }
    tiers.push(tier);
  }
  return tiers;
}
async function handler(req) {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
  }
  if (req.method === "DELETE") {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!RELAY_SECRET || !await timingSafeEqualSecret(authHeader, `Bearer ${RELAY_SECRET}`)) {
      return json({ error: "Unauthorized" }, 401, cors);
    }
    await purgeCache();
    return json({ purged: true }, 200, cors);
  }
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, cors);
  }
  const cached = await getFromCache();
  if (cached) {
    return json(withPublicFacts(cached), 200, cors, "public, max-age=300, s-maxage=600, stale-while-revalidate=300", "cache");
  }
  if (DODO_API_KEY) {
    const dodoPrices = await fetchPricesFromDodo();
    const pricedPublicIds = Object.entries(PRODUCT_CATALOG).filter(([, v]) => PUBLIC_TIER_GROUPS.includes(v.tierGroup) && v.tierGroup !== "free" && v.tierGroup !== "enterprise").map(([id]) => id);
    const dodoPriceCount = pricedPublicIds.filter((id) => dodoPrices[id]).length;
    if (dodoPriceCount > 0) {
      const priceSource = dodoPriceCount === pricedPublicIds.length ? "dodo" : "partial";
      const tiers2 = buildTiers(dodoPrices);
      const now2 = Date.now();
      const result = withPublicFacts({ tiers: tiers2, fetchedAt: now2, cachedUntil: now2 + CACHE_TTL * 1e3, priceSource });
      return json(result, 200, cors, "public, max-age=60, s-maxage=60", priceSource);
    }
  }
  const tiers = buildTiers({});
  const now = Date.now();
  return json(withPublicFacts({ tiers, fetchedAt: now, cachedUntil: now + 6e4, priceSource: "fallback" }), 200, cors, "public, max-age=60, s-maxage=60", "fallback");
}
export {
  config,
  handler as default
};
