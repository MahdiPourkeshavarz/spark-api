# Dockerfile

# --- Stage 1: Build the application ---
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build


# --- Stage 2: Create the final production image ---
FROM node:20-slim

# 1. Install system-level dependencies required for Chrome to run, as the 'root' user.
RUN apt-get update && apt-get install -y \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
    libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
    libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
    libxss1 libxtst6 lsb-release wget xdg-utils

# 2. Create the less-privileged user and group.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser

# 3. Create the application directory and give ownership to the new user.
RUN mkdir -p /app && chown -R pptruser:pptruser /app

# 4. Set the working directory.
WORKDIR /app

# 5. Switch to the less-privileged user.
USER pptruser

# 6. Copy dependency definitions.
COPY --chown=pptruser:pptruser --from=builder /app/package*.json ./

# 7. THIS IS THE FINAL, WORKING FIX
# We tell npm to use a cache directory inside /app, which our user owns,
# before running the install command.
RUN npm config set cache /app/.npm-cache --global && npm install --omit=dev

# 8. Copy the built application.
COPY --chown=pptruser:pptruser --from=builder /app/dist ./dist

# The command that will be run when the container starts.
CMD ["node", "dist/main"]