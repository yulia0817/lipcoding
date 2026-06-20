import './gamify.css'

export function QuestPanel({ quests }) {
  if (!quests || quests.length === 0) return null
  return (
    <div>
      {quests.map((q) => (
        <div className="quest" key={q.id}>
          <div className="quest__top">
            <span>{q.done ? '✅ ' : ''}{q.label} ({q.progress}/{q.target})</span>
            <span className="quest__reward">🪵 {q.reward}</span>
          </div>
          <div className="quest__track">
            <div className="quest__fill" style={{ width: `${(q.progress / q.target) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
