// api/version.js
async function readRawJsonFromUpstash(key, timeoutMs = 3e3) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("readRawJsonFromUpstash: UPSTASH_REDIS_REST_URL/TOKEN not configured");
  }
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!resp.ok) {
    throw new Error(`readRawJsonFromUpstash: Upstash GET ${key} returned HTTP ${resp.status}`);
  }
  const data = await resp.json();
  if (!data || typeof data !== "object" || !Object.prototype.hasOwnProperty.call(data, "result")) {
    throw new Error(`readRawJsonFromUpstash: Upstash GET ${key} returned a malformed response`);
  }
  if (data.result === null) return null;
  try {
    return JSON.parse(data.result);
  } catch (err) {
    throw new Error(
      `readRawJsonFromUpstash: JSON.parse failed for ${key}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
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
async function setCachedData(key, value, ttlSeconds) {
  const results = await redisPipeline([
    ["SET", key, JSON.stringify(value), "EX", String(ttlSeconds)]
  ]);
  return results !== null;
}
var RELEASES_URL = "https://api.github.com/repos/koala73/worldmonitor/releases/latest";
var CACHE_KEY = "github:latest-release:v1";
var CACHE_TTL_SECONDS = 300;
async function fetchLatestRelease(userAgent) {
  try {
    const cached = await readRawJsonFromUpstash(CACHE_KEY);
    if (cached) return cached;
  } catch {
  }
  const res = await fetch(RELEASES_URL, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": userAgent
    }
  });
  if (!res.ok) return null;
  const release = await res.json();
  try {
    await setCachedData(CACHE_KEY, release, CACHE_TTL_SECONDS);
  } catch {
  }
  return release;
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
var config = { runtime: "edge" };
async function handler() {
  try {
    const release = await fetchLatestRelease("WorldMonitor-Version-Check");
    if (!release) {
      return jsonResponse({ error: "upstream" }, 502);
    }
    const tag = release.tag_name ?? "";
    const version = tag.replace(/^v/, "");
    return jsonResponse({
      version,
      tag,
      url: release.html_url,
      prerelease: release.prerelease ?? false
    }, 200, {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60, stale-if-error=3600",
      "Access-Control-Allow-Origin": "*"
    });
  } catch {
    return jsonResponse({ error: "fetch_failed" }, 502);
  }
}
export {
  config,
  handler as default
};
