import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'
import FleetKpi from '../components/FleetKpi'
import StatusChip from '../components/StatusChip'

export default function DriverDashboard() {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [vehicles, setVehicles] = useState([])
  
  const [fuelForm, setFuelForm] = useState({
    vehicle: '', date: '', odometer: '', liters: '', cost: '', receipt_image: null,
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    try {
      // FIXED: Correctly mapping the Promise.all response to variables
      const [veh, dri, tri, mai, fue] = await Promise.all([
        api.get('/vehicles/'), 
        api.get('/drivers/'), 
        api.get('/trips/'), 
        api.get('/maintenance/'),
        api.get('/fuel-logs/'),
      ])
      
      setVehicles(veh.data)
      setTrips(tri.data)
      setFuelLogs(fue.data)
      
    } catch (err) {
      setError('Failed to load data.')
    }
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (tripId, newStatus) => {
    try {
      await api.patch(`/trips/${tripId}/`, { status: newStatus })
      load()
    } catch (err) {
      alert(JSON.stringify(err.response?.data))
    }
  }

  const handleFuelSubmit = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    
    try {
      const formData = new FormData()
      formData.append('vehicle', parseInt(fuelForm.vehicle))
      formData.append('date', fuelForm.date)
      formData.append('odometer', parseInt(fuelForm.odometer))
      formData.append('liters', parseFloat(fuelForm.liters))
      formData.append('cost', parseFloat(fuelForm.cost))
      
      if (fuelForm.receipt_image) {
        formData.append('receipt_image', fuelForm.receipt_image)
      }

      await api.post('/fuel-logs/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setMessage('Fuel log recorded.')
      setFuelForm({ vehicle: '', date: '', odometer: '', liters: '', cost: '', receipt_image: null })
      
      // Reset the file input visually
      e.target.reset()
      
      load()
    } catch (err) {
      setError(JSON.stringify(err.response?.data))
    }
  }

  const todayTrips = trips.filter((t) => {
    const d = new Date(t.start_time)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })

  return (
    <AppShell label="Driver Dashboard">
      <div className="fleet-page-head">
        <h1>Driver Dashboard</h1>
        <p>Welcome, {user?.driver_name || user?.username}</p>
      </div>

      <div className="fleet-kpi-grid">
        <FleetKpi dark title="Today's trips" value={todayTrips.length} icon="today" />
        <FleetKpi title="All my trips" value={trips.length} icon="route" tone="navy" />
        <FleetKpi title="Fuel logs" value={fuelLogs.length} icon="local_gas_station" tone="green" />
      </div>

      {/* My Trips */}
      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>My assigned trips</h2><p>Start a trip when you leave and complete it on arrival</p></div>
          <span className="fleet-count">{trips.length}</span>
        </div>
        {trips.length === 0 ? (
          <p className="fleet-empty-message">No trips assigned yet.</p>
        ) : (
          <ul className="fleet-trip-rows">
            {trips.map((t) => (
              <li key={t.id} className="fleet-trip-row">
                <div className="fleet-trip-row-main">
                  <strong>{t.origin} → {t.destination}</strong>
                  <span>
                    {new Date(t.start_time).toLocaleString()} – {new Date(t.end_time).toLocaleTimeString()}
                  </span>
                  <span>Vehicle: {t.vehicle_plate}</span>
                </div>
                <div className="fleet-trip-row-actions">
                  {t.status !== 'ongoing' && t.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(t.id, 'ongoing')}
                      className="fleet-primary-action fleet-small-action"
                    >
                      Start trip
                    </button>
                  )}
                  {t.status === 'ongoing' && (
                    <button
                      type="button"
                      onClick={() => updateStatus(t.id, 'completed')}
                      className="fleet-primary-action fleet-success-action fleet-small-action"
                    >
                      Complete trip
                    </button>
                  )}
                  <StatusChip value={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Fuel Log Form */}
      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Log fuel</h2><p>Record a fill-up so mileage and cost stay accurate</p></div>
        </div>
        <form onSubmit={handleFuelSubmit} className="fleet-form">
          <div className="fleet-form-grid cols-3">
            <label className="fleet-field">
              <span className="fleet-label">Vehicle</span>
              <select className="fleet-input" value={fuelForm.vehicle}
                onChange={(e) => setFuelForm({ ...fuelForm, vehicle: e.target.value })} required>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate_number}</option>
                ))}
              </select>
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Date</span>
              <input className="fleet-input" type="date" value={fuelForm.date}
                onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Odometer (km)</span>
              <input className="fleet-input" type="number" placeholder="e.g. 45210" value={fuelForm.odometer}
                onChange={(e) => setFuelForm({ ...fuelForm, odometer: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Litres</span>
              <input className="fleet-input" type="number" step="0.01" placeholder="e.g. 32.5" value={fuelForm.liters}
                onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Cost (₹)</span>
              <input className="fleet-input" type="number" step="0.01" placeholder="e.g. 3200" value={fuelForm.cost}
                onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Receipt Photo</span>
              <input 
                className="fleet-input" 
                type="file" 
                accept="image/*"
                onChange={(e) => setFuelForm({ ...fuelForm, receipt_image: e.target.files[0] })} 
              />
            </label>
          </div>
          <div className="fleet-form-footer">
            <button className="fleet-primary-action" type="submit">
              <span className="material-symbols-outlined" aria-hidden="true">local_gas_station</span>
              Record fuel
            </button>
          </div>
          {message && <div className="fleet-notice is-success" role="status">{message}</div>}
          {error && <div className="fleet-notice" role="alert">{error}</div>}
        </form>
      </section>

      {/* Recent Fuel Logs */}
      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Recent fuel logs</h2><p>Your latest ten fill-ups</p></div>
        </div>
        <div className="fleet-table-scroll">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Odometer</th>
                <th>Litres</th>
                <th>Cost</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.slice(0, 10).map((f) => (
                <tr key={f.id}>
                  <td>{f.date}</td>
                  <td className="fleet-cell-strong">{f.vehicle_plate}</td>
                  <td>{f.odometer} km</td>
                  <td>{f.liters} L</td>
                  <td className="fleet-cell-strong">₹{f.cost}</td>
                  <td>
                    {f.receipt_image ? (
                      <a 
                        href={`http://127.0.0.1:8000${f.receipt_image}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs font-semibold"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">None</span>
                    )}
                  </td>
                </tr>
              ))}
              {fuelLogs.length === 0 && (
                <tr>
                  <td className="fleet-empty-row" colSpan="6">No fuel logs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  )
}