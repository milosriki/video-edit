# Use official Node.js LTS image
FROM node:20-slim

# Install Python for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Copy JSON data files to dist
RUN mkdir -p dist/ai/knowledge && cp src/ai/knowledge/*.json dist/ai/knowledge/

# Create data directory for SQLite
RUN mkdir -p data

# Expose port (Cloud Run uses PORT env variable, default 8080)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "dist/index.js"]
