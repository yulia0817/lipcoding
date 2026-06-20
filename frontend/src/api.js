// API 베이스 URL. 배포 시 VITE_API_BASE 환경변수로 백엔드 주소를 주입하세요.
// 로컬에서는 vite proxy(/api → :8000)를 사용하므로 비워둡니다.
const BASE = import.meta.env.VITE_API_BASE || ''

import { getUserId } from './lib/identity'

async function req(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
      ...extraHeaders,
    },
    ...rest,
  })
  if (!res.ok) {
    const raw = await res.text()
    let message = raw
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.detail === 'string') message = parsed.detail
    } catch {
      // 본문이 JSON이 아니면 원문 사용
    }
    const error = new Error(message || `요청 실패 (${res.status})`)
    error.status = res.status
    throw error
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  list: () => req('/api/items'),
  create: (data) => req('/api/items', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    req(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) => req(`/api/items/${id}`, { method: 'DELETE' }),
  captureVoice: (data) =>
    req('/api/voice/capture', { method: 'POST', body: JSON.stringify(data) }),

  // Focus Scene
  listSessions: () => req('/api/sessions'),
  createSession: (data) =>
    req('/api/sessions', { method: 'POST', body: JSON.stringify(data) }),
  stats: () => req('/api/stats'),
  weeklySummary: () => req('/api/summary/weekly'),
  dailyBreakdown: () => req('/api/breakdown/daily'),
  hourlyBreakdown: () => req('/api/breakdown/hourly'),
  categoryBreakdown: () => req('/api/breakdown/category'),

  // Gamify (프로필 / 스킨 / 퀘스트)
  profile: () => req('/api/profile'),
  earn: ({ minutes, completed }) =>
    req('/api/earn', { method: 'POST', body: JSON.stringify({ minutes, completed }) }),
  skins: () => req('/api/skins'),
  quests: () => req('/api/quests'),
  buySkin: (id) => req(`/api/skins/${id}/buy`, { method: 'POST' }),
  equipSkin: (id) => req(`/api/skins/${id}/equip`, { method: 'POST' }),

  // Auth (자체 간단 로그인)
  register: (data) =>
    req('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    req('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  // Teams (같이 집중)
  createGroup: (name) =>
    req('/api/teams', { method: 'POST', body: JSON.stringify({ name }) }),
  joinGroup: (code) =>
    req('/api/teams/join', { method: 'POST', body: JSON.stringify({ code }) }),
  myGroups: () => req('/api/teams/mine'),
  groupSummary: (id) => req(`/api/teams/${id}/summary`),
  groupPresence: (id) => req(`/api/teams/${id}/presence`),
  groupFeed: (id) => req(`/api/teams/${id}/feed`),
  groupHeartbeat: (id, task) =>
    req(`/api/teams/${id}/heartbeat`, { method: 'POST', body: JSON.stringify({ task }) }),

  // GitHub 연동 (MVP: 공개 저장소 커밋)
  ghHeaders: () => {
    const h = {}
    const repo = getGhRepo()
    const token = getGhToken()
    if (repo) h['X-GH-Repo'] = repo
    if (token) h['X-GH-Token'] = token
    return h
  },
  ghTest: () => req('/api/github/test', { headers: api.ghHeaders() }),
  ghCommits: ({ since, until, author } = {}) => {
    const qs = new URLSearchParams()
    if (since) qs.set('since', since)
    if (until) qs.set('until', until)
    if (author) qs.set('author', author)
    const q = qs.toString()
    return req(`/api/github/commits${q ? `?${q}` : ''}`, { headers: api.ghHeaders() })
  },
}
