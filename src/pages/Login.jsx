import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'
import FeedbackPopup from '../components/FeedbackPopup'
import HouseLoader from '../components/HouseLoader'

export default function Login() {
    const [searchParams] = useSearchParams()
    const initialRole = searchParams.get('role') || 'seeker'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState(initialRole)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState(null) // { type, message }
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                if (signInError.message.includes('Invalid login credentials')) {
                    throw new Error('Incorrect email or password. Please try again.')
                } else if (signInError.message.includes('Email not confirmed')) {
                    throw new Error('Please confirm your email address before logging in.')
                }
                throw signInError
            }

            // Get profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single()

            if (profileError) throw profileError

            if (profile.role !== role) {
                throw new Error(`This account is not registered as a ${role === 'seeker' ? 'Room needy user' : 'Room provider user'}.`)
            }

            // Success
            setFeedback({ type: 'success', message: 'Successfully Logged In!' })

            setTimeout(() => {
                if (role === 'provider') {
                    navigate('/dashboard-provider')
                } else {
                    navigate('/dashboard-seeker')
                }
            }, 1500)
        } catch (err) {
            setFeedback({ type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Login to RoomRent Nepal"
            subtitle="Choose your account type and login to your dashboard."
        >
            <form className={`auth-form role-${role}`} onSubmit={handleSubmit}>
                <div className="auth-grid">
                    <div className="field field-full">
                        <label>Account type</label>
                        <div className="role-toggle-buttons">
                            <button
                                type="button"
                                className={
                                    role === 'seeker' ? 'role-toggle-btn active' : 'role-toggle-btn'
                                }
                                onClick={() => setRole('seeker')}
                            >
                                Room needy user
                            </button>
                            <button
                                type="button"
                                className={
                                    role === 'provider'
                                        ? 'role-toggle-btn active'
                                        : 'role-toggle-btn'
                                }
                                onClick={() => setRole('provider')}
                            >
                                Room provider user
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div className="field field-full">
                            <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>
                        </div>
                    )}
                    <div className="field field-full">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="field field-full">
                        <label>Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>
                <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            {loading && <HouseLoader message="Verifying your digital keys..." />}
            {feedback && (
                <FeedbackPopup
                    type={feedback.type}
                    message={feedback.message}
                    onClose={() => setFeedback(null)}
                />
            )}
        </AuthLayout>
    )
}
