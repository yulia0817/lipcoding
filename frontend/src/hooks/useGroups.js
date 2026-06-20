import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'

// 같이 집중: 내 모임 목록 + 선택된 모임의 요약/접속/피드 폴링.
export function useGroups() {
  const [groups, setGroups] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [presence, setPresence] = useState([])
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef(null)

  const loadMine = useCallback(async () => {
    setLoading(true)
    try {
      const mine = await api.myGroups()
      setGroups(mine)
      setActiveId((cur) => cur || (mine[0] && mine[0].id) || null)
    } catch {
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMine()
  }, [loadMine])

  const refreshActive = useCallback(async (id) => {
    const gid = id || activeId
    if (!gid) return
    try {
      const [s, p, f] = await Promise.allSettled([
        api.groupSummary(gid),
        api.groupPresence(gid),
        api.groupFeed(gid),
      ])
      if (s.status === 'fulfilled') setSummary(s.value)
      if (p.status === 'fulfilled') setPresence(p.value)
      if (f.status === 'fulfilled') setFeed(f.value)
    } catch {
      /* 무시 */
    }
  }, [activeId])

  // 5초 폴링 (탭 숨김 시 중지)
  useEffect(() => {
    if (!activeId) return undefined
    refreshActive(activeId)
    function tick() {
      if (document.visibilityState === 'visible') refreshActive(activeId)
    }
    pollRef.current = setInterval(tick, 5000)
    return () => clearInterval(pollRef.current)
  }, [activeId, refreshActive])

  const create = useCallback(async (name) => {
    const g = await api.createGroup(name)
    await loadMine()
    setActiveId(g.id)
    return g
  }, [loadMine])

  const join = useCallback(async (code) => {
    const g = await api.joinGroup(code)
    await loadMine()
    setActiveId(g.id)
    return g
  }, [loadMine])

  return {
    groups,
    activeId,
    setActiveId,
    summary,
    presence,
    feed,
    loading,
    create,
    join,
    refreshActive,
  }
}
