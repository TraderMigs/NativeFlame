import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getImageUrl } from '../lib/supabase'

export default function CartDrawer() {
  const { items, totalItems, subtotal, isOpen, setIsOpen, removeItem, updateQuantity } = useCart()

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-mahogany/50 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-cream z-50 shadow-2xl flex flex-col cart-drawer ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-parchment-dark">
          <div>
            <h2 className="font-cinzel font-bold text-lg text-mahogany tracking-wide">Your Cart</h2>
            <p className="font-raleway text-xs text-mahogany/50 mt-0.5">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-mahogany/50 hover:text-mahogany transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="text-6xl">🕯️</div>
              <p className="font-cinzel text-mahogany/60 text-sm">Your cart is empty</p>
              <Link
                to="/shop"
                onClick={() => setIsOpen(false)}
                className="btn-outline text-xs px-6 py-2"
              >
                Browse Candles
              </Link>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 py-4 border-b border-parchment">
                {/* Image */}
                <div className="w-20 h-20 bg-parchment shrink-0 overflow-hidden">
                  {item.images && item.images[0] ? (
                    <img
                      src={getImageUrl(item.images[0])}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🕯️</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-cinzel font-semibold text-sm text-mahogany truncate">{item.name}</h3>
                  <p className="font-raleway text-xs text-mahogany/50 mt-0.5">{item.size_oz} oz</p>
                  <p className="font-cinzel font-bold text-gold mt-1">${(item.price * item.quantity).toFixed(2)}</p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 border border-parchment-dark text-mahogany/60 hover:border-gold hover:text-gold transition-colors flex items-center justify-center text-sm"
                    >−</button>
                    <span className="font-raleway text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 border border-parchment-dark text-mahogany/60 hover:border-gold hover:text-gold transition-colors flex items-center justify-center text-sm"
                    >+</button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 text-mahogany/30 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-parchment-dark px-6 py-5 space-y-4 bg-cream">
            <div className="flex justify-between items-center">
              <span className="font-raleway text-sm text-mahogany/70">Subtotal</span>
              <span className="font-cinzel font-bold text-lg text-mahogany">${subtotal.toFixed(2)}</span>
            </div>
            <p className="font-raleway text-xs text-mahogany/40">Shipping calculated at checkout</p>
            <Link
              to="/checkout"
              onClick={() => setIsOpen(false)}
              className="btn-gold w-full text-center block"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full font-raleway text-xs text-mahogany/50 hover:text-gold transition-colors py-1"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
