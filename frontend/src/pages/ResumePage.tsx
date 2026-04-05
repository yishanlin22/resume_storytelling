import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import SaveTailoredModal from '../components/SaveTailoredModal'
import {
  getResume, type ResumeDetail, type SectionKey, type ParsedResume,
  adjustBullet, moveSectionItem, updateSectionOrder,
  tailorResume, matchSkills, generateCoverLetter,
  updateResumeParsed, exportResume,
} from '../api/client'
import { LABEL_COLORS } from './DashboardPage'
import {
  ArrowLeft, Loader2, Minimize2, Maximize2,
  ChevronUp, ChevronDown, GripVertical,
  Sparkles, Target, FileText, Copy, Check,
  CheckCircle2, AlertCircle, XCircle,
  Edit2, Save, X, Plus, Download, Printer,
} from 'lucide-react'

const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'Summary', experience: 'Experience', projects: 'Projects',
  education: 'Education', skills: 'Skills', certifications: 'Certifications',
}

// ─── Standalone MoveButtons (no closure over page state) ─────────────────────

function MoveButtons({ onUp, onDown, disableUp, disableDown, size = 14 }: {
  onUp: () => void; onDown: () => void
  disableUp: boolean; disableDown: boolean; size?: number
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <button onClick={onUp} disabled={disableUp}
        className="p-0.5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors" style={{ color: '#9a9288' }}
        onMouseEnter={e => { if (!disableUp) e.currentTarget.style.color = '#0f0f0d' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9a9288' }}>
        <ChevronUp size={size} />
      </button>
      <button onClick={onDown} disabled={disableDown}
        className="p-0.5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors" style={{ color: '#9a9288' }}
        onMouseEnter={e => { if (!disableDown) e.currentTarget.style.color = '#0f0f0d' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9a9288' }}>
        <ChevronDown size={size} />
      </button>
    </div>
  )
}

type SidebarTab = 'tailor' | 'skills' | 'cover'

// ─── Print HTML builder (clean white resume, no dark theme) ──────────────────

function buildPrintHTML(parsed: ParsedResume, versionName: string, sectionOrder: SectionKey[]): string {
  const esc = (s?: string | null) => (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const contact = parsed.contact
    ? Object.values(parsed.contact).filter(Boolean).map(esc).join('  |  ')
    : ''

  const sectionHTML: Partial<Record<SectionKey, string>> = {}

  if (parsed.summary) {
    sectionHTML.summary = `<div class="section">
      <div class="sh">Summary</div>
      <p>${esc(parsed.summary)}</p>
    </div>`
  }

  if (parsed.experience?.length) {
    const entries = parsed.experience.map(exp => `
      <div class="entry">
        <div class="row"><span class="bold">${esc(exp.role)}</span><span class="date">${esc(exp.dates)}</span></div>
        <div class="sub">${esc(exp.company)}${exp.location ? ` · ${esc(exp.location)}` : ''}</div>
        ${exp.bullets?.length ? `<ul>${exp.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      </div>`).join('')
    sectionHTML.experience = `<div class="section"><div class="sh">Experience</div>${entries}</div>`
  }

  if (parsed.education?.length) {
    const entries = parsed.education.map(edu => `
      <div class="entry">
        <div class="row"><span class="bold">${esc(edu.institution)}</span><span class="date">${esc(edu.dates)}</span></div>
        <div class="sub">${esc(edu.degree)}${edu.gpa ? ` · GPA ${esc(edu.gpa)}` : ''}</div>
      </div>`).join('')
    sectionHTML.education = `<div class="section"><div class="sh">Education</div>${entries}</div>`
  }

  if (parsed.skills?.length) {
    sectionHTML.skills = `<div class="section">
      <div class="sh">Skills</div>
      <p>${parsed.skills.map(esc).join(', ')}</p>
    </div>`
  }

  if (parsed.projects?.length) {
    const entries = parsed.projects.map(proj => `
      <div class="entry">
        <div class="row"><span class="bold">${esc(proj.name)}</span><span class="date">${esc(proj.dates ?? '')}</span></div>
        ${proj.technologies?.length ? `<div class="tech">Technologies: ${proj.technologies.map(esc).join(', ')}</div>` : ''}
        ${proj.bullets?.length ? `<ul>${proj.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      </div>`).join('')
    sectionHTML.projects = `<div class="section"><div class="sh">Projects</div>${entries}</div>`
  }

  if (parsed.certifications?.length) {
    sectionHTML.certifications = `<div class="section">
      <div class="sh">Certifications</div>
      <ul>${parsed.certifications.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>`
  }

  const body = sectionOrder.map(k => sectionHTML[k] ?? '').join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(versionName)}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Calibri,Arial,sans-serif;font-size:10.5pt;color:#111;background:#fff;padding:0.65in 0.8in}
  h1{text-align:center;font-size:19pt;font-weight:700;margin-bottom:4px}
  .contact{text-align:center;font-size:9pt;color:#444;margin-bottom:10px}
  .section{margin-top:11px}
  .sh{font-size:9.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#222;
      border-bottom:1.5px solid #6633cc;padding-bottom:2px;margin-bottom:5px}
  .entry{margin-bottom:7px}
  .row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
  .bold{font-weight:700;font-size:10.5pt}
  .date{font-size:9pt;color:#555;white-space:nowrap;flex-shrink:0}
  .sub{font-size:9.5pt;color:#444;margin-top:1px}
  .tech{font-size:9pt;color:#555;font-style:italic;margin-top:2px}
  ul{margin-left:15px;margin-top:3px}
  ul li{margin-bottom:2px;line-height:1.35}
  @media print{body{padding:0}@page{margin:.6in;size:letter}}
</style>
</head>
<body>
<h1>${esc(parsed.name ?? versionName)}</h1>
${contact ? `<div class="contact">${contact}</div>` : ''}
${body}
</body></html>`
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [resume, setResume] = useState<ResumeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [adjustingBullet, setAdjustingBullet] = useState<string | null>(null)
  const [movingSection, setMovingSection] = useState<string | null>(null)
  const [movingItem, setMovingItem] = useState<string | null>(null)

  // Sidebar
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('tailor')
  const [jd, setJd] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [company, setCompany] = useState('')
  const [addSummary, setAddSummary] = useState(false)
  const [quantify, setQuantify] = useState(false)
  const [keywordOptimize, setKeywordOptimize] = useState(true)
  const [tailoring, setTailoring] = useState(false)
  const [tailoredParsed, setTailoredParsed] = useState<ParsedResume | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [skillsLoading, setSkillsLoading] = useState(false)
  const [skillsResult, setSkillsResult] = useState<{ matched: string[]; partial: string[]; missing_key: string[]; score: number } | null>(null)
  const [coverLoading, setCoverLoading] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [copied, setCopied] = useState(false)

  // Edit mode
  const [editMode, setEditMode] = useState(false)
  const [editedParsed, setEditedParsed] = useState<ParsedResume | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [newCert, setNewCert] = useState('')

  // Export
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!id) return
    getResume(id).then(r => {
      if (!r.section_order || r.section_order.length === 0) {
        const order: SectionKey[] = []
        if (r.parsed.summary)               order.push('summary')
        if (r.parsed.experience?.length)     order.push('experience')
        if (r.parsed.projects?.length)       order.push('projects')
        if (r.parsed.education?.length)      order.push('education')
        if (r.parsed.skills?.length)         order.push('skills')
        if (r.parsed.certifications?.length) order.push('certifications')
        r.section_order = order
      }
      setResume(r)
      setLoading(false)
    })
  }, [id])

  // ── Edit helpers ────────────────────────────────────────────────────────────

  function enterEditMode() {
    if (!resume) return
    setTailoredParsed(null)
    setEditedParsed(structuredClone(resume.parsed))
    setEditMode(true)
  }

  function cancelEditMode() {
    setEditMode(false); setEditedParsed(null); setNewSkill(''); setNewCert(''); setSaveError('')
  }

  function updateEdit(updater: (p: ParsedResume) => void) {
    setEditedParsed(prev => {
      if (!prev) return prev
      const next = structuredClone(prev)
      updater(next)
      return next
    })
  }

  async function saveEdits() {
    if (!resume || !editedParsed) return
    setSaving(true); setSaveError('')
    try {
      await updateResumeParsed(resume.resume_id, editedParsed)
      setResume(prev => prev ? { ...prev, parsed: editedParsed } : prev)
      setEditMode(false); setEditedParsed(null); setNewSkill(''); setNewCert('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setSaveError(msg ?? 'Save failed — make sure the server is running and try again')
    } finally {
      setSaving(false)
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  async function handleExportDocx() {
    if (!resume) return
    setExporting(true)
    try {
      const res = await exportResume(resume.resume_id)
      const bytes = Uint8Array.from(atob(res.file_data), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = res.file_name; a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  function handlePrint() {
    if (!resume) return
    const parsed = tailoredParsed ?? resume.parsed
    const html = buildPrintHTML(parsed, resume.version_name, resume.section_order)
    const win = window.open('', '_blank')
    if (!win) { alert('Allow popups to export PDF'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  // ── Bullet adjustment ────────────────────────────────────────────────────────

  async function handleAdjustBullet(
    section: 'experience' | 'projects',
    sectionIdx: number,
    bulletIdx: number,
    direction: 'shorten' | 'lengthen',
  ) {
    if (!resume) return
    const key = `${section}-${sectionIdx}-${bulletIdx}`
    setAdjustingBullet(key)
    const bullet = resume.parsed[section][sectionIdx].bullets[bulletIdx]
    try {
      const res = await adjustBullet(bullet, direction)
      setResume(prev => {
        if (!prev) return prev
        const u = structuredClone(prev)
        u.parsed[section][sectionIdx].bullets[bulletIdx] = res.bullet
        return u
      })
    } finally {
      setAdjustingBullet(null)
    }
  }

  async function handleMoveItem(section: SectionKey, index: number, direction: 'up' | 'down') {
    if (!resume) return
    const key = `${section}-${index}`
    setMovingItem(key)
    try {
      await moveSectionItem(resume.resume_id, section, index, direction)
      setResume(prev => {
        if (!prev) return prev
        const u = structuredClone(prev)
        const items = u.parsed[section] as unknown[]
        const newIdx = direction === 'up' ? index - 1 : index + 1
        if (newIdx < 0 || newIdx >= items.length) return prev
        const tmp = items[newIdx]; items[newIdx] = items[index]; items[index] = tmp
        return u
      })
    } finally {
      setMovingItem(null)
    }
  }

  async function handleMoveSection(section: SectionKey, direction: 'up' | 'down') {
    if (!resume) return
    setMovingSection(section)
    try {
      const order = [...resume.section_order]
      const idx = order.indexOf(section)
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= order.length) return
      const tmp = order[newIdx]; order[newIdx] = order[idx]; order[idx] = tmp
      await updateSectionOrder(resume.resume_id, order)
      setResume(prev => prev ? { ...prev, section_order: order } : prev)
    } finally {
      setMovingSection(null)
    }
  }

  // ── AI actions ───────────────────────────────────────────────────────────────

  async function handleTailor() {
    if (!resume || !jd.trim()) return
    setTailoring(true); setTailoredParsed(null)
    try {
      const res = await tailorResume({
        resume_id: resume.resume_id, job_description: jd,
        target_role: targetRole || undefined, company: company || undefined,
        add_summary: addSummary, quantify, keyword_optimize: keywordOptimize,
      })
      setTailoredParsed(res.tailored_parsed)
    } finally { setTailoring(false) }
  }

  async function handleMatchSkills() {
    if (!resume || !jd.trim()) return
    setSkillsLoading(true); setSkillsResult(null)
    try { setSkillsResult(await matchSkills(resume.resume_id, jd)) }
    finally { setSkillsLoading(false) }
  }

  async function handleCoverLetter() {
    if (!resume || !targetRole.trim() || !company.trim()) return
    setCoverLoading(true); setCoverLetter('')
    try {
      const res = await generateCoverLetter({ resume_id: resume.resume_id, target_role: targetRole, company })
      setCoverLetter(res.cover_letter)
    } finally { setCoverLoading(false) }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── Which parsed data to show ────────────────────────────────────────────────

  const displayParsed: ParsedResume | null | undefined =
    editMode ? editedParsed : (tailoredParsed ?? resume?.parsed)

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER FUNCTIONS — called as plain functions, NOT as JSX components,
  // so React never creates a component boundary and inputs never lose focus.
  // ─────────────────────────────────────────────────────────────────────────────

  function eInput(
    value: string,
    onChange: (v: string) => void,
    placeholder = '',
    className = '',
  ) {
    return (
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d' }}
        className={`rounded-xl px-4 py-3 text-sm placeholder-[#b0a898] focus:outline-none w-full transition-colors ${className}`}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
        onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
      />
    )
  }

  function eTextarea(value: string, onChange: (v: string) => void, placeholder = '', rows = 2) {
    return (
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{ background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d' }}
        className="rounded-xl px-4 py-3 text-sm placeholder-[#b0a898] focus:outline-none w-full resize-none transition-colors"
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
        onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
      />
    )
  }

  /** Called as a function: {renderBullets(...)} — never as <Component/> */
  function renderBullets(
    bullets: string[],
    section: 'experience' | 'projects',
    sectionIdx: number,
    origBullets?: string[],
  ) {
    if (editMode && editedParsed) {
      const editBullets = editedParsed[section][sectionIdx].bullets
      return (
        <ul className="mt-3 space-y-2">
          {editBullets.map((b, bi) => (
            <li key={bi} className="flex gap-2 items-start">
              <span className="mt-3 shrink-0 text-xs" style={{ color: '#9a9288' }}>·</span>
              <div className="flex-1">
                {eTextarea(b, v => updateEdit(p => { p[section][sectionIdx].bullets[bi] = v }), 'Bullet…')}
              </div>
              <button onClick={() => updateEdit(p => { p[section][sectionIdx].bullets.splice(bi, 1) })}
                className="mt-2 hover:text-red-400 shrink-0 transition-colors" style={{ color: '#4a4540' }}>
                <X size={14} />
              </button>
            </li>
          ))}
          <li>
            <button onClick={() => updateEdit(p => { p[section][sectionIdx].bullets.push('') })}
              className="flex items-center gap-1.5 text-xs mt-1.5 transition-colors"
              style={{ color: '#7a7268' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}>
              <Plus size={12} /> Add bullet
            </button>
          </li>
        </ul>
      )
    }
    return (
      <ul className="mt-2.5 space-y-2">
        {bullets.map((b, bi) => {
          const key = `${section}-${sectionIdx}-${bi}`
          const adjusting = adjustingBullet === key
          const changed = origBullets && origBullets[bi] !== b
          return (
            <li key={bi} className="group flex gap-2 items-start">
              <span className="mt-0.5 shrink-0 text-xs" style={{ color: '#9a9288' }}>·</span>
              <div className="flex-1 min-w-0">
                {adjusting
                  ? <div className="flex items-center gap-2 text-sm" style={{ color: '#7a7268' }}><Loader2 size={12} className="animate-spin" /> Rewriting…</div>
                  : <span className="text-sm leading-relaxed" style={{ color: changed ? '#4a4540' : '#0f0f0d' }}>{b}</span>
                }
              </div>
              {!tailoredParsed && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => handleAdjustBullet(section, sectionIdx, bi, 'shorten')}
                    title="Shorten" disabled={!!adjustingBullet}
                    className="p-1 disabled:opacity-30 transition-colors" style={{ color: '#9a9288' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}>
                    <Minimize2 size={12} />
                  </button>
                  <button onClick={() => handleAdjustBullet(section, sectionIdx, bi, 'lengthen')}
                    title="Lengthen" disabled={!!adjustingBullet}
                    className="p-1 disabled:opacity-30 transition-colors" style={{ color: '#9a9288' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}>
                    <Maximize2 size={12} />
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  /** Called as a function: {renderSectionWrapper(section, children)} */
  function renderSectionWrapper(section: SectionKey, children: React.ReactNode) {
    if (!resume) return null
    const order = resume.section_order
    const pos = order.indexOf(section)
    const isMoving = movingSection === section
    return (
      <div key={section} className={`rounded-xl p-6 mb-4 transition-opacity ${isMoving ? 'opacity-60' : ''}`}
        style={{
          background: '#eae5da',
          border: '1px solid #d4caba',
        }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9a9288' }}>
            {SECTION_LABELS[section]}
          </h2>
          {!tailoredParsed && !editMode && (
            <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
              <GripVertical size={13} style={{ color: '#b0a898' }} />
              <MoveButtons size={14}
                onUp={() => handleMoveSection(section, 'up')}
                onDown={() => handleMoveSection(section, 'down')}
                disableUp={pos <= 0 || isMoving}
                disableDown={pos >= order.length - 1 || isMoving}
              />
            </div>
          )}
        </div>
        {children}
      </div>
    )
  }

  // ── Section renderers ────────────────────────────────────────────────────────

  function renderSection(section: SectionKey) {
    if (!resume || !displayParsed) return null
    const parsed = displayParsed
    const origParsed = resume.parsed

    switch (section) {
      case 'summary':
        if (!parsed.summary && !editMode) return null
        return renderSectionWrapper('summary',
          editMode && editedParsed
            ? eTextarea(editedParsed.summary, v => updateEdit(p => { p.summary = v }), 'Professional summary…', 4)
            : <p className="text-sm leading-relaxed" style={{ color: tailoredParsed && parsed.summary !== origParsed.summary ? '#4a4540' : '#0f0f0d' }}>{parsed.summary}</p>
        )

      case 'experience':
        if (!parsed.experience?.length) return null
        return renderSectionWrapper('experience',
          <div className="space-y-6">
            {parsed.experience.map((exp, si) => {
              const isMovingItem = movingItem === `experience-${si}`
              const origExp = origParsed.experience?.[si]
              return (
                <div key={si} className={`group/item transition-opacity ${isMovingItem ? 'opacity-40' : ''}`}>
                  <div className="flex items-start gap-2">
                    {!tailoredParsed && !editMode && parsed.experience.length > 1 && (
                      <div className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 mt-0.5">
                        <MoveButtons
                          onUp={() => handleMoveItem('experience', si, 'up')}
                          onDown={() => handleMoveItem('experience', si, 'down')}
                          disableUp={si === 0 || isMovingItem}
                          disableDown={si === parsed.experience.length - 1 || isMovingItem}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {editMode && editedParsed
                        ? <div className="grid grid-cols-2 gap-3 mb-3">
                            {eInput(editedParsed.experience[si].role, v => updateEdit(p => { p.experience[si].role = v }), 'Role / Title')}
                            {eInput(editedParsed.experience[si].company, v => updateEdit(p => { p.experience[si].company = v }), 'Company')}
                            {eInput(editedParsed.experience[si].dates, v => updateEdit(p => { p.experience[si].dates = v }), 'Dates')}
                            {eInput(editedParsed.experience[si].location ?? '', v => updateEdit(p => { p.experience[si].location = v }), 'Location')}
                          </div>
                        : <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-sm" style={{ color: '#0f0f0d' }}>{exp.role}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#7a7268' }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                            </div>
                            <span className="text-xs shrink-0 ml-4" style={{ color: '#9a9288' }}>{exp.dates}</span>
                          </div>
                      }
                      {renderBullets(
                        editMode && editedParsed ? editedParsed.experience[si].bullets : exp.bullets,
                        'experience', si,
                        tailoredParsed ? origExp?.bullets : undefined,
                      )}
                    </div>
                  </div>
                  {si < parsed.experience.length - 1 && <div className="border-b mt-6" style={{ borderColor: '#d4caba' }} />}
                </div>
              )
            })}
          </div>
        )

      case 'projects':
        if (!parsed.projects?.length) return null
        return renderSectionWrapper('projects',
          <div className="space-y-5">
            {parsed.projects.map((proj, si) => {
              const isMovingItem = movingItem === `projects-${si}`
              const origProj = origParsed.projects?.[si]
              return (
                <div key={si} className={`group/item transition-opacity ${isMovingItem ? 'opacity-40' : ''}`}>
                  <div className="flex items-start gap-2">
                    {!tailoredParsed && !editMode && parsed.projects.length > 1 && (
                      <div className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 mt-0.5">
                        <MoveButtons
                          onUp={() => handleMoveItem('projects', si, 'up')}
                          onDown={() => handleMoveItem('projects', si, 'down')}
                          disableUp={si === 0 || isMovingItem}
                          disableDown={si === parsed.projects.length - 1 || isMovingItem}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {editMode && editedParsed
                        ? <div className="grid grid-cols-2 gap-3 mb-3">
                            {eInput(editedParsed.projects[si].name, v => updateEdit(p => { p.projects[si].name = v }), 'Project name')}
                            {eInput(editedParsed.projects[si].dates ?? '', v => updateEdit(p => { p.projects[si].dates = v }), 'Dates')}
                          </div>
                        : <div className="flex items-center justify-between mb-1.5">
                            <p className="font-semibold text-sm" style={{ color: '#0f0f0d' }}>{proj.name}</p>
                            <span className="text-xs shrink-0 ml-4" style={{ color: '#9a9288' }}>{proj.dates}</span>
                          </div>
                      }
                      {(proj.technologies ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(proj.technologies ?? []).map((t, ti) => (
                            <span key={ti} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                              style={{ background: '#eae5da', color: '#4a4540', border: '1px solid #d4caba' }}>
                              {t}
                              {editMode && (
                                <button onClick={() => updateEdit(p => { p.projects[si].technologies?.splice(ti, 1) })}
                                  className="hover:text-red-400 leading-none transition-colors" style={{ color: '#9a9288' }}>×</button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                      {renderBullets(
                        editMode && editedParsed ? editedParsed.projects[si].bullets : proj.bullets,
                        'projects', si,
                        tailoredParsed ? origProj?.bullets : undefined,
                      )}
                    </div>
                  </div>
                  {si < parsed.projects.length - 1 && <div className="border-b mt-5" style={{ borderColor: '#d4caba' }} />}
                </div>
              )
            })}
          </div>
        )

      case 'education':
        if (!parsed.education?.length) return null
        return renderSectionWrapper('education',
          <div className="space-y-4">
            {parsed.education.map((edu, si) => {
              const isMovingItem = movingItem === `education-${si}`
              return (
                <div key={si} className={`group/item flex items-center gap-2 transition-opacity ${isMovingItem ? 'opacity-40' : ''}`}>
                  {!tailoredParsed && !editMode && parsed.education.length > 1 && (
                    <div className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                      <MoveButtons
                        onUp={() => handleMoveItem('education', si, 'up')}
                        onDown={() => handleMoveItem('education', si, 'down')}
                        disableUp={si === 0 || isMovingItem}
                        disableDown={si === parsed.education.length - 1 || isMovingItem}
                      />
                    </div>
                  )}
                  {editMode && editedParsed
                    ? <div className="flex-1 grid grid-cols-2 gap-3">
                        {eInput(editedParsed.education[si].institution, v => updateEdit(p => { p.education[si].institution = v }), 'Institution')}
                        {eInput(editedParsed.education[si].dates, v => updateEdit(p => { p.education[si].dates = v }), 'Dates')}
                        {eInput(editedParsed.education[si].degree, v => updateEdit(p => { p.education[si].degree = v }), 'Degree')}
                        {eInput(editedParsed.education[si].gpa ?? '', v => updateEdit(p => { p.education[si].gpa = v }), 'GPA (optional)')}
                      </div>
                    : <div className="flex-1 flex justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#0f0f0d' }}>{edu.institution}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#7a7268' }}>{edu.degree}{edu.gpa ? ` · GPA ${edu.gpa}` : ''}</p>
                        </div>
                        <span className="text-xs shrink-0 ml-4" style={{ color: '#9a9288' }}>{edu.dates}</span>
                      </div>
                  }
                </div>
              )
            })}
          </div>
        )

      case 'skills':
        if (!parsed.skills?.length && !editMode) return null
        return renderSectionWrapper('skills',
          <div className="flex flex-wrap gap-2">
            {(editMode && editedParsed ? editedParsed.skills : parsed.skills).map((s, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full flex items-center gap-1"
                style={{ background: '#f0ebe2', border: '1px solid #d4caba', color: '#4a4540' }}>
                {s}
                {editMode && (
                  <button onClick={() => updateEdit(p => { p.skills.splice(i, 1) })}
                    className="hover:text-red-400 transition-colors leading-none" style={{ color: '#9a9288' }}>
                    <X size={11} />
                  </button>
                )}
              </span>
            ))}
            {editMode && (
              <div className="flex items-center gap-1.5">
                <input value={newSkill} onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newSkill.trim()) { updateEdit(p => { p.skills.push(newSkill.trim()) }); setNewSkill('') } }}
                  placeholder="Add skill…"
                  style={{ background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d' }}
                  className="rounded-full px-3 py-1.5 text-xs focus:outline-none w-32"
                />
                <button onClick={() => { if (newSkill.trim()) { updateEdit(p => { p.skills.push(newSkill.trim()) }); setNewSkill('') } }}
                  className="transition-colors" style={{ color: '#7a7268' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}>
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        )

      case 'certifications':
        if (!parsed.certifications?.length && !editMode) return null
        return renderSectionWrapper('certifications',
          <ul className="space-y-2.5">
            {(editMode && editedParsed ? editedParsed.certifications : parsed.certifications).map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-xs shrink-0" style={{ color: '#9a9288' }}>·</span>
                {editMode && editedParsed
                  ? <div className="flex-1 flex gap-2">
                      {eInput(editedParsed.certifications[i], v => updateEdit(p => { p.certifications[i] = v }), 'Certification…')}
                      <button onClick={() => updateEdit(p => { p.certifications.splice(i, 1) })}
                        className="hover:text-red-400 transition-colors shrink-0" style={{ color: '#9a9288' }}><X size={14} /></button>
                    </div>
                  : <span className="text-sm" style={{ color: '#0f0f0d' }}>{c}</span>
                }
              </li>
            ))}
            {editMode && (
              <li className="flex items-center gap-2 mt-1">
                <input value={newCert} onChange={e => setNewCert(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newCert.trim()) { updateEdit(p => { p.certifications.push(newCert.trim()) }); setNewCert('') } }}
                  placeholder="Add certification…"
                  style={{ background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d' }}
                  className="rounded-xl px-4 py-2.5 text-sm focus:outline-none flex-1"
                />
                <button onClick={() => { if (newCert.trim()) { updateEdit(p => { p.certifications.push(newCert.trim()) }); setNewCert('') } }}
                  className="transition-colors" style={{ color: '#7a7268' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}><Plus size={14} /></button>
              </li>
            )}
          </ul>
        )

      default: return null
    }
  }

  // ── Sidebar ──────────────────────────────────────────────────────────────────

  const TABS = [
    { id: 'tailor' as SidebarTab, label: 'Tailor', icon: <Sparkles size={14} /> },
    { id: 'skills' as SidebarTab, label: 'Skills',  icon: <Target size={14} /> },
    { id: 'cover'  as SidebarTab, label: 'Cover',   icon: <FileText size={14} /> },
  ]

  function ToggleChip({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
      <button onClick={() => onChange(!value)}
        style={value
          ? { padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid #1a1a18', background: '#1a1a18', color: '#f5f0e8' }
          : { padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid #d4caba', background: '#f0ebe2', color: '#4a4540' }
        }
      >
        {label}
      </button>
    )
  }

  function SidebarLabel({ children }: { children: React.ReactNode }) {
    return (
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9288', display: 'block' }}>
        {children}
      </label>
    )
  }

  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 }
  const inputStyle: React.CSSProperties = {
    background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d',
    borderRadius: 10, padding: '14px 16px', fontSize: 15, outline: 'none', width: '100%',
  }
  const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)' }
  const inputBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#d4caba' }
  const ctaStyle: React.CSSProperties = {
    padding: '14px 0', borderRadius: 10, fontSize: 15, fontWeight: 600,
    background: '#1a1a18', color: '#f5f0e8', border: 'none', width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
  }

  function renderSidebar() {
    if (sidebarTab === 'tailor') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={fieldStyle}>
          <SidebarLabel>Job Description <span style={{ color: '#f87171' }}>*</span></SidebarLabel>
          <textarea value={jd} onChange={e => setJd(e.target.value)}
            placeholder="Paste the job description here…" rows={8}
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={inputFocus} onBlur={inputBlur} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={fieldStyle}>
            <SidebarLabel>Target Role</SidebarLabel>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. SWE II"
              style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
          <div style={fieldStyle}>
            <SidebarLabel>Company</SidebarLabel>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Anthropic"
              style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
        </div>
        <div style={fieldStyle}>
          <SidebarLabel>Options</SidebarLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <ToggleChip label="Keyword Optimize" value={keywordOptimize} onChange={setKeywordOptimize} />
            <ToggleChip label="Add Summary" value={addSummary} onChange={setAddSummary} />
            <ToggleChip label="Quantify Bullets" value={quantify} onChange={setQuantify} />
          </div>
        </div>
        <button onClick={handleTailor} disabled={tailoring || !jd.trim()}
          style={{ ...ctaStyle, opacity: (tailoring || !jd.trim()) ? 0.5 : 1 }}
          onMouseEnter={e => { if (!tailoring) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}>
          {tailoring ? <><Loader2 size={14} className="animate-spin" />Tailoring…</> : <><Sparkles size={14} />Tailor Resume</>}
        </button>
        {tailoredParsed && (
          <div className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)' }}>
            <p className="text-xs font-medium" style={{ color: '#0f0f0d' }}>Preview active — highlighted text = AI changes</p>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveModal(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: '#1a1a18', color: '#f5f0e8' }}>
                Save Version
              </button>
              <button onClick={() => setTailoredParsed(null)}
                className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                style={{ border: '1px solid #d4caba', color: '#7a7268' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b8b0a0' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}>
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    )

    if (sidebarTab === 'skills') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={fieldStyle}>
          <SidebarLabel>Job Description <span style={{ color: '#f87171' }}>*</span></SidebarLabel>
          <textarea value={jd} onChange={e => setJd(e.target.value)}
            placeholder="Paste the job description here…" rows={8}
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={inputFocus} onBlur={inputBlur} />
        </div>
        <button onClick={handleMatchSkills} disabled={skillsLoading || !jd.trim()}
          style={{ ...ctaStyle, opacity: (skillsLoading || !jd.trim()) ? 0.5 : 1 }}
          onMouseEnter={e => { if (!skillsLoading) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}>
          {skillsLoading ? <><Loader2 size={14} className="animate-spin" />Analyzing…</> : <><Target size={14} />Analyze Skills</>}
        </button>
        {skillsResult && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: '#eae5da', border: '1px solid #d4caba' }}>
              <span className="text-sm font-medium" style={{ color: '#4a4540' }}>Match Score</span>
              <div className="flex items-center gap-2.5">
                <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: '#d4caba' }}>
                  <div className={`h-full rounded-full ${skillsResult.score >= 70 ? 'bg-emerald-500' : skillsResult.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${skillsResult.score}%` }} />
                </div>
                <span className={`text-sm font-bold ${skillsResult.score >= 70 ? 'text-emerald-400' : skillsResult.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{skillsResult.score}%</span>
              </div>
            </div>
            {[
              { list: skillsResult.matched,     label: 'Matched', icon: <CheckCircle2 size={13} />, color: 'emerald' },
              { list: skillsResult.partial,      label: 'Partial',  icon: <AlertCircle size={13} />,  color: 'amber' },
              { list: skillsResult.missing_key,  label: 'Missing',  icon: <XCircle size={13} />,      color: 'red' },
            ].filter(g => g.list.length).map(g => (
              <div key={g.label}>
                <div className={`flex items-center gap-1.5 mb-2 text-${g.color}-400`}>{g.icon}<span className="text-xs font-semibold">{g.label} ({g.list.length})</span></div>
                <div className="flex flex-wrap gap-1.5">
                  {g.list.map((s, i) => (
                    <span key={i} className={`text-xs bg-${g.color}-950/40 border border-${g.color}-800/40 text-${g.color}-300 px-2.5 py-1 rounded-full`}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )

    if (sidebarTab === 'cover') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={fieldStyle}>
            <SidebarLabel>Target Role <span style={{ color: '#f87171' }}>*</span></SidebarLabel>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. SWE II"
              style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
          <div style={fieldStyle}>
            <SidebarLabel>Company <span style={{ color: '#f87171' }}>*</span></SidebarLabel>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Anthropic"
              style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
        </div>
        <button onClick={handleCoverLetter} disabled={coverLoading || !targetRole.trim() || !company.trim()}
          style={{ ...ctaStyle, opacity: (coverLoading || !targetRole.trim() || !company.trim()) ? 0.5 : 1 }}
          onMouseEnter={e => { if (!coverLoading) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}>
          {coverLoading ? <><Loader2 size={14} className="animate-spin" />Generating…</> : <><FileText size={14} />Generate Cover Letter</>}
        </button>
        {coverLetter && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: '#7a7268' }}>Generated cover letter</span>
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ border: '1px solid #d4caba', color: '#7a7268' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}>
                {copied ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy</>}
              </button>
            </div>
            <div className="rounded-xl p-4 max-h-[400px] overflow-y-auto"
              style={{ background: '#f8f4ec', border: '1px solid #d4caba' }}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#0f0f0d' }}>{coverLetter}</p>
            </div>
          </div>
        )}
      </div>
    )

    return null
  }

  // ── Loading / not found ───────────────────────────────────────────────────────

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-full min-h-[400px]" style={{ color: '#7a7268' }}>
        <Loader2 className="animate-spin mr-2" size={20} /> Loading…
      </div>
    </Layout>
  )

  if (!resume) return (
    <Layout><div className="p-8" style={{ color: '#7a7268' }}>Resume not found.</div></Layout>
  )

  // ── Page ──────────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="flex h-full">

        {/* ── Main content ── */}
        <div className="flex-1 overflow-y-auto p-8 min-w-0">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm mb-7 transition-colors"
            style={{ color: '#9a9288' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}>
            <ArrowLeft size={16} /> Back to Resumes
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight"
                style={{ color: '#0f0f0d' }}>{resume.version_name}</h1>
              <p className="text-sm mt-1" style={{ color: '#7a7268' }}>{resume.parsed.name}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button onClick={handlePrint} title="Export as PDF"
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all"
                style={{ border: '1px solid #d4caba', color: '#7a7268' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b8b0a0' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}>
                <Printer size={14} /> PDF
              </button>
              <button onClick={handleExportDocx} disabled={exporting} title="Download DOCX"
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                style={{ border: '1px solid #d4caba', color: '#7a7268' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b8b0a0' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}>
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} DOCX
              </button>
              {!tailoredParsed && !editMode && (
                <button onClick={enterEditMode}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all"
                  style={{ border: '1px solid #d4caba', color: '#7a7268' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#b8b0a0'; e.currentTarget.style.color = '#0f0f0d' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4caba'; e.currentTarget.style.color = '#7a7268' }}>
                  <Edit2 size={14} /> Edit
                </button>
              )}
              {editMode && (
                <>
                  <button onClick={cancelEditMode}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all"
                    style={{ border: '1px solid #d4caba', color: '#7a7268' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b8b0a0' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}>
                    <X size={14} /> Cancel
                  </button>
                  <button onClick={saveEdits} disabled={saving}
                    className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                    style={{ background: '#1a1a18', color: '#f5f0e8' }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </>
              )}
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${LABEL_COLORS[resume.label] ?? LABEL_COLORS['general']}`}>
                {resume.label}
              </span>
            </div>
          </div>

          {/* Banners */}
          {editMode && (
            <div className="mb-5 space-y-2">
              <div className="px-5 py-3 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <Edit2 size={14} className="text-amber-600 shrink-0" />
                <span className="text-sm text-amber-700">Edit mode — modify any field, then click <strong>Save Changes</strong> in the top right.</span>
              </div>
              {saveError && (
                <div className="px-5 py-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(185,28,28,0.3)' }}>
                  <X size={14} className="text-red-400 shrink-0" />
                  <span className="text-sm text-red-300">{saveError}</span>
                </div>
              )}
            </div>
          )}
          {tailoredParsed && !editMode && (
            <div className="mb-5 px-5 py-3 rounded-xl flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)' }}>
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: '#4a4540' }} />
                <span className="text-sm" style={{ color: '#0f0f0d' }}>Tailored preview — highlighted text = AI changes</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSaveModal(true)}
                  className="text-sm px-4 py-1.5 rounded-xl transition-all"
                  style={{ background: '#1a1a18', color: '#f5f0e8' }}>Save</button>
                <button onClick={() => setTailoredParsed(null)}
                  className="text-sm px-3 py-1.5 rounded-xl transition-colors"
                  style={{ border: '1px solid #d4caba', color: '#7a7268' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}>Discard</button>
              </div>
            </div>
          )}

          {/* Contact strip */}
          {resume.parsed.contact && Object.values(resume.parsed.contact).some(Boolean) && (
            <div className="rounded-xl px-6 py-4 mb-4 flex flex-wrap gap-x-6 gap-y-1.5"
              style={{ background: '#eae5da', border: '1px solid #d4caba' }}>
              {Object.entries(resume.parsed.contact).map(([k, v]) => v
                ? <span key={k} className="text-sm" style={{ color: '#4a4540' }}>
                    <span style={{ color: '#9a9288' }}>{k}: </span>{v}
                  </span>
                : null
              )}
            </div>
          )}

          {!tailoredParsed && !editMode && (
            <p className="text-xs mb-5 flex items-center gap-1.5" style={{ color: '#b0a898' }}>
              <GripVertical size={12} />
              Hover over sections or entries to reorder · Use Edit to change text
            </p>
          )}

          {resume.section_order.map(s => renderSection(s))}
        </div>

        {/* ── Tools sidebar ── */}
        <div className="w-[360px] shrink-0 flex flex-col h-full overflow-hidden"
          style={{ borderLeft: '1px solid #d4caba', background: '#ede8dc' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #d4caba', flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setSidebarTab(t.id)}
                style={{
                  flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', border: 'none', background: 'transparent',
                  color: sidebarTab === t.id ? '#0f0f0d' : '#7a7268',
                  borderBottom: sidebarTab === t.id ? '2px solid #0f0f0d' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { if (sidebarTab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = '#4a4540' }}
                onMouseLeave={e => { if (sidebarTab !== t.id) (e.currentTarget as HTMLButtonElement).style.color = '#7a7268' }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto" style={{ padding: '24px 20px' }}>
            {renderSidebar()}
          </div>
        </div>
      </div>

      {showSaveModal && tailoredParsed && resume && (
        <SaveTailoredModal
          resumeId={resume.resume_id}
          tailoredParsed={tailoredParsed}
          currentVersionName={resume.version_name}
          onClose={() => setShowSaveModal(false)}
          onSaved={(newId) => {
            setShowSaveModal(false); setTailoredParsed(null)
            if (newId) navigate(`/resume/${newId}`)
            else getResume(resume.resume_id).then(r => setResume(r))
          }}
        />
      )}
    </Layout>
  )
}
