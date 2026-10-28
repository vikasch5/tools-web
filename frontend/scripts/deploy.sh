#!/bin/sh
# Safe update for a server that serves frontend/build/client (Apache, nginx).
#
#   cd frontend && npm run deploy
#
# Installs dependencies, builds into a separate folder, checks the result,
# and only then swaps it in. If anything fails, the live site is untouched.
# The previous build is kept in build-previous/ for a quick rollback:
#   rm -rf build && mv build-previous build
set -eu
cd "$(dirname "$0")/.."

echo "1/4 Installing dependencies…"
npm ci --no-audit --no-fund

echo "2/4 Building into build-next/…"
rm -rf build-next
BUILD_DIR=build-next npm run build

echo "3/4 Checking the new build…"
for f in build-next/client/index.html build-next/client/.htaccess build-next/client/sitemap.xml; do
  if [ ! -s "$f" ]; then
    echo "Missing $f. The live site was not changed." >&2
    exit 1
  fi
done

echo "4/4 Switching to the new build…"
rm -rf build-previous
if [ -d build ]; then mv build build-previous; fi
mv build-next build

echo "Done. The site is now serving the new build."
