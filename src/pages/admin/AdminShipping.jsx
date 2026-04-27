import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSiteSettings, DEFAULT_SHIPPING } from '../../context/SiteSettingsContext'

export default function AdminShipping() {
  const { shipping, saveShipping } = useSiteSettings()
  const [local,   setLocal]   = useState({ ...shipping })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  function f(k, v) { setLocal(p => ({ ...p, [k]: v })) }

  async function handleSave() {
    setSaving(true)
    await saveShipping(local)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // Live preview of what checkout will show
  const previewSubtotals = [5, 15, 25, 50, 75]
  function previewShipping(sub) {
    const mode = local.shipping_mode
    if (mode === 'free') return 'FREE'
    if (mode === 'threshold') {
      const t = parseFloat(local.shipping_threshold || 50)
      return sub >= t ? 'FREE' : `$${parseFloat(local.shipping_flat_rate || 7.99).toFixed(2)}`
    }
    return `$${parseFloat(local.shipping_flat_rate || 7.99).toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Shipping Settings</h1>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="btn-gold text-xs px-6 py-2 flex items-center gap-2">
          {saving
            ? <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"/>Saving...</>
            : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 space-y-8">

        {/* Shipping Mode */}
        <div className="bg-white border border-parchment-dark p-6 space-y-5">
          <div>
            <h2 className="font-cinzel text-base font-bold text-mahogany">Shipping Mode</h2>
            <p className="font-lora text-sm italic text-mahogany/50 mt-1">Choose how shipping is calculated at checkout.</p>
          </div>

          <div className="space-y-3">
            {/* Always Free */}
            <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-all ${local.shipping_mode === 'free' ? 'border-gold bg-gold/5' : 'border-parchment-dark hover:border-mahogany/30'}`}>
              <input type="radio" name="mode" value="free"
                checked={local.shipping_mode === 'free'}
                onChange={() => f('shipping_mode', 'free')}
                className="mt-0.5 accent-gold"/>
              <div>
                <p className="font-cinzel text-sm font-semibold text-mahogany">🎁 Always Free Shipping</p>
                <p className="font-raleway text-xs text-mahogany/50 mt-1">Every order ships free, no minimum required.</p>
              </div>
            </label>

            {/* Free over threshold */}
            <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-all ${local.shipping_mode === 'threshold' ? 'border-gold bg-gold/5' : 'border-parchment-dark hover:border-mahogany/30'}`}>
              <input type="radio" name="mode" value="threshold"
                checked={local.shipping_mode === 'threshold'}
                onChange={() => f('shipping_mode', 'threshold')}
                className="mt-0.5 accent-gold"/>
              <div className="flex-1">
                <p className="font-cinzel text-sm font-semibold text-mahogany">🚚 Free Shipping Over a Minimum</p>
                <p className="font-raleway text-xs text-mahogany/50 mt-1">Free if the order is over a certain amount, otherwise charge a flat rate.</p>
                {local.shipping_mode === 'threshold' && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Free Shipping Over ($)</label>
                      <input type="number" step="0.01" min="0"
                        value={local.shipping_threshold}
                        onChange={e => f('shipping_threshold', e.target.value)}
                        className="input-field" placeholder="50"/>
                    </div>
                    <div>
                      <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Shipping Rate Below That ($)</label>
                      <input type="number" step="0.01" min="0"
                        value={local.shipping_flat_rate}
                        onChange={e => f('shipping_flat_rate', e.target.value)}
                        className="input-field" placeholder="7.99"/>
                    </div>
                  </div>
                )}
              </div>
            </label>

            {/* Always flat rate */}
            <label className={`flex items-start gap-4 p-4 border-2 cursor-pointer transition-all ${local.shipping_mode === 'flat' ? 'border-gold bg-gold/5' : 'border-parchment-dark hover:border-mahogany/30'}`}>
              <input type="radio" name="mode" value="flat"
                checked={local.shipping_mode === 'flat'}
                onChange={() => f('shipping_mode', 'flat')}
                className="mt-0.5 accent-gold"/>
              <div className="flex-1">
                <p className="font-cinzel text-sm font-semibold text-mahogany">📦 Flat Rate Always</p>
                <p className="font-raleway text-xs text-mahogany/50 mt-1">Every order is charged the same shipping amount.</p>
                {local.shipping_mode === 'flat' && (
                  <div className="mt-4 max-w-48">
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Flat Rate ($)</label>
                    <input type="number" step="0.01" min="0"
                      value={local.shipping_flat_rate}
                      onChange={e => f('shipping_flat_rate', e.target.value)}
                      className="input-field" placeholder="7.99"/>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-white border border-parchment-dark p-6 space-y-4">
          <div>
            <h2 className="font-cinzel text-base font-bold text-mahogany">Live Preview</h2>
            <p className="font-lora text-sm italic text-mahogany/50 mt-1">This is what customers will see at checkout with your current settings.</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-parchment">
              <tr>
                <th className="text-left px-4 py-2 font-raleway text-xs uppercase tracking-wider text-mahogany/50">Order Subtotal</th>
                <th className="text-left px-4 py-2 font-raleway text-xs uppercase tracking-wider text-mahogany/50">Shipping Charged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment">
              {previewSubtotals.map(sub => (
                <tr key={sub} className="hover:bg-parchment/40 transition-colors">
                  <td className="px-4 py-3 font-cinzel text-sm text-mahogany">${sub.toFixed(2)}</td>
                  <td className={`px-4 py-3 font-cinzel text-sm font-bold ${previewShipping(sub) === 'FREE' ? 'text-teal-dark' : 'text-mahogany'}`}>
                    {previewShipping(sub)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Reset */}
        <button
          onClick={() => setLocal({ ...DEFAULT_SHIPPING })}
          className="font-raleway text-xs text-mahogany/30 hover:text-red-500 transition-colors underline underline-offset-2">
          Reset to default ($7.99 flat rate)
        </button>

      </div>
    </div>
  )
}
