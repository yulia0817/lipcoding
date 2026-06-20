import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, EmptyState, Stack, Tag, useToast } from '../design'
import './journal.css'

export function JournalView() {
  const [summary, setSummary] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    api
      .weeklySummary()
      .then(setSummary)
      .catch((e) => toast(`요약 불러오기 실패: ${e}`, { variant: 'error' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!summary) {
    return <EmptyState icon="🪵" title="불씨를 모으는 중" description="잠시만요." />
  }

  const fire = '🔥'.repeat(summary.fire_level) || '🪵'

  return (
    <>
      <div className="section-title">이번 주 모닥불</div>
      <Card>
        <div className="journal-hero">
          <div className="journal-hero__fire">{fire}</div>
          <div className="journal-hero__total">{summary.total_minutes}분 집중</div>
          <div className="journal-hero__top">
            {summary.top_task
              ? `가장 오래 집중: ${summary.top_task} (${summary.top_task_minutes}분)`
              : '아직 이번 주 기록이 없어요'}
          </div>
          <div className="journal-keywords">
            {summary.keywords.map((k) => (
              <Tag key={k}>#{k}</Tag>
            ))}
          </div>
        </div>
      </Card>

      <div className="section-title">불씨 모음</div>
      {summary.embers.length === 0 ? (
        <EmptyState
          icon="✨"
          title="아직 남긴 불씨가 없어요"
          description="집중 후 한 줄 회고를 남기면 여기 쌓입니다."
        />
      ) : (
        <Stack gap={2}>
          {summary.embers.map((e, i) => (
            <Card key={i}>
              <div className="ember">
                <span className="ember__date">{e.date}</span>
                <span className="ember__task">{e.task}</span>
                <span className="ember__retro">“{e.retro}”</span>
              </div>
            </Card>
          ))}
        </Stack>
      )}
    </>
  )
}
