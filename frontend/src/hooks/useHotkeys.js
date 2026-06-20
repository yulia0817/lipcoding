import { useEffect, useRef } from 'react'

// 전역 키보드 단축키 훅. 입력창에 포커스가 있을 때는 무시합니다.
// Space=시작/일시정지, R=리셋, S=건너뛰기
export function useHotkeys(handlers) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    function onKey(e) {
      const t = e.target
      const tag = t && t.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (e.code === 'Space' || key === ' ') {
        e.preventDefault()
        ref.current.toggle && ref.current.toggle()
      } else if (key === 'r') {
        ref.current.reset && ref.current.reset()
      } else if (key === 's') {
        ref.current.skip && ref.current.skip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
