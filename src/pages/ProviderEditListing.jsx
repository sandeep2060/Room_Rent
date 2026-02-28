import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ImagePlus } from 'lucide-react'
import HouseLoader from '../components/HouseLoader'
import FeedbackPopup from '../components/FeedbackPopup'

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

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        // Trigger resize multiple times to catch delayed mobile rendering
        const timers = [100, 500, 1000, 2000].map(t => setTimeout(() => map.invalidateSize(), t));

        const onResize = () => map.invalidateSize();
        window.addEventListener('resize', onResize);

        return () => {
            timers.forEach(clearTimeout);
            window.removeEventListener('resize', onResize);
        }
    }, [map]);
    return null;
}

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
    const [feedback, setFeedback] = useState(null)

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
    const [images, setImages] = useState([])

    const [amenities, setAmenities] = useState({
        wifi: false,
        attached_toilet: false,
        water_supply: false,
        hot_water: false,
        kitchen: false,
        balcony: false,
        furnished: false,
        ac: false,
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
            setImages(data.images || [])

            if (data.lat && data.lng) {
                setMapPosition({ lat: data.lat, lng: data.lng })
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
                lat: mapPosition.lat,
                lng: mapPosition.lng,
                amenities,
                is_active: isActive,
                images: images
            }

            const { error: updateError } = await supabase
                .from('rooms')
                .update(roomData)
                .eq('id', roomId)
                .eq('provider_id', profile.id)

            if (updateError) throw updateError

            setFeedback({ type: 'success', message: 'Room updated successfully!' })
            setTimeout(() => {
                navigate('/dashboard-provider/listings')
            }, 2500)

        } catch (err) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const CounterInput = ({ label, value, onIncrement, onDecrement }) => (
        <div className="field">
            <label>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--dash-surface)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--dash-border)', width: 'fit-content' }}>
                <button
                    type="button"
                    onClick={onDecrement}
                    style={{ width: '30px', height: '30px', borderRadius: '4px', border: 'none', background: 'var(--dash-border)', color: 'var(--dash-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                >
                    -
                </button>
                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold' }}>{value}</span>
                <button
                    type="button"
                    onClick={onIncrement}
                    style={{ width: '30px', height: '30px', borderRadius: '4px', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                >
                    +
                </button>
            </div>
        </div>
    )

    if (fetching) {
        return <HouseLoader message="Retrieving your nest details..." />
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

                    <div className="field">
                        <label>Room Photos (Max 4)</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="room-photos-upload"
                            onChange={async (e) => {
                                if (!e.target.files) return;
                                const newFiles = Array.from(e.target.files);
                                if (images.length + newFiles.length > 4) {
                                    alert('You can only upload a maximum of 4 images.');
                                    return;
                                }
                                try {
                                    setLoading(true);
                                    const uploadedUrls = [...images];
                                    for (const file of newFiles) {
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

                <section className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--dash-border)', paddingBottom: '0.75rem' }}>2. Pricing & Rules</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="field">
                            <label>Rent Category *</label>
                            <select required value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="monthly">Monthly</option>
                                <option value="daily">Daily (Day time only)</option>
                                <option value="hourly">Hourly</option>
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
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.hot_water} onChange={() => handleAmenityToggle('hot_water')} style={{ accentColor: 'var(--accent)' }} /> Hot Water / Geyser
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.kitchen} onChange={() => handleAmenityToggle('kitchen')} style={{ accentColor: 'var(--accent)' }} /> Kitchen Access
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.balcony} onChange={() => handleAmenityToggle('balcony')} style={{ accentColor: 'var(--accent)' }} /> Balcony
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.furnished} onChange={() => handleAmenityToggle('furnished')} style={{ accentColor: 'var(--accent)' }} /> Fully Furnished
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={amenities.ac} onChange={() => handleAmenityToggle('ac')} style={{ accentColor: 'var(--accent)' }} /> Air Conditioning
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                        <CounterInput
                            label="Windows"
                            value={amenities.windows}
                            onIncrement={() => handleAmenityNumber('windows', amenities.windows + 1)}
                            onDecrement={() => handleAmenityNumber('windows', Math.max(0, amenities.windows - 1))}
                        />
                        <CounterInput
                            label="Bike Parking"
                            value={amenities.bike_parking}
                            onIncrement={() => handleAmenityNumber('bike_parking', amenities.bike_parking + 1)}
                            onDecrement={() => handleAmenityNumber('bike_parking', Math.max(0, amenities.bike_parking - 1))}
                        />
                        <CounterInput
                            label="Car Parking"
                            value={amenities.car_parking}
                            onIncrement={() => handleAmenityNumber('car_parking', amenities.car_parking + 1)}
                            onDecrement={() => handleAmenityNumber('car_parking', Math.max(0, amenities.car_parking - 1))}
                        />
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
                                <MapResizer />
                                <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                            </MapContainer>
                        </div>
                    </div>
                </section>

                <button type="submit" className="btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }} disabled={loading}>
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
            </form>
            {loading && <HouseLoader message="Saving your changes..." />}
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
