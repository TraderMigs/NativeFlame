import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const db = supabase

export default function ChatWidget() {
  const [open,    setOpen]    = useState(false)
  const [form,    setForm]    = useState({ name: '', email: '', message: '' })
  const [status,  setStatus]  = useState('idle')
  const [errors,  setErrors]  = useState({})
  const [pos,     setPos]     = useState({ x: null, y: null })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const widgetRef  = useRef(null)

  // Default position — bottom right
  useEffect(() => {
    setPos({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
  }, [])

  // Drag handlers
  function onMouseDown(e) {
    if (open) return
    e.preventDefault()
    setDragging(true)
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    }
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging) return
      setPos({
        x: Math.min(Math.max(0, e.clientX - dragOffset.current.x), window.innerWidth  - 56),
        y: Math.min(Math.max(0, e.clientY - dragOffset.current.y), window.innerHeight - 56),
      })
    }
    function onMouseUp() { setDragging(false) }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [dragging])

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
        message: form.message.trim(),
        source:  'chat_widget',
      })
      if (error) throw error
      setStatus('success')
    } catch (_) {
      setStatus('error')
    }
  }

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })) }

  function reset() { setForm({ name: '', email: '', message: '' }); setStatus('idle'); setErrors({}) }

  if (pos.x === null) return null

  return (
    <>
      {/* Backdrop when open */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); reset() }}/>
      )}

      {/* Widget button — draggable */}
      <div
        ref={widgetRef}
        style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 50 }}
        onMouseDown={onMouseDown}
      >
        <button
          onClick={() => !dragging && setOpen(o => !o)}
          className="w-14 h-14 rounded-full bg-mahogany shadow-2xl flex items-center justify-center hover:bg-gold transition-colors duration-300 border-2 border-gold/40 cursor-pointer"
          aria-label="Open chat"
          title="Message Jennifer"
        >
          <svg className="w-6 h-6 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </button>

        {/* Popup — centered on screen regardless of button position */}
        {open && (
          <div
            className="fixed z-50 bg-cream shadow-2xl border border-parchment-dark animate-fade-in"
            style={{
              width: '340px',
              left: '50%',
              top:  '50%',
              transform: 'translate(-50%, -50%)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-mahogany">
              <div>
                <h3 className="font-cinzel font-bold text-gold text-sm tracking-wide">Message Jennifer</h3>
                <p className="font-raleway text-xs text-cream/50 mt-0.5">Questions, requests, feedback</p>
              </div>
              <button onClick={() => { setOpen(false); reset() }} className="text-cream/50 hover:text-cream transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {status === 'success' ? (
                <div className="text-center py-6 space-y-3">
                  <div className="text-4xl">✉️</div>
                  <p className="font-cinzel text-base font-bold text-mahogany">Message Received!</p>
                  <p className="font-lora text-sm italic text-mahogany/60">
                    Jennifer will be in touch soon.
                  </p>
                  <button onClick={reset} className="btn-outline text-xs px-5 py-2">Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <input value={form.name} onChange={e => f('name', e.target.value)}
                      className={`input-field text-sm ${errors.name ? 'border-red-400' : ''}`}
                      placeholder="Your name *"/>
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                      className={`input-field text-sm ${errors.email ? 'border-red-400' : ''}`}
                      placeholder="Your email *"/>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <textarea value={form.message} onChange={e => f('message', e.target.value)} rows={4}
                      className={`input-field text-sm resize-none ${errors.message ? 'border-red-400' : ''}`}
                      placeholder="Your message *"/>
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>
                  {status === 'error' && (
                    <p className="font-raleway text-xs text-red-500">Something went wrong. Try again.</p>
                  )}
                  <button type="submit" disabled={status === 'loading'}
                    className="btn-gold w-full flex items-center justify-center gap-2 text-sm">
                    {status === 'loading'
                      ? <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"/>Sending...</>
                      : 'Send Message'}
                  </button>
                  <p className="font-raleway text-xs text-mahogany/30 text-center">
                    Drag the button to move it out of the way
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
