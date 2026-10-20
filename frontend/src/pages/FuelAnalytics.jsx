import { useEffect, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from 'recharts'
import api from '../api/client'
import AppShell from '../components/AppShell'
import FleetKpi from '../components/FleetKpi'

// A palette of colors for the Pie chart
const COLORS = ['#001b44', '#12376c', '#35bb86', '#e9b648', '#c84336', '#8e9eb3']

export default function FuelAnalytics() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // NEW: State to track which chart to show. Options: 'bar', 'line', 'pie'
  const [chartType, setChartType] = useState('bar')

  useEffect(() => {
    api.get('/analytics/vehicles/')
      .then((res) => setRows(res.data))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell label="Analytics">
        <div className="fleet-loading" role="status">
          <span className="fleet-loading-mark" />
          <span>Loading analytics</span>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell label="Analytics">
        <div className="fleet-notice" role="alert">{error}</div>
      </AppShell>
    )
  }

  // Pre-process data for the charts
  const chartData = rows.filter((r) => r.cost_per_km !== null)
  const totalCost = rows.reduce((a, r) => a + r.total_cost, 0)
  const totalLiters = rows.reduce((a, r) => a + r.total_liters, 0)
  const totalDistance = rows.reduce((a, r) => a + r.distance_km, 0)
  const fleetCostPerKm = totalDistance > 0 ? (totalCost / totalDistance).toFixed(2) : '—'
  const fleetKmPerLiter = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : '—'

  // Custom label for the Pie chart to show the plate number inside the slice
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show text if the slice is big enough (e.g., > 5%)
    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <AppShell label="Analytics">
      <div className="fleet-page-head">
        <h1>Fuel &amp; Cost Analytics</h1>
        <p>Cost per km, mileage, and consumption across the fleet</p>
      </div>

      <div className="fleet-kpi-grid">
        <FleetKpi dark title="Fleet cost / km" value={`₹${fleetCostPerKm}`} subtitle="Average across all vehicles" icon="payments" />
        <FleetKpi title="Fleet mileage" value={`${fleetKmPerLiter} km/L`} subtitle="Total distance ÷ total litres" icon="local_gas_station" tone="green" />
        <FleetKpi title="Total distance" value={`${totalDistance.toLocaleString()} km`} subtitle="From odometer deltas" icon="route" tone="navy" />
        <FleetKpi title="Total fuel cost" value={`₹${totalCost.toLocaleString()}`} subtitle={`${totalLiters.toFixed(0)} litres consumed`} icon="receipt_long" tone="gold" />
      </div>

      <div className="fleet-chart-grid">
        {/* Cost per km Chart */}
        <section className="fleet-card">
          <div className="fleet-section-heading">
            <div><h2>Cost per km by vehicle</h2><p>Lower is better</p></div>
          </div>
          <div className="fleet-chart-body">
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" vertical={false} />
                  <XAxis dataKey="plate_number" tick={{ fontSize: 11, fill: '#697383' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#697383' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f6f6f4' }} formatter={(value) => [`₹${value}`, 'Cost/km']} />
                  <Bar dataKey="cost_per_km" fill="#12376c" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" vertical={false} />
                  <XAxis dataKey="plate_number" tick={{ fontSize: 11, fill: '#697383' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#697383' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Cost/km']} />
                  <Line type="monotone" dataKey="cost_per_km" stroke="#12376c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="cost_per_km"
                    nameKey="plate_number"
                    cx="50%" cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value}`, 'Cost/km']} />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Mileage Chart */}
        <section className="fleet-card">
          <div className="fleet-section-heading">
            <div><h2>Mileage by vehicle</h2><p>Kilometres per litre, higher is better</p></div>
            
            {/* THE TOGGLE BUTTONS */}
            <div style={{ display: 'flex', gap: '4px', background: '#f0f0ee', padding: '3px', borderRadius: '6px' }}>
              <button 
                onClick={() => setChartType('bar')}
                style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', background: chartType === 'bar' ? '#fff' : 'transparent', boxShadow: chartType === 'bar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: chartType === 'bar' ? '#001b44' : '#697383' }}
              >
                Bar
              </button>
              <button 
                onClick={() => setChartType('line')}
                style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', background: chartType === 'line' ? '#fff' : 'transparent', boxShadow: chartType === 'line' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: chartType === 'line' ? '#001b44' : '#697383' }}
              >
                Line
              </button>
              <button 
                onClick={() => setChartType('pie')}
                style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', background: chartType === 'pie' ? '#fff' : 'transparent', boxShadow: chartType === 'pie' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: chartType === 'pie' ? '#001b44' : '#697383' }}
              >
                Pie
              </button>
            </div>
          </div>
          <div className="fleet-chart-body">
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'bar' ? (
                <BarChart data={rows.filter((r) => r.km_per_liter !== null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" vertical={false} />
                  <XAxis dataKey="plate_number" tick={{ fontSize: 11, fill: '#697383' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#697383' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f6f6f4' }} formatter={(value) => [`${value} km/L`, 'Mileage']} />
                  <Bar dataKey="km_per_liter" fill="#35bb86" radius={[3, 3, 0, 0]} />
                </BarChart>
              ) : chartType === 'line' ? (
                <LineChart data={rows.filter((r) => r.km_per_liter !== null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" vertical={false} />
                  <XAxis dataKey="plate_number" tick={{ fontSize: 11, fill: '#697383' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#697383' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} km/L`, 'Mileage']} />
                  <Line type="monotone" dataKey="km_per_liter" stroke="#35bb86" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              ) : (
                <PieChart>
                  <Pie
                    data={rows.filter((r) => r.km_per_liter !== null)}
                    dataKey="km_per_liter"
                    nameKey="plate_number"
                    cx="50%" cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {rows.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} km/L`, 'Mileage']} />
                  <Legend />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Table code remains exactly the same */}
      <section className="fleet-card">
        <div className="fleet-section-heading">
          <div><h2>Per-vehicle breakdown</h2><p>Distance, fuel use and efficiency for each unit</p></div>
          <span className="fleet-count">{rows.length}</span>
        </div>
        <div className="fleet-table-scroll">
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Distance</th>
                <th>Litres</th>
                <th>Fuel cost</th>
                <th>₹ / km</th>
                <th>km / L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.vehicle_id}>
                  <td>
                    <span className="fleet-cell-strong">{r.plate_number}</span>
                    <span className="fleet-cell-sub">{r.make} {r.model}</span>
                  </td>
                  <td>{r.distance_km.toLocaleString()} km</td>
                  <td>{r.total_liters.toFixed(1)} L</td>
                  <td>₹{r.total_cost.toLocaleString()}</td>
                  <td className="fleet-cell-strong">{r.cost_per_km ? `₹${r.cost_per_km}` : '—'}</td>
                  <td className="fleet-cell-strong">{r.km_per_liter ? r.km_per_liter : '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="fleet-empty-row" colSpan="6">No data yet. Add fuel logs first.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  )
}