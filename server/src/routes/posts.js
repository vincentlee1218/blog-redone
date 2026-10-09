import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

// GET /api/posts (newest first)
router.get('/', async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Post not found' })
  res.json(data)
})

// POST /api/posts  { title, author, content, excerpt? }
router.post('/', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })

  const { title, author, content, excerpt } = req.body ?? {}
  if (![title, author, content].every((v) => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'title, author and content are required' })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: title.trim(),
      author: author.trim(),
      excerpt: excerpt?.trim() || content.trim().slice(0, 140),
      content: content.trim(),
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PATCH /api/posts/:id { title, author, content, excerpt }
// Implement the database update here and return the updated post as JSON.
router.patch('/:id', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })
  
  const { title, author, content, excerpt } = req.body ?? {}
  if (![title, author, content].every((v) => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'title, author and content are required' })
  }
  
  const { data, error } = await supabase
    .from('posts')
    .update({
      title: title.trim(),
      author: author.trim(),
      excerpt: excerpt?.trim() || content.trim().slice(0, 140),
      content: content.trim(),
    })
    .eq('id', req.params.id)
    .select()

  if (error) {
    console.log(error);
    return res.status(500).json({ error: error.message })
  }
  if (!data) return res.status(404).json({ error: 'Post not found' })
  res.json(data)
})

export default router
