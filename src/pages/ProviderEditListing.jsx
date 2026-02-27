import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ImagePlus } from 'lucide-react'

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

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng)
        },
    })
    return position === null ? null : <Marker position={position}></Marker>
}

export default function ProviderEditListing() {
    const { profile } = useAuth()
    const navigate = useNavigate()
    const { roomId } = useParams()

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState(null)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('monthly')
    const [price, setPrice] = useState('')
    const [capacity, setCapacity] = useState('1')
    const [genderPref, setGenderPref] = useState('all')
    const [address, setAddress] = useState('')
    const [mapPosition, setMapPosition] = useState({ lat: 27.7172, lng: 85.3240 })
    const [isActive, setIsActive] = useState(true)

    const [amenities, setAmenities] = useState({
        wifi: false,
        attached_toilet: false,
        water_supply: false,
        bike_parking: 0,
        car_parking: 0,
        windows: 1
    })

    useEffect(() => {
        if (roomId && profile?.id) {
            fetchRoomData()
        }
    }, [roomId, profile])

    async function fetchRoomData() {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .eq('provider_id', profile.id)
                .single()

            if (error) throw error

            setTitle(data.title || '')
            setDescription(data.description || '')
            setCategory(data.rent_category || 'monthly')
            setPrice(data.price_nrs || '')
            setCapacity(data.capacity || '1')
            setGenderPref(data.gender_preference || 'all')
            setAddress(data.address || '')
            setIsActive(data.is_active)

            if (data.latitude && data.longitude) {
                setMapPosition({ lat: data.latitude, lng: data.longitude })
            }
            if (data.amenities) {
                setAmenities(prev => ({ ...prev, ...data.amenities }))
            }
        } catch (error) {
            console.error('Error fetching room:', error)
            setError('Could not load room details. You may not have permission.')
        } finally {
            setFetching(false)
        }
    }

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
                is_active: isActive
            }

            const { error: updateError } = await supabase
                .from('rooms')
                .update(roomData)
                .eq('id', roomId)
                .eq('provider_id', profile.id)

            if (updateError) throw updateError

            alert('Room updated successfully!')
            navigate('/dashboard-provider/listings')

        } catch (err) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (fetching) {
        return <div style={{ padding: '2rem' }}>Loading room details...</div>
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="dashboard-title">Edit Listing</h1>
                    <p className="dashboard-subtitle">Update your room particulars.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard-provider/listings')}
                    style={{ background: 'transparent', border: '1px solid var(--dash-border)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', color: 'var(--dash-text)' }}
                >
                    Cancel
                </button>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <section className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--dash-border)', paddingBottom: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>1. Basic Details</h2>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: isActive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(148, 163, 184, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ accentColor: '#34d399' }} />
                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: isActive ? '#34d399' : 'var(--dash-text-muted)' }}>{isActive ? 'ACTIVE (Visible)' : 'HIDDEN'}</span>
                        </label>
                    </div>

                    <div className="field">
                        <label>Title *</label>
                        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div className="field">
                        <label>Description</label>
                        <textarea
                            rows="4"
                            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', resize: 'vertical' }}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        ></textarea>
                    </div>
                </section>

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
                            <input type="number" required min="100" value={price} onChange={e => setPrice(e.target.value)} />
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

                <section className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--dash-border)', paddingBottom: '0.75rem' }}>3. Features & Amenities</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.wifi} onChange={() => handleAmenityToggle('wifi')} style={{ accentColor: 'var(--accent)' }} /> Free WiFi
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.attached_toilet} onChange={() => handleAmenityToggle('attached_toilet')} style={{ accentColor: 'var(--accent)' }} /> Attached Toilet
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.water_supply} onChange={() => handleAmenityToggle('water_supply')} style={{ accentColor: 'var(--accent)' }} /> 24/7 Water Supply
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                        <div className="field">
                            <label>Windows</label>
                            <input type="number" min="0" value={amenities.windows} onChange={e => handleAmenityNumber('windows', e.target.value)} style={{ width: '100px' }} />
                        </div>
                        <div className="field">
                            <label>Bike Parking</label>
                            <input type="number" min="0" value={amenities.bike_parking} onChange={e => handleAmenityNumber('bike_parking', e.target.value)} style={{ width: '100px' }} />
                        </div>
                        <div className="field">
                            <label>Car Parking</label>
                            <input type="number" min="0" value={amenities.car_parking} onChange={e => handleAmenityNumber('car_parking', e.target.value)} style={{ width: '100px' }} />
                        </div>
                    </div>
                </section>

                <section className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--dash-border)', paddingBottom: '0.75rem' }}>4. Location details</h2>
                    <div className="field">
                        <label>Exact Address *</label>
                        <input type="text" required value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <div className="field">
                        <label>Pinpoint on Map</label>
                        <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <MapContainer center={[mapPosition.lat, mapPosition.lng]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                                <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                            </MapContainer>
                        </div>
                    </div>
                </section>

                <button type="submit" className="btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }} disabled={loading}>
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
            </form>
        </div>
    )
}
