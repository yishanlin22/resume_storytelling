import { useState, useRef } from 'react'
import { uploadResume } from '../api/client'
import { X, Upload, FileText, Loader2 } from 'lucide-react'

const LABELS = ['general', 'swe', 'faang', 'startup', 'fintech', 'quant', 'ml-ai', 'data', 'research', 'uiux', 'pm', 'consulting']

const INPUT: React.CSSProperties = { background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d', width: '100%', borderRadius: 10, padding: '14px 16px', fontSize: 15, outline: 'none', transition: 'border-color 0.15s' }
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)' }
const onBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#d4caba' }

interface Props { onClose: () => void; onUploaded: () => void }

export default function UploadModal({ onClose, onUploaded }: Props) {
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [plainText, setPlainText] = useState('')
  const [versionName, setVersionName] = useState('')
  const [label, setLabel] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const dragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }
  const drop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setMode('file') } }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (mode === 'file' && !file) { setError('Please select a file'); return }
    if (mode === 'text' && !plainText.trim()) { setError('Please paste your resume text'); return }
    setLoading(true)
    try {
      await uploadResume({
        file: mode === 'file' ? file! : undefined,
        plain_text: mode === 'text' ? plainText : undefined,
        version_name: versionName || (file?.name.replace(/\.[^.]+$/, '') ?? 'My Resume'),
        label,
      })
      onUploaded()
    } catch {
      setError('Upload failed — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(15,15,13,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg" style={{ background: '#ede8dc', border: '1px solid #d4caba', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: '24px 28px', borderBottom: '1px solid #d4caba' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f0f0d' }}>Upload Resume</h2>
          <button onClick={onClose} style={{ color: '#9a9288', padding: 6, borderRadius: 8, lineHeight: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Tab toggle */}
          <div style={{ display: 'flex', background: '#e4ddd0', border: '1px solid #d4caba', borderRadius: 10, padding: 5, gap: 4 }}>
            {(['file', 'text'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  ...(mode === m ? { background: '#1a1a18', color: '#f5f0e8' } : { background: 'transparent', color: '#7a7268' }) }}>
                {m === 'file' ? 'Upload File' : 'Paste Text'}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          {mode === 'file' && (
            <div onDragOver={dragOver} onDrop={drop} onClick={() => fileRef.current?.click()}
              style={{ border: '1.5px dashed #c8bfb0', borderRadius: 10, padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: '#f0ebe2', transition: 'all 0.15s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(0,0,0,0.3)'; el.style.background = '#eae5da' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#c8bfb0'; el.style.background = '#f0ebe2' }}>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#0f0f0d' }}>
                  <FileText size={20} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{file.name}</span>
                </div>
              ) : (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: '#e4ddd0', border: '1px solid #d4caba', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <Upload size={20} color="#7a7268" />
                  </div>
                  <p style={{ fontSize: 14, color: '#4a4540' }}>Drop your resume here, or <strong>browse</strong></p>
                  <p style={{ fontSize: 12, color: '#b0a898', marginTop: 6 }}>PDF, DOCX, or TXT — up to 10 MB</p>
                </>
              )}
            </div>
          )}

          {/* Paste text */}
          {mode === 'text' && (
            <textarea value={plainText} onChange={e => setPlainText(e.target.value)}
              placeholder="Paste your resume text here…" rows={8}
              style={{ ...INPUT, resize: 'none' }} onFocus={onFocus} onBlur={onBlur} />
          )}

          {/* Version name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9288' }}>Version Name</label>
            <input type="text" value={versionName} onChange={e => setVersionName(e.target.value)}
              placeholder="e.g. Tech Companies v1"
              style={INPUT} onFocus={onFocus} onBlur={onBlur} />
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9288' }}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LABELS.map(l => (
                <button key={l} type="button" onClick={() => setLabel(l)}
                  style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                    ...(label === l
                      ? { background: '#1a1a18', color: '#f5f0e8', borderColor: '#1a1a18' }
                      : { background: '#f0ebe2', color: '#4a4540', borderColor: '#d4caba' }) }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#b91c1c', background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 8, padding: '12px 16px' }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '14px 0', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', border: '1px solid #d4caba', background: 'transparent', color: '#7a7268', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b0a898' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 1, padding: '14px 0', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: '#1a1a18', color: '#f5f0e8', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2a2a28' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#1a1a18' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" />Parsing…</> : 'Upload & Parse'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
