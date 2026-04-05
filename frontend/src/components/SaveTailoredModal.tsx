import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { saveTailoredResume, type ParsedResume } from '../api/client'

interface Props {
  resumeId: string
  tailoredParsed: ParsedResume
  currentVersionName: string
  onClose: () => void
  onSaved: (newId?: string) => void
}

export default function SaveTailoredModal({ resumeId, tailoredParsed, currentVersionName, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<'overwrite' | 'new'>('new')
  const [newName, setNewName] = useState(currentVersionName + ' (Tailored)')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      const res = await saveTailoredResume({
        resume_id: resumeId,
        tailored_parsed: tailoredParsed,
        save_as_new: mode === 'new',
        new_version_name: mode === 'new' ? newName : undefined,
      }) as { resume_id?: string }
      onSaved(res?.resume_id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(15,15,13,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: '#ede8dc', border: '1px solid #d4caba' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #d4caba' }}>
          <h2 className="font-semibold tracking-tight" style={{ color: '#0f0f0d' }}>Save Tailored Resume</h2>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#7a7268' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}>
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tab toggle */}
          <div className="flex rounded-xl p-1" style={{ background: '#eae5da', border: '1px solid #d4caba' }}>
            {(['new', 'overwrite'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-3.5 rounded-lg text-base font-medium transition-all"
                style={mode === m
                  ? { background: '#1a1a18', color: '#f5f0e8', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
                  : { color: '#7a7268' }}
                onMouseEnter={e => { if (mode !== m) e.currentTarget.style.color = '#0f0f0d' }}
                onMouseLeave={e => { if (mode !== m) e.currentTarget.style.color = '#7a7268' }}>
                {m === 'new' ? 'Save as New Version' : 'Overwrite Current'}
              </button>
            ))}
          </div>

          {mode === 'new' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#9a9288' }}>
                New version name
              </label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                className="w-full rounded-xl px-4 py-4 text-base focus:outline-none transition-colors placeholder-[#b0a898]"
                style={{ background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')} />
            </div>
          )}

          {mode === 'overwrite' && (
            <div className="rounded-xl px-4 py-3"
              style={{ background: 'rgba(120,53,15,0.15)', border: '1px solid rgba(146,64,14,0.3)' }}>
              <p className="text-sm" style={{ color: 'rgba(252,211,77,0.85)' }}>
                This will replace the current resume content. The original text is still preserved.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-4 rounded-xl text-base font-medium transition-all"
              style={{ border: '1px solid #d4caba', color: '#7a7268' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b0a898' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: '#1a1a18', color: '#f5f0e8', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2a2a28' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1a1a18' }}>
              {loading ? <><Loader2 size={14} className="animate-spin" />Saving…</> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
