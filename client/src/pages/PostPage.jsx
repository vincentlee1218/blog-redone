import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPost } from '../lib/api.js'
import Byline from '../components/Byline.jsx'

export default function PostPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getPost(id).then(setPost).catch(setError)
  }, [id])

  if (error) return <p className="status">Post not found. <Link to="/">Back</Link></p>
  if (!post) return <p className="status">Loading…</p>

  return (
    <article className="article">
      <h1>{post.title}</h1>
      <p className="article-subtitle">{post.excerpt}</p>
      <Byline post={post} />
      <div className="article-body">
        <p>{post.content}</p>
      </div>
      <Link to="/" className="back-link">← All stories</Link>
    </article>
  )
}
