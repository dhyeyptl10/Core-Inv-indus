import React, { useState } from 'react'
import { Ico } from './UI.jsx'

const ROLE_NAV = {
  admin: {
    top: [
      { id:'dashboard',  icon:'dashboard',  label:'Dashboard'      },
      { id:'adminPanel', icon:'shield',      label:'Admin Panel', badge:'ADMIN' },
    ],
    ops: [
      ['receipts',    'inbox',   'Receipts'],
      ['deliveries',  'send',    'Deliveries'],
      ['transfers',   'arrow',   'Transfers'],
      ['adjustments', 'refresh', 'Adjustments'],
      ['history',     'list',    'Move History'],
    ],
    settings: [
      ['warehouses', 'warehouse', 'Warehouses'],
      ['products',   'box',       'Products'],
      ['profile',    'user',      'Profile'],
    ],
  },
  manager: {
    top: [
      { id:'dashboard',   icon:'dashboard', label:'Dashboard' },
    ],
    ops: [
      ['products',    'box',     'Products'],
      ['receipts',    'inbox',   'Receipts'],
      ['deliveries',  'send',    'Deliveries'],
      ['transfers',   'arrow',   'Transfers'],
      ['adjustments', 'refresh', 'Adjustments'],
      ['history',     'list',    'Move History'],
    ],
    settings: [
      ['warehouses', 'warehouse', 'Warehouses'],
      ['profile',    'user',      'Profile'],
    ],
  },
  warehouse_staff: {
    top: [
      { id:'dashboard', icon:'dashboard', label:'Dashboard' },
    ],
    ops: [
      ['products',    'box',     'Products'],
      ['receipts',    'inbox',   'Receipts'],
      ['deliveries',  'send',    'Deliveries'],
      ['transfers',   'arrow',   'Transfers'],
      ['adjustments', 'refresh', 'Adjustments'],
      ['history',     'list',    'Move History'],
    ],
    settings: [
      ['profile', 'user', 'Profile'],
    ],
  },
}

const ROLE_COLOR = {
  admin:           'var(--cy)',
  manager:         'var(--pu)',
  warehouse_staff: 'var(--gn)',
}
const ROLE_LABEL = {
  admin:           'Administrator',
  manager:         'Manager',
  warehouse_staff: 'Warehouse Staff',
}

export default function Sidebar({ page, setPage, theme, setTheme, user, onLogout, col, setCol, mobOpen, setMobOpen, userRole }) {
  const [opsOpen,  setOpsOpen]  = useState(true)
  const [settOpen, setSettOpen] = useState(false)

  const go   = id => { setPage(id); setMobOpen(false) }
  const cls  = 'sidebar' + (col?' col':'') + (mobOpen?' mob-open':'')
  const nav  = ROLE_NAV[userRole] || ROLE_NAV.warehouse_staff
  const rc   = ROLE_COLOR[userRole] || 'var(--cy)'

  return (
    <div className={cls}>
      {/* Logo */}
      <div className="logo" onClick={() => setCol(!col)}>
        <div className="lm-box"><Ico n="archive" size={17} color="white"/></div>
        {!col && (
          <div>
            <div className="lt">CoreInventory</div>
            <div className="ls">STOCK OPS</div>
          </div>
        )}
      </div>

      {/* Role indicator */}
      {!col && userRole && (
        <div style={{ margin:'0 10px 8px', padding:'6px 10px', background:rc+'12', border:'1px solid ' + rc + '28', borderRadius:7, display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:rc, flexShrink:0 }}/>
          <span style={{ fontSize:10.5, fontWeight:700, color:rc, letterSpacing:'.04em' }}>{ROLE_LABEL[userRole]}</span>
        </div>
      )}

      <div className="cgl" style={{ margin:'0 10px 6px' }}/>

      <div style={{ flex:1, overflowY:'auto', padding:'2px 0' }}>
        {/* Top nav items */}
        {nav.top.map(item => (
          <NavItem key={item.id} id={item.id} icon={item.icon} label={item.label} active={page===item.id}
            col={col} onClick={() => go(item.id)} badge={item.badge} badgeColor={rc}/>
        ))}

        {/* Operations group */}
        {nav.ops.length > 0 && <>
          {!col && (
            <div className="ni" onClick={() => setOpsOpen(!opsOpen)}>
              <Ico n="activity" size={15}/>
              <span className="ni-lbl">Operations</span>
              <span style={{ marginLeft:'auto', transition:'.2s', transform:opsOpen?'rotate(90deg)':'none', display:'inline-block' }}>
                <Ico n="chevron" size={12}/>
              </span>
            </div>
          )}
          {(opsOpen || col) && nav.ops.map(([id, ic, lbl]) => (
            <NavItem key={id} id={id} icon={ic} label={lbl} active={page===id} col={col}
              onClick={() => go(id)} indent={!col}/>
          ))}
        </>}

        {/* Settings group */}
        {nav.settings.length > 0 && <>
          {!col && (
            <div className="ni" style={{ marginTop:4 }} onClick={() => setSettOpen(!settOpen)}>
              <Ico n="settings" size={15}/>
              <span className="ni-lbl">Settings</span>
              <span style={{ marginLeft:'auto', transition:'.2s', transform:settOpen?'rotate(90deg)':'none', display:'inline-block' }}>
                <Ico n="chevron" size={12}/>
              </span>
            </div>
          )}
          {(settOpen || col) && nav.settings.map(([id, ic, lbl]) => (
            <NavItem key={id} id={id} icon={ic} label={lbl} active={page===id} col={col}
              onClick={() => go(id)} indent={!col}/>
          ))}
        </>}
      </div>

      {/* Footer */}
      <div className="sfbar">
        {!col && (
          <div className="fc g2" style={{ marginBottom:8 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,' + rc + ',#0891b2)', display:'grid', placeItems:'center', fontWeight:700, fontSize:12, color:'white', flexShrink:0 }}>
              {user?.av||'U'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:600, color:'var(--t0)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize:10, color:rc, fontWeight:600 }}>{ROLE_LABEL[userRole] || user?.role}</div>
            </div>
          </div>
        )}
        <div className="fc g2" style={{ justifyContent:col?'center':'flex-start' }}>
          <button className="btn bs bnr" onClick={() => setTheme(t => t==='dark'?'light':'dark')} title="Toggle theme">
            <Ico n={theme==='dark'?'sun':'moon'} size={14}/>
          </button>
          <button className="btn br bnr" onClick={onLogout} title="Logout">
            <Ico n="logout" size={14}/>
          </button>
        </div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, active, col, onClick, indent, badge, badgeColor }) {
  return (
    <div className={'ni' + (active?' act':'')} style={indent?{paddingLeft:22}:{}} onClick={onClick}>
      <Ico n={icon} size={indent?13:15}/>
      {!col && <span className="ni-lbl">{label}</span>}
      {!col && badge && (
        <span style={{ marginLeft:'auto', fontSize:8.5, fontWeight:700, letterSpacing:'.05em', color:badgeColor, background:badgeColor+'18', padding:'1px 5px', borderRadius:5, border:'1px solid '+badgeColor+'30' }}>
          {badge}
        </span>
      )}
    </div>
  )
}
