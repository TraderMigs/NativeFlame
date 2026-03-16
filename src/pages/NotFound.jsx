import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pt-24 bg-cream flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center py-16 space-y-8">

        {/* Candle icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="text-8xl">🕯️</div>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-6 bg-gradient-to-t from-gold to-transparent rounded-full opacity-60 animate-pulse"/>
          </div>
        </div>

        <div>
          <p className="font-raleway text-xs tracking-[0.4em] uppercase text-gold mb-3">
            Lost in the dark
          </p>
          <h1 className="font-cinzel text-6xl md:text-7xl font-bold text-mahogany mb-2">404</h1>
          <div className="gold-divider"/>
          <h2 className="font-cinzel text-xl md:text-2xl font-semibold text-mahogany mt-4">
            Page Not Found
          </h2>
        </div>

        <p className="font-lora text-base italic text-mahogany/60 leading-relaxed max-w-sm mx-auto">
          Looks like this page has burned out. Let's light your way back home.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/" className="btn-gold min-w-44">
            Back to Home
          </Link>
          <Link to="/shop" className="btn-outline min-w-44">
            Shop the Collection
          </Link>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="font-raleway text-xs text-mahogany/40 hover:text-gold transition-colors uppercase tracking-wider underline underline-offset-4">
          Go Back
        </button>

      </div>
    </div>
  )
}
