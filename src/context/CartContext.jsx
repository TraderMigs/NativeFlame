import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('nf_cart')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('nf_cart', JSON.stringify(items))
  }, [items])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal   = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function addItem(product, quantity = 1, variant = null) {
    setItems(prev => {
      // For variant products, key is id + variantId; for regular, just id
      const key = variant ? `${product.id}__${variant.id}` : product.id
      const existing = prev.find(i => i.cartKey === key)
      if (existing) {
        return prev.map(i => i.cartKey === key ? { ...i, quantity: i.quantity + quantity } : i)
      }
      const item = {
        ...product,
        cartKey:    key,
        quantity,
        // Override price with variant price if applicable
        price:      variant ? variant.price : product.price,
        // Variant display info
        variantId:   variant?.id    || null,
        variantColor: variant?.color_style || null,
        variantSize:  variant?.size        || null,
      }
      return [...prev, item]
    })
    setIsOpen(true)
  }

  function removeItem(cartKey) {
    setItems(prev => prev.filter(i => i.cartKey !== cartKey))
  }

  function updateQuantity(cartKey, quantity) {
    if (quantity < 1) { removeItem(cartKey); return }
    setItems(prev => prev.map(i => i.cartKey === cartKey ? { ...i, quantity } : i))
  }

  function clearCart() { setItems([]) }

  return (
    <CartContext.Provider value={{
      items, totalItems, subtotal,
      isOpen, setIsOpen,
      addItem, removeItem, updateQuantity, clearCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
