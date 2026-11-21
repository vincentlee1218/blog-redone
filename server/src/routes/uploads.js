import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { supabase, IMAGE_BUCKET } from '../lib/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const MAX_BYTES = 5 * 1024 * 1024

// Keep the upload in memory (max 5 MB) and send it straight on to Supabase Storage.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } })

// The type the client claims (Content-Type / file name) can't be trusted, so read it from
// the file's first bytes. Anything that isn't one of these four is rejected (SVG is left
// out on purpose, it can carry scripts).
function sniffImageType(buf) {
  const startsWith = (...bytes) => bytes.every((b, i) => buf[i] === b)
  if (startsWith(0xff, 0xd8, 0xff)) return { type: 'image/jpeg', ext: 'jpg' }
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { type: 'image/png', ext: 'png' }
  if (buf.toString('ascii', 0, 4) === 'GIF8') return { type: 'image/gif', ext: 'gif' }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { type: 'image/webp', ext: 'webp' }
  }
  return null
}

// Runs multer and turns its errors into clean JSON responses.
const parseImage = (req, res, next) =>
  upload.single('image')(req, res, (err) => {
    if (!err) return next()
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image must be 5 MB or smaller' })
    }
    res.status(400).json({ error: err.message })
  })

// POST /api/uploads  multipart/form-data with one file in the field "image"
// Returns { url }: send that as `image_url` when creating or editing a post.
router.post('/', requireAuth, parseImage, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured' })
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' })

  const kind = sniffImageType(req.file.buffer)
  if (!kind) return res.status(400).json({ error: 'Image must be a JPEG, PNG, GIF or WebP' })

  // Random name (never the original file name), grouped by uploader.
  const path = `${req.user.id}/${randomUUID()}.${kind.ext}`
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, req.file.buffer, { contentType: kind.type })

  if (error) return res.status(500).json({ error: error.message })

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)
  res.status(201).json({ url: data.publicUrl })
})

export default router
