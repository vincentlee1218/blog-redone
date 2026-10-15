import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import PostPage from './pages/PostPage.jsx'
import WritePage from './pages/WritePage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import { useAuth } from './context/AuthContext.jsx'

export default function App() {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand">My Blog</Link>
          <nav className="nav">
            <Link to="/">Home</Link>
            {user ? (
              <>
                <Link to="/write" className="nav-btn">Write</Link>
                <button onClick={logout} className="nav-link-btn">Sign out ({user.name})</button>
              </>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/write" element={<RequireAuth><WritePage /></RequireAuth>} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
        </Routes>
      </main>
    </>
  )
}
