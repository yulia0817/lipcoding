import { useEffect, useState } from 'react'
import { api } from './localStore'
import { useToast } from './design'
import { useLocalStorage } from './hooks/useLocalStorage'
import { Sidebar } from './focus/Sidebar'
import { CampfireView } from './views/CampfireView'
import { DailyView } from './views/DailyView'
import { StatsView } from './views/StatsView'
import { SkinView } from './views/SkinView'
import { HowToGuide } from './focus/HowToGuide'
import './focus/campfire.css'
import './focus/focus.css'
import './focus/layout.css'

const SUBTITLES = {
  campfire: '집중하면 모닥불이 타오릅니다',
  daily: '날짜별로 무엇에 집중했는지 확인해요',
  stats: '오늘의 집중과 연속 기록',
  skins: '원하는 스킨을 골라 분위기를 바꿔요',
}

export default function App() {
  const { toast } = useToast()
  const [settings, setSettings] = useLocalStorage('focus-settings', {
    focusMin: 25,
    breakMin: 5,
    skin: 'campfire',
  })
  const [collapsed, setCollapsed] = useLocalStorage('focus-sidebar-collapsed', false)
  const [active, setActive] = useState('campfire')
  const [stats, setStats] = useState(null)
  const [howToOpen, setHowToOpen] = useState(false)

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
            <div className="app__header-main">
              <h1>Focus Scene</h1>
              <p className="app__sub">{SUBTITLES[active]}</p>
            </div>
            <div className="app__header-actions">
              <button
                type="button"
                className="app__help"
                onClick={() => setHowToOpen(true)}
                title="사용법 보기"
              >
                ? 사용법
              </button>
            </div>
          </header>

          {/* 캠프파이어는 항상 마운트해 타이머가 탭 전환에도 계속 돌아가게 합니다. */}
          <div style={{ display: active === 'campfire' ? 'block' : 'none' }}>
            <CampfireView settings={settings} onSaved={refreshStats} />
          </div>
          {active === 'daily' && <DailyView />}
          {active === 'stats' && <StatsView stats={stats} />}
          {active === 'skins' && (
            <SkinView
              value={settings.skin}
              onSelect={(skin) => setSettings({ ...settings, skin })}
            />
          )}
        </div>
      </div>
      <HowToGuide open={howToOpen} onClose={() => setHowToOpen(false)} />
    </div>
  )
}
