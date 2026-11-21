import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

// Mounted at /api in index.js, so the full paths are:
//   GET    /api/posts/:postId/comments   list a post's comments   (public)
//   POST   /api/posts/:postId/comments   add a comment            (signed in)
//   DELETE /api/comments/:id             delete your own comment  (signed in)
//
// Every comment is returned as { id, post_id, user_id, author, content, created_at }.
// `author` is users.name, fetched with a join, it is not a column on `comments`.
const router = Router()

const COMMENT_COLUMNS = 'id, post_id, user_id, content, created_at, users(name)'
const MAX_LENGTH = 2000

// "12" -> 12, anything that isn't a plain integer -> null.
// Checking up front gives a clear 400 instead of a Postgres "invalid input syntax" 500.
const parseId = (value) => (/^\d+$/.test(value) ? Number(value) : null)

// Flattens the joined row { ..., users: { name } } into { ..., author }.
const toComment = ({ users, ...comment }) => ({ ...comment, author: users?.name ?? 'Unknown' })

// GET /api/posts/:postId/comments (oldest first)
router.get('/posts/:postId/comments', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })

  const postId = parseId(req.params.postId)
  if (postId === null) return res.status(400).json({ error: 'Invalid id' })

  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_COLUMNS)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data.map(toComment))
})

// POST /api/posts/:postId/comments  { content }
router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })

  const postId = parseId(req.params.postId)
  if (postId === null) return res.status(400).json({ error: 'Invalid id' })

  const { content } = req.body ?? {}
  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Comment cannot be empty' })
  }
  if (content.trim().length > MAX_LENGTH) {
    return res.status(400).json({ error: `Comment must be ${MAX_LENGTH} characters or fewer` })
  }

  // Without this, commenting on a missing post fails on the foreign key as a vague 500.
  const { data: post, error: lookupError } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .maybeSingle()

  if (lookupError) return res.status(500).json({ error: lookupError.message })
  if (!post) return res.status(404).json({ error: 'Post not found' })

  // user_id comes from the token, never from the request body.
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: req.user.id, content: content.trim() })
    .select(COMMENT_COLUMNS)
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(toComment(data))
})

// DELETE /api/comments/:id  (only the comment's author)
router.delete('/comments/:id', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })

  const id = parseId(req.params.id)
  if (id === null) return res.status(400).json({ error: 'Invalid id' })

  const { data: comment, error: lookupError } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()

  if (lookupError) return res.status(500).json({ error: lookupError.message })
  if (!comment) return res.status(404).json({ error: 'Comment not found' })

  // user_id is a number and req.user.id is a string (it comes from the JWT `sub`).
  if (String(comment.user_id) !== String(req.user.id)) {
    return res.status(403).json({ error: 'You can only delete your own comments' })
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)

  if (error) return res.status(500).json({ error: error.message })
  // JSON body rather than 204: the client's request() helper always calls res.json().
  res.json({ ok: true })
})

export default router
