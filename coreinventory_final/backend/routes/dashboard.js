// routes/dashboard.js — Dashboard KPIs and analytics
const router = require('express').Router()
const db     = require('../db/database')
const { auth } = require('../middleware/auth')

// ─── GET /api/dashboard ───────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {

  // ── Product & Stock Stats ──────────────────────────────────────────────────
  const products = db.prepare('SELECT * FROM products WHERE is_active = 1').all()

  const stockByProduct = products.map(p => {
    const stockRows  = db.prepare('SELECT quantity FROM product_stock WHERE product_id = ?').all(p.id)
    const totalStock = stockRows.reduce((a, b) => a + b.quantity, 0)
    return { ...p, totalStock }
  })

  const totalProducts  = products.length
  const outOfStock     = stockByProduct.filter(p => p.totalStock === 0).length
  const lowStock       = stockByProduct.filter(p => p.totalStock > 0 && p.totalStock <= p.reorder_level).length
  const totalStockUnits = stockByProduct.reduce((a, p) => a + p.totalStock, 0)

  // ── Operations counts ──────────────────────────────────────────────────────
  const receiptsTotal    = db.prepare("SELECT COUNT(*) as c FROM receipts").get().c
  const receiptsPending  = db.prepare("SELECT COUNT(*) as c FROM receipts WHERE status IN ('draft','waiting','ready')").get().c
  const deliveriesTotal  = db.prepare("SELECT COUNT(*) as c FROM deliveries").get().c
  const deliveriesPending = db.prepare("SELECT COUNT(*) as c FROM deliveries WHERE status IN ('draft','waiting','ready')").get().c
  const transfersTotal   = db.prepare("SELECT COUNT(*) as c FROM transfers").get().c
  const transfersPending = db.prepare("SELECT COUNT(*) as c FROM transfers WHERE status IN ('draft','waiting')").get().c

  // ── Warehouses ─────────────────────────────────────────────────────────────
  const warehouseCount = db.prepare("SELECT COUNT(*) as c FROM warehouses WHERE is_active = 1").get().c

  // ── Recent movements (last 10) ─────────────────────────────────────────────
  const recentMovements = db.prepare(`
    SELECT m.*, p.name AS product_name, p.sku,
           w1.name AS from_name, w2.name AS to_name
    FROM stock_movements m
    LEFT JOIN products   p  ON m.product_id    = p.id
    LEFT JOIN warehouses w1 ON m.from_warehouse = w1.id
    LEFT JOIN warehouses w2 ON m.to_warehouse   = w2.id
    ORDER BY m.created_at DESC LIMIT 10
  `).all()

  // ── Stock by category ──────────────────────────────────────────────────────
  const byCategory = db.prepare(`
    SELECT p.category,
           COUNT(DISTINCT p.id)       AS product_count,
           COALESCE(SUM(ps.quantity), 0) AS total_stock
    FROM products p
    LEFT JOIN product_stock ps ON ps.product_id = p.id
    WHERE p.is_active = 1
    GROUP BY p.category
    ORDER BY total_stock DESC
  `).all()

  // ── Movement trend (last 14 days) ─────────────────────────────────────────
  const movementTrend = db.prepare(`
    SELECT date,
           SUM(CASE WHEN type = 'receipt'    THEN ABS(qty) ELSE 0 END) AS receipts,
           SUM(CASE WHEN type = 'delivery'   THEN ABS(qty) ELSE 0 END) AS deliveries,
           SUM(CASE WHEN type = 'transfer'   THEN ABS(qty) ELSE 0 END) AS transfers,
           SUM(CASE WHEN type = 'adjustment' THEN ABS(qty) ELSE 0 END) AS adjustments
    FROM stock_movements
    WHERE date >= date('now', '-14 days')
    GROUP BY date
    ORDER BY date ASC
  `).all()

  // ── Low stock alerts ───────────────────────────────────────────────────────
  const lowStockAlerts = stockByProduct
    .filter(p => p.totalStock <= p.reorder_level)
    .sort((a, b) => a.totalStock - b.totalStock)
    .slice(0, 10)
    .map(p => ({ id: p.id, name: p.name, sku: p.sku, category: p.category, unit: p.unit, totalStock: p.totalStock, reorderLevel: p.reorder_level }))

  // ── Top stocked products ───────────────────────────────────────────────────
  const topStocked = stockByProduct
    .sort((a, b) => b.totalStock - a.totalStock)
    .slice(0, 5)
    .map(p => ({ id: p.id, name: p.name, sku: p.sku, totalStock: p.totalStock, unit: p.unit }))

  res.json({
    success: true,
    data: {
      kpis: {
        totalProducts,
        outOfStock,
        lowStock,
        totalStockUnits,
        warehouseCount,
        receiptsTotal,
        receiptsPending,
        deliveriesTotal,
        deliveriesPending,
        transfersTotal,
        transfersPending,
      },
      byCategory,
      movementTrend,
      recentMovements,
      lowStockAlerts,
      topStocked,
    },
  })
})

module.exports = router
