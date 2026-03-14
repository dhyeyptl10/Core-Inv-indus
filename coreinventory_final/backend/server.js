// server.js — CoreInventory Express Backend
// Run: npm install && npm run seed && npm run dev
require('dotenv').config()

const express     = require('express')
const cors        = require('cors')
const morgan      = require('morgan')
const rateLimit   = require('express-rate-limit')
const path        = require('path')

// ─── Import DB (initialises schema on first run) ──────────────────────────────
const db = require('./db/database')

// ─── Import Routes ────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth')
const productRoutes     = require('./routes/products')
const warehouseRoutes   = require('./routes/warehouses')
const receiptRoutes     = require('./routes/receipts')
const deliveryRoutes    = require('./routes/deliveries')
const transferRoutes    = require('./routes/transfers')
const adjustmentRoutes  = require('./routes/adjustments')
const movementRoutes    = require('./routes/movements')
const dashboardRoutes   = require('./routes/dashboard')
const userRoutes        = require('./routes/users')

const app  = express()
const PORT = process.env.PORT || 5000

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// ─── Global Rate Limiting ─────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max:      500,
  message:  { success: false, message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
})
app.use('/api/', globalLimiter)

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many auth attempts, please try again later.' },
})
app.use('/api/auth/login',      authLimiter)
app.use('/api/auth/signup',     authLimiter)
app.use('/api/auth/otp',        authLimiter)

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const dbOk = db.prepare('SELECT 1').get()
  res.json({
    status:      'ok',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database:    dbOk ? 'connected' : 'error',
    version:     '1.0.0',
  })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes)
app.use('/api/dashboard',   dashboardRoutes)
app.use('/api/products',    productRoutes)
app.use('/api/warehouses',  warehouseRoutes)
app.use('/api/receipts',    receiptRoutes)
app.use('/api/deliveries',  deliveryRoutes)
app.use('/api/transfers',   transferRoutes)
app.use('/api/adjustments', adjustmentRoutes)
app.use('/api/movements',   movementRoutes)
app.use('/api/users',       userRoutes)

// ─── API Root Info ────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    name:    'CoreInventory API',
    version: '1.0.0',
    endpoints: [
      'POST   /api/auth/signup',
      'POST   /api/auth/login',
      'GET    /api/auth/me',
      'PUT    /api/auth/profile',
      'PUT    /api/auth/password',
      'POST   /api/auth/otp/send',
      'POST   /api/auth/otp/verify',
      'POST   /api/auth/otp/reset',
      'GET    /api/dashboard',
      'GET    /api/products',
      'POST   /api/products',
      'GET    /api/products/:id',
      'PUT    /api/products/:id',
      'DELETE /api/products/:id',
      'GET    /api/products/:id/movements',
      'GET    /api/warehouses',
      'POST   /api/warehouses',
      'GET    /api/warehouses/:id',
      'PUT    /api/warehouses/:id',
      'DELETE /api/warehouses/:id',
      'GET    /api/receipts',
      'POST   /api/receipts',
      'GET    /api/receipts/:id',
      'PUT    /api/receipts/:id',
      'DELETE /api/receipts/:id',
      'POST   /api/receipts/:id/validate',
      'POST   /api/receipts/:id/cancel',
      'GET    /api/deliveries',
      'POST   /api/deliveries',
      'GET    /api/deliveries/:id',
      'PUT    /api/deliveries/:id',
      'DELETE /api/deliveries/:id',
      'POST   /api/deliveries/:id/validate',
      'POST   /api/deliveries/:id/cancel',
      'GET    /api/transfers',
      'POST   /api/transfers',
      'GET    /api/transfers/:id',
      'PUT    /api/transfers/:id',
      'DELETE /api/transfers/:id',
      'POST   /api/transfers/:id/validate',
      'POST   /api/transfers/:id/cancel',
      'GET    /api/adjustments',
      'POST   /api/adjustments',
      'GET    /api/adjustments/:id',
      'GET    /api/movements',
      'GET    /api/movements/summary',
      'GET    /api/users',
      'GET    /api/users/:id',
      'PUT    /api/users/:id',
      'DELETE /api/users/:id',
    ],
  })
})

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err)

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists' })
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
})

// ─── Import email utility ────────────────────────────────────────────────────
const { verifyConnection } = require('./utils/email')

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log('')
  console.log('  ╔═══════════════════════════════════════════╗')
  console.log('  ║       CoreInventory Backend v2.0.0        ║')
  console.log('  ╚═══════════════════════════════════════════╝')
  console.log('')
  console.log(`  🚀  Server running at   http://localhost:${PORT}`)
  console.log(`  📦  API base URL        http://localhost:${PORT}/api`)
  console.log(`  ❤️   Health check        http://localhost:${PORT}/health`)
  console.log(`  🌍  Environment         ${process.env.NODE_ENV || 'development'}`)
  console.log('')
  console.log('  Default test accounts:')
  console.log('  admin@coreinventory.com   / admin123   (Administrator)')
  console.log('  manager@coreinventory.com / manager123 (Manager)')
  console.log('  staff@coreinventory.com   / staff123   (Warehouse Staff)')
  console.log('')

  // Verify SMTP on startup
  const smtpOk = await verifyConnection()
  if (smtpOk) {
    console.log('  📧  Email (SMTP)        CONNECTED — OTP emails will be sent')
  } else {
    console.log('  📧  Email (SMTP)        NOT CONFIGURED — using dev mode OTP fallback')
    console.log('      → Set SMTP_USER and SMTP_PASS in backend/.env to enable real emails')
  }
  console.log('')
})

module.exports = app
