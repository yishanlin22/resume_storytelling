import axios from 'axios'

const api = axios.create({ baseURL: '/' })

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear stale token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function register(email: string, password: string, name: string) {
  const res = await api.post('/user/register', { email, password, name })
  return res.data
}

export async function login(email: string, password: string) {
  const res = await api.post('/user/login', { email, password })
  const token = res.data?.token || res.data?.data?.token
  if (token) localStorage.setItem('token', token)
  return res.data
}

export function logout() {
  localStorage.removeItem('token')
}

export function isLoggedIn() {
  return !!localStorage.getItem('token')
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function walker<T = unknown>(name: string, payload?: object): Promise<T> {
  const res = await api.post(`/walker/${name}`, payload ?? {})
  const reports = res.data?.reports ?? res.data?.data?.reports
  if (Array.isArray(reports)) {
    return reports.length === 1 ? reports[0] : reports as T
  }
  return res.data
}

// ─── Resume ──────────────────────────────────────────────────────────────────

export interface ResumeListItem {
  resume_id: string
  version_name: string
  label: string
  file_name: string
  created_at: string
  updated_at: string
  name: string
}

export type SectionKey = 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'certifications'

export interface ParsedResume {
  name: string
  contact: Record<string, string>
  summary: string
  experience: Array<{ company: string; role: string; dates: string; location?: string; bullets: string[] }>
  education: Array<{ institution: string; degree: string; dates: string; gpa?: string }>
  skills: string[]
  projects: Array<{ name: string; dates?: string; bullets: string[]; technologies?: string[] }>
  certifications: string[]
}

export interface ResumeDetail extends ResumeListItem {
  raw_text: string
  parsed: ParsedResume
  section_order: SectionKey[]
}

export const listResumes = () => walker<ResumeListItem[]>('ListResumes')
export const getResume = (resume_id: string) => walker<ResumeDetail>('GetResume', { resume_id })
export const deleteResume = (resume_id: string) => walker('DeleteResume', { resume_id })
export const updateResumeVersion = (resume_id: string, version_name?: string, label?: string) =>
  walker('UpdateResumeVersion', { resume_id, version_name, label })

export async function uploadResume(opts: {
  file?: File
  plain_text?: string
  version_name: string
  label: string
}) {
  let payload: Record<string, string> = {
    version_name: opts.version_name,
    label: opts.label,
  }
  if (opts.file) {
    const b64 = await fileToBase64(opts.file)
    payload.file_name = opts.file.name
    payload.file_data = b64
  } else if (opts.plain_text) {
    payload.plain_text = opts.plain_text
    payload.file_name = 'resume.txt'
  }
  return walker<{ resume_id: string; parsed: ParsedResume }>('UploadResume', payload)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip data URL prefix
      resolve(result.split(',')[1] ?? result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Tailoring ───────────────────────────────────────────────────────────────

export const adjustBullet = (bullet: string, direction: 'shorten' | 'lengthen') =>
  walker<{ bullet: string }>('AdjustBullet', { bullet, direction })

export const tailorResume = (opts: {
  resume_id: string
  job_description: string
  target_role?: string
  company?: string
  add_summary?: boolean
  quantify?: boolean
  keyword_optimize?: boolean
}) => walker<{ resume_id: string; tailored_parsed: ParsedResume }>('TailorResume', opts)

export const saveTailoredResume = (opts: {
  resume_id: string
  tailored_parsed: ParsedResume
  save_as_new?: boolean
  new_version_name?: string
}) => walker('SaveTailoredResume', opts)

export const matchSkills = (resume_id: string, job_description: string) =>
  walker<{ matched: string[]; partial: string[]; missing_key: string[]; score: number }>('MatchSkills', { resume_id, job_description })

export const moveSectionItem = (resume_id: string, section: string, index: number, direction: 'up' | 'down') =>
  walker('MoveSectionItem', { resume_id, section, index, direction })

export const updateSectionOrder = (resume_id: string, section_order: SectionKey[]) =>
  walker('UpdateSectionOrder', { resume_id, section_order })

export const updateResumeParsed = (resume_id: string, parsed_data: ParsedResume) =>
  walker('UpdateResumeParsed', { resume_id, parsed_data })

export const exportResume = (resume_id: string) =>
  walker<{ file_data: string; file_name: string; format: string }>('ExportResume', { resume_id })

// ─── Experiences ─────────────────────────────────────────────────────────────

export interface Experience {
  exp_id: string
  company: string
  role: string
  dates: string
  location: string
  bullets: string[]
  description: string
  story_count: number
  created_at: string
}

export const listExperiences = () => walker<Experience[]>('ListExperiences')
export const addExperience = (data: Omit<Experience, 'exp_id' | 'story_count' | 'created_at'>) =>
  walker('AddExperience', data)
export const updateExperience = (data: Partial<Experience> & { exp_id: string }) =>
  walker('UpdateExperience', data)
export const deleteExperience = (exp_id: string) => walker('DeleteExperience', { exp_id })
export const importExperiencesFromResume = (resume_id: string) =>
  walker('ImportExperiencesFromResume', { resume_id })

// ─── Stories ─────────────────────────────────────────────────────────────────

export interface StarStory {
  situation: string
  task: string
  action: string
  result: string
  themes: string[]
  follow_up_questions: string[]
}

export interface Story {
  story_id: string
  exp_id: string
  exp_company?: string
  exp_role?: string
  title: string
  themes: string[]
  situation: string
  star?: StarStory
  user_notes: string
  created_at: string
  updated_at?: string
}

export const listStories = (exp_id?: string) =>
  walker<Story[]>('ListStories', { exp_id: exp_id ?? '' })
export const getStory = (story_id: string) =>
  walker<Story & { star: StarStory }>('GetStory', { story_id })
export const buildStory = (opts: {
  exp_id: string
  story_seed: string
  title?: string
  themes_hint?: string[]
  user_notes?: string
}) => walker<{ story_id: string; star: StarStory }>('BuildStory', opts)
export const suggestStoryQuestions = (exp_id: string, story_seed: string) =>
  walker<{ questions: string[] }>('SuggestStoryQuestions', { exp_id, story_seed })
export const deleteStory = (story_id: string) => walker('DeleteStory', { story_id })
export const updateStory = (story_id: string, title?: string, user_notes?: string) =>
  walker('UpdateStory', { story_id, title, user_notes })
export const recommendStory = (question: string) =>
  walker<{ story_id: string; story_title: string; reason: string; key_points_to_emphasize: string[] }>(
    'RecommendStory', { question }
  )

// ─── Cover letter ─────────────────────────────────────────────────────────────

export const generateCoverLetter = (opts: {
  resume_id: string
  target_role: string
  company: string
  company_info?: string
  talking_points?: string[]
  tone_notes?: string
}) => walker<{ cover_letter: string }>('GenerateCoverLetter', opts)
