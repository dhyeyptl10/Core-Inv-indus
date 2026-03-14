import React, { useState, useReducer, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar.jsx'
import { ToastBox, Ico, toast } from './components/UI.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ManagerDashboard from './pages/ManagerDashboard.jsx'
import StaffDashboard from './pages/StaffDashboard.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import Products from './pages/Products.jsx'
import { Receipts, Deliveries, Transfers } from './pages/Operations.jsx'
import { Adjustments, History, Warehouses, Profile } from './pages/Settings.jsx'
import { reducer, INIT, stockStatus } from './store/index.js'
import { authAPI, getToken, setToken, clearToken, productsAPI, warehousesAPI, receiptsAPI, deliveriesAPI, transfersAPI, adjustmentsAPI, movementsAPI } from './api.js'

const mapProduct    = p => ({ id:p.id, name:p.name, sku:p.sku, category:p.category, unit:p.unit, reorderLevel:p.reorder_level||p.reorderLevel||0, stock:p.stock||{}, createdAt:p.created_at||p.createdAt })
const mapWarehouse  = w => ({ id:w.id, name:w.name, location:w.location, description:w.description })
const mapReceipt    = r => ({ id:r.id, ref:r.ref, supplier:r.supplier, warehouse:r.warehouse_id||r.warehouse, status:r.status, date:r.date, notes:r.notes, items:(r.items||[]).map(i=>({ productId:i.product_id||i.productId, qty:i.qty })) })
const mapDelivery   = d => ({ id:d.id, ref:d.ref, customer:d.customer, warehouse:d.warehouse_id||d.warehouse, status:d.status, date:d.date, notes:d.notes, items:(d.items||[]).map(i=>({ productId:i.product_id||i.productId, qty:i.qty })) })
const mapTransfer   = t => ({ id:t.id, ref:t.ref, from:t.from_warehouse||t.from, to:t.to_warehouse||t.to, status:t.status, date:t.date, notes:t.notes, items:(t.items||[]).map(i=>({ productId:i.product_id||i.productId, qty:i.qty })) })
const mapAdjustment = a => ({ id:a.id, ref:a.ref, productId:a.product_id||a.productId, warehouse:a.warehouse_id||a.warehouse, oldQty:a.old_qty??a.oldQty, newQty:a.new_qty??a.newQty, reason:a.reason, date:a.date, status:a.status })
const mapMovement   = m => ({ id:m.id, date:m.date, type:m.type, productId:m.product_id||m.productId, qty:m.qty, from:m.from_warehouse||m.from, to:m.to_warehouse||m.to, ref:m.ref })

// Role-based page access
const ROLE_PAGES = {
  admin:           ['dashboard','adminPanel','products','receipts','deliveries','transfers','adjustments','history','warehouses','profile'],
  manager:         ['dashboard','managerDash','products','receipts','deliveries','transfers','adjustments','history','warehouses','profile'],
  warehouse_staff: ['dashboard','staffDash','products','receipts','deliveries','transfers','adjustments','history','profile'],
}

export default function App() {
  const [user,    setUser]    = useState(null)
  const [theme,   setTheme]   = useState('dark')
  const [page,    setPage]    = useState('dashboard')
  const [col,     setCol]     = useState(false)
  const [mobOpen, setMobOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [s, d] = useReducer(reducer, INIT)

  const loadAll = useCallback(async () => {
    try {
      const [prods, whs, rcpts, dlvs, trfs, adjs, movs] = await Promise.all([
        productsAPI.list(), warehousesAPI.list(), receiptsAPI.list(),
        deliveriesAPI.list(), transfersAPI.list(), adjustmentsAPI.list(),
        movementsAPI.list({ limit: 200 }),
      ])
      d({ type:'HYDRATE', payload: {
        products:    (prods.data||[]).map(mapProduct),
        warehouses:  (whs.data||[]).map(mapWarehouse),
        receipts:    (rcpts.data||[]).map(mapReceipt),
        deliveries:  (dlvs.data||[]).map(mapDelivery),
        transfers:   (trfs.data||[]).map(mapTransfer),
        adjustments: (adjs.data||[]).map(mapAdjustment),
        movements:   (movs.data||[]).map(mapMovement),
      }})
    } catch(err) { console.warn('API load failed:', err.message) }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      if (!token) { setLoading(false); return }
      try {
        const { user:u } = await authAPI.me()
        const userObj = { id:u.id, name:u.name, email:u.email, role:u.role, av:u.avatar }
        setUser(userObj)
        setPage(getDefaultPage(userObj.role))
        await loadAll()
      } catch { clearToken() } finally { setLoading(false) }
    }
    checkAuth()
  }, [loadAll])

  const getDefaultPage = (role) => {
    if (role === 'admin') return 'dashboard'
    if (role === 'manager') return 'dashboard'
    return 'dashboard'
  }

  const logout = () => {
    clearToken()
    setUser(null)
    setPage('dashboard')
    d({ type:'HYDRATE', payload:INIT })
    toast('Logged out successfully')
  }
  const refresh = useCallback(() => loadAll(), [loadAll])

  const canAccess = (pg) => {
    if (!user) return false
    const allowed = ROLE_PAGES[user.role] || ROLE_PAGES.warehouse_staff
    return allowed.includes(pg)
  }

  const PAGES = (role) => {
    const isAdmin   = role === 'admin'
    const isManager = role === 'manager'
    const isStaff   = role === 'warehouse_staff'
    return {
      dashboard:   isAdmin   ? <Dashboard       s={s} refresh={refresh} /> :
                   isManager ? <ManagerDashboard s={s} refresh={refresh} /> :
                               <StaffDashboard   s={s} refresh={refresh} setPage={setPage} />,
      adminPanel:  isAdmin   ? <AdminPanel currentUserId={user?.id} /> : null,
      managerDash: isManager ? <ManagerDashboard s={s} refresh={refresh} /> : null,
      staffDash:   isStaff   ? <StaffDashboard  s={s} refresh={refresh} setPage={setPage} /> : null,
      products:    <Products    s={s} d={d} refresh={refresh} />,
      receipts:    <Receipts    s={s} d={d} refresh={refresh} />,
      deliveries:  <Deliveries  s={s} d={d} refresh={refresh} />,
      transfers:   <Transfers   s={s} d={d} refresh={refresh} />,
      adjustments: <Adjustments s={s} d={d} refresh={refresh} />,
      history:     <History     s={s} refresh={refresh} />,
      warehouses:  isStaff ? null : <Warehouses s={s} d={d} refresh={refresh} />,
      profile:     <Profile     user={user} setUser={setUser} />,
    }
  }

  const outOfStock = s.products.filter(p => stockStatus(p) === 'out').length

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'var(--bg0)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, background:'linear-gradient(135deg,var(--cy),#0891b2)', borderRadius:12, display:'grid', placeItems:'center', margin:'0 auto 16px', animation:'glow 2s infinite' }}>
          <Ico n="archive" size={22} color="white"/>
        </div>
        <div className="mono" style={{ fontSize:11, color:'var(--t2)', letterSpacing:'.1em' }}>LOADING COREINVENTORY...</div>
      </div>
    </div>
  )

  if (!user) return (
    <div className={theme==='light'?'lm':''} style={{ minHeight:'100vh' }}>
      <ToastBox/>
      <Auth onLogin={async (u, token) => {
        if(token) setToken(token)
        setUser(u)
        toast('Welcome, ' + u.name + '! Redirecting to your dashboard...')
        await loadAll()
      }}/>
    </div>
  )

  const pages = PAGES(user.role)
  const currentPage = pages[page] || pages['dashboard']

  // Role display config
  const ROLE_DISPLAY = {
    admin:           { label:'Administrator', color:'var(--cy)',  icon:'shield'   },
    manager:         { label:'Manager',       color:'var(--pu)',  icon:'activity' },
    warehouse_staff: { label:'Staff',         color:'var(--gn)',  icon:'box'      },
  }
  const roleConfig = ROLE_DISPLAY[user.role] || ROLE_DISPLAY.warehouse_staff

  return (
    <div className={theme==='light'?'lm':''}>
      <ToastBox/>
      <div className="shell">
        <Sidebar
          page={page} setPage={setPage}
          theme={theme} setTheme={setTheme}
          user={user} onLogout={logout}
          col={col} setCol={setCol}
          mobOpen={mobOpen} setMobOpen={setMobOpen}
          userRole={user.role}
        />
        <div className={'content' + (col?' col':'')}>
          {/* Topbar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, padding:'9px 14px', background:'var(--bg1)', border:'1px solid var(--b0)', borderRadius:9 }}>
            <div className="fc g2">
              <button className="btn bs bnr" onClick={() => setMobOpen(!mobOpen)} style={{ display:'none' }}><Ico n="menu" size={15}/></button>
              <div className="mono" style={{ fontSize:10.5, color:'var(--t2)' }}>CORE<span style={{ color:'var(--cy)' }}>INVENTORY</span></div>
              <span style={{ color:'var(--b1)' }}>·</span>
              <span style={{ fontSize:11.5, color:'var(--t2)', textTransform:'capitalize' }}>
                {page === 'adminPanel' ? 'Admin Panel' : page === 'managerDash' ? 'Manager Dashboard' : page}
              </span>
            </div>
            <div className="fc g3">
              {outOfStock > 0 && (
                <div className="fc g2" style={{ fontSize:11.5, color:'var(--rd)', background:'var(--rdd)', padding:'4px 9px', borderRadius:6, border:'1px solid rgba(244,63,94,.2)' }}>
                  <Ico n="alert" size={12} color="var(--rd)"/>{outOfStock} out of stock
                </div>
              )}
              {/* Role badge */}
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10.5, fontWeight:700, color:roleConfig.color, background:`${roleConfig.color}12`, padding:'3px 10px', borderRadius:8, border:`1px solid ${roleConfig.color}25` }}>
                <Ico n={roleConfig.icon} size={11} color={roleConfig.color}/>
                {roleConfig.label}
              </div>
              <div className="fc g2" style={{ fontSize:11.5, color:'var(--t2)' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,var(--cy),#0891b2)', display:'grid', placeItems:'center', fontWeight:700, fontSize:10, color:'white', flexShrink:0 }}>{user.av||'U'}</div>
                <span style={{ color:'var(--t1)', fontWeight:600 }}>{user.name}</span>
              </div>
            </div>
          </div>
          <div key={page}>{currentPage}</div>
        </div>
      </div>
    </div>
  )
}
