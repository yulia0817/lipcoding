import { useMemo } from 'react'
import { getTheme, AMBIENT_OVERLAY } from './themes'
import './scene.css'

// 파티클 종류별 개수
const COUNTS = { ember: 14, spark: 10, firefly: 12, rain: 22, star: 26, aurora: 0 }

// 결정적(deterministic) 의사난수 — index 기반이라 리렌더에도 위치가 안정적입니다.
function rand(i, salt) {
  const x = Math.sin((i + 1) * 99.13 + salt * 7.7) * 10000
  return x - Math.floor(x)
}

function buildParticles(type) {
  const n = COUNTS[type] || 0
  return Array.from({ length: n }, (_, i) => ({
    left: `${Math.round(rand(i, 1) * 100)}%`,
    delay: `${(rand(i, 2) * 4).toFixed(2)}s`,
    dur: `${(2.2 + rand(i, 3) * 3.2).toFixed(2)}s`,
    size: `${(type === 'star' ? 1.5 : 3) + rand(i, 4) * 4}px`,
    top: `${Math.round(rand(i, 5) * 100)}%`,
  }))
}

function ParticleLayer({ type, className }) {
  const parts = useMemo(() => buildParticles(type), [type])
  if (!parts.length) return null
  return (
    <div className={`scene__particles scene__particles--${type} ${className || ''}`} aria-hidden>
      {parts.map((p, i) => (
        <span
          key={i}
          className="scene__particle"
          style={{
            left: p.left,
            top: type === 'star' ? p.top : undefined,
            width: p.size,
            height: type === 'rain' ? `${10 + parseFloat(p.size) * 3}px` : p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  )
}

export function FocusScene({ skinId, intensity = 0, active = false, ambient = 'off', fill = false }) {
  const theme = getTheme(skinId)
  const scale = 0.7 + intensity * 0.9 // 0.7 ~ 1.6
  const glow = 8 + intensity * 26
  const overlay = AMBIENT_OVERLAY[ambient] || null
  // 앰비언트 오버레이가 스킨 고유 파티클과 같으면 중복 표시하지 않음
  const showOverlay = overlay && overlay !== theme.particle

  return (
    <div
      className={`scene scene--${theme.particle}${active ? ' is-active' : ' scene--idle'}${fill ? ' scene--fill' : ''}`}
      style={{
        '--scene-accent': theme.accent,
        '--scene-accent2': theme.accent2,
        '--scene-bg1': theme.bg1,
        '--scene-bg2': theme.bg2,
        '--scene-ground': theme.ground,
      }}
    >
      {theme.particle === 'aurora' && (
        <>
          <div className="scene__aurora scene__aurora--a" />
          <div className="scene__aurora scene__aurora--b" />
          <ParticleLayer type="star" />
        </>
      )}

      <ParticleLayer type={theme.particle} />
      {showOverlay && <ParticleLayer type={overlay} className="scene__particles--overlay" />}

      <div className="scene__ground" />

      <span
        className="scene__flame"
        style={{
          transform: `scale(${scale})`,
          filter: `drop-shadow(0 0 ${glow}px ${theme.accent})`,
        }}
      >
        {theme.emoji}
      </span>
    </div>
  )
}
