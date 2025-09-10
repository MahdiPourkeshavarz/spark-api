#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Starting build script ---"

# 1. Install npm dependencies (does not need admin rights)
echo "Installing npm dependencies..."
npm install

# 2. Add the Google Chrome repository (requires admin rights)
echo "Adding Google Chrome repository..."
# We add 'sudo' to these commands to run them as an administrator
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'

# 3. Update packages and install Google Chrome (requires admin rights)
echo "Updating packages and installing Google Chrome..."
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# 4. Clean up the cache (requires admin rights)
sudo apt-get clean

# 5. Build the NestJS application (does not need admin rights)
echo "Building the NestJS app..."
npm run build

echo "--- Build script finished successfully ---"
