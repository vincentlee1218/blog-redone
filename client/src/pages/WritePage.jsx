import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPost, uploadImage } from '../lib/api.js'
import ImagePicker from '../components/ImagePicker.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function WritePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', author: user.name, excerpt: '', content: '' })
  const [image, setImage] = useState({ file: null, url: null })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const image_url = image.file ? (await uploadImage(image.file)).url : null
      const post = await createPost({ ...form, image_url })
      navigate(`/posts/${post.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form className="write-form" onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" value={form.title} onChange={update} className="write-title" />
      <input name="author" placeholder="Your name" disabled={true} style={{color: "#888"}} value={form.author} onChange={update} />
      <input name="excerpt" placeholder="Subtitle (optional)" value={form.excerpt} onChange={update} />
      <textarea name="content" placeholder="Tell your story…" value={form.content} onChange={update} rows={14} />
      <ImagePicker image={image} onChange={setImage} disabled={saving} />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={saving} className="publish-btn">
        {saving ? 'Publishing…' : 'Publish'}
      </button>
    </form>
  )
}
