// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePomodoro } from './usePomodoro'

// 시계만 옮기고 타이머 틱은 안 돌림 → 창이 숨겨져 setInterval 이 멈췄던 상황 흉내
function passWithoutTicks(ms) {
  act(() => {
    vi.setSystemTime(Date.now() + ms)
  })
}
function tickOnce() {
  act(() => {
    vi.advanceTimersByTime(500)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 10, 9, 0, 0))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('usePomodoro (실제 시계 기준)', () => {
  it('틱이 10분 동안 안 오다가 한 번 와도, 남은 시간은 실제 경과만큼 줄어 있다', () => {
    const { result } = renderHook(() => usePomodoro({ focusMin: 25, breakMin: 5 }))
    act(() => result.current.start())

    passWithoutTicks(10 * 60 * 1000)
    tickOnce()

    expect(result.current.remaining).toBe(15 * 60)
    expect(result.current.running).toBe(true)
  })

  it('창이 다시 보이면(visibilitychange) 틱을 기다리지 않고 바로 맞춘다', () => {
    const { result } = renderHook(() => usePomodoro({ focusMin: 25, breakMin: 5 }))
    act(() => result.current.start())

    passWithoutTicks(5 * 60 * 1000)
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current.remaining).toBe(20 * 60)
  })

  it('일시정지 동안 흐른 시간은 빼지 않고, 재개하면 멈춘 지점부터 이어간다', () => {
    const { result } = renderHook(() => usePomodoro({ focusMin: 25, breakMin: 5 }))
    act(() => result.current.start())
    passWithoutTicks(60 * 1000)
    tickOnce()
    expect(result.current.remaining).toBe(24 * 60)

    act(() => result.current.pause())
    passWithoutTicks(5 * 60 * 1000) // 일시정지 중 5분
    tickOnce()
    expect(result.current.remaining).toBe(24 * 60)

    act(() => result.current.start())
    passWithoutTicks(30 * 1000)
    tickOnce()
    expect(result.current.remaining).toBe(24 * 60 - 30)
  })

  it('시간이 다 되면 멈추고 finished 가 된다(틱이 늦게 와도)', () => {
    const { result } = renderHook(() => usePomodoro({ focusMin: 1, breakMin: 5 }))
    act(() => result.current.start())

    passWithoutTicks(3 * 60 * 1000) // 1분 타이머인데 3분 뒤에야 틱
    tickOnce()

    expect(result.current.remaining).toBe(0)
    expect(result.current.running).toBe(false)
    expect(result.current.finished).toBe(true)
  })

  it('세션 중 집중 시간을 바꾸면 경과 시간 기준으로 남은 시간을 다시 계산한다', () => {
    const { result, rerender } = renderHook((p) => usePomodoro(p), {
      initialProps: { focusMin: 25, breakMin: 5 },
    })
    act(() => result.current.start())
    passWithoutTicks(3 * 1000)
    tickOnce()

    rerender({ focusMin: 45, breakMin: 5 }) // 25분 → 45분, 3초 경과 → 44:57
    tickOnce()

    expect(result.current.remaining).toBe(45 * 60 - 3)
    expect(result.current.totalSec).toBe(45 * 60)
  })
})
