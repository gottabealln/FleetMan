import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import adminAvatar from '../assets/stitch-admin-avatar.jpg'
import '../pages/Dashboard.css'
import '../pages/FleetPages.css'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/vehicles', label: 'Fleet Status', icon: 'local_shipping' },
  { to: '/drivers', label: 'Driver Management', icon: 'person' },
  { to: '/trips', label: 'Routes', icon: 'map' },
  { to: '/maintenance', label: 'Maintenance', icon: 'build' },
  { to: '/analytics', label: 'Analytics', icon: 'analytics' },
]

/**
 * Sidebar + topbar used by every page except Dashboard (which has its own copy).
 * Props:
 *   label        – text shown at the right of the topbar (current page name)
 *   search       – optional search value; the search box is hidden when onSearch is not passed
 *   onSearch     – setter for the search value
 *   placeholder  – search placeholder text
 */
export default function AppShell({ label, search = '', onSearch, placeholder = 'Search...', children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const shortName = user?.username || 'Admin User'
  const links = user?.role === 'driver' ? navigation.slice(0, 1) : navigation

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="fleet-dashboard">
      <aside className="fleet-sidebar">
        <Link to="/dashboard" className="fleet-brand">
          <span className="fleet-brand-mark material-symbols-outlined" aria-hidden="true">local_shipping</span>
          <span>
            <strong>FleetMan</strong>
            <small>National fleet admin</small>
          </span>
        </Link>

        <nav className="fleet-navigation" aria-label="Main navigation">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `fleet-nav-link${isActive ? ' is-active' : ''}`}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="fleet-sidebar-user">
          <img src={adminAvatar} alt="" />
          <span>
            <strong>{shortName}</strong>
            <small>{user?.role || 'Fleet admin'}</small>
          </span>
        </div>
      </aside>

      <main className="fleet-main">
        <header className="fleet-topbar">
          {onSearch ? (
            <label className="fleet-search">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input
                type="search"
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
              />
            </label>
          ) : (
            <span />
          )}
          <div className="fleet-topbar-actions">
            <span className="fleet-page-label">{label}</span>
            <button className="fleet-icon-button" type="button" onClick={handleLogout} aria-label="Log out" title="Log out">
              <span className="material-symbols-outlined" aria-hidden="true">logout</span>
            </button>
            <img className="fleet-topbar-avatar" src={adminAvatar} alt={`${shortName} profile`} />
          </div>
        </header>

        <div className="fleet-content fleet-page">{children}</div>
      </main>
    </div>
  )
}
