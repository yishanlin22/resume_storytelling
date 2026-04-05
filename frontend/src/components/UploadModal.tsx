import { useState, useRef } from 'react'
import { uploadResume } from '../api/client'
import { X, Upload, FileText, Loader2 } from 'lucide-react'

const LABELS = ['general', 'swe', 'faang', 'startup', 'fintech', 'quant', 'ml-ai', 'data', 'research', 'uiux', 'pm', 'consulting']

interface Props {
  onClose: () => void
  onUploaded: () => void
}

export default function UploadModal({ onClose, onUploaded }: Props) {
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [plainText, setPlainText] = useState('')
  const [versionName, setVersionName] = useState('')
  const [label, setLabel] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const inputStyle = { background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d' }
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)' }
  const onBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#d4caba' }

  const dragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }
  const drop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setMode('file') }
  }

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
      <div className="w-full max-w-xl rounded-2xl shadow-2xl"
        style={{ background: '#ede8dc', border: '1px solid #d4caba', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5"
          style={{ borderBottom: '1px solid #d4caba' }}>
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: '#0f0f0d' }}>Upload Resume</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#9a9288' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Tab toggle */}
          <div className="flex rounded-xl p-1.5" style={{ background: '#e4ddd0', border: '1px solid #d4caba' }}>
            {(['file', 'text'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className="flex-1 py-3.5 rounded-lg text-base font-medium transition-all"
                style={mode === m
                  ? { background: '#1a1a18', color: '#f5f0e8', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }
                  : { color: '#7a7268' }}
                onMouseEnter={e => { if (mode !== m) e.currentTarget.style.color = '#0f0f0d' }}
                onMouseLeave={e => { if (mode !== m) e.currentTarget.style.color = '#7a7268' }}>
                {m === 'file' ? 'Upload File' : 'Paste Text'}
              </button>
            ))}
          </div>

          {/* File drop zone */}
          {mode === 'file' && (
            <div onDragOver={dragOver} onDrop={drop} onClick={() => fileRef.current?.click()}
              className="rounded-xl py-14 px-8 text-center cursor-pointer transition-all"
              style={{ border: '2px dashed #c8bfb0', background: '#f0ebe2' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(0,0,0,0.3)'; el.style.background = '#eae5da' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#c8bfb0'; el.style.background = '#f0ebe2' }}>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
              {file ? (
                <div className="flex items-center justify-center gap-3" style={{ color: '#0f0f0d' }}>
                  <FileText size={24} />
                  <span className="text-base font-medium">{file.name}</span>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: '#e4ddd0', border: '1px solid #d4caba' }}>
                    <Upload size={24} style={{ color: '#7a7268' }} />
                  </div>
                  <p className="text-base font-medium" style={{ color: '#4a4540' }}>
                    Drop your resume here, or <span style={{ color: '#0f0f0d' }}>browse</span>
                  </p>
                  <p className="text-sm mt-2" style={{ color: '#b0a898' }}>PDF, DOCX, or TXT — up to 10 MB</p>
                </>
              )}
            </div>
          )}

          {/* Paste text */}
          {mode === 'text' && (
            <textarea value={plainText} onChange={e => setPlainText(e.target.value)}
              placeholder="Paste your resume text here…" rows={10}
              className="w-full rounded-xl px-4 py-3.5 text-base resize-none focus:outline-none transition-colors placeholder-[#b0a898]"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          )}

          {/* Version name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#9a9288' }}>
              Version Name
            </label>
            <input type="text" value={versionName} onChange={e => setVersionName(e.target.value)}
              placeholder="e.g. Tech Companies v1"
              className="w-full rounded-xl px-4 py-3.5 text-base focus:outline-none transition-colors placeholder-[#b0a898]"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>

          {/* Category chips */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9a9288' }}>
              Category
            </label>
            <div className="flex flex-wrap gap-2.5">
              {LABELS.map(l => (
                <button key={l} type="button" onClick={() => setLabel(l)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={label === l
                    ? { background: '#1a1a18', color: '#f5f0e8', border: '1px solid transparent' }
                    : { background: '#f0ebe2', border: '1px solid #d4caba', color: '#7a7268' }}
                  onMouseEnter={e => { if (label !== l) e.currentTarget.style.color = '#0f0f0d' }}
                  onMouseLeave={e => { if (label !== l) e.currentTarget.style.color = '#7a7268' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm px-4 py-3 rounded-xl" style={{ color: '#b91c1c', background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.2)' }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-4 rounded-xl text-base font-medium transition-all"
              style={{ border: '1px solid #d4caba', color: '#7a7268', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b0a898' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: '#1a1a18', color: '#f5f0e8', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2a2a28' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1a1a18' }}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" />Parsing with AI…</>
                : 'Upload & Parse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
