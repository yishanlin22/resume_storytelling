import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/client'
import { Loader2, Sparkles } from 'lucide-react'

const INPUT: React.CSSProperties = {
  background: '#f8f4ec',
  border: '1px solid #d4caba',
  color: '#0f0f0d',
  width: '100%',
  borderRadius: 10,
  padding: '14px 16px',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)' }
const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#d4caba' }

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
        await login(email, password)
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown }; message?: string }
      const data = e?.response?.data as Record<string, unknown> | undefined
      const msg = (data?.detail as string) ?? (data?.message as string) ?? e?.message ?? 'Could not connect to server'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#f5f0e8' }}>

      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: '#1a1a18', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', marginBottom: 16 }}>
            <Sparkles size={24} style={{ color: '#f5f0e8' }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0f0d', margin: 0 }}>Resume Telling</h1>
          <p style={{ fontSize: 14, color: '#7a7268', marginTop: 6 }}>Your AI-powered resume &amp; interview toolkit</p>
        </div>

        {/* Card */}
        <div style={{ background: '#ede8dc', border: '1px solid #d4caba', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>

          {/* Tab toggle */}
          <div style={{ padding: '20px 28px 0' }}>
            <div style={{ display: 'flex', background: '#e4ddd0', border: '1px solid #d4caba', borderRadius: 10, padding: 5, gap: 4 }}>
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError('') }}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    ...(mode === m
                      ? { background: '#1a1a18', color: '#f5f0e8' }
                      : { background: 'transparent', color: '#7a7268' }),
                  }}
                  onMouseEnter={e => { if (mode !== m) e.currentTarget.style.color = '#0f0f0d' }}
                  onMouseLeave={e => { if (mode !== m) e.currentTarget.style.color = '#7a7268' }}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {mode === 'register' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9288' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9288' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={INPUT}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9288' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={INPUT}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#b91c1c', background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 8, padding: '12px 16px', margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: '#1a1a18',
                color: '#f5f0e8',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2a2a28' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1a1a18' }}
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#b0a898', marginTop: 24 }}>
          Built for hackathon · Powered by Claude AI
        </p>

      </div>
    </div>
  )
}
