import { Link } from 'react-router-dom'
import VoteButtons from './VoteButtons.jsx'
import { formatDate, readTime } from '../lib/format.js'

export default function PostCard({ post }) {
  return (
    <article className="post-card">
      <div className="post-card-author">
        <span className="avatar avatar-sm">{post.author[0]}</span>
        <span>{post.author}</span>
      </div>
      <Link to={`/posts/${post.id}`} className="post-card-link">
        <h2>{post.title}</h2>
        <p className="post-card-excerpt">{post.excerpt}</p>
      </Link>
      <div className="post-card-meta">
        {formatDate(post.created_at)} · {readTime(post.content)}
      </div>
      <VoteButtons post={post} />
    </article>
  )
}
