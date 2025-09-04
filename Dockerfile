# Stage 1: Builder dengan git
FROM node:20 AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies including dev dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Stage 2: Production - gunakan alpine untuk size kecil
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only - tanpa git dependencies
RUN npm install --production --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Generate Prisma client
RUN npx prisma generate

# Install curl untuk health check
RUN apk add --no-cache curl

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
