#!/usr/bin/env bash
# Git pre-commit hook for csv-pipeline.
#
# Triggers when any file under csv-pipeline/mapping-input/ is staged.
# Runs `npm run extract` in csv-pipeline/ to regenerate mapping-output/,
# then auto-stages the regenerated mapping-output/ files.
#
# Install: from csv-pipeline/, run `npm run install-hook`

set -e

# Find repo root (this hook is invoked from repo root by git)
REPO_ROOT="$(git rev-parse --show-toplevel)"
PIPELINE="$REPO_ROOT/csv-pipeline"

# Check if any mapping-input file is staged.
# `-z` produces NULL-separated raw paths (no quoting around non-ASCII).
STAGED_INPUT=$(git diff --cached --name-only -z | tr '\0' '\n' | grep -E '^csv-pipeline/mapping-input/.*\.csv$' || true)

if [ -z "$STAGED_INPUT" ]; then
  # No mapping-input changes; skip
  exit 0
fi

echo "🔄 csv-pipeline pre-commit: mapping-input 检测到变更 → 自动重新抽取"
echo "   变更的文件:"
echo "$STAGED_INPUT" | sed 's/^/     /'

# Run extract
if [ ! -d "$PIPELINE/node_modules" ]; then
  echo "⚠ node_modules 不存在。需先执行 npm install"
  exit 1
fi

(cd "$PIPELINE" && npm run extract)

# Run CSV consistency check (Stage 3B). Errors block the commit; warnings allowed.
echo "🔍 csv-pipeline pre-commit: validate-csv (Stage 3B)"
(cd "$PIPELINE" && npm run --silent validate-csv) || {
  echo ""
  echo "✗ validate-csv 报错: 请修正 mapping CSV 后再 commit"
  echo "  详细 report: $PIPELINE/spec-output/validate-csv-report.json"
  exit 1
}

# Auto-stage regenerated output
git add "$PIPELINE/mapping-output/"
echo "✓ mapping-output/ 自动 stage 完成"
