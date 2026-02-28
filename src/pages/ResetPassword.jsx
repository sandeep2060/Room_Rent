import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'
import FeedbackPopup from '../components/FeedbackPopup'
import HouseLoader from '../components/HouseLoader'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const navigate = useNavigate()

    const handleUpdatePassword = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setFeedback({ type: 'warning', message: 'Passwords do not match!' })
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setFeedback({ type: 'success', message: 'Password updated successfully! Redirecting to login...' })
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (err) {
            setFeedback({ type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Update your password"
            subtitle="Please enter your new password below."
        >
            <form className="auth-form" onSubmit={handleUpdatePassword}>
                <div className="auth-grid">
                    <div className="field field-full">
                        <label>New Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                    <div className="field field-full">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>
                <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                </button>
            </form>
            {loading && <HouseLoader message="Strengthening your nest's security..." />}
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
