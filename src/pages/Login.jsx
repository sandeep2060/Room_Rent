import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
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
    const [showPassword, setShowPassword] = useState(false)
    const [resetMode, setResetMode] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [emailError, setEmailError] = useState('')
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

    const handleResetRequest = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            if (resetError) throw resetError
            setFeedback({ type: 'success', message: 'Password reset link sent to your email!' })
            setResetMode(false)
        } catch (err) {
            setFeedback({ type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    if (resetMode) {
        return (
            <AuthLayout
                title="Reset your password"
                subtitle="Enter your email address and we'll send you a link to reset your password."
            >
                <form className="auth-form" onSubmit={handleResetRequest}>
                    <div className="auth-grid">
                        <div className="field field-full">
                            <label>Email</label>
                            <input
                                type="email"
                                required
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Sending link...' : 'Send reset link'}
                    </button>
                    <button
                        type="button"
                        className="btn-text"
                        style={{ marginTop: '1rem', width: '100%', color: 'var(--text-muted)' }}
                        onClick={() => setResetMode(false)}
                    >
                        Back to login
                    </button>
                </form>
                {loading && <HouseLoader message="Sending reset instructions..." />}
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
                    <div className="field field-full">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                                if (e.target.value && !emailRegex.test(e.target.value)) {
                                    setEmailError('Please enter a valid email address')
                                } else {
                                    setEmailError('')
                                }
                            }}
                            className={emailError ? 'input-error' : ''}
                        />
                        {emailError && <span className="error-text">{emailError}</span>}
                    </div>
                    <div className="field field-full">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label>Password</label>
                            <button
                                type="button"
                                className="btn-text"
                                style={{ fontSize: '0.8rem', padding: 0 }}
                                onClick={() => setResetMode(true)}
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingRight: '3.5rem' }}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
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
