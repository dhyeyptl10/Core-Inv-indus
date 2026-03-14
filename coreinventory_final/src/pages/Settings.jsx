import React, { useState } from 'react'
import { Ico, Modal, toast } from '../components/UI.jsx'
import { toDay, fNum, fDate, prodName, whName } from '../store/index.js'
import { adjustmentsAPI, warehousesAPI, authAPI } from '../api.js'

// ── Adjustments ───────────────────────────────────────────────────────────────
export function Adjustments({ s, d, refresh }) {
  const { adjustments, products, warehouses } = s
  const [modal, setModal] = useState(false)
  const [busy,  setBusy]  = useState(false)
  const [f, setF] = useState({ productId:products[0]?.id||'', warehouse:warehouses[0]?.id||'wh1', newQty:0, reason:'' })
  const fh = e => setF(x => ({ ...x, [e.target.name]: e.target.value }))

  const selP   = products.find(p => p.id===f.productId)
  const oldQty = (selP?.stock||{})[f.warehouse] || 0

  const openAdd = () => { setF({ productId:products[0]?.id||'', warehouse:warehouses[0]?.id||'wh1', newQty:0, reason:'' }); setModal(true) }

  const save = async () => {
    if (!f.reason) return toast('Reason required','e')
    setBusy(true)
    try {
      await adjustmentsAPI.create({ productId:f.productId, warehouseId:f.warehouse, newQty:Number(f.newQty), reason:f.reason })
      toast('Adjustment saved — stock updated! ✅')
      setModal(false); await refresh()
    } catch(err) { toast(err.message,'e') } finally { setBusy(false) }
  }

  return (
    <div className="au">
      <div className="phd">
        <div><div className="pt">Stock Adjustments</div><div className="ps">{adjustments.length} adjustments recorded</div></div>
        <button className="btn bp" onClick={openAdd}><Ico n="plus" size={14}/>New Adjustment</button>
      </div>
      <div className="card au d1">
        <table className="tbl">
          <thead><tr><th>Ref</th><th>Product</th><th>Warehouse</th><th>Old Qty</th><th>New Qty</th><th>Diff</th><th>Reason</th><th>Date</th></tr></thead>
          <tbody>
            {adjustments.map(a => {
              const diff = Number(a.newQty) - Number(a.oldQty)
              return (
                <tr key={a.id}>
                  <td className="mono tc">{a.ref}</td>
                  <td style={{color:'var(--t0)',fontWeight:600}}>{prodName(products,a.productId)}</td>
                  <td style={{color:'var(--t2)'}}>{whName(warehouses,a.warehouse)}</td>
                  <td className="mono tm">{fNum(a.oldQty)}</td>
                  <td className="mono" style={{fontWeight:700,color:'var(--t0)'}}>{fNum(a.newQty)}</td>
                  <td className="mono" style={{color:diff>0?'var(--gn)':diff<0?'var(--rd)':'var(--t2)',fontWeight:700}}>{diff>0?'+':''}{fNum(diff)}</td>
                  <td style={{color:'var(--t2)',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.reason}</td>
                  <td className="mono tm">{fDate(a.date)}</td>
                </tr>
              )
            })}
            {adjustments.length===0 && (
              <tr><td colSpan={8}><div className="empty"><Ico n="refresh" size={28} color="var(--b1)"/><span>No adjustments yet</span></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Stock Adjustment" onClose={()=>setModal(false)}
          footer={<><button className="btn bs" onClick={()=>setModal(false)}>Cancel</button><button className="btn bp" onClick={save} disabled={busy}><Ico n="check" size={13}/>{busy?'Saving…':'Apply Adjustment'}</button></>}>
          <div className="fg">
            <label className="lbl">Product</label>
            <select className="inp" name="productId" value={f.productId} onChange={fh}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="lbl">Warehouse</label>
            <select className="inp" name="warehouse" value={f.warehouse} onChange={fh}>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          {selP && (
            <div className="card cp" style={{marginBottom:14,background:'var(--bg0)'}}>
              <div className="fcb">
                <span style={{fontSize:12,color:'var(--t2)'}}>Current stock at {whName(warehouses,f.warehouse)}</span>
                <span className="mono" style={{fontSize:18,fontWeight:800,color:'var(--t0)'}}>{fNum(oldQty)} <span style={{fontSize:12,color:'var(--t2)'}}>{selP.unit}</span></span>
              </div>
            </div>
          )}
          <div className="fg">
            <label className="lbl">Actual Counted Quantity</label>
            <input className="inp" type="number" name="newQty" value={f.newQty} onChange={fh} min={0}/>
            {f.newQty !== '' && (
              <div style={{fontSize:11.5,marginTop:5,color:Number(f.newQty)>oldQty?'var(--gn)':Number(f.newQty)<oldQty?'var(--rd)':'var(--t2)'}}>
                Difference: {Number(f.newQty)>oldQty?'+':''}{Number(f.newQty)-oldQty} units
              </div>
            )}
          </div>
          <div className="fg">
            <label className="lbl">Reason *</label>
            <input className="inp" name="reason" value={f.reason} onChange={fh} placeholder="e.g. Physical count, damage, theft..."/>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Move History ──────────────────────────────────────────────────────────────
export function History({ s }) {
  const { movements, products, warehouses } = s
  const [type, setType] = useState('')
  const [q,    setQ]    = useState('')

  const filtered = movements.filter(m =>
    (!type || m.type===type) &&
    (!q || prodName(products,m.productId).toLowerCase().includes(q.toLowerCase()) || m.ref?.toLowerCase().includes(q.toLowerCase()))
  )

  const TYPE_CLR = { receipt:'var(--gn)', delivery:'var(--rd)', transfer:'var(--cy)', adjustment:'var(--am)' }
  const TYPE_SYM = { receipt:'↑', delivery:'↓', transfer:'⇄', adjustment:'≠' }

  return (
    <div className="au">
      <div className="phd">
        <div><div className="pt">Move History</div><div className="ps">{movements.length} stock movements recorded</div></div>
      </div>
      <div className="fc g3" style={{marginBottom:14,flexWrap:'wrap'}}>
        <div className="sr"><Ico n="search" size={13} color="var(--t2)"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Product or ref..."/></div>
        <select className="inp" value={type} onChange={e=>setType(e.target.value)} style={{width:'auto',minWidth:130}}>
          <option value="">All Types</option>
          {['receipt','delivery','transfer','adjustment'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
        <span style={{fontSize:11.5,color:'var(--t2)',marginLeft:'auto'}}>{filtered.length} entries</span>
      </div>
      <div className="card au d1">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Qty</th><th>From</th><th>To</th><th>Ref</th></tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td className="mono tm">{fDate(m.date)}</td>
                <td><span style={{color:TYPE_CLR[m.type]||'var(--t1)',fontWeight:700,fontSize:12}}>{TYPE_SYM[m.type]} {m.type}</span></td>
                <td style={{color:'var(--t0)',fontWeight:600}}>{prodName(products,m.productId)}</td>
                <td className="mono" style={{color:m.qty>0?'var(--gn)':m.qty<0?'var(--rd)':'var(--t1)',fontWeight:700}}>{m.qty>0?'+':''}{fNum(m.qty)}</td>
                <td style={{color:'var(--t2)'}}>{m.from==='-'?'—':whName(warehouses,m.from)}</td>
                <td style={{color:'var(--t2)'}}>{m.to==='-'?'—':whName(warehouses,m.to)}</td>
                <td className="mono tc">{m.ref||'—'}</td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={7}><div className="empty"><Ico n="list" size={28} color="var(--b1)"/><span>No movements found</span></div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Warehouses ────────────────────────────────────────────────────────────────
export function Warehouses({ s, d, refresh }) {
  const { warehouses, products } = s
  const [modal, setModal] = useState(null)
  const [busy,  setBusy]  = useState(false)
  const [f, setF] = useState({ name:'', location:'' })
  const fh = e => setF(x => ({ ...x, [e.target.name]: e.target.value }))

  const save = async () => {
    if (!f.name) return toast('Name required','e')
    setBusy(true)
    try {
      if (modal==='add') { await warehousesAPI.create({ name:f.name, location:f.location }); toast('Warehouse added') }
      else               { await warehousesAPI.update(modal.edit.id, { name:f.name, location:f.location }); toast('Updated') }
      setModal(null); await refresh()
    } catch(err) { toast(err.message,'e') } finally { setBusy(false) }
  }
  const del = async id => {
    if (!confirm('Delete warehouse?')) return
    try { await warehousesAPI.delete(id); toast('Deleted'); await refresh() }
    catch(err) { toast(err.message,'e') }
  }

  const whStock = wid => products.reduce((a,p) => a+(p.stock[wid]||0), 0)

  return (
    <div className="au">
      <div className="phd">
        <div><div className="pt">Warehouses</div><div className="ps">{warehouses.length} locations configured</div></div>
        <button className="btn bp" onClick={()=>{setF({name:'',location:''});setModal('add')}}><Ico n="plus" size={14}/>Add Warehouse</button>
      </div>
      <div className="grid3 au d1">
        {warehouses.map(w => {
          const tot   = whStock(w.id)
          const prods = products.filter(p => (p.stock[w.id]||0)>0).length
          return (
            <div key={w.id} className="card cp cglow">
              <div className="fcb" style={{marginBottom:10}}>
                <div style={{width:36,height:36,borderRadius:9,background:'var(--cyd)',display:'grid',placeItems:'center'}}><Ico n="warehouse" size={18} color="var(--cy)"/></div>
                <div className="fc g2">
                  <button className="btn bs bnr bsm" onClick={()=>{setF({name:w.name,location:w.location});setModal({edit:w})}}><Ico n="edit" size={12}/></button>
                  {warehouses.length>1 && <button className="btn br bnr bsm" onClick={()=>del(w.id)}><Ico n="trash" size={12}/></button>}
                </div>
              </div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:15,color:'var(--t0)',marginBottom:2}}>{w.name}</div>
              <div className="fc g2" style={{marginBottom:12}}><Ico n="tag" size={11} color="var(--t2)"/><span style={{fontSize:11.5,color:'var(--t2)'}}>{w.location||'No location'}</span></div>
              <div className="cgl" style={{marginBottom:10}}/>
              <div className="fcb">
                <div><div className="mono" style={{fontSize:17,fontWeight:700,color:'var(--t0)'}}>{fNum(tot)}</div><div style={{fontSize:10.5,color:'var(--t2)'}}>Total Units</div></div>
                <div style={{textAlign:'right'}}><div className="mono" style={{fontSize:17,fontWeight:700,color:'var(--t0)'}}>{prods}</div><div style={{fontSize:10.5,color:'var(--t2)'}}>Active SKUs</div></div>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal==='add'?'Add Warehouse':'Edit Warehouse'} onClose={()=>setModal(null)}
          footer={<><button className="btn bs" onClick={()=>setModal(null)}>Cancel</button><button className="btn bp" onClick={save} disabled={busy}><Ico n="check" size={13}/>{busy?'Saving…':modal==='add'?'Add':'Save'}</button></>}>
          <div className="fg"><label className="lbl">Warehouse Name *</label><input className="inp" name="name" value={f.name} onChange={fh} placeholder="e.g. Main Warehouse"/></div>
          <div className="fg"><label className="lbl">Location / City</label><input className="inp" name="location" value={f.location} onChange={fh} placeholder="e.g. Mumbai"/></div>
        </Modal>
      )}
    </div>
  )
}

// ── Profile ───────────────────────────────────────────────────────────────────
export function Profile({ user, setUser }) {
  const [f, setF] = useState({ name:user?.name||'', email:user?.email||'', role:user?.role||'', current:'', newPass:'', confirmPass:'' })
  const fh = e => setF(x => ({ ...x, [e.target.name]: e.target.value }))

  const saveProfile = async () => {
    try {
      const res = await authAPI.updateProfile({ name:f.name })
      setUser(u => ({ ...u, name:res.user.name, av:res.user.avatar||res.user.name.slice(0,2).toUpperCase() }))
      toast('Profile updated!')
    } catch(err) { toast(err.message,'e') }
  }
  const savePass = async () => {
    if (!f.current)                  return toast('Enter current password','e')
    if (f.newPass !== f.confirmPass) return toast('Passwords do not match','e')
    if (f.newPass.length < 6)        return toast('Min 6 characters','e')
    try {
      await authAPI.changePassword(f.current, f.newPass)
      toast('Password changed!')
      setF(x => ({ ...x, current:'', newPass:'', confirmPass:'' }))
    } catch(err) { toast(err.message,'e') }
  }

  return (
    <div className="au">
      <div className="phd"><div><div className="pt">My Profile</div><div className="ps">Manage your account settings</div></div></div>
      <div className="grid2" style={{alignItems:'start'}}>
        <div>
          <div className="card cp au d1" style={{marginBottom:14}}>
            <div className="fc g3" style={{marginBottom:18}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,var(--cy),#0891b2)',display:'grid',placeItems:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'white',flexShrink:0,boxShadow:'0 0 20px rgba(34,211,238,.3)'}}>
                {user?.av||'U'}
              </div>
              <div>
                <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'var(--t0)'}}>{user?.name}</div>
                <div style={{fontSize:12,color:'var(--cy)'}}>{user?.role}</div>
                <div style={{fontSize:11.5,color:'var(--t2)'}}>{user?.email}</div>
              </div>
            </div>
            <div className="cgl" style={{marginBottom:14}}/>
            <div className="fg"><label className="lbl">Full Name</label><input className="inp" name="name" value={f.name} onChange={fh}/></div>
            <div className="fg"><label className="lbl">Email</label><input className="inp" name="email" type="email" value={f.email} onChange={fh}/></div>
            <div className="fg">
              <label className="lbl">Role</label>
              <select className="inp" name="role" value={f.role} onChange={fh} disabled style={{opacity:.5,cursor:"not-allowed"}}>
                <option>Inventory Manager</option><option>Warehouse Staff</option><option>Admin</option>
              </select>
            </div>
            <button className="btn bp" onClick={saveProfile} style={{width:'100%',justifyContent:'center'}}><Ico n="check" size={13}/>Save Profile</button>
          </div>
        </div>
        <div>
          <div className="card cp au d2">
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'var(--t0)',marginBottom:14}}>Change Password</div>
            <div className="fg"><label className="lbl">Current Password</label><input className="inp" name="current" type="password" value={f.current} onChange={fh} placeholder="Enter current"/></div>
            <div className="fg"><label className="lbl">New Password</label><input className="inp" name="newPass" type="password" value={f.newPass} onChange={fh} placeholder="New password"/></div>
            <div className="fg"><label className="lbl">Confirm Password</label><input className="inp" name="confirmPass" type="password" value={f.confirmPass} onChange={fh} placeholder="Confirm new password"/></div>
            <button className="btn bp" onClick={savePass} style={{width:'100%',justifyContent:'center'}}><Ico n="check" size={13}/>Update Password</button>
          </div>
          <div className="card cp au d3" style={{marginTop:14}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'var(--t0)',marginBottom:12}}>System Info</div>
            {[
              ['Version',    '2.0.0 · Hackathon Edition'],
              ['Backend',    'Express.js + JWT + OTP'],
              ['Stack',      'React + Vite + Node.js + SQLite'],
              ['Database',   'SQLite (better-sqlite3)'],
              ['License',    'MIT · CoreInventory'],
            ].map(([k,v]) => (
              <div key={k} className="fcb" style={{marginBottom:8}}>
                <span style={{fontSize:12,color:'var(--t2)'}}>{k}</span>
                <span className="mono" style={{fontSize:11.5,color:'var(--t1)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
