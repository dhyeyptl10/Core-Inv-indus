// ── Constants ────────────────────────────────────────────────────────────────
export const CATS   = ['Raw Materials','Furniture','Electronics','Spare Parts','Packaging','Chemicals','Textiles']
export const UNITS  = ['kg','pieces','liters','meters','boxes','sets','tons']
export const SUPPLIERS = ['SteelCo Ltd','FurniWorld','TechParts Inc','ChemBase Corp','TextileMart','MetalWorks Co']
export const CUSTOMERS = ['Acme Corp','BuildRight Ltd','TechSolutions','HomeMakers Co','GreenBuild','CityFurniture']
export const STATUSES  = ['draft','waiting','ready','done','canceled']

// ── Helpers ──────────────────────────────────────────────────────────────────
export const makeId  = (p='') => p + Date.now().toString(36) + Math.random().toString(36).slice(2,5)
export const toDay   = ()     => new Date().toISOString().split('T')[0]
export const fDate   = (d)    => { try { return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) } catch(e) { return d } }
export const fNum    = (n)    => Number(n||0).toLocaleString('en-IN')

export const totalStock  = p  => Object.values(p.stock||{}).reduce((a,b) => a+b, 0)
export const stockStatus = p  => { const t=totalStock(p); if(t===0) return 'out'; if(t<=p.reorderLevel) return 'low'; return 'ok' }
export const whName  = (whs,id) => whs.find(w => w.id===id)?.name || id
export const prodName= (ps, id) => ps.find(p  => p.id===id)?.name || id
export const nextRef = (list, prefix) => {
  const nums = list.map(x => { const m=x.ref?.match(/(\d+)$/); return m ? parseInt(m[1]) : 0 })
  return `${prefix}-${String(Math.max(0,...nums)+1).padStart(3,'0')}`
}

// ── Initial Data ──────────────────────────────────────────────────────────────
const WHS = [
  { id:'wh1', name:'Main Warehouse',   location:'Mumbai' },
  { id:'wh2', name:'Production Floor', location:'Mumbai' },
  { id:'wh3', name:'Delhi Store',      location:'Delhi'  },
]

export const INIT = {
  warehouses: [...WHS],
  products: [
    { id:'p1', name:'Steel Rod',        sku:'STL-001', category:'Raw Materials', unit:'kg',      reorderLevel:20,  stock:{wh1:97, wh2:30, wh3:0},   createdAt:'2024-01-10' },
    { id:'p2', name:'Office Chair',     sku:'CHR-001', category:'Furniture',     unit:'pieces',  reorderLevel:10,  stock:{wh1:45, wh2:0,  wh3:20},  createdAt:'2024-01-12' },
    { id:'p3', name:'Conference Table', sku:'TBL-001', category:'Furniture',     unit:'pieces',  reorderLevel:5,   stock:{wh1:12, wh2:0,  wh3:3},   createdAt:'2024-01-15' },
    { id:'p4', name:'M8 Screws',        sku:'SCW-001', category:'Spare Parts',   unit:'pieces',  reorderLevel:500, stock:{wh1:2300,wh2:450,wh3:0},  createdAt:'2024-01-18' },
    { id:'p5', name:'Industrial Paint', sku:'PNT-001', category:'Chemicals',     unit:'liters',  reorderLevel:50,  stock:{wh1:15, wh2:0,  wh3:0},   createdAt:'2024-01-20' },
    { id:'p6', name:'Copper Wire',      sku:'COP-001', category:'Electronics',   unit:'meters',  reorderLevel:100, stock:{wh1:0,  wh2:0,  wh3:0},   createdAt:'2024-01-22' },
    { id:'p7', name:'Packing Box L',    sku:'PKG-001', category:'Packaging',     unit:'pieces',  reorderLevel:100, stock:{wh1:380,wh2:0,  wh3:50},  createdAt:'2024-01-25' },
    { id:'p8', name:'Cotton Fabric',    sku:'CTN-001', category:'Textiles',      unit:'meters',  reorderLevel:200, stock:{wh1:8,  wh2:0,  wh3:0},   createdAt:'2024-01-28' },
  ],
  receipts: [
    { id:'r1', ref:'RCT-001', supplier:'SteelCo Ltd',  items:[{productId:'p1',qty:100}],                        status:'done',    date:'2024-01-10', notes:'Regular quarterly order', warehouse:'wh1' },
    { id:'r2', ref:'RCT-002', supplier:'FurniWorld',   items:[{productId:'p2',qty:20},{productId:'p3',qty:5}],  status:'done',    date:'2024-01-12', notes:'',                        warehouse:'wh1' },
    { id:'r3', ref:'RCT-003', supplier:'ChemBase Corp',items:[{productId:'p5',qty:50}],                         status:'waiting', date:'2024-01-20', notes:'Urgent order',             warehouse:'wh1' },
    { id:'r4', ref:'RCT-004', supplier:'SteelCo Ltd',  items:[{productId:'p1',qty:50}],                         status:'ready',   date:'2024-01-25', notes:'',                        warehouse:'wh1' },
  ],
  deliveries: [
    { id:'d1', ref:'DLV-001', customer:'Acme Corp',      items:[{productId:'p2',qty:10}],                        status:'done',    date:'2024-01-15', notes:'',                        warehouse:'wh1' },
    { id:'d2', ref:'DLV-002', customer:'BuildRight Ltd', items:[{productId:'p1',qty:20},{productId:'p4',qty:500}],status:'done',   date:'2024-01-18', notes:'',                        warehouse:'wh1' },
    { id:'d3', ref:'DLV-003', customer:'TechSolutions',  items:[{productId:'p3',qty:2}],                         status:'ready',   date:'2024-01-26', notes:'',                        warehouse:'wh1' },
    { id:'d4', ref:'DLV-004', customer:'HomeMakers Co',  items:[{productId:'p2',qty:5}],                         status:'waiting', date:'2024-01-27', notes:'Priority delivery',        warehouse:'wh1' },
  ],
  transfers: [
    { id:'t1', ref:'TRF-001', from:'wh1', to:'wh2', items:[{productId:'p1',qty:30}],                        status:'done',    date:'2024-01-11', notes:'Production batch' },
    { id:'t2', ref:'TRF-002', from:'wh1', to:'wh3', items:[{productId:'p2',qty:20},{productId:'p7',qty:50}],status:'done',    date:'2024-01-14', notes:'Delhi restocking' },
    { id:'t3', ref:'TRF-003', from:'wh1', to:'wh2', items:[{productId:'p4',qty:450}],                       status:'waiting', date:'2024-01-26', notes:'' },
  ],
  adjustments: [
    { id:'a1', ref:'ADJ-001', productId:'p1', warehouse:'wh1', oldQty:100, newQty:97,  reason:'Damage in transit',        date:'2024-01-13', status:'done' },
    { id:'a2', ref:'ADJ-002', productId:'p5', warehouse:'wh1', oldQty:50,  newQty:15,  reason:'Usage without records',    date:'2024-01-21', status:'done' },
    { id:'a3', ref:'ADJ-003', productId:'p8', warehouse:'wh1', oldQty:200, newQty:8,   reason:'Counting discrepancy',     date:'2024-01-28', status:'done' },
  ],
  movements: [
    { id:'m1',  date:'2024-01-10', type:'receipt',    productId:'p1', qty:100,  from:'-',   to:'wh1',  ref:'RCT-001' },
    { id:'m2',  date:'2024-01-11', type:'transfer',   productId:'p1', qty:30,   from:'wh1', to:'wh2',  ref:'TRF-001' },
    { id:'m3',  date:'2024-01-12', type:'receipt',    productId:'p2', qty:20,   from:'-',   to:'wh1',  ref:'RCT-002' },
    { id:'m4',  date:'2024-01-12', type:'receipt',    productId:'p3', qty:5,    from:'-',   to:'wh1',  ref:'RCT-002' },
    { id:'m5',  date:'2024-01-13', type:'adjustment', productId:'p1', qty:-3,   from:'wh1', to:'wh1',  ref:'ADJ-001' },
    { id:'m6',  date:'2024-01-14', type:'transfer',   productId:'p2', qty:20,   from:'wh1', to:'wh3',  ref:'TRF-002' },
    { id:'m7',  date:'2024-01-14', type:'transfer',   productId:'p7', qty:50,   from:'wh1', to:'wh3',  ref:'TRF-002' },
    { id:'m8',  date:'2024-01-15', type:'delivery',   productId:'p2', qty:-10,  from:'wh1', to:'-',    ref:'DLV-001' },
    { id:'m9',  date:'2024-01-18', type:'delivery',   productId:'p1', qty:-20,  from:'wh1', to:'-',    ref:'DLV-002' },
    { id:'m10', date:'2024-01-18', type:'delivery',   productId:'p4', qty:-500, from:'wh1', to:'-',    ref:'DLV-002' },
    { id:'m11', date:'2024-01-21', type:'adjustment', productId:'p5', qty:-35,  from:'wh1', to:'wh1',  ref:'ADJ-002' },
    { id:'m12', date:'2024-01-28', type:'adjustment', productId:'p8', qty:-192, from:'wh1', to:'wh1',  ref:'ADJ-003' },
  ],
}

// ── Reducer ───────────────────────────────────────────────────────────────────
export function reducer(s, a) {
  switch (a.type) {
    case 'HYDRATE': return a.payload

    case 'ADD_PRODUCT': return { ...s, products: [...s.products, a.p] }
    case 'UPD_PRODUCT': return { ...s, products: s.products.map(p => p.id===a.id ? {...p,...a.p} : p) }
    case 'DEL_PRODUCT': return { ...s, products: s.products.filter(p => p.id!==a.id) }

    case 'ADD_RECEIPT': return { ...s, receipts: [a.p, ...s.receipts] }
    case 'UPD_RECEIPT': return { ...s, receipts: s.receipts.map(r => r.id===a.id ? {...r,...a.p} : r) }
    case 'DEL_RECEIPT': return { ...s, receipts: s.receipts.filter(r => r.id!==a.id) }
    case 'VALIDATE_RECEIPT': {
      const r = s.receipts.find(x => x.id===a.id); if (!r) return s
      let ps = [...s.products], ms = [...s.movements]
      r.items.forEach(item => {
        ps = ps.map(p => { if (p.id!==item.productId) return p; const st={...p.stock}; st[r.warehouse]=(st[r.warehouse]||0)+Number(item.qty); return {...p,stock:st} })
        ms = [{ id:makeId('m'), date:toDay(), type:'receipt', productId:item.productId, qty:Number(item.qty), from:'-', to:r.warehouse, ref:r.ref }, ...ms]
      })
      return { ...s, products:ps, movements:ms, receipts:s.receipts.map(x => x.id===a.id ? {...x,status:'done'} : x) }
    }

    case 'ADD_DELIVERY': return { ...s, deliveries: [a.p, ...s.deliveries] }
    case 'UPD_DELIVERY': return { ...s, deliveries: s.deliveries.map(d => d.id===a.id ? {...d,...a.p} : d) }
    case 'DEL_DELIVERY': return { ...s, deliveries: s.deliveries.filter(d => d.id!==a.id) }
    case 'VALIDATE_DELIVERY': {
      const d = s.deliveries.find(x => x.id===a.id); if (!d) return s
      let ps = [...s.products], ms = [...s.movements]
      d.items.forEach(item => {
        ps = ps.map(p => { if (p.id!==item.productId) return p; const st={...p.stock}; st[d.warehouse]=Math.max(0,(st[d.warehouse]||0)-Number(item.qty)); return {...p,stock:st} })
        ms = [{ id:makeId('m'), date:toDay(), type:'delivery', productId:item.productId, qty:-Number(item.qty), from:d.warehouse, to:'-', ref:d.ref }, ...ms]
      })
      return { ...s, products:ps, movements:ms, deliveries:s.deliveries.map(x => x.id===a.id ? {...x,status:'done'} : x) }
    }

    case 'ADD_TRANSFER': return { ...s, transfers: [a.p, ...s.transfers] }
    case 'UPD_TRANSFER': return { ...s, transfers: s.transfers.map(t => t.id===a.id ? {...t,...a.p} : t) }
    case 'DEL_TRANSFER': return { ...s, transfers: s.transfers.filter(t => t.id!==a.id) }
    case 'VALIDATE_TRANSFER': {
      const t = s.transfers.find(x => x.id===a.id); if (!t) return s
      let ps = [...s.products], ms = [...s.movements]
      t.items.forEach(item => {
        ps = ps.map(p => { if (p.id!==item.productId) return p; const st={...p.stock}; st[t.from]=Math.max(0,(st[t.from]||0)-Number(item.qty)); st[t.to]=(st[t.to]||0)+Number(item.qty); return {...p,stock:st} })
        ms = [{ id:makeId('m'), date:toDay(), type:'transfer', productId:item.productId, qty:Number(item.qty), from:t.from, to:t.to, ref:t.ref }, ...ms]
      })
      return { ...s, products:ps, movements:ms, transfers:s.transfers.map(x => x.id===a.id ? {...x,status:'done'} : x) }
    }

    case 'ADD_ADJUSTMENT': {
      const { productId, warehouse, newQty, oldQty, reason, ref } = a.p
      const diff = Number(newQty) - Number(oldQty)
      const ps = s.products.map(p => { if (p.id!==productId) return p; const st={...p.stock}; st[warehouse]=Number(newQty); return {...p,stock:st} })
      const mv = { id:makeId('m'), date:toDay(), type:'adjustment', productId, qty:diff, from:warehouse, to:warehouse, ref }
      const adj = { id:makeId('a'), ref, ...a.p, status:'done', date:toDay() }
      return { ...s, products:ps, movements:[mv,...s.movements], adjustments:[adj,...s.adjustments] }
    }

    case 'ADD_WAREHOUSE': return { ...s, warehouses: [...s.warehouses, a.p] }
    case 'UPD_WAREHOUSE': return { ...s, warehouses: s.warehouses.map(w => w.id===a.id ? {...w,...a.p} : w) }
    case 'DEL_WAREHOUSE': return { ...s, warehouses: s.warehouses.filter(w => w.id!==a.id) }

    default: return s
  }
}
