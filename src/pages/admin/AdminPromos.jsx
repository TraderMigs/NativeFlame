import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const db = supabase

const EMPTY = {
  headline: '', body: '', emoji: '',
  display_type: 'banner',
  bg_color: '#C8922A', text_color: '#1C0A00',
  cta_label: '', cta_url: '',
  starts_at: '', ends_at: '',
  is_active: true,
}

const PRESETS = [
  { label: 'Gold on Dark',  bg: '#C8922A', text: '#1C0A00' },
  { label: 'Dark on Cream', bg: '#1C0A00', text: '#FFF8EE' },
  { label: 'Cream on Dark', bg: '#F5EDD9', text: '#1C0A00' },
  { label: 'Teal on Dark',  bg: '#4AADAA', text: '#1C0A00' },
  { label: 'Red Alert',     bg: '#DC2626', text: '#FFFFFF' },
]

export default function AdminPromos() {
  const navigate = useNavigate()
  const [promos,   setPromos]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId,   setEditId]   = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await (db ).auth.getUser()
      if (!user) { navigate('/admin/login'); return }
      load()
    }
    check()
  }, [navigate])

  async function load() {
    setLoading(true)
    const { data } = await (db ).from('promos').select('*').order('created_at', { ascending: false })
    setPromos(data || [])
    setLoading(false)
  }

  function openNew()  { setForm(EMPTY); setEditId(null); setShowForm(true) }
  function openEdit(p) {
    setForm({
      headline:     p.headline,
      body:         p.body         || '',
      emoji:        p.emoji        || '',
      display_type: p.display_type || 'banner',
      bg_color:     p.bg_color     || '#C8922A',
      text_color:   p.text_color   || '#1C0A00',
      cta_label:    p.cta_label    || '',
      cta_url:      p.cta_url      || '',
      starts_at:    p.starts_at ? p.starts_at.split('T')[0] : '',
      ends_at:      p.ends_at   ? p.ends_at.split('T')[0]   : '',
      is_active:    p.is_active,
    })
    setEditId(p.id); setShowForm(true)
  }

  function f(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.headline.trim()) return
    setSaving(true)
    const payload = {
      headline:     form.headline.trim(),
      body:         form.body.trim()     || null,
      emoji:        form.emoji.trim()    || null,
      display_type: form.display_type,
      bg_color:     form.bg_color,
      text_color:   form.text_color,
      cta_label:    form.cta_label.trim() || null,
      cta_url:      form.cta_url.trim()   || null,
      starts_at:    form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      ends_at:      form.ends_at   ? new Date(form.ends_at).toISOString()   : null,
      is_active:    form.is_active,
    }
    if (editId) {
      await (db ).from('promos').update(payload).eq('id', editId)
    } else {
      await (db ).from('promos').insert(payload)
    }
    await load(); setShowForm(false); setSaving(false)
  }

  async function toggleActive(p) {
    await (db ).from('promos').update({ is_active: !p.is_active }).eq('id', p.id)
    await load()
  }

  async function handleDelete(id) {
    await (db ).from('promos').delete().eq('id', id)
    setDeleteId(null); await load()
  }

  function isLive(p) {
    const now = new Date()
    const start = new Date(p.starts_at)
    const end   = p.ends_at ? new Date(p.ends_at) : null
    return p.is_active && start <= now && (!end || end >= now)
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">← Dashboard</Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Promotions</h1>
        </div>
        <button onClick={openNew} className="btn-gold text-xs px-5 py-2">+ New Promo</button>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-mahogany/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
            <div className="bg-cream w-full max-w-xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 bg-mahogany border-b border-cream/10">
                <h2 className="font-cinzel font-bold text-gold">{editId ? 'Edit Promo' : 'New Promotion'}</h2>
                <button onClick={() => setShowForm(false)} className="text-cream/50 hover:text-cream">✕</button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-5">

                {/* Live Preview */}
                <div>
                  <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-2">Preview</p>
                  <div className="flex items-center justify-between px-4 py-3 rounded"
                    style={{ backgroundColor: form.bg_color }}>
                    <span className="font-cinzel text-sm font-semibold" style={{ color: form.text_color }}>
                      {form.emoji && <span className="mr-2">{form.emoji}</span>}
                      {form.headline || 'Your headline here'}
                    </span>
                    {form.cta_label && (
                      <span className="font-raleway text-xs font-bold underline ml-3" style={{ color: form.text_color }}>
                        {form.cta_label} →
                      </span>
                    )}
                  </div>
                </div>

                {/* Headline + Emoji */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3">
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Headline *</label>
                    <input value={form.headline} onChange={e => f('headline', e.target.value)}
                      className="input-field" placeholder="Free shipping this weekend!" required/>
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Emoji</label>
                    <input value={form.emoji} onChange={e => f('emoji', e.target.value)}
                      className="input-field text-center text-xl" placeholder="🕯️" maxLength={2}/>
                  </div>
                </div>

                {/* Body */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Subtext (optional)</label>
                  <input value={form.body} onChange={e => f('body', e.target.value)}
                    className="input-field" placeholder="Use code FREESHIP at checkout"/>
                </div>

                {/* Display type */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-2">Display Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { val: 'banner', label: 'Top Banner', desc: 'Slim bar at top of every page' },
                      { val: 'modal',  label: 'Popup Modal', desc: 'Centered popup on site visit' },
                    ].map(({ val, label, desc }) => (
                      <button key={val} type="button" onClick={() => f('display_type', val)}
                        className={`p-3 border-2 text-left transition-all ${form.display_type === val ? 'border-gold bg-gold/5' : 'border-parchment-dark'}`}>
                        <p className="font-cinzel text-xs font-semibold text-mahogany">{label}</p>
                        <p className="font-raleway text-xs text-mahogany/40 mt-0.5">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-2">Colors</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESETS.map(({ label, bg, text }) => (
                      <button key={label} type="button"
                        onClick={() => { f('bg_color', bg); f('text_color', text) }}
                        className="font-raleway text-xs px-3 py-1.5 border border-parchment-dark hover:border-gold transition-colors"
                        style={{ backgroundColor: bg, color: text }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <label className="font-raleway text-xs text-mahogany/50">Background</label>
                      <input type="color" value={form.bg_color} onChange={e => f('bg_color', e.target.value)}
                        className="w-8 h-8 cursor-pointer border border-parchment-dark rounded"/>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="font-raleway text-xs text-mahogany/50">Text</label>
                      <input type="color" value={form.text_color} onChange={e => f('text_color', e.target.value)}
                        className="w-8 h-8 cursor-pointer border border-parchment-dark rounded"/>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Button Label</label>
                    <input value={form.cta_label} onChange={e => f('cta_label', e.target.value)}
                      className="input-field" placeholder="Shop Now"/>
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Button URL</label>
                    <input value={form.cta_url} onChange={e => f('cta_url', e.target.value)}
                      className="input-field" placeholder="/shop"/>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Start Date</label>
                    <input type="date" value={form.starts_at} onChange={e => f('starts_at', e.target.value)} className="input-field"/>
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">End Date</label>
                    <input type="date" value={form.ends_at} onChange={e => f('ends_at', e.target.value)} className="input-field"/>
                    <p className="font-raleway text-xs text-mahogany/30 mt-1">Leave blank = runs indefinitely</p>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => f('is_active', !form.is_active)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_active ? 'bg-teal' : 'bg-mahogany/20'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`}/>
                  </button>
                  <span className="font-raleway text-xs text-mahogany/60 uppercase tracking-wider">
                    {form.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-gold flex-1 flex items-center justify-center gap-2">
                    {saving ? <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"/>Saving...</> : editId ? 'Save Changes' : 'Create Promo'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteId && (
          <div className="fixed inset-0 bg-mahogany/60 z-50 flex items-center justify-center px-4">
            <div className="bg-cream p-8 max-w-sm w-full text-center space-y-4">
              <h3 className="font-cinzel font-bold text-xl text-mahogany">Delete Promo?</h3>
              <p className="font-lora text-sm italic text-mahogany/60">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 hover:bg-red-700 text-cream font-raleway text-xs uppercase tracking-wider py-3 transition-colors">Delete</button>
                <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : promos.length === 0 ? (
          <div className="bg-white border border-parchment-dark p-16 text-center">
            <div className="text-5xl mb-4">📣</div>
            <h3 className="font-cinzel text-lg text-mahogany mb-2">No promotions yet</h3>
            <p className="font-lora italic text-mahogany/40 text-sm mb-6">Create a banner or popup to promote sales, new candles, or special events.</p>
            <button onClick={openNew} className="btn-gold">Create First Promo</button>
          </div>
        ) : (
          <div className="space-y-4">
            {promos.map(p => (
              <div key={p.id} className={`bg-white border overflow-hidden ${isLive(p) ? 'border-gold/40' : 'border-parchment-dark'}`}>
                {/* Preview strip */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ backgroundColor: p.bg_color || '#C8922A' }}>
                  <span className="font-cinzel text-sm font-semibold truncate" style={{ color: p.text_color || '#1C0A00' }}>
                    {p.emoji && <span className="mr-2">{p.emoji}</span>}{p.headline}
                  </span>
                  <span className="font-raleway text-xs ml-4 shrink-0 px-2 py-0.5 bg-white/20"
                    style={{ color: p.text_color || '#1C0A00' }}>
                    {p.display_type === 'modal' ? 'Popup' : 'Banner'}
                  </span>
                </div>
                {/* Controls */}
                <div className="flex items-center justify-between px-4 py-3 gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    {isLive(p) ? (
                      <span className="font-raleway text-xs font-semibold text-teal-dark uppercase tracking-wider">Live Now</span>
                    ) : (
                      <span className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider">
                        {!p.is_active ? 'Inactive' : p.ends_at && new Date(p.ends_at) < new Date() ? 'Expired' : 'Scheduled'}
                      </span>
                    )}
                    <span className="font-raleway text-xs text-mahogany/40">
                      {new Date(p.starts_at).toLocaleDateString()}
                      {p.ends_at ? ` → ${new Date(p.ends_at).toLocaleDateString()}` : ' → No end'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(p)}
                      className={`font-raleway text-xs font-semibold uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                        p.is_active ? 'bg-teal/10 text-teal-dark border-teal/20' : 'bg-mahogany/10 text-mahogany/40 border-mahogany/20'
                      }`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => openEdit(p)}
                      className="font-raleway text-xs text-mahogany/50 hover:text-gold transition-colors px-3 py-1.5 border border-parchment-dark hover:border-gold">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="text-mahogany/30 hover:text-red-500 transition-colors p-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
