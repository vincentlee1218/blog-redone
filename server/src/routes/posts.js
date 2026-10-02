import { Router } from 'express'
import { mockPosts } from '../data/mockPosts.js'
// import { supabase } from '../lib/supabase.js'

const router = Router()

// GET /api/posts
router.get('/', (_req, res) => {
  // TODO: replace mock data with a Supabase query
  res.json(mockPosts)
})

// GET /api/posts/:id
router.get('/:id', (req, res) => {
  // TODO: replace mock data with a Supabase query
  const post = mockPosts.find((p) => p.id === Number(req.params.id))
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

export default router
