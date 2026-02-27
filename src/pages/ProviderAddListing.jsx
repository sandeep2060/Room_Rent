import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ImagePlus, MapPin, CheckCircle } from 'lucide-react'
import HouseLoader from '../components/HouseLoader'

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Map click handler component
function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng)
        },
    })

    return position === null ? null : (
        <Marker position={position}></Marker>
    )
}

export default function ProviderAddListing() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Basic Info
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    // Rent & Rules
    const [category, setCategory] = useState('monthly')
    const [price, setPrice] = useState('')
    const [capacity, setCapacity] = useState('1')
    const [genderPref, setGenderPref] = useState('all')

    // Location
    const [address, setAddress] = useState('')
    // Default to Kathmandu center
    const [mapPosition, setMapPosition] = useState({ lat: 27.7172, lng: 85.3240 })

    // Amenities
    const [amenities, setAmenities] = useState({
        wifi: false,
        attached_toilet: false,
        water_supply: false,
        bike_parking: 0,
        car_parking: 0,
        windows: 1
    })

    // Images mock state
    const [images, setImages] = useState([])

    const handleAmenityToggle = (key) => {
        setAmenities(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleAmenityNumber = (key, value) => {
        setAmenities(prev => ({ ...prev, [key]: parseInt(value) || 0 }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const roomData = {
                provider_id: profile.id,
                title,
                description,
                rent_category: category,
                price_nrs: parseInt(price),
                capacity: parseInt(capacity),
                gender_preference: genderPref,
                address,
                latitude: mapPosition.lat,
                longitude: mapPosition.lng,
                amenities,
                images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80']
            }

            const { data, error: insertError } = await supabase
                .from('rooms')
                .insert([roomData])

            if (insertError) throw insertError

            alert('Room listed successfully!')
            navigate('/dashboard-provider/listings')

        } catch (err) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="dashboard-title">Add New Room</h1>
                <p className="dashboard-subtitle">Provide details about your space to start getting requests.</p>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Section 1: Basic Info */}
                <section className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--dash-border)', paddingBottom: '0.75rem' }}>1. Basic Details</h2>

                    <div className="field">
                        <label>Title *</label>
                        <input type="text" required placeholder="e.g. Sunny Room in Patan with Balcony" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div className="field">
                        <label>Description</label>
                        <textarea
                            rows="4"
                            placeholder="Describe the room, building, neighborhood..."
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical' }}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="field">
                        <label>Room Photos</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="room-photos-upload"
                            onChange={async (e) => {
                                if (!e.target.files) return;
                                try {
                                    setLoading(true);
                                    const uploadedUrls = [...images];
                                    for (const file of e.target.files) {
                                        const fileExt = file.name.split('.').pop();
                                        const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
                                        const filePath = `${fileName}`;

                                        const { error: uploadError } = await supabase.storage
                                            .from('room-images')
                                            .upload(filePath, file);

                                        if (uploadError) throw uploadError;

                                        const { data: { publicUrl } } = supabase.storage
                                            .from('room-images')
                                            .getPublicUrl(filePath);

                                        uploadedUrls.push(publicUrl);
                                    }
                                    setImages(uploadedUrls);
                                } catch (err) {
                                    console.error('Upload error:', err);
                                    setError(`Upload failed: ${err.message || 'Unknown error'}`);
                                    alert(`Upload failed: ${err.message || 'Unknown error'}`);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        />
                        <div
                            style={{ border: '2px dashed var(--dash-border)', padding: '2rem', borderRadius: '8px', textAlign: 'center', color: 'var(--dash-text-muted)', cursor: 'pointer' }}
                            onClick={() => document.getElementById('room-photos-upload').click()}
                        >
                            <ImagePlus size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                            <p>Click to upload photos</p>
                        </div>
                        {images.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                {images.map((url, idx) => (
                                    <div key={idx} style={{ position: 'relative', aspectRatio: '1/1' }}>
                                        <img src={url} alt={`Listing ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setImages(images.filter((_, i) => i !== idx));
                                            }}
                                            style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Section 2: Rent & Rules */}
                <section className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--dash-border)', paddingBottom: '0.75rem' }}>2. Pricing & Rules</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="field">
                            <label>Rent Category *</label>
                            <select required value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="monthly">Monthly</option>
                                <option value="daily">Daily (Day time only)</option>
                                <option value="nightly">Nightly</option>
                            </select>
                        </div>

                        <div className="field">
                            <label>Price (Nrs) *</label>
                            <input type="number" required min="100" placeholder="e.g. 5000" value={price} onChange={e => setPrice(e.target.value)} />
                        </div>

                        <div className="field">
                            <label>Max People capacity *</label>
                            <input type="number" required min="1" max="10" value={capacity} onChange={e => setCapacity(e.target.value)} />
                        </div>

                        <div className="field">
                            <label>Gender Preference *</label>
                            <select required value={genderPref} onChange={e => setGenderPref(e.target.value)}>
                                <option value="all">Anyone</option>
                                <option value="boy">Boys only</option>
                                <option value="girl">Girls only</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Section 3: Amenities */}
                <section className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--dash-border)', paddingBottom: '0.75rem' }}>3. Features & Amenities</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.wifi} onChange={() => handleAmenityToggle('wifi')} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                            Free WiFi
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.attached_toilet} onChange={() => handleAmenityToggle('attached_toilet')} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                            Attached Toilet
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.water_supply} onChange={() => handleAmenityToggle('water_supply')} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                            24/7 Water Supply
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                        <div className="field">
                            <label>Windows Count</label>
                            <input type="number" min="0" value={amenities.windows} onChange={e => handleAmenityNumber('windows', e.target.value)} style={{ width: '100px' }} />
                        </div>

                        <div className="field">
                            <label>Bike Parking Space</label>
                            <input type="number" min="0" value={amenities.bike_parking} onChange={e => handleAmenityNumber('bike_parking', e.target.value)} style={{ width: '100px' }} />
                        </div>

                        <div className="field">
                            <label>Car Parking Space</label>
                            <input type="number" min="0" value={amenities.car_parking} onChange={e => handleAmenityNumber('car_parking', e.target.value)} style={{ width: '100px' }} />
                        </div>
                    </div>
                </section>

                {/* Section 4: Location */}
                <section className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--dash-border)', paddingBottom: '0.75rem' }}>4. Location details</h2>

                    <div className="field">
                        <label>Exact Line Address / Landmark *</label>
                        <input type="text" required placeholder="e.g. Near Krishna Mandir, Patan Dhoka" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>

                    <div className="field">
                        <label>Pinpoint on Map</label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Click on the map to set the exact location coordinates.</p>
                        <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <MapContainer
                                center={[mapPosition.lat, mapPosition.lng]}
                                zoom={13}
                                style={{ height: '100%', width: '100%', zIndex: 1 }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                            </MapContainer>
                        </div>
                    </div>
                </section>

                <button type="submit" className="btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }} disabled={loading}>
                    {loading ? 'Publishing Listing...' : 'Publish Room Listing'}
                </button>

            </form>
            {loading && <HouseLoader message="Building your new listing..." />}
        </div>
    )
}
