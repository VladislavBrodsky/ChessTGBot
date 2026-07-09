#!/usr/bin/env bash
#
# Fails if a change touched the frontend source but did NOT rebuild the committed
# static export that production actually serves (backend/static_frontend).
#
# This is the guard for the "fix exists in frontend/src but was never deployed"
# class of bug: production serves the committed export, so a source-only change
# silently ships nothing. Run `cd frontend && npm run build:static` and commit
# the result to fix a failure here.
#
# Usage:  scripts/check-static-export-fresh.sh [BASE_REF]
#   BASE_REF defaults to origin/main. In CI, pass the PR base SHA.
set -euo pipefail

BASE_REF="${1:-origin/main}"

# Paths whose changes require a rebuilt export.
SOURCE_PATHS='^frontend/(src/|public/|package\.json|package-lock\.json|next\.config\.js|postcss\.config\.|tailwind)'
EXPORT_PATH='^backend/static_frontend/'
# Test/mock files are not part of the built app, so a change to them alone never
# makes the export stale — exclude them to avoid false "rebuild required" failures.
TEST_PATHS='(\.test\.|\.spec\.|/tests/|/__tests__/|/__mocks__/)'

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "check-static-export-fresh: base ref '$BASE_REF' not found; skipping." >&2
  exit 0
fi

CHANGED="$(git diff --name-only "$BASE_REF"...HEAD)"

if [ -z "$CHANGED" ]; then
  echo "check-static-export-fresh: no changes vs $BASE_REF; OK."
  exit 0
fi

SOURCE_CHANGED="$(echo "$CHANGED" | grep -E "$SOURCE_PATHS" | grep -vE "$TEST_PATHS" || true)"
EXPORT_CHANGED="$(echo "$CHANGED" | grep -E "$EXPORT_PATH" || true)"

if [ -n "$SOURCE_CHANGED" ] && [ -z "$EXPORT_CHANGED" ]; then
  echo "::error::Frontend source changed but backend/static_frontend was not rebuilt." >&2
  echo "" >&2
  echo "Production serves the committed static export, so this change would ship nothing." >&2
  echo "Fix: cd frontend && npm run build:static, then commit backend/static_frontend." >&2
  echo "" >&2
  echo "Frontend source files changed:" >&2
  echo "$SOURCE_CHANGED" | sed 's/^/  - /' >&2
  exit 1
fi

echo "check-static-export-fresh: OK (source changed: $([ -n "$SOURCE_CHANGED" ] && echo yes || echo no), export changed: $([ -n "$EXPORT_CHANGED" ] && echo yes || echo no))."
