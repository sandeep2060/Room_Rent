import { NavLink } from 'react-router-dom'
import {
    Home, User, LogOut, ChevronLeft, ChevronRight,
    MessageSquare, Heart, Bookmark, LayoutDashboard,
    PlusCircle, List, CreditCard, ShieldCheck, TrendingUp, Users
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './Dashboard.css'

export default function DashboardLayout({ children, role }) {
    const { profile, signOut } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!profile?.id) return

        const fetchUnread = async () => {
            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', profile.id)
                .eq('is_read', false)

            if (count !== null) setUnreadCount(count)
        }

        fetchUnread()

        const sub = supabase.channel(`public:messages:receiver_id=eq.${profile.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${profile.id}` },
                () => { setUnreadCount(prev => prev + 1) }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${profile.id}` },
                () => { fetchUnread() }
            )
            .subscribe()

        return () => supabase.removeChannel(sub)
    }, [profile])

    const seekerLinks = [
        { name: 'Overview', path: '/dashboard-seeker', icon: Home, end: true },
        { name: 'My Bookings', path: '/dashboard-seeker/bookings', icon: Bookmark },
        { name: 'Saved Rooms', path: '/dashboard-seeker/saved', icon: Heart },
        { name: 'Wallet', path: '/dashboard-seeker/wallet', icon: CreditCard },
        { name: 'Messages', path: '/dashboard-seeker/messages', icon: MessageSquare },
        { name: 'Profile', path: '/dashboard-seeker/profile', icon: User },
    ]

    const providerLinks = [
        { name: 'Dashboard', path: '/dashboard-provider', icon: LayoutDashboard, end: true },
        { name: 'My Listings', path: '/dashboard-provider/listings', icon: List },
        { name: 'Add Listing', path: '/dashboard-provider/add', icon: PlusCircle },
        { name: 'Wallet', path: '/dashboard-provider/wallet', icon: CreditCard },
        { name: 'Messages', path: '/dashboard-provider/messages', icon: MessageSquare },
        { name: 'Profile', path: '/dashboard-provider/profile', icon: User },
    ]

    const ownerLinks = [
        { name: 'Master Stats', path: '/dashboard-owner', icon: LayoutDashboard, end: true },
        { name: 'User Directory', path: '/dashboard-owner/users', icon: Users },
        { name: 'Analytics', path: '/dashboard-owner/analytics', icon: TrendingUp },
        { name: 'Security', path: '/dashboard-owner/security', icon: ShieldCheck },
        { name: 'Messages', path: '/dashboard-owner/messages', icon: MessageSquare },
        { name: 'Profile', path: '/dashboard-owner/profile', icon: User },
    ]

    let navLinks
    if (role === 'seeker') {
        navLinks = seekerLinks
    } else if (role === 'provider') {
        navLinks = providerLinks
    } else if (role === 'owner') {
        navLinks = ownerLinks
    } else {
        navLinks = []
    }

    return (
        <div className={`dash-layout theme-${role}`}>
            {/* Mobile Top Bar */}
            <header className="dash-mobile-header">
                <div className="dash-logo">🏠 RoomRent</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="mobile-logout-btn"
                        onClick={() => signOut()}
                        title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                    <button className="dash-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                    </button>
                </div>
            </header>

            {/* Sidebar (Desktop) / Slide-over (Mobile) */}
            <aside className={`dash-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="dash-sidebar-inner">
                    <div className="dash-brand">
                        <span className="logo-icon">🏠</span>
                        <span>RoomRent Nepal</span>
                    </div>

                    <div className="dash-user-card">
                        <div className="dash-avatar" style={{ overflow: 'hidden' }}>
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>
                        <div className="dash-user-info">
                            <span className="name">{profile?.name || 'User'}</span>
                            <span className="role">
                                {role === 'seeker' ? 'Room Seeker' : role === 'provider' ? 'Room Provider' : 'Master Owner'}
                            </span>
                        </div>
                    </div>

                    <nav className="dash-nav">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                end={link.end}
                                className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <div style={{ position: 'relative' }}>
                                    <link.icon size={20} />
                                    {link.name === 'Messages' && unreadCount > 0 && (
                                        <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <span>{link.name}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <button className="dash-logout hover:text-red-400" onClick={() => signOut()}>
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="dash-main">
                <div className="dash-content-wrapper">
                    {children}
                </div>
            </main>

            {/* Bottom Navigation (Mobile) */}
            <nav className="dash-bottom-nav">
                {navLinks.slice(0, 5).map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.end}
                        className={({ isActive }) => `dash-bottom-link ${isActive ? 'active' : ''}`}
                    >
                        <div style={{ position: 'relative' }}>
                            <link.icon size={22} />
                            {link.name === 'Messages' && unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: '-4px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 'bold', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <span className="text-xs mt-1" style={{ fontSize: '0.65rem' }}>{link.name.split(' ')[0]}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}
