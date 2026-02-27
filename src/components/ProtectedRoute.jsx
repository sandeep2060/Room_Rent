import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRole }) {
    const { session, profile, loading } = useAuth()

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-main)' }}>
                Loading...
            </div>
        )
    }

    // Not logged in -> go to login
    if (!session) {
        return <Navigate to="/login" replace />
    }

    // Logged in but profile not yet loaded -> wait
    if (!profile) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-main)' }}>
                Loading Profile...
            </div>
        )
    }

    // Logged in, profile loaded, but role doesn't match -> go home or to correct dashboard
    if (allowedRole && profile.role !== allowedRole) {
        return <Navigate to={`/dashboard-${profile.role}`} replace />
    }

    return children
}
