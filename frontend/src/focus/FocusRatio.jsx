// 집중 vs 딴짓 비율 막대 (K)
export function FocusRatio({ focusMin = 0, distractedMin = 0 }) {
  const total = focusMin + distractedMin
  const focusPct = total > 0 ? Math.round((focusMin / total) * 100) : 100
  return (
    <div className="ratio">
      <div className="ratio__bar">
        <div className="ratio__focus" style={{ width: `${focusPct}%` }} />
        <div className="ratio__distract" style={{ width: `${100 - focusPct}%` }} />
      </div>
      <div className="ratio__legend">
        <span><i className="ratio__dot ratio__dot--focus" /> 집중 {focusMin}분</span>
        <span><i className="ratio__dot ratio__dot--distract" /> 딴짓 {distractedMin}분</span>
        <strong>{focusPct}% 집중</strong>
      </div>
    </div>
  )
}
