import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function EmailSignup({ dark = false }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error | duplicate
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setErrorMsg('Please enter a valid email address.')
      setStatus('error')
      return
    }

    setStatus('loading')

    // Check for duplicate
    const { data: existing } = await supabase
      .from('email_subscribers')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      setStatus('duplicate')
      return
    }

    const { error } = await supabase
      .from('email_subscribers')
      .insert({ email: email.toLowerCase().trim() })

    if (error) {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  const textColor = dark ? 'text-cream' : 'text-mahogany'
  const subtextColor = dark ? 'text-cream/60' : 'text-mahogany/60'
  const inputBg = dark ? 'bg-mahogany-light border-cream/20 text-cream placeholder-cream/30 focus:border-gold' : 'bg-cream border-parchment-dark text-mahogany placeholder-mahogany/30 focus:border-gold'

  if (status === 'success') {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="text-4xl">🎉</div>
        <h3 className={`font-cinzel font-bold text-xl ${textColor}`}>You're In!</h3>
        <p className={`font-lora italic text-base ${subtextColor}`}>
          Use code below at checkout for 15% off your first order:
        </p>
        <div className={`inline-block border-2 border-gold px-8 py-3 mt-2`}>
          <span className="font-cinzel font-bold text-2xl text-gold tracking-widest">WELCOME15</span>
        </div>
        <p className={`font-raleway text-xs ${subtextColor} mt-2`}>
          Save this code — it's yours to keep! 🕯️
        </p>
      </div>
    )
  }

  if (status === 'duplicate') {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="text-3xl">🕯️</div>
        <p className={`font-lora italic text-base ${subtextColor}`}>
          You're already on the list — thank you!
        </p>
        <div className="inline-block border-2 border-gold px-8 py-3">
          <span className="font-cinzel font-bold text-2xl text-gold tracking-widest">WELCOME15</span>
        </div>
        <p className={`font-raleway text-xs ${subtextColor}`}>Your discount code still works at checkout.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className={`font-raleway text-xs tracking-[0.3em] uppercase mb-2 ${dark ? 'text-gold' : 'text-gold'}`}>
          Join the Flame
        </p>
        <h3 className={`font-cinzel text-2xl md:text-3xl font-bold ${textColor}`}>
          Get 15% Off Your First Order
        </h3>
        <div className="gold-divider" />
        <p className={`font-lora text-sm italic mt-3 ${subtextColor}`}>
          Sign up for updates, new scents, and exclusive offers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-4">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setStatus('idle') }}
          placeholder="your@email.com"
          className={`flex-1 border px-4 py-3 font-lora text-sm focus:outline-none transition-colors ${inputBg}`}
          required
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-gold whitespace-nowrap flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
              Joining...
            </>
          ) : 'Claim My 15% Off'}
        </button>
      </form>

      {status === 'error' && (
        <p className="text-center font-raleway text-xs text-red-400">{errorMsg}</p>
      )}

      <p className={`text-center font-raleway text-xs ${subtextColor}`}>
        No spam. Unsubscribe anytime. We respect your inbox.
      </p>
    </div>
  )
}
