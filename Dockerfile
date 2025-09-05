FROM node:20-alpine

WORKDIR /app

# Install dependencies saja
RUN apk add --no-cache curl

# Copy semua file
COPY . .

# Install npm dependencies
RUN npm install --production --no-optional

# Generate Prisma client
RUN npx prisma generate

# Create user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S altrabot -u 1001

RUN chown -R altrabot:nodejs /app
USER altrabot

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1

# Gunakan ts-node untuk run langsung tanpa build
CMD ["npx", "ts-node", "src/index.ts"]
