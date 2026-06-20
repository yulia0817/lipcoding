import { useCallback, useEffect, useRef, useState } from 'react'

// 앰비언트 사운드 훅. 오디오 파일 없이 Web Audio API로 노이즈를 생성합니다.
// 모닥불(🔥)/빗소리(🌧️)/숲(🌲) 채널을 제공해 집중 분위기를 만들어요.
export const AMBIENT_PRESETS = [
  { id: 'off', label: '🔇 끄기' },
  { id: 'fire', label: '🔥 모닥불' },
  { id: 'rain', label: '🌧️ 빗소리' },
  { id: 'forest', label: '🌲 숲' },
]

function makeNoiseSource(ctx) {
  const size = 2 * ctx.sampleRate
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < size; i++) {
    // 브라운 노이즈: 자연음에 가까운 부드러운 질감
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

// 모닥불 특유의 "탁탁" 튀는 소리를 무작위 간격으로 생성
function startCrackle(ctx, dest) {
  let stopped = false
  function pop() {
    if (stopped) return
    const dur = 0.03 + Math.random() * 0.06
    const len = Math.floor(ctx.sampleRate * dur)
    const b = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
    }
    const s = ctx.createBufferSource()
    s.buffer = b
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 900 + Math.random() * 1800
    const g = ctx.createGain()
    g.gain.value = 0.25 + Math.random() * 0.45
    s.connect(f)
    f.connect(g)
    g.connect(dest)
    s.start()
    setTimeout(pop, 110 + Math.random() * 520)
  }
  pop()
  return () => {
    stopped = true
  }
}

export function useAmbient() {
  const ctxRef = useRef(null)
  const nodesRef = useRef(null)
  const [current, setCurrent] = useState('off')
  const [volume, setVolume] = useState(0.4)

  const stop = useCallback(() => {
    const n = nodesRef.current
    if (n) {
      try {
        n.src.stop()
      } catch {
        /* already stopped */
      }
      n.stopCrackle && n.stopCrackle()
      nodesRef.current = null
    }
  }, [])

  const play = useCallback(
    (kind) => {
      if (!ctxRef.current) {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) return
        ctxRef.current = new Ctx()
      }
      const ctx = ctxRef.current
      ctx.resume && ctx.resume()
      stop()
      if (kind === 'off') {
        setCurrent('off')
        return
      }
      const src = makeNoiseSource(ctx)
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      gain.gain.value = volume
      if (kind === 'fire') {
        filter.type = 'lowpass'
        filter.frequency.value = 480
      } else if (kind === 'rain') {
        filter.type = 'highpass'
        filter.frequency.value = 1200
      } else {
        filter.type = 'bandpass'
        filter.frequency.value = 700
        filter.Q.value = 0.6
      }
      src.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      src.start()
      const stopCrackle = kind === 'fire' ? startCrackle(ctx, gain) : null
      nodesRef.current = { src, gain, stopCrackle }
      setCurrent(kind)
    },
    [stop, volume],
  )

  useEffect(() => {
    if (nodesRef.current) nodesRef.current.gain.gain.value = volume
  }, [volume])

  useEffect(() => () => stop(), [stop])

  return { current, play, volume, setVolume, presets: AMBIENT_PRESETS }
}
