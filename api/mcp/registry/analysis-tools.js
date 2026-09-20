// api/_cii-risk-cache-keys.js
var CII_RISK_SCORE_CACHE_KEYS = Object.freeze({
  live: "risk:scores:sebuf:v8",
  stale: "risk:scores:sebuf:stale:v8",
  trendHistoryPrefix: "risk:scores:sebuf:trend-history:v8"
});

// shared/analysis-alert-digest.ts
var SEVERITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};
var str = (v) => typeof v === "string" ? v : "";
var num = (v) => typeof v === "number" && Number.isFinite(v) ? v : null;
function normalizeSeverity(v, fallback) {
  const s = str(v).toLowerCase();
  if (s === "low" || s === "medium" || s === "high" || s === "critical") return s;
  if (s === "minor" || s === "info") return "low";
  if (s === "moderate") return "medium";
  if (s === "major" || s === "elevated") return "high";
  if (s === "severe") return "critical";
  return fallback;
}
function buildAlertDigest(inputs, now) {
  const tripped = [];
  const quiet = [];
  const unavailable = [];
  const evaluate = (domain, input, collect) => {
    if (!Array.isArray(input)) {
      unavailable.push(domain);
      return;
    }
    const before = tripped.length;
    collect(input);
    if (tripped.length === before) quiet.push(domain);
  };
  evaluate("cii", inputs.cii, (entries) => {
    for (const e of entries) {
      const level = str(e.level).toLowerCase();
      if (level !== "high" && level !== "critical") continue;
      const code = str(e.code) || "unknown";
      tripped.push({
        domain: "cii",
        id: code,
        label: `Country instability ${level}: ${code}`,
        severity: level,
        metric: "cii_score",
        value: num(e.score)
      });
    }
  });
  evaluate("military_surge", inputs.militarySurges, (entries) => {
    for (const e of entries) {
      const theater = str(e.theaterId) || "unknown-theater";
      const type = str(e.surgeType) || "activity";
      tripped.push({
        domain: "military_surge",
        id: `${type}-${theater}`,
        label: `${type} surge in ${theater}`,
        severity: e.strikeCapable === true ? "critical" : "high",
        metric: "surge_multiple",
        value: num(e.surgeMultiple)
      });
    }
  });
  evaluate("cable_health", inputs.cables, (entries) => {
    for (const e of entries) {
      const status = str(e.status);
      if (status !== "CABLE_HEALTH_STATUS_FAULT" && status !== "CABLE_HEALTH_STATUS_DEGRADED") continue;
      const name = str(e.name) || "unknown-cable";
      const fault = status === "CABLE_HEALTH_STATUS_FAULT";
      tripped.push({
        domain: "cable_health",
        id: name,
        label: `Cable ${fault ? "fault" : "degraded"}: ${name}`,
        severity: fault ? "high" : "medium",
        metric: "cable_status",
        value: status
      });
    }
  });
  evaluate("outages", inputs.outages, (entries) => {
    for (const e of entries) {
      const endedAt = num(e.endedAt);
      if (endedAt !== null && endedAt > 0 && endedAt <= now) continue;
      const country = str(e.country) || "unknown";
      tripped.push({
        domain: "outages",
        id: country,
        label: `Internet outage: ${country}`,
        severity: normalizeSeverity(e.severity, "medium"),
        metric: "outage",
        value: str(e.severity) || null
      });
    }
  });
  evaluate("temporal_anomaly", inputs.temporalAnomalies, (entries) => {
    for (const e of entries) {
      const type = str(e.type) || "unknown";
      const region = str(e.region) || "global";
      tripped.push({
        domain: "temporal_anomaly",
        id: `${type}:${region}`,
        label: `${type} anomaly in ${region}`,
        severity: normalizeSeverity(e.severity, "medium"),
        metric: "z_score",
        value: num(e.zScore)
      });
    }
  });
  evaluate("thermal", inputs.thermal, (entries) => {
    for (const e of entries) {
      const level = str(e.level).toLowerCase();
      if (level !== "high" && level !== "critical") continue;
      const id = str(e.id) || "unknown-zone";
      tripped.push({
        domain: "thermal",
        id,
        label: `Thermal escalation ${level}: ${id}`,
        severity: level,
        metric: "thermal_score",
        value: num(e.score)
      });
    }
  });
  {
    const stress = inputs.shippingStress;
    if (!stress || typeof stress !== "object") {
      unavailable.push("shipping_stress");
    } else {
      const level = normalizeSeverity(stress.level, "low");
      if (str(stress.level) !== "" && level === "high" || level === "critical") {
        tripped.push({
          domain: "shipping_stress",
          id: "global",
          label: `Shipping stress ${level}`,
          severity: level,
          metric: "stress_index",
          value: num(stress.index)
        });
      } else {
        quiet.push("shipping_stress");
      }
    }
  }
  tripped.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  return {
    generatedAt: new Date(now).toISOString(),
    tripped,
    quiet,
    unavailable
  };
}
function buildWeeklyTrends(series, _now) {
  const trends = [];
  for (const s of series) {
    const values = (s.points ?? []).filter((p) => typeof p?.value === "number" && Number.isFinite(p.value)).sort((a, b) => a.t - b.t).map((p) => p.value);
    if (values.length < 3) continue;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    const stddev = Math.sqrt(variance);
    const half = Math.floor(values.length / 2);
    const earlyValues = values.slice(0, half);
    const lateValues = values.slice(half);
    const earlyMean = earlyValues.reduce((a, b) => a + b, 0) / earlyValues.length;
    const lateMean = lateValues.reduce((a, b) => a + b, 0) / lateValues.length;
    const band = Math.abs(mean) * 0.1;
    let direction = "flat";
    if (lateMean - earlyMean > band) direction = "rising";
    else if (earlyMean - lateMean > band) direction = "falling";
    const earlyVariance = earlyValues.reduce((a, b) => a + (b - earlyMean) ** 2, 0) / earlyValues.length;
    const earlyStddev = Math.sqrt(earlyVariance);
    const latest = values[values.length - 1] ?? 0;
    trends.push({
      domain: s.domain,
      latest,
      baselineMean: mean,
      direction,
      volatility: mean === 0 ? 0 : stddev / Math.abs(mean),
      anomalous: latest > earlyMean + 2 * earlyStddev,
      points: values.length
    });
  }
  return trends;
}

// shared/analysis-adapter-guards.ts
function asRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}
function asArray(value) {
  return Array.isArray(value) ? value : [];
}
function finiteNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : "";
}
function usableCoord(lat, lon) {
  return lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && !(lat === 0 && lon === 0);
}
function nestedLocation(record) {
  const location = asRecord(record.location);
  return {
    lat: finiteNumber(location?.latitude),
    lon: finiteNumber(location?.longitude)
  };
}

// shared/analysis-composite-adapters.ts
var OUTAGE_SEVERITY_LEVELS = {
  OUTAGE_SEVERITY_TOTAL: "critical",
  OUTAGE_SEVERITY_MAJOR: "high",
  OUTAGE_SEVERITY_PARTIAL: "medium"
};
var THERMAL_STATUS_LEVELS = {
  THERMAL_STATUS_PERSISTENT: "critical",
  THERMAL_STATUS_SPIKE: "high",
  THERMAL_STATUS_ELEVATED: "medium",
  THERMAL_STATUS_NORMAL: "low"
};
function coords(entry) {
  const location = entry?.location;
  const lat = finiteNumber(location?.latitude);
  const lon = finiteNumber(location?.longitude);
  if (lat === null || lon === null) return null;
  return { lat, lon };
}
function earthquakesToExposureEvents(payload, limit = 50) {
  const quakes = payload?.earthquakes;
  if (!Array.isArray(quakes)) return [];
  const events = [];
  for (const q of quakes) {
    const c = coords(q);
    if (!c) continue;
    const record = q;
    const magnitude = finiteNumber(record.magnitude);
    events.push({
      id: nonEmptyString(record.id) || `quake-${events.length}`,
      name: nonEmptyString(record.place) || `M${magnitude ?? "?"} earthquake`,
      type: "earthquake",
      ...c
    });
    if (events.length >= limit) break;
  }
  return events;
}
function firesToExposureEvents(payload, limit = 50) {
  const fires = payload?.fireDetections;
  if (!Array.isArray(fires)) return [];
  const ranked = fires.map((f) => ({ f, c: coords(f) })).filter((x) => x.c !== null).sort((a, b) => (finiteNumber(b.f.frp) ?? 0) - (finiteNumber(a.f.frp) ?? 0)).slice(0, limit);
  return ranked.map(({ f, c }, i) => ({
    id: nonEmptyString(f.id) || `fire-${i}`,
    name: `Fire detection${nonEmptyString(f.region) ? ` \u2014 ${nonEmptyString(f.region)}` : ""}`,
    type: "wildfire",
    ...c
  }));
}
function ucdpEventsToExposureEvents(payload, limit = 50) {
  const raw = payload?.events;
  if (!Array.isArray(raw)) return [];
  const dated = raw.map((e) => ({ e, c: coords(e) })).filter((x) => x.c !== null).sort((a, b) => Date.parse(nonEmptyString(b.e.dateStart)) - Date.parse(nonEmptyString(a.e.dateStart))).slice(0, limit);
  return dated.map(({ e, c }, i) => ({
    id: e.id != null ? String(e.id) : `conflict-${i}`,
    name: `Conflict event${nonEmptyString(e.country) ? ` \u2014 ${nonEmptyString(e.country)}` : ""}`,
    type: "conflict",
    ...c
  }));
}
function riskScoresToCiiInput(payload) {
  const scores = payload?.ciiScores;
  if (!Array.isArray(scores)) return [];
  const entries = [];
  for (const s of scores) {
    const record = s;
    const score = finiteNumber(record.combinedScore);
    const code = nonEmptyString(record.region);
    if (!code || score === null) continue;
    const level = score >= 70 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";
    entries.push({ code, score, level });
  }
  return entries;
}
function surgesToDigestInput(payload) {
  const list = Array.isArray(payload) ? payload : payload?.surges;
  if (!Array.isArray(list)) return [];
  return list.map((s) => {
    const record = s;
    return {
      theaterId: record.theaterId,
      surgeType: record.surgeType,
      surgeMultiple: record.surgeMultiple,
      strikeCapable: record.strikeCapable
    };
  });
}
function cableHealthToDigestInput(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  const wrapped = payload.cables;
  const map = wrapped && typeof wrapped === "object" && !Array.isArray(wrapped) ? wrapped : payload;
  return Object.entries(map).filter(([, v]) => v && typeof v === "object" && "status" in v).map(([name, v]) => ({ name, status: v.status }));
}
function outagesToDigestInput(payload) {
  const outages = payload?.outages;
  if (!Array.isArray(outages)) return [];
  return outages.map((o) => {
    const record = o;
    const rawSeverity = nonEmptyString(record.severity).toUpperCase();
    const severity = OUTAGE_SEVERITY_LEVELS[rawSeverity] ?? record.severity;
    return {
      country: record.country,
      severity,
      detectedAt: record.detectedAt,
      endedAt: record.endedAt
    };
  });
}
function anomaliesToDigestInput(payload) {
  const anomalies = payload?.anomalies;
  if (!Array.isArray(anomalies)) return [];
  return anomalies.map((a) => {
    const record = a;
    return {
      type: record.type,
      region: record.region,
      zScore: record.zScore,
      severity: record.severity
    };
  });
}
function thermalToDigestInput(payload) {
  const clusters = payload?.clusters;
  if (!Array.isArray(clusters)) return [];
  return clusters.map((c, i) => {
    const record = c;
    const status = nonEmptyString(record.status);
    const score = finiteNumber(record.zScore) ?? finiteNumber(record.anomalyScore);
    const level = THERMAL_STATUS_LEVELS[status] ?? (status.toLowerCase() === "spike" || (score ?? 0) > 2 ? "high" : "low");
    return {
      id: nonEmptyString(record.id) || nonEmptyString(record.name) || nonEmptyString(record.region) || `cluster-${i}`,
      level,
      score
    };
  });
}
function stressToDigestInput(payload) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload;
  return { index: finiteNumber(record.stressScore), level: record.stressLevel };
}
function buildDigestInputs(raw) {
  return {
    cii: raw.riskScores == null ? null : riskScoresToCiiInput(raw.riskScores),
    militarySurges: raw.surges == null ? null : surgesToDigestInput(raw.surges),
    cables: raw.cableHealth == null ? null : cableHealthToDigestInput(raw.cableHealth),
    outages: raw.outages == null ? null : outagesToDigestInput(raw.outages),
    temporalAnomalies: raw.temporal == null ? null : anomaliesToDigestInput(raw.temporal),
    thermal: raw.thermal == null ? null : thermalToDigestInput(raw.thermal),
    shippingStress: raw.stress == null ? null : stressToDigestInput(raw.stress)
  };
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

// shared/text-analysis-core.js
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
function resolveEntitiesById(index, ids) {
  if (!ids) return [];
  return Array.from(ids).map((id) => index.byId.get(id)).filter((entity) => entity !== void 0);
}
function findRelatedEntities(entityId, index = getEntityIndex()) {
  const entity = index.byId.get(entityId);
  return resolveEntitiesById(index, entity?.related);
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
function extractEntityContext(cluster, index = getEntityIndex()) {
  const primaryEntities = extractEntitiesFromTitle(cluster.primaryTitle, index);
  const entityMap = /* @__PURE__ */ new Map();
  for (const entity of primaryEntities) {
    if (!entityMap.has(entity.entityId)) {
      entityMap.set(entity.entityId, entity);
    }
  }
  if (cluster.allItems && cluster.allItems.length > 1) {
    for (const item of cluster.allItems.slice(0, 5)) {
      if (item.title === cluster.primaryTitle) continue;
      const itemEntities = extractEntitiesFromTitle(item.title, index);
      for (const entity of itemEntities) {
        if (!entityMap.has(entity.entityId)) {
          entityMap.set(entity.entityId, {
            ...entity,
            confidence: entity.confidence * 0.9
          });
        }
      }
    }
  }
  const entities = Array.from(entityMap.values()).sort((a, b) => b.confidence - a.confidence);
  const relatedEntityIds = /* @__PURE__ */ new Set();
  for (const entity of entities) {
    for (const related of findRelatedEntities(entity.entityId, index)) {
      relatedEntityIds.add(related.id);
    }
  }
  return {
    clusterId: cluster.id,
    title: cluster.primaryTitle,
    entities,
    primaryEntity: entities[0]?.entityId,
    relatedEntityIds: Array.from(relatedEntityIds)
  };
}
function extractEntityContexts(clusters, index = getEntityIndex()) {
  const contexts = /* @__PURE__ */ new Map();
  for (const cluster of clusters) {
    contexts.set(cluster.id, extractEntityContext(cluster, index));
  }
  return contexts;
}

// shared/analysis-focal-points.ts
var SIGNAL_TYPE_LABELS = {
  internet_outage: "internet outage",
  military_flight: "military flights",
  military_vessel: "naval vessels",
  protest: "protests",
  ais_disruption: "shipping disruption",
  satellite_fire: "satellite fires",
  radiation_anomaly: "radiation anomalies",
  temporal_anomaly: "anomaly detection",
  sanctions_pressure: "sanctions pressure",
  active_strike: "active strikes"
};
var SIGNAL_TYPE_ICONS = {
  internet_outage: "\u{1F310}",
  military_flight: "\u2708\uFE0F",
  military_vessel: "\u2693",
  protest: "\u{1F4E2}",
  ais_disruption: "\u{1F6A2}",
  satellite_fire: "\u{1F525}",
  radiation_anomaly: "\u2622\uFE0F",
  temporal_anomaly: "\u{1F4CA}",
  sanctions_pressure: "\u{1F6AB}",
  active_strike: "\u{1F4A5}"
};
function entityAppearsInTitle(entityId, title, index) {
  const entity = index.byId.get(entityId);
  if (!entity) return false;
  const titleLower = title.toLowerCase();
  if (titleLower.includes(entity.name.toLowerCase())) return true;
  for (const alias of entity.aliases) {
    if (titleLower.includes(alias.toLowerCase())) return true;
  }
  return false;
}
function aggregateEntities(entityContexts, clusters, index) {
  const mentions = /* @__PURE__ */ new Map();
  const clustersById = /* @__PURE__ */ new Map();
  for (const cluster of clusters) {
    if (!clustersById.has(cluster.id)) clustersById.set(cluster.id, cluster);
  }
  for (const [clusterId, context] of entityContexts) {
    const cluster = clustersById.get(clusterId);
    if (!cluster) continue;
    for (const entity of context.entities) {
      const entityEntry = index.byId.get(entity.entityId);
      if (!entityEntry) continue;
      const titleHasEntity = entityAppearsInTitle(entity.entityId, cluster.primaryTitle, index);
      const existing = mentions.get(entity.entityId);
      if (existing) {
        existing.mentionCount++;
        existing.avgConfidence = (existing.avgConfidence * (existing.mentionCount - 1) + entity.confidence) / existing.mentionCount;
        existing.clusterIds.push(clusterId);
        if (existing.topHeadlines.length < 3 && titleHasEntity) {
          existing.topHeadlines.push({ title: cluster.primaryTitle, url: cluster.primaryLink });
        }
      } else {
        mentions.set(entity.entityId, {
          entityId: entity.entityId,
          entityType: entityEntry.type,
          displayName: entityEntry.name,
          mentionCount: 1,
          avgConfidence: entity.confidence,
          clusterIds: [clusterId],
          // Only include headline if entity appears in title
          topHeadlines: titleHasEntity ? [{ title: cluster.primaryTitle, url: cluster.primaryLink }] : []
        });
      }
    }
  }
  return mentions;
}
function buildFocalPoints(entityMentions, signalSummary, index) {
  const focalPoints = [];
  const countrySignals = /* @__PURE__ */ new Map();
  for (const cluster of signalSummary.topCountries) {
    countrySignals.set(cluster.country, cluster);
  }
  for (const [entityId, mention] of entityMentions) {
    const entityEntry = index.byId.get(entityId);
    if (!entityEntry) continue;
    let signals;
    let signalCountry;
    if (entityEntry.type === "country") {
      signals = countrySignals.get(entityId);
      signalCountry = entityId;
    } else if (entityEntry.related) {
      for (const relatedId of entityEntry.related) {
        const relatedEntity = index.byId.get(relatedId);
        if (relatedEntity?.type === "country") {
          signals = countrySignals.get(relatedId);
          if (signals) {
            signalCountry = relatedId;
            break;
          }
        }
      }
    }
    const focalPoint = createFocalPoint(mention, signals, signalCountry);
    focalPoints.push(focalPoint);
  }
  for (const [countryCode, signals] of countrySignals) {
    if (!entityMentions.has(countryCode)) {
      const countryEntity = index.byId.get(countryCode);
      if (countryEntity) {
        const mention = {
          entityId: countryCode,
          entityType: "country",
          displayName: countryEntity.name,
          mentionCount: 0,
          avgConfidence: 0,
          clusterIds: [],
          topHeadlines: []
        };
        const focalPoint = createFocalPoint(mention, signals, countryCode);
        if (focalPoint.focalScore > 20) {
          focalPoints.push(focalPoint);
        }
      }
    }
  }
  return focalPoints.sort((a, b) => b.focalScore - a.focalScore);
}
function createFocalPoint(mention, signals, _signalCountry) {
  const newsScore = calculateNewsScore(mention);
  const signalScore = signals ? calculateSignalScore(signals) : 0;
  const correlationBonus = calculateCorrelationBonus(mention, signals);
  const conflictScore = signals ? calculateConflictScore(signals) : 0;
  const rawScore = newsScore + signalScore + correlationBonus + conflictScore;
  const signalTypes = signals ? Array.from(signals.signalTypes) : [];
  const urgency = determineUrgency(rawScore, signalTypes.length);
  const urgencyMultiplier = urgency === "critical" ? 1.3 : urgency === "elevated" ? 1.15 : 1;
  const focalScore = Math.min(100, rawScore * urgencyMultiplier);
  const signalDescriptions = signals ? signalTypes.map((type) => {
    const count = signals.signals.filter((s) => s.type === type).length;
    return `${count} ${SIGNAL_TYPE_LABELS[type]}`;
  }) : [];
  const narrative = generateNarrative(mention, signals, signalTypes);
  const correlationEvidence = getCorrelationEvidence(mention, signals);
  return {
    id: `fp-${mention.entityId}`,
    entityId: mention.entityId,
    entityType: mention.entityType,
    displayName: mention.displayName,
    newsMentions: mention.mentionCount,
    newsVelocity: mention.mentionCount / 24,
    topHeadlines: mention.topHeadlines,
    signalTypes,
    signalCount: signals?.totalCount || 0,
    highSeverityCount: signals?.highSeverityCount || 0,
    signalDescriptions,
    focalScore,
    urgency,
    narrative,
    correlationEvidence
  };
}
function calculateNewsScore(mention) {
  const base = Math.min(20, mention.mentionCount * 4);
  const velocity = Math.min(10, mention.mentionCount / 24 * 2);
  const confidence = mention.avgConfidence * 10;
  return base + velocity + confidence;
}
function calculateSignalScore(signals) {
  const nonStrike = signals.signals.filter((s) => s.type !== "active_strike");
  const types = new Set(nonStrike.map((s) => s.type));
  const typeBonus = types.size * 10;
  const countBonus = Math.min(15, nonStrike.length * 3);
  const severityBonus = nonStrike.filter((s) => s.severity === "high").length * 5;
  return typeBonus + countBonus + severityBonus;
}
function calculateConflictScore(signals) {
  const strikeSignals = signals.signals.filter((s) => s.type === "active_strike");
  if (strikeSignals.length === 0) return 0;
  let totalCount = 0;
  let highSevCount = 0;
  for (const s of strikeSignals) {
    totalCount += s.strikeCount ?? 0;
    highSevCount += s.highSeverityStrikeCount ?? 0;
  }
  const base = Math.min(30, totalCount * 1.5);
  const severityBonus = Math.min(30, highSevCount * 3);
  return base + severityBonus;
}
function calculateCorrelationBonus(mention, signals) {
  let bonus = 0;
  if (mention.mentionCount > 0 && signals && signals.totalCount > 0) {
    bonus += 10;
  }
  if (signals && mention.topHeadlines.some((h) => {
    const lower = h.title.toLowerCase();
    return signals.signalTypes.has("military_flight") && /military|troops|forces|army|air force/.test(lower) || signals.signalTypes.has("military_vessel") && /navy|naval|ships|fleet|carrier/.test(lower) || signals.signalTypes.has("protest") && /protest|demonstrat|unrest|riot/.test(lower) || signals.signalTypes.has("internet_outage") && /internet|blackout|outage|connectivity/.test(lower) || signals.signalTypes.has("sanctions_pressure") && /sanction|designation|ofac|treasury|embargo|blacklist/.test(lower) || signals.signalTypes.has("radiation_anomaly") && /nuclear|radiation|reactor|contamination|radnet/.test(lower) || signals.signalTypes.has("active_strike") && /strike|attack|bomb|missile|target|hit/.test(lower);
  })) {
    bonus += 5;
  }
  return bonus;
}
function determineUrgency(score, signalTypeCount) {
  if (score > 70 || signalTypeCount >= 3) return "critical";
  if (score > 50 || signalTypeCount >= 2) return "elevated";
  return "watch";
}
function generateNarrative(mention, signals, signalTypes) {
  const parts = [];
  if (mention.mentionCount > 0) {
    parts.push(`${mention.mentionCount} news mentions`);
  }
  if (signals && signalTypes.length > 0) {
    const signalParts = signalTypes.map((type) => {
      const count = signals.signals.filter((s) => s.type === type).length;
      return `${count} ${SIGNAL_TYPE_LABELS[type]}`;
    });
    parts.push(signalParts.join(", "));
  }
  if (mention.topHeadlines.length > 0 && mention.topHeadlines[0]) {
    const headline = mention.topHeadlines[0].title.slice(0, 60);
    parts.push(`"${headline}..."`);
  }
  return parts.join(" | ");
}
function getCorrelationEvidence(mention, signals) {
  const evidence = [];
  if (mention.mentionCount > 0 && signals && signals.totalCount > 0) {
    evidence.push(`${mention.displayName} appears in both news (${mention.mentionCount}) and map signals (${signals.totalCount})`);
  }
  if (signals && signals.signalTypes.size >= 2) {
    const types = Array.from(signals.signalTypes).map((t) => SIGNAL_TYPE_LABELS[t]);
    evidence.push(`Multiple signal convergence: ${types.join(" + ")}`);
  }
  if (signals && signals.highSeverityCount > 0) {
    evidence.push(`${signals.highSeverityCount} high-severity signals detected`);
  }
  return evidence;
}
function generateAIContext(focalPoints) {
  if (focalPoints.length === 0) {
    return "";
  }
  const lines = ["[INTELLIGENCE SYNTHESIS]"];
  const critical = focalPoints.filter((fp) => fp.urgency === "critical").slice(0, 3);
  const elevated = focalPoints.filter((fp) => fp.urgency === "elevated").slice(0, 3);
  const correlatedFPs = focalPoints.filter((fp) => fp.newsMentions > 0 && fp.signalCount > 0).slice(0, 5);
  if (critical.length > 0) {
    lines.push("");
    lines.push("CRITICAL FOCAL POINTS:");
    for (const fp of critical) {
      const icons = fp.signalTypes.map((t) => SIGNAL_TYPE_ICONS[t]).join("");
      lines.push(`- ${fp.displayName} [CRITICAL] ${icons}: ${fp.narrative}`);
      if (fp.correlationEvidence.length > 0) {
        lines.push(`  \u2192 ${fp.correlationEvidence[0]}`);
      }
    }
  }
  if (elevated.length > 0) {
    lines.push("");
    lines.push("ELEVATED WATCH:");
    for (const fp of elevated) {
      lines.push(`- ${fp.displayName}: ${fp.newsMentions} news, ${fp.signalCount} signals`);
    }
  }
  if (correlatedFPs.length > 0) {
    lines.push("");
    lines.push("NEWS-SIGNAL CORRELATIONS:");
    for (const fp of correlatedFPs) {
      const signalDesc = fp.signalTypes.map((t) => SIGNAL_TYPE_LABELS[t]).join(", ");
      lines.push(`- ${fp.displayName}: news coverage + ${signalDesc} detected`);
    }
  }
  return lines.join("\n");
}
function generateAgentSafeAIContext(focalPoints) {
  if (focalPoints.length === 0) {
    return "";
  }
  const lines = ["[INTELLIGENCE SYNTHESIS]"];
  const critical = focalPoints.filter((fp) => fp.urgency === "critical").slice(0, 3);
  const elevated = focalPoints.filter((fp) => fp.urgency === "elevated").slice(0, 3);
  const correlatedFPs = focalPoints.filter((fp) => fp.newsMentions > 0 && fp.signalCount > 0).slice(0, 5);
  if (critical.length > 0) {
    lines.push("", "CRITICAL FOCAL POINTS:");
    for (const fp of critical) {
      const signalDesc = fp.signalTypes.map((t) => SIGNAL_TYPE_LABELS[t]).filter(Boolean).join(", ");
      const signalSuffix = signalDesc ? ` (${signalDesc})` : "";
      lines.push(
        `- ${fp.displayName} [CRITICAL]: ${fp.newsMentions} news mentions, ${fp.signalCount} map signals${signalSuffix}`
      );
    }
  }
  if (elevated.length > 0) {
    lines.push("", "ELEVATED WATCH:");
    for (const fp of elevated) {
      lines.push(`- ${fp.displayName}: ${fp.newsMentions} news, ${fp.signalCount} signals`);
    }
  }
  if (correlatedFPs.length > 0) {
    lines.push("", "NEWS-SIGNAL CORRELATIONS:");
    for (const fp of correlatedFPs) {
      const signalDesc = fp.signalTypes.map((t) => SIGNAL_TYPE_LABELS[t]).join(", ");
      lines.push(`- ${fp.displayName}: news coverage + ${signalDesc} detected`);
    }
  }
  return lines.join("\n");
}
var FocalPointCore = class {
  constructor(index) {
    this.index = index;
  }
  index;
  /**
   * Main analysis entry point - correlates news clusters with map signals.
   *
   * `entityContexts` is optional: server-side callers can omit it and let the
   * core run its own extraction, while the dashboard passes the contexts it
   * already computed via `src/services/entity-extraction.ts`.
   */
  analyze(clusters, signalSummary, entityContexts) {
    const contexts = entityContexts ?? extractEntityContexts(clusters, this.index);
    const entityMentions = aggregateEntities(contexts, clusters, this.index);
    const focalPoints = buildFocalPoints(entityMentions, signalSummary, this.index);
    const aiContext = generateAIContext(focalPoints);
    return {
      timestamp: /* @__PURE__ */ new Date(),
      focalPoints,
      aiContext,
      topCountries: focalPoints.filter((fp) => fp.entityType === "country").slice(0, 5),
      topCompanies: focalPoints.filter((fp) => fp.entityType === "company").slice(0, 3)
    };
  }
};

// shared/hotspot-country-map.ts
var HOTSPOT_COUNTRY_MAP = {
  tehran: "IR",
  moscow: "RU",
  beijing: "CN",
  kyiv: "UA",
  taipei: "TW",
  telaviv: "IL",
  pyongyang: "KP",
  sanaa: "YE",
  riyadh: "SA",
  ankara: "TR",
  damascus: "SY",
  caracas: "VE",
  dc: "US",
  london: "GB",
  brussels: "BE",
  baghdad: "IQ",
  beirut: "LB",
  doha: "QA",
  abudhabi: "AE",
  mexico: "MX",
  havana: "CU",
  nuuk: "GL",
  sahel: ["ML", "NE", "BF"],
  haiti: "HT",
  horn_africa: ["ET", "SO", "SD"],
  pak_afghan: ["PK", "AF"],
  silicon_valley: "US",
  wall_street: "US",
  houston: "US",
  cairo: "EG"
};
function getHotspotCountries(hotspotId) {
  const value = HOTSPOT_COUNTRY_MAP[hotspotId];
  if (!value) return [];
  return Array.isArray(value) ? [...value] : [value];
}
function getHotspotCountryScore(hotspotId, getScore) {
  const scores = getHotspotCountries(hotspotId).map(getScore).filter((score) => score !== null);
  return scores.length > 0 ? Math.max(...scores) : null;
}

// shared/geo-data.ts
var INTEL_HOTSPOTS = [
  {
    id: "sahel",
    name: "Sahel",
    subtext: "Insurgency/Coups",
    lat: 14,
    lon: -1,
    location: "Sahel Region (Mali, Burkina Faso, Niger)",
    keywords: ["burkina faso", "mali", "niger", "sahel", "junta", "coup", "wagner", "africa corps"],
    agencies: ["Wagner", "Junta Forces"],
    description: "Region of instability, military coups, and Islamist insurgency. Russian influence growing.",
    status: "Monitoring",
    escalationScore: 4,
    escalationTrend: "escalating",
    escalationIndicators: ["4 coups since 2020", "French forces expelled", "Wagner/Africa Corps expansion", "ECOWAS sanctions"],
    history: {
      lastMajorEvent: "Niger coup",
      lastMajorEventDate: "2023-07-26",
      precedentCount: 4,
      precedentDescription: "4 military coups in 3 years (Mali 2020/2021, Burkina Faso 2022, Niger 2023)",
      cyclicalRisk: "Dry season offensives (Oct-May)"
    },
    whyItMatters: "Russian influence expanding in former French sphere; jihadist groups gaining territory; migration pressure on Europe"
  },
  {
    id: "haiti",
    name: "Port-au-Prince",
    subtext: "Haiti Crisis",
    lat: 18.5,
    lon: -72.3,
    location: "Haiti, Caribbean",
    keywords: ["haiti", "port-au-prince", "gangs", "kenya mission", "barbecue"],
    agencies: ["UN", "HNP", "Kenya Police"],
    description: "Gang violence, government collapse, international security mission.",
    status: "Monitoring",
    escalationScore: 4,
    escalationTrend: "stable",
    escalationIndicators: ["Gangs control 80% of capital", "PM resigned under pressure", "Kenya-led mission deployed", "Mass displacement"],
    history: {
      lastMajorEvent: "PM Henry resignation",
      lastMajorEventDate: "2024-03-11",
      precedentCount: 3,
      precedentDescription: "Repeated state collapse (2004 Aristide, 2021 Mo\xEFse assassination, 2024 gang takeover)",
      cyclicalRisk: "Hurricane season vulnerability (Jun-Nov)"
    },
    whyItMatters: "Humanitarian catastrophe at US doorstep; migration surge potential; test of African-led peacekeeping"
  },
  {
    id: "horn_africa",
    name: "Horn of Africa",
    subtext: "Piracy/Conflict",
    lat: 10,
    lon: 49,
    location: "Somalia, Ethiopia, Djibouti",
    keywords: ["somalia", "piracy", "al-shabaab", "ethiopia", "somaliland", "red sea"],
    agencies: ["USAFRICOM", "EUNAVFOR"],
    description: "Resurgent piracy, Al-Shabaab activity, Ethiopia-Somaliland port dispute.",
    status: "Monitoring",
    escalationScore: 4,
    escalationTrend: "escalating",
    escalationIndicators: ["Houthi attacks on shipping", "Somali piracy resurgence", "Ethiopia-Somaliland MoU dispute", "Sudan civil war spillover"],
    history: {
      lastMajorEvent: "Sudan war outbreak",
      lastMajorEventDate: "2023-04-15",
      precedentCount: 5,
      precedentDescription: "Ethiopia-Eritrea war, Tigray war, Somali civil war, Sudan coups, piracy waves",
      cyclicalRisk: "Monsoon affects naval operations (Jun-Sep)"
    },
    whyItMatters: "Bab el-Mandeb chokepoint security; 12% of global trade at risk; Red Sea shipping rerouting"
  },
  {
    id: "pak_afghan",
    name: "Pakistan\u2013Afghanistan Border",
    subtext: "Border Conflict / TTP",
    lat: 31.8,
    lon: 69,
    location: "Pakistan\u2013Afghanistan border (KP, Balochistan)",
    keywords: ["pakistan", "afghanistan", "ttp", "taliban", "torkham", "chaman", "waziristan", "khyber", "peshawar", "border", "cross-border", "airstrike", "pak-afghan"],
    agencies: ["Pakistan Military", "TTP", "Afghan Taliban"],
    description: "Ongoing conflict along the Pak\u2013Afghan border. Pakistan military operations against TTP; cross-border strikes and border closures. Tensions with Afghan Taliban over border security.",
    status: "Monitoring",
    escalationScore: 4,
    escalationTrend: "escalating",
    escalationIndicators: ["Border clashes and closures", "Pakistan airstrikes in Afghanistan", "TTP attacks in KP", "Torkham/Chaman crossing tensions"],
    history: {
      lastMajorEvent: "Cross-border strikes and border closures",
      lastMajorEventDate: "2024",
      precedentCount: 3,
      precedentDescription: "Recurring border crises, TTP resurgence post-2021, militant sanctuaries in Afghanistan",
      cyclicalRisk: "Militant infiltration; seasonal operations"
    },
    whyItMatters: "Nuclear-armed state at contested border; regional stability; displacement and humanitarian impact"
  },
  {
    id: "dc",
    name: "DC",
    subtext: "Pentagon Pizza Index",
    lat: 38.9,
    lon: -77,
    location: "Washington D.C., USA",
    keywords: ["pentagon", "white house", "congress", "cia", "nsa", "washington", "biden", "trump", "senate", "supreme court", "vance", "elon"],
    agencies: ["Pentagon", "CIA", "NSA", "State Dept"],
    description: "US government and military headquarters. Intelligence community center.",
    status: "Monitoring"
  },
  {
    id: "silicon_valley",
    name: "Silicon Valley",
    subtext: "Tech/AI Hub",
    lat: 37.4,
    lon: -122.1,
    location: "California, USA",
    keywords: ["google", "apple", "meta", "nvidia", "openai", "anthropic", "silicon valley", "san francisco", "palo alto", "tech layoffs", "ai", "artificial intelligence"],
    agencies: ["Big Tech", "AI Labs", "VC"],
    description: "Global tech center. AI development hub. Major economic indicator.",
    status: "Monitoring"
  },
  {
    id: "wall_street",
    name: "Wall Street",
    subtext: "Financial Hub",
    lat: 40.7,
    lon: -74,
    location: "New York City, USA",
    keywords: ["wall street", "fed", "federal reserve", "nyse", "nasdaq", "dow", "sp500", "stock market", "goldman", "jpmorgan", "blackrock"],
    agencies: ["Fed", "SEC", "NYSE"],
    description: "Global financial center. Market movements. Fed policy.",
    status: "Monitoring"
  },
  {
    id: "houston",
    name: "Houston",
    subtext: "Energy/Space",
    lat: 29.76,
    lon: -95.37,
    location: "Texas, USA",
    keywords: ["houston", "nasa", "spacex", "oil", "energy", "texas", "exxon", "chevron", "lng"],
    agencies: ["NASA", "Energy Corps"],
    description: "Energy sector HQ. NASA mission control. Space industry.",
    status: "Monitoring"
  },
  {
    id: "moscow",
    name: "Moscow",
    subtext: "Kremlin Activity",
    lat: 55.75,
    lon: 37.6,
    location: "Russia",
    keywords: ["kremlin", "putin", "russia", "fsb", "moscow", "russian"],
    agencies: ["Kremlin", "FSB", "GRU", "SVR"],
    description: "Russian Federation command center. Military operations hub.",
    status: "Monitoring",
    escalationScore: 4,
    escalationTrend: "stable",
    escalationIndicators: ["Ukraine war ongoing", "Mobilization potential", "Nuclear rhetoric", "Wagner aftermath"],
    history: {
      lastMajorEvent: "Wagner mutiny",
      lastMajorEventDate: "2023-06-24",
      precedentCount: 2,
      precedentDescription: "Crimea annexation 2014, Ukraine invasion 2022",
      cyclicalRisk: "Victory Day (May 9) speeches, Putin addresses"
    },
    whyItMatters: "Nuclear power at war; energy leverage over Europe; global order revisionism"
  },
  {
    id: "beijing",
    name: "Beijing",
    subtext: "PLA/MSS Activity",
    lat: 39.9,
    lon: 116.4,
    location: "China",
    keywords: ["beijing", "xi", "china", "pla", "ccp", "chinese", "jinping"],
    agencies: ["PLA", "MSS", "CCP Politburo"],
    description: "Chinese Communist Party headquarters. PLA command center.",
    status: "Monitoring",
    escalationScore: 3,
    escalationTrend: "stable",
    escalationIndicators: ["Taiwan Strait exercises", "South China Sea militarization", "Tech decoupling", "Xi third term"],
    history: {
      lastMajorEvent: "Xi unprecedented third term",
      lastMajorEventDate: "2022-10-22",
      precedentCount: 3,
      precedentDescription: "Tiananmen 1989, Hong Kong crackdown 2020, COVID lockdowns 2022",
      cyclicalRisk: "Party Congress (every 5 years), Tiananmen anniversary (June 4)"
    },
    whyItMatters: "Largest economy by PPP; primary US strategic competitor; Taiwan contingency risk"
  },
  {
    id: "kyiv",
    name: "Kyiv",
    subtext: "Conflict Zone",
    lat: 50.45,
    lon: 30.5,
    location: "Ukraine",
    keywords: ["kyiv", "ukraine", "zelensky", "ukrainian", "kiev"],
    agencies: ["Ukrainian Armed Forces", "SBU"],
    description: "Active conflict zone. NATO support operations.",
    status: "Monitoring",
    escalationScore: 5,
    escalationTrend: "stable",
    escalationIndicators: ["Active combat operations", "Western weapons deliveries", "Drone warfare escalation", "Nuclear plant risks"],
    history: {
      lastMajorEvent: "Russian full invasion",
      lastMajorEventDate: "2022-02-24",
      precedentCount: 2,
      precedentDescription: "Crimea annexation 2014, Donbas war 2014-2022",
      cyclicalRisk: "Spring/summer offensive season, Winter energy attacks"
    },
    whyItMatters: "Largest European war since WWII; NATO Article 5 test; global food/energy security"
  },
  {
    id: "taipei",
    name: "Taipei",
    subtext: "Strait Watch",
    lat: 25.03,
    lon: 121.5,
    location: "Taiwan",
    keywords: ["taiwan", "taipei", "tsmc", "strait", "taiwanese"],
    agencies: ["ROC Military", "TSMC"],
    description: "Taiwan Strait tensions. Semiconductor supply chain.",
    status: "Monitoring",
    escalationScore: 3,
    escalationTrend: "stable",
    escalationIndicators: ["PLA exercises around Taiwan", "US arms sales", "TSMC Arizona fab", "DPP governance"],
    history: {
      lastMajorEvent: "Pelosi Taiwan visit",
      lastMajorEventDate: "2022-08-02",
      precedentCount: 3,
      precedentDescription: "1954-55 Strait Crisis, 1995-96 missile crisis, 2022 exercises",
      cyclicalRisk: "US-Taiwan political visits, PRC National Day (Oct 1)"
    },
    whyItMatters: "TSMC produces 90% of advanced chips; conflict would devastate global tech supply chains"
  },
  {
    id: "tehran",
    name: "Tehran",
    subtext: "IRGC Activity",
    lat: 35.7,
    lon: 51.4,
    location: "Iran",
    keywords: ["iran", "tehran", "irgc", "khamenei", "persian", "iranian"],
    agencies: ["IRGC", "Quds Force", "MOIS"],
    description: "Iranian nuclear program. Regional proxy operations.",
    status: "Monitoring",
    escalationScore: 4,
    escalationTrend: "escalating",
    escalationIndicators: ["Near-weapons-grade enrichment", "Proxy attacks on Israel", "Houthi coordination", "Succession uncertainty"],
    history: {
      lastMajorEvent: "JCPOA collapse acceleration",
      lastMajorEventDate: "2023-01-01",
      precedentCount: 4,
      precedentDescription: "Revolution 1979, Iran-Iraq War, JCPOA negotiations, Soleimani assassination",
      cyclicalRisk: "Quds Day (annually), Khamenei health status"
    },
    whyItMatters: "Near-nuclear threshold state; controls Strait of Hormuz; Axis of Resistance coordinator"
  },
  {
    id: "telaviv",
    name: "Tel Aviv",
    subtext: "Mossad/IDF",
    lat: 32.1,
    lon: 34.8,
    location: "Israel",
    keywords: ["israel", "idf", "mossad", "gaza", "netanyahu", "israeli", "hamas", "hezbollah"],
    agencies: ["IDF", "Mossad", "Shin Bet"],
    description: "Military operations. Regional security. Intelligence activities.",
    status: "Monitoring",
    escalationScore: 5,
    escalationTrend: "stable",
    escalationIndicators: ["Gaza operations ongoing", "Hezbollah northern front", "Iran shadow war", "Judicial crisis paused"],
    history: {
      lastMajorEvent: "October 7 attacks",
      lastMajorEventDate: "2023-10-07",
      precedentCount: 5,
      precedentDescription: "1948 War, 1967 Six-Day War, 1973 Yom Kippur, Lebanon 2006, Gaza wars",
      cyclicalRisk: "Jewish holidays, Ramadan tensions, election cycles"
    },
    whyItMatters: "Regional escalation risk to multi-front war; US treaty ally; Iran confrontation flashpoint"
  },
  {
    id: "pyongyang",
    name: "Pyongyang",
    subtext: "DPRK Watch",
    lat: 39,
    lon: 125.75,
    location: "North Korea",
    keywords: ["north korea", "kim", "pyongyang", "dprk", "korean"],
    agencies: ["KPA", "RGB", "Lazarus Group"],
    description: "Nuclear weapons program. Missile testing. Cyber operations.",
    status: "Monitoring",
    escalationScore: 3,
    escalationTrend: "stable",
    escalationIndicators: ["ICBM testing resumed", "Russia arms cooperation", "Satellite launches", "Constitution change on ROK"],
    history: {
      lastMajorEvent: "Hwasong-18 ICBM test",
      lastMajorEventDate: "2023-12-18",
      precedentCount: 4,
      precedentDescription: "Korean War 1950-53, nuclear tests 2006-2017, Trump summits, missile tests ongoing",
      cyclicalRisk: "Kim Il-sung birthday (April 15), party anniversaries"
    },
    whyItMatters: "Nuclear-armed hermit state; ICBM can reach US mainland; cyber threat actor; Russia military supplier"
  },
  {
    id: "london",
    name: "London",
    subtext: "GCHQ/MI6",
    lat: 51.5,
    lon: -0.12,
    location: "United Kingdom",
    keywords: ["london", "uk", "britain", "gchq", "mi6", "british"],
    agencies: ["MI6", "GCHQ", "MI5"],
    description: "UK intelligence headquarters. Five Eyes member.",
    status: "Monitoring"
  },
  {
    id: "brussels",
    name: "Brussels",
    subtext: "NATO HQ",
    lat: 50.85,
    lon: 4.35,
    location: "Belgium (NATO HQ)",
    keywords: ["nato", "brussels", "eu", "european union", "europe"],
    agencies: ["NATO", "EU Commission"],
    description: "NATO alliance headquarters. European Union center.",
    status: "Monitoring"
  },
  {
    id: "caracas",
    name: "Caracas",
    subtext: "Venezuela Crisis",
    lat: 10.5,
    lon: -66.9,
    location: "Venezuela",
    keywords: ["venezuela", "maduro", "caracas", "venezuelan"],
    agencies: ["Maduro Govt", "SEBIN"],
    description: "Political crisis. Economic sanctions. Regional instability.",
    status: "Monitoring"
  },
  {
    id: "mexico",
    name: "Mexico City",
    subtext: "Cartel Violence",
    lat: 23.6,
    lon: -102.5,
    location: "Mexico",
    keywords: ["mexico", "cartel", "sinaloa", "jalisco", "narco", "cjng", "fentanyl", "el chapo", "national guard mexico", "zetas", "michoacan", "juarez", "tijuana", "border violence", "mexican army", "sedena", "extradition mexico"],
    agencies: ["Sedena", "National Guard", "DEA", "FGR"],
    description: "Cartel warfare, fentanyl trafficking, military deployments, state fragility in multiple regions.",
    status: "Monitoring",
    escalationScore: 4,
    escalationTrend: "escalating",
    escalationIndicators: ["Sinaloa cartel fragmentation", "CJNG territorial expansion", "Military deployed to multiple states", "Record fentanyl seizures", "Prison breaks and gang violence"],
    history: {
      lastMajorEvent: "Sinaloa cartel leadership crisis",
      lastMajorEventDate: "2024-07-25",
      precedentCount: 5,
      precedentDescription: "Decades of cartel wars (Sinaloa vs CJNG, Zetas era, Calder\xF3n drug war 2006, El Chapo captures)",
      cyclicalRisk: "Election cycles trigger violence; cartel leadership changes spark turf wars"
    },
    whyItMatters: "Largest US land border; fentanyl crisis killing 100k+ Americans/year; regional destabilization; migration driver"
  },
  {
    id: "nuuk",
    name: "Nuuk",
    subtext: "Greenland Intel",
    lat: 64.18,
    lon: -51.7,
    location: "Greenland (Denmark)",
    keywords: ["greenland", "nuuk", "arctic", "denmark", "danish"],
    agencies: ["Danish Defence", "US Space Force", "Arctic Council"],
    description: "Arctic strategic territory. US military presence, sovereignty questions.",
    status: "Monitoring"
  },
  // Middle East hotspots
  {
    id: "riyadh",
    name: "Riyadh",
    subtext: "Saudi GIP/MBS",
    lat: 24.7,
    lon: 46.7,
    location: "Saudi Arabia",
    keywords: ["saudi", "riyadh", "mbs", "aramco", "opec", "saudi arabia"],
    agencies: ["GIP", "Saudi Royal Court", "Aramco"],
    description: "Saudi Arabia power center. OPEC+ decisions. Regional influence.",
    status: "Monitoring"
  },
  {
    id: "cairo",
    name: "Cairo",
    subtext: "Egypt/GIS",
    lat: 30,
    lon: 31.2,
    location: "Egypt",
    keywords: ["egypt", "cairo", "sisi", "egyptian", "suez"],
    agencies: ["GIS", "Egyptian Armed Forces"],
    description: "Egyptian command. Gaza border control. Suez Canal security.",
    status: "Monitoring"
  },
  {
    id: "baghdad",
    name: "Baghdad",
    subtext: "Iraq/PMF",
    lat: 33.3,
    lon: 44.4,
    location: "Iraq",
    keywords: ["iraq", "baghdad", "iraqi", "pmf", "militia"],
    agencies: ["Iraqi Security Forces", "PMF", "US Embassy"],
    description: "Iraqi government. Iran-backed militias. US military presence.",
    status: "Monitoring"
  },
  {
    id: "damascus",
    name: "Damascus",
    subtext: "Syria Crisis",
    lat: 33.5,
    lon: 36.3,
    location: "Syria",
    keywords: ["syria", "damascus", "assad", "syrian", "hts"],
    agencies: ["Syrian Govt", "HTS", "Russian Forces", "Turkish Forces"],
    description: "Syrian civil war aftermath. Multiple foreign interventions.",
    status: "Monitoring"
  },
  {
    id: "doha",
    name: "Doha",
    subtext: "Qatar/Al Udeid",
    lat: 25.3,
    lon: 51.5,
    location: "Qatar",
    keywords: ["qatar", "doha", "qatari", "al jazeera"],
    agencies: ["Qatari State Security", "CENTCOM Forward HQ"],
    description: "Qatar diplomatic hub. US CENTCOM base. Al Jazeera HQ.",
    status: "Monitoring"
  },
  {
    id: "ankara",
    name: "Ankara",
    subtext: "Turkey/MIT",
    lat: 39.9,
    lon: 32.9,
    location: "Turkey",
    keywords: ["turkey", "ankara", "erdogan", "turkish", "mit"],
    agencies: ["MIT", "Turkish Armed Forces", "AKP"],
    description: "NATO member. Kurdish conflict. Syria/Libya operations.",
    status: "Monitoring"
  },
  {
    id: "beirut",
    name: "Beirut",
    subtext: "Lebanon/Hezbollah",
    lat: 33.9,
    lon: 35.5,
    location: "Lebanon",
    keywords: ["lebanon", "beirut", "hezbollah", "lebanese", "nasrallah"],
    agencies: ["LAF", "Hezbollah", "UNIFIL"],
    description: "Lebanon crisis. Hezbollah stronghold. Israel border tensions.",
    status: "Monitoring"
  },
  {
    id: "sanaa",
    name: "Sana'a",
    subtext: "Yemen/Houthis",
    lat: 15.4,
    lon: 44.2,
    keywords: ["yemen", "houthi", "sanaa", "yemeni", "red sea"],
    agencies: ["Houthi Forces", "Saudi Coalition", "US Navy"],
    description: "Yemen conflict. Houthi Red Sea attacks. Shipping disruption.",
    status: "Monitoring",
    escalationScore: 4,
    escalationTrend: "escalating",
    escalationIndicators: ["Red Sea shipping attacks", "US/UK strikes on Yemen", "Iran weapon supplies", "Commercial ship seizures"],
    history: {
      lastMajorEvent: "Red Sea campaign begins",
      lastMajorEventDate: "2023-11-19",
      precedentCount: 3,
      precedentDescription: "Civil war since 2014, Saudi intervention 2015, US strikes 2024",
      cyclicalRisk: "Ramadan, Gaza war linkage"
    },
    whyItMatters: "Disrupting 12% of global trade via Suez; insurance costs spiking; Iran proxy demonstration"
  },
  {
    id: "abudhabi",
    name: "Abu Dhabi",
    subtext: "UAE/ECSR",
    lat: 24.5,
    lon: 54.4,
    keywords: ["uae", "abu dhabi", "emirates", "emirati", "dubai"],
    agencies: ["ECSR", "UAE Armed Forces"],
    description: "UAE strategic hub. Regional military operations.",
    status: "Monitoring"
  }
];
var STRATEGIC_WATERWAYS = [
  { id: "taiwan_strait", chokepointId: "taiwan_strait", name: "TAIWAN STRAIT", lat: 24, lon: 119.5, description: "Critical shipping lane, PLA activity" },
  { id: "malacca_strait", chokepointId: "malacca_strait", name: "MALACCA STRAIT", lat: 2.5, lon: 101.5, description: "Major oil shipping route" },
  { id: "hormuz_strait", chokepointId: "hormuz_strait", name: "STRAIT OF HORMUZ", lat: 26.5, lon: 56.5, description: "Oil chokepoint, Iran control" },
  { id: "bosphorus", chokepointId: "bosphorus", name: "BOSPHORUS STRAIT", lat: 41.1, lon: 29, description: "Black Sea access, Turkey control" },
  { id: "suez", chokepointId: "suez", name: "SUEZ CANAL", lat: 30.5, lon: 32.3, description: "Europe-Asia shipping" },
  { id: "panama", chokepointId: "panama", name: "PANAMA CANAL", lat: 9.1, lon: -79.7, description: "Americas shipping route" },
  { id: "gibraltar", chokepointId: "gibraltar", name: "STRAIT OF GIBRALTAR", lat: 35.9, lon: -5.6, description: "Mediterranean access, NATO control" },
  { id: "bab_el_mandeb", chokepointId: "bab_el_mandeb", name: "BAB EL-MANDEB", lat: 12.5, lon: 43.3, description: "Red Sea chokepoint, Houthi attacks" },
  { id: "cape_of_good_hope", chokepointId: "cape_of_good_hope", name: "CAPE OF GOOD HOPE", lat: -34.36, lon: 18.49, description: "Suez bypass route, tanker traffic" },
  { id: "dover_strait", chokepointId: "dover_strait", name: "DOVER STRAIT", lat: 51, lon: 1.5, description: "English Channel narrows, busiest shipping lane" },
  { id: "korea_strait", chokepointId: "korea_strait", name: "KOREA STRAIT", lat: 34, lon: 129, description: "Japan-Korea shipping lane" },
  { id: "kerch_strait", chokepointId: "kerch_strait", name: "KERCH STRAIT", lat: 45.3, lon: 36.6, description: "Black Sea-Azov access, Russia-Ukraine flashpoint" },
  { id: "lombok_strait", chokepointId: "lombok_strait", name: "LOMBOK STRAIT", lat: -8.5, lon: 115.7, description: "Malacca bypass for deep-draft vessels" }
];
var CONFLICT_ZONES = [
  {
    id: "iran",
    name: "Iran War Theater",
    coords: [[44, 39.7], [46, 39.5], [48.5, 38.5], [50.5, 37.5], [53.5, 37.5], [55.5, 38], [57, 37.5], [58.5, 37.5], [61, 36.5], [63.5, 35.5], [63.5, 31.5], [62.5, 29.5], [61, 28], [59, 26.5], [57.5, 25.5], [56.5, 25.5], [55, 26.5], [54, 27], [52.5, 27.5], [50.5, 28.5], [49, 29.5], [47.5, 30], [46, 31.5], [45.5, 33.5], [45.8, 35.5], [46.5, 37], [44, 38.5], [44, 39.7]],
    center: [53, 32],
    intensity: "high",
    parties: ["United States", "Israel", "Iran", "IRGC"],
    casualties: "200+ killed (first 72hrs)",
    displaced: "Millions fleeing major cities",
    keywords: ["iran", "tehran", "khamenei", "epic fury", "roaring lion", "irgc", "centcom", "isfahan", "bushehr"],
    startDate: "Feb 28, 2026",
    location: "Iran (nationwide)",
    description: "Joint US-Israeli military operation (US: Operation Epic Fury / Israel: Operation Roaring Lion). 1000+ targets struck including military, nuclear, and leadership sites. Supreme Leader Khamenei killed in Tehran strikes. Iran retaliating with missiles and drones across the region.",
    keyDevelopments: ["Khamenei killed in Tehran strikes", "1000+ Iranian targets struck", "3 US service members KIA", "Iranian missile/drone retaliation on Gulf states"]
  },
  {
    id: "strait_hormuz",
    name: "Strait of Hormuz Crisis",
    coords: [[54.5, 25.5], [55.5, 25], [57, 24.8], [58.5, 25], [58.5, 26.8], [57.5, 27.5], [56, 27.5], [54.5, 27], [54.5, 25.5]],
    center: [56.5, 26.2],
    intensity: "high",
    parties: ["Iran (IRGC Navy)", "US Navy (5th Fleet)", "Coalition forces"],
    casualties: "Maritime casualties reported",
    displaced: "Global shipping halted",
    keywords: ["hormuz", "strait", "persian gulf", "shipping", "tanker", "oil", "blockade", "navy"],
    startDate: "Feb 28, 2026",
    location: "Strait of Hormuz & Persian Gulf Approaches",
    description: "Iran attempting to close Strait of Hormuz. IRGC naval/air operations active. Three tankers damaged. US sank 9 Iranian warships. GPS spoofing/jamming reported. 20-30% of global oil/gas transits through this chokepoint. Brent crude spiking to $80+.",
    keyDevelopments: ["Iran attempts Hormuz closure", "3 tankers damaged", "US sinks 9 Iranian warships", "Global shipping paused", "Oil prices spike"]
  },
  {
    id: "ukraine",
    name: "Ukraine War",
    coords: [[22.137, 48.09], [22.558, 49.085], [22.66, 49.79], [23.2, 50.38], [23.82, 51.22], [24.09, 51.89], [25.6, 51.93], [27.85, 52.18], [30.17, 52.1], [32.76, 52.32], [34.4, 51.76], [36.28, 50.3], [38.25, 49.92], [40.18, 49.6], [40.08, 48.88], [39.68, 47.77], [38.21, 47.1], [36.65, 46.58], [35.19, 46.1], [36.47, 45.22], [36, 44.4], [33.55, 44.39], [32.48, 44.52], [31.78, 45.2], [31.44, 46.03], [30.76, 46.38], [29.6, 45.38], [28.21, 45.45], [28.68, 46.45], [28.24, 47.11], [26.62, 48.26], [24.58, 47.96], [22.87, 47.95], [22.137, 48.09]],
    center: [31, 48.5],
    intensity: "high",
    parties: ["Russia", "Ukraine", "NATO (support)"],
    casualties: "500,000+ (est.)",
    displaced: "6.5M+ refugees",
    keywords: ["ukraine", "russia", "zelensky", "putin", "donbas", "crimea"],
    startDate: "Feb 24, 2022",
    location: "Eastern Ukraine (Donetsk, Luhansk)",
    description: "Full-scale Russian invasion of Ukraine. Active frontlines in Donetsk, Luhansk, Zaporizhzhia, and Kherson oblasts. Heavy artillery, drone warfare, and trench combat.",
    keyDevelopments: ["Battle of Bakhmut", "Kursk incursion", "Black Sea drone strikes", "Infrastructure attacks"],
    peaceAgreements: ["Minsk I (2014, failed)", "Minsk II (2015, failed)"],
    totalFatalities: "500,000+"
  },
  {
    id: "gaza",
    name: "Gaza Conflict",
    coords: [[34, 32], [35, 32], [35, 31], [34, 31]],
    center: [34.5, 31.5],
    intensity: "high",
    parties: ["Israel", "Hamas", "Hezbollah", "PIJ"],
    casualties: "40,000+ (Gaza)",
    displaced: "2M+ displaced",
    keywords: ["gaza", "israel", "hamas", "palestinian"],
    startDate: "Oct 7, 2023",
    location: "Gaza Strip, Palestinian Territories",
    description: "Israeli military operations in Gaza following October 7 attacks. Ground invasion, aerial bombardment. Humanitarian crisis. Regional escalation with Hezbollah.",
    keyDevelopments: ["Rafah ground operation", "Humanitarian crisis", "Hostage negotiations", "Iran-backed attacks"],
    peaceAgreements: ["Oslo Accords (1993, undermined)"],
    totalFatalities: "40,000+"
  },
  {
    id: "south_lebanon",
    name: "Israel-Lebanon Border",
    coords: [[35.1, 33], [35.1, 33.4], [35.8, 33.4], [35.8, 33]],
    center: [35.4, 33.2],
    intensity: "high",
    parties: ["Israel (IDF)", "Hezbollah"],
    casualties: "500+ killed",
    displaced: "150k+ displaced",
    keywords: ["hezbollah", "lebanon", "israel", "border", "rocket", "airstrike"],
    startDate: "Oct 8, 2023",
    location: "Southern Lebanon / Northern Israel",
    description: "Cross-border artillery and rocket fire. Targeted assassinations. High risk of full-scale escalation.",
    keyDevelopments: ["Daily rocket fire", "IDF airstrikes", "Buffer zone evacuation", "Litani River tensions"],
    peaceAgreements: ["UNSC Resolution 1701 (2006)"],
    totalFatalities: "1,500+"
  },
  {
    id: "yemen_redsea",
    name: "Red Sea Crisis",
    coords: [
      // NW coast along Red Sea
      [42.6, 16.5],
      [42.8, 15.8],
      [42.7, 15.2],
      [42.9, 14.8],
      [43.1, 14],
      // Bab el-Mandeb Strait
      [43.3, 12.6],
      [43.5, 12.4],
      // Gulf of Aden coast (south)
      [44, 12.6],
      [44.8, 12.5],
      [45.2, 12.8],
      [45.5, 13],
      [46, 13.4],
      [46.8, 13.8],
      [47.5, 13.9],
      [48, 14],
      [48.5, 14.5],
      [49.5, 14.7],
      [50.5, 14.9],
      [51.5, 14.7],
      [52, 15],
      [52.2, 15.6],
      // Inland boundary (north)
      [51.5, 16],
      [50, 16.4],
      [48.5, 16.8],
      [47, 17],
      [46, 17.2],
      [45, 17],
      [44.5, 17],
      [43.5, 17],
      // Close
      [42.6, 16.5]
    ],
    center: [46, 14.5],
    intensity: "high",
    parties: ["Houthis", "US/UK Coalition", "Yemen Govt"],
    casualties: "Unknown (Maritime)",
    displaced: "4.5M+ (Yemen Civil War)",
    keywords: ["houthi", "red sea", "yemen", "missile", "drone", "ship"],
    startDate: "Nov 19, 2023",
    location: "Red Sea & Gulf of Aden, Yemen",
    description: "Houthi maritime campaign against commercial shipping. US/UK airstrikes on Houthi targets. Ongoing blockade attempts.",
    keyDevelopments: ["Ship hijackings", "US airstrikes", "Cable cuts", "Sinking of Rubymar"],
    peaceAgreements: ["Stockholm Agreement (2018, partial)"],
    totalFatalities: "150,000+ (Yemen Civil War)"
  },
  {
    id: "sudan",
    name: "Sudan Civil War",
    coords: [
      [21.8, 22],
      [24, 21.9],
      [31.4, 22],
      [33.2, 22],
      [36.9, 22],
      [36.9, 19.5],
      [37.5, 18.2],
      [38.6, 18],
      [38.5, 17.4],
      [37, 16.6],
      [36.5, 14.5],
      [35.3, 12.2],
      [34.1, 10.6],
      [33.2, 9.6],
      [32, 9.8],
      [30.2, 9.4],
      [29, 9.8],
      [27.5, 9.5],
      [25, 10.2],
      [24, 12.5],
      [23.5, 15.6],
      [22, 16],
      [21.8, 20],
      [21.8, 22]
    ],
    center: [30, 15.5],
    intensity: "high",
    parties: ["Sudanese Armed Forces (SAF)", "Rapid Support Forces (RSF)", "Allied militias"],
    casualties: "150,000+ killed (est.)",
    displaced: "14M+ internally displaced, 3M+ refugees",
    keywords: ["sudan", "khartoum", "darfur", "rsf", "saf", "el fasher", "port sudan", "wad madani", "al jazirah", "famine", "hemedti"],
    startDate: "Apr 15, 2023",
    location: "Sudan (nationwide)",
    description: "Power struggle between SAF and RSF paramilitary has engulfed the entire country. RSF controls most of Darfur and Khartoum; SAF holds Port Sudan and eastern regions. World's largest displacement crisis. Famine conditions in multiple states.",
    keyDevelopments: ["Khartoum destruction", "Darfur ethnic massacres", "El Fasher siege", "Wad Madani fall to RSF", "Famine declared in North Darfur", "SAF counter-offensives", "Regional proxy involvement (UAE, Egypt)"],
    totalFatalities: "150,000+"
  },
  {
    id: "myanmar",
    name: "Myanmar Civil War",
    coords: [
      [92.2, 21],
      [92.1, 23.7],
      [93, 24.2],
      [94, 25],
      [94.5, 26.5],
      [96, 28.3],
      [97.5, 28.2],
      [98.5, 27.5],
      [98.8, 25.5],
      [100.2, 23.5],
      [101, 21.5],
      [100.5, 20],
      [99, 18],
      [98.5, 16],
      [98.5, 13],
      [97.5, 10.5],
      [97, 10],
      [97.8, 12.5],
      [97.5, 14.5],
      [96.5, 16],
      [95.5, 17.5],
      [94.5, 18.5],
      [93.5, 19.5],
      [92.5, 20],
      [92.2, 21]
    ],
    center: [96.5, 20],
    intensity: "high",
    parties: ["Military junta (Tatmadaw)", "NUG / PDF", "Arakan Army (AA)", "MNDAA / TNLA / KIA", "Ethnic armed organizations"],
    casualties: "50,000+ (est.)",
    displaced: "3M+ internally displaced",
    keywords: ["myanmar", "burma", "rohingya", "shan", "rakhine", "arakan army", "kachin", "pdf", "nug", "coup", "resistance", "junta", "tatmadaw"],
    startDate: "Feb 1, 2021",
    location: "Myanmar (nationwide)",
    description: "Civil war following 2021 military coup. Resistance forces and ethnic armed organizations have captured significant territory. Junta losing control of border regions. Multiple coordinated offensives ongoing.",
    keyDevelopments: ["Operation 1027 (Shan State)", "Lashio capture by MNDAA", "AA controls most of Rakhine", "Myawaddy capture", "Junta airstrikes on civilians", "Resistance advances in Sagaing"]
  },
  {
    id: "korean_dmz",
    name: "Korean Demilitarized Zone",
    intensity: "low",
    parties: ["Republic of Korea", "Democratic People's Republic of Korea", "United Nations Command"],
    startDate: "Jul 27, 1953",
    location: "Korean Peninsula (MDL)",
    description: "250km-long, 4km-wide buffer zone along the Military Demarcation Line established by the 1953 Korean Armistice Agreement. Despite its name, one of the most heavily militarized borders in the world.",
    peaceAgreements: ["Korean Armistice Agreement (Jul 27, 1953)"],
    totalFatalities: "2,500,000+ (Korean War)",
    center: [127.27, 38.14],
    coords: [
      [126.0955, 37.7876],
      [126.2448, 37.8175],
      [126.3927, 37.857],
      [126.5117, 37.9068],
      [126.6219, 37.9468],
      [126.6735, 37.9672],
      [126.775, 37.9875],
      [126.8936, 38.0173],
      [127.0409, 38.0665],
      [127.1676, 38.1351],
      [127.3004, 38.2363],
      [127.4476, 38.2679],
      [127.5784, 38.2679],
      [127.7175, 38.2879],
      [127.8476, 38.2979],
      [127.994, 38.3174],
      [128.1079, 38.3653],
      [128.1834, 38.4324],
      [128.262, 38.5312],
      [128.342, 38.6312],
      [128.3744, 38.634],
      [128.378, 38.6088],
      [128.2979, 38.5088],
      [128.2166, 38.4076],
      [128.1321, 38.3347],
      [128.006, 38.2826],
      [127.8524, 38.2621],
      [127.7225, 38.2521],
      [127.5816, 38.2321],
      [127.4524, 38.2321],
      [127.3196, 38.2037],
      [127.1924, 38.1049],
      [127.0591, 38.0335],
      [126.9064, 37.9827],
      [126.785, 37.9525],
      [126.6865, 37.9328],
      [126.6381, 37.9132],
      [126.5283, 37.8732],
      [126.4073, 37.823],
      [126.2552, 37.7825],
      [126.1045, 37.7524],
      [126.0777, 37.7665],
      [126.0955, 37.7876]
    ]
  },
  {
    id: "pak_afghan",
    name: "Pakistan\u2013Afghanistan Border Conflict",
    coords: [
      [72.5, 35.7],
      [69.4, 31.69],
      [65.95, 29.33],
      [64.9, 30.29],
      [71.02, 36.55],
      [72.5, 35.7]
    ],
    center: [69, 31.8],
    intensity: "medium",
    parties: ["Pakistan (Military)", "TTP", "Afghan Taliban"],
    casualties: "Ongoing military and civilian casualties",
    displaced: "Displacement along border areas",
    keywords: ["pakistan", "afghanistan", "ttp", "taliban", "torkham", "chaman", "waziristan", "kpk", "border", "cross-border", "airstrike"],
    startDate: "Feb 21, 2026",
    location: "Pakistan\u2013Afghanistan border (KPK, Balochistan, Federally Administered Tribal Areas)",
    description: "Escalating tensions along the Pakistan\u2013Afghanistan border. Pakistan has conducted cross-border strikes targeting TTP sanctuaries in Afghan territory, prompting border closures and diplomatic friction with the Taliban government. Long-running dispute over militant safe havens and border security.",
    keyDevelopments: ["Pakistan cross-border strikes in Afghanistan", "TTP attacks in KPK", "Torkham/Chaman crossing tensions", "Militant infiltration", "Border closures"]
  }
];

// shared/geo-distance.ts
function haversineKm(lat1, lon1, lat2, lon2) {
  const radiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// shared/analysis-hotspot-escalation.ts
var COMPONENT_WEIGHTS = {
  news: 0.35,
  cii: 0.25,
  geo: 0.25,
  military: 0.15
};
var SIGNAL_COOLDOWN_MS = 2 * 60 * 60 * 1e3;
var HISTORY_WINDOW_MS = 24 * 60 * 60 * 1e3;
var MAX_HISTORY_POINTS = 48;
function getStaticBaseline(hotspot) {
  return hotspot.escalationScore ?? 3;
}
function normalizeNewsActivity(matches, hasBreaking, velocity) {
  return Math.min(100, matches * 15 + (hasBreaking ? 30 : 0) + velocity * 5);
}
function normalizeCII(score) {
  return score ?? 30;
}
function normalizeGeo(alertScore, alertTypes) {
  if (alertScore === 0) return 0;
  return Math.min(100, alertScore + alertTypes * 10);
}
function normalizeMilitary(flights, vessels) {
  return Math.min(100, flights * 10 + vessels * 15);
}
function computeComponents(inputs) {
  return {
    newsActivity: normalizeNewsActivity(inputs.newsMatches, inputs.hasBreaking, inputs.newsVelocity),
    ciiContribution: normalizeCII(inputs.ciiScore),
    geoConvergence: normalizeGeo(inputs.geoAlertScore, inputs.geoAlertTypes),
    militaryActivity: normalizeMilitary(inputs.flightsNearby, inputs.vesselsNearby)
  };
}
function calculateDynamicRaw(components) {
  return components.newsActivity * COMPONENT_WEIGHTS.news + components.ciiContribution * COMPONENT_WEIGHTS.cii + components.geoConvergence * COMPONENT_WEIGHTS.geo + components.militaryActivity * COMPONENT_WEIGHTS.military;
}
function rawToScore(raw) {
  return 1 + raw / 100 * 4;
}
function blendScores(staticBaseline, dynamicScore) {
  return staticBaseline * 0.3 + dynamicScore * 0.7;
}
function pruneHistory(history, now) {
  const cutoff = now - HISTORY_WINDOW_MS;
  const pruned = history.filter((h) => h.timestamp >= cutoff);
  if (pruned.length > MAX_HISTORY_POINTS) {
    return pruned.slice(-MAX_HISTORY_POINTS);
  }
  return pruned;
}
function detectTrend(history) {
  if (history.length < 3) return "stable";
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  let validCount = 0;
  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    if (!entry) continue;
    sumX += validCount;
    sumY += entry.score;
    sumXY += validCount * entry.score;
    sumX2 += validCount * validCount;
    validCount++;
  }
  if (validCount < 3) return "stable";
  const denominator = validCount * sumX2 - sumX * sumX;
  if (denominator === 0) return "stable";
  const slope = (validCount * sumXY - sumX * sumY) / denominator;
  if (slope > 0.1) return "escalating";
  if (slope < -0.1) return "de-escalating";
  return "stable";
}
function computeEscalationScore(hotspot, inputs, options) {
  const { now, previousHistory } = options;
  const staticBaseline = getStaticBaseline(hotspot);
  const components = computeComponents(inputs);
  const dynamicRaw = calculateDynamicRaw(components);
  const dynamicScore = rawToScore(dynamicRaw);
  const combinedScore = blendScores(staticBaseline, dynamicScore);
  const history = pruneHistory(previousHistory ?? [], now);
  history.push({ timestamp: now, score: combinedScore });
  return {
    hotspotId: hotspot.id,
    staticBaseline,
    dynamicScore: Math.round(dynamicScore * 10) / 10,
    combinedScore: Math.round(combinedScore * 10) / 10,
    trend: detectTrend(history),
    components,
    history,
    lastUpdated: new Date(now)
  };
}
function countMilitaryNearHotspot(hotspot, flights, vessels, radiusKm = 200) {
  let flightCount = 0;
  let vesselCount = 0;
  for (const f of flights) {
    if (haversineKm(hotspot.lat, hotspot.lon, f.lat, f.lon) <= radiusKm) {
      flightCount++;
    }
  }
  for (const v of vessels) {
    if (haversineKm(hotspot.lat, hotspot.lon, v.lat, v.lon) <= radiusKm) {
      vesselCount++;
    }
  }
  return { flights: flightCount, vessels: vesselCount };
}

// shared/analysis-geo-convergence.ts
var GEO_CONVERGENCE_WINDOW_MS = 24 * 60 * 60 * 1e3;
var GEO_CONVERGENCE_THRESHOLD = 3;
var GEO_NEARBY_MIN_TYPES = 2;
var GEO_CONFLICT_ZONE_RADIUS_KM = 300;
var GEO_WATERWAY_RADIUS_KM = 200;
var GEO_HOTSPOT_RADIUS_KM = 150;
function getCellId(lat, lon) {
  return `${Math.floor(lat)},${Math.floor(lon)}`;
}
function scoreGeoCell(typeCount, totalEvents) {
  const typeScore = typeCount * 25;
  const countBoost = Math.min(25, totalEvents * 2);
  return Math.min(100, typeScore + countBoost);
}
function getLocationName(lat, lon, places = {}) {
  for (const zone of places.conflictZones ?? []) {
    const [zoneLon, zoneLat] = zone.center;
    const dist = haversineKm(lat, lon, zoneLat, zoneLon);
    if (dist < GEO_CONFLICT_ZONE_RADIUS_KM) {
      return zone.name.replace(" Conflict", "").replace(" Civil War", "");
    }
  }
  for (const waterway of places.waterways ?? []) {
    const dist = haversineKm(lat, lon, waterway.lat, waterway.lon);
    if (dist < GEO_WATERWAY_RADIUS_KM) {
      return waterway.name;
    }
  }
  let nearestHotspot = null;
  for (const hotspot of places.hotspots ?? []) {
    const dist = haversineKm(lat, lon, hotspot.lat, hotspot.lon);
    if (dist < GEO_HOTSPOT_RADIUS_KM && (!nearestHotspot || dist < nearestHotspot.dist)) {
      nearestHotspot = { name: hotspot.name, dist };
    }
  }
  if (nearestHotspot) {
    return nearestHotspot.name;
  }
  if (lat >= 25 && lat <= 40 && lon >= 25 && lon <= 75) return "Middle East";
  if (lat >= 30 && lat <= 45 && lon >= 100 && lon <= 145) return "East Asia";
  if (lat >= -10 && lat <= 25 && lon >= 90 && lon <= 130) return "Southeast Asia";
  if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 40) return "Europe";
  if (lat >= 44 && lat <= 75 && lon >= 20 && lon <= 180) return "Russia";
  if (lat >= -35 && lat <= 35 && lon >= -20 && lon <= 55) return "Africa";
  if (lat >= 25 && lat <= 50 && lon >= -125 && lon <= -65) return "North America";
  if (lat >= -60 && lat <= 15 && lon >= -80 && lon <= -30) return "South America";
  return `${lat.toFixed(1)}\xB0, ${lon.toFixed(1)}\xB0`;
}
var GeoConvergenceEngine = class {
  cells = /* @__PURE__ */ new Map();
  windowMs;
  convergenceThreshold;
  nearbyMinTypes;
  now;
  constructor(options = {}) {
    this.windowMs = options.windowMs ?? GEO_CONVERGENCE_WINDOW_MS;
    this.convergenceThreshold = options.convergenceThreshold ?? GEO_CONVERGENCE_THRESHOLD;
    this.nearbyMinTypes = options.nearbyMinTypes ?? GEO_NEARBY_MIN_TYPES;
    this.now = options.now ?? (() => Date.now());
  }
  ingest(lat, lon, type, timestamp = this.now()) {
    const cellId = getCellId(lat, lon);
    let cell = this.cells.get(cellId);
    if (!cell) {
      cell = {
        id: cellId,
        lat: Math.floor(lat) + 0.5,
        lon: Math.floor(lon) + 0.5,
        events: /* @__PURE__ */ new Map(),
        firstSeen: timestamp
      };
      this.cells.set(cellId, cell);
    }
    const existing = cell.events.get(type);
    cell.events.set(type, {
      count: (existing?.count ?? 0) + 1,
      lastSeen: timestamp
    });
  }
  ingestEvents(events, type) {
    for (const e of events) {
      this.ingest(e.lat, e.lon, type, e.time ?? this.now());
    }
  }
  /**
   * Emit one alert per cell that has reached the domain threshold, skipping any
   * cell id already in `seenAlerts`. Newly alerted ids are added to that set.
   */
  detect(seenAlerts) {
    this.prune();
    const alerts = [];
    for (const [cellId, cell] of this.cells) {
      if (cell.events.size >= this.convergenceThreshold) {
        if (seenAlerts.has(cellId)) continue;
        const types = Array.from(cell.events.keys());
        const totalEvents = Array.from(cell.events.values()).reduce((sum, d) => sum + d.count, 0);
        alerts.push({
          cellId,
          lat: cell.lat,
          lon: cell.lon,
          types,
          totalEvents,
          score: scoreGeoCell(cell.events.size, totalEvents)
        });
        seenAlerts.add(cellId);
      }
    }
    return alerts.sort((a, b) => b.score - a.score);
  }
  /** Strongest multi-domain cell within `radiusKm`, or null if there is none. */
  alertsNear(lat, lon, radiusKm) {
    this.prune();
    let maxScore = 0;
    let maxTypes = 0;
    for (const cell of this.cells.values()) {
      const dist = haversineKm(lat, lon, cell.lat, cell.lon);
      if (dist <= radiusKm && cell.events.size >= this.nearbyMinTypes) {
        const types = cell.events.size;
        const totalEvents = Array.from(cell.events.values()).reduce((sum, d) => sum + d.count, 0);
        const score = scoreGeoCell(types, totalEvents);
        if (score > maxScore) {
          maxScore = score;
          maxTypes = types;
        }
      }
    }
    return maxScore > 0 ? { score: maxScore, types: maxTypes } : null;
  }
  clear() {
    this.cells.clear();
  }
  /** Live cell count — deliberately does not prune. */
  cellCount() {
    return this.cells.size;
  }
  /** Detached copy of the grid for debugging; deliberately does not prune. */
  snapshot() {
    return Array.from(this.cells.values(), (cell) => ({
      id: cell.id,
      lat: cell.lat,
      lon: cell.lon,
      firstSeen: cell.firstSeen,
      events: Array.from(cell.events, ([type, data]) => ({
        type,
        count: data.count,
        lastSeen: data.lastSeen
      }))
    }));
  }
  prune() {
    const cutoff = this.now() - this.windowMs;
    for (const [cellId, cell] of this.cells) {
      for (const [type, data] of cell.events) {
        if (data.lastSeen < cutoff) {
          cell.events.delete(type);
        }
      }
      if (cell.events.size === 0) {
        this.cells.delete(cellId);
      }
    }
  }
};

// shared/pipelines-data.ts
var PIPELINES = [
  // ===== MAJOR OIL PIPELINES =====
  // North America
  {
    id: "keystone",
    name: "Keystone Pipeline",
    type: "oil",
    status: "operating",
    points: [[-104.05, 50.95], [-104, 49], [-101.5, 46.8], [-97.5, 44.4], [-97, 41.2], [-95.9, 36.1], [-95, 29.8]],
    capacity: "590,000 bpd",
    length: "3,456 km",
    operator: "TC Energy",
    countries: ["Canada", "USA"]
  },
  {
    id: "dakota-access",
    name: "Dakota Access Pipeline",
    type: "oil",
    status: "operating",
    points: [[-103.5, 47.5], [-100.8, 46.8], [-97, 45.5], [-96, 43.5], [-93.5, 41.5], [-91, 40.5]],
    capacity: "570,000 bpd",
    length: "1,886 km",
    operator: "Energy Transfer",
    countries: ["USA"]
  },
  {
    id: "trans-mountain",
    name: "Trans Mountain Pipeline",
    type: "oil",
    status: "operating",
    points: [[-114.1, 53.5], [-117.5, 52.9], [-119.3, 52.1], [-121, 50.7], [-122.8, 49.3]],
    capacity: "890,000 bpd",
    length: "1,150 km",
    operator: "Trans Mountain Corp",
    countries: ["Canada"]
  },
  {
    id: "colonial",
    name: "Colonial Pipeline",
    type: "oil",
    status: "operating",
    points: [[-95.4, 29.8], [-93.2, 30.2], [-90.1, 30], [-86.8, 30.7], [-84.4, 33.8], [-80.8, 32.1], [-78.6, 35.8], [-77, 38.9], [-74, 40.7]],
    capacity: "2.5 million bpd",
    length: "8,850 km",
    operator: "Colonial Pipeline Co",
    countries: ["USA"]
  },
  {
    id: "enbridge-line5",
    name: "Enbridge Line 5",
    type: "oil",
    status: "operating",
    points: [[-89, 46.8], [-86, 45.8], [-84.5, 45.5], [-83, 43], [-82.5, 42.3]],
    capacity: "540,000 bpd",
    length: "1,038 km",
    operator: "Enbridge",
    countries: ["USA", "Canada"]
  },
  {
    id: "permian-gulf",
    name: "Permian Express Pipeline",
    type: "oil",
    status: "operating",
    points: [[-102.5, 32], [-100.5, 31.5], [-98, 30], [-96.5, 29], [-95, 29.5]],
    capacity: "480,000 bpd",
    length: "830 km",
    operator: "Energy Transfer",
    countries: ["USA"]
  },
  {
    id: "capline",
    name: "Capline Pipeline",
    type: "oil",
    status: "operating",
    points: [[-89.1, 30], [-90.5, 32.3], [-90.2, 35.1], [-89, 38.6]],
    capacity: "1.2 million bpd",
    length: "1,017 km",
    operator: "Marathon/Plains",
    countries: ["USA"]
  },
  {
    id: "seaway",
    name: "Seaway Pipeline",
    type: "oil",
    status: "operating",
    points: [[-97, 36], [-96, 33], [-95.5, 30.5], [-95, 29.5]],
    capacity: "850,000 bpd",
    length: "800 km",
    operator: "Enterprise/Enbridge",
    countries: ["USA"]
  },
  {
    id: "explorer",
    name: "Explorer Pipeline",
    type: "oil",
    status: "operating",
    points: [[-95.5, 29.8], [-95, 32], [-94.5, 35], [-93, 38.5], [-90.5, 41.5], [-88, 41.9]],
    capacity: "660,000 bpd",
    length: "2,900 km",
    operator: "Explorer Pipeline",
    countries: ["USA"]
  },
  {
    id: "enbridge-mainline",
    name: "Enbridge Mainline",
    type: "oil",
    status: "operating",
    points: [[-114.1, 53.5], [-110, 53.5], [-105, 52], [-97, 49.9], [-92, 48], [-86, 46.5], [-83.5, 42.5]],
    capacity: "2.85 million bpd",
    length: "5,353 km",
    operator: "Enbridge",
    countries: ["Canada", "USA"]
  },
  // More US Oil Pipelines
  {
    id: "plantation",
    name: "Plantation Pipeline",
    type: "oil",
    status: "operating",
    points: [[-90.1, 30], [-87, 30.5], [-84.5, 33.7], [-81.1, 34], [-79, 35.5], [-77.5, 37.5]],
    capacity: "660,000 bpd",
    length: "4,800 km",
    operator: "Kinder Morgan",
    countries: ["USA"]
  },
  {
    id: "mid-valley",
    name: "Mid-Valley Pipeline",
    type: "oil",
    status: "operating",
    points: [[-90, 29.9], [-89.5, 32], [-86, 36.1], [-85.7, 38.2], [-83, 39.1], [-81.5, 41.5]],
    capacity: "320,000 bpd",
    length: "1,400 km",
    operator: "Sunoco",
    countries: ["USA"]
  },
  {
    id: "gulf-coast-pipeline",
    name: "Gulf Coast Pipeline",
    type: "oil",
    status: "operating",
    points: [[-97, 36], [-97.5, 33.5], [-96, 30.5], [-95, 29.5]],
    capacity: "700,000 bpd",
    length: "780 km",
    operator: "Enterprise Products",
    countries: ["USA"]
  },
  {
    id: "flanagan-south",
    name: "Flanagan South Pipeline",
    type: "oil",
    status: "operating",
    points: [[-88, 41.5], [-90.5, 39.5], [-94, 37], [-97, 36]],
    capacity: "600,000 bpd",
    length: "950 km",
    operator: "Enbridge",
    countries: ["USA"]
  },
  {
    id: "spearhead",
    name: "Spearhead Pipeline",
    type: "oil",
    status: "operating",
    points: [[-88, 41.5], [-90, 39.8], [-94.5, 37], [-97, 36]],
    capacity: "193,000 bpd",
    length: "1,060 km",
    operator: "Enbridge",
    countries: ["USA"]
  },
  // Russia/Europe
  {
    id: "druzhba",
    name: "Druzhba Pipeline",
    type: "oil",
    status: "operating",
    points: [[52.3, 54.7], [44, 53.2], [37.6, 52.3], [32, 52.4], [24, 52.2], [21, 52.2], [14.4, 52.5]],
    capacity: "1.2 million bpd",
    length: "5,327 km",
    operator: "Transneft",
    countries: ["Russia", "Belarus", "Poland", "Germany", "Ukraine", "Czech Republic", "Hungary"]
  },
  {
    id: "btc",
    name: "Baku-Tbilisi-Ceyhan (BTC)",
    type: "oil",
    status: "operating",
    points: [[49.9, 40.4], [47.5, 41.3], [44.8, 41.7], [41.6, 41.6], [36.8, 39.5], [35.9, 37]],
    capacity: "1.2 million bpd",
    length: "1,768 km",
    operator: "BP",
    countries: ["Azerbaijan", "Georgia", "Turkey"]
  },
  {
    id: "cpc",
    name: "Caspian Pipeline Consortium",
    type: "oil",
    status: "operating",
    points: [[53, 46.9], [49, 46], [45.5, 45.5], [40, 45], [37.4, 45]],
    capacity: "1.4 million bpd",
    length: "1,510 km",
    operator: "CPC",
    countries: ["Kazakhstan", "Russia"]
  },
  // Middle East
  {
    id: "east-west",
    name: "East-West Pipeline (Petroline)",
    type: "oil",
    status: "operating",
    points: [[50.1, 26.3], [47, 26], [44, 25.5], [41, 24], [38.5, 22.5]],
    capacity: "5 million bpd",
    length: "1,200 km",
    operator: "Saudi Aramco",
    countries: ["Saudi Arabia"]
  },
  {
    id: "sumed",
    name: "SUMED Pipeline",
    type: "oil",
    status: "operating",
    points: [[33, 29], [31.2, 30], [29.9, 31.2]],
    capacity: "2.5 million bpd",
    length: "320 km",
    operator: "SUMED",
    countries: ["Egypt"]
  },
  {
    id: "kirkuk-ceyhan",
    name: "Kirkuk-Ceyhan Pipeline",
    type: "oil",
    status: "operating",
    points: [[44.4, 35.5], [42.5, 36.5], [40, 37], [37, 37.5], [35.9, 37]],
    capacity: "1.6 million bpd",
    length: "970 km",
    operator: "BOTAS/SOMO",
    countries: ["Iraq", "Turkey"]
  },
  {
    id: "habshan-fujairah",
    name: "Habshan-Fujairah Pipeline",
    type: "oil",
    status: "operating",
    points: [[53.6, 23.9], [55, 24.8], [56.2, 25.1], [56.4, 25.1]],
    capacity: "1.5 million bpd",
    length: "370 km",
    operator: "ADNOC",
    countries: ["UAE"]
  },
  {
    id: "abqaiq-yanbu",
    name: "Abqaiq-Yanbu Pipeline",
    type: "oil",
    status: "operating",
    points: [[49.7, 25.9], [47, 26], [44, 25], [41, 24], [38, 24]],
    capacity: "3 million bpd",
    length: "1,170 km",
    operator: "Saudi Aramco",
    countries: ["Saudi Arabia"]
  },
  {
    id: "iran-turkey",
    name: "Iran-Turkey Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[48, 38.5], [45, 38.2], [43.5, 37], [42, 37.2]],
    capacity: "14 bcm/year",
    length: "2,577 km",
    operator: "NIGC/BOTAS",
    countries: ["Iran", "Turkey"]
  },
  {
    id: "igat-1",
    name: "IGAT-1 (Iranian Gas Trunkline)",
    type: "gas",
    status: "operating",
    points: [[52.5, 27.5], [51.5, 30.5], [50.5, 32.5], [48.5, 35.5], [48, 38]],
    capacity: "15 bcm/year",
    length: "1,100 km",
    operator: "NIGC",
    countries: ["Iran"]
  },
  {
    id: "south-pars-assaluyeh",
    name: "South Pars Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[52, 26], [52.5, 27.5], [52, 29.5], [51.5, 31]],
    capacity: "40 bcm/year",
    length: "900 km",
    operator: "NIGC",
    countries: ["Iran"]
  },
  {
    id: "basra-gas",
    name: "Basra Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[47.8, 30.5], [47, 31.5], [46, 32.5], [45, 33]],
    capacity: "8 bcm/year",
    length: "300 km",
    operator: "Basra Gas Company",
    countries: ["Iraq"]
  },
  {
    id: "trans-israel",
    name: "Trans-Israel Pipeline (Eilat-Ashkelon)",
    type: "oil",
    status: "operating",
    points: [[34.9, 29.6], [35, 30.5], [34.8, 31], [34.6, 31.6]],
    capacity: "600,000 bpd",
    length: "254 km",
    operator: "EAPC",
    countries: ["Israel"]
  },
  {
    id: "leviathan-ashdod",
    name: "Leviathan Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[34, 33], [34.5, 32.5], [34.6, 31.8]],
    capacity: "12 bcm/year",
    length: "120 km",
    operator: "Noble Energy",
    countries: ["Israel"]
  },
  // More Middle East Oil
  {
    id: "ain-dar-abqaiq",
    name: "Ain Dar-Abqaiq Pipeline",
    type: "oil",
    status: "operating",
    points: [[49.2, 25.4], [49.7, 25.9]],
    capacity: "2 million bpd",
    length: "50 km",
    operator: "Saudi Aramco",
    countries: ["Saudi Arabia"]
  },
  {
    id: "kuwait-oil-export",
    name: "Kuwait Oil Export Pipeline",
    type: "oil",
    status: "operating",
    points: [[47.5, 29], [48.2, 29.4], [48, 29]],
    capacity: "2 million bpd",
    length: "120 km",
    operator: "KOC",
    countries: ["Kuwait"]
  },
  {
    id: "abu-dhabi-crude",
    name: "Abu Dhabi Crude Oil Pipeline",
    type: "oil",
    status: "operating",
    points: [[54, 24], [54.5, 24.5], [55.5, 25]],
    capacity: "1.8 million bpd",
    length: "200 km",
    operator: "ADNOC",
    countries: ["UAE"]
  },
  // Africa
  {
    id: "chad-cameroon",
    name: "Chad-Cameroon Pipeline",
    type: "oil",
    status: "operating",
    points: [[16.8, 10], [14.5, 7.5], [12.5, 5.5], [10, 4]],
    capacity: "250,000 bpd",
    length: "1,070 km",
    operator: "COTCO",
    countries: ["Chad", "Cameroon"]
  },
  {
    id: "nigeria-bonny",
    name: "Trans-Niger Pipeline (Bonny)",
    type: "oil",
    status: "operating",
    points: [[6, 5.5], [6.5, 5], [7.2, 4.5]],
    capacity: "600,000 bpd",
    length: "250 km",
    operator: "Shell",
    countries: ["Nigeria"]
  },
  {
    id: "forcados-escravos",
    name: "Forcados-Escravos Pipeline",
    type: "oil",
    status: "operating",
    points: [[5.3, 5.4], [5.5, 5.2], [5.8, 5]],
    capacity: "400,000 bpd",
    length: "150 km",
    operator: "Shell/Chevron",
    countries: ["Nigeria"]
  },
  {
    id: "angola-offshore",
    name: "Angola Offshore Export Pipeline",
    type: "oil",
    status: "operating",
    points: [[12, -6.5], [12.5, -7], [13.2, -8.8]],
    capacity: "800,000 bpd",
    length: "300 km",
    operator: "Sonangol",
    countries: ["Angola"]
  },
  {
    id: "cameroon-lobe",
    name: "Cameroon Lobe Pipeline",
    type: "oil",
    status: "operating",
    points: [[9, 2.5], [9.2, 3], [9.7, 4]],
    capacity: "100,000 bpd",
    length: "180 km",
    operator: "SNH",
    countries: ["Cameroon"]
  },
  {
    id: "sudan-port",
    name: "Greater Nile Oil Pipeline",
    type: "oil",
    status: "operating",
    points: [[30, 9.5], [32, 13], [34, 16], [37.2, 19.6]],
    capacity: "500,000 bpd",
    length: "1,610 km",
    operator: "GNPOC",
    countries: ["South Sudan", "Sudan"]
  },
  // More Russia Oil
  {
    id: "baltic-pipeline",
    name: "Baltic Pipeline System (BPS)",
    type: "oil",
    status: "operating",
    points: [[50, 55], [40, 58], [32, 59.5], [28, 59.9]],
    capacity: "1.5 million bpd",
    length: "2,350 km",
    operator: "Transneft",
    countries: ["Russia"]
  },
  {
    id: "bps-2",
    name: "Baltic Pipeline System 2 (BPS-2)",
    type: "oil",
    status: "operating",
    points: [[42, 56.5], [35, 58], [30, 59], [28.5, 59.5]],
    capacity: "600,000 bpd",
    length: "1,000 km",
    operator: "Transneft",
    countries: ["Russia"]
  },
  {
    id: "northern-lights",
    name: "Surgut-Polotsk Pipeline",
    type: "oil",
    status: "operating",
    points: [[73.4, 61.2], [68, 60], [55, 57], [40, 55], [28, 55.5]],
    capacity: "900,000 bpd",
    length: "3,500 km",
    operator: "Transneft",
    countries: ["Russia", "Belarus"]
  },
  {
    id: "russia-novorossiysk",
    name: "Tikhoretsk-Novorossiysk Pipeline",
    type: "oil",
    status: "operating",
    points: [[40, 45.5], [38.5, 45], [37.8, 44.7]],
    capacity: "1 million bpd",
    length: "350 km",
    operator: "Transneft",
    countries: ["Russia"]
  },
  // More Asia Oil
  {
    id: "west-east-oil",
    name: "West-East Oil Pipeline (China)",
    type: "oil",
    status: "operating",
    points: [[87.6, 43.8], [95, 40], [105, 38.5], [114, 36], [120, 34]],
    capacity: "400,000 bpd",
    length: "4,200 km",
    operator: "CNPC",
    countries: ["China"]
  },
  {
    id: "shenyang-dalian",
    name: "Shenyang-Dalian Pipeline",
    type: "oil",
    status: "operating",
    points: [[123.4, 41.8], [122.5, 40.5], [121.6, 38.9]],
    capacity: "300,000 bpd",
    length: "450 km",
    operator: "CNPC",
    countries: ["China"]
  },
  {
    id: "lanzhou-chengdu",
    name: "Lanzhou-Chengdu Pipeline",
    type: "oil",
    status: "operating",
    points: [[103.8, 36], [104, 33], [104.1, 30.7]],
    capacity: "200,000 bpd",
    length: "880 km",
    operator: "CNPC",
    countries: ["China"]
  },
  // Asia
  {
    id: "espo",
    name: "Eastern Siberia-Pacific Ocean (ESPO)",
    type: "oil",
    status: "operating",
    points: [[114.5, 56.5], [120, 55], [126, 52], [131, 48.5], [133, 47]],
    capacity: "1.6 million bpd",
    length: "4,857 km",
    operator: "Transneft",
    countries: ["Russia"]
  },
  {
    id: "mohe-daqing",
    name: "Mohe-Daqing Pipeline (ESPO Spur)",
    type: "oil",
    status: "operating",
    points: [[124, 52], [125, 50], [126, 48.5], [125.1, 46.6]],
    capacity: "600,000 bpd",
    length: "960 km",
    operator: "CNPC",
    countries: ["Russia", "China"]
  },
  {
    id: "kazakhstan-china",
    name: "Kazakhstan-China Oil Pipeline",
    type: "oil",
    status: "operating",
    points: [[53, 47.1], [60, 45.5], [68, 43.5], [75, 43], [82, 44.2], [87.6, 43.8]],
    capacity: "400,000 bpd",
    length: "2,228 km",
    operator: "KazTransOil/CNPC",
    countries: ["Kazakhstan", "China"]
  },
  {
    id: "china-myanmar",
    name: "China-Myanmar Pipeline",
    type: "oil",
    status: "operating",
    points: [[93.2, 20.1], [96.5, 22], [98.5, 24], [100.5, 25], [102.7, 25]],
    capacity: "440,000 bpd",
    length: "771 km",
    operator: "CNPC",
    countries: ["Myanmar", "China"]
  },
  // ===== MAJOR GAS PIPELINES =====
  // Russia/Europe
  {
    id: "turkstream",
    name: "TurkStream",
    type: "gas",
    status: "operating",
    points: [[38.5, 44.6], [35, 43.5], [31, 42.5], [29, 41.3]],
    capacity: "31.5 bcm/year",
    length: "930 km",
    operator: "Gazprom",
    countries: ["Russia", "Turkey"]
  },
  {
    id: "blue-stream",
    name: "Blue Stream",
    type: "gas",
    status: "operating",
    points: [[37.8, 44.6], [35.5, 43], [33, 42], [31, 41.5]],
    capacity: "16 bcm/year",
    length: "1,213 km",
    operator: "Gazprom/BOTAS",
    countries: ["Russia", "Turkey"]
  },
  {
    id: "yamal-europe",
    name: "Yamal-Europe Pipeline",
    type: "gas",
    status: "operating",
    points: [[73.5, 67.5], [66, 64], [55, 60], [45, 57], [32, 55], [24, 53], [17, 52.5], [14, 52.5]],
    capacity: "33 bcm/year",
    length: "4,196 km",
    operator: "Gazprom",
    countries: ["Russia", "Belarus", "Poland", "Germany"]
  },
  {
    id: "trans-adriatic",
    name: "Trans Adriatic Pipeline (TAP)",
    type: "gas",
    status: "operating",
    points: [[20.1, 39.6], [19.5, 40.5], [18, 40.8], [16.5, 41]],
    capacity: "10 bcm/year",
    length: "878 km",
    operator: "TAP AG",
    countries: ["Greece", "Albania", "Italy"]
  },
  {
    id: "tanap",
    name: "Trans-Anatolian Pipeline (TANAP)",
    type: "gas",
    status: "operating",
    points: [[42, 41.6], [39, 40], [35, 39], [32, 38.5], [29, 39.5], [26.5, 40.5]],
    capacity: "16 bcm/year",
    length: "1,850 km",
    operator: "TANAP",
    countries: ["Azerbaijan", "Georgia", "Turkey"]
  },
  {
    id: "europipe-i",
    name: "Europipe I",
    type: "gas",
    status: "operating",
    points: [[2.5, 58.5], [4, 56], [6, 54.5], [8.5, 54]],
    capacity: "18 bcm/year",
    length: "620 km",
    operator: "Gassco",
    countries: ["Norway", "Germany"]
  },
  {
    id: "europipe-ii",
    name: "Europipe II",
    type: "gas",
    status: "operating",
    points: [[7, 60], [5, 57.5], [4.5, 55.5], [6.5, 54], [8.5, 53.5]],
    capacity: "24 bcm/year",
    length: "658 km",
    operator: "Gassco",
    countries: ["Norway", "Germany"]
  },
  {
    id: "langeled",
    name: "Langeled Pipeline",
    type: "gas",
    status: "operating",
    points: [[2, 61.5], [1, 59], [0, 56.5], [0.5, 53.5]],
    capacity: "25.5 bcm/year",
    length: "1,200 km",
    operator: "Gassco",
    countries: ["Norway", "UK"]
  },
  {
    id: "interconnector",
    name: "Interconnector (IUK)",
    type: "gas",
    status: "operating",
    points: [[1.3, 51.4], [2, 51.3], [3.2, 51.3]],
    capacity: "20 bcm/year",
    length: "235 km",
    operator: "Interconnector Ltd",
    countries: ["UK", "Belgium"]
  },
  {
    id: "bbl-pipeline",
    name: "BBL Pipeline",
    type: "gas",
    status: "operating",
    points: [[1.7, 52.8], [3.5, 53], [5, 53.5]],
    capacity: "15 bcm/year",
    length: "230 km",
    operator: "BBL Company",
    countries: ["UK", "Netherlands"]
  },
  {
    id: "balticconnector",
    name: "Balticconnector",
    type: "gas",
    status: "operating",
    points: [[24.8, 59.4], [24.5, 59.5], [24.7, 59.8]],
    capacity: "7.2 bcm/year",
    length: "77 km",
    operator: "Elering/Baltic Connector",
    countries: ["Estonia", "Finland"]
  },
  {
    id: "brotherhood",
    name: "Brotherhood Pipeline System",
    type: "gas",
    status: "operating",
    points: [[76, 66.5], [70, 63], [60, 58], [50, 55], [40, 52], [32, 50.5], [24, 49], [18, 48.5]],
    capacity: "100+ bcm/year",
    length: "4,500 km",
    operator: "Gazprom",
    countries: ["Russia", "Ukraine", "Slovakia", "Czech Republic"]
  },
  {
    id: "opal",
    name: "OPAL Pipeline",
    type: "gas",
    status: "operating",
    points: [[12.1, 54.1], [12.5, 52.5], [13, 51], [14.5, 50]],
    capacity: "36 bcm/year",
    length: "470 km",
    operator: "OPAL Gastransport",
    countries: ["Germany", "Czech Republic"]
  },
  {
    id: "nel",
    name: "NEL Pipeline",
    type: "gas",
    status: "operating",
    points: [[12.1, 54.1], [11, 53.8], [9.5, 53.5], [8, 53.2]],
    capacity: "20 bcm/year",
    length: "440 km",
    operator: "NEL Gastransport",
    countries: ["Germany"]
  },
  // Middle East
  {
    id: "dolphin",
    name: "Dolphin Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[51.5, 25.9], [52, 25.3], [54.4, 24.5]],
    capacity: "3.2 bcf/day",
    length: "364 km",
    operator: "Dolphin Energy",
    countries: ["Qatar", "UAE"]
  },
  {
    id: "arab-gas",
    name: "Arab Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[34.4, 31.5], [35.5, 32], [36.3, 33.9], [36, 35.5], [36.2, 36.6]],
    capacity: "10 bcm/year",
    length: "1,200 km",
    operator: "Various",
    countries: ["Egypt", "Jordan", "Syria", "Lebanon"]
  },
  // Central Asia
  {
    id: "central-asia-china",
    name: "Central Asia-China Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[62.5, 39], [66, 41.3], [69, 41], [75, 40.5], [80, 40], [87.5, 44]],
    capacity: "55 bcm/year",
    length: "1,833 km",
    operator: "CNPC",
    countries: ["Turkmenistan", "Uzbekistan", "Kazakhstan", "China"]
  },
  {
    id: "power-of-siberia",
    name: "Power of Siberia",
    type: "gas",
    status: "operating",
    points: [[118, 62], [122, 58], [127.5, 52], [130, 48.5], [127.5, 45.8]],
    capacity: "38 bcm/year",
    length: "3,000 km",
    operator: "Gazprom",
    countries: ["Russia", "China"]
  },
  // India
  {
    id: "hbj",
    name: "HBJ Pipeline (Hazira-Vijaipur-Jagdishpur)",
    type: "gas",
    status: "operating",
    points: [[72.6, 21.1], [74.5, 22.5], [76, 23.5], [79, 24], [82, 26], [83, 26.8]],
    capacity: "33 mcm/day",
    length: "2,700 km",
    operator: "GAIL",
    countries: ["India"]
  },
  {
    id: "dahej-uran",
    name: "Dahej-Uran Pipeline",
    type: "gas",
    status: "operating",
    points: [[72.6, 21.7], [72.8, 20.5], [72.9, 19]],
    capacity: "20 mcm/day",
    length: "500 km",
    operator: "GAIL",
    countries: ["India"]
  },
  {
    id: "east-india-pipeline",
    name: "East India Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[81.6, 16.5], [83, 18], [85.8, 20.3], [87, 22.5], [88.3, 22.6]],
    capacity: "16 mcm/day",
    length: "1,400 km",
    operator: "GAIL",
    countries: ["India"]
  },
  // Southeast Asia
  {
    id: "trans-thailand-malaysia",
    name: "Trans-Thailand-Malaysia Pipeline",
    type: "gas",
    status: "operating",
    points: [[101, 6.5], [101.5, 5.5], [103, 4.5], [103.8, 1.3]],
    capacity: "15 bcm/year",
    length: "1,100 km",
    operator: "PTT/Petronas",
    countries: ["Thailand", "Malaysia", "Singapore"]
  },
  {
    id: "south-sumatra-west-java",
    name: "South Sumatra-West Java Pipeline",
    type: "gas",
    status: "operating",
    points: [[104.8, -2.9], [105.5, -4.5], [106, -5.5], [106.8, -6.2]],
    capacity: "8 bcm/year",
    length: "500 km",
    operator: "Pertamina",
    countries: ["Indonesia"]
  },
  // Africa
  {
    id: "west-african-gas",
    name: "West African Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[5.5, 4.3], [2.5, 6.1], [1.2, 6.2], [0.2, 5.6]],
    capacity: "5 bcm/year",
    length: "678 km",
    operator: "WAPCo",
    countries: ["Nigeria", "Benin", "Togo", "Ghana"]
  },
  {
    id: "greenstream",
    name: "Greenstream Pipeline",
    type: "gas",
    status: "operating",
    points: [[12.5, 32.9], [12, 35], [11.5, 37], [15, 38.2]],
    capacity: "11 bcm/year",
    length: "520 km",
    operator: "Greenstream BV",
    countries: ["Libya", "Italy"]
  },
  {
    id: "medgaz",
    name: "Medgaz Pipeline",
    type: "gas",
    status: "operating",
    points: [[-0.6, 35.9], [-1.5, 36.5], [-2.5, 36.8]],
    capacity: "8 bcm/year",
    length: "210 km",
    operator: "Medgaz SA",
    countries: ["Algeria", "Spain"]
  },
  {
    id: "transmed",
    name: "TransMed Pipeline",
    type: "gas",
    status: "operating",
    points: [[3, 36.8], [8, 37], [10, 37.5], [12.5, 37.8], [14.2, 40.8]],
    capacity: "33.5 bcm/year",
    length: "2,475 km",
    operator: "Sonatrach/Eni",
    countries: ["Algeria", "Tunisia", "Italy"]
  },
  // South America
  {
    id: "bolivia-brazil",
    name: "Bolivia-Brazil Pipeline (GASBOL)",
    type: "gas",
    status: "operating",
    points: [[-63.2, -17.8], [-60, -19], [-56, -21], [-50, -22.5], [-47, -23.5]],
    capacity: "30 mcm/day",
    length: "3,150 km",
    operator: "TBG",
    countries: ["Bolivia", "Brazil"]
  },
  {
    id: "norandino",
    name: "NorAndino Pipeline",
    type: "gas",
    status: "operating",
    points: [[-63.8, -22], [-65, -23.5], [-66, -25], [-68, -24.3]],
    capacity: "8 mcm/day",
    length: "1,180 km",
    operator: "NorAndino",
    countries: ["Argentina", "Chile"]
  },
  {
    id: "gasoducto-sur",
    name: "Gasoducto del Sur",
    type: "gas",
    status: "operating",
    points: [[-68.5, -38.9], [-70, -40.5], [-71.5, -42], [-72.5, -45]],
    capacity: "12 mcm/day",
    length: "1,500 km",
    operator: "TGS",
    countries: ["Argentina"]
  },
  {
    id: "camisea",
    name: "Camisea Pipeline",
    type: "gas",
    status: "operating",
    points: [[-72.7, -11.8], [-74, -13], [-75.5, -13.5], [-77, -12]],
    capacity: "20 mcm/day",
    length: "730 km",
    operator: "TGP",
    countries: ["Peru"]
  },
  {
    id: "oleoducto-norperuano",
    name: "Oleoducto Norperuano",
    type: "oil",
    status: "operating",
    points: [[-76, -4.5], [-78, -5], [-79.5, -5.2], [-80.5, -5]],
    capacity: "200,000 bpd",
    length: "854 km",
    operator: "Petroperu",
    countries: ["Peru"]
  },
  {
    id: "ocensa",
    name: "OCENSA Pipeline",
    type: "oil",
    status: "operating",
    points: [[-72, 4.5], [-73.5, 5.5], [-74.5, 6.5], [-75, 8], [-75.5, 10.5]],
    capacity: "590,000 bpd",
    length: "830 km",
    operator: "OCENSA",
    countries: ["Colombia"]
  },
  {
    id: "cano-limon",
    name: "Cano Limon Pipeline",
    type: "oil",
    status: "operating",
    points: [[-70.2, 6.8], [-71.5, 7], [-73, 8.5], [-74.8, 10.9]],
    capacity: "220,000 bpd",
    length: "780 km",
    operator: "Ecopetrol",
    countries: ["Colombia"]
  },
  // Australia/Pacific
  {
    id: "moomba-sydney",
    name: "Moomba-Sydney Pipeline",
    type: "gas",
    status: "operating",
    points: [[140, -28.1], [145, -31], [148, -33], [151.2, -33.9]],
    capacity: "14.6 bcm/year",
    length: "2,081 km",
    operator: "APA Group",
    countries: ["Australia"]
  },
  {
    id: "dampier-bunbury",
    name: "Dampier-Bunbury Pipeline",
    type: "gas",
    status: "operating",
    points: [[116.7, -20.7], [116.5, -24], [116, -28], [115.6, -33.3]],
    capacity: "32 bcm/year",
    length: "1,530 km",
    operator: "DBP",
    countries: ["Australia"]
  },
  {
    id: "eastern-gas-pipeline",
    name: "Eastern Gas Pipeline",
    type: "gas",
    status: "operating",
    points: [[147, -38], [148.5, -36.5], [150, -35.5], [151.2, -33.9]],
    capacity: "8.7 bcm/year",
    length: "795 km",
    operator: "Jemena",
    countries: ["Australia"]
  },
  {
    id: "roma-brisbane",
    name: "Roma-Brisbane Pipeline",
    type: "gas",
    status: "operating",
    points: [[148.8, -26.6], [150, -26.5], [152, -27], [153, -27.5]],
    capacity: "6 bcm/year",
    length: "440 km",
    operator: "APA Group",
    countries: ["Australia"]
  },
  {
    id: "south-west-qld-pipeline",
    name: "South West Queensland Pipeline",
    type: "gas",
    status: "operating",
    points: [[141.5, -28], [144, -27.5], [147, -27], [149, -26.5]],
    capacity: "10 bcm/year",
    length: "937 km",
    operator: "APA Group",
    countries: ["Australia"]
  }
];

// shared/ports-data.ts
var PORTS = [
  // Top Container Ports
  { id: "shanghai", name: "Port of Shanghai", lat: 31.23, lon: 121.47, country: "China", type: "container", rank: 1, note: "World's busiest container port. 47M+ TEU." },
  { id: "singapore", name: "Port of Singapore", lat: 1.26, lon: 103.84, country: "Singapore", type: "mixed", rank: 2, note: "Major transshipment hub. Malacca Strait gateway. 37M+ TEU." },
  { id: "ningbo", name: "Ningbo-Zhoushan", lat: 29.87, lon: 121.55, country: "China", type: "mixed", rank: 3, note: "Largest cargo throughput globally. 33M+ TEU." },
  { id: "shenzhen", name: "Port of Shenzhen", lat: 22.52, lon: 114.05, country: "China", type: "container", rank: 4, note: "South China gateway. Yantian terminal. 30M+ TEU." },
  { id: "guangzhou", name: "Port of Guangzhou", lat: 23.08, lon: 113.24, country: "China", type: "mixed", rank: 5, note: "Pearl River Delta. Nansha terminal. 24M+ TEU." },
  { id: "qingdao", name: "Port of Qingdao", lat: 36.07, lon: 120.31, country: "China", type: "mixed", rank: 6, note: "North China hub. PLA Navy North Sea Fleet nearby." },
  { id: "busan", name: "Port of Busan", lat: 35.1, lon: 129.04, country: "South Korea", type: "container", rank: 7, note: "Northeast Asia transshipment hub. 22M+ TEU." },
  { id: "tianjin", name: "Port of Tianjin", lat: 38.99, lon: 117.7, country: "China", type: "mixed", rank: 8, note: "Beijing's maritime gateway. 21M+ TEU." },
  { id: "hong_kong", name: "Port of Hong Kong", lat: 22.29, lon: 114.15, country: "China (SAR)", type: "container", rank: 9, note: "Historic transshipment hub. 16M+ TEU." },
  { id: "rotterdam", name: "Port of Rotterdam", lat: 51.9, lon: 4.5, country: "Netherlands", type: "mixed", rank: 10, note: "Europe's largest port. Gateway to EU. 14M+ TEU." },
  { id: "jebel_ali", name: "Jebel Ali (Dubai)", lat: 25.01, lon: 55.06, country: "UAE", type: "container", rank: 11, note: "Middle East's largest port. DP World hub. 14M+ TEU." },
  { id: "antwerp", name: "Port of Antwerp-Bruges", lat: 51.26, lon: 4.4, country: "Belgium", type: "mixed", rank: 12, note: "Europe's second largest. Petrochemicals hub. 13M+ TEU." },
  { id: "klang", name: "Port Klang", lat: 3, lon: 101.39, country: "Malaysia", type: "container", rank: 13, note: "Malacca Strait. Westports terminal. 13M+ TEU." },
  { id: "xiamen", name: "Port of Xiamen", lat: 24.45, lon: 118.08, country: "China", type: "container", rank: 14, note: "Taiwan Strait. Strategic location. 12M+ TEU." },
  { id: "kaohsiung", name: "Port of Kaohsiung", lat: 22.61, lon: 120.28, country: "Taiwan", type: "container", rank: 15, note: "Taiwan's largest port. Semiconductor exports. 9M+ TEU." },
  { id: "los_angeles", name: "Port of Los Angeles", lat: 33.73, lon: -118.26, country: "USA", type: "container", rank: 16, note: "Western Hemisphere busiest. US-Asia trade gateway. 9M+ TEU." },
  { id: "long_beach", name: "Port of Long Beach", lat: 33.75, lon: -118.2, country: "USA", type: "container", rank: 17, note: "Handles 40% of US container imports with LA. 8M+ TEU." },
  { id: "tanjung_pelepas", name: "Tanjung Pelepas", lat: 1.37, lon: 103.55, country: "Malaysia", type: "container", rank: 18, note: "Maersk hub. Singapore competitor. 11M+ TEU." },
  { id: "hamburg", name: "Port of Hamburg", lat: 53.54, lon: 9.99, country: "Germany", type: "container", rank: 19, note: "Germany's largest. North Sea-Baltic connector. 8M+ TEU." },
  { id: "laem_chabang", name: "Laem Chabang", lat: 13.08, lon: 100.88, country: "Thailand", type: "container", rank: 20, note: "Thailand's main port. EEC hub. 8M+ TEU." },
  { id: "new_york_nj", name: "Port of NY/NJ", lat: 40.67, lon: -74.04, country: "USA", type: "container", rank: 21, note: "US East Coast largest. Newark/Elizabeth terminals. 9M+ TEU." },
  { id: "piraeus", name: "Port of Piraeus", lat: 37.94, lon: 23.65, country: "Greece", type: "container", rank: 25, note: "COSCO-operated. China's Mediterranean gateway. 5M+ TEU." },
  // Critical Oil/LNG Terminals
  { id: "ras_tanura", name: "Ras Tanura", lat: 26.64, lon: 50.16, country: "Saudi Arabia", type: "oil", note: "World's largest offshore oil terminal. Saudi Aramco. 6.5M+ bpd." },
  { id: "fujairah", name: "Port of Fujairah", lat: 25.12, lon: 56.35, country: "UAE", type: "oil", note: "Major bunkering hub. Hormuz bypass. Outside Persian Gulf." },
  { id: "kharg_island", name: "Kharg Island", lat: 29.23, lon: 50.31, country: "Iran", type: "oil", note: "Iran's main oil export terminal. 90%+ of oil exports." },
  { id: "ras_laffan", name: "Ras Laffan", lat: 25.93, lon: 51.54, country: "Qatar", type: "lng", note: "World's largest LNG export facility. 77M+ tonnes/year." },
  { id: "houston", name: "Port of Houston", lat: 29.73, lon: -95.02, country: "USA", type: "mixed", note: "US oil/petrochemical hub. 2nd busiest US port by tonnage." },
  { id: "sabine_pass", name: "Sabine Pass LNG", lat: 29.73, lon: -93.87, country: "USA", type: "lng", note: "Largest US LNG export terminal. Cheniere Energy." },
  { id: "novorossiysk", name: "Novorossiysk", lat: 44.72, lon: 37.77, country: "Russia", type: "oil", note: "Russia's largest Black Sea port. CPC terminal. 140M+ tonnes/year." },
  { id: "primorsk", name: "Primorsk", lat: 60.35, lon: 28.62, country: "Russia", type: "oil", note: "Baltic Sea oil terminal. Russia's largest oil port." },
  // Strategic Chokepoint Ports
  { id: "port_said", name: "Port Said", lat: 31.26, lon: 32.3, country: "Egypt", type: "mixed", note: "Suez Canal northern entrance. 12% of global trade." },
  { id: "suez_port", name: "Port of Suez", lat: 29.97, lon: 32.55, country: "Egypt", type: "mixed", note: "Suez Canal southern terminus. Red Sea access." },
  { id: "gibraltar", name: "Port of Gibraltar", lat: 36.14, lon: -5.35, country: "UK (Gibraltar)", type: "naval", note: "Mediterranean-Atlantic gateway. UK naval base." },
  { id: "djibouti", name: "Port of Djibouti", lat: 11.59, lon: 43.15, country: "Djibouti", type: "mixed", note: "Bab el-Mandeb gateway. Chinese + US military bases." },
  { id: "aden", name: "Port of Aden", lat: 12.79, lon: 45.03, country: "Yemen", type: "mixed", note: "Red Sea strategic port. Houthi conflict area." },
  { id: "hodeidah", name: "Port of Hodeidah", lat: 14.8, lon: 42.95, country: "Yemen", type: "bulk", note: "Yemen's main humanitarian port. Houthi-controlled." },
  { id: "bandar_abbas", name: "Bandar Abbas", lat: 27.18, lon: 56.28, country: "Iran", type: "mixed", note: "Iran's largest container port. Hormuz Strait." },
  { id: "colon", name: "Port of Colon", lat: 9.35, lon: -79.9, country: "Panama", type: "container", note: "Panama Canal Atlantic side. Major transshipment." },
  { id: "balboa", name: "Port of Balboa", lat: 8.95, lon: -79.56, country: "Panama", type: "container", note: "Panama Canal Pacific terminus. Americas hub." },
  { id: "algeciras", name: "Port of Algeciras", lat: 36.13, lon: -5.43, country: "Spain", type: "container", note: "Gibraltar Strait. Maersk transshipment hub. 5M+ TEU." },
  // Strategic Naval Ports
  { id: "zhanjiang", name: "Zhanjiang", lat: 21.2, lon: 110.4, country: "China", type: "naval", note: "PLA Navy South Sea Fleet HQ. Carrier base." },
  { id: "yulin", name: "Yulin Naval Base", lat: 18.23, lon: 109.52, country: "China", type: "naval", note: "Hainan Island. Nuclear submarine base. SCS control." },
  { id: "vladivostok", name: "Port of Vladivostok", lat: 43.12, lon: 131.88, country: "Russia", type: "naval", note: "Russian Pacific Fleet HQ. Trans-Siberian terminus." },
  { id: "murmansk", name: "Port of Murmansk", lat: 68.97, lon: 33.05, country: "Russia", type: "naval", note: "Arctic ice-free port. Northern Fleet base." },
  { id: "gwadar", name: "Gwadar", lat: 25.12, lon: 62.33, country: "Pakistan", type: "mixed", note: "Chinese CPEC port. Strategic PLA Navy interest." },
  { id: "hambantota", name: "Hambantota", lat: 6.12, lon: 81.12, country: "Sri Lanka", type: "mixed", note: "Chinese 99-year lease. Indian Ocean strategic." },
  { id: "chabahar", name: "Chabahar", lat: 25.3, lon: 60.6, country: "Iran", type: "mixed", note: "India-developed port. Hormuz bypass. Afghanistan access." },
  // Major Regional Ports
  { id: "colombo", name: "Port of Colombo", lat: 6.94, lon: 79.84, country: "Sri Lanka", type: "container", note: "Indian Ocean transshipment hub. 7M+ TEU." },
  { id: "yokohama", name: "Port of Yokohama", lat: 35.44, lon: 139.64, country: "Japan", type: "container", note: "Tokyo Bay. Japan's 2nd largest. US 7th Fleet logistics." },
  { id: "nagoya", name: "Port of Nagoya", lat: 35.05, lon: 136.88, country: "Japan", type: "mixed", note: "Japan's largest by cargo. Toyota/auto exports." },
  { id: "felixstowe", name: "Port of Felixstowe", lat: 51.95, lon: 1.33, country: "UK", type: "container", note: "UK's busiest container port. 4M+ TEU." },
  { id: "le_havre", name: "Port of Le Havre", lat: 49.48, lon: 0.11, country: "France", type: "container", note: "France's largest container port. Paris gateway." },
  { id: "savannah", name: "Port of Savannah", lat: 32.08, lon: -81.09, country: "USA", type: "container", note: "Fastest growing US port. 5M+ TEU." },
  { id: "norfolk", name: "Port of Virginia", lat: 36.95, lon: -76.33, country: "USA", type: "mixed", note: "Adjacent to Norfolk Naval Base. 3M+ TEU." },
  { id: "santos", name: "Port of Santos", lat: -23.95, lon: -46.3, country: "Brazil", type: "mixed", note: "Latin America's busiest port. Sao Paulo gateway." },
  { id: "manzanillo", name: "Port of Manzanillo", lat: 19.05, lon: -104.32, country: "Mexico", type: "container", note: "Mexico's busiest port. Pacific gateway. USMCA trade corridor." },
  { id: "lazaro_cardenas", name: "Lazaro Cardenas", lat: 17.94, lon: -102.18, country: "Mexico", type: "mixed", note: "Mexico's 2nd largest. Asia-Mexico deep-water. Cartel smuggling route." },
  { id: "veracruz", name: "Port of Veracruz", lat: 19.2, lon: -96.13, country: "Mexico", type: "mixed", note: "Largest Gulf of Mexico port in Mexico. US-Mexico trade hub." },
  { id: "karachi", name: "Port of Karachi", lat: 24.84, lon: 67, country: "Pakistan", type: "mixed", note: "Pakistan's largest port. Naval HQ. 2M+ TEU." },
  { id: "nhava_sheva", name: "Nhava Sheva (JNPT)", lat: 18.95, lon: 72.95, country: "India", type: "container", note: "India's busiest container port. Mumbai gateway. 6M+ TEU." },
  { id: "chennai", name: "Port of Chennai", lat: 13.1, lon: 80.29, country: "India", type: "container", note: "India's 2nd largest. Auto industry. Bay of Bengal." },
  { id: "mundra", name: "Mundra Port", lat: 22.73, lon: 69.72, country: "India", type: "mixed", note: "India's largest private port. Adani Group." }
];

// shared/analysis-infrastructure-cascade.ts
var COUNTRY_NAMES = {
  US: "United States",
  GB: "United Kingdom",
  ES: "Spain",
  FR: "France",
  DE: "Germany",
  IT: "Italy",
  PT: "Portugal",
  NO: "Norway",
  DK: "Denmark",
  NL: "Netherlands",
  BE: "Belgium",
  SE: "Sweden",
  FI: "Finland",
  IE: "Ireland",
  AT: "Austria",
  CH: "Switzerland",
  GR: "Greece",
  CZ: "Czech Republic",
  JP: "Japan",
  CN: "China",
  TW: "Taiwan",
  HK: "Hong Kong",
  SG: "Singapore",
  KR: "South Korea",
  AU: "Australia",
  NZ: "New Zealand",
  IN: "India",
  PK: "Pakistan",
  AE: "UAE",
  SA: "Saudi Arabia",
  EG: "Egypt",
  KW: "Kuwait",
  BH: "Bahrain",
  OM: "Oman",
  QA: "Qatar",
  IR: "Iran",
  IQ: "Iraq",
  TR: "Turkey",
  IL: "Israel",
  JO: "Jordan",
  LB: "Lebanon",
  SY: "Syria",
  YE: "Yemen",
  NG: "Nigeria",
  ZA: "South Africa",
  KE: "Kenya",
  TZ: "Tanzania",
  MZ: "Mozambique",
  MG: "Madagascar",
  SN: "Senegal",
  GH: "Ghana",
  CI: "Ivory Coast",
  AO: "Angola",
  ET: "Ethiopia",
  UG: "Uganda",
  BR: "Brazil",
  AR: "Argentina",
  CL: "Chile",
  PE: "Peru",
  CO: "Colombia",
  MX: "Mexico",
  PA: "Panama",
  VE: "Venezuela",
  IS: "Iceland",
  FO: "Faroe Islands",
  FJ: "Fiji",
  ID: "Indonesia",
  VN: "Vietnam",
  TH: "Thailand",
  MY: "Malaysia",
  PH: "Philippines",
  RU: "Russia",
  UA: "Ukraine",
  PL: "Poland",
  RO: "Romania",
  HU: "Hungary",
  CA: "Canada",
  DJ: "Djibouti",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  MM: "Myanmar"
};
function addCablesAsNodes(graph, cables) {
  for (const cable of cables) {
    const firstPoint = cable.points?.[0];
    graph.nodes.set(`cable:${cable.id}`, {
      id: `cable:${cable.id}`,
      type: "cable",
      name: cable.name,
      coordinates: firstPoint ? [firstPoint[0], firstPoint[1]] : void 0,
      metadata: {
        capacityTbps: cable.capacityTbps,
        rfsYear: cable.rfsYear,
        owners: cable.owners,
        landingPoints: cable.landingPoints
      }
    });
  }
}
function addPipelinesAsNodes(graph, pipelines) {
  for (const pipeline of pipelines) {
    const firstPoint = pipeline.points?.[0];
    graph.nodes.set(`pipeline:${pipeline.id}`, {
      id: `pipeline:${pipeline.id}`,
      type: "pipeline",
      name: pipeline.name,
      coordinates: firstPoint ? [firstPoint[0], firstPoint[1]] : void 0,
      metadata: {
        type: pipeline.type,
        status: pipeline.status,
        capacity: pipeline.capacity,
        operator: pipeline.operator,
        countries: pipeline.countries
      }
    });
  }
}
function addPortsAsNodes(graph, ports) {
  for (const port of ports) {
    graph.nodes.set(`port:${port.id}`, {
      id: `port:${port.id}`,
      type: "port",
      name: port.name,
      coordinates: [port.lon, port.lat],
      metadata: {
        country: port.country,
        type: port.type,
        rank: port.rank
      }
    });
  }
}
function addChokepointsAsNodes(graph, waterways) {
  for (const waterway of waterways) {
    graph.nodes.set(`chokepoint:${waterway.id}`, {
      id: `chokepoint:${waterway.id}`,
      type: "chokepoint",
      name: waterway.name,
      coordinates: [waterway.lon, waterway.lat],
      metadata: {
        description: waterway.description
      }
    });
  }
}
function addCountriesAsNodes(graph, cables, pipelines) {
  const countries = /* @__PURE__ */ new Set();
  for (const cable of cables) {
    cable.countriesServed?.forEach((c) => countries.add(c.country));
    cable.landingPoints?.forEach((lp) => countries.add(lp.country));
  }
  for (const pipeline of pipelines) {
    pipeline.countries?.forEach((c) => {
      const code = c === "USA" ? "US" : c === "Canada" ? "CA" : c;
      countries.add(code);
    });
  }
  for (const code of countries) {
    graph.nodes.set(`country:${code}`, {
      id: `country:${code}`,
      type: "country",
      name: COUNTRY_NAMES[code] || code,
      metadata: { code }
    });
  }
}
function addEdge(graph, edge) {
  graph.edges.push(edge);
  if (!graph.outgoing.has(edge.from)) graph.outgoing.set(edge.from, []);
  graph.outgoing.get(edge.from).push(edge);
  if (!graph.incoming.has(edge.to)) graph.incoming.set(edge.to, []);
  graph.incoming.get(edge.to).push(edge);
}
function buildCableCountryEdges(graph, cables) {
  for (const cable of cables) {
    const cableId = `cable:${cable.id}`;
    cable.countriesServed?.forEach((cs) => {
      const countryId = `country:${cs.country}`;
      addEdge(graph, {
        from: cableId,
        to: countryId,
        type: "serves",
        strength: cs.capacityShare,
        redundancy: cs.isRedundant ? 0.5 : 0,
        metadata: {
          capacityShare: cs.capacityShare,
          estimatedImpact: cs.isRedundant ? "Medium - redundancy available" : "High - limited redundancy"
        }
      });
    });
    cable.landingPoints?.forEach((lp) => {
      const countryId = `country:${lp.country}`;
      addEdge(graph, {
        from: cableId,
        to: countryId,
        type: "lands_at",
        strength: 0.3,
        redundancy: 0.5
      });
    });
  }
}
function buildPipelineCountryEdges(graph, pipelines) {
  for (const pipeline of pipelines) {
    const pipelineId = `pipeline:${pipeline.id}`;
    pipeline.countries?.forEach((country) => {
      const code = country === "USA" ? "US" : country === "Canada" ? "CA" : country;
      const countryId = `country:${code}`;
      if (graph.nodes.has(countryId)) {
        addEdge(graph, {
          from: pipelineId,
          to: countryId,
          type: "serves",
          strength: 0.2,
          redundancy: 0.3
        });
      }
    });
  }
}
function normalizeCountryCode(country) {
  const mappings = {
    "USA": "US",
    "China": "CN",
    "China (SAR)": "CN",
    "Taiwan": "TW",
    "South Korea": "KR",
    "Netherlands": "NL",
    "Belgium": "BE",
    "Malaysia": "MY",
    "Thailand": "TH",
    "Greece": "GR",
    "Saudi Arabia": "SA",
    "Iran": "IR",
    "Qatar": "QA",
    "Russia": "RU",
    "Egypt": "EG",
    "UK (Gibraltar)": "GB",
    "Djibouti": "DJ",
    "Yemen": "YE",
    "Panama": "PA",
    "Spain": "ES",
    "Pakistan": "PK",
    "Sri Lanka": "LK",
    "Japan": "JP",
    "UK": "GB",
    "France": "FR",
    "Brazil": "BR",
    "India": "IN",
    "Singapore": "SG",
    "Germany": "DE",
    "UAE": "AE"
  };
  return mappings[country] || country;
}
function getPortImportance(port) {
  const typeWeight = {
    "oil": 0.9,
    // Oil disruption = major
    "lng": 0.85,
    // LNG disruption = major
    "container": 0.7,
    "mixed": 0.6,
    "bulk": 0.5,
    "naval": 0.4
    // Naval = geopolitical but less economic
  };
  const baseWeight = typeWeight[port.type] || 0.5;
  const rankBoost = port.rank ? Math.max(0, (20 - port.rank) / 20) * 0.3 : 0;
  return Math.min(1, baseWeight + rankBoost);
}
function buildPortCountryEdges(graph, ports) {
  for (const port of ports) {
    const portId = `port:${port.id}`;
    const countryCode = normalizeCountryCode(port.country);
    const countryId = `country:${countryCode}`;
    if (!graph.nodes.has(countryId)) {
      graph.nodes.set(countryId, {
        id: countryId,
        type: "country",
        name: COUNTRY_NAMES[countryCode] || port.country,
        metadata: { code: countryCode }
      });
    }
    const importance = getPortImportance(port);
    addEdge(graph, {
      from: portId,
      to: countryId,
      type: "serves",
      strength: importance,
      redundancy: port.rank && port.rank <= 5 ? 0.2 : 0.4,
      // Major ports harder to replace
      metadata: {
        portType: port.type,
        estimatedImpact: importance > 0.7 ? "Critical port for country" : "Regional port"
      }
    });
    const affectedCountries = getAffectedCountries(port);
    for (const affected of affectedCountries) {
      const affectedCountryId = `country:${affected.code}`;
      if (!graph.nodes.has(affectedCountryId)) {
        graph.nodes.set(affectedCountryId, {
          id: affectedCountryId,
          type: "country",
          name: COUNTRY_NAMES[affected.code] || affected.code,
          metadata: { code: affected.code }
        });
      }
      addEdge(graph, {
        from: portId,
        to: affectedCountryId,
        type: "trade_route",
        strength: affected.strength,
        redundancy: 0.5,
        metadata: {
          relationship: affected.reason
        }
      });
    }
  }
}
function getAffectedCountries(port) {
  const affected = [];
  if (port.id === "port_said" || port.id === "suez_port") {
    affected.push(
      { code: "DE", strength: 0.6, reason: "Major EU importer via Suez" },
      { code: "GB", strength: 0.5, reason: "UK-Asia trade" },
      { code: "NL", strength: 0.5, reason: "Rotterdam connection" },
      { code: "CN", strength: 0.4, reason: "China-EU trade route" },
      { code: "IT", strength: 0.4, reason: "Mediterranean trade" }
    );
  }
  if (port.id === "bandar_abbas" || port.id === "fujairah" || port.id === "ras_tanura") {
    affected.push(
      { code: "JP", strength: 0.7, reason: "Oil import dependency" },
      { code: "KR", strength: 0.6, reason: "Oil import dependency" },
      { code: "IN", strength: 0.5, reason: "Oil imports" },
      { code: "CN", strength: 0.5, reason: "Oil imports" }
    );
  }
  if (port.id === "singapore" || port.id === "klang" || port.id === "tanjung_pelepas") {
    affected.push(
      { code: "CN", strength: 0.6, reason: "Trade route dependency" },
      { code: "JP", strength: 0.5, reason: "Trade route" },
      { code: "KR", strength: 0.5, reason: "Trade route" }
    );
  }
  if (port.id === "colon" || port.id === "balboa") {
    affected.push(
      { code: "US", strength: 0.5, reason: "East-West coast shipping" },
      { code: "CN", strength: 0.4, reason: "Trade route to US East Coast" }
    );
  }
  if (port.id === "aden" || port.id === "djibouti" || port.id === "hodeidah") {
    affected.push(
      { code: "DE", strength: 0.5, reason: "Europe-Asia shipping route" },
      { code: "GB", strength: 0.5, reason: "Shipping route" },
      { code: "IT", strength: 0.4, reason: "Mediterranean access" },
      { code: "SA", strength: 0.4, reason: "Regional trade" }
    );
  }
  return affected;
}
function buildChokepointEdges(graph, waterways, ports) {
  for (const waterway of waterways) {
    const chokepointId = `chokepoint:${waterway.id}`;
    const nearbyPorts = ports.filter((port) => {
      const dist = haversineKm(waterway.lat, waterway.lon, port.lat, port.lon);
      return dist < 500;
    });
    for (const port of nearbyPorts) {
      addEdge(graph, {
        from: chokepointId,
        to: `port:${port.id}`,
        type: "controls_access",
        strength: 0.7,
        redundancy: 0.2,
        metadata: {
          relationship: "Access controlled by chokepoint"
        }
      });
    }
    const dependentCountries = getChokepointDependentCountries(waterway.id);
    for (const dep of dependentCountries) {
      const countryId = `country:${dep.code}`;
      if (!graph.nodes.has(countryId)) {
        graph.nodes.set(countryId, {
          id: countryId,
          type: "country",
          name: COUNTRY_NAMES[dep.code] || dep.code,
          metadata: { code: dep.code }
        });
      }
      addEdge(graph, {
        from: chokepointId,
        to: countryId,
        type: "trade_dependency",
        strength: dep.strength,
        redundancy: dep.redundancy,
        metadata: {
          relationship: dep.reason
        }
      });
    }
  }
}
function getChokepointDependentCountries(chokepointId) {
  const dependencies = {
    "suez": [
      { code: "DE", strength: 0.6, redundancy: 0.3, reason: "EU-Asia trade" },
      { code: "IT", strength: 0.5, redundancy: 0.3, reason: "Mediterranean" },
      { code: "GB", strength: 0.5, redundancy: 0.4, reason: "UK-Asia trade" },
      { code: "CN", strength: 0.4, redundancy: 0.5, reason: "China-EU exports" }
    ],
    "hormuz_strait": [
      { code: "JP", strength: 0.8, redundancy: 0.2, reason: "80% oil imports" },
      { code: "KR", strength: 0.7, redundancy: 0.2, reason: "70% oil imports" },
      { code: "IN", strength: 0.6, redundancy: 0.3, reason: "60% oil imports" },
      { code: "CN", strength: 0.5, redundancy: 0.4, reason: "40% oil imports" }
    ],
    "malacca_strait": [
      { code: "CN", strength: 0.7, redundancy: 0.3, reason: "80% oil imports transit" },
      { code: "JP", strength: 0.6, redundancy: 0.3, reason: "Trade route" },
      { code: "KR", strength: 0.6, redundancy: 0.3, reason: "Trade route" }
    ],
    "bab_el_mandeb": [
      { code: "DE", strength: 0.5, redundancy: 0.4, reason: "EU shipping" },
      { code: "GB", strength: 0.5, redundancy: 0.4, reason: "UK shipping" },
      { code: "SA", strength: 0.4, redundancy: 0.5, reason: "Red Sea access" }
    ],
    "panama": [
      { code: "US", strength: 0.5, redundancy: 0.4, reason: "Inter-coast shipping" },
      { code: "CN", strength: 0.4, redundancy: 0.5, reason: "US East trade" }
    ],
    "gibraltar": [
      { code: "ES", strength: 0.4, redundancy: 0.5, reason: "Med access" },
      { code: "IT", strength: 0.3, redundancy: 0.5, reason: "Atlantic trade" }
    ],
    "bosphorus": [
      { code: "RU", strength: 0.6, redundancy: 0.3, reason: "Black Sea access" },
      { code: "UA", strength: 0.6, redundancy: 0.3, reason: "Grain exports" },
      { code: "RO", strength: 0.4, redundancy: 0.4, reason: "Black Sea trade" }
    ],
    "dardanelles": [
      { code: "RU", strength: 0.5, redundancy: 0.3, reason: "Black Sea access" },
      { code: "UA", strength: 0.5, redundancy: 0.3, reason: "Grain exports" }
    ],
    "taiwan_strait": [
      { code: "TW", strength: 0.9, redundancy: 0.1, reason: "Taiwan trade lifeline" },
      { code: "JP", strength: 0.5, redundancy: 0.4, reason: "Trade route" },
      { code: "KR", strength: 0.4, redundancy: 0.4, reason: "Trade route" }
    ]
  };
  return dependencies[chokepointId] || [];
}
function buildDependencyGraph(inputs) {
  const cables = inputs.cables;
  const pipelines = inputs.pipelines ?? PIPELINES;
  const ports = inputs.ports ?? PORTS;
  const waterways = inputs.waterways;
  const graph = {
    nodes: /* @__PURE__ */ new Map(),
    edges: [],
    outgoing: /* @__PURE__ */ new Map(),
    incoming: /* @__PURE__ */ new Map(),
    cables
  };
  addCablesAsNodes(graph, cables);
  addPipelinesAsNodes(graph, pipelines);
  addPortsAsNodes(graph, ports);
  addChokepointsAsNodes(graph, waterways);
  addCountriesAsNodes(graph, cables, pipelines);
  buildCableCountryEdges(graph, cables);
  buildPipelineCountryEdges(graph, pipelines);
  buildPortCountryEdges(graph, ports);
  buildChokepointEdges(graph, waterways, ports);
  return graph;
}
function categorizeImpact(strength) {
  if (strength > 0.8) return "critical";
  if (strength > 0.5) return "high";
  if (strength > 0.2) return "medium";
  return "low";
}
function calculateCascade(graph, sourceId, disruptionLevel = 1) {
  const source = graph.nodes.get(sourceId);
  if (!source) return null;
  const affected = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  visited.add(sourceId);
  const queue = [
    { nodeId: sourceId, depth: 0, path: [sourceId] }
  ];
  while (queue.length > 0) {
    const { nodeId, depth, path } = queue.shift();
    if (depth >= 3) continue;
    const dependents = graph.outgoing.get(nodeId) || [];
    for (const edge of dependents) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      const impactStrength = edge.strength * disruptionLevel * (1 - (edge.redundancy || 0));
      const targetNode = graph.nodes.get(edge.to);
      if (!targetNode || impactStrength < 0.05) continue;
      affected.set(edge.to, {
        node: targetNode,
        impactLevel: categorizeImpact(impactStrength),
        pathLength: depth + 1,
        dependencyChain: [...path, edge.to],
        redundancyAvailable: (edge.redundancy || 0) > 0.3,
        estimatedRecovery: edge.metadata?.estimatedImpact
      });
      queue.push({
        nodeId: edge.to,
        depth: depth + 1,
        path: [...path, edge.to]
      });
    }
  }
  const countriesAffected = [];
  for (const [nodeId, affectedNode] of affected) {
    if (affectedNode.node.type === "country") {
      const code = affectedNode.node.metadata?.code || nodeId.replace("country:", "");
      countriesAffected.push({
        country: code,
        countryName: affectedNode.node.name,
        impactLevel: affectedNode.impactLevel,
        affectedCapacity: getCapacityForCountry(sourceId, code, graph, affectedNode.dependencyChain)
      });
    }
  }
  countriesAffected.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.impactLevel] - order[b.impactLevel] || b.affectedCapacity - a.affectedCapacity;
  });
  const redundancies = findRedundancies(graph, sourceId);
  return {
    source,
    affectedNodes: Array.from(affected.values()),
    countriesAffected,
    redundancies
  };
}
function getCapacityForCountry(sourceId, countryCode, graph, dependencyChain) {
  if (sourceId.startsWith("cable:")) {
    const cableId = sourceId.replace("cable:", "");
    const cable = graph.cables.find((c) => c.id === cableId);
    const countryData = cable?.countriesServed?.find((cs) => cs.country === countryCode);
    return countryData?.capacityShare || 0;
  }
  const countryId = `country:${countryCode}`;
  const outgoing = graph.outgoing.get(sourceId) || [];
  const direct = outgoing.filter((e) => e.to === countryId);
  if (direct.length > 0) {
    const effective = direct.map((e) => e.strength * (1 - (e.redundancy || 0)));
    return Math.max(...effective);
  }
  if (dependencyChain.length > 2) {
    let pathCapacity = 1;
    for (let i = 0; i < dependencyChain.length - 1; i++) {
      const from = dependencyChain[i];
      const to = dependencyChain[i + 1];
      const stepEdges = graph.outgoing.get(from) || [];
      const edge = stepEdges.find((e) => e.to === to);
      if (edge) {
        pathCapacity *= edge.strength * (1 - (edge.redundancy || 0));
      } else {
        pathCapacity = 0;
        break;
      }
    }
    if (pathCapacity > 0) return pathCapacity;
  }
  return 0;
}
function findRedundancies(graph, sourceId) {
  if (!sourceId.startsWith("cable:")) return [];
  const cableId = sourceId.replace("cable:", "");
  const sourceCable = graph.cables.find((c) => c.id === cableId);
  if (!sourceCable) return [];
  const sourceCountries = new Set(sourceCable.countriesServed?.map((c) => c.country) || []);
  const alternatives = [];
  for (const cable of graph.cables) {
    if (cable.id === cableId) continue;
    const sharedCountries = cable.countriesServed?.filter((c) => sourceCountries.has(c.country)) || [];
    if (sharedCountries.length > 0) {
      const avgCapacity = sharedCountries.reduce((sum, c) => sum + c.capacityShare, 0) / sharedCountries.length;
      alternatives.push({
        id: cable.id,
        name: cable.name,
        capacityShare: avgCapacity
      });
    }
  }
  return alternatives.slice(0, 5);
}
function getGraphStats(graph) {
  let cables = 0, pipelines = 0, ports = 0, chokepoints = 0, countries = 0;
  for (const node of graph.nodes.values()) {
    if (node.type === "cable") cables++;
    else if (node.type === "pipeline") pipelines++;
    else if (node.type === "port") ports++;
    else if (node.type === "chokepoint") chokepoints++;
    else if (node.type === "country") countries++;
  }
  return {
    nodes: graph.nodes.size,
    edges: graph.edges.length,
    cables,
    pipelines,
    ports,
    chokepoints,
    countries
  };
}

// shared/analysis-mcp-adapters.ts
function arrayField(payload, field) {
  const record = asRecord(payload);
  return record ? asArray(record[field]) : [];
}
function toGeoEvents(records, readCoord, readTime, fallbackTime, options) {
  const now = options.now ?? Date.now();
  const windowMs = options.windowMs ?? GEO_CONVERGENCE_WINDOW_MS;
  const cutoff = now - windowMs;
  const events = [];
  for (const raw of records) {
    const record = asRecord(raw);
    if (!record) continue;
    const { lat, lon } = readCoord(record);
    if (!usableCoord(lat, lon) || lon === null) continue;
    const time = readTime(record) ?? fallbackTime ?? now;
    if (time < cutoff) continue;
    events.push({ lat, lon, time });
  }
  return events;
}
function unrestEventsToGeoEvents(payload, options = {}) {
  return toGeoEvents(
    arrayField(payload, "events"),
    nestedLocation,
    (record) => finiteNumber(record.occurredAt),
    finiteNumber(asRecord(payload)?.fetchedAt),
    options
  );
}
function militaryFlightsToGeoEvents(payload, options = {}) {
  return toGeoEvents(
    arrayField(payload, "flights"),
    (record) => ({ lat: finiteNumber(record.lat), lon: finiteNumber(record.lon) }),
    (record) => finiteNumber(record.lastSeenMs),
    finiteNumber(asRecord(payload)?.fetchedAt),
    options
  );
}
function earthquakesToGeoEvents(payload, options = {}) {
  return toGeoEvents(
    arrayField(payload, "earthquakes"),
    nestedLocation,
    (record) => finiteNumber(record.occurredAt),
    finiteNumber(asRecord(payload)?.fetchedAt),
    options
  );
}
function usniVesselsToGeoEvents(payload, options = {}) {
  return toGeoEvents(
    arrayField(payload, "vessels"),
    (record) => ({ lat: finiteNumber(record.regionLat), lon: finiteNumber(record.regionLon) }),
    () => null,
    finiteNumber(asRecord(payload)?.timestamp),
    options
  );
}
var MCP_GEO_PLACES = {
  conflictZones: CONFLICT_ZONES.map((zone) => ({ name: zone.name, center: zone.center })),
  waterways: STRATEGIC_WATERWAYS.map((waterway) => ({
    name: waterway.name,
    lat: waterway.lat,
    lon: waterway.lon
  })),
  hotspots: INTEL_HOTSPOTS.map((hotspot) => ({
    name: hotspot.name,
    lat: hotspot.lat,
    lon: hotspot.lon
  }))
};
function insightsToFocalClusters(payload) {
  const clusters = [];
  for (const [index, raw] of arrayField(payload, "topStories").entries()) {
    const record = asRecord(raw);
    if (!record) continue;
    const primaryTitle = nonEmptyString(record.primaryTitle);
    if (!primaryTitle) continue;
    const memberTitles = asArray(record.memberTitles).map((title) => nonEmptyString(title)).filter(Boolean).map((title) => ({ title }));
    clusters.push({
      id: `insights-${index}`,
      primaryTitle,
      primaryLink: nonEmptyString(record.primaryLink),
      allItems: memberTitles.length > 0 ? memberTitles : [{ title: primaryTitle }]
    });
  }
  return clusters;
}
var CROSS_SOURCE_TO_FOCAL_SIGNAL = {
  CROSS_SOURCE_SIGNAL_TYPE_MILITARY_FLIGHT_SURGE: "military_flight",
  CROSS_SOURCE_SIGNAL_TYPE_UNREST_SURGE: "protest",
  CROSS_SOURCE_SIGNAL_TYPE_INFRASTRUCTURE_OUTAGE: "internet_outage",
  CROSS_SOURCE_SIGNAL_TYPE_SHIPPING_DISRUPTION: "ais_disruption",
  CROSS_SOURCE_SIGNAL_TYPE_THERMAL_SPIKE: "satellite_fire",
  CROSS_SOURCE_SIGNAL_TYPE_RADIATION_ANOMALY: "radiation_anomaly",
  CROSS_SOURCE_SIGNAL_TYPE_SANCTIONS_SURGE: "sanctions_pressure",
  CROSS_SOURCE_SIGNAL_TYPE_OREF_ALERT_CLUSTER: "active_strike"
};
var CROSS_SOURCE_SEVERITY = {
  CROSS_SOURCE_SIGNAL_SEVERITY_LOW: "low",
  CROSS_SOURCE_SIGNAL_SEVERITY_MEDIUM: "medium",
  CROSS_SOURCE_SIGNAL_SEVERITY_HIGH: "high",
  // The focal core's severity ladder tops out at 'high'.
  CROSS_SOURCE_SIGNAL_SEVERITY_CRITICAL: "high"
};
function crossSourceSignalsToSignalSummary(payload, index) {
  const raw = arrayField(payload, "signals");
  const byCountry = /* @__PURE__ */ new Map();
  let signalsMapped = 0;
  for (const item of raw) {
    const record = asRecord(item);
    if (!record) continue;
    const focalType = CROSS_SOURCE_TO_FOCAL_SIGNAL[nonEmptyString(record.type)];
    if (!focalType) continue;
    const severity = CROSS_SOURCE_SEVERITY[nonEmptyString(record.severity)] ?? "low";
    const text = `${nonEmptyString(record.summary)} ${nonEmptyString(record.theater)}`.trim();
    const countries = [
      ...new Set(
        findEntitiesInText(text, index).filter((match) => index.byId.get(match.entityId)?.type === "country").map((match) => match.entityId)
      )
    ];
    if (countries.length === 0) continue;
    signalsMapped += 1;
    for (const country of countries) {
      let cluster = byCountry.get(country);
      if (!cluster) {
        cluster = {
          country,
          signals: [],
          signalTypes: /* @__PURE__ */ new Set(),
          totalCount: 0,
          highSeverityCount: 0
        };
        byCountry.set(country, cluster);
      }
      cluster.signals.push({ type: focalType, severity });
      cluster.signalTypes.add(focalType);
      cluster.totalCount += 1;
      if (severity === "high") cluster.highSeverityCount += 1;
    }
  }
  const topCountries = [...byCountry.values()].sort(
    (a, b) => b.highSeverityCount - a.highSeverityCount || b.totalCount - a.totalCount
  );
  return {
    summary: { topCountries },
    signalsTotal: raw.length,
    signalsMapped,
    signalsUnmapped: raw.length - signalsMapped
  };
}
function riskScoresToCiiLookup(payload) {
  const scores = /* @__PURE__ */ new Map();
  for (const raw of arrayField(payload, "ciiScores")) {
    const record = asRecord(raw);
    if (!record) continue;
    const code = nonEmptyString(record.region).toUpperCase();
    const score = finiteNumber(record.combinedScore);
    if (code && score !== null) scores.set(code, score);
  }
  return (countryCode) => scores.get(String(countryCode ?? "").toUpperCase()) ?? null;
}
function filterFocalPointsByCountry(points, countryCode, index) {
  const code = nonEmptyString(countryCode).toUpperCase();
  if (!code) return points;
  const relatedToCountry = new Set(
    (index.byId.get(code)?.related ?? []).map((related) => related.toUpperCase())
  );
  return points.filter((point) => {
    const entityId = point.entityId.toUpperCase();
    if (entityId === code) return true;
    if (relatedToCountry.has(entityId)) return true;
    const entity = index.byId.get(point.entityId);
    return Boolean(entity?.related?.some((related) => related.toUpperCase() === code));
  });
}
function submarineCablesToCableInputs(payload) {
  const cables = [];
  for (const raw of arrayField(payload, "cables")) {
    const record = asRecord(raw);
    if (!record) continue;
    const id = nonEmptyString(record.id);
    const name = nonEmptyString(record.name);
    if (!id || !name) continue;
    const countriesServed = [];
    for (const entry of asArray(record.countriesServed)) {
      const served = asRecord(entry);
      const country = nonEmptyString(served?.country);
      if (!country) continue;
      countriesServed.push({
        country,
        capacityShare: finiteNumber(served?.capacityShare) ?? 0,
        isRedundant: served?.isRedundant === true
      });
    }
    const landingPoints = [];
    for (const entry of asArray(record.landingPoints)) {
      const point = asRecord(entry);
      const country = nonEmptyString(point?.country);
      if (!country) continue;
      landingPoints.push({
        country,
        countryName: nonEmptyString(point?.countryName) || void 0,
        city: nonEmptyString(point?.city) || void 0,
        lat: finiteNumber(point?.lat) ?? void 0,
        lon: finiteNumber(point?.lon) ?? void 0
      });
    }
    const cable = { id, name, countriesServed, landingPoints };
    const rfsYear = finiteNumber(record.rfsYear);
    if (rfsYear !== null) cable.rfsYear = rfsYear;
    const owners = asArray(record.owners).map((owner) => nonEmptyString(owner)).filter(Boolean);
    if (owners.length > 0) cable.owners = owners;
    cables.push(cable);
  }
  return cables;
}
var MCP_CASCADE_WATERWAYS = STRATEGIC_WATERWAYS.map((waterway) => ({
  id: waterway.id,
  name: waterway.name,
  lat: waterway.lat,
  lon: waterway.lon,
  description: waterway.description
}));
function militaryFlightsToSurgeInputs(payload) {
  const flights = [];
  for (const raw of arrayField(payload, "flights")) {
    const record = asRecord(raw);
    if (!record) continue;
    const lat = finiteNumber(record.lat);
    const lon = finiteNumber(record.lon);
    if (!usableCoord(lat, lon) || lon === null) continue;
    const flight = {
      id: nonEmptyString(record.id) || nonEmptyString(record.hexCode) || `flight-${flights.length}`,
      callsign: nonEmptyString(record.callsign),
      // The core switches on aircraftType and treats an unknown value as
      // "other" — never as a fighter or a transport — so an untyped flight is
      // safe to keep for the theater totals.
      aircraftType: nonEmptyString(record.aircraftType) || "unknown",
      operator: nonEmptyString(record.operator) || "unknown",
      lat,
      lon
    };
    const aircraftModel = nonEmptyString(record.aircraftModel);
    if (aircraftModel) flight.aircraftModel = aircraftModel;
    flights.push(flight);
  }
  return flights;
}
function theaterPostureVesselCounts(payload) {
  const counts = /* @__PURE__ */ new Map();
  for (const raw of arrayField(payload, "theaters")) {
    const record = asRecord(raw);
    if (!record) continue;
    const theaterId = nonEmptyString(record.theater) || nonEmptyString(record.theaterId);
    const vessels = finiteNumber(record.trackedVessels);
    if (!theaterId || vessels === null) continue;
    counts.set(theaterId, vessels);
  }
  return counts;
}
function applyVesselCountsToPostures(postures, counts) {
  for (const posture of postures) {
    const vessels = counts.get(posture.theaterId);
    if (vessels === void 0) continue;
    posture.totalVessels = vessels;
  }
}
function surgeHistoryToActivityHistory(payload) {
  const history = /* @__PURE__ */ new Map();
  const runs = arrayField(payload, "history").map((raw) => asRecord(raw)).filter((run) => run !== null).map((run) => ({ run, timestamp: finiteNumber(run.assessedAt) })).filter((entry) => entry.timestamp !== null).sort((a, b) => a.timestamp - b.timestamp);
  for (const { run, timestamp } of runs) {
    for (const raw of asArray(run.theaters)) {
      const record = asRecord(raw);
      if (!record) continue;
      const theaterId = nonEmptyString(record.theaterId);
      if (!theaterId) continue;
      const entries = history.get(theaterId) ?? [];
      entries.push({
        theaterId,
        timestamp,
        transportCount: finiteNumber(record.transport) ?? 0,
        fighterCount: finiteNumber(record.fighters) ?? 0,
        reconCount: finiteNumber(record.reconnaissance) ?? 0,
        totalMilitary: finiteNumber(record.totalFlights) ?? 0,
        // The history rows keep counts, not ids. The core only reads flightIds
        // for live surge alerting, which the seeder already owns.
        flightIds: []
      });
      history.set(theaterId, entries);
    }
  }
  return history;
}

// shared/military-bases-data.ts
var MILITARY_BASES_EXPANDED = [
  { id: "ream_naval_base", name: "Ream Naval Base", lat: 10.5034, lon: 103.609, type: "china", country: "Cambodia", arm: "PLA Navy(Access Right)", status: "controversial", description: "PLA Navy(Access Right). Host: Cambodia. Status disputed." },
  { id: "chinese_pla_support_base", name: "Chinese PLA Support Base", lat: 11.5915, lon: 43.0602, type: "china", country: "Djibouti", arm: "Navy", status: "active", description: "Navy. Host: Djibouti." },
  { id: "chinese_naval_intelligence_base", name: "Chinese Naval Intelligence Base", lat: 14.1463, lon: 93.3588, type: "china", country: "Myanmar", arm: "Army", status: "controversial", description: "Army. Host: Myanmar. Status disputed." },
  { id: "military_base", name: "Military Base", lat: 37.4381, lon: 74.9128, type: "china", country: "Tajikistan", arm: "Army", status: "controversial", description: "Army. Host: Tajikistan. Status disputed." },
  { id: "unnamed_military_base", name: "Unnamed Military Base", lat: 9.54583, lon: 112.8875, type: "china", country: "Disputed", arm: "Combined arms", status: "active", description: "Combined arms." },
  { id: "unnamed_military_base_2", name: "Unnamed Military Base", lat: 10.92361, lon: 114.08472, type: "china", country: "Disputed", arm: "Combined arms", status: "active", description: "Combined arms." },
  { id: "unnamed_military_base_3", name: "Unnamed Military Base", lat: 9.9, lon: 115.53333, type: "china", country: "Disputed", arm: "Combined arms", status: "active", description: "Combined arms." },
  { id: "unnamed_military_base_4", name: "Unnamed Military Base", lat: 16.83444, lon: 112.33972, type: "china", country: "Disputed", arm: "Combined arms", status: "active", description: "Combined arms." },
  { id: "ndjamena_air_force_base", name: "N'Djamena Air Force Base", lat: 12.13361, lon: 15.03389, type: "france", country: "Chad", arm: "Air Force", status: "active", description: "Air Force. Host: Chad." },
  { id: "naval_base_of_hron", name: "Naval base of H\xE9ron", lat: 11.55663, lon: 43.14419, type: "france", country: "Djibouti", arm: "Navy", status: "active", description: "Navy. Host: Djibouti." },
  { id: "les_lments_franais_au_gabon", name: "Les \xE9l\xE9ments fran\xE7ais au Gabon", lat: 0.42048, lon: 9.43806, type: "france", country: "Gabon", arm: "Combined arms", status: "active", description: "Combined arms. Host: Gabon." },
  { id: "fassberg_air_base", name: "Fassberg Air Base", lat: 52.91944, lon: 10.18889, type: "france", country: "Germany", arm: "Franco-German training facilities", status: "active", description: "Franco-German training facilities. Host: Germany." },
  { id: "les_forces_franaises_en_cte_divoire_ffci", name: "Les forces fran\xE7aises en C\xF4te d'Ivoire (FFCI)", lat: 7.50357, lon: -5.54897, type: "france", country: "Ivory Coast", arm: "Combined arms", status: "active", description: "Combined arms. Host: Ivory Coast." },
  { id: "rayak_air_base", name: "Rayak Air Base", lat: 33.85222, lon: 35.99028, type: "france", country: "Lebanon", arm: "Combined arms", status: "active", description: "Combined arms. Host: Lebanon." },
  { id: "niamey_air_force_base", name: "Niamey Air Force Base", lat: 13.48167, lon: 2.17028, type: "france", country: "Niger", arm: "Air Force", status: "active", description: "Air Force. Host: Niger." },
  { id: "les_lments_franais_au_sngal", name: "Les \xE9l\xE9ments fran\xE7ais au S\xE9n\xE9gal", lat: 14.75069, lon: -17.45357, type: "france", country: "Senegal", arm: "Combined arms", status: "active", description: "Combined arms. Host: Senegal." },
  { id: "unnamed_military_base_5", name: "Unnamed Military Base", lat: 36.89111, lon: 38.35361, type: "france", country: "Syria", arm: "Combined arms", status: "active", description: "Combined arms. Host: Syria." },
  { id: "unnamed_military_base_6", name: "Unnamed Military Base", lat: 36.5875, lon: 38.29972, type: "france", country: "Syria", arm: "Combined arms", status: "active", description: "Combined arms. Host: Syria." },
  { id: "unnamed_military_base_7", name: "Unnamed Military Base", lat: 36.38528, lon: 38.85944, type: "france", country: "Syria", arm: "Combined arms", status: "active", description: "Combined arms. Host: Syria." },
  { id: "abu_dhabi_base", name: "Abu Dhabi Base", lat: 24.52151, lon: 54.39611, type: "france", country: "United Arab Emirates", arm: "Navy, Air Force", status: "active", description: "Navy, Air Force. Host: United Arab Emirates." },
  { id: "indian_military_training_team", name: "Indian military training team", lat: 27.36042, lon: 89.30152, type: "india", country: "Bhutan", arm: "Radar facilities", status: "active", description: "Radar facilities. Host: Bhutan." },
  { id: "port_of_shahid_beheshti", name: "Port of Shahid Beheshti", lat: 25.29752, lon: 60.61111, type: "india", country: "Iran", arm: "Navy & Air Force (Access Right)", status: "active", description: "Navy & Air Force (Access Right). Host: Iran." },
  { id: "port_of_sittwe", name: "Port of Sittwe", lat: 20.13937, lon: 92.90043, type: "india", country: "Myanmar", arm: "Listening Post", status: "planned", description: "Listening Post. Host: Myanmar. Planned/under construction." },
  { id: "ras_al_hadd_listening_post", name: "Ras al Hadd Listening post", lat: 22.53308, lon: 59.79831, type: "india", country: "Oman", arm: "Listening Post", status: "active", description: "Listening Post. Host: Oman." },
  { id: "muscat_naval_base", name: "Muscat naval base", lat: 23.58764, lon: 58.27884, type: "india", country: "Oman", arm: "Navy(Berthing right)", status: "active", description: "Navy(Berthing right). Host: Oman." },
  { id: "duqm_port", name: "Duqm port", lat: 19.666, lon: 57.72627, type: "india", country: "Oman", arm: "Navy(Berthing right)", status: "active", description: "Navy(Berthing right). Host: Oman." },
  { id: "naval_facilities_coastal_surveillance_ra", name: "Naval Facilities, Coastal Surveillance Radar (CSR) station", lat: -9.73661, lon: 46.51097, type: "india", country: "Seychelles", arm: "Navy", status: "planned", description: "Navy. Host: Seychelles. Planned/under construction." },
  { id: "farkhor_air_base", name: "Farkhor air base", lat: 37.47011, lon: 69.38089, type: "india", country: "Tajikistan", arm: "Combined arms", status: "active", description: "Combined arms. Host: Tajikistan." },
  { id: "coastal_surveillance_radar_station", name: "Coastal Surveillance Radar station", lat: -0.62728, lon: 73.09722, type: "india", country: "Maldives", arm: "Radar facilities", status: "active", description: "Radar facilities. Host: Maldives." },
  { id: "coastal_surveillance_radar_csr_station", name: "Coastal Surveillance Radar (CSR) station", lat: -12.01845, lon: 49.26322, type: "india", country: "Madagascar", arm: "Radar facilities", status: "active", description: "Radar facilities. Host: Madagascar." },
  { id: "coastal_surveillance_radar_csr_station_2", name: "Coastal Surveillance Radar (CSR) station", lat: -19.99894, lon: 57.62941, type: "india", country: "Mauritius", arm: "Radar facilities", status: "active", description: "Radar facilities. Host: Mauritius." },
  { id: "listening_post_and_coastal_surveillance_", name: "Listening post and Coastal Surveillance Radar station", lat: 21.91089, lon: 90.0497, type: "india", country: "Bangladesh", arm: "Radar facilities", status: "planned", description: "Radar facilities. Host: Bangladesh. Planned/under construction." },
  { id: "berth_rights_and_right_to_station_its_tr", name: "Berth rights and right to station its troops in Qatar", lat: 25.30761, lon: 51.2093, type: "india", country: "Qatar", arm: "Combined arms", status: "active", description: "Combined arms. Host: Qatar." },
  { id: "japan_selfdefense_force_base_djibouti", name: "Japan Self-Defense Force Base Djibouti", lat: 11.55311, lon: 43.14423, type: "japan", country: "Djibouti", arm: "India shares the maritime assets of Japan", status: "active", description: "India shares the maritime assets of Japan. Host: Djibouti." },
  { id: "heart_miliraty_base", name: "Heart miliraty base", lat: 34.35091, lon: 62.20565, type: "italy", country: "Afghanistan", arm: "Combined arms", status: "active", description: "Combined arms. Host: Afghanistan." },
  { id: "djibouti_militaray_base", name: "Djibouti militaray base", lat: 11.54816, lon: 43.17267, type: "italy", country: "Djibouti", arm: "Combined arms", status: "active", description: "Combined arms. Host: Djibouti." },
  { id: "ahmad_aljaber_air_base", name: "Ahmad al-Jaber Air Base", lat: 28.93492, lon: 47.79197, type: "italy", country: "Kuwait", arm: "Air Force", status: "active", description: "Air Force. Host: Kuwait." },
  { id: "libya_military_base", name: "Libya Military Base", lat: 24.96046, lon: 10.17728, type: "italy", country: "Libya", arm: "Combined arms", status: "active", description: "Combined arms. Host: Libya." },
  { id: "al_minhad_air_base", name: "Al Minhad air base", lat: 25.02694, lon: 55.36611, type: "italy", country: "United Arab Emirates", arm: "Air Force", status: "active", description: "Air Force. Host: United Arab Emirates." },
  { id: "russian_102nd_military_base", name: "Russian 102nd Military Base", lat: 40.79, lon: 43.825, type: "russia", country: "Armenia", arm: "Combined arms", status: "active", description: "Combined arms. Host: Armenia." },
  { id: "russian_3624th_airbase", name: "Russian 3624th Airbase", lat: 40.128, lon: 44.472, type: "russia", country: "Armenia", arm: "Air Force", status: "active", description: "Air Force. Host: Armenia." },
  { id: "vileyka_vlf_transmitter", name: "Vileyka VLF transmitter", lat: 54.4636, lon: 26.778, type: "russia", country: "Belarus", arm: "Navy", status: "active", description: "Navy. Host: Belarus." },
  { id: "hantsavichy_radar_station", name: "Hantsavichy Radar Station", lat: 52.857, lon: 26.481, type: "russia", country: "Belarus", arm: "Russian Aerospace Defence Forces", status: "active", description: "Russian Aerospace Defence Forces. Host: Belarus." },
  { id: "7th_krasnodar_base", name: "7th Krasnodar base", lat: 43.101, lon: 40.624, type: "russia", country: "Georgia", arm: "Combined arms", status: "active", description: "Combined arms. Host: Georgia." },
  { id: "russian_4th_military_base", name: "Russian 4th Military Base", lat: 42.39, lon: 43.922, type: "russia", country: "Georgia", arm: "Combined arms", status: "active", description: "Combined arms. Host: Georgia." },
  { id: "baikonur_cosmodrome", name: "Baikonur Cosmodrome", lat: 45.964, lon: 63.305, type: "russia", country: "Kazakhstan", arm: "Spaceport", status: "active", description: "Spaceport. Host: Kazakhstan." },
  { id: "sary_shagan", name: "Sary Shagan", lat: 46.383, lon: 72.866, type: "russia", country: "Kazakhstan", arm: "Anti-ballistic missile\xA0testing range", status: "active", description: "Anti-ballistic missile\xA0testing range. Host: Kazakhstan." },
  { id: "balkhash_radar_station", name: "Balkhash Radar Station", lat: 46.603, lon: 74.53, type: "russia", country: "Kazakhstan", arm: "Russian\xA0early warning radars", status: "active", description: "Russian\xA0early warning radars. Host: Kazakhstan." },
  { id: "kant_air_base", name: "Kant (air base)", lat: 42.853, lon: 74.846, type: "russia", country: "Kyrgyzstan", arm: "military\xA0air base", status: "active", description: "military\xA0air base. Host: Kyrgyzstan." },
  { id: "russian_forces_in_moldova", name: "Russian forces in Moldova", lat: 46.84, lon: 29.643, type: "russia", country: "Moldova", arm: "Task Force", status: "active", description: "Task Force. Host: Moldova." },
  { id: "khmeimim_air_base", name: "Khmeimim Air Base", lat: 35.411, lon: 35.945, type: "russia", country: "Syria", arm: "Russian Aerospace Defence Forces", status: "active", description: "Russian Aerospace Defence Forces. Host: Syria." },
  { id: "russian_naval_facility_in_tartus", name: "Russian naval facility in Tartus", lat: 34.915, lon: 35.874, type: "russia", country: "Syria", arm: "Navy", status: "active", description: "Navy. Host: Syria." },
  { id: "tiyas_military_airbase", name: "Tiyas Military Airbase", lat: 34.5225, lon: 37.62972, type: "russia", country: "Syria", arm: "Air Force", status: "active", description: "Air Force. Host: Syria." },
  { id: "shayrat_airbase", name: "Shayrat Airbase", lat: 34.49, lon: 36.90889, type: "russia", country: "Syria", arm: "Air Force", status: "active", description: "Air Force. Host: Syria." },
  { id: "russian_201st_military_base", name: "Russian 201st Military Base", lat: 38.536, lon: 68.78, type: "russia", country: "Tajikistan", arm: "Combined arms", status: "active", description: "Combined arms. Host: Tajikistan." },
  { id: "military_headquarters", name: "Military headquarters", lat: 11.79819, lon: -66.15139, type: "russia", country: "Venezuela", arm: "Combined arms", status: "planned", description: "Combined arms. Host: Venezuela. Planned/under construction." },
  { id: "unnamed_military_base_8", name: "Unnamed Military Base", lat: 13.01534, lon: 42.73724, type: "uae", country: "Eritrea", arm: "Combined arms", status: "controversial", description: "Combined arms. Host: Eritrea. Status disputed." },
  { id: "unnamed_military_base_9", name: "Unnamed Military Base", lat: 31.99809, lon: 21.19361, type: "uae", country: "Libya", arm: "Air Force", status: "controversial", description: "Air Force. Host: Libya. Status disputed." },
  { id: "unnamed_military_base_10", name: "Unnamed Military Base", lat: 10.438, lon: 44.997, type: "uae", country: "Republic of Somaliland", arm: "Combined arms", status: "active", description: "Combined arms. Host: Republic of Somaliland." },
  { id: "unnamed_military_base_11", name: "Unnamed Military Base", lat: 12.51, lon: 53.92, type: "uae", country: "Yemen", arm: "Combined arms", status: "active", description: "Combined arms. Host: Yemen." },
  { id: "rothera_research_station", name: "Rothera Research Station", lat: -67.56833, lon: -68.12583, type: "uk", country: "Disputed", arm: "British Antarctic Survey\xA0(BAS) base", status: "active", description: "British Antarctic Survey\xA0(BAS) base." },
  { id: "hms_jufair", name: "HMS Jufair", lat: 26.205, lon: 50.615, type: "uk", country: "Bahrain", arm: "British\xA0Royal Navy\xA0base", status: "active", description: "British\xA0Royal Navy\xA0base. Host: Bahrain." },
  { id: "raf_belize", name: "RAF Belize", lat: 17.544, lon: -88.305, type: "uk", country: "Belize", arm: "Royal Air Force", status: "active", description: "Royal Air Force. Host: Belize." },
  { id: "british_army_jungle_warfare_training_sch", name: "British Army Jungle Warfare Training School", lat: 4.608, lon: 114.325, type: "uk", country: "Brunei", arm: "British Army's\xA0training establishment", status: "active", description: "British Army's\xA0training establishment. Host: Brunei." },
  { id: "sittang_camp", name: "Sittang Camp", lat: 4.82943, lon: 114.668, type: "uk", country: "Brunei", arm: "British Army's\xA0training establishment", status: "active", description: "British Army's\xA0training establishment. Host: Brunei." },
  { id: "kuala_belait_accommodation", name: "Kuala Belait accommodation", lat: 4.58665, lon: 114.247, type: "uk", country: "Brunei", arm: "British Army's\xA0training establishment", status: "active", description: "British Army's\xA0training establishment. Host: Brunei." },
  { id: "british_army_training_unit_suffield", name: "British Army Training Unit Suffield", lat: 50.273, lon: -111.175, type: "uk", country: "Canada", arm: "Army", status: "active", description: "Army. Host: Canada." },
  { id: "raf_troodos", name: "RAF Troodos", lat: 34.912, lon: 32.883, type: "uk", country: "Cyprus", arm: "Royal Air Force", status: "active", description: "Royal Air Force. Host: Cyprus." },
  { id: "raf_akrotiri", name: "RAF Akrotiri", lat: 34.59, lon: 32.987, type: "uk", country: "Cyprus", arm: "Royal Air Force", status: "active", description: "Royal Air Force. Host: Cyprus." },
  { id: "ayios_nikolaos_station", name: "Ayios Nikolaos Station", lat: 35.093, lon: 33.886, type: "uk", country: "Cyprus", arm: "British Armed Forces", status: "active", description: "British Armed Forces. Host: Cyprus." },
  { id: "westfalen_garrison", name: "Westfalen Garrison", lat: 51.778, lon: 8.72, type: "uk", country: "Germany", arm: "British\xA0garrison\xA0with facilities", status: "active", description: "British\xA0garrison\xA0with facilities. Host: Germany." },
  { id: "wulfen_barracks", name: "Wulfen barracks", lat: 51.7053, lon: 6.99875, type: "uk", country: "Germany", arm: "Munitions storage facility, British Forces Germany", status: "active", description: "Munitions storage facility, British Forces Germany. Host: Germany." },
  { id: "ayrshire_barracks", name: "Ayrshire barracks", lat: 51.1708, lon: 6.39294, type: "uk", country: "Germany", arm: "Vehicle storage site, British Forces Germany", status: "active", description: "Vehicle storage site, British Forces Germany. Host: Germany." },
  { id: "raf_gibraltar", name: "RAF Gibraltar", lat: 36.15209, lon: -5.34446, type: "uk", country: "Disputed", arm: "Royal Air Force", status: "active", description: "Royal Air Force." },
  { id: "port_of_gibraltar", name: "Port of Gibraltar", lat: 36.1485, lon: -5.3652, type: "uk", country: "Gibraltar", arm: "British\xA0Royal Navy", status: "active", description: "British\xA0Royal Navy. Host: Gibraltar." },
  { id: "british_army_training_unit_kenya", name: "British Army Training Unit Kenya", lat: 0.035, lon: 37.054, type: "uk", country: "Kenya", arm: "Training support unit of the\xA0British Army", status: "active", description: "Training support unit of the\xA0British Army. Host: Kenya." },
  { id: "british_gurkha\xA0dharan", name: "British Gurkha\xA0Dharan", lat: 26.8069, lon: 87.2692, type: "uk", country: "Nepal", arm: "Movement base and regional recruiting centre", status: "active", description: "Movement base and regional recruiting centre. Host: Nepal." },
  { id: "headquarters_british_gurkhas_nepal", name: "Headquarters British Gurkhas Nepal", lat: 27.6684, lon: 85.3169, type: "uk", country: "Nepal", arm: "Focal point for organisation of transit to and fro", status: "active", description: "Focal point for organisation of transit to and fro. Host: Nepal." },
  { id: "british_gurkha_camp", name: "British Gurkha Camp", lat: 28.2475, lon: 83.9914, type: "uk", country: "Nepal", arm: "Main recruitment centre", status: "active", description: "Main recruitment centre. Host: Nepal." },
  { id: "bardufoss_air_station", name: "Bardufoss Air Station", lat: 69.0521, lon: 18.5169, type: "uk", country: "Norway", arm: "Cold weather training for\xA0Royal Air Force,\xA0British", status: "active", description: "Cold weather training for\xA0Royal Air Force,\xA0British. Host: Norway." },
  { id: "uk_joint_logistics_support_base", name: "UK Joint Logistics Support Base", lat: 19.669, lon: 57.71, type: "uk", country: "Oman", arm: "Submarines and\xA0Queen Elizabeth-class aircraft carr", status: "active", description: "Submarines and\xA0Queen Elizabeth-class aircraft carr. Host: Oman." },
  { id: "omanibritish_joint_training_area", name: "Omani-British Joint Training Area", lat: 19.014, lon: 57.7487, type: "uk", country: "Oman", arm: "Royal Army of Oman, British Army", status: "active", description: "Royal Army of Oman, British Army. Host: Oman." },
  { id: "seeb_overseas_processing_centre", name: "Seeb, Overseas Processing Centre", lat: 23.6749, lon: 58.1208, type: "uk", country: "Oman", arm: "GCHQ's Middle East spy hub", status: "active", description: "GCHQ's Middle East spy hub. Host: Oman." },
  { id: "raf_al_udeid", name: "RAF Al Udeid", lat: 25.11, lon: 51.319, type: "uk", country: "Qatar", arm: "Royal Air Force", status: "active", description: "Royal Air Force. Host: Qatar." },
  { id: "british_naval_facility_base", name: "British naval facility, base", lat: 1.46411, lon: 103.826, type: "uk", country: "Singapore", arm: "British Defence Singapore Support Unit\xA0(BDSSU)", status: "active", description: "British Defence Singapore Support Unit\xA0(BDSSU). Host: Singapore." },
  { id: "raf_mount_pleasant", name: "RAF Mount Pleasant", lat: -51.822, lon: -58.447, type: "uk", country: "United Kingdoms", arm: "Royal Air Force station", status: "active", description: "Royal Air Force station. Host: United Kingdoms." },
  { id: "raf_ascension", name: "RAF Ascension", lat: -7.969, lon: -14.393, type: "uk", country: "United Kingdoms", arm: "Royal Air Force", status: "active", description: "Royal Air Force. Host: United Kingdoms." },
  { id: "naval_support_facility_diego_garcia", name: "Naval Support Facility Diego Garcia", lat: 7.313, lon: 72.411, type: "uk", country: "United Kingdoms", arm: "Naval air facility", status: "active", description: "Naval air facility. Host: United Kingdoms." },
  { id: "ascension_air_force_station", name: "Ascension Air Force Station", lat: -7.9504, lon: -14.4112, type: "uk", country: "United Kingdoms", arm: "Royal Air Force", status: "active", description: "Royal Air Force. Host: United Kingdoms." },
  { id: "warwick_camp", name: "Warwick Camp", lat: 32.2566, lon: -64.8153, type: "uk", country: "United Kingdoms", arm: "Royal Bermuda Regiment", status: "active", description: "Royal Bermuda Regiment. Host: United Kingdoms." },
  { id: "cayman_islands_regiment", name: "Cayman Islands Regiment", lat: 19.2931, lon: -81.3784, type: "uk", country: "United Kingdoms", arm: "A single\xA0territorial\xA0infantry\xA0battalion\xA0of the\xA0Bri", status: "active", description: "A single\xA0territorial\xA0infantry\xA0battalion\xA0of the\xA0Bri. Host: United Kingdoms." },
  { id: "a_port_facility_and_depot_for\xA0raf_mount_", name: "A port facility and depot for\xA0RAF Mount Pleasant", lat: -51.9, lon: -58.4377, type: "uk", country: "United Kingdoms", arm: "Royal Navy", status: "active", description: "Royal Navy. Host: United Kingdoms." },
  { id: "rrh_an_early_warning_and_airspace_contro", name: "RRH, an early warning and airspace control network", lat: -52.153, lon: -60.5981, type: "uk", country: "United Kingdoms", arm: "British Forces South Atlantic Islands", status: "active", description: "British Forces South Atlantic Islands. Host: United Kingdoms." },
  { id: "rrh_an_early_warning_and_airspace_contro_2", name: "RRH, an early warning and airspace control network", lat: -51.4252, lon: -60.5643, type: "uk", country: "United Kingdoms", arm: "British Forces South Atlantic Islands", status: "active", description: "British Forces South Atlantic Islands. Host: United Kingdoms." },
  { id: "rrh_an_early_warning_and_airspace_contro_3", name: "RRH, an early warning and airspace control network", lat: -51.6734, lon: -58.1103, type: "uk", country: "United Kingdoms", arm: "British Forces South Atlantic Islands", status: "active", description: "British Forces South Atlantic Islands. Host: United Kingdoms." },
  { id: "port_stanley_airport", name: "Port Stanley Airport", lat: -51.6985, lon: -57.8415, type: "uk", country: "Disputed", arm: "Falkland Islands Defence Force Headquarters", status: "active", description: "Falkland Islands Defence Force Headquarters." },
  { id: "jersey_field_squadron", name: "Jersey Field Squadron", lat: 49.1752, lon: -2.10827, type: "uk", country: "United Kingdoms", arm: "Royal Engineer uni", status: "active", description: "Royal Engineer uni. Host: United Kingdoms." },
  { id: "royal_montserrat_defence_force_headquart", name: "Royal Montserrat Defence Force Headquarters", lat: 16.7937, lon: -62.2112, type: "uk", country: "United Kingdoms", arm: "Royal Montserrat Defence Force", status: "active", description: "Royal Montserrat Defence Force. Host: United Kingdoms." },
  { id: "firebase_fiddlers_greenfire_base", name: "Firebase Fiddler's Green(Fire base)", lat: 31.44139, lon: 64.10472, type: "us-nato", country: "Afghanistan", arm: "Marine Corps", status: "active", description: "Marine Corps. Host: Afghanistan." },
  { id: "forward_operating_base_delhi", name: "Forward Operating Base Delhi", lat: 31.13278, lon: 64.18944, type: "us-nato", country: "Afghanistan", arm: "Marine Corps", status: "active", description: "Marine Corps. Host: Afghanistan." },
  { id: "camp_dwyer", name: "Camp Dwyer", lat: 31.10111, lon: 64.06722, type: "us-nato", country: "Afghanistan", arm: "Combined arms", status: "active", description: "Combined arms. Host: Afghanistan." },
  { id: "forward_operating_base_geronimo", name: "Forward Operating Base Geronimo", lat: 31.40167, lon: 64.25889, type: "us-nato", country: "Afghanistan", arm: "Combined arms", status: "active", description: "Combined arms. Host: Afghanistan." },
  { id: "joint_region_marianas_andersen_afb", name: "Joint Region Marianas Andersen AFB", lat: 13.6495, lon: 144.863, type: "us-nato", country: "America", arm: "Navy", status: "active", description: "Navy. Host: America." },
  { id: "andersen_air_force_base", name: "Andersen Air Force Base", lat: 13.5792, lon: 144.923, type: "us-nato", country: "America", arm: "Air Force", status: "active", description: "Air Force. Host: America." },
  { id: "sector_guam", name: "Sector Guam", lat: 13.4373, lon: 144.713, type: "us-nato", country: "America", arm: "Coastal Guard", status: "active", description: "Coastal Guard. Host: America." },
  { id: "robertson_barracks", name: "Robertson Barracks", lat: -12.44, lon: 130.97, type: "us-nato", country: "Australia", arm: "Marines", status: "active", description: "Marines. Host: Australia." },
  { id: "naval_support_activity_bahrain", name: "Naval Support Activity Bahrain", lat: 26.2086, lon: 50.6097, type: "us-nato", country: "Bahrain", arm: "Navy", status: "active", description: "Navy. Host: Bahrain." },
  { id: "isa_air_base", name: "Isa Air Base", lat: 25.9121, lon: 50.5931, type: "us-nato", country: "Bahrain", arm: "Air Force", status: "active", description: "Air Force. Host: Bahrain." },
  { id: "usag_brussels", name: "USAG Brussels", lat: 50.8504, lon: 4.34878, type: "us-nato", country: "Belgium", arm: "Army", status: "active", description: "Army. Host: Belgium." },
  { id: "aitos_logistics_center", name: "Aitos Logistics Center", lat: 42.7, lon: 27.25, type: "us-nato", country: "Bulgaria", arm: "Air Force", status: "active", description: "Air Force. Host: Bulgaria." },
  { id: "bezmer", name: "Bezmer", lat: 42.4833, lon: 26.5, type: "us-nato", country: "Bulgaria", arm: "Air Force", status: "active", description: "Air Force. Host: Bulgaria." },
  { id: "graf_ignatievo", name: "Graf Ignatievo", lat: 42.15, lon: 24.75, type: "us-nato", country: "Bulgaria", arm: "Air Force", status: "active", description: "Air Force. Host: Bulgaria." },
  { id: "contingency_location_garoua", name: "Contingency Location Garoua", lat: 9.33307, lon: 13.3717, type: "us-nato", country: "Cameroon", arm: "Army", status: "active", description: "Army. Host: Cameroon." },
  { id: "guantanamo", name: "Guantanamo", lat: 20.1444, lon: -75.2092, type: "us-nato", country: "Cuba", arm: "Navy", status: "active", description: "Navy. Host: Cuba." },
  { id: "camp_lemonnier", name: "Camp Lemonnier", lat: 11.5436, lon: 43.1486, type: "us-nato", country: "Djibouti", arm: "Navy", status: "active", description: "Navy. Host: Djibouti." },
  { id: "raf_lakenheath", name: "RAF Lakenheath", lat: 52.4175, lon: 0.52211, type: "us-nato", country: "United Kingdoms", arm: "Air Force", status: "active", description: "Air Force. Host: United Kingdoms." },
  { id: "royal_air_force_alconbury", name: "Royal Air Force Alconbury", lat: 52.369, lon: -0.26009, type: "us-nato", country: "United Kingdoms", arm: "Air Force", status: "active", description: "Air Force. Host: United Kingdoms." },
  { id: "royal_air_force_croughton", name: "Royal Air Force Croughton", lat: 52.25, lon: -0.83333, type: "us-nato", country: "United Kingdoms", arm: "Air Force", status: "active", description: "Air Force. Host: United Kingdoms." },
  { id: "raf_mildenhall", name: "RAF Mildenhall", lat: 51.4256, lon: -1.69988, type: "us-nato", country: "United Kingdoms", arm: "Air Force", status: "active", description: "Air Force. Host: United Kingdoms." },
  { id: "campbell_barracks", name: "Campbell Barracks", lat: 49.4077, lon: 8.69079, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "landstuhl_medical_center", name: "Landstuhl Medical Center", lat: 49.4131, lon: 7.57021, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "patrick_henry_village", name: "Patrick Henry Village", lat: 49.4077, lon: 8.69079, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_ansbach", name: "USAG Ansbach", lat: 49.3, lon: 10.5833, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_bamberg", name: "USAG Bamberg", lat: 49.8987, lon: 10.9007, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_baumholder", name: "USAG Baumholder", lat: 49.6174, lon: 7.33381, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_garmisch", name: "USAG Garmisch", lat: 47.4948, lon: 11.1078, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_grafenwoehr", name: "USAG Grafenwoehr", lat: 49.7173, lon: 11.9064, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_heidelberg", name: "USAG Heidelberg", lat: 49.4077, lon: 8.69079, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usaf_hessen", name: "USAF Hessen", lat: 50.1342, lon: 8.91418, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_kaiserslautern", name: "USAG Kaiserslautern", lat: 49.443, lon: 7.77161, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_mannheim", name: "USAG Mannheim", lat: 49.4077, lon: 8.69079, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_schweinfurt", name: "USAG Schweinfurt", lat: 50.0494, lon: 10.2217, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_stuttgart", name: "USAG Stuttgart", lat: 48.7823, lon: 9.17702, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "usag_wiesbaden", name: "USAG Wiesbaden", lat: 50.0826, lon: 8.24932, type: "us-nato", country: "Germany", arm: "Army", status: "active", description: "Army. Host: Germany." },
  { id: "ramstein", name: "Ramstein", lat: 49.443, lon: 7.77161, type: "us-nato", country: "Germany", arm: "Air Force", status: "active", description: "Air Force. Host: Germany." },
  { id: "spangdahlem", name: "Spangdahlem", lat: 49.7556, lon: 6.63935, type: "us-nato", country: "Germany", arm: "Air Force", status: "active", description: "Air Force. Host: Germany." },
  { id: "panzer_kaserne", name: "Panzer Kaserne", lat: 48.6849, lon: 9.02955, type: "us-nato", country: "Germany", arm: "Marines", status: "active", description: "Marines. Host: Germany." },
  { id: "camp_victory", name: "Camp Victory", lat: 33.3406, lon: 44.4009, type: "us-nato", country: "Iraq", arm: "Army", status: "active", description: "Army. Host: Iraq." },
  { id: "forward_operating_base_abu_ghraib", name: "Forward Operating Base Abu Ghraib", lat: 33.307, lon: 44.1869, type: "us-nato", country: "Iraq", arm: "Army", status: "active", description: "Army. Host: Iraq." },
  { id: "fob_grizzly", name: "FOB Grizzly", lat: 33.8081, lon: 44.5334, type: "us-nato", country: "Iraq", arm: "Army", status: "active", description: "Army. Host: Iraq." },
  { id: "camp_baharia", name: "Camp Baharia", lat: 33.3558, lon: 43.7861, type: "us-nato", country: "Iraq", arm: "Marines", status: "active", description: "Marines. Host: Iraq." },
  { id: "ain_assad_air_base", name: "Ain Assad Air Base", lat: 33.7986, lon: 42.4391, type: "us-nato", country: "Iraq", arm: "Army,Air Force,Marines", status: "active", description: "Army,Air Force,Marines. Host: Iraq." },
  { id: "dimona_radar_facility", name: "Dimona Radar Facility", lat: 30.9844, lon: 35.0735, type: "us-nato", country: "Israel", arm: "US military", status: "active", description: "US military. Host: Israel." },
  { id: "nsa_gaeta", name: "NSA Gaeta", lat: 41.2141, lon: 13.5708, type: "us-nato", country: "Italy", arm: "Navy", status: "active", description: "Navy. Host: Italy." },
  { id: "naval_support_activity", name: "Naval Support Activity", lat: 41.2142, lon: 9.40833, type: "us-nato", country: "Italy", arm: "Navy", status: "active", description: "Navy. Host: Italy." },
  { id: "naval_support_activity_2", name: "Naval Support Activity", lat: 40.8333, lon: 14.25, type: "us-nato", country: "Italy", arm: "Navy", status: "active", description: "Navy. Host: Italy." },
  { id: "camp_darby", name: "Camp Darby", lat: 43.6272, lon: 10.292, type: "us-nato", country: "Italy", arm: "Army", status: "active", description: "Army. Host: Italy." },
  { id: "caserma_ederle", name: "Caserma Ederle", lat: 45.5573, lon: 11.5409, type: "us-nato", country: "Italy", arm: "Army", status: "active", description: "Army. Host: Italy." },
  { id: "aviano", name: "Aviano", lat: 46.0706, lon: 12.5947, type: "us-nato", country: "Italy", arm: "Air Force", status: "active", description: "Air Force. Host: Italy." },
  { id: "fleet_actvities_sasebo", name: "Fleet Actvities Sasebo", lat: 33.1592, lon: 129.723, type: "us-nato", country: "Japan", arm: "Navy", status: "active", description: "Navy. Host: Japan." },
  { id: "fleet_activities", name: "Fleet Activities", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Navy", status: "active", description: "Navy. Host: Japan." },
  { id: "fleep_activities", name: "Fleep Activities", lat: 35.2836, lon: 139.667, type: "us-nato", country: "Japan", arm: "Navy", status: "active", description: "Navy. Host: Japan." },
  { id: "camp_zama", name: "Camp Zama", lat: 35.4889, lon: 139.389, type: "us-nato", country: "Japan", arm: "Army", status: "active", description: "Army. Host: Japan." },
  { id: "fort_buckner", name: "Fort Buckner", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Army", status: "active", description: "Army. Host: Japan." },
  { id: "torii_station", name: "Torii Station", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Army", status: "active", description: "Army. Host: Japan." },
  { id: "kadena", name: "Kadena", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Air Force", status: "active", description: "Air Force. Host: Japan." },
  { id: "misawsa", name: "Misawsa", lat: 40.6868, lon: 141.39, type: "us-nato", country: "Japan", arm: "Air Force", status: "active", description: "Air Force. Host: Japan." },
  { id: "yokota", name: "Yokota", lat: 35.7394, lon: 139.347, type: "us-nato", country: "Japan", arm: "Air Force", status: "active", description: "Air Force. Host: Japan." },
  { id: "unnamed_military_base_12", name: "Unnamed Military Base", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "unnamed_military_base_13", name: "Unnamed Military Base", lat: 34.15, lon: 132.183, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "camp_courtney", name: "Camp Courtney", lat: 26.3761, lon: 127.859, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "camp_foster", name: "Camp Foster", lat: 26.3029, lon: 127.767, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "camp_gonsalves", name: "Camp Gonsalves", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "camp_hansen", name: "Camp Hansen", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "camp_kinser", name: "Camp Kinser", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "camp_schwab", name: "Camp Schwab", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "camp_sd_butler", name: "Camp SD Butler", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "yontan_airfield", name: "Yontan Airfield", lat: 25.7722, lon: 126.669, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "far_east_activities", name: "Far East Activities", lat: 35.7431, lon: 139.35, type: "us-nato", country: "Japan", arm: "Coastal Guard", status: "active", description: "Coastal Guard. Host: Japan." },
  { id: "naval_air_facility_atsugi", name: "Naval Air Facility Atsugi", lat: 35.4567, lon: 139.45, type: "us-nato", country: "Japan", arm: "Navy", status: "active", description: "Navy. Host: Japan." },
  { id: "camp_fuji", name: "Camp Fuji", lat: 35.3171, lon: 138.933, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "fleet_activities_okinawa", name: "Fleet Activities Okinawa", lat: 26.5043, lon: 127.997, type: "us-nato", country: "Japan", arm: "Navy", status: "active", description: "Navy. Host: Japan." },
  { id: "torii_station_2", name: "TORII Station", lat: 26.4938, lon: 127.851, type: "us-nato", country: "Japan", arm: "Army", status: "active", description: "Army. Host: Japan." },
  { id: "kadena_air_base", name: "Kadena Air Base", lat: 26.3545, lon: 127.766, type: "us-nato", country: "Japan", arm: "Air Force", status: "active", description: "Air Force. Host: Japan." },
  { id: "marine_corps_base_camp_smedley_d_bulter", name: "Marine Corps Base Camp Smedley D. Bulter", lat: 26.4843, lon: 127.955, type: "us-nato", country: "Japan", arm: "Marines", status: "active", description: "Marines. Host: Japan." },
  { id: "camp_bondsteel", name: "Camp Bondsteel", lat: 42.3667, lon: 21.1333, type: "us-nato", country: "Kosovo", arm: "Army", status: "active", description: "Army. Host: Kosovo." },
  { id: "ali_al_salem_air_base", name: "Ali Al Salem Air Base", lat: 29.3487, lon: 47.5235, type: "us-nato", country: "Kuwait", arm: "Air Force", status: "active", description: "Air Force. Host: Kuwait." },
  { id: "camp_arifjan", name: "Camp Arifjan", lat: 28.8751, lon: 48.1589, type: "us-nato", country: "Kuwait", arm: "Air Force,Army,Marines,Navy,Coastal Guard", status: "active", description: "Air Force,Army,Marines,Navy,Coastal Guard. Host: Kuwait." },
  { id: "camp_buehring", name: "Camp Buehring", lat: 29.6952, lon: 47.4212, type: "us-nato", country: "Kuwait", arm: "Base", status: "active", description: "Base. Host: Kuwait." },
  { id: "kuwait_naval_base", name: "Kuwait Naval Base", lat: 28.8643, lon: 48.2775, type: "us-nato", country: "Kuwait", arm: "Army, Navy, Coastal Guard", status: "active", description: "Army, Navy, Coastal Guard. Host: Kuwait." },
  { id: "usag_schinnen", name: "USAG Schinnen", lat: 50.9433, lon: 5.88889, type: "us-nato", country: "Netherlands", arm: "Army", status: "active", description: "Army. Host: Netherlands." },
  { id: "niger_air_base_201", name: "Niger Air Base 201", lat: 16.9212, lon: 8.02595, type: "us-nato", country: "Niger", arm: "Air Force", status: "active", description: "Air Force. Host: Niger." },
  { id: "masirah_aira_base", name: "Masirah Aira Base", lat: 20.6671, lon: 58.8971, type: "us-nato", country: "Oman", arm: "Air Force", status: "active", description: "Air Force. Host: Oman." },
  { id: "rafo_thumrait", name: "RAFO Thumrait", lat: 17.6641, lon: 54.0255, type: "us-nato", country: "Oman", arm: "Air Force", status: "active", description: "Air Force. Host: Oman." },
  { id: "antonio_bautista_air_base", name: "Antonio Bautista Air Base", lat: 9.74346, lon: 118.76, type: "us-nato", country: "Philippines", arm: "Air Force", status: "active", description: "Air Force. Host: Philippines." },
  { id: "cesar_basa_air_base", name: "Cesar Basa Air Base", lat: 14.9862, lon: 120.494, type: "us-nato", country: "Philippines", arm: "Air Force", status: "active", description: "Air Force. Host: Philippines." },
  { id: "fort_magsaysay", name: "Fort Magsaysay", lat: 15.435, lon: 121.091, type: "us-nato", country: "Philippines", arm: "Army", status: "active", description: "Army. Host: Philippines." },
  { id: "lumbia_airfield", name: "Lumbia Airfield", lat: 8.4055, lon: 124.61, type: "us-nato", country: "Philippines", arm: "Air Force", status: "active", description: "Air Force. Host: Philippines." },
  { id: "mactanbenito_ebuen_air_base", name: "Mactan-Benito Ebuen Air Base", lat: 10.3129, lon: 123.978, type: "us-nato", country: "Philippines", arm: "Air Force", status: "active", description: "Air Force. Host: Philippines." },
  { id: "lajes_field", name: "Lajes Field", lat: 38.3833, lon: -28.2667, type: "us-nato", country: "Portugal", arm: "Air Force", status: "active", description: "Air Force. Host: Portugal." },
  { id: "camp_santiago", name: "Camp Santiago", lat: 17.9775, lon: -66.298, type: "us-nato", country: "Puerto Rico", arm: "Army", status: "active", description: "Army. Host: Puerto Rico." },
  { id: "al_udeid", name: "Al Udeid", lat: 25.2793, lon: 51.5224, type: "us-nato", country: "Quatar", arm: "Air Force", status: "active", description: "Air Force. Host: Quatar." },
  { id: "prince_sultan_air_base", name: "Prince Sultan Air Base", lat: 24.0769, lon: 47.564, type: "us-nato", country: "Saudi Arabia", arm: "Air Force", status: "active", description: "Air Force. Host: Saudi Arabia." },
  { id: "comlog_westpac", name: "COMLOG Westpac", lat: 1.28967, lon: 103.85, type: "us-nato", country: "Singapore", arm: "Navy", status: "active", description: "Navy. Host: Singapore." },
  { id: "fleet_actvities_chinhae", name: "Fleet Actvities Chinhae", lat: 35.1028, lon: 129.04, type: "us-nato", country: "South Korea", arm: "Navy", status: "active", description: "Navy. Host: South Korea." },
  { id: "camp_red_cloud", name: "Camp Red Cloud", lat: 37.7415, lon: 127.047, type: "us-nato", country: "South Korea", arm: "Army", status: "active", description: "Army. Host: South Korea." },
  { id: "camp_stanley", name: "Camp Stanley", lat: 37.7415, lon: 127.047, type: "us-nato", country: "South Korea", arm: "Army", status: "active", description: "Army. Host: South Korea." },
  { id: "usag_daegu", name: "USAG Daegu", lat: 35.8703, lon: 128.591, type: "us-nato", country: "South Korea", arm: "Army", status: "active", description: "Army. Host: South Korea." },
  { id: "kunsan_ab", name: "Kunsan AB", lat: 35.9022, lon: 126.625, type: "us-nato", country: "South Korea", arm: "Air Force", status: "active", description: "Air Force. Host: South Korea." },
  { id: "us_army_garrison_humphreys", name: "U.S. Army Garrison Humphreys", lat: 36.9651, lon: 127.033, type: "us-nato", country: "South Korea", arm: "Army", status: "active", description: "Army. Host: South Korea." },
  { id: "osan_air_base", name: "Osan Air Base", lat: 37.091, lon: 127.031, type: "us-nato", country: "South Korea", arm: "Air Force", status: "active", description: "Air Force. Host: South Korea." },
  { id: "k16_air_base", name: "K-16 Air Base", lat: 37.4377, lon: 127.109, type: "us-nato", country: "South Korea", arm: "Air Force", status: "active", description: "Air Force. Host: South Korea." },
  { id: "usag_yongsan", name: "USAG Yongsan", lat: 37.5331, lon: 126.983, type: "us-nato", country: "South Korea", arm: "Army", status: "active", description: "Army. Host: South Korea." },
  { id: "us_army_garrison_casey", name: "U.S. Army Garrison CASEY", lat: 37.8842, lon: 127.05, type: "us-nato", country: "South Korea", arm: "Army", status: "active", description: "Army. Host: South Korea." },
  { id: "naval_station", name: "Naval Station", lat: 36.6224, lon: -6.35859, type: "us-nato", country: "Spain", arm: "Navy", status: "active", description: "Navy. Host: Spain." },
  { id: "izmir", name: "Izmir", lat: 38.4127, lon: 27.1384, type: "us-nato", country: "Turkey", arm: "Air Force", status: "active", description: "Air Force. Host: Turkey." },
  { id: "al_dhafra_air_base", name: "Al Dhafra Air Base", lat: 24.24, lon: 54.551, type: "us-nato", country: "United Arab Emirates", arm: "Air Force,Army", status: "active", description: "Air Force,Army. Host: United Arab Emirates." },
  { id: "port_of_jebel_ali", name: "Port of Jebel Ali", lat: 25.0249, lon: 55.0399, type: "us-nato", country: "United Arab Emirates", arm: "Air Force, Navy", status: "active", description: "Air Force, Navy. Host: United Arab Emirates." },
  { id: "fujairah_naval_base", name: "Fujairah Naval Base", lat: 25.2523, lon: 56.3652, type: "us-nato", country: "United Arab Emirates", arm: "Navy", status: "active", description: "Navy. Host: United Arab Emirates." },
  { id: "navy_support_facility", name: "Navy Support Facility", lat: -7.29861, lon: 72.4016, type: "us-nato", country: "United Kingdom", arm: "Navy", status: "active", description: "Navy. Host: United Kingdom." }
];

// shared/analysis-military-posture-data.ts
var POSTURE_THEATERS = [
  {
    id: "iran-theater",
    name: "Iran Theater",
    shortName: "IRAN",
    targetNation: "Iran",
    regions: ["persian-gulf", "strait-hormuz", "iran-border"],
    bounds: { north: 42, south: 20, east: 65, west: 30 },
    thresholds: { elevated: 8, critical: 20 },
    navalThresholds: { elevated: 2, critical: 5 },
    strikeIndicators: { minTankers: 2, minAwacs: 1, minFighters: 5 }
  },
  {
    id: "taiwan-theater",
    name: "Taiwan Strait",
    shortName: "TAIWAN",
    targetNation: "Taiwan",
    regions: ["taiwan-strait", "south-china-sea"],
    bounds: { north: 30, south: 18, east: 130, west: 115 },
    thresholds: { elevated: 6, critical: 15 },
    navalThresholds: { elevated: 4, critical: 10 },
    strikeIndicators: { minTankers: 1, minAwacs: 1, minFighters: 4 }
  },
  {
    id: "baltic-theater",
    name: "Baltic Theater",
    shortName: "BALTIC",
    targetNation: null,
    regions: ["baltics", "poland-border", "kaliningrad"],
    bounds: { north: 65, south: 52, east: 32, west: 10 },
    thresholds: { elevated: 5, critical: 12 },
    navalThresholds: { elevated: 3, critical: 8 },
    strikeIndicators: { minTankers: 1, minAwacs: 1, minFighters: 3 }
  },
  {
    id: "blacksea-theater",
    name: "Black Sea",
    shortName: "BLACK SEA",
    targetNation: null,
    regions: ["black-sea"],
    bounds: { north: 48, south: 40, east: 42, west: 26 },
    thresholds: { elevated: 4, critical: 10 },
    navalThresholds: { elevated: 3, critical: 6 },
    strikeIndicators: { minTankers: 1, minAwacs: 1, minFighters: 3 }
  },
  {
    id: "korea-theater",
    name: "Korean Peninsula",
    shortName: "KOREA",
    targetNation: "North Korea",
    regions: ["korean-dmz", "sea-of-japan"],
    bounds: { north: 43, south: 33, east: 132, west: 124 },
    thresholds: { elevated: 5, critical: 12 },
    navalThresholds: { elevated: 3, critical: 8 },
    strikeIndicators: { minTankers: 1, minAwacs: 1, minFighters: 3 }
  },
  {
    id: "south-china-sea",
    name: "South China Sea",
    shortName: "SCS",
    targetNation: null,
    regions: ["south-china-sea", "spratly-islands"],
    bounds: { north: 25, south: 5, east: 121, west: 105 },
    thresholds: { elevated: 6, critical: 15 },
    navalThresholds: { elevated: 4, critical: 10 },
    strikeIndicators: { minTankers: 1, minAwacs: 1, minFighters: 4 }
  },
  {
    id: "east-med-theater",
    name: "Eastern Mediterranean",
    shortName: "E.MED",
    targetNation: null,
    regions: ["eastern-med", "levant"],
    bounds: { north: 37, south: 33, east: 37, west: 25 },
    thresholds: { elevated: 4, critical: 10 },
    navalThresholds: { elevated: 3, critical: 6 },
    strikeIndicators: { minTankers: 1, minAwacs: 1, minFighters: 3 }
  },
  {
    id: "israel-gaza-theater",
    name: "Israel/Gaza",
    shortName: "GAZA",
    targetNation: "Gaza",
    regions: ["israel", "gaza", "west-bank"],
    bounds: { north: 33, south: 29, east: 36, west: 33 },
    thresholds: { elevated: 3, critical: 8 },
    navalThresholds: { elevated: 2, critical: 5 },
    strikeIndicators: { minTankers: 1, minAwacs: 1, minFighters: 3 }
  },
  {
    id: "yemen-redsea-theater",
    name: "Yemen/Red Sea",
    shortName: "RED SEA",
    targetNation: "Yemen",
    regions: ["yemen", "red-sea", "bab-el-mandeb"],
    bounds: { north: 22, south: 11, east: 54, west: 32 },
    thresholds: { elevated: 4, critical: 10 },
    navalThresholds: { elevated: 3, critical: 8 },
    strikeIndicators: { minTankers: 1, minAwacs: 1, minFighters: 3 }
  }
];

// shared/analysis-military-surge.ts
var SENSITIVE_REGIONS = [
  // Middle East / Iran area
  { id: "persian-gulf", name: "Persian Gulf", lat: 26.5, lon: 52, radiusKm: 600 },
  { id: "strait-hormuz", name: "Strait of Hormuz", lat: 26.5, lon: 56.5, radiusKm: 300 },
  { id: "iran-border", name: "Iran Border Region", lat: 33, lon: 47, radiusKm: 400 },
  // Eastern Europe / Russia borders
  { id: "baltics", name: "Baltic Region", lat: 56, lon: 24, radiusKm: 400 },
  { id: "poland-border", name: "Poland-Belarus Border", lat: 52.5, lon: 23.5, radiusKm: 300 },
  { id: "black-sea", name: "Black Sea", lat: 43.5, lon: 34, radiusKm: 500 },
  { id: "kaliningrad", name: "Kaliningrad Region", lat: 54.7, lon: 20.5, radiusKm: 250 },
  // Asia-Pacific
  { id: "taiwan-strait", name: "Taiwan Strait", lat: 24.5, lon: 119.5, radiusKm: 400 },
  { id: "south-china-sea", name: "South China Sea", lat: 14, lon: 114, radiusKm: 800 },
  { id: "korean-dmz", name: "Korean DMZ", lat: 38, lon: 127, radiusKm: 300 },
  { id: "japan-sea", name: "Sea of Japan", lat: 40, lon: 135, radiusKm: 500 },
  // Arctic / Alaska
  { id: "alaska-adiz", name: "Alaska ADIZ", lat: 62, lon: -165, radiusKm: 600 },
  { id: "arctic-russia", name: "Arctic (Russian Side)", lat: 72, lon: 70, radiusKm: 800 },
  // Mediterranean / Libya
  { id: "east-med", name: "Eastern Mediterranean", lat: 34.5, lon: 33, radiusKm: 500 },
  { id: "libya-coast", name: "Libya Coast", lat: 32.5, lon: 15, radiusKm: 400 },
  // Africa
  { id: "horn-africa", name: "Horn of Africa", lat: 10, lon: 45, radiusKm: 600 },
  { id: "sahel", name: "Sahel Region", lat: 15, lon: 5, radiusKm: 800 },
  // South America
  { id: "venezuela", name: "Venezuela", lat: 8, lon: -66, radiusKm: 500 }
];
var OPERATOR_HOMES = [
  { operator: "usaf", country: "USA", homeRegions: ["alaska-adiz"], alertThreshold: 2 },
  { operator: "usn", country: "USA", homeRegions: ["alaska-adiz"], alertThreshold: 2 },
  { operator: "usmc", country: "USA", homeRegions: ["alaska-adiz"], alertThreshold: 2 },
  { operator: "usa", country: "USA", homeRegions: ["alaska-adiz"], alertThreshold: 2 },
  { operator: "vks", country: "Russia", homeRegions: ["kaliningrad", "arctic-russia", "black-sea"], alertThreshold: 2 },
  { operator: "plaaf", country: "China", homeRegions: ["taiwan-strait", "south-china-sea"], alertThreshold: 2 },
  { operator: "plan", country: "China", homeRegions: ["taiwan-strait", "south-china-sea"], alertThreshold: 2 },
  { operator: "iaf", country: "Israel", homeRegions: ["east-med", "iran-border"], alertThreshold: 2 },
  { operator: "raf", country: "UK", homeRegions: ["baltics", "black-sea"], alertThreshold: 3 },
  { operator: "faf", country: "France", homeRegions: ["sahel", "east-med", "libya-coast"], alertThreshold: 3 },
  { operator: "gaf", country: "Germany", homeRegions: ["baltics"], alertThreshold: 3 }
];
var THEATERS = [
  {
    id: "middle-east",
    name: "Middle East / Persian Gulf",
    baseIds: [
      "al_udeid",
      "ali_al_salem_air_base",
      "camp_arifjan",
      "camp_buehring",
      "kuwait_naval_base",
      "naval_support_activity_bahrain",
      "isa_air_base",
      "masirah_aira_base",
      "rafo_thumrait",
      "al_dhafra_air_base",
      "port_of_jebel_ali",
      "fujairah_naval_base",
      "prince_sultan_air_base",
      "ain_assad_air_base",
      "camp_victory",
      "naval_support_facility_diego_garcia"
    ],
    centerLat: 27,
    centerLon: 50
  },
  {
    id: "europe-east",
    name: "Eastern Europe",
    baseIds: ["camp_bondsteel", "aitos_logistics_center", "bezmer", "graf_ignatievo"],
    centerLat: 45,
    centerLon: 25
  },
  {
    id: "europe-west",
    name: "Western Europe",
    baseIds: ["ramstein", "spangdahlem", "usag_stuttgart", "raf_lakenheath", "raf_mildenhall", "aviano"],
    centerLat: 50,
    centerLon: 8
  },
  {
    id: "pacific-west",
    name: "Western Pacific",
    baseIds: [
      "kadena_air_base",
      "camp_fuji",
      "fleet_activities_okinawa",
      "yokota",
      "misawsa",
      "osan_air_base",
      "kunsan_ab",
      "us_army_garrison_humphreys",
      "andersen_air_force_base"
    ],
    centerLat: 30,
    centerLon: 130
  },
  {
    id: "africa-horn",
    name: "Horn of Africa",
    baseIds: ["camp_lemonnier", "contingency_location_garoua", "niger_air_base_201"],
    centerLat: 10,
    centerLon: 40
  }
];
var SURGE_THRESHOLD = 2;
var BASELINE_WINDOW_HOURS = 48;
var BASELINE_MIN_SAMPLES = 6;
var TRANSPORT_CALLSIGN_PATTERNS = [
  /^RCH/i,
  /^REACH/i,
  /^MOOSE/i,
  /^HERKY/i,
  /^EVAC/i,
  /^DUSTOFF/i
];
var PROXIMITY_RADIUS_KM = 150;
var CLEANUP_INTERVAL = 60 * 60 * 1e3;
var MAX_HISTORY_HOURS = 72;
function getTheaterForBase(baseId) {
  for (const theater of THEATERS) {
    if (theater.baseIds.includes(baseId)) {
      return theater;
    }
  }
  return null;
}
function findNearbyBases(lat, lon) {
  const nearby = [];
  for (const base of MILITARY_BASES_EXPANDED) {
    const dist = haversineKm(lat, lon, base.lat, base.lon);
    if (dist <= PROXIMITY_RADIUS_KM) {
      nearby.push({ baseId: base.id, baseName: base.name, distance: dist });
    }
  }
  return nearby.sort((a, b) => a.distance - b.distance);
}
function isTransportFlight(flight) {
  if (flight.aircraftType === "transport" || flight.aircraftType === "tanker") {
    return true;
  }
  const callsign = flight.callsign.toUpperCase();
  return TRANSPORT_CALLSIGN_PATTERNS.some((p) => p.test(callsign));
}
function classifyFlight(flight) {
  if (isTransportFlight(flight)) return "transport";
  if (flight.aircraftType === "fighter") return "fighter";
  if (flight.aircraftType === "reconnaissance" || flight.aircraftType === "awacs") return "recon";
  return "other";
}
function getTheaterForFlight(flight) {
  const nearbyBases = findNearbyBases(flight.lat, flight.lon);
  for (const { baseId } of nearbyBases) {
    const theater = getTheaterForBase(baseId);
    if (theater) return theater;
  }
  for (const theater of THEATERS) {
    const dist = haversineKm(flight.lat, flight.lon, theater.centerLat, theater.centerLon);
    if (dist < 1500) return theater;
  }
  return null;
}
function getRegionForPosition(lat, lon) {
  for (const region of SENSITIVE_REGIONS) {
    const dist = haversineKm(lat, lon, region.lat, region.lon);
    if (dist <= region.radiusKm) {
      return region;
    }
  }
  return null;
}
function isHomeRegion(operator, regionId) {
  const config = OPERATOR_HOMES.find((o) => o.operator === operator);
  if (!config) return true;
  return config.homeRegions.includes(regionId);
}
function getOperatorThreshold(operator) {
  const config = OPERATOR_HOMES.find((o) => o.operator === operator);
  return config?.alertThreshold ?? 3;
}
function getOperatorCountry(operator) {
  const config = OPERATOR_HOMES.find((o) => o.operator === operator);
  return config?.country ?? "Unknown";
}
var COUNTRY_TO_ISO = {
  "USA": "US",
  "Russia": "RU",
  "China": "CN",
  "Israel": "IL",
  "Iran": "IR",
  "UK": "GB",
  "France": "FR",
  "Germany": "DE",
  "Taiwan": "TW",
  "Ukraine": "UA",
  "Saudi Arabia": "SA"
};
var REGION_AFFECTED_COUNTRIES = {
  "persian-gulf": ["IR", "SA"],
  "strait-hormuz": ["IR"],
  "iran-border": ["IR", "IL"],
  "baltics": ["RU", "UA"],
  "poland-border": ["RU", "UA"],
  "black-sea": ["RU", "UA"],
  "taiwan-strait": ["TW", "CN"],
  "south-china-sea": ["CN", "TW"],
  "east-med": ["IL", "IR"],
  "alaska-adiz": ["RU"]
};
function foreignPresenceToSignal(alert, newsContext) {
  const aircraftTypes = /* @__PURE__ */ new Map();
  const callsigns = [];
  for (const flight of alert.flights) {
    const typeKey = flight.aircraftModel || flight.aircraftType || "unknown";
    aircraftTypes.set(typeKey, (aircraftTypes.get(typeKey) || 0) + 1);
    callsigns.push(flight.callsign);
  }
  const aircraftList = Array.from(aircraftTypes.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type, count]) => `${count}x ${type}`).join(", ");
  const criticalCombos = [
    ["vks", "baltics"],
    ["vks", "poland-border"],
    ["vks", "alaska-adiz"],
    ["plaaf", "taiwan-strait"],
    ["plan", "taiwan-strait"],
    ["usaf", "iran-border"],
    ["usn", "persian-gulf"],
    ["iaf", "iran-border"]
  ];
  const isCritical = criticalCombos.some(
    ([op, reg]) => alert.operator === op && alert.region.id === reg
  );
  const severity = isCritical ? "critical" : alert.aircraftCount >= 5 ? "high" : "medium";
  const confidence = Math.min(0.95, 0.7 + alert.aircraftCount * 0.05);
  const relevantCountries = [];
  const operatorISO = COUNTRY_TO_ISO[alert.operatorCountry];
  if (operatorISO) relevantCountries.push(operatorISO);
  const affectedCountries = REGION_AFFECTED_COUNTRIES[alert.region.id] || [];
  for (const iso of affectedCountries) {
    if (!relevantCountries.includes(iso)) {
      relevantCountries.push(iso);
    }
  }
  const newsCorrelation = newsContext?.getCorrelation(relevantCountries) ?? null;
  const description = `${alert.aircraftCount} ${alert.operatorCountry} aircraft detected in ${alert.region.name}. ${aircraftList}. Callsigns: ${callsigns.slice(0, 4).join(", ")}${callsigns.length > 4 ? "..." : ""}`;
  const focalPointContexts = [];
  for (const iso of relevantCountries) {
    const fp = newsContext?.getFocalPoint(iso);
    if (fp && fp.newsMentions > 0) {
      focalPointContexts.push(`${fp.displayName}: ${fp.newsMentions} news mentions (${fp.urgency})`);
    }
  }
  const metadata = {
    operator: alert.operator,
    operatorCountry: alert.operatorCountry,
    regionId: alert.region.id,
    regionName: alert.region.name,
    lat: alert.region.lat,
    lon: alert.region.lon,
    aircraftCount: alert.aircraftCount,
    aircraftTypes: Object.fromEntries(aircraftTypes),
    callsigns,
    relevantCountries,
    newsCorrelation,
    focalPointContext: focalPointContexts.length > 0 ? focalPointContexts : null
  };
  return {
    id: `foreign-${alert.id}-${alert.firstDetected.getTime()}`,
    type: "military_surge",
    source: "Military Flight Tracking",
    title: `\u{1F6A8} ${alert.operatorCountry} Military in ${alert.region.name}`,
    description,
    severity,
    confidence,
    category: "military",
    timestamp: alert.firstDetected,
    location: {
      lat: alert.region.lat,
      lon: alert.region.lon,
      name: alert.region.name
    },
    data: metadata,
    metadata
  };
}
function getTheaterPostureSummaries(flights, activityHistory) {
  const summaries = [];
  for (const theater of POSTURE_THEATERS) {
    const theaterFlights = flights.filter(
      (f) => f.lat >= theater.bounds.south && f.lat <= theater.bounds.north && f.lon >= theater.bounds.west && f.lon <= theater.bounds.east
    );
    const byType = {
      fighters: theaterFlights.filter((f) => f.aircraftType === "fighter").length,
      tankers: theaterFlights.filter((f) => f.aircraftType === "tanker").length,
      awacs: theaterFlights.filter((f) => f.aircraftType === "awacs").length,
      reconnaissance: theaterFlights.filter((f) => f.aircraftType === "reconnaissance").length,
      transport: theaterFlights.filter((f) => f.aircraftType === "transport").length,
      bombers: theaterFlights.filter((f) => f.aircraftType === "bomber").length,
      drones: theaterFlights.filter((f) => f.aircraftType === "drone").length
    };
    const total = Object.values(byType).reduce((a, b) => a + b, 0);
    const byOperator = {};
    for (const f of theaterFlights) {
      byOperator[f.operator] = (byOperator[f.operator] || 0) + 1;
    }
    const postureLevel = total >= theater.thresholds.critical ? "critical" : total >= theater.thresholds.elevated ? "elevated" : "normal";
    const strikeCapable = byType.tankers >= theater.strikeIndicators.minTankers && byType.awacs >= theater.strikeIndicators.minAwacs && byType.fighters >= theater.strikeIndicators.minFighters;
    const history = activityHistory?.get(theater.id) || [];
    const recent = history.slice(-6);
    const older = history.slice(-12, -6);
    const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b.totalMilitary, 0) / recent.length : total;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b.totalMilitary, 0) / older.length : total;
    const changePercent = olderAvg > 0 ? Math.round((recentAvg - olderAvg) / olderAvg * 100) : 0;
    const trend = changePercent > 10 ? "increasing" : changePercent < -10 ? "decreasing" : "stable";
    const parts = [];
    if (byType.fighters > 0) parts.push(`${byType.fighters} fighters`);
    if (byType.tankers > 0) parts.push(`${byType.tankers} tankers`);
    if (byType.awacs > 0) parts.push(`${byType.awacs} AWACS`);
    if (byType.reconnaissance > 0) parts.push(`${byType.reconnaissance} recon`);
    const summary = parts.join(", ") || "No military aircraft";
    const headline = postureLevel === "critical" ? `Critical military buildup - ${theater.name}` : postureLevel === "elevated" ? `Elevated military activity - ${theater.name}` : `Normal activity - ${theater.name}`;
    summaries.push({
      theaterId: theater.id,
      theaterName: theater.name,
      shortName: theater.shortName,
      targetNation: theater.targetNation,
      // Aircraft
      fighters: byType.fighters,
      tankers: byType.tankers,
      awacs: byType.awacs,
      reconnaissance: byType.reconnaissance,
      transport: byType.transport,
      bombers: byType.bombers,
      drones: byType.drones,
      totalAircraft: total,
      // Vessels (populated client-side)
      destroyers: 0,
      frigates: 0,
      carriers: 0,
      submarines: 0,
      patrol: 0,
      auxiliaryVessels: 0,
      totalVessels: 0,
      // Metadata
      byOperator,
      postureLevel,
      strikeCapable,
      trend,
      changePercent,
      summary,
      headline,
      centerLat: (theater.bounds.north + theater.bounds.south) / 2,
      centerLon: (theater.bounds.east + theater.bounds.west) / 2,
      bounds: theater.bounds
    });
  }
  return summaries;
}
var TARGET_NATION_CODES = {
  "Iran": "IR",
  "Taiwan": "TW",
  "North Korea": "KP",
  "Gaza": "PS",
  "Yemen": "YE"
};
function recalcPostureWithVessels(postures, getCii) {
  for (const p of postures) {
    const theater = POSTURE_THEATERS.find((t) => t.id === p.theaterId);
    if (!theater) continue;
    const airLevel = p.totalAircraft >= theater.thresholds.critical ? 2 : p.totalAircraft >= theater.thresholds.elevated ? 1 : 0;
    const navalLevel = p.totalVessels >= theater.navalThresholds.critical ? 2 : p.totalVessels >= theater.navalThresholds.elevated ? 1 : 0;
    let ciiLevel = 0;
    if (theater.targetNation && getCii) {
      const code = TARGET_NATION_CODES[theater.targetNation];
      if (code) {
        const cii = getCii(code);
        if (cii !== null) {
          ciiLevel = cii >= 85 ? 2 : cii >= 70 ? 1 : 0;
        }
      }
    }
    const combined = Math.max(airLevel, navalLevel, ciiLevel);
    p.postureLevel = combined === 2 ? "critical" : combined === 1 ? "elevated" : "normal";
    const parts = [];
    if (p.totalAircraft > 0) parts.push(`${p.totalAircraft} aircraft`);
    if (p.totalVessels > 0) parts.push(`${p.totalVessels} vessels`);
    const assetSummary = parts.join(" + ") || "No assets";
    p.headline = p.postureLevel === "critical" ? `Critical military buildup - ${p.theaterName} (${assetSummary})` : p.postureLevel === "elevated" ? `Elevated military activity - ${p.theaterName} (${assetSummary})` : `Normal activity - ${p.theaterName}`;
  }
}
function getCriticalPostures(flights, activityHistory) {
  return getTheaterPostureSummaries(flights, activityHistory).filter(
    (p) => p.postureLevel === "critical" || p.postureLevel === "elevated" && p.strikeCapable
  );
}
var MilitarySurgeEngine = class {
  now;
  newsContext;
  getCii;
  activityHistory = /* @__PURE__ */ new Map();
  activeSurges = /* @__PURE__ */ new Map();
  activeForeignPresence = /* @__PURE__ */ new Map();
  seenForeignAlerts = /* @__PURE__ */ new Set();
  lastCleanup;
  constructor(options = {}) {
    this.now = options.now ?? (() => Date.now());
    this.newsContext = options.newsContext ?? null;
    this.getCii = options.getCii ?? null;
    this.lastCleanup = this.now();
  }
  calculateBaseline(theaterId) {
    const history = this.activityHistory.get(theaterId) || [];
    const cutoff = this.now() - BASELINE_WINDOW_HOURS * 60 * 60 * 1e3;
    const relevant = history.filter((h) => h.timestamp >= cutoff);
    if (relevant.length < BASELINE_MIN_SAMPLES) {
      return { transport: 3, fighter: 2, recon: 1 };
    }
    const avgTransport = relevant.reduce((sum, h) => sum + h.transportCount, 0) / relevant.length;
    const avgFighter = relevant.reduce((sum, h) => sum + h.fighterCount, 0) / relevant.length;
    const avgRecon = relevant.reduce((sum, h) => sum + h.reconCount, 0) / relevant.length;
    return {
      transport: Math.max(2, avgTransport),
      fighter: Math.max(1, avgFighter),
      recon: Math.max(1, avgRecon)
    };
  }
  cleanupOldHistory() {
    const now = this.now();
    if (now - this.lastCleanup < CLEANUP_INTERVAL) return;
    this.lastCleanup = now;
    const cutoff = now - MAX_HISTORY_HOURS * 60 * 60 * 1e3;
    for (const [theaterId, history] of this.activityHistory) {
      const filtered = history.filter((h) => h.timestamp >= cutoff);
      if (filtered.length === 0) {
        this.activityHistory.delete(theaterId);
      } else {
        this.activityHistory.set(theaterId, filtered);
      }
    }
    for (const [surgeId, surge] of this.activeSurges) {
      const age = now - surge.lastUpdated.getTime();
      if (age > 2 * 60 * 60 * 1e3) {
        this.activeSurges.delete(surgeId);
      }
    }
  }
  analyzeFlightsForSurge(flights) {
    this.cleanupOldHistory();
    const theaterFlights = /* @__PURE__ */ new Map();
    for (const flight of flights) {
      const theater = getTheaterForFlight(flight);
      if (!theater) continue;
      const existing = theaterFlights.get(theater.id) || [];
      existing.push(flight);
      theaterFlights.set(theater.id, existing);
    }
    const now = this.now();
    const newAlerts = [];
    for (const [theaterId, theaterFlightList] of theaterFlights) {
      const theater = THEATERS.find((t) => t.id === theaterId);
      if (!theater) continue;
      let transportCount = 0;
      let fighterCount = 0;
      let reconCount = 0;
      const aircraftTypes = /* @__PURE__ */ new Map();
      const nearbyBasesSet = /* @__PURE__ */ new Set();
      for (const flight of theaterFlightList) {
        const classification = classifyFlight(flight);
        if (classification === "transport") transportCount++;
        else if (classification === "fighter") fighterCount++;
        else if (classification === "recon") reconCount++;
        const typeKey = flight.aircraftModel || flight.aircraftType || "unknown";
        aircraftTypes.set(typeKey, (aircraftTypes.get(typeKey) || 0) + 1);
        const nearby = findNearbyBases(flight.lat, flight.lon);
        for (const { baseName } of nearby.slice(0, 3)) {
          nearbyBasesSet.add(baseName);
        }
      }
      const activity = {
        theaterId,
        timestamp: now,
        transportCount,
        fighterCount,
        reconCount,
        totalMilitary: theaterFlightList.length,
        flightIds: theaterFlightList.map((f) => f.id)
      };
      const history = this.activityHistory.get(theaterId) || [];
      history.push(activity);
      if (history.length > 200) history.shift();
      this.activityHistory.set(theaterId, history);
      const baseline = this.calculateBaseline(theaterId);
      if (transportCount >= baseline.transport * SURGE_THRESHOLD && transportCount >= 5) {
        const surgeId = `airlift-${theaterId}`;
        const surgeMultiple = transportCount / baseline.transport;
        const existing = this.activeSurges.get(surgeId);
        if (existing) {
          existing.currentCount = transportCount;
          existing.surgeMultiple = surgeMultiple;
          existing.aircraftTypes = aircraftTypes;
          existing.nearbyBases = Array.from(nearbyBasesSet);
          existing.lastUpdated = new Date(now);
        } else {
          const alert = {
            id: surgeId,
            theater,
            type: "airlift",
            currentCount: transportCount,
            baselineCount: Math.round(baseline.transport),
            surgeMultiple,
            aircraftTypes,
            nearbyBases: Array.from(nearbyBasesSet),
            firstDetected: new Date(now),
            lastUpdated: new Date(now)
          };
          this.activeSurges.set(surgeId, alert);
          newAlerts.push(alert);
        }
      }
      if (fighterCount >= baseline.fighter * SURGE_THRESHOLD && fighterCount >= 4) {
        const surgeId = `fighter-${theaterId}`;
        const surgeMultiple = fighterCount / baseline.fighter;
        if (!this.activeSurges.has(surgeId)) {
          const alert = {
            id: surgeId,
            theater,
            type: "fighter",
            currentCount: fighterCount,
            baselineCount: Math.round(baseline.fighter),
            surgeMultiple,
            aircraftTypes,
            nearbyBases: Array.from(nearbyBasesSet),
            firstDetected: new Date(now),
            lastUpdated: new Date(now)
          };
          this.activeSurges.set(surgeId, alert);
          newAlerts.push(alert);
        }
      }
    }
    return newAlerts;
  }
  getActiveSurges() {
    return Array.from(this.activeSurges.values());
  }
  getTheaterActivity(theaterId) {
    return this.activityHistory.get(theaterId) || [];
  }
  detectForeignMilitaryPresence(flights) {
    const newAlerts = [];
    const presenceMap = /* @__PURE__ */ new Map();
    for (const flight of flights) {
      const region = getRegionForPosition(flight.lat, flight.lon);
      if (!region) continue;
      if (isHomeRegion(flight.operator, region.id)) continue;
      const key = `${flight.operator}-${region.id}`;
      const existing = presenceMap.get(key);
      if (existing) {
        existing.flights.push(flight);
      } else {
        presenceMap.set(key, { operator: flight.operator, region, flights: [flight] });
      }
    }
    for (const [key, presence] of presenceMap) {
      const threshold = getOperatorThreshold(presence.operator);
      if (presence.flights.length < threshold) continue;
      const now = this.now();
      const alertKey = `${key}-${Math.floor(now / (2 * 60 * 60 * 1e3))}`;
      if (this.seenForeignAlerts.has(alertKey)) continue;
      this.seenForeignAlerts.add(alertKey);
      const alert = {
        id: key,
        operator: presence.operator,
        operatorCountry: getOperatorCountry(presence.operator),
        region: presence.region,
        aircraftCount: presence.flights.length,
        flights: presence.flights,
        firstDetected: new Date(now)
      };
      this.activeForeignPresence.set(key, alert);
      newAlerts.push(alert);
    }
    return newAlerts;
  }
  getActiveForeignPresence() {
    return Array.from(this.activeForeignPresence.values());
  }
  foreignPresenceToSignal(alert) {
    return foreignPresenceToSignal(alert, this.newsContext);
  }
  getTheaterPostureSummaries(flights) {
    return getTheaterPostureSummaries(flights, this.activityHistory);
  }
  recalcPostureWithVessels(postures) {
    recalcPostureWithVessels(postures, this.getCii);
  }
  getCriticalPostures(flights) {
    return getCriticalPostures(flights, this.activityHistory);
  }
};

// shared/analysis-population-exposure.ts
var PRIORITY_COUNTRIES = {
  UKR: { name: "Ukraine", pop: 37e6, area: 603550 },
  RUS: { name: "Russia", pop: 1441e5, area: 17098242 },
  ISR: { name: "Israel", pop: 98e5, area: 22072 },
  PSE: { name: "Palestine", pop: 54e5, area: 6020 },
  SYR: { name: "Syria", pop: 221e5, area: 185180 },
  IRN: { name: "Iran", pop: 886e5, area: 1648195 },
  TWN: { name: "Taiwan", pop: 236e5, area: 36193 },
  ETH: { name: "Ethiopia", pop: 1265e5, area: 1104300 },
  SDN: { name: "Sudan", pop: 481e5, area: 1861484 },
  SSD: { name: "South Sudan", pop: 114e5, area: 619745 },
  SOM: { name: "Somalia", pop: 181e5, area: 637657 },
  YEM: { name: "Yemen", pop: 344e5, area: 527968 },
  AFG: { name: "Afghanistan", pop: 422e5, area: 652230 },
  PAK: { name: "Pakistan", pop: 2405e5, area: 881913 },
  IND: { name: "India", pop: 14286e5, area: 3287263 },
  MMR: { name: "Myanmar", pop: 542e5, area: 676578 },
  COD: { name: "DR Congo", pop: 1023e5, area: 2344858 },
  NGA: { name: "Nigeria", pop: 2238e5, area: 923768 },
  MLI: { name: "Mali", pop: 226e5, area: 1240192 },
  BFA: { name: "Burkina Faso", pop: 227e5, area: 274200 }
};
var EXPOSURE_CENTROIDS = {
  UKR: [48.4, 31.2],
  RUS: [61.5, 105.3],
  ISR: [31, 34.8],
  PSE: [31.9, 35.2],
  SYR: [35, 38],
  IRN: [32.4, 53.7],
  TWN: [23.7, 121],
  ETH: [9.1, 40.5],
  SDN: [15.5, 32.5],
  SSD: [6.9, 31.3],
  SOM: [5.2, 46.2],
  YEM: [15.6, 48.5],
  AFG: [33.9, 67.7],
  PAK: [30.4, 69.3],
  IND: [20.6, 79],
  MMR: [19.8, 96.7],
  COD: [-4, 21.8],
  NGA: [9.1, 7.5],
  MLI: [17.6, -4],
  BFA: [12.3, -1.6]
};
var FALLBACK_INFO = { name: "", pop: 5e7, area: 5e5 };
var MAX_EXPOSURE_RADIUS_KM = 1e3;
function computeExposure(lat, lon, radiusKm) {
  const effectiveRadiusKm = Math.max(0, Number.isFinite(radiusKm) ? radiusKm : 0);
  let bestMatch = null;
  let bestDist = Infinity;
  for (const [code, [cLat, cLon]] of Object.entries(EXPOSURE_CENTROIDS)) {
    const dist = Math.sqrt((lat - cLat) ** 2 + (lon - cLon) ** 2);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = code;
    }
  }
  const info = bestMatch ? PRIORITY_COUNTRIES[bestMatch] ?? FALLBACK_INFO : FALLBACK_INFO;
  const density = info.pop / info.area;
  const areaKm2 = Math.PI * effectiveRadiusKm * effectiveRadiusKm;
  return {
    exposedPopulation: Math.round(density * areaKm2),
    exposureRadiusKm: effectiveRadiusKm,
    nearestCountry: bestMatch || "",
    densityPerKm2: Math.round(density)
  };
}
function computeBoundedExposure(lat, lon, radiusKm) {
  const boundedRadiusKm = Number.isFinite(radiusKm) ? Math.min(MAX_EXPOSURE_RADIUS_KM, Math.max(0, radiusKm)) : 0;
  return computeExposure(lat, lon, boundedRadiusKm);
}
function getRadiusForEventType(type) {
  switch (type) {
    case "conflict":
    case "battle":
    case "state-based":
    case "non-state":
    case "one-sided":
      return 50;
    case "earthquake":
      return 100;
    case "flood":
      return 100;
    case "fire":
    case "wildfire":
      return 30;
    default:
      return 50;
  }
}
function listCountryPopulations() {
  return Object.entries(PRIORITY_COUNTRIES).map(([code, info]) => ({
    code,
    name: info.name,
    population: info.pop,
    densityPerKm2: Math.round(info.pop / info.area)
  }));
}

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
async function readJsonBatchFromUpstashWithStatus(keys, timeoutMs = 3e3) {
  if (keys.length === 0) return [];
  const creds = getRedisCredentials();
  if (!creds) return keys.map(() => ({ status: "error", value: null }));
  try {
    const resp = await fetch(`${creds.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
        "User-Agent": "worldmonitor-edge/1.0"
      },
      body: JSON.stringify(keys.map((key) => ["GET", key])),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!resp.ok) return keys.map(() => ({ status: "error", value: null }));
    const entries = await resp.json();
    if (!Array.isArray(entries) || entries.length !== keys.length) {
      return keys.map(() => ({ status: "error", value: null }));
    }
    return entries.map((entry) => {
      if (!entry || typeof entry !== "object" || !Object.prototype.hasOwnProperty.call(entry, "result") || Object.prototype.hasOwnProperty.call(entry, "error")) {
        return { status: "error", value: null };
      }
      if (entry.result === null) return { status: "miss", value: null };
      try {
        const parsed = typeof entry.result === "string" ? JSON.parse(entry.result) : entry.result;
        const value = unwrapEnvelope(parsed).data;
        return value === void 0 ? { status: "error", value: null } : { status: "hit", value };
      } catch {
        return { status: "error", value: null };
      }
    });
  } catch {
    return keys.map(() => ({ status: "error", value: null }));
  }
}
function getRedisCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

// api/_content-freshness.js
function hasOwnField(value, field) {
  return value !== null && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, field);
}
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}
function finiteNumber2(value) {
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
  const criticalOldestObservedAt = finiteNumber2(block?.criticalOldestObservedAt);
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
    oldestObservedAt: finiteNumber2(block?.oldestObservedAt),
    oldestObservedCountry: typeof block?.oldestObservedCountry === "string" ? block.oldestObservedCountry.slice(0, 8) : null,
    oldestAgeMinutes: finiteNumber2(block?.oldestAgeMinutes) === null ? null : Math.round(block.oldestAgeMinutes),
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

// api/mcp/freshness.ts
function parseFiniteRecordCount(raw) {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
function evaluateFreshness(checks, metas, now = Date.now(), activationStates) {
  let stale = false;
  let contentFreshnessPendingUntil;
  let oldestFetchedAt = Number.POSITIVE_INFINITY;
  let hasAnyValidMeta = false;
  let hasAllValidMeta = true;
  for (const [i, check] of checks.entries()) {
    const meta = metas[i];
    const fetchedAt = meta && typeof meta === "object" && "fetchedAt" in meta ? Number(meta.fetchedAt) : Number.NaN;
    if (!Number.isFinite(fetchedAt) || fetchedAt <= 0) {
      hasAllValidMeta = false;
      stale = true;
      continue;
    }
    hasAnyValidMeta = true;
    oldestFetchedAt = Math.min(oldestFetchedAt, fetchedAt);
    stale ||= (now - fetchedAt) / 6e4 > check.maxStaleMin;
    if (check.minRecordCount != null) {
      const recordCount = meta && typeof meta === "object" && "recordCount" in meta ? parseFiniteRecordCount(meta.recordCount) : null;
      stale ||= recordCount == null || recordCount < check.minRecordCount;
    }
    if (check.requireContentFreshness) {
      const assessment = buildContentFreshnessAssessment(
        meta,
        check.requireContentFreshness,
        now
      );
      const pendingWindow = assessment && !assessment.fieldPresent && check.contentFreshnessActivationKey ? getActiveContentFreshnessActivationWindow(
        check.contentFreshnessActivationKey,
        activationStates?.get(check.contentFreshnessActivationKey),
        now
      ) : null;
      const pendingActivation = pendingWindow !== null;
      if (pendingWindow !== null) {
        const deadline = new Date(pendingWindow.untilMs).toISOString();
        if (contentFreshnessPendingUntil === void 0 || deadline < contentFreshnessPendingUntil) {
          contentFreshnessPendingUntil = deadline;
        }
      }
      if (!pendingActivation) {
        stale ||= !assessment?.usable || assessment.contentStale;
      }
    }
  }
  return {
    cached_at: hasAnyValidMeta && hasAllValidMeta ? new Date(oldestFetchedAt).toISOString() : null,
    stale,
    ...contentFreshnessPendingUntil === void 0 ? {} : { contentFreshnessPendingUntil }
  };
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

// api/mcp/registry/analysis-tools.ts
function hasArrayField(value, field) {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, field) && Array.isArray(value[field]);
}
function hasObjectField(value, field) {
  const fieldValue = value && typeof value === "object" && !Array.isArray(value) ? value[field] : null;
  return !!fieldValue && typeof fieldValue === "object" && !Array.isArray(fieldValue);
}
var ANALYSIS_PAYLOAD_VALIDATORS = {
  "unrest:events:v1": (value) => hasArrayField(value, "events"),
  "military:flights:v1": (value) => hasArrayField(value, "flights"),
  "seismology:earthquakes:v1": (value) => hasArrayField(value, "earthquakes"),
  "usni-fleet:sebuf:v1": (value) => hasArrayField(value, "vessels"),
  "news:insights:v1": (value) => hasArrayField(value, "topStories"),
  "intelligence:cross-source-signals:v1": (value) => hasArrayField(value, "signals"),
  [CII_RISK_SCORE_CACHE_KEYS.live]: (value) => hasArrayField(value, "ciiScores"),
  "infrastructure:submarine-cables:v1": (value) => hasArrayField(value, "cables"),
  "theater-posture:sebuf:v1": (value) => hasArrayField(value, "theaters"),
  "military:surges:v1": (value) => Array.isArray(value) || hasArrayField(value, "surges"),
  "military:surges:history:v1": (value) => hasArrayField(value, "history"),
  "wildfire:fires:v1": (value) => hasArrayField(value, "fireDetections"),
  "conflict:ucdp-events:v1": (value) => hasArrayField(value, "events"),
  "cable-health-v1": (value) => hasObjectField(value, "cables"),
  "infra:outages:v1": (value) => hasArrayField(value, "outages"),
  "temporal:anomalies:v1": (value) => hasArrayField(value, "anomalies"),
  "thermal:escalation:v1": (value) => hasArrayField(value, "clusters"),
  "supply_chain:shipping_stress:v1": (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const record = value;
    return Object.prototype.hasOwnProperty.call(record, "stressScore") && Object.prototype.hasOwnProperty.call(record, "stressLevel");
  }
};
async function readCachesWithFreshness(keys, checks) {
  const results = await readJsonBatchFromUpstashWithStatus([
    ...keys,
    ...checks.map((check) => check.key)
  ]);
  const payloadReads = results.slice(0, keys.length).map((result, index) => {
    const validator = ANALYSIS_PAYLOAD_VALIDATORS[keys[index] ?? ""];
    if (result.status === "hit" && validator && !validator(result.value)) {
      return { status: "error", value: null };
    }
    return result;
  });
  const metaReads = results.slice(keys.length);
  const payloads = payloadReads.map((result) => result.value);
  const unavailablePayloads = keys.filter(
    (_key, index) => payloadReads[index]?.status !== "hit" || payloadReads[index]?.value === null
  );
  const unavailableMetadata = checks.filter((_check, index) => metaReads[index]?.status !== "hit" || metaReads[index]?.value === null).map((check) => check.key);
  const failedPayloads = keys.filter((_key, index) => payloadReads[index]?.status === "error");
  const failedMetadata = checks.filter((_check, index) => metaReads[index]?.status === "error").map((check) => check.key);
  const unavailableInputs = [...unavailablePayloads, ...unavailableMetadata];
  const failedInputs = [...failedPayloads, ...failedMetadata];
  const evaluated = evaluateFreshness(checks, metaReads.map((result) => result.value));
  return {
    payloads,
    freshness: {
      ...evaluated,
      stale: evaluated.stale || unavailableInputs.length > 0,
      unavailable_inputs: unavailableInputs,
      failed_inputs: failedInputs
    }
  };
}
var ANALYSIS_CACHE_STATUS_PROPERTIES = {
  unavailable_inputs: {
    type: "array",
    items: { type: "string" },
    description: "Required cache keys that were missing or unreadable; their contribution is not treated as quiet."
  },
  failed_inputs: {
    type: "array",
    items: { type: "string" },
    description: "Subset of unavailable_inputs whose Redis read failed rather than returning a genuine miss."
  }
};
function requireAnyInput(payloads, freshness, message) {
  if (payloads.every((value) => value === null)) {
    throw new McpSourceUnavailableError(
      message,
      freshness.unavailable_inputs,
      freshness.failed_inputs
    );
  }
}
function resolveLimit(raw, fallback) {
  if (raw === void 0 || raw === null) return fallback;
  const parsed = Math.round(Number(raw));
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return Number.POSITIVE_INFINITY;
  return parsed;
}
var ANALYSIS_TOOLS = [
  {
    name: "get_signal_convergence",
    _outputBudgetBytes: 65536,
    description: "Geographic signal convergence: grid cells where protests, military activity, naval movements, and earthquakes co-occur. The same multi-domain convergence engine the dashboard map runs, executed server-side over the seeded feeds: unrest events, tracked military flights, USNI fleet positions (region centroids), and USGS earthquakes are bucketed into one-degree cells over a 24-hour window, and any cell where enough distinct domains overlap becomes an alert scored by breadth and volume. Each alert carries coordinates, the contributing domains, a reverse-geocoded location name from the curated hotspot/chokepoint/conflict-zone gazetteer, and the total event count. Pass lat/lon/radius_km together to narrow to one area, or min_domains to tighten the co-occurrence bar. An empty alert list with fresh inputs means nothing is converging \u2014 signal in itself.",
    inputSchema: {
      type: "object",
      properties: {
        lat: { type: "number", minimum: -90, maximum: 90, description: "Latitude of the area of interest; requires lon and radius_km as well." },
        lon: { type: "number", minimum: -180, maximum: 180, description: "Longitude of the area of interest; requires lat and radius_km as well." },
        radius_km: { type: "number", exclusiveMinimum: 0, maximum: 2e4, description: "Positive radius in km around lat/lon to keep alerts for; requires lat and lon (maximum 20,000)." },
        min_domains: {
          type: "number",
          minimum: 2,
          maximum: 5,
          description: "Distinct signal domains required per cell, 2-5 (default 3); 5 is a compatibility safety threshold that yields no alerts while four domains are ingested."
        }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      properties: {
        cached_at: { type: ["string", "null"], description: "Oldest fetch time across the contributing feeds." },
        stale: { type: "boolean", description: "True when any contributing feed is older than its freshness budget." },
        ...ANALYSIS_CACHE_STATUS_PROPERTIES,
        data: {
          type: "object",
          properties: {
            alerts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cellId: { type: "string" },
                  lat: { type: "number" },
                  lon: { type: "number" },
                  location: { type: "string" },
                  types: { type: "array", items: { type: "string" } },
                  totalEvents: { type: "number" },
                  score: { type: "number" }
                }
              }
            },
            cell_count: { type: "number" },
            min_domains: { type: "number" },
            feeds: { type: "object", description: "Per-feed ingested event counts (0 = feed empty or unavailable)." }
          },
          required: []
        },
        error: { type: "string", description: "Present only on a user-input failure; the envelope keys are still returned." }
      },
      required: ["cached_at", "stale", "data"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      const lat = typeof params.lat === "number" ? params.lat : null;
      const lon = typeof params.lon === "number" ? params.lon : null;
      const radiusKm = typeof params.radius_km === "number" ? params.radius_km : null;
      const provided = [lat, lon, radiusKm].filter((v) => v !== null).length;
      if (provided > 0 && provided < 3) {
        return {
          cached_at: null,
          stale: false,
          data: { alerts: [], cell_count: 0, min_domains: 0, feeds: {} },
          error: "lat, lon, and radius_km must be provided together (all three or none)."
        };
      }
      if (provided === 3 && (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(radiusKm) || lat < -90 || lat > 90 || lon < -180 || lon > 180 || radiusKm <= 0 || radiusKm > 2e4)) {
        return {
          cached_at: null,
          stale: false,
          data: { alerts: [], cell_count: 0, min_domains: 0, feeds: {} },
          error: "lat must be within [-90, 90], lon within [-180, 180], and radius_km within (0, 20000]."
        };
      }
      const minDomains = Math.min(5, Math.max(2, Math.round(Number(params.min_domains ?? 3)) || 3));
      const keys = ["unrest:events:v1", "military:flights:v1", "seismology:earthquakes:v1", "usni-fleet:sebuf:v1"];
      const checks = [
        { key: "seed-meta:unrest:events", maxStaleMin: 120 },
        { key: "seed-meta:military:flights", maxStaleMin: 30 },
        { key: "seed-meta:seismology:earthquakes", maxStaleMin: 30 },
        { key: "seed-meta:military:usni-fleet", maxStaleMin: 720 }
      ];
      const { payloads: [unrest, flights, quakes, fleet], freshness } = await readCachesWithFreshness(keys, checks);
      requireAnyInput(
        [unrest, flights, quakes, fleet],
        freshness,
        "No convergence input feeds are available"
      );
      const now = Date.now();
      const engine = new GeoConvergenceEngine({ convergenceThreshold: minDomains, now: () => now });
      const feeds = {
        protests: unrestEventsToGeoEvents(unrest, { now }),
        military_flights: militaryFlightsToGeoEvents(flights, { now }),
        earthquakes: earthquakesToGeoEvents(quakes, { now }),
        naval_vessels: usniVesselsToGeoEvents(fleet, { now })
      };
      engine.ingestEvents(feeds.protests, "protest");
      engine.ingestEvents(feeds.military_flights, "military_flight");
      engine.ingestEvents(feeds.earthquakes, "earthquake");
      engine.ingestEvents(feeds.naval_vessels, "military_vessel");
      let alerts = engine.detect(/* @__PURE__ */ new Set());
      if (lat !== null && lon !== null && radiusKm !== null) {
        const toRad = (d) => d * Math.PI / 180;
        alerts = alerts.filter((alert) => {
          const dLat = toRad(alert.lat - lat);
          const dLon = toRad(alert.lon - lon);
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(alert.lat)) * Math.sin(dLon / 2) ** 2;
          return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusKm;
        });
      }
      return {
        ...freshness,
        data: {
          alerts: alerts.map((alert) => ({
            ...alert,
            location: getLocationName(alert.lat, alert.lon, MCP_GEO_PLACES)
          })),
          cell_count: engine.cellCount(),
          min_domains: minDomains,
          feeds: Object.fromEntries(Object.entries(feeds).map(([name, events]) => [name, events.length]))
        }
      };
    },
    _coverageKeys: ["unrest:events:v1", "military:flights:v1", "seismology:earthquakes:v1", "usni-fleet:sebuf:v1"],
    _apiPaths: []
  },
  {
    name: "get_focal_points",
    _outputBudgetBytes: 65536,
    description: "Focal-point detection: entities where news coverage and live map signals converge, ranked by multi-signal score. Runs the dashboard focal-point engine server-side: seeded news story clusters are entity-matched against the curated registry of countries, companies, and organizations, then cross-referenced with cross-source escalation signals mapped to countries through the same entity index. Each focal point reports its urgency band, news and signal scores, a correlation bonus when headlines and map signals name the same entity, supporting headlines, and a generated narrative. The response also carries an application-authored ai_context block suitable for grounding follow-up analysis; source headlines remain separate in the focal-point evidence, plus mapping-coverage counters so a thin result is distinguishable from an outage. Filter to one country with country_code; cap the list with limit.",
    inputSchema: {
      type: "object",
      properties: {
        country_code: { type: "string", description: "Filter focal points to one country (ISO-2) and entities the registry relates to it." },
        limit: { type: "number", description: "Cap the focal point list (default 10, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      properties: {
        cached_at: { type: ["string", "null"], description: "Oldest fetch time across the contributing feeds." },
        stale: { type: "boolean", description: "True when any contributing feed is older than its freshness budget." },
        ...ANALYSIS_CACHE_STATUS_PROPERTIES,
        data: {
          type: "object",
          properties: {
            focal_points: { type: "array", items: { type: "object" } },
            ai_context: { type: "string" },
            coverage: {
              type: "object",
              properties: {
                clusters: { type: "number" },
                signals_total: { type: "number" },
                signals_mapped: { type: "number" },
                signals_unmapped: { type: "number" }
              }
            }
          },
          required: []
        }
      },
      required: ["cached_at", "stale", "data"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      const limit = resolveLimit(params.limit, 10);
      const keys = ["news:insights:v1", "intelligence:cross-source-signals:v1", CII_RISK_SCORE_CACHE_KEYS.live];
      const checks = [
        { key: "seed-meta:news:insights", maxStaleMin: 30 },
        { key: "seed-meta:intelligence:cross-source-signals", maxStaleMin: 30 },
        { key: "seed-meta:intelligence:risk-scores", maxStaleMin: 30, minRecordCount: 3 }
      ];
      const { payloads: [insights, crossSource, riskScores], freshness } = await readCachesWithFreshness(keys, checks);
      requireAnyInput(
        [insights, crossSource, riskScores],
        freshness,
        "No focal-point input feeds are available"
      );
      const index = getEntityIndex();
      const clusters = insightsToFocalClusters(insights);
      const mapping = crossSourceSignalsToSignalSummary(crossSource, index);
      const summary = new FocalPointCore(index).analyze(clusters, mapping.summary);
      const ciiLookup = riskScoresToCiiLookup(riskScores);
      let points = summary.focalPoints;
      const countryCode = typeof params.country_code === "string" ? params.country_code : "";
      if (countryCode) points = filterFocalPointsByCountry(points, countryCode, index);
      const selectedPoints = points.slice(0, limit);
      return {
        ...freshness,
        data: {
          focal_points: selectedPoints.map((point) => ({
            ...point,
            ciiScore: point.entityType === "country" ? ciiLookup(point.entityId) : null
          })),
          ai_context: generateAgentSafeAIContext(selectedPoints),
          coverage: {
            clusters: clusters.length,
            signals_total: mapping.signalsTotal,
            signals_mapped: mapping.signalsMapped,
            signals_unmapped: mapping.signalsUnmapped
          }
        }
      };
    },
    _coverageKeys: ["news:insights:v1", "intelligence:cross-source-signals:v1", CII_RISK_SCORE_CACHE_KEYS.live],
    _apiPaths: []
  },
  {
    name: "simulate_infrastructure_cascade",
    _outputBudgetBytes: 131072,
    description: "Infrastructure cascade simulation: what fails downstream when a cable, chokepoint, pipeline, or port is disrupted. Builds the dashboard dependency graph server-side from the seeded TeleGeography submarine-cable table plus the curated pipeline, port, and maritime-chokepoint registries, then runs breadth-first failure propagation from the chosen source node. Results include every affected node with its degraded capacity share, per-country impact categories, redundancy candidates, and graph statistics. Call with no source_id to receive the catalog of simulatable node ids grouped by type; disruption_level scales the initial failure from partial (0.1) to total (1, the default). Chained capacity math multiplies along paths, so distant impacts shrink realistically instead of cascading at full strength.",
    inputSchema: {
      type: "object",
      properties: {
        source_id: { type: "string", description: "Node id to disrupt (see the no-argument catalog for valid ids)." },
        disruption_level: { type: "number", description: "Initial failure severity between 0.1 and 1 (default 1)." }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      properties: {
        cached_at: { type: ["string", "null"], description: "Fetch time of the seeded cable table." },
        stale: { type: "boolean", description: "True when the cable table is older than its freshness budget." },
        ...ANALYSIS_CACHE_STATUS_PROPERTIES,
        data: {
          type: "object",
          properties: {
            catalog: { type: ["object", "null"], description: "Node ids by type; present only when source_id is omitted." },
            cascade: { type: ["object", "null"], description: "Cascade result; present only when source_id is given." },
            stats: { type: "object" }
          },
          required: []
        },
        error: { type: "string", description: "Present only on a user-input failure; the envelope keys are still returned." },
        known_id_sample: { type: "array", items: { type: "string" }, description: "Sample of valid node ids; present only alongside an unknown-source_id error." }
      },
      required: ["cached_at", "stale", "data"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      const checks = [
        { key: "seed-meta:infrastructure:submarine-cables", maxStaleMin: 25200 }
      ];
      const { payloads: [cablesPayload], freshness } = await readCachesWithFreshness(
        ["infrastructure:submarine-cables:v1"],
        checks
      );
      const cables = submarineCablesToCableInputs(cablesPayload);
      const graph = buildDependencyGraph({ cables, waterways: MCP_CASCADE_WATERWAYS });
      const stats = getGraphStats(graph);
      const sourceId = typeof params.source_id === "string" ? params.source_id.trim() : "";
      if (!sourceId) {
        const catalog = {};
        for (const node of graph.nodes.values()) {
          if (node.type === "country") continue;
          (catalog[node.type] ??= []).push({ id: node.id, name: node.name });
        }
        return { ...freshness, data: { catalog, cascade: null, stats } };
      }
      if (!graph.nodes.has(sourceId)) {
        if (cablesPayload === null && sourceId.startsWith("cable:")) {
          throw new McpSourceUnavailableError(
            "The submarine-cable catalog is unavailable",
            freshness.unavailable_inputs,
            freshness.failed_inputs
          );
        }
        const sample = [...graph.nodes.keys()].filter((id) => !id.startsWith("country-")).slice(0, 12);
        return {
          ...freshness,
          data: { catalog: null, cascade: null, stats },
          error: `unknown source_id "${sourceId}" \u2014 call without source_id for the full catalog`,
          known_id_sample: sample
        };
      }
      const rawLevel = Number(params.disruption_level ?? 1);
      const disruptionLevel = Math.min(1, Math.max(0.1, Number.isFinite(rawLevel) ? rawLevel : 1));
      const cascade = calculateCascade(graph, sourceId, disruptionLevel);
      return { ...freshness, data: { catalog: null, cascade, stats } };
    },
    _coverageKeys: ["infrastructure:submarine-cables:v1"],
    _apiPaths: []
  },
  {
    name: "get_military_surge",
    _outputBudgetBytes: 65536,
    description: "Military surge watch: theater aircraft postures, foreign-presence detections, and seeder-computed surge alerts. Runs the dashboard military-surge engine server-side over the seeded flight snapshot: per-theater posture summaries count fighters, tankers, AWACS, reconnaissance, transports, bombers, and drones inside each theater boundary, with trend context recovered from the persisted surge history and tracked-vessel counts merged from the theater-posture cache. Foreign-presence detection flags operators flying far from their home region above per-operator thresholds. The seeded_surges block carries the surge alerts the flights seeder computed against its own persisted baselines \u2014 reported separately because that variant uses different thresholds than the snapshot engine. Filter with theater.",
    inputSchema: {
      type: "object",
      properties: {
        theater: { type: "string", description: "Filter to one theater by id or name substring (case-insensitive)." }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      properties: {
        cached_at: { type: ["string", "null"], description: "Oldest fetch time across the contributing feeds." },
        stale: { type: "boolean", description: "True when any contributing feed is older than its freshness budget." },
        ...ANALYSIS_CACHE_STATUS_PROPERTIES,
        data: {
          type: "object",
          properties: {
            postures: { type: "array", items: { type: "object" } },
            foreign_presence: { type: "array", items: { type: "object" } },
            seeded_surges: { type: "array", items: { type: "object" } },
            seeded_surges_available: { type: "boolean" },
            history_available: { type: "boolean" },
            cii_available: { type: "boolean" },
            flight_count: { type: "number" }
          },
          required: []
        }
      },
      required: ["cached_at", "stale", "data"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      const keys = [
        "military:flights:v1",
        "theater-posture:sebuf:v1",
        "military:surges:v1",
        "military:surges:history:v1",
        CII_RISK_SCORE_CACHE_KEYS.live
      ];
      const checks = [
        { key: "seed-meta:military:flights", maxStaleMin: 30 },
        { key: "seed-meta:theater-posture", maxStaleMin: 60 },
        { key: "seed-meta:military-surges", maxStaleMin: 30 },
        { key: "seed-meta:intelligence:risk-scores", maxStaleMin: 30, minRecordCount: 3 }
      ];
      const {
        payloads: [flightsPayload, posturePayload, surgesPayload, historyPayload, riskScores],
        freshness
      } = await readCachesWithFreshness(keys, checks);
      requireAnyInput(
        [flightsPayload, posturePayload, surgesPayload],
        freshness,
        "No primary military feeds are available"
      );
      const flights = militaryFlightsToSurgeInputs(flightsPayload);
      const history = surgeHistoryToActivityHistory(historyPayload);
      const postures = flightsPayload !== null || posturePayload !== null ? getTheaterPostureSummaries(flights, history) : [];
      if (postures.length > 0) {
        applyVesselCountsToPostures(postures, theaterPostureVesselCounts(posturePayload));
        recalcPostureWithVessels(postures, riskScoresToCiiLookup(riskScores));
      }
      const engine = new MilitarySurgeEngine();
      const foreignPresence = engine.detectForeignMilitaryPresence(flights).map((alert) => ({
        id: alert.id,
        operator: alert.operator,
        operatorCountry: alert.operatorCountry,
        region: alert.region.name,
        region_id: alert.region.id,
        aircraftCount: alert.aircraftCount
      }));
      const seededSurges = Array.isArray(surgesPayload?.surges) ? surgesPayload.surges : [];
      const theaterFilter = typeof params.theater === "string" ? params.theater.trim().toLowerCase() : "";
      const matchesTheater = (id, name, shortName) => !theaterFilter || [id, name, shortName].some(
        (value) => typeof value === "string" && value.toLowerCase().includes(theaterFilter)
      );
      const matchedRegionIds = new Set(
        POSTURE_THEATERS.filter((theater) => matchesTheater(theater.id, theater.name, theater.shortName)).flatMap((theater) => theater.regions)
      );
      return {
        ...freshness,
        data: {
          postures: postures.filter((p) => matchesTheater(p.theaterId, p.theaterName, p.shortName)),
          foreign_presence: theaterFilter ? foreignPresence.filter((alert) => matchedRegionIds.has(alert.region_id) || alert.region_id.toLowerCase().includes(theaterFilter) || alert.region.toLowerCase().includes(theaterFilter)) : foreignPresence,
          seeded_surges: seededSurges.filter((surge) => matchesTheater(surge.theaterId, surge.theater)),
          seeded_surges_available: surgesPayload !== null,
          history_available: historyPayload !== null,
          cii_available: riskScores !== null,
          flight_count: flights.length
        }
      };
    },
    _coverageKeys: [
      "military:flights:v1",
      "theater-posture:sebuf:v1",
      "military:surges:v1",
      "military:surges:history:v1",
      CII_RISK_SCORE_CACHE_KEYS.live
    ],
    _apiPaths: []
  },
  {
    name: "get_population_exposure",
    _outputBudgetBytes: 65536,
    description: "Population exposure: estimated people within the impact radius of active earthquakes, wildfires, and conflict events. Uses the same country-density approximation the dashboard ships \u2014 the nearest priority-country centroid supplies a population density that is multiplied over the event-type radius disc (50 km for conflict, 100 km for earthquakes and floods, 30 km for fires). Three modes: events (the default) enriches the current seeded event feeds and ranks them by exposed population; point estimates exposure around an arbitrary lat/lon; countries returns the priority-country population table itself. Estimates are deliberately coarse screening numbers \u2014 there is no city-level population dataset behind them \u2014 so treat them as ranking signals, not casualty projections.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["events", "point", "countries"], description: "events enriches live feeds (default); point takes lat/lon; countries lists the population table." },
        event_source: { type: "string", enum: ["earthquakes", "wildfires", "conflicts", "all"], description: "Which event feeds to enrich in events mode (default all)." },
        lat: { type: "number", description: "Latitude for point mode." },
        lon: { type: "number", description: "Longitude for point mode." },
        radius_km: { type: "number", description: "Radius in km for point mode (default 50, clamped to 1000)." },
        limit: { type: "number", description: "Cap the enriched event list in events mode (default 20, pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      properties: {
        cached_at: { type: ["string", "null"], description: "Oldest fetch time across the feeds read; null in point and countries modes." },
        stale: { type: "boolean", description: "True when any contributing feed is older than its freshness budget." },
        ...ANALYSIS_CACHE_STATUS_PROPERTIES,
        data: {
          type: "object",
          properties: {
            events: { type: ["array", "null"], items: { type: "object" } },
            exposure: { type: ["object", "null"] },
            countries: { type: ["array", "null"], items: { type: "object" } }
          },
          required: []
        },
        error: { type: "string", description: "Present only on a user-input failure; the envelope keys are still returned." }
      },
      required: ["cached_at", "stale", "data"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      const mode = typeof params.mode === "string" ? params.mode : "events";
      if (mode === "countries") {
        return { cached_at: null, stale: false, data: { events: null, exposure: null, countries: listCountryPopulations() } };
      }
      if (mode === "point") {
        const lat = typeof params.lat === "number" ? params.lat : null;
        const lon = typeof params.lon === "number" ? params.lon : null;
        if (lat === null || lon === null) {
          return {
            cached_at: null,
            stale: false,
            data: { events: null, exposure: null, countries: null },
            error: "point mode requires numeric lat and lon."
          };
        }
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          return {
            cached_at: null,
            stale: false,
            data: { events: null, exposure: null, countries: null },
            error: `lat must be within [-90, 90] and lon within [-180, 180] (received lat=${lat}, lon=${lon}).`
          };
        }
        const radiusKm = Math.max(1, Number(params.radius_km ?? 50) || 50);
        return {
          cached_at: null,
          stale: false,
          data: { events: null, exposure: computeBoundedExposure(lat, lon, radiusKm), countries: null }
        };
      }
      const source = typeof params.event_source === "string" ? params.event_source : "all";
      const limit = resolveLimit(params.limit, 20);
      const wants = (name) => source === "all" || source === name;
      const reads = [];
      if (wants("earthquakes")) {
        reads.push({
          key: "seismology:earthquakes:v1",
          check: { key: "seed-meta:seismology:earthquakes", maxStaleMin: 30 },
          adapt: (payload, cap) => earthquakesToExposureEvents(payload, cap)
        });
      }
      if (wants("wildfires")) {
        reads.push({
          key: "wildfire:fires:v1",
          check: { key: "seed-meta:wildfire:fires", maxStaleMin: 360 },
          adapt: (payload, cap) => firesToExposureEvents(payload, cap)
        });
      }
      if (wants("conflicts")) {
        reads.push({
          key: "conflict:ucdp-events:v1",
          check: { key: "seed-meta:conflict:ucdp-events", maxStaleMin: 420 },
          adapt: (payload, cap) => ucdpEventsToExposureEvents(payload, cap)
        });
      }
      const { payloads, freshness } = await readCachesWithFreshness(
        reads.map((read) => read.key),
        reads.map((read) => read.check)
      );
      requireAnyInput(
        payloads,
        freshness,
        "No event feeds are available for exposure enrichment"
      );
      const enriched = reads.flatMap((read, i) => read.adapt(payloads[i], Number.POSITIVE_INFINITY)).map((event) => {
        const radius = getRadiusForEventType(event.type);
        const exposure = computeExposure(event.lat, event.lon, radius);
        return { ...event, ...exposure };
      }).sort((a, b) => b.exposedPopulation - a.exposedPopulation).slice(0, limit);
      return { ...freshness, data: { events: enriched, exposure: null, countries: null } };
    },
    _coverageKeys: ["seismology:earthquakes:v1", "wildfire:fires:v1", "conflict:ucdp-events:v1"],
    _apiPaths: ["GET /api/displacement/v1/get-population-exposure"]
  },
  {
    name: "get_alert_digest",
    _outputBudgetBytes: 131072,
    description: "Cross-domain alert digest: everything that tripped a threshold today, in one rollup. Sweeps seven seeded domains \u2014 country instability bands, military surge alerts, submarine-cable health, ongoing internet outages, temporal anomalies, thermal escalation zones, and shipping stress \u2014 and reports each trip with the severity vocabulary its own producer already uses; no thresholds are invented by this tool. Domains with data but no trips are listed as quiet, and domains whose caches are unavailable are listed separately so silence is never mistaken for calm. The weekly view adds direction, volatility, and anomaly flags derived from the persisted military-activity history plus the current temporal-anomaly snapshot. This is the fastest single call for what changed today.",
    inputSchema: {
      type: "object",
      properties: {
        view: { type: "string", enum: ["today", "weekly"], description: "today lists current threshold trips (default); weekly adds trend context." }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      properties: {
        cached_at: { type: ["string", "null"], description: "Oldest fetch time across the contributing feeds." },
        stale: { type: "boolean", description: "True when any contributing feed is older than its freshness budget." },
        ...ANALYSIS_CACHE_STATUS_PROPERTIES,
        data: {
          type: "object",
          properties: {
            tripped: { type: "array", items: { type: "object" } },
            quiet: { type: "array", items: { type: "string" } },
            unavailable: { type: "array", items: { type: "string" } },
            weekly: {
              type: ["object", "null"],
              properties: {
                trends: { type: "array", items: { type: "object" } },
                current_anomalies: { type: "array", items: { type: "object" } },
                history_available: { type: "boolean" },
                note: { type: "string" }
              }
            }
          },
          required: []
        }
      },
      required: ["cached_at", "stale", "data"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      const view = typeof params.view === "string" ? params.view : "today";
      const keys = [
        CII_RISK_SCORE_CACHE_KEYS.live,
        "military:surges:v1",
        "cable-health-v1",
        "infra:outages:v1",
        "temporal:anomalies:v1",
        "thermal:escalation:v1",
        "supply_chain:shipping_stress:v1"
      ];
      if (view === "weekly") keys.push("military:surges:history:v1");
      const checks = [
        { key: "seed-meta:intelligence:risk-scores", maxStaleMin: 30, minRecordCount: 3 },
        { key: "seed-meta:military-surges", maxStaleMin: 30 },
        { key: "seed-meta:cable-health", maxStaleMin: 90 },
        { key: "seed-meta:infra:outages", maxStaleMin: 30 },
        { key: "seed-meta:temporal:anomalies", maxStaleMin: 45 },
        { key: "seed-meta:thermal:escalation", maxStaleMin: 360 },
        { key: "seed-meta:supply_chain:shipping_stress", maxStaleMin: 45 }
      ];
      const {
        payloads: [riskScores, surges, cableHealth, outages, temporal, thermal, stress, historyPayload],
        freshness
      } = await readCachesWithFreshness(keys, checks);
      requireAnyInput(
        [riskScores, surges, cableHealth, outages, temporal, thermal, stress],
        freshness,
        "No digest input feeds are available"
      );
      const now = Date.now();
      const digest = buildAlertDigest(
        buildDigestInputs({ riskScores, surges, cableHealth, outages, temporal, thermal, stress }),
        now
      );
      let weekly = null;
      const unavailable = [...digest.unavailable];
      if (view === "weekly") {
        const historyAvailable = historyPayload !== null;
        if (!historyAvailable) unavailable.push("military_history");
        const activity = surgeHistoryToActivityHistory(historyPayload);
        const series = [...activity.entries()].map(([theaterId, points]) => ({
          domain: `military:${theaterId}`,
          points: points.map((point) => ({ t: point.timestamp, value: point.totalMilitary }))
        }));
        weekly = {
          trends: buildWeeklyTrends(series, now),
          current_anomalies: anomaliesToDigestInput(temporal),
          history_available: historyAvailable,
          note: "weekly trends derive from the persisted military-activity history; other domains publish no whole-feed history caches yet"
        };
      }
      return {
        ...freshness,
        data: { tripped: digest.tripped, quiet: digest.quiet, unavailable, weekly }
      };
    },
    _coverageKeys: [
      CII_RISK_SCORE_CACHE_KEYS.live,
      "military:surges:v1",
      "cable-health-v1",
      "infra:outages:v1",
      "temporal:anomalies:v1",
      "thermal:escalation:v1",
      "supply_chain:shipping_stress:v1"
    ],
    _apiPaths: []
  },
  {
    name: "get_hotspot_escalation",
    _outputBudgetBytes: 65536,
    description: "Hotspot escalation scores: the 29 curated intelligence hotspots ranked by dynamic escalation on a 1-5 scale. Runs a reduced server snapshot of the dashboard escalation engine: for each curated hotspot, news pressure (keyword matches over the seeded story clusters), country instability, geographic signal convergence (protests, military flights, earthquakes gridded around the hotspot), and nearby military activity are normalized to 0-100 components, weighted 35/25/25/15, and blended 30/70 with the curated static baseline into a 1-5 composite. Server runs do not have the browser session inputs for breaking-news flags, news velocity, score history, or vessel positions; input_availability names those omissions explicitly, while unavailable_inputs reports missing server-side feeds.",
    inputSchema: {
      type: "object",
      properties: {
        hotspot_id: { type: "string", description: "Return only this curated hotspot id (see any full response for the id list)." },
        limit: { type: "number", description: "Cap the ranked hotspot list (default 29, the full curated set; pass 0 for no cap)." }
      },
      required: []
    },
    outputSchema: {
      type: "object",
      properties: {
        cached_at: { type: ["string", "null"], description: "Oldest fetch time across the contributing feeds." },
        stale: { type: "boolean", description: "True when any contributing feed is older than its freshness budget." },
        ...ANALYSIS_CACHE_STATUS_PROPERTIES,
        data: {
          type: "object",
          properties: {
            hotspots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  hotspotId: { type: "string" },
                  name: { type: "string" },
                  lat: { type: "number" },
                  lon: { type: "number" },
                  staticBaseline: { type: "number" },
                  dynamicScore: { type: "number" },
                  combinedScore: { type: "number", description: "Composite escalation on the documented 1-5 scale." },
                  components: { type: "object" },
                  trend: { type: "string" }
                }
              }
            },
            input_availability: {
              type: "object",
              properties: {
                news_pressure: { type: "boolean" },
                country_instability: { type: "boolean" },
                geo_convergence: { type: "boolean" },
                military_flights: { type: "boolean" },
                breaking_news: { type: "boolean" },
                news_velocity: { type: "boolean" },
                military_vessels: { type: "boolean" },
                score_history: { type: "boolean" }
              }
            }
          },
          required: []
        },
        error: { type: "string", description: "Present only on a user-input failure; the envelope keys are still returned." },
        known_ids: { type: "array", items: { type: "string" }, description: "All curated hotspot ids; present only alongside an unknown-hotspot_id error." }
      },
      required: ["cached_at", "stale", "data"]
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _execute: async (params) => {
      const hotspotIdFilter = typeof params.hotspot_id === "string" ? params.hotspot_id.trim() : "";
      const targets = hotspotIdFilter ? INTEL_HOTSPOTS.filter((hotspot) => hotspot.id === hotspotIdFilter) : INTEL_HOTSPOTS;
      if (hotspotIdFilter && targets.length === 0) {
        return {
          cached_at: null,
          stale: false,
          data: { hotspots: [] },
          error: `unknown hotspot_id "${hotspotIdFilter}"`,
          known_ids: INTEL_HOTSPOTS.map((hotspot) => hotspot.id)
        };
      }
      const keys = ["news:insights:v1", CII_RISK_SCORE_CACHE_KEYS.live, "military:flights:v1", "unrest:events:v1", "seismology:earthquakes:v1"];
      const checks = [
        { key: "seed-meta:news:insights", maxStaleMin: 30 },
        { key: "seed-meta:intelligence:risk-scores", maxStaleMin: 30, minRecordCount: 3 },
        { key: "seed-meta:military:flights", maxStaleMin: 30 },
        { key: "seed-meta:unrest:events", maxStaleMin: 120 },
        { key: "seed-meta:seismology:earthquakes", maxStaleMin: 30 }
      ];
      const { payloads: [insights, riskScores, flightsPayload, unrest, quakes], freshness } = await readCachesWithFreshness(keys, checks);
      requireAnyInput(
        [insights, riskScores, flightsPayload, unrest, quakes],
        freshness,
        "No hotspot-escalation input feeds are available"
      );
      const now = Date.now();
      const clusters = insightsToFocalClusters(insights);
      const ciiLookup = riskScoresToCiiLookup(riskScores);
      const flights = militaryFlightsToSurgeInputs(flightsPayload);
      const geoEngine = new GeoConvergenceEngine({ now: () => now });
      geoEngine.ingestEvents(unrestEventsToGeoEvents(unrest, { now }), "protest");
      geoEngine.ingestEvents(militaryFlightsToGeoEvents(flightsPayload, { now }), "military_flight");
      geoEngine.ingestEvents(earthquakesToGeoEvents(quakes, { now }), "earthquake");
      const scored = targets.map((hotspot) => {
        const keywords = (hotspot.keywords ?? []).map((keyword) => keyword.toLowerCase());
        const matchesKeyword = (title) => {
          const lower = title.toLowerCase();
          return keywords.some((keyword) => lower.includes(keyword));
        };
        const newsMatches = clusters.filter(
          (cluster) => matchesKeyword(cluster.primaryTitle) || (cluster.allItems ?? []).some((item) => matchesKeyword(item.title))
        ).length;
        const nearby = geoEngine.alertsNear(hotspot.lat, hotspot.lon, 300);
        const ciiScore = getHotspotCountryScore(hotspot.id, ciiLookup);
        const score = computeEscalationScore(
          hotspot,
          {
            newsMatches,
            hasBreaking: false,
            newsVelocity: 0,
            ciiScore,
            geoAlertScore: nearby?.score ?? 0,
            geoAlertTypes: nearby?.types ?? 0,
            flightsNearby: countMilitaryNearHotspot(hotspot, flights, []).flights,
            vesselsNearby: 0
          },
          { now, previousHistory: [] }
        );
        return {
          hotspotId: score.hotspotId,
          name: hotspot.name,
          lat: hotspot.lat,
          lon: hotspot.lon,
          staticBaseline: score.staticBaseline,
          dynamicScore: score.dynamicScore,
          combinedScore: score.combinedScore,
          components: score.components,
          trend: score.trend
        };
      });
      const limit = resolveLimit(params.limit, INTEL_HOTSPOTS.length);
      scored.sort((a, b) => b.combinedScore - a.combinedScore || b.dynamicScore - a.dynamicScore);
      return {
        ...freshness,
        data: {
          hotspots: scored.slice(0, limit),
          input_availability: {
            news_pressure: insights !== null,
            country_instability: riskScores !== null,
            geo_convergence: [unrest, flightsPayload, quakes].every((value) => value !== null),
            military_flights: flightsPayload !== null,
            breaking_news: false,
            news_velocity: false,
            military_vessels: false,
            score_history: false
          }
        }
      };
    },
    _coverageKeys: ["news:insights:v1", CII_RISK_SCORE_CACHE_KEYS.live, "military:flights:v1", "unrest:events:v1", "seismology:earthquakes:v1"],
    _apiPaths: []
  }
];
export {
  ANALYSIS_TOOLS
};
