---
title: Score a replacement classifier against a blind judge, not the incumbent
date: 2026-09-18
category: best-practices
module: news-classification
problem_type: best_practice
component: testing_framework
severity: medium
applies_when:
  - "Evaluating a new model or classifier against labels the current one already produced"
  - "Designing a confidence cascade that falls back to the current classifier"
  - "Sampling evaluation data from Redis keys that are request caches"
tags: [evaluation, classifier, llm, jev, golden-set, confidence-cascade, sampling-bias]
related_components: [background_job]
---

# Score a replacement classifier against a blind judge, not the incumbent

## Context

PR #8326 evaluated TypeSafe's Jev as a replacement for the LLM that labels news
headlines by threat level. The cheap reference was already in Redis: the
production LLM's cached label for every headline in the live digest. Scored
against those labels, Jev recalled 57% of `critical|high` headlines and looked
like a clear no-go.

Reading the disagreements changed the picture. The LLM had labelled "Russians
begin 3 days of voting" `high`, where the production rubric files election
updates under `low`. It labelled a Norwegian traffic accident `high`. Jev had
followed the rubric in both cases.

## Guidance

**1. Agreement with the incumbent measures similarity, not correctness.** Label
the same sample independently and score both models against that.

For #8326 an annotator model was given only the 255 titles and the production
rubric, with instructions not to look at either model's output, and asked to
mark titles where two adjacent levels were both defensible. Against it:

| n=255, 27 alert-level | production LLM | Jev |
| --- | --- | --- |
| exact level | 64.3% | 71.8% |
| `critical\|high` recall | 96.3% | 96.3% |
| `critical\|high` precision | 46.4% | 66.7% |

The verdict flipped. The judged set, with both models' labels and Jev's
captured outputs, is `tests/fixtures/jev-classify-golden-2026-09-18.json`.

**2. Do not cascade low-confidence cases to a labeller that is worse on them.**
The obvious design was "accept Jev above a confidence threshold, otherwise ask
the LLM". Measured against the judge in the same session, that cascade lowered
alert precision at every threshold tried, because it hands the uncertain titles
to the model with the higher false-alert rate. The shipped design falls back to
the LLM only when Jev fails to answer. Gate on the new model's own probability
instead: requiring `P(critical) + P(high) >= 0.7` gives 82.8% precision at 88.9%
recall on the judged set.

**3. Make the evidence replayable.** Save the judged sample and the new model's
raw outputs in the fixture, so the threshold can be re-scored offline:

```bash
node scripts/eval-jev-classify.mjs --golden tests/fixtures/jev-classify-golden-2026-09-18.json --replay
```

A test then pins the constant to the evidence. The one in
`tests/jev-classify-relay.test.mjs` fails if the gate moves to 0.5 or to 0.9.

**4. Know what your sample key is.** The eval read
`news:digest:v1:<variant>:en` for five variants and merged them with `?? {}`
fallbacks. Those keys are short-lived request caches. When checked later, only
`full` existed; the "five variant" sample had been 276 of 320 titles from `full`.
A sampling loop must throw on a missing source and print per-source counts.

**5. Once the new model writes to the shared cache, the cache stops being a
reference.** The eval excludes rows with `src: 'jev'` from its "LLM label" set.
Without that, a later run reports the new model's agreement with itself.

## Why This Matters

The incumbent-as-reference evaluation would have rejected a model that halves
false alerts. It also would have justified a cascade that made alert precision
worse. Both errors come from the same assumption, that the current labels are
true, and neither shows up unless someone reads the disagreements.

The judged set is thin: one snapshot, one annotator, 27 alert-level titles, and
52% of titles marked borderline. It is enough to reverse a verdict, not enough
to tune a threshold finely. Say so where the constant is defined, as
`shared/jev-classify.js` does.

## When to Apply

- Any model, prompt, or provider swap for a classification job with cached
  production labels.
- Any fallback chain where the fallback is an older classifier.
- Any offline eval that samples from Redis rather than from a versioned file.

## Examples

Before, the go/no-go read:

```text
alert recall vs cached LLM labels: 57%   -> fail
```

After judging the same titles blind:

```text
LLM  vs judge: precision 46.4%, recall 96.3%
Jev  vs judge: precision 66.7%, recall 96.3%
Jev  + pAlert>=0.7: precision 82.8%, recall 88.9%   -> ship behind a key
```

The first ten alert-level disagreements were enough to see it: about seven were
the incumbent breaking its own rubric. Read ten disagreements before trusting an
agreement number.

## Related

- `docs/solutions/logic-errors/a-gate-on-one-reader-of-a-shared-cache-row-is-not-a-gate.md`:
  the alert gate this evaluation produced, and the three cache readers it had
  to cover.
