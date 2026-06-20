import { useEffect } from 'react'

// 집중 시작 전 짧은 호흡 인트로. "불을 피울 준비" 의식으로 전환을 돕습니다.
// 약 3.5초 후 자동으로 끝나고, 화면을 누르면 즉시 건너뜁니다. (Session 앱 스타일)
export function BreathingIntro({ open, onDone }) {
  useEffect(() => {
    if (!open) return undefined
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [open, onDone])

  if (!open) return null
  return (
    <div className="breathing" onClick={onDone} role="presentation">
      <div className="breathing__circle" />
      <p className="breathing__text">
        불을 피울 준비를 합니다…
        <br />
        <span className="breathing__sub">깊게 숨을 들이쉬고, 천천히 내쉬세요</span>
      </p>
    </div>
  )
}
