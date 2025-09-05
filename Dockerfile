FROM node:20-alpine

WORKDIR /app

# Install git, python3, make, g++ untuk build dependencies
RUN apk add --no-cache git python3 make g++ curl

# Copy package files
COPY package.json ./
COPY package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies menggunakan npm install biasa
RUN npm install --no-optional

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Generate Prisma client
RUN npx prisma generate

# Hapus build tools yang tidak diperlukan untuk production (optional)
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
