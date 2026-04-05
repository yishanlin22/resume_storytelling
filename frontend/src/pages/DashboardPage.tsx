import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listResumes, deleteResume, type ResumeListItem } from '../api/client'
import Layout from '../components/Layout'
import UploadModal from '../components/UploadModal'
import { Plus, FileText, Trash2, ArrowRight, Tag, Loader2 } from 'lucide-react'

export const LABEL_COLORS: Record<string, string> = {
  general:    'bg-[#ede8dc] text-[#7a7268] border border-[#d4caba]',
  swe:        'bg-blue-100 text-blue-800 border border-blue-200',
  faang:      'bg-sky-100 text-sky-800 border border-sky-200',
  startup:    'bg-orange-100 text-orange-800 border border-orange-200',
  fintech:    'bg-emerald-100 text-emerald-800 border border-emerald-200',
  quant:      'bg-teal-100 text-teal-800 border border-teal-200',
  'ml-ai':    'bg-violet-100 text-violet-800 border border-violet-200',
  data:       'bg-cyan-100 text-cyan-800 border border-cyan-200',
  research:   'bg-amber-100 text-amber-800 border border-amber-200',
  uiux:       'bg-pink-100 text-pink-800 border border-pink-200',
  pm:         'bg-rose-100 text-rose-800 border border-rose-200',
  consulting: 'bg-lime-100 text-lime-800 border border-lime-200',
}

const LABEL_ACCENT: Record<string, string> = {
  general:    '#7a7268',
  swe:        '#3b82f6',
  faang:      '#0ea5e9',
  startup:    '#f97316',
  fintech:    '#10b981',
  quant:      '#14b8a6',
  'ml-ai':    '#8b5cf6',
  data:       '#06b6d4',
  research:   '#f59e0b',
  uiux:       '#ec4899',
  pm:         '#f43f5e',
  consulting: '#84cc16',
}

export default function DashboardPage() {
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    try {
      const data = await listResumes()
      setResumes(Array.isArray(data) ? data : [])
    } catch {
      setResumes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this resume version?')) return
    await deleteResume(id)
    setResumes(prev => prev.filter(r => r.resume_id !== id))
  }

  return (
    <Layout>
      <div style={{ flex: 1, overflowY: 'auto', padding: 32, position: 'relative' }}>

        {/* Upload button — top-right */}
        <div style={{ position: 'absolute', top: 24, right: 32 }}>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: '#1a1a18', color: '#f5f0e8', border: 'none', cursor: 'pointer',
              transition: 'background 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a28')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1a18')}
          >
            <Plus size={15} /> Upload Resume
          </button>
        </div>

        <div style={{ maxWidth: 896, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0f0d', margin: 0 }}>Resume Versions</h1>
            <p style={{ fontSize: 15, color: '#7a7268', marginTop: 8 }}>Manage and tailor your resume versions for each application</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#7a7268', justifyContent: 'center', padding: '64px 0' }}>
              <Loader2 size={18} className="animate-spin" /> Loading your resumes…
            </div>
          ) : resumes.length === 0 ? (
            /* Empty state */
            <div style={{ border: '2px dashed #d4caba', borderRadius: 16, padding: '112px 32px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 80, height: 80, borderRadius: 16, marginBottom: 24, background: '#f0ebe2', border: '1px solid #d4caba' }}>
                <FileText size={36} style={{ color: '#9a9288' }} />
              </div>
              <p style={{ fontSize: 20, fontWeight: 600, color: '#0f0f0d', marginBottom: 12 }}>No resume versions yet</p>
              <p style={{ fontSize: 15, color: '#7a7268', marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
                Upload a PDF, DOCX, or paste plain text to get started. AI will parse and structure your resume instantly.
              </p>
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                  background: '#1a1a18', color: '#f5f0e8', border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2a2a28')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1a1a18')}
              >
                Upload your first resume
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {resumes.map(r => {
                const accent = LABEL_ACCENT[r.label] ?? LABEL_ACCENT.general
                return (
                  <div
                    key={r.resume_id}
                    onClick={() => navigate(`/resume/${r.resume_id}`)}
                    style={{
                      position: 'relative', borderRadius: 12, cursor: 'pointer',
                      background: '#eae5da', border: '1px solid #d4caba',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderColor = 'rgba(0,0,0,0.2)'
                      el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'
                      el.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderColor = '#d4caba'
                      el.style.boxShadow = 'none'
                      el.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ padding: 28 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${accent}18`, border: `1px solid ${accent}30` }}>
                          <FileText size={22} style={{ color: accent }} />
                        </div>
                        <button
                          onClick={e => handleDelete(r.resume_id, e)}
                          style={{ padding: '6px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9a9288', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(185,28,28,0.12)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#9a9288'; e.currentTarget.style.background = 'transparent' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <h3 style={{ fontWeight: 600, fontSize: 15, color: '#0f0f0d', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.version_name}</h3>
                      {r.name && <p style={{ fontSize: 14, color: '#7a7268', marginBottom: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: r.name ? 0 : 20 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 10px', borderRadius: 20, fontWeight: 500, background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>
                          <Tag size={10} /> {r.label}
                        </span>
                        <ArrowRight size={16} style={{ color: '#9a9288' }} />
                      </div>

                      <p style={{ fontSize: 12, color: '#b0a898', marginTop: 16 }}>
                        {new Date(r.updated_at + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); load() }}
        />
      )}
    </Layout>
  )
}
