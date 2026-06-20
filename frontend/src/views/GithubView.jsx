import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { Button, Card, EmptyState, Input, Stack, useToast } from '../design'
import { IconGit, IconExternal } from '../design/icons'
import {
  getRepo,
  getToken,
  getAuthor,
  setGitHubConfig,
  clearGitHubConfig,
  isGitHubLinked,
  maskToken,
} from '../lib/github'
import './github.css'

// 오늘 00:00 KST 의 ISO(UTC) 문자열
function todayStartKstIso() {
  const now = new Date()
  // KST 기준 날짜 계산
  const kst = new Date(now.getTime() + 9 * 3600 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const d = String(kst.getUTCDate()).padStart(2, '0')
  // 해당 날짜 00:00 KST == 전날 15:00 UTC
  return new Date(`${y}-${m}-${d}T00:00:00+09:00`).toISOString()
}

// 'HH:MM' (KST, 주어진 날짜) -> epoch ms
function entryTime(dateIso, hhmm) {
  return new Date(`${dateIso}T${hhmm}:00+09:00`).getTime()
}

export function GithubView() {
  const { toast } = useToast()
  const [linked, setLinked] = useState(isGitHubLinked())
  const [repo, setRepo] = useState(getRepo())
  const [author, setAuthor] = useState(getAuthor())
  const [token, setToken] = useState(getToken())
  const [editing, setEditing] = useState(!isGitHubLinked())
  const [testing, setTesting] = useState(false)

  const [commits, setCommits] = useState(null)
  const [today, setToday] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleTest() {
    if (!repo.trim()) {
      toast('저장소를 입력하세요 (owner/repo)', { variant: 'info' })
      return
    }
    setTesting(true)
    setGitHubConfig({ repo, author, token })
    try {
      const res = await api.ghTest()
      toast(`연결 성공: ${res.full_name}${res.private ? ' (비공개)' : ''}`, {
        variant: 'success',
      })
      setLinked(true)
      setEditing(false)
      load()
    } catch (e) {
      toast(`${e.message || e}`, { variant: 'error' })
    } finally {
      setTesting(false)
    }
  }

  function handleUnlink() {
    clearGitHubConfig()
    setRepo('')
    setAuthor('')
    setToken('')
    setLinked(false)
    setEditing(true)
    setCommits(null)
    setToday(null)
  }

  async function load() {
    if (!isGitHubLinked()) return
    setLoading(true)
    setError('')
    try {
      const since = todayStartKstIso()
      const [ghRes, days] = await Promise.all([
        api.ghCommits({ since, author: getAuthor() || undefined }),
        api.dailyBreakdown(),
      ])
      setCommits(ghRes.commits)
      // 오늘 날짜의 세션만
      const todayDate = new Date(new Date().getTime() + 9 * 3600 * 1000)
        .toISOString()
        .slice(0, 10)
      const match = (days || []).find((d) => d.date === todayDate)
      setToday(match || null)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (linked) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 세션 엔트리별로 커밋 매칭(시간대 포함)
  const sessionsWithCommits = useMemo(() => {
    if (!today || !commits) return []
    return (today.entries || []).map((e) => {
      const start = entryTime(today.date, e.start)
      const end = entryTime(today.date, e.end)
      const matched = commits.filter((c) => {
        const t = new Date(c.date).getTime()
        return t >= start - 120000 && t <= end + 120000
      })
      return { ...e, commits: matched }
    })
  }, [today, commits])

  const matchedShas = useMemo(() => {
    const s = new Set()
    sessionsWithCommits.forEach((x) => x.commits.forEach((c) => s.add(c.sha)))
    return s
  }, [sessionsWithCommits])

  const otherCommits = useMemo(
    () => (commits || []).filter((c) => !matchedShas.has(c.sha)),
    [commits, matchedShas],
  )

  return (
    <div className="ghv">
      <header className="ghv__head">
        <h2 className="ghv__title">
          <IconGit size={22} /> GitHub 연동
        </h2>
        <p className="ghv__sub">
          오늘 집중한 시간대에 올린 커밋을 자동으로 연결해 보여줘요.
        </p>
      </header>

      <Card className="ghv__config">
        {editing ? (
          <Stack gap={2}>
            <label className="ghv__label">
              저장소 <span>owner/repo 또는 GitHub URL</span>
            </label>
            <Input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="예: yulia0817/lipcoding"
              autoFocus
            />
            <label className="ghv__label">
              작성자 <span>(선택) 내 커밋만 필터링할 GitHub 사용자명</span>
            </label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="예: yulia0817"
            />
            <label className="ghv__label">
              토큰 <span>(선택) 비공개 저장소일 때만 — 브라우저에만 저장</span>
            </label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_… (공개 저장소면 비워두세요)"
              autoComplete="off"
            />
            <Stack row gap={2}>
              <Button onClick={handleTest} disabled={testing}>
                {testing ? '확인 중…' : '연결 테스트 & 저장'}
              </Button>
              {linked && (
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  취소
                </Button>
              )}
            </Stack>
          </Stack>
        ) : (
          <div className="ghv__linked">
            <div className="ghv__linked-info">
              <span className="ghv__badge">
                <IconGit size={15} /> {getRepo()}
              </span>
              {getAuthor() && <span className="ghv__meta">@{getAuthor()}</span>}
              {getToken() && (
                <span className="ghv__meta">토큰 {maskToken(getToken())}</span>
              )}
            </div>
            <Stack row gap={2}>
              <Button variant="secondary" onClick={load} disabled={loading}>
                {loading ? '불러오는 중…' : '새로고침'}
              </Button>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                설정
              </Button>
              <Button variant="danger" onClick={handleUnlink}>
                연결 해제
              </Button>
            </Stack>
          </div>
        )}
      </Card>

      {error && (
        <Card className="ghv__error">
          <p>커밋을 불러오지 못했어요: {error}</p>
        </Card>
      )}

      {linked && !editing && (
        <>
          <section className="ghv__section">
            <h3 className="ghv__h3">오늘 집중 × 커밋</h3>
            {sessionsWithCommits.length === 0 ? (
              <EmptyState
                icon="🪵"
                title="오늘 집중 세션이 아직 없어요"
                description="집중을 끝내면 그 시간대의 커밋이 여기에 연결돼요."
              />
            ) : (
              <Stack gap={2}>
                {sessionsWithCommits.map((s, i) => (
                  <Card key={i} className="ghv__sess">
                    <div className="ghv__sess-head">
                      <span className="ghv__time">
                        {s.start}–{s.end}
                      </span>
                      <span className="ghv__task">{s.task}</span>
                      <span className="ghv__cat">{s.category}</span>
                    </div>
                    {s.commits.length === 0 ? (
                      <p className="ghv__nocommit">이 시간대에 연결된 커밋 없음</p>
                    ) : (
                      <ul className="ghv__commits">
                        {s.commits.map((c) => (
                          <CommitRow key={c.sha} c={c} />
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </Stack>
            )}
          </section>

          <section className="ghv__section">
            <h3 className="ghv__h3">
              오늘 그 외 커밋 {otherCommits.length > 0 && `(${otherCommits.length})`}
            </h3>
            {otherCommits.length === 0 ? (
              <p className="ghv__muted">세션과 매칭되지 않은 커밋이 없어요.</p>
            ) : (
              <Card>
                <ul className="ghv__commits">
                  {otherCommits.map((c) => (
                    <CommitRow key={c.sha} c={c} />
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function CommitRow({ c }) {
  const time = c.date
    ? new Date(c.date).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''
  return (
    <li className="ghv__commit">
      <code className="ghv__sha">{c.short_sha}</code>
      <span className="ghv__msg">{c.message}</span>
      {time && <span className="ghv__ctime">{time}</span>}
      {c.url && (
        <a
          className="ghv__link"
          href={c.url}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub에서 보기"
        >
          <IconExternal size={14} />
        </a>
      )}
    </li>
  )
}
