#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Starting build script ---"

# Use a writable Puppeteer cache dir on Render
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Pull Chrome from build cache if it exists (avoids re-download)
BUILD_CACHE_CHROME=/opt/render/project/src/.cache/puppeteer/chrome
if [[ -d $BUILD_CACHE_CHROME ]]; then
  echo "Copying Puppeteer Chrome from build cache..."
  cp -R $BUILD_CACHE_CHROME $PUPPETEER_CACHE_DIR
fi

# 1. Install npm dependencies
echo "Installing npm dependencies..."
npm install

# 2. Install Chrome binary (downloads if not cached; ~150MB first run)
echo "Installing Chrome for Puppeteer..."
npx @puppeteer/browsers install chrome@latest --path=$PUPPETEER_CACHE_DIR

# Push Chrome to build cache for next deploys
mkdir -p /opt/render/project/src/.cache/puppeteer
cp -R $PUPPETEER_CACHE_DIR/chrome /opt/render/project/src/.cache/puppeteer/

# 3. Build the NestJS application
echo "Building the NestJS app..."
npm run build

echo "--- Build script finished successfully ---"