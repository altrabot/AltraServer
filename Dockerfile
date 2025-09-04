FROM node:20-alpine

WORKDIR /app

# Install git
RUN apk add --no-cache git curl

# Copy package files dan package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Gunakan npm ci instead of npm install
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

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
