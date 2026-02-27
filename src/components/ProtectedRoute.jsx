import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import HouseLoader from './HouseLoader'

export default function ProtectedRoute({ children, allowedRole }) {
    const { session, profile, loading } = useAuth()

    if (loading) {
        return <HouseLoader message="Building your personalized nest..." />
    }

    // Not logged in -> go to login
    if (!session) {
        return <Navigate to="/login" replace />
    }

    // Logged in but profile not yet loaded -> wait
    if (!profile) {
        return <HouseLoader message="Verifying your digital keys..." />
    }

    // Logged in, profile loaded, but role doesn't match -> go home or to correct dashboard
    if (allowedRole && profile.role !== allowedRole) {
        return <Navigate to={`/dashboard-${profile.role}`} replace />
    }

    return children
}
