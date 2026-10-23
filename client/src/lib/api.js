import { getToken } from './token.js'

const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...options?.headers, ...(token && { Authorization: `Bearer ${token}` }) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const getPosts = () => request('/api/posts')
export const getPost = (id) => request(`/api/posts/${id}`)
export const updatePost = (id, post) =>
  request(`/api/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
    signal: AbortSignal.timeout(10000),
  })
export const createPost = (post) =>
  request('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  })

const json = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})
// TODO: implement login. POST { email, password } to /api/auth/login using the
// json() helper above. The response is { token, user }.
export const login = async (creds) => request('/api/auth/login', json(creds))
export const register = (data) => request('/api/auth/register', json(data))
export const getMe = () => request('/api/auth/me')
