import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext(null)

export const DEFAULT_COLORS = {
  hero_bg:              '#1C0A00',
  values_strip_bg:      '#1C0A00',
  products_bg:          '#FFF8EE',
  about_teaser_bg:      '#F5EDD9',
  collections_light_bg: '#F5EDD9',
  collections_dark_bg:  '#1C0A00',
  email_signup_bg:      '#F5EDD9',
  testimonial_bg:       '#1C0A00',
  footer_bg:            '#1C0A00',
}

export const DEFAULT_CONTENT = {
  hero_quote:        '"Hand-poured in faith, rooted in heritage, and made to comfort the soul."',
  values_1_title:    'Hand-Poured',
  values_1_sub:      'Small batch, made with care',
  values_2_title:    'Quality Ingredients',
  values_2_sub:      'Soy blend, cotton wick',
  values_3_title:    'Heritage Inspired',
  values_3_sub:      'Rooted in Texas tradition',
  featured_label:    'New Arrivals',
  featured_title:    'Featured Candles',
  featured_sub:      'Every flame tells a story. Find yours.',
  about_label:       'The Heart Behind Every Candle',
  about_heading:     'Crafted with Faith, Poured with Purpose',
  about_body:        'Every Native Flame candle is made by hand in the heart of Texas. Jennifer brings heritage, faith, and a love of the land into each small-batch pour — creating scents that feel like coming home.',
  testimonial_quote: "\"These candles fill the room with something you can't quite describe — it feels like memory, like home.\"",
  testimonial_by:    '— Happy Customer',
}

export const DEFAULT_SHIPPING = {
  shipping_mode:       'flat',   // 'flat' | 'threshold' | 'free'
  shipping_flat_rate:  '7.99',
  shipping_threshold:  '50',
  shipping_free_label: 'Free Shipping on orders over $50',
}

export function SiteSettingsProvider({ children }) {
  const [colors,    setColors]    = useState(DEFAULT_COLORS)
  const [content,   setContent]   = useState(DEFAULT_CONTENT)
  const [shipping,  setShipping]  = useState(DEFAULT_SHIPPING)
  const [loaded,    setLoaded]    = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await supabase.from('site_settings').select('key,value')
      if (data?.length) {
        const c = { ...DEFAULT_COLORS }
        const t = { ...DEFAULT_CONTENT }
        const s = { ...DEFAULT_SHIPPING }
        data.forEach(({ key, value }) => {
          if (key in DEFAULT_COLORS)   c[key] = value
          if (key in DEFAULT_CONTENT)  t[key] = value
          if (key in DEFAULT_SHIPPING) s[key] = value
        })
        setColors(c); setContent(t); setShipping(s)
      }
    } catch (_) {}
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const root = document.documentElement
    Object.entries(colors).forEach(([k, v]) =>
      root.style.setProperty(`--site-${k.replace(/_/g,'-')}`, v)
    )
  }, [colors])

  async function saveColors(next) {
    await supabase.from('site_settings').upsert(
      Object.entries(next).map(([key,value]) => ({ key, value })),
      { onConflict: 'key' }
    )
    setColors(next)
  }

  async function saveShipping(next) {
    await supabase.from('site_settings').upsert(
      Object.entries(next).map(([key,value]) => ({ key, value })),
      { onConflict: 'key' }
    )
    setShipping(next)
  }

  async function saveContent(next) {
    await supabase.from('site_settings').upsert(
      Object.entries(next).map(([key,value]) => ({ key, value })),
      { onConflict: 'key' }
    )
    setContent(next)
  }

  return (
    <Ctx.Provider value={{ colors, content, shipping, loaded, setColors, setContent, setShipping, saveColors, saveContent, saveShipping, reload: load }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSiteSettings() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSiteSettings must be used inside SiteSettingsProvider')
  return ctx
}
