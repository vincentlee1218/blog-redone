import { useState } from 'react'
import { votePost } from '../lib/api.js'

const myVoteKey = (id) => `vote:${id}`

// Remembered per browser until votes are tied to signed-in users.
function loadMyVote(id) {
  try {
    return Number(localStorage.getItem(myVoteKey(id))) || 0
  } catch {
    return 0
  }
}

function saveMyVote(id, value) {
  try {
    if (value) localStorage.setItem(myVoteKey(id), String(value))
    else localStorage.removeItem(myVoteKey(id))
  } catch {}
}

const Arrow = ({ down }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={down ? 'M12 5v14M5 12l7 7 7-7' : 'M12 19V5M5 12l7-7 7 7'} />
  </svg>
)

// Expects post.upvotes / post.downvotes (missing counts are treated as 0).
export default function VoteButtons({ post }) {
  const [counts, setCounts] = useState({ up: post.upvotes ?? 0, down: post.downvotes ?? 0 })
  const [myVote, setMyVote] = useState(() => loadMyVote(post.id)) // 1, -1 or 0
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function cast(value) {
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
      saveMyVote(post.id, next)
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
        onClick={() => cast(1)} disabled={pending} aria-pressed={myVote === 1} aria-label="Upvote" title="Upvote">
        <Arrow /> <span>{counts.up}</span>
      </button>
      <button type="button" className={`vote-btn${myVote === -1 ? ' vote-active-down' : ''}`}
        onClick={() => cast(-1)} disabled={pending} aria-pressed={myVote === -1} aria-label="Downvote" title="Downvote">
        <Arrow down /> <span>{counts.down}</span>
      </button>
      {error && <span className="vote-error" role="alert">{error}</span>}
    </div>
  )
}
