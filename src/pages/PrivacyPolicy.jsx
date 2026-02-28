import AuthLayout from '../components/AuthLayout'
import { Link } from 'react-router-dom'
import { ShieldCheck, Scale, AlertTriangle, UserX, ShieldAlert } from 'lucide-react'

export default function PrivacyPolicy() {
    return (
        <AuthLayout
            title="Privacy Policy & Terms of Service"
            subtitle="Please read our rules and regulations carefully before signing up."
        >
            <div className="dashboard-card" style={{ textAlign: 'left', lineHeight: '1.6', color: 'var(--dash-text)' }}>

                <section style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                        <ShieldCheck size={24} />
                        <h2 style={{ margin: 0 }}>1. Data Collection & Security</h2>
                    </div>
                    <p>
                        To ensure a safe environment for all users, RoomRent Nepal collects:
                    </p>
                    <ul>
                        <li><strong>Real-time Location:</strong> Your District, Municipality, and Coordinates are stored to verify listing accuracy.</li>
                        <li><strong>Device Information:</strong> We track your device type, IP address, and browser for security and fraud prevention.</li>
                        <li><strong>Identity:</strong> Basic profile information is required to build trust between seekers and providers.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ffd166' }}>
                        <Scale size={24} />
                        <h2 style={{ margin: 0 }}>2. Rules & Regulations</h2>
                    </div>
                    <p>All users must comply with the following rules:</p>
                    <ul>
                        <li><strong>Accuracy:</strong> Providers must upload real images and accurate descriptions of rooms.</li>
                        <li><strong>Communication:</strong> All communication must be respectful. Harassment or spam is strictly prohibited.</li>
                        <li><strong>Payments:</strong> Commission fees (2% for seekers, 3% for providers) must be paid within 30 days of the transaction.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
                        <UserX size={24} />
                        <h2 style={{ margin: 0 }}>3. Restricted Activities</h2>
                    </div>
                    <p>Users are NOT allowed to:</p>
                    <ul>
                        <li>Post fake listings or bait-and-switch offers.</li>
                        <li>Circumvent the platform's booking or payment system.</li>
                        <li>Share personal contact details publicly (use our secure messaging instead).</li>
                        <li>Create multiple accounts to bypass penalties.</li>
                    </ul>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
                        <ShieldAlert size={24} />
                        <h2 style={{ margin: 0 }}>4. Penalties & Deactivation</h2>
                    </div>
                    <p>
                        Failure to follow these rules or pay service fees will result in:
                    </p>
                    <ul>
                        <li>Immediate account deactivation.</li>
                        <li>A 10% late penalty fee for service dues.</li>
                        <li>Permanent blacklisting from RoomRent Nepal for fraudulent behavior.</li>
                    </ul>
                </section>

                <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', marginTop: '2rem' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--dash-text-muted)' }}>
                        By creating an account, you acknowledge that you have read and agreed to these terms. RoomRent Nepal reserves the right to update these policies at any time to improve community safety.
                    </p>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <Link to="/signup" className="btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 2rem' }}>
                        Back to Signup
                    </Link>
                </div>
            </div>
        </AuthLayout>
    )
}
