import React from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Ico, Bdg, CT } from '../components/UI.jsx'
import { totalStock, stockStatus, prodName, whName, fNum, fDate, toDay } from '../store/index.js'

const TREND = [
  {name:'Mon',receipts:45,deliveries:20},{name:'Tue',receipts:30,deliveries:35},
  {name:'Wed',receipts:60,deliveries:25},{name:'Thu',receipts:20,deliveries:40},
  {name:'Fri',receipts:50,deliveries:30},{name:'Sat',receipts:35,deliveries:15},{name:'Sun',receipts:28,deliveries:22},
]
const PIE_CLR = ['#22d3ee','#10b981','#a78bfa','#f59e0b','#f43f5e','#06b6d4','#7c3aed']

export default function Dashboard({ s }) {
  const { products, receipts, deliveries, transfers, warehouses, movements } = s

  const totalUnits = products.reduce((a,p) => a + totalStock(p), 0)
  const low        = products.filter(p => stockStatus(p)==='low')
  const out        = products.filter(p => stockStatus(p)==='out')
  const pRcpt      = receipts.filter(r  => ['waiting','ready','draft'].includes(r.status)).length
  const pDlv       = deliveries.filter(d => ['waiting','ready','draft'].includes(d.status)).length
  const pTrf       = transfers.filter(t  => ['waiting','ready','draft'].includes(t.status)).length

  const byCat = {}
  products.forEach(p => { byCat[p.category] = (byCat[p.category]||0) + totalStock(p) })
  const pieD = Object.entries(byCat).filter(([,v]) => v>0).map(([name,value]) => ({name,value}))

  const alerts = [...out, ...low].slice(0, 5)
  const recentM = movements.slice(0, 6)

  const KPIS = [
    { label:'Total Products',     val:products.length, sub:`${fNum(totalUnits)} total units`,                  cls:'kc', ic:'box',       icColor:'var(--cy)', icBg:'var(--cyd)' },
    { label:'Out of Stock',       val:out.length,       sub:`${low.length} low stock items`,                   cls:'kr', ic:'xCircle',   icColor:'var(--rd)', icBg:'var(--rdd)', valColor:'var(--rd)' },
    { label:'Pending Receipts',   val:pRcpt,            sub:`${receipts.filter(r=>r.status==='done').length} completed`,  cls:'ka', ic:'inbox',  icColor:'var(--am)', icBg:'var(--amd)', valColor:'var(--am)' },
    { label:'Pending Deliveries', val:pDlv,             sub:`${deliveries.filter(d=>d.status==='done').length} shipped`,  cls:'kg', ic:'send',   icColor:'var(--gn)', icBg:'var(--gnd)', valColor:'var(--gn)' },
    { label:'Pending Transfers',  val:pTrf,             sub:`${transfers.filter(t=>t.status==='done').length} done`,      cls:'kp', ic:'arrow',  icColor:'var(--pu)', icBg:'var(--pud)', valColor:'var(--pu)' },
  ]

  const TYPE_CLR = { receipt:'var(--gn)', delivery:'var(--rd)', transfer:'var(--cy)', adjustment:'var(--am)' }
  const TYPE_SYM = { receipt:'↑ Rcpt', delivery:'↓ Dlv', transfer:'⇄ Trf', adjustment:'≠ Adj' }

  return (
    <div className="au">
      {out.length > 0 && <div className="as asr au"><Ico n="xCircle" size={14} color="var(--rd)"/><span><b>{out.length} products out of stock</b> — {out.map(p=>p.name).join(', ')}</span></div>}
      {low.length > 0 && <div className="as asw au d1"><Ico n="alert" size={14} color="var(--am)"/><span><b>{low.length} products below reorder level</b> — action needed</span></div>}

      <div className="phd">
        <div>
          <div className="pt">Inventory Command Center</div>
          <div className="ps">Real-time stock intelligence · {fDate(toDay())}</div>
        </div>
        <div style={{fontSize:11,color:'var(--t2)',fontFamily:'JetBrains Mono,monospace',background:'var(--bg2)',border:'1px solid var(--b0)',padding:'4px 10px',borderRadius:6}}>
          <span style={{color:'var(--gn)'}}>● </span>LIVE
        </div>
      </div>

      {/* KPIs */}
      <div className="grid5" style={{marginBottom:16}}>
        {KPIS.map((k,i) => (
          <div key={i} className={`kpi ${k.cls} au d${i+1}`}>
            <div className="ki" style={{background:k.icBg}}><Ico n={k.ic} size={17} color={k.icColor}/></div>
            <div className="kv" style={k.valColor?{color:k.valColor}:{}}>{k.val}</div>
            <div className="kl">{k.label}</div>
            <div className="kt tm"><Ico n="trending" size={11} color="var(--t2)"/>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid2" style={{marginBottom:16}}>
        <div className="card cp au d2">
          <div className="fcb" style={{marginBottom:12}}>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--t0)'}}>Movement Trend</span>
            <span style={{fontSize:10.5,color:'var(--t2)'}}>Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={TREND} margin={{top:5,right:0,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={.3}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
                <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--b0)" vertical={false}/>
              <XAxis dataKey="name" tick={{fill:'var(--t2)',fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'var(--t2)',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Area type="monotone" dataKey="receipts"  name="Receipts"  stroke="#22d3ee" fill="url(#gc)" strokeWidth={2}/>
              <Area type="monotone" dataKey="deliveries" name="Deliveries" stroke="#10b981" fill="url(#gg)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card cp au d3">
          <div className="fcb" style={{marginBottom:12}}>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--t0)'}}>Stock by Category</span>
            <span style={{fontSize:10.5,color:'var(--t2)'}}>All warehouses</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieD} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {pieD.map((_,i) => <Cell key={i} fill={PIE_CLR[i%PIE_CLR.length]}/>)}
              </Pie>
              <Tooltip content={<CT/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px 14px',marginTop:6}}>
            {pieD.map((d,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:5,fontSize:10.5,color:'var(--t2)'}}>
                <span style={{width:7,height:7,borderRadius:'50%',background:PIE_CLR[i%PIE_CLR.length],display:'inline-block',flexShrink:0}}/>
                {d.name}: <b style={{color:'var(--t1)'}}>{fNum(d.value)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid2 au d4">
        <div className="card">
          <div className="fcb" style={{padding:'14px 16px 10px'}}>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--t0)'}}>Recent Movements</span>
            <Ico n="activity" size={14} color="var(--t2)"/>
          </div>
          <div className="cgl" style={{margin:'0 16px'}}/>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Qty</th></tr></thead>
            <tbody>
              {recentM.map(m => (
                <tr key={m.id}>
                  <td className="mono">{fDate(m.date)}</td>
                  <td><span style={{color:TYPE_CLR[m.type],fontWeight:700,fontSize:11}}>{TYPE_SYM[m.type]||m.type}</span></td>
                  <td style={{color:'var(--t0)',fontWeight:600,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{prodName(products,m.productId)}</td>
                  <td className="mono" style={{color:m.qty>0?'var(--gn)':m.qty<0?'var(--rd)':'var(--t1)',fontWeight:700}}>{m.qty>0?'+':''}{fNum(m.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="fcb" style={{padding:'14px 16px 10px'}}>
            <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'var(--t0)'}}>Stock Alerts</span>
            <Ico n="bell" size={14} color="var(--am)"/>
          </div>
          <div className="cgl" style={{margin:'0 16px'}}/>
          <div style={{padding:'10px 16px 14px'}}>
            {alerts.map(p => {
              const tot = totalStock(p)
              const pct = Math.min(100, (tot / Math.max(p.reorderLevel*3,1)) * 100)
              const st  = stockStatus(p)
              return (
                <div key={p.id} style={{marginBottom:12}}>
                  <div className="fcb" style={{marginBottom:4}}>
                    <span style={{fontSize:12.5,fontWeight:600,color:'var(--t0)'}}>{p.name}</span>
                    <div className="fc g2">
                      <span className="mono" style={{fontSize:10.5,color:'var(--t2)'}}>{p.sku}</span>
                      <Bdg s={st}/>
                    </div>
                  </div>
                  <div className="fc g2">
                    <div className="pw" style={{flex:1}}>
                      <div className="pb" style={{width:`${pct}%`,background:st==='out'?'var(--rd)':st==='low'?'var(--am)':'var(--gn)'}}/>
                    </div>
                    <span className="mono" style={{fontSize:10,color:'var(--t2)',minWidth:60,textAlign:'right'}}>{fNum(tot)} / {fNum(p.reorderLevel*3)} {p.unit}</span>
                  </div>
                </div>
              )
            })}
            {alerts.length===0 && (
              <div className="empty" style={{padding:20}}>
                <Ico n="checkCircle" size={24} color="var(--gn)"/>
                <span>All stock levels healthy</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
