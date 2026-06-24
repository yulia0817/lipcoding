import { useEffect, useRef, useState } from 'react'
import { api } from '../localStore'
import { Button, Card, Input, Modal, Stack, useToast } from '../design'
import { usePomodoro, formatTime } from '../hooks/usePomodoro'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useNotification } from '../hooks/useNotification'
import { useAmbient } from '../hooks/useAmbient'
import { useHotkeys } from '../hooks/useHotkeys'
import { pushTrayTitle, onTrayAction } from '../tray/trayBridge'
import { FocusScene } from '../focus/FocusScene'
import { ImmersiveScene } from '../focus/ImmersiveScene'
import { BreakCoach } from '../focus/BreakCoach'
import { BreathingIntro } from '../focus/BreathingIntro'
import { AmbientToolbar } from '../focus/AmbientToolbar'
import { CategoryTagPicker, CategoryIcon } from '../focus/CategoryTagPicker'
import { IconEdit, IconCoffee, IconMaximize } from '../design/icons'
import '../focus/quickwins.css'

const LONG_BREAK_EVERY = 4
const LONG_BREAK_MIN = 15

// 집중 타이머 + 모닥불 메인 뷰. 시간 설정은 사이드바에서 props로 받습니다.
export function CampfireView({ settings, onSaved }) {
  const [task, setTask] = useState('')
  const [category, setCategory] = useState('공부')
  const [tags, setTags] = useState([])
  const [retroOpen, setRetroOpen] = useState(false)
  const [retro, setRetro] = useState('')
  const [breathing, setBreathing] = useState(false)
  const [immersive, setImmersive] = useState(false)
  const [pendingBreak, setPendingBreak] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const pendingSession = useRef(null)
  const { toast } = useToast()
  const notif = useNotification()
  const ambient = useAmbient()

  // 4세션마다 긴 휴식. 휴식 길이를 타이머 훅에 직접 반영해 자연스럽게 전환됩니다.
  const isLongBreak = cycleCount > 0 && cycleCount % LONG_BREAK_EVERY === 0
  const effectiveBreakMin = isLongBreak ? LONG_BREAK_MIN : settings.breakMin
  const timer = usePomodoro({
    focusMin: settings.focusMin,
    breakMin: effectiveBreakMin,
  })

  // 타이머가 도는 동안 브라우저 탭 제목에 카운트다운 표시
  useDocumentTitle(timer.running, timer.mode, timer.remaining)

  useEffect(() => {
    if (timer.finished && timer.mode === 'focus' && pendingSession.current) {
      pendingSession.current.completed = true
      setCycleCount((c) => c + 1)
      notif.notify('집중 완료!', '장작 하나가 추가됐어요. 잠깐 쉬어볼까요?')
      setRetroOpen(true)
      toast('집중 완료! 모닥불이 활활 타올랐어요', { variant: 'success' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.finished])

  function startFocus() {
    // 내용을 비워도 카테고리가 선택돼 있으면 그 이름으로 집중을 시작합니다.
    const label = task.trim() || category
    if (!label) {
      toast('집중할 내용을 적거나 카테고리를 선택하세요', { variant: 'info' })
      return
    }
    if (notif.supported && notif.permission === 'default') notif.request()
    setBreathing(true)
  }

  // 호흡 인트로가 끝난 뒤 실제 집중 타이머를 시작합니다.
  function doStartFocus() {
    setBreathing(false)
    const t = task.trim() || category
    if (!t) return
    pendingSession.current = {
      task: t,
      completed: false,
      source: 'text',
      category,
      tags: [...tags],
    }
    timer.resetDistraction()
    timer.reset('focus')
    timer.start()
    toast(`"${t}" 집중 시작!`, { variant: 'info' })
  }

  // 집중과 무관하게 언제든 휴식 모드로 진입.
  function startBreak() {
    pendingSession.current = null
    setPendingBreak(false)
    timer.reset('break')
    timer.start()
    toast('잠깐 쉬어가요', { variant: 'info' })
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
    const wasCompleted = !!p.completed
    const durationMin = p.completed ? settings.focusMin : p._elapsedMin || 1
    try {
      await api.createSession({
        task: p.task,
        duration_min: durationMin,
        completed: p.completed,
        distracted_min: Math.round(timer.distractedSec / 60),
        retro: retro.trim() || null,
        source: p.source,
        category: p.category || '기타',
        tags: p.tags || [],
      })
      toast('세션을 기록했어요', { variant: 'success' })
    } catch (e) {
      toast(`저장 실패: ${e}`, { variant: 'error' })
    } finally {
      pendingSession.current = null
      setRetro('')
      setRetroOpen(false)
      setTask('')
      setTags([])
      timer.resetDistraction()
      // 집중을 끝까지 완료했으면 휴식 모드로 전환(4세션마다 긴 휴식).
      if (wasCompleted) {
        setPendingBreak(true)
      } else {
        timer.reset('focus')
      }
      onSaved && onSaved()
    }
  }

  // 긴/짧은 휴식 시작: cycleCount 반영 후 effectiveBreakMin이 갱신된 시점에 실행.
  useEffect(() => {
    if (!pendingBreak) return
    timer.reset('break')
    timer.start()
    toast(
      isLongBreak ? '긴 휴식 시간이에요. 푹 쉬세요!' : '잠깐 쉬며 몸을 풀어볼까요?',
      { variant: 'info' },
    )
    setPendingBreak(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingBreak, effectiveBreakMin])

  // 휴식이 끝나면 다시 집중 모드로 정리.
  useEffect(() => {
    if (timer.finished && timer.mode === 'break') {
      notif.notify('휴식 끝!', '다시 집중해볼까요?')
      toast('휴식 끝! 다시 집중해볼까요?', { variant: 'success' })
      timer.reset('focus')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.finished, timer.mode])

  const intensity = timer.mode === 'focus' ? timer.progress : 0.2
  const active = timer.running && timer.mode === 'focus'
  const idle = !timer.running && !pendingSession.current
  const breakMode = timer.mode === 'break'
  const sessionLive = !!pendingSession.current || breakMode

  // 세션이 끝나 idle 상태가 되면 몰입 모드를 자동으로 닫습니다.
  useEffect(() => {
    if (!sessionLive && immersive) setImmersive(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLive])

  // 메뉴바 트레이에 남은 시간 push (idle 이면 🔥)
  useEffect(() => {
    if (sessionLive) {
      const mm = String(Math.floor(timer.remaining / 60)).padStart(2, '0')
      const ss = String(timer.remaining % 60).padStart(2, '0')
      pushTrayTitle(`🔥 ${mm}:${ss}`)
    } else {
      pushTrayTitle('🔥')
    }
  }, [timer.remaining, sessionLive])

  // 트레이 메뉴(시작/일시정지/종료) → 타이머 제어
  useEffect(() => {
    let unlisten = () => {}
    onTrayAction((action) => {
      if (action === 'start') {
        if (idle) startFocus()
        else if (pendingSession.current) pauseOrResume()
      } else if (action === 'pause') {
        if (pendingSession.current) pauseOrResume()
      } else if (action === 'stop') {
        if (breakMode) timer.reset('focus')
        else if (pendingSession.current) stopFocus()
      }
    }).then((u) => (unlisten = u))
    return () => unlisten()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idle, breakMode])

  // 키보드 단축키: Space=시작/정지, R=리셋, S=건너뛰기
  useHotkeys({
    toggle: () => {
      if (breathing) return
      if (idle) startFocus()
      else if (pendingSession.current) pauseOrResume()
    },
    reset: () => {
      if (!pendingSession.current && !breakMode) return
      pendingSession.current = null
      setPendingBreak(false)
      timer.reset('focus')
    },
    skip: () => {
      if (breakMode) timer.reset('focus')
      else if (pendingSession.current) stopFocus()
    },
  })

  return (
    <>
      <BreathingIntro
        open={breathing}
        onDone={doStartFocus}
        skinId={settings.skin || 'campfire'}
      />
      {immersive && sessionLive && (
        <ImmersiveScene
          skinId={settings.skin || 'campfire'}
          ambient={ambient}
          intensity={intensity}
          active={active}
          modeLabel={breakMode ? '휴식 시간' : '집중 시간'}
          timeLabel={formatTime(timer.remaining)}
          task={!breakMode ? pendingSession.current?.task : null}
          taskCategory={!breakMode ? pendingSession.current?.category : null}
          onExit={() => setImmersive(false)}
        >
          {breakMode ? (
            <Button
              variant="secondary"
              onClick={() => {
                timer.reset('focus')
                setImmersive(false)
              }}
            >
              건너뛰기
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={pauseOrResume}>
                {timer.running ? '일시정지' : '재개'}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setImmersive(false)
                  stopFocus()
                }}
              >
                종료
              </Button>
            </>
          )}
        </ImmersiveScene>
      )}
      {breakMode ? (
        <BreakCoach
          remainingLabel={formatTime(timer.remaining)}
          onSkip={() => timer.reset('focus')}
          onImmersive={() => setImmersive(true)}
        />
      ) : (
      <>
      <AmbientToolbar ambient={ambient} notif={notif} />
      {idle && (
        <div className="hero-guide">
          <span className="hero-guide__icon"><IconEdit size={18} /></span>
          <span className="hero-guide__text">
            <strong>무엇에 집중할지</strong> 적고 시작하면{' '}
            <strong>{settings.focusMin}분 타이머</strong>가 돌아가요. 집중할수록
            모닥불이 활활 타오릅니다. 시간은 왼쪽 메뉴에서 바꿀 수 있어요.
          </span>
        </div>
      )}

      <Card>
        <FocusScene
          skinId={settings.skin || 'campfire'}
          intensity={intensity}
          active={active}
          ambient={ambient.current}
        />
        {pendingSession.current?.task && (
          <p className="focus-task">
            <CategoryIcon id={pendingSession.current.category} size={15} />{' '}
            {pendingSession.current.task}
            {pendingSession.current.tags?.length > 0 && (
              <span className="focus-task__tags">
                {pendingSession.current.tags.map((t) => ` #${t}`).join('')}
              </span>
            )}
          </p>
        )}
        <p className="timer__mode">{timer.mode === 'focus' ? '집중 시간' : '휴식 시간'}</p>
        <div className="timer__time">{formatTime(timer.remaining)}</div>

        {idle && (
          <Stack row gap={2} style={{ marginTop: 16 }}>
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startFocus()}
              placeholder="무엇에 집중할까요?"
              autoFocus
            />
            <Button onClick={startFocus}>시작</Button>
          </Stack>
        )}

        {idle && (
          <CategoryTagPicker
            category={category}
            onCategory={setCategory}
            tags={tags}
            onTags={setTags}
          />
        )}

        {idle && (
          <div className="break-entry">
            <span className="break-entry__text">집중 전에 잠깐 쉬어갈까요?</span>
            <Button variant="ghost" onClick={startBreak}>
              <IconCoffee size={15} /> {settings.breakMin}분 휴식하기
            </Button>
          </div>
        )}

        {pendingSession.current && (
          <div className="timer__controls">
            <Button variant="secondary" onClick={pauseOrResume}>
              {timer.running ? '일시정지' : '재개'}
            </Button>
            <Button variant="ghost" onClick={() => setImmersive(true)}>
              <IconMaximize size={15} /> 전체화면
            </Button>
            <Button variant="danger" onClick={stopFocus}>
              종료
            </Button>
          </div>
        )}
      </Card>
      </>
      )}

      <Modal
        open={retroOpen}
        onClose={saveSession}
        title="한 줄 회고 남기기"
        footer={<Button onClick={saveSession}>기록하기</Button>}
      >
        <p style={{ marginTop: 0, color: 'var(--ds-text-muted)' }}>
          이번 집중은 어땠나요? (생략 가능)
        </p>
        <Stack row gap={2}>
          <Input
            value={retro}
            onChange={(e) => setRetro(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveSession()}
            placeholder="예: 생각보다 잘 집중됐다"
            autoFocus
          />
        </Stack>
      </Modal>
    </>
  )
}
