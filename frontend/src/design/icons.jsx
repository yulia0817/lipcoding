// 선(stroke) 아이콘 — currentColor를 상속해 텍스트 색과 함께 움직입니다.
// Feather/Lucide 스타일: fill 없음, 둥근 캡, 얇은 선.
function Svg({ children, size = 20, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

// 캠프파이어 — 불꽃
export function IconFlame(props) {
  return (
    <Svg {...props}>
      <path d="M12 3c0 3-3 4-3 7a3 3 0 0 0 6 0c0-1-.5-2-1-2.5" />
      <path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-3-9-2 2-3 3-3 5" />
    </Svg>
  )
}

// 불씨 저널 — 노트
export function IconBook(props) {
  return (
    <Svg {...props}>
      <path d="M5 4h11a2 2 0 0 1 2 2v14a1 1 0 0 0-1-1H5z" />
      <path d="M5 19a1 1 0 0 0 1 1h12" />
      <path d="M9 8h6M9 12h6" />
    </Svg>
  )
}

// 날짜별 기록 — 달력
export function IconCalendar(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </Svg>
  )
}

// 통계 — 막대 그래프
export function IconChart(props) {
  return (
    <Svg {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Svg>
  )
}

// 집중 시간 — 시계
export function IconClock(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" />
    </Svg>
  )
}

// 휴식 시간 — 컵
export function IconCoffee(props) {
  return (
    <Svg {...props}>
      <path d="M4 9h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
      <path d="M16 10h2a2 2 0 0 1 0 4h-2" />
      <path d="M7 3v2M11 3v2" />
    </Svg>
  )
}

// 활동 분석 — 태그
export function IconTag(props) {
  return (
    <Svg {...props}>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </Svg>
  )
}

// 스킨 보관함 — 팔레트
export function IconPalette(props) {
  return (
    <Svg {...props}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.6-1.4-.3-.4-.5-.8-.5-1.3a1.5 1.5 0 0 1 1.5-1.5H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7z" />
      <circle cx="7.5" cy="10.5" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16.5" cy="10.5" r="1" />
    </Svg>
  )
}

// 음성 입력 — 마이크
export function IconMic(props) {
  return (
    <Svg {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </Svg>
  )
}

// 알림 — 종
export function IconBell(props) {
  return (
    <Svg {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Svg>
  )
}
export function IconBellOff(props) {
  return (
    <Svg {...props}>
      <path d="M8.5 5.5A6 6 0 0 1 18 9c0 3 .8 4.6 1.5 5.5M6 9c0 5-2 6-2 6h11" />
      <path d="M10 20a2 2 0 0 0 4 0" />
      <path d="M3 3l18 18" />
    </Svg>
  )
}

// 소리 켜짐/꺼짐
export function IconVolume(props) {
  return (
    <Svg {...props}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16 9a3 3 0 0 1 0 6M18.5 7a6 6 0 0 1 0 10" />
    </Svg>
  )
}
export function IconVolumeOff(props) {
  return (
    <Svg {...props}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M22 9l-5 6M17 9l5 6" />
    </Svg>
  )
}

// 단축키 — 키보드
export function IconKeyboard(props) {
  return (
    <Svg {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </Svg>
  )
}

// 안내 — 연필
export function IconEdit(props) {
  return (
    <Svg {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  )
}

// 장작/코인 — 더미
export function IconLog(props) {
  return (
    <Svg {...props}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 12l9 4 9-4M3 17l9 4 9-4" />
    </Svg>
  )
}

// 카테고리 — 아령(운동)
export function IconDumbbell(props) {
  return (
    <Svg {...props}>
      <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
    </Svg>
  )
}
// 업무 — 가방
export function IconBriefcase(props) {
  return (
    <Svg {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </Svg>
  )
}
// 독서 — 펼친 책
export function IconBookOpen(props) {
  return (
    <Svg {...props}>
      <path d="M12 6c-2-1.3-4-2-7-2v13c3 0 5 .7 7 2 2-1.3 4-2 7-2V4c-3 0-5 .7-7 2z" />
      <path d="M12 6v13" />
    </Svg>
  )
}
// 취미 — 붓
export function IconBrush(props) {
  return (
    <Svg {...props}>
      <path d="M14 3l7 7-7 4-4-4z" />
      <path d="M10 10c-3 1-4 3-4 6-2 0-3 1-3 3 3 0 6-1 7-3 2-1 3-3 3-5" />
    </Svg>
  )
}
// 기타 — 별
export function IconSparkle(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
    </Svg>
  )
}
// 빗소리 — 비구름
export function IconRain(props) {
  return (
    <Svg {...props}>
      <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 9.6 1.5A3.5 3.5 0 0 1 16 15z" />
      <path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" />
    </Svg>
  )
}
// 숲 — 나무
export function IconTree(props) {
  return (
    <Svg {...props}>
      <path d="M12 3l5 7h-3l4 6H6l4-6H7z" />
      <path d="M12 16v5" />
    </Svg>
  )
}
// 축소/전체화면
export function IconMinimize(props) {
  return (
    <Svg {...props}>
      <path d="M9 4v4a1 1 0 0 1-1 1H4M20 9h-4a1 1 0 0 1-1-1V4M15 20v-4a1 1 0 0 1 1-1h4M4 15h4a1 1 0 0 1 1 1v4" />
    </Svg>
  )
}
export function IconMaximize(props) {
  return (
    <Svg {...props}>
      <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" />
    </Svg>
  )
}
// 도움말
export function IconHelp(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5M12 17h.01" />
    </Svg>
  )
}
// 더하기/빼기
export function IconPlus(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}
export function IconMinus(props) {
  return (
    <Svg {...props}>
      <path d="M5 12h14" />
    </Svg>
  )
}
export function IconUsers(props) {
  return (
    <Svg {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  )
}
