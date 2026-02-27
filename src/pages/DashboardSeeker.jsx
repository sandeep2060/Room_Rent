export default function DashboardSeeker() {
    return (
        <section className="dashboard">
            <div className="dashboard-inner">
                <h1 className="dashboard-title">Room seeker dashboard</h1>
                <p className="dashboard-subtitle">
                    Track your bookings and favourite rooms across Nepal.
                </p>
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h2>Upcoming trips</h2>
                        <p>
                            No trips yet. Search rooms in Kathmandu, Pokhara, Chitwan and more
                            to plan your next journey.
                        </p>
                    </div>
                    <div className="dashboard-card">
                        <h2>Saved rooms</h2>
                        <p>
                            Save colourful homestays, city rooms and mountain lodges to
                            compare prices in Nrs.
                        </p>
                    </div>
                    <div className="dashboard-card">
                        <h2>Profile</h2>
                        <p>
                            Update your address, district and contact details for smooth
                            check-in with hosts.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
