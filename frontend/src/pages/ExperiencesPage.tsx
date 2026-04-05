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

// ─── Shared input style (matches UploadModal exactly) ─────────────────────────

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
const onFocusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)' }
const onBlurInput  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#d4caba' }

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#9a9288',
}

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

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', background: 'rgba(15,15,13,0.5)', backdropFilter: 'blur(8px)' }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#ede8dc',
          border: '1px solid #d4caba',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid #d4caba', flexShrink: 0 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0f0f0d', margin: 0 }}>
            {state.mode === 'add' ? 'Add Experience' : 'Edit Experience'}
          </h2>
          <button
            onClick={onClose}
            style={{ color: '#9a9288', padding: 6, borderRadius: 8, lineHeight: 0, background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', flex: 1 }}>

            {/* Company + Role */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={LABEL_STYLE}>
                  Company <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  style={INPUT}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={LABEL_STYLE}>
                  Role <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  style={INPUT}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
              </div>
            </div>

            {/* Dates + Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={LABEL_STYLE}>Dates</label>
                <input
                  value={dates}
                  onChange={e => setDates(e.target.value)}
                  placeholder="e.g. Jan 2022 – Present"
                  style={INPUT}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={LABEL_STYLE}>Location</label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Seattle, WA"
                  style={INPUT}
                  onFocus={onFocusInput}
                  onBlur={onBlurInput}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={LABEL_STYLE}>Description</label>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder="Briefly describe your role, team size, scope, key projects — used to build BQ stories"
                rows={4}
                style={{ ...INPUT, resize: 'none' }}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
              />
            </div>

            {/* Bullets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={LABEL_STYLE}>Key Accomplishments</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ marginTop: 17, flexShrink: 0, fontSize: 12, color: '#9a9288' }}>·</span>
                    <textarea
                      value={b}
                      onChange={e => setBullet(i, e.target.value)}
                      placeholder="e.g. Led migration of auth service, reducing latency by 40%"
                      rows={2}
                      style={{ ...INPUT, resize: 'none', flex: 1 }}
                      onFocus={onFocusInput}
                      onBlur={onBlurInput}
                    />
                    {bullets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBullet(i)}
                        style={{ marginTop: 12, flexShrink: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: '#9a9288', padding: 4, lineHeight: 0, transition: 'color 0.15s' }}
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#7a7268', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0', transition: 'color 0.15s', alignSelf: 'flex-start' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
                >
                  <Plus size={14} /> Add bullet
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#b91c1c', background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.2)', borderRadius: 8, padding: '12px 16px', margin: 0 }}>
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 12, padding: '20px 28px', borderTop: '1px solid #d4caba', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '14px 0', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', border: '1px solid #d4caba', background: 'transparent', color: '#7a7268', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b0a898' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, padding: '14px 0', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: '#1a1a18', color: '#f5f0e8', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" />Saving…</>
                : <><Save size={15} />{state.mode === 'add' ? 'Add Experience' : 'Save Changes'}</>}
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
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 24px', borderRadius: 10, fontSize: 15, fontWeight: 500,
          border: '1px solid #d4caba', color: '#7a7268', background: 'transparent',
          cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b0a898' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}
      >
        <Download size={15} /> Import from Resume
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative' }}>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{ background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d', borderRadius: 10, padding: '12px 40px 12px 14px', fontSize: 14, outline: 'none', appearance: 'none' }}
        >
          {resumes.map(r => (
            <option key={r.resume_id} value={r.resume_id}>{r.version_name}</option>
          ))}
        </select>
        <ChevronDown size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7a7268' }} />
      </div>
      <button
        onClick={handleImport}
        disabled={loading || !selected}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          background: '#1a1a18', color: '#f5f0e8', border: 'none',
          cursor: loading || !selected ? 'not-allowed' : 'pointer',
          opacity: loading || !selected ? 0.5 : 1, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Import
      </button>
      <button
        onClick={() => setOpen(false)}
        style={{ color: '#7a7268', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0, transition: 'color 0.15s' }}
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
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        borderRadius: 12,
        padding: 28,
        position: 'relative',
        background: '#eae5da',
        border: '1px solid #d4caba',
        transition: 'all 0.15s',
        ...(hovered ? { borderColor: 'rgba(0,0,0,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' } : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Action buttons */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
        <button
          onClick={onEdit}
          title="Edit"
          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#7a7268', lineHeight: 0, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.background = 'transparent' }}
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#7a7268', lineHeight: 0, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.background = 'transparent' }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16, paddingRight: 64 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#f0ebe2', border: '1px solid #d4caba' }}>
          <Building2 size={18} style={{ color: '#7a7268' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 15, color: '#0f0f0d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.role}</p>
          <p style={{ fontSize: 14, color: '#4a4540', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {exp.company}{exp.location ? ` · ${exp.location}` : ''}
          </p>
          {exp.dates && (
            <p style={{ fontSize: 12, color: '#9a9288', marginTop: 4 }}>{exp.dates}</p>
          )}
        </div>
      </div>

      {/* Description preview */}
      {exp.description && (
        <p style={{ fontSize: 14, color: '#7a7268', marginBottom: 16, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {exp.description}
        </p>
      )}

      {/* Bullets preview */}
      {exp.bullets?.length > 0 && (
        <ul style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6, listStyle: 'none', padding: 0 }}>
          {exp.bullets.slice(0, 2).map((b, i) => (
            <li key={i} style={{ fontSize: 14, display: 'flex', gap: 8, color: '#7a7268' }}>
              <span style={{ flexShrink: 0, marginTop: 2, color: '#9a9288' }}>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b}</span>
            </li>
          ))}
          {exp.bullets.length > 2 && (
            <li style={{ fontSize: 12, color: '#9a9288' }}>+{exp.bullets.length - 2} more</li>
          )}
        </ul>
      )}

      {/* Story count badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.06)' }}>
        <BookOpen size={13} style={{ color: '#7a7268' }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: '#7a7268' }}>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: 32, position: 'relative' }}>

        {/* Action buttons — top-right */}
        <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
          <ImportPanel onImported={handleImported} />
          <button
            onClick={() => setModal({ mode: 'add' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: '#1a1a18', color: '#f5f0e8', border: 'none',
              cursor: 'pointer', transition: 'background 0.15s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}
          >
            <Plus size={15} /> Add Experience
          </button>
        </div>

        <div>
          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f0f0d', margin: 0 }}>Experiences</h1>
            <p style={{ fontSize: 15, color: '#7a7268', marginTop: 8 }}>
              Your work history for BQ story prep — each experience can have multiple STAR stories
            </p>
          </div>

          {/* Import success message */}
          {importMsg && (
            <div style={{ marginBottom: 24, padding: '14px 20px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,78,59,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <span style={{ fontSize: 14, color: '#6ee7b7' }}>{importMsg}</span>
              <button
                onClick={() => setImportMsg('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#34d399', lineHeight: 0, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6ee7b7')}
                onMouseLeave={e => (e.currentTarget.style.color = '#34d399')}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#7a7268', justifyContent: 'center', padding: '64px 0' }}>
              <Loader2 size={18} className="animate-spin" /> Loading experiences…
            </div>
          ) : experiences.length === 0 ? (
            <div style={{ border: '2px dashed #d4caba', borderRadius: 16, padding: '112px 32px', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', background: '#f0ebe2', border: '1px solid #d4caba' }}>
                <Briefcase size={36} style={{ color: '#9a9288' }} />
              </div>
              <p style={{ fontSize: 20, fontWeight: 600, color: '#0f0f0d', marginBottom: 12 }}>No experiences yet</p>
              <p style={{ fontSize: 15, color: '#7a7268', marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
                Add your work history manually or import directly from a resume you've uploaded
              </p>
              <button
                onClick={() => setModal({ mode: 'add' })}
                style={{
                  padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                  background: '#1a1a18', color: '#f5f0e8', border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}
              >
                Add manually
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
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
