// Tauri 트레이 브리지. Tauri 없으면(브라우저) 전부 no-op 이라 동일 코드로 동작.
function hasTauri() {
  return typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__
}

export async function pushTrayTitle(text) {
  if (!hasTauri()) return
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('set_tray_title', { title: text })
  } catch {
    /* ignore */
  }
}

// handler('start'|'pause'|'stop') 를 트레이 메뉴 이벤트에 연결. unlisten 함수 반환.
export async function onTrayAction(handler) {
  if (!hasTauri()) return () => {}
  const { listen } = await import('@tauri-apps/api/event')
  const unlisten = await listen('tray-action', (e) => handler(e.payload))
  return unlisten
}
