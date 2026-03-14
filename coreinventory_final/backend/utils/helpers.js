// utils/helpers.js — Shared utility functions
const { v4: uuidv4 } = require('uuid')

// Generate a short unique ID with optional prefix
const makeId = (prefix = '') => prefix + uuidv4().replace(/-/g, '').slice(0, 12)

// Today's date as YYYY-MM-DD
const toDay = () => new Date().toISOString().split('T')[0]

// Generate a 6-digit numeric OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

// Generate next reference number (e.g. RCT-005)
const nextRef = (db, table, column, prefix) => {
  const row = db.prepare(`SELECT ${column} FROM ${table} WHERE ${column} LIKE '${prefix}-%' ORDER BY ${column} DESC LIMIT 1`).get()
  if (!row) return `${prefix}-001`
  const match = row[column].match(/(\d+)$/)
  const num = match ? parseInt(match[1]) + 1 : 1
  return `${prefix}-${String(num).padStart(3, '0')}`
}

// Compute total stock across all warehouses for a product
const totalStock = (db, productId) => {
  const row = db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM product_stock WHERE product_id = ?').get(productId)
  return row ? row.total : 0
}

// Get stock for a product in a specific warehouse
const warehouseStock = (db, productId, warehouseId) => {
  const row = db.prepare('SELECT quantity FROM product_stock WHERE product_id = ? AND warehouse_id = ?').get(productId, warehouseId)
  return row ? row.quantity : 0
}

// Upsert stock: add delta to product_stock row
const adjustStock = (db, productId, warehouseId, delta) => {
  const current = warehouseStock(db, productId, warehouseId)
  const newQty  = Math.max(0, current + delta)
  db.prepare(`
    INSERT INTO product_stock (product_id, warehouse_id, quantity, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(product_id, warehouse_id)
    DO UPDATE SET quantity = ?, updated_at = datetime('now')
  `).run(productId, warehouseId, newQty, newQty)
  return newQty
}

// Set stock to absolute value
const setStock = (db, productId, warehouseId, quantity) => {
  db.prepare(`
    INSERT INTO product_stock (product_id, warehouse_id, quantity, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(product_id, warehouse_id)
    DO UPDATE SET quantity = ?, updated_at = datetime('now')
  `).run(productId, warehouseId, quantity, quantity)
}

// Log a movement to the stock ledger
const logMovement = (db, { type, productId, qty, fromWarehouse, toWarehouse, ref, createdBy }) => {
  db.prepare(`
    INSERT INTO stock_movements (id, date, type, product_id, qty, from_warehouse, to_warehouse, ref, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(makeId('mv'), toDay(), type, productId, qty, fromWarehouse || null, toWarehouse || null, ref, createdBy || null)
}

module.exports = { makeId, toDay, generateOTP, nextRef, totalStock, warehouseStock, adjustStock, setStock, logMovement }
