#!/usr/bin/env bash
# Install csv-pipeline pre-commit hook into the repo's .git/hooks/.
# Run: npm run install-hook (from csv-pipeline/)

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_SRC="$REPO_ROOT/csv-pipeline/scripts/pre-commit.sh"
HOOK_DST="$REPO_ROOT/.git/hooks/pre-commit"

if [ ! -f "$HOOK_SRC" ]; then
  echo "✗ Hook source not found: $HOOK_SRC"
  exit 1
fi

if [ -e "$HOOK_DST" ] && [ ! -L "$HOOK_DST" ]; then
  # Existing real file (not a symlink we control) — back it up
  echo "⚠ 检测到现有 .git/hooks/pre-commit → 移至 .backup"
  mv "$HOOK_DST" "$HOOK_DST.backup.$(date +%s)"
fi

# Use symlink so future hook updates auto-apply
ln -sf "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_SRC"

echo "✓ pre-commit hook 安装完成"
echo "  symlink: $HOOK_DST → $HOOK_SRC"
echo ""
echo "现在 csv-pipeline/mapping-input/*.csv 变更后 git commit 时："
echo "  → 自动执行 npm run extract"
echo "  → mapping-output/ 自动 stage"
