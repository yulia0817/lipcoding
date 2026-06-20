import { useCallback, useRef, useState } from 'react'

// 브라우저 Web Speech API 기반 한국어 음성 입력 훅.
export function useSpeech() {
  const Recognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  const supported = Boolean(Recognition)
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  const start = useCallback(
    (onResult) => {
      if (!supported) return
      const rec = new Recognition()
      rec.lang = 'ko-KR'
      rec.interimResults = false
      rec.maxAlternatives = 1
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript.trim()
        if (text) onResult(text)
      }
      rec.onend = () => setListening(false)
      rec.onerror = () => setListening(false)
      recRef.current = rec
      setListening(true)
      rec.start()
    },
    [Recognition, supported],
  )

  const stop = useCallback(() => {
    recRef.current && recRef.current.stop()
    setListening(false)
  }, [])

  return { supported, listening, start, stop }
}
