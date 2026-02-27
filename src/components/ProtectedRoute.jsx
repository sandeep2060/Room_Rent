import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, allowedRole }) {
    const { session, profile, loading } = useAuth()

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-solid)', color: 'var(--text)' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--accent-dim)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ fontWeight: '500', letterSpacing: '0.5px' }}>Loading Nest...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-solid)', color: 'var(--text)' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--accent-dim)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ fontWeight: '500', letterSpacing: '0.5px' }}>Verifying Profile...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    // Logged in, profile loaded, but role doesn't match -> go home or to correct dashboard
    if (allowedRole && profile.role !== allowedRole) {
        return <Navigate to={`/dashboard-${profile.role}`} replace />
    }

    return children
}
