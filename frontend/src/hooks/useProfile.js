import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [skins, setSkins] = useState([])
  const [quests, setQuests] = useState([])

  const refresh = useCallback(async () => {
    const [p, s, q] = await Promise.allSettled([api.profile(), api.skins(), api.quests()])
    if (p.status === 'fulfilled') setProfile(p.value)
    if (s.status === 'fulfilled') setSkins(s.value)
    if (q.status === 'fulfilled') setQuests(q.value)
  }, [])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const earn = useCallback(
    async (minutes, completed) => {
      const result = await api.earn({ minutes, completed })
      await refresh()
      return result
    },
    [refresh],
  )

  const buy = useCallback(async (id) => { await api.buySkin(id); await refresh() }, [refresh])
  const equip = useCallback(async (id) => { await api.equipSkin(id); await refresh() }, [refresh])

  return { profile, skins, quests, refresh, earn, buy, equip }
}
