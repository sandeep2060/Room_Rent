import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <section className="auth">
            <div className="auth-inner">
                <Link to="/" className="auth-back">
                    ← Back to home
                </Link>
                <h1 className="auth-title">{title}</h1>
                <p className="auth-subtitle">{subtitle}</p>
                <div className="auth-card">{children}</div>
            </div>
        </section>
    )
}
