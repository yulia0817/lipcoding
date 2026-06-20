const KEY = 'fc_uid'

export function getUserId() {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `u-${Date.now()}-${Math.random()}`
    localStorage.setItem(KEY, id)
  }
  return id
}
