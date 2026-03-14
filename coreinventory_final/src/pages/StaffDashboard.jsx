import React from 'react'
import { Ico } from '../components/UI.jsx'
import { totalStock, stockStatus, prodName, whName, fNum, fDate, toDay } from '../store/index.js'

export default function StaffDashboard({ s, refresh, setPage }) {
  const { products, receipts, deliveries, warehouses, movements } = s

  const outOfStock  = products.filter(p => stockStatus(p) === 'out')
  const lowStock    = products.filter(p => stockStatus(p) === 'low')
  const pendingRcpt = receipts.filter(r => r.status === 'waiting')
  const pendingDlv  = deliveries.filter(d => d.status === 'waiting')
  const totalUnits  = products.reduce((a, p) => a + totalStock(p), 0)

  const quickActions = [
    { label: 'New Receipt',   icon: 'inbox',     page: 'receipts',    color: 'var(--cy)',  desc: 'Receive stock from suppliers' },
    { label: 'New Delivery',  icon: 'send',      page: 'deliveries',  color: 'var(--gn)',  desc: 'Ship stock to customers' },
    { label: 'New Transfer',  icon: 'arrow',     page: 'transfers',   color: 'var(--pu)',  desc: 'Move between warehouses' },
    { label: 'Adjustment',    icon: 'refresh',   page: 'adjustments', color: 'var(--am)',  desc: 'Correct inventory counts' },
  ]

  return (
    <div className="au">
      {/* Alerts */}
      {outOfStock.length > 0 && (
        <div className="as asr au" style={{ marginBottom: 10 }}>
          <Ico n="xCircle" size={14} color="var(--rd)"/>
          <span><b>{outOfStock.length} out of stock</b> — {outOfStock.map(p => p.name).join(', ')}</span>
        </div>
      )}

      {/* Header */}
      <div className="phd" style={{ marginBottom: 18 }}>
        <div>
          <div className="pt">Warehouse Operations</div>
          <div className="ps">Daily inventory management · {fDate(toDay())}</div>
        </div>
        <button className="btn bs bsm" onClick={refresh}><Ico n="refresh" size={13}/> Refresh</button>
      </div>

      {/* KPIs */}
      <div className="grid4" style={{ marginBottom: 18 }}>
        {[
          { label: 'Total SKUs',       val: products.length,    sub: `${fNum(totalUnits)} units`, color: 'var(--cy)', ic: 'box',     icBg: 'var(--cyd)' },
          { label: 'Low / Out Stock',  val: lowStock.length + outOfStock.length, sub: 'need attention', color: 'var(--rd)', ic: 'alert', icBg: 'var(--rdd)' },
          { label: 'Pending Receipts', val: pendingRcpt.length, sub: 'awaiting action', color: 'var(--am)', ic: 'inbox',   icBg: 'var(--amd)' },
          { label: 'Pending Deliveries',val:pendingDlv.length,  sub: 'awaiting action', color: 'var(--gn)', ic: 'send',    icBg: 'var(--gnd)' },
        ].map((k, i) => (
          <div key={i} className={`kpi au d${i + 1}`}>
            <div className="ki" style={{ background: k.icBg }}><Ico n={k.ic} size={17} color={k.color}/></div>
            <div className="kv" style={{ color: k.color }}>{k.val}</div>
            <div className="kl">{k.label}</div>
            <div className="kt tm"><Ico n="trending" size={11} color="var(--t2)"/>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: 'var(--t2)', letterSpacing: '.08em', fontWeight: 600, marginBottom: 10 }}>QUICK ACTIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {quickActions.map((a, i) => (
            <button
              key={a.page}
              onClick={() => setPage(a.page)}
              style={{
                background: 'var(--bg1)', border: `1px solid var(--b0)`, borderRadius: 12, padding: '18px 14px',
                cursor: 'pointer', textAlign: 'left', transition: '.18s', fontFamily: 'inherit',
                animation: `up .4s ease ${i * 0.06}s both`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b0)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${a.color}18`, display: 'grid', placeItems: 'center', marginBottom: 12, border: `1px solid ${a.color}28` }}>
                <Ico n={a.icon} size={18} color={a.color}/>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t0)', marginBottom: 4 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: 'var(--t2)' }}>{a.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid2">
        {/* Stock to watch */}
        <div className="card au">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b0)' }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)' }}>Stock Alerts</span>
          </div>
          <div style={{ padding: '0 0 8px' }}>
            {[...outOfStock, ...lowStock].slice(0, 8).map((p, i) => {
              const s = stockStatus(p)
              const color = s === 'out' ? 'var(--rd)' : 'var(--am)'
              const bg    = s === 'out' ? 'var(--rdd)' : 'var(--amd)'
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid var(--b0)' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t0)' }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--t2)' }}>{p.sku} · Reorder at {fNum(p.reorderLevel)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color, fontFamily: 'Syne,sans-serif' }}>{fNum(totalStock(p))}</div>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color, background: bg, padding: '1px 7px', borderRadius: 8 }}>
                      {s === 'out' ? 'OUT OF STOCK' : 'LOW STOCK'}
                    </span>
                  </div>
                </div>
              )
            })}
            {outOfStock.length === 0 && lowStock.length === 0 && (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--gn)', fontSize: 12 }}>
                <Ico n="checkCircle" size={28} color="var(--gn)"/>
                <div style={{ marginTop: 8, fontWeight: 600 }}>All stock levels healthy!</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Movements */}
        <div className="card au d2">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b0)' }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--t0)' }}>Recent Movements</span>
          </div>
          <div>
            {movements.slice(0, 8).map((m, i) => {
              const TYPE_COLOR = { receipt: 'var(--gn)', delivery: 'var(--rd)', transfer: 'var(--cy)', adjustment: 'var(--am)' }
              const TYPE_SYM   = { receipt: '↑', delivery: '↓', transfer: '⇄', adjustment: '≠' }
              const color = TYPE_COLOR[m.type] || 'var(--t2)'
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid var(--b0)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'grid', placeItems: 'center', fontSize: 12, color, fontWeight: 700, flexShrink: 0 }}>
                      {TYPE_SYM[m.type] || '·'}
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--t0)' }}>{prodName(s.products, m.productId)}</div>
                      <div style={{ fontSize: 10, color: 'var(--t2)' }}>{m.ref || m.type} · {m.date}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono,monospace' }}>
                    {m.type === 'delivery' ? '−' : '+'}{fNum(m.qty)}
                  </span>
                </div>
              )
            })}
            {movements.length === 0 && <div style={{ padding: 28, textAlign: 'center', color: 'var(--t2)', fontSize: 12 }}>No movements yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
