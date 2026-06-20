import { useEffect } from 'react'

// 타이머가 도는 동안 브라우저 탭 제목에 남은 시간을 표시합니다.
// 탭을 전환해도 불꽃 이모지와 카운트다운이 보여요. (Pomodor.app 스타일)
export function useDocumentTitle(running, mode, remaining, base = 'Focus Campfire') {
  useEffect(() => {
    if (running) {
      const m = Math.floor(remaining / 60)
      const s = remaining % 60
      const clock = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      const icon = mode === 'focus' ? '🔥' : '☕'
      const label = mode === 'focus' ? '집중' : '휴식'
      document.title = `${icon} ${clock} · ${label}`
    } else {
      document.title = base
    }
    return () => {
      document.title = base
    }
  }, [running, mode, remaining, base])
}
