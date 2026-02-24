import React from 'react'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="min-h-screen pt-20 bg-cream">

      {/* Hero */}
      <div
        className="relative py-24 px-4 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1C0A00 0%, #3D1F0A 60%, #1C0A00 100%)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #C8922A, transparent 70%)', filter: 'blur(50px)' }}
          />
        </div>
        <div className="relative z-10">
          <p className="font-raleway text-xs tracking-[0.4em] uppercase text-gold mb-4">Buffalo Gap, Texas</p>
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-cream hero-text-shadow mb-4">Our Story</h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold/50" />
            <p className="font-lora text-sm italic text-cream/60">Rooted in Heritage</p>
            <div className="h-px w-16 bg-gold/50" />
          </div>
        </div>
      </div>

      {/* Story Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-raleway text-xs tracking-[0.3em] uppercase text-gold mb-3">Meet Jennifer</p>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-mahogany mb-4">
              The Heart of Native Flame
            </h2>
            <div className="gold-divider" />
          </div>

          <div className="prose max-w-none space-y-6">
            <p className="font-lora text-lg text-mahogany/80 leading-relaxed text-center italic">
              "Every candle I make is a little prayer — a small act of faith poured into wax and wick,
              sent out into the world to bring someone a moment of peace."
            </p>

            <div className="w-16 h-px bg-gold mx-auto" />

            <p className="font-lora text-base text-mahogany/70 leading-relaxed">
              Native Flame was born from something simple: a love of home, heritage, and the comfort
              that comes from a single burning flame. Jennifer started making candles in the heart of
              Taylor County, Texas — in the same West Texas hill country where her family has lived
              for generations.
            </p>

            <p className="font-lora text-base text-mahogany/70 leading-relaxed">
              Each scent in the collection is crafted to tell a story — the cedar and leather of the
              <span className="font-semibold text-mahogany"> Turnbow Collection</span>, named for the family
              land; the clean rain of <span className="font-semibold text-mahogany">Whispering Rain</span>,
              inspired by stormy evenings on the porch; the deep, smoky warmth of
              <span className="font-semibold text-mahogany"> Midnight Saddle</span>, for those who love the
              rugged outdoors.
            </p>

            <p className="font-lora text-base text-mahogany/70 leading-relaxed">
              All candles are small-batch, hand-poured using a clean soy blend with cotton wicks.
              No shortcuts. No fillers. Just honest ingredients and an honest pour — every single time.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-parchment">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-mahogany">What We Stand For</h2>
            <div className="gold-divider" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🙏',
                title: 'Faith First',
                body: 'Every pour begins with intention. Each candle is made with gratitude and care — we believe what you put in, you get out.'
              },
              {
                icon: '🌿',
                title: 'Clean Ingredients',
                body: 'Soy blend wax. Cotton wicks. Premium fragrance oils. No toxins, no tricks — just what belongs in a quality candle.'
              },
              {
                icon: '🤠',
                title: 'Texas Proud',
                body: 'Made in Buffalo Gap, Texas. We\'re as West Texas as it gets — and proud of every bit of it.'
              },
              {
                icon: '🦅',
                title: 'Heritage Honored',
                body: 'The crossed feathers in our logo represent the traditions, family names, and stories that shaped who we are.'
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="bg-white p-6 border border-parchment-dark text-center space-y-3">
                <div className="text-4xl">{icon}</div>
                <h3 className="font-cinzel font-semibold text-sm text-mahogany tracking-wide uppercase">{title}</h3>
                <div className="w-8 h-px bg-gold mx-auto" />
                <p className="font-lora text-sm text-mahogany/60 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-4 bg-mahogany text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-cinzel text-3xl font-bold text-cream">Say Hello</h2>
          <div className="gold-divider" />
          <p className="font-lora text-base italic text-cream/70">
            Questions, custom orders, or just want to talk candles?
            Jennifer would love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <a href="mailto:nativeflamecandles@gmail.com" className="btn-gold">
              Email Jennifer
            </a>
            <a href="tel:3253397398" className="btn-outline border-gold text-gold hover:bg-gold hover:text-cream">
              (325) 339-7398
            </a>
          </div>
          <div className="mt-8">
            <Link to="/shop" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-widest">
              → Shop the Collection
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
