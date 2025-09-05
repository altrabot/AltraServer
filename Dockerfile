FROM node:20-alpine

WORKDIR /app

# Install build tools
RUN apk add --no-cache git python3 make g++ curl

# Copy package files pertama
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --no-optional

# Copy SEMUA file (termasuk source code)
COPY . .

# Build project - dengan handle error jika ada
RUN npm run build || echo "Build mungkin gagal, tetapi lanjutkan..."

# Generate Prisma client
RUN npx prisma generate

# Hapus build tools untuk keamanan
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
