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

# Install the minimal system-level dependencies required by @sparticuz/chromium
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

# Copy dependency definitions
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies (this will also download the browser)
# This also runs as root and will succeed.
RUN npm install --omit=dev

# Copy the built application
COPY --from=builder /app/dist ./dist

# The command that will be run when the container starts
CMD ["node", "dist/main"]