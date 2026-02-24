import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getImageUrl } from '../lib/supabase'

export default function Cart() {
  const { items, subtotal, removeItem, updateQuantity } = useCart()

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 bg-cream flex items-center justify-center text-center px-4">
        <div className="space-y-6">
          <div className="text-8xl">🕯️</div>
          <h2 className="font-cinzel text-3xl font-bold text-mahogany">Your cart is empty</h2>
          <p className="font-lora italic text-mahogany/50">Every great room starts with one great candle.</p>
          <Link to="/shop" className="btn-gold inline-block">Shop the Collection</Link>
        </div>
      </div>
    )
  }

  const shipping = subtotal >= 50 ? 0 : 7.99
  const total = subtotal + shipping

  return (
    <div className="min-h-screen pt-20 bg-cream">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-mahogany">Shopping Cart</h1>
          <p className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex gap-5 p-5 bg-white border border-parchment-dark">
                <div className="w-24 h-24 bg-parchment shrink-0 overflow-hidden">
                  {item.images && item.images[0] ? (
                    <img src={getImageUrl(item.images[0])} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🕯️</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-cinzel font-semibold text-base text-mahogany">{item.name}</h3>
                      <p className="font-raleway text-xs text-mahogany/50 mt-0.5">{item.size_oz} oz · Native Flame</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-mahogany/25 hover:text-red-500 transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-parchment-dark">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-mahogany/50 hover:text-gold transition-colors text-sm"
                      >−</button>
                      <span className="w-10 text-center font-cinzel text-sm text-mahogany">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-mahogany/50 hover:text-gold transition-colors text-sm"
                      >+</button>
                    </div>
                    <span className="font-cinzel font-bold text-lg text-gold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-parchment p-6 space-y-4 sticky top-24">
              <h2 className="font-cinzel font-bold text-lg text-mahogany">Order Summary</h2>
              <div className="w-12 h-px bg-gold" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-raleway text-mahogany/60">Subtotal</span>
                  <span className="font-cinzel text-mahogany">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-raleway text-mahogany/60">Shipping</span>
                  <span className="font-cinzel text-mahogany">
                    {shipping === 0 ? <span className="text-teal-dark">FREE</span> : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="font-raleway text-xs text-mahogany/40 italic">
                    Free shipping on orders over $50
                  </p>
                )}
                <div className="border-t border-parchment-dark pt-3 flex justify-between">
                  <span className="font-cinzel font-bold text-mahogany">Total</span>
                  <span className="font-cinzel font-bold text-xl text-gold">${total.toFixed(2)}</span>
                </div>
              </div>

              <Link to="/checkout" className="btn-gold w-full text-center block mt-4">
                Proceed to Checkout
              </Link>
              <Link to="/shop" className="block text-center font-raleway text-xs text-mahogany/40 hover:text-gold transition-colors py-2">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
