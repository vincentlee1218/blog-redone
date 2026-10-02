import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPost } from '../lib/api.js'

export default function PostPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getPost(id).then(setPost).catch(setError)
  }, [id])

  if (error) return <p>Post not found. <Link to="/">Back</Link></p>
  if (!post) return <p>Loading…</p>

  return (
    <article>
      <Link to="/">← Back</Link>
      <h1>{post.title}</h1>
      <p className="meta">{post.author} · {new Date(post.created_at).toLocaleDateString()}</p>
      <p>{post.content}</p>
    </article>
  )
}
