---
title: A gate on one reader of a shared cache row is not a gate
date: 2026-09-18
category: logic-errors
module: news-classification
problem_type: logic_error
component: background_job
symptoms:
  - "An alert the relay decided not to publish still reaches users through the digest or the classify-event RPC"
  - "The relay logs a title as held while another reader of the same cache row treats it as an alert"
  - "Each review round finds another consumer that rebuilds the decision from the cached level"
root_cause: scope_issue
resolution_type: code_fix
severity: high
related_components: [service_object, frontend_stimulus]
tags: [classify-cache, alert-gating, shared-state, redis, jev, rss-alert, isalert]
---

# A gate on one reader of a shared cache row is not a gate

## Problem

PR #8326 added an opt-in classifier (TypeSafe Jev) to the relay's classify seed.
A Jev `critical` or `high` label only pages users when
`P(critical) + P(high) >= 0.7`. The first version applied that rule in one
place: the relay's `rss_alert` publish. The label was still written to the
shared cache row `classify:sebuf:v6:<hash>` at its alert level, and two other
readers of that row turned the level back into an alert.

It took three review rounds to find all three readers. Unmerged as of this
writing; the code below is on the #8326 branch.

## Symptoms

- A title the relay logged as "held below the alert gate" still produced an
  alert for users on a different code path.
- Reviewers kept finding the same bug in a new place: first the digest, then
  the RPC.
- After the gate was shared, a rounding difference still let two readers
  disagree about the same row.

## What didn't work

- **Gating at the publish site only.** `list-feed-digest` sets `isAlert` from the
  cached level, and the client's breaking-news path acts on `isAlert`
  (`src/services/breaking-news-alerts.ts:257`).
- **Adding the digest and stopping.** The `classify-event` RPC reads the same
  key and returns the level. The client rebuilds the alert from it:
  `item.isAlert = aiResult.level === 'critical' || aiResult.level === 'high'`
  (`src/services/rss.ts:408`).
- **Storing the probability rounded.** `Math.round(pAlert * 100) / 100` stores
  `0.6951` as `0.70`. The relay, holding the unrounded value, held the title.
  The digest, reading `0.70`, cleared the gate.

## Solution

Put the decision on the row, and put the rule in one function every reader
calls.

The rule lives once, in `shared/jev-classify.js`:

```js
export const JEV_NOTIFY_MIN_P_ALERT = 0.7;

export function jevGateAllowsAlert({ src, pAlert }) {
  if (src !== 'jev') return true;
  return typeof pAlert === 'number' && pAlert >= JEV_NOTIFY_MIN_P_ALERT;
}
```

The row carries the input the rule needs, floored so no reader can see a value
the writer did not act on (`scripts/lib/jev-classify-relay.cjs`):

```js
// Floored, never rounded: 0.6951 stored as 0.70 would clear the gate for the
// digest reader on a title the relay held.
value.pAlert = Math.floor(entry.pAlert * 100) / 100;
```

All three readers apply it:

| Reader | Where | Effect of a held row |
| --- | --- | --- |
| Relay publish | `shouldPublishClassifiedAlert` in `scripts/lib/jev-classify-relay.cjs` | no `rss_alert` |
| Digest | `classifyHitMayAlert` in `server/worldmonitor/news/v1/list-feed-digest.ts` | `isAlert` false, level kept |
| RPC | `levelServedToCallers` in `server/worldmonitor/intelligence/v1/classify-event.ts` | served as `medium` |

The RPC downgrades the level because the level is its only channel to the
client. The digest keeps the level and clears `isAlert` because it has both.

One path is exempt on purpose. The digest skips the cache entirely for a
keyword `critical` at confidence 0.9, so a stale cached row cannot demote a
genuine critical. A held Jev row is a cached row like any other there.

## Why this works

A cache row is an interface. Every reader that derives a decision from it is a
second implementation of that decision unless the row carries the decision's
input and the rule is shared. Gating at a write-side consumer leaves the
ungated fact in the cache for everyone else.

Flooring matters for the same reason: the writer decides on the exact value and
readers decide on the stored one. Any lossy encoding that can cross the
threshold upward makes them disagree.

## Prevention

- Before gating on a value that is also cached, enumerate the key's readers:

  ```bash
  grep -rln "buildClassifyCacheKey\|classify:sebuf:v" server api src scripts shared
  ```

  Then follow each reader one hop to the client. The RPC looked harmless until
  `rss.ts` turned its level back into `isAlert`.
- Put the rule in `shared/` and import it. Three copies of `>= 0.7` would have
  drifted the first time the threshold moved.
- Persist a threshold input with floor or full precision, never round-half-up.
  Test it with values just under the threshold
  (`tests/jev-classify-relay.test.mjs`, "never rounds a held alert up to the
  gate").
- Pin the threshold to evidence with a test that fails when it moves. The
  fixture-backed test in `tests/jev-classify-relay.test.mjs` fails at 0.5 and at
  0.9.
- Treat "the fix adds a gate" as a prompt to re-review the fix. Two of the three
  readers were found by reviewing the fix commits, not the feature commit.

## Related

- `docs/solutions/logic-errors/country-scope-filter-permissive-default-leaked-unattributed-alerts.md`:
  another alert gate that failed open on a path its tests did not exercise.
- `docs/solutions/logic-errors/stripped-null-keys-in-a-fallback-cache-crash-typed-consumers.md`:
  a cache row whose shape differed by write path.
