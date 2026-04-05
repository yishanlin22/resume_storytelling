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

  // ── Shared input style ─────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = { background: '#f8f4ec', border: '1px solid #d4caba', color: '#0f0f0d' }

  // ── Renders ────────────────────────────────────────────────────────────────

  function renderSidebar() {
    return (
      <div
        className="w-80 shrink-0 flex flex-col h-full overflow-hidden"
        style={{ borderRight: '1px solid #d4caba' }}
      >
        <div className="px-6 pt-8 pb-6 shrink-0 space-y-3" style={{ borderBottom: '1px solid #d4caba' }}>
          <button
            onClick={startBuild}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: '#1a1a18',
              color: '#f5f0e8',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a28')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1a18')}
          >
            <Plus size={15} /> Build New Story
          </button>
          <button
            onClick={startRecommender}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all"
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
            <Target size={15} /> Question Coach
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingData ? (
            <div className="px-6 pt-8 text-sm flex items-center gap-2" style={{ color: '#7a7268' }}>
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : stories.length === 0 ? (
            <div className="p-8 text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#eae5da', border: '1px solid #d4caba' }}
              >
                <BookOpen size={20} style={{ color: '#7a7268' }} />
              </div>
              <p className="text-sm" style={{ color: '#7a7268' }}>No stories yet — build your first one!</p>
            </div>
          ) : (
            <div className="pt-4 pb-2">
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
                      className="w-full flex items-center gap-2.5 px-4 py-3.5 pr-4 transition-colors hover:bg-black/[0.04]"
                    >
                      {expanded
                        ? <ChevronDown size={13} className="shrink-0" style={{ color: '#7a7268' }} />
                        : <ChevronRight size={13} className="shrink-0" style={{ color: '#7a7268' }} />}
                      <div className="flex-1 text-left min-w-0 mr-2">
                        <p className="text-sm font-semibold truncate" style={{ color: '#0f0f0d' }}>{group.company}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: '#4a4540' }}>{group.role}</p>
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full shrink-0 font-medium"
                        style={{ background: 'rgba(0,0,0,0.08)', color: '#4a4540', minWidth: '1.5rem', textAlign: 'center' }}
                      >
                        {group.stories.length}
                      </span>
                    </button>
                    {expanded && group.stories.map(s => (
                      <button
                        key={s.story_id}
                        onClick={() => openStory(s.story_id)}
                        className="w-full text-left px-5 py-3 pl-10 transition-all"
                        style={
                          viewingStory?.story_id === s.story_id
                            ? {
                                borderLeft: '2px solid #0f0f0d',
                                background: 'rgba(0,0,0,0.06)',
                              }
                            : { borderLeft: '2px solid transparent' }
                        }
                        onMouseEnter={e => {
                          if (viewingStory?.story_id !== s.story_id) {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (viewingStory?.story_id !== s.story_id) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <p className="text-sm truncate mb-1.5" style={{ color: '#0f0f0d' }}>{s.title}</p>
                        <div className="flex flex-wrap gap-1">
                          {(s.themes ?? []).slice(0, 2).map((t, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={themeChipStyle(t)}
                            >
                              {t}
                            </span>
                          ))}
                          {(s.themes ?? []).length > 2 && (
                            <span className="text-[10px]" style={{ color: '#7a7268' }}>
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
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{
              background: '#eae5da',
              border: '1px solid #d4caba',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <MessageSquare size={36} style={{ color: '#4a4540' }} />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight"
            style={{ color: '#0f0f0d' }}>BQ Story Prep</h2>
          <p className="text-base leading-relaxed mb-10" style={{ color: '#7a7268' }}>
            Build STAR-format stories from your experiences. Each story is automatically tagged with Amazon Leadership Principles and behavioral themes so you know exactly which interview questions it covers.
          </p>

          <div className="grid grid-cols-2 gap-4 text-left mb-10">
            {[
              { icon: <Sparkles size={16} />, title: 'AI Story Builder', desc: 'Describe a situation — AI structures it into a full STAR story', accent: '#4a4540' },
              { icon: <Target size={16} />, title: 'Question Coach', desc: 'Type any BQ question — get your best matching story instantly', accent: '#0ea5e9' },
              { icon: <BookOpen size={16} />, title: 'LP Mapping', desc: 'Every story is tagged with Amazon Leadership Principles', accent: '#f97316' },
              { icon: <HelpCircle size={16} />, title: 'Follow-up Prep', desc: 'AI predicts likely follow-up questions for each story', accent: '#10b981' },
            ].map((f, i) => (
              <div
                key={i}
                className="rounded-xl p-5 transition-all"
                style={{
                  background: '#eae5da',
                  border: '1px solid #d4caba',
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: '#f0ebe2', color: f.accent }}>
                    {f.icon}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: '#0f0f0d' }}>{f.title}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#7a7268' }}>{f.desc}</p>
              </div>
            ))}
          </div>
          {experiences.length === 0 ? (
            <p className="text-sm" style={{ color: '#7a7268' }}>
              Add experiences first on the <span style={{ color: '#0f0f0d' }}>Experiences</span> page, then come back to build stories.
            </p>
          ) : (
            <button
              onClick={startBuild}
              className="w-full py-4 rounded-xl text-base font-semibold transition-all"
              style={{
                background: '#1a1a18',
                color: '#f5f0e8',
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
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setMode('idle')}
              className="transition-colors p-1"
              style={{ color: '#7a7268' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
            >
              <X size={18} />
            </button>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#0f0f0d' }}>Build a STAR Story</h2>
          </div>

          <div className="space-y-6">
            {/* Experience selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#9a9288' }}>
                Experience <span style={{ color: '#f87171' }}>*</span>
              </label>
              {experiences.length === 0 ? (
                <div
                  className="rounded-xl px-5 py-4"
                  style={{ background: 'rgba(120,53,15,0.15)', border: '1px solid rgba(146,64,14,0.3)' }}
                >
                  <p className="text-sm" style={{ color: 'rgba(252,211,77,0.85)' }}>
                    No experiences found — add some on the Experiences page first.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={buildExpId}
                    onChange={e => setBuildExpId(e.target.value)}
                    className="w-full appearance-none rounded-xl px-4 py-3.5 text-sm focus:outline-none pr-10 transition-colors"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
                  >
                    {experiences.map(exp => (
                      <option key={exp.exp_id} value={exp.exp_id}>
                        {exp.role} @ {exp.company}{exp.dates ? ` (${exp.dates})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-4 pointer-events-none" style={{ color: '#7a7268' }} />
                </div>
              )}
              {selectedExp?.description && (
                <p
                  className="mt-2.5 text-sm line-clamp-2 px-4 py-3 rounded-xl"
                  style={{ color: '#7a7268', background: '#f0ebe2', border: '1px solid #d4caba' }}
                >
                  {selectedExp.description}
                </p>
              )}
            </div>

            {/* Story seed */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#9a9288' }}>
                Story Seed <span style={{ color: '#f87171' }}>*</span>
              </label>
              <p className="text-xs mb-2.5" style={{ color: '#9a9288' }}>Briefly describe the situation — 1–3 sentences is enough</p>
              <textarea
                value={buildSeed}
                onChange={e => setBuildSeed(e.target.value)}
                placeholder="e.g. I led a migration of our auth service to a new provider while maintaining zero downtime for 2M users…"
                rows={5}
                className="w-full rounded-xl px-4 py-3.5 text-sm placeholder-[#b0a898] focus:outline-none resize-none transition-colors"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
              />
            </div>

            {/* Question hints */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9a9288' }}>
                  Question Hints <span style={{ color: '#9a9288', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <button
                  onClick={handleSuggest}
                  disabled={suggesting || !buildExpId || !buildSeed.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                  style={{ border: '1px solid #d4caba', color: '#7a7268' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
                >
                  {suggesting ? <Loader2 size={12} className="animate-spin" /> : <Lightbulb size={12} />}
                  Get AI hints
                </button>
              </div>
              {suggestions.length > 0 && (
                <div
                  className="rounded-xl p-5 space-y-3"
                  style={{ background: '#f0ebe2', border: '1px solid #d4caba' }}
                >
                  <p className="text-sm mb-2" style={{ color: '#7a7268' }}>
                    Answer these to enrich your story (paste answers into notes below):
                  </p>
                  {suggestions.map((q, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="text-xs mt-0.5 shrink-0 font-bold" style={{ color: '#4a4540' }}>{i + 1}.</span>
                      <p className="text-sm" style={{ color: '#4a4540' }}>{q}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#9a9288' }}>
                Story Title <span style={{ color: '#9a9288', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <input
                value={buildTitle}
                onChange={e => setBuildTitle(e.target.value)}
                placeholder="e.g. Zero-downtime auth migration"
                className="w-full rounded-xl px-4 py-3.5 text-sm placeholder-[#b0a898] focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
              />
            </div>

            {/* Extra notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#9a9288' }}>
                Extra Notes <span style={{ color: '#9a9288', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                value={buildNotes}
                onChange={e => setBuildNotes(e.target.value)}
                placeholder="Answers to the hint questions, additional context, metrics, constraints…"
                rows={4}
                className="w-full rounded-xl px-4 py-3.5 text-sm placeholder-[#b0a898] focus:outline-none resize-none transition-colors"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
              />
            </div>

            {/* Target themes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9a9288' }}>
                Target Themes <span style={{ color: '#9a9288', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <div className="mb-4">
                <p className="text-xs mb-2.5" style={{ color: '#fb923c' }}>Amazon Leadership Principles</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_THEMES.filter(t => AMAZON_LPS.has(t)).map(t => (
                    <button
                      key={t}
                      onClick={() => toggleBuildTheme(t)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={themeChipStyle(t, buildThemes.includes(t))}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs mb-2.5" style={{ color: '#38bdf8' }}>General Behavioral</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_THEMES.filter(t => !AMAZON_LPS.has(t)).map(t => (
                    <button
                      key={t}
                      onClick={() => toggleBuildTheme(t)}
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={themeChipStyle(t, buildThemes.includes(t))}
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
              className="w-full py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: '#1a1a18',
                color: '#f5f0e8',
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
      <div className="flex-1 flex items-center justify-center" style={{ color: '#7a7268' }}>
        <Loader2 size={20} className="animate-spin mr-2" /> Loading story…
      </div>
    )
    if (!viewingStory) return null
    const { star } = viewingStory

    return (
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1 mr-4">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    autoFocus
                    className="flex-1 rounded-xl px-4 py-2.5 text-lg font-semibold focus:outline-none"
                    style={{ background: '#f8f4ec', border: '1px solid rgba(0,0,0,0.35)', color: '#0f0f0d' }}
                  />
                  <button
                    onClick={handleSaveTitle}
                    disabled={savingTitle || !titleDraft.trim()}
                    className="transition-colors disabled:opacity-40 p-1"
                    style={{ color: '#4a4540' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a4540')}
                  >
                    {savingTitle ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  </button>
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="transition-colors p-1"
                    style={{ color: '#7a7268' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <h2 className="text-2xl font-bold tracking-tight leading-snug" style={{ color: '#0f0f0d' }}>{viewingStory.title}</h2>
                  <button
                    onClick={() => { setTitleDraft(viewingStory.title); setEditingTitle(true) }}
                    className="shrink-0 mt-1 p-1.5 rounded-lg transition-all"
                    title="Rename story"
                    style={{ color: '#9a9288', border: '1px solid #d4caba', background: '#f0ebe2' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#0f0f0d'; e.currentTarget.style.borderColor = '#b0a898' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9a9288'; e.currentTarget.style.borderColor = '#d4caba' }}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <p className="text-sm mt-1.5" style={{ color: '#7a7268' }}>
                {viewingStory.exp_role} @ {viewingStory.exp_company}
              </p>
            </div>
            <button
              onClick={() => handleDeleteStory(viewingStory.story_id)}
              className="transition-colors shrink-0 p-1"
              style={{ color: '#9a9288' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}
            >
              <Trash2 size={17} />
            </button>
          </div>

          {/* STAR sections */}
          <div className="space-y-4 mb-8">
            {STAR_META.map(({ key, label, borderColor, bg, text, badge, badgeText }) => (
              <div
                key={key}
                className="rounded-r-xl px-6 py-5"
                style={{
                  borderLeft: `4px solid ${borderColor}`,
                  background: bg,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: badge, color: badgeText }}
                  >
                    {label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: text }}>{star[key]}</p>
              </div>
            ))}
          </div>

          {/* Themes */}
          {star.themes?.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9a9288' }}>
                Themes covered
              </p>
              <div className="flex flex-wrap gap-2">
                {star.themes.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={themeChipStyle(t)}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up questions */}
          {star.follow_up_questions?.length > 0 && (
            <div
              className="mb-6 rounded-xl p-6"
              style={{
                background: '#eae5da',
                border: '1px solid #d4caba',
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-1.5"
                style={{ color: '#7a7268' }}
              >
                <HelpCircle size={13} /> Likely follow-up questions
              </p>
              <ul className="space-y-3">
                {star.follow_up_questions.map((q, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span
                      className="text-xs font-bold shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.08)', color: '#4a4540', fontSize: '10px' }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: '#4a4540' }}>{q}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          <div
            className="rounded-xl p-6"
            style={{
              background: '#eae5da',
              border: '1px solid #d4caba',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#7a7268' }}>
                Personal Notes
              </p>
              {!editingNotes && (
                <button
                  onClick={() => { setNotesDraft(viewingStory.user_notes ?? ''); setEditingNotes(true) }}
                  className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
                  style={{ border: '1px solid #d4caba', color: '#9a9288' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9a9288')}
                >
                  <Edit2 size={12} /> Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  placeholder="Your personal practice notes, delivery tips, things to remember…"
                  rows={5}
                  autoFocus
                  className="w-full rounded-xl px-4 py-3.5 text-sm placeholder-[#b0a898] focus:outline-none resize-none transition-colors"
                  style={{ background: '#f8f4ec', border: '1px solid rgba(0,0,0,0.35)', color: '#0f0f0d' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="flex items-center gap-1.5 text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    style={{
                      background: '#1a1a18',
                      color: '#f5f0e8',
                    }}
                  >
                    {savingNotes ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="text-sm px-5 py-2.5 rounded-xl border transition-colors"
                    style={{ border: '1px solid #d4caba', color: '#7a7268' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: '#4a4540' }}>
                {viewingStory.user_notes || (
                  <span className="italic" style={{ color: '#9a9288' }}>
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
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setMode('idle')}
              className="transition-colors p-1"
              style={{ color: '#7a7268' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#0f0f0d')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7a7268')}
            >
              <X size={18} />
            </button>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#0f0f0d' }}>Question Coach</h2>
          </div>

          <p className="text-base mb-8" style={{ color: '#7a7268' }}>
            Type a BQ question you're preparing for and get matched to your best story — with key points to emphasize.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: '#9a9288' }}>
                Interview Question
              </label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="e.g. Tell me about a time you had to make a decision with incomplete information…"
                rows={5}
                className="w-full rounded-xl px-4 py-3.5 text-sm placeholder-[#b0a898] focus:outline-none resize-none transition-colors"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.35)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#d4caba')}
              />
            </div>
            <button
              onClick={handleRecommend}
              disabled={recommending || !question.trim() || stories.length === 0}
              className="w-full py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: '#1a1a18',
                color: '#f5f0e8',
              }}
              onMouseEnter={e => { if (!recommending) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a28' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a18' }}
            >
              {recommending
                ? <><Loader2 size={16} className="animate-spin" />Finding best story…</>
                : <><Target size={16} />Find Best Story</>}
            </button>
            {stories.length === 0 && (
              <p className="text-sm text-center" style={{ color: 'rgba(251,191,36,0.8)' }}>
                Build some stories first to use the Question Coach.
              </p>
            )}
          </div>

          {recommendation && (
            <div
              className="mt-8 rounded-2xl overflow-hidden"
              style={{
                background: '#eae5da',
                border: '1px solid #d4caba',
              }}
            >
              <div
                className="px-6 py-5"
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#7a7268' }}>
                  Best match
                </p>
                <p className="text-lg font-semibold" style={{ color: '#0f0f0d' }}>{recommendation.story_title}</p>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#9a9288' }}>
                    Why this story
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#4a4540' }}>{recommendation.reason}</p>
                </div>
                {recommendation.key_points_to_emphasize?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#9a9288' }}>
                      Key points to emphasize
                    </p>
                    <ul className="space-y-2.5">
                      {recommendation.key_points_to_emphasize.map((pt, i) => (
                        <li key={i} className="flex gap-2.5 items-start">
                          <span className="shrink-0 mt-0.5" style={{ color: '#4a4540' }}>
                            <ArrowRight size={14} />
                          </span>
                          <span className="text-sm" style={{ color: '#4a4540' }}>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => openStory(recommendation.story_id)}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                  style={{ border: '1px solid #d4caba', color: '#4a4540' }}
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
      <div className="flex h-full">
        {renderSidebar()}
        {renderMain()}
      </div>
    </Layout>
  )
}
