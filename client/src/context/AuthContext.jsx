import { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../lib/api.js'
import { getToken, setToken, clearToken } from '../lib/token.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!getToken())

  // Restore the session from a stored token on page load.
  useEffect(() => {
    if (!getToken()) return
    api
      .getMe()
      .then(({ user }) => setUser(user))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function authenticate(call, payload) {
    const { token, user } = await call(payload)
    setToken(token)
    setUser(user)
  }

  const value = {
    user,
    loading,
    // TODO: implement login. Reuse authenticate() with api.login, like register does.
    login: async (creds) => authenticate(api.login, creds),
    register: (data) => authenticate(api.register, data),
    logout: () => {
      clearToken()
      setUser(null)
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
