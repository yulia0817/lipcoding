import { useCallback, useState } from 'react'

// 오늘의 집중 목표(완료한 포모도로 수) 훅. 로컬 캐시에 저장합니다.
// 날짜가 바뀌면 진척도는 자동으로 0부터 다시 시작해요.
const GOAL_KEY = 'focus-daily-goal'
const PROGRESS_KEY = 'focus-daily-progress'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function readProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
    return p.date === todayStr() ? p.count || 0 : 0
  } catch {
    return 0
  }
}

export function useDailyGoal() {
  const [goal, setGoalState] = useState(() => Number(localStorage.getItem(GOAL_KEY)) || 4)
  const [progress, setProgress] = useState(readProgress)

  const setGoal = useCallback((g) => {
    const v = Math.max(1, Math.min(20, Math.round(g) || 1))
    setGoalState(v)
    localStorage.setItem(GOAL_KEY, String(v))
  }, [])

  const markDone = useCallback(() => {
    setProgress((c) => {
      const n = c + 1
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ date: todayStr(), count: n }))
      return n
    })
  }, [])

  return { goal, setGoal, progress, markDone, reached: progress >= goal }
}
