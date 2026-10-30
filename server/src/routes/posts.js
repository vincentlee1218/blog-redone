import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/posts (newest first)
//
// TODO (votes): each post in the response also needs vote info for the frontend:
//   upvotes, downvotes  - totals from the post_vote_counts view
//   my_vote             - 1, -1 or 0: what the signed-in user (req.user) voted, 0 if
//                         signed out or not voted
// optionalAuth runs first so req.user is set when a valid token is sent, and left
// undefined otherwise. Suggested approach (3 queries, no joins needed):
//   1. Keep the existing query that fetches the posts.
//   2. Fetch the counts for those posts in one go:
//        supabase.from('post_vote_counts').select('*').in('post_id', ids)
//      where ids = data.map((p) => p.id). Posts with no votes have NO row in the view,
//      so default them to 0 instead of assuming a row exists.
//   3. If req.user exists, fetch their votes in one go:
//        supabase.from('votes').select('post_id, value')
//          .eq('user_id', req.user.id).in('post_id', ids)
//   4. Turn each result into a Map keyed by post_id (new Map(rows.map(...))) so merging
//      is a fast lookup, then return data.map((p) => ({ ...p, upvotes, downvotes, my_vote })).
//      Counts from the view can come back as strings or numbers, so wrap in Number().
router.get('/', optionalAuth, async (_req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/posts/:id
//
// TODO (votes): same extra fields as the list route (upvotes, downvotes, my_vote), but
// for a single post, so use .eq('post_id', id).maybeSingle() on the view and the votes
// table. A post with no votes has no view row (data is null), so default to 0.
// Consider moving the "attach vote info" logic into one helper that both GET routes
// call, so you only write it once.
router.get('/:id', optionalAuth, async (req, res) => {
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
// Signed-in users only; requireAuth sets req.user, so req.user.id is the voter.
// One vote per user per post is enforced by the unique (post_id, user_id) constraint on
// the votes table, so there is at most one row for any user/post pair.
// The client expects the updated totals back as JSON: { upvotes: number, downvotes: number }
//
// TODO: implement. Steps:
//   1. Validate the body. value must be exactly 1, -1 or 0 (a number, not a string).
//      Anything else -> 400. Never trust the client: a value like 5 would be rejected by
//      the table's CHECK constraint anyway, but a clear 400 is a better response than a
//      raw database error.
//   2. Check the post exists: select 'id' from posts where id = req.params.id with
//      .maybeSingle(). If lookup errors -> 500, if null -> 404. Without this, voting on a
//      missing post would fail on the foreign key and surface as a confusing 500.
//   3. Write the vote:
//        - value === 0: delete the user's row.
//            supabase.from('votes').delete().eq('post_id', id).eq('user_id', req.user.id)
//          Deleting a row that doesn't exist is fine, it just matches nothing.
//        - otherwise: upsert so voting again CHANGES the existing row instead of failing
//          on the unique constraint.
//            supabase.from('votes')
//              .upsert({ post_id: id, user_id: req.user.id, value },
//                      { onConflict: 'post_id,user_id' })
//      Check `error` after the call and return 500 with error.message if set.
//   4. Read the fresh totals from the post_vote_counts view for this post_id with
//      .maybeSingle(). If data is null the post has no votes left (e.g. you just removed
//      the only one), so use 0 for both numbers.
//   5. res.json({ upvotes: Number(...), downvotes: Number(...) }).
//
// Things to think about once it works:
//   - Steps 3 and 4 are separate queries, so two simultaneous votes could read slightly
//     stale totals. Fine for a blog; a Postgres function (rpc) would make it atomic.
//   - req.params.id is a string. Supabase coerces it for bigint columns, but you may want
//     to validate it's numeric first.
router.post('/:id/vote', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })

  res.status(501).json({ error: 'Voting is not implemented yet' })
})

export default router
