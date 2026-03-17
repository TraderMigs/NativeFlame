import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const db = supabase

const EMPTY = {
  code: '', type: 'percent', amount: '', scope: 'site',
  product_id: '', min_order: '', max_uses: '', expires_at: '', is_active: true
}

export default function AdminDiscounts() {
  const navigate   = useNavigate()
  const [codes,    setCodes]    = useState([])
  const [products, setProducts] = useState([])
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
      await Promise.all([loadCodes(), loadProducts()])
    }
    check()
  }, [navigate])

  async function loadCodes() {
    setLoading(true)
    const { data } = await (db ).from('discount_codes').select('*').order('created_at', { ascending: false })
    setCodes(data || [])
    setLoading(false)
  }

  async function loadProducts() {
    const { data } = await (db ).from('products').select('id,name').eq('is_active', true).order('name')
    setProducts(data || [])
  }

  function openNew() {
    setForm(EMPTY); setEditId(null); setShowForm(true)
  }

  function openEdit(c) {
    setForm({
      code: c.code, type: c.type, amount: String(c.amount),
      scope: c.scope, product_id: c.product_id || '',
      min_order: c.min_order ? String(c.min_order) : '',
      max_uses: c.max_uses ? String(c.max_uses) : '',
      expires_at: c.expires_at ? c.expires_at.split('T')[0] : '',
      is_active: c.is_active
    })
    setEditId(c.id); setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.code || !form.amount) return
    setSaving(true)
    const payload = {
      code:       form.code.toUpperCase().trim(),
      type:       form.type,
      amount:     parseFloat(form.amount),
      scope:      form.scope,
      product_id: form.scope === 'product' ? form.product_id : null,
      min_order:  form.min_order  ? parseFloat(form.min_order)  : null,
      max_uses:   form.max_uses   ? parseInt(form.max_uses)     : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active:  form.is_active,
    }
    if (editId) {
      await (db ).from('discount_codes').update(payload).eq('id', editId)
    } else {
      await (db ).from('discount_codes').insert({ ...payload, uses: 0 })
    }
    await loadCodes()
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id) {
    await (db ).from('discount_codes').delete().eq('id', id)
    setDeleteId(null)
    await loadCodes()
  }

  async function toggleActive(c) {
    await (db ).from('discount_codes').update({ is_active: !c.is_active }).eq('id', c.id)
    await loadCodes()
  }

  function f(key, val) { setForm(p => ({ ...p, [key]: val }) ) }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">← Dashboard</Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Discount Codes</h1>
        </div>
        <button onClick={openNew} className="btn-gold text-xs px-5 py-2">+ New Code</button>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-mahogany/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
            <div className="bg-cream w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 bg-mahogany border-b border-cream/10">
                <h2 className="font-cinzel font-bold text-gold">{editId ? 'Edit Code' : 'New Discount Code'}</h2>
                <button onClick={() => setShowForm(false)} className="text-cream/50 hover:text-cream">✕</button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">

                {/* Code */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Code *</label>
                  <input value={form.code} onChange={e => f('code', e.target.value.toUpperCase())}
                    className="input-field uppercase" placeholder="e.g. SUMMER20" required />
                </div>

                {/* Type + Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Type</label>
                    <select value={form.type} onChange={e => f('type', e.target.value)} className="input-field">
                      <option value="percent">Percent Off (%)</option>
                      <option value="flat">Flat Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">
                      Amount * {form.type === 'percent' ? '(%)' : '($)'}
                    </label>
                    <input type="number" step="0.01" min="0" value={form.amount}
                      onChange={e => f('amount', e.target.value)}
                      className="input-field" placeholder={form.type === 'percent' ? '15' : '5.00'} required />
                  </div>
                </div>

                {/* Scope */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Applies To</label>
                  <select value={form.scope} onChange={e => f('scope', e.target.value)} className="input-field">
                    <option value="site">Entire Order</option>
                    <option value="product">Specific Product</option>
                  </select>
                </div>

                {/* Product picker */}
                {form.scope === 'product' && (
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Product *</label>
                    <select value={form.product_id} onChange={e => f('product_id', e.target.value)} className="input-field" required>
                      <option value="">Select a product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Min order + Max uses */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Min Order ($)</label>
                    <input type="number" step="0.01" min="0" value={form.min_order}
                      onChange={e => f('min_order', e.target.value)}
                      className="input-field" placeholder="0 = no minimum" />
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Max Uses</label>
                    <input type="number" min="0" value={form.max_uses}
                      onChange={e => f('max_uses', e.target.value)}
                      className="input-field" placeholder="Leave blank = unlimited" />
                  </div>
                </div>

                {/* Expiry */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Expiry Date</label>
                  <input type="date" value={form.expires_at} onChange={e => f('expires_at', e.target.value)} className="input-field" />
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
                    {saving ? <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"/>Saving...</> : editId ? 'Save Changes' : 'Create Code'}
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
              <h3 className="font-cinzel font-bold text-xl text-mahogany">Delete Code?</h3>
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
        ) : codes.length === 0 ? (
          <div className="bg-white border border-parchment-dark p-16 text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <h3 className="font-cinzel text-lg text-mahogany mb-2">No discount codes yet</h3>
            <button onClick={openNew} className="btn-gold mt-4">Create First Code</button>
          </div>
        ) : (
          <div className="bg-white border border-parchment-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-parchment border-b border-parchment-dark">
                  <tr>
                    {['Code','Discount','Applies To','Uses','Expires','Status',''].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-raleway text-xs uppercase tracking-wider text-mahogany/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-parchment">
                  {codes.map(c => {
                    const expired = c.expires_at && new Date(c.expires_at) < new Date()
                    const maxed   = c.max_uses && c.uses >= c.max_uses
                    const product = products.find(p => p.id === c.product_id)
                    return (
                      <tr key={c.id} className="hover:bg-parchment/40 transition-colors">
                        <td className="px-4 py-3 font-cinzel text-sm font-bold text-gold tracking-widest">{c.code}</td>
                        <td className="px-4 py-3 font-lora text-sm text-mahogany">
                          {c.type === 'percent' ? `${c.amount}% off` : `$${Number(c.amount).toFixed(2)} off`}
                          {c.min_order ? <span className="text-xs text-mahogany/40 block">min ${c.min_order}</span> : null}
                        </td>
                        <td className="px-4 py-3 font-raleway text-xs text-mahogany/70">
                          {c.scope === 'product' && product ? product.name : 'Entire Order'}
                        </td>
                        <td className="px-4 py-3 font-raleway text-xs text-mahogany/60">
                          {c.uses || 0}{c.max_uses ? ` / ${c.max_uses}` : ''}
                        </td>
                        <td className="px-4 py-3 font-raleway text-xs text-mahogany/60">
                          {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {expired || maxed ? (
                            <span className="font-raleway text-xs font-semibold uppercase tracking-wider px-2 py-1 bg-red-50 text-red-500 border border-red-200">
                              {expired ? 'Expired' : 'Maxed'}
                            </span>
                          ) : (
                            <button onClick={() => toggleActive(c)}
                              className={`font-raleway text-xs font-semibold uppercase tracking-wider px-2 py-1 border transition-colors ${
                                c.is_active ? 'bg-teal/10 text-teal-dark border-teal/20' : 'bg-mahogany/10 text-mahogany/40 border-mahogany/20'
                              }`}>
                              {c.is_active ? 'Active' : 'Inactive'}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openEdit(c)} className="font-raleway text-xs text-mahogany/50 hover:text-gold transition-colors px-2 py-1 border border-parchment-dark hover:border-gold">Edit</button>
                            <button onClick={() => setDeleteId(c.id)} className="text-mahogany/30 hover:text-red-500 transition-colors p-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
