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

# We no longer need the long 'apt-get install' command for Chrome dependencies.
# This makes the build much faster and more reliable.

# Create and switch to a less-privileged user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN mkdir -p /app && chown -R appuser:appuser /app
USER appuser

# Copy and install production dependencies
COPY --chown=appuser:appuser --from=builder /app/package*.json ./
RUN npm config set cache /app/.npm-cache --global && npm install --omit=dev

# Copy the built application
COPY --chown=appuser:appuser --from=builder /app/dist ./dist

# The command to run the application
CMD ["node", "dist/main"]