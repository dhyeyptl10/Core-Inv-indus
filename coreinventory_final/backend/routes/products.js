// routes/products.js — Product management with per-warehouse stock
const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { v4: uuidv4 } = require('uuid')
const db     = require('../db/database')
const { auth, managerOrAdmin } = require('../middleware/auth')
const { totalStock } = require('../utils/helpers')

// ── Helper: build full product object with stock ──────────────────────────────
const buildProduct = (product) => {
  const stockRows = db.prepare('SELECT warehouse_id, quantity FROM product_stock WHERE product_id = ?').all(product.id)
  const stock     = {}
  stockRows.forEach(r => { stock[r.warehouse_id] = r.quantity })
  return { ...product, stock }
}

// ─── GET /api/products ────────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const { category, search, lowStock } = req.query
  let sql  = 'SELECT * FROM products WHERE is_active = 1'
  const params = []

  if (category) { sql += ' AND category = ?'; params.push(category) }
  if (search)   { sql += ' AND (name LIKE ? OR sku LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }

  const products = db.prepare(sql + ' ORDER BY created_at DESC').all(...params)
  let result = products.map(buildProduct)

  if (lowStock === 'true') {
    result = result.filter(p => {
      const total = Object.values(p.stock).reduce((a, b) => a + b, 0)
      return total <= p.reorder_level
    })
  }

  res.json({ success: true, data: result, count: result.length })
})

// ─── GET /api/products/:id ────────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(req.params.id)
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' })
  res.json({ success: true, data: buildProduct(product) })
})

// ─── POST /api/products ───────────────────────────────────────────────────────
router.post('/', auth, managerOrAdmin, [
  body('name').trim().notEmpty().withMessage('Product name required'),
  body('sku').trim().notEmpty().withMessage('SKU required'),
  body('category').notEmpty().withMessage('Category required'),
  body('unit').notEmpty().withMessage('Unit required'),
  body('reorderLevel').isInt({ min: 0 }).withMessage('Reorder level must be a positive integer'),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { name, sku, category, unit, reorderLevel, description } = req.body

  // Unique SKU check
  const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku)
  if (existing) return res.status(409).json({ success: false, message: `SKU "${sku}" already exists` })

  const id = uuidv4()
  db.prepare(`
    INSERT INTO products (id, name, sku, category, unit, reorder_level, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, sku.toUpperCase(), category, unit, reorderLevel, description || null)

  // Initialize stock at 0 for all warehouses
  const warehouses = db.prepare('SELECT id FROM warehouses WHERE is_active = 1').all()
  const insStock   = db.prepare('INSERT INTO product_stock (product_id, warehouse_id, quantity) VALUES (?, ?, 0)')
  warehouses.forEach(w => insStock.run(id, w.id))

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
  res.status(201).json({ success: true, message: 'Product created', data: buildProduct(product) })
})

// ─── PUT /api/products/:id ────────────────────────────────────────────────────
router.put('/:id', auth, managerOrAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(req.params.id)
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

  const { name, sku, category, unit, reorderLevel, description } = req.body

  // SKU uniqueness check (exclude self)
  if (sku && sku !== product.sku) {
    const conflict = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(sku, product.id)
    if (conflict) return res.status(409).json({ success: false, message: `SKU "${sku}" already used by another product` })
  }

  db.prepare(`
    UPDATE products SET
      name          = COALESCE(?, name),
      sku           = COALESCE(?, sku),
      category      = COALESCE(?, category),
      unit          = COALESCE(?, unit),
      reorder_level = COALESCE(?, reorder_level),
      description   = COALESCE(?, description)
    WHERE id = ?
  `).run(name || null, sku ? sku.toUpperCase() : null, category || null, unit || null, reorderLevel ?? null, description ?? null, product.id)

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id)
  res.json({ success: true, message: 'Product updated', data: buildProduct(updated) })
})

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
router.delete('/:id', auth, managerOrAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(req.params.id)
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

  // Soft delete
  db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(product.id)
  res.json({ success: true, message: `Product "${product.name}" deleted` })
})

// ─── GET /api/products/:id/movements ─────────────────────────────────────────
// Per-product stock movement history
router.get('/:id/movements', auth, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' })

  const movements = db.prepare(`
    SELECT m.*, w1.name as from_name, w2.name as to_name
    FROM stock_movements m
    LEFT JOIN warehouses w1 ON m.from_warehouse = w1.id
    LEFT JOIN warehouses w2 ON m.to_warehouse   = w2.id
    WHERE m.product_id = ?
    ORDER BY m.created_at DESC
    LIMIT 100
  `).all(req.params.id)

  res.json({ success: true, data: movements })
})

// ─── GET /api/products/categories/list ────────────────────────────────────────
router.get('/categories/list', auth, (req, res) => {
  const cats = db.prepare('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category').all()
  res.json({ success: true, data: cats.map(c => c.category) })
})

module.exports = router
