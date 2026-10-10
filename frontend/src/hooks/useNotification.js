import { useCallback, useEffect, useState } from 'react'

// 데스크탑 알림 훅. 세션 종료 시 "집중 완료!" 같은 알림을 띄웁니다.
// - 데스크탑 앱(Tauri): 네이티브 알림(@tauri-apps/plugin-notification).
//   WKWebView 에는 웹 Notification API 가 없어서 웹 방식으로는 알림이 안 뜬다.
// - 브라우저(vite dev): 웹 Notifications API 로 대체.
const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
const webSupported = typeof window !== 'undefined' && 'Notification' in window
const supported = isTauri || webSupported

const loadPlugin = () => import('@tauri-apps/plugin-notification')

export function useNotification() {
  const [permission, setPermission] = useState(() => {
    if (isTauri) return 'default' // 실제 상태는 아래 이펙트에서 확인
    return webSupported ? Notification.permission : 'unsupported'
  })

  // 앱 시작 시 이미 허용돼 있는지 확인해 버튼 상태를 맞춘다.
  useEffect(() => {
    if (!isTauri) return undefined
    let alive = true
    loadPlugin()
      .then(({ isPermissionGranted }) => isPermissionGranted())
      .then((granted) => {
        if (alive && granted) setPermission('granted')
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const request = useCallback(async () => {
    try {
      if (isTauri) {
        const { requestPermission } = await loadPlugin()
        const p = await requestPermission()
        setPermission(p)
        return p
      }
      if (!webSupported) return 'unsupported'
      const p = await Notification.requestPermission()
      setPermission(p)
      return p
    } catch {
      return 'denied'
    }
  }, [])

  const notify = useCallback(async (title, body) => {
    try {
      if (isTauri) {
        const { isPermissionGranted, sendNotification } = await loadPlugin()
        if (await isPermissionGranted()) sendNotification({ title, body })
        return
      }
      if (!webSupported || Notification.permission !== 'granted') return
      const n = new Notification(title, { body, tag: 'focus-campfire', renotify: true })
      setTimeout(() => n.close(), 6000)
    } catch {
      /* 알림 실패는 타이머 동작에 영향 주지 않음 */
    }
  }, [])

  return { supported, permission, request, notify }
}
