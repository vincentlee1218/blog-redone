import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import postsRouter from './routes/posts.js'

const app = express()
const PORT = process.env.PORT || 3001
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',')

app.use(cors({ origin: origins }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/posts', postsRouter)

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
