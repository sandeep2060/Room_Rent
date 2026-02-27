import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { TrendingUp, Users, Home, Calendar as CalendarIcon, Edit3, Trash2, Mail, CheckCircle, XCircle } from 'lucide-react'
import ProviderAddListing from './ProviderAddListing'
import ProviderEditListing from './ProviderEditListing'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import DashboardLayout from '../components/DashboardLayout'
import RoomDetailsModal from '../components/RoomDetailsModal'
import Messages from '../components/Messages'
import ProfileSettings from '../components/ProfileSettings'
import FeedbackPopup from '../components/FeedbackPopup'

function ProviderAnalytics() {
    const { profile } = useAuth()
    const [bookings, setBookings] = useState([])
    const [stats, setStats] = useState({ requests: 0, guests: 0, activeRooms: 0 })
    const [loading, setLoading] = useState(true)
    const [feedback, setFeedback] = useState(null)

    useEffect(() => {
        if (profile?.id) fetchDashboardData()
    }, [profile])

    async function fetchDashboardData() {
        try {
            // 1. Fetch active rooms count
            const { count: activeRooms } = await supabase
                .from('rooms')
                .select('*', { count: 'exact', head: true })
                .eq('provider_id', profile.id)
                .eq('is_active', true)

            // 2. Fetch bookings with related room and seeker info
            const { data: bookingsData, error } = await supabase
                .from('bookings')
                .select(`
                    id, start_date, status, total_price_nrs, stay_duration,
                    rooms ( title, rent_category ),
                    seeker:profiles!bookings_seeker_id_fkey ( name )
                `)
                .eq('provider_id', profile.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            const validBookings = bookingsData || []
            setBookings(validBookings)

            // Basic stats calculation
            const accepted = validBookings.filter(b => b.status === 'accepted')
            const earned = accepted.reduce((sum, b) => sum + (b.total_price_nrs || 0), 0)
            const guests = new Set(accepted.map(b => b.seeker?.name)).size

            setStats({ requests: validBookings.length, guests, activeRooms: activeRooms || 0 })
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function updateBookingStatus(bookingId, newStatus) {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', bookingId)

            if (error) throw error

            // Update local state
            setBookings(bookings.map(b =>
                b.id === bookingId ? { ...b, status: newStatus } : b
            ))
            setFeedback({ type: 'success', message: `Booking ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}` })
        } catch (error) {
            console.error(`Error marking booking as ${newStatus}:`, error)
            setFeedback({ type: 'error', message: 'Failed to update booking status.' })
        }
    }

    return (
        <div>
            <h1 className="dashboard-title">Dashboard Overview</h1>
            <p className="dashboard-subtitle">Monitor your homestay performance.</p>

            <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--accent-dim)', borderRadius: '50%', color: 'var(--accent)' }}>
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--dash-text-muted)', fontSize: '0.9rem' }}>Total Requests</p>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{stats.requests}</h2>
                    </div>
                </div>

                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '50%', color: 'var(--accent2)' }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--dash-text-muted)', fontSize: '0.9rem' }}>Total Unique Guests</p>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{stats.guests}</h2>
                    </div>
                </div>

                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255, 209, 102, 0.15)', borderRadius: '50%', color: 'var(--accent3)' }}>
                        <Home size={32} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--dash-text-muted)', fontSize: '0.9rem' }}>Active Listings</p>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{stats.activeRooms}</h2>
                    </div>
                </div>
            </div>

            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recent Booking Requests</h2>
            <div className="dashboard-card" style={{ padding: '0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--dash-border)' }}>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Guest</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Dates</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Room</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center' }}>Loading requests...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--dash-text-muted)' }}>No booking requests yet.</td></tr>
                        ) : (
                            bookings.map((booking) => (
                                <tr key={booking.id} style={{ borderBottom: '1px solid var(--dash-border)' }}>
                                    <td style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--dash-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {booking.seeker?.name ? booking.seeker.name.charAt(0).toUpperCase() : 'S'}
                                        </div>
                                        <span>{booking.seeker?.name || 'Unknown Seeker'}</span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                                        {booking.start_date}
                                        <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-muted)', marginTop: '0.25rem' }}>
                                            Duration: {booking.stay_duration || 1} {booking.rooms?.rent_category === 'monthly' ? 'Months' : booking.rooms?.rent_category === 'daily' ? 'Days' : 'Hours'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>{booking.rooms?.title}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            background: booking.status === 'accepted' ? 'rgba(52, 211, 153, 0.2)' : booking.status === 'declined' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 209, 102, 0.2)',
                                            color: booking.status === 'accepted' ? '#34d399' : booking.status === 'declined' ? '#ef4444' : '#ffd166',
                                            fontSize: '0.75rem', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase'
                                        }}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {booking.status === 'pending' && (
                                            <>
                                                <button onClick={() => updateBookingStatus(booking.id, 'accepted')} style={{ background: 'var(--accent)', color: 'var(--dash-bg)', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.8rem' }}>Accept</button>
                                                <button onClick={() => updateBookingStatus(booking.id, 'declined')} style={{ background: 'transparent', color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)', padding: '0.4rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Decline</button>
                                            </>
                                        )}
                                        {booking.status !== 'pending' && (
                                            <span style={{ fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>Actioned</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {feedback && (
                <FeedbackPopup
                    type={feedback.type}
                    message={feedback.message}
                    onClose={() => setFeedback(null)}
                />
            )}
        </div>
    )
}

function ProviderListings() {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [feedback, setFeedback] = useState(null)

    useEffect(() => {
        if (profile?.id) fetchListings()
    }, [profile])

    async function fetchListings() {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('provider_id', profile.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setListings(data || [])
        } catch (error) {
            console.error('Error fetching listings:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(roomId) {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;
        try {
            const { error } = await supabase.from('rooms').delete().eq('id', roomId)
            if (error) throw error
            setListings(listings.filter(l => l.id !== roomId))
            setFeedback({ type: 'success', message: 'Listing deleted successfully!' })
        } catch (error) {
            console.error('Error deleting listing:', error)
            setFeedback({ type: 'error', message: 'Failed to delete listing.' })
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="dashboard-title">My Listings</h1>
                    <p className="dashboard-subtitle">Manage your properties and active rooms.</p>
                </div>
                <button
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                    onClick={() => navigate('/dashboard-provider/add')}
                >
                    <Home size={18} /> Add New Listing
                </button>
            </div>

            {loading ? (
                <p>Loading your listings...</p>
            ) : listings.length === 0 ? (
                <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--dash-text-muted)' }}>
                    <Home size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>You haven't added any rooms yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    {listings.map(room => (
                        <div key={room.id} className="dashboard-card" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', alignItems: 'center' }}>
                            <img src={room.images?.[0] || 'https://images.unsplash.com/photo-1520256862855-398228c41684?w=400&q=80'} alt="Room" style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem' }}>{room.title}</h3>
                                        <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.9rem', margin: 0 }}>{room.address}</p>
                                    </div>
                                    <span style={{ padding: '0.25rem 0.5rem', background: room.is_active ? 'rgba(52, 211, 153, 0.2)' : 'rgba(148, 163, 184, 0.2)', color: room.is_active ? '#34d399' : '#9ca3af', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                        {room.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.5rem' }}>
                                    <p style={{ color: 'var(--accent)', fontWeight: 'bold', margin: 0, fontSize: '1.1rem' }}>Nrs {room.price_nrs} <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', fontWeight: 'normal' }}>/{room.rent_category === 'monthly' ? 'month' : room.rent_category === 'daily' ? 'day' : 'night'}</span></p>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button onClick={() => navigate(`/dashboard-provider/edit/${room.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: '1px solid var(--dash-border)', padding: '0.4rem 0.75rem', color: 'var(--dash-text)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}><Edit3 size={14} /> Edit</button>
                                        <button onClick={() => handleDelete(room.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid transparent', padding: '0.4rem 0.75rem', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}><Trash2 size={14} /> Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {feedback && (
                <FeedbackPopup
                    type={feedback.type}
                    message={feedback.message}
                    onClose={() => setFeedback(null)}
                />
            )}
        </div>
    )
}

function ProviderCalendar() {
    return (
        <div>
            <h1 className="dashboard-title">Calendar & Availability</h1>
            <p className="dashboard-subtitle">A calendar view to manage upcoming reservations.</p>
            <div className="dashboard-card" style={{ marginTop: '2rem', height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text-muted)' }}>
                <CalendarIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                Calendar integration mock placeholder.
            </div>
        </div>
    )
}

function ProviderMessages() {
    return (
        <div>
            <h1 className="dashboard-title">Inbox</h1>
            <p className="dashboard-subtitle">Communicate securely with your guests.</p>
            <div style={{ marginTop: '2rem' }}>
                <Messages />
            </div>
        </div>
    )
}


export default function DashboardProvider() {
    return (
        <DashboardLayout role="provider">
            <Routes>
                <Route index element={<ProviderAnalytics />} />
                <Route path="listings" element={<ProviderListings />} />
                <Route path="add" element={<ProviderAddListing />} />
                <Route path="edit/:roomId" element={<ProviderEditListing />} />
                <Route path="calendar" element={<ProviderCalendar />} />
                <Route path="messages" element={<ProviderMessages />} />
                <Route path="profile" element={<ProfileSettings />} />
            </Routes>
        </DashboardLayout>
    )
}
