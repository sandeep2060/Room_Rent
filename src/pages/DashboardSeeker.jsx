import { useState, useEffect } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { Search, MapPin, Heart, Calendar, MessageSquare, User, Settings, LogOut, Check, X, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Messages from '../components/Messages'
import ProfileSettings from '../components/ProfileSettings'
import RoomDetailsModal from '../components/RoomDetailsModal'
import FeedbackPopup from '../components/FeedbackPopup'
import HouseLoader from '../components/HouseLoader'

function SeekerOverview() {
    const { profile } = useAuth()
    const [recommendedRooms, setRecommendedRooms] = useState([])
    const [savedRoomIds, setSavedRoomIds] = useState(new Set())
    const [loading, setLoading] = useState(true)
    const [feedback, setFeedback] = useState(null)

    // Search & Filter States
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all') // all, monthly, daily, nightly
    const [genderFilter, setGenderFilter] = useState(profile?.gender || 'all')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')

    // Selected room for popup details
    const [selectedRoom, setSelectedRoom] = useState(null)

    // Re-fetch rooms when filters or profile changes
    useEffect(() => {
        if (profile) {
            fetchRecommendations()
            fetchSavedRoomIds()

            // Handle incoming search from home page
            const incomingSearch = new URLSearchParams(window.location.search).get('search')
            if (incomingSearch && !searchTerm) {
                setSearchTerm(incomingSearch)
            }
        }
    }, [profile, categoryFilter, genderFilter, minPrice, maxPrice])

    async function fetchSavedRoomIds() {
        try {
            const { data, error } = await supabase
                .from('saved_rooms')
                .select('room_id')
                .eq('user_id', profile.id)
            if (error) throw error
            setSavedRoomIds(new Set(data.map(item => item.room_id)))
        } catch (error) {
            console.error('Error fetching saved room IDs', error)
        }
    }

    async function fetchRecommendations() {
        try {
            setLoading(true)
            let query = supabase
                .from('rooms')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            // 1. Text Search (Location or Title)
            if (searchTerm) {
                // Supabase doesn't easily do OR ilike without or(), 
                // Using address as primary text search for location
                query = query.ilike('address', `%${searchTerm}%`)
            } else if (profile?.location && !searchTerm) {
                // Fallback to profile preferred location if no strict search is active
                query = query.ilike('address', `%${profile.location}%`)
            }

            // 2. Category Filter
            if (categoryFilter !== 'all') {
                query = query.eq('rent_category', categoryFilter)
            }

            // 3. Gender Filter
            if (genderFilter === 'boy') {
                query = query.in('gender_preference', ['all', 'boy'])
            } else if (genderFilter === 'girl') {
                query = query.in('gender_preference', ['all', 'girl'])
            } else if (profile?.gender === 'boy' && genderFilter === 'all') {
                query = query.in('gender_preference', ['all', 'boy']) // strict fallback
            } else if (profile?.gender === 'girl' && genderFilter === 'all') {
                query = query.in('gender_preference', ['all', 'girl'])
            }

            // 4. Price Filter
            if (minPrice && !isNaN(minPrice)) {
                query = query.gte('price_nrs', parseInt(minPrice))
            }
            if (maxPrice && !isNaN(maxPrice)) {
                query = query.lte('price_nrs', parseInt(maxPrice))
            }

            const { data, error } = await query

            if (error) throw error

            setRecommendedRooms(data || [])

        } catch (error) {
            console.error('Error fetching recommendations', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleBookRoom(roomId, duration) {
        if (!window.confirm(`Request to book this room for ${duration} ${recommendedRooms.find(r => r.id === roomId)?.rent_category === 'monthly' ? 'months' : recommendedRooms.find(r => r.id === roomId)?.rent_category === 'daily' ? 'days' : 'hours'}?`)) return;
        try {
            // Check if already booked
            const { data: existing, error: checkError } = await supabase
                .from('bookings')
                .select('id')
                .eq('room_id', roomId)
                .eq('seeker_id', profile.id)
                .in('status', ['pending', 'accepted'])
                .single()

            if (existing) {
                setFeedback({ type: 'warning', message: 'Active request already exists!' })
                return
            }

            // Retrieve room price/provider
            const room = recommendedRooms.find(r => r.id === roomId)

            const { error } = await supabase.from('bookings').insert([{
                room_id: roomId,
                seeker_id: profile.id,
                provider_id: room.provider_id,
                start_date: new Date().toISOString().split('T')[0], // Today as placeholder
                status: 'pending',
                stay_duration: duration,
                total_price_nrs: room.price_nrs * duration
            }])

            if (error) throw error
            setFeedback({ type: 'success', message: 'Room Booked Successfully!' })
        } catch (error) {
            console.error('Error booking room', error)
            setFeedback({ type: 'error', message: 'Booking Failed.' })
        }
    }

    async function toggleSaveRoom(roomId) {
        try {
            if (savedRoomIds.has(roomId)) {
                const { error } = await supabase
                    .from('saved_rooms')
                    .delete()
                    .eq('user_id', profile.id)
                    .eq('room_id', roomId)
                if (error) throw error
                setSavedRoomIds(prev => {
                    const next = new Set(prev)
                    next.delete(roomId)
                    return next
                })
            } else {
                const { error } = await supabase
                    .from('saved_rooms')
                    .insert([{ user_id: profile.id, room_id: roomId }])
                if (error) throw error
                setSavedRoomIds(prev => new Set(prev).add(roomId))
            }
        } catch (error) {
            console.error('Error toggling save', error)
        }
    }

    async function handleCancelBooking(bookingId) {
        if (!window.confirm('Are you sure you want to cancel this booking request?')) return;
        try {
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId)
                .eq('status', 'pending') // Double check status

            if (error) throw error
            setFeedback({ type: 'success', message: 'Request Cancelled' })
            fetchRecommendations() // Refresh if needed, though usually bookings are in separate tab
        } catch (error) {
            console.error('Error cancelling booking', error)
            setFeedback({ type: 'error', message: 'Cancellation Failed' })
        }
    }

    return (
        <div>
            <h1 className="dashboard-title">Welcome back, {profile?.name || 'Seeker'}</h1>
            <p className="dashboard-subtitle">Find your perfect room with advanced filtering.</p>

            {/* Advanced Filters */}
            <div className="dashboard-card" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--dash-surface)' }}>

                {/* Search Bar */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--dash-bg)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--dash-border)' }}>
                    <Search size={20} color="var(--dash-text-muted)" />
                    <input
                        type="text"
                        placeholder="Search by location (e.g. Kathmandu, Patan)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', flex: 1, padding: '0.5rem', color: 'var(--dash-text)', outline: 'none' }}
                    />
                </div>

                {/* Filter Controls Row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={18} color="var(--dash-text-muted)" />
                        <span style={{ fontSize: '0.9rem', color: 'var(--dash-text-muted)', fontWeight: 'bold' }}>Filters:</span>
                    </div>

                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', fontSize: '0.85rem' }}>
                        <option value="all">All Room Types</option>
                        <option value="monthly">Monthly Rent</option>
                        <option value="daily">Daily Rent</option>
                        <option value="nightly">Nightly Stay</option>
                    </select>

                    <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', fontSize: '0.85rem' }}>
                        <option value="all">All Genders Acceptable</option>
                        <option value="boy">Boys Only</option>
                        <option value="girl">Girls Only</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>Price Nrs:</span>
                        <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', fontSize: '0.85rem' }} />
                        <span>-</span>
                        <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', fontSize: '0.85rem' }} />
                    </div>
                </div>
            </div>

            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Matched Rooms ({recommendedRooms.length})</h2>

            {loading ? (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HouseLoader message="Finding your perfect match..." showPercentage={false} />
                </div>
            ) : recommendedRooms.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--dash-surface)', borderRadius: '12px', border: '1px solid var(--dash-border)' }}>
                    <Search size={48} color="var(--dash-text-muted)" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem' }}>No matching rooms</h3>
                    <p style={{ color: 'var(--dash-text-muted)', margin: 0 }}>Try adjusting your filters or search term to find more results.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {recommendedRooms.map(room => (
                        <div
                            key={room.id}
                            className="dashboard-card"
                            style={{ padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer', transition: 'transform 0.2s' }}
                            onClick={() => setSelectedRoom(room)}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSaveRoom(room.id);
                                }}
                                style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    background: savedRoomIds.has(room.id) ? 'var(--accent)' : 'rgba(15,23,42,0.6)',
                                    borderRadius: '50%', padding: '0.4rem',
                                    color: 'white', zIndex: 10, backdropFilter: 'blur(4px)',
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <Heart size={20} fill={savedRoomIds.has(room.id) ? 'white' : 'none'} />
                            </div>
                            <img src={room.images?.[0] || 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&q=80'} alt="Room" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            <div style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.title}</h3>
                                </div>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    <MapPin size={14} flexShrink={0} /> {room.address}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ color: 'var(--accent)', fontWeight: 'bold', margin: 0, fontSize: '1.1rem' }}>
                                        Nrs {room.price_nrs}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', fontWeight: 'normal' }}>
                                            /{room.rent_category === 'monthly' ? 'month' : room.rent_category === 'daily' ? 'day' : 'night'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Room Details Overlay */}
            {selectedRoom && (
                <RoomDetailsModal
                    room={selectedRoom}
                    onClose={() => setSelectedRoom(null)}
                    onRequestBook={handleBookRoom}
                />
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


function SeekerSaved() {
    const { profile } = useAuth()
    const [savedRooms, setSavedRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedRoom, setSelectedRoom] = useState(null)

    useEffect(() => {
        if (profile) fetchSavedRooms()
    }, [profile])

    async function fetchSavedRooms() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('saved_rooms')
                .select(`
                    id,
                    rooms (*)
                `)
                .eq('user_id', profile.id)

            if (error) throw error
            setSavedRooms(data.map(item => item.rooms) || [])
        } catch (error) {
            console.error('Error fetching saved rooms', error)
        } finally {
            setLoading(false)
        }
    }

    // Reuse overview logic if needed or define locally
    async function handleBookRoomLocal(roomId, duration) {
        if (!window.confirm('Request to book this room?')) return;
        try {
            const room = savedRooms.find(r => r.id === roomId)
            const { error } = await supabase.from('bookings').insert([{
                room_id: roomId,
                seeker_id: profile.id,
                provider_id: room.provider_id,
                start_date: new Date().toISOString().split('T')[0],
                status: 'pending',
                stay_duration: duration,
                total_price_nrs: room.price_nrs * duration
            }])
            if (error) throw error
            alert('Booking request sent!')
        } catch (error) {
            console.error('Error booking', error)
            alert('Fails to book.')
        }
    }

    return (
        <div>
            <h1 className="dashboard-title">Saved Rooms</h1>
            <p className="dashboard-subtitle">Your curated list of properties.</p>

            {loading ? (
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HouseLoader message="Fetching your wishlist..." showPercentage={false} />
                </div>
            ) : savedRooms.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--dash-surface)', borderRadius: '12px', marginTop: '2rem' }}>
                    <Heart size={48} color="var(--dash-text-muted)" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem' }}>No saved rooms</h3>
                    <p style={{ color: 'var(--dash-text-muted)' }}>Tap the heart on any room to save it for later.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                    {savedRooms.map(room => (
                        <div
                            key={room.id}
                            className="dashboard-card"
                            style={{ padding: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                            onClick={() => setSelectedRoom(room)}
                        >
                            <img src={room.images?.[0] || 'https://images.unsplash.com/photo-1520256862855-398228c41684?w=600&q=80'} alt="Room" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            <div style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{room.title}</h3>
                                </div>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={14} /> {room.address}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ color: 'var(--accent)', fontWeight: 'bold', margin: 0, fontSize: '1.1rem' }}>
                                        Nrs {room.price_nrs}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', fontWeight: 'normal' }}>
                                            /{room.rent_category === 'monthly' ? 'month' : room.rent_category === 'daily' ? 'day' : 'night'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedRoom && (
                <RoomDetailsModal
                    room={selectedRoom}
                    onClose={() => setSelectedRoom(null)}
                    onRequestBook={handleBookRoomLocal}
                />
            )}
        </div>
    )
}

function SeekerBookings() {
    const { profile } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (profile) fetchBookings()
    }, [profile])

    async function fetchBookings() {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, start_date, end_date, status, total_price_nrs,
                    rooms ( title, address, images )
                `)
                .eq('seeker_id', profile.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setBookings(data || [])
        } catch (error) {
            console.error('Error fetching bookings', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h1 className="dashboard-title">My Bookings</h1>
            <p className="dashboard-subtitle">Manage your requests and upcoming stays.</p>

            <div className="dashboard-card" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {loading ? (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HouseLoader message="Checking your bookings..." showPercentage={false} />
                    </div>
                ) : bookings.length === 0 ? (
                    <p style={{ color: 'var(--dash-text-muted)' }}>You haven't made any booking requests yet.</p>
                ) : (
                    bookings.map(booking => (
                        <div key={booking.id} style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingBottom: '1.5rem', borderBottom: '1px solid var(--dash-border)' }}>
                            <img src={booking.rooms?.images?.[0] || 'https://images.unsplash.com/photo-1520256862855-398228c41684?w=400&q=80'} alt="booked" style={{ width: '120px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            background: booking.status === 'accepted' ? 'rgba(52, 211, 153, 0.2)' : booking.status === 'declined' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 209, 102, 0.2)',
                                            color: booking.status === 'accepted' ? '#34d399' : booking.status === 'declined' ? '#ef4444' : '#ffd166',
                                            fontSize: '0.75rem', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase'
                                        }}>
                                            {booking.status}
                                        </span>
                                        <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>{booking.rooms?.title}</h3>
                                        <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.9rem', margin: 0 }}>{booking.rooms?.address}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>Nrs {booking.total_price_nrs}</p>
                                        {booking.status === 'pending' && (
                                            <button
                                                onClick={() => {
                                                    handleCancelBooking(booking.id).then(() => fetchBookings());
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid #ef4444',
                                                    color: '#ef4444',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    cursor: 'pointer',
                                                    marginTop: '0.5rem'
                                                }}
                                            >
                                                Cancel Request
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={14} /> {booking.start_date}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

function SeekerMessages() {
    return (
        <div>
            <h1 className="dashboard-title">Messages</h1>
            <p className="dashboard-subtitle">Chat securely with room providers across Nepal.</p>
            <div style={{ marginTop: '2rem' }}>
                <Messages />
            </div>
        </div>
    )
}

export default function DashboardSeeker() {
    return (
        <DashboardLayout role="seeker">
            <Routes>
                <Route index element={<SeekerOverview />} />
                <Route path="bookings" element={<SeekerBookings />} />
                <Route path="saved" element={<SeekerSaved />} />
                <Route path="messages" element={<SeekerMessages />} />
                <Route path="profile" element={<ProfileSettings />} />
            </Routes>
        </DashboardLayout>
    )
}
