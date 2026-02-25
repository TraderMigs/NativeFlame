import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-mahogany text-cream">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Brand */}
          <div className="space-y-4">
            <div>
              <img src="/logo.png" alt="Native Flame Candle Company" className="h-16 w-auto object-contain" />
            </div>
            <div className="w-12 h-px bg-gold"></div>
            <p className="font-lora text-sm text-cream/80 italic leading-relaxed">
              "Hand-poured in faith, rooted in heritage,<br />and made to comfort the soul."
            </p>
            <p className="font-raleway text-xs text-cream/50">
              Buffalo Gap, Texas
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-cinzel text-sm font-semibold tracking-widest uppercase text-gold">Quick Links</h4>
            <div className="w-8 h-px bg-gold/50"></div>
            <nav className="flex flex-col gap-3">
              <Link to="/shop" className="font-raleway text-sm text-cream/70 hover:text-gold transition-colors duration-200">Shop All Candles</Link>
              <Link to="/about" className="font-raleway text-sm text-cream/70 hover:text-gold transition-colors duration-200">Our Story</Link>
              <Link to="/cart" className="font-raleway text-sm text-cream/70 hover:text-gold transition-colors duration-200">Shopping Cart</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-cinzel text-sm font-semibold tracking-widest uppercase text-gold">Contact Jennifer</h4>
            <div className="w-8 h-px bg-gold/50"></div>
            <div className="space-y-3">
              <a href="mailto:nativeflamecandles@gmail.com"
                className="flex items-center gap-3 font-raleway text-sm text-cream/70 hover:text-gold transition-colors duration-200">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                nativeflamecandles@gmail.com
              </a>
              <a href="tel:3253397398"
                className="flex items-center gap-3 font-raleway text-sm text-cream/70 hover:text-gold transition-colors duration-200">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                (325) 339-7398
              </a>
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-raleway text-sm text-cream/70">Buffalo Gap, Texas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-cream/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="font-raleway text-xs text-cream/40">
            © {new Date().getFullYear()} Native Flame Candle Company. All rights reserved.
          </p>
          <p className="font-raleway text-xs text-cream/30 italic">
            Hand-poured with love in Buffalo Gap, Texas
          </p>
        </div>
      </div>
    </footer>
  )
}
