# 🔥 Focus Scene

천하제일 입코딩 대회 출품작 — **포모도로 집중 맥 데스크탑 앱**.
집중하면 모닥불이 타오르고, 멈추면 사그라듭니다. 매일 집중하면 불이 꺼지지 않습니다.

## 핵심 기능
- 🔥 **살아있는 모닥불** — 타이머 진행에 따라 불꽃이 커지는 CSS 애니메이션
- 🧭 **접이식 사이드바 4메뉴** — 캠프파이어 / 불씨 저널 / 날짜별 기록 / 통계
- ⏱ **집중 시간 자유 설정** — 프리셋(15/25/45/50분) 또는 직접 입력, **세션 중에도 변경**하면 남은 시간이 자동 조정
- 🪵 **불씨 저널** — 이번 주 집중 요약(총 집중 시간·불 세기·키워드)과 한 줄 회고 모음
- 📅 **날짜별 기록** — 날짜별로 무엇에 얼마나 집중했는지 막대로 시각화
- 📊 **집중 통계** — 오늘 집중 시간, 연속 집중일(streak), 완료 세션 수, 12주 히트맵, 집중 vs 딴짓 비율
- 🧘 **휴식 스트레칭 코치** — 집중을 완료하면 자동으로 휴식 모드로 전환, 앉아서 하는 가벼운 스트레칭을 안내하고 음성(ko-KR)으로 읽어줌
- 🎨 **스킨 보관함** — 모닥불 외 벽난로/해변/숲/비/우주/오로라 7가지 테마를 자유롭게 선택

## 구조
```
frontend/               React 18 + Vite + Tauri 2
  src/hooks/            usePomodoro(타이머), useLocalStorage(설정)
  src/focus/            Campfire, Heatmap, FocusRatio, Sidebar, BreakCoach, breakActivities
  src/views/            CampfireView, JournalView, DailyView, StatsView, SkinView
  src/design/           디자인 시스템 (16개 컴포넌트) + icons(선 아이콘) · 단순 미니멀 토큰
  src/App.jsx           사이드바 + 뷰 전환
src-tauri/              Tauri 2 네이티브 쉘 (메뉴바·로컬 저장)
```

## 실행 (맥 데스크탑 앱)

```bash
cd frontend
npm install
npm run app:dev      # 개발 모드 (네이티브 창 + HMR)
npm run app:build    # .app / .dmg 빌드 → src-tauri/target/release/bundle/
```

- 데이터는 `~/Library/Application Support/com.focusscene.app/store.json` 에 로컬 저장됩니다.
- 메뉴바(🔥)에 남은 시간이 표시되고, 창을 닫아도 타이머는 계속 돕니다.

## 기술 스택
- React 18 + Vite · Tauri 2 (Rust) · macOS
