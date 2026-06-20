const KEY = 'fc_uid'
const NAME_KEY = 'fc_name'
const TESTER_ID = 'tester-demo'

// 익명(게스트) 사용자도 동작하도록 UUID를 자동 발급.
// 로그인하면 setUser()로 서버가 준 user_id 로 교체됩니다.
export function getUserId() {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `u-${Date.now()}-${Math.random()}`
    localStorage.setItem(KEY, id)
  }
  return id
}

export function getDisplayName() {
  return localStorage.getItem(NAME_KEY) || ''
}

// 로그인(또는 테스터 입장) 여부.
export function isLoggedIn() {
  return !!localStorage.getItem(NAME_KEY)
}

export function setUser(userId, displayName) {
  localStorage.setItem(KEY, userId)
  localStorage.setItem(NAME_KEY, displayName)
}

// 테스터로 둘러보기: 고정 계정으로 입장해 저장된 더미 데이터를 바로 확인.
export function enterAsTester() {
  setUser(TESTER_ID, '테스터')
}

export function isTester() {
  return localStorage.getItem(KEY) === TESTER_ID
}

export function clearUser() {
  localStorage.removeItem(KEY)
  localStorage.removeItem(NAME_KEY)
}
