import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

const COLLECTIONS = ['All', 'Standard', 'Turnbow Collection', 'Premium Dark']

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCollection, setActiveCollection] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const col = searchParams.get('collection')
    if (col === 'dark') setActiveCollection('Premium Dark')
    else if (col === 'natural') setActiveCollection('Standard')
  }, [searchParams])

  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      let query = supabase.from('products').select('*').eq('is_active', true)

      if (activeCollection !== 'All') {
        query = query.eq('collection', activeCollection)
      }

      if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
      else if (sortBy === 'price-asc') query = query.order('price', { ascending: true })
      else if (sortBy === 'price-desc') query = query.order('price', { ascending: false })
      else if (sortBy === 'name') query = query.order('name', { ascending: true })

      const { data } = await query
      setProducts(data || [])
      setLoading(false)
    }
    loadProducts()
  }, [activeCollection, sortBy])

  return (
    <div className="min-h-screen pt-20 bg-cream">
      {/* Page Header */}
      <div
        className="relative py-20 px-4 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1C0A00 0%, #3D1F0A 50%, #1C0A00 100%)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #C8922A, transparent 70%)', filter: 'blur(40px)' }}
          />
        </div>
        <div className="relative z-10">
          <p className="font-raleway text-xs tracking-[0.4em] uppercase text-gold mb-3">Hand-Poured in Texas</p>
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-cream hero-text-shadow mb-4">
            The Collection
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold/50" />
            <p className="font-lora text-sm italic text-cream/60">Every flame tells a story</p>
            <div className="h-px w-16 bg-gold/50" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10 pb-6 border-b border-parchment-dark">
          {/* Collection Filter */}
          <div className="flex flex-wrap gap-2">
            {COLLECTIONS.map(col => (
              <button
                key={col}
                onClick={() => setActiveCollection(col)}
                className={`font-raleway text-xs font-semibold tracking-widest uppercase px-4 py-2 transition-all duration-200 ${
                  activeCollection === col
                    ? 'bg-mahogany text-cream'
                    : 'border border-parchment-dark text-mahogany/60 hover:border-mahogany hover:text-mahogany'
                }`}
              >
                {col}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input-field py-2 text-xs w-auto min-w-40 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Product Count */}
        {!loading && (
          <p className="font-raleway text-xs text-mahogany/40 mb-6 uppercase tracking-wider">
            {products.length} {products.length === 1 ? 'candle' : 'candles'} found
          </p>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-parchment">
                <div className="aspect-square skeleton" />
                <div className="p-5 space-y-3">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-3 skeleton rounded w-1/2" />
                  <div className="h-8 skeleton rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🕯️</div>
            <h3 className="font-cinzel text-xl text-mahogany mb-2">No candles found</h3>
            <p className="font-lora italic text-mahogany/50">Try a different collection filter</p>
            <button
              onClick={() => setActiveCollection('All')}
              className="btn-outline mt-6"
            >
              View All
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
