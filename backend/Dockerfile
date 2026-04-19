# Build & run stage (single-stage — simpler for Railway)
FROM node:20-bookworm-slim

# Native build tools for better-sqlite3 + bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for cache reuse
COPY package.json package-lock.json* ./
# Install all deps — tsx is in devDependencies but needed at runtime.
RUN npm install --no-audit --no-fund

# App source
COPY . .

# SQLite will write here — mount a Railway volume at /data.
ENV TK88_DB=/data/tk88-lite.db
ENV NODE_ENV=production

EXPOSE 3002

# tsx runtime — no separate build step
CMD ["npx", "tsx", "src/tk88-lite.ts"]
