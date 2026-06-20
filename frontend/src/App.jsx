import { useEffect, useState } from 'react'
import { api } from './api'
import { useToast } from './design'
import { useLocalStorage } from './hooks/useLocalStorage'
import { Sidebar } from './focus/Sidebar'
import { CampfireView } from './views/CampfireView'
import { JournalView } from './views/JournalView'
import { DailyView } from './views/DailyView'
import { StatsView } from './views/StatsView'
import './focus/campfire.css'
import './focus/focus.css'
import './focus/layout.css'

const SUBTITLES = {
  campfire: '집중하면 모닥불이 타오릅니다',
  journal: '한 줄 회고가 불씨로 쌓여요',
  daily: '날짜별로 무엇에 집중했는지 확인해요',
  stats: '오늘의 집중과 연속 기록',
}

export default function App() {
  const { toast } = useToast()

  // 시간 설정 + 사이드바 상태는 로컬 캐시(localStorage)에 보관
  const [settings, setSettings] = useLocalStorage('focus-settings', {
    focusMin: 25,
    breakMin: 5,
  })
  const [collapsed, setCollapsed] = useLocalStorage('focus-sidebar-collapsed', false)
  const [active, setActive] = useState('campfire')
  const [stats, setStats] = useState(null)

  async function refreshStats() {
    try {
      setStats(await api.stats())
    } catch (e) {
      toast(`불러오기 실패: ${e}`, { variant: 'error' })
    }
  }

  useEffect(() => {
    refreshStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        settings={settings}
        onSettings={setSettings}
        active={active}
        onNavigate={setActive}
      />

      <div className="layout__main">
        <div className="app">
          <header className="app__header">
            <h1>🔥 Focus Campfire</h1>
            <p className="app__sub">{SUBTITLES[active]}</p>
          </header>

          {active === 'campfire' && (
            <CampfireView settings={settings} onSaved={refreshStats} />
          )}
          {active === 'journal' && <JournalView />}
          {active === 'daily' && <DailyView />}
          {active === 'stats' && <StatsView stats={stats} />}
        </div>
      </div>
    </div>
  )
}
