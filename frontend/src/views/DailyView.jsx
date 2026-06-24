import { useCallback, useEffect, useState } from 'react'
import { api } from '../localStore'
import { Button, Card, EmptyState, Modal, Stack, useToast } from '../design'
import './daily.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
function fmtDate(iso) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mm}.${dd} (${WEEKDAYS[d.getDay()]})`
}

export function DailyView() {
  const [days, setDays] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null) // { id, task, start, end }
  const { toast } = useToast()

  const refresh = useCallback(() => {
    return api
      .dailyBreakdown()
      .then(setDays)
      .catch((e) => toast(`기록 불러오기 실패: ${e}`, { variant: 'error' }))
  }, [toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function confirmDelete() {
    const target = pendingDelete
    setPendingDelete(null)
    if (!target) return
    try {
      await api.deleteSession(target.id)
      toast('기록을 삭제했어요', { variant: 'success' })
      await refresh()
    } catch (e) {
      toast(`삭제 실패: ${e}`, { variant: 'error' })
    }
  }

  if (!days) {
    return <EmptyState icon="📅" title="기록을 불러오는 중" description="잠시만요." />
  }
  if (days.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="아직 기록이 없어요"
        description="집중 세션을 마치면 날짜별로 쌓입니다."
      />
    )
  }

  return (
    <>
      <div className="section-title">날짜별 집중 기록</div>
      <Stack gap={2}>
        {days.map((d) => {
          const max = Math.max(...d.tasks.map((t) => t.minutes), 1)
          return (
            <Card key={d.date}>
              <div className="day-card__head">
                <span className="day-card__date">{fmtDate(d.date)}</span>
                <span className="day-card__total">
                  <strong>{d.total_minutes}</strong>분 · {d.session_count}세션
                </span>
              </div>
              {d.tasks.map((t, ti) => (
                <div className="day-task" key={t.task}>
                  <div className="day-task__label">
                    <span>{t.task}</span>
                    <span className="day-task__min">{t.minutes}분</span>
                  </div>
                  <div className="day-task__track">
                    <div
                      className="day-task__bar"
                      style={{
                        width: `${(t.minutes / max) * 100}%`,
                        '--bar-hue': `${(ti * 47) % 360}`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {d.entries && d.entries.length > 0 && (
                <div className="day-timeline">
                  <div className="day-timeline__title">타임라인</div>
                  {d.entries.map((e, i) => (
                    <div
                      className={`tl-row${e.completed ? '' : ' tl-row--incomplete'}`}
                      key={e.id || `${e.start}-${i}`}
                    >
                      <span className="tl-time">
                        {e.start}–{e.end}
                      </span>
                      <span className="tl-dot" aria-hidden />
                      <div className="tl-body">
                        <div className="tl-main">
                          <span className="tl-task">{e.task}</span>
                          <span className="tl-cat">{e.category}</span>
                          <span className="tl-dur">{e.duration_min}분</span>
                          {!e.completed && <span className="tl-badge">중단</span>}
                          {e.distracted_min > 0 && (
                            <span className="tl-badge tl-badge--warn">
                              딴짓 {e.distracted_min}분
                            </span>
                          )}
                        </div>
                        {e.retro && <div className="tl-retro">“{e.retro}”</div>}
                      </div>
                      <button
                        type="button"
                        className="tl-del"
                        aria-label="이 기록 삭제"
                        title="삭제"
                        onClick={() =>
                          setPendingDelete({
                            id: e.id,
                            task: e.task,
                            start: e.start,
                            end: e.end,
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </Stack>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="기록 삭제"
        footer={
          <Stack row gap={2}>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              취소
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              삭제
            </Button>
          </Stack>
        }
      >
        {pendingDelete && (
          <p>
            <strong>{pendingDelete.task}</strong> ({pendingDelete.start}–
            {pendingDelete.end}) 기록을 삭제할까요? 되돌릴 수 없어요.
          </p>
        )}
      </Modal>
    </>
  )
}
