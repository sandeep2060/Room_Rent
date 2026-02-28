import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { adToBs, bsToAd } from '@sbmdkl/nepali-date-converter'
import { supabase } from '../lib/supabase'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, User, UserCircle, UserPlus, Mail, Lock, CheckCircle2, XCircle, MapPin, ShieldCheck, Info } from 'lucide-react'
import FeedbackPopup from '../components/FeedbackPopup'
import HouseLoader from '../components/HouseLoader'

import { districts, municipalitiesByDistrict } from '../constants/nepalLocations'

export default function Signup() {
    const [searchParams] = useSearchParams()
    const initialRole = searchParams.get('role') || 'seeker'
    const navigate = useNavigate()
    const { session } = useAuth()

    const [form, setForm] = useState({
        role: initialRole,
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: '',
        dobAd: '',
        dobBs: '',
        district: '',
        municipality: '',
        phone: '',
        ward: '',
        address: '',
        privacyAccepted: false,
        lat: null,
        lng: null,
        deviceInfo: '',
    })

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const [validationErrors, setValidationErrors] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    })

    // Redirect if already logged in
    if (session) {
        navigate('/')
    }

    const validateField = (name, value) => {
        let error = ''
        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (value && !emailRegex.test(value)) {
                error = 'Please enter a valid email address'
            }
        } else if (name === 'password') {
            if (value && value.length < 6) {
                error = 'Password must be at least 6 characters'
            }
        } else if (name === 'confirmPassword') {
            if (value && value !== form.password) {
                error = 'Passwords do not match'
            }
        }
        setValidationErrors(prev => ({ ...prev, [name]: error }))
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => {
            const newState = { ...prev, [name]: value }
            if (name === 'district') {
                newState.municipality = ''
            }
            return newState
        })

        // Instant validation
        if (['email', 'password', 'confirmPassword'].includes(name)) {
            validateField(name, value)
            if (name === 'password' && form.confirmPassword) {
                validateField('confirmPassword', form.confirmPassword)
            }
        }
    }

    const handleDobAdChange = (e) => {
        const value = e.target.value
        setForm((prev) => {
            const next = { ...prev, dobAd: value }
            if (value) {
                try {
                    const bs = adToBs(value)
                    next.dobBs = bs
                } catch {
                    // ignore invalid
                }
            } else {
                next.dobBs = ''
            }
            return next
        })
    }

    const handleDobBsChange = (e) => {
        const value = e.target.value
        setForm((prev) => {
            const next = { ...prev, dobBs: value }
            if (value) {
                try {
                    const ad = bsToAd(value)
                    next.dobAd = ad
                } catch {
                    // ignore invalid
                }
            } else {
                next.dobAd = ''
            }
            return next
        })
    }

    const captureDeviceInfo = () => {
        const { userAgent, platform } = window.navigator
        return `${platform} | ${userAgent}`
    }

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setFeedback({ type: 'error', message: 'Geolocation is not supported by your browser' })
            return
        }

        setLoading(true)
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords

            try {
                // Reverse geocode using Nominatim with identification
                let nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&email=sandeepgaire8@gmail.com`
                let data;

                try {
                    const response = await fetch(nominatimUrl)
                    if (response.ok) {
                        data = await response.json()
                    } else {
                        throw new Error('Nominatim 403/Blocked')
                    }
                } catch (e) {
                    console.log('Nominatim failed, trying BigDataCloud fallback...')
                    const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    const fallbackRes = await fetch(fallbackUrl)
                    const fallbackData = await fallbackRes.json()
                    // Map BigDataCloud to Nominatim-like structure
                    data = {
                        display_name: `${fallbackData.locality}, ${fallbackData.principalSubdivision}, ${fallbackData.countryName}`,
                        address: {
                            state_district: fallbackData.principalSubdivision,
                            city: fallbackData.city || fallbackData.locality
                        }
                    }
                }

                const address = data.address || {}
                const district = address.state_district || address.county || ''
                const municipality = address.city || address.town || address.village || address.suburb || ''

                // Clean up "District" suffix
                const cleanDistrict = district.replace(' District', '')

                setForm(prev => ({
                    ...prev,
                    lat: latitude,
                    lng: longitude,
                    district: districts.includes(cleanDistrict) ? cleanDistrict : prev.district,
                    municipality: municipalitiesByDistrict[cleanDistrict]?.includes(municipality) ? municipality : prev.municipality,
                    address: data.display_name
                }))

                setFeedback({ type: 'success', message: 'Location captured successfully!' })
            } catch (err) {
                console.error('Reverse geocoding error:', err)
                setForm(prev => ({ ...prev, lat: latitude, lng: longitude }))
                setFeedback({ type: 'warning', message: 'Coords captured, but failed to detect city names.' })
            } finally {
                setLoading(false)
            }
        }, (err) => {
            setLoading(false)
            setFeedback({ type: 'error', message: 'Location access denied. Please enable location to proceed.' })
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (form.password !== form.confirmPassword) {
            setFeedback({ type: 'warning', message: 'Passwords do not match!' })
            return
        }

        if (!form.privacyAccepted) {
            setFeedback({ type: 'warning', message: 'You must accept the Privacy Policy to continue.' })
            return
        }

        if (!form.lat || !form.lng) {
            setFeedback({ type: 'warning', message: 'Please provide your live location for security.' })
            return
        }

        setLoading(true)
        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        role: form.role,
                        name: form.name,
                        gender: form.gender,
                        dobAd: form.dobAd,
                        dobBs: form.dobBs,
                        district: form.district,
                        municipality: form.municipality,
                        phone: form.phone,
                        ward: form.ward,
                        address: form.address,
                        lat: form.lat,
                        lng: form.lng,
                        device_info: captureDeviceInfo(),
                        privacy_accepted: true
                    }
                }
            })

            if (signUpError) {
                if (signUpError.message && (signUpError.message.includes('User already registered') || signUpError.message.includes('User already exists'))) {
                    throw new Error('An account with this email already exists. Please login instead.')
                }
                throw signUpError
            }

            setFeedback({ type: 'success', message: 'Account Created Successfully! Please check your email for confirmation.' })
            setTimeout(() => {
                navigate('/login')
            }, 3000)
        } catch (err) {
            setFeedback({ type: 'error', message: err.message })
        } finally {
            setLoading(false)
        }
    }

    const availableMunicipalities = municipalitiesByDistrict[form.district] || []

    return (
        <AuthLayout
            title="Create your RoomRent Nepal account"
            subtitle="Choose your account type and fill in your details to get started."
        >
            <form className={`auth-form role-${form.role}`} onSubmit={handleSubmit}>
                {/* 1. Account Selection */}
                <div className="signup-section">
                    <div className="signup-section-title">
                        <UserPlus size={18} /> Account Type
                    </div>
                    <div className="field-full">
                        <div className="role-toggle-buttons">
                            <button
                                type="button"
                                className={form.role === 'seeker' ? 'role-toggle-btn active' : 'role-toggle-btn'}
                                onClick={() => setForm((prev) => ({ ...prev, role: 'seeker' }))}
                            >
                                Room seeker
                            </button>
                            <button
                                type="button"
                                className={form.role === 'provider' ? 'role-toggle-btn active' : 'role-toggle-btn'}
                                onClick={() => setForm((prev) => ({ ...prev, role: 'provider' }))}
                            >
                                Room provider
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Basic Credentials */}
                <div className="signup-section">
                    <div className="signup-section-title">
                        <Lock size={18} /> Credentials
                    </div>
                    <div className="auth-grid">
                        <div className="field">
                            <label>Full Name</label>
                            <input name="name" type="text" placeholder="John Doe" required value={form.name} onChange={handleChange} />
                        </div>
                        <div className="field">
                            <label>Email Address</label>
                            <input name="email" type="email" placeholder="john@example.com" required value={form.email} onChange={handleChange} className={validationErrors.email ? 'input-error' : ''} />
                            {validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
                        </div>
                        <div className="field">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={form.password}
                                    onChange={handleChange}
                                    className={validationErrors.password ? 'input-error' : ''}
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
                        </div>
                        <div className="field">
                            <label>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className={validationErrors.confirmPassword ? 'input-error' : ''}
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {validationErrors.confirmPassword && <span className="error-text">{validationErrors.confirmPassword}</span>}
                        </div>
                    </div>
                </div>

                {/* 3. Personal Bio */}
                <div className="signup-section">
                    <div className="signup-section-title">
                        <UserCircle size={18} /> Personal Details
                    </div>
                    <div className="auth-grid">
                        <div className="field field-full">
                            <label>Gender Identification</label>
                            <div className="gender-toggle-buttons">
                                <button type="button" className={form.gender === 'male' ? 'gender-btn active' : 'gender-btn'} onClick={() => setForm(prev => ({ ...prev, gender: 'male' }))}>
                                    <User size={18} /> <span>Male</span>
                                </button>
                                <button type="button" className={form.gender === 'female' ? 'gender-btn active' : 'gender-btn'} onClick={() => setForm(prev => ({ ...prev, gender: 'female' }))}>
                                    <UserCircle size={18} /> <span>Female</span>
                                </button>
                                <button type="button" className={form.gender === 'other' ? 'gender-btn active' : 'gender-btn'} onClick={() => setForm(prev => ({ ...prev, gender: 'other' }))}>
                                    <UserPlus size={18} /> <span>Other</span>
                                </button>
                                <button type="button" className={form.gender === 'prefer_not' ? 'gender-btn active' : 'gender-btn'} onClick={() => setForm(prev => ({ ...prev, gender: 'prefer_not' }))}>
                                    <Lock size={16} /> <span>Private</span>
                                </button>
                            </div>
                        </div>
                        <div className="field">
                            <label>Birthday (AD)</label>
                            <input name="dobAd" type="date" required value={form.dobAd} onChange={handleDobAdChange} />
                        </div>
                        <div className="field">
                            <label>Birthday (BS)</label>
                            <input name="dobBs" type="text" placeholder="YYYY-MM-DD" required value={form.dobBs} onChange={handleDobBsChange} />
                        </div>
                        <div className="field field-full">
                            <label>Mobile Number (Nepal)</label>
                            <div className="phone-input">
                                <span className="phone-prefix">+977</span>
                                <input
                                    name="phone"
                                    type="tel"
                                    pattern="\d{10}"
                                    maxLength={10}
                                    required
                                    value={form.phone}
                                    placeholder="98XXXXXXXX"
                                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Geography & Security */}
                <div className="signup-section" style={{ border: form.lat ? '1px solid #34d399' : '' }}>
                    <div className="signup-section-title" style={{ color: form.lat ? '#34d399' : '' }}>
                        <MapPin size={18} /> Location & Security
                    </div>

                    <button
                        type="button"
                        onClick={handleGetLocation}
                        className={`location-btn-prominent ${loading ? 'loading' : ''} ${!form.lat ? 'pulse-effect' : ''}`}
                        disabled={loading}
                    >
                        {form.lat ? <CheckCircle2 size={22} /> : <MapPin size={22} />}
                        {loading ? 'Detecting Location...' : form.lat ? 'Location Verified' : 'Tap to Verify My Current Location'}
                    </button>

                    <div className="auth-grid">
                        <div className="field">
                            <label>District</label>
                            <select name="district" required value={form.district} onChange={handleChange}>
                                <option value="">Choose District</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Municipality</label>
                            <select name="municipality" required value={form.municipality} onChange={handleChange} disabled={!form.district}>
                                <option value="">{form.district ? 'Choose Municipality' : 'Select District First'}</option>
                                {availableMunicipalities.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="field">
                            <label>Ward No.</label>
                            <input name="ward" type="number" min={1} max={35} required value={form.ward} onChange={handleChange} />
                        </div>
                        <div className="field field-full">
                            <label>Precise Address / Landmark</label>
                            <input name="address" type="text" placeholder="Near XYZ temple, House #12" required value={form.address} onChange={handleChange} />
                        </div>
                    </div>
                    <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Real-time location is required to prevent fraudulent listings.
                    </p>
                </div>

                <div className="field-full" style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                    <label className="checkbox-container" style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', lineHeight: '1.4' }}>
                        <input
                            type="checkbox"
                            checked={form.privacyAccepted}
                            onChange={(e) => setForm(prev => ({ ...prev, privacyAccepted: e.target.checked }))}
                            style={{ marginTop: '3px' }}
                        />
                        <span style={{ fontSize: '0.85rem' }}>
                            I accept the <Link to="/privacy-policy" target="_blank" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Privacy Policy</Link> and agree to provide my authentic location data for security verification.
                        </span>
                    </label>
                </div>

                <button type="submit" className="btn-primary auth-submit" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                    {loading ? 'Creating Account...' : 'Finish & Create Account'}
                </button>

                <div className="auth-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Login here</Link>
                </div>
            </form>
            {loading && <HouseLoader message="Setting up your new nest..." />}
            {feedback && (
                <FeedbackPopup
                    type={feedback.type}
                    message={feedback.message}
                    onClose={() => setFeedback(null)}
                />
            )}
        </AuthLayout>
    )
}
