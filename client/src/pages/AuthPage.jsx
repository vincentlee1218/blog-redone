import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await (isRegister ? register(form) : login(form))
      navigate('/')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form className="write-form auth-form" onSubmit={handleSubmit}>
      <h1>{isRegister ? 'Join the blog' : 'Welcome back'}</h1>
      {isRegister && <input name="name" placeholder="Your name" value={form.name} onChange={update} />}
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={update} />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={update} />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={busy} className="publish-btn">
        {busy ? 'Please wait…' : isRegister ? 'Sign up' : 'Sign in'}
      </button>
      <p className="auth-switch">
        {isRegister ? (
          <>Already have an account? <Link to="/login">Sign in</Link></>
        ) : (
          <>No account? <Link to="/register">Sign up</Link></>
        )}
      </p>
    </form>
  )
}
