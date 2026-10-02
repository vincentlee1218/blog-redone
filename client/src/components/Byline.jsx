import { formatDate, readTime } from '../lib/format.js'

export default function Byline({ post }) {
  return (
    <div className="byline">
      <span className="avatar">{post.author[0]}</span>
      <div>
        <div className="byline-name">{post.author}</div>
        <div className="byline-meta">
          {readTime(post.content)} · {formatDate(post.created_at)}
        </div>
      </div>
    </div>
  )
}
