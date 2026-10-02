import { Router } from 'express'
import { mockPosts } from '../data/mockPosts.js'
// import { supabase } from '../lib/supabase.js'

const router = Router()

// In-memory store: posts are lost when the server restarts.
// TODO: replace with Supabase queries
const posts = [...mockPosts]
let nextId = Math.max(0, ...posts.map((p) => p.id)) + 1

// GET /api/posts (newest first)
router.get('/', (_req, res) => {
  const sorted = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  res.json(sorted)
})

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id))
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

// POST /api/posts  { title, author, content, excerpt? }
router.post('/', (req, res) => {
  const { title, author, content, excerpt } = req.body ?? {}
  if (![title, author, content].every((v) => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'title, author and content are required' })
  }
  const post = {
    id: nextId++,
    title: title.trim(),
    author: author.trim(),
    excerpt: (excerpt?.trim() || content.trim().slice(0, 140)),
    content: content.trim(),
    created_at: new Date().toISOString(),
  }
  posts.push(post)
  res.status(201).json(post)
})

export default router
