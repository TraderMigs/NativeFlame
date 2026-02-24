import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/admin/login'); return }
      loadOrders()
    }
    check()
  }, [navigate])

  async function loadOrders() {
    setLoading(true)
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(orderId, status) {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusColor = (s) => {
    if (s === 'confirmed' || s === 'delivered') return 'bg-teal/10 text-teal-dark border-teal/20'
    if (s === 'shipped' || s === 'processing') return 'bg-gold/10 text-gold border-gold/20'
    if (s === 'pending') return 'bg-mahogany/10 text-mahogany border-mahogany/20'
    if (s === 'cancelled') return 'bg-red-50 text-red-500 border-red-200'
    return 'bg-parchment text-mahogany/50'
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Orders</h1>
        </div>
        <div className="font-raleway text-xs text-cream/40">
          {orders.length} total orders
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['all', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`font-raleway text-xs font-semibold uppercase tracking-wider px-4 py-2 transition-all ${
                filter === s
                  ? 'bg-mahogany text-cream'
                  : 'border border-parchment-dark text-mahogany/50 hover:border-mahogany hover:text-mahogany'
              }`}
            >
              {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className="font-cinzel text-mahogany/40">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div key={order.id} className="bg-white border border-parchment-dark overflow-hidden">
                {/* Order Header Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-parchment/50 transition-colors"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <div className="min-w-0 flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                    <div>
                      <p className="font-cinzel text-xs text-mahogany/50 uppercase">Order</p>
                      <p className="font-cinzel font-semibold text-sm text-mahogany">#{order.id.split('-')[0].toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="font-cinzel text-xs text-mahogany/50 uppercase">Customer</p>
                      <p className="font-lora text-sm text-mahogany truncate">{order.customer_name}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="font-cinzel text-xs text-mahogany/50 uppercase">Total</p>
                      <p className="font-cinzel font-bold text-gold">${Number(order.total).toFixed(2)}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="font-cinzel text-xs text-mahogany/50 uppercase">Date</p>
                      <p className="font-raleway text-xs text-mahogany/60">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className={`font-raleway text-xs font-semibold uppercase tracking-wider px-2 py-1 border ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-mahogany/30 shrink-0 transition-transform duration-200 ${expanded === order.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded Details */}
                {expanded === order.id && (
                  <div className="border-t border-parchment-dark p-5 bg-parchment/50 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                      {/* Customer */}
                      <div className="space-y-1">
                        <h4 className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-2">Customer</h4>
                        <p className="font-lora text-sm text-mahogany">{order.customer_name}</p>
                        <a href={`mailto:${order.customer_email}`} className="font-raleway text-xs text-gold hover:underline block">{order.customer_email}</a>
                        {order.customer_phone && <p className="font-raleway text-xs text-mahogany/50">{order.customer_phone}</p>}
                      </div>

                      {/* Shipping Address */}
                      <div className="space-y-1">
                        <h4 className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-2">Ship To</h4>
                        {order.shipping_address && (
                          <div className="font-raleway text-xs text-mahogany/60 space-y-0.5">
                            <p>{order.shipping_address.address}</p>
                            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                          </div>
                        )}
                      </div>

                      {/* Payment */}
                      <div className="space-y-1">
                        <h4 className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-2">Payment</h4>
                        <p className="font-raleway text-xs text-mahogany/60 capitalize">{order.payment_method}</p>
                        <p className="font-cinzel font-bold text-gold">${Number(order.total).toFixed(2)}</p>
                        <p className="font-raleway text-xs text-mahogany/40">
                          Shipping: {order.shipping > 0 ? `$${Number(order.shipping).toFixed(2)}` : 'FREE'}
                        </p>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h4 className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-2">Items Ordered</h4>
                      <div className="space-y-2">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm bg-white px-3 py-2">
                            <span className="font-lora text-mahogany/80">{item.name} × {item.quantity}</span>
                            <span className="font-cinzel text-mahogany">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Update Status */}
                    <div className="flex items-center gap-4">
                      <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 shrink-0">Update Status:</label>
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        className="input-field py-2 text-xs w-auto"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
