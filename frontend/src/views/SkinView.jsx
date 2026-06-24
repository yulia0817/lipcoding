import { Badge, Button, Card } from '../design'
import { THEMES } from '../focus/themes'
import './skin.css'

// 스킨 보관함: 구매 없이 원하는 스킨을 바로 선택. settings.skin 만 바꾼다.
export function SkinView({ value, onSelect }) {
  const skins = Object.entries(THEMES).map(([id, t]) => ({
    id,
    emoji: t.emoji,
    name: t.label,
    intro: t.intro,
  }))
  return (
    <>
      <div className="section-title">스킨 보관함</div>
      <div className="skin-grid">
        {skins.map((s) => (
          <Card key={s.id} className="skin-card">
            <div className="skin-card__emoji">{s.emoji}</div>
            <div className="skin-card__name">{s.name}</div>
            <div className="skin-card__desc">{s.intro}</div>
            <div className="skin-card__action">
              {value === s.id ? (
                <Badge variant="success">선택됨</Badge>
              ) : (
                <Button variant="secondary" onClick={() => onSelect(s.id)}>
                  선택
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
