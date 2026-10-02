import { useEffect, useState } from 'react'
import { getPosts } from '../lib/api.js'
import PostCard from '../components/PostCard.jsx'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPosts()
      .then(setPosts)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="status">Loading…</p>
  if (error) return <p className="status">Something went wrong: {error.message}</p>

  return (
    <section>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
    </section>
  )
}
