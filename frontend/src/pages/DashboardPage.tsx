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
      <div className="flex-1 overflow-y-auto p-10">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#0f0f0d' }}>Resume Versions</h1>
              <p className="text-base mt-2" style={{ color: '#7a7268' }}>Manage and tailor your resume versions for each application</p>
            </div>
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 text-sm font-semibold px-8 py-4 rounded-xl transition-all whitespace-nowrap shrink-0"
              style={{
                background: '#1a1a18',
                color: '#f5f0e8',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2a2a28')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a1a18')}>
              <Plus size={16} /> Upload Resume
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm py-16 justify-center" style={{ color: '#7a7268' }}>
              <Loader2 size={18} className="animate-spin" /> Loading your resumes…
            </div>
          ) : resumes.length === 0 ? (
            /* Empty state */
            <div className="rounded-2xl py-28 px-8 text-center"
              style={{ border: '2px dashed #d4caba' }}>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                style={{ background: '#f0ebe2', border: '1px solid #d4caba' }}>
                <FileText size={36} style={{ color: '#9a9288' }} />
              </div>
              <p className="text-xl font-semibold mb-3" style={{ color: '#0f0f0d' }}>No resume versions yet</p>
              <p className="text-base mb-8 max-w-sm mx-auto" style={{ color: '#7a7268' }}>
                Upload a PDF, DOCX, or paste plain text to get started. AI will parse and structure your resume instantly.
              </p>
              <button onClick={() => setShowUpload(true)}
                className="text-sm font-semibold px-8 py-4 rounded-xl transition-all"
                style={{ background: '#1a1a18', color: '#f5f0e8', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2a2a28')}
                onMouseLeave={e => (e.currentTarget.style.background = '#1a1a18')}>
                Upload your first resume
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {resumes.map(r => {
                const accent = LABEL_ACCENT[r.label] ?? LABEL_ACCENT.general
                return (
                  <div key={r.resume_id} onClick={() => navigate(`/resume/${r.resume_id}`)}
                    className="group relative rounded-2xl cursor-pointer transition-all duration-200"
                    style={{ background: '#eae5da', border: '1px solid #d4caba' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#d4caba'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}>

                    {/* Top accent strip */}
                    <div className="h-1 w-full"
                      style={{ background: `linear-gradient(90deg, ${accent}90 0%, transparent 100%)` }} />

                    <div className="p-7">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}>
                          <FileText size={22} style={{ color: accent }} />
                        </div>
                        <button onClick={e => handleDelete(r.resume_id, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all"
                          style={{ color: '#9a9288' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(185,28,28,0.12)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#9a9288'; e.currentTarget.style.background = 'transparent' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <h3 className="font-semibold text-base mb-1.5 truncate" style={{ color: '#0f0f0d' }}>{r.version_name}</h3>
                      {r.name && <p className="text-sm mb-6 truncate" style={{ color: '#7a7268' }}>{r.name}</p>}

                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${LABEL_COLORS[r.label] ?? LABEL_COLORS.general}`}>
                          <Tag size={10} /> {r.label}
                        </span>
                        <ArrowRight size={16} className="transition-colors group-hover:translate-x-0.5 transition-transform"
                          style={{ color: '#9a9288' }}
                        />
                      </div>

                      <p className="text-xs mt-5" style={{ color: '#b0a898' }}>
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
