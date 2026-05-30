import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase, getImageUrl } from '../lib/supabase'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { addItem } = useCart()

  const [product,       setProduct]       = useState(null)
  const [variants,      setVariants]      = useState([])
  const [related,       setRelated]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity,      setQuantity]      = useState(1)
  const [added,         setAdded]         = useState(false)

  // Variant selection state
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize,  setSelectedSize]  = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setSelectedImage(0); setQuantity(1); setAdded(false)
      setSelectedColor(null); setSelectedSize(null)

      const { data } = await supabase.from('products').select('*').eq('id', id).single()
      setProduct(data)

      if (data) {
        // Load variants if this is a variant product
        if (data.has_variants) {
          const { data: varData } = await supabase
            .from('product_variants').select('*')
            .eq('product_id', id).eq('is_active', true)
            .order('sort_order', { ascending: true })
          setVariants(varData || [])
        }

        const { data: sameCol } = await supabase.from('products').select('*')
          .eq('is_active', true).eq('collection', data.collection).neq('id', id).limit(3)
        if (sameCol && sameCol.length >= 3) {
          setRelated(sameCol)
        } else {
          const { data: any } = await supabase.from('products').select('*')
            .eq('is_active', true).neq('id', id).limit(3)
          setRelated(any || [])
        }
      }
      setLoading(false)
    }
    load()
    window.scrollTo(0, 0)
  }, [id])

  // Unique colors from all active variants
  const uniqueColors = useMemo(() => {
    const seen = new Set()
    return variants.filter(v => {
      if (seen.has(v.color_style)) return false
      seen.add(v.color_style); return true
    })
  }, [variants])

  // Sizes available for the selected color
  const sizesForColor = useMemo(() => {
    if (!selectedColor) return []
    return variants.filter(v => v.color_style === selectedColor)
  }, [variants, selectedColor])

  // The exact variant matching current selection
  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null
    return variants.find(v => v.color_style === selectedColor && v.size === selectedSize) || null
  }, [variants, selectedColor, selectedSize])

  // When color changes, reset size
  function handleColorSelect(color) {
    setSelectedColor(color)
    setSelectedSize(null)
    setAdded(false)
  }

  function handleSizeSelect(size) {
    setSelectedSize(size)
    setAdded(false)
  }

  // For variant products, stock comes from selected variant
  const effectiveStock = product?.has_variants
    ? (selectedVariant?.stock ?? 0)
    : (product?.stock ?? 0)

  const effectivePrice = product?.has_variants
    ? (selectedVariant?.price ?? (sizesForColor[0]?.price ?? product?.price))
    : product?.price

  function handleAddToCart() {
    if (product.has_variants) {
      if (!selectedVariant) return
      addItem(product, quantity, selectedVariant)
    } else {
      addItem(product, quantity)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    if (product.has_variants) {
      if (!selectedVariant) return
      addItem(product, quantity, selectedVariant)
    } else {
      addItem(product, quantity)
    }
    navigate('/checkout')
  }

  const canAddToCart = product?.has_variants
    ? (selectedVariant && selectedVariant.stock > 0)
    : (product?.stock > 0)

  if (loading) {
    return (
      <div className="min-h-screen pt-24 bg-cream flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto"/>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-24 bg-cream flex items-center justify-center text-center px-4">
        <div>
          <div className="text-6xl mb-4">🕯️</div>
          <h2 className="font-cinzel text-2xl text-mahogany mb-4">Product Not Found</h2>
          <Link to="/shop" className="btn-gold">Back to Shop</Link>
        </div>
      </div>
    )
  }

  const isDark = product.collection === 'Coffee House Collection'
  const images = product.images && product.images.length > 0 ? product.images : [null]

  return (
    <div className="min-h-screen pt-24 bg-cream">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <nav className="flex items-center gap-2 font-raleway text-xs text-mahogany/40 uppercase tracking-wider">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-gold transition-colors">Shop</Link>
          <span>/</span>
          {product.collection && product.collection !== 'Standard' && (
            <>
              <Link to={`/shop?collection=${encodeURIComponent(product.collection)}`}
                className="hover:text-gold transition-colors">{product.collection}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-mahogany">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Images */}
          <div className="space-y-4">
            <div className={`aspect-square overflow-hidden ${isDark ? 'bg-mahogany' : 'bg-parchment'}`}>
              {images[selectedImage]
                ? <img src={getImageUrl(images[selectedImage])} alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"/>
                : <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="text-8xl">{product.has_variants ? '👕' : '🕯️'}</div>
                      <p className="font-cinzel text-sm tracking-widest text-mahogany/30 uppercase">Native Flame</p>
                    </div>
                  </div>
              }
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === i ? 'border-gold' : 'border-transparent hover:border-parchment-dark'
                    }`}>
                    {img
                      ? <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full bg-parchment flex items-center justify-center text-2xl">
                          {product.has_variants ? '👕' : '🕯️'}
                        </div>
                    }
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-start space-y-6">
            {product.collection && product.collection !== 'Standard' && (
              <span className="font-raleway text-xs font-semibold tracking-widest uppercase text-gold">
                {product.collection}
              </span>
            )}

            <div>
              <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-mahogany">{product.name}</h1>
              <div className="flex items-center gap-4 mt-3">
                <span className="font-cinzel text-3xl font-bold text-gold">
                  ${Number(effectivePrice || product.price).toFixed(2)}
                </span>
                {!product.has_variants && product.size_oz && (
                  <span className="font-raleway text-sm text-mahogany/50">Net Wt. {product.size_oz} oz</span>
                )}
              </div>
            </div>

            <div className="w-16 h-px bg-gold"/>

            {product.description && (
              <p className="font-lora text-base text-mahogany/75 leading-relaxed">{product.description}</p>
            )}

            {!product.has_variants && product.scent_notes && (
              <div className="bg-parchment px-5 py-4">
                <p className="font-raleway text-xs font-semibold tracking-widest uppercase text-gold mb-2">Scent Notes</p>
                <p className="font-lora text-sm italic text-mahogany/70">{product.scent_notes}</p>
              </div>
            )}

            {/* ── VARIANT SELECTOR (Option B — visual buttons) ── */}
            {product.has_variants && variants.length > 0 && (
              <div className="space-y-5">

                {/* Step 1 — Color / Style */}
                <div>
                  <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 mb-3">
                    Style / Color
                    {selectedColor && <span className="ml-2 text-mahogany font-semibold normal-case">— {selectedColor}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uniqueColors.map(v => {
                      const hasStock = variants.some(x => x.color_style === v.color_style && x.stock > 0)
                      return (
                        <button key={v.color_style}
                          onClick={() => hasStock && handleColorSelect(v.color_style)}
                          className={`font-raleway text-xs font-semibold px-4 py-2 border-2 transition-all duration-150 ${
                            !hasStock
                              ? 'border-parchment-dark text-mahogany/25 cursor-not-allowed line-through'
                              : selectedColor === v.color_style
                                ? 'border-gold bg-gold/10 text-mahogany'
                                : 'border-parchment-dark text-mahogany hover:border-mahogany'
                          }`}>
                          {v.color_style}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Step 2 — Size (shown after color selected) */}
                {selectedColor && (
                  <div>
                    <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 mb-3">
                      Size
                      {selectedSize && <span className="ml-2 text-mahogany font-semibold normal-case">— {selectedSize}</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sizesForColor.map(v => (
                        <button key={v.size}
                          onClick={() => v.stock > 0 && handleSizeSelect(v.size)}
                          className={`font-cinzel text-xs font-bold w-14 h-10 border-2 transition-all duration-150 ${
                            v.stock === 0
                              ? 'border-parchment-dark text-mahogany/25 cursor-not-allowed relative overflow-hidden'
                              : selectedSize === v.size
                                ? 'border-gold bg-gold/10 text-mahogany'
                                : 'border-parchment-dark text-mahogany hover:border-mahogany'
                          }`}>
                          {v.size}
                          {v.stock === 0 && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="block w-full h-px bg-mahogany/20 rotate-45 absolute"/>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
                      <p className="font-raleway text-xs text-amber-600 mt-2">Only {selectedVariant.stock} left!</p>
                    )}
                  </div>
                )}

                {/* Price update when variant selected */}
                {selectedVariant && (
                  <div className="bg-parchment px-4 py-3 flex items-center justify-between">
                    <span className="font-raleway text-xs uppercase tracking-wider text-mahogany/50">
                      {selectedColor} / {selectedSize}
                    </span>
                    <span className="font-cinzel font-bold text-gold text-lg">
                      ${Number(selectedVariant.price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── ADD TO CART / BUY NOW ── */}
            {canAddToCart ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-raleway text-xs uppercase tracking-wider text-mahogany/50">Quantity</span>
                  <div className="flex items-center border border-parchment-dark">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-mahogany/60 hover:text-gold hover:bg-parchment transition-colors">−</button>
                    <span className="w-12 text-center font-cinzel font-semibold text-mahogany">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(effectiveStock, q + 1))}
                      className="w-10 h-10 flex items-center justify-center text-mahogany/60 hover:text-gold hover:bg-parchment transition-colors">+</button>
                  </div>
                  <span className="font-raleway text-xs text-mahogany/30">{effectiveStock} in stock</span>
                </div>

                <button onClick={handleAddToCart}
                  disabled={product.has_variants && !selectedVariant}
                  className={`w-full py-4 font-cinzel font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
                    product.has_variants && !selectedVariant
                      ? 'bg-parchment text-mahogany/30 cursor-not-allowed'
                      : added
                        ? 'bg-teal text-cream'
                        : 'bg-mahogany text-cream hover:bg-gold'
                  }`}>
                  {product.has_variants && !selectedVariant
                    ? 'Select Options Above'
                    : added ? '✓ Added to Cart' : 'Add to Cart'}
                </button>

                <button onClick={handleBuyNow}
                  disabled={product.has_variants && !selectedVariant}
                  className={`btn-outline w-full text-center block ${
                    product.has_variants && !selectedVariant ? 'opacity-30 cursor-not-allowed' : ''
                  }`}>
                  Buy Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {product.has_variants && !selectedColor && variants.length > 0 && (
                  <p className="font-raleway text-sm text-mahogany/60">Select a style to see availability</p>
                )}
                {product.has_variants && selectedColor && !selectedSize && (
                  <p className="font-raleway text-sm text-mahogany/60">Select a size to continue</p>
                )}
                {((!product.has_variants && product.stock === 0) ||
                  (product.has_variants && selectedVariant && selectedVariant.stock === 0)) && (
                  <div className="bg-parchment px-6 py-4 text-center">
                    <p className="font-cinzel text-mahogany/40 tracking-widest uppercase text-sm">Sold Out</p>
                  </div>
                )}
              </div>
            )}

            {/* Product Details */}
            {!product.has_variants && (
              <div className="border-t border-parchment-dark pt-6 space-y-3">
                {[
                  { label: 'Wax Type',  val: 'Soy Blend'          },
                  { label: 'Wick',      val: 'Cotton, Lead-Free'   },
                  { label: 'Burn Time', val: '~45–50 hours'        },
                  { label: 'Made In',   val: 'Buffalo Gap, Texas'  },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="font-raleway text-xs uppercase tracking-wider text-mahogany/40">{label}</span>
                    <span className="font-lora text-mahogany/70">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {product.has_variants && (
              <div className="border-t border-parchment-dark pt-6 space-y-3">
                {[
                  { label: 'Made In',   val: 'Buffalo Gap, Texas'       },
                  { label: 'Brand',     val: 'Native Flame Mercantile'   },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="font-raleway text-xs uppercase tracking-wider text-mahogany/40">{label}</span>
                    <span className="font-lora text-mahogany/70">{val}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="py-16 px-4 bg-parchment mt-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-cinzel text-2xl font-bold text-mahogany tracking-wide">You May Also Like</h2>
              <div className="gold-divider"/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="group block card-candle bg-white">
                  <div className={`aspect-square overflow-hidden ${p.collection === 'Coffee House Collection' ? 'bg-mahogany' : 'bg-parchment'}`}>
                    {p.images && p.images[0]
                      ? <img src={getImageUrl(p.images[0])} alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      : <div className="w-full h-full flex items-center justify-center text-4xl">
                          {p.has_variants ? '👕' : '🕯️'}
                        </div>
                    }
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-cinzel font-semibold text-sm text-mahogany group-hover:text-gold transition-colors">{p.name}</h3>
                    <p className="font-cinzel text-gold mt-1">${Number(p.price).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
