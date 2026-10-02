const BASE = import.meta.env.VITE_API_URL || ''

async function request(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export const getPosts = () => request('/api/posts')
export const getPost = (id) => request(`/api/posts/${id}`)
