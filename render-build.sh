#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Install all dependencies from package.json
echo "Installing dependencies..."
npm install

# 2. THIS IS THE CRUCIAL STEP FOR PUPPETEER
# It uses the @puppeteer/browsers package to download a compatible version of Chrome
echo "Downloading Chrome for Puppeteer..."
npx puppeteer browsers install chrome

# 3. Build your NestJS application (compiles TypeScript to JavaScript)
echo "Building the NestJS app..."
npm run build

echo "Build finished successfully!"