import { computeStats, computeDailyBreakdown } from './lib/stats'

const FILE = 'store.json'
const LS_KEY = 'focus-scene-store'

// Tauri 환경 여부 (런타임). 폴백: localStorage.
function hasTauri() {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
}

let cache = null // { sessions: [] }

async function readRaw() {
  if (hasTauri()) {
    const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    if (!(await exists(FILE, { baseDir: BaseDirectory.AppData }))) return null
    return await readTextFile(FILE, { baseDir: BaseDirectory.AppData })
  }
  return localStorage.getItem(LS_KEY)
}

async function writeRaw(text) {
  if (hasTauri()) {
    const { writeTextFile, mkdir, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    if (!(await exists('', { baseDir: BaseDirectory.AppData }))) {
      await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true })
    }
    await writeTextFile(FILE, text, { baseDir: BaseDirectory.AppData })
    return
  }
  localStorage.setItem(LS_KEY, text)
}

async function load() {
  if (cache) return cache
  try {
    const raw = await readRaw()
    cache = raw ? JSON.parse(raw) : { sessions: [] }
  } catch {
    cache = { sessions: [] }
  }
  if (!Array.isArray(cache.sessions)) cache.sessions = []
  return cache
}

async function save() {
  await writeRaw(JSON.stringify(cache))
}

function newId() {
  return 's-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36)
}

export const api = {
  async stats() {
    const { sessions } = await load()
    return computeStats(sessions, new Date())
  },
  async dailyBreakdown() {
    const { sessions } = await load()
    return computeDailyBreakdown(sessions, 14, new Date())
  },
  async createSession(body) {
    const data = await load()
    data.sessions.push({
      id: newId(),
      created_at: new Date().toISOString(),
      task: body.task,
      duration_min: body.duration_min,
      completed: !!body.completed,
      distracted_min: body.distracted_min || 0,
      retro: body.retro ?? null,
      source: body.source || 'text',
      category: body.category || '기타',
      tags: body.tags || [],
    })
    await save()
  },
  async deleteSession(id) {
    const data = await load()
    const before = data.sessions.length
    data.sessions = data.sessions.filter((s) => s.id !== id)
    if (data.sessions.length !== before) await save()
  },
}
