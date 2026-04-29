import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'

import Navbar        from './components/Navbar'
import Footer        from './components/Footer'
import CartDrawer    from './components/CartDrawer'

import Home              from './pages/Home'
import Shop              from './pages/Shop'
import ProductDetail     from './pages/ProductDetail'
import Cart              from './pages/Cart'
import Checkout          from './pages/Checkout'
import About             from './pages/About'
import OrderConfirmation from './pages/OrderConfirmation'

import AdminLogin        from './pages/admin/AdminLogin'
import AdminDashboard    from './pages/admin/AdminDashboard'
import AdminProducts     from './pages/admin/AdminProducts'
import AdminOrders       from './pages/admin/AdminOrders'
import AdminSiteSettings  from './pages/admin/AdminSiteSettings'
import AdminSubscribers  from './pages/admin/AdminSubscribers'
import AdminDiscounts    from './pages/admin/AdminDiscounts'
import AdminMessages    from './pages/admin/AdminMessages'
import AdminPromos      from './pages/admin/AdminPromos'
import AdminAnalytics   from './pages/admin/AdminAnalytics'
import AdminFAQ             from './pages/admin/AdminFAQ'
import AdminProductTypes    from './pages/admin/AdminProductTypes'
import AdminShipping        from './pages/admin/AdminShipping'
import AdminCollections     from './pages/admin/AdminCollections'
import FAQ              from './pages/FAQ'
import PromoBanner      from './components/PromoBanner'
import Contact          from './pages/Contact'
import ChatWidget       from './components/ChatWidget'
import NotFound          from './pages/NotFound'

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <PromoBanner />
      <CartDrawer />
      <ChatWidget />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteSettingsProvider>
        <CartProvider>
          <Routes>
            {/* Public pages */}
            <Route path="/" element={<PublicLayout><Home/></PublicLayout>} />
            <Route path="/shop" element={<PublicLayout><Shop/></PublicLayout>} />
            <Route path="/product/:id" element={<PublicLayout><ProductDetail/></PublicLayout>} />
            <Route path="/cart" element={<PublicLayout><Cart/></PublicLayout>} />
            <Route path="/checkout" element={<PublicLayout><Checkout/></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><About/></PublicLayout>} />
            <Route path="/order-confirmation" element={<PublicLayout><OrderConfirmation/></PublicLayout>} />
            <Route path="/contact"           element={<PublicLayout><Contact/></PublicLayout>} />
            <Route path="/faq"              element={<PublicLayout><FAQ/></PublicLayout>} />

            {/* Admin pages */}
            <Route path="/admin/login"         element={<AdminLogin/>} />
            <Route path="/admin"               element={<AdminDashboard/>} />
            <Route path="/admin/products"      element={<AdminProducts/>} />
            <Route path="/admin/orders"        element={<AdminOrders/>} />
            <Route path="/admin/site-settings"  element={<AdminSiteSettings/>} />
            <Route path="/admin/subscribers"   element={<AdminSubscribers/>} />
            <Route path="/admin/discounts"     element={<AdminDiscounts/>} />
            <Route path="/admin/messages"     element={<AdminMessages/>} />
            <Route path="/admin/promos"       element={<AdminPromos/>} />
            <Route path="/admin/faq"          element={<AdminFAQ/>} />
            <Route path="/admin/analytics"      element={<AdminAnalytics/>} />
            <Route path="/admin/product-types"  element={<AdminProductTypes/>} />
            <Route path="/admin/shipping"       element={<AdminShipping/>} />
            <Route path="/admin/collections"    element={<AdminCollections/>} />
            <Route path="*" element={<PublicLayout><NotFound/></PublicLayout>} />
          </Routes>
        </CartProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  )
}
