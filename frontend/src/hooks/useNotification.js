import { useCallback, useState } from 'react'

// 브라우저 데스크탑 알림(Web Notifications API) 훅.
// 세션 종료 시 "장작이 추가됐어요" 같은 캠프파이어 알림을 띄웁니다.
const supported = typeof window !== 'undefined' && 'Notification' in window

export function useNotification() {
  const [permission, setPermission] = useState(
    supported ? Notification.permission : 'unsupported',
  )

  const request = useCallback(async () => {
    if (!supported) return 'unsupported'
    try {
      const p = await Notification.requestPermission()
      setPermission(p)
      return p
    } catch {
      return 'denied'
    }
  }, [])

  const notify = useCallback((title, body) => {
    if (!supported || Notification.permission !== 'granted') return
    try {
      const n = new Notification(title, { body, tag: 'focus-campfire', renotify: true })
      setTimeout(() => n.close(), 6000)
    } catch {
      /* 일부 브라우저는 ServiceWorker 없이는 Notification 생성을 막습니다 */
    }
  }, [])

  return { supported, permission, request, notify }
}
