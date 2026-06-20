import { useEffect, useState } from 'react'

// 값을 localStorage(로컬 캐시)에 저장/복원하는 훅.
// 설정처럼 서버에 보낼 필요 없는 데이터를 브라우저에 보관합니다.
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw != null ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 저장 실패(용량/프라이빗 모드 등)는 무시
    }
  }, [key, value])

  return [value, setValue]
}
