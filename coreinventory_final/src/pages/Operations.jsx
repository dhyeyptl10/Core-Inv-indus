import React, { useState } from 'react'
import { Ico, Bdg, Modal, toast, ItemEditor } from '../components/UI.jsx'
import { SUPPLIERS, CUSTOMERS, STATUSES, toDay, fNum, fDate, prodName, whName } from '../store/index.js'
import { receiptsAPI, deliveriesAPI, transfersAPI } from '../api.js'

// ── Shared list wrapper ───────────────────────────────────────────────────────
function OpsTable({ icon, items, renderRow, tHead }) {
  const [q, setQ] = useState('')
  const [sf, setSf] = useState('')
  const filtered = items.filter(x =>
    (!q  || (x.ref+' '+(x.supplier||x.customer||'')).toLowerCase().includes(q.toLowerCase())) &&
    (!sf || x.status===sf)
  )
  return (
    <>
      <div className="fc g3" style={{marginBottom:14,flexWrap:'wrap'}}>
        <div className="sr"><Ico n="search" size={13} color="var(--t2)"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ref or party..."/></div>
        <select className="inp" value={sf} onChange={e=>setSf(e.target.value)} style={{width:'auto',minWidth:130}}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <span style={{fontSize:11.5,color:'var(--t2)',marginLeft:'auto'}}>{filtered.length} record{filtered.length!==1?'s':''}</span>
      </div>
      <div className="card au d1">
        <table className="tbl">
          <thead><tr>{tHead.map(h=><th key={h}>{h}</th>)}<th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(item => renderRow(item))}
            {filtered.length===0 && (
              <tr><td colSpan={tHead.length+1}><div className="empty"><Ico n={icon} size={28} color="var(--b1)"/><span>No records found</span></div></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

// ── Receipts ──────────────────────────────────────────────────────────────────
export function Receipts({ s, d, refresh }) {
  const { receipts, products, warehouses } = s
  const [modal, setModal] = useState(null)
  const [busy,  setBusy]  = useState(false)
  const blank = () => ({ supplier:SUPPLIERS[0], date:toDay(), notes:'', warehouse:warehouses[0]?.id||'wh1', items:[{productId:products[0]?.id||'',qty:1}] })
  const [f, setF] = useState(blank)
  const fh = e => setF(x => ({ ...x, [e.target.name]: e.target.value }))

  const openAdd  = () => { setF(blank()); setModal('add') }
  const openEdit = r  => { setF({ ...r, items: r.items.map(i=>({...i})) }); setModal({ edit:r }) }

  const save = async () => {
    if (!f.items.length) return toast('Add at least one item','e')
    setBusy(true)
    try {
      const payload = { supplier:f.supplier, warehouseId:f.warehouse, date:f.date, notes:f.notes, status:'draft',
        items: f.items.map(i => ({ productId:i.productId, qty:Number(i.qty) })) }
      if (modal==='add') {
        await receiptsAPI.create(payload)
        toast('Receipt created')
      } else {
        await receiptsAPI.update(modal.edit.id, payload)
        toast('Updated')
      }
      setModal(null)
      await refresh()
    } catch(err) { toast(err.message,'e') } finally { setBusy(false) }
  }

  const validate = async id => {
    setBusy(true)
    try {
      await receiptsAPI.validate(id)
      toast('Receipt validated — stock updated! ✅')
      await refresh()
    } catch(err) { toast(err.message,'e') } finally { setBusy(false) }
  }

  const del = async id => {
    if (!confirm('Delete this receipt?')) return
    try { await receiptsAPI.delete(id); toast('Deleted'); await refresh() }
    catch(err) { toast(err.message,'e') }
  }

  return (
    <div className="au">
      <div className="phd">
        <div><div className="pt">Receipts</div><div className="ps">{receipts.length} records · Incoming stock</div></div>
        <button className="btn bp" onClick={openAdd}><Ico n="plus" size={14}/>New Receipt</button>
      </div>
      <OpsTable icon="inbox" items={receipts}
        tHead={['Ref','Supplier','Items','Status','Date']}
        renderRow={r => (
          <tr key={r.id}>
            <td className="mono tc">{r.ref}</td>
            <td style={{color:'var(--t0)',fontWeight:600}}>{r.supplier}</td>
            <td><div style={{fontSize:11.5}}>
              {r.items.map(i=><div key={i.productId} className="fc g2"><span style={{color:'var(--cy)'}}>+{fNum(i.qty)}</span><span style={{color:'var(--t1)'}}>{prodName(products,i.productId)}</span></div>)}
            </div></td>
            <td><Bdg s={r.status}/></td>
            <td className="mono tm">{fDate(r.date)}</td>
            <td><div className="fc g2">
              {['draft','waiting','ready'].includes(r.status) && <button className="btn bg2 bsm" onClick={()=>validate(r.id)} disabled={busy}><Ico n="check" size={12}/>Validate</button>}
              {r.status!=='done' && <button className="btn bs bnr bsm" onClick={()=>openEdit(r)}><Ico n="edit" size={12}/></button>}
              {r.status!=='done' && <button className="btn br bnr bsm" onClick={()=>del(r.id)}><Ico n="trash" size={12}/></button>}
            </div></td>
          </tr>
        )}
      />
      {modal && (
        <Modal title={modal==='add'?'New Receipt':'Edit Receipt'} onClose={()=>setModal(null)} wide
          footer={<><button className="btn bs" onClick={()=>setModal(null)}>Cancel</button><button className="btn bp" onClick={save} disabled={busy}><Ico n="check" size={13}/>{busy?'Saving…':modal==='add'?'Create':'Save'}</button></>}>
          <div className="grid2">
            <div className="fg"><label className="lbl">Supplier</label><select className="inp" name="supplier" value={f.supplier} onChange={fh}>{SUPPLIERS.map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="fg"><label className="lbl">Warehouse</label><select className="inp" name="warehouse" value={f.warehouse} onChange={fh}>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          </div>
          <div className="grid2">
            <div className="fg"><label className="lbl">Date</label><input className="inp" type="date" name="date" value={f.date} onChange={fh}/></div>
            <div className="fg"><label className="lbl">Notes</label><input className="inp" name="notes" value={f.notes} onChange={fh} placeholder="Optional notes"/></div>
          </div>
          <div className="cgl" style={{margin:'4px 0 14px'}}/>
          <ItemEditor items={f.items} setItems={items=>setF(x=>({...x,items}))} products={products} warehouseId={f.warehouse} type="receipt"/>
        </Modal>
      )}
    </div>
  )
}

// ── Deliveries ────────────────────────────────────────────────────────────────
export function Deliveries({ s, d, refresh }) {
  const { deliveries, products, warehouses } = s
  const [modal, setModal] = useState(null)
  const [busy,  setBusy]  = useState(false)
  const blank = () => ({ customer:CUSTOMERS[0], date:toDay(), notes:'', warehouse:warehouses[0]?.id||'wh1', items:[{productId:products[0]?.id||'',qty:1}] })
  const [f, setF] = useState(blank)
  const fh = e => setF(x => ({ ...x, [e.target.name]: e.target.value }))

  const openAdd  = () => { setF(blank()); setModal('add') }
  const openEdit = r  => { setF({ ...r, items: r.items.map(i=>({...i})) }); setModal({ edit:r }) }

  const save = async () => {
    if (!f.items.length) return toast('Add at least one item','e')
    setBusy(true)
    try {
      const payload = { customer:f.customer, warehouseId:f.warehouse, date:f.date, notes:f.notes, status:'draft',
        items: f.items.map(i => ({ productId:i.productId, qty:Number(i.qty) })) }
      if (modal==='add') { await deliveriesAPI.create(payload); toast('Delivery order created') }
      else               { await deliveriesAPI.update(modal.edit.id, payload); toast('Updated') }
      setModal(null); await refresh()
    } catch(err) { toast(err.message,'e') } finally { setBusy(false) }
  }

  const validate = async id => {
    setBusy(true)
    try {
      await deliveriesAPI.validate(id)
      toast('Delivery validated — stock deducted! ✅')
      await refresh()
    } catch(err) { toast(err.message,'e') } finally { setBusy(false) }
  }

  const del = async id => {
    if (!confirm('Delete this delivery order?')) return
    try { await deliveriesAPI.delete(id); toast('Deleted'); await refresh() }
    catch(err) { toast(err.message,'e') }
  }

  return (
    <div className="au">
      <div className="phd">
        <div><div className="pt">Deliveries</div><div className="ps">{deliveries.length} records · Outgoing stock</div></div>
        <button className="btn bp" onClick={openAdd}><Ico n="plus" size={14}/>New Delivery</button>
      </div>
      <OpsTable icon="send" items={deliveries}
        tHead={['Ref','Customer','Items','Status','Date']}
        renderRow={r => (
          <tr key={r.id}>
            <td className="mono tc">{r.ref}</td>
            <td style={{color:'var(--t0)',fontWeight:600}}>{r.customer}</td>
            <td><div style={{fontSize:11.5}}>
              {r.items.map(i=><div key={i.productId} className="fc g2"><span className="tr">-{fNum(i.qty)}</span><span style={{color:'var(--t1)'}}>{prodName(products,i.productId)}</span></div>)}
            </div></td>
            <td><Bdg s={r.status}/></td>
            <td className="mono tm">{fDate(r.date)}</td>
            <td><div className="fc g2">
              {['draft','waiting','ready'].includes(r.status) && <button className="btn bg2 bsm" onClick={()=>validate(r.id)} disabled={busy}><Ico n="check" size={12}/>Ship</button>}
              {r.status!=='done' && <button className="btn bs bnr bsm" onClick={()=>openEdit(r)}><Ico n="edit" size={12}/></button>}
              {r.status!=='done' && <button className="btn br bnr bsm" onClick={()=>del(r.id)}><Ico n="trash" size={12}/></button>}
            </div></td>
          </tr>
        )}
      />
      {modal && (
        <Modal title={modal==='add'?'New Delivery Order':'Edit Delivery'} onClose={()=>setModal(null)} wide
          footer={<><button className="btn bs" onClick={()=>setModal(null)}>Cancel</button><button className="btn bp" onClick={save} disabled={busy}><Ico n="check" size={13}/>{busy?'Saving…':modal==='add'?'Create':'Save'}</button></>}>
          <div className="grid2">
            <div className="fg"><label className="lbl">Customer</label><select className="inp" name="customer" value={f.customer} onChange={fh}>{CUSTOMERS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="fg"><label className="lbl">Source Warehouse</label><select className="inp" name="warehouse" value={f.warehouse} onChange={fh}>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          </div>
          <div className="grid2">
            <div className="fg"><label className="lbl">Date</label><input className="inp" type="date" name="date" value={f.date} onChange={fh}/></div>
            <div className="fg"><label className="lbl">Notes</label><input className="inp" name="notes" value={f.notes} onChange={fh} placeholder="Optional"/></div>
          </div>
          <div className="cgl" style={{margin:'4px 0 14px'}}/>
          <ItemEditor items={f.items} setItems={items=>setF(x=>({...x,items}))} products={products} warehouseId={f.warehouse} type="delivery"/>
        </Modal>
      )}
    </div>
  )
}

// ── Transfers ─────────────────────────────────────────────────────────────────
export function Transfers({ s, d, refresh }) {
  const { transfers, products, warehouses } = s
  const [modal, setModal] = useState(null)
  const [busy,  setBusy]  = useState(false)
  const blank = () => ({ from:warehouses[0]?.id||'wh1', to:warehouses[1]?.id||'wh2', date:toDay(), notes:'', items:[{productId:products[0]?.id||'',qty:1}] })
  const [f, setF] = useState(blank)
  const fh = e => setF(x => ({ ...x, [e.target.name]: e.target.value }))

  const openAdd  = () => { setF(blank()); setModal('add') }
  const openEdit = r  => { setF({ ...r, items: r.items.map(i=>({...i})) }); setModal({ edit:r }) }

  const save = async () => {
    if (f.from===f.to) return toast('From and To must differ','e')
    if (!f.items.length) return toast('Add at least one item','e')
    setBusy(true)
    try {
      const payload = { fromWarehouse:f.from, toWarehouse:f.to, date:f.date, notes:f.notes, status:'draft',
        items: f.items.map(i => ({ productId:i.productId, qty:Number(i.qty) })) }
      if (modal==='add') { await transfersAPI.create(payload); toast('Transfer created') }
      else               { await transfersAPI.update(modal.edit.id, payload); toast('Updated') }
      setModal(null); await refresh()
    } catch(err) { toast(err.message,'e') } finally { setBusy(false) }
  }

  const validate = async id => {
    setBusy(true)
    try {
      await transfersAPI.validate(id)
      toast('Transfer executed — stock moved! ✅')
      await refresh()
    } catch(err) { toast(err.message,'e') } finally { setBusy(false) }
  }

  const del = async id => {
    if (!confirm('Delete this transfer?')) return
    try { await transfersAPI.delete(id); toast('Deleted'); await refresh() }
    catch(err) { toast(err.message,'e') }
  }

  return (
    <div className="au">
      <div className="phd">
        <div><div className="pt">Transfers</div><div className="ps">{transfers.length} internal moves</div></div>
        <button className="btn bp" onClick={openAdd}><Ico n="plus" size={14}/>New Transfer</button>
      </div>
      <OpsTable icon="arrow" items={transfers}
        tHead={['Ref','Route','Items','Status','Date']}
        renderRow={r => (
          <tr key={r.id}>
            <td className="mono tc">{r.ref}</td>
            <td><div className="fc g2">
              <span style={{fontSize:11.5,color:'var(--t1)'}}>{whName(warehouses,r.from)}</span>
              <Ico n="chevron" size={11} color="var(--cy)"/>
              <span style={{fontSize:11.5,color:'var(--t1)'}}>{whName(warehouses,r.to)}</span>
            </div></td>
            <td><div style={{fontSize:11.5}}>
              {r.items.map(i=><div key={i.productId} className="fc g2"><span className="tc">{fNum(i.qty)}</span><span style={{color:'var(--t1)'}}>{prodName(products,i.productId)}</span></div>)}
            </div></td>
            <td><Bdg s={r.status}/></td>
            <td className="mono tm">{fDate(r.date)}</td>
            <td><div className="fc g2">
              {['draft','waiting','ready'].includes(r.status) && <button className="btn bg2 bsm" onClick={()=>validate(r.id)} disabled={busy}><Ico n="check" size={12}/>Execute</button>}
              {r.status!=='done' && <button className="btn bs bnr bsm" onClick={()=>openEdit(r)}><Ico n="edit" size={12}/></button>}
              {r.status!=='done' && <button className="btn br bnr bsm" onClick={()=>del(r.id)}><Ico n="trash" size={12}/></button>}
            </div></td>
          </tr>
        )}
      />
      {modal && (
        <Modal title={modal==='add'?'New Transfer':'Edit Transfer'} onClose={()=>setModal(null)} wide
          footer={<><button className="btn bs" onClick={()=>setModal(null)}>Cancel</button><button className="btn bp" onClick={save} disabled={busy}><Ico n="check" size={13}/>{busy?'Saving…':modal==='add'?'Create':'Save'}</button></>}>
          <div className="grid2">
            <div className="fg"><label className="lbl">From Warehouse</label><select className="inp" name="from" value={f.from} onChange={fh}>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
            <div className="fg"><label className="lbl">To Warehouse</label><select className="inp" name="to" value={f.to} onChange={fh}>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          </div>
          <div className="grid2">
            <div className="fg"><label className="lbl">Date</label><input className="inp" type="date" name="date" value={f.date} onChange={fh}/></div>
            <div className="fg"><label className="lbl">Notes</label><input className="inp" name="notes" value={f.notes} onChange={fh} placeholder="Reason for transfer"/></div>
          </div>
          <div className="cgl" style={{margin:'4px 0 14px'}}/>
          <ItemEditor items={f.items} setItems={items=>setF(x=>({...x,items}))} products={products} warehouseId={f.from} type="transfer"/>
        </Modal>
      )}
    </div>
  )
}
