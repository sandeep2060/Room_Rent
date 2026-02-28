import { useState, useEffect } from 'react'
import { MapPin, X, Home, Users, Check, Maximize2, Car, Wifi, Shield, ZoomIn, Droplets, Utensils, Wind, Sofa } from 'lucide-react'
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// Helper to gracefully extract boolean from JSON amenity
const hasAmenity = (amenities, key) => amenities?.[key] === true

// Fix for Leaflet map white area in modals/mobile
function MapResizer() {
    const map = useMap()
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize()
        }, 400)
    }, [map])
    return null
}

export default function RoomDetailsModal({ room, onClose, onRequestBook }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isZoomed, setIsZoomed] = useState(false)
    const [duration, setDuration] = useState(1)
    const [startTime, setStartTime] = useState('18:00')
    const [endTime, setEndTime] = useState('19:00')
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const displayImages = room.images && room.images.length > 0
        ? room.images
        : ['/src/assets/roomblankimage.png']

    useEffect(() => {
        if (!room || isZoomed) return
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [room, isZoomed, displayImages.length])

    // Auto-calculate duration for hourly bookings
    useEffect(() => {
        if (room.rent_category === 'hourly' && startTime && endTime) {
            const [h1, m1] = startTime.split(':').map(Number);
            const [h2, m2] = endTime.split(':').map(Number);
            const totalMinutes1 = h1 * 60 + m1;
            const totalMinutes2 = h2 * 60 + m2;
            let diff = totalMinutes2 - totalMinutes1;

            // If end time is same as start time, it's 0. If it's before, it spans to next day.
            // But for rooms, we usually don't want 0 duration.
            if (diff <= 0) diff += 24 * 60;

            const hours = Math.ceil(diff / 60);
            setDuration(hours);
        }
    }, [startTime, endTime, room.rent_category]);

    // Prevent body scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = 'auto' }
    }, [])

    if (!room) return null

    const handleBook = () => {
        if (room.rent_category === 'hourly') {
            onRequestBook(room.id, duration, startTime, endTime);
        } else {
            onRequestBook(room.id, duration);
        }
        onClose();
    }

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

                    {/* Image Gallery (Left Side on Desktop) - Now SHARP and STICKY */}
                    <div style={{
                        flex: '1 1 500px',
                        background: '#000',
                        position: isMobile ? 'relative' : 'sticky',
                        top: 0,
                        height: isMobile ? 'auto' : 'fit-content',
                        zIndex: 5,
                        alignSelf: 'flex-start'
                    }}>
                        <img
                            src={displayImages[currentImageIndex]}
                            alt="Room"
                            style={{
                                width: '100%',
                                height: '400px',
                                objectFit: 'cover',
                                display: 'block',
                                transition: 'opacity 0.5s ease-in-out',
                                cursor: 'zoom-in'
                            }}
                            onClick={() => setIsZoomed(true)}
                        />
                        <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', color: 'white' }}>
                            {currentImageIndex + 1} / {displayImages.length}
                        </div>
                        <button
                            onClick={() => setIsZoomed(true)}
                            style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <ZoomIn size={18} />
                        </button>
                        {displayImages.length > 1 && (
                            <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', overflowX: 'auto', background: 'var(--dash-surface)' }}>
                                {displayImages.map((img, idx) => (
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
                                    {room.rent_category === 'monthly' ? 'Monthly Rent' : room.rent_category === 'daily' ? 'Daily Rent' : 'Hourly Stay'}
                                </span>
                                <h2 style={{ fontSize: '1.75rem', margin: '0.5rem 0' }}>{room.title}</h2>
                                <p style={{ color: 'var(--dash-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Shield size={16} color="var(--accent)" /> Approximate Area
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)', margin: 0 }}>Nrs {room.price_nrs}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--dash-text-muted)', margin: 0 }}>/{room.rent_category === 'monthly' ? 'month' : room.rent_category === 'daily' ? 'day' : 'hour'}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem 0', borderTop: '1px solid var(--dash-border)', borderBottom: '1px solid var(--dash-border)', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={20} color="var(--dash-text-muted)" />
                                <span>Max {room.capacity} People</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Home size={20} color="var(--dash-text-muted)" />
                                <span style={{ textTransform: 'capitalize' }}>{room.gender_preference || 'All Genders'} Focus</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Description</h3>
                            <p style={{ color: 'var(--dash-text)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{room.description || 'No description provided.'}</p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Features & Amenities</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {hasAmenity(room.amenities, 'wifi') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Wifi size={16} color="var(--accent)" /> Free WiFi</div>}
                                {hasAmenity(room.amenities, 'attached_toilet') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--accent)" /> Attached Toilet</div>}
                                {hasAmenity(room.amenities, 'water_supply') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--accent)" /> 24/7 Water Supply</div>}
                                {hasAmenity(room.amenities, 'hot_water') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Droplets size={16} color="var(--accent)" /> Hot Water</div>}
                                {hasAmenity(room.amenities, 'kitchen') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Utensils size={16} color="var(--accent)" /> Kitchen Access</div>}
                                {hasAmenity(room.amenities, 'balcony') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} color="var(--accent)" /> Balcony</div>}
                                {hasAmenity(room.amenities, 'furnished') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sofa size={16} color="var(--accent)" /> Fully Furnished</div>}
                                {hasAmenity(room.amenities, 'ac') && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Wind size={16} color="var(--accent)" /> AC</div>}
                                {room.amenities?.car_parking > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Car size={16} color="var(--accent)" /> Car Parking ({room.amenities.car_parking})</div>}
                                {room.amenities?.bike_parking > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Car size={16} color="var(--accent)" /> Bike Parking ({room.amenities.bike_parking})</div>}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Maximize2 size={16} color="var(--accent)" /> {room.amenities?.windows || 0} Windows</div>
                            </div>
                        </div>

                        {/* Privacy Map Section */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.50rem' }}>Approximate Location</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--dash-text-muted)', marginBottom: '0.75rem' }}>Exact location and contact is shared only after booking approval (0.5km area shown).</p>
                            <div style={{ height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--dash-border)' }}>
                                <MapContainer
                                    key={`${room.id}-${isMobile}`}
                                    center={[room.lat || 27.7172, room.lng || 85.3240]}
                                    zoom={14}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={false}
                                    dragging={!isMobile} // Disable dragging on mobile to allow scrolling details
                                    zoomControl={false}
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <MapResizer />
                                    <Circle
                                        center={[room.lat || 27.7172, room.lng || 85.3240]}
                                        radius={500}
                                        pathOptions={{ fillColor: 'var(--accent)', color: 'var(--accent)', weight: 1, fillOpacity: 0.2 }}
                                    />
                                </MapContainer>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--dash-bg)', borderRadius: '8px', border: '1px solid var(--dash-border)' }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--dash-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Booking Details
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {room.rent_category === 'hourly' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--dash-bg)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--dash-border)', color: 'var(--accent)', fontWeight: 'bold' }}>
                                            <span style={{ fontSize: '1.2rem' }}>{duration}</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--dash-surface)', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid var(--dash-border)' }}>
                                            <button
                                                type="button"
                                                onClick={() => setDuration(Math.max(1, duration - 1))}
                                                style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: 'var(--dash-border)', color: 'var(--dash-text)', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                -
                                            </button>
                                            <span style={{ minWidth: '20px', textAlign: 'center', fontWeight: 'bold' }}>{duration}</span>
                                            <button
                                                type="button"
                                                onClick={() => setDuration(duration + 1)}
                                                style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    )}
                                    <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                                        {room.rent_category === 'monthly' ? 'Months' : room.rent_category === 'daily' ? 'Days' : 'Hours'}
                                    </span>
                                </div>

                                {room.rent_category === 'hourly' && (
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div className="field" style={{ flex: 1, minWidth: '120px' }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>Start Time</label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="custom-input"
                                            />
                                        </div>
                                        <div className="field" style={{ flex: 1, minWidth: '120px' }}>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>End Time (Est.)</label>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="custom-input"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>
                                Total Price: <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Nrs {room.price_nrs * duration}</span>
                            </p>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--dash-border)', display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}
                                onClick={handleBook}
                            >
                                Request Booking
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Lightbox / Zoom Overlay */}
            {isZoomed && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setIsZoomed(false)}
                >
                    <button
                        onClick={() => setIsZoomed(false)}
                        style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'white', color: 'black', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer' }}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={displayImages[currentImageIndex]}
                        alt="Zoomed"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'zoom-out' }}
                    />

                    {displayImages.length > 1 && (
                        <div style={{ position: 'absolute', bottom: '2rem', display: 'flex', gap: '1rem' }}>
                            {displayImages.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt="Thumb"
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: currentImageIndex === idx ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
