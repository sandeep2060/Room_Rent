import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'
import FeedbackPopup from '../components/FeedbackPopup'
import HouseLoader from '../components/HouseLoader'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const [validationErrors, setValidationErrors] = useState({
        password: '',
        confirmPassword: ''
    })
    const navigate = useNavigate()

    const validateFields = (p, cp) => {
        const errors = { password: '', confirmPassword: '' }
        if (p && p.length < 6) {
            errors.password = 'Password must be at least 6 characters'
        }
        if (cp && cp !== p) {
            errors.confirmPassword = 'Passwords do not match'
        }
        setValidationErrors(errors)
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setFeedback({ type: 'warning', message: 'Passwords do not match!' })
            return
        }

        if (password.length < 6) {
            setFeedback({ type: 'error', message: 'Password must be at least 6 characters' })
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
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    validateFields(e.target.value, confirmPassword)
                                }}
                                style={{ paddingRight: '3.5rem' }}
                                className={validationErrors.password ? 'input-error' : ''}
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
                        {validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
                    </div>
                    <div className="field field-full">
                        <label>Confirm New Password</label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
                                    validateFields(password, e.target.value)
                                }}
                                style={{ paddingRight: '3.5rem' }}
                                className={validationErrors.confirmPassword ? 'input-error' : ''}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex="-1"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {validationErrors.confirmPassword && <span className="error-text">{validationErrors.confirmPassword}</span>}
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
