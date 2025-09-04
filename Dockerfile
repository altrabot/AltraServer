FROM node:20-alpine

WORKDIR /app

# Install git dan build tools di stage yang sama
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install semua dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Hapus build tools yang tidak diperlukan untuk production
RUN apk del git python3 make g++ && \
    apk add --no-cache curl

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
