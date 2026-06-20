// 스킨 id -> 시각 테마. 백엔드 skins_catalog 와 id 가 일치해야 합니다.
export const THEMES = {
  campfire: { emoji: '🔥', label: '모닥불', accent: '#ff7a18', bg: '#1a1410', particle: '✨' },
  fireplace: { emoji: '🪵', label: '벽난로', accent: '#e8643c', bg: '#221814', particle: '🔥' },
  beach: { emoji: '🏖️', label: '해변 모닥불', accent: '#ffb74d', bg: '#10243a', particle: '🌊' },
  forest: { emoji: '🌲', label: '숲속 캠프', accent: '#7bc47f', bg: '#0f1f16', particle: '🍃' },
  rainy: { emoji: '🌧️', label: '비 오는 밤', accent: '#6db3f2', bg: '#0e1622', particle: '💧' },
  space: { emoji: '🚀', label: '우주 캠프', accent: '#b388ff', bg: '#0a0a1a', particle: '⭐' },
  aurora: { emoji: '🌌', label: '오로라', accent: '#64ffda', bg: '#08131a', particle: '✦' },
}

export function getTheme(skinId) {
  return THEMES[skinId] || THEMES.campfire
}
