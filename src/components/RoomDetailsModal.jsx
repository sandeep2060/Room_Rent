import { useState, useEffect } from 'react'
import { MapPin, X, Home, Users, Check, Maximize2, Car, Wifi } from 'lucide-react'

// Helper to gracefully extract boolean from JSON amenity
const hasAmenity = (amenities, key) => amenities?.[key] === true

export default function RoomDetailsModal({ room, onClose, onRequestBook }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    useEffect(() => {
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = 'auto' }
    }, [])

    if (!room) return null

    const images = room.images && room.images.length > 0
        ? room.images
        : ['https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&q=80']

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }} onClick={onClose}>

            <div
                className="dashboard-card"
                style={{
                    width: '100%',
                    maxWidth: '1000px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: 0,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>

                    {/* Image Gallery (Left Side on Desktop) */}
                    <div style={{ flex: '1 1 500px', background: '#000', position: 'relative' }}>
                        <img
                            src={images[currentImageIndex]}
                            alt="Room"
                            style={{ width: '100%', height: '400px', objectFit: 'contain', display: 'block' }}
                        />
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', overflowX: 'auto', background: 'var(--dash-surface)' }}>
                                {images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt="Thumbnail"
                                        onClick={() => setCurrentImageIndex(idx)}
                                        style={{
                                            width: '80px', height: '60px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px',
                                            border: currentImageIndex === idx ? '2px solid var(--accent)' : '2px solid transparent',
                                            opacity: currentImageIndex === idx ? 1 : 0.6
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details (Right Side on Desktop) */}
                    <div style={{ flex: '1 1 400px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: 'var(--dash-border)', padding: '0.25rem 0.5rem', borderRadius: '4px', letterSpacing: '0.5px' }}>
                                    {room.rent_category === 'monthly' ? 'Monthly Rent' : room.rent_category === 'daily' ? 'Daily Rent' : 'Nightly Stay'}
                                </span>
                                <h2 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>{room.title}</h2>
                                <p style={{ color: 'var(--dash-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <MapPin size={16} /> {room.address}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0 }}>Nrs {room.price_nrs}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--dash-text-muted)', margin: 0 }}>/{room.rent_category === 'monthly' ? 'month' : room.rent_category === 'daily' ? 'day' : 'night'}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--dash-border)', borderBottom: '1px solid var(--dash-border)', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={20} color="var(--dash-text-muted)" />
                                <span>Max {room.people_capacity} People</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Home size={20} color="var(--dash-text-muted)" />
                                <span style={{ textTransform: 'capitalize' }}>{room.gender_preference || 'All Genders'} Focus</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Description</h3>
                            <p style={{ color: 'var(--dash-text)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{room.description || 'No description provided.'}</p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Features & Amenities</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {hasAmenity(room.amenities, 'wifi') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Wifi size={16} color="var(--accent)" /> Free WiFi</div>}
                                {hasAmenity(room.amenities, 'attachedToilet') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--accent)" /> Attached Toilet</div>}
                                {hasAmenity(room.amenities, 'bikeParking') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Car size={16} color="var(--accent)" /> Bike Parking</div>}
                                {hasAmenity(room.amenities, 'carParking') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Car size={16} color="var(--accent)" /> Car Parking</div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Maximize2 size={16} color="var(--accent)" /> {room.windows || 0} Windows</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--dash-border)', display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
                                onClick={() => {
                                    onRequestBook(room.id);
                                    onClose();
                                }}
                            >
                                Request Booking
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
