import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('access'))
  const [user, setUser] = useState(null)

  const login = async (username, password) => {
    try {
      // 1. Send credentials to Django
      const { data } = await api.post('/token/', { username, password })
      
      // 2. Save to Local Storage
      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)
      
      // 3. Update state
      setToken(data.access)
      
      return data
    } catch (error) {
      console.error("Login failed at API level:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }
    
    // Fetch the user profile whenever we have a token
    api.get('/me/')
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.error("Failed to get user profile", err)
        logout() // Token is invalid, force logout
      })
  }, [token])

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)