import { useEffect, useState } from 'react'
import { Button, Card, Stack } from '../design'
import { IconVolume, IconMaximize } from '../design/icons'
import { BREAK_ACTIVITIES, randomActivityIndex } from './breakActivities'

// 휴식 모드에서 보여주는 스트레칭 코치.
// - 앉아서 할 수 있는 동작을 하나씩 안내
// - "다른 동작"으로 순환, "들려주기"로 음성 안내(SpeechSynthesis, ko-KR)
export function BreakCoach({ remainingLabel, onSkip, onImmersive }) {
  const [idx, setIdx] = useState(() => randomActivityIndex())
  const activity = BREAK_ACTIVITIES[idx]
  const ttsSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  // 동작이 바뀌면 진행 중이던 음성 안내는 멈춥니다.
  useEffect(() => {
    if (ttsSupported) window.speechSynthesis.cancel()
  }, [idx, ttsSupported])

  // 언마운트(휴식 종료) 시 음성 정리.
  useEffect(() => {
    return () => {
      if (ttsSupported) window.speechSynthesis.cancel()
    }
  }, [ttsSupported])

  function next() {
    setIdx((i) => (i + 1) % BREAK_ACTIVITIES.length)
  }

  function speak() {
    if (!ttsSupported) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(`${activity.name}. ${activity.desc}`)
    u.lang = 'ko-KR'
    u.rate = 0.95
    window.speechSynthesis.speak(u)
  }

  return (
    <Card>
      <p className="timer__mode">휴식 시간 · 몸을 풀어요</p>
      {remainingLabel && <div className="timer__time">{remainingLabel}</div>}

      <div className="break-coach">
        <p className="break-coach__name">{activity.name}</p>
        <p className="break-coach__sec">권장 {activity.seconds}초</p>
        <p className="break-coach__desc">{activity.desc}</p>
      </div>

      <Stack row gap={2} style={{ justifyContent: 'center', marginTop: 16 }}>
        <Button variant="secondary" onClick={next}>
          다른 동작
        </Button>
        {ttsSupported && (
          <Button onClick={speak}>
            <IconVolume size={15} /> 음성 안내
          </Button>
        )}
        {onImmersive && (
          <Button variant="ghost" onClick={onImmersive}>
            <IconMaximize size={15} /> 전체화면
          </Button>
        )}
        {onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            건너뛰기
          </Button>
        )}
      </Stack>
    </Card>
  )
}
