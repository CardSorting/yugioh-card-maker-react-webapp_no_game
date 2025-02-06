import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import compression from 'compression'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Started`)
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Completed ${res.statusCode} in ${duration}ms`)
  })
  
  next()
})

// Error handling middleware
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
  })
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    requestId: req.headers['x-request-id'] || 'unknown'
  })
})

// Body parsing middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Verify dist directory exists
if (!existsSync(join(__dirname, 'dist'))) {
  console.error('Error: dist directory not found. Make sure the application is built before starting the server.')
  process.exit(1)
}

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  next()
})

// Compression
app.use(compression())

// Serve static files from dist with caching
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true
}))

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Handle SPA routing
app.get('*', (req, res, next) => {
  try {
    res.sendFile(join(__dirname, 'dist', 'index.html'))
  } catch (error) {
    next(error)
  }
})

// Start server with error handling
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`)
})

server.on('error', (error) => {
  console.error('Server error:', error)
  if (error.syscall !== 'listen') {
    throw error
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${port} requires elevated privileges`)
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(`Port ${port} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})
