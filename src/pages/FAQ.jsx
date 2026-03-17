import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function FAQ() {
  const [faqs,    setFaqs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [open,    setOpen]    = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        setFaqs(data || [])
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [])

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
          <p className="font-raleway text-xs tracking-[0.4em] uppercase text-gold mb-4">Got Questions?</p>
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-cream mb-4">Frequently Asked</h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold/50"/>
            <p className="font-lora text-sm italic text-cream/60">Everything you need to know</p>
            <div className="h-px w-16 bg-gold/50"/>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-lora italic text-mahogany/40">No FAQs yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={faq.id} className="border border-parchment-dark bg-white overflow-hidden">
                <button
                  onClick={() => setOpen(open === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-parchment/50 transition-colors">
                  <span className="font-cinzel text-sm font-semibold text-mahogany pr-4">{faq.question}</span>
                  <svg className={`w-5 h-5 text-gold shrink-0 transition-transform duration-200 ${open === faq.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {open === faq.id && (
                  <div className="px-6 py-4 border-t border-parchment-dark bg-parchment/30">
                    <p className="font-lora text-sm text-mahogany/75 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-mahogany p-8 text-center space-y-4">
          <h2 className="font-cinzel text-lg font-bold text-cream">Still have a question?</h2>
          <div className="gold-divider"/>
          <p className="font-lora text-sm italic text-cream/60">Jennifer is happy to help personally.</p>
          <Link to="/contact" className="btn-gold inline-block">Contact Jennifer</Link>
        </div>
      </div>
    </div>
  )
}
