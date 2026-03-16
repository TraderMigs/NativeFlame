import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminSubscribers() {
  const navigate  = useNavigate()
  const [subs,    setSubs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/admin/login'); return }
      load()
    }
    check()
  }, [navigate])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('email_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false })
    setSubs(data || [])
    setLoading(false)
  }

  async function handleDelete(id) {
    await supabase.from('email_subscribers').delete().eq('id', id)
    setDeleting(null)
    await load()
  }

  function exportCSV() {
    const rows = [
      ['Email', 'Discount Code', 'Subscribed At'],
      ...filtered.map(s => [
        s.email,
        s.discount_code || 'WELCOME15',
        new Date(s.subscribed_at).toLocaleString()
      ])
    ]
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `native-flame-subscribers-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = subs.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-parchment">

      {/* Header */}
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Email Subscribers</h1>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="btn-gold text-xs px-5 py-2 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          ↓ Export CSV
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">

        {/* Stats + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-4">
            <div className="bg-white border border-parchment-dark px-6 py-4">
              <p className="font-cinzel text-2xl font-bold text-mahogany">{subs.length}</p>
              <p className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider mt-1">Total Subscribers</p>
            </div>
            <div className="bg-white border border-parchment-dark px-6 py-4">
              <p className="font-cinzel text-2xl font-bold text-gold">
                {subs.filter(s => {
                  const d = new Date(s.subscribed_at)
                  const now = new Date()
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                }).length}
              </p>
              <p className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider mt-1">This Month</p>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-parchment-dark px-4 py-2 font-lora text-sm text-mahogany focus:outline-none focus:border-gold transition-colors w-full sm:w-64 bg-white"
          />
        </div>

        {/* Delete confirm modal */}
        {deleting && (
          <div className="fixed inset-0 bg-mahogany/60 z-50 flex items-center justify-center px-4">
            <div className="bg-cream p-8 max-w-sm w-full text-center space-y-4">
              <h3 className="font-cinzel font-bold text-xl text-mahogany">Remove Subscriber?</h3>
              <p className="font-lora text-sm text-mahogany/60 italic break-all">{deleting.email}</p>
              <p className="font-raleway text-xs text-mahogany/40">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleting.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-cream font-raleway text-xs uppercase tracking-wider py-3 transition-colors">
                  Remove
                </button>
                <button onClick={() => setDeleting(null)} className="btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : subs.length === 0 ? (
          <div className="bg-white border border-parchment-dark p-16 text-center">
            <div className="text-5xl mb-4">📬</div>
            <h3 className="font-cinzel text-lg text-mahogany mb-2">No subscribers yet</h3>
            <p className="font-lora text-sm italic text-mahogany/40">They'll show up here once people sign up on the site.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-parchment-dark p-10 text-center">
            <p className="font-lora italic text-mahogany/40">No results for "{search}"</p>
          </div>
        ) : (
          <div className="bg-white border border-parchment-dark overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-parchment border-b border-parchment-dark">
                <tr>
                  {['Email', 'Discount Code', 'Subscribed', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-raleway text-xs uppercase tracking-wider text-mahogany/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-parchment/40 transition-colors">
                    <td className="px-5 py-4 font-lora text-sm text-mahogany">{sub.email}</td>
                    <td className="px-5 py-4">
                      <span className="font-cinzel text-xs font-bold text-gold tracking-widest border border-gold/30 px-2 py-1">
                        {sub.discount_code || 'WELCOME15'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-raleway text-xs text-mahogany/50">
                      {new Date(sub.subscribed_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setDeleting(sub)}
                        className="font-raleway text-xs text-mahogany/30 hover:text-red-500 transition-colors p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 bg-parchment/50 border-t border-parchment-dark">
              <p className="font-raleway text-xs text-mahogany/40">
                Showing {filtered.length} of {subs.length} subscribers
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
