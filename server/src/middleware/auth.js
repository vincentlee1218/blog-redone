import jwt from 'jsonwebtoken'

// Requires "Authorization: Bearer <token>". Sets req.user = { id, email, name }.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Authentication required' })

  try {
    const { sub, email, name } = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: sub, email, name }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Like requireAuth, but never rejects. Used on public routes (e.g. GET /api/posts) that
// can show extra info for a signed-in user, such as which posts they have voted on.
//
// TODO: implement. Steps:
//   1. Read the token from the Authorization header exactly like requireAuth does.
//   2. If there is NO token, just call next(). req.user stays undefined, which is how
//      the route knows the visitor is signed out.
//   3. If there IS a token, verify it with jwt.verify() in a try/catch. On success set
//      req.user = { id: sub, email, name }. On failure (expired/forged token) ignore it
//      and carry on as signed out. Do not return 401 here, that is requireAuth's job.
//   4. Call next() in every case so the request always continues.
//
// Until implemented this is a no-op, so req.user is never set.
export function optionalAuth(req, res, next) {
  next()
}
