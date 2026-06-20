import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, EmptyState, Stack, Tag, useToast } from '../design'
import './journal.css'

function fmtRange(start, end) {
  if (!start || !end) return ''
  const s = start.slice(5).replace('-', '.')
  const e = end.slice(5).replace('-', '.')
  return `${s} ~ ${e}`
}

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
    return <EmptyState icon="📖" title="이번 주 기록을 불러오는 중" description="잠시만요." />
  }

  const range = fmtRange(summary.week_start, summary.week_end)
  const avgPerSession = summary.session_count
    ? Math.round(summary.total_minutes / summary.session_count)
    : 0

  return (
    <>
      <div className="journal-head">
        <span className="section-title">이번 주 요약</span>
        <span className="journal-range">{range} · 월~일</span>
      </div>

      <Card>
        <div className="journal-stats">
          <div className="jstat">
            <div className="jstat__value">{summary.total_minutes}<span>분</span></div>
            <div className="jstat__label">총 집중</div>
          </div>
          <div className="jstat">
            <div className="jstat__value">{summary.session_count}<span>회</span></div>
            <div className="jstat__label">세션</div>
          </div>
          <div className="jstat">
            <div className="jstat__value">{summary.completed_count}<span>회</span></div>
            <div className="jstat__label">완료</div>
          </div>
          <div className="jstat">
            <div className="jstat__value">{avgPerSession}<span>분</span></div>
            <div className="jstat__label">세션 평균</div>
          </div>
        </div>

        <div className="journal-top">
          {summary.top_task
            ? <>가장 오래 집중한 일 · <strong>{summary.top_task}</strong> ({summary.top_task_minutes}분)</>
            : '아직 이번 주 기록이 없어요'}
        </div>

        {summary.keywords.length > 0 && (
          <div className="journal-keywords">
            {summary.keywords.map((k) => (
              <Tag key={k}>#{k}</Tag>
            ))}
          </div>
        )}
      </Card>

      <div className="section-title">한 줄 회고</div>
      {summary.embers.length === 0 ? (
        <EmptyState
          icon="✍️"
          title="아직 남긴 회고가 없어요"
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
