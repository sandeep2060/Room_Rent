import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, Users, Heart, ArrowRight } from 'lucide-react'
import HouseLoader from '../components/HouseLoader'
import RoomImageCarousel from '../components/RoomImageCarousel'
import RoomDetailsModal from '../components/RoomDetailsModal'
import FeedbackPopup from '../components/FeedbackPopup'

const steps = [
    {
        icon: '🔍',
        title: 'Search Nepal',
        desc: 'Filter rooms by city, district and budget across Nepal.',
    },
    {
        icon: '📅',
        title: 'Book Online',
        desc: 'Reserve instantly or send a request to local hosts.',
    },
    {
        icon: '🏔️',
        title: 'Stay & Explore',
        desc: 'Experience local Nepali culture and hospitality.',
    },
]

const testimonials = [
    {
        text: 'Found a cozy room near Pashupatinath in minutes. Perfect for my Kathmandu visit!',
        author: 'Prakash S.',
        role: 'Traveler from Pokhara',
    },
    {
        text: 'I listed my extra room in Lalitpur and started getting bookings from all over Nepal.',
        author: 'Sangita D.',
        role: 'Host in Lalitpur',
    },
]

export default function Home() {
    const { profile, session } = useAuth()
    const [location, setLocation] = useState('')
    const [checkIn, setCheckIn] = useState('')
    const [checkOut, setCheckOut] = useState('')
    const [guests, setGuests] = useState('1')
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ seekers: 0, providers: 0, rooms: 0 })
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [feedback, setFeedback] = useState(null)
    const [liveLocation, setLiveLocation] = useState(null) // { district, municipality }
    const navigate = useNavigate()

    useEffect(() => {
        detectLiveLocation()
        fetchStats()
    }, [profile])

    useEffect(() => {
        fetchFeaturedRooms()
    }, [liveLocation, profile])

    const detectLiveLocation = () => {
        if (!navigator.geolocation) return

        // 1. Get Live Location with Fallback
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords

            try {
                // Try Nominatim with identification
                const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1&email=sandeepgaire8@gmail.com`
                let data

                try {
                    const response = await fetch(nomUrl)
                    if (response.ok) {
                        data = await response.json()
                    } else {
                        throw new Error('Nominatim Blocked')
                    }
                } catch (e) {
                    console.log('Nominatim failed, trying BigDataCloud fallback...')
                    const fbUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    const fbRes = await fetch(fbUrl)
                    const fbData = await fbRes.json()
                    data = {
                        display_name: `${fbData.locality}, ${fbData.principalSubdivision}`,
                        address: { state_district: fbData.principalSubdivision }
                    }
                }

                const district = data.address?.state_district?.replace(' District', '') || ''
                setLiveLocation({
                    lat: latitude,
                    lng: longitude,
                    district: district,
                    address: data.display_name
                })
            } catch (err) {
                console.error('Error reverse geocoding:', err)
                setLiveLocation({ lat: latitude, lng: longitude })
            }
        }, (err) => {
            console.error('Geolocation error:', err)
        })
    }

    async function fetchStats() {
        try {
            // Fetch seekers count
            const fetchStats = async () => {
                try {
                    // Use count: exact, head: true for O(1) metadata fetching
                    const { count: rooms } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', true)
                    const { count: seekers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seeker')
                    const { count: providers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider')

                    setStats({
                        seekers: seekers || 0,
                        providers: providers || 0,
                        rooms: rooms || 0
                    })
                } catch (err) {
                    console.error('Error fetching stats:', err)
                }
            }

            async function fetchFeaturedRooms() {
                try {
                    setLoading(true)

                    let nearbyData = []
                    // Use live location if available, otherwise fallback to profile location
                    const targetDistrict = liveLocation?.district || profile?.district

                    if (targetDistrict) {
                        const { data } = await supabase
                            .from('rooms')
                            .select('*')
                            .ilike('address', `%${targetDistrict}%`)
                            .eq('is_active', true)
                            .limit(6)
                        nearbyData = data || []
                    }

                    // 2. Fetch general latest rooms
                    const { data: generalData, error } = await supabase
                        .from('rooms')
                        .select('*')
                        .eq('is_active', true)
                        .order('created_at', { ascending: false })
                        .limit(6)

                    if (error) throw error

                    // Combine and remove duplicates
                    const combined = [...nearbyData, ...(generalData || [])]
                    const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)

                    setRooms(unique.slice(0, 6))
                } catch (err) {
                    console.error('Error fetching home rooms:', err)
                } finally {
                    setLoading(false)
                }
            }

            const handleSearch = (e) => {
                e.preventDefault()
                if (profile?.role === 'provider') {
                    setFeedback({ type: 'warning', message: 'Providers cannot book rooms. Please use a seeker account.' })
                    return
                }

                const params = new URLSearchParams()
                if (location) params.append('search', location)

                if (session) {
                    navigate(`/dashboard-seeker?${params.toString()}`)
                } else {
                    navigate(`/signup?role=seeker&${params.toString()}`)
                }
            }

            const handleActionClick = (roleType) => {
                if (!session) {
                    navigate(`/signup?role=${roleType}`)
                    return
                }

                if (profile?.role === roleType) {
                    navigate(roleType === 'seeker' ? '/dashboard-seeker' : '/dashboard-provider')
                } else {
                    setFeedback({
                        type: 'warning',
                        message: `You are logged in as a ${profile.role}. Please logout to join as a ${roleType}.`
                    })
                }
            }

            const handleRoomClick = (room) => {
                if (!session) {
                    setFeedback({ type: 'warning', message: 'Please Login or Signup to view details and book!' })
                    setTimeout(() => navigate('/login'), 2000)
                    return
                }

                if (profile?.role === 'provider') {
                    setFeedback({ type: 'warning', message: 'As a provider, you can manage your own listings in your dashboard.' })
                    return
                }

                setSelectedRoom(room)
            }

            const handleBookRoom = async (roomId, duration) => {
                // Simple redirection to dashboard for booking
                navigate(`/dashboard-seeker?book=${roomId}&duration=${duration}`)
            }

            return (
                <>
                    <section className="hero">
                        <div className="hero-3d-bg">
                            <div className="cube-wrap">
                                <div className="cube">
                                    <div className="face front"></div>
                                    <div className="face back"></div>
                                    <div className="face right"></div>
                                    <div className="face left"></div>
                                    <div className="face top"></div>
                                    <div className="face bottom"></div>
                                </div>
                            </div>
                            <div className="floating-shapes">
                                <div className="shape s1"></div>
                                <div className="shape s2"></div>
                                <div className="shape s3"></div>
                                <div className="shape s4"></div>
                                <div className="shape s5"></div>
                            </div>
                        </div>
                        <div className="hero-content">
                            <p className="hero-pill">
                                {liveLocation ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={14} style={{ color: 'var(--accent)' }} />
                                        {liveLocation.municipality ? `${liveLocation.district}, ${liveLocation.municipality}` : liveLocation.district}
                                    </span>
                                ) : profile ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={14} style={{ color: 'var(--accent)' }} />
                                        {profile.district} • {profile.municipality}
                                    </span>
                                ) : (
                                    "Detecting your live location..."
                                )}
                            </p>
                            <h1 className="hero-title">
                                <span className="line">Find Your <i style={{ color: 'var(--accent)' }}>Nest</i></span>
                                <span className="line accent">across Nepal</span>
                            </h1>
                            <p className="hero-sub">
                                From Kathmandu to Pokhara, discover homestays, city rooms and
                                mountain view stays with transparent prices in Nrs.
                            </p>
                            <div className="search-card">
                                <form className="search-row" onSubmit={handleSearch}>
                                    <div className="search-field">
                                        <label>District or city</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Kathmandu, Pokhara, Chitwan"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                        />
                                    </div>
                                    <div className="search-field">
                                        <label>Check-in</label>
                                        <input
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => setCheckIn(e.target.value)}
                                        />
                                    </div>
                                    <div className="search-field">
                                        <label>Check-out</label>
                                        <input
                                            type="date"
                                            value={checkOut}
                                            onChange={(e) => setCheckOut(e.target.value)}
                                        />
                                    </div>
                                    <div className="search-field">
                                        <label>Guests</label>
                                        <select
                                            value={guests}
                                            onChange={(e) => setGuests(e.target.value)}
                                        >
                                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                                <option key={n} value={n}>
                                                    {n} {n === 1 ? 'guest' : 'guests'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button type="submit" className="btn-search">Search rooms in Nepal</button>
                                </form>
                            </div>
                            <div className="hero-actions" style={{ gap: '1.5rem', width: '100%', maxWidth: '500px', margin: '1.5rem auto 0' }}>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '1.1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    onClick={() => handleActionClick('seeker')}
                                >
                                    <ArrowRight size={18} /> I need a room
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ flex: 1, padding: '1.1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    onClick={() => handleActionClick('provider')}
                                >
                                    <ArrowRight size={18} /> I provide rooms
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="stats-section">
                        <div className="section-inner">
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon"><Users size={24} /></div>
                                    <div className="stat-content">
                                        <span className="stat-number">{stats.seekers.toLocaleString()}+</span>
                                        <span className="stat-label">Room Seekers</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(255, 107, 203, 0.15)', color: 'var(--accent2)' }}><ArrowRight size={24} /></div>
                                    <div className="stat-content">
                                        <span className="stat-number">{stats.providers.toLocaleString()}+</span>
                                        <span className="stat-label">Trusted Hosts</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ background: 'rgba(255, 209, 102, 0.15)', color: 'var(--accent3)' }}><Heart size={24} /></div>
                                    <div className="stat-content">
                                        <span className="stat-number">{stats.rooms.toLocaleString()}+</span>
                                        <span className="stat-label">Rooms Listed</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="section how-it-works" id="how-it-works">
                        <h2 className="section-title">How it works in Nepal</h2>
                        <div className="steps-grid">
                            {steps.map((step, i) => (
                                <div
                                    key={step.title}
                                    className="step-card"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                >
                                    <div className="step-icon">{step.icon}</div>
                                    <h3>{step.title}</h3>
                                    <p>{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="section listings" id="listings">
                        <h2 className="section-title">
                            {profile?.district ? `Rooms near ${profile.district}` : 'Featured rooms in Nepal'}
                        </h2>
                        <div className="listings-grid">
                            {loading ? (
                                <div style={{ gridColumn: '1/-1', padding: '4rem', display: 'flex', justifyContent: 'center' }}>
                                    <HouseLoader message="Fetching latest rooms in Nepal..." showPercentage={false} />
                                </div>
                            ) : rooms.length === 0 ? (
                                <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)' }}>No rooms posted yet. Be the first!</p>
                            ) : (
                                rooms.map((listing, i) => (
                                    <article
                                        key={listing.id}
                                        className="listing-card"
                                        style={{ animationDelay: `${i * 0.1}s`, cursor: 'pointer' }}
                                        onClick={() => handleRoomClick(listing)}
                                    >
                                        <div className="listing-image-wrap">
                                            <RoomImageCarousel images={listing.images} alt={listing.title} height="220px" />
                                            <span className="listing-price">
                                                Nrs {listing.price_nrs.toLocaleString()}
                                                <small>/{listing.rent_category === 'monthly' ? 'month' : listing.rent_category === 'daily' ? 'day' : 'night'}</small>
                                            </span>
                                        </div>
                                        <div className="listing-body">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{listing.title}</h3>
                                            </div>
                                            <p className="listing-location" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <MapPin size={14} /> Area in {listing.address.split(',').pop().trim()}
                                            </p>
                                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Users size={14} /> {listing.people_capacity} Capacity</span>
                                            </div>
                                        </div>
                                    </article>
                                ))
                            )}
                        </div>
                        <button
                            type="button"
                            className="btn-outline"
                            onClick={() => {
                                if (profile?.role === 'seeker') navigate('/dashboard-seeker')
                                else navigate('/signup?role=seeker')
                            }}
                        >
                            View all Nepal listings
                        </button>
                    </section>

                    <section className="section why-us">
                        <h2 className="section-title">Why choose RoomRent Nepal</h2>
                        <div className="benefits-grid">
                            <div className="benefit">
                                <div className="benefit-icon">✓</div>
                                <h3>Local verified hosts</h3>
                                <p>
                                    Each room provider from different districts of Nepal is
                                    checked for quality and safety.
                                </p>
                            </div>
                            <div className="benefit">
                                <div className="benefit-icon">💳</div>
                                <h3>Secure Nrs payments</h3>
                                <p>
                                    Pay in Nepali Rupees with trusted partners and protect your
                                    money until check-in.
                                </p>
                            </div>
                            <div className="benefit">
                                <div className="benefit-icon">🏔️</div>
                                <h3>Designed for Nepal travel</h3>
                                <p>
                                    Filter by district, rural municipality and ward to find
                                    rooms near temples, trekking routes and cities.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="section testimonials" id="testimonials">
                        <h2 className="section-title">What people say</h2>
                        <div className="testimonials-grid">
                            {testimonials.map((t, i) => (
                                <blockquote key={i} className="testimonial-card">
                                    <p>"{t.text}"</p>
                                    <footer>
                                        <strong>{t.author}</strong> — {t.role}
                                    </footer>
                                </blockquote>
                            ))}
                        </div>
                    </section>

                    <section className="cta">
                        <div className="cta-inner">
                            <h2>Start your next stay in Nepal</h2>
                            <p>
                                Sign up as a traveller looking for rooms or a host ready to
                                welcome guests.
                            </p>
                            <div className="cta-buttons">
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => handleActionClick('seeker')}
                                >
                                    I need a room
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => handleActionClick('provider')}
                                >
                                    I provide rooms
                                </button>
                            </div>
                        </div>
                    </section>

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
                </>
            )
        }
