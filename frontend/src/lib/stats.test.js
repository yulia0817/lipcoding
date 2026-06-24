import { describe, it, expect } from 'vitest'
import { computeStats, computeDailyBreakdown, localDayKey } from './stats'

// 로컬 자정 기준 ISO 만들기 (테스트 안정화를 위해 정오로 고정)
function isoLocal(y, m, d, hh = 12, mm = 0) {
  return new Date(y, m - 1, d, hh, mm, 0).toISOString()
}

const NOW = new Date(2026, 5, 24, 15, 0, 0) // 2026-06-24 15:00 로컬

function session(over = {}) {
  return {
    id: over.id || Math.random().toString(36).slice(2),
    created_at: over.created_at || isoLocal(2026, 6, 24),
    task: over.task ?? '공부',
    duration_min: over.duration_min ?? 25,
    completed: over.completed ?? true,
    distracted_min: over.distracted_min ?? 0,
    retro: over.retro ?? null,
    source: over.source ?? 'text',
    category: over.category ?? '공부',
    tags: over.tags ?? [],
  }
}

describe('localDayKey', () => {
  it('로컬 날짜를 YYYY-MM-DD로 만든다', () => {
    expect(localDayKey(isoLocal(2026, 6, 24))).toBe('2026-06-24')
  })
})

describe('computeStats', () => {
  it('빈 배열이면 0과 84일 히트맵을 돌려준다', () => {
    const s = computeStats([], NOW)
    expect(s.today_minutes).toBe(0)
    expect(s.streak_days).toBe(0)
    expect(s.total_sessions).toBe(0)
    expect(Object.keys(s.heatmap)).toHaveLength(84)
    expect(s.heatmap['2026-06-24']).toBe(0)
  })

  it('오늘 집중분/완료수/집중·딴짓분을 합산한다', () => {
    const s = computeStats(
      [
        session({ duration_min: 25, distracted_min: 3, completed: true }),
        session({ duration_min: 50, distracted_min: 0, completed: false }),
      ],
      NOW,
    )
    expect(s.today_minutes).toBe(75)
    expect(s.completed_count).toBe(1)
    expect(s.total_sessions).toBe(2)
    expect(s.focus_minutes).toBe(75)
    expect(s.distracted_minutes).toBe(3)
    expect(s.heatmap['2026-06-24']).toBe(75)
  })

  it('streak: 오늘부터 연속으로 집중한 날 수를 센다', () => {
    const s = computeStats(
      [
        session({ created_at: isoLocal(2026, 6, 24) }),
        session({ created_at: isoLocal(2026, 6, 23) }),
        session({ created_at: isoLocal(2026, 6, 22) }),
        // 6/21 공백 → 끊김
        session({ created_at: isoLocal(2026, 6, 20) }),
      ],
      NOW,
    )
    expect(s.streak_days).toBe(3)
  })

  it('streak: 오늘 0분이어도 어제 집중했으면 어제부터 센다', () => {
    const s = computeStats(
      [session({ created_at: isoLocal(2026, 6, 23) })],
      NOW,
    )
    expect(s.streak_days).toBe(1)
  })
})

describe('computeDailyBreakdown', () => {
  it('날짜별 합계·작업·엔트리를 만든다(최신 날짜 우선)', () => {
    const rows = computeDailyBreakdown(
      [
        session({ created_at: isoLocal(2026, 6, 24, 9, 0), task: '코테', duration_min: 25 }),
        session({ created_at: isoLocal(2026, 6, 24, 10, 0), task: '코테', duration_min: 25 }),
        session({ created_at: isoLocal(2026, 6, 23, 9, 0), task: '독서', duration_min: 50 }),
      ],
      14,
      NOW,
    )
    expect(rows[0].date).toBe('2026-06-24')
    expect(rows[0].total_minutes).toBe(50)
    expect(rows[0].session_count).toBe(2)
    expect(rows[0].tasks[0]).toEqual({ task: '코테', minutes: 50, count: 2 })
    expect(rows[0].entries).toHaveLength(2)
    expect(rows[0].entries[0].start).toBe('08:35') // 09:00 - 25분
    expect(rows[0].entries[0].end).toBe('09:00')
    expect(rows[1].date).toBe('2026-06-23')
  })

  it('days 범위 밖 세션은 제외한다', () => {
    const rows = computeDailyBreakdown(
      [session({ created_at: isoLocal(2026, 5, 1) })],
      14,
      NOW,
    )
    expect(rows).toHaveLength(0)
  })
})
