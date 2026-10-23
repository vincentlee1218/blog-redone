import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const signToken = (user) =>
  jwt.sign({ email: user.email, name: user.name }, process.env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })

const publicUser = ({ id, email, name }) => ({ id, email, name })

function ready(res) {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })
  if (!process.env.JWT_SECRET) return res.status(503).json({ error: 'JWT_SECRET is not configured' })
  return null
}

// POST /api/auth/register { email, name, password }
router.post('/register', async (req, res) => {
  if (ready(res)) return

  const { email, name, password } = req.body ?? {}
  if (![email, name, password].every((v) => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'email, name and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      password_hash: await bcrypt.hash(password, 10),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email already registered' })
    return res.status(500).json({ error: error.message })
  }
  res.status(201).json({ token: signToken(data), user: publicUser(data) })
})

// POST /api/auth/login { email, password }
// TODO: implement login. Steps:
//   1. Call ready(res) and validate that email and password are strings.
//   2. Look up the user in the 'users' table by email.
//        (register stores emails trimmed and lowercased, so do the same here)
//   3. Compare the password to data.password_hash with bcrypt.compare().
//   4. If the user is missing or the password is wrong, return 401 with the same
//      message for both so emails can't be probed.
//   5. On success, res.json({ token: signToken(data), user: publicUser(data) }).
router.post('/login', async (req, res) => {
  if (ready(res)) return
  const { email, password } = req.body ?? {}
  if (![email, password].every((v) => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'login email and password are required' })
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  
  if (error) { res.status(500).json({ error: error.message })}
  if (!data || !(await bcrypt.compare(password, data.password_hash))) {
    res.status(401).json({ error: "Invalid login" })
  }
  res.status(200).json({ token: signToken(data), user: publicUser(data) })
})

// GET /api/auth/me (requires token)
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }))

export default router
