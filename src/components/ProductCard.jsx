import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getImageUrl } from '../lib/supabase'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [adding, setAdding] = useState(false)

  const imageUrl = product.images && product.images[0]
    ? getImageUrl(product.images[0])
    : null

  const isDark = product.collection === 'Premium Dark'

  async function handleAddToCart(e) {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    addItem(product)
    await new Promise(r => setTimeout(r, 800))
    setAdding(false)
  }

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="card-candle">
        {/* Image */}
        <div className={`relative aspect-square overflow-hidden ${isDark ? 'bg-mahogany' : 'bg-parchment'}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-mahogany' : 'bg-parchment'}`}>
              <div className="text-center space-y-2">
                <div className="text-5xl">🕯️</div>
                <p className={`font-cinzel text-xs tracking-widest uppercase ${isDark ? 'text-gold' : 'text-mahogany/40'}`}>
                  Native Flame
                </p>
              </div>
            </div>
          )}

          {/* Collection Badge */}
          {product.collection && product.collection !== 'Standard' && (
            <div className="absolute top-3 left-3">
              <span className={`font-raleway text-xs font-semibold tracking-wider uppercase px-3 py-1 ${
                isDark
                  ? 'bg-mahogany text-gold border border-gold/30'
                  : 'bg-gold text-cream'
              }`}>
                {product.collection}
              </span>
            </div>
          )}

          {/* Out of Stock */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-mahogany/60 flex items-center justify-center">
              <span className="font-cinzel text-cream text-sm tracking-widest uppercase">Sold Out</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5">
          <h3 className="font-cinzel font-semibold text-base text-mahogany group-hover:text-gold transition-colors duration-200">
            {product.name}
          </h3>
          <p className="font-raleway text-xs text-mahogany/50 mt-1 tracking-wide">
            {product.size_oz} oz · Soy Blend
          </p>
          {product.scent_notes && (
            <p className="font-lora text-xs italic text-mahogany/60 mt-2 line-clamp-1">
              {product.scent_notes}
            </p>
          )}

          <div className="flex items-center justify-between mt-4">
            <span className="font-cinzel font-bold text-lg text-gold">
              ${Number(product.price).toFixed(2)}
            </span>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              className={`font-raleway text-xs font-semibold tracking-widest uppercase px-4 py-2 transition-all duration-200 ${
                adding
                  ? 'bg-teal text-cream'
                  : product.stock === 0
                  ? 'bg-parchment-dark text-mahogany/30 cursor-not-allowed'
                  : 'bg-mahogany text-cream hover:bg-gold'
              }`}
            >
              {adding ? '✓ Added' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
