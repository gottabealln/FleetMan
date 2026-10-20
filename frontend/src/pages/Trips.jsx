import { useEffect, useState } from 'react'
import api from '../api/client'
import AppShell from '../components/AppShell'
import StatusChip from '../components/StatusChip'

export default function Trips() {
  const [trips, setTrips] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState({
    vehicle: '', driver: '', start_time: '', end_time: '', origin: '', destination: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    const [t, v, d] = await Promise.all([
      api.get('/trips/'), api.get('/vehicles/'), api.get('/drivers/'),
    ])
    setTrips(t.data); setVehicles(v.data); setDrivers(d.data)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await api.post('/trips/', {
        ...form,
        vehicle: parseInt(form.vehicle),
        driver: parseInt(form.driver),
      })
      setSuccess('Trip created successfully.')
      setForm({ vehicle: '', driver: '', start_time: '', end_time: '', origin: '', destination: '' })
      load()
    } catch (err) {
      const data = err.response?.data
      if (data?.detail) setError(data.detail)
      else if (data) setError(Object.values(data).flat().join(' '))
      else setError('Failed to create trip.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this trip?')) return
    await api.delete(`/trips/${id}/`)
    load()
  }

  const shown = trips.filter((t) =>
    [t.vehicle_plate, t.driver_name, t.origin, t.destination].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <AppShell
      label="Routes"
      search={search}
      onSearch={setSearch}
      placeholder="Search vehicle, driver or route..."
    >
      <div className="fleet-page-head">
        <h1>Trip Management</h1>
        <p>Schedule and monitor fleet trips</p>
      </div>

      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Schedule trip</h2><p>Overlapping vehicle or driver bookings are rejected automatically</p></div>
        </div>
        <form onSubmit={handleSubmit} className="fleet-form">
          <div className="fleet-form-grid cols-3">
            <label className="fleet-field">
              <span className="fleet-label">Vehicle</span>
              <select className="fleet-input" value={form.vehicle}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })} required>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate_number} ({v.make} {v.model})</option>)}
              </select>
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Driver</span>
              <select className="fleet-input" value={form.driver}
                onChange={(e) => setForm({ ...form, driver: e.target.value })} required>
                <option value="">Select driver</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Origin</span>
              <input className="fleet-input" placeholder="Bangalore" value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Destination</span>
              <input className="fleet-input" placeholder="Mysore" value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Start</span>
              <input className="fleet-input" type="datetime-local" value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">End</span>
              <input className="fleet-input" type="datetime-local" value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
            </label>
          </div>

          <div className="fleet-form-footer">
            <button className="fleet-primary-action" type="submit">
              <span className="material-symbols-outlined" aria-hidden="true">add_road</span>
              Create trip
            </button>
          </div>

          {error && (
            <div className="fleet-notice" role="alert">
              <strong>Scheduling conflict</strong>
              {error}
            </div>
          )}
          {success && <div className="fleet-notice is-success" role="status">{success}</div>}
        </form>
      </section>

      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Trip schedule</h2><p>All planned, active and finished trips</p></div>
          <span className="fleet-count">{shown.length}</span>
        </div>
        <div className="fleet-table-scroll">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => (
                <tr key={t.id}>
                  <td className="fleet-cell-strong">{t.vehicle_plate}</td>
                  <td>{t.driver_name}</td>
                  <td>{t.origin} → {t.destination}</td>
                  <td>{new Date(t.start_time).toLocaleString()}</td>
                  <td>{new Date(t.end_time).toLocaleString()}</td>
                  <td><StatusChip value={t.status} /></td>
                  <td className="fleet-actions-cell">
                    <button className="fleet-row-action is-danger" type="button" onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td className="fleet-empty-row" colSpan="7">
                    {search ? 'No trips match this search.' : 'No trips yet. Create one above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  )
}