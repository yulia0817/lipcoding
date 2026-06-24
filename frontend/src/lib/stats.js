// backend/session_store.py 의 stats()/daily_breakdown() 를 로컬 타임존 기준으로 이식.

function pad(n) {
  return String(n).padStart(2, '0')
}

// ISO 문자열을 '로컬' 날짜키(YYYY-MM-DD)로
export function localDayKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function dayKeyFromDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// now 로부터 i일 전 날짜키
function shiftKey(now, i) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
  return dayKeyFromDate(d)
}

export function computeStats(sessions, now = new Date()) {
  const byDay = {}
  let focusTotal = 0
  let distractTotal = 0
  let completed = 0

  for (const s of sessions) {
    const key = localDayKey(s.created_at)
    byDay[key] = (byDay[key] || 0) + s.duration_min
    focusTotal += s.duration_min
    distractTotal += s.distracted_min || 0
    if (s.completed) completed += 1
  }

  const todayKey = dayKeyFromDate(now)
  const yesterdayKey = shiftKey(now, 1)

  // streak: 오늘(또는 어제)부터 연속 집중한 날 수
  let streak = 0
  let cursorIdx = 0
  if (!(byDay[todayKey] > 0) && byDay[yesterdayKey] > 0) {
    cursorIdx = 1
  }
  while (byDay[shiftKey(now, cursorIdx)] > 0) {
    streak += 1
    cursorIdx += 1
  }

  // heatmap: 최근 84일
  const heatmap = {}
  for (let i = 0; i < 84; i++) {
    const key = shiftKey(now, i)
    heatmap[key] = byDay[key] || 0
  }

  return {
    today_minutes: byDay[todayKey] || 0,
    streak_days: streak,
    completed_count: completed,
    total_sessions: sessions.length,
    focus_minutes: focusTotal,
    distracted_minutes: distractTotal,
    heatmap,
  }
}

function hhmm(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function computeDailyBreakdown(sessions, days = 14, now = new Date()) {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
  const cutoffKey = dayKeyFromDate(cutoff)

  const perDay = {}
  for (const s of sessions) {
    const key = localDayKey(s.created_at)
    if (key < cutoffKey) continue
    ;(perDay[key] = perDay[key] || []).push(s)
  }

  const dayKeys = Object.keys(perDay).sort().reverse()
  return dayKeys.map((date) => {
    const daySessions = perDay[date]
    const perTaskMin = {}
    const perTaskCnt = {}
    for (const s of daySessions) {
      perTaskMin[s.task] = (perTaskMin[s.task] || 0) + s.duration_min
      perTaskCnt[s.task] = (perTaskCnt[s.task] || 0) + 1
    }
    const tasks = Object.keys(perTaskMin)
      .map((t) => ({ task: t, minutes: perTaskMin[t], count: perTaskCnt[t] }))
      .sort((a, b) => b.minutes - a.minutes)

    const entries = daySessions
      .map((s) => {
        const end = new Date(s.created_at)
        const startDate = new Date(end.getTime() - s.duration_min * 60000)
        return {
          _startTs: startDate.getTime(),
          start: hhmm(startDate),
          end: hhmm(end),
          task: s.task,
          category: s.category,
          duration_min: s.duration_min,
          completed: s.completed,
          distracted_min: s.distracted_min || 0,
          source: s.source,
          retro: s.retro,
          tags: s.tags || [],
        }
      })
      .sort((a, b) => a._startTs - b._startTs)
      .map(({ _startTs: _ignored, ...rest }) => rest)

    return {
      date,
      total_minutes: daySessions.reduce((sum, s) => sum + s.duration_min, 0),
      session_count: daySessions.length,
      tasks,
      entries,
    }
  })
}
