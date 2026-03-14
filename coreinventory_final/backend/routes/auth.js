// routes/auth.js — Authentication: signup, login, OTP password reset
const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { body, validationResult } = require('express-validator')
const db      = require('../db/database')
const { auth } = require('../middleware/auth')
const { sendOTPEmail } = require('../utils/email')
const { generateOTP, toDay, makeId } = require('../utils/helpers')

// ── Helper: sign a JWT ────────────────────────────────────────────────────────
const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
)

// ── Helper: format user for response ─────────────────────────────────────────
const safeUser = (u) => ({
  id:     u.id,
  name:   u.name,
  email:  u.email,
  role:   u.role,
  avatar: u.avatar || u.name.slice(0, 2).toUpperCase(),
})

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg })
  }

  const { name, email, password, role = 'warehouse_staff' } = req.body

  // Check if email already taken
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered — please log in' })
  }

  const hash   = await bcrypt.hash(password, 12)
  const id     = uuidv4()
  const avatar = name.slice(0, 2).toUpperCase()

  db.prepare('INSERT INTO users (id, name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, email, hash, role, avatar)

  const user  = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  const token = signToken(user)

  res.status(201).json({
    success: true,
    message: `Welcome, ${name}! Account created.`,
    token,
    user: safeUser(user),
  })
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { email, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email)
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' })
  }

  const token = signToken(user)

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: safeUser(user),
  })
})

// ─── POST /api/auth/otp/send ──────────────────────────────────────────────────
// Step 1: User enters email → server generates OTP and sends email
router.post('/otp/send', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { email } = req.body
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email)

  // Security: always say "sent" even if email not found (prevent user enumeration)
  if (!user) {
    return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' })
  }

  // Invalidate old OTPs for this email
  db.prepare("UPDATE otp_codes SET used = 1 WHERE email = ? AND purpose = 'reset'").run(email)

  // Generate new OTP
  const code      = generateOTP()
  const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRE_MINUTES || '10')) * 60 * 1000).toISOString()

  db.prepare('INSERT INTO otp_codes (id, email, code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), email, code, 'reset', expiresAt)

  // Try to send email
  try {
    await sendOTPEmail(email, code, user.name)
    res.json({
      success: true,
      message: `OTP sent to ${email}. Check your inbox (and spam folder). Expires in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.`
    })
  } catch (emailErr) {
    console.error('📧  Email send failed:', emailErr.message)
    // SMTP not configured or failed — use dev-mode fallback
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔑  DEV MODE OTP for', email, ':', code)
      res.json({
        success: true,
        devMode: true,
        message: `SMTP not configured — dev mode active. OTP: ${code} (also shown in server console)`,
        devOtp: code
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please contact your administrator to configure SMTP settings.'
      })
    }
  }
})

// ─── POST /api/auth/otp/verify ────────────────────────────────────────────────
// Step 2: Verify OTP code
router.post('/otp/verify', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4–6 digits'),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { email, code } = req.body
  const otp = db.prepare(`
    SELECT * FROM otp_codes
    WHERE email = ? AND code = ? AND purpose = 'reset' AND used = 0
    AND expires_at > datetime('now')
    ORDER BY created_at DESC LIMIT 1
  `).get(email, code)

  if (!otp) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
  }

  // Issue a short-lived reset token (don't mark OTP used yet — needed for password reset)
  const resetToken = jwt.sign({ email, otpId: otp.id }, process.env.JWT_SECRET, { expiresIn: '15m' })

  res.json({ success: true, message: 'OTP verified', resetToken })
})

// ─── POST /api/auth/otp/reset ─────────────────────────────────────────────────
// Step 3: Reset password using reset token
router.post('/otp/reset', [
  body('resetToken').notEmpty().withMessage('Reset token required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { resetToken, newPassword } = req.body

  let decoded
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET)
  } catch (err) {
    return res.status(400).json({ success: false, message: 'Reset token expired or invalid — request a new OTP' })
  }

  const { email, otpId } = decoded

  // Mark OTP as used
  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otpId)

  // Update password
  const hash = await bcrypt.hash(newPassword, 12)
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, email)

  res.json({ success: true, message: 'Password reset successfully. Please log in.' })
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Get current logged-in user profile
router.get('/me', auth, (req, res) => {
  res.json({ success: true, user: safeUser(req.user) })
})

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
// Update profile (name, avatar)
router.put('/profile', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { name, avatar } = req.body
  const updates = {}
  if (name)   updates.name   = name
  if (avatar) updates.avatar = avatar

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'Nothing to update' })
  }

  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ')
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...Object.values(updates), req.user.id)

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({ success: true, message: 'Profile updated', user: safeUser(updated) })
})

// ─── PUT /api/auth/password ───────────────────────────────────────────────────
// Change password (when logged in)
router.put('/password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)

  const match = await bcrypt.compare(currentPassword, user.password)
  if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' })

  const hash = await bcrypt.hash(newPassword, 12)
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id)
  res.json({ success: true, message: 'Password changed successfully' })
})

module.exports = router
