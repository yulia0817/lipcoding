import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { Button, Card, IconButton, Input, Modal, Stack, useToast } from '../design'
import { usePomodoro, formatTime } from '../hooks/usePomodoro'
import { useSpeech } from '../hooks/useSpeech'
import { Campfire } from '../focus/Campfire'

// 집중 타이머 + 모닥불 메인 뷰. 시간 설정은 사이드바에서 props로 받습니다.
export function CampfireView({ settings, onSaved }) {
  const [task, setTask] = useState('')
  const [retroOpen, setRetroOpen] = useState(false)
  const [retro, setRetro] = useState('')
  const [voiceUsed, setVoiceUsed] = useState(false)
  const pendingSession = useRef(null)
  const { toast } = useToast()
  const speech = useSpeech()
  const timer = usePomodoro({
    focusMin: settings.focusMin,
    breakMin: settings.breakMin,
  })

  useEffect(() => {
    if (timer.finished && timer.mode === 'focus' && pendingSession.current) {
      pendingSession.current.completed = true
      setRetroOpen(true)
      toast('🔥 집중 완료! 모닥불이 활활 타올랐어요', { variant: 'success' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.finished])

  function dictate(setter) {
    if (!speech.supported) {
      toast('이 브라우저는 음성 입력을 지원하지 않아요', { variant: 'info' })
      return
    }
    setVoiceUsed(true)
    speech.start((text) => setter(text))
  }

  function startFocus() {
    const t = task.trim()
    if (!t) {
      toast('무엇에 집중할지 먼저 입력하세요', { variant: 'info' })
      return
    }
    pendingSession.current = {
      task: t,
      completed: false,
      source: voiceUsed ? 'voice' : 'text',
    }
    timer.resetDistraction()
    timer.reset('focus')
    timer.start()
    toast(`"${t}" 집중 시작!`, { variant: 'info' })
  }

  function pauseOrResume() {
    if (timer.running) {
      timer.pause()
      pendingSession.current && (pendingSession.current._pausedAt = Date.now())
    } else {
      if (pendingSession.current?._pausedAt) {
        const sec = Math.round((Date.now() - pendingSession.current._pausedAt) / 1000)
        timer.addDistraction(sec)
        pendingSession.current._pausedAt = null
      }
      timer.start()
    }
  }

  function stopFocus() {
    const elapsedMin = Math.max(1, Math.round((timer.totalSec - timer.remaining) / 60))
    pendingSession.current = {
      ...(pendingSession.current || { task: task.trim() || '집중', source: 'text' }),
      completed: false,
      _elapsedMin: elapsedMin,
    }
    setRetroOpen(true)
  }

  async function saveSession() {
    const p = pendingSession.current
    if (!p) return
    const durationMin = p.completed ? settings.focusMin : p._elapsedMin || 1
    try {
      await api.createSession({
        task: p.task,
        duration_min: durationMin,
        completed: p.completed,
        distracted_min: Math.round(timer.distractedSec / 60),
        retro: retro.trim() || null,
        source: p.source,
      })
      toast('세션을 기록했어요', { variant: 'success' })
    } catch (e) {
      toast(`저장 실패: ${e}`, { variant: 'error' })
    } finally {
      pendingSession.current = null
      setRetro('')
      setRetroOpen(false)
      setTask('')
      setVoiceUsed(false)
      timer.reset('focus')
      onSaved && onSaved()
    }
  }

  const intensity = timer.mode === 'focus' ? timer.progress : 0.2
  const active = timer.running && timer.mode === 'focus'
  const idle = !timer.running && !pendingSession.current

  return (
    <>
      {idle && (
        <div className="hero-guide">
          <span className="hero-guide__icon">🪵</span>
          <span className="hero-guide__text">
            <strong>무엇에 집중할지</strong> 적고 시작하면{' '}
            <strong>{settings.focusMin}분 타이머</strong>가 돌아가요. 집중할수록
            모닥불이 활활 타오릅니다. 시간은 왼쪽 메뉴에서 바꿀 수 있어요.
          </span>
        </div>
      )}

      <Card>
        <Campfire intensity={intensity} active={active} />
        {pendingSession.current?.task && (
          <p className="focus-task">🎯 {pendingSession.current.task}</p>
        )}
        <p className="timer__mode">{timer.mode === 'focus' ? '집중 시간' : '휴식 시간'}</p>
        <div className="timer__time">{formatTime(timer.remaining)}</div>

        {idle && (
          <Stack row gap={2} style={{ marginTop: 16 }}>
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startFocus()}
              placeholder="무엇에 집중할까요? (음성/텍스트)"
              autoFocus
            />
            {speech.supported && (
              <IconButton aria-label="음성 입력" onClick={() => dictate(setTask)}>
                {speech.listening ? '🔴' : '🎤'}
              </IconButton>
            )}
            <Button onClick={startFocus}>시작</Button>
          </Stack>
        )}

        {pendingSession.current && (
          <div className="timer__controls">
            <Button variant="secondary" onClick={pauseOrResume}>
              {timer.running ? '일시정지' : '재개'}
            </Button>
            <Button variant="danger" onClick={stopFocus}>
              종료
            </Button>
          </div>
        )}
      </Card>

      <Modal
        open={retroOpen}
        onClose={saveSession}
        title="한 줄 회고 (불씨 남기기)"
        footer={<Button onClick={saveSession}>기록하기</Button>}
      >
        <p style={{ marginTop: 0, color: 'var(--ds-text-muted)' }}>
          이번 집중은 어땠나요? (음성/텍스트, 생략 가능)
        </p>
        <Stack row gap={2}>
          <Input
            value={retro}
            onChange={(e) => setRetro(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveSession()}
            placeholder="예: 생각보다 잘 집중됐다"
            autoFocus
          />
          {speech.supported && (
            <IconButton aria-label="음성 회고" onClick={() => dictate(setRetro)}>
              {speech.listening ? '🔴' : '🎤'}
            </IconButton>
          )}
        </Stack>
      </Modal>
    </>
  )
}
