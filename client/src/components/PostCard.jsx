import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
  return (
    <article className="post-card">
      <h2><Link to={`/posts/${post.id}`}>{post.title}</Link></h2>
      <p className="meta">{post.author} · {new Date(post.created_at).toLocaleDateString()}</p>
      <p>{post.excerpt}</p>
    </article>
  )
}
