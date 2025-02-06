FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the application for production
RUN npm run build

# Add tini for proper signal handling
RUN apk add --no-cache tini

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Railway may override PORT
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

# Use Vite's preview server for production
CMD npm run preview -- --host --port $PORT
