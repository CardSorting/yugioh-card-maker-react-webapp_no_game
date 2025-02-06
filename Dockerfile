FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies and terser
RUN npm install
RUN npm install -D terser

COPY . .

# Build the application for production
RUN npm run build

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Start the Express server
CMD ["npm", "start"]
