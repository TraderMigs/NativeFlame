import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const db = supabase
const EMPTY = { question: '', answer: '', sort_order: 0, is_active: true }

export default function AdminFAQ() {
  const navigate = useNavigate()
  const [faqs,     setFaqs]     = useState([])
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
    const { data } = await (db ).from('faqs').select('*').order('sort_order', { ascending: true })
    setFaqs(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm({ ...EMPTY, sort_order: faqs.length + 1 })
    setEditId(null); setShowForm(true)
  }

  function openEdit(faq) {
    setForm({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order, is_active: faq.is_active })
    setEditId(faq.id); setShowForm(true)
  }

  function f(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.question.trim() || !form.answer.trim()) return
    setSaving(true)
    const payload = {
      question:   form.question.trim(),
      answer:     form.answer.trim(),
      sort_order: parseInt(form.sort_order) || 0,
      is_active:  form.is_active,
    }
    if (editId) {
      await (db ).from('faqs').update(payload).eq('id', editId)
    } else {
      await (db ).from('faqs').insert(payload)
    }
    await load(); setShowForm(false); setSaving(false)
  }

  async function handleDelete(id) {
    await (db ).from('faqs').delete().eq('id', id)
    setDeleteId(null); await load()
  }

  async function toggleActive(faq) {
    await (db ).from('faqs').update({ is_active: !faq.is_active }).eq('id', faq.id)
    await load()
  }

  async function moveUp(faq, idx) {
    if (idx === 0) return
    const prev = faqs[idx - 1]
    await Promise.all([
      (db ).from('faqs').update({ sort_order: prev.sort_order }).eq('id', faq.id),
      (db ).from('faqs').update({ sort_order: faq.sort_order  }).eq('id', prev.id),
    ])
    await load()
  }

  async function moveDown(faq, idx) {
    if (idx === faqs.length - 1) return
    const next = faqs[idx + 1]
    await Promise.all([
      (db ).from('faqs').update({ sort_order: next.sort_order }).eq('id', faq.id),
      (db ).from('faqs').update({ sort_order: faq.sort_order  }).eq('id', next.id),
    ])
    await load()
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">← Dashboard</Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">FAQ Manager</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/faq" target="_blank" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">
            View Live →
          </Link>
          <button onClick={openNew} className="btn-gold text-xs px-5 py-2">+ Add Question</button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-mahogany/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
            <div className="bg-cream w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 bg-mahogany border-b border-cream/10">
                <h2 className="font-cinzel font-bold text-gold">{editId ? 'Edit Question' : 'New Question'}</h2>
                <button onClick={() => setShowForm(false)} className="text-cream/50 hover:text-cream">✕</button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Question *</label>
                  <input value={form.question} onChange={e => f('question', e.target.value)}
                    className="input-field" placeholder="How long do your candles burn?" required/>
                </div>
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Answer *</label>
                  <textarea value={form.answer} onChange={e => f('answer', e.target.value)} rows={5}
                    className="input-field resize-y" placeholder="Our candles burn for approximately 45–50 hours..." required/>
                </div>
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Display Order</label>
                  <input type="number" min="0" value={form.sort_order} onChange={e => f('sort_order', e.target.value)}
                    className="input-field w-24" placeholder="1"/>
                  <p className="font-raleway text-xs text-mahogany/30 mt-1">Lower number = shows first</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => f('is_active', !form.is_active)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_active ? 'bg-teal' : 'bg-mahogany/20'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`}/>
                  </button>
                  <span className="font-raleway text-xs text-mahogany/60 uppercase tracking-wider">
                    {form.is_active ? 'Visible on site' : 'Hidden from site'}
                  </span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-gold flex-1 flex items-center justify-center gap-2">
                    {saving ? <><div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin"/>Saving...</> : editId ? 'Save Changes' : 'Add Question'}
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
              <h3 className="font-cinzel font-bold text-xl text-mahogany">Delete Question?</h3>
              <p className="font-lora text-sm italic text-mahogany/60">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 hover:bg-red-700 text-cream font-raleway text-xs uppercase tracking-wider py-3 transition-colors">Delete</button>
                <button onClick={() => setDeleteId(null)} className="btn-outline flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : faqs.length === 0 ? (
          <div className="bg-white border border-parchment-dark p-16 text-center">
            <div className="text-5xl mb-4">❓</div>
            <h3 className="font-cinzel text-lg text-mahogany mb-2">No FAQs yet</h3>
            <p className="font-lora italic text-mahogany/40 text-sm mb-6">Add questions customers frequently ask.</p>
            <button onClick={openNew} className="btn-gold">Add First Question</button>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={faq.id} className={`bg-white border overflow-hidden ${faq.is_active ? 'border-parchment-dark' : 'border-parchment-dark opacity-50'}`}>
                <div className="flex items-start gap-4 p-4">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                    <button onClick={() => moveUp(faq, idx)} disabled={idx === 0}
                      className="text-mahogany/30 hover:text-gold disabled:opacity-20 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/>
                      </svg>
                    </button>
                    <button onClick={() => moveDown(faq, idx)} disabled={idx === faqs.length - 1}
                      className="text-mahogany/30 hover:text-gold disabled:opacity-20 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-cinzel text-sm font-semibold text-mahogany">{faq.question}</p>
                    <p className="font-lora text-xs text-mahogany/50 mt-1 line-clamp-2">{faq.answer}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(faq)}
                      className={`font-raleway text-xs font-semibold uppercase tracking-wider px-2 py-1 border transition-colors ${
                        faq.is_active ? 'bg-teal/10 text-teal-dark border-teal/20' : 'bg-mahogany/10 text-mahogany/40 border-mahogany/20'
                      }`}>
                      {faq.is_active ? 'Live' : 'Hidden'}
                    </button>
                    <button onClick={() => openEdit(faq)}
                      className="font-raleway text-xs text-mahogany/50 hover:text-gold transition-colors px-2 py-1 border border-parchment-dark hover:border-gold">
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(faq.id)} className="text-mahogany/30 hover:text-red-500 transition-colors p-1">
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
