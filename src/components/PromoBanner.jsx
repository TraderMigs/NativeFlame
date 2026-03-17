import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PromoBanner() {
  const [promo,     setPromo]     = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const now = new Date().toISOString()
        const { data } = await supabase
          .from('promos')
          .select('*')
          .eq('is_active', true)
          .lte('starts_at', now)
          .or(`ends_at.is.null,ends_at.gte.${now}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (data) {
          // Check if this promo was already dismissed this session
          const key = `promo_dismissed_${data.id}`
          if (!sessionStorage.getItem(key)) setPromo(data)
          if (data.display_type === 'modal') setShowModal(true)
        }
      } catch (_) {}
    }
    load()
  }, [])

  function dismiss() {
    if (promo) sessionStorage.setItem(`promo_dismissed_${promo.id}`, '1')
    setDismissed(true)
    setShowModal(false)
  }

  if (!promo || dismissed) return null

  // MODAL
  if (promo.display_type === 'modal' && showModal) {
    return (
      <>
        <div className="fixed inset-0 bg-mahogany/70 z-50 flex items-center justify-center px-4 animate-fade-in">
          <div className="bg-cream max-w-md w-full shadow-2xl border border-parchment-dark animate-fade-in-up">
            {/* Header */}
            <div className="px-6 py-5 text-center"
              style={{ backgroundColor: promo.bg_color || '#1C0A00' }}>
              {promo.emoji && <div className="text-4xl mb-2">{promo.emoji}</div>}
              <h2 className="font-cinzel text-xl font-bold" style={{ color: promo.text_color || '#FFF8EE' }}>
                {promo.headline}
              </h2>
            </div>
            {/* Body */}
            <div className="px-6 py-6 text-center space-y-4">
              {promo.body && (
                <p className="font-lora text-base text-mahogany/80 leading-relaxed">{promo.body}</p>
              )}
              {promo.cta_label && promo.cta_url && (
                <a href={promo.cta_url}
                  onClick={dismiss}
                  className="btn-gold w-full text-center block">
                  {promo.cta_label}
                </a>
              )}
              <button onClick={dismiss}
                className="font-raleway text-xs text-mahogany/40 hover:text-mahogany transition-colors uppercase tracking-wider">
                No thanks, close
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // BANNER (top of page)
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5 shadow-md"
      style={{ backgroundColor: promo.bg_color || '#C8922A' }}>
      <div className="flex-1 text-center">
        {promo.emoji && <span className="mr-2">{promo.emoji}</span>}
        <span className="font-cinzel text-sm font-semibold tracking-wide"
          style={{ color: promo.text_color || '#1C0A00' }}>
          {promo.headline}
        </span>
        {promo.body && (
          <span className="font-raleway text-xs ml-2 hidden md:inline"
            style={{ color: promo.text_color || '#1C0A00', opacity: 0.8 }}>
            {promo.body}
          </span>
        )}
        {promo.cta_label && promo.cta_url && (
          <a href={promo.cta_url} onClick={dismiss}
            className="ml-3 font-raleway text-xs font-bold underline underline-offset-2"
            style={{ color: promo.text_color || '#1C0A00' }}>
            {promo.cta_label} →
          </a>
        )}
      </div>
      <button onClick={dismiss} className="shrink-0 ml-4 hover:opacity-70 transition-opacity"
        style={{ color: promo.text_color || '#1C0A00' }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}
