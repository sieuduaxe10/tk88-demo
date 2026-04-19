FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/vite.config.ts ./
COPY frontend/tsconfig.json ./
COPY frontend/index.html ./

# Expose port
EXPOSE 5173

# Default command
CMD ["npm", "run", "dev", "--", "--host"]
