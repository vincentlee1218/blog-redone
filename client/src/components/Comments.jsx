import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getComments, addComment, deleteComment } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate } from '../lib/format.js'

// Comment list + form shown under a post.
export default function Comments({ postId }) {
  const { user } = useAuth()
  const { hash } = useLocation()
  const [comments, setComments] = useState(null) // null = loading
  const [loadError, setLoadError] = useState(null)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    let active = true
    getComments(postId)
      .then((data) => { if (active) setComments(data) })
      .catch((err) => { if (active) setLoadError(err.message) })
    return () => { active = false }
  }, [postId])

  // Arriving from the comment button on the home page (/posts/1#comments): scroll down.
  useEffect(() => {
    if (comments && hash === '#comments') {
      document.getElementById('comments')?.scrollIntoView()
    }
  }, [comments, hash])

  async function handleSubmit(e) {
    e.preventDefault()
    setPosting(true)
    setFormError(null)
    try {
      const comment = await addComment(postId, text)
      setComments((current) => [...current, comment])
      setText('')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteComment(id)
      setComments((current) => current.filter((c) => c.id !== id))
    } catch (err) {
      setFormError(err.message)
    }
  }

  return (
    <section id="comments" className="comments">
      <h2>Comments{comments ? ` (${comments.length})` : ''}</h2>

      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What are your thoughts?"
            rows={3}
            maxLength={2000}
            disabled={posting}
          />
          <button type="submit" className="publish-btn" disabled={posting || !text.trim()}>
            {posting ? 'Posting…' : 'Respond'}
          </button>
        </form>
      ) : (
        <p className="comment-signin"><Link to="/login">Sign in</Link> to join the conversation.</p>
      )}
      {formError && <p className="form-error" role="alert">{formError}</p>}

      {loadError && <p className="form-error">{loadError}</p>}
      {!comments && !loadError && <p className="status">Loading comments…</p>}
      {comments?.length === 0 && <p className="comment-empty">No comments yet. Be the first.</p>}

      <ul className="comment-list">
        {comments?.map((c) => (
          <li key={c.id} className="comment">
            <div className="comment-head">
              <span className="avatar avatar-sm">{c.author[0]}</span>
              <span className="comment-author">{c.author}</span>
              <span className="comment-date">{formatDate(c.created_at)}</span>
              {user && String(user.id) === String(c.user_id) && (
                <button type="button" className="comment-delete" onClick={() => handleDelete(c.id)}>Delete</button>
              )}
            </div>
            <p className="comment-body">{c.content}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
