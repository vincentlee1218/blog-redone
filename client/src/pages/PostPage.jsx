import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPost, updatePost } from '../lib/api.js'
import Byline from '../components/Byline.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function PostPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [editable, setEditable] = useState(false)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: '', author: '', excerpt: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    setPost(null)
    setEditable(false)
    setError(null)
    setEditing(false)
    setSaveError(null)
    setSaved(false)
    getPost(id).then((data) => { if (active) { setPost(data); if (user && user.id) setEditable(parseInt(user.id) === data.user_id); } })
      .catch((err) => { if (active) setError(err) })
    return () => { active = false }
  }, [id])

  function startEditing() {
    setForm({ title: post.title, author: post.author, excerpt: post.excerpt || '', content: post.content })
    setSaveError(null)
    setSaved(false)
    setEditing(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updatePost(id, {
        title: form.title.trim(), author: form.author.trim(),
        excerpt: form.excerpt.trim(), content: form.content.trim(),
      })
      if (!updated || String(updated.id) !== String(id)) {
        throw new Error('The server did not return the updated post.')
      }
      setPost(updated)
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setSaveError(err.name === 'TimeoutError'
        ? 'The save request timed out. Please try again once the backend update handler is implemented.'
        : err.message)
    } finally {
      setSaving(false)
    }
  }

  const update = (e) => setForm((current) => ({ ...current, [e.target.name]: e.target.value }))

  if (error) return <p className="status">Post not found. <Link to="/">Back</Link></p>
  if (!post) return <p className="status">Loading…</p>

  return (
    <article className="article">
      {editing ? (
        <form className="write-form" onSubmit={handleSave}>
          <fieldset className="edit-fields" disabled={saving}>
            <label htmlFor="edit-title">Title</label>
            <input id="edit-title" name="title" className="write-title" value={form.title} onChange={update} required autoFocus pattern=".*\S.*" />
            <label htmlFor="edit-author">Author</label>
            <input id="edit-author" name="author" disabled={true} style={{color: "#888"}} value={form.author} onChange={update} required pattern=".*\S.*" />
            <label htmlFor="edit-excerpt">Subtitle (optional)</label>
            <input id="edit-excerpt" name="excerpt" value={form.excerpt} onChange={update} />
            <label htmlFor="edit-content">Content</label>
            <textarea id="edit-content" name="content" value={form.content} onChange={update} rows={14} required />
          </fieldset>
          {saveError && <p className="form-error" role="alert">{saveError}</p>}
          <div className="edit-actions">
            <button type="submit" className="publish-btn" disabled={saving || !form.title.trim() || !form.author.trim() || !form.content.trim()}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="edit-btn" disabled={saving} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
        <div className="article-actions">
          {user ? (
            <button type="button" className="edit-btn" disabled={!editable} onClick={startEditing} aria-label="Edit post" title="Edit post">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m16 3 5 5-12 12-6 1 1-6Z" />
                <path d="m14 5 5 5" />
              </svg>
              Edit
            </button>
          ) : null}
        </div>
        {saved && <p className="save-status" role="status">Post updated.</p>}
        <h1>{post.title}</h1>
        <p className="article-subtitle">{post.excerpt}</p>
        <Byline post={post} />
        <div className="article-body">
          <p>{post.content}</p>
        </div>
          </>
      )}
      <Link to="/" className="back-link">← All stories</Link>
    </article>
  )
}
