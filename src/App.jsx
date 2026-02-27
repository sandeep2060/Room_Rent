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
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route 
            path="/dashboard-seeker" 
            element={
              <ProtectedRoute allowedRole="seeker">
                <DashboardSeeker />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard-provider" 
            element={
              <ProtectedRoute allowedRole="provider">
                <DashboardProvider />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
