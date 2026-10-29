import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { votePost } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const Arrow = ({ down }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={down ? 'M12 5v14M5 12l7 7 7-7' : 'M12 19V5M5 12l7-7 7 7'} />
  </svg>
)

// Expects post.upvotes / post.downvotes and post.my_vote (1, -1 or 0 for the signed-in user).
// Missing values are treated as 0. Signed-out users are sent to the login page.
export default function VoteButtons({ post }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [counts, setCounts] = useState({ up: post.upvotes ?? 0, down: post.downvotes ?? 0 })
  const [myVote, setMyVote] = useState(post.my_vote ?? 0) // 1, -1 or 0
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function cast(value) {
    if (!user) return navigate('/login')
    if (pending) return
    // Clicking your current vote again removes it.
    const next = myVote === value ? 0 : value
    const prev = { counts, myVote }

    // Optimistic update
    setCounts({
      up: counts.up - (myVote === 1 ? 1 : 0) + (next === 1 ? 1 : 0),
      down: counts.down - (myVote === -1 ? 1 : 0) + (next === -1 ? 1 : 0),
    })
    setMyVote(next)
    setPending(true)
    setError(null)

    try {
      const result = await votePost(post.id, next)
      // Server is the source of truth for the totals.
      if (Number.isFinite(result?.upvotes) && Number.isFinite(result?.downvotes)) {
        setCounts({ up: result.upvotes, down: result.downvotes })
      }
    } catch (err) {
      setCounts(prev.counts)
      setMyVote(prev.myVote)
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="votes" role="group" aria-label="Vote on this post">
      <button type="button" className={`vote-btn${myVote === 1 ? ' vote-active-up' : ''}`}
        onClick={() => cast(1)} disabled={pending} aria-pressed={myVote === 1} aria-label="Upvote" title={user ? 'Upvote' : 'Sign in to vote'}>
        <Arrow /> <span>{counts.up}</span>
      </button>
      <button type="button" className={`vote-btn${myVote === -1 ? ' vote-active-down' : ''}`}
        onClick={() => cast(-1)} disabled={pending} aria-pressed={myVote === -1} aria-label="Downvote" title={user ? 'Downvote' : 'Sign in to vote'}>
        <Arrow down /> <span>{counts.down}</span>
      </button>
      {error && <span className="vote-error" role="alert">{error}</span>}
    </div>
  )
}
