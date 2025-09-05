FROM node:20-alpine

WORKDIR /app

# Install git dan build tools yang diperlukan
RUN apk add --no-cache git python3 make g++ curl

# Copy package.json pertama untuk caching
COPY package.json ./
COPY prisma ./prisma/

# Install semua dependencies (termasuk dev) dengan git tersedia
RUN npm install --no-optional

# Copy semua file source code
COPY . .

# Build project
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Hapus build tools yang tidak diperlukan untuk production
RUN apk del git python3 make g++

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S altrabot -u 1001

# Change ownership
RUN chown -R altrabot:nodejs /app

# Switch to non-root user
USER altrabot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

# Start application
CMD ["npm", "start"]
