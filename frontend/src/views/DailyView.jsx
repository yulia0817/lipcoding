import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, EmptyState, Stack, useToast } from '../design'
import './daily.css'

export function DailyView() {
  const [days, setDays] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    api
      .dailyBreakdown()
      .then(setDays)
      .catch((e) => toast(`기록 불러오기 실패: ${e}`, { variant: 'error' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                <span className="day-card__date">{d.date}</span>
                <span className="day-card__total">
                  {d.total_minutes}분 · {d.session_count}세션
                </span>
              </div>
              {d.tasks.map((t) => (
                <div className="day-task" key={t.task}>
                  <div className="day-task__label">
                    <span>{t.task}</span>
                    <span>{t.minutes}분</span>
                  </div>
                  <div className="day-task__track">
                    <div
                      className="day-task__bar"
                      style={{ width: `${(t.minutes / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </Card>
          )
        })}
      </Stack>
    </>
  )
}
