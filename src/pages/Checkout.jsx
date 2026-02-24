import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: 'TX', zip: '',
    cardNumber: '', cardExpiry: '', cardCvc: ''
  })
  const [errors, setErrors] = useState({})

  const shipping = subtotal >= 50 ? 0 : 7.99
  const total = subtotal + shipping

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Valid email required'
    if (!form.address.trim()) errs.address = 'Required'
    if (!form.city.trim()) errs.city = 'Required'
    if (!form.zip.match(/^\d{5}/)) errs.zip = 'Valid ZIP required'
    if (paymentMethod === 'stripe') {
      if (!form.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) errs.cardNumber = 'Valid card number required'
      if (!form.cardExpiry.match(/^\d{2}\/\d{2}$/)) errs.cardExpiry = 'MM/YY format'
      if (!form.cardCvc.match(/^\d{3,4}$/)) errs.cardCvc = 'Invalid CVC'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      // Save order to Supabase
      const { data: order, error } = await supabase.from('orders').insert({
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        shipping_address: {
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip
        },
        items: items.map(i => ({
          id: i.id, name: i.name, price: i.price,
          quantity: i.quantity, size_oz: i.size_oz
        })),
        subtotal,
        shipping,
        total,
        payment_method: paymentMethod,
        payment_id: `demo_${Date.now()}`,
        status: 'confirmed'
      }).select().single()

      if (error) throw error

      clearCart()
      navigate(`/order-confirmation?order=${order.id}&email=${form.email}`)
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center text-center px-4">
        <div className="space-y-4">
          <h2 className="font-cinzel text-2xl font-bold text-mahogany">Nothing to checkout</h2>
          <Link to="/shop" className="btn-gold inline-block">Shop Now</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <h1 className="font-cinzel text-3xl font-bold text-mahogany mb-2">Checkout</h1>
        <p className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider mb-10">Secure Order · Native Flame Candle Co.</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Left: Forms */}
            <div className="lg:col-span-2 space-y-8">

              {/* Contact */}
              <div className="space-y-4">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Contact Information</h2>
                <div className="w-10 h-px bg-gold" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange}
                      className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="Jane Smith" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="jane@email.com" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Phone (optional)</label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      className="input-field" placeholder="(555) 000-0000" />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-4">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Shipping Address</h2>
                <div className="w-10 h-px bg-gold" />
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Street Address *</label>
                  <input name="address" value={form.address} onChange={handleChange}
                    className={`input-field ${errors.address ? 'border-red-400' : ''}`} placeholder="123 Main Street" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">City *</label>
                    <input name="city" value={form.city} onChange={handleChange}
                      className={`input-field ${errors.city ? 'border-red-400' : ''}`} placeholder="Abilene" />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">State</label>
                    <select name="state" value={form.state} onChange={handleChange} className="input-field">
                      {['TX','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','UT','VT','VA','WA','WV','WI','WY'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">ZIP *</label>
                    <input name="zip" value={form.zip} onChange={handleChange}
                      className={`input-field ${errors.zip ? 'border-red-400' : ''}`} placeholder="79508" maxLength={5} />
                    {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Payment Method</h2>
                <div className="w-10 h-px bg-gold" />

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 border-2 transition-all duration-200 text-center ${
                      paymentMethod === 'stripe'
                        ? 'border-gold bg-gold/5'
                        : 'border-parchment-dark hover:border-mahogany/30'
                    }`}
                  >
                    <div className="font-cinzel text-sm font-semibold text-mahogany">💳 Credit Card</div>
                    <div className="font-raleway text-xs text-mahogany/40 mt-1">Visa · MC · Amex</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 border-2 transition-all duration-200 text-center ${
                      paymentMethod === 'paypal'
                        ? 'border-gold bg-gold/5'
                        : 'border-parchment-dark hover:border-mahogany/30'
                    }`}
                  >
                    <div className="font-cinzel text-sm font-semibold text-mahogany">🅿️ PayPal</div>
                    <div className="font-raleway text-xs text-mahogany/40 mt-1">Fast & Secure</div>
                  </button>
                </div>

                {/* Card Fields */}
                {paymentMethod === 'stripe' && (
                  <div className="space-y-4 mt-4 p-5 bg-parchment">
                    <div>
                      <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Card Number *</label>
                      <input name="cardNumber" value={form.cardNumber} onChange={handleChange}
                        className={`input-field ${errors.cardNumber ? 'border-red-400' : ''}`}
                        placeholder="1234 5678 9012 3456" maxLength={19} />
                      {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Expiry *</label>
                        <input name="cardExpiry" value={form.cardExpiry} onChange={handleChange}
                          className={`input-field ${errors.cardExpiry ? 'border-red-400' : ''}`}
                          placeholder="MM/YY" maxLength={5} />
                        {errors.cardExpiry && <p className="text-red-500 text-xs mt-1">{errors.cardExpiry}</p>}
                      </div>
                      <div>
                        <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">CVC *</label>
                        <input name="cardCvc" value={form.cardCvc} onChange={handleChange}
                          className={`input-field ${errors.cardCvc ? 'border-red-400' : ''}`}
                          placeholder="123" maxLength={4} />
                        {errors.cardCvc && <p className="text-red-500 text-xs mt-1">{errors.cardCvc}</p>}
                      </div>
                    </div>
                    <p className="font-raleway text-xs text-mahogany/30 italic">🔒 This is a demo — no real charge will be made</p>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="p-5 bg-parchment text-center">
                    <p className="font-lora text-sm italic text-mahogany/60 mb-4">
                      You'll be redirected to PayPal to complete your purchase securely.
                    </p>
                    <p className="font-raleway text-xs text-mahogany/30 italic">🔒 This is a demo — PayPal integration active at launch</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-1">
              <div className="bg-parchment p-6 sticky top-24 space-y-4">
                <h2 className="font-cinzel font-bold text-base text-mahogany">Order Summary</h2>
                <div className="w-10 h-px bg-gold" />

                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="font-lora text-mahogany/70 truncate mr-2">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-cinzel text-mahogany shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-parchment-dark pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-raleway text-mahogany/60">Subtotal</span>
                    <span className="font-cinzel text-mahogany">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-raleway text-mahogany/60">Shipping</span>
                    <span className="font-cinzel text-mahogany">
                      {shipping === 0 ? <span className="text-teal-dark text-xs">FREE</span> : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-parchment-dark pt-2">
                    <span className="font-cinzel font-bold text-mahogany">Total</span>
                    <span className="font-cinzel font-bold text-xl text-gold">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn-gold w-full flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : `Place Order · $${total.toFixed(2)}`}
                </button>

                <p className="text-center font-raleway text-xs text-mahogany/30">
                  🔒 Secure checkout · SSL encrypted
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
