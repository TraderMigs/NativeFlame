import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'

// Public Pages
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import About from './pages/About'
import OrderConfirmation from './pages/OrderConfirmation'

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'

// Layout wrapper for public pages (has Navbar + Footer + CartDrawer)
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main>{children}</main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
          <Route path="/product/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
          <Route path="/cart" element={<PublicLayout><Cart /></PublicLayout>} />
          <Route path="/checkout" element={<PublicLayout><Checkout /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/order-confirmation" element={<PublicLayout><OrderConfirmation /></PublicLayout>} />

          {/* Admin Routes (no public nav/footer) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />

          {/* 404 */}
          <Route path="*" element={
            <PublicLayout>
              <div className="min-h-screen pt-20 bg-cream flex items-center justify-center text-center px-4">
                <div className="space-y-4">
                  <div className="text-6xl">🕯️</div>
                  <h2 className="font-cinzel text-3xl font-bold text-mahogany">Page Not Found</h2>
                  <p className="font-lora italic text-mahogany/50">That flame has gone out...</p>
                  <a href="/" className="btn-gold inline-block mt-4">Back to Home</a>
                </div>
              </div>
            </PublicLayout>
          } />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}
