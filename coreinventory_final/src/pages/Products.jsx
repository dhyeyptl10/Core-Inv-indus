import React, { useState } from 'react'
import { Ico, Bdg, Modal, toast } from '../components/UI.jsx'
import { CATS, UNITS, toDay, totalStock, stockStatus, fNum, fDate } from '../store/index.js'
import { productsAPI } from '../api.js'

export default function Products({ s, d, refresh }) {
  const { products, warehouses } = s
  const [q,   setQ]   = useState('')
  const [cat, setCat] = useState('')
  const [modal, setModal] = useState(null)
  const [busy,  setBusy]  = useState(false)
  const [f, setF] = useState({ name:'', sku:'', category:'Raw Materials', unit:'pieces', reorderLevel:10, description:'' })
  const fh = e => setF(x => ({ ...x, [e.target.name]: e.target.value }))

  const filtered = products.filter(p =>
    (!q   || (p.name+p.sku).toLowerCase().includes(q.toLowerCase())) &&
    (!cat || p.category===cat)
  )

  const openAdd  = () => { setF({ name:'', sku:'', category:'Raw Materials', unit:'pieces', reorderLevel:10, description:'' }); setModal('add') }
  const openEdit = p  => { setF({ name:p.name, sku:p.sku, category:p.category, unit:p.unit, reorderLevel:p.reorderLevel, description:p.description||'' }); setModal({ edit:p }) }

  const save = async () => {
    if (!f.name || !f.sku) return toast('Name and SKU required','e')
    setBusy(true)
    try {
      const payload = { name:f.name, sku:f.sku, category:f.category, unit:f.unit, reorderLevel:Number(f.reorderLevel), description:f.description }
      if (modal==='add') { await productsAPI.create(payload); toast('Product added!') }
      else               { await productsAPI.update(modal.edit.id, payload); toast('Product updated!') }
      setModal(null); await refresh()
    } catch(err) { toast(err.message,'e') } finally { setBusy(false) }
  }

  const del = async id => {
    if (!confirm('Delete this product?')) return
    try { await productsAPI.delete(id); toast('Deleted'); await refresh() }
    catch(err) { toast(err.message,'e') }
  }

  return (
    <div className="au">
      <div className="phd">
        <div><div className="pt">Products</div><div className="ps">{products.length} SKUs · {warehouses.length} warehouses</div></div>
        <button className="btn bp" onClick={openAdd}><Ico n="plus" size={14}/>New Product</button>
      </div>

      <div className="fc g3" style={{marginBottom:14,flexWrap:'wrap'}}>
        <div className="sr"><Ico n="search" size={13} color="var(--t2)"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Name or SKU..."/></div>
        <select className="inp" value={cat} onChange={e=>setCat(e.target.value)} style={{width:'auto',minWidth:140}}>
          <option value="">All Categories</option>
          {CATS.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{fontSize:11.5,color:'var(--t2)',marginLeft:'auto'}}>{filtered.length} result{filtered.length!==1?'s':''}</span>
      </div>

      <div className="card au d1">
        <table className="tbl">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>Unit</th><th>Total Stock</th><th>Status</th><th>Reorder At</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const tot = totalStock(p); const st = stockStatus(p)
              return (
                <tr key={p.id}>
                  <td style={{color:'var(--t0)',fontWeight:600}}>{p.name}</td>
                  <td className="mono tc">{p.sku}</td>
                  <td><span style={{fontSize:11,background:'var(--bg0)',padding:'2px 8px',borderRadius:5,color:'var(--t2)'}}>{p.category}</span></td>
                  <td style={{color:'var(--t2)'}}>{p.unit}</td>
                  <td className="mono" style={{fontWeight:700,color:'var(--t0)'}}>{fNum(tot)}</td>
                  <td><Bdg s={st}/></td>
                  <td className="mono tm">{fNum(p.reorderLevel)}</td>
                  <td className="mono tm">{fDate(p.createdAt)}</td>
                  <td>
                    <div className="fc g2">
                      <button className="btn bs bnr bsm" onClick={()=>openEdit(p)}><Ico n="edit" size={12}/></button>
                      <button className="btn br bnr bsm" onClick={()=>del(p.id)}><Ico n="trash" size={12}/></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length===0 && (
              <tr><td colSpan={9}><div className="empty"><Ico n="box" size={28} color="var(--b1)"/><span>No products found</span></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal==='add'?'New Product':'Edit Product'} onClose={()=>setModal(null)}
          footer={<>
            <button className="btn bs" onClick={()=>setModal(null)}>Cancel</button>
            <button className="btn bp" onClick={save} disabled={busy}><Ico n="check" size={13}/>{busy?'Saving…':modal==='add'?'Add Product':'Save'}</button>
          </>}>
          <div className="grid2">
            <div className="fg"><label className="lbl">Product Name *</label><input className="inp" name="name" value={f.name} onChange={fh} placeholder="e.g. Steel Rod"/></div>
            <div className="fg"><label className="lbl">SKU / Code *</label><input className="inp" name="sku" value={f.sku} onChange={fh} placeholder="e.g. STL-001"/></div>
          </div>
          <div className="grid2">
            <div className="fg"><label className="lbl">Category</label><select className="inp" name="category" value={f.category} onChange={fh}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="fg"><label className="lbl">Unit of Measure</label><select className="inp" name="unit" value={f.unit} onChange={fh}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></div>
          </div>
          <div className="grid2">
            <div className="fg"><label className="lbl">Reorder Level</label><input className="inp" type="number" name="reorderLevel" value={f.reorderLevel} onChange={fh} min={0}/></div>
            <div className="fg"><label className="lbl">Description</label><input className="inp" name="description" value={f.description} onChange={fh} placeholder="Optional"/></div>
          </div>
          {modal!=='add' && modal.edit && (
            <div className="card cp" style={{marginTop:4,background:'var(--bg0)'}}>
              <div style={{fontSize:10.5,fontWeight:700,color:'var(--t2)',marginBottom:10,letterSpacing:'.07em'}}>STOCK PER WAREHOUSE</div>
              {warehouses.map(w => (
                <div key={w.id} className="fcb" style={{marginBottom:7}}>
                  <span style={{fontSize:12.5,color:'var(--t1)'}}>{w.name}</span>
                  <span className="mono" style={{fontWeight:700,color:'var(--t0)'}}>{fNum(modal.edit.stock[w.id]||0)} {modal.edit.unit}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
