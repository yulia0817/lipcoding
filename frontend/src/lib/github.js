// GitHub 연동 설정(저장소/토큰) — localStorage 에만 보관(백엔드 영속 저장 안 함).
// 사용자별로 분리: 키에 user_id 를 네임스페이스로 붙여 다른 계정의 repo/토큰이
// 섞이거나 노출되지 않게 합니다.
import { getUserId } from './identity'

const REPO_KEY = 'fc_gh_repo'
const TOKEN_KEY = 'fc_gh_token'
const AUTHOR_KEY = 'fc_gh_author'

function k(base) {
  return `${base}:${getUserId()}`
}

export function getRepo() {
  return localStorage.getItem(k(REPO_KEY)) || ''
}
export function getToken() {
  return localStorage.getItem(k(TOKEN_KEY)) || ''
}
export function getAuthor() {
  return localStorage.getItem(k(AUTHOR_KEY)) || ''
}

export function setGitHubConfig({ repo, token, author }) {
  if (repo !== undefined) localStorage.setItem(k(REPO_KEY), repo.trim())
  if (token !== undefined) localStorage.setItem(k(TOKEN_KEY), token.trim())
  if (author !== undefined) localStorage.setItem(k(AUTHOR_KEY), author.trim())
}

export function clearGitHubConfig() {
  localStorage.removeItem(k(REPO_KEY))
  localStorage.removeItem(k(TOKEN_KEY))
  localStorage.removeItem(k(AUTHOR_KEY))
}

export function isGitHubLinked() {
  return Boolean(getRepo())
}

// 토큰을 화면에 노출할 때 마스킹(앞 4자만).
export function maskToken(token) {
  if (!token) return ''
  return token.slice(0, 4) + '•'.repeat(Math.max(4, token.length - 4))
}
