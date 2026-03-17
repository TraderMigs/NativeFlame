import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const db = supabase

const STATUSES = ['unread','read','contacted','resolved']
const STATUS_COLORS = {
  unread:    'bg-red-50 text-red-600 border-red-200',
  read:      'bg-parchment text-mahogany/50 border-parchment-dark',
  contacted: 'bg-gold/10 text-gold border-gold/20',
  resolved:  'bg-teal/10 text-teal-dark border-teal/20',
}
const SOURCE_LABELS = {
  chat_widget:   'Chat Widget',
  contact_page:  'Contact Page',
}

export default function AdminMessages() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [expanded, setExpanded] = useState(null)

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
    try {
      const { data, error } = await (db ).from('contact_messages')
        .select('*').order('created_at', { ascending: false })
      if (error) throw error
      setMessages(data || [])
    } catch (_) {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    await (db ).from('contact_messages')
      .update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
  }

  const filtered = filter === 'all' ? messages : messages.filter(m => m.status === filter)
  const unreadCount = messages.filter(m => m.status === 'unread').length

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Messages</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-cream font-cinzel text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <p className="font-raleway text-xs text-cream/40">{messages.length} total</p>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`font-raleway text-xs font-semibold uppercase tracking-wider px-4 py-2 transition-all ${
                filter === s ? 'bg-mahogany text-cream' : 'border border-parchment-dark text-mahogany/50 hover:border-mahogany hover:text-mahogany'
              }`}>
              {s === 'all'
                ? `All (${messages.length})`
                : `${s} (${messages.filter(m => m.status === s).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-parchment-dark p-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="font-cinzel text-lg text-mahogany mb-2">No messages</h3>
            <p className="font-lora italic text-mahogany/40 text-sm">
              {filter === 'all' ? 'Messages from customers will appear here.' : `No ${filter} messages.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(msg => (
              <div key={msg.id}
                className={`bg-white border overflow-hidden ${msg.status === 'unread' ? 'border-gold/40' : 'border-parchment-dark'}`}>

                {/* Row */}
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-parchment/50 transition-colors"
                  onClick={() => {
                    setExpanded(expanded === msg.id ? null : msg.id)
                    if (msg.status === 'unread') updateStatus(msg.id, 'read')
                  }}>
                  {/* Unread dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${msg.status === 'unread' ? 'bg-red-500' : 'bg-transparent'}`}/>

                  <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                    <div>
                      <p className="font-cinzel text-xs text-mahogany/50 uppercase">From</p>
                      <p className="font-lora text-sm text-mahogany truncate font-semibold">{msg.name}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="font-cinzel text-xs text-mahogany/50 uppercase">Email</p>
                      <p className="font-raleway text-xs text-mahogany/70 truncate">{msg.email}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="font-cinzel text-xs text-mahogany/50 uppercase">Date</p>
                      <p className="font-raleway text-xs text-mahogany/60">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-raleway text-xs font-semibold uppercase tracking-wider px-2 py-1 border ${STATUS_COLORS[msg.status] || ''}`}>
                        {msg.status}
                      </span>
                      <span className="font-raleway text-xs text-mahogany/30">
                        {SOURCE_LABELS[msg.source] || msg.source}
                      </span>
                    </div>
                  </div>

                  <svg className={`w-4 h-4 text-mahogany/30 shrink-0 transition-transform duration-200 ${expanded === msg.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>

                {/* Expanded */}
                {expanded === msg.id && (
                  <div className="border-t border-parchment-dark p-5 bg-parchment/50 space-y-5">

                    {/* Customer info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-1">Name</p>
                        <p className="font-lora text-sm text-mahogany">{msg.name}</p>
                      </div>
                      <div>
                        <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-1">Email</p>
                        <a href={`mailto:${msg.email}`}
                          className="font-raleway text-xs text-gold hover:underline">{msg.email}</a>
                      </div>
                      {msg.phone && (
                        <div>
                          <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-1">Phone</p>
                          <a href={`tel:${msg.phone}`} className="font-raleway text-xs text-gold hover:underline">{msg.phone}</a>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div>
                      <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/40 mb-2">Message</p>
                      <div className="bg-white border border-parchment-dark p-4 font-lora text-sm text-mahogany/80 leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/40">Mark as:</p>
                      {STATUSES.map(s => (
                        <button key={s} onClick={() => updateStatus(msg.id, s)}
                          className={`font-raleway text-xs font-semibold uppercase tracking-wider px-3 py-1.5 border transition-colors ${
                            msg.status === s
                              ? STATUS_COLORS[s]
                              : 'border-parchment-dark text-mahogany/40 hover:border-mahogany hover:text-mahogany'
                          }`}>
                          {s}
                        </button>
                      ))}
                      <a href={`mailto:${msg.email}?subject=Re: Your message to Native Flame`}
                        className="ml-auto btn-gold text-xs px-4 py-1.5 flex items-center gap-1">
                        ✉️ Reply via Email
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
