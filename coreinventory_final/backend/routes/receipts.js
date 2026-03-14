// routes/receipts.js — Incoming stock receipts
// When a receipt is VALIDATED (status → done): stock += qty for each item
const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { v4: uuidv4 } = require('uuid')
const db     = require('../db/database')
const { auth, managerOrAdmin } = require('../middleware/auth')
const { nextRef, adjustStock, logMovement, toDay } = require('../utils/helpers')

// ── Helper: build receipt with items ─────────────────────────────────────────
const buildReceipt = (receipt) => {
  const items = db.prepare(`
    SELECT ri.*, p.name as product_name, p.sku, p.unit
    FROM receipt_items ri
    JOIN products p ON ri.product_id = p.id
    WHERE ri.receipt_id = ?
  `).all(receipt.id)

  const warehouse = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(receipt.warehouse_id)
  return { ...receipt, items, warehouse_name: warehouse?.name }
}

// ─── GET /api/receipts ────────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const { status, supplier } = req.query
  let sql = 'SELECT * FROM receipts WHERE 1=1'
  const params = []

  if (status)   { sql += ' AND status = ?';           params.push(status) }
  if (supplier) { sql += ' AND supplier LIKE ?';       params.push(`%${supplier}%`) }

  const receipts = db.prepare(sql + ' ORDER BY created_at DESC').all(...params)
  res.json({ success: true, data: receipts.map(buildReceipt), count: receipts.length })
})

// ─── GET /api/receipts/:id ────────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id)
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' })
  res.json({ success: true, data: buildReceipt(receipt) })
})

// ─── POST /api/receipts ───────────────────────────────────────────────────────
router.post('/', auth, [
  body('supplier').trim().notEmpty().withMessage('Supplier required'),
  body('warehouseId').notEmpty().withMessage('Warehouse required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.productId').notEmpty().withMessage('Product ID required for each item'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { supplier, warehouseId, items, date, notes, status = 'draft' } = req.body

  // Validate warehouse
  const wh = db.prepare('SELECT * FROM warehouses WHERE id = ? AND is_active = 1').get(warehouseId)
  if (!wh) return res.status(400).json({ success: false, message: 'Warehouse not found' })

  // Validate all products
  for (const item of items) {
    const p = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.productId)
    if (!p) return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` })
  }

  const id  = uuidv4()
  const ref = nextRef(db, 'receipts', 'ref', 'RCT')

  db.prepare('INSERT INTO receipts (id, ref, supplier, warehouse_id, status, date, notes, created_by) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, ref, supplier, warehouseId, status, date || toDay(), notes || null, req.user.id)

  const insItem = db.prepare('INSERT INTO receipt_items (id, receipt_id, product_id, qty) VALUES (?,?,?,?)')
  items.forEach(item => insItem.run(uuidv4(), id, item.productId, item.qty))

  const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(id)
  res.status(201).json({ success: true, message: `Receipt ${ref} created`, data: buildReceipt(receipt) })
})

// ─── PUT /api/receipts/:id ────────────────────────────────────────────────────
router.put('/:id', auth, (req, res) => {
  const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id)
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' })
  if (receipt.status === 'done') {
    return res.status(400).json({ success: false, message: 'Cannot edit a validated receipt' })
  }

  const { supplier, warehouseId, date, notes, status, items } = req.body

  db.prepare(`
    UPDATE receipts SET
      supplier     = COALESCE(?, supplier),
      warehouse_id = COALESCE(?, warehouse_id),
      date         = COALESCE(?, date),
      notes        = COALESCE(?, notes),
      status       = COALESCE(?, status)
    WHERE id = ?
  `).run(supplier || null, warehouseId || null, date || null, notes ?? null, status || null, receipt.id)

  // Replace items if provided
  if (items && items.length > 0) {
    db.prepare('DELETE FROM receipt_items WHERE receipt_id = ?').run(receipt.id)
    const insItem = db.prepare('INSERT INTO receipt_items (id, receipt_id, product_id, qty) VALUES (?,?,?,?)')
    items.forEach(item => insItem.run(uuidv4(), receipt.id, item.productId, item.qty))
  }

  const updated = db.prepare('SELECT * FROM receipts WHERE id = ?').get(receipt.id)
  res.json({ success: true, message: 'Receipt updated', data: buildReceipt(updated) })
})

// ─── POST /api/receipts/:id/validate ─────────────────────────────────────────
// THE CORE STOCK ENGINE: Receipt validation → stock increases
router.post('/:id/validate', auth, managerOrAdmin, (req, res) => {
  const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id)
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' })
  if (receipt.status === 'done') {
    return res.status(400).json({ success: false, message: 'Receipt already validated' })
  }
  if (receipt.status === 'canceled') {
    return res.status(400).json({ success: false, message: 'Cannot validate a canceled receipt' })
  }

  const items = db.prepare('SELECT * FROM receipt_items WHERE receipt_id = ?').all(receipt.id)
  if (items.length === 0) {
    return res.status(400).json({ success: false, message: 'Receipt has no items' })
  }

  // Run everything in a transaction for atomicity
  const doValidate = db.transaction(() => {
    items.forEach(item => {
      // STOCK += qty for this warehouse
      adjustStock(db, item.product_id, receipt.warehouse_id, item.qty)

      // Log to stock ledger
      logMovement(db, {
        type:        'receipt',
        productId:   item.product_id,
        qty:         item.qty,
        fromWarehouse: null,
        toWarehouse: receipt.warehouse_id,
        ref:         receipt.ref,
        createdBy:   req.user.id,
      })
    })

    db.prepare("UPDATE receipts SET status = 'done' WHERE id = ?").run(receipt.id)
  })

  doValidate()

  const updated = db.prepare('SELECT * FROM receipts WHERE id = ?').get(receipt.id)
  res.json({ success: true, message: `Receipt ${receipt.ref} validated — stock updated`, data: buildReceipt(updated) })
})

// ─── POST /api/receipts/:id/cancel ───────────────────────────────────────────
router.post('/:id/cancel', auth, managerOrAdmin, (req, res) => {
  const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id)
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' })
  if (receipt.status === 'done') {
    return res.status(400).json({ success: false, message: 'Cannot cancel a validated receipt' })
  }

  db.prepare("UPDATE receipts SET status = 'canceled' WHERE id = ?").run(receipt.id)
  res.json({ success: true, message: 'Receipt canceled' })
})

// ─── DELETE /api/receipts/:id ─────────────────────────────────────────────────
router.delete('/:id', auth, managerOrAdmin, (req, res) => {
  const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id)
  if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' })
  if (receipt.status === 'done') {
    return res.status(400).json({ success: false, message: 'Cannot delete a validated receipt — cancel it first' })
  }

  db.prepare('DELETE FROM receipts WHERE id = ?').run(receipt.id)
  res.json({ success: true, message: 'Receipt deleted' })
})

module.exports = router
