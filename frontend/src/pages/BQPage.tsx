import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import {
  listExperiences, listStories, getStory, buildStory,
  suggestStoryQuestions, deleteStory, updateStory, recommendStory,
  type Experience, type Story, type StarStory,
} from '../api/client'
import {
  MessageSquare, Plus, Loader2, Trash2, Sparkles, ChevronDown,
  ChevronRight, BookOpen, HelpCircle, X, Check, Edit2, Save,
  ArrowRight, Lightbulb, Target,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const AMAZON_LPS = new Set([
  'Customer Obsession', 'Ownership', 'Invent and Simplify', 'Are Right A Lot',
  'Learn and Be Curious', 'Hire and Develop the Best', 'Insist on Highest Standards',
  'Think Big', 'Bias for Action', 'Frugality', 'Earn Trust', 'Dive Deep',
  'Have Backbone Disagree and Commit', 'Deliver Results',
])

const ALL_THEMES = [
  // Amazon LPs
  'Customer Obsession', 'Ownership', 'Invent and Simplify', 'Are Right A Lot',
  'Learn and Be Curious', 'Hire and Develop the Best', 'Insist on Highest Standards',
  'Think Big', 'Bias for Action', 'Frugality', 'Earn Trust', 'Dive Deep',
  'Have Backbone Disagree and Commit', 'Deliver Results',
  // General
  'Leadership', 'Teamwork', 'Conflict Resolution', 'Failure/Learning',
  'Time Management', 'Communication', 'Innovation', 'Handling Feedback',
  'Biggest Weakness', 'Initiative',
]

const STAR_META = [
  { key: 'situation' as const, label: 'Situation', borderColor: '#1d4ed8', bg: 'rgba(30,58,138,0.08)', text: '#1e3a8a', badge: 'rgba(30,58,138,0.15)', badgeText: '#1e40af' },
  { key: 'task'      as const, label: 'Task',      borderColor: '#b45309', bg: 'rgba(120,53,15,0.08)', text: '#78350f', badge: 'rgba(120,53,15,0.15)', badgeText: '#92400e' },
  { key: 'action'    as const, label: 'Action',    borderColor: '#6d28d9', bg: 'rgba(76,29,149,0.08)', text: '#4c1d95', badge: 'rgba(76,29,149,0.15)', badgeText: '#5b21b6' },
  { key: 'result'    as const, label: 'Result',    borderColor: '#065f46', bg: 'rgba(6,78,59,0.08)',   text: '#064e3b', badge: 'rgba(6,78,59,0.15)',   badgeText: '#065f46' },
]

function themeChipStyle(theme: string, selected = false): React.CSSProperties {
  if (selected) {
    return AMAZON_LPS.has(theme)
      ? { background: '#c2410c', border: '1px solid #b45309', color: '#fff', fontWeight: 600 }
      : { background: '#0369a1', border: '1px solid #0284c7', color: '#fff', fontWeight: 600 }
  }
  return AMAZON_LPS.has(theme)
    ? { background: 'rgba(194,65,12,0.1)', border: '1px solid rgba(194,65,12,0.35)', color: '#9a3412' }
    : { background: 'rgba(3,105,161,0.1)', border: '1px solid rgba(3,105,161,0.35)', color: '#075985' }
}

type Mode = 'idle' | 'build' | 'view' | 'recommend'

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
const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#9a9288',
}
const onFocusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)' }
const onBlurInput  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = '#d4caba' }

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BQPage() {
  // Data
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Navigation
  const [mode, setMode] = useState<Mode>('idle')
  const [expandedExps, setExpandedExps] = useState<Set<string>>(new Set())

  // Story view
  const [viewingStory, setViewingStory] = useState<(Story & { star: StarStory }) | null>(null)
  const [loadingStory, setLoadingStory] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  // Builder
  const [buildExpId, setBuildExpId] = useState('')
  const [buildSeed, setBuildSeed] = useState('')
  const [buildTitle, setBuildTitle] = useState('')
  const [buildThemes, setBuildThemes] = useState<string[]>([])
  const [buildNotes, setBuildNotes] = useState('')
  const [building, setBuilding] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggesting, setSuggesting] = useState(false)

  // Recommender
  const [question, setQuestion] = useState('')
  const [recommending, setRecommending] = useState(false)
  const [recommendation, setRecommendation] = useState<{
    story_id: string; story_title: string; reason: string; key_points_to_emphasize: string[]
  } | null>(null)

  // ── Load ───────────────────────────────────────────────────────────────────

  async function loadAll() {
    setLoadingData(true)
    try {
      const [exps, strs] = await Promise.all([listExperiences(), listStories()])
      setExperiences(Array.isArray(exps) ? exps : [])
      const strsArr = Array.isArray(strs) ? strs : []
      setStories(strsArr)
      // auto-expand groups that have stories
      const ids = new Set(strsArr.map(s => s.exp_id))
      setExpandedExps(ids)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // ── Story view ─────────────────────────────────────────────────────────────

  async function openStory(story_id: string) {
    setMode('view')
    setLoadingStory(true)
    setViewingStory(null)
    setEditingNotes(false)
    setEditingTitle(false)
    try {
      const s = await getStory(story_id)
      setViewingStory(s)
    } finally {
      setLoadingStory(false)
    }
  }

  async function handleDeleteStory(story_id: string) {
    if (!confirm('Delete this story?')) return
    await deleteStory(story_id)
    setViewingStory(null)
    setMode('idle')
    loadAll()
  }

  async function handleSaveNotes() {
    if (!viewingStory) return
    setSavingNotes(true)
    try {
      await updateStory(viewingStory.story_id, undefined, notesDraft)
      setViewingStory(prev => prev ? { ...prev, user_notes: notesDraft } : prev)
      setEditingNotes(false)
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleSaveTitle() {
    if (!viewingStory || !titleDraft.trim()) return
    setSavingTitle(true)
    try {
      await updateStory(viewingStory.story_id, titleDraft, undefined)
      setViewingStory(prev => prev ? { ...prev, title: titleDraft } : prev)
      setStories(prev => prev.map(s => s.story_id === viewingStory.story_id ? { ...s, title: titleDraft } : s))
      setEditingTitle(false)
    } finally {
      setSavingTitle(false)
    }
  }

  // ── Builder ────────────────────────────────────────────────────────────────

  function resetBuilder() {
    setBuildExpId(experiences[0]?.exp_id ?? '')
    setBuildSeed(''); setBuildTitle(''); setBuildThemes([]); setBuildNotes('')
    setSuggestions([])
  }

  function startBuild() {
    resetBuilder()
    setMode('build')
  }

  async function handleSuggest() {
    if (!buildExpId || !buildSeed.trim()) return
    setSuggesting(true); setSuggestions([])
    try {
      const res = await suggestStoryQuestions(buildExpId, buildSeed)
      setSuggestions(res.questions ?? [])
    } finally {
      setSuggesting(false)
    }
  }

  async function handleBuild() {
    if (!buildExpId || !buildSeed.trim()) return
    setBuilding(true)
    try {
      const res = await buildStory({
        exp_id: buildExpId,
        story_seed: buildSeed,
        title: buildTitle || undefined,
        themes_hint: buildThemes.length ? buildThemes : undefined,
        user_notes: buildNotes || undefined,
      })
      // Reload stories then view the new one
      await loadAll()
      await openStory(res.story_id)
    } finally {
      setBuilding(false)
    }
  }

  function toggleBuildTheme(t: string) {
    setBuildThemes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  // ── Recommender ────────────────────────────────────────────────────────────

  function startRecommender() {
    setMode('recommend')
    setRecommendation(null)
    setQuestion('')
  }

  async function handleRecommend() {
    if (!question.trim()) return
    setRecommending(true); setRecommendation(null)
    try {
      const res = await recommendStory(question)
      setRecommendation(res)
    } finally {
      setRecommending(false)
    }
  }

  // ── Group stories by exp ───────────────────────────────────────────────────

  const storyGroups: { exp_id: string; company: string; role: string; stories: Story[] }[] = []
  for (const story of stories) {
    const existing = storyGroups.find(g => g.exp_id === story.exp_id)
    if (existing) {
      existing.stories.push(story)
    } else {
      storyGroups.push({
        exp_id: story.exp_id,
        company: story.exp_company ?? '',
        role: story.exp_role ?? '',
        stories: [story],
      })
    }
  }

  // ── Renders ────────────────────────────────────────────────────────────────

  function renderSidebar() {
    return (
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', borderRight: '1px solid #d4caba' }}>

        {/* Sidebar action buttons */}
        <div style={{ padding: '24px 16px', borderBottom: '1px solid #d4caba', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <button
            onClick={startBuild}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: '#1a1a18', color: '#f5f0e8', border: 'none', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a28')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1a18')}
          >
            <Plus size={15} /> Build New Story
          </button>
          <button
            onClick={startRecommender}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 10, fontSize: 15, fontWeight: 500,
              background: 'transparent', border: '1px solid #d4caba', color: '#7a7268', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b0a898' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#7a7268'; e.currentTarget.style.borderColor = '#d4caba' }}
          >
            <Target size={15} /> Question Coach
          </button>
        </div>

        {/* Story list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingData ? (
            <div style={{ padding: '24px 16px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#7a7268' }}>
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : stories.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', background: '#eae5da', border: '1px solid #d4caba' }}>
                <BookOpen size={20} style={{ color: '#7a7268' }} />
              </div>
              <p style={{ fontSize: 14, color: '#7a7268' }}>No stories yet — build your first one!</p>
            </div>
          ) : (
            <div style={{ paddingTop: 8, paddingBottom: 8 }}>
              {storyGroups.map(group => {
                const expanded = expandedExps.has(group.exp_id)
                return (
                  <div key={group.exp_id}>
                    <button
                      onClick={() => setExpandedExps(prev => {
                        const next = new Set(prev)
                        next.has(group.exp_id) ? next.delete(group.exp_id) : next.add(group.exp_id)
                        return next
                      })}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {expanded
                        ? <ChevronDown size={13} style={{ flexShrink: 0, color: '#7a7268' }} />
                        : <ChevronRight size={13} style={{ flexShrink: 0, color: '#7a7268' }} />}
                      <div style={{ flex: 1, textAlign: 'left', minWidth: 0, marginRight: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f0f0d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.company}</p>
                        <p style={{ fontSize: 12, color: '#4a4540', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.role}</p>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, flexShrink: 0, fontWeight: 500, background: 'rgba(0,0,0,0.08)', color: '#4a4540', minWidth: '1.5rem', textAlign: 'center' }}>
                        {group.stories.length}
                      </span>
                    </button>
                    {expanded && group.stories.map(s => (
                      <button
                        key={s.story_id}
                        onClick={() => openStory(s.story_id)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 14px 10px 36px',
                          background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.1s',
                          ...(viewingStory?.story_id === s.story_id
                            ? { borderLeft: '2px solid #0f0f0d', background: 'rgba(0,0,0,0.06)' }
                            : { borderLeft: '2px solid transparent' }),
                        }}
                        onMouseEnter={e => {
                          if (viewingStory?.story_id !== s.story_id) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                        }}
                        onMouseLeave={e => {
                          if (viewingStory?.story_id !== s.story_id) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <p style={{ fontSize: 13, color: '#0f0f0d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{s.title}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(s.themes ?? []).slice(0, 2).map((t, i) => (
                            <span
                              key={i}
                              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, ...themeChipStyle(t) }}
                            >
                              {t}
                            </span>
                          ))}
                          {(s.themes ?? []).length > 2 && (
                            <span style={{ fontSize: 10, color: '#7a7268' }}>
                              +{s.themes.length - 2}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderIdle() {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', background: '#eae5da', border: '1px solid #d4caba', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
            <MessageSquare size={36} style={{ color: '#4a4540' }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f0f0d', marginBottom: 12 }}>BQ Story Prep</h2>
          <p style={{ fontSize: 15, color: '#7a7268', lineHeight: 1.6, marginBottom: 40 }}>
            Build STAR-format stories from your experiences. Each story is automatically tagged with Amazon Leadership Principles and behavioral themes so you know exactly which interview questions it covers.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left', marginBottom: 40 }}>
            {[
              { icon: <Sparkles size={16} />, title: 'AI Story Builder', desc: 'Describe a situation — AI structures it into a full STAR story', accent: '#4a4540' },
              { icon: <Target size={16} />, title: 'Question Coach', desc: 'Type any BQ question — get your best matching story instantly', accent: '#0ea5e9' },
              { icon: <BookOpen size={16} />, title: 'LP Mapping', desc: 'Every story is tagged with Amazon Leadership Principles', accent: '#f97316' },
              { icon: <HelpCircle size={16} />, title: 'Follow-up Prep', desc: 'AI predicts likely follow-up questions for each story', accent: '#10b981' },
            ].map((f, i) => (
              <div key={i} style={{ borderRadius: 12, padding: 20, background: '#eae5da', border: '1px solid #d4caba' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: '#f0ebe2', color: f.accent }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f0f0d' }}>{f.title}</span>
                </div>
                <p style={{ fontSize: 14, color: '#7a7268', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {experiences.length === 0 ? (
            <p style={{ fontSize: 14, color: '#7a7268' }}>
              Add experiences first on the <span style={{ color: '#0f0f0d' }}>Experiences</span> page, then come back to build stories.
            </p>
          ) : (
            <button
              onClick={startBuild}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                background: '#1a1a18', color: '#f5f0e8', border: 'none', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2a2a28')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a1a18')}
            >
              Build your first story
            </button>
          )}
        </div>
      </div>
    )
  }

  function renderBuilder() {
    const selectedExp = experiences.find(e => e.exp_id === buildExpId)
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <button
              onClick={() => setMode('idle')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a7268', lineHeight: 0, padding: 4, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
            >
              <X size={18} />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f0f0d', margin: 0 }}>Build a STAR Story</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Experience selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={LABEL_STYLE}>
                Experience <span style={{ color: '#f87171' }}>*</span>
              </label>
              {experiences.length === 0 ? (
                <div style={{ borderRadius: 10, padding: '14px 16px', background: 'rgba(120,53,15,0.15)', border: '1px solid rgba(146,64,14,0.3)' }}>
                  <p style={{ fontSize: 14, color: 'rgba(252,211,77,0.85)' }}>
                    No experiences found — add some on the Experiences page first.
                  </p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <select
                    value={buildExpId}
                    onChange={e => setBuildExpId(e.target.value)}
                    style={{ ...INPUT, paddingRight: 40, appearance: 'none' }}
                    onFocus={onFocusInput}
                    onBlur={onBlurInput}
                  >
                    {experiences.map(exp => (
                      <option key={exp.exp_id} value={exp.exp_id}>
                        {exp.role} @ {exp.company}{exp.dates ? ` (${exp.dates})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#7a7268' }} />
                </div>
              )}
              {selectedExp?.description && (
                <p style={{ fontSize: 14, color: '#7a7268', background: '#f0ebe2', border: '1px solid #d4caba', borderRadius: 10, padding: '12px 16px' }}>
                  {selectedExp.description}
                </p>
              )}
            </div>

            {/* Story seed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={LABEL_STYLE}>
                Story Seed <span style={{ color: '#f87171' }}>*</span>
              </label>
              <p style={{ fontSize: 12, color: '#9a9288', margin: 0 }}>Briefly describe the situation — 1–3 sentences is enough</p>
              <textarea
                value={buildSeed}
                onChange={e => setBuildSeed(e.target.value)}
                placeholder="e.g. I led a migration of our auth service to a new provider while maintaining zero downtime for 2M users…"
                rows={5}
                style={{ ...INPUT, resize: 'none' }}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
              />
            </div>

            {/* Question hints */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={LABEL_STYLE}>
                  Question Hints <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9a9288' }}>(optional)</span>
                </label>
                <button
                  onClick={handleSuggest}
                  disabled={suggesting || !buildExpId || !buildSeed.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: '1px solid #d4caba', color: '#7a7268', background: 'transparent', cursor: 'pointer',
                    opacity: suggesting || !buildExpId || !buildSeed.trim() ? 0.4 : 1,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
                >
                  {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
                  Get AI hints
                </button>
              </div>
              {suggestions.length > 0 && (
                <div style={{ borderRadius: 10, padding: 20, background: '#f0ebe2', border: '1px solid #d4caba', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 14, color: '#7a7268', margin: 0 }}>
                    Answer these to enrich your story (paste answers into notes below):
                  </p>
                  {suggestions.map((q, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 12, marginTop: 2, flexShrink: 0, fontWeight: 700, color: '#4a4540' }}>{i + 1}.</span>
                      <p style={{ fontSize: 14, color: '#4a4540', margin: 0 }}>{q}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Story title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={LABEL_STYLE}>
                Story Title <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9a9288' }}>(optional)</span>
              </label>
              <input
                value={buildTitle}
                onChange={e => setBuildTitle(e.target.value)}
                placeholder="e.g. Zero-downtime auth migration"
                style={INPUT}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
              />
            </div>

            {/* Extra notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={LABEL_STYLE}>
                Extra Notes <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9a9288' }}>(optional)</span>
              </label>
              <textarea
                value={buildNotes}
                onChange={e => setBuildNotes(e.target.value)}
                placeholder="Answers to the hint questions, additional context, metrics, constraints…"
                rows={4}
                style={{ ...INPUT, resize: 'none' }}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
              />
            </div>

            {/* Target themes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={LABEL_STYLE}>
                Target Themes <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9a9288' }}>(optional)</span>
              </label>
              <div>
                <p style={{ fontSize: 12, color: '#fb923c', marginBottom: 10 }}>Amazon Leadership Principles</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ALL_THEMES.filter(t => AMAZON_LPS.has(t)).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleBuildTheme(t)}
                      style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', ...themeChipStyle(t, buildThemes.includes(t)) }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#38bdf8', marginBottom: 10 }}>General Behavioral</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ALL_THEMES.filter(t => !AMAZON_LPS.has(t)).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleBuildTheme(t)}
                      style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', ...themeChipStyle(t, buildThemes.includes(t)) }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Build button */}
            <button
              onClick={handleBuild}
              disabled={building || !buildExpId || !buildSeed.trim()}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#1a1a18', color: '#f5f0e8', border: 'none',
                cursor: building || !buildExpId || !buildSeed.trim() ? 'not-allowed' : 'pointer',
                opacity: building || !buildExpId || !buildSeed.trim() ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!building) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}
            >
              {building
                ? <><Loader2 size={16} className="animate-spin" />Building your STAR story…</>
                : <><Sparkles size={16} />Build STAR Story</>
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderStoryView() {
    if (loadingStory) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a7268', gap: 8 }}>
        <Loader2 size={20} className="animate-spin" /> Loading story…
      </div>
    )
    if (!viewingStory) return null
    const { star } = viewingStory

    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ flex: 1, marginRight: 16 }}>
              {editingTitle ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    autoFocus
                    style={{ flex: 1, borderRadius: 10, padding: '10px 14px', fontSize: 18, fontWeight: 600, outline: 'none', background: '#f8f4ec', border: '1px solid rgba(0,0,0,0.35)', color: '#0f0f0d', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={handleSaveTitle}
                    disabled={savingTitle || !titleDraft.trim()}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4a4540', lineHeight: 0, padding: 4, opacity: savingTitle || !titleDraft.trim() ? 0.4 : 1, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a4540')}
                  >
                    {savingTitle ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  </button>
                  <button
                    onClick={() => setEditingTitle(false)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a7268', lineHeight: 0, padding: 4, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f0f0d', margin: 0, lineHeight: 1.3 }}>{viewingStory.title}</h2>
                  <button
                    onClick={() => { setTitleDraft(viewingStory.title); setEditingTitle(true) }}
                    title="Rename story"
                    style={{ flexShrink: 0, marginTop: 4, padding: 6, borderRadius: 8, border: '1px solid #d4caba', background: '#f0ebe2', cursor: 'pointer', color: '#9a9288', lineHeight: 0, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b0a898' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9a9288'; e.currentTarget.style.borderColor = '#d4caba' }}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <p style={{ fontSize: 14, color: '#7a7268', marginTop: 6 }}>
                {viewingStory.exp_role} @ {viewingStory.exp_company}
              </p>
            </div>
            <button
              onClick={() => handleDeleteStory(viewingStory.story_id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9a9288', lineHeight: 0, padding: 4, flexShrink: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}
            >
              <Trash2 size={17} />
            </button>
          </div>

          {/* STAR sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {STAR_META.map(({ key, label, borderColor, bg, text, badge, badgeText }) => (
              <div
                key={key}
                style={{ borderLeft: `4px solid ${borderColor}`, borderRadius: '0 10px 10px 0', padding: '20px 24px', background: bg }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: badge, color: badgeText }}>
                    {label}
                  </span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: text }}>{star[key]}</p>
              </div>
            ))}
          </div>

          {/* Themes */}
          {star.themes?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9288', marginBottom: 12 }}>
                Themes covered
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {star.themes.map((t, i) => (
                  <span
                    key={i}
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, ...themeChipStyle(t) }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up questions */}
          {star.follow_up_questions?.length > 0 && (
            <div style={{ marginBottom: 24, borderRadius: 12, padding: 24, background: '#eae5da', border: '1px solid #d4caba' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7a7268', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HelpCircle size={13} /> Likely follow-up questions
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
                {star.follow_up_questions.map((q, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.08)', color: '#4a4540' }}>
                      {i + 1}
                    </span>
                    <p style={{ fontSize: 14, lineHeight: 1.5, color: '#4a4540', margin: 0 }}>{q}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          <div style={{ borderRadius: 12, padding: 24, background: '#eae5da', border: '1px solid #d4caba' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7a7268', margin: 0 }}>
                Personal Notes
              </p>
              {!editingNotes && (
                <button
                  onClick={() => { setNotesDraft(viewingStory.user_notes ?? ''); setEditingNotes(true) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 13, border: '1px solid #d4caba', color: '#9a9288', background: 'transparent', cursor: 'pointer', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}
                >
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <textarea
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  placeholder="Your personal practice notes, delivery tips, things to remember…"
                  rows={5}
                  autoFocus
                  style={{ ...INPUT, resize: 'none', border: '1px solid rgba(0,0,0,0.35)' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: '#1a1a18', color: '#f5f0e8', border: 'none', cursor: 'pointer',
                      opacity: savingNotes ? 0.5 : 1, transition: 'background 0.15s',
                    }}
                  >
                    {savingNotes ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      border: '1px solid #d4caba', color: '#7a7268', background: 'transparent', cursor: 'pointer',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#4a4540' }}>
                {viewingStory.user_notes || (
                  <span style={{ fontStyle: 'italic', color: '#9a9288' }}>
                    No notes yet — click Edit to add personal delivery tips
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  function renderRecommender() {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <button
              onClick={() => setMode('idle')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a7268', lineHeight: 0, padding: 4, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
            >
              <X size={18} />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f0f0d', margin: 0 }}>Question Coach</h2>
          </div>

          <p style={{ fontSize: 15, color: '#7a7268', marginBottom: 32 }}>
            Type a BQ question you're preparing for and get matched to your best story — with key points to emphasize.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={LABEL_STYLE}>Interview Question</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. Tell me about a time you had to make a decision with incomplete information…"
                rows={5}
                style={{ ...INPUT, resize: 'none' }}
                onFocus={onFocusInput}
                onBlur={onBlurInput}
              />
            </div>

            <button
              onClick={handleRecommend}
              disabled={recommending || !question.trim() || stories.length === 0}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#1a1a18', color: '#f5f0e8', border: 'none',
                cursor: recommending || !question.trim() || stories.length === 0 ? 'not-allowed' : 'pointer',
                opacity: recommending || !question.trim() || stories.length === 0 ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!recommending) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}
            >
              {recommending
                ? <><Loader2 size={16} className="animate-spin" />Finding best story…</>
                : <><Target size={16} />Find Best Story</>}
            </button>

            {stories.length === 0 && (
              <p style={{ fontSize: 14, textAlign: 'center', color: 'rgba(251,191,36,0.8)' }}>
                Build some stories first to use the Question Coach.
              </p>
            )}
          </div>

          {recommendation && (
            <div style={{ marginTop: 32, borderRadius: 12, overflow: 'hidden', background: '#eae5da', border: '1px solid #d4caba' }}>
              <div style={{ padding: '20px 24px', background: 'rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7a7268', marginBottom: 6 }}>
                  Best match
                </p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#0f0f0d', margin: 0 }}>{recommendation.story_title}</p>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9288', marginBottom: 8 }}>
                    Why this story
                  </p>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: '#4a4540', margin: 0 }}>{recommendation.reason}</p>
                </div>
                {recommendation.key_points_to_emphasize?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9a9288', marginBottom: 12 }}>
                      Key points to emphasize
                    </p>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                      {recommendation.key_points_to_emphasize.map((pt, i) => (
                        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ flexShrink: 0, marginTop: 2, color: '#4a4540', lineHeight: 0 }}>
                            <ArrowRight size={14} />
                          </span>
                          <span style={{ fontSize: 14, color: '#4a4540' }}>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => openStory(recommendation.story_id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    border: '1px solid #d4caba', color: '#4a4540', background: 'transparent', cursor: 'pointer',
                    transition: 'color 0.15s', alignSelf: 'flex-start',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4a4540')}
                >
                  <BookOpen size={14} /> View full story
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderMain() {
    switch (mode) {
      case 'build':     return renderBuilder()
      case 'view':      return renderStoryView()
      case 'recommend': return renderRecommender()
      default:          return renderIdle()
    }
  }

  // ── Page ───────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div style={{ display: 'flex', height: '100%' }}>
        {renderSidebar()}
        {renderMain()}
      </div>
    </Layout>
  )
}
