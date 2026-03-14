import React, { useState, useEffect } from 'react'
import { Ico, toast } from '../components/UI.jsx'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const getToken = () => localStorage.getItem('ci_token')

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

const ROLE_CONFIG = {
  admin:           { label:'Admin',        color:'var(--cy)',  bg:'var(--cyd)' },
  manager:         { label:'Manager',      color:'var(--pu)',  bg:'var(--pud)' },
  warehouse_staff: { label:'Staff',        color:'var(--gn)',  bg:'var(--gnd)' },
}

function RoleBadge({ role }) {
  const c = ROLE_CONFIG[role] || { label: role, color:'var(--t2)', bg:'var(--bg2)' }
  return (
    <span style={{ fontSize:10, fontWeight:700, color:c.color, background:c.bg, padding:'2px 8px', borderRadius:10, border:`1px solid ${c.color}28`, letterSpacing:'.04em' }}>
      {c.label.toUpperCase()}
    </span>
  )
}

export default function AdminPanel({ currentUserId }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState(null)
  const [addMode, setAddMode] = useState(false)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'warehouse_staff' })
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const load = async () => {
    setLoading(true)
    try {
      const d = await req('GET', '/users')
      setUsers(d.data || [])
    } catch(err) { toast(err.message, 'e') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!editUser) return
    setBusy(true)
    try {
      await req('PUT', `/users/${editUser.id}`, { name: form.name, role: form.role })
      toast('User updated!')
      setEditUser(null)
      load()
    } catch(err) { toast(err.message, 'e') }
    setBusy(false)
  }

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) { toast('Fill all fields', 'e'); return }
    setBusy(true)
    try {
      await req('POST', '/users', { name: form.name, email: form.email, password: form.password, role: form.role })
      toast(`User "${form.name}" created successfully!`)
      setAddMode(false)
      setForm({ name:'', email:'', password:'', role:'warehouse_staff' })
      load()
    } catch(err) { toast(err.message, 'e') }
    setBusy(false)
  }

  const toggleActive = async (u) => {
    if (u.id === currentUserId) { toast("Can't deactivate yourself", 'e'); return }
    setBusy(true)
    try {
      await req('PUT', `/users/${u.id}`, { is_active: u.is_active ? 0 : 1 })
      toast(u.is_active ? 'User deactivated' : 'User activated')
      load()
    } catch(err) { toast(err.message, 'e') }
    setBusy(false)
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total:   users.length,
    active:  users.filter(u => u.is_active).length,
    admins:  users.filter(u => u.role === 'admin').length,
    managers:users.filter(u => u.role === 'manager').length,
    staff:   users.filter(u => u.role === 'warehouse_staff').length,
  }

  return (
    <div className="au">
      {/* Header */}
      <div className="phd" style={{ marginBottom:18 }}>
        <div>
          <div className="pt">User Management</div>
          <div className="ps">Manage system users, roles and permissions</div>
        </div>
        <button className="btn bp bsm" onClick={() => { setAddMode(true); setForm({ name:'', email:'', password:'', role:'warehouse_staff' }) }}>
          <Ico n="user" size={14} color="white"/> Add User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:18 }}>
        {[
          { label:'Total Users',  val:stats.total,    color:'var(--cy)',  ic:'user'     },
          { label:'Active',       val:stats.active,   color:'var(--gn)',  ic:'activity' },
          { label:'Admins',       val:stats.admins,   color:'var(--cy)',  ic:'shield'   },
          { label:'Managers',     val:stats.managers, color:'var(--pu)',  ic:'activity' },
          { label:'Staff',        val:stats.staff,    color:'var(--gn)',  ic:'box'      },
        ].map((s, i) => (
          <div key={i} className="card cp" style={{ textAlign:'center' }}>
            <div style={{ fontSize:22, fontFamily:'Syne,sans-serif', fontWeight:800, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:10.5, color:'var(--t2)', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="card">
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--b0)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <div style={{ fontWeight:700, fontSize:13, color:'var(--t0)' }}>All Users</div>
          <input
            className="inp"
            style={{ maxWidth:220 }}
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--t2)', fontSize:12 }}>Loading users...</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--b0)' }}>
                  {['User','Email','Role','Status','Created','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10.5, fontWeight:700, color:'var(--t2)', letterSpacing:'.04em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom:'1px solid var(--b0)', transition:'.15s', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.012)' }}>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,var(--cy),#0891b2)', display:'grid', placeItems:'center', fontSize:11, fontWeight:700, color:'white', flexShrink:0 }}>
                          {u.avatar || u.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:12.5, fontWeight:600, color:'var(--t0)' }}>{u.name}</div>
                          {u.id === currentUserId && <div style={{ fontSize:9.5, color:'var(--cy)' }}>● You</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 16px', fontSize:12, color:'var(--t1)', fontFamily:'JetBrains Mono,monospace' }}>{u.email}</td>
                    <td style={{ padding:'11px 16px' }}><RoleBadge role={u.role}/></td>
                    <td style={{ padding:'11px 16px' }}>
                      <span style={{ fontSize:10.5, fontWeight:600, color: u.is_active ? 'var(--gn)' : 'var(--rd)', background: u.is_active ? 'var(--gnd)' : 'var(--rdd)', padding:'2px 8px', borderRadius:10 }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding:'11px 16px', fontSize:11, color:'var(--t2)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button
                          className="btn bs bsm"
                          onClick={() => { setEditUser(u); setForm({ name:u.name, email:u.email, role:u.role, password:'' }) }}
                          title="Edit user"
                        >
                          <Ico n="settings" size={12}/>
                        </button>
                        {u.id !== currentUserId && (
                          <button
                            className={`btn bsm ${u.is_active ? 'br' : 'bg2'}`}
                            onClick={() => toggleActive(u)}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                            disabled={busy}
                          >
                            <Ico n={u.is_active ? 'xCircle' : 'activity'} size={12}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ padding:40, textAlign:'center', color:'var(--t2)', fontSize:12 }}>No users found</div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit User Modal ── */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          <div className="fg">
            <label className="lbl">Full Name</label>
            <input className="inp" name="name" value={form.name} onChange={h} placeholder="User name"/>
          </div>
          <div className="fg">
            <label className="lbl">Email</label>
            <input className="inp" value={editUser.email} disabled style={{ opacity:.6 }}/>
          </div>
          <div className="fg">
            <label className="lbl">Role</label>
            <select className="inp" name="role" value={form.role} onChange={h}>
              <option value="warehouse_staff">Warehouse Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button className="btn bp" style={{ flex:1, justifyContent:'center' }} onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
            <button className="btn bs" onClick={() => setEditUser(null)}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ── Add User Modal ── */}
      {addMode && (
        <Modal title="Create New User" onClose={() => setAddMode(false)}>
          <div className="fg">
            <label className="lbl">Full Name</label>
            <input className="inp" name="name" value={form.name} onChange={h} placeholder="John Doe"/>
          </div>
          <div className="fg">
            <label className="lbl">Email</label>
            <input className="inp" name="email" type="email" value={form.email} onChange={h} placeholder="user@company.com"/>
          </div>
          <div className="fg">
            <label className="lbl">Password</label>
            <input className="inp" name="password" type="password" value={form.password} onChange={h} placeholder="Min 6 characters"/>
          </div>
          <div className="fg">
            <label className="lbl">Role</label>
            <select className="inp" name="role" value={form.role} onChange={h}>
              <option value="warehouse_staff">Warehouse Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button className="btn bp" style={{ flex:1, justifyContent:'center' }} onClick={createUser} disabled={busy}>
              {busy ? 'Creating…' : 'Create User'}
            </button>
            <button className="btn bs" onClick={() => setAddMode(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'grid', placeItems:'center', zIndex:100, backdropFilter:'blur(4px)' }} onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="card au" style={{ width:'100%', maxWidth:440, margin:16, padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:15, color:'var(--t0)' }}>{title}</div>
          <button className="btn bs bnr" onClick={onClose}><Ico n="xCircle" size={15}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}
