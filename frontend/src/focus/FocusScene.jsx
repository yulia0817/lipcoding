import { getTheme } from './themes'
import './scene.css'

export function FocusScene({ skinId, intensity = 0, active = false }) {
  const theme = getTheme(skinId)
  const scale = 0.7 + intensity * 0.9 // 0.7 ~ 1.6
  const glow = 6 + intensity * 22
  return (
    <div
      className={`scene${active ? '' : ' scene--idle'}`}
      style={{ '--scene-accent': theme.accent, '--scene-bg': theme.bg }}
    >
      <span
        className="scene__flame"
        style={{ transform: `scale(${scale})`, filter: `drop-shadow(0 0 ${glow}px ${theme.accent})` }}
      >
        {theme.emoji}
      </span>
    </div>
  )
}
