import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { listResumes, deleteResume, type ResumeListItem } from '../api/client'
import Layout from '../components/Layout'
import UploadModal from '../components/UploadModal'
import { Plus, FileText, Trash2, ArrowRight, Tag, Loader2 } from 'lucide-react'

export const LABEL_COLORS: Record<string, string> = {
  general:    'bg-[#ede8dc] text-[#7a7268] border border-[#d4caba]',
  swe:        'bg-blue-950/60 text-blue-300 border border-blue-900/40',
  faang:      'bg-sky-950/60 text-sky-300 border border-sky-900/40',
  startup:    'bg-orange-950/60 text-orange-300 border border-orange-900/40',
  fintech:    'bg-emerald-950/60 text-emerald-300 border border-emerald-900/40',
  quant:      'bg-teal-950/60 text-teal-300 border border-teal-900/40',
  'ml-ai':    'bg-violet-950/60 text-violet-300 border border-violet-900/40',
  data:       'bg-cyan-950/60 text-cyan-300 border border-cyan-900/40',
  research:   'bg-amber-950/60 text-amber-300 border border-amber-900/40',
  uiux:       'bg-pink-950/60 text-pink-300 border border-pink-900/40',
  pm:         'bg-rose-950/60 text-rose-300 border border-rose-900/40',
  consulting: 'bg-lime-950/60 text-lime-300 border border-lime-900/40',
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
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#0f0f0d' }}>Resume Versions</h1>
            <p className="text-sm mt-1.5" style={{ color: '#7a7268' }}>Manage and tailor your resume versions</p>
          </div>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl transition-all whitespace-nowrap shrink-0"
            style={{
              background: '#1a1a18',
              color: '#f5f0e8',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a28')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1a18')}>
            <Plus size={16} /> Upload Resume
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#7a7268' }}>
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : resumes.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl p-24 text-center"
            style={{ border: '1px dashed #d4caba' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
              style={{ background: '#f0ebe2', border: '1px solid #d4caba' }}>
              <FileText size={28} style={{ color: '#9a9288' }} />
            </div>
            <p className="font-semibold mb-2" style={{ color: '#0f0f0d' }}>No resume versions yet</p>
            <p className="text-sm mb-7" style={{ color: '#7a7268' }}>Upload a PDF, DOCX, or paste plain text to get started</p>
            <button onClick={() => setShowUpload(true)}
              className="text-sm font-semibold px-6 py-3.5 rounded-xl transition-all"
              style={{ background: '#1a1a18', color: '#f5f0e8', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2a2a28')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a1a18')}>
              Upload your first resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {resumes.map(r => {
              const accent = LABEL_ACCENT[r.label] ?? LABEL_ACCENT.general
              return (
                <div key={r.resume_id} onClick={() => navigate(`/resume/${r.resume_id}`)}
                  className="group relative rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden"
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
                  <div className="h-0.5 w-full"
                    style={{ background: `linear-gradient(90deg, ${accent}70 0%, transparent 100%)` }} />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
                        <FileText size={18} style={{ color: accent }} />
                      </div>
                      <button onClick={e => handleDelete(r.resume_id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                        style={{ color: '#9a9288' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.background = 'rgba(185,28,28,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#9a9288'; e.currentTarget.style.background = 'transparent' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: '#0f0f0d' }}>{r.version_name}</h3>
                    {r.name && <p className="text-xs mb-5 truncate" style={{ color: '#7a7268' }}>{r.name}</p>}

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${LABEL_COLORS[r.label] ?? LABEL_COLORS.general}`}>
                        <Tag size={9} /> {r.label}
                      </span>
                      <ArrowRight size={14} className="transition-colors"
                        style={{ color: '#9a9288' }}
                      />
                    </div>

                    <p className="text-xs mt-4" style={{ color: '#9a9288' }}>
                      {new Date(r.updated_at + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
