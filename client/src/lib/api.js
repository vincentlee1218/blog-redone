const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const getPosts = () => request('/api/posts')
export const getPost = (id) => request(`/api/posts/${id}`)
export const createPost = (post) =>
  request('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post),
  })
