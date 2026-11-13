import { Link } from 'react-router-dom'
import { commentCountFor } from '../lib/api.js'

// Speech-bubble button with a count badge. Links to the comments under the post.
export default function CommentButton({ post }) {
  const count = commentCountFor(post)

  return (
    <Link
      to={`/posts/${post.id}#comments`}
      className="comment-btn"
      aria-label={`${count} ${count === 1 ? 'comment' : 'comments'}`}
      title="View comments"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20l1.1-5.1A8.5 8.5 0 1 1 21 11.5Z" />
      </svg>
      {count > 0 && <span className="comment-badge">{count}</span>}
    </Link>
  )
}
