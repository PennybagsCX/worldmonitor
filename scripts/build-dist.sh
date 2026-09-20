#!/usr/bin/env bash
# =============================================================================
# build-dist.sh — DogeBox pup release build (PennybagsCX fork)
# =============================================================================
# Transcribes the root Dockerfile (v2.10.0) verbatim for non-Docker hosts:
#   builder stage:      npm ci --ignore-scripts
#                       node docker/build-handlers.mjs
#                       npm run build:crawlable-corpus && npm run build:sitemap
#                         && npx tsc && npx vite build
#   runtime-deps stage: npm ci --omit=dev --omit=optional --ignore-scripts
#                       against docker/runtime-package.json (+ lock)
#   final stage:        stage the exact COPY layout into build-out/rootfs/
#
# DO NOT reorder or skip steps — a skipped builder step produces a green build
# whose API 502s at runtime (see Dockerfile comments on "missing dependency").
#
# Output: build-out/worldmonitor-fullstack-<version>.tar.gz  (tree rooted at rootfs/)
#         sha256 printed on success.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:-$(git describe --tags --always 2>/dev/null || echo dev)}"
OUT="build-out"
STAGE="$OUT/rootfs"

echo "== worldmonitor pup build: $VERSION =="

command -v node >/dev/null || { echo "node not found"; exit 1; }
echo "node $(node --version), npm $(npm --version)"

# ── Stage 1: builder (root Dockerfile lines, verbatim) ──────────────────────
echo "== [1/4] npm ci --ignore-scripts =="
npm ci --ignore-scripts

echo "== [2/4] node docker/build-handlers.mjs =="
node docker/build-handlers.mjs

echo "== [3/4] frontend + corpus build =="
npm run build:crawlable-corpus
npm run build:sitemap
npx tsc
npx vite build

# ── Stage 2: runtime deps (root Dockerfile lines, verbatim) ─────────────────
echo "== [4/4] runtime-deps node_modules =="
rm -rf "$OUT/runtime-deps"
mkdir -p "$OUT/runtime-deps"
cp docker/runtime-package.json "$OUT/runtime-deps/package.json"
cp docker/runtime-package-lock.json "$OUT/runtime-deps/package-lock.json"
( cd "$OUT/runtime-deps" && npm ci --omit=dev --omit=optional --ignore-scripts )

# ── Stage 3: final — stage the exact Dockerfile COPY layout ─────────────────
rm -rf "$STAGE"
mkdir -p "$STAGE/app" "$STAGE/html" "$STAGE/conf" "$STAGE/redis-rest"

# COPY --from=builder /app/src-tauri/sidecar/local-api-server.mjs ./
cp src-tauri/sidecar/local-api-server.mjs "$STAGE/app/"
# COPY --from=builder /app/src-tauri/sidecar/package.json ./
cp src-tauri/sidecar/package.json "$STAGE/app/package.json"
# COPY --from=runtime-deps /app/node_modules ./
cp -R "$OUT/runtime-deps/node_modules" "$STAGE/app/node_modules"
# COPY --from=builder /app/api ./api
cp -R api "$STAGE/app/api"
# COPY --from=builder /app/data ./data
cp -R data "$STAGE/app/data"
# COPY --from=builder /app/dist /usr/share/nginx/html
cp -R dist/. "$STAGE/html/"
# COPY docker/nginx.conf (used as envsubst template by the pup's nginx)
cp docker/nginx.conf "$STAGE/conf/nginx.conf.template"

# redis-rest (docker/Dockerfile.redis-rest): node script + `redis@4` dep
cp docker/redis-rest-proxy.mjs "$STAGE/redis-rest/"
( cd "$STAGE/redis-rest" \
  && npm init -y >/dev/null \
  && npm install redis@4 --no-audit --no-fund --ignore-scripts >/dev/null )

# ── Gate: the raw handlers must resolve their runtime imports, or the API
#    502s "missing dependency" at runtime (upstream-documented failure mode).
( cd "$STAGE/app" && node -e "require.resolve('@upstash/redis'); require.resolve('@upstash/ratelimit'); require.resolve('convex'); console.log('runtime deps resolve OK')" )

# ── Package ─────────────────────────────────────────────────────────────────
TARBALL="$OUT/worldmonitor-fullstack-${VERSION}.tar.gz"
rm -f "$TARBALL"
tar -czf "$TARBALL" -C "$OUT" rootfs
SHASUM=$(shasum -a 256 "$TARBALL" | awk '{print $1}')
echo ""
echo "== done =="
echo "tarball: $TARBALL ($(du -h "$TARBALL" | cut -f1))"
echo "sha256:  $SHASUM"
