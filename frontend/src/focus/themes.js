// 스킨 id -> 시각 테마. 백엔드 skins_catalog 와 id 가 일치해야 합니다.
// 각 스킨은 고유한 배경 그라데이션 + 파티클 종류 + 시작 인트로 문구를 가집니다.
export const THEMES = {
  campfire: {
    emoji: '🔥', label: '모닥불', accent: '#ff7a18', accent2: '#ffcf5c',
    bg1: '#2a1408', bg2: '#0c0805', particle: 'ember', ground: '#3a2410',
    intro: '불씨를 살려 모닥불을 피웁니다…',
  },
  fireplace: {
    emoji: '🪵', label: '벽난로', accent: '#e8643c', accent2: '#ffb074',
    bg1: '#2a1a14', bg2: '#140d0a', particle: 'ember', ground: '#4a2c1c',
    intro: '벽난로에 장작을 넣고 불을 지핍니다…',
  },
  beach: {
    emoji: '🏖️', label: '해변 모닥불', accent: '#ffb74d', accent2: '#ff8a65',
    bg1: '#1b3a5a', bg2: '#0a1626', particle: 'spark', ground: '#1d2e3f',
    intro: '파도 소리와 함께 해변 불꽃을 피웁니다…',
  },
  forest: {
    emoji: '🌲', label: '숲속 캠프', accent: '#7bc47f', accent2: '#cde66f',
    bg1: '#15301f', bg2: '#08160d', particle: 'firefly', ground: '#10261a',
    intro: '반딧불이 모이는 숲속에 자리를 잡습니다…',
  },
  rainy: {
    emoji: '🌧️', label: '비 오는 밤', accent: '#6db3f2', accent2: '#a7d3ff',
    bg1: '#14202e', bg2: '#080d14', particle: 'rain', ground: '#16222e',
    intro: '빗소리를 들으며 차분히 불을 밝힙니다…',
  },
  space: {
    emoji: '🚀', label: '우주 캠프', accent: '#b388ff', accent2: '#80d8ff',
    bg1: '#140a2a', bg2: '#05030f', particle: 'star', ground: '#0a0820',
    intro: '별빛 사이로 집중의 우주선을 띄웁니다…',
  },
  aurora: {
    emoji: '🌌', label: '오로라', accent: '#64ffda', accent2: '#80d8ff',
    bg1: '#0a1a2a', bg2: '#040b12', particle: 'aurora', ground: '#08131f',
    intro: '오로라가 흐르는 밤하늘 아래 집중합니다…',
  },
}

export function getTheme(skinId) {
  return THEMES[skinId] || THEMES.campfire
}

// 앰비언트 사운드 선택을 씬 위에 덧씌우는 날씨 오버레이로 매핑.
export const AMBIENT_OVERLAY = {
  off: null,
  fire: 'ember',
  rain: 'rain',
  forest: 'firefly',
}
