# Dockerfile

# --- Stage 1: Build the application using Node.js 20 ---
FROM node:20-slim AS builder

# Set the working directory
WORKDIR /app

# Copy dependency files
COPY package.json yarn.lock* package-lock.json* ./

# Install all dependencies
RUN npm install

# Copy the rest of your application source code
COPY . .

# Build the TypeScript project into JavaScript
RUN npm run build


# --- Stage 2: Create the final, smaller production image using Node.js 20 ---
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Add a non-root user for better security (best practice for production)
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser
USER pptruser

# Install system-level dependencies required for Chrome to run
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

# Copy dependency definitions for production
COPY --chown=pptruser:pptruser package.json yarn.lock* package-lock.json* ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy the built application from the 'builder' stage
COPY --chown=pptruser:pptruser --from=builder /app/dist ./dist

# The command that will be run when the container starts
CMD ["node", "dist/main"]