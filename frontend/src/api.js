// API 베이스 URL. 배포 시 VITE_API_BASE 환경변수로 백엔드 주소를 주입하세요.
// 로컬에서는 vite proxy(/api → :8000)를 사용하므로 비워둡니다.
const BASE = import.meta.env.VITE_API_BASE || ''

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`${res.status} ${detail}`)
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

  // Focus Campfire
  listSessions: () => req('/api/sessions'),
  createSession: (data) =>
    req('/api/sessions', { method: 'POST', body: JSON.stringify(data) }),
  stats: () => req('/api/stats'),
  weeklySummary: () => req('/api/summary/weekly'),
  dailyBreakdown: () => req('/api/breakdown/daily'),
}
