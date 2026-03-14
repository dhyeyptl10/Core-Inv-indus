import React, { useState } from 'react'
import { Ico } from '../components/UI.jsx'

const ROLES = [
  {
    key: 'admin',
    label: 'Administrator',
    icon: 'shield',
    color: 'var(--cy)',
    bg: 'var(--cyd)',
    border: 'rgba(34,211,238,.35)',
    glow: 'rgba(34,211,238,.18)',
    demo: 'admin@coreinventory.com',
    badge: 'FULL ACCESS',
    badgeColor: 'var(--cy)',
    desc: 'Complete system control including user management, audit logs, system settings, and all inventory operations.',
    perms: ['User Management', 'All Inventory Ops', 'System Settings', 'Full Reports', 'Audit Logs'],
  },
  {
    key: 'manager',
    label: 'Manager',
    icon: 'activity',
    color: 'var(--pu)',
    bg: 'var(--pud)',
    border: 'rgba(167,139,250,.35)',
    glow: 'rgba(167,139,250,.15)',
    demo: 'manager@coreinventory.com',
    badge: 'OPERATIONS',
    badgeColor: 'var(--pu)',
    desc: 'Manage all inventory operations, approve transfers, oversee stock levels and generate business reports.',
    perms: ['Inventory Operations', 'Approve Transfers', 'Stock Reports', 'Warehouse Mgmt', 'Movement History'],
  },
  {
    key: 'staff',
    label: 'Warehouse Staff',
    icon: 'box',
    color: 'var(--gn)',
    bg: 'var(--gnd)',
    border: 'rgba(16,185,129,.35)',
    glow: 'rgba(16,185,129,.12)',
    demo: 'staff@coreinventory.com',
    badge: 'OPERATIONS',
    badgeColor: 'var(--gn)',
    desc: 'Handle daily warehouse operations including stock receipts, deliveries, and inventory adjustments.',
    perms: ['View Products', 'Create Receipts', 'Create Deliveries', 'View Stock', 'Move History'],
  },
]

const FEATURES = [
  { icon: 'box',       title: 'Multi-Warehouse',  desc: 'Manage stock across unlimited warehouses with real-time sync',  color: 'var(--cy)' },
  { icon: 'activity',  title: 'Live Analytics',   desc: 'Charts, KPIs and movement trends updated in real time',          color: 'var(--pu)' },
  { icon: 'shield',    title: 'Role-Based Access', desc: 'Granular RBAC — Admin, Manager, Staff with audit trail',        color: 'var(--gn)' },
  { icon: 'send',      title: 'Smart Operations', desc: 'Receipts, deliveries, transfers with status workflows',           color: 'var(--am)' },
  { icon: 'refresh',   title: 'Secure Access',    desc: 'JWT-based authentication with role enforcement, session control and audit trails',  color: 'var(--rd)' },
  { icon: 'list',      title: 'Full Audit Log',   desc: 'Every stock movement logged with user attribution',               color: 'var(--cy)' },
]

export default function Landing({ onSelectRole }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)', overflowX: 'hidden' }}>
      {/* Ambient glow decorations */}
      <div style={{ position:'fixed', top:'-10%', left:'-5%', width:500, height:500, background:'radial-gradient(circle,rgba(34,211,238,.055),transparent 70%)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:'-10%', right:'-5%', width:600, height:600, background:'radial-gradient(circle,rgba(167,139,250,.045),transparent 70%)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', top:'40%', right:'20%', width:300, height:300, background:'radial-gradient(circle,rgba(16,185,129,.03),transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

      <div style={{ maxWidth:1120, margin:'0 auto', padding:'0 24px', position:'relative', zIndex:1 }}>

        {/* ── NAVBAR ── */}
        <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 0 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38,height:38,background:'linear-gradient(135deg,var(--cy),#0891b2)',borderRadius:10,display:'grid',placeItems:'center',boxShadow:'0 0 20px rgba(34,211,238,.3)',animation:'glow 3s infinite' }}>
              <Ico n="archive" size={18} color="white"/>
            </div>
            <div>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:17, color:'var(--t0)', lineHeight:1 }}>CoreInventory</div>
              <div style={{ fontSize:9, color:'var(--t2)', letterSpacing:'.12em' }}>ENTERPRISE STOCK MANAGEMENT</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:11, color:'var(--t2)', background:'var(--bg1)', border:'1px solid var(--b0)', padding:'5px 12px', borderRadius:6, fontFamily:'JetBrains Mono,monospace' }}>
              <span style={{color:'var(--gn)'}}>● </span>v2.0 LIVE
            </div>
            <button className="btn bs bsm" onClick={() => onSelectRole('login')}>Sign In</button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div style={{ textAlign:'center', padding:'60px 0 50px', animation:'up .5s ease' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--bg1)', border:'1px solid var(--b0)', borderRadius:20, padding:'5px 14px', marginBottom:22, fontSize:11, color:'var(--t2)' }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--gn)', animation:'pulse 2s infinite' }}/>
            Real-time inventory · Multi-warehouse
          </div>

          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'clamp(34px,5vw,58px)', color:'var(--t0)', lineHeight:1.1, marginBottom:18 }}>
            Enterprise Inventory<br/>
            <span style={{ background:'linear-gradient(135deg,var(--cy),#0891b2,var(--pu))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Command Center
            </span>
          </h1>

          <p style={{ fontSize:'clamp(13px,2vw,16px)', color:'var(--t1)', maxWidth:560, margin:'0 auto 36px', lineHeight:1.7 }}>
            A full-stack inventory management system with role-based dashboards, multi-warehouse tracking, real-time analytics, and enterprise-grade access control.
          </p>

          {/* Stats row */}
          <div style={{ display:'flex', justifyContent:'center', gap:32, marginBottom:44, flexWrap:'wrap' }}>
            {[['3', 'User Roles'],['8+', 'Product Categories'],['∞', 'Warehouses'],['100%', 'Real-time']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--cy)' }}>{val}</div>
                <div style={{ fontSize:10.5, color:'var(--t2)', marginTop:2 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* ── ROLE SELECTION CARDS ── */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:'var(--t2)', letterSpacing:'.1em', marginBottom:18, fontWeight:600 }}>SELECT YOUR ROLE TO SIGN IN</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16, maxWidth:980, margin:'0 auto' }}>
              {ROLES.map((role, i) => (
                <div
                  key={role.key}
                  onClick={() => onSelectRole(role.key)}
                  onMouseEnter={() => setHovered(role.key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    background: hovered === role.key ? role.bg : 'var(--bg1)',
                    border: `1px solid ${hovered === role.key ? role.border : 'var(--b0)'}`,
                    borderRadius: 14,
                    padding: '22px 22px 20px',
                    cursor: 'pointer',
                    transition: 'all .22s',
                    textAlign: 'left',
                    transform: hovered === role.key ? 'translateY(-4px)' : 'none',
                    boxShadow: hovered === role.key ? `0 12px 32px ${role.glow}` : 'none',
                    animation: `up .4s ease ${i * 0.08}s both`,
                  }}
                >
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{ width:44, height:44, background: role.bg, borderRadius:11, display:'grid', placeItems:'center', border:`1px solid ${role.border}` }}>
                      <Ico n={role.icon} size={20} color={role.color}/>
                    </div>
                    <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:'.1em', color: role.badgeColor, background: role.bg, padding:'3px 9px', borderRadius:12, border:`1px solid ${role.border}` }}>
                      {role.badge}
                    </div>
                  </div>

                  <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16, color:'var(--t0)', marginBottom:6 }}>
                    {role.label}
                  </div>
                  <div style={{ fontSize:12, color:'var(--t2)', lineHeight:1.6, marginBottom:16 }}>
                    {role.desc}
                  </div>

                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:16 }}>
                    {role.perms.map(p => (
                      <span key={p} style={{ fontSize:10, color: role.color, background: role.bg, padding:'3px 8px', borderRadius:5, fontWeight:600 }}>{p}</span>
                    ))}
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:'1px solid var(--b0)' }}>
                    <div style={{ fontSize:10.5, color:'var(--t2)', fontFamily:'JetBrains Mono,monospace' }}>{role.demo}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:700, color: role.color }}>
                      Sign In <Ico n="chevron" size={12} color={role.color}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES GRID ── */}
        <div style={{ padding:'20px 0 60px' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:10, color:'var(--t2)', letterSpacing:'.12em', marginBottom:8, fontWeight:600 }}>PLATFORM CAPABILITIES</div>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'var(--t0)' }}>Everything you need to run your warehouse</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="card cp" style={{ display:'flex', gap:14, alignItems:'flex-start', animation:`up .4s ease ${i*0.06}s both` }}>
                <div style={{ width:36, height:36, borderRadius:9, background:`${f.color}18`, display:'grid', placeItems:'center', flexShrink:0, border:`1px solid ${f.color}28` }}>
                  <Ico n={f.icon} size={16} color={f.color}/>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:'var(--t0)', marginBottom:4 }}>{f.title}</div>
                  <div style={{ fontSize:11.5, color:'var(--t2)', lineHeight:1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop:'1px solid var(--b0)', padding:'20px 0', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:'var(--t2)', flexWrap:'wrap', gap:8 }}>
          <div>CoreInventory v2.0 © 2025 · Enterprise Stock Management</div>
          <div style={{ display:'flex', gap:16 }}>
            <span>React + Express + SQLite</span>
            <span style={{ color:'var(--cy)' }}>All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  )
}
