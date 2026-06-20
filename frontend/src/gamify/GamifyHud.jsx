import { IconLog } from '../design/icons'
import '../nav/nav.css'

export function GamifyHud({ profile }) {
  if (!profile) return null
  const intoLevel = profile.xp % 100
  return (
    <div className="hud">
      <span className="hud__level">Lv.{profile.level}</span>
      <div className="hud__xp">
        <div className="hud__xp-fill" style={{ width: `${intoLevel}%` }} />
      </div>
      <span className="hud__coins"><IconLog size={15} /> {profile.coins}</span>
    </div>
  )
}
