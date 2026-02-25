import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { totalItems, setIsOpen } = useCart()
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [shopOpen, setShopOpen]   = useState(false)
  const closeTimer = useRef(null)
  const location   = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false); setShopOpen(false) }, [location])

  const openShop  = () => { clearTimeout(closeTimer.current); setShopOpen(true) }
  const closeShop = () => { closeTimer.current = setTimeout(() => setShopOpen(false), 320) }

  const isHome  = location.pathname === '/'
  const isLight = scrolled || !isHome

  const SHOP_ITEMS = [
    { to: '/shop',                    label: 'All Products',   icon: '✦' },
    { to: '/shop?type=candle',        label: 'Candles',        icon: '🕯️' },
    { to: '/shop?type=wax_melt',      label: 'Wax Melts',      icon: '🫧' },
    { to: '/shop?type=room_spray',    label: 'Room Sprays',    icon: '🌿' },
    { to: '/shop?type=car_freshener', label: 'Car Fresheners', icon: '🚗' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isLight ? 'bg-cream shadow-md border-b border-parchment-dark' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">

          {/* ── LOGO (transparent PNG) ── */}
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Native Flame Candle Company"
              className="h-14 md:h-20 w-auto object-contain" />
          </Link>

          {/* ── DESKTOP NAV ── */}
          <div className="hidden md:flex items-center gap-8">

            {/* Shop dropdown — invisible bridge fills the gap so mouse never loses hover */}
            <div className="relative" onMouseEnter={openShop} onMouseLeave={closeShop}>
              <button className={`nav-link flex items-center gap-1 transition-colors duration-300 ${
                isLight ? '' : 'text-cream hover:text-gold-pale'
              }`}>
                Shop
                <svg className={`w-3 h-3 mt-0.5 transition-transform ${shopOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {shopOpen && (
                <>
                  {/* Invisible tall bridge — covers gap between button bottom and menu top */}
                  <div className="absolute top-full left-0 right-0 h-5"
                    onMouseEnter={openShop} onMouseLeave={closeShop} />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-5 w-60 bg-cream border border-parchment-dark shadow-2xl py-1 animate-fade-in"
                    onMouseEnter={openShop} onMouseLeave={closeShop}>
                    {SHOP_ITEMS.map(({ to, label, icon }) => (
                      <Link key={to} to={to}
                        className="flex items-center gap-3 px-5 py-3 font-raleway text-xs uppercase tracking-widest text-mahogany hover:text-gold hover:bg-parchment transition-colors border-b border-parchment last:border-0">
                        <span className="text-base">{icon}</span>{label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link to="/about" className={`nav-link transition-colors duration-300 ${isLight ? '' : 'text-cream hover:text-gold-pale'}`}>
              Our Story
            </Link>
            <a href="mailto:nativeflamecandles@gmail.com"
              className={`nav-link transition-colors duration-300 ${isLight ? '' : 'text-cream hover:text-gold-pale'}`}>
              Contact
            </a>
          </div>

          {/* ── CART + MOBILE TOGGLE ── */}
          <div className="flex items-center gap-4">
            <button onClick={() => setIsOpen(true)} className="relative p-2 group" aria-label="Open cart">
              <svg className={`w-6 h-6 transition-colors ${isLight ? 'text-mahogany group-hover:text-gold' : 'text-cream group-hover:text-gold-pale'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-cream text-xs font-cinzel font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <button onClick={() => setMenuOpen(!menuOpen)}
              className={`md:hidden p-2 ${isLight ? 'text-mahogany' : 'text-cream'}`}>
              {menuOpen
                ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
              }
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        {menuOpen && (
          <div className="md:hidden bg-cream border-t border-parchment-dark py-4 animate-fade-in">
            <div className="flex flex-col gap-1 px-4">
              <p className="font-raleway text-xs text-mahogany/30 uppercase tracking-widest px-2 pt-2 pb-1">Shop</p>
              {SHOP_ITEMS.map(({ to, label, icon }) => (
                <Link key={to} to={to} className="nav-link py-3 px-2 border-b border-parchment/50">
                  {icon} {label}
                </Link>
              ))}
              <Link to="/about" className="nav-link py-3 px-2 border-b border-parchment/50 mt-2">Our Story</Link>
              <a href="mailto:nativeflamecandles@gmail.com" className="nav-link py-3 px-2">Contact Jennifer</a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
