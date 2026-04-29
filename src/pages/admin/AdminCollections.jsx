import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const db = supabase
const EMPTY = { name: '', sort_order: 0, is_active: true }

export default function AdminCollections() {
  const navigate     = useNavigate()
  const [collections, setCollections] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editId,      setEditId]      = useState(null)
  const [editOldName, setEditOldName] = useState('')
  const [form,        setForm]        = useState(EMPTY)
  const [saving,      setSaving]      = useState(false)
  const [deleteId,    setDeleteId]    = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await db.auth.getUser()
      if (!user) { navigate('/admin/login'); return }
      load()
    }
    check()
  }, [navigate])

  async function load() {
    setLoading(true)
    const { data } = await db.from('collections')
      .select('*').order('sort_order', { ascending: true })
    setCollections(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm({ ...EMPTY, sort_order: collections.length + 1 })
    setEditId(null); setEditOldName(''); setShowForm(true)
  }

  function openEdit(c) {
    setForm({ name: c.name, sort_order: c.sort_order, is_active: c.is_active })
    setEditId(c.id); setEditOldName(c.name); setShowForm(true)
  }

  function f(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)

    if (editId) {
      // Update collection name
      await db.from('collections').update({
        name:       form.name.trim(),
        sort_order: parseInt(form.sort_order) || 0,
        is_active:  form.is_active,
      }).eq('id', editId)

      // If name changed — update all products that had the old name
      if (form.name.trim() !== editOldName) {
        await db.from('products')
          .update({ collection: form.name.trim() })
          .eq('collection', editOldName)
      }
    } else {
      await db.from('collections').insert({
        name:       form.name.trim(),
        sort_order: parseInt(form.sort_order) || 0,
        is_active:  form.is_active,
      })
    }

    await load(); setShowForm(false); setSaving(false)
  }

  async function handleDelete(id) {
    await db.from('collections').delete().eq('id', id)
    setDeleteId(null); await load()
  }

  async function toggleActive(c) {
    await db.from('collections').update({ is_active: !c.is_active }).eq('id', c.id)
    await load()
  }

  async function moveUp(c, idx) {
    if (idx === 0) return
    const prev = collections[idx - 1]
    await Promise.all([
      db.from('collections').update({ sort_order: prev.sort_order }).eq('id', c.id),
      db.from('collections').update({ sort_order: c.sort_order }).eq('id', prev.id),
    ])
    await load()
  }

  async function moveDown(c, idx) {
    if (idx === collections.length - 1) return
    const next = collections[idx + 1]
    await Promise.all([
      db.from('collections').update({ sort_order: next.sort_order }).eq('id', c.id),
      db.from('collections').update({ sort_order: c.sort_order }).eq('id', next.id),
    ])
    await load()
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">← Dashboard</Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Collections</h1>
        </div>
        <button onClick={openNew} className="btn-gold text-xs px-5 py-2">+ New Collection</button>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
        <p className="font-lora text-sm italic text-mahogany/50 mb-8">
          These are the collection groups that appear on your Shop page filters and in your product editor.
          Renaming a collection automatically updates all products assigned to it.
        </p>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-mahogany/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
            <div className="bg-cream w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 bg-mahogany border-b border-cream/10">
                <h2 className="font-cinzel font-bold text-gold">{editId ? 'Edit Collection' : 'New Collection'}</h2>
                <button onClick={() => setShowForm(false)} className="text-cream/50 hover:text-cream">✕</button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">

                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Collection Name *</label>
                  <input value={form.name} onChange={e => f('name', e.target.value)}
                    className="input-field" placeholder="e.g. Ember Reserve" required />
                  {editId && editOldName !== form.name && (
                    <p className="font-raleway text-xs text-amber-600 mt-1">
                      ⚠️ Renaming will update all products currently in "{editOldName}"
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Display Order</label>
                  <input type="number" min="0" value={form.sort_order}
                    onChange={e => f('sort_order', e.target.value)}
                    className="input-field w-24" />
                  <p className="font-raleway text-xs text-mahogany/30 mt-1">Lower number = appears first</p>
                </div>

                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => f('is_active', !form.is_active)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_active ? 'bg-teal' : 'bg-mahogany/20'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <span className="font-raleway text-xs text-mahogany/60 uppercase tracking-wider">
                    {form.is_active ? 'Visible on shop' : 'Hidden from shop'}
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-gold flex-1 flex items-center justify-center gap-2">
                    {saving ? <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />Saving...</> : editId ? 'Save Changes' : 'Create Collection'}
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
              <h3 className="font-cinzel font-bold text-xl text-mahogany">Delete Collection?</h3>
              <p className="font-lora text-sm italic text-mahogany/60">
                Products in this collection will not be deleted — they will just no longer be grouped under it.
              </p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteId)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-cream font-raleway text-xs uppercase tracking-wider py-3 transition-colors">Delete</button>
                <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : collections.length === 0 ? (
          <div className="bg-white border border-parchment-dark p-16 text-center">
            <div className="text-5xl mb-4">🗂️</div>
            <h3 className="font-cinzel text-lg text-mahogany mb-2">No collections yet</h3>
            <button onClick={openNew} className="btn-gold mt-4">Create First Collection</button>
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((c, idx) => (
              <div key={c.id} className={`bg-white border overflow-hidden ${c.is_active ? 'border-parchment-dark' : 'border-parchment-dark opacity-50'}`}>
                <div className="flex items-center gap-4 p-4">
                  {/* Reorder */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => moveUp(c, idx)} disabled={idx === 0}
                      className="text-mahogany/30 hover:text-gold disabled:opacity-20 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button onClick={() => moveDown(c, idx)} disabled={idx === collections.length - 1}
                      className="text-mahogany/30 hover:text-gold disabled:opacity-20 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-cinzel font-semibold text-mahogany">{c.name}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(c)}
                      className={`font-raleway text-xs font-semibold uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                        c.is_active ? 'bg-teal/10 text-teal-dark border-teal/20' : 'bg-mahogany/10 text-mahogany/40 border-mahogany/20'
                      }`}>
                      {c.is_active ? 'Visible' : 'Hidden'}
                    </button>
                    <button onClick={() => openEdit(c)}
                      className="font-raleway text-xs text-mahogany/50 hover:text-gold transition-colors px-3 py-1.5 border border-parchment-dark hover:border-gold">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(c.id)}
                      className="text-mahogany/30 hover:text-red-500 transition-colors p-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
