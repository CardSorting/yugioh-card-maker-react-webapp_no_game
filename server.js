import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth, handleAuthError } from './src/middleware/auth.js';
import { handleUploadError } from './src/middleware/upload.js';
import apiRoutes from './src/routes/index.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Started`);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Completed ${res.statusCode} in ${duration}ms`);
  });
  
  next();
});

// Error handling middleware for general errors
app.use((err, req, res, next) => {
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query,
    requestId: req.headers['x-request-id'] || 'unknown'
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Compression
app.use(compression());

// API Routes
app.use('/api', apiRoutes);

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Auth error handling
app.use(handleAuthError);

// Upload error handling
app.use(handleUploadError);

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Verify dist directory exists before serving static files
if (existsSync(join(__dirname, 'dist'))) {
  // Serve static files
  app.use(express.static(join(__dirname, 'dist'), {
    maxAge: '1d',
    etag: true
  }));

  // Handle SPA routing - This should be the last route
  app.get('*', (req, res, next) => {
    try {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    } catch (error) {
      next(error);
    }
  });
} else {
  console.warn('Warning: dist directory not found. Static file serving is disabled.');
}

// Start server with error handling
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
