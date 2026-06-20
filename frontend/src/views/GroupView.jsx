import { useGroups } from '../hooks/useGroups'
import { InviteGate } from './InviteGate'
import { GroupDashboard } from './GroupDashboard'
import './group.css'

// 같이 집중: 모임이 없으면 초대/참여, 있으면 대시보드.
export function GroupView() {
  const hook = useGroups()

  if (hook.loading) {
    return <div className="section-title">같이 집중</div>
  }

  return (
    <>
      <div className="section-title">같이 집중</div>
      {hook.groups.length === 0 ? (
        <InviteGate onCreate={hook.create} onJoin={hook.join} />
      ) : (
        <GroupDashboard hook={hook} />
      )}
    </>
  )
}
