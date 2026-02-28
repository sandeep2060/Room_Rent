import { ShieldCheck, Lock, ShieldAlert, Key, UserCheck } from 'lucide-react'

export default function OwnerSecurity() {
    return (
        <div className="owner-security">
            <h1 className="dashboard-title">Platform Security & Access</h1>
            <p className="dashboard-subtitle">Manage administrative credentials and site-wide security protocols.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="dashboard-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: '#60bb46' }}>
                        <Lock size={24} />
                        <h3 style={{ margin: 0 }}>Update Admin Password</h3>
                    </div>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="field">
                            <label>Current Master Password</label>
                            <input type="password" placeholder="••••••••" style={{ width: '100%' }} />
                        </div>
                        <div className="field">
                            <label>New Password</label>
                            <input type="password" placeholder="Admin@2060" style={{ width: '100%' }} />
                        </div>
                        <div className="field">
                            <label>Confirm New Password</label>
                            <input type="password" placeholder="Admin@2060" style={{ width: '100%' }} />
                        </div>
                        <button type="button" className="btn-primary" style={{ background: '#60bb46', border: 'none' }}>
                            Update Admin Credentials
                        </button>
                    </form>
                </div>

                <div className="dashboard-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--accent)' }}>
                        <ShieldAlert size={24} />
                        <h3 style={{ margin: 0 }}>Site-Wide Protocols</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>Platform Commission (Seeker)</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>Currently 2% on booking</p>
                            </div>
                            <span className="badge badge-primary">ACTIVE</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>Platform Commission (Provider)</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>Currently 3% on acceptance</p>
                            </div>
                            <span className="badge badge-accent">ACTIVE</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>Automatic Deactivation</p>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>30 days grace period</p>
                            </div>
                            <span className="badge" style={{ background: '#34d399', color: 'white' }}>ENABLED</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px dashed #ef4444' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldAlert size={16} /> EMERGENCY LOCKDOWN
                        </p>
                        <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>
                            Instantly disable all bookings and payments across the platform. Use only in case of data breach.
                        </p>
                        <button style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
                            Activate Lockdown
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
