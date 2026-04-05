import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import {
  listExperiences, addExperience, updateExperience, deleteExperience,
  importExperiencesFromResume, listResumes,
  type Experience, type ResumeListItem,
} from '../api/client'
import {
  Briefcase, Plus, Trash2, Edit2, X, Save, Loader2,
  BookOpen, ChevronDown, Download, Building2,
} from 'lucide-react'

// ─── Experience modal (add / edit) ────────────────────────────────────────────

interface ModalState {
  mode: 'add' | 'edit'
  exp?: Experience
}

function ExperienceModal({
  state, onClose, onSaved,
}: {
  state: ModalState
  onClose: () => void
  onSaved: () => void
}) {
  const editing = state.mode === 'edit' && state.exp
  const [company, setCompany]       = useState(editing ? state.exp!.company : '')
  const [role, setRole]             = useState(editing ? state.exp!.role : '')
  const [dates, setDates]           = useState(editing ? state.exp!.dates : '')
  const [location, setLocation]     = useState(editing ? state.exp!.location : '')
  const [description, setDesc]      = useState(editing ? state.exp!.description : '')
  const [bullets, setBullets]       = useState<string[]>(editing ? state.exp!.bullets : [''])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !role.trim()) { setError('Company and role are required'); return }
    setLoading(true); setError('')
    const cleanBullets = bullets.filter(b => b.trim())
    try {
      if (state.mode === 'add') {
        await addExperience({ company, role, dates, location, description, bullets: cleanBullets })
      } else {
        await updateExperience({ exp_id: state.exp!.exp_id, company, role, dates, location, description, bullets: cleanBullets })
      }
      onSaved()
    } catch {
      setError('Save failed — please try again')
    } finally {
      setLoading(false)
    }
  }

  function setBullet(i: number, v: string) {
    setBullets(prev => { const next = [...prev]; next[i] = v; return next })
  }
  function removeBullet(i: number) {
    setBullets(prev => prev.filter((_, idx) => idx !== i))
  }
  function addBullet() {
    setBullets(prev => [...prev, ''])
  }

  const inputStyle = {
    background: '#f8f4ec',
    border: '1px solid #d4caba',
    color: '#0f0f0d',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(15,15,13,0.5)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
        style={{
          background: '#ede8dc',
          border: '1px solid #d4caba',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-5 shrink-0"
          style={{ borderBottom: '1px solid #d4caba' }}
        >
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: '#0f0f0d' }}>
            {state.mode === 'add' ? 'Add Experience' : 'Edit Experience'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: '#7a7268' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-8 space-y-7 overflow-y-auto flex-1">
            {/* Company + Role */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9a9288' }}>
                  Company <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full rounded-xl px-4 py-3 text-sm placeholder-[#b0a898] focus:outline-none transition-colors"
                  style={{ ...inputStyle }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9a9288' }}>
                  Role <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full rounded-xl px-4 py-3 text-sm placeholder-[#b0a898] focus:outline-none transition-colors"
                  style={{ ...inputStyle }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
                />
              </div>
            </div>

            {/* Dates + Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9a9288' }}>
                  Dates
                </label>
                <input
                  value={dates}
                  onChange={e => setDates(e.target.value)}
                  placeholder="e.g. Jan 2022 – Present"
                  className="w-full rounded-xl px-4 py-3 text-sm placeholder-[#b0a898] focus:outline-none transition-colors"
                  style={{ ...inputStyle }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9a9288' }}>
                  Location
                </label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Seattle, WA"
                  className="w-full rounded-xl px-4 py-3 text-sm placeholder-[#b0a898] focus:outline-none transition-colors"
                  style={{ ...inputStyle }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#9a9288' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder="Briefly describe your role, team size, scope, key projects — used to build BQ stories"
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-sm placeholder-[#b0a898] focus:outline-none resize-none transition-colors"
                style={{ ...inputStyle }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
              />
            </div>

            {/* Bullets */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9a9288' }}>
                Key Accomplishments
              </label>
              <div className="space-y-2.5">
                {bullets.map((b, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="mt-3.5 shrink-0 text-xs" style={{ color: '#9a9288' }}>·</span>
                    <textarea
                      value={b}
                      onChange={e => setBullet(i, e.target.value)}
                      placeholder="e.g. Led migration of auth service, reducing latency by 40%"
                      rows={2}
                      className="flex-1 rounded-xl px-4 py-3 text-sm placeholder-[#b0a898] focus:outline-none resize-none transition-colors"
                      style={{ ...inputStyle }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
                    />
                    {bullets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBullet(i)}
                        className="mt-2.5 shrink-0 transition-colors"
                        style={{ color: '#9a9288' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBullet}
                  className="flex items-center gap-1.5 text-sm transition-colors mt-1 px-1"
                  style={{ color: '#7a7268' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
                >
                  <Plus size={14} /> Add bullet
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm px-4 py-3 rounded-xl" style={{ color: '#b91c1c', background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.2)' }}>
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex gap-3 px-8 py-5 shrink-0"
            style={{ borderTop: '1px solid #d4caba' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl text-base font-medium transition-all"
              style={{ border: '1px solid #d4caba', color: '#7a7268' }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#0f0f0d'
                e.currentTarget.style.borderColor = '#b0a898'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#7a7268'
                e.currentTarget.style.borderColor = '#d4caba'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 rounded-xl text-base font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: '#1a1a18',
                color: '#f5f0e8',
              }}
              onMouseEnter={e => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18'
              }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" />Saving…</>
                : <><Save size={16} />{state.mode === 'add' ? 'Add Experience' : 'Save Changes'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Import panel ─────────────────────────────────────────────────────────────

function ImportPanel({ onImported }: { onImported: (count: number) => void }) {
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    listResumes().then(r => { setResumes(Array.isArray(r) ? r : []); if (r[0]) setSelected(r[0].resume_id) })
  }, [])

  async function handleImport() {
    if (!selected) return
    setLoading(true)
    try {
      const res = await importExperiencesFromResume(selected) as { imported?: unknown[] }
      onImported(res?.imported?.length ?? 0)
    } finally {
      setLoading(false); setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all"
        style={{ border: '1px solid #d4caba', color: '#7a7268' }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#0f0f0d'
          e.currentTarget.style.borderColor = '#b0a898'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = '#7a7268'
          e.currentTarget.style.borderColor = '#d4caba'
        }}
      >
        <Download size={15} /> Import from Resume
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="appearance-none text-sm rounded-xl pl-4 pr-9 py-3 focus:outline-none transition-colors"
          style={{ background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d' }}
        >
          {resumes.map(r => (
            <option key={r.resume_id} value={r.resume_id}>{r.version_name}</option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-3.5 pointer-events-none" style={{ color: '#7a7268' }} />
      </div>
      <button
        onClick={handleImport}
        disabled={loading || !selected}
        className="px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
        style={{
          background: '#1a1a18',
          color: '#f5f0e8',
        }}
        onMouseEnter={e => {
          if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18'
        }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Import
      </button>
      <button
        onClick={() => setOpen(false)}
        className="transition-colors p-1"
        style={{ color: '#7a7268' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
        onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
      >
        <X size={18} />
      </button>
    </div>
  )
}

// ─── Experience card ──────────────────────────────────────────────────────────

function ExperienceCard({
  exp, onEdit, onDelete,
}: {
  exp: Experience
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="rounded-2xl p-7 transition-all group relative"
      style={{
        background: '#eae5da',
        border: '1px solid #d4caba',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(0,0,0,0.2)'
        el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = '#d4caba'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05))' }}
      />

      {/* Action buttons */}
      <div className="absolute top-5 right-5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          title="Edit"
          className="p-2 rounded-lg transition-colors"
          style={{ color: '#7a7268' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#0f0f0d'
            e.currentTarget.style.background = 'rgba(0,0,0,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#7a7268'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="p-2 rounded-lg transition-colors"
          style={{ color: '#7a7268' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f87171'
            e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#7a7268'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 mb-5 pr-20">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#f0ebe2', border: '1px solid #d4caba' }}
        >
          <Building2 size={18} style={{ color: '#7a7268' }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-base truncate" style={{ color: '#0f0f0d' }}>{exp.role}</p>
          <p className="text-sm truncate mt-0.5" style={{ color: '#4a4540' }}>
            {exp.company}{exp.location ? ` · ${exp.location}` : ''}
          </p>
          {exp.dates && (
            <p className="text-xs mt-1" style={{ color: '#9a9288' }}>{exp.dates}</p>
          )}
        </div>
      </div>

      {/* Description preview */}
      {exp.description && (
        <p className="text-sm mb-5 line-clamp-2 leading-relaxed" style={{ color: '#7a7268' }}>
          {exp.description}
        </p>
      )}

      {/* Bullets preview */}
      {exp.bullets?.length > 0 && (
        <ul className="space-y-1.5 mb-5">
          {exp.bullets.slice(0, 2).map((b, i) => (
            <li key={i} className="text-sm flex gap-2" style={{ color: '#7a7268' }}>
              <span className="shrink-0 mt-0.5" style={{ color: '#9a9288' }}>·</span>
              <span className="line-clamp-1">{b}</span>
            </li>
          ))}
          {exp.bullets.length > 2 && (
            <li className="text-xs" style={{ color: '#9a9288' }}>+{exp.bullets.length - 2} more</li>
          )}
        </ul>
      )}

      {/* Story count badge */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
        style={{ background: 'rgba(0,0,0,0.06)' }}
      >
        <BookOpen size={13} style={{ color: '#7a7268' }} />
        <span className="text-xs font-medium" style={{ color: '#7a7268' }}>
          {exp.story_count === 0 ? 'No stories yet' : `${exp.story_count} stor${exp.story_count !== 1 ? 'ies' : 'y'}`}
        </span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [importMsg, setImportMsg] = useState('')

  async function load() {
    setLoading(true)
    try {
      const data = await listExperiences()
      setExperiences(Array.isArray(data) ? data : [])
    } catch {
      setExperiences([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(exp_id: string) {
    if (!confirm('Delete this experience? Any stories attached to it will also be removed.')) return
    await deleteExperience(exp_id)
    setExperiences(prev => prev.filter(e => e.exp_id !== exp_id))
  }

  function handleImported(count: number) {
    setImportMsg(`Imported ${count} experience${count !== 1 ? 's' : ''} from resume.`)
    load()
    setTimeout(() => setImportMsg(''), 4000)
  }

  return (
    <Layout>
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-12">
            <div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ color: '#0f0f0d' }}
              >
                Experiences
              </h1>
              <p className="text-base mt-2" style={{ color: '#7a7268' }}>
                Your work history for BQ story prep — each experience can have multiple STAR stories
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ImportPanel onImported={handleImported} />
              <button
                onClick={() => setModal({ mode: 'add' })}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: '#1a1a18',
                  color: '#f5f0e8',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18'
                }}
              >
                <Plus size={16} /> Add Experience
              </button>
            </div>
          </div>

          {/* Import success message */}
          {importMsg && (
            <div
              className="mb-6 px-5 py-3.5 rounded-xl flex items-center justify-between"
              style={{
                background: 'rgba(6,78,59,0.2)',
                border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              <span className="text-sm" style={{ color: '#6ee7b7' }}>{importMsg}</span>
              <button
                onClick={() => setImportMsg('')}
                style={{ color: '#34d399' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6ee7b7')}
                onMouseLeave={e => (e.currentTarget.style.color = '#34d399')}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm py-16 justify-center" style={{ color: '#7a7268' }}>
              <Loader2 size={18} className="animate-spin" /> Loading experiences…
            </div>
          ) : experiences.length === 0 ? (
            <div
              className="rounded-2xl py-28 px-8 text-center"
              style={{ border: '2px dashed #d4caba' }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: '#f0ebe2', border: '1px solid #d4caba' }}
              >
                <Briefcase size={36} style={{ color: '#9a9288' }} />
              </div>
              <p className="text-xl font-semibold mb-3" style={{ color: '#0f0f0d' }}>No experiences yet</p>
              <p className="text-base mb-8 max-w-sm mx-auto" style={{ color: '#7a7268' }}>
                Add your work history manually or import directly from a resume you've uploaded
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setModal({ mode: 'add' })}
                  className="px-8 py-4 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: '#1a1a18',
                    color: '#f5f0e8',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18'
                  }}
                >
                  Add manually
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {experiences.map(exp => (
                <ExperienceCard
                  key={exp.exp_id}
                  exp={exp}
                  onEdit={() => setModal({ mode: 'edit', exp })}
                  onDelete={() => handleDelete(exp.exp_id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {modal && (
          <ExperienceModal
            state={modal}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); load() }}
          />
        )}
      </div>
    </Layout>
  )
}
