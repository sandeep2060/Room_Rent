import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="footer" id="contact">
            <div className="footer-inner">
                <div className="footer-brand">
                    <span className="logo-icon">🏠</span>
                    <span>RoomRent Nepal</span>
                </div>
                <div className="footer-links">
                    <Link to="/">Home</Link>
                    <Link to="/login">Login</Link>
                    <Link to="/signup">Sign up</Link>
                </div>
                <p className="footer-copy">
                    © {new Date().getFullYear()} RoomRent Nepal. All rights reserved.
                </p>
            </div>
        </footer>
    )
}
