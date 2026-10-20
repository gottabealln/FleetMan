import { useEffect, useState } from 'react'
import api from '../api/client'
import AppShell from '../components/AppShell'
import StatusChip from '../components/StatusChip'

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [form, setForm] = useState({ plate_number: '', make: '', model: '', year: 2020 })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    const { data } = await api.get('/vehicles/')
    setVehicles(data)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    try {
      await api.post('/vehicles/', form)
      setForm({ plate_number: '', make: '', model: '', year: 2020 }); load()
    } catch (err) { setError(JSON.stringify(err.response?.data)) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return
    await api.delete(`/vehicles/${id}/`); load()
  }

  const shown = vehicles.filter((v) =>
    [v.plate_number, v.make, v.model].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <AppShell
      label="Fleet Status"
      search={search}
      onSearch={setSearch}
      placeholder="Search plate, make or model..."
    >
      <div className="fleet-page-head">
        <h1>Fleet Vehicles</h1>
        <p>Add, view, and remove fleet vehicles</p>
      </div>

      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Add vehicle</h2><p>Register a new unit in the fleet</p></div>
        </div>
        <form onSubmit={handleSubmit} className="fleet-form">
          <div className="fleet-form-grid cols-4">
            <label className="fleet-field">
              <span className="fleet-label">Plate number</span>
              <input className="fleet-input" placeholder="KL-01-AB-1234" value={form.plate_number}
                onChange={(e) => setForm({ ...form, plate_number: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Make</span>
              <input className="fleet-input" placeholder="Tata" value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Model</span>
              <input className="fleet-input" placeholder="Ace" value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">Year</span>
              <input className="fleet-input" type="number" placeholder="2020" value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} required />
            </label>
          </div>
          <div className="fleet-form-footer">
            <button className="fleet-primary-action" type="submit">
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              Add vehicle
            </button>
          </div>
          {error && <div className="fleet-notice" role="alert">{error}</div>}
        </form>
      </section>

      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Vehicle register</h2><p>All units currently on record</p></div>
          <span className="fleet-count">{shown.length}</span>
        </div>
        <div className="fleet-table-scroll">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Plate</th>
                <th>Make</th>
                <th>Model</th>
                <th>Year</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => (
                <tr key={v.id}>
                  <td className="fleet-cell-strong">{v.plate_number}</td>
                  <td>{v.make}</td>
                  <td>{v.model}</td>
                  <td>{v.year}</td>
                  <td><StatusChip value={v.status} /></td>
                  <td className="fleet-actions-cell">
                    <button className="fleet-row-action is-danger" type="button" onClick={() => handleDelete(v.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td className="fleet-empty-row" colSpan="6">
                    {search ? 'No vehicles match this search.' : 'No vehicles yet. Add one above.'}
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