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

            // Helper: fetch with a timeout so Nominatim doesn't hang for 60s+
            const fetchWithTimeout = (url, timeoutMs = 5000) => {
                const controller = new AbortController()
                const timer = setTimeout(() => controller.abort(), timeoutMs)
                return fetch(url, { signal: controller.signal })
                    .finally(() => clearTimeout(timer))
            }

            let data = null

            // ── 1st attempt: Nominatim (5s timeout) ──────────────────────────
            try {
                const nominatimUrl =
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
                    `&lat=${latitude}&lon=${longitude}` +
                    `&addressdetails=1&email=sandeepgaire8@gmail.com`

                const res = await fetchWithTimeout(nominatimUrl, 5000)
                if (res.ok) {
                    data = await res.json()
                    console.log('Geocoding: Nominatim ✓')
                } else {
                    throw new Error(`Nominatim HTTP ${res.status}`)
                }
            } catch (e) {
                console.warn('Nominatim failed or timed out:', e.message)
            }

            // ── 2nd attempt: BigDataCloud (free, no key, very fast) ──────────
            if (!data) {
                try {
                    const bdcUrl =
                        `https://api.bigdatacloud.net/data/reverse-geocode-client` +
                        `?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`

                    const res = await fetchWithTimeout(bdcUrl, 6000)
                    if (res.ok) {
                        const bdc = await res.json()
                        console.log('Geocoding: BigDataCloud ✓', bdc)

                        // Map to Nominatim-compatible shape
                        const district = bdc.localityInfo?.administrative
                            ?.find(a => a.adminLevel === 5)?.name           // Nepal district level
                            || bdc.principalSubdivision || ''
                        const city = bdc.city || bdc.locality || ''

                        data = {
                            display_name: [city, bdc.principalSubdivision, bdc.countryName]
                                .filter(Boolean).join(', '),
                            address: {
                                state_district: district,
                                city,
                            }
                        }
                    } else {
                        throw new Error(`BigDataCloud HTTP ${res.status}`)
                    }
                } catch (e) {
                    console.warn('BigDataCloud failed:', e.message)
                }
            }

            // ── 3rd attempt: Photon / Komoot (Nominatim-based, different infra) ─
            if (!data) {
                try {
                    const photonUrl =
                        `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&limit=1`

                    const res = await fetchWithTimeout(photonUrl, 6000)
                    if (res.ok) {
                        const photon = await res.json()
                        const props = photon?.features?.[0]?.properties || {}
                        console.log('Geocoding: Photon ✓', props)

                        data = {
                            display_name: [props.name, props.city || props.state, props.country]
                                .filter(Boolean).join(', '),
                            address: {
                                state_district: props.state || '',
                                city: props.city || props.name || '',
                            }
                        }
                    } else {
                        throw new Error(`Photon HTTP ${res.status}`)
                    }
                } catch (e) {
                    console.warn('Photon failed:', e.message)
                }
            }

            // ── Apply results (or coords-only if all APIs failed) ────────────
            if (data) {
                const addr = data.address || {}
                const district = (addr.state_district || addr.county || '').replace(/ District$/i, '')
                const municipality = addr.city || addr.town || addr.village || addr.suburb || ''

                setForm(prev => ({
                    ...prev,
                    lat: latitude,
                    lng: longitude,
                    district: districts.includes(district) ? district : prev.district,
                    municipality: municipalitiesByDistrict[district]?.includes(municipality)
                        ? municipality
                        : prev.municipality,
                    address: data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                }))
                setFeedback({ type: 'success', message: 'Location captured successfully!' })
            } else {
                // All APIs failed – save raw coords so signup can still proceed
                setForm(prev => ({
                    ...prev,
                    lat: latitude,
                    lng: longitude,
                    address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                }))
                setFeedback({ type: 'warning', message: 'GPS captured. Could not resolve address name — you may continue.' })
            }

            setLoading(false)
        }, (err) => {
            setLoading(false)
            setFeedback({ type: 'error', message: 'Location access denied. Please enable location to proceed.' })
        }, {
            // More accurate GPS fix, with a reasonable timeout
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
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

                {/* 4. Geography & Security (Real Background Track) */}
                <div className="signup-section" style={{ border: form.lat ? '2.5px solid #34d399' : '1px solid var(--border)', boxShadow: form.lat ? '0 0 20px rgba(52, 211, 153, 0.1)' : 'none' }}>
                    <div className="signup-section-title" style={{ color: form.lat ? '#34d399' : '' }}>
                        <MapPin size={18} /> Location & Security (Real Background Track)
                    </div>

                    <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={handleGetLocation}
                            className={`location-btn-prominent ${loading ? 'loading' : ''} ${!form.lat ? 'pulse-effect' : ''}`}
                            disabled={loading}
                            style={{
                                height: '60px',
                                fontSize: '1.1rem',
                                letterSpacing: '0.5px',
                                boxShadow: form.lat ? 'none' : '0 15px 35px rgba(0, 245, 160, 0.3)'
                            }}
                        >
                            {form.lat ? <CheckCircle2 size={26} /> : <MapPin size={26} />}
                            {loading ? 'Detecting Location...' : form.lat ? 'LIVE LOCATION VERIFIED' : 'GET CURRENT LOCATION NOW'}
                        </button>
                    </div>

                    {!form.lat ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '50%' }}>
                                <MapPin size={32} style={{ color: 'var(--dash-text-muted)' }} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem', color: 'var(--text-main)' }}>Verification Required</h4>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tap the pulsing button above to capture your authentic location.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="location-verified-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(52, 211, 153, 0.2)' }}>
                                <ShieldCheck size={20} />
                                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.5px' }}>AUTHENTICITY SECURED</span>
                            </div>

                            <div className="verified-data-row">
                                <span className="verified-label">District</span>
                                <span className="verified-value">{form.district}</span>
                            </div>
                            <div className="verified-data-row">
                                <span className="verified-label">Municipality</span>
                                <span className="verified-value">{form.municipality}</span>
                            </div>
                            <div className="verified-data-row">
                                <span className="verified-label">Precise Address</span>
                                <span className="verified-value">{form.address || 'Detected Landmark Location'}</span>
                            </div>

                            <div style={{ marginTop: '1.25rem', fontSize: '0.7rem', color: '#34d399', opacity: 0.8, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Lock size={10} /> Secure Background Track: Manual Editing Disabled
                            </div>
                        </div>
                    )}

                    {form.lat && (
                        <div className="auth-grid" style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <div className="field">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Home size={14} className="text-accent" /> Ward Number (Manual Entry)
                                </label>
                                <input name="ward" type="number" min={1} max={35} required value={form.ward} onChange={handleChange} placeholder="e.g. 5" />
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Please specify your exact ward for the listing.</p>
                            </div>
                            <div className="field">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <ShieldCheck size={14} style={{ color: '#34d399' }} /> Background Verification Token
                                </label>
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'black',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontFamily: 'monospace',
                                    color: '#34d399',
                                    border: '1px solid rgba(52, 211, 153, 0.2)',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}>
                                    SECURE_GPS_{form.lat.toFixed(4)}_{form.lng.toFixed(4)}_VERIFIED
                                </div>
                            </div>
                        </div>
                    )}

                    <p style={{ margin: '1.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        <ShieldCheck size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        Real-time background tracking is active during this session to prevent fraudulent accounts.
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
