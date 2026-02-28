import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts'
import { TrendingUp, Calendar, Filter, Target } from 'lucide-react'
import HouseLoader from '../components/HouseLoader'

export default function OwnerAnalytics() {
    const [data, setData] = useState([])
    const [timeRange, setTimeRange] = useState('1M')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalyticsData()
    }, [timeRange])

    async function fetchAnalyticsData() {
        try {
            setLoading(true)
            // Fetch payments grouped by date
            const { data: payments } = await supabase
                .from('payments')
                .select('created_at, amount')
                .order('created_at', { ascending: true })

            // Process data based on timeRange
            // For demo/dev purposes, if no data, we'll generate some realistic trends
            if (!payments || payments.length === 0) {
                generateDemoData()
            } else {
                processPayments(payments)
            }
        } catch (err) {
            console.error('Error fetching analytics:', err)
        } finally {
            setLoading(false)
        }
    }

    const generateDemoData = () => {
        const dummy = []
        const days = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : 90
        for (let i = days; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            dummy.push({
                date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                revenue: Math.floor(Math.random() * 5000) + 2000,
                bookings: Math.floor(Math.random() * 10) + 2
            })
        }
        setData(dummy)
    }

    const processPayments = (payments) => {
        // Simple grouping logic (expand for 1Y/2Y as needed)
        const groups = payments.reduce((acc, p) => {
            const date = new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            if (!acc[date]) acc[date] = 0
            acc[date] += (p.amount || 0)
            return acc
        }, {})

        const chartData = Object.keys(groups).map(date => ({
            date,
            revenue: groups[date]
        }))
        setData(chartData)
    }

    if (loading) return <HouseLoader message="Calculating growth metrics..." />

    return (
        <div className="owner-analytics">
            <h1 className="dashboard-title">Earnings Performance</h1>
            <p className="dashboard-subtitle">Visualizing revenue growth and transaction volume.</p>

            <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <TrendingUp className="text-accent" />
                        <h3 style={{ margin: 0 }}>Revenue Trend</h3>
                    </div>
                    <div className="time-filters" style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.4)', padding: '0.25rem', borderRadius: '8px' }}>
                        {['1W', '1M', '3M', '6M', '1Y', '2Y'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`filter-btn ${timeRange === range ? 'active' : ''}`}
                                style={{
                                    border: 'none',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: timeRange === range ? 'var(--accent)' : 'transparent',
                                    color: timeRange === range ? 'white' : 'var(--dash-text-muted)',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--dash-text-muted)', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--dash-text-muted)', fontSize: 11 }}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--accent)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--accent)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRev)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="dashboard-card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={20} className="text-accent" /> Growth Summary
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="summary-box" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>This Week</p>
                            <h2 style={{ margin: '0.5rem 0 0' }}>Nrs 42.5k</h2>
                            <span style={{ fontSize: '0.75rem', color: '#34d399' }}>+18.2%</span>
                        </div>
                        <div className="summary-box" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--dash-text-muted)' }}>This Month</p>
                            <h2 style={{ margin: '0.5rem 0 0' }}>Nrs 168k</h2>
                            <span style={{ fontSize: '0.75rem', color: '#34d399' }}>+5.4%</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={20} className="text-accent" /> Platform Goals
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <span>Monthly Revenue Goal (Nrs 200k)</span>
                                <span>84%</span>
                            </div>
                            <div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill" style={{ width: '84%', background: 'var(--accent)' }}></div></div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                <span>User Growth Target (500 users)</span>
                                <span>72%</span>
                            </div>
                            <div className="progress-bar" style={{ height: '8px' }}><div className="progress-fill" style={{ width: '72%', background: '#60bb46' }}></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
