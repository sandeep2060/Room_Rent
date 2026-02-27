import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User, MapPin, Phone, Calendar, Camera, Upload } from 'lucide-react'
import HouseLoader from '../components/HouseLoader'

export default function ProfileSettings() {
    const { profile } = useAuth()

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)

    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        gender: 'other',
        location: '',
        dob_ad: '',
        address: ''
    })

    useEffect(() => {
        if (profile?.id) fetchProfileData()
    }, [profile])

    async function fetchProfileData() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profile.id)
                .single()

            if (error) throw error

            if (data) {
                setFormData({
                    name: data.name || '',
                    phone: data.phone || '',
                    gender: data.gender || 'other',
                    location: data.location || '',
                    dob_ad: data.dob_ad || '',
                    address: data.address || ''
                })
                setAvatarUrl(data.avatar_url)
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            setError('Failed to load profile data.')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        setError(null)
        setSuccess(false)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    gender: formData.gender,
                    location: formData.location,
                    dob_ad: formData.dob_ad || null,
                    address: formData.address
                })
                .eq('id', profile.id)

            if (error) throw error
            setSuccess(true)

            // Auto hide success message
            setTimeout(() => setSuccess(false), 3000)

        } catch (err) {
            console.error('Error updating profile:', err)
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleAvatarUpload = async (e) => {
        try {
            setUploading(true)
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', profile.id)

            if (updateError) throw updateError

            setAvatarUrl(publicUrl)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)

        } catch (error) {
            alert(error.message)
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <HouseLoader message="Retrieving your profile..." />

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="dashboard-title">Profile Settings</h1>
                <p className="dashboard-subtitle">Manage your personal information.</p>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{ padding: '1rem', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                    Profile updated successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--dash-border)' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--dash-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--accent)' }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={50} color="var(--dash-text-muted)" />
                            )}
                        </div>
                        <label
                            style={{
                                position: 'absolute', bottom: '0', right: '0', background: 'var(--accent)', color: 'white',
                                padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', border: '2px solid var(--dash-surface)'
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                style={{ display: 'none' }}
                                disabled={uploading}
                            />
                            {uploading ? <div className="spinner-small" /> : <Camera size={16} />}
                        </label>
                    </div>
                    <div>
                        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem' }}>{formData.name || 'Your Profile'}</h2>
                        <p style={{ margin: 0, color: 'var(--dash-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 'bold' }}>{profile?.role}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div className="field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><User size={16} /> Full Name</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} />
                    </div>

                    <div className="field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={16} /> Phone Number</label>
                        <input type="tel" name="phone" placeholder="e.g. 9841000000" value={formData.phone} onChange={handleChange} />
                    </div>

                    <div className="field">
                        <label>Gender Preference</label>
                        <select name="gender" value={formData.gender} onChange={handleChange}>
                            <option value="other">Prefer not to say</option>
                            <option value="boy">Male</option>
                            <option value="girl">Female</option>
                        </select>
                    </div>

                    <div className="field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={16} /> Date of Birth</label>
                        <input type="date" name="dob_ad" value={formData.dob_ad} onChange={handleChange} />
                    </div>

                    {profile?.role === 'seeker' && (
                        <div className="field" style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={16} /> Preferred Search Location</label>
                            <input type="text" name="location" placeholder="e.g. Kathmandu, Patan, Baneshwor" value={formData.location} onChange={handleChange} />
                            <small style={{ color: 'var(--dash-text-muted)', marginTop: '0.25rem', display: 'block' }}>This helps us recommend rooms near your preferred area.</small>
                        </div>
                    )}

                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                        <label>Full Address</label>
                        <input type="text" name="address" placeholder="e.g. New Baneshwor, Kathmandu" value={formData.address} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--dash-border)' }}>
                    <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
            {saving && <HouseLoader message="Updating your professional profile..." />}
        </div>
    )
}
