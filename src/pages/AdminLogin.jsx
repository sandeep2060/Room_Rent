import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import FeedbackPopup from '../components/FeedbackPopup'
import HouseLoader from '../components/HouseLoader'

export default function AdminLogin() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (form.email !== 'sandeepgaire8@gmail.com') {
            setFeedback({ type: 'error', message: 'Unauthorized: This login is for administrators only.' })
            return
        }

        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            })

            if (error) throw error

            // Verify role is owner
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            if (profileError || profile?.role !== 'owner') {
                await supabase.auth.signOut()
                throw new Error('Access Denied: You do not have owner permissions.')
            }

            setFeedback({ type: 'success', message: 'Welcome back, Admin!' })
            setTimeout(() => navigate('/dashboard-owner'), 1500)
        } catch (err) {
            setFeedback({ type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout
            title="Administrator Portal"
            subtitle="Secure access for RoomRent Nepal Owner."
        >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    width: '60px', height: '60px',
                    background: 'rgba(96, 187, 70, 0.1)',
                    color: '#60bb46',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                }}>
                    <ShieldCheck size={32} />
                </div>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="field">
                    <label>Admin Email</label>
                    <div style={{ position: 'relative' }}>
                        <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--dash-text-muted)' }} size={18} />
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            style={{ paddingLeft: '3rem' }}
                            placeholder="sandeepgaire8@gmail.com"
                        />
                    </div>
                </div>

                <div className="field">
                    <label>Master Password</label>
                    <div style={{ position: 'relative' }}>
                        <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--dash-text-muted)' }} size={18} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            style={{ paddingLeft: '3rem', paddingRight: '3.5rem' }}
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn-primary auth-submit" disabled={loading} style={{ width: '100%', padding: '1rem', marginTop: '1rem' }}>
                    {loading ? 'Authenticating...' : 'Enter Admin Control'}
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Back to Public Site</Link>
                </div>
            </form>

            {loading && <HouseLoader message="Verifying administrative keys..." />}
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
