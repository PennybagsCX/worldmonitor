var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
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
    var __export2 = (target, all) => {
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
    __export2(src_exports, {
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
      constructor(config) {
        this.analytics = new import_core_analytics.Analytics({
          // @ts-expect-error we need to fix the types in core-analytics, it should only require the methods it needs, not the whole sdk
          redis: config.redis,
          window: "1h",
          prefix: config.prefix ?? "@upstash/ratelimit",
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
      constructor(cache) {
        this.cache = cache;
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
    __export2(ip_deny_list_exports, {
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
      constructor(config) {
        this.ctx = config.ctx;
        this.limiter = config.limiter;
        this.timeout = config.timeout ?? 5e3;
        this.prefix = config.prefix ?? DEFAULT_PREFIX;
        this.dynamicLimits = config.dynamicLimits ?? false;
        this.enableProtection = config.enableProtection ?? false;
        this.denyListThreshold = config.denyListThreshold ?? 6;
        this.primaryRedis = "redis" in this.ctx ? this.ctx.redis : this.ctx.regionContexts[0].redis;
        if ("redis" in this.ctx) {
          this.ctx.dynamicLimits = this.dynamicLimits;
          this.ctx.prefix = this.prefix;
        }
        this.analytics = config.analytics ? new Analytics2({
          redis: this.primaryRedis,
          prefix: this.prefix
        }) : void 0;
        if (config.ephemeralCache instanceof Map) {
          this.ctx.cache = new Cache(config.ephemeralCache);
        } else if (config.ephemeralCache === void 0) {
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
      constructor(config) {
        super({
          prefix: config.prefix,
          limiter: config.limiter,
          timeout: config.timeout,
          analytics: config.analytics,
          dynamicLimits: config.dynamicLimits,
          ctx: {
            regionContexts: config.redis.map((redis) => ({
              redis,
              prefix: config.prefix ?? DEFAULT_PREFIX
            })),
            cache: config.ephemeralCache ? new Cache(config.ephemeralCache) : void 0
          }
        });
        if (config.dynamicLimits) {
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
      constructor(config) {
        super({
          prefix: config.prefix,
          limiter: config.limiter,
          timeout: config.timeout,
          analytics: config.analytics,
          ctx: {
            redis: config.redis,
            prefix: config.prefix ?? DEFAULT_PREFIX
          },
          ephemeralCache: config.ephemeralCache,
          enableProtection: config.enableProtection,
          denyListThreshold: config.denyListThreshold,
          dynamicLimits: config.dynamicLimits
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

// api/_seed-envelope.js
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

// api/_upstash-json.js
async function readJsonFromUpstash(key, timeoutMs = 3e3) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (data.result == null) return null;
  try {
    return unwrapEnvelope(JSON.parse(data.result)).data;
  } catch {
    return null;
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

// shared/entity-registry.js
var ENTITY_REGISTRY = [
  // ============================================================================
  // INDICES
  // ============================================================================
  {
    id: "^GSPC",
    type: "index",
    name: "S&P 500",
    aliases: ["s&p", "s&p 500", "sp500", "spx", "spy"],
    keywords: ["market", "stocks", "wall street", "equities"],
    related: ["^DJI", "^IXIC"]
  },
  {
    id: "^DJI",
    type: "index",
    name: "Dow Jones",
    aliases: ["dow", "dow jones", "djia", "dow 30"],
    keywords: ["blue chip", "industrials", "market"],
    related: ["^GSPC", "^IXIC"]
  },
  {
    id: "^IXIC",
    type: "index",
    name: "NASDAQ",
    aliases: ["nasdaq", "nasdaq composite", "qqq", "tech index"],
    keywords: ["tech stocks", "growth", "technology"],
    related: ["^GSPC", "XLK"]
  },
  // ============================================================================
  // TECH COMPANIES
  // ============================================================================
  {
    id: "AAPL",
    type: "company",
    name: "Apple Inc.",
    aliases: ["apple", "aapl", "tim cook", "iphone", "ipad", "mac"],
    keywords: ["iphone", "ios", "app store", "macbook", "vision pro", "services", "wearables"],
    sector: "Technology",
    related: ["MSFT", "GOOGL", "TSM"]
  },
  {
    id: "MSFT",
    type: "company",
    name: "Microsoft Corporation",
    aliases: ["microsoft", "msft", "satya nadella", "windows", "azure", "xbox"],
    keywords: ["azure", "cloud", "windows", "office", "copilot", "openai", "teams", "github"],
    sector: "Technology",
    related: ["AAPL", "GOOGL", "AMZN", "NVDA"]
  },
  {
    id: "NVDA",
    type: "company",
    name: "NVIDIA Corporation",
    aliases: ["nvidia", "nvda", "jensen huang", "geforce"],
    keywords: ["gpu", "ai chip", "datacenter", "cuda", "h100", "blackwell", "artificial intelligence", "gaming", "graphics"],
    sector: "Technology",
    related: ["AMD", "TSM", "AVGO", "INTC", "MSFT"]
  },
  {
    id: "GOOGL",
    type: "company",
    name: "Alphabet Inc.",
    aliases: ["google", "alphabet", "googl", "goog", "sundar pichai", "youtube"],
    keywords: ["search", "ads", "android", "chrome", "gemini", "waymo", "cloud", "ai"],
    sector: "Technology",
    related: ["META", "MSFT", "AAPL", "AMZN"]
  },
  {
    id: "AMZN",
    type: "company",
    name: "Amazon.com Inc.",
    aliases: ["amazon", "amzn", "aws", "andy jassy", "jeff bezos", "prime"],
    keywords: ["ecommerce", "cloud", "aws", "prime", "alexa", "warehouse", "logistics", "retail"],
    sector: "Technology",
    related: ["MSFT", "GOOGL", "WMT", "COST"]
  },
  {
    id: "META",
    type: "company",
    name: "Meta Platforms Inc.",
    aliases: ["meta", "facebook", "fb", "mark zuckerberg", "zuckerberg", "instagram", "whatsapp"],
    keywords: ["social media", "metaverse", "vr", "reels", "advertising", "llama", "ai"],
    sector: "Technology",
    related: ["GOOGL", "SNAP", "PINS"]
  },
  {
    id: "TSM",
    type: "company",
    name: "Taiwan Semiconductor",
    aliases: ["tsmc", "tsm", "taiwan semi", "taiwan semiconductor"],
    keywords: ["chip", "foundry", "semiconductor", "fab", "wafer", "node", "nanometer", "taiwan"],
    sector: "Technology",
    related: ["NVDA", "AMD", "AAPL", "AVGO", "INTC"]
  },
  {
    id: "AVGO",
    type: "company",
    name: "Broadcom Inc.",
    aliases: ["broadcom", "avgo", "avago", "hock tan"],
    keywords: ["chip", "semiconductor", "wireless", "5g", "networking", "infrastructure", "vmware", "enterprise"],
    sector: "Technology",
    related: ["NVDA", "QCOM", "TSM", "INTC"]
  },
  {
    id: "ORCL",
    type: "company",
    name: "Oracle Corporation",
    aliases: ["oracle", "orcl", "larry ellison", "ellison"],
    keywords: ["database", "cloud", "enterprise", "java", "erp", "saas"],
    sector: "Technology",
    related: ["MSFT", "SAP", "CRM"]
  },
  {
    id: "NFLX",
    type: "company",
    name: "Netflix Inc.",
    aliases: ["netflix", "nflx"],
    keywords: ["streaming", "entertainment", "movies", "series", "subscription", "content"],
    sector: "Technology",
    related: ["DIS", "WBD", "PARA"]
  },
  // ============================================================================
  // DEFENSE & AEROSPACE
  // ============================================================================
  {
    id: "LMT",
    type: "company",
    name: "Lockheed Martin",
    aliases: ["lockheed", "lockheed martin", "lmt", "skunk works"],
    keywords: ["f-35", "defense", "missile", "aerospace", "himars", "javeline"],
    sector: "Defense",
    related: ["RTX", "NOC", "GD", "BA"]
  },
  {
    id: "RTX",
    type: "company",
    name: "RTX Corp",
    aliases: ["raytheon", "rtx", "pratt & whitney", "collins aerospace"],
    keywords: ["missile", "patriot", "defense", "radar", "engine"],
    sector: "Defense",
    related: ["LMT", "NOC", "GD"]
  },
  {
    id: "NOC",
    type: "company",
    name: "Northrop Grumman",
    aliases: ["northrop", "northrop grumman", "noc"],
    keywords: ["b-21", "bomber", "space", "defense", "drone"],
    sector: "Defense",
    related: ["LMT", "RTX", "L3H"]
  },
  {
    id: "BA",
    type: "company",
    name: "Boeing",
    aliases: ["boeing", "ba"],
    keywords: ["airplane", "737 max", "defense", "space", "starliner"],
    sector: "Defense",
    related: ["AIR.PA", "LMT"]
  },
  {
    id: "GD",
    type: "company",
    name: "General Dynamics",
    aliases: ["general dynamics", "gd"],
    keywords: ["submarine", "tank", "abrams", "gulfstream", "defense"],
    sector: "Defense",
    related: ["LMT", "HII"]
  },
  {
    id: "RHM.DE",
    type: "company",
    name: "Rheinmetall AG",
    aliases: ["rheinmetall", "rhm"],
    keywords: ["tank", "leopard", "ammunition", "defense", "germany"],
    sector: "Defense",
    related: ["KMW", "BAE.L"]
  },
  {
    id: "AIR.PA",
    type: "company",
    name: "Airbus SE",
    aliases: ["airbus", "eads"],
    keywords: ["airplane", "defense", "helicopter", "space", "europe"],
    sector: "Defense",
    related: ["BA", "SAF.PA"]
  },
  // ============================================================================
  // SEMICONDUCTORS & CRITICAL TECH (GLOBAL)
  // ============================================================================
  {
    id: "ASML",
    type: "company",
    name: "ASML Holding",
    aliases: ["asml"],
    keywords: ["lithography", "euv", "duv", "chip equipment", "semiconductor"],
    sector: "Technology",
    related: ["TSM", "INTC", "SAMSUNG"]
  },
  {
    id: "005930.KS",
    type: "company",
    name: "Samsung Electronics",
    aliases: ["samsung", "samsung electronics"],
    keywords: ["memory", "chip", "phone", "display", "foundry"],
    sector: "Technology",
    related: ["SK hynix", "AAPL", "TSM"]
  },
  // ============================================================================
  // CRITICAL MINERALS
  // ============================================================================
  {
    id: "ALB",
    type: "company",
    name: "Albemarle",
    aliases: ["albemarle", "alb"],
    keywords: ["lithium", "battery", "ev", "mining"],
    sector: "Materials",
    related: ["SQM", "TSLA"]
  },
  {
    id: "SQM",
    type: "company",
    name: "SQM",
    aliases: ["sqm", "sociedad quimica"],
    keywords: ["lithium", "chile", "mining", "battery"],
    sector: "Materials",
    related: ["ALB"]
  },
  {
    id: "MP",
    type: "company",
    name: "MP Materials",
    aliases: ["mp materials", "mountain pass"],
    keywords: ["rare earth", "neodymium", "magnet", "mining", "china alternative"],
    sector: "Materials",
    related: ["ARE"]
  },
  {
    id: "FCX",
    type: "company",
    name: "Freeport-McMoRan",
    aliases: ["freeport", "fcx"],
    keywords: ["copper", "gold", "mining", "indonesia", "grasberg"],
    sector: "Materials",
    related: ["SCCO", "RIO"]
  },
  // ============================================================================
  // FINANCIAL SERVICES
  // ============================================================================
  {
    id: "BRK-B",
    type: "company",
    name: "Berkshire Hathaway",
    aliases: ["berkshire", "berkshire hathaway", "brk", "warren buffett", "buffett", "charlie munger"],
    keywords: ["insurance", "investing", "conglomerate", "value"],
    sector: "Finance",
    related: ["JPM", "BAC", "GS"]
  },
  {
    id: "JPM",
    type: "company",
    name: "JPMorgan Chase",
    aliases: ["jpmorgan", "jp morgan", "jpm", "chase", "jamie dimon", "dimon"],
    keywords: ["bank", "banking", "investment bank", "credit", "loans", "interest rate"],
    sector: "Finance",
    related: ["BAC", "GS", "MS", "C"]
  },
  {
    id: "V",
    type: "company",
    name: "Visa Inc.",
    aliases: ["visa"],
    keywords: ["payments", "credit card", "debit", "transaction", "fintech"],
    sector: "Finance",
    related: ["MA", "AXP", "PYPL"]
  },
  {
    id: "MA",
    type: "company",
    name: "Mastercard Inc.",
    aliases: ["mastercard", "master card"],
    keywords: ["payments", "credit card", "debit", "transaction", "fintech"],
    sector: "Finance",
    related: ["V", "AXP", "PYPL"]
  },
  {
    id: "BAC",
    type: "company",
    name: "Bank of America",
    aliases: ["bank of america", "bofa", "bac", "boa"],
    keywords: ["bank", "banking", "mortgage", "loans", "credit", "interest rate"],
    sector: "Finance",
    related: ["JPM", "WFC", "C"]
  },
  // ============================================================================
  // HEALTHCARE
  // ============================================================================
  {
    id: "LLY",
    type: "company",
    name: "Eli Lilly",
    aliases: ["eli lilly", "lilly", "lly"],
    keywords: ["pharma", "drug", "ozempic", "diabetes", "obesity", "weight loss", "mounjaro", "zepbound"],
    sector: "Healthcare",
    related: ["NVO", "PFE", "MRK", "JNJ"]
  },
  {
    id: "UNH",
    type: "company",
    name: "UnitedHealth Group",
    aliases: ["unitedhealth", "united health", "unh", "optum"],
    keywords: ["insurance", "healthcare", "managed care", "medicare", "medicaid"],
    sector: "Healthcare",
    related: ["CVS", "CI", "HUM"]
  },
  {
    id: "NVO",
    type: "company",
    name: "Novo Nordisk",
    aliases: ["novo nordisk", "novo", "nvo"],
    keywords: ["pharma", "drug", "ozempic", "wegovy", "diabetes", "obesity", "glp-1", "weight loss"],
    sector: "Healthcare",
    related: ["LLY", "PFE", "MRK"]
  },
  {
    id: "JNJ",
    type: "company",
    name: "Johnson & Johnson",
    aliases: ["johnson johnson", "j&j", "jnj", "johnson and johnson"],
    keywords: ["pharma", "medical devices", "consumer health", "vaccine"],
    sector: "Healthcare",
    related: ["PFE", "MRK", "ABT"]
  },
  // ============================================================================
  // ENERGY
  // ============================================================================
  {
    id: "XOM",
    type: "company",
    name: "Exxon Mobil",
    aliases: ["exxon", "exxonmobil", "exxon mobil", "xom", "mobil"],
    keywords: ["oil", "gas", "drilling", "refinery", "petroleum", "energy", "fossil fuel"],
    sector: "Energy",
    related: ["CVX", "COP", "CL=F"]
  },
  // ============================================================================
  // CONSUMER / RETAIL
  // ============================================================================
  {
    id: "TSLA",
    type: "company",
    name: "Tesla Inc.",
    aliases: ["tesla", "tsla", "elon musk", "musk"],
    keywords: ["ev", "electric vehicle", "battery", "autopilot", "fsd", "robotaxi", "energy storage", "solar"],
    sector: "Consumer",
    related: ["RIVN", "LCID", "F", "GM"]
  },
  {
    id: "WMT",
    type: "company",
    name: "Walmart Inc.",
    aliases: ["walmart", "wmt", "wal-mart"],
    keywords: ["retail", "grocery", "ecommerce", "stores", "consumer", "discount"],
    sector: "Consumer",
    related: ["COST", "TGT", "AMZN"]
  },
  {
    id: "COST",
    type: "company",
    name: "Costco Wholesale",
    aliases: ["costco", "cost"],
    keywords: ["retail", "wholesale", "membership", "grocery", "warehouse"],
    sector: "Consumer",
    related: ["WMT", "TGT", "BJ"]
  },
  {
    id: "HD",
    type: "company",
    name: "Home Depot",
    aliases: ["home depot", "hd", "homedepot"],
    keywords: ["retail", "home improvement", "construction", "housing", "diy"],
    sector: "Consumer",
    related: ["LOW", "WMT"]
  },
  {
    id: "PG",
    type: "company",
    name: "Procter & Gamble",
    aliases: ["procter gamble", "p&g", "pg", "procter & gamble", "procter and gamble"],
    keywords: ["consumer goods", "household", "personal care", "detergent", "beauty"],
    sector: "Consumer",
    related: ["KO", "PEP", "CL", "UL"]
  },
  // ============================================================================
  // SECTORS (ETFs)
  // ============================================================================
  {
    id: "XLK",
    type: "sector",
    name: "Technology Select Sector",
    aliases: ["tech sector", "technology sector", "xlk"],
    keywords: ["tech", "software", "hardware", "it"],
    related: ["AAPL", "MSFT", "NVDA"]
  },
  {
    id: "XLF",
    type: "sector",
    name: "Financial Select Sector",
    aliases: ["finance sector", "financial sector", "xlf", "banks"],
    keywords: ["bank", "insurance", "financial"],
    related: ["JPM", "BAC", "V"]
  },
  {
    id: "XLE",
    type: "sector",
    name: "Energy Select Sector",
    aliases: ["energy sector", "xle", "oil stocks"],
    keywords: ["oil", "gas", "energy", "drilling"],
    related: ["XOM", "CVX", "CL=F"]
  },
  {
    id: "XLV",
    type: "sector",
    name: "Health Care Select Sector",
    aliases: ["healthcare sector", "health sector", "xlv", "pharma stocks"],
    keywords: ["pharma", "biotech", "healthcare", "medical"],
    related: ["LLY", "UNH", "JNJ"]
  },
  {
    id: "SMH",
    type: "sector",
    name: "Semiconductor ETF",
    aliases: ["semis", "semiconductor sector", "smh", "chip stocks"],
    keywords: ["chip", "semiconductor", "foundry", "fab"],
    related: ["NVDA", "TSM", "AVGO", "AMD"]
  },
  // ============================================================================
  // COMMODITIES
  // ============================================================================
  {
    id: "^VIX",
    type: "commodity",
    name: "VIX Volatility Index",
    aliases: ["vix", "fear index", "volatility"],
    keywords: ["volatility", "fear", "uncertainty", "hedging", "options"],
    related: ["^GSPC"]
  },
  {
    id: "GC=F",
    type: "commodity",
    name: "Gold Futures",
    aliases: ["gold", "xau", "bullion"],
    keywords: ["precious metal", "safe haven", "inflation hedge", "bullion", "jewelry"],
    related: ["SI=F", "GLD"]
  },
  {
    id: "CL=F",
    type: "commodity",
    name: "Crude Oil WTI",
    aliases: ["oil", "crude", "wti", "crude oil", "petroleum", "brent"],
    keywords: ["opec", "drilling", "refinery", "barrel", "pipeline", "energy", "gasoline", "fuel"],
    related: ["NG=F", "XOM", "CVX", "XLE"]
  },
  {
    id: "NG=F",
    type: "commodity",
    name: "Natural Gas Futures",
    aliases: ["natural gas", "natgas", "gas"],
    keywords: ["lng", "pipeline", "heating", "energy", "utility"],
    related: ["CL=F", "XLE"]
  },
  {
    id: "SI=F",
    type: "commodity",
    name: "Silver Futures",
    aliases: ["silver", "xag"],
    keywords: ["precious metal", "industrial metal", "solar", "electronics"],
    related: ["GC=F", "HG=F"]
  },
  {
    id: "HG=F",
    type: "commodity",
    name: "Copper Futures",
    aliases: ["copper"],
    keywords: ["industrial metal", "construction", "wiring", "ev", "infrastructure"],
    related: ["SI=F", "GC=F"]
  },
  // ============================================================================
  // CRYPTO (IDs match CRYPTO_IDS in markets.ts)
  // ============================================================================
  {
    id: "bitcoin",
    type: "crypto",
    name: "Bitcoin",
    aliases: ["bitcoin", "btc", "satoshi"],
    keywords: ["cryptocurrency", "blockchain", "digital currency", "halving", "btc mining"],
    related: ["ethereum", "solana"]
  },
  {
    id: "ethereum",
    type: "crypto",
    name: "Ethereum",
    aliases: ["ethereum", "eth", "ether", "vitalik"],
    keywords: ["smart contract", "defi", "nft", "blockchain", "eth gas"],
    related: ["bitcoin", "solana"]
  },
  {
    id: "solana",
    type: "crypto",
    name: "Solana",
    aliases: ["solana", "sol token"],
    keywords: ["blockchain", "defi", "nft", "solana network"],
    related: ["bitcoin", "ethereum"]
  },
  // ============================================================================
  // KEY COUNTRIES (for geopolitical correlation)
  // ============================================================================
  {
    id: "CN",
    type: "country",
    name: "China",
    aliases: ["china", "chinese", "beijing", "prc", "xi jinping"],
    keywords: ["trade war", "tariff", "ccp", "pla", "taiwan strait", "south china sea", "yuan", "rmb"],
    related: ["TW", "TSM", "BABA"]
  },
  {
    id: "TW",
    type: "country",
    name: "Taiwan",
    aliases: ["taiwan", "taiwanese", "taipei", "roc"],
    keywords: ["strait", "semiconductor", "chip", "invasion", "blockade"],
    related: ["CN", "TSM", "NVDA"]
  },
  {
    id: "RU",
    type: "country",
    name: "Russia",
    aliases: ["russia", "russian", "moscow", "kremlin", "putin", "vladimir putin"],
    keywords: ["sanctions", "ukraine", "war", "gas", "oil", "nato", "nuclear"],
    related: ["UA", "CL=F", "NG=F"]
  },
  {
    id: "UA",
    type: "country",
    name: "Ukraine",
    aliases: ["ukraine", "ukrainian", "kyiv", "kiev", "zelenskyy", "zelensky"],
    keywords: ["war", "invasion", "grain", "nato", "aid", "defense"],
    related: ["RU", "CL=F", "GC=F"]
  },
  {
    id: "IR",
    type: "country",
    name: "Iran",
    aliases: ["iran", "iranian", "tehran", "khamenei", "irgc"],
    keywords: ["sanctions", "nuclear", "oil", "strait of hormuz", "proxy", "hezbollah", "houthi"],
    related: ["IL", "CL=F", "SA"]
  },
  {
    id: "IL",
    type: "country",
    name: "Israel",
    aliases: ["israel", "israeli", "tel aviv", "jerusalem", "netanyahu", "idf"],
    keywords: ["gaza", "hamas", "hezbollah", "iran", "defense", "war", "middle east"],
    related: ["IR", "CL=F"]
  },
  {
    id: "SA",
    type: "country",
    name: "Saudi Arabia",
    aliases: ["saudi", "saudi arabia", "riyadh", "mbs", "aramco"],
    keywords: ["opec", "oil", "production", "cut", "crude", "energy"],
    related: ["CL=F", "IR", "XOM"]
  },
  {
    id: "AE",
    type: "country",
    name: "UAE",
    aliases: ["uae", "united arab emirates", "emirates", "abu dhabi", "dubai", "mbz"],
    keywords: ["oil", "trade", "g42", "ai", "logistics", "dp world"],
    related: ["SA", "CL=F", "MSFT"]
  },
  {
    id: "QA",
    type: "country",
    name: "Qatar",
    aliases: ["qatar", "doha", "al thani"],
    keywords: ["lng", "gas", "mediator", "hamas", "al udeid", "energy"],
    related: ["NG=F", "XOM", "US"]
  },
  {
    id: "TR",
    type: "country",
    name: "Turkey",
    aliases: ["turkey", "turkiye", "erdogan", "ankara"],
    keywords: ["nato", "bosphorus", "drone", "bayraktar", "kurds", "lira"],
    related: ["RU", "UA", "RHM.DE"]
  },
  {
    id: "EG",
    type: "country",
    name: "Egypt",
    aliases: ["egypt", "cairo", "sisi"],
    keywords: ["suez canal", "gaza", "rafah", "imf", "debt", "tourism"],
    related: ["IL", "SA", "AE"]
  }
];
function getEntityById(id) {
  return ENTITY_REGISTRY.find((e) => e.id === id);
}

// shared/text-analysis-core.js
var SIMILARITY_THRESHOLD = 0.5;
var STOP_WORDS = /* @__PURE__ */ new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "been",
  "be",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "what",
  "which",
  "who",
  "whom",
  "how",
  "when",
  "where",
  "why",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "not",
  "only",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "also",
  "now",
  "new",
  "says",
  "said",
  "after"
]);
var SUPPRESSED_TRENDING_TERMS = /* @__PURE__ */ new Set([
  // Meta / media terms
  "ai",
  "app",
  "api",
  "new",
  "top",
  "big",
  "ceo",
  "cto",
  "update",
  "report",
  "latest",
  "breaking",
  "analysis",
  "reuters",
  "exclusive",
  "opinion",
  "editorial",
  "watch",
  "live",
  "video",
  "photo",
  "photos",
  "read",
  "full",
  "source",
  "sources",
  "according",
  "ahead",
  "english",
  "times",
  "post",
  "news",
  "press",
  "media",
  "journal",
  "morning",
  "evening",
  "daily",
  "weekly",
  "monthly",
  "newsletter",
  "subscribe",
  "podcast",
  "interview",
  // Common news verbs (not meaningful standalone)
  "says",
  "said",
  "tells",
  "told",
  "calls",
  "called",
  "makes",
  "made",
  "takes",
  "took",
  "gets",
  "gives",
  "gave",
  "goes",
  "went",
  "comes",
  "came",
  "puts",
  "sets",
  "set",
  "shows",
  "shown",
  "finds",
  "found",
  "keeps",
  "kept",
  "holds",
  "held",
  "runs",
  "turns",
  "turned",
  "leads",
  "led",
  "brings",
  "brought",
  "starts",
  "started",
  "moves",
  "moved",
  "plans",
  "planned",
  "wants",
  "wanted",
  "needs",
  "needed",
  "looks",
  "looked",
  "works",
  "worked",
  "tries",
  "tried",
  "asks",
  "asked",
  "uses",
  "used",
  "expects",
  "expected",
  "reports",
  "reported",
  "claims",
  "claimed",
  "warns",
  "warned",
  "reveals",
  "revealed",
  "announces",
  "announced",
  "confirms",
  "confirmed",
  "denies",
  "denied",
  "launches",
  "launched",
  "signs",
  "signed",
  "faces",
  "faced",
  "seeks",
  "sought",
  "hits",
  "hit",
  "dies",
  "died",
  "killed",
  "kills",
  "rises",
  "rose",
  "falls",
  "fell",
  "wins",
  "won",
  "lost",
  "ends",
  "ended",
  "begins",
  "began",
  "opens",
  "opened",
  "closes",
  "closed",
  "raises",
  "raised",
  "cuts",
  "cut",
  "adds",
  "added",
  "drops",
  "dropped",
  "pushes",
  "pushed",
  "pulls",
  "pulled",
  "backs",
  "backed",
  "blocks",
  "blocked",
  "passes",
  "passed",
  "votes",
  "voted",
  "joins",
  "joined",
  "leaves",
  "left",
  "returns",
  "returned",
  "sends",
  "sent",
  "urges",
  "urged",
  "vows",
  "vowed",
  "pledges",
  "pledged",
  "rejects",
  "rejected",
  "approves",
  "approved",
  // Common news adjectives / adverbs / time words
  "first",
  "last",
  "next",
  "major",
  "former",
  "still",
  "despite",
  "amid",
  "over",
  "under",
  "back",
  "year",
  "years",
  "day",
  "days",
  "week",
  "weeks",
  "month",
  "months",
  "time",
  "long",
  "high",
  "low",
  "part",
  "early",
  "late",
  "key",
  "two",
  "three",
  "four",
  "five",
  "million",
  "billion",
  "percent",
  "nearly",
  "almost",
  "already",
  "just",
  "even",
  "since",
  "while",
  "during",
  "before",
  "between",
  "again",
  "against",
  "into",
  "through",
  "around",
  "about",
  "much",
  "many",
  "several",
  "second",
  "third",
  "possible",
  "likely",
  "least",
  "best",
  "worst",
  "largest",
  "biggest",
  "smallest",
  "highest",
  "lowest",
  "record",
  "global",
  "local",
  // Generic news nouns (too vague as standalone trends)
  "state",
  "states",
  "department",
  "officials",
  "official",
  "country",
  "countries",
  "people",
  "group",
  "groups",
  "plan",
  "deal",
  "talks",
  "move",
  "order",
  "case",
  "house",
  "court",
  "secretary",
  "board",
  "control",
  "bank",
  "power",
  "leader",
  "leaders",
  "government",
  "minister",
  "president",
  "agency",
  "market",
  "markets",
  "company",
  "companies",
  "world",
  "white",
  "head",
  "side",
  "point",
  "end",
  "line",
  "area",
  "number",
  "issue",
  "issues",
  "policy",
  "security",
  "force",
  "forces",
  "system",
  "service",
  "services",
  "program",
  "project",
  "effort",
  "action",
  "support",
  "level",
  "rate",
  "rates",
  "price",
  "prices",
  "trade",
  "growth",
  "change",
  "changes",
  "crisis",
  "risk",
  "impact",
  "future",
  "history",
  "data",
  "team",
  "member",
  "members",
  "office",
  "sector",
  "region",
  "regions",
  "center",
  "role",
  "south",
  "north",
  "east",
  "west",
  "eastern",
  "western",
  "southern",
  "northern",
  "central",
  "middle",
  "united",
  "national",
  "international",
  "federal",
  // Base verb forms (fallback when NER model unavailable)
  "say",
  "get",
  "give",
  "go",
  "come",
  "put",
  "take",
  "make",
  "know",
  "think",
  "see",
  "want",
  "look",
  "find",
  "tell",
  "ask",
  "use",
  "try",
  "leave",
  "call",
  "keep",
  "let",
  "begin",
  "show",
  "hear",
  "play",
  "run",
  "move",
  "help",
  "turn",
  "start",
  "hold",
  "bring",
  "write",
  "provide",
  "sit",
  "stand",
  "lose",
  "pay",
  "meet",
  "include",
  "continue",
  "learn",
  "lead",
  "believe",
  "feel",
  "follow",
  "stop",
  "speak",
  "allow",
  "add",
  "grow",
  "open",
  "walk",
  "win",
  "offer",
  "appear",
  "buy",
  "wait",
  "serve",
  "die",
  "send",
  "build",
  "stay",
  "fall",
  "reach",
  "remain",
  "suggest",
  "raise",
  "sell",
  "require",
  "decide",
  "develop",
  "break",
  "happen",
  "create",
  "live",
  // Numbers and misc
  "000",
  "100",
  "200",
  "500",
  "per",
  "than",
  // Finance / trading generic terms
  "trading",
  "stock",
  "earnings",
  "finance",
  "defi",
  "ipo",
  "tradingview",
  "currency",
  "dollar",
  "usd",
  "investing",
  "equity",
  "valuation",
  "ecb",
  "regulation",
  "outlook",
  "forecast",
  "financial",
  // Web / tech generic terms
  "com",
  "platform",
  "block",
  // Generic news nouns (additional)
  "focus",
  "today",
  "chief",
  "basel",
  // Generic adjectives / adverbs (additional)
  "ongoing",
  "higher",
  "poised",
  "track",
  // URL / source fragments
  "wall",
  "street",
  "financialcontent",
  // Media / URL fragments
  "ray",
  "msn",
  "aol",
  // Date fragments
  "2025",
  "2026",
  "2027",
  // Month names
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  // Company name fragments (too generic standalone)
  "goldman",
  "sachs",
  "off",
  // Basic English stopwords (pronouns, prepositions, adverbs)
  "here",
  "there",
  "where",
  "when",
  "what",
  "which",
  "who",
  "whom",
  "this",
  "that",
  "these",
  "those",
  "been",
  "being",
  "have",
  "has",
  "had",
  "having",
  "does",
  "done",
  "doing",
  "would",
  "could",
  "should",
  "will",
  "shall",
  "might",
  "must",
  "also",
  "more",
  "most",
  "some",
  "other",
  "only",
  "very",
  "after",
  "with",
  "from",
  "they",
  "them",
  "their",
  "then",
  "now",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "own",
  "same",
  "such",
  "too",
  "any",
  "well"
]);
function tokenize(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}
function jaccardSimilarity(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = /* @__PURE__ */ new Set([...a, ...b]);
  return intersection.size / union.size;
}
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// shared/entity-extraction-core.js
function buildEntityIndex(entities) {
  const byId = /* @__PURE__ */ new Map();
  const byAlias = /* @__PURE__ */ new Map();
  const byKeyword = /* @__PURE__ */ new Map();
  const bySector = /* @__PURE__ */ new Map();
  const byType = /* @__PURE__ */ new Map();
  for (const entity of entities) {
    byId.set(entity.id, entity);
    for (const alias of entity.aliases) {
      byAlias.set(alias.toLowerCase(), entity.id);
    }
    byAlias.set(entity.id.toLowerCase(), entity.id);
    byAlias.set(entity.name.toLowerCase(), entity.id);
    for (const keyword of entity.keywords) {
      const kw = keyword.toLowerCase();
      if (!byKeyword.has(kw)) byKeyword.set(kw, /* @__PURE__ */ new Set());
      byKeyword.get(kw).add(entity.id);
    }
    if (entity.sector) {
      const sector = entity.sector.toLowerCase();
      if (!bySector.has(sector)) bySector.set(sector, /* @__PURE__ */ new Set());
      bySector.get(sector).add(entity.id);
    }
    if (!byType.has(entity.type)) byType.set(entity.type, /* @__PURE__ */ new Set());
    byType.get(entity.type).add(entity.id);
  }
  const aliasMatchers = [];
  for (const [alias, entityId] of byAlias) {
    if (alias.length < 3) continue;
    aliasMatchers.push({
      alias,
      entityId,
      regex: new RegExp(`\\b${escapeRegex(alias)}\\b`, "gi")
    });
  }
  return { byId, byAlias, byKeyword, bySector, byType, aliasMatchers };
}
var cachedIndex = null;
function getEntityIndex() {
  if (!cachedIndex) {
    cachedIndex = buildEntityIndex(ENTITY_REGISTRY);
  }
  return cachedIndex;
}
function findEntitiesInText(text, index = getEntityIndex()) {
  const matches = [];
  const seen = /* @__PURE__ */ new Set();
  const textLower = text.toLowerCase();
  for (const { alias, entityId, regex } of index.aliasMatchers) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!seen.has(entityId)) {
        matches.push({
          entityId,
          matchedText: match[0],
          matchType: "alias",
          confidence: alias.length > 4 ? 0.95 : 0.85,
          position: match.index
        });
        seen.add(entityId);
        break;
      }
    }
  }
  for (const [keyword, entityIds] of index.byKeyword) {
    if (keyword.length < 3) continue;
    if (!textLower.includes(keyword)) continue;
    for (const entityId of entityIds) {
      if (seen.has(entityId)) continue;
      const pos = textLower.indexOf(keyword);
      matches.push({
        entityId,
        matchedText: keyword,
        matchType: "keyword",
        confidence: 0.7,
        position: pos
      });
      seen.add(entityId);
    }
  }
  return matches.sort((a, b) => b.confidence - a.confidence || a.position - b.position);
}
function getEntityDisplayName(entityId, index = getEntityIndex()) {
  const entity = index.byId.get(entityId);
  return entity?.name ?? entityId;
}
function extractEntitiesFromTitle(title, index = getEntityIndex()) {
  const matches = findEntitiesInText(title, index);
  return matches.map((match) => ({
    entityId: match.entityId,
    name: getEntityDisplayName(match.entityId, index),
    matchedText: match.matchedText,
    matchType: match.matchType,
    confidence: match.confidence
  }));
}

// shared/publisher-families.js
var PUBLISHER_FAMILY_DATA = {
  "a16z": { publisher: "Andreessen Horowitz", labels: ["a16z Blog", "a16z Insights", "a16z Podcast"] },
  "acquired": { publisher: "Acquired", labels: ["Acquired Episodes", "Acquired Podcast"] },
  "ap-news": { publisher: "Associated Press", labels: ["AP Mexico", "AP News"] },
  "arxiv": { publisher: "arXiv", labels: ["ArXiv AI", "ArXiv ML"] },
  "asharq": { publisher: "Asharq News", labels: ["Asharq Business", "Asharq News"] },
  "bbc": {
    publisher: "BBC",
    labels: [
      "BBC Africa",
      "BBC Afrique",
      "BBC Asia",
      "BBC Hindi",
      "BBC Latin America",
      "BBC Middle East",
      "BBC Mundo",
      "BBC Persian",
      "BBC Russian",
      "BBC Turkce",
      "BBC World"
    ]
  },
  "bloomberg": {
    publisher: "Bloomberg",
    labels: [
      "Bloomberg",
      "Bloomberg Commodities",
      "Bloomberg Crypto",
      "Bloomberg Energy",
      "Bloomberg Markets"
    ]
  },
  "brookings": { publisher: "Brookings Institution", labels: ["Brookings", "Brookings Tech"] },
  "cb-insights": { publisher: "CB Insights", labels: ["CB Insights", "CB Insights Unicorn"] },
  "chatham-house": { publisher: "Chatham House", labels: ["Chatham House", "Chatham House Tech"] },
  "cnbc": { publisher: "CNBC", labels: ["CNBC", "CNBC Commodities", "CNBC Markets", "CNBC Tech"] },
  "csis": { publisher: "CSIS", labels: ["CSIS", "CSIS Tech"] },
  "dw": { publisher: "Deutsche Welle", labels: ["DW News", "DW Turkish"] },
  "eia": { publisher: "US Energy Information Administration", labels: ["EIA Press Room", "EIA Reports"] },
  "fao": { publisher: "UN Food and Agriculture Organization", labels: ["FAO GIEWS", "FAO News"] },
  "financial-times": { publisher: "Financial Times", labels: ["FT Energy", "Financial Times"] },
  "france-24": { publisher: "France 24", labels: ["France 24", "France 24 LatAm"] },
  "good-news-network": {
    publisher: "Good News Network",
    labels: [
      "GNN Animals",
      "GNN Earth",
      "GNN Health",
      "GNN Heroes",
      "GNN Heroes Spotlight",
      "GNN Science",
      "Good News Network"
    ]
  },
  "guardian": {
    publisher: "The Guardian",
    labels: [
      "Guardian Americas",
      "Guardian Australia",
      "Guardian ME",
      "Guardian World"
    ]
  },
  "hacker-news": { publisher: "Hacker News", labels: ["Hacker News", "Show HN", "YC News"] },
  "hromadske": { publisher: "Hromadske", labels: ["Hromadske", "Hromadske EN"] },
  "iea": { publisher: "International Energy Agency", labels: ["IEA Critical Minerals", "IEA News"] },
  "kitco": { publisher: "Kitco", labels: ["Kitco Gold", "Kitco News"] },
  "marketwatch": { publisher: "MarketWatch", labels: ["MarketWatch", "MarketWatch Tech"] },
  "mit-technology-review": {
    publisher: "MIT Technology Review",
    labels: [
      "MIT Tech Review",
      "MIT Tech Review AI"
    ]
  },
  "ndtv": { publisher: "NDTV", labels: ["NDTV", "NDTV India"] },
  "nikkei": { publisher: "Nikkei", labels: ["Nikkei Asia", "Nikkei Tech"] },
  "pivot": { publisher: "Pivot (Vox Media)", labels: ["Pivot (Vox)", "Pivot Podcast"] },
  "politico": { publisher: "Politico", labels: ["Politico", "Politico Tech"] },
  "reuters": {
    publisher: "Reuters",
    labels: [
      "Reuters",
      "Reuters Asia",
      "Reuters Business",
      "Reuters Commodities",
      "Reuters Crypto",
      "Reuters Energy",
      "Reuters LatAm",
      "Reuters Markets",
      "Reuters US",
      "Reuters World"
    ]
  },
  "rt": { publisher: "RT", labels: ["RT", "RT Russia"] },
  "seeking-alpha": {
    publisher: "Seeking Alpha",
    labels: [
      "Seeking Alpha",
      "Seeking Alpha Metals",
      "Seeking Alpha Tech"
    ]
  },
  "sp-global": { publisher: "S&P Global", labels: ["S&P Global Commodity", "S&P Global Platts"] },
  "techcrunch": {
    publisher: "TechCrunch",
    labels: [
      "TechCrunch",
      "TechCrunch Layoffs",
      "TechCrunch Startups",
      "TechCrunch Venture"
    ]
  },
  "the-verge": {
    publisher: "The Verge",
    labels: [
      "Decoder (Verge)",
      "The Verge",
      "The Verge AI",
      "The Vergecast",
      "Verge Shows"
    ]
  },
  "venturebeat": { publisher: "VentureBeat", labels: ["VentureBeat", "VentureBeat AI"] },
  "white-house": { publisher: "The White House", labels: ["White House", "White House Actions"] },
  "y-combinator": { publisher: "Y Combinator", labels: ["YC Launches", "Y Combinator Blog"] },
  "yahoo-finance": { publisher: "Yahoo Finance", labels: ["Yahoo Finance", "Yahoo Finance Commodities"] }
};
var PUBLISHER_FAMILIES = Object.freeze(PUBLISHER_FAMILY_DATA);
var SINGLETON_PREFIX = "label:";
var familyByLabel = /* @__PURE__ */ new Map();
var familyByLowerLabel = /* @__PURE__ */ new Map();
for (const [familyId, entry] of Object.entries(PUBLISHER_FAMILY_DATA)) {
  for (const label of entry.labels) {
    familyByLabel.set(label, familyId);
    familyByLowerLabel.set(label.toLowerCase(), familyId);
  }
}
function publisherFamilyFor(label) {
  if (typeof label !== "string") return "";
  const trimmed = label.trim();
  if (trimmed.length === 0) return "";
  const lower = trimmed.toLowerCase();
  return familyByLabel.get(trimmed) ?? familyByLowerLabel.get(lower) ?? `${SINGLETON_PREFIX}${lower}`;
}
function publisherFamiliesFor(labels) {
  const families = /* @__PURE__ */ new Set();
  if (!Array.isArray(labels)) return families;
  for (const label of labels) {
    const family = publisherFamilyFor(label);
    if (family) families.add(family);
  }
  return families;
}
function countPublisherFamilies(labels) {
  return publisherFamiliesFor(labels).size;
}

// shared/keyword-spike-core.js
var CVE_PATTERN = /CVE-\d{4}-\d{4,}/gi;
var APT_PATTERN = /APT\d+/gi;
var FIN_PATTERN = /FIN\d+/gi;
var LEADER_NAMES = [
  "putin",
  "zelensky",
  "xi jinping",
  "biden",
  "trump",
  "netanyahu",
  "khamenei",
  "erdogan",
  "modi",
  "macron",
  "scholz",
  "starmer",
  "orban",
  "milei",
  "kim jong un",
  "al-sisi"
];
var LEADER_PATTERNS = LEADER_NAMES.map((name) => ({
  name,
  pattern: new RegExp(`\\b${escapeRegex(name)}\\b`, "i")
}));
var ROLLING_WINDOW_MS = 2 * 60 * 60 * 1e3;
var BASELINE_WINDOW_MS = 7 * 24 * 60 * 60 * 1e3;
var MIN_TOKEN_LENGTH = 3;
var MIN_SPIKE_SOURCE_COUNT = 2;
var DEFAULT_MIN_SPIKE_COUNT = 5;
var DEFAULT_SPIKE_MULTIPLIER = 3;
function toTermKey(term) {
  return term.trim().toLowerCase();
}
function asDisplayTerm(term) {
  if (/^(cve-\d{4}-\d{4,}|apt\d+|fin\d+)$/i.test(term)) {
    return term.toUpperCase();
  }
  return term.toLowerCase();
}
function extractEntities(text) {
  const entities = [];
  const lower = text.toLowerCase();
  for (const match of text.matchAll(CVE_PATTERN)) {
    entities.push(match[0].toUpperCase());
  }
  for (const match of text.matchAll(APT_PATTERN)) {
    entities.push(match[0].toUpperCase());
  }
  for (const match of text.matchAll(FIN_PATTERN)) {
    entities.push(match[0].toUpperCase());
  }
  for (const { name, pattern } of LEADER_PATTERNS) {
    if (pattern.test(lower)) {
      entities.push(name);
    }
  }
  return entities;
}
function stripSourceAttribution(title) {
  const idx = title.lastIndexOf(" - ");
  if (idx === -1) return title;
  const after = title.slice(idx + 3).trim();
  if (after.length > 0 && after.length <= 60 && !/[.!?]/.test(after)) {
    return title.slice(0, idx).trim();
  }
  return title;
}
function buildBaseTermCandidates(title) {
  const termCandidates = /* @__PURE__ */ new Map();
  const cleanTitle = stripSourceAttribution(title);
  for (const token of tokenize(cleanTitle)) {
    const termKey = toTermKey(token);
    termCandidates.set(termKey, { display: token, isEntity: false });
  }
  for (const entity of extractEntities(cleanTitle)) {
    const termKey = toTermKey(entity);
    termCandidates.set(termKey, { display: entity, isEntity: true });
  }
  return termCandidates;
}
function evaluateSpikeDecision({ recentCount, baseline, minSpikeCount, spikeMultiplier }) {
  if (recentCount < minSpikeCount) return { isSpike: false, multiplier: 0 };
  const multiplier = baseline > 0 ? recentCount / baseline : 0;
  const isSpike = baseline > 0 ? recentCount > baseline * spikeMultiplier : recentCount >= minSpikeCount;
  return { isSpike, multiplier };
}
function computeKeywordSpikesFromStories(stories, {
  nowMs,
  windowMs = ROLLING_WINDOW_MS,
  baselineDurationMs,
  minSpikeCount = DEFAULT_MIN_SPIKE_COUNT,
  spikeMultiplier = DEFAULT_SPIKE_MULTIPLIER,
  blockedTerms = SUPPRESSED_TRENDING_TERMS,
  maxSampleHeadlines = 3
}) {
  if (!Number.isFinite(baselineDurationMs) || baselineDurationMs <= 0) return [];
  const windowStart = nowMs - windowMs;
  const baselineWindows = baselineDurationMs / windowMs;
  const terms = /* @__PURE__ */ new Map();
  for (const story of stories) {
    if (!story?.title || !Number.isFinite(story.lastSeenMs)) continue;
    const isRecent = story.lastSeenMs >= windowStart && story.lastSeenMs <= nowMs;
    for (const [termKey, meta] of buildBaseTermCandidates(story.title)) {
      if (blockedTerms.has(termKey)) continue;
      if (!meta.isEntity && termKey.length < MIN_TOKEN_LENGTH) continue;
      let record = terms.get(termKey);
      if (!record) {
        record = { display: asDisplayTerm(meta.display), recent: [], baselineCount: 0 };
        terms.set(termKey, record);
      } else if (meta.isEntity) {
        record.display = asDisplayTerm(meta.display);
      }
      if (isRecent) record.recent.push(story);
      else record.baselineCount += 1;
    }
  }
  const spikes = [];
  for (const record of terms.values()) {
    const recentCount = record.recent.length;
    const baseline = record.baselineCount / baselineWindows;
    const { isSpike, multiplier } = evaluateSpikeDecision({
      recentCount,
      baseline,
      minSpikeCount,
      spikeMultiplier
    });
    if (!isSpike) continue;
    const uniqueSources = /* @__PURE__ */ new Set();
    for (const story of record.recent) {
      for (const family of publisherFamiliesFor(story.sources)) uniqueSources.add(family);
    }
    if (uniqueSources.size < MIN_SPIKE_SOURCE_COUNT) continue;
    spikes.push({
      term: record.display,
      count: recentCount,
      baseline,
      multiplier,
      windowMs,
      uniqueSources: uniqueSources.size,
      sampleHeadlines: record.recent.slice(0, maxSampleHeadlines).map((s) => s.title)
    });
  }
  return spikes.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
}

// shared/news-clustering-core.js
var MAX_CLUSTER_NEWS_ITEMS = 1e3;
var THREAT_PRIORITY = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1
};
var PROTO_TO_THREAT_LEVEL = {
  THREAT_LEVEL_UNSPECIFIED: "info",
  THREAT_LEVEL_LOW: "low",
  THREAT_LEVEL_MEDIUM: "medium",
  THREAT_LEVEL_HIGH: "high",
  THREAT_LEVEL_CRITICAL: "critical"
};
function protoThreatLevelToLabel(value) {
  return PROTO_TO_THREAT_LEVEL[value] ?? "info";
}
function effectivePubDateMs(item) {
  if (item.pubDateMissing === true) return 0;
  if (item.pubDate instanceof Date) {
    const ms2 = item.pubDate.getTime();
    return Number.isFinite(ms2) ? ms2 : 0;
  }
  if (typeof item.pubDate === "number") {
    return Number.isFinite(item.pubDate) ? item.pubDate : 0;
  }
  const ms = new Date(item.pubDate).getTime();
  return Number.isFinite(ms) ? ms : 0;
}
function aggregateThreats(items) {
  const withThreat = items.filter((i) => i.threat);
  if (withThreat.length === 0) {
    return { level: "info", category: "general", confidence: 0.3, source: "keyword" };
  }
  let maxLevel = "info";
  let maxPriority = 0;
  for (const item of withThreat) {
    const p = THREAT_PRIORITY[item.threat.level];
    if (p > maxPriority) {
      maxPriority = p;
      maxLevel = item.threat.level;
    }
  }
  const catCounts = /* @__PURE__ */ new Map();
  for (const item of withThreat) {
    const cat = item.threat.category;
    catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
  }
  let topCat = "general";
  let topCount = 0;
  for (const [cat, count] of catCounts) {
    if (count > topCount) {
      topCount = count;
      topCat = cat;
    }
  }
  let weightedSum = 0;
  let weightTotal = 0;
  for (const item of withThreat) {
    const weight = item.tier ? 6 - Math.min(item.tier, 5) : 1;
    weightedSum += item.threat.confidence * weight;
    weightTotal += weight;
  }
  return {
    level: maxLevel,
    category: topCat,
    confidence: weightTotal > 0 ? weightedSum / weightTotal : 0.5,
    source: "keyword"
  };
}
function generateClusterId(items) {
  const sorted = [...items].sort((a, b) => a.pubDate.getTime() - b.pubDate.getTime());
  const first = sorted[0];
  return `${first.pubDate.getTime()}-${first.title.slice(0, 20).replace(/\W/g, "")}`;
}
function clusterNewsCore(items, getSourceTier) {
  if (items.length === 0) return [];
  const boundedItems = items.length > MAX_CLUSTER_NEWS_ITEMS ? [...items].sort(
    (a, b) => effectivePubDateMs(b) - effectivePubDateMs(a) || a.source.localeCompare(b.source) || a.title.localeCompare(b.title) || a.link.localeCompare(b.link)
  ).slice(0, MAX_CLUSTER_NEWS_ITEMS) : items;
  const itemsWithTier = boundedItems.map((item) => ({
    ...item,
    tier: item.tier ?? getSourceTier(item.source)
  }));
  const tokenCache = /* @__PURE__ */ new Map();
  const tokenList = [];
  const invertedIndex = /* @__PURE__ */ new Map();
  for (const item of itemsWithTier) {
    const tokens = tokenize(item.title);
    tokenCache.set(item.title, tokens);
    tokenList.push(tokens);
  }
  for (let index = 0; index < tokenList.length; index++) {
    const tokens = tokenList[index];
    for (const token of tokens) {
      const bucket = invertedIndex.get(token);
      if (bucket) {
        bucket.push(index);
      } else {
        invertedIndex.set(token, [index]);
      }
    }
  }
  const clusters = [];
  const assigned = /* @__PURE__ */ new Set();
  for (let i = 0; i < itemsWithTier.length; i++) {
    if (assigned.has(i)) continue;
    const currentItem = itemsWithTier[i];
    const cluster = [currentItem];
    assigned.add(i);
    const tokensI = tokenList[i];
    const candidateIndices = /* @__PURE__ */ new Set();
    for (const token of tokensI) {
      const bucket = invertedIndex.get(token);
      if (!bucket) continue;
      for (const idx of bucket) {
        if (idx > i) {
          candidateIndices.add(idx);
        }
      }
    }
    const sortedCandidates = Array.from(candidateIndices).sort((a, b) => a - b);
    for (const j of sortedCandidates) {
      if (assigned.has(j)) {
        continue;
      }
      const otherItem = itemsWithTier[j];
      const tokensJ = tokenList[j];
      const similarity = jaccardSimilarity(tokensI, tokensJ);
      if (similarity >= SIMILARITY_THRESHOLD) {
        cluster.push(otherItem);
        assigned.add(j);
      }
    }
    clusters.push(cluster);
  }
  return clusters.map((cluster) => {
    const sorted = [...cluster].sort((a, b) => {
      const tierDiff = a.tier - b.tier;
      if (tierDiff !== 0) return tierDiff;
      return effectivePubDateMs(b) - effectivePubDateMs(a);
    });
    const primary = sorted[0];
    const dates = cluster.map((i) => i.pubDate.getTime());
    const topSources = sorted.slice(0, 3).map((item) => ({
      name: item.source,
      tier: item.tier,
      url: item.link
    }));
    const threat = aggregateThreats(cluster);
    const locItems = cluster.filter((i) => i.lat != null && i.lon != null);
    let clusterLat;
    let clusterLon;
    if (locItems.length > 0) {
      const locCounts = /* @__PURE__ */ new Map();
      for (const li of locItems) {
        const key = `${li.lat},${li.lon}`;
        const entry = locCounts.get(key) || { lat: li.lat, lon: li.lon, count: 0 };
        entry.count++;
        locCounts.set(key, entry);
      }
      const best = Array.from(locCounts.values()).sort((a, b) => b.count - a.count)[0];
      clusterLat = best.lat;
      clusterLon = best.lon;
    }
    return {
      id: generateClusterId(cluster),
      primaryTitle: primary.title,
      primarySource: primary.source,
      primaryLink: primary.link,
      sourceCount: cluster.length,
      uniquePublisherCount: countPublisherFamilies(cluster.map((i) => i.source)),
      topSources,
      allItems: cluster,
      firstSeen: new Date(dates.reduce((min, d) => d < min ? d : min)),
      lastUpdated: new Date(dates.reduce((max, d) => d > max ? d : max)),
      isAlert: cluster.some((i) => i.isAlert),
      monitorColor: cluster.find((i) => i.monitorColor)?.monitorColor,
      threat,
      ...clusterLat != null && { lat: clusterLat, lon: clusterLon },
      lang: primary.lang
    };
  }).sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
}
function topClusterKeywords(cluster, limit = 5) {
  const counts = /* @__PURE__ */ new Map();
  for (const item of cluster.allItems) {
    for (const token of tokenize(item.title)) {
      if (SUPPRESSED_TRENDING_TERMS.has(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([token]) => token);
}

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

// api/mcp/auth.ts
var import_ratelimit2 = __toESM(require_dist2(), 1);

// node_modules/@upstash/redis/chunk-IH7W44G6.mjs
var __defProp2 = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp2(target, name, { get: all[name], enumerable: true });
};
var error_exports = {};
__export(error_exports, {
  UpstashError: () => UpstashError,
  UpstashJSONParseError: () => UpstashJSONParseError,
  UrlError: () => UrlError
});
var UpstashError = class extends Error {
  constructor(message, options) {
    super(message, options);
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
var MAX_BUFFER_SIZE = 1024 * 1024;

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

// api/_client-ip.js
var RATE_LIMIT_DEGRADED_HEADERS = Object.freeze({
  "X-RateLimit-Mode": "degraded",
  "Retry-After": "5"
});
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
  const [networkText, prefixText] = cidr.split("/");
  const network = parseIpv4(networkText);
  if (network === null) throw new Error(`Invalid Cloudflare IPv4 CIDR: ${cidr}`);
  return [network, Number(prefixText)];
}
function parseIpv6Cidr(cidr) {
  const [networkText, prefixText] = cidr.split("/");
  const network = parseIpv6(networkText);
  if (network === null) throw new Error(`Invalid Cloudflare IPv6 CIDR: ${cidr}`);
  return [network, Number(prefixText)];
}
var CLOUDFLARE_IPV4_RANGES = Object.freeze(CLOUDFLARE_IPV4_CIDRS.map(parseIpv4Cidr));
var CLOUDFLARE_IPV6_RANGES = Object.freeze(CLOUDFLARE_IPV6_CIDRS.map(parseIpv6Cidr));

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
  const errMsg = err instanceof Error ? err.message : String(err);
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
          value: errMsg,
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

// server/_shared/client-ip.ts
var CLOUDFLARE_IPV4_CIDRS2 = Object.freeze([
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
var CLOUDFLARE_IPV6_CIDRS2 = Object.freeze([
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32"
]);
function parseIpv42(value) {
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
function parseIpv62(value) {
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
function parseIpv4Cidr2(cidr) {
  const [networkText = "", prefixText = ""] = cidr.split("/");
  const network = parseIpv42(networkText);
  if (network === null) throw new Error(`Invalid Cloudflare IPv4 CIDR: ${cidr}`);
  return [network, Number(prefixText)];
}
function parseIpv6Cidr2(cidr) {
  const [networkText = "", prefixText = ""] = cidr.split("/");
  const network = parseIpv62(networkText);
  if (network === null) throw new Error(`Invalid Cloudflare IPv6 CIDR: ${cidr}`);
  return [network, Number(prefixText)];
}
var CLOUDFLARE_IPV4_RANGES2 = Object.freeze(CLOUDFLARE_IPV4_CIDRS2.map(parseIpv4Cidr2));
var CLOUDFLARE_IPV6_RANGES2 = Object.freeze(CLOUDFLARE_IPV6_CIDRS2.map(parseIpv6Cidr2));

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
var ENV_PREFIX = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live" : "test";
var TIER_GATED_PATHS = new Set(Object.keys(ENDPOINT_ENTITLEMENTS));

// server/_shared/mcp-internal-hmac.ts
var INTERNAL_MCP_SIG_HEADER = "X-WM-MCP-Internal";
var INTERNAL_MCP_USER_ID_HEADER = "X-WM-MCP-User-Id";
var INTERNAL_MCP_NONCE_HEADER = "X-WM-MCP-Nonce";
var INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS = 30;
var INTERNAL_MCP_REPLAY_CACHE_TTL_SECONDS = 2 * INTERNAL_MCP_TIMESTAMP_WINDOW_SECONDS + 5;
async function sha256Hex2(input) {
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
async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
function bufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function hmacSha256Base64Url(secret, payload) {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bufferToBase64Url(sig);
}
function makeInternalMcpNonce() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function isValidInternalMcpNonce(nonce) {
  return /^[A-Za-z0-9_-]{16,128}$/.test(nonce);
}
async function signInternalMcpRequest(args) {
  if (!args.userId) throw new Error("signInternalMcpRequest: userId is required");
  if (!args.secret) throw new Error("signInternalMcpRequest: secret is required");
  const nonce = args.nonce ?? makeInternalMcpNonce();
  if (!isValidInternalMcpNonce(nonce)) throw new Error("signInternalMcpRequest: nonce must be 16-128 URL-safe characters");
  const url = args.url instanceof URL ? args.url : new URL(args.url);
  const ts = Math.floor(args.now ?? Date.now() / 1e3);
  const queryHash = await sha256Hex2(canonicalQueryString(url));
  const bodyHash = await sha256Hex2(await coerceBodyToString(args.body));
  const payload = buildHmacPayload({
    ts,
    method: args.method,
    pathname: url.pathname,
    queryHash,
    bodyHash,
    userId: args.userId,
    nonce
  });
  const sig = await hmacSha256Base64Url(args.secret, payload);
  return { signature: `${ts}.${sig}`, userId: args.userId, nonce, ts };
}
async function coerceBodyToString(body) {
  if (body == null) return "";
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array) return new TextDecoder().decode(body);
  if (body instanceof ArrayBuffer) return new TextDecoder().decode(new Uint8Array(body));
  if (body instanceof URLSearchParams) return body.toString();
  const G = globalThis;
  if (G.Blob && body instanceof G.Blob) {
    throw new Error("signInternalMcpRequest: unsupported body shape (Blob); pre-stringify before signing");
  }
  if (G.FormData && body instanceof G.FormData) {
    throw new Error("signInternalMcpRequest: unsupported body shape (FormData); pre-stringify before signing");
  }
  if (G.ReadableStream && body instanceof G.ReadableStream) {
    throw new Error("signInternalMcpRequest: unsupported body shape (ReadableStream); pre-stringify before signing");
  }
  throw new Error("signInternalMcpRequest: unsupported body shape; pre-stringify before signing");
}
function buildInternalMcpHeaders(signed) {
  return {
    [INTERNAL_MCP_SIG_HEADER]: signed.signature,
    [INTERNAL_MCP_USER_ID_HEADER]: signed.userId,
    [INTERNAL_MCP_NONCE_HEADER]: signed.nonce
  };
}

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
var encoder = new TextEncoder();

// server/_shared/user-api-key.ts
var COMPANY_MONITORING_SCOPES = new Set(Object.values(COMPANY_MONITORING_RPC_SCOPES));

// server/_shared/rate-limit.ts
var import_ratelimit = __toESM(require_dist2(), 1);

// api/_rate-limit-fallback.js
function durationToSeconds(window) {
  const match = /^(\d+)\s?(ms|s|m|h|d)$/.exec(window);
  if (!match) throw new Error(`Unable to parse rate-limit window: ${window}`);
  const value = Number(match[1]);
  const unit = match[2] ?? "s";
  const unitSeconds = { ms: 1e-3, s: 1, m: 60, h: 3600, d: 86400 };
  return Math.max(1, Math.ceil(value * (unitSeconds[unit] ?? 1)));
}

// server/_shared/rate-limit.ts
var REDIS_TEST_RETRY_OPTS = process.env.NODE_TEST_CONTEXT ? { retry: false } : {};
var ENDPOINT_RATE_LIMIT_TIMEOUT_MS = process.env.NODE_TEST_CONTEXT ? 250 : 5e3;
var ENDPOINT_REDIS_ABORT_TIMEOUT_MS = process.env.NODE_TEST_CONTEXT ? 20 : 4500;
var __ENDPOINT_LIMITER_DEADLINES_FOR_TEST = Object.freeze({
  decisionMs: ENDPOINT_RATE_LIMIT_TIMEOUT_MS,
  abortMs: ENDPOINT_REDIS_ABORT_TIMEOUT_MS
});
var GLOBAL_RATE_WINDOW = "60 s";
var GLOBAL_RATE_WINDOW_SECONDS = durationToSeconds(GLOBAL_RATE_WINDOW);

// api/mcp/telemetry.ts
var MCP_TOOLCALL_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "tool",
  "auth_kind",
  "user_id",
  "latency_ms",
  "bytes_pre_jmespath",
  "bytes_post_jmespath",
  "jmespath_used",
  "jmespath_failed",
  "ok",
  "error_kind",
  "budget_exceeded"
]);
var MCP_TOOLS_LIST_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "auth_kind",
  "user_id",
  "tools_array_bytes",
  "tool_count",
  "client_user_agent"
]);
var MCP_RATE_LIMIT_HIT_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "auth_kind",
  "user_id",
  "principal_id",
  "dimension",
  "limit",
  "window_seconds"
]);
var MCP_DOWNSTREAM_TELEMETRY_KEYS = Object.freeze([
  "tag",
  "ts",
  "tool",
  "auth_kind",
  "inbound_host_class",
  "downstream_origin",
  "downstream_operation",
  "status",
  "ok",
  "error_code",
  "response_marker"
]);

// api/mcp/auth.ts
async function buildAuthHeaders(context, method, url, body) {
  if (context.kind === "env_key" || context.kind === "user_key") {
    return { "X-WorldMonitor-Key": context.apiKey };
  }
  const secret = process.env.MCP_INTERNAL_HMAC_SECRET ?? "";
  if (!secret) {
    throw new Error("MCP_INTERNAL_HMAC_SECRET not configured");
  }
  const signed = await signInternalMcpRequest({
    method,
    url,
    body,
    userId: context.userId,
    secret
  });
  return buildInternalMcpHeaders(signed);
}

// api/mcp/billing-denial.ts
var BILLING_VERIFICATION_CODES = /* @__PURE__ */ new Set([
  "subscription_lapsed",
  "renewal_verification_pending",
  "renewal_verification_failed",
  "entitlement_verification_unavailable"
]);
var BillingDenialError = class extends Error {
  operation;
  status;
  billingCode;
  retryAfterSeconds;
  constructor(label, status, billingCode, retryAfterSeconds) {
    super(`${label} HTTP ${status} (${billingCode})`);
    this.name = "BillingDenialError";
    this.operation = label;
    this.status = status;
    this.billingCode = billingCode;
    this.retryAfterSeconds = retryAfterSeconds;
  }
};
function throwIfBillingDenial(response, label) {
  if (response.ok) return;
  const marker = response.headers?.get("X-Billing-Verification");
  if (!marker || !BILLING_VERIFICATION_CODES.has(marker)) return;
  const retryHeader = response.headers?.get("Retry-After");
  const rawRetryAfter = retryHeader == null ? Number.NaN : Number(retryHeader);
  throw new BillingDenialError(
    label,
    response.status,
    marker,
    Number.isFinite(rawRetryAfter) ? rawRetryAfter : void 0
  );
}
function assertToolFetchOk(response, label) {
  if (response.ok) return;
  throwIfBillingDenial(response, label);
  throw new Error(`${label} HTTP ${response.status}`);
}

// api/mcp/filters.ts
function argStr(v) {
  return typeof v === "string" ? v.toLowerCase().trim() : "";
}

// api/mcp/source-unavailable.ts
var McpSourceUnavailableError = class extends Error {
  unavailableInputs;
  failedInputs;
  constructor(message, unavailableInputs, failedInputs) {
    super(message);
    this.name = "McpSourceUnavailableError";
    this.unavailableInputs = [...unavailableInputs];
    this.failedInputs = [...failedInputs];
  }
};

// api/mcp/registry/nlp-tools.ts
var CLASSIFY_TEXT_MAX_CHARS = 500;
var CLASSIFY_CATEGORIES = [
  "conflict",
  "protest",
  "disaster",
  "diplomatic",
  "economic",
  "terrorism",
  "cyber",
  "health",
  "environmental",
  "military",
  "crime",
  "infrastructure",
  "tech",
  "general"
];
var CLASSIFY_LEVELS = ["critical", "high", "medium", "low", "info"];
var CLASSIFY_SEVERITIES = [
  "SEVERITY_LEVEL_HIGH",
  "SEVERITY_LEVEL_MEDIUM",
  "SEVERITY_LEVEL_LOW"
];
var EXTRACT_TEXT_MAX_CHARS = 2048;
var NLP_DIGEST_TIMEOUT_MS = 6e3;
var NLP_UA = "worldmonitor-mcp-edge/1.0";
var NLP_DIGEST_SOURCE_MAX_BYTES = 160;
var NLP_DIGEST_TITLE_MAX_BYTES = 512;
var NLP_DIGEST_LINK_MAX_BYTES = 2048;
var NLP_DIGEST_METADATA_MAX_BYTES = 64;
var NLP_DIGEST_NOTE_MAX_BYTES = 2048;
var KEYWORD_SPIKE_BASELINE_MS = 48 * 60 * 60 * 1e3;
var KEYWORD_SPIKE_CACHE_TTL_S = 600;
var KEYWORD_SPIKE_MAX_STORIES = 800;
var KEYWORD_SPIKE_MAX_STORED = 25;
var DIGEST_ACCUMULATOR_KEY_MCP = "digest:accumulator:v1:full:en";
var NLP_DIGEST_VARIANTS = ["full", "tech"];
var FULL_DIGEST_CATEGORIES = [
  "politics",
  "us",
  "europe",
  "middleeast",
  "tech",
  "ai",
  "finance",
  "commodities",
  "gov",
  "africa",
  "latam",
  "asia",
  "energy",
  "thinktanks",
  "crisis",
  "layoffs",
  "intel"
];
var TECH_DIGEST_CATEGORIES = [
  "tech",
  "ai",
  "startups",
  "vcblogs",
  "regionalStartups",
  "unicorns",
  "accelerators",
  "security",
  "policy",
  "github",
  "funding",
  "cloud",
  "layoffs",
  "finance",
  "dev",
  "ipo",
  "producthunt",
  "hardware",
  "outages"
];
var DIGEST_CATEGORIES_BY_VARIANT = {
  full: FULL_DIGEST_CATEGORIES,
  tech: TECH_DIGEST_CATEGORIES
};
var ALL_DIGEST_CATEGORIES = [.../* @__PURE__ */ new Set([...FULL_DIGEST_CATEGORIES, ...TECH_DIGEST_CATEGORIES])];
var DIGEST_CATEGORY_DESC = "Restrict to one category from the selected digest variant. full: " + FULL_DIGEST_CATEGORIES.join(", ") + "; tech: " + TECH_DIGEST_CATEGORIES.join(", ") + ". Echoed as `category` in the result; an unknown value yields headlineCount 0 and a `note` listing categories present in the current digest.";
var SOURCE_PROVENANCE_REQUIRED = [
  "risk",
  "type",
  "riskDeclared",
  "typeDeclared",
  "riskReviewed",
  "typeReviewed"
];
var SOURCE_PROVENANCE_PROPERTIES = {
  risk: { type: "string" },
  type: { type: "string" },
  riskDeclared: { type: "boolean" },
  typeDeclared: { type: "boolean" },
  riskReviewed: { type: "boolean" },
  typeReviewed: { type: "boolean" },
  stateAffiliated: { type: "string" },
  note: { type: "string" }
};
function nlpTruncateUtf8(value, maxBytes) {
  let bytes = 0;
  let end = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    const characterBytes = codePoint <= 127 ? 1 : codePoint <= 2047 ? 2 : codePoint <= 65535 ? 3 : 4;
    if (bytes + characterBytes > maxBytes) break;
    bytes += characterBytes;
    end += character.length;
  }
  return end === value.length ? value : value.slice(0, end);
}
function nlpClampInt(value, min, max, fallback) {
  return Number.isInteger(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
function patternEntityKind(value) {
  if (/^cve-/i.test(value)) return "cve";
  if (/^apt\d+$/i.test(value)) return "apt";
  if (/^fin\d+$/i.test(value)) return "fin";
  return "leader";
}
async function fetchNlpDigestItems(base, context, variant, category = "") {
  const digestUrl = `${base}/api/news/v1/list-feed-digest?variant=${variant}&lang=en`;
  const auth = await buildAuthHeaders(context, "GET", digestUrl, null);
  const res = await fetch(digestUrl, {
    headers: { ...auth, "User-Agent": NLP_UA },
    signal: AbortSignal.timeout(NLP_DIGEST_TIMEOUT_MS)
  });
  assertToolFetchOk(res, "list-feed-digest");
  const body = await res.json();
  const seen = /* @__PURE__ */ new Set();
  const items = [];
  const categories = body.categories ?? {};
  if (Object.keys(categories).length === 0 && Object.keys(body.feedStatuses ?? {}).length === 0) {
    throw new McpSourceUnavailableError(
      `Feed digest unavailable for ${variant}/en`,
      [`news:digest:v1:${variant}:en`],
      []
    );
  }
  const availableCategories = Object.keys(categories).sort();
  let groups;
  let note;
  if (!category) {
    groups = Object.values(categories);
  } else if (Object.prototype.hasOwnProperty.call(categories, category)) {
    groups = [categories[category]];
  } else {
    groups = [];
    const listed = availableCategories.length > 0 ? availableCategories.join(", ") : DIGEST_CATEGORIES_BY_VARIANT[variant].join(", ");
    note = nlpTruncateUtf8(
      `Unknown digest category "${category}". Available: ${listed}.`,
      NLP_DIGEST_NOTE_MAX_BYTES
    );
  }
  for (const group of groups) {
    for (const raw of group.items ?? []) {
      if (!raw?.title || !raw.source) continue;
      const key = raw.link || `${raw.source}|${raw.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const source = nlpTruncateUtf8(raw.source, NLP_DIGEST_SOURCE_MAX_BYTES);
      const title = nlpTruncateUtf8(raw.title, NLP_DIGEST_TITLE_MAX_BYTES);
      const link = nlpTruncateUtf8(raw.link ?? "", NLP_DIGEST_LINK_MAX_BYTES);
      items.push({
        source,
        title,
        link,
        pubDate: new Date(Number(raw.publishedAt) || 0),
        isAlert: raw.isAlert === true,
        tier: 3,
        threat: raw.threat ? {
          level: protoThreatLevelToLabel(raw.threat.level),
          category: nlpTruncateUtf8(
            raw.threat.category ?? "general",
            NLP_DIGEST_METADATA_MAX_BYTES
          ),
          confidence: typeof raw.threat.confidence === "number" ? raw.threat.confidence : 0.5,
          source: raw.threat.source === "ml" || raw.threat.source === "llm" ? raw.threat.source : "keyword"
        } : void 0
      });
    }
  }
  return {
    items,
    generatedAt: nlpTruncateUtf8(body.generatedAt ?? "", NLP_DIGEST_METADATA_MAX_BYTES),
    variant,
    category: category || null,
    ...note ? { note } : {}
  };
}
function resolveNlpDigestVariant(value) {
  const requested = argStr(value) || "full";
  return NLP_DIGEST_VARIANTS.includes(requested) ? requested : null;
}
function nlpRegistryEntities(titles, limit) {
  const registryStats = /* @__PURE__ */ new Map();
  const patternStats = /* @__PURE__ */ new Map();
  for (const title of titles) {
    for (const entity of extractEntitiesFromTitle(title)) {
      const stats = registryStats.get(entity.entityId) ?? { name: entity.name, type: getEntityById(entity.entityId)?.type ?? "company", count: 0, totalConfidence: 0 };
      stats.count += 1;
      stats.totalConfidence += entity.confidence;
      registryStats.set(entity.entityId, stats);
    }
    for (const value of extractEntities(title)) {
      patternStats.set(value, (patternStats.get(value) ?? 0) + 1);
    }
  }
  return {
    entities: Array.from(registryStats.entries()).map(([entityId, stats]) => ({
      entityId,
      name: stats.name,
      type: stats.type,
      mentionCount: stats.count,
      avgConfidence: Math.round(stats.totalConfidence / stats.count * 100) / 100
    })).sort((a, b) => b.mentionCount - a.mentionCount || a.entityId.localeCompare(b.entityId)).slice(0, limit),
    patternEntities: Array.from(patternStats.entries()).map(([value, mentionCount]) => ({ value, kind: patternEntityKind(value), mentionCount })).sort((a, b) => b.mentionCount - a.mentionCount || a.value.localeCompare(b.value)).slice(0, limit)
  };
}
var NLP_TOOLS = [
  {
    name: "classify_event",
    _outputBudgetBytes: 4096,
    description: "Classify a supplied news headline or short text into a threat category and severity via the enum-validated WorldMonitor event classifier (temperature-0, 24h-cached per title, never free-form LLM output). Input is capped at 500 characters. classification is null when the classifier cannot produce an enum-valid result.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", maxLength: CLASSIFY_TEXT_MAX_CHARS, description: "Headline or short excerpt to classify (1-500 characters). Longer input is rejected, not truncated." }
      },
      required: ["text"]
    },
    outputSchema: {
      type: "object",
      required: ["classification"],
      properties: {
        classification: {
          type: ["object", "null"],
          description: "null when the classifier could not produce an enum-valid result for this text.",
          required: ["category", "level", "severity", "confidence"],
          properties: {
            category: {
              type: "string",
              enum: CLASSIFY_CATEGORIES
            },
            level: { type: "string", enum: CLASSIFY_LEVELS },
            severity: {
              type: "string",
              enum: CLASSIFY_SEVERITIES
            },
            confidence: { type: "number" }
          }
        },
        error: { type: "string", description: "Present instead of a result when input validation fails." }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    _execute: async (params, base, context) => {
      const text = typeof params.text === "string" ? params.text.trim() : "";
      if (!text) return { classification: null, error: "text is required (a non-empty string of at most 500 characters)" };
      if (text.length > CLASSIFY_TEXT_MAX_CHARS) {
        return { classification: null, error: `text exceeds the ${CLASSIFY_TEXT_MAX_CHARS}-character limit; send a headline-sized excerpt` };
      }
      const url = `${base}/api/intelligence/v1/classify-event?title=${encodeURIComponent(text)}`;
      const auth = await buildAuthHeaders(context, "GET", url, null);
      const res = await fetch(url, {
        headers: { ...auth, "User-Agent": NLP_UA },
        // Matches the classify-event handler's own UPSTREAM_TIMEOUT_MS (25s)
        // and the sibling LLM tools below. A shorter client budget would abort
        // slow-but-successful cache-miss classifications the handler completes.
        signal: AbortSignal.timeout(25e3)
      });
      assertToolFetchOk(res, "classify-event");
      const result = await res.json();
      const c = result.classification;
      if (!c || !CLASSIFY_CATEGORIES.includes(c.category ?? "") || !CLASSIFY_LEVELS.includes(c.subcategory ?? "") || !CLASSIFY_SEVERITIES.includes(c.severity ?? "") || typeof c.confidence !== "number" || !Number.isFinite(c.confidence)) {
        return { classification: null };
      }
      return {
        classification: {
          category: c.category,
          // The REST payload carries the fine-grained level in `subcategory`.
          level: c.subcategory,
          severity: c.severity,
          confidence: c.confidence
        }
      };
    },
    _apiPaths: [
      "GET /api/intelligence/v1/classify-event"
    ]
  },
  {
    name: "extract_entities",
    _outputBudgetBytes: 16384,
    description: "Extract named entities deterministically \u2014 registry entities (companies, indices, commodities, crypto, sectors, countries) plus pattern entities (CVE IDs, APT/FIN threat-group designators, tracked world leaders). Supply text (max 2 KB), or omit text to aggregate headlines from the full digest (default) or tech digest with variant/category filters. No LLM involved.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", maxLength: EXTRACT_TEXT_MAX_CHARS, description: "Optional text to extract from (max 2048 characters; longer input is rejected). When omitted, the tool aggregates entities across recent headlines." },
        variant: {
          type: "string",
          enum: [...NLP_DIGEST_VARIANTS],
          description: "Headline digest variant used when text is omitted. Defaults to full; use tech for Tech dashboard categories."
        },
        category: {
          type: "string",
          enum: [...ALL_DIGEST_CATEGORIES],
          description: "When text is omitted, " + DIGEST_CATEGORY_DESC
        },
        limit: { type: "integer", minimum: 1, maximum: 50, description: "Maximum entities per list. Defaults to 20." }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      required: ["mode", "entities", "patternEntities"],
      properties: {
        mode: { type: "string", description: '"text" when input text was supplied, "headlines" when aggregating the digest.' },
        entities: {
          type: "array",
          description: "Registry-matched entities. In text mode each match carries matchType/matchedText/confidence; in headlines mode entities aggregate to mentionCount/avgConfidence.",
          items: { type: "object", properties: {
            entityId: { type: "string" },
            name: { type: "string" },
            type: { type: "string" },
            matchType: { type: "string" },
            matchedText: { type: "string" },
            confidence: { type: "number" },
            mentionCount: { type: "number" },
            avgConfidence: { type: "number" }
          } }
        },
        patternEntities: {
          type: "array",
          items: { type: "object", properties: {
            value: { type: "string" },
            kind: { type: "string", description: "cve, apt, fin, or leader." },
            mentionCount: { type: "number" }
          } }
        },
        headlineCount: { type: "number", description: "Headlines scanned (headlines mode only)." },
        generatedAt: { type: "string", description: "Digest snapshot time (headlines mode only)." },
        variant: { type: "string", enum: [...NLP_DIGEST_VARIANTS], description: "Applied digest variant in headlines mode. Omitted in text mode." },
        category: { type: ["string", "null"], description: "Applied digest category filter in headlines mode; null when scanning every category. Omitted in text mode." },
        note: { type: "string", description: "Present in headlines mode when category did not match any digest key (typo or missing bucket)." },
        error: { type: "string", description: "Present instead of a result when input validation fails." }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params, base, context) => {
      const invalid = (error) => ({ mode: "text", entities: [], patternEntities: [], error });
      if (params.text !== void 0 && typeof params.text !== "string") {
        return invalid("text must be a string when provided");
      }
      const text = typeof params.text === "string" ? params.text.trim() : "";
      if (text.length > EXTRACT_TEXT_MAX_CHARS) {
        return invalid(`text exceeds the ${EXTRACT_TEXT_MAX_CHARS}-character limit`);
      }
      const limit = nlpClampInt(params.limit, 1, 50, 20);
      if (text) {
        return {
          mode: "text",
          entities: extractEntitiesFromTitle(text).slice(0, limit).map((entity) => ({
            entityId: entity.entityId,
            name: entity.name,
            type: getEntityById(entity.entityId)?.type ?? "company",
            matchType: entity.matchType,
            matchedText: entity.matchedText,
            confidence: entity.confidence
          })),
          patternEntities: [...new Set(extractEntities(text))].slice(0, limit).map((value) => ({ value, kind: patternEntityKind(value) }))
        };
      }
      const variant = resolveNlpDigestVariant(params.variant);
      if (!variant) {
        return {
          mode: "headlines",
          entities: [],
          patternEntities: [],
          headlineCount: 0,
          generatedAt: "",
          category: argStr(params.category) || null,
          error: `variant must be one of: ${NLP_DIGEST_VARIANTS.join(", ")}`
        };
      }
      const category = argStr(params.category);
      const digest = await fetchNlpDigestItems(base, context, variant, category);
      const aggregated = nlpRegistryEntities(digest.items.map((item) => item.title), limit);
      return {
        mode: "headlines",
        headlineCount: digest.items.length,
        generatedAt: digest.generatedAt,
        variant: digest.variant,
        category: digest.category,
        ...digest.note ? { note: digest.note } : {},
        ...aggregated
      };
    },
    _apiPaths: [
      "GET /api/news/v1/list-feed-digest"
    ]
  },
  {
    name: "get_news_clusters",
    // At limit=25, each cluster can carry eight fail-closed provenance
    // records plus a separate primary record. Keep the dispatcher budget
    // aligned with that supported maximum instead of rejecting valid output.
    _outputBudgetBytes: 262144,
    description: "Current topic clusters over the live headline digest, computed with the same Jaccard clustering the dashboard uses. Select the full digest (default) or tech digest with variant, then optionally restrict by category such as commodities, vcblogs, or accelerators. Each cluster reports its primary headline, member count, distinct sources with fail-closed provenance, top keywords, threat level, and time span. Deterministic \u2014 no LLM.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 25, description: "Maximum clusters returned. Defaults to 10." },
        min_sources: { type: "integer", minimum: 1, maximum: 10, description: "Only return clusters carrying at least this many DISTINCT sources (outlets), not merely this many member headlines. Defaults to 1." },
        variant: {
          type: "string",
          enum: [...NLP_DIGEST_VARIANTS],
          description: "Headline digest variant. Defaults to full; use tech for Tech dashboard categories."
        },
        category: {
          type: "string",
          enum: [...ALL_DIGEST_CATEGORIES],
          description: DIGEST_CATEGORY_DESC
        }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      required: ["clusters", "totalClusters", "headlineCount", "generatedAt", "category"],
      properties: {
        clusters: {
          type: "array",
          items: {
            type: "object",
            required: ["primarySourceProvenance", "sourceProvenance"],
            properties: {
              id: { type: "string" },
              title: { type: "string", description: "Primary headline. Server-side primary selection is recency-based: digest items carry no per-source tier." },
              primarySource: { type: "string" },
              link: { type: "string" },
              primarySourceProvenance: {
                type: "object",
                required: SOURCE_PROVENANCE_REQUIRED,
                properties: SOURCE_PROVENANCE_PROPERTIES
              },
              memberCount: { type: "number", description: "Headlines in this cluster (one outlet can contribute several)." },
              distinctSourceCount: { type: "number", description: "Distinct outlets covering the cluster \u2014 the corroboration signal min_sources filters on." },
              sources: { type: "array", items: { type: "string" }, description: "Distinct source names (up to 8)." },
              sourceProvenance: {
                type: "array",
                description: "Fail-closed provenance for each source returned in `sources`, including state affiliation when declared.",
                items: {
                  type: "object",
                  required: ["source", ...SOURCE_PROVENANCE_REQUIRED],
                  properties: {
                    source: { type: "string" },
                    ...SOURCE_PROVENANCE_PROPERTIES
                  }
                }
              },
              topKeywords: { type: "array", items: { type: "string" } },
              isAlert: { type: "boolean" },
              threatLevel: { type: "string" },
              threatCategory: { type: "string" },
              firstSeen: { type: "string" },
              lastUpdated: { type: "string" }
            }
          }
        },
        totalClusters: { type: "number", description: "Cluster count before limit/min_sources filtering." },
        headlineCount: { type: "number" },
        generatedAt: { type: "string" },
        variant: { type: "string", enum: [...NLP_DIGEST_VARIANTS], description: "Applied digest variant." },
        category: { type: ["string", "null"], description: "Applied digest category filter; null when clustering every category." },
        note: { type: "string", description: "Present when category did not match any digest key (typo or missing bucket)." },
        error: { type: "string", description: "Present when variant validation fails." }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params, base, context) => {
      const limit = nlpClampInt(params.limit, 1, 25, 10);
      const minSources = nlpClampInt(params.min_sources, 1, 10, 1);
      const variant = resolveNlpDigestVariant(params.variant);
      if (!variant) {
        return {
          clusters: [],
          totalClusters: 0,
          headlineCount: 0,
          generatedAt: "",
          category: argStr(params.category) || null,
          error: `variant must be one of: ${NLP_DIGEST_VARIANTS.join(", ")}`
        };
      }
      const category = argStr(params.category);
      const digest = await fetchNlpDigestItems(base, context, variant, category);
      const clusters = clusterNewsCore(digest.items, () => 3);
      const selectedClusters = clusters.map((cluster) => ({
        cluster,
        sources: [...new Set(cluster.allItems.map((item) => item.source))],
        // #6428: `sources` is the feed-LABEL list — kept for attribution, but
        // it is not the corroboration number. One newsroom ships many labels
        // ("Reuters World" + "Reuters US"), so counting them let one wire
        // satisfy the `min_sources` filter this tool documents as "distinct
        // outlets ... real corroboration, not one outlet filing twice".
        // clusterNewsCore already resolved the publisher families.
        distinctPublishers: cluster.uniquePublisherCount
      })).filter(({ distinctPublishers }) => distinctPublishers >= minSources).slice(0, limit);
      const projected = selectedClusters.map(({ cluster, sources, distinctPublishers }) => {
        const projectedSources = sources.slice(0, 8);
        const provenanceBySource = new Map(
          [.../* @__PURE__ */ new Set([cluster.primarySource, ...projectedSources])].map((source) => [source, getSourceProvenanceState(source)])
        );
        return {
          id: cluster.id,
          title: cluster.primaryTitle,
          primarySource: cluster.primarySource,
          primarySourceProvenance: provenanceBySource.get(cluster.primarySource),
          link: cluster.primaryLink,
          memberCount: cluster.sourceCount,
          // Corroboration is distinct PUBLISHERS, not headline count and not
          // feed-label count — one outlet can file several near-identical
          // headlines into the same cluster, and can file them under several
          // of its own feeds (#6428).
          distinctSourceCount: distinctPublishers,
          sources: projectedSources,
          sourceProvenance: projectedSources.map((source) => ({
            source,
            ...provenanceBySource.get(source)
          })),
          topKeywords: topClusterKeywords(cluster, 5),
          isAlert: cluster.isAlert,
          threatLevel: cluster.threat?.level ?? "info",
          threatCategory: cluster.threat?.category ?? "general",
          firstSeen: cluster.firstSeen.toISOString(),
          lastUpdated: cluster.lastUpdated.toISOString()
        };
      });
      return {
        clusters: projected,
        totalClusters: clusters.length,
        headlineCount: digest.items.length,
        generatedAt: digest.generatedAt,
        variant: digest.variant,
        category: digest.category,
        ...digest.note ? { note: digest.note } : {}
      };
    },
    _apiPaths: [
      "GET /api/news/v1/list-feed-digest"
    ]
  },
  {
    name: "get_keyword_spikes",
    _outputBudgetBytes: 16384,
    description: "Trending keyword, CVE, and APT/FIN threat-group spikes versus baseline, using the same term-candidacy and spike-decision math as the dashboard. Baseline derives from the 48-hour story accumulator (per-window story rate), not the dashboard's incremental 7-day client history. Results are cached for 10 minutes. Deterministic \u2014 no LLM.",
    inputSchema: {
      type: "object",
      properties: {
        window_hours: { type: "integer", minimum: 1, maximum: 12, description: "Recent window to test for spikes. Defaults to 2." },
        min_count: { type: "integer", minimum: 2, maximum: 20, description: "Minimum recent-window story count for a term to spike. Defaults to 5." },
        limit: { type: "integer", minimum: 1, maximum: 25, description: "Maximum spikes returned. Defaults to 10." }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      required: ["spikes", "window_hours", "baseline_hours", "story_count", "sample_truncated", "generatedAt"],
      properties: {
        spikes: {
          type: "array",
          items: { type: "object", required: [
            "term",
            "count",
            "baseline",
            "multiplier",
            "uniqueSources",
            "sampleHeadlines"
          ], properties: {
            term: { type: "string" },
            count: { type: "number", description: "Distinct stories mentioning the term inside the recent window." },
            baseline: { type: "number", description: "Per-window story rate over the exact sampled pre-window duration (see baseline_hours). 0 means this term was absent from the available baseline cohort." },
            multiplier: { type: "number", description: "count / baseline; 0 when the term has no baseline mentions." },
            uniqueSources: { type: "number" },
            sampleHeadlines: { type: "array", items: { type: "string" } }
          } }
        },
        window_hours: { type: "number" },
        baseline_hours: { type: "number", description: "Exact hours in the sampled pre-window baseline cohort. 0 means no baseline was available and spikes is empty." },
        story_count: { type: "number", description: "Stories this computation saw across the separately bounded recent and baseline cohorts." },
        sample_truncated: { type: "boolean", description: "True when either bounded cohort hit its 800-story cap." },
        generatedAt: { type: "string" },
        note: { type: "string", description: "Present when the accumulator was unavailable/empty or the story store was only partially readable." }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      const windowHours = nlpClampInt(params.window_hours, 1, 12, 2);
      const minCount = nlpClampInt(params.min_count, 2, 20, DEFAULT_MIN_SPIKE_COUNT);
      const limit = nlpClampInt(params.limit, 1, 25, 10);
      const cacheKey = `intelligence:keyword-spikes:mcp:v2:${windowHours}h:${minCount}`;
      let cached = null;
      try {
        cached = await readJsonFromUpstash(cacheKey);
      } catch {
        cached = null;
      }
      if (cached && Array.isArray(cached.spikes)) {
        return { ...cached, spikes: cached.spikes.slice(0, limit) };
      }
      const nowMs = Date.now();
      const windowMs = windowHours * 60 * 60 * 1e3;
      const windowStart = nowMs - windowMs;
      const emptyResult = {
        spikes: [],
        window_hours: windowHours,
        baseline_hours: 0,
        story_count: 0,
        sample_truncated: false,
        generatedAt: new Date(nowMs).toISOString()
      };
      const zres = await redisPipeline([
        [
          "ZRANGE",
          DIGEST_ACCUMULATOR_KEY_MCP,
          String(nowMs),
          String(windowStart),
          "BYSCORE",
          "REV",
          "WITHSCORES",
          "LIMIT",
          "0",
          String(KEYWORD_SPIKE_MAX_STORIES)
        ],
        [
          "ZRANGE",
          DIGEST_ACCUMULATOR_KEY_MCP,
          String(windowStart - 1),
          String(nowMs - KEYWORD_SPIKE_BASELINE_MS),
          "BYSCORE",
          "REV",
          "WITHSCORES",
          "LIMIT",
          "0",
          String(KEYWORD_SPIKE_MAX_STORIES)
        ]
      ]);
      const recentFlat = zres?.[0]?.result;
      const baselineFlat = zres?.[1]?.result;
      if (!Array.isArray(recentFlat) || !Array.isArray(baselineFlat)) {
        return { ...emptyResult, note: "story accumulator unavailable or empty" };
      }
      if (recentFlat.length === 0 && baselineFlat.length === 0) {
        return { ...emptyResult, note: "story accumulator unavailable or empty" };
      }
      const parseEntries = (flat) => {
        const entries2 = [];
        let malformed = flat.length % 2 !== 0;
        for (let i = 0; i + 1 < flat.length; i += 2) {
          const rawHash = flat[i];
          const hash = typeof rawHash === "string" ? rawHash : "";
          const lastSeenMs = Number(flat[i + 1]);
          if (hash && Number.isFinite(lastSeenMs)) entries2.push({ hash, lastSeenMs });
          else malformed = true;
        }
        return { entries: entries2, malformed };
      };
      const recentParsed = parseEntries(recentFlat);
      const baselineParsed = parseEntries(baselineFlat);
      if (recentParsed.malformed || baselineParsed.malformed) {
        return { ...emptyResult, note: "story accumulator returned an unreadable payload" };
      }
      const recentEntries = recentParsed.entries;
      const baselineEntries = baselineParsed.entries;
      const sampleTruncated = recentEntries.length >= KEYWORD_SPIKE_MAX_STORIES || baselineEntries.length >= KEYWORD_SPIKE_MAX_STORIES;
      if (baselineEntries.length === 0) {
        return {
          ...emptyResult,
          story_count: recentEntries.length,
          sample_truncated: sampleTruncated,
          note: "baseline unavailable: no pre-window stories were present; spikes were not computed or cached"
        };
      }
      const oldestBaselineMs = baselineEntries[baselineEntries.length - 1].lastSeenMs;
      const baselineDurationMs = Math.min(
        KEYWORD_SPIKE_BASELINE_MS - windowMs,
        windowStart - oldestBaselineMs
      );
      const entries = [...recentEntries, ...baselineEntries];
      let degraded = false;
      const chunkInto = (items, size) => {
        const chunks = [];
        for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
        return chunks;
      };
      const titles = /* @__PURE__ */ new Map();
      const HMGET_CHUNK = 200;
      const hmgetChunks = chunkInto(entries, HMGET_CHUNK);
      const hmgetResults = await Promise.all(hmgetChunks.map((chunk) => redisPipeline(
        chunk.map((entry) => ["HMGET", `story:track:v1:${entry.hash}`, "title"])
      )));
      hmgetChunks.forEach((chunk, chunkIdx) => {
        const res = hmgetResults[chunkIdx];
        if (!Array.isArray(res) || res.length !== chunk.length) degraded = true;
        chunk.forEach((entry, idx) => {
          const reply = res?.[idx];
          const fields = reply?.result;
          if (!reply || Object.prototype.hasOwnProperty.call(reply, "error") || !Array.isArray(fields) || fields.length !== 1) {
            degraded = true;
            return;
          }
          const title = fields[0];
          if (typeof title !== "string" || !title) {
            degraded = true;
            return;
          }
          titles.set(entry.hash, title);
        });
      });
      const recentHashes = entries.filter((entry) => entry.lastSeenMs >= windowStart && titles.has(entry.hash)).map((entry) => entry.hash);
      const sourcesByHash = /* @__PURE__ */ new Map();
      const SMEMBERS_CHUNK = 200;
      const smembersChunks = chunkInto(recentHashes, SMEMBERS_CHUNK);
      const smembersResults = await Promise.all(smembersChunks.map((chunk) => redisPipeline(
        chunk.map((hash) => ["SMEMBERS", `story:sources:v1:${hash}`])
      )));
      smembersChunks.forEach((chunk, chunkIdx) => {
        const res = smembersResults[chunkIdx];
        if (!Array.isArray(res) || res.length !== chunk.length) degraded = true;
        chunk.forEach((hash, idx) => {
          const reply = res?.[idx];
          const members = reply?.result;
          if (!reply || Object.prototype.hasOwnProperty.call(reply, "error") || !Array.isArray(members) || members.some((member) => typeof member !== "string")) {
            degraded = true;
            return;
          }
          sourcesByHash.set(hash, members);
        });
      });
      const stories = entries.filter((entry) => titles.has(entry.hash)).map((entry) => ({
        title: titles.get(entry.hash),
        lastSeenMs: entry.lastSeenMs,
        sources: sourcesByHash.get(entry.hash) ?? []
      }));
      const spikes = computeKeywordSpikesFromStories(stories, {
        nowMs,
        windowMs,
        baselineDurationMs,
        minSpikeCount: minCount,
        spikeMultiplier: DEFAULT_SPIKE_MULTIPLIER
      }).slice(0, KEYWORD_SPIKE_MAX_STORED).map((spike) => ({
        term: spike.term,
        count: spike.count,
        baseline: Math.round(spike.baseline * 100) / 100,
        multiplier: Math.round(spike.multiplier * 100) / 100,
        uniqueSources: spike.uniqueSources,
        sampleHeadlines: spike.sampleHeadlines
      }));
      const payload = {
        ...emptyResult,
        spikes,
        story_count: stories.length,
        baseline_hours: baselineDurationMs / 36e5,
        sample_truncated: sampleTruncated
      };
      if (degraded) {
        return {
          ...payload,
          spikes: payload.spikes.slice(0, limit),
          note: "partial story-store read; spikes may be incomplete and were not cached"
        };
      }
      await setCachedData(cacheKey, payload, KEYWORD_SPIKE_CACHE_TTL_S);
      return { ...payload, spikes: payload.spikes.slice(0, limit) };
    },
    // Redis-only computation: no HTTP endpoint is proxied (types.ts case (a)).
    _apiPaths: []
  }
];
export {
  NLP_TOOLS
};
