FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the application for production
RUN npm run build

# Install serve to serve static files
RUN npm install -g serve

# Use $PORT environment variable if provided, otherwise default to 3000
ENV PORT=3000

# Serve the built application
CMD serve -s dist -p $PORT
