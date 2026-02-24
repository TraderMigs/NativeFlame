import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { totalItems, setIsOpen } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  const isHome = location.pathname === '/'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled || !isHome
        ? 'bg-cream shadow-md border-b border-parchment-dark'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex flex-col leading-none">
              <span className={`font-cinzel font-bold text-lg md:text-xl tracking-wider transition-colors duration-300 ${
                scrolled || !isHome ? 'text-mahogany' : 'text-cream hero-text-shadow'
              }`}>
                Native Flame
              </span>
              <span className={`font-raleway text-xs tracking-widest uppercase transition-colors duration-300 ${
                scrolled || !isHome ? 'text-gold' : 'text-gold-pale'
              }`}>
                Candle Company
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/shop" className={`nav-link transition-colors duration-300 ${
              scrolled || !isHome ? '' : 'text-cream hover:text-gold-pale'
            }`}>Shop</Link>
            <Link to="/about" className={`nav-link transition-colors duration-300 ${
              scrolled || !isHome ? '' : 'text-cream hover:text-gold-pale'
            }`}>Our Story</Link>
            <a href="mailto:nativeflamecandles@gmail.com" className={`nav-link transition-colors duration-300 ${
              scrolled || !isHome ? '' : 'text-cream hover:text-gold-pale'
            }`}>Contact</a>
          </div>

          {/* Cart + Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Cart Button */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 group"
              aria-label="Open cart"
            >
              <svg className={`w-6 h-6 transition-colors duration-300 ${
                scrolled || !isHome ? 'text-mahogany group-hover:text-gold' : 'text-cream group-hover:text-gold-pale'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-cream text-xs font-cinzel font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden p-2 transition-colors duration-300 ${
                scrolled || !isHome ? 'text-mahogany' : 'text-cream'
              }`}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-cream border-t border-parchment-dark py-4 animate-fade-in">
            <div className="flex flex-col gap-4 px-4">
              <Link to="/shop" className="nav-link py-2 border-b border-parchment">Shop All Candles</Link>
              <Link to="/about" className="nav-link py-2 border-b border-parchment">Our Story</Link>
              <a href="mailto:nativeflamecandles@gmail.com" className="nav-link py-2">Contact Jennifer</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
