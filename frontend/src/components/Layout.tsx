import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../api/client'
import { FileText, Briefcase, MessageSquare, LogOut, Sparkles } from 'lucide-react'

const nav = [
  { to: '/dashboard',   label: 'Resumes',     icon: FileText },
  { to: '/experiences', label: 'Experiences', icon: Briefcase },
  { to: '/bq',          label: 'BQ Prep',     icon: MessageSquare },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() { logout(); navigate('/') }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'stretch', padding: 12, background: '#f5f0e8', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', borderRadius: 12, border: '1px solid #d4caba' }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#ede8dc', borderRight: '1px solid #d4caba' }}>

          {/* Brand */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid #d4caba' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#1a1a18' }}>
                <Sparkles size={14} style={{ color: '#f5f0e8' }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0f0f0d', lineHeight: 1.2 }}>Resume Telling</p>
                <p style={{ fontSize: 10, color: '#9a9288', lineHeight: 1.2, marginTop: 2 }}>AI-powered</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '20px 12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {nav.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to || location.pathname.startsWith(to + '/')
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    ...(active
                      ? { background: 'rgba(0,0,0,0.07)', color: '#0f0f0d', border: '1px solid rgba(0,0,0,0.08)' }
                      : { color: '#7a7268', border: '1px solid transparent' }),
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.background = 'rgba(0,0,0,0.04)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.background = 'transparent' } }}
                >
                  <Icon size={16} style={{ color: active ? '#0f0f0d' : '#9a9288', flexShrink: 0 }} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Sign out */}
          <div style={{ padding: '12px', borderTop: '1px solid #d4caba' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                border: '1px solid transparent',
                background: 'transparent',
                color: '#7a7268',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.background = 'transparent' }}
            >
              <LogOut size={16} style={{ flexShrink: 0 }} />
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#f5f0e8' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
