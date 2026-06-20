import { useCallback, useEffect, useRef, useState } from 'react'

// 포모도로 타이머 훅. 집중(focus)/휴식(break) 모드를 전환합니다.
export function usePomodoro({ focusMin = 25, breakMin = 5 } = {}) {
  const [mode, setMode] = useState('focus') // 'focus' | 'break'
  const [running, setRunning] = useState(false)
  const [durationSec, setDurationSec] = useState(focusMin * 60)
  const [remaining, setRemaining] = useState(focusMin * 60)
  const [distractedSec, setDistractedSec] = useState(0)
  const intervalRef = useRef(null)
  // remaining이 기준으로 삼는 현재 총 길이(초). 항상 최신값을 유지하기 위해 ref 사용.
  const durationRef = useRef(focusMin * 60)

  // 현재 모드에 해당하는 목표 길이(초). 설정 변경 또는 모드 전환 시 바뀜.
  const targetTotal = (mode === 'focus' ? focusMin : breakMin) * 60
  const totalSec = durationSec
  const progress = durationSec > 0 ? 1 - remaining / durationSec : 0

  const setDuration = useCallback((secs) => {
    durationRef.current = secs
    setDurationSec(secs)
  }, [])

  // 집중/휴식 길이가 바뀌면(세션 중에도) 경과 시간 기준으로 남은 시간을 재계산.
  // 예) 25분으로 3초 진행 중 45분으로 변경 → 남은 44:57. idle이면 elapsed=0이라 전체가 새 길이로.
  useEffect(() => {
    setRemaining((r) => {
      const elapsed = Math.max(0, durationRef.current - r)
      return Math.max(0, targetTotal - elapsed)
    })
    setDuration(targetTotal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTotal])

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (!running) {
      clear()
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clear()
          setRunning(false)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return clear
  }, [running])

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])

  const reset = useCallback(
    (nextMode = mode) => {
      clear()
      setRunning(false)
      setMode(nextMode)
      const total = (nextMode === 'focus' ? focusMin : breakMin) * 60
      setDuration(total)
      setRemaining(total)
    },
    [mode, focusMin, breakMin, setDuration],
  )

  const switchMode = useCallback((nextMode) => reset(nextMode), [reset])

  const addDistraction = useCallback((sec) => {
    setDistractedSec((d) => d + sec)
  }, [])

  const resetDistraction = useCallback(() => setDistractedSec(0), [])

  return {
    mode,
    running,
    remaining,
    totalSec,
    progress,
    distractedSec,
    start,
    pause,
    reset,
    switchMode,
    addDistraction,
    resetDistraction,
    finished: remaining === 0,
  }
}

export function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
