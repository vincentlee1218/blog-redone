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
