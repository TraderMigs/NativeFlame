import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStock,     setLowStock]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/admin/login'); return }

      const [{ count: products }, { data: orders }, { data: lowStockData }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('id,name,stock').eq('is_active', true).lte('stock', 5).order('stock', { ascending: true })
      ])

      const allOrders = orders || []
      const revenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0)
      const pending = allOrders.filter(o => o.status === 'pending').length

      setStats({ products: products || 0, orders: allOrders.length, revenue, pending })
      setRecentOrders(allOrders)
      setLowStock(lowStockData || [])
      setLoading(false)
    }
    load()
  }, [navigate])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Admin Nav */}
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-cinzel font-bold text-gold text-lg tracking-wider">Native Flame</h1>
          <p className="font-raleway text-xs text-cream/40 uppercase tracking-widest">Admin Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" target="_blank" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">
            View Site →
          </Link>
          <button onClick={handleLogout} className="font-raleway text-xs text-cream/40 hover:text-red-400 transition-colors uppercase tracking-wider">
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Active Products', val: stats.products, icon: '🕯️', color: 'text-mahogany' },
            { label: 'Total Orders', val: stats.orders, icon: '📦', color: 'text-mahogany' },
            { label: 'Revenue', val: `$${stats.revenue.toFixed(2)}`, icon: '💰', color: 'text-teal-dark' },
            { label: 'Pending', val: stats.pending, icon: '⏳', color: 'text-gold' },
          ].map(({ label, val, icon, color }) => (
            <div key={label} className="bg-white border border-parchment-dark p-5">
              <div className="text-2xl mb-2">{icon}</div>
              <div className={`font-cinzel text-2xl font-bold ${color}`}>{val}</div>
              <div className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Link to="/admin/products"
            className="flex items-center gap-4 bg-mahogany text-cream p-6 hover:bg-mahogany-light transition-colors group">
            <div className="text-3xl">🕯️</div>
            <div>
              <h3 className="font-cinzel font-semibold tracking-wide group-hover:text-gold transition-colors">Manage Products</h3>
              <p className="font-raleway text-xs text-cream/50 mt-1">Add, edit, remove candles · Upload photos</p>
            </div>
            <svg className="w-5 h-5 ml-auto text-gold/40 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link to="/admin/orders"
            className="flex items-center gap-4 bg-white border border-parchment-dark p-6 hover:border-gold transition-colors group">
            <div className="text-3xl">📦</div>
            <div>
              <h3 className="font-cinzel font-semibold text-mahogany tracking-wide group-hover:text-gold transition-colors">View Orders</h3>
              <p className="font-raleway text-xs text-mahogany/50 mt-1">Track orders · Update status · Customer info</p>
            </div>
            <svg className="w-5 h-5 ml-auto text-mahogany/20 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link to="/admin/site-settings"
            className="flex items-center gap-4 bg-white border border-parchment-dark p-6 hover:border-gold transition-colors group">
            <div className="text-3xl">🎨</div>
            <div>
              <h3 className="font-cinzel font-semibold text-mahogany tracking-wide group-hover:text-gold transition-colors">Site Appearance</h3>
              <p className="font-raleway text-xs text-mahogany/50 mt-1">Colors · Page text · Section styles</p>
            </div>
            <svg className="w-5 h-5 ml-auto text-mahogany/20 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link to="/admin/subscribers"
            className="flex items-center gap-4 bg-white border border-parchment-dark p-6 hover:border-gold transition-colors group">
            <div className="text-3xl">📬</div>
            <div>
              <h3 className="font-cinzel font-semibold text-mahogany tracking-wide group-hover:text-gold transition-colors">Email Subscribers</h3>
              <p className="font-raleway text-xs text-mahogany/50 mt-1">View list · Search · Export CSV</p>
            </div>
            <svg className="w-5 h-5 ml-auto text-mahogany/20 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link to="/admin/discounts"
            className="flex items-center gap-4 bg-white border border-parchment-dark p-6 hover:border-gold transition-colors group">
            <div className="text-3xl">🏷️</div>
            <div>
              <h3 className="font-cinzel font-semibold text-mahogany tracking-wide group-hover:text-gold transition-colors">Discount Codes</h3>
              <p className="font-raleway text-xs text-mahogany/50 mt-1">Create · Assign to products · Set expiry</p>
            </div>
            <svg className="w-5 h-5 ml-auto text-mahogany/20 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Low Stock Alert */}
        {lowStock.length > 0 && (
          <div className="mb-8 bg-amber-50 border border-amber-200 px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h2 className="font-cinzel text-sm font-semibold text-amber-800">Low Stock Alert</h2>
              </div>
              <Link to="/admin/products" className="font-raleway text-xs text-gold uppercase tracking-wider hover:underline">
                Manage Products
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(p => (
                <span key={p.id}
                  className={`font-raleway text-xs px-3 py-1.5 border ${
                    p.stock === 0
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-amber-50 border-amber-300 text-amber-700'
                  }`}>
                  {p.name} — {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-cinzel text-lg font-semibold text-mahogany">Recent Orders</h2>
            <Link to="/admin/orders" className="font-raleway text-xs text-gold uppercase tracking-wider hover:underline">View All</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-white border border-parchment-dark p-10 text-center">
              <p className="font-lora italic text-mahogany/40">No orders yet</p>
            </div>
          ) : (
            <div className="bg-white border border-parchment-dark overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-parchment border-b border-parchment-dark">
                  <tr>
                    {['Order', 'Customer', 'Total', 'Method', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-raleway text-xs uppercase tracking-wider text-mahogany/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-parchment/50 transition-colors">
                      <td className="px-4 py-3 font-cinzel text-xs text-mahogany/60">#{order.id.split('-')[0].toUpperCase()}</td>
                      <td className="px-4 py-3 font-lora text-mahogany">{order.customer_name}</td>
                      <td className="px-4 py-3 font-cinzel font-bold text-gold">${Number(order.total).toFixed(2)}</td>
                      <td className="px-4 py-3 font-raleway text-xs text-mahogany/60 capitalize">{order.payment_method}</td>
                      <td className="px-4 py-3">
                        <span className={`font-raleway text-xs font-semibold uppercase tracking-wider px-2 py-1 ${
                          order.status === 'confirmed' ? 'bg-teal/10 text-teal-dark' :
                          order.status === 'shipped' ? 'bg-gold/10 text-gold' :
                          order.status === 'pending' ? 'bg-mahogany/10 text-mahogany' :
                          'bg-parchment text-mahogany/50'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-raleway text-xs text-mahogany/40">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
