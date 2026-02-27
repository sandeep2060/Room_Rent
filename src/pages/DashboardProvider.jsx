import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { TrendingUp, Users, Home, Calendar as CalendarIcon, Edit3, Trash2, Mail } from 'lucide-react'

function ProviderAnalytics() {
    return (
        <div>
            <h1 className="dashboard-title">Dashboard Overview</h1>
            <p className="dashboard-subtitle">Monitor your homestay performance.</p>

            <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--accent-dim)', borderRadius: '50%', color: 'var(--accent)' }}>
                        <TrendingUp size={32} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--dash-text-muted)', fontSize: '0.9rem' }}>Nrs Earned (This Month)</p>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>45,200</h2>
                        <p style={{ margin: 0, color: '#34d399', fontSize: '0.8rem' }}>↑ 12% vs last month</p>
                    </div>
                </div>

                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '50%', color: 'var(--accent2)' }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--dash-text-muted)', fontSize: '0.9rem' }}>Total Guests</p>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>24</h2>
                        <p style={{ margin: 0, color: '#34d399', fontSize: '0.8rem' }}>↑ 4 new requests</p>
                    </div>
                </div>

                <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(255, 209, 102, 0.15)', borderRadius: '50%', color: 'var(--accent3)' }}>
                        <Home size={32} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--dash-text-muted)', fontSize: '0.9rem' }}>Active Listings</p>
                        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>2</h2>
                        <p style={{ margin: 0, color: 'var(--dash-text-muted)', fontSize: '0.8rem' }}>1 pending review</p>
                    </div>
                </div>
            </div>

            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recent Booking Requests</h2>
            <div className="dashboard-card" style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--dash-border)' }}>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Guest</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Dates</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Room</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', color: 'var(--dash-text-muted)', fontWeight: '500', fontSize: '0.9rem' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2].map((i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--dash-border)' }}>
                                <td style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--dash-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                        S
                                    </div>
                                    <span>Sandeep G.</span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>Oct 12 - Oct 15</td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>Lakeside Retreat</td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(255, 209, 102, 0.2)', color: '#ffd166', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 'bold' }}>PENDING</span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <button style={{ background: 'var(--accent)', color: 'var(--dash-bg)', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginRight: '0.5rem', fontSize: '0.8rem' }}>Accept</button>
                                    <button style={{ background: 'transparent', color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)', padding: '0.4rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Decline</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function ProviderListings() {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 className="dashboard-title">My Listings</h1>
                    <p className="dashboard-subtitle">Manage your properties and active rooms.</p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}>
                    <Home size={18} /> Add New Listing
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {[1, 2].map(i => (
                    <div key={i} className="dashboard-card" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', alignItems: 'center' }}>
                        <img src={`https://images.unsplash.com/photo-1520256862855-398228c41684?w=400&q=80&sig=${i}`} alt="Room" style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem' }}>Lakeside Retreat</h3>
                                    <p style={{ color: 'var(--dash-text-muted)', fontSize: '0.9rem', margin: 0 }}>Pokhara, Kaski</p>
                                </div>
                                <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', fontSize: '0.75rem', borderRadius: '4px', fontWeight: 'bold' }}>ACTIVE</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.5rem' }}>
                                <p style={{ color: 'var(--accent)', fontWeight: 'bold', margin: 0, fontSize: '1.1rem' }}>Nrs 3,200 <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)', fontWeight: 'normal' }}>/night</span></p>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'transparent', border: '1px solid var(--dash-border)', padding: '0.4rem 0.75rem', color: 'var(--dash-text)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}><Edit3 size={14} /> Edit</button>
                                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid transparent', padding: '0.4rem 0.75rem', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}><Trash2 size={14} /> Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ProviderCalendar() {
    return (
        <div>
            <h1 className="dashboard-title">Calendar & Availability</h1>
            <p className="dashboard-subtitle">A calendar view to manage upcoming reservations.</p>
            <div className="dashboard-card" style={{ marginTop: '2rem', height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text-muted)' }}>
                <CalendarIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                Calendar integration mock placeholder.
            </div>
        </div>
    )
}

function ProviderMessages() {
    return (
        <div>
            <h1 className="dashboard-title">Inbox</h1>
            <p className="dashboard-subtitle">Communicate with prospective tenants.</p>
            <div className="dashboard-card" style={{ marginTop: '2rem', height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text-muted)' }}>
                <Mail size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                No messages yet.
            </div>
        </div>
    )
}


export default function DashboardProvider() {
    return (
        <DashboardLayout role="provider">
            <Routes>
                <Route index element={<ProviderAnalytics />} />
                <Route path="listings" element={<ProviderListings />} />
                <Route path="add" element={<div><h1 className="dashboard-title">Add Listing Form</h1></div>} />
                <Route path="calendar" element={<ProviderCalendar />} />
                <Route path="messages" element={<ProviderMessages />} />
            </Routes>
        </DashboardLayout>
    )
}
