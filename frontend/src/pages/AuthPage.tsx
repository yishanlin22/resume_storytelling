import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/client'
import { Loader2, Sparkles } from 'lucide-react'

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

  const inputStyle = {
    background: '#f8f4ec',
    border: '1px solid #d4caba',
    color: '#0f0f0d',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#f5f0e8' }}>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: '#1a1a18', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <Sparkles size={24} style={{ color: '#f5f0e8' }} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#0f0f0d' }}>Resume Telling</h1>
          <p className="text-sm" style={{ color: '#7a7268' }}>Your AI-powered resume & interview toolkit</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: '#ede8dc',
            border: '1px solid #d4caba',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>

          {/* Tab toggle */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#e4ddd0', border: '1px solid #d4caba' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className="flex-1 py-3.5 rounded-lg text-base font-medium transition-all"
                style={mode === m ? {
                  background: '#1a1a18',
                  color: '#f5f0e8',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                } : { color: '#7a7268' }}
                onMouseEnter={e => { if (mode !== m) e.currentTarget.style.color = '#0f0f0d' }}
                onMouseLeave={e => { if (mode !== m) e.currentTarget.style.color = '#7a7268' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#4a4540' }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl px-5 py-4 text-base placeholder-[#b0a898] outline-none transition-all"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#4a4540' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full rounded-xl px-5 py-4 text-base placeholder-[#b0a898] outline-none transition-all"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#4a4540' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full rounded-xl px-5 py-4 text-base placeholder-[#b0a898] outline-none transition-all"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
              />
            </div>

            {error && (
              <div className="text-sm rounded-xl px-4 py-3"
                style={{ background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.2)', color: '#b91c1c' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full font-semibold py-4 rounded-xl text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: '#1a1a18',
                color: '#f5f0e8',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#2a2a28') }}
              onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = '#1a1a18') }}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#b0a898' }}>
          Built for hackathon · Powered by Claude AI
        </p>
      </div>
    </div>
  )
}
