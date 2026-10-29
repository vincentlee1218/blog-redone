import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

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
router.post('/', requireAuth, async (req, res) => {
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
      user_id: req.user.id
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// PATCH /api/posts/:id { title, author, content, excerpt }
// Implement the database update here and return the updated post as JSON.
router.patch('/:id', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })
  
  const { title, author, content, excerpt } = req.body ?? {}
  if (![title, author, content].every((v) => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'title, author and content are required' })
  }

  const { data: userdata, error: lookupError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', req.params.id)
    .maybeSingle()
  
  if (lookupError) return res.status(500).json({ error: lookupError.message })
  if (!userdata) return res.status(404).json({ error: "Post not found" })
  if (userdata.user_id > 0 && String(userdata.user_id) !== (req.user.id)) {
    return res.status(403).json({ error: 'You can only edit your own posts' })
  }

  
  const { data, error } = await supabase
    .from('posts')
    .update({
      title: title.trim(),
      author: author.trim(),
      excerpt: excerpt?.trim() || content.trim().slice(0, 140),
      content: content.trim()
    })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .maybeSingle()

  if (error) {
    console.log(error);
    // Check if the error was because no update happened
    if (error.code === "PGRST116") return res.status(404).json({error: "Post not found"})
    return res.status(500).json({ error: error.message })
  }
  if (!data) return res.status(404).json({ error: 'Post not found' })
  res.json(data)
})

// POST /api/posts/:id/vote { value: 1 | -1 | 0 }   (1 = upvote, -1 = downvote, 0 = remove vote)
// Signed-in users only; req.user.id identifies the voter (one vote per user per post).
// TODO: implement voting. The client expects the updated totals back as JSON:
//   { upvotes: number, downvotes: number }
router.post('/:id/vote', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })

  res.status(501).json({ error: 'Voting is not implemented yet' })
})

export default router
