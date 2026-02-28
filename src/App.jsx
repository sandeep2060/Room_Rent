import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DashboardSeeker from './pages/DashboardSeeker'
import DashboardProvider from './pages/DashboardProvider'
import ResetPassword from './pages/ResetPassword'
import PaymentRequired from './pages/PaymentRequired'
import PrivacyPolicy from './pages/PrivacyPolicy'
import AdminLogin from './pages/AdminLogin'
import DashboardOwner from './pages/DashboardOwner'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<><Navbar /><main><Home /></main><Footer /></>} />
        <Route path="/login" element={<><Navbar /><main><Login /></main><Footer /></>} />
        <Route path="/signup" element={<><Navbar /><main><Signup /></main><Footer /></>} />
        <Route path="/reset-password" element={<><Navbar /><main><ResetPassword /></main><Footer /></>} />
        <Route path="/payment-required" element={<PaymentRequired />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/admin-login" element={<AdminLogin />} />

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
        {/* Owner Dashboard Routes */}
        <Route
          path="/dashboard-owner/*"
          element={
            <ProtectedRoute allowedRole="owner">
              <DashboardOwner />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}
