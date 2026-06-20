# 🔥 Focus Scene

천하제일 입코딩 대회 출품작 — **음성 기반 포모도로 집중 앱**.
집중하면 모닥불이 타오르고, 멈추면 사그라듭니다. 매일 집중하면 불이 꺼지지 않습니다.

## 핵심 기능
- 🎤 **음성/텍스트로 집중 대상 입력** 후 포모도로 시작 (Web Speech API, 한국어)
- 🔥 **살아있는 모닥불** — 타이머 진행에 따라 불꽃이 커지는 CSS 애니메이션
- 🧭 **접이식 사이드바 4메뉴** — 캠프파이어 / 불씨 저널 / 날짜별 기록 / 통계
- ⏱ **집중 시간 자유 설정** — 프리셋(15/25/45/50분) 또는 직접 입력, **세션 중에도 변경**하면 남은 시간이 자동 조정 (설정은 localStorage에 저장)
- 🪵 **불씨 저널** — 이번 주 집중 요약(총 집중 시간·불 세기·키워드)과 한 줄 회고 모음
- 📅 **날짜별 기록** — 날짜별로 무엇에 얼마나 집중했는지 막대로 시각화
- 📊 **집중 통계** — 오늘 집중 시간, 연속 집중일(streak), 완료 세션 수, 12주 히트맵, 집중 vs 딴짓 비율
- 🧘 **휴식 스트레칭 코치** — 집중을 완료하면 자동으로 휴식 모드로 전환, 앉아서 하는 가벼운 스트레칭을 안내하고 음성(ko-KR)으로 읽어줌
- 🎨 **스킨 보관함** — 모닥불 외 벽난로/해변/숲/비/우주/오로라 7가지 테마를 구매 없이 자유롭게 선택, 집중 화면 분위기를 바꿔요
- 🎮 **게이미피케이션** — 레벨/XP/장작(코인), 일일 퀘스트, 배지, 연속 집중(streak) — 집중을 완료할수록 보상 획득
- 🔐 **간단 로그인 + 테스터 모드** — 자체 회원가입/로그인(아이디·비밀번호), 또는 "테스터로 입장"으로 더미 데이터를 바로 체험
- 🤝 **같이 집중** — 친구를 초대 코드로 모아 함께 집중. 각자의 집중 시간이 모여 **공동 목표**를 채우고, 실시간 접속 현황·리더보드·활동 피드로 서로를 응원
- 📝 **한 줄 회고** — 세션 종료 시 음성/텍스트로 회고 기록

## 구조
```
backend/                FastAPI
  main.py               앱 진입점 + 라우터
  session_models.py     집중 세션/통계/주간요약/날짜별 모델
  session_store.py      인메모리 저장 + 통계(streak/heatmap) + 주간요약·날짜별 집계
  routers/
    focus.py            /api/sessions, /api/stats, /api/summary/weekly, /api/breakdown/daily
    items.py, voice.py  범용 CRUD / 음성 캡처 (베이스)
frontend/               React 18 + Vite
  src/hooks/            usePomodoro(타이머), useSpeech(음성), useLocalStorage(설정)
  src/focus/            Campfire, Heatmap, FocusRatio, Sidebar, BreakCoach, breakActivities
  src/views/            CampfireView, JournalView, DailyView, StatsView
  src/design/           디자인 시스템 (16개 컴포넌트) + icons(선 아이콘) · 단순 미니멀 토큰
  src/App.jsx           사이드바 + 뷰 전환
infra/                  Bicep (Azure Container Apps)
azure.yaml              azd 설정 (backend + frontend)
```

## 로컬 실행
```bash
# 백엔드 (터미널 1)
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py                 # http://localhost:8000 (docs: /docs)

# 프론트엔드 (터미널 2)
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

## API
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET  | `/health` | 헬스체크 |
| GET  | `/api/sessions` | 세션 목록 |
| POST | `/api/sessions` | 세션 기록 |
| GET  | `/api/stats` | 오늘 집중/streak/히트맵/집중비율 |
| GET  | `/api/summary/weekly` | 이번 주 집중 요약(총 시간·불 세기·키워드·불씨) |
| GET  | `/api/breakdown/daily` | 최근 날짜별 집중 집계(작업별 분 단위) |
| GET  | `/api/profile` | 내 게이미피케이션 프로필(레벨/XP/코인/배지) |
| POST | `/api/earn` | 세션 완료 시 장작·XP 획득 |
| GET  | `/api/skins` | 스킨 보관함(선택 상태 포함) |
| POST | `/api/skins/{id}/equip` | 스킨 선택(장착) |
| GET  | `/api/quests` | 오늘의 퀘스트 진행도 |
| POST | `/api/auth/register` | 회원가입(아이디·비밀번호·표시이름) |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/teams` | 같이 집중 모임 생성(초대 코드 발급) |
| POST | `/api/teams/join` | 초대 코드로 모임 참여 |
| GET  | `/api/teams/mine` | 내가 속한 모임 목록 |
| GET  | `/api/teams/{id}/summary` | 모임 요약(공동 목표·리더보드·MVP) |
| POST | `/api/teams/{id}/heartbeat` | 집중 중 접속 신호(현재 작업) |
| GET  | `/api/teams/{id}/presence` | 실시간 접속 현황 |
| GET  | `/api/teams/{id}/feed` | 모임 활동 피드 |

## 배포 (Azure Container Apps)
```bash
azd up
```
백엔드·프론트엔드를 각각 컨테이너로 빌드해 Azure Container Apps에 배포합니다.

## 기술 스택
- React 18 + Vite · FastAPI + Pydantic v2 · Python 3.11+
- Azure Container Apps (ACR + Managed Identity)
