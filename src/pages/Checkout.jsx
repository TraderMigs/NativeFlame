import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '../context/CartContext'
import { useSiteSettings } from '../context/SiteSettingsContext'
import { supabase } from '../lib/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const CARD_STYLE = {
  style: {
    base: {
      fontFamily: '"Lora", serif',
      fontSize: '15px',
      color: '#1C0A00',
      '::placeholder': { color: '#1C0A0060' },
    },
    invalid: { color: '#DC2626' },
  },
}

// ── Inner form — needs Stripe context ──────────────────────────────
function CheckoutForm() {
  const stripe     = useStripe()
  const elements   = useElements()
  const { items, subtotal, clearCart } = useCart()
  const { shipping: shippingSettings } = useSiteSettings()
  const navigate   = useNavigate()

  const [paymentMethod,     setPaymentMethod]     = useState('stripe')
  const [loading,           setLoading]           = useState(false)
  const [cardError,         setCardError]         = useState('')
  const [discountCode,      setDiscountCode]      = useState('')
  const [discountInput,     setDiscountInput]     = useState('')
  const [discountPct,       setDiscountPct]       = useState(0)
  const [discountFlat,      setDiscountFlat]      = useState(0)
  const [discountScope,     setDiscountScope]     = useState('site')
  const [discountProductId, setDiscountProductId] = useState(null)
  const [discountError,     setDiscountError]     = useState('')
  const [discountApplied,   setDiscountApplied]   = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: 'TX', zip: '',
  })
  const [errors, setErrors] = useState({})

  // Shipping calculated from admin settings
  const calcShipping = () => {
    const mode = shippingSettings?.shipping_mode || 'flat'
    if (mode === 'free') return 0
    if (mode === 'threshold') {
      const threshold = parseFloat(shippingSettings?.shipping_threshold || '50')
      return subtotal >= threshold ? 0 : parseFloat(shippingSettings?.shipping_flat_rate || '7.99')
    }
    return parseFloat(shippingSettings?.shipping_flat_rate || '7.99')
  }
  const shipping = calcShipping()
  const eligibleAmt = discountScope === 'product' && discountProductId
    ? items.filter(i => i.id === discountProductId).reduce((s, i) => s + i.price * i.quantity, 0)
    : subtotal
  const discountAmt = discountFlat > 0 ? Math.min(discountFlat, eligibleAmt) : eligibleAmt * discountPct
  const total       = subtotal - discountAmt + shipping
  const totalCents  = Math.round(total * 100)

  async function applyDiscount() {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    try {
      const { data } = await supabase.from('discount_codes').select('*')
        .eq('code', code).eq('is_active', true).single()
      if (!data)                                    { setDiscountError('Invalid or inactive code.'); return }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setDiscountError('This code has expired.'); return }
      if (data.max_uses && data.uses >= data.max_uses) { setDiscountError('This code has reached its usage limit.'); return }
      if (data.min_order && subtotal < data.min_order) { setDiscountError(`Minimum order $${data.min_order} required.`); return }
      setDiscountCode(code)
      setDiscountPct(data.type === 'percent' ? data.amount / 100 : 0)
      setDiscountFlat(data.type === 'flat' ? data.amount : 0)
      setDiscountScope(data.scope || 'site')
      setDiscountProductId(data.product_id || null)
      setDiscountApplied(true)
      setDiscountError('')
    } catch (_) { setDiscountError('Invalid or inactive code.') }
  }

  function removeDiscount() {
    setDiscountCode(''); setDiscountInput(''); setDiscountPct(0)
    setDiscountFlat(0); setDiscountScope('site'); setDiscountProductId(null)
    setDiscountApplied(false); setDiscountError('')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())    e.name    = 'Required'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (!form.address.trim()) e.address = 'Required'
    if (!form.city.trim())    e.city    = 'Required'
    if (!form.zip.match(/^\d{5}/)) e.zip = 'Valid ZIP required'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setCardError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)

    try {
      if (paymentMethod === 'stripe') {
        if (!stripe || !elements) { setCardError('Stripe not loaded. Please refresh.'); setLoading(false); return }

        // 1. Create PaymentIntent on server
        const piRes = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalCents,
            metadata: { customer_email: form.email, customer_name: form.name }
          })
        })
        const piData = await piRes.json()
        if (!piRes.ok || !piData.clientSecret) throw new Error(piData.error || 'Payment setup failed')

        // 2. Confirm card payment with Stripe
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(piData.clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name:  form.name,
              email: form.email,
              address: {
                line1:       form.address,
                city:        form.city,
                state:       form.state,
                postal_code: form.zip,
                country:     'US',
              }
            }
          }
        })

        if (stripeError) { setCardError(stripeError.message); setLoading(false); return }
        if (paymentIntent.status !== 'succeeded') { setCardError('Payment was not completed. Please try again.'); setLoading(false); return }

        // 3. Save confirmed order to Supabase
        await saveOrder(piData.paymentIntentId, 'paid')

      } else {
        // PayPal — save as pending, redirect handled separately
        await saveOrder('paypal_pending', 'unpaid')
      }
    } catch (err) {
      console.error(err)
      setCardError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function saveOrder(paymentId, paymentStatus) {
    const { data: order, error } = await supabase.from('orders').insert({
      customer_name:    form.name,
      customer_email:   form.email,
      customer_phone:   form.phone || null,
      shipping_address: { address: form.address, city: form.city, state: form.state, zip: form.zip },
      items:            items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, size_oz: i.size_oz })),
      subtotal,
      shipping,
      total,
      discount_code:    discountCode || null,
      discount_amount:  discountAmt  || 0,
      payment_method:   paymentMethod,
      payment_id:       paymentId,
      payment_status:   paymentStatus,
      return_status:    'none',
      status:           'confirmed',
    }).select().single()

    if (error) throw error

    // Decrement stock
    for (const item of items) {
      await supabase.rpc('decrement_stock', { product_id: item.id, qty: item.quantity })
    }

    clearCart()
    navigate(`/order-confirmation?order=${order.id}&email=${encodeURIComponent(form.email)}`)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 bg-cream flex items-center justify-center text-center px-4">
        <div className="space-y-4">
          <h2 className="font-cinzel text-2xl font-bold text-mahogany">Nothing to checkout</h2>
          <Link to="/shop" className="btn-gold inline-block">Shop Now</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 bg-cream">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <h1 className="font-cinzel text-3xl font-bold text-mahogany mb-2">Checkout</h1>
        <p className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider mb-10">Secure Order · Native Flame Candle Co.</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* LEFT */}
            <div className="lg:col-span-2 space-y-8">

              {/* Contact */}
              <div className="space-y-4">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Contact Information</h2>
                <div className="w-10 h-px bg-gold"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange}
                      className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="Jane Smith"/>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="jane@email.com"/>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Phone (optional)</label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      className="input-field" placeholder="(555) 000-0000"/>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-4">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Shipping Address</h2>
                <div className="w-10 h-px bg-gold"/>
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Street Address *</label>
                  <input name="address" value={form.address} onChange={handleChange}
                    className={`input-field ${errors.address ? 'border-red-400' : ''}`} placeholder="123 Main Street"/>
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">City *</label>
                    <input name="city" value={form.city} onChange={handleChange}
                      className={`input-field ${errors.city ? 'border-red-400' : ''}`} placeholder="Abilene"/>
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
                      className={`input-field ${errors.zip ? 'border-red-400' : ''}`} placeholder="79508" maxLength={5}/>
                    {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                  </div>
                </div>
              </div>

              {/* Discount Code */}
              <div className="space-y-3">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Discount Code</h2>
                <div className="w-10 h-px bg-gold"/>
                {discountApplied ? (
                  <div className="flex items-center justify-between bg-teal/10 border border-teal/30 px-4 py-3">
                    <div>
                      <span className="font-cinzel text-sm font-bold text-teal-dark tracking-widest">{discountCode}</span>
                      <span className="font-raleway text-xs text-teal-dark ml-2">
                        {discountFlat > 0 ? `$${discountFlat} off applied` : `${Math.round(discountPct * 100)}% off applied`}
                      </span>
                    </div>
                    <button type="button" onClick={removeDiscount}
                      className="font-raleway text-xs text-mahogany/40 hover:text-red-500 transition-colors underline">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input type="text" value={discountInput}
                      onChange={e => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError('') }}
                      placeholder="Enter code (e.g. WELCOME15)" className="input-field flex-1 uppercase"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyDiscount())}/>
                    <button type="button" onClick={applyDiscount} className="btn-outline px-5 text-xs shrink-0">Apply</button>
                  </div>
                )}
                {discountError && <p className="font-raleway text-xs text-red-500">{discountError}</p>}
              </div>

              {/* Payment */}
              <div className="space-y-4">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Payment Method</h2>
                <div className="w-10 h-px bg-gold"/>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 border-2 transition-all duration-200 text-center ${paymentMethod === 'stripe' ? 'border-gold bg-gold/5' : 'border-parchment-dark hover:border-mahogany/30'}`}>
                    <div className="font-cinzel text-sm font-semibold text-mahogany">💳 Credit Card</div>
                    <div className="font-raleway text-xs text-mahogany/40 mt-1">Visa · MC · Amex</div>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 border-2 transition-all duration-200 text-center ${paymentMethod === 'paypal' ? 'border-gold bg-gold/5' : 'border-parchment-dark hover:border-mahogany/30'}`}>
                    <div className="font-cinzel text-sm font-semibold text-mahogany">🅿️ PayPal</div>
                    <div className="font-raleway text-xs text-mahogany/40 mt-1">Fast & Secure</div>
                  </button>
                </div>

                {/* Stripe Card Element — real, secure, PCI compliant */}
                {paymentMethod === 'stripe' && (
                  <div className="space-y-3 mt-4 p-5 bg-parchment">
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block">Card Details *</label>
                    <div className="border border-parchment-dark bg-cream px-4 py-3 focus-within:border-gold transition-colors">
                      <CardElement options={CARD_STYLE} onChange={() => setCardError('')}/>
                    </div>
                    {cardError && <p className="font-raleway text-xs text-red-500">{cardError}</p>}
                    <p className="font-raleway text-xs text-mahogany/30 flex items-center gap-1">
                      🔒 Secured by Stripe · Card details never touch our server
                    </p>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="p-5 bg-parchment text-center space-y-2">
                    <p className="font-lora text-sm italic text-mahogany/60">
                      You'll be redirected to PayPal to complete your purchase securely.
                    </p>
                    <p className="font-raleway text-xs text-mahogany/30">🔒 PayPal integration coming soon</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Summary */}
            <div className="lg:col-span-1">
              <div className="bg-parchment p-6 sticky top-24 space-y-4">
                <h2 className="font-cinzel font-bold text-base text-mahogany">Order Summary</h2>
                <div className="w-10 h-px bg-gold"/>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="font-lora text-mahogany/70 truncate mr-2">{item.name} × {item.quantity}</span>
                      <span className="font-cinzel text-mahogany shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-parchment-dark pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-raleway text-mahogany/60">Subtotal</span>
                    <span className="font-cinzel text-mahogany">${subtotal.toFixed(2)}</span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between text-teal-dark">
                      <span className="font-raleway text-xs">{discountCode}</span>
                      <span className="font-cinzel text-xs">−${discountAmt.toFixed(2)}</span>
                    </div>
                  )}
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
                <button type="submit" disabled={loading || !stripe}
                  className={`btn-gold w-full flex items-center justify-center gap-2 ${(loading || !stripe) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"/>Processing...</>
                  ) : `Pay $${total.toFixed(2)}`}
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

// ── Outer wrapper — provides Stripe context ────────────────────────
export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm/>
    </Elements>
  )
}import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const CARD_STYLE = {
  style: {
    base: {
      fontFamily: '"Lora", serif',
      fontSize: '15px',
      color: '#1C0A00',
      '::placeholder': { color: '#1C0A0060' },
    },
    invalid: { color: '#DC2626' },
  },
}

// ── Inner form — needs Stripe context ──────────────────────────────
function CheckoutForm() {
  const stripe     = useStripe()
  const elements   = useElements()
  const { items, subtotal, clearCart } = useCart()
  const navigate   = useNavigate()

  const [paymentMethod,     setPaymentMethod]     = useState('stripe')
  const [loading,           setLoading]           = useState(false)
  const [cardError,         setCardError]         = useState('')
  const [discountCode,      setDiscountCode]      = useState('')
  const [discountInput,     setDiscountInput]     = useState('')
  const [discountPct,       setDiscountPct]       = useState(0)
  const [discountFlat,      setDiscountFlat]      = useState(0)
  const [discountScope,     setDiscountScope]     = useState('site')
  const [discountProductId, setDiscountProductId] = useState(null)
  const [discountError,     setDiscountError]     = useState('')
  const [discountApplied,   setDiscountApplied]   = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    address: '', city: '', state: 'TX', zip: '',
  })
  const [errors, setErrors] = useState({})

  const shipping = subtotal >= 50 ? 0 : 7.99
  const eligibleAmt = discountScope === 'product' && discountProductId
    ? items.filter(i => i.id === discountProductId).reduce((s, i) => s + i.price * i.quantity, 0)
    : subtotal
  const discountAmt = discountFlat > 0 ? Math.min(discountFlat, eligibleAmt) : eligibleAmt * discountPct
  const total       = subtotal - discountAmt + shipping
  const totalCents  = Math.round(total * 100)

  async function applyDiscount() {
    const code = discountInput.trim().toUpperCase()
    if (!code) return
    try {
      const { data } = await supabase.from('discount_codes').select('*')
        .eq('code', code).eq('is_active', true).single()
      if (!data)                                    { setDiscountError('Invalid or inactive code.'); return }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setDiscountError('This code has expired.'); return }
      if (data.max_uses && data.uses >= data.max_uses) { setDiscountError('This code has reached its usage limit.'); return }
      if (data.min_order && subtotal < data.min_order) { setDiscountError(`Minimum order $${data.min_order} required.`); return }
      setDiscountCode(code)
      setDiscountPct(data.type === 'percent' ? data.amount / 100 : 0)
      setDiscountFlat(data.type === 'flat' ? data.amount : 0)
      setDiscountScope(data.scope || 'site')
      setDiscountProductId(data.product_id || null)
      setDiscountApplied(true)
      setDiscountError('')
    } catch (_) { setDiscountError('Invalid or inactive code.') }
  }

  function removeDiscount() {
    setDiscountCode(''); setDiscountInput(''); setDiscountPct(0)
    setDiscountFlat(0); setDiscountScope('site'); setDiscountProductId(null)
    setDiscountApplied(false); setDiscountError('')
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim())    e.name    = 'Required'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (!form.address.trim()) e.address = 'Required'
    if (!form.city.trim())    e.city    = 'Required'
    if (!form.zip.match(/^\d{5}/)) e.zip = 'Valid ZIP required'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setCardError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)

    try {
      if (paymentMethod === 'stripe') {
        if (!stripe || !elements) { setCardError('Stripe not loaded. Please refresh.'); setLoading(false); return }

        // 1. Create PaymentIntent on server
        const piRes = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalCents,
            metadata: { customer_email: form.email, customer_name: form.name }
          })
        })
        const piData = await piRes.json()
        if (!piRes.ok || !piData.clientSecret) throw new Error(piData.error || 'Payment setup failed')

        // 2. Confirm card payment with Stripe
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(piData.clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name:  form.name,
              email: form.email,
              address: {
                line1:       form.address,
                city:        form.city,
                state:       form.state,
                postal_code: form.zip,
                country:     'US',
              }
            }
          }
        })

        if (stripeError) { setCardError(stripeError.message); setLoading(false); return }
        if (paymentIntent.status !== 'succeeded') { setCardError('Payment was not completed. Please try again.'); setLoading(false); return }

        // 3. Save confirmed order to Supabase
        await saveOrder(piData.paymentIntentId, 'paid')

      } else {
        // PayPal — save as pending, redirect handled separately
        await saveOrder('paypal_pending', 'unpaid')
      }
    } catch (err) {
      console.error(err)
      setCardError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function saveOrder(paymentId, paymentStatus) {
    const { data: order, error } = await supabase.from('orders').insert({
      customer_name:    form.name,
      customer_email:   form.email,
      customer_phone:   form.phone || null,
      shipping_address: { address: form.address, city: form.city, state: form.state, zip: form.zip },
      items:            items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, size_oz: i.size_oz })),
      subtotal,
      shipping,
      total,
      discount_code:    discountCode || null,
      discount_amount:  discountAmt  || 0,
      payment_method:   paymentMethod,
      payment_id:       paymentId,
      payment_status:   paymentStatus,
      return_status:    'none',
      status:           'confirmed',
    }).select().single()

    if (error) throw error

    // Decrement stock
    for (const item of items) {
      await supabase.rpc('decrement_stock', { product_id: item.id, qty: item.quantity })
    }

    clearCart()
    navigate(`/order-confirmation?order=${order.id}&email=${encodeURIComponent(form.email)}`)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 bg-cream flex items-center justify-center text-center px-4">
        <div className="space-y-4">
          <h2 className="font-cinzel text-2xl font-bold text-mahogany">Nothing to checkout</h2>
          <Link to="/shop" className="btn-gold inline-block">Shop Now</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 bg-cream">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <h1 className="font-cinzel text-3xl font-bold text-mahogany mb-2">Checkout</h1>
        <p className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider mb-10">Secure Order · Native Flame Candle Co.</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* LEFT */}
            <div className="lg:col-span-2 space-y-8">

              {/* Contact */}
              <div className="space-y-4">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Contact Information</h2>
                <div className="w-10 h-px bg-gold"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange}
                      className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="Jane Smith"/>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Email *</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="jane@email.com"/>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Phone (optional)</label>
                    <input name="phone" value={form.phone} onChange={handleChange}
                      className="input-field" placeholder="(555) 000-0000"/>
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="space-y-4">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Shipping Address</h2>
                <div className="w-10 h-px bg-gold"/>
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Street Address *</label>
                  <input name="address" value={form.address} onChange={handleChange}
                    className={`input-field ${errors.address ? 'border-red-400' : ''}`} placeholder="123 Main Street"/>
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">City *</label>
                    <input name="city" value={form.city} onChange={handleChange}
                      className={`input-field ${errors.city ? 'border-red-400' : ''}`} placeholder="Abilene"/>
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
                      className={`input-field ${errors.zip ? 'border-red-400' : ''}`} placeholder="79508" maxLength={5}/>
                    {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                  </div>
                </div>
              </div>

              {/* Discount Code */}
              <div className="space-y-3">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Discount Code</h2>
                <div className="w-10 h-px bg-gold"/>
                {discountApplied ? (
                  <div className="flex items-center justify-between bg-teal/10 border border-teal/30 px-4 py-3">
                    <div>
                      <span className="font-cinzel text-sm font-bold text-teal-dark tracking-widest">{discountCode}</span>
                      <span className="font-raleway text-xs text-teal-dark ml-2">
                        {discountFlat > 0 ? `$${discountFlat} off applied` : `${Math.round(discountPct * 100)}% off applied`}
                      </span>
                    </div>
                    <button type="button" onClick={removeDiscount}
                      className="font-raleway text-xs text-mahogany/40 hover:text-red-500 transition-colors underline">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input type="text" value={discountInput}
                      onChange={e => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError('') }}
                      placeholder="Enter code (e.g. WELCOME15)" className="input-field flex-1 uppercase"
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyDiscount())}/>
                    <button type="button" onClick={applyDiscount} className="btn-outline px-5 text-xs shrink-0">Apply</button>
                  </div>
                )}
                {discountError && <p className="font-raleway text-xs text-red-500">{discountError}</p>}
              </div>

              {/* Payment */}
              <div className="space-y-4">
                <h2 className="font-cinzel text-lg font-semibold text-mahogany tracking-wide">Payment Method</h2>
                <div className="w-10 h-px bg-gold"/>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 border-2 transition-all duration-200 text-center ${paymentMethod === 'stripe' ? 'border-gold bg-gold/5' : 'border-parchment-dark hover:border-mahogany/30'}`}>
                    <div className="font-cinzel text-sm font-semibold text-mahogany">💳 Credit Card</div>
                    <div className="font-raleway text-xs text-mahogany/40 mt-1">Visa · MC · Amex</div>
                  </button>
                  <button type="button" onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 border-2 transition-all duration-200 text-center ${paymentMethod === 'paypal' ? 'border-gold bg-gold/5' : 'border-parchment-dark hover:border-mahogany/30'}`}>
                    <div className="font-cinzel text-sm font-semibold text-mahogany">🅿️ PayPal</div>
                    <div className="font-raleway text-xs text-mahogany/40 mt-1">Fast & Secure</div>
                  </button>
                </div>

                {/* Stripe Card Element — real, secure, PCI compliant */}
                {paymentMethod === 'stripe' && (
                  <div className="space-y-3 mt-4 p-5 bg-parchment">
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block">Card Details *</label>
                    <div className="border border-parchment-dark bg-cream px-4 py-3 focus-within:border-gold transition-colors">
                      <CardElement options={CARD_STYLE} onChange={() => setCardError('')}/>
                    </div>
                    {cardError && <p className="font-raleway text-xs text-red-500">{cardError}</p>}
                    <p className="font-raleway text-xs text-mahogany/30 flex items-center gap-1">
                      🔒 Secured by Stripe · Card details never touch our server
                    </p>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="p-5 bg-parchment text-center space-y-2">
                    <p className="font-lora text-sm italic text-mahogany/60">
                      You'll be redirected to PayPal to complete your purchase securely.
                    </p>
                    <p className="font-raleway text-xs text-mahogany/30">🔒 PayPal integration coming soon</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Summary */}
            <div className="lg:col-span-1">
              <div className="bg-parchment p-6 sticky top-24 space-y-4">
                <h2 className="font-cinzel font-bold text-base text-mahogany">Order Summary</h2>
                <div className="w-10 h-px bg-gold"/>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="font-lora text-mahogany/70 truncate mr-2">{item.name} × {item.quantity}</span>
                      <span className="font-cinzel text-mahogany shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-parchment-dark pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-raleway text-mahogany/60">Subtotal</span>
                    <span className="font-cinzel text-mahogany">${subtotal.toFixed(2)}</span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between text-teal-dark">
                      <span className="font-raleway text-xs">{discountCode}</span>
                      <span className="font-cinzel text-xs">−${discountAmt.toFixed(2)}</span>
                    </div>
                  )}
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
                <button type="submit" disabled={loading || !stripe}
                  className={`btn-gold w-full flex items-center justify-center gap-2 ${(loading || !stripe) ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"/>Processing...</>
                  ) : `Pay $${total.toFixed(2)}`}
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

// ── Outer wrapper — provides Stripe context ────────────────────────
export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm/>
    </Elements>
  )
}
