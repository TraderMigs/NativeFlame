import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const db = supabase

const COLORS = ['#C8922A','#4AADAA','#8B5A1A','#2A7A78','#E8B84B','#5ABDB9','#A07020','#1C6A68']

const RANGES = [
  { label: 'Last 7 days',  days: 7   },
  { label: 'Last 30 days', days: 30  },
  { label: 'Last 90 days', days: 90  },
  { label: 'All time',     days: 9999 },
]

const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-parchment-dark p-5">
      <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-1">{label}</p>
      <p className={`font-cinzel text-2xl font-bold ${color || 'text-mahogany'}`}>{value}</p>
      {sub && <p className="font-raleway text-xs text-mahogany/40 mt-1">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-parchment-dark px-3 py-2 shadow-lg">
        <p className="font-raleway text-xs text-mahogany/60 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-cinzel text-sm font-bold" style={{ color: p.color }}>
            {prefix}{typeof p.value === 'number' && prefix === '$' ? p.value.toFixed(2) : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminAnalytics() {
  const navigate = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [range,   setRange]   = useState(30)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await (db).auth.getUser()
      if (!user) { navigate('/admin/login'); return }
      load()
    }
    check()
  }, [navigate])

  async function load() {
    setLoading(true)
    try {
      const { data } = await (db).from('orders')
        .select('*')
        .order('created_at', { ascending: true })
      setOrders(data || [])
    } catch (_) { setOrders([]) }
    setLoading(false)
  }

  // Filter orders by selected range
  const filtered = useMemo(() => {
    if (range === 9999) return orders
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range)
    return orders.filter(o => new Date(o.created_at) >= cutoff)
  }, [orders, range])

  // ── STAT CARDS ──────────────────────────────────────
  const totalRevenue = filtered.reduce((s, o) => s + Number(o.total || 0), 0)
  const totalOrders  = filtered.length
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const paidOrders   = filtered.filter(o => o.payment_status === 'paid').length
  const pendingOrders= filtered.filter(o => o.status === 'pending').length
  const totalDiscount= filtered.reduce((s, o) => s + Number(o.discount_amount || 0), 0)

  // ── REVENUE OVER TIME ────────────────────────────────
  const revenueByDay = useMemo(() => {
    const map = {}
    filtered.forEach(o => {
      const d = new Date(o.created_at)
      const key = range <= 30
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (!map[key]) map[key] = { date: key, revenue: 0, orders: 0 }
      map[key].revenue += Number(o.total || 0)
      map[key].orders  += 1
    })
    return Object.values(map)
  }, [filtered, range])

  // ── TOP PRODUCTS ─────────────────────────────────────
  const topProducts = useMemo(() => {
    const map = {}
    filtered.forEach(o => {
      (o.items || []).forEach(item => {
        if (!map[item.name]) map[item.name] = { name: item.name, units: 0, revenue: 0 }
        map[item.name].units   += item.quantity
        map[item.name].revenue += item.price * item.quantity
      })
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }, [filtered])

  // ── ORDERS BY STATUS ─────────────────────────────────
  const byStatus = useMemo(() => {
    const map = {}
    filtered.forEach(o => {
      const s = o.status || 'pending'
      map[s] = (map[s] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filtered])

  // ── REVENUE BY PRODUCT TYPE ──────────────────────────
  const byType = useMemo(() => {
    const map = {}
    filtered.forEach(o => {
      (o.items || []).forEach(item => {
        const t = item.product_type || 'candle'
        if (!map[t]) map[t] = { name: t, revenue: 0 }
        map[t].revenue += item.price * item.quantity
      })
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue)
  }, [filtered])

  // ── SALES BY DAY OF WEEK ─────────────────────────────
  const byDow = useMemo(() => {
    const map = { 0:0,1:0,2:0,3:0,4:0,5:0,6:0 }
    filtered.forEach(o => {
      const dow = new Date(o.created_at).getDay()
      map[dow] += Number(o.total || 0)
    })
    return DAYS_OF_WEEK.map((day, i) => ({ day, revenue: map[i] }))
  }, [filtered])

  // ── DISCOUNT CODE USAGE ──────────────────────────────
  const discountUsage = useMemo(() => {
    const map = {}
    filtered.filter(o => o.discount_code).forEach(o => {
      const c = o.discount_code
      if (!map[c]) map[c] = { code: c, uses: 0, saved: 0 }
      map[c].uses  += 1
      map[c].saved += Number(o.discount_amount || 0)
    })
    return Object.values(map).sort((a, b) => b.uses - a.uses)
  }, [filtered])

  // ── PAYMENT STATUS BREAKDOWN ─────────────────────────
  const byPayment = useMemo(() => {
    const map = {}
    filtered.forEach(o => {
      const s = o.payment_status || 'unpaid'
      map[s] = (map[s] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filtered])

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-parchment">

      {/* Header */}
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Analytics</h1>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-2">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className={`font-raleway text-xs font-semibold uppercase tracking-wider px-3 py-1.5 transition-all ${
                range === r.days ? 'bg-gold text-cream' : 'text-cream/50 hover:text-cream'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-10">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Revenue"   value={`$${totalRevenue.toFixed(2)}`}  color="text-gold"/>
          <StatCard label="Total Orders"    value={totalOrders}                     color="text-mahogany"/>
          <StatCard label="Avg Order Value" value={`$${avgOrder.toFixed(2)}`}       color="text-teal-dark"/>
          <StatCard label="Paid Orders"     value={paidOrders}                      color="text-teal-dark"
            sub={`${totalOrders > 0 ? Math.round(paidOrders/totalOrders*100) : 0}% of total`}/>
          <StatCard label="Pending"         value={pendingOrders}                   color="text-amber-600"/>
          <StatCard label="Total Discounts" value={`$${totalDiscount.toFixed(2)}`}  color="text-mahogany/60"/>
        </div>

        {/* ── REVENUE OVER TIME ── */}
        <div className="bg-white border border-parchment-dark p-6">
          <h2 className="font-cinzel text-base font-bold text-mahogany mb-1">Revenue Over Time</h2>
          <p className="font-raleway text-xs text-mahogany/40 mb-6 uppercase tracking-wider">
            {RANGES.find(r => r.days === range)?.label}
          </p>
          {revenueByDay.length === 0 ? (
            <p className="text-center font-lora italic text-mahogany/30 py-12">No order data in this range yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5EDD9"/>
                <XAxis dataKey="date" tick={{ fontFamily: 'Raleway', fontSize: 10, fill: '#1C0A0080' }} tickLine={false}/>
                <YAxis tick={{ fontFamily: 'Raleway', fontSize: 10, fill: '#1C0A0080' }} tickLine={false} axisLine={false}
                  tickFormatter={v => `$${v}`}/>
                <Tooltip content={<CustomTooltip prefix="$"/>}/>
                <Line type="monotone" dataKey="revenue" stroke="#C8922A" strokeWidth={2.5}
                  dot={{ fill: '#C8922A', r: 3 }} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── TOP PRODUCTS + SALES BY DAY ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Products */}
          <div className="bg-white border border-parchment-dark p-6">
            <h2 className="font-cinzel text-base font-bold text-mahogany mb-1">Top Products by Revenue</h2>
            <p className="font-raleway text-xs text-mahogany/40 mb-6 uppercase tracking-wider">Top 8 products</p>
            {topProducts.length === 0 ? (
              <p className="text-center font-lora italic text-mahogany/30 py-12">No order data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5EDD9" horizontal={false}/>
                  <XAxis type="number" tick={{ fontFamily: 'Raleway', fontSize: 10, fill: '#1C0A0080' }}
                    tickFormatter={v => `$${v}`} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={90}
                    tick={{ fontFamily: 'Lora', fontSize: 10, fill: '#1C0A00' }} tickLine={false} axisLine={false}/>
                  <Tooltip content={<CustomTooltip prefix="$"/>}/>
                  <Bar dataKey="revenue" fill="#C8922A" radius={[0,3,3,0]}>
                    {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Sales by Day of Week */}
          <div className="bg-white border border-parchment-dark p-6">
            <h2 className="font-cinzel text-base font-bold text-mahogany mb-1">Revenue by Day of Week</h2>
            <p className="font-raleway text-xs text-mahogany/40 mb-6 uppercase tracking-wider">Best days to run promos</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byDow} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5EDD9"/>
                <XAxis dataKey="day" tick={{ fontFamily: 'Raleway', fontSize: 11, fill: '#1C0A0080' }} tickLine={false}/>
                <YAxis tick={{ fontFamily: 'Raleway', fontSize: 10, fill: '#1C0A0080' }} tickLine={false} axisLine={false}
                  tickFormatter={v => `$${v}`}/>
                <Tooltip content={<CustomTooltip prefix="$"/>}/>
                <Bar dataKey="revenue" radius={[3,3,0,0]}>
                  {byDow.map((entry, i) => (
                    <Cell key={i} fill={entry.revenue === Math.max(...byDow.map(d => d.revenue)) ? '#C8922A' : '#E8D9BE'}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── PIE CHARTS ROW ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Orders by Status */}
          <div className="bg-white border border-parchment-dark p-6">
            <h2 className="font-cinzel text-sm font-bold text-mahogany mb-1">Orders by Status</h2>
            <p className="font-raleway text-xs text-mahogany/40 mb-4 uppercase tracking-wider">Fulfillment breakdown</p>
            {byStatus.length === 0 ? (
              <p className="text-center font-lora italic text-mahogany/30 py-8 text-sm">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}>
                    {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue by Product Type */}
          <div className="bg-white border border-parchment-dark p-6">
            <h2 className="font-cinzel text-sm font-bold text-mahogany mb-1">Revenue by Product Type</h2>
            <p className="font-raleway text-xs text-mahogany/40 mb-4 uppercase tracking-wider">Which types sell most</p>
            {byType.length === 0 ? (
              <p className="text-center font-lora italic text-mahogany/30 py-8 text-sm">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byType} dataKey="revenue" nameKey="name" cx="50%" cy="50%"
                    outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}>
                    {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v => `$${Number(v).toFixed(2)}`}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment Status */}
          <div className="bg-white border border-parchment-dark p-6">
            <h2 className="font-cinzel text-sm font-bold text-mahogany mb-1">Payment Status</h2>
            <p className="font-raleway text-xs text-mahogany/40 mb-4 uppercase tracking-wider">Paid vs unpaid</p>
            {byPayment.length === 0 ? (
              <p className="text-center font-lora italic text-mahogany/30 py-8 text-sm">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byPayment} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={70} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}>
                    {byPayment.map((entry, i) => (
                      <Cell key={i} fill={
                        entry.name === 'paid'     ? '#4AADAA' :
                        entry.name === 'unpaid'   ? '#DC2626' :
                        entry.name === 'refunded' ? '#C8922A' : COLORS[i]
                      }/>
                    ))}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── TOP PRODUCTS TABLE ── */}
        {topProducts.length > 0 && (
          <div className="bg-white border border-parchment-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-parchment-dark">
              <h2 className="font-cinzel text-base font-bold text-mahogany">Product Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-parchment">
                  <tr>
                    {['Product','Units Sold','Revenue','Avg Price'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-raleway text-xs uppercase tracking-wider text-mahogany/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment">
                  {topProducts.map((p, i) => (
                    <tr key={p.name} className="hover:bg-parchment/40 transition-colors">
                      <td className="px-5 py-3 font-lora text-sm text-mahogany font-semibold">
                        <span className="font-raleway text-xs text-mahogany/30 mr-2">#{i+1}</span>{p.name}
                      </td>
                      <td className="px-5 py-3 font-cinzel text-sm text-mahogany">{p.units}</td>
                      <td className="px-5 py-3 font-cinzel text-sm font-bold text-gold">${p.revenue.toFixed(2)}</td>
                      <td className="px-5 py-3 font-cinzel text-xs text-mahogany/60">
                        ${(p.revenue / p.units).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DISCOUNT CODE USAGE ── */}
        {discountUsage.length > 0 && (
          <div className="bg-white border border-parchment-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-parchment-dark">
              <h2 className="font-cinzel text-base font-bold text-mahogany">Discount Code Usage</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-parchment">
                  <tr>
                    {['Code','Times Used','Total Saved by Customers'].map(h => (
                      <th key={h} className="text-left px-5 py-3 font-raleway text-xs uppercase tracking-wider text-mahogany/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment">
                  {discountUsage.map(d => (
                    <tr key={d.code} className="hover:bg-parchment/40 transition-colors">
                      <td className="px-5 py-3 font-cinzel text-sm font-bold text-gold tracking-widest">{d.code}</td>
                      <td className="px-5 py-3 font-cinzel text-sm text-mahogany">{d.uses}</td>
                      <td className="px-5 py-3 font-cinzel text-sm text-mahogany">${d.saved.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalOrders === 0 && (
          <div className="bg-white border border-parchment-dark p-16 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="font-cinzel text-xl text-mahogany mb-2">No orders yet</h3>
            <p className="font-lora italic text-mahogany/50 text-sm">
              Charts and stats will appear here once customers start placing orders.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
