import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, getImageUrl } from '../lib/supabase'
import { useCart } from '../context/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('products').select('*').eq('id', id).single()
      setProduct(data)

      if (data) {
        const { data: rel } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('id', id)
          .limit(3)
        setRelated(rel || [])
      }
      setLoading(false)
    }
    load()
    window.scrollTo(0, 0)
  }, [id])

  function handleAddToCart() {
    addItem(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-lora italic text-mahogany/50">Loading...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center text-center px-4">
        <div>
          <div className="text-6xl mb-4">🕯️</div>
          <h2 className="font-cinzel text-2xl text-mahogany mb-4">Product Not Found</h2>
          <Link to="/shop" className="btn-gold">Back to Shop</Link>
        </div>
      </div>
    )
  }

  const images = product.images && product.images.length > 0 ? product.images : [null]

  return (
    <div className="min-h-screen pt-20 bg-cream">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <nav className="flex items-center gap-2 font-raleway text-xs text-mahogany/40 uppercase tracking-wider">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-gold transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-mahogany">{product.name}</span>
        </nav>
      </div>

      {/* Product Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className={`aspect-square overflow-hidden ${product.collection === 'Premium Dark' ? 'bg-mahogany' : 'bg-parchment'}`}>
              {images[selectedImage] ? (
                <img
                  src={getImageUrl(images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="text-8xl">🕯️</div>
                    <p className="font-cinzel text-sm tracking-widest text-mahogany/30 uppercase">Native Flame</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === i ? 'border-gold' : 'border-transparent hover:border-parchment-dark'
                    }`}
                  >
                    {img ? (
                      <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-parchment flex items-center justify-center text-2xl">🕯️</div>
                    )}
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
                <span className="font-cinzel text-3xl font-bold text-gold">${Number(product.price).toFixed(2)}</span>
                <span className="font-raleway text-sm text-mahogany/50">Net Wt. {product.size_oz} oz</span>
              </div>
            </div>

            <div className="w-16 h-px bg-gold" />

            {/* Description */}
            {product.description && (
              <p className="font-lora text-base text-mahogany/75 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Scent Notes */}
            {product.scent_notes && (
              <div className="bg-parchment px-5 py-4">
                <p className="font-raleway text-xs font-semibold tracking-widest uppercase text-gold mb-2">Scent Notes</p>
                <p className="font-lora text-sm italic text-mahogany/70">{product.scent_notes}</p>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            {product.stock > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="font-raleway text-xs uppercase tracking-wider text-mahogany/50">Quantity</span>
                  <div className="flex items-center border border-parchment-dark">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-mahogany/60 hover:text-gold hover:bg-parchment transition-colors"
                    >−</button>
                    <span className="w-12 text-center font-cinzel font-semibold text-mahogany">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="w-10 h-10 flex items-center justify-center text-mahogany/60 hover:text-gold hover:bg-parchment transition-colors"
                    >+</button>
                  </div>
                  <span className="font-raleway text-xs text-mahogany/30">{product.stock} in stock</span>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`w-full py-4 font-cinzel font-bold text-sm tracking-widest uppercase transition-all duration-300 ${
                    added
                      ? 'bg-teal text-cream'
                      : 'bg-mahogany text-cream hover:bg-gold'
                  }`}
                >
                  {added ? '✓ Added to Cart' : 'Add to Cart'}
                </button>

                <Link to="/checkout" className="btn-outline w-full text-center block">
                  Buy Now
                </Link>
              </div>
            ) : (
              <div className="bg-parchment px-6 py-4 text-center">
                <p className="font-cinzel text-mahogany/40 tracking-widest uppercase text-sm">Sold Out</p>
              </div>
            )}

            {/* Details */}
            <div className="border-t border-parchment-dark pt-6 space-y-3">
              {[
                { label: 'Wax Type', val: 'Soy Blend' },
                { label: 'Wick', val: 'Cotton, Lead-Free' },
                { label: 'Burn Time', val: '~45–50 hours' },
                { label: 'Made In', val: 'Buffalo Gap, Texas 🤠' },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="font-raleway text-xs uppercase tracking-wider text-mahogany/40">{label}</span>
                  <span className="font-lora text-mahogany/70">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="py-16 px-4 bg-parchment mt-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-cinzel text-2xl font-bold text-mahogany tracking-wide">You May Also Like</h2>
              <div className="gold-divider" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="group block card-candle bg-white">
                  <div className="aspect-square bg-parchment overflow-hidden">
                    {p.images && p.images[0] ? (
                      <img src={getImageUrl(p.images[0])} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🕯️</div>
                    )}
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
