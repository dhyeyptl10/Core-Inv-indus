// routes/transfers.js — Internal warehouse transfers
// When VALIDATED: stock -= qty at source, stock += qty at destination
const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { v4: uuidv4 } = require('uuid')
const db     = require('../db/database')
const { auth, managerOrAdmin } = require('../middleware/auth')
const { nextRef, adjustStock, warehouseStock, logMovement, toDay } = require('../utils/helpers')

// ── Helper: build transfer with items ────────────────────────────────────────
const buildTransfer = (transfer) => {
  const items = db.prepare(`
    SELECT ti.*, p.name as product_name, p.sku, p.unit
    FROM transfer_items ti
    JOIN products p ON ti.product_id = p.id
    WHERE ti.transfer_id = ?
  `).all(transfer.id)

  const fromWH = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(transfer.from_warehouse)
  const toWH   = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(transfer.to_warehouse)
  return { ...transfer, items, from_warehouse_name: fromWH?.name, to_warehouse_name: toWH?.name }
}

// ─── GET /api/transfers ───────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const { status } = req.query
  let sql = 'SELECT * FROM transfers WHERE 1=1'
  const params = []
  if (status) { sql += ' AND status = ?'; params.push(status) }

  const transfers = db.prepare(sql + ' ORDER BY created_at DESC').all(...params)
  res.json({ success: true, data: transfers.map(buildTransfer), count: transfers.length })
})

// ─── GET /api/transfers/:id ───────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(req.params.id)
  if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' })
  res.json({ success: true, data: buildTransfer(transfer) })
})

// ─── POST /api/transfers ──────────────────────────────────────────────────────
router.post('/', auth, [
  body('fromWarehouse').notEmpty().withMessage('Source warehouse required'),
  body('toWarehouse').notEmpty().withMessage('Destination warehouse required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.productId').notEmpty(),
  body('items.*.qty').isInt({ min: 1 }),
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg })
  }

  const { fromWarehouse, toWarehouse, items, date, notes, status = 'draft' } = req.body

  if (fromWarehouse === toWarehouse) {
    return res.status(400).json({ success: false, message: 'Source and destination cannot be the same warehouse' })
  }

  const from = db.prepare('SELECT * FROM warehouses WHERE id = ? AND is_active = 1').get(fromWarehouse)
  const to   = db.prepare('SELECT * FROM warehouses WHERE id = ? AND is_active = 1').get(toWarehouse)
  if (!from) return res.status(400).json({ success: false, message: 'Source warehouse not found' })
  if (!to)   return res.status(400).json({ success: false, message: 'Destination warehouse not found' })

  for (const item of items) {
    const p = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.productId)
    if (!p) return res.status(400).json({ success: false, message: `Product not found: ${item.productId}` })
  }

  const id  = uuidv4()
  const ref = nextRef(db, 'transfers', 'ref', 'TRF')

  db.prepare('INSERT INTO transfers (id, ref, from_warehouse, to_warehouse, status, date, notes, created_by) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, ref, fromWarehouse, toWarehouse, status, date || toDay(), notes || null, req.user.id)

  const insItem = db.prepare('INSERT INTO transfer_items (id, transfer_id, product_id, qty) VALUES (?,?,?,?)')
  items.forEach(item => insItem.run(uuidv4(), id, item.productId, item.qty))

  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(id)
  res.status(201).json({ success: true, message: `Transfer ${ref} created`, data: buildTransfer(transfer) })
})

// ─── PUT /api/transfers/:id ───────────────────────────────────────────────────
router.put('/:id', auth, (req, res) => {
  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(req.params.id)
  if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' })
  if (transfer.status === 'done') {
    return res.status(400).json({ success: false, message: 'Cannot edit a validated transfer' })
  }

  const { fromWarehouse, toWarehouse, date, notes, status, items } = req.body

  if (fromWarehouse && toWarehouse && fromWarehouse === toWarehouse) {
    return res.status(400).json({ success: false, message: 'Source and destination must be different' })
  }

  db.prepare(`
    UPDATE transfers SET
      from_warehouse = COALESCE(?, from_warehouse),
      to_warehouse   = COALESCE(?, to_warehouse),
      date           = COALESCE(?, date),
      notes          = COALESCE(?, notes),
      status         = COALESCE(?, status)
    WHERE id = ?
  `).run(fromWarehouse || null, toWarehouse || null, date || null, notes ?? null, status || null, transfer.id)

  if (items && items.length > 0) {
    db.prepare('DELETE FROM transfer_items WHERE transfer_id = ?').run(transfer.id)
    const insItem = db.prepare('INSERT INTO transfer_items (id, transfer_id, product_id, qty) VALUES (?,?,?,?)')
    items.forEach(item => insItem.run(uuidv4(), transfer.id, item.productId, item.qty))
  }

  const updated = db.prepare('SELECT * FROM transfers WHERE id = ?').get(transfer.id)
  res.json({ success: true, message: 'Transfer updated', data: buildTransfer(updated) })
})

// ─── POST /api/transfers/:id/validate ────────────────────────────────────────
// THE CORE STOCK ENGINE: Transfer validation → stock moves between warehouses
router.post('/:id/validate', auth, managerOrAdmin, (req, res) => {
  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(req.params.id)
  if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' })
  if (transfer.status === 'done') {
    return res.status(400).json({ success: false, message: 'Transfer already validated' })
  }
  if (transfer.status === 'canceled') {
    return res.status(400).json({ success: false, message: 'Cannot validate a canceled transfer' })
  }

  const items = db.prepare('SELECT * FROM transfer_items WHERE transfer_id = ?').all(transfer.id)
  if (items.length === 0) {
    return res.status(400).json({ success: false, message: 'Transfer has no items' })
  }

  // ── Stock sufficiency check at source warehouse ──────────────────────────
  const insufficient = []
  items.forEach(item => {
    const available = warehouseStock(db, item.product_id, transfer.from_warehouse)
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
      message: 'Insufficient stock at source warehouse',
      details: insufficient,
    })
  }

  // ── Run in transaction ────────────────────────────────────────────────────
  const doValidate = db.transaction(() => {
    items.forEach(item => {
      // STOCK -= qty at source
      adjustStock(db, item.product_id, transfer.from_warehouse, -item.qty)
      // STOCK += qty at destination
      adjustStock(db, item.product_id, transfer.to_warehouse,   +item.qty)

      // Log movement (positive qty = net movement quantity)
      logMovement(db, {
        type:          'transfer',
        productId:     item.product_id,
        qty:           item.qty,
        fromWarehouse: transfer.from_warehouse,
        toWarehouse:   transfer.to_warehouse,
        ref:           transfer.ref,
        createdBy:     req.user.id,
      })
    })

    db.prepare("UPDATE transfers SET status = 'done' WHERE id = ?").run(transfer.id)
  })

  doValidate()

  const from = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(transfer.from_warehouse)
  const to   = db.prepare('SELECT name FROM warehouses WHERE id = ?').get(transfer.to_warehouse)
  const updated = db.prepare('SELECT * FROM transfers WHERE id = ?').get(transfer.id)

  res.json({
    success: true,
    message: `Transfer ${transfer.ref} validated — stock moved from ${from?.name} to ${to?.name}`,
    data: buildTransfer(updated),
  })
})

// ─── POST /api/transfers/:id/cancel ──────────────────────────────────────────
router.post('/:id/cancel', auth, managerOrAdmin, (req, res) => {
  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(req.params.id)
  if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' })
  if (transfer.status === 'done') {
    return res.status(400).json({ success: false, message: 'Cannot cancel a validated transfer' })
  }

  db.prepare("UPDATE transfers SET status = 'canceled' WHERE id = ?").run(transfer.id)
  res.json({ success: true, message: 'Transfer canceled' })
})

// ─── DELETE /api/transfers/:id ────────────────────────────────────────────────
router.delete('/:id', auth, managerOrAdmin, (req, res) => {
  const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(req.params.id)
  if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' })
  if (transfer.status === 'done') {
    return res.status(400).json({ success: false, message: 'Cannot delete a validated transfer' })
  }

  db.prepare('DELETE FROM transfers WHERE id = ?').run(transfer.id)
  res.json({ success: true, message: 'Transfer deleted' })
})

module.exports = router
