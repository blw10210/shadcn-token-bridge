#!/usr/bin/env bash
#
# ship.sh — one-shot release helper for shadcn-token-bridge.
#
# It commits the current tree, creates the GitHub repo (if needed), and pushes.
# It does NOT publish to npm — that's gated behind npm auth you configure once
# (see the end of this script). Re-running is safe.
#
# Requirements: gh (GitHub CLI) logged in — run `gh auth status` to check.
#
# Usage:
#   ./ship.sh            commit + create repo + push
#   ./ship.sh --release  also cut the v0.1.0 GitHub release (triggers publish CI)

set -euo pipefail
cd "$(dirname "$0")"

REPO="shadcn-token-bridge"
VERSION="v$(node -p "require('./package.json').version")"

echo "==> Clearing any stale git locks"
rm -f .git/HEAD.lock .git/index.lock 2>/dev/null || true

echo "==> Verifying build + tests before shipping"
npm ci
npm run build
npm test

echo "==> Committing"
git add -A
if git diff --cached --quiet; then
  echo "    (nothing to commit)"
else
  git commit -m "Release ${VERSION}: shadcn-token-bridge"
fi

# Ensure we're on main.
git branch -M main

echo "==> Ensuring GitHub remote + pushing"
if git remote get-url origin >/dev/null 2>&1; then
  git push -u origin main
else
  gh repo create "${REPO}" --public --source=. --remote=origin --push \
    --description "Turn raw design tokens into a correct shadcn/ui + Tailwind v4 theme — without the drift."
fi

echo
echo "==> Repo is live: $(gh repo view --json url -q .url 2>/dev/null || echo "https://github.com/blw10210/${REPO}")"
echo

if [[ "${1:-}" == "--release" ]]; then
  echo "==> Cutting release ${VERSION} (this triggers the npm publish workflow)"
  echo "    Make sure npm auth is configured first (see below), or the workflow will fail."
  gh release create "${VERSION}" --generate-notes --title "${VERSION}"
else
  cat <<EOF
Next, to publish to npm — do ONE of these, then re-run with --release:

  A) Trusted publishing (recommended, no secret):
     npmjs.com -> the package -> Settings -> add this repo as a trusted publisher.
     Then: ./ship.sh --release

  B) Token:
     npm token create --read-only=false   (an automation token)
     gh secret set NPM_TOKEN               (paste it)
     Then: ./ship.sh --release

  Or publish by hand right now:
     npm login && npm publish --access public
EOF
fi
