import { useState, useEffect } from 'react'
import { Wallet as WalletIcon, ExternalLink, AlertCircle, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function Wallet() {
    const { profile } = useAuth()
    const [loading, setLoading] = useState(false)
    const [balance, setBalance] = useState(profile?.wallet_balance || 0)

    // Calculate days remaining if debt exists
    const getDaysRemaining = () => {
        if (!profile?.last_payment_date || balance === 0) return null
        const lastPayment = new Date(profile.last_payment_date)
        const deadline = new Date(lastPayment)
        deadline.setDate(deadline.getDate() + 30)

        const now = new Date()
        const diff = deadline - now
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    const daysRemaining = getDaysRemaining()

    const handleMockPayment = async () => {
        if (!window.confirm('Redirecting to eSewa to pay Nrs ' + balance + '? (This is a demo)')) return
        try {
            setLoading(true)
            // Mock successful payment
            const { error } = await supabase
                .from('profiles')
                .update({
                    wallet_balance: 0,
                    last_payment_date: new Date().toISOString(),
                    is_account_active: true
                })
                .eq('id', profile.id)

            if (error) throw error
            setBalance(0)
            alert('Payment Successful! Your dues have been cleared.')
            window.location.reload() // Refresh to update profile across app
        } catch (error) {
            console.error('Payment failed', error)
            alert('Payment failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="dashboard-card" style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '12px' }}>
                    <WalletIcon size={24} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Commission Wallet</h3>
                    <p style={{ margin: 0, color: 'var(--dash-text-muted)', fontSize: '0.85rem' }}>Your platform service dues</p>
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 0', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.2)', borderRadius: '12px' }}>
                <p style={{ margin: '0 0 0.5rem', color: 'var(--dash-text-muted)', fontSize: '0.9rem' }}>Payable Amount</p>
                <h2 style={{ margin: 0, fontSize: '2.5rem', color: balance > 0 ? 'var(--accent)' : 'var(--dash-text)' }}>
                    Nrs {balance}
                </h2>
            </div>

            {balance > 0 && (
                <div style={{
                    padding: '1rem',
                    background: daysRemaining <= 3 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 209, 102, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    borderLeft: `4px solid ${daysRemaining <= 3 ? '#ef4444' : '#ffd166'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                }}>
                    <Clock size={18} color={daysRemaining <= 3 ? '#ef4444' : '#ffd166'} style={{ marginTop: '0.1rem' }} />
                    <div>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: daysRemaining <= 3 ? '#ef4444' : '#ffd166' }}>
                            Payment Overdue in {daysRemaining} Days
                        </p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>
                            Please clear your dues to avoid account deactivation and a 10% penalty.
                        </p>
                    </div>
                </div>
            )}

            <button
                onClick={handleMockPayment}
                disabled={loading || balance === 0}
                style={{
                    width: '100%',
                    padding: '1rem',
                    background: '#60bb46', // eSewa Green
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: balance === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s',
                    opacity: balance === 0 ? 0.6 : 1
                }}
            >
                {loading ? 'Processing...' : (
                    <>
                        Pay via eSewa <ExternalLink size={16} />
                    </>
                )}
            </button>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--dash-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--dash-text-muted)', fontSize: '0.8rem' }}>
                <AlertCircle size={14} />
                <span>Fees are calculated as 2% of booking for seekers and 3% for providers.</span>
            </div>
        </div>
    )
}
