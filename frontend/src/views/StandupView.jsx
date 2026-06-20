import { useEffect, useState } from 'react'
import { api } from '../api'
import { Button, Card, EmptyState, Stack, useToast } from '../design'
import { IconClipboard, IconCopy, IconGit } from '../design/icons'
import { isGitHubLinked, getRepo } from '../lib/github'
import './standup.css'

export function StandupView() {
  const { toast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await api.standup()
      setData(res)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCopy() {
    if (!data?.text) return
    try {
      await navigator.clipboard.writeText(data.text)
      toast('스탠드업을 복사했어요', { variant: 'success' })
    } catch {
      toast('복사에 실패했어요', { variant: 'error' })
    }
  }

  const linked = isGitHubLinked()

  return (
    <div className="stv">
      <header className="stv__head">
        <h2 className="stv__title">
          <IconClipboard size={22} /> AI 스탠드업
        </h2>
        <p className="stv__sub">
          어제·오늘 집중 기록과 커밋을 모아 데일리 스탠드업을 자동으로 만들어요.
        </p>
      </header>

      <Card className="stv__bar">
        <div className="stv__bar-info">
          {linked ? (
            <span className="stv__badge">
              <IconGit size={15} /> {getRepo()}
            </span>
          ) : (
            <span className="stv__meta">
              GitHub 미연동 — 집중 기록만으로 생성돼요
            </span>
          )}
          {data?.source && (
            <span className={`stv__src stv__src--${data.source}`}>
              {data.source === 'ai' ? 'AI 생성' : '템플릿 생성'}
            </span>
          )}
        </div>
        <Stack row gap={2}>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? '생성 중…' : '다시 생성'}
          </Button>
          <Button onClick={handleCopy} disabled={!data?.text}>
            <IconCopy size={16} /> 복사
          </Button>
        </Stack>
      </Card>

      {data?.gh_error && (
        <Card className="stv__warn">
          <p>커밋을 불러오지 못했어요: {data.gh_error} (집중 기록만으로 생성했어요)</p>
        </Card>
      )}

      {error ? (
        <Card className="stv__error">
          <p>스탠드업을 만들지 못했어요: {error}</p>
        </Card>
      ) : loading && !data ? (
        <Card className="stv__loading">
          <p>스탠드업을 생성하는 중…</p>
        </Card>
      ) : data?.text ? (
        <Card className="stv__report">
          <pre className="stv__pre">{data.text}</pre>
        </Card>
      ) : (
        <EmptyState
          icon="📋"
          title="아직 만들 기록이 없어요"
          description="집중 타이머로 세션을 쌓으면 스탠드업이 채워져요."
        />
      )}
    </div>
  )
}
