import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import compression from 'compression'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

// Enable compression
app.use(compression())

// Serve static files from dist
app.use(express.static(join(__dirname, 'dist')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK')
})

// Handle SPA routing - always serve index.html for any unknown paths
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`)
})
