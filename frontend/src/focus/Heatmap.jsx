// GitHub 잔디형 히트맵 (I). heatmap: { 'YYYY-MM-DD': 분 }
export function Heatmap({ heatmap = {} }) {
  // 날짜 오름차순으로 84일을 7행(요일) x 12열(주)로 배치
  const days = Object.entries(heatmap)
    .map(([date, min]) => ({ date, min }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const level = (min) => {
    if (min <= 0) return 0
    if (min < 25) return 1
    if (min < 60) return 2
    if (min < 120) return 3
    return 4
  }

  return (
    <div className="heatmap" role="img" aria-label="집중 히트맵">
      {days.map(({ date, min }) => (
        <span
          key={date}
          className={`heatmap__cell heatmap__cell--l${level(min)}`}
          title={`${date}: ${min}분`}
        />
      ))}
    </div>
  )
}
