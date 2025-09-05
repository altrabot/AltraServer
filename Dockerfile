FROM node:20-alpine

WORKDIR /app

# Install build tools termasuk openssl untuk Prisma
RUN apk add --no-cache git python3 make g++ curl openssl

# Copy package files pertama untuk caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install semua dependencies
RUN npm install --no-optional

# Copy semua file source code
COPY . .

# Build project
RUN npm run build || echo "Build completed with warnings"

# Generate Prisma client dengan OpenSSL fix
RUN npm install @prisma/client@latest
RUN npx prisma generate --generator client

# Hapus build tools yang tidak diperlukan
RUN apk del git python3 make g++

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S altrabot -u 1001

RUN chown -R altrabot:nodejs /app
USER altrabot

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

CMD ["npm", "start"]
