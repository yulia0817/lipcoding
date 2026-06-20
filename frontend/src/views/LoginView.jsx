import { useState } from 'react'
import { api } from '../api'
import { Button, Card, Input, Stack, useToast } from '../design'
import { enterAsTester, setUser } from '../lib/identity'
import { getRepo, setGitHubConfig } from '../lib/github'
import './login.css'

// 자체 간단 로그인: 무거운 OAuth 없이 아이디/비밀번호로 가입·로그인.
// 테스터로 둘러보기를 누르면 저장된 더미 데이터를 바로 확인할 수 있어요.
export function LoginView({ onAuthed }) {
  const { toast } = useToast()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  async function submit(e) {
    e?.preventDefault?.()
    if (busy) return
    if (!username.trim() || !password.trim()) {
      toast('아이디와 비밀번호를 입력하세요', { variant: 'info' })
      return
    }
    setBusy(true)
    try {
      const body = isRegister
        ? { username, password, display_name: displayName.trim() || username }
        : { username, password }
      const res = isRegister ? await api.register(body) : await api.login(body)
      setUser(res.user_id, res.display_name)
      toast(`${res.display_name}님 환영해요!`, { variant: 'success' })
      onAuthed()
    } catch (err) {
      const msg = err?.message?.replace(/^Error:\s*/, '') || ''
      const isDuplicate = err?.status === 400 && /이미 사용/.test(msg)
      if (isDuplicate) {
        toast('이미 사용 중인 아이디예요. 로그인으로 전환할게요.', { variant: 'info' })
        setMode('login')
        setPassword('')
      } else {
        toast(msg || (isRegister ? '가입에 실패했어요' : '로그인에 실패했어요'), {
          variant: 'error',
        })
      }
    } finally {
      setBusy(false)
    }
  }

  function tester() {
    enterAsTester()
    // 데모용: 지금 작업 중인 저장소를 미리 채워 GitHub 연동을 바로 체험하게 합니다.
    if (!getRepo()) {
      setGitHubConfig({ repo: 'yulia0817/lipcoding', author: '' })
    }
    toast('테스터로 입장했어요. 저장된 예시 데이터를 둘러보세요.', { variant: 'info' })
    onAuthed()
  }

  return (
    <div className="login">
      <Card className="login__card">
        <div className="login__brand">
          <span className="login__logo">🔥</span>
          <h1 className="login__title">Focus Scene</h1>
          <p className="login__tagline">집중하면 모닥불이 타오릅니다</p>
        </div>

        <div className="login__tabs">
          <button
            className={`login__tab${!isRegister ? ' is-active' : ''}`}
            onClick={() => setMode('login')}
            type="button"
          >
            로그인
          </button>
          <button
            className={`login__tab${isRegister ? ' is-active' : ''}`}
            onClick={() => setMode('register')}
            type="button"
          >
            회원가입
          </button>
        </div>

        <form onSubmit={submit}>
          <Stack gap={2}>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디 (2자 이상)"
              autoComplete="username"
              autoFocus
            />
            {isRegister && (
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="표시 이름 (선택)"
              />
            )}
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (4자 이상)"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            <Button type="submit" disabled={busy}>
              {busy ? '처리 중…' : isRegister ? '가입하고 시작' : '로그인'}
            </Button>
          </Stack>
        </form>

        <div className="login__divider">
          <span>또는</span>
        </div>

        <Button variant="secondary" onClick={tester} className="login__tester">
          🧪 테스터로 둘러보기 (예시 데이터)
        </Button>
        <p className="login__note">
          테스터 모드는 저장된 예시 집중 기록을 그대로 보여줘요. 가입 없이 기능을
          체험할 수 있어요.
        </p>
      </Card>
    </div>
  )
}
