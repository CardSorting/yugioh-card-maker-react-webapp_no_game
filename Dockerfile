FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the application for production
RUN npm run build

# Install serve to serve static files
RUN npm install -g serve

# Add tini for proper signal handling
RUN apk add --no-cache tini

# Railway provides PORT environment variable
ENTRYPOINT ["/sbin/tini", "--"]

# Use shell form for proper environment variable interpolation
CMD exec serve -s dist --listen $PORT --single
