#!/usr/bin/env bash
# sync-upstream.sh <upstream-tag> — rebase the dogebox branch onto an upstream tag.
# Conflicts are expected in the BYO-AI settings patch (src/services/ai-flow-settings.ts,
# settings UI, src/services/summarization.ts) — resolve by hand, then:
#   scripts/build-dist.sh v<newtag>-wm<N>  → tag + release → bump pup manifest → pup tag.
set -euo pipefail
cd "$(dirname "$0")/.."
TAG="${1:?usage: scripts/sync-upstream.sh <upstream-tag> e.g. v2.11.0}"

git remote add upstream https://github.com/koala73/worldmonitor.git 2>/dev/null || true
git fetch upstream --tags

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$CURRENT_BRANCH" = "dogebox" ] || { echo "switch to the dogebox branch first"; exit 1; }

if git rebase "$TAG"; then
  echo "$TAG" > .upstream-tag
  git add .upstream-tag
  git -c user.name="PennybagsCX" -c user.email="pennybagscx@users.noreply.github.com" \
    commit -m "sync: track upstream $TAG" --allow-empty && echo "rebase OK, .upstream-tag -> $TAG"
else
  echo ""
  echo "REBASE CONFLICTS — resolve by hand, then:"
  echo "  git rebase --continue && echo $TAG > .upstream-tag && git add .upstream-tag && git commit"
  exit 1
fi
