import { useEffect, useState } from 'react'
import api from '../api/client'
import AppShell from '../components/AppShell'
import StatusChip from '../components/StatusChip'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState({
    full_name: '',
    license_number: '',
    license_expiry: '',
  })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    const { data } = await api.get('/drivers/')
    setDrivers(data)
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/drivers/', form)
      setForm({ full_name: '', license_number: '', license_expiry: '' })
      load()
    } catch (err) {
      setError(JSON.stringify(err.response?.data))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this driver?')) return
    try {
      await api.delete(`/drivers/${id}/`)
      load()
    } catch (err) {
      alert(JSON.stringify(err.response?.data))
    }
  }

  // Helper: days until expiry
  const daysUntil = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
  }

  const expiryChip = (dateStr) => {
    const days = daysUntil(dateStr)
    if (days < 0) return <StatusChip prefix="license" value="expired" label="Expired" />
    if (days <= 30) return <StatusChip prefix="license" value="expiring" label={`${days}d left`} />
    return <StatusChip prefix="license" value="valid" label="Valid" />
  }

  const shown = drivers.filter((d) =>
    [d.full_name, d.license_number].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <AppShell
      label="Driver Management"
      search={search}
      onSearch={setSearch}
      placeholder="Search drivers or license numbers..."
    >
      <div className="fleet-page-head">
        <h1>Fleet Drivers</h1>
        <p>Manage driver profiles and license validity</p>
      </div>

      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Add driver</h2><p>Create a driver profile and record the license expiry</p></div>
        </div>
        <form onSubmit={handleSubmit} className="fleet-form">
          <div className="fleet-form-grid cols-3">
            <label className="fleet-field">
              <span className="fleet-label">Full name</span>
              <input className="fleet-input" placeholder="Full name" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">License number</span>
              <input className="fleet-input" placeholder="License number" value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })} required />
            </label>
            <label className="fleet-field">
              <span className="fleet-label">License expiry</span>
              <input className="fleet-input" type="date" value={form.license_expiry}
                onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} required />
            </label>
          </div>
          <div className="fleet-form-footer">
            <button className="fleet-primary-action" type="submit">
              <span className="material-symbols-outlined" aria-hidden="true">person_add</span>
              Add driver
            </button>
          </div>
          {error && <div className="fleet-notice" role="alert">{error}</div>}
        </form>
      </section>

      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Driver register</h2><p>Profiles, license validity and activity</p></div>
          <span className="fleet-count">{shown.length}</span>
        </div>
        <div className="fleet-table-scroll">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Driver ID</th>
                <th>Name</th>
                <th>License</th>
                <th>Expiry</th>
                <th>License status</th>
                <th>Activity</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((d, index) => (
                <tr key={d.id}>
                  <td className="fleet-driver-id">{`DRV-${String(d.id).padStart(4, '0')}`}</td>
                  <td>
                    <div className="fleet-driver-name">
                      <span className={`fleet-driver-initial initial-${index % 3}`}>{d.full_name?.charAt(0) || '?'}</span>
                      <span>{d.full_name}</span>
                    </div>
                  </td>
                  <td>{d.license_number}</td>
                  <td>{d.license_expiry}</td>
                  <td>{expiryChip(d.license_expiry)}</td>
                  <td>
                    <StatusChip
                      value={d.is_active ? 'available' : 'inactive'}
                      label={d.is_active ? 'Active' : 'Inactive'}
                    />
                  </td>
                  <td className="fleet-actions-cell">
                    <button className="fleet-row-action is-danger" type="button" onClick={() => handleDelete(d.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td className="fleet-empty-row" colSpan="7">
                    {search ? 'No drivers match this search.' : 'No drivers yet. Add one above.'}
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