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

# ── Seeders + AIS relay (self-hosted fork additions) ────────────────────────
# Upstream populates the Redis-cached layers with a host-side cron of these
# scripts (SELF_HOSTING.md); a self-hosted pup has no host cron, so ship them
# inside the app tree with their runtime deps. Ship scripts/ + shared/ WHOLE
# and nest them under app/ so every relative import resolves exactly as it
# does from the upstream repo root: scripts' ../api and ../shared land inside
# app/, and scripts/lib's ../../server lands at the stage root (server/).
mkdir -p "$STAGE/app"
cp -R scripts "$STAGE/app/scripts"
rm -rf "$STAGE/app/scripts/node_modules"
cp -R shared "$STAGE/app/shared"
# scripts/lib reaches ../../server/_shared (committed plain-JS helpers)
[ -d server/_shared ] && mkdir -p "$STAGE/app/server" && cp -R server/_shared "$STAGE/app/server/_shared"
echo "== installing scripts runtime deps =="
( cd "$STAGE/app/scripts" && npm ci --omit=dev --omit=optional --ignore-scripts >/dev/null 2>&1 )

# ── Gate: every relative import in shipped scripts/lib must resolve in the
#    staged tree — a miss here is a runtime crash inside the pup container.
node --input-type=commonjs -e '
const fs = require("fs"), path = require("path");
const root = path.resolve(process.argv[1]);
let bad = 0;
// Only the pup runtime surface: seeders, their helpers, the relay, and the
// lib/shared dirs they pull in. Dev/acceptance tooling (audit-, capture-,
// compare-, dry-run-, check-*.mjs) is shipped but not imported at runtime.
const RUNTIME_FILE = /^(seed-|_|ais-relay\.|notification-relay\.)/;
function check(dir, all) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { if (f !== "node_modules") check(p, true); continue; }
    if (!/\.(mjs|cjs)$/.test(f)) continue;
    if (!all && !RUNTIME_FILE.test(f)) continue;
    const src = fs.readFileSync(p, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")   // strip block comments (doc examples mention imports)
      .replace(/^\s*\/\/.*$/gm, "");
    const specs = [];
    for (const m of src.matchAll(/(?:from|require)\(\s*["\x27](\.[^"\x27]+)["\x27]\s*\)/g)) specs.push(m[1]);
    for (const m of src.matchAll(/from\s+["\x27](\.[^"\x27]+)["\x27]/g)) specs.push(m[1]);
    for (const s of specs) {
      const r = path.resolve(path.dirname(p), s);
      if (!fs.existsSync(r) && !fs.existsSync(r + ".cjs") && !fs.existsSync(r + ".mjs") && !fs.existsSync(r + ".json")) {
        console.log("UNRESOLVED:", path.relative(root, p), "->", s);
        bad++;
      }
    }
  }
}
check(path.join(root, "app/scripts"), false);
check(path.join(root, "app/shared"), true);
// server/_shared is scanned from the ../../server/_shared references in app/scripts/lib
if (fs.existsSync(path.join(root, "app/server"))) check(path.join(root, "app/server"), true);
if (bad) { console.error(bad + " unresolved import(s)"); process.exit(1); }
console.log("all relative imports resolve OK");
' "$STAGE" || exit 1

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
