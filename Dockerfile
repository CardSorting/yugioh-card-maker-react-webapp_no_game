FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install -D terser

COPY . .

# Build the application for production
RUN npm run build

# Install serve and configure it for production
RUN npm install -g serve

# Add tini for proper signal handling
RUN apk add --no-cache tini

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Railway may override PORT
EXPOSE 3000

# Create serve.json for configuration
RUN echo '{\
  "trailingSlash": false,\
  "cleanUrls": true,\
  "directoryListing": false,\
  "compression": true,\
  "etag": true,\
  "single": true,\
  "symlinks": false,\
  "headers": [\
    {\
      "source": "**/*",\
      "headers": [\
        { "key": "X-Content-Type-Options", "value": "nosniff" },\
        { "key": "X-Frame-Options", "value": "DENY" },\
        { "key": "X-XSS-Protection", "value": "1; mode=block" }\
      ]\
    }\
  ]\
}' > /app/serve.json

ENTRYPOINT ["/sbin/tini", "--"]

# Use serve with production configuration
CMD serve -s dist -l $PORT
