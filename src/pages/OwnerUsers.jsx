import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, Filter, MapPin, User, Mail, Phone, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react'
import { districts } from '../constants/nepalLocations'
import HouseLoader from '../components/HouseLoader'

export default function OwnerUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterDistrict, setFilterDistrict] = useState('')
    const [filterGender, setFilterGender] = useState('')
    const [filterRole, setFilterRole] = useState('')
    const [sortBy, setSortBy] = useState('newest') // newest, alphabetical, most_paid

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email, avatar_url, phone, role, district, municipality, gender, created_at, is_account_active, wallet_balance, penalty_amount, total_paid_amount, address, ward')

            if (error) throw error
            setUsers(data || [])
        } catch (err) {
            console.error('Error fetching users:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users
        .filter(u => {
            const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                u.email?.toLowerCase().includes(search.toLowerCase()) ||
                u.phone?.includes(search)
            const matchesDistrict = !filterDistrict || u.district === filterDistrict
            const matchesGender = !filterGender || u.gender === filterGender
            const matchesRole = !filterRole || u.role === filterRole
            return matchesSearch && matchesDistrict && matchesGender && matchesRole
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
            if (sortBy === 'alphabetical') return a.name.localeCompare(b.name)
            if (sortBy === 'most_paid') return (b.total_paid_amount || 0) - (a.total_paid_amount || 0)
            return 0
        })

    if (loading) return <HouseLoader message="Retrieving user directory..." />

    return (
        <div className="owner-users">
            <h1 className="dashboard-title">User Management</h1>
            <p className="dashboard-subtitle">Monitor profiles, financial dues, and account status.</p>

            {/* District Distribution Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {Object.entries(
                    users.reduce((acc, u) => {
                        if (!u.district) return acc;
                        acc[u.district] = (acc[u.district] || 0) + 1;
                        return acc;
                    }, {})
                )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([district, count]) => (
                        <div key={district} className="dashboard-card" style={{ padding: '1rem', textAlign: 'center', background: filterDistrict === district ? 'var(--accent-dim)' : 'var(--bg-card)', border: filterDistrict === district ? '1px solid var(--accent)' : '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setFilterDistrict(filterDistrict === district ? '' : district)}>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--dash-text-muted)', textTransform: 'uppercase' }}>{district}</p>
                            <h3 style={{ margin: '0.25rem 0 0', color: 'var(--accent)' }}>{count} Users</h3>
                        </div>
                    ))}
            </div>

            {/* Filters Bar */}
            <div className="dashboard-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={18} className="text-accent" /> Filter & Search
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>Found {filteredUsers.length} users</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--dash-text-muted)' }} size={16} />
                        <input
                            type="text"
                            placeholder="Name or Phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '100%', fontSize: '0.9rem' }}
                        />
                    </div>

                    <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} style={{ fontSize: '0.9rem' }}>
                        <option value="">All Districts</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ fontSize: '0.9rem' }}>
                        <option value="">All Roles</option>
                        <option value="seeker">Seeker</option>
                        <option value="provider">Provider</option>
                        <option value="owner">Owner</option>
                    </select>

                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ fontSize: '0.9rem', border: '1px solid var(--accent-dim)', color: 'var(--accent)' }}>
                        <option value="newest">Sort: Newest First</option>
                        <option value="most_paid">Sort: Most Paid</option>
                        <option value="alphabetical">Sort: Alphabetical</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid var(--dash-border)' }}>
                            <tr>
                                <th style={{ padding: '1.25rem' }}>User Profile & Location</th>
                                <th>Role</th>
                                <th>Penalty</th>
                                <th>Wallet Dues</th>
                                <th>Total Paid</th>
                                <th>Status</th>
                                <th style={{ padding: '1.25rem', textAlign: 'center' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--dash-border)', transition: 'background 0.2s' }} className="hover:bg-slate-800/20">
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--dash-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} />}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 'bold' }}>{u.name || 'Incognito User'}</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>{u.email || u.phone || 'No contact info'}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--accent)', marginTop: '0.25rem' }}>
                                                    <MapPin size={12} />
                                                    <span>{u.address || `${u.municipality}, ${u.district}`}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${u.role === 'provider' ? 'badge-accent' : u.role === 'owner' ? 'badge-secondary' : 'badge-primary'}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ color: (u.penalty_amount || 0) > 0 ? '#ef4444' : 'var(--dash-text-muted)', fontWeight: 'bold' }}>
                                            Nrs {u.penalty_amount || 0}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 'bold', color: u.wallet_balance > 0 ? '#fbbf24' : 'inherit' }}>
                                            Nrs {u.wallet_balance}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '800', color: 'var(--accent)' }}>
                                            Nrs {u.total_paid_amount || 0}
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            background: u.is_account_active ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: u.is_account_active ? '#34d399' : '#ef4444',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {u.is_account_active ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                                            {u.is_account_active ? 'ACTIVE' : 'LOCKED'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={async () => {
                                                    const newStatus = !u.is_account_active;
                                                    const { error } = await supabase.from('profiles').update({ is_account_active: newStatus }).eq('id', u.id);
                                                    if (!error) fetchUsers();
                                                }}
                                                className="btn-text"
                                                style={{ color: u.is_account_active ? '#ef4444' : '#34d399', fontSize: '0.7rem', textDecoration: 'none' }}
                                            >
                                                {u.is_account_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Clear all penalties for this user?')) {
                                                        const { error } = await supabase.from('profiles').update({ penalty_amount: 0 }).eq('id', u.id);
                                                        if (!error) fetchUsers();
                                                    }
                                                }}
                                                className="btn-text"
                                                style={{ color: '#fbbf24', fontSize: '0.7rem', textDecoration: 'none' }}
                                                disabled={!u.penalty_amount}
                                            >
                                                Clear Penalty
                                            </button>
                                            <Link to={`/dashboard-owner/users/${u.id}`} className="btn-secondary" style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ExternalLink size={14} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <p style={{ color: 'var(--dash-text-muted)' }}>No users found matching your filters.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
