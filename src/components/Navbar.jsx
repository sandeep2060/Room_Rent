import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
    const [navOpen, setNavOpen] = useState(false)
    const { session, profile, signOut } = useAuth()
    const navigate = useNavigate()

    const closeNav = () => setNavOpen(false)

    const handleSignOut = async () => {
        await signOut()
        closeNav()
        navigate('/')
    }

    return (
        <header className="header">
            <div className="header-inner">
                <Link to="/" className="logo" onClick={closeNav}>
                    <span className="logo-icon">🏠</span>
                    <span style={{ color: 'white', fontWeight: '800' }}>RoomRent <span style={{ color: 'var(--accent)' }}>Nepal</span></span>
                </Link>
                <button
                    className="nav-toggle"
                    onClick={() => setNavOpen(!navOpen)}
                    aria-label="Menu"
                >
                    <span className={navOpen ? 'open' : ''}></span>
                    <span className={navOpen ? 'open' : ''}></span>
                    <span className={navOpen ? 'open' : ''}></span>
                </button>
                <nav className={`nav ${navOpen ? 'open' : ''}`}>
                    <Link to="/" onClick={closeNav}>
                        Home
                    </Link>

                    {session ? (
                        <>
                            {profile?.role === 'seeker' && (
                                <Link to="/dashboard-seeker" onClick={closeNav}>
                                    My Dashboard
                                </Link>
                            )}
                            {profile?.role === 'provider' && (
                                <Link to="/dashboard-provider" onClick={closeNav}>
                                    Provider Dashboard
                                </Link>
                            )}
                            <button type="button" className="btn-nav" onClick={handleSignOut}>
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <a href="/#listings" onClick={closeNav}>
                                Listings
                            </a>
                            <a href="/#how-it-works" onClick={closeNav}>
                                How it Works
                            </a>
                            <Link to="/login" onClick={closeNav}>
                                Login
                            </Link>
                            <Link to="/signup" className="btn-nav" onClick={closeNav}>
                                List your room
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    )
}
