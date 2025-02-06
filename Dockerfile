FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the application for production
RUN npm run build

# Install serve to serve static files
RUN npm install -g serve

EXPOSE 3000

# Serve the built application
CMD ["serve", "-s", "dist", "-p", "3000"]
