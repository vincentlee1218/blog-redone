// Mock comments, same shape the backend will return:
//   { id, post_id, user_id, author, content, created_at }
// `author` is the commenter's users.name (the backend gets it by joining the users table).
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

export const mockComments = [
  { id: 1, post_id: 1, user_id: 101, author: 'Priya Nair', content: 'This was a great read. The part about keeping things simple really resonated.', created_at: daysAgo(3) },
  { id: 2, post_id: 1, user_id: 102, author: 'Marcus Lee', content: 'Agreed with most of this, though I would push back a little on the second point.\n\nStill, thanks for writing it up!', created_at: daysAgo(2) },
  { id: 3, post_id: 1, user_id: 103, author: 'Sofia Alvarez', content: 'Bookmarked for later.', created_at: daysAgo(1) },
  { id: 4, post_id: 2, user_id: 102, author: 'Marcus Lee', content: 'Do you have a follow-up planned?', created_at: daysAgo(4) },
  { id: 5, post_id: 2, user_id: 104, author: 'Jun Tanaka', content: 'Love the examples. Super clear.', created_at: daysAgo(0.5) },
]
