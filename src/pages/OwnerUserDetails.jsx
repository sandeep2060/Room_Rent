import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar,
    Home, CreditCard, ShieldCheck, AlertCircle, History, Clock
} from 'lucide-react'
import HouseLoader from '../components/HouseLoader'
import RoomImageCarousel from '../components/RoomImageCarousel'

export default function OwnerUserDetails() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [bookings, setBookings] = useState([])
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUserDetails()
    }, [userId])

    async function fetchUserDetails() {
        try {
            setLoading(true)
            // 1. Profile
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
            setUser(profile)

            // 2. Bookings (as seeker OR provider)
            const { data: bookingData } = await supabase
                .from('bookings')
                .select(`
                    *,
                    rooms ( title, images, provider_id ),
                    seeker:profiles!bookings_seeker_id_fkey ( name, email ),
                    provider:profiles!bookings_provider_id_fkey ( name, email )
                `)
                .or(`seeker_id.eq.${userId},provider_id.eq.${userId}`)
                .order('created_at', { ascending: false })

            setBookings(bookingData || [])

            // 3. Payment History
            const { data: paymentData } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            setPayments(paymentData || [])

        } catch (err) {
            console.error('Error fetching user details:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <HouseLoader message="Loading security profile..." />
    if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>User not found.</div>

    return (
        <div className="owner-user-details">
            <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18} /> Back to Directory
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Profile Overview Card */}
                <div className="dashboard-card">
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1.5rem', background: 'var(--dash-surface)', border: '4px solid var(--accent-dim)' }}>
                            {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={50} style={{ marginTop: '20px' }} />}
                        </div>
                        <h2 style={{ margin: 0 }}>{user.name}</h2>
                        <span className={`badge ${user.role === 'provider' ? 'badge-accent' : 'badge-primary'}`} style={{ marginTop: '0.5rem' }}>
                            {user.role?.toUpperCase()}
                        </span>
                    </div>

                    <div className="detail-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="detail-item">
                            <Mail size={18} className="text-accent" />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>Email Address</p>
                                <p style={{ margin: 0 }}>{user.email}</p>
                            </div>
                        </div>
                        <div className="detail-item">
                            <Phone size={18} className="text-accent" />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>Phone Number</p>
                                <p style={{ margin: 0 }}>+977 {user.phone}</p>
                            </div>
                        </div>
                        <div className="detail-item">
                            <MapPin size={18} className="text-accent" />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>Home Address</p>
                                <p style={{ margin: 0 }}>{user.district}, {user.municipality}, Ward {user.ward}</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>{user.address}</p>
                            </div>
                        </div>
                        <div className="detail-item">
                            <Clock size={18} className="text-accent" />
                            <div>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>Member Since</p>
                                <p style={{ margin: 0 }}>{new Date(user.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--dash-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span>Account Status</span>
                            <span style={{ color: user.is_account_active ? '#34d399' : '#ef4444', fontWeight: 'bold' }}>
                                {user.is_account_active ? 'ACTIVATED' : 'DEACTIVATED'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Current Dues</span>
                            <span style={{ color: user.wallet_balance > 0 ? 'var(--accent)' : 'inherit', fontWeight: 'bold' }}>Nrs {user.wallet_balance}</span>
                        </div>
                    </div>
                </div>

                {/* History Tabs Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Booking History */}
                    <div className="dashboard-card" style={{ padding: '0' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--dash-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <History size={20} className="text-accent" />
                            <h3 style={{ margin: 0 }}>Booking & Transaction History</h3>
                        </div>

                        <div className="history-entries" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {bookings.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--dash-text-muted)' }}>No bookings recorded yet.</p>
                            ) : (
                                bookings.map(b => (
                                    <div key={b.id} style={{ padding: '1.5rem', borderBottom: '1px solid var(--dash-border)', display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{ width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden' }}>
                                            <RoomImageCarousel images={b.rooms?.images} showControls={false} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>{b.rooms?.title}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>Booked: {new Date(b.created_at).toLocaleDateString()}</p>
                                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent)' }}>STATUS: {b.status}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem' }}>
                                                {user.role === 'seeker' ? `Owner: ${b.provider?.name}` : `Guest: ${b.seeker?.name}`}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>{user.role === 'seeker' ? b.provider?.email : b.seeker?.email}</p>
                                            <p style={{ margin: '0.25rem 0 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Nrs {b.total_price_nrs}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="dashboard-card" style={{ padding: '0' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--dash-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <CreditCard size={20} className="text-accent" />
                            <h3 style={{ margin: 0 }}>Platform Fee Payments</h3>
                        </div>
                        <div className="payment-entries">
                            {payments.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--dash-text-muted)' }}>No payments recorded.</p>
                            ) : (
                                payments.map(p => (
                                    <div key={p.id} style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--dash-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 'bold' }}>Paid via {p.payment_method}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>{new Date(p.created_at).toLocaleString()}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ margin: 0, fontWeight: 'bold', color: '#34d399' }}>+ Nrs {p.amount}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
