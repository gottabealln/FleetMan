import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'
import FleetMap from '../components/FleetMap'

const adminAvatar = 'https://ui-avatars.com/api/?name=Admin&background=001b44&color=fff'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/vehicles', label: 'Fleet Status', icon: 'local_shipping' },
  { to: '/drivers', label: 'Driver Management', icon: 'person' },
  { to: '/trips', label: 'Routes', icon: 'map' },
  { to: '/maintenance', label: 'Maintenance', icon: 'build' },
  { to: '/analytics', label: 'Analytics', icon: 'analytics' },
]

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
const formatDateTime = (value) => new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const parseDateOnly = (value) => new Date(`${value}T00:00:00`)
const isValidDate = (value) => value && !Number.isNaN(new Date(value).getTime())

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [trips, setTrips] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [alerts, setAlerts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [veh, dri, tri, mai] = await Promise.all([
          api.get('/vehicles/'), api.get('/drivers/'), api.get('/trips/'), api.get('/maintenance/'),
        ])

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const soon = new Date(today)
        soon.setDate(soon.getDate() + 30)
        const pendingAlerts = []

        dri.data.forEach((d) => {
          if (!isValidDate(d.license_expiry)) return
          const exp = parseDateOnly(d.license_expiry)
          if (exp <= soon) pendingAlerts.push({ type: 'License', who: d.full_name, date: d.license_expiry, overdue: exp < today })
        })
        veh.data.forEach((v) => {
          if (isValidDate(v.insurance_expiry)) {
            const exp = parseDateOnly(v.insurance_expiry)
            if (exp <= soon) pendingAlerts.push({ type: 'Insurance', who: v.plate_number, date: v.insurance_expiry, overdue: exp < today })
          }
        })

        setVehicles(veh.data)
        setDrivers(dri.data.map((driver) => {
          if (!isValidDate(driver.license_expiry)) return { ...driver, license_status: 'Unknown' }
          const daysToExpiry = Math.ceil((parseDateOnly(driver.license_expiry) - today) / 86400000)
          const licenseStatus = daysToExpiry < 0 ? 'Expired' : daysToExpiry <= 30 ? 'Expiring' : 'Valid'
          return { ...driver, license_status: licenseStatus }
        }))
        setTrips(tri.data)
        setMaintenance(mai.data)
        setAlerts(pendingAlerts)
      } catch {
        setLoadError('Fleet data could not be loaded. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeVehicles = vehicles.filter((v) => v.status === 'active').length
  const serviceVehicles = vehicles.filter((v) => v.status === 'maintenance').length
  const retiredVehicles = vehicles.filter((v) => v.status === 'retired').length
  const ongoingTrips = trips.filter((t) => t.status === 'ongoing')
  const scheduledTrips = trips.filter((t) => t.status === 'scheduled').sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const openMaintenance = maintenance.filter((m) => m.status !== 'completed').length
  const vehicleStatuses = [
    { label: 'Active fleet', count: activeVehicles, value: vehicles.length ? activeVehicles / vehicles.length * 100 : 0, tone: 'green' },
    { label: 'In maintenance', count: serviceVehicles, value: vehicles.length ? serviceVehicles / vehicles.length * 100 : 0, tone: 'gold' },
  ]
  
  const filteredDrivers = drivers.filter((driver) => {
    const driverTrips = trips.filter((trip) => trip.driver === driver.id)
    const searchText = [driver.full_name, driver.license_number, ...driverTrips.flatMap((trip) => [trip.vehicle_plate, trip.origin, trip.destination])].join(' ').toLowerCase()
    return searchText.includes(search.trim().toLowerCase())
  })

  const handleLogout = () => { logout(); navigate('/login') }
  const visibleAlerts = alerts.slice(0, 4)
  const shortName = user?.username || 'Admin User'

  return (
    <div className="fleet-dashboard">
      <aside className="fleet-sidebar">
        <Link to="/dashboard" className="fleet-brand">
          <span className="fleet-brand-mark material-symbols-outlined" aria-hidden="true">local_shipping</span>
          <span><strong>FleetMan</strong><small>National fleet admin</small></span>
        </Link>
        <nav className="fleet-navigation" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} className={({ isActive }) => `fleet-nav-link${isActive ? ' is-active' : ''}`}>
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="fleet-sidebar-user">
          <img src={adminAvatar} alt="" />
          <span><strong>{shortName}</strong><small>{user?.role || 'Fleet admin'}</small></span>
        </div>
      </aside>

      <main className="fleet-main">
        <header className="fleet-topbar">
          <label className="fleet-search">
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search drivers, vehicles or routes..." />
          </label>
          <div className="fleet-topbar-actions">
            <span className="fleet-page-label">Delivery Dashboard</span>
            <a className="fleet-icon-button" href="#fleet-alerts" aria-label="View expiry alerts"><span className="material-symbols-outlined">notifications</span>{alerts.length > 0 && <span className="fleet-alert-dot" />}</a>
            <button className="fleet-icon-button" type="button" onClick={handleLogout} aria-label="Log out"><span className="material-symbols-outlined">logout</span></button>
            <img className="fleet-topbar-avatar" src={adminAvatar} alt={`${shortName} profile`} />
          </div>
        </header>

        <div className="fleet-content">
          {loadError && <div className="fleet-load-error" role="alert">{loadError}</div>}
          {loading ? (
            <div className="fleet-loading" role="status"><span className="fleet-loading-mark" /><span>Loading fleet data</span></div>
          ) : (
            <>
              <section className="fleet-overview" aria-label="Fleet overview">
                <div className="fleet-map-panel">
                  {/* THE INTERACTIVE MAP REPLACES THE STATIC IMAGE */}
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <FleetMap trips={scheduledTrips} />
                  </div>
                  
                  {/* THE OVERLAYS REMAIN ON TOP */}
                  <div className="fleet-map-heading" style={{ zIndex: 1000 }}>
                    <span className="fleet-live-indicator" />Fleet network <span className="fleet-map-divider">/</span> {vehicles.length} units
                  </div>
                  
                  <div className="fleet-network-pulse" style={{ zIndex: 1000 }}>
                    <h2>Network pulse</h2>
                    {vehicleStatuses.map((status) => (
                      <div className="fleet-pulse-row" key={status.label}>
                        <div className="fleet-pulse-label"><span>{status.label}</span><strong>{status.count}</strong></div>
                        <div className="fleet-pulse-track"><span className={`fleet-pulse-fill ${status.tone}`} style={{ width: `${status.value}%` }} /></div>
                      </div>
                    ))}
                    <div className="fleet-pulse-footnote">{openMaintenance} open maintenance {openMaintenance === 1 ? 'task' : 'tasks'}</div>
                  </div>
                </div>

                <div className="fleet-overview-stats">
                  <article className="fleet-stat-panel fleet-stat-dark">
                    <div className="fleet-stat-heading">
                      <div><p>Vehicles in service</p><strong>{activeVehicles}<span> / {vehicles.length}</span></strong></div>
                      <span className="material-symbols-outlined fleet-stat-icon">local_shipping</span>
                    </div>
                    <div className="fleet-status-bars">
                      <span className="fleet-status-bar status-active" style={{ flexGrow: activeVehicles || 0.05 }} />
                      <span className="fleet-status-bar status-service" style={{ flexGrow: serviceVehicles || 0.05 }} />
                      <span className="fleet-status-bar status-retired" style={{ flexGrow: retiredVehicles || 0.05 }} />
                    </div>
                    <div className="fleet-stat-legend">
                      <span><i className="legend-green" /> Active</span>
                      <span><i className="legend-gold" /> Service</span>
                      <span><i className="legend-muted" /> Retired</span>
                    </div>
                  </article>

                  <article className="fleet-stat-panel fleet-stat-light">
                    <div className="fleet-stat-heading">
                      <div><p>Trips underway</p><strong>{ongoingTrips.length}<span> active</span></strong></div>
                      <span className="material-symbols-outlined fleet-stat-icon">route</span>
                    </div>
                    <div className="fleet-trip-summary">
                      <span className="fleet-trip-value">{scheduledTrips.length}</span><span>scheduled</span>
                      <span className="fleet-trip-separator" />
                      <span className="fleet-trip-value">{trips.length}</span><span>total trips</span>
                    </div>
                    <div className="fleet-trip-bars" aria-hidden="true">
                      {[0.36, 0.58, 0.44, 0.72, 0.56, 0.9, 0.64].map((height, index) => (<span key={index} style={{ height: `${height * 100}%` }} />))}
                    </div>
                  </article>
                </div>
              </section>

              <section className="fleet-manifest">
                <div className="fleet-section-heading">
                  <div><h1>Fleet Driver Manifest</h1><p>Driver availability, assigned vehicles and license status</p></div>
                  <div className="fleet-section-actions"><Link to="/drivers" className="fleet-primary-action"><span className="material-symbols-outlined">person_add</span>Add driver</Link></div>
                </div>
                <div className="fleet-table-scroll">
                  <table className="fleet-table">
                    <thead><tr><th>Driver ID</th><th>Operator name</th><th>Vehicle</th><th>Status</th><th>Current route</th><th>License</th></tr></thead>
                    <tbody>
                      {filteredDrivers.slice(0, 5).map((driver, index) => {
                        const currentTrip = trips.find((trip) => trip.driver === driver.id && trip.status === 'ongoing')
                        const nextTrip = currentTrip || trips.find((trip) => trip.driver === driver.id && trip.status === 'scheduled')
                        const statusLabel = currentTrip ? 'On route' : nextTrip ? 'Scheduled' : driver.is_active ? 'Available' : 'Inactive'
                        return (
                          <tr key={driver.id}>
                            <td className="fleet-driver-id">{`DRV-${String(driver.id).padStart(4, '0')}`}</td>
                            <td><div className="fleet-driver-name"><span className={`fleet-driver-initial initial-${index % 3}`}>{driver.full_name?.charAt(0) || '?'}</span><span>{driver.full_name}</span></div></td>
                            <td className="fleet-vehicle-cell">{nextTrip?.vehicle_plate || 'Unassigned'}</td>
                            <td><span className={`fleet-status-chip chip-${statusLabel.toLowerCase().replace(' ', '-')}`}>{statusLabel}</span></td>
                            <td className="fleet-route-cell">{nextTrip ? `${nextTrip.origin} → ${nextTrip.destination}` : 'No active trip'}</td>
                            <td><span className={`fleet-license-chip license-${driver.license_status.toLowerCase()}`}>{driver.license_status}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="fleet-detail-grid">
                <article className="fleet-detail-panel">
                  <div className="fleet-detail-heading"><div><h2>Upcoming trips</h2><p>Next scheduled departures</p></div><Link to="/trips" className="fleet-detail-link material-symbols-outlined">arrow_forward</Link></div>
                  {scheduledTrips.length === 0 ? (<p className="fleet-empty-message">No scheduled trips.</p>) : (
                    <ul className="fleet-trip-list">
                      {scheduledTrips.slice(0, 3).map((trip) => (
                        <li key={trip.id}>
                          <span className="fleet-trip-time">{formatDateTime(trip.start_time)}</span>
                          <strong>{trip.origin} <span>to</span> {trip.destination}</strong>
                          <small>{trip.vehicle_plate} · {trip.driver_name}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                <article className="fleet-detail-panel" id="fleet-alerts">
                  <div className="fleet-detail-heading"><div><h2>Expiry alerts</h2><p>Licenses and insurance due within 30 days</p></div><span className={`fleet-alert-count${alerts.length ? ' has-alerts' : ''}`}>{alerts.length}</span></div>
                  {visibleAlerts.length === 0 ? (<p className="fleet-empty-message">No upcoming expiries.</p>) : (
                    <ul className="fleet-alert-list">
                      {visibleAlerts.map((alert, index) => (
                        <li key={`${alert.type}-${alert.who}-${index}`}>
                          <span className={`fleet-alert-symbol${alert.overdue ? ' is-overdue' : ''} material-symbols-outlined`}>{alert.overdue ? 'error' : 'schedule'}</span>
                          <span><strong>{alert.type} · {alert.who}</strong><small>{alert.overdue ? 'Expired' : 'Expires'} {formatDate(alert.date)}</small></span>
                          {alert.overdue && <b>Overdue</b>}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}