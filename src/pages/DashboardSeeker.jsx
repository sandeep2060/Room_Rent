import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { MapPin, Calendar, CreditCard, Camera } from 'lucide-react'

function SeekerOverview() {
    return (
        <div>
            <h1 className="dashboard-title">Welcome back, Seeker</h1>
            <p className="dashboard-subtitle">Here is a summary of your recent activity.</p>

            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <div className="dashboard-card" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={20} color="var(--accent)" /> active booking</h2>
                    <p>Pokhara Lakeside - Check-in: Oct 12</p>
                </div>
                <div className="dashboard-card" style={{ borderLeft: '4px solid var(--accent2)' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Heart size={20} color="var(--accent2)" /> 12 Saved</h2>
                    <p>Rooms you are keeping an eye on.</p>
                </div>
            </div>

            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recommendations in Kathmandu</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <img src={`https://images.unsplash.com/photo-1549294413-26f195200c16?w=600&q=80&sig=${i}`} alt="Room" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                        <div style={{ padding: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Cozy Studio Thamel</h3>
                            <p style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Nrs 2,500 <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>/night</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

import { Heart } from 'lucide-react'

function SeekerSaved() {
    return (
        <div>
            <h1 className="dashboard-title">Saved Rooms</h1>
            <p className="dashboard-subtitle">Compare and book when you are ready.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="dashboard-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', borderRadius: '50%', padding: '0.4rem', color: 'red', zIndex: 10 }}>
                            <Heart size={20} fill="red" />
                        </div>
                        <img src={`https://images.unsplash.com/photo-1520256862855-398228c41684?w=600&q=80&sig=${i}`} alt="Room" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                        <div style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Lakeside Retreat</h3>
                                <span style={{ color: '#ffc107', fontSize: '0.9rem' }}>★ 4.8</span>
                            </div>
                            <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={14} /> Pokhara, Kaski
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ color: 'var(--accent)', fontWeight: 'bold', margin: 0, fontSize: '1.1rem' }}>Nrs 3,200 <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', fontWeight: 'normal' }}>/night</span></p>
                                <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Book</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function SeekerBookings() {
    return (
        <div>
            <h1 className="dashboard-title">My Bookings</h1>
            <p className="dashboard-subtitle">Manage your past and upcoming stays.</p>

            <div className="dashboard-card" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Mock booking item */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingBottom: '1.5rem', borderBottom: '1px solid var(--dash-border)' }}>
                    <img src="https://images.unsplash.com/photo-1520256862855-398228c41684?w=400&q=80" alt="booked" style={{ width: '120px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 'bold' }}>UPCOMING</span>
                                <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem', marginBottom: '0.25rem' }}>Lakeside Retreat</h3>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.9rem', margin: 0 }}>Pokhara, Kaski</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem' }}>Nrs 9,600</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', margin: 0 }}>Total (3 nights)</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={14} /> Oct 12 - Oct 15</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><CreditCard size={14} /> Paid</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <img src="https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=400&q=80" alt="booked" style={{ width: '120px', height: '100px', objectFit: 'cover', borderRadius: '8px', opacity: 0.6 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(148, 163, 184, 0.2)', color: 'var(--dash-text-muted)', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 'bold' }}>COMPLETED</span>
                                <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem', marginBottom: '0.25rem', color: 'var(--dash-text-muted)' }}>Colorful Room in Thamel</h3>
                                <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.9rem', margin: 0 }}>Kathmandu</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={14} /> Sep 01 - Sep 03</span>
                            <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Camera size={14} /> Write Review</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SeekerMessages() {
    return (
        <div>
            <h1 className="dashboard-title">Messages</h1>
            <p className="dashboard-subtitle">Talk with hosts across Nepal.</p>
            <div className="dashboard-card" style={{ marginTop: '2rem', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text-muted)' }}>
                No messages yet.
            </div>
        </div>
    )
}

export default function DashboardSeeker() {
    return (
        <DashboardLayout role="seeker">
            <Routes>
                <Route index element={<SeekerOverview />} />
                <Route path="bookings" element={<SeekerBookings />} />
                <Route path="saved" element={<SeekerSaved />} />
                <Route path="messages" element={<SeekerMessages />} />
                <Route path="profile" element={<div><h1 className="dashboard-title">Profile Context Menu goes here</h1></div>} />
            </Routes>
        </DashboardLayout>
    )
}
