// GitHub 연동 설정(저장소/토큰) — localStorage 에만 보관(백엔드 영속 저장 안 함).
const REPO_KEY = 'fc_gh_repo'
const TOKEN_KEY = 'fc_gh_token'
const AUTHOR_KEY = 'fc_gh_author'

export function getRepo() {
  return localStorage.getItem(REPO_KEY) || ''
}
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}
export function getAuthor() {
  return localStorage.getItem(AUTHOR_KEY) || ''
}

export function setGitHubConfig({ repo, token, author }) {
  if (repo !== undefined) localStorage.setItem(REPO_KEY, repo.trim())
  if (token !== undefined) localStorage.setItem(TOKEN_KEY, token.trim())
  if (author !== undefined) localStorage.setItem(AUTHOR_KEY, author.trim())
}

export function clearGitHubConfig() {
  localStorage.removeItem(REPO_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(AUTHOR_KEY)
}

export function isGitHubLinked() {
  return Boolean(getRepo())
}

// 토큰을 화면에 노출할 때 마스킹(앞 4자만).
export function maskToken(token) {
  if (!token) return ''
  return token.slice(0, 4) + '•'.repeat(Math.max(4, token.length - 4))
}
