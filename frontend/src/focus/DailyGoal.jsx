// 오늘의 목표 진척 바. 완료한 포모도로 수를 목표와 비교해 보여줍니다.
export function DailyGoal({ goal, progress, onGoal, reached }) {
  const pct = Math.min(100, Math.round((progress / goal) * 100))
  const dots = Array.from({ length: goal }, (_, i) => i < progress)

  return (
    <div className={`daily-goal ${reached ? 'is-reached' : ''}`}>
      <div className="daily-goal__head">
        <span className="daily-goal__title">
          오늘의 목표 <strong>{progress}</strong> / {goal}
        </span>
        <span className="daily-goal__steppers">
          <button type="button" onClick={() => onGoal(goal - 1)} aria-label="목표 줄이기">
            −
          </button>
          <button type="button" onClick={() => onGoal(goal + 1)} aria-label="목표 늘리기">
            +
          </button>
        </span>
      </div>
      <div className="daily-goal__dots" aria-hidden>
        {dots.map((lit, i) => (
          <span key={i} className={`daily-goal__dot ${lit ? 'is-lit' : ''}`} />
        ))}
      </div>
      <div className="daily-goal__bar">
        <div className="daily-goal__fill" style={{ width: `${pct}%` }} />
      </div>
      {reached && <p className="daily-goal__done">오늘 목표 달성! 멋진 집중이었어요</p>}
    </div>
  )
}
