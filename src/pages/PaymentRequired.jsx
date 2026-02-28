import { ShieldAlert, CreditCard, ExternalLink, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

export default function PaymentRequired() {
    const { profile, signOut } = useAuth()
    const [loading, setLoading] = useState(false)

    const dues = profile?.wallet_balance || 0
    const penalty = Math.round(dues * 0.1) // 10% penalty
    const totalToPay = dues + penalty

    const handleClearDues = async () => {
        if (!window.confirm(`Clear your total dues of Nrs ${totalToPay} (Dues + 10% Penalty)?`)) return
        try {
            setLoading(true)
            const { error } = await supabase
                .from('profiles')
                .update({
                    wallet_balance: 0,
                    last_payment_date: new Date().toISOString(),
                    is_account_active: true
                })
                .eq('id', profile.id)

            if (error) throw error
            alert('Account Reactivated Successfully!')
            window.location.href = '/' // Redirect to home/dashboard
        } catch (error) {
            console.error('Payment failed', error)
            alert('Payment failed. Please contact support.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--dash-bg)',
            padding: '2rem'
        }}>
            <div className="dashboard-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
                <div style={{
                    width: '80px', height: '80px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <ShieldAlert size={40} />
                </div>

                <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Account Deactivated</h1>
                <p style={{ color: 'var(--dash-text-muted)', marginBottom: '2rem' }}>
                    Your account has been deactivated due to overdue commission payments (more than 30 days).
                    To regain access to your dashboard, please clear your outstanding dues.
                </p>

                <div style={{
                    background: 'rgba(15, 23, 42, 0.3)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span>Service Dues</span>
                        <span>Nrs {dues}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#ef4444' }}>
                        <span>Late Penalty (10%)</span>
                        <span>Nrs {penalty}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '1rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--dash-border)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                    }}>
                        <span>Total Payable</span>
                        <span style={{ color: 'var(--accent)' }}>Nrs {totalToPay}</span>
                    </div>
                </div>

                <button
                    onClick={handleClearDues}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#60bb46',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                    }}
                >
                    <CreditCard size={20} />
                    {loading ? 'Processing...' : 'Pay via eSewa to Activate'}
                    <ExternalLink size={16} />
                </button>

                <button
                    onClick={() => signOut()}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--dash-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        margin: '0 auto',
                        fontSize: '0.9rem'
                    }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    )
}
