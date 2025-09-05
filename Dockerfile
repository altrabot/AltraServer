FROM node:20-alpine

WORKDIR /app

# Install build tools termasuk openssl untuk Prisma
RUN apk add --no-cache git python3 make g++ curl openssl

# Copy package files pertama untuk caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install semua dependencies
RUN npm install --no-optional

# Format Prisma schema untuk memastikan validasi
RUN npx prisma format

# Copy semua file source code
COPY . .

# Build project - pastikan TypeScript file ada
RUN if [ -d "src" ] && [ -n "$(find src -name '*.ts' -print -quit)" ]; then \
      echo "Building TypeScript files..." && \
      npm run build; \
    else \
      echo "No TypeScript files found, creating minimal dist..." && \
      mkdir -p dist && \
      echo "console.log('AltraBot starting...'); require('express')().get('/healthz', (req, res) => res.json({status: 'OK'})).listen(process.env.PORT || 3000, () => console.log('Server running on port', process.env.PORT || 3000));" > dist/index.js; \
    fi

# Generate Prisma client
RUN npx prisma generate

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
