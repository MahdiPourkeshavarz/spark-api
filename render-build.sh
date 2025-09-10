#!/usr/-bin/env bash
# Exit on error
set -o errexit

echo "--- Starting build script ---"

# 1. Install npm dependencies
echo "Installing npm dependencies..."
npm install

# 2. Add the Google Chrome repository (running directly as root)
echo "Adding Google Chrome repository..."
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'

# 3. Update packages and install Google Chrome (running directly as root)
echo "Updating packages and installing Google Chrome..."
apt-get update
apt-get install -y google-chrome-stable

# 4. Clean up the cache (running directly as root)
apt-get clean

# 5. Build the NestJS application
echo "Building the NestJS app..."
npm run build

echo "--- Build script finished successfully ---"
