import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const ORDER_STATUSES   = ['pending','confirmed','processing','shipped','delivered','cancelled']
const PAYMENT_STATUSES = ['unpaid','paid','refunded']
const RETURN_STATUSES  = ['none','requested','approved','completed']

function badge(val, map) {
  return map[val] || 'bg-parchment text-mahogany/50'
}

const orderColors = {
  confirmed: 'bg-teal/10 text-teal-dark border-teal/20',
  delivered: 'bg-teal/10 text-teal-dark border-teal/20',
  shipped:   'bg-gold/10 text-gold border-gold/20',
  processing:'bg-gold/10 text-gold border-gold/20',
  pending:   'bg-mahogany/10 text-mahogany border-mahogany/20',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
}
const paymentColors = {
  paid:      'bg-teal/10 text-teal-dark border-teal/20',
  unpaid:    'bg-red-50 text-red-500 border-red-200',
  refunded:  'bg-amber-50 text-amber-600 border-amber-200',
}
const returnColors = {
  none:      'bg-parchment text-mahogany/40 border-parchment-dark',
  requested: 'bg-amber-50 text-amber-600 border-amber-200',
  approved:  'bg-gold/10 text-gold border-gold/20',
  completed: 'bg-teal/10 text-teal-dark border-teal/20',
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter,   setFilter]   = useState('all')
  const [payFilter,setPayFilter]= useState('all')

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
    try {
      const { data, error } = await supabase
        .from('orders').select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setOrders(data || [])
    } catch (_) {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  async function updateField(orderId, field, value) {
    await supabase.from('orders')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, [field]: value } : o
    ))
  }

  async function saveNote(orderId, note) {
    await supabase.from('orders')
      .update({ notes: note, updated_at: new Date().toISOString() })
      .eq('id', orderId)
  }

  function printSlip(order) {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Packing Slip #${order.id.split('-')[0].toUpperCase()}</title>
      <style>
        body { font-family: Georgia, serif; padding: 40px; max-width: 600px; margin: 0 auto; color: #1C0A00; }
        h1 { font-size: 22px; border-bottom: 2px solid #C8922A; padding-bottom: 8px; }
        .section { margin: 20px 0; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0e8d8; }
        .total { font-weight: bold; font-size: 16px; border-top: 2px solid #C8922A; padding-top: 10px; margin-top: 4px; }
        .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; }
      </style></head><body>
      <h1>Native Flame Candle Company</h1>
      <p style="font-size:13px;color:#888;">Buffalo Gap, Texas &nbsp;·&nbsp; nativeflamecandles.com</p>
      <div class="section">
        <div class="label">Order #</div>
        <strong>${order.id.split('-')[0].toUpperCase()}</strong> &nbsp;·&nbsp; ${new Date(order.created_at).toLocaleDateString()}
      </div>
      <div class="section">
        <div class="label">Ship To</div>
        <div>${order.customer_name}</div>
        ${order.shipping_address ? `
          <div>${order.shipping_address.address}</div>
          <div>${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zip}</div>
        ` : ''}
        <div style="margin-top:4px;font-size:13px;color:#888;">${order.customer_email}</div>
      </div>
      <div class="section">
        <div class="label">Items</div>
        ${(order.items || []).map(i => `
          <div class="row">
            <span>${i.name} × ${i.quantity}</span>
            <span>$${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="row"><span>Shipping</span><span>${Number(order.shipping) > 0 ? '$'+Number(order.shipping).toFixed(2) : 'FREE'}</span></div>
        ${order.discount_amount > 0 ? `<div class="row"><span>Discount (${order.discount_code})</span><span>-$${Number(order.discount_amount).toFixed(2)}</span></div>` : ''}
        <div class="row total"><span>Total</span><span>$${Number(order.total).toFixed(2)}</span></div>
      </div>
      ${order.notes ? `<div class="section"><div class="label">Notes</div><p>${order.notes}</p></div>` : ''}
      <div class="footer">Thank you for your order! Hand-poured with love in Buffalo Gap, Texas.</div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const filtered = orders.filter(o => {
    const statusMatch  = filter    === 'all' || o.status         === filter
    const payMatch     = payFilter === 'all' || o.payment_status === payFilter
    return statusMatch && payMatch
  })

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
        <p className="font-raleway text-xs text-cream/40">{orders.length} total orders</p>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Order status */}
          <div className="flex flex-wrap gap-2">
            {['all', ...ORDER_STATUSES].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`font-raleway text-xs font-semibold uppercase tracking-wider px-4 py-2 transition-all ${
                  filter === s ? 'bg-mahogany text-cream' : 'border border-parchment-dark text-mahogany/50 hover:border-mahogany hover:text-mahogany'
                }`}>
                {s === 'all' ? `All (${orders.length})` : `${s} (${orders.filter(o=>o.status===s).length})`}
              </button>
            ))}
          </div>
          {/* Payment status */}
          <div className="flex flex-wrap gap-2">
            <span className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider self-center">Payment:</span>
            {['all', ...PAYMENT_STATUSES].map(s => (
              <button key={s} onClick={() => setPayFilter(s)}
                className={`font-raleway text-xs font-semibold uppercase tracking-wider px-4 py-2 transition-all ${
                  payFilter === s ? 'bg-mahogany text-cream' : 'border border-parchment-dark text-mahogany/50 hover:border-mahogany hover:text-mahogany'
                }`}>
                {s === 'all' ? `All` : `${s} (${orders.filter(o=>(o.payment_status||'unpaid')===s).length})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
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
                {/* Row */}
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-parchment/50 transition-colors"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                  <div className="min-w-0 flex-1 grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
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
                      <span className={`font-raleway text-xs font-semibold uppercase tracking-wider px-2 py-1 border ${badge(order.status, orderColors)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div>
                      <span className={`font-raleway text-xs font-semibold uppercase tracking-wider px-2 py-1 border ${badge(order.payment_status || 'unpaid', paymentColors)}`}>
                        {order.payment_status || 'unpaid'}
                      </span>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-mahogany/30 shrink-0 transition-transform duration-200 ${expanded === order.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>

                {/* Expanded */}
                {expanded === order.id && (
                  <div className="border-t border-parchment-dark p-5 bg-parchment/50 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                      {/* Customer */}
                      <div className="space-y-1">
                        <h4 className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-2">Customer</h4>
                        <p className="font-lora text-sm text-mahogany">{order.customer_name}</p>
                        <a href={`mailto:${order.customer_email}`} className="font-raleway text-xs text-gold hover:underline block">{order.customer_email}</a>
                        {order.customer_phone && <p className="font-raleway text-xs text-mahogany/50">{order.customer_phone}</p>}
                      </div>

                      {/* Shipping */}
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
                        {order.discount_code && (
                          <p className="font-raleway text-xs text-teal-dark">Code: {order.discount_code} (−${Number(order.discount_amount||0).toFixed(2)})</p>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h4 className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-2">Items</h4>
                      <div className="space-y-2">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm bg-white px-3 py-2">
                            <span className="font-lora text-mahogany/80">{item.name} × {item.quantity}</span>
                            <span className="font-cinzel text-mahogany">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status controls */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Order Status</label>
                        <select value={order.status}
                          onChange={e => updateField(order.id, 'status', e.target.value)}
                          className="input-field py-2 text-xs">
                          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Payment Status</label>
                        <select value={order.payment_status || 'unpaid'}
                          onChange={e => updateField(order.id, 'payment_status', e.target.value)}
                          className="input-field py-2 text-xs">
                          {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Return Status</label>
                        <select value={order.return_status || 'none'}
                          onChange={e => updateField(order.id, 'return_status', e.target.value)}
                          className="input-field py-2 text-xs">
                          {RETURN_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Internal Notes</label>
                      <textarea
                        defaultValue={order.notes || ''}
                        onBlur={e => saveNote(order.id, e.target.value)}
                        rows={2}
                        placeholder="Add a private note about this order..."
                        className="input-field text-xs resize-none"
                      />
                      <p className="font-raleway text-xs text-mahogany/30 mt-1">Auto-saves when you click away</p>
                    </div>

                    {/* Print slip */}
                    <button onClick={() => printSlip(order)}
                      className="btn-outline text-xs px-5 py-2 flex items-center gap-2">
                      🖨️ Print Packing Slip
                    </button>

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
