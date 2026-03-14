import React, { useState } from 'react'

// ── Icons ──────────────────────────────────────────────────────────────────────
const ICONS = {
  dashboard:   "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  box:         "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  inbox:       "M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
  send:        "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7",
  arrow:       "M17 1l4 4-4 4 M3 11V9a4 4 0 014-4h14 M7 23l-4-4 4-4 M21 13v2a4 4 0 01-4 4H3",
  list:        "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 12h6 M9 16h4",
  settings:    "M12 20a8 8 0 100-16 8 8 0 000 16z M12 14a2 2 0 100-4 2 2 0 000 4z",
  user:        "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  bell:        "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  search:      "M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.35-4.35",
  plus:        "M12 5v14 M5 12h14",
  sun:         "M12 1v2 M12 21v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M1 12h2 M21 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42 M12 17a5 5 0 100-10 5 5 0 000 10z",
  moon:        "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
  logout:      "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  alert:       "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  check:       "M20 6L9 17l-5-5",
  checkCircle: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  x:           "M18 6L6 18 M6 6l12 12",
  xCircle:     "M15 9l-6 6 M9 9l6 6 M12 22a10 10 0 100-20 10 10 0 000 20z",
  edit:        "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:       "M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  trending:    "M23 6l-9.5 9.5-5-5L1 18",
  warehouse:   "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  activity:    "M22 12h-4l-3 9L9 3l-3 9H2",
  archive:     "M21 8v13H3V8 M23 3H1v5h22V3z M10 12h4",
  eye:         "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  tag:         "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
  menu:        "M3 12h18 M3 6h18 M3 18h18",
  chevron:     "M9 18l6-6-6-6",
  chevD:       "M6 9l6 6 6-6",
  refresh:     "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15",
  layers:      "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
  zap:         "M13 2L3 14h9l-1 8 10-12h-9l1-8",
  database:    "M12 2a10 3 0 0110 3v14a10 3 0 01-20 0V5a10 3 0 0110-3z M2 5a10 3 0 0020 0 M2 12a10 3 0 0020 0",
  shield:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  crown:       "M2 20h20 M4 20l2-10 6 5 6-5 2 10",
  users:       "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  lock:        "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
  mail:        "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  key:         "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  barChart:    "M18 20V10 M12 20V4 M6 20v-6",
  pieChart:    "M21.21 15.89A10 10 0 118 2.83 M22 12A10 10 0 0012 2v10z",
}

export const Ico = ({ n, size=15, color='currentColor', stroke=1.8, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {(ICONS[n]||ICONS.box).split(' M').map((d,i) =>
      <path key={i} d={i===0 ? d : 'M'+d} />
    )}
  </svg>
)

// ── Badge ─────────────────────────────────────────────────────────────────────
const STATUS_MAP = { draft:'bd', waiting:'bw', ready:'brd', done:'bdn', canceled:'bc', low:'blow', out:'bout', ok:'bok' }
const STATUS_LBL = { draft:'Draft', waiting:'Waiting', ready:'Ready', done:'Done', canceled:'Canceled', low:'Low Stock', out:'Out of Stock', ok:'In Stock' }

export const Bdg = ({ s }) => (
  <span className={`bdg ${STATUS_MAP[s]||'bd'}`}>{STATUS_LBL[s]||s}</span>
)

// ── Toast ─────────────────────────────────────────────────────────────────────
let _toastFn = null
export const toast = (msg, t='s') => _toastFn && _toastFn(msg, t)

export const ToastBox = () => {
  const [items, setItems] = useState([])
  _toastFn = (msg, t) => {
    const id = Date.now()
    setItems(x => [...x, { id, msg, t }])
    setTimeout(() => setItems(x => x.filter(i => i.id!==id)), 3200)
  }
  if (!items.length) return null
  return (
    <div className="tw">
      {items.map(i => (
        <div key={i.id} className="tst">
          {i.t==='s' ? <Ico n="checkCircle" color="var(--gn)"/> : i.t==='e' ? <Ico n="xCircle" color="var(--rd)"/> : <Ico n="alert" color="var(--am)"/>}
          <span>{i.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ title, onClose, children, footer, wide }) => (
  <div className="overlay" onClick={e => { if (e.target===e.currentTarget) onClose() }}>
    <div className="modal" style={wide ? {maxWidth:640} : {}}>
      <div className="mhd">
        <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'var(--t0)'}}>{title}</span>
        <button className="btn bs bnr" onClick={onClose}><Ico n="x"/></button>
      </div>
      <div className="mbd">{children}</div>
      {footer && <div className="mft">{footer}</div>}
    </div>
  </div>
)

// ── Custom Tooltip ────────────────────────────────────────────────────────────
export const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{background:'var(--bg1)',border:'1px solid var(--b1)',borderRadius:7,padding:'9px 13px',fontSize:12}}>
      {label && <div style={{color:'var(--t0)',fontWeight:700,marginBottom:4}}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color,display:'flex',gap:8}}>
          <span>{p.name}</span><b>{Number(p.value).toLocaleString('en-IN')}</b>
        </div>
      ))}
    </div>
  )
}

// ── Item Editor ───────────────────────────────────────────────────────────────
export const ItemEditor = ({ items, setItems, products, warehouseId, type }) => {
  const add = () => setItems(x => [...x, { productId: products[0]?.id||'', qty:1 }])
  const rm  = i => setItems(x => x.filter((_,j) => j!==i))
  const up  = (i,k,v) => setItems(x => x.map((it,j) => j===i ? {...it,[k]:v} : it))

  return (
    <div>
      <div className="fcb" style={{marginBottom:8}}>
        <span className="lbl" style={{marginBottom:0}}>Items</span>
        <button className="btn bs bsm" onClick={add}><Ico n="plus" size={12}/>Add Item</button>
      </div>
      {items.map((it, i) => {
        const p = products.find(x => x.id===it.productId)
        const avail = type==='delivery' ? ((p?.stock||{})[warehouseId]||0) : null
        return (
          <div key={i} className="fc g2" style={{marginBottom:8}}>
            <select className="inp" style={{flex:2}} value={it.productId} onChange={e=>up(i,'productId',e.target.value)}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
            <input className="inp" style={{width:90}} type="number" min={1} value={it.qty} onChange={e=>up(i,'qty',e.target.value)} placeholder="Qty"/>
            {avail !== null && <span style={{fontSize:11,color:avail<it.qty?'var(--rd)':'var(--t2)',whiteSpace:'nowrap',minWidth:60}}>avail: {Number(avail).toLocaleString('en-IN')}</span>}
            <button className="btn br bnr bsm" onClick={()=>rm(i)}><Ico n="x" size={12}/></button>
          </div>
        )
      })}
      {items.length===0 && (
        <div style={{fontSize:12,color:'var(--t2)',textAlign:'center',padding:'10px 0',border:'1px dashed var(--b0)',borderRadius:7}}>
          No items — click Add Item
        </div>
      )}
    </div>
  )
}
