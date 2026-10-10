import { useCallback, useEffect, useRef, useState } from 'react'

// 포모도로 타이머 훅. 집중(focus)/휴식(break) 모드를 전환합니다.
//
// 남은 시간은 setInterval 틱 수를 세지 않고 "끝나는 시각(endAt)"과 현재 시각의 차로 계산한다.
// 창이 숨겨지거나 맥이 잠들면 틱이 늦게 오거나 멈추는데, 틱을 세는 방식이면 그만큼 시간이 밀린다.
export function usePomodoro({ focusMin = 25, breakMin = 5 } = {}) {
  const [mode, setMode] = useState('focus') // 'focus' | 'break'
  const [running, setRunning] = useState(false)
  const [durationSec, setDurationSec] = useState(focusMin * 60)
  const [remaining, setRemainingState] = useState(focusMin * 60)
  const [distractedSec, setDistractedSec] = useState(0)
  // 콜백·이펙트가 항상 최신값을 보도록 ref 로도 들고 있는다.
  const durationRef = useRef(focusMin * 60)
  const remainingRef = useRef(focusMin * 60)
  const endAtRef = useRef(null) // 실행 중일 때만 값이 있음(ms)

  // 현재 모드에 해당하는 목표 길이(초). 설정 변경 또는 모드 전환 시 바뀜.
  const targetTotal = (mode === 'focus' ? focusMin : breakMin) * 60
  const totalSec = durationSec
  const progress = durationSec > 0 ? 1 - remaining / durationSec : 0

  const setDuration = useCallback((secs) => {
    durationRef.current = secs
    setDurationSec(secs)
  }, [])

  const setRemaining = useCallback((secs) => {
    remainingRef.current = secs
    setRemainingState(secs)
  }, [])

  // 실행 중이면 endAt 기준, 아니면 저장된 남은 시간.
  const currentRemaining = () =>
    endAtRef.current
      ? Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
      : remainingRef.current

  // 집중/휴식 길이가 바뀌면(세션 중에도) 경과 시간 기준으로 남은 시간을 재계산.
  // 예) 25분으로 3초 진행 중 45분으로 변경 → 남은 44:57. idle이면 elapsed=0이라 전체가 새 길이로.
  useEffect(() => {
    const elapsed = Math.max(0, durationRef.current - currentRemaining())
    const next = Math.max(0, targetTotal - elapsed)
    setRemaining(next)
    if (endAtRef.current) endAtRef.current = Date.now() + next * 1000
    setDuration(targetTotal)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTotal])

  useEffect(() => {
    if (!running) return undefined
    const tick = () => {
      if (!endAtRef.current) return
      const r = currentRemaining()
      if (r !== remainingRef.current) setRemaining(r)
      if (r === 0) {
        endAtRef.current = null
        setRunning(false)
      }
    }
    tick()
    const id = setInterval(tick, 500)
    // 창이 다시 보이면 다음 틱을 기다리지 않고 바로 맞춘다.
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const start = useCallback(() => {
    if (endAtRef.current) return
    endAtRef.current = Date.now() + remainingRef.current * 1000
    setRunning(true)
  }, [])

  const pause = useCallback(() => {
    if (endAtRef.current) {
      setRemaining(currentRemaining())
      endAtRef.current = null
    }
    setRunning(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setRemaining])

  const reset = useCallback(
    (nextMode = mode) => {
      endAtRef.current = null
      setRunning(false)
      setMode(nextMode)
      const total = (nextMode === 'focus' ? focusMin : breakMin) * 60
      setDuration(total)
      setRemaining(total)
    },
    [mode, focusMin, breakMin, setDuration, setRemaining],
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
