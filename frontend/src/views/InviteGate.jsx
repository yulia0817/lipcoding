import { useEffect, useState } from 'react'
import { Button, Card, Input, Stack, useToast } from '../design'

// 모임이 없을 때: 새로 만들기 / 코드로 참여 / 초대 링크 자동 채움.
export function InviteGate({ onCreate, onJoin }) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  // URL ?invite=CODE 자동 채움
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const inv = params.get('invite')
    if (inv) setCode(inv.toUpperCase())
  }, [])

  async function create() {
    if (busy) return
    setBusy(true)
    try {
      await onCreate(name.trim() || '같이 집중')
      toast('모임을 만들었어요! 친구를 초대해보세요.', { variant: 'success' })
    } catch (e) {
      toast(`만들기 실패: ${String(e).replace(/^Error:\s*/, '')}`, { variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function join() {
    if (busy) return
    if (!code.trim()) {
      toast('초대 코드를 입력하세요', { variant: 'info' })
      return
    }
    setBusy(true)
    try {
      await onJoin(code.trim().toUpperCase())
      toast('모임에 참여했어요!', { variant: 'success' })
    } catch (e) {
      toast(`참여 실패: ${String(e).replace(/^Error:\s*\d*\s*/, '')}`, { variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="invite-gate">
      <Card className="invite-card">
        <h2 className="invite-card__title">🤝 모임 만들기</h2>
        <p className="invite-card__desc">
          친구와 함께 집중해요. 각자의 집중 시간이 모여 공동 목표를 채웁니다.
        </p>
        <Stack gap={2}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="모임 이름 (예: 새벽 코딩단)"
          />
          <Button onClick={create} disabled={busy}>
            모임 만들기
          </Button>
        </Stack>
      </Card>

      <Card className="invite-card">
        <h2 className="invite-card__title">🔑 코드로 참여</h2>
        <p className="invite-card__desc">친구에게 받은 초대 코드를 입력하세요.</p>
        <Stack row gap={2}>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && join()}
            placeholder="6자리 코드"
            maxLength={6}
          />
          <Button variant="secondary" onClick={join} disabled={busy}>
            참여
          </Button>
        </Stack>
      </Card>
    </div>
  )
}
