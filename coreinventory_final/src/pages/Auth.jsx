import React, { useState } from 'react'
import { Ico, toast } from '../components/UI.jsx'
import { authAPI } from '../api.js'
import Landing from './Landing.jsx'

const ROLE_HINTS = {
  admin:   { email: 'admin@coreinventory.com',   password: 'admin123',   label: 'Administrator',  color: 'var(--cy)',  bg: 'var(--cyd)',  border: 'rgba(34,211,238,.3)',  icon: 'shield'   },
  manager: { email: 'manager@coreinventory.com', password: 'manager123', label: 'Manager',        color: 'var(--pu)',  bg: 'var(--pud)',  border: 'rgba(167,139,250,.3)', icon: 'activity' },
  staff:   { email: 'staff@coreinventory.com',   password: 'staff123',   label: 'Warehouse Staff',color: 'var(--gn)',  bg: 'var(--gnd)',  border: 'rgba(16,185,129,.3)',  icon: 'box'      },
}

export default function Auth({ onLogin }) {
  const [view,   setView]  = useState('landing')
  const [role,   setRole]  = useState(null)
  const [step,   setStep]  = useState(1)
  const [busy,   setBusy]  = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [f, setF] = useState({ email:'', password:'', name:'', otp:'', newPass:'' })
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }))

  const handleSelectRole = (roleKey) => {
    if (roleKey === 'login') {
      setRole(null)
      setF(x => ({ ...x, email:'', password:'' }))
    } else {
      setRole(roleKey)
      const hint = ROLE_HINTS[roleKey]
      setF(x => ({ ...x, email: hint.email, password: hint.password }))
    }
    setView('login')
    setStep(1)
  }

  const submit = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (view === 'login') {
        if (!f.email || !f.password) { toast('Fill all fields', 'e'); return }
        const res = await authAPI.login(f.email, f.password)
        onLogin({ id:res.user.id, name:res.user.name, email:res.user.email, role:res.user.role, av:res.user.avatar }, res.token)
      } else if (view === 'signup') {
        if (!f.name || !f.email || !f.password) { toast('Fill all fields', 'e'); return }
        const res = await authAPI.signup(f.name, f.email, f.password)
        onLogin({ id:res.user.id, name:res.user.name, email:res.user.email, role:res.user.role, av:res.user.avatar }, res.token)
      } else {
        if (step === 1) {
          if (!f.email) { toast('Enter your email', 'e'); return }
          const res = await authAPI.sendOtp(f.email)
          toast(res.message || 'OTP sent to your email!', 'w')
          if (res.devOtp) toast('DEV OTP: ' + res.devOtp, 'w')
          setStep(2)
        } else if (step === 2) {
          if (!f.otp) { toast('Enter the OTP', 'e'); return }
          const res = await authAPI.verifyOtp(f.email, f.otp)
          setResetToken(res.resetToken)
          toast('OTP verified!')
          setStep(3)
        } else {
          if (!f.newPass || f.newPass.length < 6) { toast('Password must be 6+ chars', 'e'); return }
          await authAPI.resetPass(resetToken, f.newPass)
          toast('Password reset successfully!')
          setView('login'); setStep(1)
        }
      }
    } catch(err) {
      toast(err.message || 'Something went wrong', 'e')
    } finally {
      setBusy(false)
    }
  }

  if (view === 'landing') {
    return <Landing onSelectRole={handleSelectRole}/>
  }

  const roleHint = role ? ROLE_HINTS[role] : null

  return (
    <div className="auth-bg">
      <div style={{ position:'absolute', top:'12%', left:'8%', width:280, height:280, background:'radial-gradient(circle,rgba(34,211,238,.06),transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'12%', right:'8%', width:340, height:340, background:'radial-gradient(circle,rgba(167,139,250,.05),transparent 70%)', pointerEvents:'none' }}/>

      <button
        onClick={() => setView('landing')}
        style={{ position:'fixed', top:20, left:24, display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--t2)', background:'var(--bg1)', border:'1px solid var(--b0)', padding:'7px 13px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', transition:'.18s', zIndex:10 }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Home
      </button>

      <div className="auth-card">
        <div style={{ textAlign:'center', marginBottom:22 }}>
          <div style={{ width:48, height:48, background:'linear-gradient(135deg,var(--cy),#0891b2)', borderRadius:12, display:'grid', placeItems:'center', margin:'0 auto 12px', boxShadow:'0 0 24px rgba(34,211,238,.3)', animation:'glow 3s infinite' }}>
            <Ico n="archive" size={22} color="white"/>
          </div>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'var(--t0)' }}>CoreInventory</div>
          <div style={{ fontSize:10, color:'var(--t2)', marginTop:3, letterSpacing:'.12em' }}>ENTERPRISE STOCK MANAGEMENT v2.0</div>
        </div>

        {roleHint && view === 'login' && (
          <div style={{ display:'flex', alignItems:'center', gap:10, background:roleHint.bg, border:'1px solid ' + roleHint.border, borderRadius:9, padding:'10px 14px', marginBottom:18 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:roleHint.color + '20', display:'grid', placeItems:'center', border:'1px solid ' + roleHint.border, flexShrink:0 }}>
              <Ico n={roleHint.icon} size={16} color={roleHint.color}/>
            </div>
            <div>
              <div style={{ fontSize:11.5, fontWeight:700, color:roleHint.color }}>{roleHint.label} Sign In</div>
              <div style={{ fontSize:10, color:'var(--t2)' }}>Demo credentials pre-filled below</div>
            </div>
          </div>
        )}

        {view !== 'otp' && (
          <div className="tabs" style={{ marginBottom:18 }}>
            <div className={'tab' + (view==='login'?' act':'')} onClick={() => setView('login')}>Sign In</div>
            <div className={'tab' + (view==='signup'?' act':'')} onClick={() => { setView('signup'); setRole(null); setF(x => ({ ...x, email:'', password:'', name:'' })) }}>Sign Up</div>
          </div>
        )}

        {view==='login' && <>
          <div className="fg"><label className="lbl">Email</label><input className="inp" name="email" type="email" value={f.email} onChange={h} placeholder="your@email.com"/></div>
          <div className="fg"><label className="lbl">Password</label><input className="inp" name="password" type="password" value={f.password} onChange={h} placeholder="Enter password" onKeyDown={e=>e.key==='Enter'&&submit()}/></div>
          <button className="btn bp" style={{ width:'100%', justifyContent:'center', padding:10, opacity:busy?.6:1 }} onClick={submit} disabled={busy}>{busy?'Signing in...':'Sign in to Dashboard'}</button>
          <div style={{ textAlign:'center', marginTop:12 }}>
            <span style={{ fontSize:12, color:'var(--cy)', cursor:'pointer' }} onClick={() => { setView('otp'); setStep(1) }}>Forgot password?</span>
          </div>
          <div style={{ marginTop:14, padding:10, background:'var(--bg0)', borderRadius:7, border:'1px solid var(--b0)', fontSize:11, color:'var(--t2)' }}>
            <div style={{ fontWeight:700, marginBottom:5, color:'var(--t1)' }}>Demo Accounts — Click to fill:</div>
            {Object.entries(ROLE_HINTS).map(([key, r]) => (
              <div key={key} onClick={() => { setRole(key); setF(x => ({ ...x, email:r.email, password:r.password })) }}
                style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', cursor:'pointer', borderRadius:4 }}>
                <span style={{ color:r.color, fontWeight:600 }}>{r.label}</span>
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10 }}>{r.password}</span>
              </div>
            ))}
          </div>
        </>}

        {view==='signup' && <>
          <div className="fg"><label className="lbl">Full Name</label><input className="inp" name="name" value={f.name} onChange={h} placeholder="Your name"/></div>
          <div className="fg"><label className="lbl">Email</label><input className="inp" name="email" type="email" value={f.email} onChange={h} placeholder="you@company.com"/></div>
          <div className="fg"><label className="lbl">Password</label><input className="inp" name="password" type="password" value={f.password} onChange={h} placeholder="Min 6 characters" onKeyDown={e=>e.key==='Enter'&&submit()}/></div>
          <button className="btn bp" style={{ width:'100%', justifyContent:'center', padding:10, opacity:busy?.6:1 }} onClick={submit} disabled={busy}>{busy?'Creating...':'Create Account'}</button>
          <div style={{ marginTop:10, fontSize:11, color:'var(--t2)', textAlign:'center' }}>
            New accounts default to <span style={{ color:'var(--gn)', fontWeight:600 }}>Warehouse Staff</span> role. Admin can upgrade.
          </div>
        </>}

        {view==='otp' && <>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:15, color:'var(--t0)', marginBottom:4 }}>Reset Password</div>
          <div style={{ fontSize:12, color:'var(--t2)', marginBottom:14 }}>
            {step===1 && 'Enter your registered email to receive an OTP.'}
            {step===2 && 'Enter the 6-digit OTP sent to ' + f.email}
            {step===3 && 'Set your new password.'}
          </div>
          <div style={{ display:'flex', gap:5, marginBottom:14 }}>
            {[1,2,3].map(n => (<div key={n} style={{ flex:1, height:3, borderRadius:2, background: step>=n ? 'var(--cy)' : 'var(--b0)', transition:'.3s' }}/>))}
          </div>
          {step===1 && <div className="fg"><label className="lbl">Email</label><input className="inp" name="email" type="email" value={f.email} onChange={h} placeholder="your@email.com"/></div>}
          {step===2 && <div className="fg"><label className="lbl">OTP Code</label><input className="inp" name="otp" value={f.otp} onChange={h} placeholder="000000" maxLength={6} style={{ textAlign:'center', letterSpacing:'.3em', fontSize:22, fontFamily:'JetBrains Mono,monospace' }} onKeyDown={e=>e.key==='Enter'&&submit()}/></div>}
          {step===3 && <div className="fg"><label className="lbl">New Password</label><input className="inp" name="newPass" type="password" value={f.newPass} onChange={h} placeholder="Min 6 characters" onKeyDown={e=>e.key==='Enter'&&submit()}/></div>}
          <button className="btn bp" style={{ width:'100%', justifyContent:'center', padding:10, opacity:busy?.6:1 }} onClick={submit} disabled={busy}>
            {busy?'Please wait...':step===1?'Send OTP to Email':step===2?'Verify OTP':'Reset Password'}
          </button>
          <div style={{ textAlign:'center', marginTop:12 }}>
            <span style={{ fontSize:12, color:'var(--cy)', cursor:'pointer' }} onClick={() => { setView('login'); setStep(1) }}>Back to login</span>
          </div>
        </>}
      </div>
    </div>
  )
}
