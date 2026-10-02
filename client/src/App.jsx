import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import PostPage from './pages/PostPage.jsx'

export default function App() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">My Blog</Link>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/posts/:id" element={<PostPage />} />
        </Routes>
      </main>
    </>
  )
}
