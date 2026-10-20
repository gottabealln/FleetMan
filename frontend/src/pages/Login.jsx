import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'
import './FleetPages.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault() // <--- THIS IS THE MAGIC LINE THAT STOPS THE RELOAD
    setError('')
    setLoading(true)
    
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      console.error("Login error:", err.response?.data)
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fleet-dashboard fleet-login">
      <aside className="fleet-login-aside">
        <div className="fleet-brand">
          <span className="fleet-brand-mark material-symbols-outlined" aria-hidden="true">local_shipping</span>
          <span>
            <strong>FleetMan</strong>
            <small>National fleet admin</small>
          </span>
        </div>

        <div>
          <h2>Run every vehicle, driver and trip from one place.</h2>
          <p>Track licences, schedule trips without conflicts and keep maintenance and fuel costs under control.</p>
          <ul className="fleet-login-points">
            <li><span className="material-symbols-outlined" aria-hidden="true">event_busy</span>Trip conflicts blocked automatically</li>
            <li><span className="material-symbols-outlined" aria-hidden="true">notifications_active</span>Licence and insurance expiry alerts</li>
            <li><span className="material-symbols-outlined" aria-hidden="true">analytics</span>Cost per km and mileage analytics</li>
          </ul>
        </div>
      </aside>

      <main className="fleet-login-panel">
        <div className="fleet-login-card">
          <div className="fleet-brand fleet-login-mobile-brand">
            <span className="fleet-brand-mark material-symbols-outlined" aria-hidden="true">local_shipping</span>
            <span><strong>FleetMan</strong></span>
          </div>

          <div>
            <h1>Sign in</h1>
            <p>Use your FleetMan account to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="fleet-card fleet-form">
            {error && <div className="fleet-notice" role="alert">{error}</div>}

            <label className="fleet-field">
              <span className="fleet-label">Username</span>
              <input
                className="fleet-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </label>

            <label className="fleet-field">
              <span className="fleet-label">Password</span>
              <input
                className="fleet-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </label>

            <button type="submit" disabled={loading} className="fleet-primary-action">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="fleet-login-version">FleetMan · v1.0</p>
        </div>
      </main>
    </div>
  )
}