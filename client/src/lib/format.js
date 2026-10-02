export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const readTime = (text = '') =>
  `${Math.max(1, Math.round(text.split(/\s+/).length / 200))} min read`
