import { useState, useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DashboardLayout from '../components/DashboardLayout'
import {
    Users, Home, TrendingUp, HandCoins, AlertCircle,
    ChevronRight, MapPin, Search, Filter, Download
} from 'lucide-react'
import OwnerUsers from './OwnerUsers'
import OwnerUserDetails from './OwnerUserDetails'
import OwnerAnalytics from './OwnerAnalytics'
import OwnerSecurity from './OwnerSecurity'
import OwnerMessages from './OwnerMessages'
import HouseLoader from '../components/HouseLoader'
import ProfileSettings from '../components/ProfileSettings'
import { MessageSquare } from 'lucide-react'

export default function DashboardOwner() {
    const [stats, setStats] = useState({
        totalEarned: 0,
        receivable: 0,
        unpaid: 0,
        totalUsers: 0,
        activeRooms: 0
    })
    const [recentUsers, setRecentUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchGlobalStats()
    }, [])

    async function fetchGlobalStats() {
        try {
            setLoading(true)
            // 1. Total Earned (Sum of all payments)
            const { data: payments } = await supabase.from('payments').select('amount')
            const earned = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

            // 2. Financial Metrics from Profiles
            const { data: profiles } = await supabase.from('profiles').select('wallet_balance, penalty_amount, role')
            const receivable = profiles?.reduce((sum, p) => sum + (p.wallet_balance || 0), 0) || 0
            const penalties = profiles?.reduce((sum, p) => sum + (p.penalty_amount || 0), 0) || 0

            // 3. User counts
            const totalUsers = profiles?.length || 0

            // 4. Active rooms
            const { count: roomCount } = await supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('is_active', true)

            // 5. Recent Users
            const { data: recent } = await supabase
                .from('profiles')
                .select('id, name, role, created_at, avatar_url')
                .order('created_at', { ascending: false })
                .limit(5)

            setStats({
                totalEarned: earned,
                receivable: receivable,
                unpaid: receivable + penalties,
                totalUsers,
                activeRooms: roomCount || 0
            })
            setRecentUsers(recent || [])
        } catch (err) {
            console.error('Error fetching owner stats:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <HouseLoader message="Generating master report..." />

    return (
        <DashboardLayout role="owner">
            <Routes>
                <Route index element={<OwnerOverview stats={stats} recentUsers={recentUsers} />} />
                <Route path="users" element={<OwnerUsers />} />
                <Route path="users/:userId" element={<OwnerUserDetails />} />
                <Route path="analytics" element={<OwnerAnalytics />} />
                <Route path="messages" element={<OwnerMessages />} />
                <Route path="security" element={<OwnerSecurity />} />
                <Route path="profile" element={<ProfileSettings />} />
            </Routes>
        </DashboardLayout>
    )
}

function OwnerOverview({ stats, recentUsers }) {
    return (
        <div className="owner-overview">
            <h1 className="dashboard-title">Platform Master Dashboard</h1>
            <p className="dashboard-subtitle">Complete overview of RoomRent Nepal performance and revenue.</p>

            {/* Stats Grid */}
            <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
                <div className="dashboard-card stat-card-premium">
                    <div className="stat-icon-box" style={{ background: 'rgba(96, 187, 70, 0.1)', color: '#60bb46' }}>
                        <TrendingUp size={28} />
                    </div>
                    <div className="stat-info">
                        <p>Total Revenue Earned</p>
                        <h2>Nrs {stats.totalEarned.toLocaleString()}</h2>
                        <span className="stat-trend positive">+12% from last month</span>
                    </div>
                </div>

                <div className="dashboard-card stat-card-premium">
                    <div className="stat-icon-box" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                        <HandCoins size={28} />
                    </div>
                    <div className="stat-info">
                        <p>Receivable Balance</p>
                        <h2>Nrs {stats.receivable.toLocaleString()}</h2>
                        <span className="stat-trend">Uncollected platform fees</span>
                    </div>
                </div>

                <div className="dashboard-card stat-card-premium">
                    <div className="stat-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <AlertCircle size={28} />
                    </div>
                    <div className="stat-info">
                        <p>Overdue Payments</p>
                        <h2>Nrs {stats.unpaid.toLocaleString()}</h2>
                        <span className="stat-trend negative">Requires attention</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Analytics Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="dashboard-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ margin: 0 }}>Earnings Performance</h3>
                        <Link to="/dashboard-owner/analytics" className="text-accent" style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            Full Report <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div style={{ height: '300px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: 'var(--dash-text-muted)' }}>Interactive Graph Data Loading...</p>
                    </div>
                </div>

                <div className="dashboard-card">
                    <h3 style={{ marginBottom: '1.5rem' }}>User Distribution</h3>
                    <div className="distribution-list">
                        <div className="dist-item">
                            <span>Seekers (Room Needy)</span>
                            <div className="progress-bar"><div className="progress-fill" style={{ width: '65%', background: 'var(--accent)' }}></div></div>
                            <span className="dist-count">65%</span>
                        </div>
                        <div className="dist-item">
                            <span>Providers (Owners)</span>
                            <div className="progress-bar"><div className="progress-fill" style={{ width: '35%', background: '#60bb46' }}></div></div>
                            <span className="dist-count">35%</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--dash-border)' }}>
                        <h4 style={{ margin: '0 0 1rem' }}>Active Inventory</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Home size={20} className="text-accent" />
                            <div>
                                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.activeRooms}</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>Verified Listings</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Users Table Preview */}
            <div className="dashboard-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Recent Registered Users</h3>
                    <Link to="/dashboard-owner/users" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Manage All Users
                    </Link>
                </div>
                <div className="table-container">
                    {recentUsers.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--dash-text-muted)' }}>
                            No users registered yet.
                        </p>
                    ) : (
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ borderBottom: '1px solid var(--dash-border)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem' }}>User</th>
                                        <th>Role</th>
                                        <th>Joined On</th>
                                        <th style={{ textAlign: 'right', padding: '1rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--dash-border)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: 'var(--dash-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={16} />}
                                                    </div>
                                                    <span style={{ fontWeight: '500' }}>{u.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${u.role === 'provider' ? 'badge-accent' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                                                    {u.role?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--dash-text-muted)' }}>
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '1rem' }}>
                                                <Link to={`/dashboard-owner/users/${u.id}`} className="text-accent" style={{ fontSize: '0.85rem' }}>View Profile</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
