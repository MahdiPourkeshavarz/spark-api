# Dockerfile

# --- Stage 1: Build the application ---
# This stage remains the same.
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build


# --- Stage 2: Create the final production image ---
FROM node:20-slim
WORKDIR /app

# --- THIS IS THE FIX ---
# 1. We perform all system-level installations FIRST, while we are still the 'root' user.
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils

# 2. NOW that the system is set up, we create the less-privileged user for security.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser
USER pptruser
# --- END OF FIX ---

# Copy dependency definitions for production
COPY --chown=pptruser:pptruser package.json yarn.lock* package-lock.json* ./

# Install ONLY production dependencies as the new user
RUN npm install --omit=dev

# Copy the built application from the 'builder' stage
COPY --chown=pptruser:pptruser --from=builder /app/dist ./dist

# The command that will be run when the container starts
CMD ["node", "dist/main"]