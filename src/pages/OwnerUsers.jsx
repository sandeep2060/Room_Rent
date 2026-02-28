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

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (err) {
            console.error('Error fetching users:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.phone?.includes(search)
        const matchesDistrict = !filterDistrict || u.district === filterDistrict
        const matchesGender = !filterGender || u.gender === filterGender
        const matchesRole = !filterRole || u.role === filterRole
        return matchesSearch && matchesDistrict && matchesGender && matchesRole
    })

    if (loading) return <HouseLoader message="Retrieving user directory..." />

    return (
        <div className="owner-users">
            <h1 className="dashboard-title">User Management</h1>
            <p className="dashboard-subtitle">Monitor profiles, financial dues, and account status.</p>

            {/* Filters Bar */}
            <div className="dashboard-card" style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--dash-text-muted)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                </div>

                <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} style={{ padding: '0.75rem 1rem' }}>
                    <option value="">All Districts</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} style={{ padding: '0.75rem 1rem' }}>
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>

                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: '0.75rem 1rem' }}>
                    <option value="">All Roles</option>
                    <option value="seeker">Seeker</option>
                    <option value="provider">Provider</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid var(--dash-border)' }}>
                            <tr>
                                <th style={{ padding: '1.25rem' }}>User Profile</th>
                                <th>Role</th>
                                <th>Location</th>
                                <th>Wallet Dues</th>
                                <th>Status</th>
                                <th style={{ padding: '1.25rem', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid var(--dash-border)', transition: 'background 0.2s' }} className="hover:bg-slate-800/20">
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', background: 'var(--dash-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} />}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 'bold' }}>{u.name}</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--dash-text-muted)' }}>{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${u.role === 'provider' ? 'badge-accent' : 'badge-primary'}`} style={{ textTransform: 'capitalize' }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                            <MapPin size={14} className="text-accent" />
                                            <span>{u.district}, {u.municipality}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 'bold', color: u.wallet_balance > 0 ? 'var(--accent)' : 'inherit' }}>
                                            Nrs {u.wallet_balance}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--dash-text-muted)' }}>
                                            Last Paid: {u.last_payment_date ? new Date(u.last_payment_date).toLocaleDateString() : 'Never'}
                                        </p>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            background: u.is_account_active ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: u.is_account_active ? '#34d399' : '#ef4444',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
                                            {u.is_account_active ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                                            {u.is_account_active ? 'Active' : 'Locked'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                        <Link to={`/dashboard-owner/users/${u.id}`} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                            Profile <ExternalLink size={14} />
                                        </Link>
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
