import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import postsRouter from './routes/posts.js'
import authRouter from './routes/auth.js'
import { checkDb } from './lib/supabase.js'

const app = express()
const PORT = process.env.PORT || 3001
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')

app.use(cors({ origin: origins }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
// Verifies the server can reach Supabase and read the posts table.
app.get('/db', async (_req, res) => {
  const { status, ...body } = await checkDb()
  res.status(status).json(body)
})

app.use('/api/auth', authRouter)
app.use('/api/posts', postsRouter)

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`)

  const { status, ok, ...info } = await checkDb()
  if (ok) {
    console.log('✅ Supabase connected successfully')
    console.log(`   URL:        ${info.supabaseUrl}`)
    console.log(`   Table:      ${info.table} (${info.postCount} rows)`)
    console.log(`   Latency:    ${info.latencyMs}ms`)
  } else {
    console.error('❌ Supabase connection failed')
    if (info.supabaseUrl) console.error(`   URL:        ${info.supabaseUrl}`)
    console.error(`   Error:      ${info.error}`)
    if (info.hint) console.error(`   Hint:       ${info.hint}`)
  }
})
