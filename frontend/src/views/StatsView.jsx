import { Card, EmptyState } from '../design'
import { FocusRatio } from '../focus/FocusRatio'
import { QuestPanel } from '../gamify/QuestPanel'
import { BadgeShelf } from '../gamify/BadgeShelf'

export function StatsView({ stats, gamify }) {
  if (!stats) {
    return <EmptyState icon="📊" title="통계를 불러오는 중" description="잠시만요." />
  }
  return (
    <>
      <div className="section-title">오늘의 집중</div>
      <Card>
        <div className="stat-grid">
          <div className="stat-grid__item">
            <div className="stat-grid__value">{stats.today_minutes}분</div>
            <div className="stat-grid__label">오늘 집중</div>
          </div>
          <div className="stat-grid__item">
            <div className="stat-grid__value">🔥 {stats.streak_days}일</div>
            <div className="stat-grid__label">연속 집중</div>
          </div>
          <div className="stat-grid__item">
            <div className="stat-grid__value">{stats.completed_count}</div>
            <div className="stat-grid__label">완료 세션</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <FocusRatio
            focusMin={stats.focus_minutes}
            distractedMin={stats.distracted_minutes}
          />
        </div>
      </Card>

      <div className="section-title">오늘의 퀘스트</div>
      <Card><QuestPanel quests={gamify?.quests} /></Card>

      <div className="section-title">배지</div>
      <Card><BadgeShelf badges={gamify?.profile?.badges} /></Card>
    </>
  )
}
