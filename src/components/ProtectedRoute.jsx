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

    // Logged in, profile loaded, but role doesn't match -> go to respective dashboard
    if (allowedRole && profile.role !== allowedRole) {
        if (profile.role === 'owner') return <Navigate to="/dashboard-owner" replace />
        return <Navigate to={`/dashboard-${profile.role}`} replace />
    }

    // Account deactivated due to overdue payments
    // Admins/Owners are never deactivated by this logic
    if (profile.role !== 'owner' && !profile.is_account_active) {
        return <Navigate to="/payment-required" replace />
    }

    return children
}
