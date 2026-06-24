import { describe, it, expect, beforeEach, vi } from 'vitest'

// localStorage 폴리필 (node 환경)
beforeEach(() => {
  const store = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  })
  // Tauri 미존재 환경을 명시
  vi.stubGlobal('window', { __TAURI_INTERNALS__: undefined })
})

describe('localStore api', () => {
  it('createSession 후 stats/dailyBreakdown 에 반영된다', async () => {
    const { api } = await import('./localStore')
    await api.createSession({
      task: '코테',
      duration_min: 25,
      completed: true,
      distracted_min: 2,
      retro: null,
      source: 'text',
      category: '공부',
      tags: ['코테'],
    })
    const stats = await api.stats()
    expect(stats.total_sessions).toBe(1)
    expect(stats.focus_minutes).toBe(25)
    expect(stats.distracted_minutes).toBe(2)

    const daily = await api.dailyBreakdown()
    expect(daily[0].total_minutes).toBe(25)
    expect(daily[0].tasks[0].task).toBe('코테')
  })

  it('저장은 localStorage에 영속화되어 다시 읽힌다', async () => {
    vi.resetModules()
    const m1 = await import('./localStore')
    await m1.api.createSession({
      task: '독서', duration_min: 50, completed: true,
      distracted_min: 0, retro: null, source: 'text', category: '독서', tags: [],
    })
    vi.resetModules() // 모듈 캐시 초기화 → 디스크(=localStorage)에서 다시 로드
    const m2 = await import('./localStore')
    const stats = await m2.api.stats()
    expect(stats.total_sessions).toBe(1)
  })

  it('deleteSession 은 해당 id 세션만 지우고 영속화한다', async () => {
    vi.resetModules()
    const { api } = await import('./localStore')
    await api.createSession({
      task: 'A', duration_min: 10, completed: true,
      distracted_min: 0, retro: null, source: 'text', category: '공부', tags: [],
    })
    await api.createSession({
      task: 'B', duration_min: 20, completed: true,
      distracted_min: 0, retro: null, source: 'text', category: '공부', tags: [],
    })
    const daily = await api.dailyBreakdown()
    const entries = daily[0].entries
    expect(entries).toHaveLength(2)

    const targetId = entries.find((e) => e.task === 'A').id
    await api.deleteSession(targetId)

    // 모듈 캐시 초기화 → localStorage에서 다시 로드(영속 확인)
    vi.resetModules()
    const m2 = await import('./localStore')
    const after = await m2.api.dailyBreakdown()
    expect(after[0].entries).toHaveLength(1)
    expect(after[0].entries[0].task).toBe('B')
  })
})
