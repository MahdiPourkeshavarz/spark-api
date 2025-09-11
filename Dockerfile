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
WORKDIR /app

# Install the minimal system dependencies required by @sparticuz/chromium
# This runs as the default root user and will succeed.
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libgbm-dev \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    --no-install-recommends

# Create and switch to a less-privileged user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN mkdir -p /app && chown -R appuser:appuser /app
USER appuser

# Copy dependency definitions
COPY --chown=appuser:appuser --from=builder /app/package*.json ./

# --- THIS IS THE FINAL, WORKING FIX ---
# We use the --cache flag to tell npm to use a local, writable directory
# for its cache, instead of trying to write to a protected global path.
RUN npm install --cache /app/.npm-cache --omit=dev
# --- END OF FIX ---

# Copy the built application
COPY --chown=appuser:appuser --from=builder /app/dist ./dist

# The command to run the application
CMD ["node", "dist/main"]