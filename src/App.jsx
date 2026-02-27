import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DashboardSeeker from './pages/DashboardSeeker'
import DashboardProvider from './pages/DashboardProvider'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<><Navbar /><main><Home /></main><Footer /></>} />
        <Route path="/login" element={<><Navbar /><main><Login /></main><Footer /></>} />
        <Route path="/signup" element={<><Navbar /><main><Signup /></main><Footer /></>} />

        {/* Seeker Dashboard Routes */}
        <Route
          path="/dashboard-seeker/*"
          element={
            <ProtectedRoute allowedRole="seeker">
              <DashboardSeeker />
            </ProtectedRoute>
          }
        />

        {/* Provider Dashboard Routes */}
        <Route
          path="/dashboard-provider/*"
          element={
            <ProtectedRoute allowedRole="provider">
              <DashboardProvider />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}
