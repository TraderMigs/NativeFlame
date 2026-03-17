import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const db = supabase

export default function Contact() {
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', message: '' })
  const [status,  setStatus]  = useState('idle')
  const [errors,  setErrors]  = useState({})

  function validate() {
    const e = {}
    if (!form.name.trim())    e.name    = 'Required'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Valid email required'
    if (!form.message.trim()) e.message = 'Required'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setStatus('loading')
    try {
      const { error } = await (db ).from('contact_messages').insert({
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim() || null,
        message: form.message.trim(),
        source:  'contact_page',
      })
      if (error) throw error
      setStatus('success')
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (_) {
      setStatus('error')
    }
  }

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })) }

  return (
    <div className="min-h-screen pt-24 bg-cream">

      {/* Header */}
      <div className="relative py-20 px-4 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1C0A00 0%, #3D1F0A 60%, #1C0A00 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #C8922A, transparent 70%)', filter: 'blur(50px)' }}/>
        </div>
        <div className="relative z-10">
          <p className="font-raleway text-xs tracking-[0.4em] uppercase text-gold mb-4">Get in Touch</p>
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-cream mb-4">Contact Jennifer</h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold/50"/>
            <p className="font-lora text-sm italic text-cream/60">We'd love to hear from you</p>
            <div className="h-px w-16 bg-gold/50"/>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Form */}
          <div>
            <h2 className="font-cinzel text-2xl font-bold text-mahogany mb-2">Send a Message</h2>
            <div className="gold-divider" style={{ marginLeft: 0, marginRight: 'auto' }}/>

            {status === 'success' ? (
              <div className="mt-8 bg-teal/10 border border-teal/30 p-8 text-center space-y-4">
                <div className="text-5xl">✉️</div>
                <h3 className="font-cinzel text-lg font-bold text-mahogany">Message Sent!</h3>
                <p className="font-lora text-sm italic text-mahogany/60">
                  Jennifer will get back to you as soon as possible.
                </p>
                <button onClick={() => setStatus('idle')} className="btn-outline text-xs px-6 py-2">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Name *</label>
                    <input value={form.name} onChange={e => f('name', e.target.value)}
                      className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder="Your name"/>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Email *</label>
                    <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                      className={`input-field ${errors.email ? 'border-red-400' : ''}`} placeholder="your@email.com"/>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Phone (optional)</label>
                  <input value={form.phone} onChange={e => f('phone', e.target.value)}
                    className="input-field" placeholder="(555) 000-0000"/>
                </div>
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Message *</label>
                  <textarea value={form.message} onChange={e => f('message', e.target.value)} rows={5}
                    className={`input-field resize-none ${errors.message ? 'border-red-400' : ''}`}
                    placeholder="Questions, custom orders, product requests..."/>
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>
                {status === 'error' && (
                  <p className="font-raleway text-xs text-red-500">Something went wrong. Please try again.</p>
                )}
                <button type="submit" disabled={status === 'loading'} className="btn-gold w-full flex items-center justify-center gap-2">
                  {status === 'loading'
                    ? <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"/>Sending...</>
                    : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-cinzel text-2xl font-bold text-mahogany mb-2">Reach Jennifer Directly</h2>
              <div className="gold-divider" style={{ marginLeft: 0, marginRight: 'auto' }}/>
            </div>
            <div className="space-y-5 mt-8">
              {[
                { icon: '✉️', label: 'Email', val: 'nativeflamecandles@gmail.com', href: 'mailto:nativeflamecandles@gmail.com' },
                { icon: '📞', label: 'Phone', val: '(325) 339-7398', href: 'tel:3253397398' },
                { icon: '📍', label: 'Location', val: 'Buffalo Gap, Texas', href: null },
              ].map(({ icon, label, val, href }) => (
                <div key={label} className="flex items-start gap-4 p-4 bg-parchment">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-1">{label}</p>
                    {href
                      ? <a href={href} className="font-lora text-mahogany hover:text-gold transition-colors">{val}</a>
                      : <p className="font-lora text-mahogany">{val}</p>
                    }
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-mahogany p-6 text-center space-y-3">
              <p className="font-lora text-sm italic text-cream/70">
                Interested in custom orders, bulk pricing, or local pickup?
              </p>
              <p className="font-raleway text-xs text-gold uppercase tracking-wider">Jennifer loves to connect</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
