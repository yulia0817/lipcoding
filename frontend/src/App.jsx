import { useEffect, useState } from 'react'
import { api } from './api'
import { useToast } from './design'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useProfile } from './hooks/useProfile'
import { isLoggedIn, getDisplayName, clearUser } from './lib/identity'
import { clearGitHubConfig } from './lib/github'
import { Sidebar } from './focus/Sidebar'
import { CampfireView } from './views/CampfireView'
import { JournalView } from './views/JournalView'
import { DailyView } from './views/DailyView'
import { ActivityView } from './views/ActivityView'
import { StatsView } from './views/StatsView'
import { GithubView } from './views/GithubView'
import { StandupView } from './views/StandupView'
import { ShopView } from './views/ShopView'
import { GroupView } from './views/GroupView'
import { LoginView } from './views/LoginView'
import { HowToGuide } from './focus/HowToGuide'
import { GamifyHud } from './gamify/GamifyHud'
import './focus/campfire.css'
import './focus/focus.css'
import './focus/layout.css'

const SUBTITLES = {
  campfire: '집중하면 모닥불이 타오릅니다',
  together: '친구와 함께 집중해요. 각자의 집중이 모여 공동 목표를 채웁니다',
  journal: '한 주간의 집중을 돌아봐요 (월요일~일요일 기준)',
  daily: '날짜별로 무엇에 집중했는지 확인해요',
  activity: '시간대·카테고리별로 어디에 집중했는지 분석해요',
  stats: '오늘의 집중과 연속 기록',
  shop: '원하는 스킨을 골라 분위기를 바꿔요',
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
  const [howToOpen, setHowToOpen] = useState(false)
  const [seenGuide, setSeenGuide] = useLocalStorage('focus-seen-guide', false)
  const [authed, setAuthed] = useState(() => isLoggedIn())
  const gamify = useProfile()

  function handleAuthed() {
    setAuthed(true)
    gamify.refresh().catch(() => {})
    refreshStats()
  }

  function logout() {
    clearGitHubConfig()
    clearUser()
    setAuthed(false)
  }

  // 사용법 안내는 자동으로 띄우지 않습니다(자동 모달이 클릭을 가로막는 문제 방지).
  // 헤더의 '사용법' 버튼으로 언제든 열 수 있습니다.
  useEffect(() => {
    if (!seenGuide) setSeenGuide(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  if (!authed) {
    return <LoginView onAuthed={handleAuthed} />
  }

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
              <span className="app__user">{getDisplayName()}님</span>
              <button
                type="button"
                className="app__help"
                onClick={() => setHowToOpen(true)}
                title="사용법 보기"
              >
                ? 사용법
              </button>
              <button
                type="button"
                className="app__help"
                onClick={logout}
                title="로그아웃"
              >
                로그아웃
              </button>
            </div>
          </header>

          <GamifyHud profile={gamify.profile} />

          {/* 캠프파이어는 항상 마운트해 타이머가 탭 전환에도 계속 돌아가게 합니다. */}
          <div style={{ display: active === 'campfire' ? 'block' : 'none' }}>
            <CampfireView settings={settings} onSaved={refreshStats} gamify={gamify} />
          </div>
          {active === 'together' && <GroupView />}
          {active === 'journal' && <JournalView />}
          {active === 'daily' && <DailyView />}
          {active === 'activity' && <ActivityView />}
          {active === 'github' && <GithubView />}
          {active === 'standup' && <StandupView />}
          {active === 'stats' && <StatsView stats={stats} gamify={gamify} />}
          {active === 'shop' && <ShopView hook={gamify} />}
        </div>
      </div>
      <HowToGuide open={howToOpen} onClose={() => setHowToOpen(false)} />
    </div>
  )
}
