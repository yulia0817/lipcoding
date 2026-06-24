# Focus Scene 데스크탑 앱 전환 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 Focus Scene 웹앱을, 메뉴바에 상주하며 집중 시간을 보여주는 가벼운 맥 데스크탑 앱(Tauri)으로, 핵심 기능(타이머·모닥불·기록·통계·스킨·휴식코치)만 남겨 전환한다.

**Architecture:** 기존 React+Vite 프론트엔드를 그대로 재사용하고 Tauri 2 셸로 감싼다. FastAPI 백엔드는 제거하고, 백엔드 호출(`api.js`) 3개 함수를 로컬 저장 기반 `localStore.js`로 대체한다(순수 통계 계산은 `lib/stats.js`로 분리해 테스트). 타이머는 JS가 소유하며 매초 남은 시간을 Tauri 커맨드로 메뉴바 트레이 타이틀에 push한다. 창을 닫으면 종료가 아니라 hide 되어 타이머가 계속 돈다.

**Tech Stack:** React 18 + Vite 5, Tauri 2.x(Rust), `@tauri-apps/plugin-fs`, Vitest(신규 테스트 러너).

## Global Constraints

- 플랫폼: **macOS 전용** (메뉴바/Accessory 정책 중심). 윈도/리눅스 비목표.
- Tauri는 **2.x** (`tauri = { version = "2", features = ["tray-icon"] }`). Tauri 1 API 금지 — `SystemTray`/`SystemTrayMenu` 없음, `invoke`는 `@tauri-apps/api/core`, fs 옵션 키는 `dir`가 아니라 **`baseDir`**, 권한은 `capabilities/*.json`.
- npm: `@tauri-apps/api@^2`, `@tauri-apps/plugin-fs@^2`, `@tauri-apps/cli@^2`(dev), `vitest`(dev).
- 백엔드(`backend/`, FastAPI/Python)는 **호출하지 않는다**. 어떤 유지 컴포넌트도 auth/team/github/gamify/standup 엔드포인트를 호출하면 안 됨.
- 저장 세션 객체는 **snake_case**로 통일(뷰가 기존 파이썬 API 형태에 맞춰 작성됨): `{ id, created_at, task, duration_min, completed, distracted_min, retro, source, category, tags }`. `source`는 음성 입력 제거로 항상 `'text'`.
- 날짜 집계는 **기기 로컬 타임존** 기준(기존 파이썬은 KST 고정이었음 — 개인 데스크탑 앱이므로 로컬로 변경).
- 저장 위치: Tauri 실행 시 `appDataDir()/store.json`. Tauri가 없으면(브라우저 `vite dev`) `localStorage` 폴백 — 동일 인터페이스.
- 유지: 타이머·모닥불(+스킨7종)·카테고리/태그·날짜별 기록·통계(streak/heatmap/집중비율)·휴식코치(TTS)·배경사운드.
- 제거: 로그인/auth·팀·게이미피케이션·GitHub·스탠드업·주간리포트(저널)·일일목표·활동분석(ActivityView, MVP 후순위)·음성 입력.

---

## File Structure

**신규 생성**
- `frontend/src/lib/stats.js` — 순수 통계 계산 (세션 배열 → stats/dailyBreakdown). Tauri 비의존, 테스트 대상.
- `frontend/src/lib/stats.test.js` — Vitest 단위 테스트.
- `frontend/src/localStore.js` — `api.js` 대체. 저장 IO(Tauri fs ↔ localStorage 폴백) + `{ stats, createSession, dailyBreakdown }` 파사드.
- `frontend/src/localStore.test.js` — Vitest 단위 테스트(localStorage 모킹).
- `frontend/src/views/SkinView.jsx` + `frontend/src/views/skin.css` — gamify에서 분리한 스킨 선택 뷰.
- `frontend/src/tray/trayBridge.js` — 남은시간 → 트레이 타이틀 push, 트레이 액션 수신.
- `frontend/vitest.config.js` — 테스트 설정.
- `src-tauri/` — Cargo.toml, tauri.conf.json, build.rs, `src/lib.rs`, `src/main.rs`, `capabilities/default.json`, `icons/`.

**수정**
- `frontend/src/App.jsx` — 백엔드/auth/gamify/드롭뷰 제거, localStore로 교체, skin을 settings로.
- `frontend/src/views/CampfireView.jsx` — useSpeech/gamify/heartbeat/dailyGoal 제거, api→localStore, skin prop.
- `frontend/src/views/StatsView.jsx` — gamify(QuestPanel/BadgeShelf) 제거.
- `frontend/src/focus/Sidebar.jsx` — NAV 트림(campfire/daily/stats/skins).
- `frontend/src/views/DailyView.jsx` — `import { api }` → localStore (호출부 동일).
- `frontend/vite.config.js` — Tauri 연동(strictPort 등).
- `frontend/package.json` — deps/scripts.

**삭제** (frontend/src/)
`lib/identity.js`, `lib/github.js`, `views/LoginView.jsx`+`login.css`, `views/GroupView.jsx`, `views/GroupDashboard.jsx`, `views/InviteGate.jsx`+`group.css`, `hooks/useGroups.js`, `views/GithubView.jsx`+`github.css`, `views/StandupView.jsx`+`standup.css`, `views/JournalView.jsx`+`journal.css`, `views/ShopView.jsx`+`shop.css`, `views/ActivityView.jsx`+`activity.css`, `gamify/`(GamifyHud/QuestPanel/BadgeShelf/gamify.css), `hooks/useProfile.js`, `focus/DailyGoal.jsx`, `hooks/useDailyGoal.js`, `hooks/useSpeech.js`, `api.js`. (전체 `backend/` 디렉터리는 마지막에 제거.)

---

## Task 1: 순수 통계 계산 모듈 `lib/stats.js` (+ Vitest 도입)

기존 `backend/session_store.py`의 `stats()`/`daily_breakdown()` 집계 로직을 JS 순수 함수로 이식한다. Tauri/IO 비의존이라 단위 테스트가 쉽다.

**Files:**
- Create: `frontend/src/lib/stats.js`
- Create: `frontend/src/lib/stats.test.js`
- Create: `frontend/vitest.config.js`
- Modify: `frontend/package.json` (devDeps + `test` 스크립트)

**Interfaces:**
- Produces:
  - `computeStats(sessions: Session[], now: Date) => { today_minutes, streak_days, completed_count, total_sessions, focus_minutes, distracted_minutes, heatmap: {[YYYY-MM-DD]: number} }`
  - `computeDailyBreakdown(sessions: Session[], days: number, now: Date) => DayBreakdown[]`
  - `localDayKey(iso: string, ) => 'YYYY-MM-DD'` (로컬 날짜)
  - `Session` = `{ id, created_at, task, duration_min, completed, distracted_min, retro, source, category, tags }`

- [ ] **Step 1: Vitest 설치 + 스크립트 추가**

Run:
```bash
cd frontend && npm i -D vitest
```
`frontend/package.json`의 `"scripts"`에 추가:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: `frontend/vitest.config.js` 작성**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
```

- [ ] **Step 3: 실패 테스트 작성 — `frontend/src/lib/stats.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { computeStats, computeDailyBreakdown, localDayKey } from './stats'

// 로컬 자정 기준 ISO 만들기 (테스트 안정화를 위해 정오로 고정)
function isoLocal(y, m, d, hh = 12, mm = 0) {
  return new Date(y, m - 1, d, hh, mm, 0).toISOString()
}

const NOW = new Date(2026, 5, 24, 15, 0, 0) // 2026-06-24 15:00 로컬

function session(over = {}) {
  return {
    id: over.id || Math.random().toString(36).slice(2),
    created_at: over.created_at || isoLocal(2026, 6, 24),
    task: over.task ?? '공부',
    duration_min: over.duration_min ?? 25,
    completed: over.completed ?? true,
    distracted_min: over.distracted_min ?? 0,
    retro: over.retro ?? null,
    source: over.source ?? 'text',
    category: over.category ?? '공부',
    tags: over.tags ?? [],
  }
}

describe('localDayKey', () => {
  it('로컬 날짜를 YYYY-MM-DD로 만든다', () => {
    expect(localDayKey(isoLocal(2026, 6, 24))).toBe('2026-06-24')
  })
})

describe('computeStats', () => {
  it('빈 배열이면 0과 84일 히트맵을 돌려준다', () => {
    const s = computeStats([], NOW)
    expect(s.today_minutes).toBe(0)
    expect(s.streak_days).toBe(0)
    expect(s.total_sessions).toBe(0)
    expect(Object.keys(s.heatmap)).toHaveLength(84)
    expect(s.heatmap['2026-06-24']).toBe(0)
  })

  it('오늘 집중분/완료수/집중·딴짓분을 합산한다', () => {
    const s = computeStats(
      [
        session({ duration_min: 25, distracted_min: 3, completed: true }),
        session({ duration_min: 50, distracted_min: 0, completed: false }),
      ],
      NOW,
    )
    expect(s.today_minutes).toBe(75)
    expect(s.completed_count).toBe(1)
    expect(s.total_sessions).toBe(2)
    expect(s.focus_minutes).toBe(75)
    expect(s.distracted_minutes).toBe(3)
    expect(s.heatmap['2026-06-24']).toBe(75)
  })

  it('streak: 오늘부터 연속으로 집중한 날 수를 센다', () => {
    const s = computeStats(
      [
        session({ created_at: isoLocal(2026, 6, 24) }),
        session({ created_at: isoLocal(2026, 6, 23) }),
        session({ created_at: isoLocal(2026, 6, 22) }),
        // 6/21 공백 → 끊김
        session({ created_at: isoLocal(2026, 6, 20) }),
      ],
      NOW,
    )
    expect(s.streak_days).toBe(3)
  })

  it('streak: 오늘 0분이어도 어제 집중했으면 어제부터 센다', () => {
    const s = computeStats(
      [session({ created_at: isoLocal(2026, 6, 23) })],
      NOW,
    )
    expect(s.streak_days).toBe(1)
  })
})

describe('computeDailyBreakdown', () => {
  it('날짜별 합계·작업·엔트리를 만든다(최신 날짜 우선)', () => {
    const rows = computeDailyBreakdown(
      [
        session({ created_at: isoLocal(2026, 6, 24, 9, 0), task: '코테', duration_min: 25 }),
        session({ created_at: isoLocal(2026, 6, 24, 10, 0), task: '코테', duration_min: 25 }),
        session({ created_at: isoLocal(2026, 6, 23, 9, 0), task: '독서', duration_min: 50 }),
      ],
      14,
      NOW,
    )
    expect(rows[0].date).toBe('2026-06-24')
    expect(rows[0].total_minutes).toBe(50)
    expect(rows[0].session_count).toBe(2)
    expect(rows[0].tasks[0]).toEqual({ task: '코테', minutes: 50, count: 2 })
    expect(rows[0].entries).toHaveLength(2)
    expect(rows[0].entries[0].start).toBe('08:35') // 09:00 - 25분
    expect(rows[0].entries[0].end).toBe('09:00')
    expect(rows[1].date).toBe('2026-06-23')
  })

  it('days 범위 밖 세션은 제외한다', () => {
    const rows = computeDailyBreakdown(
      [session({ created_at: isoLocal(2026, 5, 1) })],
      14,
      NOW,
    )
    expect(rows).toHaveLength(0)
  })
})
```

- [ ] **Step 4: 테스트 실패 확인**

Run: `cd frontend && npx vitest run src/lib/stats.test.js`
Expected: FAIL — "Failed to resolve import './stats'" (파일 없음)

- [ ] **Step 5: `frontend/src/lib/stats.js` 구현**

```js
// backend/session_store.py 의 stats()/daily_breakdown() 를 로컬 타임존 기준으로 이식.

function pad(n) {
  return String(n).padStart(2, '0')
}

// ISO 문자열을 '로컬' 날짜키(YYYY-MM-DD)로
export function localDayKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function dayKeyFromDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// now 로부터 i일 전 날짜키
function shiftKey(now, i) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
  return dayKeyFromDate(d)
}

export function computeStats(sessions, now = new Date()) {
  const byDay = {}
  let focusTotal = 0
  let distractTotal = 0
  let completed = 0

  for (const s of sessions) {
    const key = localDayKey(s.created_at)
    byDay[key] = (byDay[key] || 0) + s.duration_min
    focusTotal += s.duration_min
    distractTotal += s.distracted_min || 0
    if (s.completed) completed += 1
  }

  const todayKey = dayKeyFromDate(now)
  const yesterdayKey = shiftKey(now, 1)

  // streak: 오늘(또는 어제)부터 연속 집중한 날 수
  let streak = 0
  let cursorIdx = 0
  if (!(byDay[todayKey] > 0) && byDay[yesterdayKey] > 0) {
    cursorIdx = 1
  }
  while (byDay[shiftKey(now, cursorIdx)] > 0) {
    streak += 1
    cursorIdx += 1
  }

  // heatmap: 최근 84일
  const heatmap = {}
  for (let i = 0; i < 84; i++) {
    const key = shiftKey(now, i)
    heatmap[key] = byDay[key] || 0
  }

  return {
    today_minutes: byDay[todayKey] || 0,
    streak_days: streak,
    completed_count: completed,
    total_sessions: sessions.length,
    focus_minutes: focusTotal,
    distracted_minutes: distractTotal,
    heatmap,
  }
}

function hhmm(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function computeDailyBreakdown(sessions, days = 14, now = new Date()) {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
  const cutoffKey = dayKeyFromDate(cutoff)

  const perDay = {}
  for (const s of sessions) {
    const key = localDayKey(s.created_at)
    if (key < cutoffKey) continue
    ;(perDay[key] = perDay[key] || []).push(s)
  }

  const dayKeys = Object.keys(perDay).sort().reverse()
  return dayKeys.map((date) => {
    const daySessions = perDay[date]
    const perTaskMin = {}
    const perTaskCnt = {}
    for (const s of daySessions) {
      perTaskMin[s.task] = (perTaskMin[s.task] || 0) + s.duration_min
      perTaskCnt[s.task] = (perTaskCnt[s.task] || 0) + 1
    }
    const tasks = Object.keys(perTaskMin)
      .map((t) => ({ task: t, minutes: perTaskMin[t], count: perTaskCnt[t] }))
      .sort((a, b) => b.minutes - a.minutes)

    const entries = daySessions
      .map((s) => {
        const end = new Date(s.created_at)
        const start = new Date(end.getTime() - s.duration_min * 60000)
        return {
          start: hhmm(start),
          end: hhmm(end),
          task: s.task,
          category: s.category,
          duration_min: s.duration_min,
          completed: s.completed,
          distracted_min: s.distracted_min || 0,
          source: s.source,
          retro: s.retro,
          tags: s.tags || [],
        }
      })
      .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))

    return {
      date,
      total_minutes: daySessions.reduce((sum, s) => sum + s.duration_min, 0),
      session_count: daySessions.length,
      tasks,
      entries,
    }
  })
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `cd frontend && npx vitest run src/lib/stats.test.js`
Expected: PASS (8 tests)

- [ ] **Step 7: 커밋**

```bash
cd frontend && git add package.json package-lock.json vitest.config.js src/lib/stats.js src/lib/stats.test.js
git commit -m "feat: add pure stats computation ported from python backend"
```

---

## Task 2: 로컬 저장 파사드 `localStore.js`

`api.js`의 3개 호출(`stats`/`createSession`/`dailyBreakdown`)을 로컬 저장으로 대체한다. 저장 IO는 Tauri fs를 쓰되, Tauri가 없으면 `localStorage`로 폴백해 브라우저 `vite dev`에서도 동작한다.

**Files:**
- Create: `frontend/src/localStore.js`
- Create: `frontend/src/localStore.test.js`

**Interfaces:**
- Consumes: `computeStats`, `computeDailyBreakdown` (Task 1)
- Produces: `export const api = { stats(), createSession(body), dailyBreakdown() }`
  - `createSession(body)`: body = `{ task, duration_min, completed, distracted_min, retro, source, category, tags }` → 저장 시 `id`+`created_at` 부여 후 sessions 배열에 append. 반환값 미사용.
  - `stats()` → `computeStats(loadSessions(), new Date())`
  - `dailyBreakdown()` → `computeDailyBreakdown(loadSessions(), 14, new Date())`
- Produces (내부): `loadSessions(): Promise<Session[]>`, `saveSessions(arr): Promise<void>`

- [ ] **Step 1: 실패 테스트 작성 — `frontend/src/localStore.test.js`**

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'

// localStorage 폴리필 (node 환경)
beforeEach(() => {
  const store = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  })
  // Tauri 미존재 환경을 명시
  vi.stubGlobal('window', { __TAURI_INTERNALS__: undefined })
})

describe('localStore api', () => {
  it('createSession 후 stats/dailyBreakdown 에 반영된다', async () => {
    const { api } = await import('./localStore')
    await api.createSession({
      task: '코테',
      duration_min: 25,
      completed: true,
      distracted_min: 2,
      retro: null,
      source: 'text',
      category: '공부',
      tags: ['코테'],
    })
    const stats = await api.stats()
    expect(stats.total_sessions).toBe(1)
    expect(stats.focus_minutes).toBe(25)
    expect(stats.distracted_minutes).toBe(2)

    const daily = await api.dailyBreakdown()
    expect(daily[0].total_minutes).toBe(25)
    expect(daily[0].tasks[0].task).toBe('코테')
  })

  it('저장은 localStorage에 영속화되어 다시 읽힌다', async () => {
    vi.resetModules()
    const m1 = await import('./localStore')
    await m1.api.createSession({
      task: '독서', duration_min: 50, completed: true,
      distracted_min: 0, retro: null, source: 'text', category: '독서', tags: [],
    })
    vi.resetModules() // 모듈 캐시 초기화 → 디스크(=localStorage)에서 다시 로드
    const m2 = await import('./localStore')
    const stats = await m2.api.stats()
    expect(stats.total_sessions).toBe(1)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd frontend && npx vitest run src/localStore.test.js`
Expected: FAIL — "Failed to resolve import './localStore'"

- [ ] **Step 3: `frontend/src/localStore.js` 구현**

```js
import { computeStats, computeDailyBreakdown } from './lib/stats'

const FILE = 'store.json'
const LS_KEY = 'focus-scene-store'

// Tauri 환경 여부 (런타임). 폴백: localStorage.
function hasTauri() {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
}

let cache = null // { sessions: [] }

async function readRaw() {
  if (hasTauri()) {
    const { readTextFile, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    if (!(await exists(FILE, { baseDir: BaseDirectory.AppData }))) return null
    return await readTextFile(FILE, { baseDir: BaseDirectory.AppData })
  }
  return localStorage.getItem(LS_KEY)
}

async function writeRaw(text) {
  if (hasTauri()) {
    const { writeTextFile, mkdir, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs')
    if (!(await exists('', { baseDir: BaseDirectory.AppData }))) {
      await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true })
    }
    await writeTextFile(FILE, text, { baseDir: BaseDirectory.AppData })
    return
  }
  localStorage.setItem(LS_KEY, text)
}

async function load() {
  if (cache) return cache
  try {
    const raw = await readRaw()
    cache = raw ? JSON.parse(raw) : { sessions: [] }
  } catch {
    cache = { sessions: [] }
  }
  if (!Array.isArray(cache.sessions)) cache.sessions = []
  return cache
}

async function save() {
  await writeRaw(JSON.stringify(cache))
}

function newId() {
  return 's-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36)
}

export const api = {
  async stats() {
    const { sessions } = await load()
    return computeStats(sessions, new Date())
  },
  async dailyBreakdown() {
    const { sessions } = await load()
    return computeDailyBreakdown(sessions, 14, new Date())
  },
  async createSession(body) {
    const data = await load()
    data.sessions.push({
      id: newId(),
      created_at: new Date().toISOString(),
      task: body.task,
      duration_min: body.duration_min,
      completed: !!body.completed,
      distracted_min: body.distracted_min || 0,
      retro: body.retro ?? null,
      source: body.source || 'text',
      category: body.category || '기타',
      tags: body.tags || [],
    })
    await save()
  },
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd frontend && npx vitest run src/localStore.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
cd frontend && git add src/localStore.js src/localStore.test.js
git commit -m "feat: add localStore facade replacing backend api (fs + localStorage fallback)"
```

---

## Task 3: 코어만 남기고 백엔드/auth/gamify 제거 (대규모 트림)

앱이 백엔드 없이 `vite dev`(브라우저)에서 구동되도록, 드롭 대상 파일을 삭제하고 `App.jsx`/`CampfireView.jsx`/`StatsView.jsx`를 정리한다.

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/views/CampfireView.jsx`
- Modify: `frontend/src/views/StatsView.jsx`
- Modify: `frontend/src/views/DailyView.jsx:1` (import 경로만)
- Delete: (File Structure의 삭제 목록 — `api.js` 포함, **단 `App.jsx`/`CampfireView.jsx` 가 더 이상 참조하지 않게 만든 뒤**)

**Interfaces:**
- Consumes: `localStore` `api` (Task 2)

- [ ] **Step 1: `DailyView.jsx` import 교체**

`frontend/src/views/DailyView.jsx:1` 의
```js
import { api } from '../api'
```
→
```js
import { api } from '../localStore'
```
(호출부 `api.dailyBreakdown()` 동일.)

- [ ] **Step 2: `StatsView.jsx` 에서 gamify 제거**

`frontend/src/views/StatsView.jsx` 전체를 아래로 교체:
```jsx
import { Card, EmptyState } from '../design'
import { FocusRatio } from '../focus/FocusRatio'

export function StatsView({ stats }) {
  if (!stats) {
    return <EmptyState icon="📊" title="통계를 불러오는 중" description="잠시만요." />
  }
  return (
    <>
      <div className="section-title">오늘의 집중</div>
      <Card>
        <div className="stat-grid">
          <div className="stat-grid__item">
            <div className="stat-grid__value">{stats.today_minutes}분</div>
            <div className="stat-grid__label">오늘 집중</div>
          </div>
          <div className="stat-grid__item">
            <div className="stat-grid__value">🔥 {stats.streak_days}일</div>
            <div className="stat-grid__label">연속 집중</div>
          </div>
          <div className="stat-grid__item">
            <div className="stat-grid__value">{stats.completed_count}</div>
            <div className="stat-grid__label">완료 세션</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <FocusRatio
            focusMin={stats.focus_minutes}
            distractedMin={stats.distracted_minutes}
          />
        </div>
      </Card>
    </>
  )
}
```

- [ ] **Step 3: `CampfireView.jsx` 에서 음성입력/gamify/heartbeat/dailyGoal 제거**

다음 편집을 정확히 적용한다(라인 번호는 현재 파일 기준):

1. import 줄 교체/삭제:
   - `import { api } from '../api'` → `import { api } from '../localStore'`
   - 삭제: `import { useSpeech } from '../hooks/useSpeech'`
   - 삭제: `import { useDailyGoal } from '../hooks/useDailyGoal'`
   - 삭제: `import { DailyGoal } from '../focus/DailyGoal'`
   - 삭제: `IconMic` (design/icons import 목록에서) — 마이크 버튼 제거에 따라.
2. 시그니처: `export function CampfireView({ settings, onSaved, gamify }) {` → `export function CampfireView({ settings, onSaved }) {`
3. 상태/훅 삭제:
   - `const [voiceUsed, setVoiceUsed] = useState(false)` (31)
   - `const speech = useSpeech()` (38)
   - `const goal = useDailyGoal()` (41)
4. `dictate()` 함수 전체 삭제 (66–73).
5. `doStartFocus` 의 `source: voiceUsed ? 'voice' : 'text'` (94) → `source: 'text'`.
6. 완료 effect의 `goal.markDone()` (58) 삭제.
7. heartbeat effect 전체 삭제 (215–235: `// 같이 집중 ...` 주석 포함 `useEffect(...[active])`).
8. `skinId`/스킨: `gamify?.profile?.equipped_skin || 'campfire'` 3곳(261, 265, 331 근방) → `settings.skin || 'campfire'`. (BreathingIntro·ImmersiveScene·FocusScene)
9. `<DailyGoal .../>` 렌더 블록 삭제 (311–316).
10. `saveSession` 의 gamify 블록 삭제 (154–161: `if (gamify) { ... }`). 그리고 finally의 `setVoiceUsed(false)` (170) 삭제.
11. 시작 입력의 마이크 IconButton 블록 삭제 (359–363: `{speech.supported && (<IconButton ...><IconMic/></IconButton>)}`).
12. 회고 모달의 마이크 버튼이 있으면 동일 삭제(있을 경우, `dictate(setRetro)` 사용처).

적용 후 `saveSession`은 아래 형태가 된다(확인용):
```jsx
  async function saveSession() {
    const p = pendingSession.current
    if (!p) return
    const wasCompleted = !!p.completed
    const durationMin = p.completed ? settings.focusMin : p._elapsedMin || 1
    try {
      await api.createSession({
        task: p.task,
        duration_min: durationMin,
        completed: p.completed,
        distracted_min: Math.round(timer.distractedSec / 60),
        retro: retro.trim() || null,
        source: p.source,
        category: p.category || '기타',
        tags: p.tags || [],
      })
      toast('세션을 기록했어요', { variant: 'success' })
    } catch (e) {
      toast(`저장 실패: ${e}`, { variant: 'error' })
    } finally {
      pendingSession.current = null
      setRetro('')
      setRetroOpen(false)
      setTask('')
      setTags([])
      timer.resetDistraction()
      if (wasCompleted) setPendingBreak(true)
      else timer.reset('focus')
      onSaved && onSaved()
    }
  }
```

- [ ] **Step 4: `App.jsx` 전체 교체 (auth/gamify/드롭뷰 제거 + skin 설정)**

`frontend/src/App.jsx` 전체를 아래로 교체:
```jsx
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
```

- [ ] **Step 5: 드롭 파일 삭제 (단, SkinView는 Task 4에서 생성하므로 여기선 App이 잠시 import 에러 — 순서상 Task 4 와 함께 검증)**

```bash
cd frontend/src
rm -f api.js \
  lib/identity.js lib/github.js \
  views/LoginView.jsx views/login.css \
  views/GroupView.jsx views/GroupDashboard.jsx views/InviteGate.jsx views/group.css \
  hooks/useGroups.js \
  views/GithubView.jsx views/github.css \
  views/StandupView.jsx views/standup.css \
  views/JournalView.jsx views/journal.css \
  views/ShopView.jsx views/shop.css \
  views/ActivityView.jsx views/activity.css \
  hooks/useProfile.js hooks/useDailyGoal.js hooks/useSpeech.js \
  focus/DailyGoal.jsx
rm -rf gamify
```

- [ ] **Step 6: 커밋 (검증은 Task 4에서)**

```bash
cd frontend && git add -A
git commit -m "refactor: strip non-core features (auth/team/gamify/github/standup/journal/voice)"
```

---

## Task 4: 스킨 선택 뷰 `SkinView` (gamify 분리) + 사이드바 네비 트림

스킨을 게이미피케이션에서 떼어내, `settings.skin`을 바꾸는 단순 선택 뷰로 만든다.

**Files:**
- Create: `frontend/src/views/SkinView.jsx`
- Create: `frontend/src/views/skin.css`
- Modify: `frontend/src/focus/Sidebar.jsx` (NAV 트림 + 미사용 아이콘 import 제거)

**Interfaces:**
- Consumes: `THEMES` from `../focus/themes`
- Produces: `SkinView({ value: string, onSelect: (skinId) => void })`

- [ ] **Step 1: `frontend/src/views/SkinView.jsx` 작성**

```jsx
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
```

- [ ] **Step 2: `frontend/src/views/skin.css` 작성**

```css
.skin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.skin-card { text-align: center; }
.skin-card__emoji { font-size: 32px; }
.skin-card__name { font-weight: 600; margin-top: 6px; }
.skin-card__desc {
  font-size: 12px;
  color: var(--text-muted, #888);
  margin: 6px 0 10px;
  min-height: 32px;
}
```

- [ ] **Step 3: `Sidebar.jsx` NAV 트림 + 아이콘 import 정리**

`frontend/src/focus/Sidebar.jsx` 의 icons import(3–15)를 아래로 교체:
```js
import {
  IconFlame,
  IconCalendar,
  IconChart,
  IconClock,
  IconCoffee,
  IconPalette,
} from '../design/icons'
```
그리고 `NAV` 배열(20–30)을 아래로 교체:
```js
const NAV = [
  { id: 'campfire', Icon: IconFlame, label: '집중 타이머' },
  { id: 'daily', Icon: IconCalendar, label: '날짜별 기록' },
  { id: 'stats', Icon: IconChart, label: '통계' },
  { id: 'skins', Icon: IconPalette, label: '스킨' },
]
```

- [ ] **Step 4: 백엔드 없이 브라우저 구동 검증**

Run: `cd frontend && npm run dev` (백엔드 미실행 상태에서)
브라우저로 `http://localhost:5173` 접속 후 확인:
- 로그인 화면 없이 바로 모닥불 화면.
- 작업/카테고리 입력 → 시작 → (호흡 인트로) → 타이머 동작.
- 25분 대신 짧게 테스트하려면 사이드바에서 1분 설정 후 완료까지 → 회고 저장 → '세션을 기록했어요'.
- `날짜별 기록`/`통계`에 방금 세션 반영.
- `스킨`에서 다른 스킨 선택 → 모닥불 화면 분위기 변경 + 새로고침 후 유지(localStorage).
- 콘솔에 빨간 에러 없음(특히 import 실패 없음).

- [ ] **Step 5: 단위 테스트 회귀 확인**

Run: `cd frontend && npx vitest run`
Expected: PASS (Task 1·2 테스트 그대로 통과)

- [ ] **Step 6: 커밋**

```bash
cd frontend && git add -A
git commit -m "feat: decoupled SkinView + trimmed sidebar nav (core-only app runs without backend)"
```

---

## Task 5: Tauri 셸 스캐폴드 (네이티브 창으로 부팅)

기존 Vite 앱을 Tauri 2로 감싸 네이티브 창에서 뜨게 한다. 이 단계의 트레이/메뉴바는 아직 없음(다음 태스크).

**Files:**
- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/tauri.conf.json`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`, `src-tauri/icons/` (아이콘)
- Modify: `frontend/vite.config.js`, `frontend/package.json`

**선행 요건:** Rust 툴체인.
```bash
# 미설치 시:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Tauri CLI:
cd frontend && npm i -D @tauri-apps/cli @tauri-apps/api @tauri-apps/plugin-fs
```

- [ ] **Step 1: `vite.config.js` 에 Tauri 연동 추가**

`frontend/vite.config.js` 의 `defineConfig({...})` 에 아래를 병합(기존 react 플러그인 유지):
```js
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
})
```

- [ ] **Step 2: `src-tauri/Cargo.toml`**

```toml
[package]
name = "focus-scene"
version = "0.1.0"
edition = "2021"

[lib]
name = "focus_scene_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-fs = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 3: `src-tauri/build.rs`**

```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 4: `src-tauri/tauri.conf.json`**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Focus Scene",
  "version": "0.1.0",
  "identifier": "com.focusscene.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": false,
    "windows": [
      {
        "label": "main",
        "title": "Focus Scene",
        "width": 920,
        "height": 720,
        "resizable": true,
        "visible": true,
        "skipTaskbar": true
      }
    ],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": ["app", "dmg"],
    "icon": ["icons/icon.png", "icons/icon.icns"],
    "category": "Productivity"
  },
  "plugins": { "fs": {} }
}
```

- [ ] **Step 5: `src-tauri/capabilities/default.json`**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "core + local file storage in app data dir",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:default",
    { "identifier": "fs:allow-write-text-file", "allow": [{ "path": "$APPDATA/*" }] },
    { "identifier": "fs:allow-read-text-file", "allow": [{ "path": "$APPDATA/*" }] },
    { "identifier": "fs:allow-exists", "allow": [{ "path": "$APPDATA/*" }] },
    { "identifier": "fs:allow-mkdir", "allow": [{ "path": "$APPDATA/*" }] }
  ]
}
```

- [ ] **Step 6: `src-tauri/src/main.rs` 와 최소 `lib.rs`**

`src-tauri/src/main.rs`:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    focus_scene_lib::run()
}
```

`src-tauri/src/lib.rs` (이 단계는 최소 — 창만 띄움):
```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 7: 아이콘 생성**

```bash
cd frontend
# 1024x1024 PNG 하나를 src-tauri/icons/icon.png 로 둔 뒤:
npx tauri icon src-tauri/icons/icon.png
```
(임시로는 기존 `frontend/public` 의 아무 정사각 PNG 사용 가능. 없으면 단색 PNG라도 생성.)

- [ ] **Step 8: `package.json` 스크립트 추가**

`frontend/package.json` scripts 에:
```json
"tauri": "tauri",
"app:dev": "tauri dev",
"app:build": "tauri build"
```

- [ ] **Step 9: 네이티브 창 구동 검증**

Run: `cd frontend && npx tauri dev`
Expected: Vite dev 서버가 뜨고 **네이티브 창**에 모닥불 앱이 표시됨. 타이머/스킨/기록/통계가 브라우저 때와 동일하게 동작. 저장은 이제 `appDataDir()/store.json` (다음 태스크에서 영속 검증).

- [ ] **Step 10: 커밋**

```bash
cd /Users/julia/copilot/lipcoding && git add -A
git commit -m "feat: scaffold Tauri 2 shell wrapping the Vite app (native window boots)"
```

---

## Task 6: 로컬 파일 영속 검증 (재시작 후 데이터 유지)

`localStore`는 Tauri 환경에서 `appDataDir()/store.json` 에 쓴다(Task 2에서 구현됨). 실제 영속을 검증한다.

**Files:** (코드 변경 없음 — 검증 태스크. 문제가 있으면 `localStore.js` 수정.)

- [ ] **Step 1: 세션 생성 → 앱 종료 → 재시작 → 유지 확인**

1. `npx tauri dev` 로 앱 실행, 1분 집중을 완료해 세션 1건 기록.
2. `통계`에 `완료 세션 1`, `오늘 집중 1분` 확인.
3. 앱 완전 종료(트레이 없으니 ⌘Q / 창 닫기).
4. 파일 확인:
   ```bash
   cat "$HOME/Library/Application Support/com.focusscene.app/store.json"
   ```
   Expected: `{"sessions":[{...}]}` JSON 출력.
5. `npx tauri dev` 재실행 → `통계`/`날짜별 기록`에 이전 세션이 그대로 보임.

- [ ] **Step 2: (문제 시) fs 권한/경로 디버깅**

콘솔에 `forbidden path` 류 에러가 나오면 `capabilities/default.json` 의 `$APPDATA/*` 권한을 확인. 파일이 안 만들어지면 `localStore.writeRaw` 의 `mkdir('', {recursive:true})` 호출 확인.

- [ ] **Step 3: 커밋 (수정이 있었다면)**

```bash
cd /Users/julia/copilot/lipcoding && git add -A
git commit -m "fix: verify/repair local json persistence under tauri appData"
```

---

## Task 7: 메뉴바 트레이 + 창 hide-on-close

앱을 메뉴바(Accessory) 앱으로 만들고, 트레이 메뉴(열기/끝내기)와 창 닫기=hide 동작을 추가한다.

**Files:**
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces (Rust): 트레이 `id="main-tray"`, 메뉴 이벤트 id `start/pause/stop/open/quit`, 창 이벤트 `tray-action`(emit, 다음 태스크에서 JS가 수신).

- [ ] **Step 1: `lib.rs` 를 트레이+메뉴+hide 로 확장**

`src-tauri/src/lib.rs` 전체를 아래로 교체:
```rust
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

pub struct TrayState(pub std::sync::Mutex<tauri::tray::TrayIcon>);

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let start_i = MenuItem::with_id(app, "start", "시작", true, None::<&str>)?;
            let pause_i = MenuItem::with_id(app, "pause", "일시정지/재개", true, None::<&str>)?;
            let stop_i = MenuItem::with_id(app, "stop", "종료", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let open_i = MenuItem::with_id(app, "open", "열기", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "끝내기", true, None::<&str>)?;
            let menu = Menu::with_items(
                app,
                &[&start_i, &pause_i, &stop_i, &sep, &open_i, &sep, &quit_i],
            )?;

            let tray = TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .title("🔥")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "open" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    other => {
                        let _ = app.emit("tray-action", other.to_string());
                    }
                })
                .build(app)?;

            app.manage(TrayState(std::sync::Mutex::new(tray)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_tray_title])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn set_tray_title(title: String, state: tauri::State<'_, TrayState>) -> Result<(), String> {
    let tray = state.0.lock().map_err(|e| e.to_string())?;
    tray.set_title(Some(title)).map_err(|e| e.to_string())
}
```

- [ ] **Step 2: 메뉴바 동작 검증**

Run: `cd frontend && npx tauri dev`
Expected:
- Dock 아이콘 없이 **메뉴바에 🔥** 아이콘 표시.
- 트레이 우클릭 → `시작/일시정지·재개/종료/열기/끝내기` 메뉴.
- 메인 창 닫기(빨간 버튼/⌘W) → 종료가 아니라 **숨김**. 트레이 `열기`로 다시 표시.
- `끝내기` → 앱 종료.

- [ ] **Step 3: 커밋**

```bash
cd /Users/julia/copilot/lipcoding && git add -A
git commit -m "feat: menubar tray (accessory app) with menu + hide-on-close"
```

---

## Task 8: 메뉴바 실시간 카운트다운 + 트레이 컨트롤 연동

JS 타이머가 매초 남은 시간을 트레이 타이틀로 push하고, 트레이 메뉴의 시작/일시정지/종료를 프론트 타이머에 연결한다.

**Files:**
- Create: `frontend/src/tray/trayBridge.js`
- Modify: `frontend/src/views/CampfireView.jsx` (타이머 상태 ↔ 트레이 브리지 연결)

**Interfaces:**
- Consumes (Rust): `invoke('set_tray_title', { title })`, event `tray-action` (payload: `'start'|'pause'|'stop'`)
- Produces: `pushTrayTitle(text)`, `onTrayAction(handler) => unlisten` (Tauri 없으면 no-op)

- [ ] **Step 1: `frontend/src/tray/trayBridge.js` 작성**

```js
// Tauri 트레이 브리지. Tauri 없으면(브라우저) 전부 no-op 이라 동일 코드로 동작.
function hasTauri() {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
}

export async function pushTrayTitle(text) {
  if (!hasTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_tray_title', { title: text })
  } catch {
    /* ignore */
  }
}

// handler('start'|'pause'|'stop') 를 트레이 메뉴 이벤트에 연결. unlisten 함수 반환.
export async function onTrayAction(handler) {
  if (!hasTauri()) return () => {}
  const { listen } = await import('@tauri-apps/api/event')
  const unlisten = await listen('tray-action', (e) => handler(e.payload))
  return unlisten
}
```

- [ ] **Step 2: `CampfireView.jsx` 에 트레이 연동 effect 추가**

`frontend/src/views/CampfireView.jsx` 상단 import에 추가:
```js
import { pushTrayTitle, onTrayAction } from '../tray/trayBridge'
```
컴포넌트 본문(기존 effect들 근처)에 두 개의 effect 추가:
```jsx
  // 메뉴바 트레이에 남은 시간 push (idle 이면 🔥)
  useEffect(() => {
    if (sessionLive) {
      const mm = String(Math.floor(timer.remaining / 60)).padStart(2, '0')
      const ss = String(timer.remaining % 60).padStart(2, '0')
      pushTrayTitle(`🔥 ${mm}:${ss}`)
    } else {
      pushTrayTitle('🔥')
    }
  }, [timer.remaining, sessionLive])

  // 트레이 메뉴(시작/일시정지/종료) → 타이머 제어
  useEffect(() => {
    let unlisten = () => {}
    onTrayAction((action) => {
      if (action === 'start') {
        if (idle) startFocus()
        else if (pendingSession.current) pauseOrResume()
      } else if (action === 'pause') {
        if (pendingSession.current) pauseOrResume()
      } else if (action === 'stop') {
        if (breakMode) timer.reset('focus')
        else if (pendingSession.current) stopFocus()
      }
    }).then((u) => (unlisten = u))
    return () => unlisten()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idle, breakMode])
```
(주의: `idle`, `sessionLive`, `breakMode`, `pendingSession`, `startFocus`, `pauseOrResume`, `stopFocus` 는 모두 이미 CampfireView에 존재.)

- [ ] **Step 3: 실시간 카운트다운 + 컨트롤 검증**

Run: `cd frontend && npx tauri dev`
Expected:
- 집중 시작 → 메뉴바에 `🔥 24:59 …` 가 매초 줄어듦.
- 메인 창을 닫아도(hide) 메뉴바 시간 계속 갱신.
- 트레이 메뉴 `시작`(idle일 때 작업이 비어도 카테고리로 시작), `일시정지/재개`, `종료` 가 타이머에 반영.
- 세션 종료 시 idle이면 트레이가 `🔥` 로 복귀.

- [ ] **Step 4: 커밋**

```bash
cd /Users/julia/copilot/lipcoding && git add -A
git commit -m "feat: live menubar countdown + tray menu controls wired to timer"
```

---

## Task 9: 마무리 — 아이콘/패키징/백엔드 제거

배포 가능한 로컬 빌드를 만들고, 더 이상 쓰지 않는 백엔드를 제거한다.

**Files:**
- Modify: `src-tauri/tauri.conf.json` (이미 productName/icon 설정됨 — 확인)
- Delete: `backend/`, 루트의 `azure.yaml`, `infra/`, `.azure/` (배포 비목표)

- [ ] **Step 1: 백엔드/Azure 잔재 제거**

```bash
cd /Users/julia/copilot/lipcoding
rm -rf backend infra .azure azure.yaml
```
(README의 백엔드 실행 안내도 데스크탑 기준으로 갱신 — Step 3.)

- [ ] **Step 2: 프로덕션 빌드**

Run: `cd frontend && npx tauri build`
Expected: `src-tauri/target/release/bundle/macos/Focus Scene.app` 및 `.../dmg/Focus Scene_0.1.0_aarch64.dmg` 생성. 빌드 에러 없음.

- [ ] **Step 3: README 갱신**

`lipcoding/README.md` 의 "로컬 실행" 섹션을 데스크탑 기준으로 교체:
```markdown
## 실행 (맥 데스크탑 앱)

```bash
cd frontend
npm install
npm run app:dev      # 개발 모드 (네이티브 창 + HMR)
npm run app:build    # .app / .dmg 빌드 → src-tauri/target/release/bundle/
```

- 데이터는 `~/Library/Application Support/com.focusscene.app/store.json` 에 로컬 저장됩니다.
- 메뉴바(🔥)에 남은 시간이 표시되고, 창을 닫아도 타이머는 계속 돕니다.
```

- [ ] **Step 4: 미서명 앱 실행 메모 (개인 사용)**

빌드한 `.app` 을 처음 열 때 Gatekeeper 경고가 나오면: 우클릭 → 열기, 또는
```bash
xattr -dr com.apple.quarantine "src-tauri/target/release/bundle/macos/Focus Scene.app"
```

- [ ] **Step 5: 전체 회귀 + 커밋**

```bash
cd frontend && npx vitest run   # 단위 테스트 통과 확인
cd /Users/julia/copilot/lipcoding && git add -A
git commit -m "chore: package desktop app, remove backend/azure, update README"
```

---

## Self-Review (작성자 점검)

- **스펙 커버리지:** 타이머(기존 usePomodoro 유지)·모닥불(FocusScene 유지)·카테고리(유지)·날짜별기록(Task1/2/3 DailyView)·통계(Task1/2/3 StatsView)·스킨7종(Task4 SkinView)·휴식코치(BreakCoach 유지, TTS)·배경사운드(useAmbient 유지) → 모두 태스크에 매핑. 제거 항목(로그인/팀/게임/깃헙/스탠드업/저널/일일목표/음성입력/백엔드) → Task3·9. 메뉴바 상주(Task7/8), 로컬저장(Task1/2/6), Tauri(Task5). ✔
- **플레이스홀더:** 없음 — 모든 코드 단계에 실제 코드/명령/기대출력 포함.
- **타입 일관성:** 저장 세션은 전 구간 snake_case(`duration_min`/`distracted_min`/`created_at`)로 통일, `localStore.api`의 `{stats,createSession,dailyBreakdown}` 시그니처가 뷰의 기존 `api.*` 호출과 일치. `set_tray_title`의 인자 키 `title` 가 Rust 파라미터명과 일치.
- **알려진 한계(스펙 리스크와 동일):** 웹 알림(`useNotification`)은 WKWebView에서 무동작일 수 있음 — best-effort(`notif.supported` 가드로 안전). 전체화면 몰입(ImmersiveScene)·활동분석(ActivityView)·시간대/카테고리 통계는 MVP 후순위. 추후 필요 시 `localStore`에 `hourlyBreakdown/categoryBreakdown` 추가 + ActivityView 복원으로 확장 가능.
