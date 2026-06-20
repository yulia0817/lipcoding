import { useEffect } from 'react'
import { getTheme } from './themes'

// 집중 시작 전 짧은 인트로. 장착한 스킨에 맞춰 배경·심볼·문구가 "세트"로 바뀝니다.
// 약 3.8초 후 자동으로 끝나고, 화면을 누르면 즉시 건너뜁니다.
export function BreathingIntro({ open, onDone, skinId = 'campfire' }) {
  const theme = getTheme(skinId)

  useEffect(() => {
    if (!open) return undefined
    const t = setTimeout(onDone, 3800)
    return () => clearTimeout(t)
  }, [open, onDone])

  if (!open) return null
  return (
    <div
      className={`intro intro--${theme.particle}`}
      onClick={onDone}
      role="presentation"
      style={{
        '--scene-accent': theme.accent,
        '--scene-accent2': theme.accent2,
        '--scene-bg1': theme.bg1,
        '--scene-bg2': theme.bg2,
      }}
    >
      <div className="intro__glow" />
      <div className="intro__symbol">{theme.emoji}</div>
      <p className="intro__text">
        {theme.intro}
        <br />
        <span className="intro__sub">깊게 숨을 들이쉬고, 천천히 내쉬세요</span>
      </p>
      <span className="intro__skip">화면을 누르면 바로 시작</span>
    </div>
  )
}
