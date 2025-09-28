#!/usr/bin/env bash
set -euo pipefail

# Always operate from repo root if this is a git repo
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

shopt -s nullglob dotglob

STAMP="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
HASH="$(git rev-parse --short HEAD 2>/dev/null || echo nogit)"
OUTDIR="${REPO_ROOT}/.assistant_bundles"
OUTFILE="voxarena_${STAMP}_${HASH}.zip"
mkdir -p "$OUTDIR"

# Build a small manifest for context
MANIFEST="$(mktemp)"
{
  echo "=== VoxArena Snapshot Manifest ==="
  echo "Timestamp (UTC): $STAMP"
  echo "Commit: $(git rev-parse HEAD 2>/dev/null || echo nogit)"
  echo "Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo nobranch)"
  echo
  echo "Last commit:"
  git --no-pager log -1 --pretty=fuller 2>/dev/null || true
  echo
  echo "Top-level (depth 2), excluding heavy dirs:"
  find . -maxdepth 2 -mindepth 1 \
    -not -path "*/node_modules/*" \
    -not -path "*/.next/*" \
    -not -path "*/.git/*" \
    -not -path "*/.turbo/*" \
    -not -path "*/.assistant_bundles/*" | sort
} > "$MANIFEST"

# Directories we try to include if present
INCLUDE_DIRS=(
  app src components lib prisma public scripts pages styles docker server api
  apps packages   # monorepo roots
)

# Root-level config files/patterns we include if present
INCLUDE_PATTERNS=(
  next.config.js next.config.mjs next.config.ts
  postcss.config.js postcss.config.mjs
  tailwind.config.js tailwind.config.mjs
  package.json package-lock.json pnpm-lock.yaml yarn.lock
  tsconfig.json tsconfig.base.json
  eslint.config.js eslint.config.mjs .eslintrc.js .eslintrc.cjs .eslintrc.json
  .prettierrc .prettierrc.json
  docker-compose.yml Dockerfile
  .env.example
  prisma/schema.prisma
)

# Exclusions for zip (globs)
ZIP_EXCLUDES=(
  "*/node_modules/*"
  "*/.next/*"
  "*/.turbo/*"
  "*/.git/*"
  "*/dist/*"
  "*/build/*"
  "*/coverage/*"
  "*/.assistant_bundles/*"
  "*.log"
  ".env"
  ".env.*"
  "*/audio/*"
  "*.mp3" "*.wav" "*.m4a"
)

# Collect actual items to zip (relative paths only)
TO_ZIP=()

# 1) Add dirs that actually exist
for d in "${INCLUDE_DIRS[@]}"; do
  if [ -d "$d" ]; then
    TO_ZIP+=("$d")
  fi
done

# 2) Add root files that actually exist (patterns expand via nullglob)
for pat in "${INCLUDE_PATTERNS[@]}"; do
  for f in $pat; do
    [ -e "$f" ] && TO_ZIP+=("$f")
  done
done

# 3) Monorepo: include common subdirs within apps/* and packages/*
for root in apps packages; do
  if [ -d "$root" ]; then
    for sub in "$root"/*; do
      [ -d "$sub" ] || continue
      for d in app src components lib public pages styles server; do
        [ -d "$sub/$d" ] && TO_ZIP+=("$sub/$d")
      done
      for f in package.json tsconfig.json next.config.js next.config.mjs next.config.ts; do
        [ -f "$sub/$f" ] && TO_ZIP+=("$sub/$f")
      done
    done
  fi
done

# Ensure we have something
if [ "${#TO_ZIP[@]}" -eq 0 ]; then
  echo "No source folders/files matched. Quick debug:"
  echo "PWD: $PWD"
  echo "Found entries at top level:"
  ls -la
  echo
  echo "If your code lives in a custom dir (e.g., 'frontend' or 'web'), add it to INCLUDE_DIRS in this script."
  exit 1
fi

echo "Including the following paths (relative to repo root):"
printf ' - %s\n' "${TO_ZIP[@]}"

# Create the zip (relative paths only)
pushd "$REPO_ROOT" >/dev/null
zip -r -9 "${OUTDIR}/${OUTFILE}" "${TO_ZIP[@]}" -x "${ZIP_EXCLUDES[@]}" >/dev/null
# Append manifest without its path (-j)
zip -j "${OUTDIR}/${OUTFILE}" "$MANIFEST" >/dev/null
popd >/dev/null

rm -f "$MANIFEST"

echo "✅ Created bundle:"
echo "   ${OUTDIR}/${OUTFILE}"
echo
echo "Quick peek:"
unzip -l "${OUTDIR}/${OUTFILE}" | sed -n '1,40p'