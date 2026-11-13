import { Router } from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

// Mounted at /api in index.js, so the full paths are:
//   GET    /api/posts/:postId/comments   list a post's comments   (public)
//   POST   /api/posts/:postId/comments   add a comment            (signed in)
//   DELETE /api/comments/:id             delete your own comment  (signed in)
//
// BEFORE YOU START
//   1. Run server/schema/schema_2.sql in the Supabase SQL editor. It creates the
//      `comments` table and the `post_comment_counts` view.
//   2. Every comment the frontend receives must look like this:
//        { id, post_id, user_id, author, content, created_at }
//      `author` is the commenter's name. It is NOT a column on `comments`, you get it by
//      joining the users table (see the GET route).
//   3. Until these handlers are done they return 501. When all three work, set
//      USE_MOCK_COMMENTS = false in client/src/lib/api.js to stop using mock data.
//   4. Also do the comment_count TODO above withVotes() in routes/posts.js, otherwise the
//      badge on the home page stays at 0.

const router = Router()

// Shared by the routes below: turns "/:postId" into a number, or null if it isn't one.
// TODO: implement.
//   - Return Number(value) when value matches /^\d+$/, otherwise return null.
//   - Callers send 400 'Invalid id' when this returns null. Checking up front gives the
//     client a clear 400 instead of a raw Postgres "invalid input syntax for bigint" 500.
function parseId(value) {
  return null
}

// Shared by GET and POST: reshapes a row fetched with the users join into the response shape.
// TODO: implement.
//   - The join in the queries below is `.select('id, post_id, user_id, content, created_at, users(name)')`.
//     Supabase returns the joined row NESTED, like:
//        { id: 5, post_id: 1, user_id: 7, content: 'hi', created_at: '...', users: { name: 'Sam' } }
//   - Return a flat object: { id, post_id, user_id, author: row.users.name, content, created_at }
//     (do not leak the nested `users` key to the client).
//   - Be careful: `users` is the joined table's name in the select string, and it is also
//     the key you read it back from. If you alias it (author:users(name)) the key becomes `author`.
function toComment(row) {
  return null
}

// ---------------------------------------------------------------------------
// GET /api/posts/:postId/comments
// Returns an array of comments for the post, OLDEST FIRST. Public: no token needed.
//
// TODO: implement. Steps:
//   1. If `supabase` is null, return 503 { error: 'Supabase is not configured' } (same
//      as every other route).
//   2. postId = parseId(req.params.postId). If null -> 400 { error: 'Invalid id' }.
//   3. Fetch the comments:
//        const { data, error } = await supabase
//          .from('comments')
//          .select('id, post_id, user_id, content, created_at, users(name)')
//          .eq('post_id', postId)
//          .order('created_at', { ascending: true })
//      `users(name)` works because comments.user_id is a foreign key to users.id. You get
//      the commenter's name without a second query. Never select `password_hash`, and note
//      that `users(name)` only returns the name, which keeps it out of the response.
//   4. If `error` -> 500 { error: error.message }.
//   5. Reply with res.json(data.map(toComment)).
//
// You do NOT need to check that the post exists here. A post with no comments (or a
// post id that doesn't exist) just returns []. If you want a 404 for a missing post,
// look it up in `posts` first like the vote route does, but it isn't required.
router.get('/posts/:postId/comments', async (req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

// ---------------------------------------------------------------------------
// POST /api/posts/:postId/comments   body: { content }
// Adds a comment from the signed-in user and returns the NEW comment with 201.
//
// requireAuth runs first, so by the time your code runs req.user is set:
//   req.user.id is the user's id as a STRING (it comes from the JWT `sub`), and
//   req.user.name is their name.
//
// TODO: implement. Steps:
//   1. 503 if `supabase` is null.
//   2. postId = parseId(req.params.postId). If null -> 400 { error: 'Invalid id' }.
//   3. Validate the body. `const { content } = req.body ?? {}`. It must be a string that is
//      not empty after .trim(). Otherwise -> 400 { error: 'Comment cannot be empty' }.
//      Also reject content.trim().length > 2000 with a 400 (the table has a CHECK for
//      this too, but a clear 400 beats a database error).
//   4. Make sure the post exists, or the insert fails on the foreign key with a confusing
//      500. Query it the same way the vote route does:
//        const { data: post, error: lookupError } = await supabase
//          .from('posts').select('id').eq('id', postId).maybeSingle()
//      lookupError -> 500, `!post` -> 404 { error: 'Post not found' }.
//   5. Insert and read the row back, joining the name so the response is complete:
//        const { data, error } = await supabase
//          .from('comments')
//          .insert({ post_id: postId, user_id: req.user.id, content: content.trim() })
//          .select('id, post_id, user_id, content, created_at, users(name)')
//          .single()
//      Take user_id from req.user.id and NEVER from the request body. If the client could
//      send it, anyone could post as someone else.
//   6. error -> 500 { error: error.message }.
//   7. res.status(201).json(toComment(data)).
router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

// ---------------------------------------------------------------------------
// DELETE /api/comments/:id
// Deletes a comment, but ONLY if it belongs to the signed-in user. Returns { ok: true }.
//
// TODO: implement. Steps:
//   1. 503 if `supabase` is null.
//   2. id = parseId(req.params.id). If null -> 400 { error: 'Invalid id' }.
//   3. Look the comment up first so you can tell "missing" from "not yours":
//        const { data: comment, error: lookupError } = await supabase
//          .from('comments').select('user_id').eq('id', id).maybeSingle()
//      lookupError -> 500. `!comment` -> 404 { error: 'Comment not found' }.
//   4. Compare owners. comment.user_id is a NUMBER and req.user.id is a STRING, so
//      compare String(comment.user_id) !== String(req.user.id) (a plain !== would always
//      be true and nobody could delete anything). If they differ -> 403
//      { error: 'You can only delete your own comments' }.
//   5. Delete, and filter on user_id again as a safety net (same pattern as the PATCH
//      route in posts.js):
//        const { error } = await supabase
//          .from('comments').delete().eq('id', id).eq('user_id', req.user.id)
//      error -> 500 { error: error.message }.
//   6. Reply with res.json({ ok: true }). Do NOT use res.status(204).send() here: the
//      client's request() helper in api.js always calls res.json(), which throws on an
//      empty body.
router.delete('/comments/:id', requireAuth, async (req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

export default router
