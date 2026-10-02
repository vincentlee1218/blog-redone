import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import PostPage from './pages/PostPage.jsx'
import WritePage from './pages/WritePage.jsx'

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">My Blog</Link>
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/write" className="nav-btn">Write</Link>
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/write" element={<WritePage />} />
        </Routes>
      </main>
    </>
  )
}
