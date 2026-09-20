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
export {
  evaluateFreshness
};
