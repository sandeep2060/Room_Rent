export default function DashboardProvider() {
    return (
        <section className="dashboard">
            <div className="dashboard-inner">
                <h1 className="dashboard-title">Room provider dashboard</h1>
                <p className="dashboard-subtitle">
                    Manage your rooms, bookings and earnings in Nrs.
                </p>
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h2>Your listings</h2>
                        <p>
                            Add colourful photos and describe your homestay or flat in Nepali
                            and English.
                        </p>
                    </div>
                    <div className="dashboard-card">
                        <h2>Bookings</h2>
                        <p>
                            See upcoming guests coming to your home from different districts
                            of Nepal.
                        </p>
                    </div>
                    <div className="dashboard-card">
                        <h2>Earnings</h2>
                        <p>
                            Track total income in Nrs and adjust nightly prices per season.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
