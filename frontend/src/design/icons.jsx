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
