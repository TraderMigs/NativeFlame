import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import EmailSignup from '../components/EmailSignup'
import { useSiteSettings } from '../context/SiteSettingsContext'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [loading,  setLoading]  = useState(true)
  const { content, colors } = useSiteSettings()

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true)
      .order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => { setFeatured(data || []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${colors.hero_bg} 0%, ${colors.hero_bg}CC 50%, ${colors.hero_bg} 100%)` }}>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[550px] h-[550px] rounded-full opacity-30"
            style={{ background:'radial-gradient(circle,#C8922A 0%,#6B3A0F 40%,transparent 70%)', filter:'blur(90px)' }}/>
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-40"/>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-40"/>

        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <div className="animate-fade-in-up flex justify-center mb-6">
            <div className="bg-parchment/15 rounded-xl p-2">
              <img src="/logo.png" alt="Native Flame Candle Company"
                className="w-full object-contain"
                style={{ maxWidth: 'min(680px, 90vw)' }}
              />
            </div>
          </div>

          <div className="animate-fade-in-up flex items-center justify-center gap-4 mb-5" style={{ animationDelay:'0.15s' }}>
            <div className="h-px w-14 bg-gold/50"/>
            <p className="font-raleway text-xs tracking-[0.4em] uppercase text-gold/80">Buffalo Gap, Texas · Est. 2024</p>
            <div className="h-px w-14 bg-gold/50"/>
          </div>

          <p className="animate-fade-in-up font-lora text-lg md:text-xl italic text-cream/80 leading-relaxed mb-10"
            style={{ animationDelay:'0.25s' }}>
            {content.hero_quote}
          </p>

          <div className="animate-fade-in-up flex flex-col sm:flex-row justify-center gap-4"
            style={{ animationDelay:'0.35s' }}>
            <Link to="/shop"  className="btn-gold min-w-44">Shop the Collection</Link>
            <Link to="/about" className="btn-outline border-cream/50 text-cream hover:bg-cream hover:text-mahogany min-w-44">Our Story</Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1 text-cream/30 animate-fade-in"
          style={{ animationDelay:'0.5s' }}>
          <span className="font-raleway text-xs tracking-widest uppercase">Scroll</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      {/* VALUES STRIP */}
      <section style={{ backgroundColor: colors.values_strip_bg }} className="py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { icon:'🕯️', title: content.values_1_title, sub: content.values_1_sub },
            { icon:'🌿', title: content.values_2_title, sub: content.values_2_sub },
            { icon:'🦅', title: content.values_3_title, sub: content.values_3_sub },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{icon}</span>
              <h3 className="font-cinzel text-sm font-semibold text-gold tracking-widest uppercase">{title}</h3>
              <p className="font-raleway text-xs text-cream/50">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-20 px-4" style={{ backgroundColor: colors.products_bg }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-raleway text-xs tracking-[0.3em] uppercase text-gold mb-3">{content.featured_label}</p>
            <h2 className="section-title">{content.featured_title}</h2>
            <div className="gold-divider"/>
            <p className="font-lora text-base text-mahogany/60 italic mt-4">{content.featured_sub}</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_,i) => (
                <div key={i} className="bg-parchment">
                  <div className="aspect-square skeleton"/>
                  <div className="p-5 space-y-3">
                    <div className="h-4 skeleton rounded w-3/4"/>
                    <div className="h-3 skeleton rounded w-1/2"/>
                    <div className="h-8 skeleton rounded w-full mt-4"/>
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          ) : (
            <p className="text-center font-lora italic text-mahogany/50 py-16">Products coming soon...</p>
          )}

          <div className="text-center mt-12">
            <Link to="/shop" className="btn-outline">View All Products</Link>
          </div>
        </div>
      </section>

      {/* ABOUT TEASER */}
      <section className="relative py-24 overflow-hidden" style={{ backgroundColor: colors.about_teaser_bg }}>
        <div className="absolute inset-0 texture-overlay opacity-30"/>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="font-raleway text-xs tracking-[0.3em] uppercase text-gold mb-4">{content.about_label}</p>
          <h2 className="font-cinzel text-3xl md:text-5xl font-bold text-mahogany leading-tight mb-6">
            {content.about_heading}
          </h2>
          <div className="gold-divider"/>
          <p className="font-lora text-base md:text-lg text-mahogany/70 leading-relaxed mt-6 mb-8 max-w-2xl mx-auto">
            {content.about_body}
          </p>
          <Link to="/about" className="btn-dark">Read Jennifer's Story</Link>
        </div>
      </section>

      {/* COLLECTIONS SPLIT */}
      <section className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative min-h-80 flex items-end p-8 overflow-hidden"
          style={{ backgroundColor: colors.collections_light_bg }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-64 h-64 rounded-full border-4 border-mahogany"/>
          </div>
          <div className="relative z-10">
            <p className="font-raleway text-xs tracking-widest uppercase text-mahogany/50 mb-2">Everyday Collection</p>
            <h3 className="font-cinzel text-2xl md:text-3xl font-bold text-mahogany mb-4">Natural & Warm</h3>
            <Link to="/shop?collection=natural" className="btn-outline text-xs px-6 py-2">Explore</Link>
          </div>
        </div>

        <div className="relative min-h-80 flex items-end p-8 overflow-hidden"
          style={{ backgroundColor: colors.collections_dark_bg }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <div className="w-64 h-64 rounded-full border-4 border-gold"/>
          </div>
          <div className="relative z-10">
            <p className="font-raleway text-xs tracking-widest uppercase text-gold/60 mb-2">Coffee House Collection</p>
            <h3 className="font-cinzel text-2xl md:text-3xl font-bold text-cream mb-4">Bold & Refined</h3>
            <Link to="/shop?collection=dark" className="btn-outline border-gold text-gold hover:bg-gold hover:text-cream text-xs px-6 py-2">Explore</Link>
          </div>
        </div>
      </section>

      {/* EMAIL SIGNUP */}
      <section className="py-20 px-4" style={{ backgroundColor: colors.email_signup_bg }}>
        <div className="max-w-xl mx-auto">
          <EmailSignup dark={false}/>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-20 px-4 text-center" style={{ backgroundColor: colors.testimonial_bg }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-gold text-4xl mb-6">✦</div>
          <blockquote className="font-lora text-xl md:text-2xl italic text-cream/85 leading-relaxed mb-6">
            {content.testimonial_quote}
          </blockquote>
          <div className="gold-divider"/>
          <p className="font-raleway text-xs tracking-widest uppercase text-gold mt-4">{content.testimonial_by}</p>
        </div>
      </section>

    </div>
  )
}
