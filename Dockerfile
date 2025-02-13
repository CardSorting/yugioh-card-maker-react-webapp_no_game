# Use Node.js Alpine-based image
FROM node:20-alpine

# Install curl for healthcheck
RUN apk --no-cache add curl

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install build dependencies
RUN npm install -g terser && \
    npm cache clean --force

# Copy application code
COPY . .

# Make start script executable
RUN chmod +x scripts/start.js

# Build the application for production
RUN npm run build

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Start the application with database setup
CMD ["node", "scripts/start.js"]
