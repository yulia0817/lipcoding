import './gamify.css'

const BADGE_META = {
  first_fire: { emoji: '🔥', name: '첫 불씨' },
  streak_3: { emoji: '🥉', name: '3일 연속' },
  streak_7: { emoji: '🥇', name: '7일 연속' },
  centurion: { emoji: '💯', name: '하루 100분' },
  early_bird: { emoji: '🌅', name: '아침형' },
  night_owl: { emoji: '🦉', name: '올빼미' },
}

export function BadgeShelf({ badges = [] }) {
  const earned = new Set(badges)
  return (
    <div className="badge-shelf">
      {Object.entries(BADGE_META).map(([id, meta]) => (
        <div key={id} className={`badge${earned.has(id) ? ' is-earned' : ''}`}>
          <div className="badge__emoji">{meta.emoji}</div>
          <div className="badge__name">{meta.name}</div>
        </div>
      ))}
    </div>
  )
}
