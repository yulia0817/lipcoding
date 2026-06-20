// 휴식 시간에 안내할 '앉아서 하는' 가벼운 스트레칭/운동 목록.
// seconds: 권장 시간, desc: 음성 안내(TTS)에도 그대로 사용.
export const BREAK_ACTIVITIES = [
  {
    name: '목 풀기',
    seconds: 30,
    desc: '고개를 천천히 좌우로 기울이며 목 옆을 늘여주세요. 양쪽 각 15초씩.',
  },
  {
    name: '어깨 으쓱',
    seconds: 30,
    desc: '숨을 마시며 어깨를 귀까지 끌어올리고, 내쉬며 툭 떨어뜨리세요. 열 번 반복.',
  },
  {
    name: '등 비틀기',
    seconds: 30,
    desc: '의자에 앉은 채 상체를 한쪽으로 천천히 비틀어 등받이를 잡으세요. 좌우 번갈아.',
  },
  {
    name: '손목 돌리기',
    seconds: 20,
    desc: '양손을 깍지 껴 앞으로 밀고, 손목을 천천히 안팎으로 돌려주세요.',
  },
  {
    name: '발목 펌프',
    seconds: 20,
    desc: '발끝을 위로 당겼다가 아래로 쭉 펴기를 반복해 다리 혈액순환을 깨워요.',
  },
  {
    name: '깊은 호흡',
    seconds: 30,
    desc: '코로 4초 들이마시고, 4초 멈춘 뒤, 6초 동안 천천히 내쉬세요. 다섯 번.',
  },
  {
    name: '눈 휴식',
    seconds: 20,
    desc: '창밖 먼 곳을 20초간 바라보며 눈의 초점 근육을 쉬게 해주세요.',
  },
]

// 매 휴식마다 다른 동작부터 시작하도록 무작위 인덱스를 반환.
export function randomActivityIndex() {
  return Math.floor(Math.random() * BREAK_ACTIVITIES.length)
}
