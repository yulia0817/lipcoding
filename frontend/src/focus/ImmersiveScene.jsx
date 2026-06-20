import { useEffect, useRef, useState } from 'react'
import { FocusScene } from './FocusScene'
import { IconVolume, IconVolumeOff, IconMinimize } from '../design/icons'
import { CategoryIcon } from './CategoryTagPicker'
import './immersive.css'

// 스킨이 화면 전체를 채우고 시간만 크게 보여주는 몰입 모드.
// onExit 으로 축소(닫기). 마우스가 멈추면 컨트롤이 서서히 사라집니다.
export function ImmersiveScene({
  skinId,
  ambient,
  intensity = 0,
  active = false,
  modeLabel,
  timeLabel,
  task,
  taskIcon,
  onExit,
  children,
}) {
  const [idleUi, setIdleUi] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const lastSound = useRef('fire')

  const ambientCurrent = ambient?.current || 'off'
  const soundOn = ambientCurrent !== 'off'
  // 마지막으로 켰던 사운드를 기억해 토글 시 복원
  useEffect(() => {
    if (soundOn) lastSound.current = ambientCurrent
  }, [ambientCurrent, soundOn])

  function toggleSound() {
    if (!ambient?.play) return
    ambient.play(soundOn ? 'off' : lastSound.current || 'fire')
  }

  // 현재 시각(시계) — 1초마다 갱신
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const clock = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  // ESC 로 축소
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onExit?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  // 일정 시간 마우스 정지 시 UI 페이드 아웃(시간만 남김)
  useEffect(() => {
    let t
    function wake() {
      setIdleUi(false)
      clearTimeout(t)
      t = setTimeout(() => setIdleUi(true), 2800)
    }
    wake()
    window.addEventListener('mousemove', wake)
    window.addEventListener('touchstart', wake)
    return () => {
      clearTimeout(t)
      window.removeEventListener('mousemove', wake)
      window.removeEventListener('touchstart', wake)
    }
  }, [])

  return (
    <div className={`immersive${idleUi ? ' immersive--dim' : ''}`}>
      <FocusScene
        skinId={skinId}
        intensity={intensity}
        active={active}
        ambient={ambientCurrent}
        fill
      />

      <div className="immersive__topbar">
        {ambient?.play && (
          <button
            className="immersive__btn"
            onClick={toggleSound}
            aria-label={soundOn ? '소리 끄기' : '소리 켜기'}
            title={soundOn ? '배경 소리 끄기' : '배경 소리 켜기'}
          >
            {soundOn ? <IconVolume size={16} /> : <IconVolumeOff size={16} />}
            <span>{soundOn ? '소리 켜짐' : '소리 꺼짐'}</span>
          </button>
        )}
        <button className="immersive__btn immersive__exit" onClick={onExit} aria-label="축소">
          <IconMinimize size={16} />
          <span>축소</span>
        </button>
      </div>

      <div className="immersive__clock">{clock}</div>

      <div className="immersive__center">
        {task && (
          <p className="immersive__task">
            {taskCategory && <CategoryIcon id={taskCategory} size={15} />} {task}
          </p>
        )}
        <p className="immersive__mode">{modeLabel}</p>
        <div className="immersive__time">{timeLabel}</div>
        {children && <div className="immersive__controls">{children}</div>}
      </div>
    </div>
  )
}
