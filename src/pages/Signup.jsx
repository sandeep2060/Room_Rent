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
                // Reverse geocode using Nominatim
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`)
                const data = await response.json()

                const address = data.address
                const district = address.state_district || address.county || ''
                const municipality = address.city || address.town || address.village || address.suburb || ''

                // Clean up "District" suffix from Nominatim if it exists
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
                <div className="auth-grid">
                    <div className="field field-full">
                        <label>Account type</label>
                        <div className="role-toggle-buttons">
                            <button
                                type="button"
                                className={
                                    form.role === 'seeker'
                                        ? 'role-toggle-btn active'
                                        : 'role-toggle-btn'
                                }
                                onClick={() => setForm((prev) => ({ ...prev, role: 'seeker' }))}
                            >
                                Room needy user
                            </button>
                            <button
                                type="button"
                                className={
                                    form.role === 'provider'
                                        ? 'role-toggle-btn active'
                                        : 'role-toggle-btn'
                                }
                                onClick={() => setForm((prev) => ({ ...prev, role: 'provider' }))}
                            >
                                Room provider user
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="field field-full">
                            <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>
                        </div>
                    )}

                    <div className="field">
                        <label>Name</label>
                        <input name="name" type="text" required value={form.name} onChange={handleChange} />
                    </div>
                    <div className="field">
                        <label>Email</label>
                        <input name="email" type="email" required value={form.email} onChange={handleChange} className={validationErrors.email ? 'input-error' : ''} />
                        {validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
                    </div>
                    <div className="field">
                        <label>Password</label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={form.password}
                                onChange={handleChange}
                                style={{ paddingRight: '3.5rem' }}
                                className={validationErrors.password ? 'input-error' : ''}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
                    </div>
                    <div className="field">
                        <label>Confirm password</label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={form.confirmPassword}
                                onChange={handleChange}
                                style={{ paddingRight: '3.5rem' }}
                                className={validationErrors.confirmPassword ? 'input-error' : ''}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex="-1"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {validationErrors.confirmPassword && <span className="error-text">{validationErrors.confirmPassword}</span>}
                    </div>
                    <div className="field field-full">
                        <label>Gender</label>
                        <div className="gender-toggle-buttons">
                            <button
                                type="button"
                                className={form.gender === 'male' ? 'gender-btn active' : 'gender-btn'}
                                onClick={() => setForm(prev => ({ ...prev, gender: 'male' }))}
                            >
                                <User size={20} />
                                <span>Male</span>
                            </button>
                            <button
                                type="button"
                                className={form.gender === 'female' ? 'gender-btn active' : 'gender-btn'}
                                onClick={() => setForm(prev => ({ ...prev, gender: 'female' }))}
                            >
                                <UserCircle size={20} />
                                <span>Female</span>
                            </button>
                            <button
                                type="button"
                                className={form.gender === 'other' ? 'gender-btn active' : 'gender-btn'}
                                onClick={() => setForm(prev => ({ ...prev, gender: 'other' }))}
                            >
                                <UserPlus size={20} />
                                <span>Other</span>
                            </button>
                            <button
                                type="button"
                                className={form.gender === 'prefer_not' ? 'gender-btn active' : 'gender-btn'}
                                onClick={() => setForm(prev => ({ ...prev, gender: 'prefer_not' }))}
                            >
                                <Lock size={18} />
                                <span>Private</span>
                            </button>
                        </div>
                    </div>
                    <div className="field">
                        <label>Date of birth (AD)</label>
                        <input name="dobAd" type="date" required value={form.dobAd} onChange={handleDobAdChange} />
                    </div>
                    <div className="field">
                        <label>Date of birth (BS)</label>
                        <input name="dobBs" type="text" placeholder="YYYY-MM-DD" required value={form.dobBs} onChange={handleDobBsChange} />
                    </div>
                    <div className="field">
                        <label>Nepal district</label>
                        <select name="district" required value={form.district} onChange={handleChange}>
                            <option value="">Choose district</option>
                            {districts.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label>Rural / Municipality</label>
                        <select name="municipality" required value={form.municipality} onChange={handleChange} disabled={!form.district}>
                            <option value="">
                                {form.district ? 'Choose municipality' : 'Select district first'}
                            </option>
                            {availableMunicipalities.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field field-full">
                        <label>Phone (Nepal)</label>
                        <div className="phone-input">
                            <span className="phone-prefix">+977</span>
                            <input
                                name="phone"
                                type="tel"
                                inputMode="numeric"
                                pattern="\d{10}"
                                maxLength={10}
                                required
                                value={form.phone}
                                onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                                    setForm((prev) => ({ ...prev, phone: digits }))
                                }}
                                placeholder="98XXXXXXXX"
                            />
                        </div>
                    </div>
                    <div className="field">
                        <label>Ward no.</label>
                        <input name="ward" type="number" min={1} max={35} required value={form.ward} onChange={handleChange} />
                    </div>
                    <div className="field field-full">
                        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                            Live Location (Real Background Track)
                            <button type="button" onClick={handleGetLocation} className="text-accent" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={14} /> Get Current Location
                            </button>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                name="address"
                                type="text"
                                placeholder="Click 'Get Current Location' or type address"
                                required
                                value={form.address}
                                onChange={handleChange}
                                style={{ paddingRight: form.lat ? '6rem' : '1rem' }}
                            />
                            {form.lat && (
                                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#34d399', fontWeight: 'bold' }}>
                                    <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Verified
                                </span>
                            )}
                        </div>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--dash-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Info size={12} /> We log your Coords & Device ID for platform security.
                        </p>
                    </div>

                    <div className="field field-full" style={{ marginTop: '1rem' }}>
                        <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={form.privacyAccepted}
                                onChange={(e) => setForm(prev => ({ ...prev, privacyAccepted: e.target.checked }))}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <span style={{ fontSize: '0.9rem' }}>
                                I accept the <Link to="/privacy-policy" target="_blank" className="text-accent">Privacy Policy</Link> and Terms & Conditions of RoomRent Nepal.
                            </span>
                        </label>
                    </div>
                </div>
                <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                    {loading ? 'Submitting...' : 'Create account'}
                </button>
                <div className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
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
