import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

export default function Shop() {
  const [products,     setProducts]     = useState([])
  const [productTypes, setProductTypes] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [typesLoading, setTypesLoading] = useState(true)
  const [fetchError,   setFetchError]   = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const activeType       = searchParams.get('type')       || ''
  const activeCollection = searchParams.get('collection') || 'All'
  const sortBy           = searchParams.get('sort')       || 'newest'

  const COLLECTIONS = ['All', 'Standard', 'Turnbow Collection', 'Coffee House Collection']

  // Load product types from Supabase
  useEffect(() => {
    async function loadTypes() {
      setTypesLoading(true)
      try {
        const { data } = await supabase
          .from('product_types')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        setProductTypes(data || [])
      } catch (_) {}
      setTypesLoading(false)
    }
    loadTypes()
  }, [])

  // Handle legacy Home page links
  useEffect(() => {
    const col = searchParams.get('collection')
    if (col === 'dark') {
      const next = new URLSearchParams(searchParams)
      next.set('collection', 'Coffee House Collection')
      setSearchParams(next, { replace: true })
    } else if (col === 'natural') {
      const next = new URLSearchParams(searchParams)
      next.set('collection', 'Standard')
      setSearchParams(next, { replace: true })
    }
  }, [])

  function setType(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('type', value); else next.delete('type')
    setSearchParams(next, { replace: true })
  }

  function setCollection(value) {
    const next = new URLSearchParams(searchParams)
    if (value && value !== 'All') next.set('collection', value); else next.delete('collection')
    setSearchParams(next, { replace: true })
  }

  function setSort(value) {
    const next = new URLSearchParams(searchParams)
    if (value !== 'newest') next.set('sort', value); else next.delete('sort')
    setSearchParams(next, { replace: true })
  }

  function clearAll() { setSearchParams({}, { replace: true }) }

  const hasActiveFilters = activeType !== '' || activeCollection !== 'All'

  // Current tab label for page header
  const currentTypeLabel = activeType
    ? (productTypes.find(t => t.slug === activeType)?.label || 'All Products')
    : 'All Products'

  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      setFetchError(false)
      try {
        let query = supabase.from('products').select('*').eq('is_active', true)
        if (activeCollection !== 'All') query = query.eq('collection', activeCollection)
        if (activeType)                 query = query.eq('product_type', activeType)
        if (sortBy === 'newest')          query = query.order('created_at', { ascending: false })
        else if (sortBy === 'price-asc')  query = query.order('price', { ascending: true })
        else if (sortBy === 'price-desc') query = query.order('price', { ascending: false })
        else if (sortBy === 'name')       query = query.order('name', { ascending: true })
        const { data, error } = await query
        if (error) throw error
        setProducts(data || [])
      } catch (_) {
        setFetchError(true)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [activeType, activeCollection, sortBy])

  return (
    <div className="min-h-screen pt-24 bg-cream">

      {/* Page Header */}
      <div className="relative py-20 px-4 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1C0A00 0%, #3D1F0A 50%, #1C0A00 100%)' }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #C8922A, transparent 70%)', filter: 'blur(40px)' }} />
        </div>
        <div className="relative z-10">
          <p className="font-raleway text-xs tracking-[0.4em] uppercase text-gold mb-3">Hand-Poured in Texas</p>
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-cream mb-4">{currentTypeLabel}</h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gold/50" />
            <p className="font-lora text-sm italic text-cream/60">Every flame tells a story</p>
            <div className="h-px w-16 bg-gold/50" />
          </div>
        </div>
      </div>

      {/* Product Type Tabs — loaded from Supabase */}
      <div className="bg-mahogany border-b border-cream/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-1 overflow-x-auto py-1">
          {/* All Products tab always first */}
          <button onClick={() => setType('')}
            className={`shrink-0 px-5 py-3 font-raleway text-xs font-semibold tracking-widest uppercase transition-all duration-200 ${
              activeType === '' ? 'text-gold border-b-2 border-gold' : 'text-cream/50 hover:text-cream border-b-2 border-transparent'
            }`}>
            ✦ All Products
          </button>

          {!typesLoading && productTypes.map(t => (
            <button key={t.slug} onClick={() => setType(t.slug)}
              className={`shrink-0 px-5 py-3 font-raleway text-xs font-semibold tracking-widest uppercase transition-all duration-200 ${
                activeType === t.slug ? 'text-gold border-b-2 border-gold' : 'text-cream/50 hover:text-cream border-b-2 border-transparent'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-parchment-dark">
          <div className="flex flex-wrap items-center gap-2">
            {COLLECTIONS.map(col => (
              <button key={col} onClick={() => setCollection(col)}
                className={`font-raleway text-xs font-semibold tracking-widest uppercase px-4 py-2 transition-all duration-200 ${
                  activeCollection === col
                    ? 'bg-mahogany text-cream'
                    : 'border border-parchment-dark text-mahogany/60 hover:border-mahogany hover:text-mahogany'
                }`}>
                {col}
              </button>
            ))}
            {hasActiveFilters && (
              <button onClick={clearAll}
                className="font-raleway text-xs text-mahogany/40 hover:text-red-500 transition-colors underline underline-offset-2 ml-1">
                Clear all
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider">Sort:</span>
            <select value={sortBy} onChange={e => setSort(e.target.value)}
              className="input-field py-2 text-xs w-auto min-w-40 cursor-pointer">
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && !loading && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider">Filtering by:</span>
            {activeType && (
              <span className="inline-flex items-center gap-1 bg-mahogany/10 text-mahogany font-raleway text-xs px-3 py-1">
                {productTypes.find(t => t.slug === activeType)?.label || activeType}
                <button onClick={() => setType('')} className="ml-1 hover:text-red-500 transition-colors">×</button>
              </span>
            )}
            {activeCollection !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-mahogany/10 text-mahogany font-raleway text-xs px-3 py-1">
                {activeCollection}
                <button onClick={() => setCollection('All')} className="ml-1 hover:text-red-500 transition-colors">×</button>
              </span>
            )}
          </div>
        )}

        {/* Result count */}
        {!loading && (
          <p className="font-raleway text-xs text-mahogany/40 mb-6 uppercase tracking-wider">
            {products.length} {products.length === 1 ? 'item' : 'items'} found
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
        ) : fetchError ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="font-cinzel text-xl text-mahogany mb-2">Couldn't load products</h3>
            <p className="font-lora italic text-mahogany/50 mb-6">Check your connection and try again.</p>
            <button onClick={() => window.location.reload()} className="btn-outline">Retry</button>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🕯️</div>
            <h3 className="font-cinzel text-xl text-mahogany mb-2">
              {hasActiveFilters ? 'No results' : 'Coming Soon'}
            </h3>
            <p className="font-lora italic text-mahogany/50">
              {hasActiveFilters
                ? 'No products match your current filters.'
                : 'Check back soon — Jennifer is pouring as fast as she can!'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAll} className="btn-outline mt-6">Clear Filters</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
