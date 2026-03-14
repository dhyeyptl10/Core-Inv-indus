import React, { useState } from 'react'
import { Ico } from '../components/UI.jsx'
import { totalStock, stockStatus, prodName, whName, fNum, fDate, toDay } from '../store/index.js'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const WEEK = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const PIE_CLR = ['#22d3ee','#10b981','#a78bfa','#f59e0b','#f43f5e','#06b6d4','#7c3aed','#ec4899']

export default function ManagerDashboard({ s, refresh }) {
  const { products, receipts, deliveries, transfers, warehouses, adjustments, movements } = s
  const [activeTab, setActiveTab] = useState('overview')

  /* ── Computed stats ── */
  const totalProducts   = products.length
  const totalUnits      = products.reduce((a, p) => a + totalStock(p), 0)
  const lowStock        = products.filter(p => stockStatus(p) === 'low')
  const outOfStock      = products.filter(p => stockStatus(p) === 'out')

  const pendingRcpt     = receipts.filter(r => ['waiting','ready','draft'].includes(r.status))
  const pendingDlv      = deliveries.filter(d => ['waiting','ready','draft'].includes(d.status))
  const pendingTrf      = transfers.filter(t => ['waiting','ready','draft'].includes(t.status))

  const doneRcpt        = receipts.filter(r => r.status === 'done').length
  const doneDlv         = deliveries.filter(d => d.status === 'done').length
  const doneTrf         = transfers.filter(t => t.status === 'done').length

  /* ── Category breakdown ── */
  const byCat = {}
  products.forEach(p => {
    byCat[p.category] = (byCat[p.category] || 0) + totalStock(p)
  })
  const pieData = Object.entries(byCat).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))

  /* ── Operations summary for bar chart ── */
  const opsData = WEEK.map((day, i) => ({
    day,
    receipts:   Math.floor(Math.random() * 8 + 2),
    deliveries: Math.floor(Math.random() * 6 + 1),
    transfers:  Math.floor(Math.random() * 4 + 1),
  }))

  /* ── Top moving products ── */
  const productMovements = {}
  movements.forEach(m => {
    if (!productMovements[m.productId]) productMovements[m.productId] = 0
    productMovements[m.productId] += m.qty
  })
  const topProducts = Object.entries(productMovements)
    .map(([id, qty]) => ({ name: prodName(s.products, id), qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6)

  /* ── Warehouse stock breakdown ── */
  const warehouseStock = warehouses.map(w => ({
    name: w.name.length > 14 ? w.name.slice(0, 14) + '…' : w.name,
    stock: products.reduce((a, p) => a + (p.stock?.[w.id] || 0), 0),
  }))

  const TABS = [
    { id: 'overview',    label: 'Overview',    icon: 'dashboard' },
    { id: 'operations',  label: 'Operations',  icon: 'activity'  },
    { id: 'stock',       label: 'Stock Intel', icon: 'box'       },
    { id: 'reports',     label: 'Reports',     icon: 'barChart'  },
  ]

  return (
    <div className="au">
      {/* ── Alerts ── */}
      {outOfStock.length > 0 && (
        <div className="as asr au" style={{ marginBottom: 10 }}>
          <Ico n="xCircle" size={14} color="var(--rd)"/>
          <span><b>{outOfStock.length} products out of stock</b> — {outOfStock.map(p => p.name).join(', ')}</span>
        </div>
      )}
      {lowStock.length > 0 && (
        <div className="as asw au d1" style={{ marginBottom: 10 }}>
          <Ico n="alert" size={14} color="var(--am)"/>
          <span><b>{lowStock.length} products below reorder level</b> — immediate restocking recommended</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="phd" style={{ marginBottom: 18 }}>
        <div>
          <div className="pt">Manager Command Center</div>
          <div className="ps">Operations intelligence · {fDate(toDay())}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn bs bsm" onClick={refresh}>
            <Ico n="refresh" size={13}/> Refresh
          </button>
          <div style={{ fontSize: 11, color: 'var(--t2)', background: 'var(--bg1)', border: '1px solid var(--b0)', padding: '5px 10px', borderRadius: 6, fontFamily: 'JetBrains Mono,monospace' }}>
            <span style={{ color: 'var(--gn)' }}>● </span>LIVE
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: 'var(--bg1)', border: '1px solid var(--b0)', borderRadius: 9, padding: 5, width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', transition: '.18s',
              background: activeTab === t.id ? 'var(--cy)' : 'transparent',
              color: activeTab === t.id ? 'white' : 'var(--t2)',
            }}
          >
            <Ico n={t.icon} size={13} color={activeTab === t.id ? 'white' : 'var(--t2)'}/>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════ */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Row */}
          <div className="grid5" style={{ marginBottom: 16 }}>
            {[
              { label: 'Total Products',   val: totalProducts,           sub: `${fNum(totalUnits)} units`, color: 'var(--cy)', ic: 'box',       icBg: 'var(--cyd)' },
              { label: 'Out of Stock',     val: outOfStock.length,       sub: `${lowStock.length} low`,    color: 'var(--rd)', ic: 'xCircle',   icBg: 'var(--rdd)' },
              { label: 'Pending Ops',      val: pendingRcpt.length + pendingDlv.length + pendingTrf.length,
                                                                          sub: 'need action',               color: 'var(--am)', ic: 'alert',     icBg: 'var(--amd)' },
              { label: 'Completed Today',  val: doneRcpt + doneDlv,      sub: 'ops done',                  color: 'var(--gn)', ic: 'checkCircle',icBg: 'var(--gnd)' },
              { label: 'Warehouses',       val: warehouses.length,        sub: 'active locations',          color: 'var(--pu)', ic: 'warehouse',  icBg: 'var(--pud)' },
            ].map((k, i) => (
              <div key={i} className={`kpi au d${i + 1}`}>
                <div className="ki" style={{ background: k.icBg }}><Ico n={k.ic} size={17} color={k.color}/></div>
                <div className="kv" style={{ color: k.color }}>{k.val}</div>
                <div className="kl">{k.label}</div>
                <div className="kt tm"><Ico n="trending" size={11} color="var(--t2)"/>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid2" style={{ marginBottom: 16 }}>
            {/* Operations Bar Chart */}
            <div className="card cp au d2">
              <div className="fcb" style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)' }}>Weekly Operations</span>
                <span style={{ fontSize: 10.5, color: 'var(--t2)' }}>Last 7 days</span>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={opsData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--b0)" vertical={false}/>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--t2)' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 10, fill: 'var(--t2)' }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ background: 'var(--bg1)', border: '1px solid var(--b0)', borderRadius: 8, fontSize: 11 }} cursor={{ fill: 'rgba(255,255,255,.04)' }}/>
                  <Bar dataKey="receipts" fill="#22d3ee" radius={[3, 3, 0, 0]} maxBarSize={14}/>
                  <Bar dataKey="deliveries" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={14}/>
                  <Bar dataKey="transfers" fill="#a78bfa" radius={[3, 3, 0, 0]} maxBarSize={14}/>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 4 }}>
                {[['Receipts','#22d3ee'],['Deliveries','#10b981'],['Transfers','#a78bfa']].map(([l,c]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--t2)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c }}/>
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Stock by category pie */}
            <div className="card cp au d3">
              <div className="fcb" style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)' }}>Stock by Category</span>
                <span style={{ fontSize: 10.5, color: 'var(--t2)' }}>{pieData.length} categories</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={2} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_CLR[i % PIE_CLR.length]}/>)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg1)', border: '1px solid var(--b0)', borderRadius: 8, fontSize: 11 }}/>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {pieData.slice(0, 5).map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: PIE_CLR[i % PIE_CLR.length], flexShrink: 0 }}/>
                        <span style={{ fontSize: 10.5, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 10.5, color: 'var(--t2)', fontFamily: 'JetBrains Mono,monospace' }}>{fNum(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Operations */}
          <div className="grid3" style={{ marginBottom: 16 }}>
            {[
              { title: 'Pending Receipts',   items: pendingRcpt,  color: 'var(--cy)', icon: 'inbox',     keyField: 'supplier' },
              { title: 'Pending Deliveries', items: pendingDlv,   color: 'var(--gn)', icon: 'send',      keyField: 'customer' },
              { title: 'Pending Transfers',  items: pendingTrf,   color: 'var(--pu)', icon: 'arrow',     keyField: 'ref' },
            ].map(({ title, items, color, icon, keyField }) => (
              <div key={title} className="card cp au d4">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: 'grid', placeItems: 'center' }}>
                      <Ico n={icon} size={14} color={color}/>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--t0)' }}>{title}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'Syne,sans-serif' }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.slice(0, 4).map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--bg0)', borderRadius: 7, border: '1px solid var(--b0)' }}>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t0)' }}>{item[keyField] || item.ref}</div>
                        <div style={{ fontSize: 10, color: 'var(--t2)' }}>{item.ref} · {item.date}</div>
                      </div>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color, background: `${color}18`, padding: '2px 7px', borderRadius: 8, textTransform: 'uppercase' }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                  {items.length === 0 && <div style={{ fontSize: 11.5, color: 'var(--t2)', textAlign: 'center', padding: '10px 0' }}>All clear ✓</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════ OPERATIONS TAB ══════════════ */}
      {activeTab === 'operations' && (
        <>
          <div className="grid2" style={{ marginBottom: 16 }}>
            {/* Recent movements */}
            <div className="card au">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b0)' }}>
                <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)' }}>Recent Stock Movements</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--b0)' }}>
                      {['Date','Type','Product','Qty','Ref'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--t2)', letterSpacing: '.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.slice(0, 12).map((m, i) => {
                      const TYPE_COLOR = { receipt: 'var(--gn)', delivery: 'var(--rd)', transfer: 'var(--cy)', adjustment: 'var(--am)' }
                      const TYPE_SYM   = { receipt: '↑', delivery: '↓', transfer: '⇄', adjustment: '≠' }
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--b0)', transition: '.1s' }}>
                          <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--t2)' }}>{m.date}</td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: TYPE_COLOR[m.type] || 'var(--t2)', background: `${TYPE_COLOR[m.type]}18`, padding: '2px 7px', borderRadius: 8 }}>
                              {TYPE_SYM[m.type] || '·'} {m.type}
                            </span>
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: 11.5, color: 'var(--t1)' }}>{prodName(s.products, m.productId)}</td>
                          <td style={{ padding: '9px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--t0)', fontFamily: 'JetBrains Mono,monospace' }}>{fNum(m.qty)}</td>
                          <td style={{ padding: '9px 14px', fontSize: 10.5, color: 'var(--t2)', fontFamily: 'JetBrains Mono,monospace' }}>{m.ref || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {movements.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--t2)', fontSize: 12 }}>No movements yet</div>}
              </div>
            </div>

            {/* Operations completion rates */}
            <div className="card cp au d2">
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)', marginBottom: 16 }}>Operations Status</div>
              {[
                { label: 'Receipts',   total: receipts.length,   done: doneRcpt,   color: 'var(--cy)' },
                { label: 'Deliveries', total: deliveries.length, done: doneDlv,    color: 'var(--gn)' },
                { label: 'Transfers',  total: transfers.length,  done: doneTrf,    color: 'var(--pu)' },
                { label: 'Adjustments',total: adjustments.length,done: adjustments.length, color: 'var(--am)' },
              ].map(({ label, total, done, color }) => {
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--t1)', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 11, color, fontFamily: 'JetBrains Mono,monospace' }}>{done}/{total} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg0)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--b0)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: '1s ease' }}/>
                    </div>
                  </div>
                )
              })}

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--b0)' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--t0)', marginBottom: 10 }}>Top Moving Products</div>
                {topProducts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--b0)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--t2)', width: 16, textAlign: 'right' }}>#{i + 1}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--t1)' }}>{p.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cy)', fontFamily: 'JetBrains Mono,monospace' }}>{fNum(p.qty)} units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══════════════ STOCK INTEL TAB ══════════════ */}
      {activeTab === 'stock' && (
        <>
          {/* Warehouse stock levels */}
          <div className="card cp au" style={{ marginBottom: 16 }}>
            <div className="fcb" style={{ marginBottom: 14 }}>
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)' }}>Stock Levels by Warehouse</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={warehouseStock} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--b0)" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--t2)' }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--t1)' }} axisLine={false} tickLine={false} width={100}/>
                <Tooltip contentStyle={{ background: 'var(--bg1)', border: '1px solid var(--b0)', borderRadius: 8, fontSize: 11 }}/>
                <Bar dataKey="stock" fill="#22d3ee" radius={[0, 4, 4, 0]} maxBarSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Products stock table */}
          <div className="card au">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b0)' }}>
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)' }}>Product Stock Status</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--b0)' }}>
                    {['Product','SKU','Category','Total Stock','Reorder At','Status'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--t2)', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const total = totalStock(p)
                    const status = stockStatus(p)
                    const STATUS_COLOR = { ok: 'var(--gn)', low: 'var(--am)', out: 'var(--rd)' }
                    const STATUS_BG    = { ok: 'var(--gnd)', low: 'var(--amd)', out: 'var(--rdd)' }
                    const STATUS_LBL   = { ok: 'In Stock', low: 'Low Stock', out: 'Out of Stock' }
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--b0)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.012)' }}>
                        <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: 'var(--t0)' }}>{p.name}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--t2)', fontFamily: 'JetBrains Mono,monospace' }}>{p.sku}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11.5, color: 'var(--t1)' }}>{p.category}</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--t0)', fontFamily: 'Syne,sans-serif' }}>{fNum(total)}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--t2)' }}>{fNum(p.reorderLevel)} {p.unit}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[status], background: STATUS_BG[status], padding: '2px 8px', borderRadius: 10, border: `1px solid ${STATUS_COLOR[status]}28` }}>
                            {STATUS_LBL[status]}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══════════════ REPORTS TAB ══════════════ */}
      {activeTab === 'reports' && (
        <div className="grid2">
          {/* Operations Summary Report */}
          <div className="card cp au">
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)', marginBottom: 16 }}>Operations Summary Report</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total Receipts',     val: receipts.length,   color: 'var(--cy)' },
                { label: 'Completed Receipts', val: doneRcpt,           color: 'var(--gn)' },
                { label: 'Total Deliveries',   val: deliveries.length,  color: 'var(--am)' },
                { label: 'Completed Deliveries',val: doneDlv,           color: 'var(--gn)' },
                { label: 'Total Transfers',    val: transfers.length,   color: 'var(--pu)' },
                { label: 'Completed Transfers',val: doneTrf,            color: 'var(--gn)' },
                { label: 'Adjustments',        val: adjustments.length, color: 'var(--rd)' },
                { label: 'Total Movements',    val: movements.length,   color: 'var(--cy)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg0)', borderRadius: 7, border: '1px solid var(--b0)' }}>
                  <span style={{ fontSize: 12, color: 'var(--t1)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'Syne,sans-serif' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Health Report */}
          <div className="card cp au d2">
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)', marginBottom: 16 }}>Inventory Health Report</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total SKUs',         val: products.length,      color: 'var(--cy)' },
                { label: 'Total Units in Stock',val: fNum(totalUnits),    color: 'var(--gn)' },
                { label: 'In Stock Products',  val: products.filter(p => stockStatus(p) === 'ok').length, color: 'var(--gn)' },
                { label: 'Low Stock Products', val: lowStock.length,      color: 'var(--am)' },
                { label: 'Out of Stock',       val: outOfStock.length,    color: 'var(--rd)' },
                { label: 'Active Warehouses',  val: warehouses.length,    color: 'var(--pu)' },
                { label: 'Stock Categories',   val: Object.keys(byCat).length, color: 'var(--cy)' },
                { label: 'Avg Units per SKU',  val: products.length > 0 ? Math.round(totalUnits / products.length) : 0, color: 'var(--t1)' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg0)', borderRadius: 7, border: '1px solid var(--b0)' }}>
                  <span style={{ fontSize: 12, color: 'var(--t1)' }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'Syne,sans-serif' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
