import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const email = searchParams.get('email')
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (orderId) {
      supabase.from('orders').select('*').eq('id', orderId).single()
        .then(({ data }) => setOrder(data))
    }
  }, [orderId])

  return (
    <div className="min-h-screen pt-24 bg-cream flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center py-16 space-y-8">

        {/* Success Icon */}
        <div className="w-24 h-24 bg-teal/10 rounded-full flex items-center justify-center mx-auto border-2 border-teal/30">
          <svg className="w-10 h-10 text-teal-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <p className="font-raleway text-xs tracking-[0.3em] uppercase text-gold mb-2">Order Confirmed</p>
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-mahogany mb-3">
            Thank You!
          </h1>
          <div className="gold-divider" />
        </div>

        <p className="font-lora text-base italic text-mahogany/70 leading-relaxed">
          Your Native Flame candles are on their way to you soon.<br />
          Jennifer personally packages each order with care.
        </p>

        {order && (
          <div className="bg-parchment p-6 text-left space-y-3">
            <h2 className="font-cinzel text-sm font-semibold text-mahogany tracking-wide uppercase">Order Details</h2>
            <div className="w-8 h-px bg-gold" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-raleway text-mahogany/50">Order #</span>
                <span className="font-cinzel text-mahogany text-xs">{order.id.split('-')[0].toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-raleway text-mahogany/50">Email</span>
                <span className="font-lora text-mahogany/70">{order.customer_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-raleway text-mahogany/50">Total</span>
                <span className="font-cinzel font-bold text-gold">${Number(order.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-raleway text-mahogany/50">Status</span>
                <span className="font-raleway text-xs font-semibold uppercase tracking-wider text-teal-dark">{order.status}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="font-lora text-sm text-mahogany/50 italic">
            Your order has been received. Jennifer will be in touch at{' '}
            <span className="text-mahogany font-semibold">{email || 'your email'}</span>
          </p>
          <p className="font-raleway text-xs text-mahogany/30">
            Questions? Email{' '}
            <a href="mailto:nativeflamecandles@gmail.com" className="text-gold hover:underline">
              nativeflamecandles@gmail.com
            </a>{' '}
            or call (325) 339-7398
          </p>
        </div>

        <Link to="/shop" className="btn-gold inline-block">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
