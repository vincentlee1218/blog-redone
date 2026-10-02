import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import PostPage from './pages/PostPage.jsx'

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">My Blog</Link>
          <nav className="nav">
            <Link to="/">Home</Link>
            <span className="nav-btn">Get started</span>
          </nav>
        </div>
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
