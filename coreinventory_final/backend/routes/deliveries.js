// routes/deliveries.js — Outgoing deliveries
// When VALIDATED: stock -= qty per item (with insufficient stock check)
const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { v4: uuidv4 } = require('uuid')
const db     = require('../db/database')
const { auth, managerOrAdmin } = require('../middleware/auth')
const { nextRef, adjustStock, warehouseStock, logMovement, toDay } = require('../utils/helpers')

// ── Helper: build delivery with items ────────────────────────────────────────
const buildDelivery = (delivery) => {
  const items = db.prepare(`
    SELECT di.*, p.name as product_name, p.sku, p.unit
    FROM delivery_items di
    JOIN products p ON di.product_id = p.id
    WHERE di.delivery_id = ?
  `).all(delivery.id)

  const warehouse = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(delivery.warehouse_id)
  return { ...delivery, items, warehouse_name: warehouse?.name }
}

// ─── GET /api/deliveries ──────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const { status, customer } = req.query
  let sql = 'SELECT * FROM deliveries WHERE 1=1'
  const params = []

  if (status)   { sql += ' AND status = ?';           params.push(status) }
  if (customer) { sql += ' AND customer LIKE ?';       params.push(`%${customer}%`) }

  const deliveries = db.prepare(sql + ' ORDER BY created_at DESC').all(...params)
  res.json({ success: true, data: deliveries.map(buildDelivery), count: deliveries.length })
})

// ─── GET /api/deliveries/:id ──────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)
  if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' })
  res.json({ success: true, data: buildDelivery(delivery) })
})

// ─── POST /api/deliveries ─────────────────────────────────────────────────────
router.post('/', auth, [
  body('customer').trim().notEmpty().withMessage('Customer required'),
  body('warehouseId').notEmpty().withMessage('Warehouse required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.productId').notEmpty(),
  body('items.*.qty').isInt({ min: 1 }),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { customer, warehouseId, items, date, notes, status = 'draft' } = req.body

  const wh = db.prepare('SELECT * FROM warehouses WHERE id = ? AND is_active = 1').get(warehouseId)
  if (!wh) return res.status(400).json({ success: false, message: 'Warehouse not found' })

  for (const item of items) {
    const p = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.productId)
    if (!p) return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` })
  }

  const id  = uuidv4()
  const ref = nextRef(db, 'deliveries', 'ref', 'DLV')

  db.prepare('INSERT INTO deliveries (id, ref, customer, warehouse_id, status, date, notes, created_by) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, ref, customer, warehouseId, status, date || toDay(), notes || null, req.user.id)

  const insItem = db.prepare('INSERT INTO delivery_items (id, delivery_id, product_id, qty) VALUES (?,?,?,?)')
  items.forEach(item => insItem.run(uuidv4(), id, item.productId, item.qty))

  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id)
  res.status(201).json({ success: true, message: `Delivery ${ref} created`, data: buildDelivery(delivery) })
})

// ─── PUT /api/deliveries/:id ──────────────────────────────────────────────────
router.put('/:id', auth, (req, res) => {
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)
  if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' })
  if (delivery.status === 'done') {
    return res.status(400).json({ success: false, message: 'Cannot edit a validated delivery' })
  }

  const { customer, warehouseId, date, notes, status, items } = req.body

  db.prepare(`
    UPDATE deliveries SET
      customer     = COALESCE(?, customer),
      warehouse_id = COALESCE(?, warehouse_id),
      date         = COALESCE(?, date),
      notes        = COALESCE(?, notes),
      status       = COALESCE(?, status)
    WHERE id = ?
  `).run(customer || null, warehouseId || null, date || null, notes ?? null, status || null, delivery.id)

  if (items && items.length > 0) {
    db.prepare('DELETE FROM delivery_items WHERE delivery_id = ?').run(delivery.id)
    const insItem = db.prepare('INSERT INTO delivery_items (id, delivery_id, product_id, qty) VALUES (?,?,?,?)')
    items.forEach(item => insItem.run(uuidv4(), delivery.id, item.productId, item.qty))
  }

  const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(delivery.id)
  res.json({ success: true, message: 'Delivery updated', data: buildDelivery(updated) })
})

// ─── POST /api/deliveries/:id/validate ───────────────────────────────────────
// THE CORE STOCK ENGINE: Delivery validation → stock decreases
router.post('/:id/validate', auth, managerOrAdmin, (req, res) => {
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)
  if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' })
  if (delivery.status === 'done') {
    return res.status(400).json({ success: false, message: 'Delivery already validated' })
  }
  if (delivery.status === 'canceled') {
    return res.status(400).json({ success: false, message: 'Cannot validate a canceled delivery' })
  }

  const items = db.prepare('SELECT * FROM delivery_items WHERE delivery_id = ?').all(delivery.id)
  if (items.length === 0) {
    return res.status(400).json({ success: false, message: 'Delivery has no items' })
  }

  // ── Stock sufficiency check (before any changes) ──────────────────────────
  const insufficient = []
  items.forEach(item => {
    const available = warehouseStock(db, item.product_id, delivery.warehouse_id)
    if (available < item.qty) {
      const p = db.prepare('SELECT name FROM products WHERE id = ?').get(item.product_id)
      insufficient.push({
        product:   p?.name || item.product_id,
        required:  item.qty,
        available,
        shortage:  item.qty - available,
      })
    }
  })

  if (insufficient.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient stock for delivery',
      details: insufficient,
    })
  }

  // ── All good — run in transaction ─────────────────────────────────────────
  const doValidate = db.transaction(() => {
    items.forEach(item => {
      // STOCK -= qty
      adjustStock(db, item.product_id, delivery.warehouse_id, -item.qty)

      // Log to stock ledger (negative qty = outgoing)
      logMovement(db, {
        type:          'delivery',
        productId:     item.product_id,
        qty:           -item.qty,
        fromWarehouse: delivery.warehouse_id,
        toWarehouse:   null,
        ref:           delivery.ref,
        createdBy:     req.user.id,
      })
    })

    db.prepare("UPDATE deliveries SET status = 'done' WHERE id = ?").run(delivery.id)
  })

  doValidate()

  const updated = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(delivery.id)
  res.json({ success: true, message: `Delivery ${delivery.ref} validated — stock deducted`, data: buildDelivery(updated) })
})

// ─── POST /api/deliveries/:id/cancel ─────────────────────────────────────────
router.post('/:id/cancel', auth, managerOrAdmin, (req, res) => {
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)
  if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' })
  if (delivery.status === 'done') {
    return res.status(400).json({ success: false, message: 'Cannot cancel a validated delivery' })
  }

  db.prepare("UPDATE deliveries SET status = 'canceled' WHERE id = ?").run(delivery.id)
  res.json({ success: true, message: 'Delivery canceled' })
})

// ─── DELETE /api/deliveries/:id ───────────────────────────────────────────────
router.delete('/:id', auth, managerOrAdmin, (req, res) => {
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(req.params.id)
  if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' })
  if (delivery.status === 'done') {
    return res.status(400).json({ success: false, message: 'Cannot delete a validated delivery' })
  }

  db.prepare('DELETE FROM deliveries WHERE id = ?').run(delivery.id)
  res.json({ success: true, message: 'Delivery deleted' })
})

module.exports = router
