import { getToken } from './token.js'
import { mockComments } from '../data/mockComments.js'

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

// value: 1 (upvote), -1 (downvote) or 0 (remove vote). Expects { upvotes, downvotes } back.
export const votePost = (id, value) => request(`/api/posts/${id}/vote`, json({ value }))

// ---------------------------------------------------------------------------
// Comments
//
// While USE_MOCK_COMMENTS is true everything below runs against an in-memory copy of
// data/mockComments.js (it resets when you refresh the page) and no request is made.
// After you implement server/src/routes/comments.js, set it to false.
// ---------------------------------------------------------------------------
export const USE_MOCK_COMMENTS = true

let mockStore = [...mockComments]
let mockNextId = 1000
const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// The mock has no server to read the token, so it decodes the JWT payload itself.
function mockCurrentUser() {
  const token = getToken()
  if (!token) throw new Error('Authentication required')
  const { sub, name } = JSON.parse(atob(token.split('.')[1]))
  return { id: sub, name }
}

// Number shown in the badge on a post card. Real mode: the backend adds `comment_count`
// to each post returned by GET /api/posts.
export const commentCountFor = (post) =>
  USE_MOCK_COMMENTS
    ? mockStore.filter((c) => c.post_id === post.id).length
    : post.comment_count ?? 0

// Oldest first.
export async function getComments(postId) {
  if (!USE_MOCK_COMMENTS) return request(`/api/posts/${postId}/comments`)
  await wait()
  return mockStore
    .filter((c) => String(c.post_id) === String(postId))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

// Returns the created comment.
export async function addComment(postId, content) {
  if (!USE_MOCK_COMMENTS) return request(`/api/posts/${postId}/comments`, json({ content }))
  await wait()
  const user = mockCurrentUser()
  if (!content.trim()) throw new Error('Comment cannot be empty')
  const comment = {
    id: mockNextId++,
    post_id: Number(postId),
    user_id: Number(user.id),
    author: user.name,
    content: content.trim(),
    created_at: new Date().toISOString(),
  }
  mockStore = [...mockStore, comment]
  return comment
}

// Returns { ok: true }.
export async function deleteComment(id) {
  if (!USE_MOCK_COMMENTS) return request(`/api/comments/${id}`, { method: 'DELETE' })
  await wait()
  mockStore = mockStore.filter((c) => c.id !== id)
  return { ok: true }
}
