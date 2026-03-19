import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Search, Users, LogOut, Cpu, UserCircle } from 'lucide-react'
import MyUploadsView  from './MyUploadsView'
import SearchPageView from './SearchPageView'
import CommunityView  from './CommunityView'
import ProfileView    from './ProfileView'

const NAV = [
  { id: 'uploads',   icon: Upload,      label: 'My Files'    },
  { id: 'search',    icon: Search,      label: 'Deep Search'  },
  { id: 'community', icon: Users,       label: 'Community'    },
]

export default function Dashboard({ userRole }) {
  const navigate  = useNavigate()
  const [view, setView] = useState('uploads')

  // Redirect admins to admin dashboard
  React.useEffect(() => {
    if (userRole === 'Admin') {
      navigate('/admin', { replace: true })
    }
  }, [userRole, navigate])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('codec_token')
    localStorage.removeItem('codec_user')
    navigate('/login', { replace: true })
  }, [navigate])

  const renderView = () => {
    if (view === 'uploads')   return <MyUploadsView  userRole={userRole} />
    if (view === 'search')    return <SearchPageView />
    if (view === 'community') return <CommunityView />
    if (view === 'profile')   return <ProfileView />
    return null
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: '#e5e7eb' }}
    >
      {/* ── Sidebar ── */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        height: '100vh', position: 'sticky', top: 0, overflow: 'hidden',
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Brand */}
        <div style={{ padding: '28px 24px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={13} color="#e5e7eb" />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb', letterSpacing: '-0.3px' }}>Codec</span>
          </div>
          <p style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: '#374151', letterSpacing: '0.18em', paddingLeft: 36 }}>
            RGIPT · REPOSITORY
          </p>
        </div>

        {/* Role chip */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{
            fontSize: 9, fontFamily: "'DM Mono', monospace",
            color: '#6b7280', letterSpacing: '0.14em',
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.03)',
            padding: '3px 10px', borderRadius: 4,
            textTransform: 'uppercase',
          }}>
            {userRole ?? 'Professor'} · Active
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = view === id
            return (
              <button key={id} onClick={() => setView(id)} style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '9px 12px', borderRadius: 8, border: 'none',
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                borderLeft: active ? '2px solid rgba(255,255,255,0.35)' : '2px solid transparent',
                color: active ? '#f9fafb' : '#4b5563',
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#9ca3af' }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4b5563' }}}
              >
                <Icon size={14} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Profile + Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Profile button */}
          <button onClick={() => setView('profile')} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 11,
            padding: '9px 12px', borderRadius: 8, border: 'none',
            background: view === 'profile' ? 'rgba(255,255,255,0.07)' : 'transparent',
            borderLeft: view === 'profile' ? '2px solid rgba(255,255,255,0.35)' : '2px solid transparent',
            color: view === 'profile' ? '#f9fafb' : '#4b5563',
            fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
          }}
            onMouseEnter={e => { if (view !== 'profile') { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#9ca3af' }}}
            onMouseLeave={e => { if (view !== 'profile') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4b5563' }}}
          >
            <UserCircle size={14} /> Profile
          </button>

          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 11,
            padding: '9px 12px', borderRadius: 8, border: 'none',
            background: 'transparent', color: '#374151',
            fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,100,100,0.07)'; e.currentTarget.style.color = '#9ca3af' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── View ── */}
      <main style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {renderView()}
      </main>
    </div>
  )
}