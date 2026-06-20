import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, EmptyState, Stack, Tag, useToast } from '../design'
import { categoryIcon } from '../focus/CategoryTagPicker'
import './activity.css'

export function ActivityView() {
  const [hourly, setHourly] = useState(null)
  const [cats, setCats] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([api.hourlyBreakdown(), api.categoryBreakdown()])
      .then(([h, c]) => {
        setHourly(h)
        setCats(c)
      })
      .catch((e) => toast(`분석 불러오기 실패: ${e}`, { variant: 'error' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!hourly || !cats) {
    return <EmptyState icon="🏷" title="활동을 분석하는 중" description="잠시만요." />
  }

  const maxHour = Math.max(...hourly.map((h) => h.minutes), 1)
  const peak = hourly.reduce((a, b) => (b.minutes > a.minutes ? b : a), hourly[0])
  const maxCat = Math.max(...cats.map((c) => c.minutes), 1)
  const totalMin = cats.reduce((sum, c) => sum + c.minutes, 0)

  return (
    <>
      <div className="section-title">시간대별 집중 (최근 7일)</div>
      <Card>
        <div className="activity-bars">
          {hourly.map((h) => {
            const pct = (h.minutes / maxHour) * 100
            const isPeak = h.minutes > 0 && h.minutes === peak.minutes
            return (
              <div className="hourbar" key={h.hour} title={`${h.hour}시 · ${h.minutes}분`}>
                <div
                  className={`hourbar__fill ${h.minutes === 0 ? 'is-empty' : ''} ${
                    isPeak ? 'hourbar__peak' : ''
                  }`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
                {h.hour % 3 === 0 && <span className="hourbar__label">{h.hour}</span>}
              </div>
            )
          })}
        </div>
        {peak.minutes > 0 ? (
          <p className="activity-peak">
            🔥 가장 집중하는 시간대: <strong>{peak.hour}시 ~ {peak.hour + 1}시</strong> ({peak.minutes}분)
          </p>
        ) : (
          <p className="activity-peak">아직 시간대별 기록이 없어요.</p>
        )}
      </Card>

      <div className="section-title">어디에 시간을 투자했나 (최근 30일)</div>
      {cats.length === 0 ? (
        <EmptyState
          icon="🏷"
          title="아직 카테고리 기록이 없어요"
          description="집중 시작 화면에서 카테고리와 태그를 골라보세요."
        />
      ) : (
        <Card>
          {cats.map((c) => (
            <div className="cat-row" key={c.category}>
              <div className="cat-row__head">
                <span className="cat-row__name">
                  <span className="cat-row__icon">{categoryIcon(c.category)}</span>
                  {c.category}
                </span>
                <span className="cat-row__min">
                  {c.minutes}분 · {c.session_count}세션 ·{' '}
                  {totalMin ? Math.round((c.minutes / totalMin) * 100) : 0}%
                </span>
              </div>
              <div className="cat-row__track">
                <div
                  className="cat-row__bar"
                  style={{ width: `${(c.minutes / maxCat) * 100}%` }}
                />
              </div>
              {c.tags.length > 0 && (
                <div className="cat-row__tags">
                  {c.tags.map((t) => (
                    <Tag key={t.tag}>
                      #{t.tag} {t.minutes}분
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </>
  )
}
