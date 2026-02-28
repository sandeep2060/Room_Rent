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
    const [submitStep, setSubmitStep] = useState('') // 'locating' | 'creating' | ''
    const [submitting, setSubmitting] = useState(false)
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

    // ── Reverse-geocode helper (pure async, no state side-effects) ──────────
    const fetchWithTimeout = (url, timeoutMs = 5000) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer))
    }

    const reverseGeocode = async (latitude, longitude) => {
        let data = null

        // 1st: Nominatim (5s timeout)
        try {
            const res = await fetchWithTimeout(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&email=sandeepgaire8@gmail.com`,
                5000
            )
            if (res.ok) { data = await res.json(); console.log('Geocoding: Nominatim ✓') }
            else throw new Error(`Nominatim HTTP ${res.status}`)
        } catch (e) { console.warn('Nominatim failed:', e.message) }

        // 2nd: BigDataCloud
        if (!data) {
            try {
                const res = await fetchWithTimeout(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
                    6000
                )
                if (res.ok) {
                    const bdc = await res.json()
                    console.log('Geocoding: BigDataCloud ✓', bdc)
                    const district = bdc.localityInfo?.administrative?.find(a => a.adminLevel === 5)?.name || bdc.principalSubdivision || ''
                    const city = bdc.city || bdc.locality || ''
                    data = {
                        display_name: [city, bdc.principalSubdivision, bdc.countryName].filter(Boolean).join(', '),
                        address: { state_district: district, city }
                    }
                } else throw new Error(`BigDataCloud HTTP ${res.status}`)
            } catch (e) { console.warn('BigDataCloud failed:', e.message) }
        }

        // 3rd: Photon / Komoot
        if (!data) {
            try {
                const res = await fetchWithTimeout(
                    `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&limit=1`,
                    6000
                )
                if (res.ok) {
                    const photon = await res.json()
                    const props = photon?.features?.[0]?.properties || {}
                    console.log('Geocoding: Photon ✓', props)
                    data = {
                        display_name: [props.name, props.city || props.state, props.country].filter(Boolean).join(', '),
                        address: { state_district: props.state || '', city: props.city || props.name || '' }
                    }
                } else throw new Error(`Photon HTTP ${res.status}`)
            } catch (e) { console.warn('Photon failed:', e.message) }
        }

        return data
    }

    // ── Get GPS coords as a promise ──────────────────────────────────────────
    const getGPSCoords = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
        navigator.geolocation.getCurrentPosition(
            pos => resolve(pos.coords),
            err => reject(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setFeedback(null)

        if (form.password !== form.confirmPassword) {
            setFeedback({ type: 'warning', message: 'Passwords do not match!' })
            return
        }

        if (!form.privacyAccepted) {
            setFeedback({ type: 'warning', message: 'You must accept the Privacy Policy to continue.' })
            return
        }

        setSubmitting(true)

        try {
            // ── Step 1: Auto-fetch GPS location ─────────────────────────────
            setSubmitStep('locating')
            let lat = null, lng = null, address = '', district = form.district, municipality = form.municipality

            try {
                const coords = await getGPSCoords()
                lat = coords.latitude
                lng = coords.longitude

                const geoData = await reverseGeocode(lat, lng)
                if (geoData) {
                    const addr = geoData.address || {}
                    const detectedDistrict = (addr.state_district || addr.county || '').replace(/ District$/i, '')
                    const detectedMunicipality = addr.city || addr.town || addr.village || addr.suburb || ''
                    address = geoData.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                    if (districts.includes(detectedDistrict)) district = detectedDistrict
                    if (municipalitiesByDistrict[district]?.includes(detectedMunicipality)) municipality = detectedMunicipality
                } else {
                    address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
                }
            } catch (gpsErr) {
                console.warn('GPS failed, proceeding without location:', gpsErr.message)
                // Not blocking — account is still created without coords
            }

            // ── Step 2: Create account ───────────────────────────────────────
            setSubmitStep('creating')
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
                        district,
                        municipality,
                        phone: form.phone,
                        ward: form.ward,
                        address,
                        lat,
                        lng,
                        device_info: captureDeviceInfo(),
                        privacy_accepted: true
                    }
                }
            })

            if (signUpError) {
                if (signUpError.message?.includes('User already registered') || signUpError.message?.includes('User already exists')) {
                    throw new Error('An account with this email already exists. Please login instead.')
                }
                throw signUpError
            }

            setFeedback({ type: 'success', message: 'Account Created Successfully! Please check your email for confirmation.' })
            setTimeout(() => navigate('/login'), 3000)
        } catch (err) {
            setFeedback({ type: 'error', message: err.message })
        } finally {
            setSubmitting(false)
            setSubmitStep('')
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

                {/* 4. Location – auto-captured on submit */}
                <div className="signup-section">
                    <div className="signup-section-title">
                        <MapPin size={18} /> Location & Security
                    </div>

                    {/* Ward Number */}
                    <div className="field" style={{ marginBottom: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            Ward Number
                        </label>
                        <input name="ward" type="number" min={1} max={35} required value={form.ward} onChange={handleChange} placeholder="e.g. 5" />
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Your exact ward number within your municipality.</p>
                    </div>

                    {/* Auto-location notice */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.9rem 1rem', background: 'rgba(0,245,160,0.06)', border: '1px solid rgba(0,245,160,0.2)', borderRadius: '10px', marginTop: '0.75rem' }}>
                        <ShieldCheck size={18} style={{ color: '#34d399', flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Your live location will be <strong style={{ color: '#34d399' }}>automatically captured</strong> when you click <em>Finish &amp; Create Account</em> for security verification.
                        </p>
                    </div>
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

                <button type="submit" className="btn-primary auth-submit" style={{ width: '100%', padding: '1rem' }} disabled={submitting}>
                    {submitStep === 'locating'
                        ? '📍 Detecting your location...'
                        : submitStep === 'creating'
                            ? '🏗️ Building your account...'
                            : 'Finish & Create Account'
                    }
                </button>

                <div className="auth-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Login here</Link>
                </div>
            </form>
            {submitting && submitStep === 'creating' && <HouseLoader message="Setting up your new nest..." />}
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
