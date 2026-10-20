import { useEffect, useState } from 'react'
import api from '../api/client'
import AppShell from '../components/AppShell'
import StatusChip from '../components/StatusChip'

const statusLabel = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function Maintenance() {
  const [records, setRecords] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState({
    vehicle: '',
    service_type: '',
    scheduled_date: '',
    cost: 0,
    description: '',
    status: 'scheduled',
  })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    const [m, v] = await Promise.all([
      api.get('/maintenance/'),
      api.get('/vehicles/'),
    ])
    setRecords(m.data)
    setVehicles(v.data)
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/maintenance/', {
        ...form,
        vehicle: parseInt(form.vehicle),
      })
      setForm({
        vehicle: '',
        service_type: '',
        scheduled_date: '',
        cost: 0,
        description: '',
        status: 'scheduled',
      })
      load()
    } catch (err) {
      setError(JSON.stringify(err.response?.data))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this maintenance record?')) return
    try {
      await api.delete(`/maintenance/${id}/`)
      load()
    } catch (err) {
      alert(JSON.stringify(err.response?.data))
    }
  }

  const shown = records.filter((r) =>
    [r.vehicle_plate, r.service_type].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <AppShell
      label="Maintenance"
      search={search}
      onSearch={setSearch}
      placeholder="Search vehicle or service type..."
    >
      <div className="fleet-page-head">
        <h1>Fleet Maintenance</h1>
        <p>Schedule, track, and complete vehicle service records</p>
      </div>

      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Schedule maintenance</h2><p>Book a service for a vehicle</p></div>
        </div>
        <form onSubmit={handleSubmit} className="fleet-form">
          <div className="fleet-form-grid cols-4">
            <label className="fleet-field">
              <span className="fleet-label">Vehicle</span>
              <select className="fleet-input" value={form.vehicle}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })} required>
                <option value="">Select vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate_number} ({v.make} {v.model})</option>
                ))}
              </select>
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Service type</span>
              <input className="fleet-input" placeholder="Oil change" value={form.service_type}
                onChange={(e) => setForm({ ...form, service_type: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Scheduled date</span>
              <input className="fleet-input" type="date" value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Estimated cost (₹)</span>
              <input className="fleet-input" type="number" value={form.cost}
                onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} />
            </label>
            <label className="fleet-field span-all">
              <span className="fleet-label">Description (optional)</span>
              <textarea className="fleet-input" rows="2" placeholder="Notes about the service..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
          </div>
          <div className="fleet-form-footer">
            <button className="fleet-primary-action" type="submit">
              <span className="material-symbols-outlined" aria-hidden="true">build</span>
              Schedule maintenance
            </button>
          </div>
          {error && <div className="fleet-notice" role="alert">{error}</div>}
        </form>
      </section>

      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Service records</h2><p>Upcoming, active and completed work</p></div>
          <span className="fleet-count">{shown.length}</span>
        </div>
        <div className="fleet-table-scroll">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Service</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Cost</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td className="fleet-cell-strong">{r.vehicle_plate}</td>
                  <td>{r.service_type}</td>
                  <td>{r.scheduled_date}</td>
                  <td><StatusChip value={r.status} label={statusLabel[r.status]} /></td>
                  <td className="fleet-cell-strong">₹{r.cost}</td>
                  <td className="fleet-actions-cell">
                    <button className="fleet-row-action is-danger" type="button" onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td className="fleet-empty-row" colSpan="6">
                    {search ? 'No records match this search.' : 'No maintenance records yet. Schedule one above.'}
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