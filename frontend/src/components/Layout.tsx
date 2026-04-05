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
    <div className="h-screen flex overflow-hidden" style={{ background: '#f5f0e8' }}>
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 flex flex-col print:hidden"
        style={{ background: '#ede8dc', borderRight: '1px solid #d4caba' }}>

        {/* Brand */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid #d4caba' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#1a1a18' }}>
              <Sparkles size={14} style={{ color: '#f5f0e8' }} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: '#0f0f0d' }}>Resume Telling</p>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: '#9a9288' }}>AI-powered</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 pt-6 pb-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <Link key={to} to={to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={active ? {
                  background: 'rgba(0,0,0,0.08)',
                  color: '#0f0f0d',
                  border: '1px solid rgba(0,0,0,0.1)',
                } : {
                  color: '#7a7268',
                  border: '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#0f0f0d' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#7a7268' }}
              >
                <Icon size={16} style={{ color: active ? '#0f0f0d' : '#9a9288' }} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4" style={{ borderTop: '1px solid #d4caba' }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: '#7a7268', border: '1px solid transparent' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0f0f0d'}
            onMouseLeave={e => e.currentTarget.style.color = '#7a7268'}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  )
}
