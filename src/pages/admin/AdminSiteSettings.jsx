import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings, DEFAULT_COLORS, DEFAULT_CONTENT } from '../../context/SiteSettingsContext'

/* ── Color swatches: lighter → darker for each section's base hue ── */
const SECTION_PALETTES = {
  hero_bg: {
    label: 'Hero Background',
    swatches: ['#3D1F0A','#2A1200','#1C0A00','#120600','#080200','#000000','#F5EDD9','#FFF8EE','#FFFAF4'],
  },
  values_strip_bg: {
    label: 'Values Strip',
    swatches: ['#3D1F0A','#2A1200','#1C0A00','#120600','#F5EDD9','#E8D9BE','#DEC9A0','#C8922A','#B07820'],
  },
  products_bg: {
    label: 'Products Section',
    swatches: ['#FFFAF4','#FFF8EE','#F5EDD9','#E8D9BE','#DEC9A0','#D4B880','#C8A860','#2A1200','#1C0A00'],
  },
  about_teaser_bg: {
    label: 'About Teaser',
    swatches: ['#FFFAF4','#FFF8EE','#F5EDD9','#E8D9BE','#DEC9A0','#D4B880','#C8A860','#2A1200','#1C0A00'],
  },
  collections_light_bg: {
    label: 'Collections — Left (Light)',
    swatches: ['#FFFAF4','#FFF8EE','#F5EDD9','#E8D9BE','#DEC9A0','#D4B880','#C8A860','#B07820','#8B5A1A'],
  },
  collections_dark_bg: {
    label: 'Collections — Right (Dark)',
    swatches: ['#3D1F0A','#2A1200','#1C0A00','#120600','#080200','#000000','#4A2010','#5C2A14','#C8922A'],
  },
  email_signup_bg: {
    label: 'Email Signup',
    swatches: ['#FFFAF4','#FFF8EE','#F5EDD9','#E8D9BE','#DEC9A0','#D4B880','#2A1200','#1C0A00','#C8922A'],
  },
  testimonial_bg: {
    label: 'Testimonial',
    swatches: ['#3D1F0A','#2A1200','#1C0A00','#120600','#080200','#000000','#C8922A','#F5EDD9','#FFF8EE'],
  },
  footer_bg: {
    label: 'Footer',
    swatches: ['#3D1F0A','#2A1200','#1C0A00','#120600','#080200','#000000','#C8922A','#F5EDD9','#FFF8EE'],
  },
}

const CONTENT_FIELDS = [
  { key: 'hero_quote',        label: 'Hero Quote',               type: 'textarea' },
  { key: 'values_1_title',    label: 'Values Bar — Item 1 Title', type: 'text' },
  { key: 'values_1_sub',      label: 'Values Bar — Item 1 Sub',   type: 'text' },
  { key: 'values_2_title',    label: 'Values Bar — Item 2 Title', type: 'text' },
  { key: 'values_2_sub',      label: 'Values Bar — Item 2 Sub',   type: 'text' },
  { key: 'values_3_title',    label: 'Values Bar — Item 3 Title', type: 'text' },
  { key: 'values_3_sub',      label: 'Values Bar — Item 3 Sub',   type: 'text' },
  { key: 'featured_label',    label: 'Featured — Eyebrow Label',  type: 'text' },
  { key: 'featured_title',    label: 'Featured — Heading',        type: 'text' },
  { key: 'featured_sub',      label: 'Featured — Subheading',     type: 'text' },
  { key: 'about_label',       label: 'About Teaser — Eyebrow',    type: 'text' },
  { key: 'about_heading',     label: 'About Teaser — Heading',    type: 'text' },
  { key: 'about_body',        label: 'About Teaser — Body',       type: 'textarea' },
  { key: 'testimonial_quote', label: 'Testimonial — Quote',       type: 'textarea' },
  { key: 'testimonial_by',    label: 'Testimonial — Attribution', type: 'text' },
]

export default function AdminSiteSettings() {
  const { colors, content, saveColors, saveContent } = useSiteSettings()

  const [localColors,  setLocalColors]  = useState({ ...colors })
  const [localContent, setLocalContent] = useState({ ...content })
  const [undoColors,   setUndoColors]   = useState(null)
  const [undoContent,  setUndoContent]  = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [activeTab,    setActiveTab]    = useState('colors')

  function pickColor(key, value) {
    if (!undoColors) setUndoColors({ ...localColors })
    setLocalColors(prev => ({ ...prev, [key]: value }))
  }

  function undoColorChange() {
    if (undoColors) { setLocalColors(undoColors); setUndoColors(null) }
  }

  function resetColors() {
    setUndoColors({ ...localColors })
    setLocalColors({ ...DEFAULT_COLORS })
  }

  function handleContentChange(key, value) {
    if (!undoContent) setUndoContent({ ...localContent })
    setLocalContent(prev => ({ ...prev, [key]: value }))
  }

  function undoContentChange() {
    if (undoContent) { setLocalContent(undoContent); setUndoContent(null) }
  }

  async function handleSave() {
    setSaving(true)
    await saveColors(localColors)
    await saveContent(localContent)
    setUndoColors(null)
    setUndoContent(null)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-cream">

      {/* Header — matches all other admin pages */}
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Site Appearance</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Sub-header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="font-lora text-sm text-mahogany/50 italic">
              Change colors and text across the entire site. Changes apply live.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(undoColors || undoContent) && (
              <button
                onClick={() => { undoColorChange(); undoContentChange() }}
                className="btn-outline text-sm px-4 py-2 flex items-center gap-2">
                ↩ Undo
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              className="btn-gold flex items-center gap-2 text-sm px-6 py-2">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"/>Saving…</>
              ) : saved ? '✓ Saved!' : 'Save All Changes'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-parchment-dark mb-8">
          {[
            { id: 'colors',  label: '🎨 Section Colors' },
            { id: 'content', label: '✏️ Page Text' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-6 py-3 font-raleway text-xs font-semibold tracking-widest uppercase transition-colors border-b-2 -mb-px ${
                activeTab === id
                  ? 'border-gold text-gold'
                  : 'border-transparent text-mahogany/50 hover:text-mahogany'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── COLOR PALETTE TAB ── */}
        {activeTab === 'colors' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="font-lora text-sm italic text-mahogany/60">
                Click any swatch to preview that color on the live site. Hit "Save All Changes" to keep it permanently.
              </p>
              <button onClick={resetColors}
                className="font-raleway text-xs text-mahogany/40 hover:text-red-500 transition-colors underline underline-offset-2">
                Reset to defaults
              </button>
            </div>

            {Object.entries(SECTION_PALETTES).map(([key, { label, swatches }]) => (
              <div key={key} className="bg-white border border-parchment-dark p-5">
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <h3 className="font-cinzel font-semibold text-sm text-mahogany">{label}</h3>
                    <p className="font-raleway text-xs text-mahogany/40 mt-0.5">Current: {localColors[key]}</p>
                  </div>
                  {/* Current color preview */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded border-2 border-parchment-dark shadow-inner transition-all duration-300"
                      style={{ backgroundColor: localColors[key] }}/>
                    {/* Custom hex input */}
                    <input type="color" value={localColors[key]}
                      onChange={e => pickColor(key, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-parchment-dark"
                      title="Custom color picker"/>
                  </div>
                </div>

                {/* Swatches row */}
                <div className="flex flex-wrap gap-2">
                  {swatches.map(hex => (
                    <button key={hex} onClick={() => pickColor(key, hex)}
                      title={hex}
                      className={`w-9 h-9 rounded transition-all duration-150 hover:scale-110 ${
                        localColors[key] === hex
                          ? 'ring-2 ring-gold ring-offset-1 scale-110 shadow-lg'
                          : 'border border-parchment-dark hover:shadow-md'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CONTENT TEXT TAB ── */}
        {activeTab === 'content' && (
          <div className="space-y-5">
            <p className="font-lora text-sm italic text-mahogany/60 mb-6">
              Edit any text that appears on the public site. Changes save when you click "Save All Changes."
            </p>
            {CONTENT_FIELDS.map(({ key, label, type }) => (
              <div key={key} className="bg-white border border-parchment-dark p-4">
                <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-2">
                  {label}
                </label>
                {type === 'textarea' ? (
                  <textarea
                    value={localContent[key] || ''}
                    onChange={e => handleContentChange(key, e.target.value)}
                    rows={3}
                    className="w-full border border-parchment-dark px-3 py-2 font-lora text-sm text-mahogany focus:outline-none focus:border-gold transition-colors resize-y"
                  />
                ) : (
                  <input
                    type="text"
                    value={localContent[key] || ''}
                    onChange={e => handleContentChange(key, e.target.value)}
                    className="w-full border border-parchment-dark px-3 py-2 font-lora text-sm text-mahogany focus:outline-none focus:border-gold transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Floating save reminder */}
        {(undoColors || undoContent) && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-mahogany text-cream px-6 py-3 shadow-2xl flex items-center gap-4 font-raleway text-xs tracking-wider z-50">
            <span>You have unsaved changes</span>
            <button onClick={handleSave} disabled={saving} className="btn-gold text-xs px-4 py-1.5">
              {saving ? 'Saving…' : 'Save Now'}
            </button>
            <button onClick={() => { undoColorChange(); undoContentChange() }} className="text-cream/50 hover:text-cream underline">
              Undo
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
