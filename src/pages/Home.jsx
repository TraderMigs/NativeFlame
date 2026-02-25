import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import EmailSignup from '../components/EmailSignup'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeatured() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(4)
        .order('created_at', { ascending: false })
      setFeatured(data || [])
      setLoading(false)
    }
    loadFeatured()
  }, [])

  return (
    <div className="min-h-screen">

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `
              linear-gradient(
                to bottom,
                rgba(28, 10, 0, 0.55) 0%,
                rgba(28, 10, 0, 0.35) 40%,
                rgba(28, 10, 0, 0.65) 100%
              ),
              linear-gradient(
                135deg,
                #1C0A00 0%,
                #3D2010 25%,
                #2A1505 50%,
                #1C0A00 75%,
                #0D0500 100%
              )
            `
          }}
        />

        {/* Candle flame glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-96 h-96 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #C8922A 0%, #8B5A1A 40%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </div>

        {/* Decorative top/bottom borders */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="animate-fade-in-up animate-delay-100 font-raleway text-gold-pale text-xs tracking-[0.4em] uppercase mb-6">
            Buffalo Gap, Texas · Est. 2024
          </p>

          <h1 className="animate-fade-in-up animate-delay-200 font-cinzel text-5xl md:text-7xl font-bold text-cream hero-text-shadow leading-tight mb-6">
            Native<br />
            <span className="text-gold-gradient">Flame</span>
          </h1>

          <div className="animate-fade-in-up animate-delay-300 flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-gold/50" />
            <p className="font-raleway text-xs tracking-[0.3em] uppercase text-gold-pale">Candle Company</p>
            <div className="h-px w-16 bg-gold/50" />
          </div>

          <p className="animate-fade-in-up animate-delay-400 font-lora text-lg md:text-xl italic text-cream/85 max-w-2xl mx-auto leading-relaxed mb-10">
            "Hand-poured in faith, rooted in heritage,<br />
            and made to comfort the soul."
          </p>

          <div className="animate-fade-in-up animate-delay-500 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/shop" className="btn-gold min-w-48">
              Shop the Collection
            </Link>
            <Link to="/about" className="btn-outline border-cream/50 text-cream hover:bg-cream hover:text-mahogany min-w-48">
              Our Story
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-fade-in animate-delay-500">
          <div className="flex flex-col items-center gap-2 text-cream/40">
            <span className="font-raleway text-xs tracking-widest uppercase">Scroll</span>
            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ═══ BRAND VALUES STRIP ═══ */}
      <section className="bg-mahogany py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon: '🕯️', title: 'Hand-Poured', sub: 'Small batch, made with care' },
            { icon: '🌿', title: 'Clean Burn', sub: 'Soy blend, cotton wick' },
            { icon: '🦅', title: 'Heritage Inspired', sub: 'Rooted in Texas tradition' },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-cinzel text-sm font-semibold text-gold tracking-widest uppercase">{title}</h3>
              <p className="font-raleway text-xs text-cream/50">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ═══ */}
      <section className="py-20 px-4 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-raleway text-xs tracking-[0.3em] uppercase text-gold mb-3">New Arrivals</p>
            <h2 className="section-title">Featured Candles</h2>
            <div className="gold-divider" />
            <p className="font-lora text-base text-mahogany/60 italic mt-4 max-w-lg mx-auto">
              Every flame tells a story. Find yours.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-parchment">
                  <div className="aspect-square skeleton" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 skeleton rounded w-3/4" />
                    <div className="h-3 skeleton rounded w-1/2" />
                    <div className="h-8 skeleton rounded w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-lora italic text-mahogany/50">Products coming soon...</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/shop" className="btn-outline">
              View All Candles
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ ABOUT TEASER ═══ */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #F5EDD9 0%, #E8D9BE 50%, #DEC9A0 100%)'
          }}
        />
        <div className="absolute inset-0 texture-overlay opacity-30" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="font-raleway text-xs tracking-[0.3em] uppercase text-gold mb-4">The Heart Behind Every Candle</p>
          <h2 className="font-cinzel text-3xl md:text-5xl font-bold text-mahogany leading-tight mb-6">
            Crafted with Faith,<br />Poured with Purpose
          </h2>
          <div className="gold-divider" />
          <p className="font-lora text-base md:text-lg text-mahogany/70 leading-relaxed mt-6 mb-8 max-w-2xl mx-auto">
            Every Native Flame candle is made by hand in the heart of Texas hill country.
            Jennifer brings heritage, faith, and a love of the land into each small-batch pour —
            creating scents that feel like coming home.
          </p>
          <Link to="/about" className="btn-dark">
            Read Jennifer's Story
          </Link>
        </div>
      </section>

      {/* ═══ COLLECTIONS SPLIT ═══ */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        {/* White/Natural */}
        <div
          className="relative aspect-video md:aspect-auto min-h-80 flex items-end p-8 overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #F5EDD9, #E8D9BE)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-64 h-64 rounded-full border-4 border-mahogany" />
          </div>
          <div className="relative z-10">
            <p className="font-raleway text-xs tracking-widest uppercase text-mahogany/50 mb-2">Everyday Collection</p>
            <h3 className="font-cinzel text-2xl md:text-3xl font-bold text-mahogany mb-4">Natural & Warm</h3>
            <Link to="/shop?collection=natural" className="btn-outline text-xs px-6 py-2">
              Explore
            </Link>
          </div>
        </div>

        {/* Black/Premium */}
        <div
          className="relative aspect-video md:aspect-auto min-h-80 flex items-end p-8 overflow-hidden group"
          style={{ background: 'linear-gradient(135deg, #1C0A00, #3D1F0A)' }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <div className="w-64 h-64 rounded-full border-4 border-gold" />
          </div>
          <div className="relative z-10">
            <p className="font-raleway text-xs tracking-widest uppercase text-gold/60 mb-2">Coffee House Collection Series</p>
            <h3 className="font-cinzel text-2xl md:text-3xl font-bold text-cream mb-4">Bold & Refined</h3>
            <Link to="/shop?collection=dark" className="btn-outline border-gold text-gold hover:bg-gold hover:text-cream text-xs px-6 py-2">
              Explore
            </Link>
          </div>
        </div>
      </section>


      {/* ═══ EMAIL SIGNUP ═══ */}
      <section className="py-20 px-4 bg-parchment">
        <div className="max-w-xl mx-auto">
          <EmailSignup dark={false} />
        </div>
      </section>

      {/* ═══ TESTIMONIAL / TRUST ═══ */}
      <section className="bg-mahogany py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-gold text-4xl mb-6">✦</div>
          <blockquote className="font-lora text-xl md:text-2xl italic text-cream/85 leading-relaxed mb-6">
            "These candles fill the room with something you can't quite describe — it feels like memory, like home."
          </blockquote>
          <div className="gold-divider" />
          <p className="font-raleway text-xs tracking-widest uppercase text-gold mt-4">— Happy Customer</p>
        </div>
      </section>

    </div>
  )
}
