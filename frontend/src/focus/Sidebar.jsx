import { Button } from '../design'
import './slider.css'
import {
  IconFlame,
  IconBook,
  IconCalendar,
  IconChart,
  IconClock,
  IconCoffee,
  IconTag,
  IconPalette,
  IconUsers,
  IconGit,
  IconClipboard,
} from '../design/icons'

const FOCUS_PRESETS = [15, 25, 45, 50]
const BREAK_PRESETS = [5, 10, 15]

const NAV = [
  { id: 'campfire', Icon: IconFlame, label: '집중 타이머' },
  { id: 'together', Icon: IconUsers, label: '같이 집중' },
  { id: 'journal', Icon: IconBook, label: '주간 리포트' },
  { id: 'daily', Icon: IconCalendar, label: '날짜별 기록' },
  { id: 'activity', Icon: IconTag, label: '활동 분석' },
  { id: 'stats', Icon: IconChart, label: '통계' },
  { id: 'github', Icon: IconGit, label: 'GitHub 연동' },
  { id: 'standup', Icon: IconClipboard, label: '스탠드업' },
  { id: 'shop', Icon: IconPalette, label: '스킨 보관함' },
]

function clamp(v, min, max) {
  const n = parseInt(v, 10)
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

// 왼쪽 접이식 사이드바: 메뉴 이동 + 집중/휴식 시간 설정.
// 설정값은 상위에서 localStorage로 보관합니다.
export function Sidebar({
  collapsed,
  onToggle,
  settings,
  onSettings,
  active,
  onNavigate,
}) {
  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar__top">
        <span className="sidebar__brand">
          <span className="sidebar__brand-icon"><IconFlame size={22} /></span>
          {!collapsed && <span className="sidebar__brand-text">Focus Scene</span>}
        </span>
        <button
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
          title={collapsed ? '메뉴 펼치기' : '메뉴 접기'}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`sidebar__nav-item ${active === n.id ? 'is-active' : ''}`}
            onClick={() => onNavigate(n.id)}
            title={n.label}
          >
            <span className="sidebar__nav-icon"><n.Icon /></span>
            {!collapsed && <span className="sidebar__nav-label">{n.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="sidebar__settings">
          <div className="sidebar__section-title"><IconClock size={15} /> 집중 시간</div>
          <div className="sidebar__presets">
            {FOCUS_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                className={`chip ${settings.focusMin === m ? 'is-on' : ''}`}
                onClick={() => onSettings({ ...settings, focusMin: m })}
              >
                {m}분
              </button>
            ))}
          </div>
          <label className="sidebar__custom">
            <span>직접 입력</span>
            <input
              type="number"
              min="1"
              max="180"
              value={settings.focusMin}
              onChange={(e) =>
                onSettings({ ...settings, focusMin: clamp(e.target.value, 1, 180) })
              }
            />
            <span>분</span>
          </label>
          <div className="sidebar__slider-row">
            <input
              type="range"
              className="sidebar__slider"
              min="5"
              max="120"
              step="5"
              value={Math.min(120, settings.focusMin)}
              onChange={(e) =>
                onSettings({ ...settings, focusMin: clamp(e.target.value, 1, 180) })
              }
              style={{ '--pct': `${((Math.min(120, settings.focusMin) - 5) / 115) * 100}%` }}
              aria-label="집중 시간 슬라이더"
            />
            <span className="sidebar__slider-val">{settings.focusMin}분</span>
          </div>

          <div className="sidebar__section-title"><IconCoffee size={15} /> 휴식 시간</div>
          <div className="sidebar__presets">
            {BREAK_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                className={`chip ${settings.breakMin === m ? 'is-on' : ''}`}
                onClick={() => onSettings({ ...settings, breakMin: m })}
              >
                {m}분
              </button>
            ))}
          </div>
          <div className="sidebar__slider-row">
            <input
              type="range"
              className="sidebar__slider"
              min="1"
              max="30"
              step="1"
              value={Math.min(30, settings.breakMin)}
              onChange={(e) =>
                onSettings({ ...settings, breakMin: clamp(e.target.value, 1, 60) })
              }
              style={{ '--pct': `${((Math.min(30, settings.breakMin) - 1) / 29) * 100}%` }}
              aria-label="휴식 시간 슬라이더"
            />
            <span className="sidebar__slider-val">{settings.breakMin}분</span>
          </div>

          <p className="sidebar__hint">
            집중 중에도 바꿀 수 있어요 — 남은 시간이 자동 조정돼요
          </p>
        </div>
      )}

      {!collapsed && (
        <div className="sidebar__foot">설정은 이 브라우저에 저장돼요</div>
      )}
    </aside>
  )
}
