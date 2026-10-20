import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'
import FleetKpi from '../components/FleetKpi'

export default function OwnerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ vehicles: 0, drivers: 0, trips: 0, maintenance: 0 })
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [veh, dri, tri, mai, ana] = await Promise.all([
          api.get('/vehicles/'),
          api.get('/drivers/'),
          api.get('/trips/'),
          api.get('/maintenance/'),
          api.get('/analytics/vehicles/'),
        ])

        setStats({
          vehicles: veh.data.length,
          drivers: dri.data.length,
          trips: tri.data.length,
          maintenance: mai.data.filter((m) => m.status !== 'completed').length,
        })
        
        setAnalytics(ana.data)
      } catch {
        setError('Failed to load executive data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <AppShell label="Executive View">
        <div className="fleet-loading" role="status">
          <span className="fleet-loading-mark" />
          <span>Loading business metrics...</span>
        </div>
      </AppShell>
    )
  }

  // Calculate fleet-wide costs
  const totalCost = analytics.reduce((a, r) => a + r.total_cost, 0)
  const totalDistance = analytics.reduce((a, r) => a + r.distance_km, 0)
  const avgCostPerKm = totalDistance > 0 ? (totalCost / totalDistance).toFixed(2) : '0.00'

  // Find top 3 most expensive vehicles to run
  const topExpensive = [...analytics]
    .filter((r) => r.cost_per_km !== null)
    .sort((a, b) => b.cost_per_km - a.cost_per_km)
    .slice(0, 3)

  return (
    <AppShell label="Executive View">
      <div className="fleet-page-head">
        <h1>Executive Overview</h1>
        <p>Welcome, {user?.username}. Read-only business performance dashboard.</p>
      </div>

      {error && <div className="fleet-notice" role="alert">{error}</div>}

      <div className="fleet-kpi-grid">
        <FleetKpi dark title="Fleet Size" value={stats.vehicles} icon="local_shipping" />
        <FleetKpi title="Total Drivers" value={stats.drivers} icon="person" tone="navy" />
        <FleetKpi title="Average Cost / km" value={`₹${avgCostPerKm}`} icon="payments" tone="gold" />
        <FleetKpi title="Maintenance Due" value={stats.maintenance} icon="build" tone="red" />
      </div>

      <div className="fleet-chart-grid">
        {/* Top Cost Vehicles */}
        <section className="fleet-card">
          <div className="fleet-section-heading">
            <div><h2>Highest Cost Vehicles</h2><p>Units requiring the most fuel budget per km</p></div>
          </div>
          <div className="fleet-table-scroll">
            <table className="fleet-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Total Fuel Cost</th>
                  <th>Cost / km</th>
                </tr>
              </thead>
              <tbody>
                {topExpensive.map((v) => (
                  <tr key={v.vehicle_id}>
                    <td>
                      <span className="fleet-cell-strong">{v.plate_number}</span>
                      <span className="fleet-cell-sub">{v.make} {v.model}</span>
                    </td>
                    <td className="fleet-cell-strong">₹{v.total_cost.toLocaleString()}</td>
                    <td className="fleet-cell-strong" style={{ color: 'var(--fleet-red)' }}>
                      ₹{v.cost_per_km}
                    </td>
                  </tr>
                ))}
                {topExpensive.length === 0 && (
                  <tr><td colSpan="3" className="fleet-empty-row">No fuel data available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Links */}
        <section className="fleet-card">
          <div className="fleet-section-heading">
            <div><h2>Read-Only Reports</h2><p>View detailed operational logs</p></div>
          </div>
          <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/analytics" className="fleet-secondary-action" style={{ justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined">analytics</span>
                Full Fuel & Cost Analytics
              </span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link to="/trips" className="fleet-secondary-action" style={{ justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined">route</span>
                Trip History Log
              </span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <Link to="/maintenance" className="fleet-secondary-action" style={{ justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined">build</span>
                Maintenance Records
              </span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}