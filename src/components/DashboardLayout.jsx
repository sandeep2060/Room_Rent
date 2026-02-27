import { NavLink } from 'react-router-dom'
import { Home, Compass, Heart, MessageSquare, User, Calendar, PlusCircle, PieChart, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'

export default function DashboardLayout({ children, role }) {
    const { profile, signOut } = useAuth()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const seekerLinks = [
        { name: 'Overview', path: '/dashboard-seeker', icon: Home, end: true },
        { name: 'My Bookings', path: '/dashboard-seeker/bookings', icon: Compass },
        { name: 'Saved Rooms', path: '/dashboard-seeker/saved', icon: Heart },
        { name: 'Messages', path: '/dashboard-seeker/messages', icon: MessageSquare },
        { name: 'Profile', path: '/dashboard-seeker/profile', icon: User },
    ]

    const providerLinks = [
        { name: 'Analytics', path: '/dashboard-provider', icon: PieChart, end: true },
        { name: 'My Listings', path: '/dashboard-provider/listings', icon: Home },
        { name: 'Add Listing', path: '/dashboard-provider/add', icon: PlusCircle },
        { name: 'Requests & Calendar', path: '/dashboard-provider/calendar', icon: Calendar },
        { name: 'Messages', path: '/dashboard-provider/messages', icon: MessageSquare },
    ]

    const navLinks = role === 'seeker' ? seekerLinks : providerLinks

    return (
        <div className={`dash-layout theme-${role}`}>
            {/* Mobile Top Bar */}
            <header className="dash-mobile-header">
                <div className="dash-logo">🏠 RoomRent</div>
                <button className="dash-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar (Desktop) / Slide-over (Mobile) */}
            <aside className={`dash-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="dash-sidebar-inner">
                    <div className="dash-brand">
                        <span className="logo-icon">🏠</span>
                        <span>RoomRent Nepal</span>
                    </div>

                    <div className="dash-user-card">
                        <div className="dash-avatar">
                            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="dash-user-info">
                            <span className="name">{profile?.name || 'User'}</span>
                            <span className="role">{role === 'seeker' ? 'Room Seeker' : 'Room Provider'}</span>
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
                                <link.icon size={20} />
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
                {navLinks.slice(0, 4).map((link) => (
                    <NavLink
                        key={link.path}
                        to={link.path}
                        end={link.end}
                        className={({ isActive }) => `dash-bottom-link ${isActive ? 'active' : ''}`}
                    >
                        <link.icon size={22} />
                        <span className="text-xs mt-1">{link.name.split(' ')[0]}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}
