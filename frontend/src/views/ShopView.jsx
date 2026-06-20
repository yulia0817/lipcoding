import { Badge, Button, Card, useToast } from '../design'
import './shop.css'

// 스킨 보관함: 구매 없이 원하는 스킨을 바로 선택(장착)할 수 있어요.
export function ShopView({ hook }) {
  const { skins, equip } = hook
  const { toast } = useToast()

  async function handleSelect(skin) {
    try {
      await equip(skin.id)
      toast(`${skin.name} 선택!`, { variant: 'success' })
    } catch (e) {
      toast(`선택 실패: ${e}`, { variant: 'error' })
    }
  }

  return (
    <>
      <div className="section-title">스킨 보관함</div>
      <div className="shop-grid">
        {skins.map((s) => (
          <Card key={s.id} className="skin-card">
            <div className="skin-card__emoji">{s.emoji}</div>
            <div className="skin-card__name">{s.name}</div>
            <div className="skin-card__desc">{s.description}</div>
            <div className="skin-card__action">
              {s.equipped ? (
                <Badge variant="success">선택됨</Badge>
              ) : (
                <Button variant="secondary" onClick={() => handleSelect(s)}>
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
