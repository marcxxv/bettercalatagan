#!/bin/bash
# Weekly DILG refresh from a Philippine connection (docs/data-pipelines.md).
#
# The DILG portal refuses connections from outside the Philippines, so the
# GitHub workflow cannot refresh it. This runs the DILG pipelines on a
# maintainer's machine in a separate worktree (never the working copy), gates
# on the full check, and — only when something substantive changed — pushes
# branch data/dilg-refresh and opens or updates a review issue. It never
# pushes to main: a person still reviews and merges (ADR 0004).
set -euo pipefail

REPO="${BETTERCALATAGAN_REPO:-$HOME/Documents/Personal/Projects/active/bettercalatagan}"
WORK="${BETTERCALATAGAN_DILG_WORKTREE:-$HOME/.cache/bettercalatagan-dilg}"
BRANCH=data/dilg-refresh
GH_REPO=marcxxv/bettercalatagan

echo "== $(date -u +%FT%TZ) DILG refresh"
git -C "$REPO" fetch --quiet origin main
if [ ! -d "$WORK/.git" ] && [ ! -f "$WORK/.git" ]; then
  git -C "$REPO" worktree add --quiet --detach "$WORK" origin/main
fi
cd "$WORK"
git checkout --quiet --detach origin/main
git reset --quiet --hard origin/main
git clean -fdq -e node_modules

npm ci --silent --no-audit --no-fund
npm run --silent fdp:stage
npm run --silent fdp:promote
npm run --silent fdp:extract
npm run --silent check >/dev/null

report="$(mktemp)"
out="$(mktemp)"
GITHUB_OUTPUT="$out" node scripts/data-report.mjs --github > "$report"
if ! grep -q '^substantive=true' "$out"; then
  echo "No substantive change."
  exit 0
fi

git switch --quiet -C "$BRANCH"
git add src/data/generated data/staging
git -c user.name="BetterCalatagan refresh" -c user.email="noreply@github.com" \
  commit --quiet -m "Refresh DILG filings from a Philippine connection"
git push --quiet --force origin "$BRANCH"

body="$(mktemp)"
{
  echo "The weekly DILG refresh (run from the Philippines; the portal blocks GitHub's runners) found changes."
  echo
  echo "**Review and merge:** https://github.com/$GH_REPO/compare/main...$BRANCH?expand=1"
  echo
  cat "$report"
} > "$body"
title='DILG refresh ready for review'
number=$(gh issue list --repo "$GH_REPO" --state open --search "\"$title\" in:title" --json number --jq '.[0].number // empty')
if [ -n "$number" ]; then
  gh issue edit "$number" --repo "$GH_REPO" --body-file "$body"
else
  gh issue create --repo "$GH_REPO" --title "$title" --body-file "$body"
fi
echo "Pushed $BRANCH and updated the review issue."
