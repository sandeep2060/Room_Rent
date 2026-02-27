import { useState } from 'react'
import { adToBs, bsToAd } from '@sbmdkl/nepali-date-converter'
import './App.css'

const featuredListings = [
  {
    id: 1,
    title: 'Colorful Room in Thamel',
    location: 'Thamel, Kathmandu',
    priceNpr: 2500,
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=800&q=80',
  },
  {
    id: 2,
    title: 'Lakeside Homestay',
    location: 'Lakeside, Pokhara',
    priceNpr: 3200,
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1520256862855-398228c41684?w=800&q=80',
  },
  {
    id: 3,
    title: 'Mountain View Room',
    location: 'Nagarkot, Bhaktapur',
    priceNpr: 2800,
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1549294413-26f195200c16?w=800&q=80',
  },
]

const steps = [
  {
    icon: '🔍',
    title: 'Search Nepal',
    desc: 'Filter rooms by city, district and budget across Nepal.',
  },
  {
    icon: '📅',
    title: 'Book Online',
    desc: 'Reserve instantly or send a request to local hosts.',
  },
  {
    icon: '🏔️',
    title: 'Stay & Explore',
    desc: 'Experience local Nepali culture and hospitality.',
  },
]

const testimonials = [
  {
    text: 'Found a cozy room near Pashupatinath in minutes. Perfect for my Kathmandu visit!',
    author: 'Prakash S.',
    role: 'Traveler from Pokhara',
  },
  {
    text: 'I listed my extra room in Lalitpur and started getting bookings from all over Nepal.',
    author: 'Sangita D.',
    role: 'Host in Lalitpur',
  },
]

const districts = [
  // Province 1 (Koshi)
  'Bhojpur',
  'Dhankuta',
  'Ilam',
  'Jhapa',
  'Khotang',
  'Morang',
  'Okhaldhunga',
  'Panchthar',
  'Sankhuwasabha',
  'Solukhumbu',
  'Sunsari',
  'Taplejung',
  'Terhathum',
  'Udayapur',
  // Madhesh Province
  'Bara',
  'Dhanusha',
  'Mahottari',
  'Parsa',
  'Rautahat',
  'Saptari',
  'Sarlahi',
  'Siraha',
  // Bagmati Province
  'Bhaktapur',
  'Chitwan',
  'Dhading',
  'Dolakha',
  'Kathmandu',
  'Kavrepalanchok',
  'Lalitpur',
  'Makwanpur',
  'Nuwakot',
  'Ramechhap',
  'Rasuwa',
  'Sindhuli',
  'Sindhupalchok',
  // Gandaki Province
  'Baglung',
  'Gorkha',
  'Kaski',
  'Lamjung',
  'Manang',
  'Mustang',
  'Myagdi',
  'Nawalpur',
  'Parbat',
  'Syangja',
  'Tanahun',
  // Lumbini Province
  'Arghakhanchi',
  'Banke',
  'Bardiya',
  'Dang',
  'Gulmi',
  'Kapilvastu',
  'Parasi',
  'Palpa',
  'Pyuthan',
  'Rolpa',
  'Rukum East',
  'Rupandehi',
  // Karnali Province
  'Dailekh',
  'Dolpa',
  'Humla',
  'Jajarkot',
  'Jumla',
  'Kalikot',
  'Mugu',
  'Rukum West',
  'Salyan',
  'Surkhet',
  // Sudurpashchim Province
  'Achham',
  'Baitadi',
  'Bajhang',
  'Bajura',
  'Dadeldhura',
  'Darchula',
  'Doti',
  'Kailali',
  'Kanchanpur',
]

const municipalitiesByDistrict = {
  Kathmandu: [
    'Kathmandu Metropolitan City',
    'Kirtipur Municipality',
    'Tokha Municipality',
    'Budhanilkantha Municipality',
    'Gokarneshwor Municipality',
  ],
  Lalitpur: [
    'Lalitpur Metropolitan City',
    'Godawari Municipality',
    'Mahalaxmi Municipality',
    'Konjyosom Rural Municipality',
  ],
  Bhaktapur: [
    'Bhaktapur Municipality',
    'Madhyapur Thimi Municipality',
    'Suryabinayak Municipality',
    'Changunarayan Municipality',
  ],
  'Kaski (Pokhara)': [
    'Pokhara Metropolitan City',
    'Annapurna Rural Municipality',
    'Madi Rural Municipality',
    'Machhapuchhre Rural Municipality',
  ],
  Chitwan: [
    'Bharatpur Metropolitan City',
    'Ratnanagar Municipality',
    'Rapti Municipality',
    'Kalika Municipality',
  ],
  'Morang (Biratnagar)': [
    'Biratnagar Metropolitan City',
    'Sundar Haraicha Municipality',
    'Belbari Municipality',
    'Ratuwamai Municipality',
  ],
  'Sunsari (Dharan)': [
    'Dharan Sub-Metropolitan City',
    'Itahari Sub-Metropolitan City',
    'Inaruwa Municipality',
    'Duhabi Municipality',
  ],
  'Rupandehi (Butwal)': [
    'Butwal Sub-Metropolitan City',
    'Siddharthanagar Municipality',
    'Tilottama Municipality',
    'Devdaha Municipality',
  ],
  'Dhanusha (Janakpur)': [
    'Janakpurdham Sub-Metropolitan City',
    'Mithila Municipality',
    'Hansapur Municipality',
    'Ganeshman Charnath Municipality',
  ],
  'Parsa (Birgunj)': [
    'Birgunj Metropolitan City',
    'Pokhariya Municipality',
    'Bahudarmai Municipality',
  ],
  Kailali: [
    'Dhangadhi Sub-Metropolitan City',
    'Tikapur Municipality',
    'Lamkichuha Municipality',
    'Ghodaghodi Municipality',
  ],
  'Banke (Nepalgunj)': [
    'Nepalgunj Sub-Metropolitan City',
    'Kohalpur Municipality',
    'Baijanath Rural Municipality',
  ],
  Dang: [
    'Ghorahi Sub-Metropolitan City',
    'Tulsipur Sub-Metropolitan City',
    'Lamahi Municipality',
  ],
  Jhapa: [
    'Birtamode Municipality',
    'Mechinagar Municipality',
    'Bhadrapur Municipality',
    'Damak Municipality',
  ],
  'Makwanpur (Hetauda)': [
    'Hetauda Sub-Metropolitan City',
    'Thaha Municipality',
    'Manahari Rural Municipality',
  ],
}

const VIEWS = {
  HOME: 'home',
  SIGNUP_SEEKER: 'signup-seeker',
  SIGNUP_PROVIDER: 'signup-provider',
  LOGIN_SEEKER: 'login-seeker',
  LOGIN_PROVIDER: 'login-provider',
  DASH_SEEKER: 'dashboard-seeker',
  DASH_PROVIDER: 'dashboard-provider',
}

function AuthLayout({ title, subtitle, children, onBack }) {
  return (
    <section className="auth">
      <div className="auth-inner">
        <button type="button" className="auth-back" onClick={onBack}>
          ← Back to home
        </button>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        <div className="auth-card">{children}</div>
      </div>
    </section>
  )
}

function SignupForm({ initialRole = 'seeker' }) {
  const [form, setForm] = useState({
    role: initialRole,
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dobAd: '',
    dobBs: '',
    district: '',
    municipality: '',
    phone: '',
    ward: '',
    address: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => {
      if (name === 'district') {
        return { ...prev, district: value, municipality: '' }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match.')
      return
    }

    // TODO: replace with Supabase insert
    // eslint-disable-next-line no-console
    console.log('Signup data', form)
    alert('Signup submitted. Connect Supabase next.')
  }

  const availableMunicipalities =
    municipalitiesByDistrict[form.district] || []

  const handleDobAdChange = (e) => {
    const value = e.target.value
    setForm((prev) => {
      const next = { ...prev, dobAd: value }
      if (value) {
        try {
          const bs = adToBs(value)
          next.dobBs = bs
        } catch {
          // ignore invalid
        }
      } else {
        next.dobBs = ''
      }
      return next
    })
  }

  const handleDobBsChange = (e) => {
    const value = e.target.value
    setForm((prev) => {
      const next = { ...prev, dobBs: value }
      if (value) {
        try {
          const ad = bsToAd(value)
          next.dobAd = ad
        } catch {
          // ignore invalid
        }
      } else {
        next.dobAd = ''
      }
      return next
    })
  }

  return (
    <form className={`auth-form role-${form.role}`} onSubmit={handleSubmit}>
      <div className="auth-grid">
        <div className="field field-full">
          <label>Account type</label>
          <div className="role-toggle-buttons">
            <button
              type="button"
              className={
                form.role === 'seeker'
                  ? 'role-toggle-btn active'
                  : 'role-toggle-btn'
              }
              onClick={() =>
                setForm((prev) => ({ ...prev, role: 'seeker' }))
              }
            >
              Room needy user
            </button>
            <button
              type="button"
              className={
                form.role === 'provider'
                  ? 'role-toggle-btn active'
                  : 'role-toggle-btn'
              }
              onClick={() =>
                setForm((prev) => ({ ...prev, role: 'provider' }))
              }
            >
              Room provider user
            </button>
          </div>
        </div>
        <div className="field">
          <label>Name</label>
          <input
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Confirm password</label>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </div>
        <div className="field">
          <label>Gender</label>
          <select
            name="gender"
            required
            value={form.gender}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not">Prefer not to say</option>
          </select>
        </div>
        <div className="field">
          <label>Date of birth (AD)</label>
          <input
            name="dobAd"
            type="date"
            required
            value={form.dobAd}
            onChange={handleDobAdChange}
          />
        </div>
        <div className="field">
          <label>Date of birth (BS)</label>
          <input
            name="dobBs"
            type="text"
            placeholder="YYYY-MM-DD"
            required
            value={form.dobBs}
            onChange={handleDobBsChange}
          />
        </div>
        <div className="field">
          <label>Nepal district</label>
          <select
            name="district"
            required
            value={form.district}
            onChange={handleChange}
          >
            <option value="">Choose district</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Rural / Municipality</label>
          <select
            name="municipality"
            required
            value={form.municipality}
            onChange={handleChange}
            disabled={!form.district}
          >
            <option value="">
              {form.district ? 'Choose municipality' : 'Select district first'}
            </option>
            {availableMunicipalities.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="field field-full">
          <label>Phone (Nepal)</label>
          <div className="phone-input">
            <span className="phone-prefix">+977</span>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              required
              value={form.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                setForm((prev) => ({ ...prev, phone: digits }))
              }}
              placeholder="98XXXXXXXX"
            />
          </div>
        </div>
        <div className="field">
          <label>Ward no.</label>
          <input
            name="ward"
            type="number"
            min={1}
            max={35}
            required
            value={form.ward}
            onChange={handleChange}
          />
        </div>
        <div className="field field-full">
          <label>Full address</label>
          <input
            name="address"
            type="text"
            placeholder="Tole / Street, nearby landmark"
            required
            value={form.address}
            onChange={handleChange}
          />
        </div>
      </div>
      <button type="submit" className="btn-primary auth-submit">
        Create account
      </button>
    </form>
  )
}

function LoginForm({ initialRole = 'seeker', onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(initialRole)

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: replace with Supabase auth
    onLoginSuccess(role)
  }

  return (
    <form className={`auth-form role-${role}`} onSubmit={handleSubmit}>
      <div className="auth-grid">
        <div className="field field-full">
          <label>Account type</label>
          <div className="role-toggle-buttons">
            <button
              type="button"
              className={
                role === 'seeker' ? 'role-toggle-btn active' : 'role-toggle-btn'
              }
              onClick={() => setRole('seeker')}
            >
              Room needy user
            </button>
            <button
              type="button"
              className={
                role === 'provider'
                  ? 'role-toggle-btn active'
                  : 'role-toggle-btn'
              }
              onClick={() => setRole('provider')}
            >
              Room provider user
            </button>
          </div>
        </div>
        <div className="field field-full">
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field field-full">
          <label>Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      <button type="submit" className="btn-primary auth-submit">
        Login
      </button>
    </form>
  )
}

function DashboardSeeker() {
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

function DashboardProvider() {
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

export default function App() {
  const [location, setLocation] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('1')
  const [navOpen, setNavOpen] = useState(false)
  const [view, setView] = useState(VIEWS.HOME)

  const goHome = () => {
    setView(VIEWS.HOME)
    setNavOpen(false)
  }

  const goTo = (next) => {
    setView(next)
    setNavOpen(false)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <button type="button" className="logo" onClick={goHome}>
            <span className="logo-icon">🏠</span>
            <span>RoomRent Nepal</span>
          </button>
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
            <button type="button" onClick={goHome}>
              Home
            </button>
            <a href="#listings" onClick={() => setNavOpen(false)}>
              Listings
            </a>
            <a href="#how-it-works" onClick={() => setNavOpen(false)}>
              How it Works
            </a>
            <a href="#contact" onClick={() => setNavOpen(false)}>
              Contact
            </a>
            <button
              type="button"
              className="btn-nav"
              onClick={() => goTo(VIEWS.SIGNUP_PROVIDER)}
            >
              List your room
            </button>
          </nav>
        </div>
      </header>

      <main>
        {view === VIEWS.HOME && (
          <>
            <section className="hero">
              <div className="hero-3d-bg">
                <div className="cube-wrap">
                  <div className="cube">
                    <div className="face front"></div>
                    <div className="face back"></div>
                    <div className="face right"></div>
                    <div className="face left"></div>
                    <div className="face top"></div>
                    <div className="face bottom"></div>
                  </div>
                </div>
                <div className="floating-shapes">
                  <div className="shape s1"></div>
                  <div className="shape s2"></div>
                  <div className="shape s3"></div>
                  <div className="shape s4"></div>
                  <div className="shape s5"></div>
                </div>
              </div>
              <div className="hero-content">
                <p className="hero-pill">
                  Night mode · Nepal focused · 3D look
                </p>
                <h1 className="hero-title">
                  <span className="line">Find colourful rooms</span>
                  <span className="line accent">across Nepal at night</span>
                </h1>
                <p className="hero-sub">
                  From Kathmandu to Pokhara, discover homestays, city rooms and
                  mountain view stays with transparent prices in Nrs.
                </p>
                <div className="search-card">
                  <div className="search-row">
                    <div className="search-field">
                      <label>District or city</label>
                      <input
                        type="text"
                        placeholder="e.g. Kathmandu, Pokhara, Chitwan"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <div className="search-field">
                      <label>Check-in</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                      />
                    </div>
                    <div className="search-field">
                      <label>Check-out</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                      />
                    </div>
                    <div className="search-field">
                      <label>Guests</label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'guest' : 'guests'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button className="btn-search">Search rooms in Nepal</button>
                  </div>
                </div>
                <div className="hero-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => goTo(VIEWS.SIGNUP_SEEKER)}
                  >
                    I need a room
                  </button>
                  <button
                    type="button"
                    className="btn-outline hero-outline"
                    onClick={() => goTo(VIEWS.SIGNUP_PROVIDER)}
                  >
                    I provide rooms
                  </button>
                </div>
              </div>
            </section>

            <section className="section how-it-works" id="how-it-works">
              <h2 className="section-title">How it works in Nepal</h2>
              <div className="steps-grid">
                {steps.map((step, i) => (
                  <div
                    key={step.title}
                    className="step-card"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    <div className="step-icon">{step.icon}</div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="section listings" id="listings">
              <h2 className="section-title">Featured rooms in Nepal</h2>
              <div className="listings-grid">
                {featuredListings.map((listing, i) => (
                  <article
                    key={listing.id}
                    className="listing-card"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="listing-image-wrap">
                      <img src={listing.image} alt={listing.title} />
                      <span className="listing-price">
                        Nrs {listing.priceNpr.toLocaleString()}
                        <small>/night</small>
                      </span>
                      <span className="listing-rating">★ {listing.rating}</span>
                    </div>
                    <div className="listing-body">
                      <h3>{listing.title}</h3>
                      <p className="listing-location">{listing.location}</p>
                      <button type="button" className="listing-link">
                        View details →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <button type="button" className="btn-outline">
                View all Nepal listings
              </button>
            </section>

            <section className="section why-us">
              <h2 className="section-title">Why choose RoomRent Nepal</h2>
              <div className="benefits-grid">
                <div className="benefit">
                  <div className="benefit-icon">✓</div>
                  <h3>Local verified hosts</h3>
                  <p>
                    Each room provider from different districts of Nepal is
                    checked for quality and safety.
                  </p>
                </div>
                <div className="benefit">
                  <div className="benefit-icon">💳</div>
                  <h3>Secure Nrs payments</h3>
                  <p>
                    Pay in Nepali Rupees with trusted partners and protect your
                    money until check-in.
                  </p>
                </div>
                <div className="benefit">
                  <div className="benefit-icon">🏔️</div>
                  <h3>Designed for Nepal travel</h3>
                  <p>
                    Filter by district, rural municipality and ward to find
                    rooms near temples, trekking routes and cities.
                  </p>
                </div>
              </div>
            </section>

            <section className="section testimonials" id="testimonials">
              <h2 className="section-title">What people say</h2>
              <div className="testimonials-grid">
                {testimonials.map((t, i) => (
                  <blockquote key={i} className="testimonial-card">
                    <p>"{t.text}"</p>
                    <footer>
                      <strong>{t.author}</strong> — {t.role}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </section>

            <section className="cta">
              <div className="cta-inner">
                <h2>Start your next stay in Nepal</h2>
                <p>
                  Sign up as a traveller looking for rooms or a host ready to
                  welcome guests.
                </p>
                <div className="cta-buttons">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => goTo(VIEWS.SIGNUP_SEEKER)}
                  >
                    I need a room
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => goTo(VIEWS.SIGNUP_PROVIDER)}
                  >
                    I provide rooms
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {view === VIEWS.SIGNUP_SEEKER && (
          <AuthLayout
            title="Create your RoomRent Nepal account"
            subtitle="Choose your account type and fill in your details to get started."
            onBack={goHome}
          >
            <SignupForm initialRole="seeker" />
          </AuthLayout>
        )}

        {view === VIEWS.SIGNUP_PROVIDER && (
          <AuthLayout
            title="Create your RoomRent Nepal account"
            subtitle="Choose your account type and fill in your details to get started."
            onBack={goHome}
          >
            <SignupForm initialRole="provider" />
          </AuthLayout>
        )}

        {view === VIEWS.LOGIN_SEEKER && (
          <AuthLayout
            title="Login to RoomRent Nepal"
            subtitle="Choose your account type and login to your dashboard."
            onBack={goHome}
          >
            <LoginForm
              initialRole="seeker"
              onLoginSuccess={(role) =>
                setView(
                  role === 'provider' ? VIEWS.DASH_PROVIDER : VIEWS.DASH_SEEKER,
                )
              }
            />
          </AuthLayout>
        )}

        {view === VIEWS.LOGIN_PROVIDER && (
          <AuthLayout
            title="Login to RoomRent Nepal"
            subtitle="Choose your account type and login to your dashboard."
            onBack={goHome}
          >
            <LoginForm
              initialRole="provider"
              onLoginSuccess={(role) =>
                setView(
                  role === 'provider' ? VIEWS.DASH_PROVIDER : VIEWS.DASH_SEEKER,
                )
              }
            />
          </AuthLayout>
        )}

        {view === VIEWS.DASH_SEEKER && <DashboardSeeker />}
        {view === VIEWS.DASH_PROVIDER && <DashboardProvider />}
      </main>

      <footer className="footer" id="contact">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-icon">🏠</span>
            <span>RoomRent Nepal</span>
          </div>
          <div className="footer-links">
            <button type="button" onClick={goHome}>
              Home
            </button>
            <button type="button" onClick={() => goTo(VIEWS.LOGIN_SEEKER)}>
              Login (room seeker)
            </button>
            <button type="button" onClick={() => goTo(VIEWS.LOGIN_PROVIDER)}>
              Login (room provider)
            </button>
            <button type="button" onClick={() => goTo(VIEWS.SIGNUP_SEEKER)}>
              Sign up
            </button>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} RoomRent Nepal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
