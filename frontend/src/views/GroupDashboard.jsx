import { Badge, Button, Card, useToast } from '../design'
import { FocusScene } from '../focus/FocusScene'
import { getUserId } from '../lib/identity'

function copyInvite(code, toast) {
  navigator.clipboard?.writeText(code).then(
    () => toast(`초대 코드 ${code} 를 복사했어요!`, { variant: 'success' }),
    () => toast(`초대 코드: ${code}`, { variant: 'info' }),
  )
}

function fmtAgo(sec) {
  if (sec < 60) return '방금'
  return `${Math.floor(sec / 60)}분 전`
}

// 같이 집중 대시보드: 공유 장면 + 우리 목표 + 리더보드 + 실시간 접속 + 피드.
export function GroupDashboard({ hook }) {
  const { groups, activeId, setActiveId, summary, presence, feed } = hook
  const { toast } = useToast()
  const me = getUserId()

  if (!summary) {
    return <Card>불러오는 중…</Card>
  }

  const pct = Math.round(summary.goal_progress * 100)

  return (
    <div className="group-dash">
      {groups.length > 1 && (
        <div className="group-tabs">
          {groups.map((g) => (
            <button
              key={g.id}
              className={`group-tab${g.id === activeId ? ' is-active' : ''}`}
              onClick={() => setActiveId(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      <Card className="group-hero">
        <div className="group-hero__head">
          <div>
            <h2 className="group-hero__name">{summary.name}</h2>
            <span className="group-hero__meta">멤버 {summary.member_count}명</span>
          </div>
          <Button variant="secondary" onClick={() => copyInvite(summary.code, toast)}>
            🔗 초대 코드 {summary.code}
          </Button>
        </div>

        <FocusScene skinId="campfire" intensity={summary.goal_progress} active={pct > 0} />

        <div className="group-goal">
          <div className="group-goal__label">
            <span>오늘 우리 목표</span>
            <span>
              {summary.total_minutes} / {summary.goal_minutes}분 ({pct}%)
            </span>
          </div>
          <div className="group-goal__track">
            <div className="group-goal__bar" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Card>

      <div className="group-cols">
        <Card className="group-board">
          <div className="group-board__title">리더보드</div>
          {summary.leaderboard.length === 0 && (
            <p className="group-empty">아직 오늘 집중 기록이 없어요.</p>
          )}
          {summary.leaderboard.map((r, i) => (
            <div className={`lead-row${r.user_id === me ? ' is-me' : ''}`} key={r.user_id}>
              <span className="lead-rank">{i + 1}</span>
              <span className="lead-name">
                {r.name}
                {r.user_id === summary.mvp_id && <span className="lead-mvp"> 👑</span>}
                {r.user_id === me && <span className="lead-you"> (나)</span>}
              </span>
              <span className="lead-min">{r.minutes}분</span>
            </div>
          ))}
        </Card>

        <Card className="group-live">
          <div className="group-board__title">
            지금 집중 중 <Badge variant="success">{presence.length}</Badge>
          </div>
          {presence.length === 0 && <p className="group-empty">지금 집중 중인 친구가 없어요.</p>}
          {presence.map((p) => (
            <div className="live-row" key={p.user_id}>
              <span className="live-dot" />
              <span className="live-name">{p.name}</span>
              <span className="live-task">{p.task || '집중 중'}</span>
              <span className="live-ago">{fmtAgo(p.seconds_ago)}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="group-feed">
        <div className="group-board__title">최근 불씨</div>
        {feed.length === 0 && <p className="group-empty">완료된 집중이 쌓이면 여기에 보여요.</p>}
        {feed.map((f, i) => (
          <div className="feed-row" key={i}>
            <span className="feed-name">{f.name}</span>
            <span className="feed-task">{f.task}</span>
            <span className="feed-min">{f.minutes}분 🔥</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
