import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import OwnerDashboard from './pages/OwnerDashboard'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DriverDashboard from './pages/DriverDashboard'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Trips from './pages/Trips'
import Maintenance from './pages/Maintenance'
import FuelAnalytics from './pages/FuelAnalytics'

// This decides which dashboard to show based on the user's role
function HomeRouter() {
  const { user, token } = useAuth()
  if (!token) return null
  if (!user) return <div className="p-10 text-center">Loading...</div>
  
  // 1. Driver View
  if (user.role === 'driver') return <DriverDashboard />
  
  // 2. Owner / Viewer View
  if (user.role === 'viewer') return <OwnerDashboard />
  
  // 3. Admin View (Default)
  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute><HomeRouter /></ProtectedRoute>
          } />
          
          <Route path="/vehicles" element={
            <ProtectedRoute><Vehicles /></ProtectedRoute>
          } />
          
          <Route path="/drivers" element={
            <ProtectedRoute><Drivers /></ProtectedRoute>
          } />
          
          <Route path="/trips" element={
            <ProtectedRoute><Trips /></ProtectedRoute>
          } />
          
          <Route path="/maintenance" element={
            <ProtectedRoute><Maintenance /></ProtectedRoute>
          } />
          
          <Route path="/analytics" element={
            <ProtectedRoute><FuelAnalytics /></ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}