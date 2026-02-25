import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, getImageUrl } from '../../lib/supabase'

const EMPTY_FORM = {
  name: '', collection: 'Standard', product_type: 'candle', description: '', scent_notes: '',
  price: '', size_oz: '7', stock: '', is_active: true
}

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [pendingImages, setPendingImages] = useState([]) // File objects
  const [previewUrls, setPreviewUrls] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/admin/login'); return }
      loadProducts()
    }
    check()
  }, [navigate])

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setPendingImages([])
    setPreviewUrls([])
    setExistingImages([])
    setShowForm(true)
  }

  function openEdit(product) {
    setForm({
      name: product.name || '',
      collection: product.collection || 'Standard',
      description: product.description || '',
      scent_notes: product.scent_notes || '',
      price: String(product.price || ''),
      size_oz: String(product.size_oz || '7'),
      stock: String(product.stock || ''),
      is_active: product.is_active ?? true,
    })
    setEditId(product.id)
    setExistingImages(product.images || [])
    setPendingImages([])
    setPreviewUrls([])
    setShowForm(true)
  }

  function handleImageSelect(e) {
    const files = Array.from(e.target.files)
    setPendingImages(prev => [...prev, ...files])
    const urls = files.map(f => URL.createObjectURL(f))
    setPreviewUrls(prev => [...prev, ...urls])
  }

  function removePendingImage(i) {
    URL.revokeObjectURL(previewUrls[i])
    setPendingImages(prev => prev.filter((_, idx) => idx !== i))
    setPreviewUrls(prev => prev.filter((_, idx) => idx !== i))
  }

  function removeExistingImage(i) {
    setExistingImages(prev => prev.filter((_, idx) => idx !== i))
  }

  async function uploadImages(productId) {
    if (pendingImages.length === 0) return existingImages
    setUploadingImages(true)
    const uploaded = []
    for (const file of pendingImages) {
      const ext = file.name.split('.').pop()
      const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
      if (!error) uploaded.push(path)
    }
    setUploadingImages(false)
    return [...existingImages, ...uploaded]
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name || !form.price || !form.stock) {
      alert('Name, price, and stock are required.')
      return
    }
    setSaving(true)

    const productId = editId || crypto.randomUUID()
    const allImages = await uploadImages(productId)

    const payload = {
      name: form.name,
      collection: form.collection,
      description: form.description,
      scent_notes: form.scent_notes,
      price: parseFloat(form.price),
      size_oz: parseFloat(form.size_oz),
      stock: parseInt(form.stock),
      is_active: form.is_active,
      images: allImages,
      updated_at: new Date().toISOString()
    }

    let error
    if (editId) {
      ;({ error } = await supabase.from('products').update(payload).eq('id', editId))
    } else {
      ;({ error } = await supabase.from('products').insert({ ...payload, id: productId }))
    }

    if (error) {
      alert('Error saving product: ' + error.message)
    } else {
      setShowForm(false)
      await loadProducts()
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
      setDeleteConfirm(null)
      await loadProducts()
    }
  }

  async function toggleActive(product) {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    await loadProducts()
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Admin Nav */}
      <header className="bg-mahogany border-b border-cream/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="font-raleway text-xs text-cream/40 hover:text-gold transition-colors uppercase tracking-wider">
            ← Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <h1 className="font-cinzel font-bold text-gold tracking-wider">Products</h1>
        </div>
        <button onClick={openNew} className="btn-gold text-xs px-5 py-2">
          + Add New Candle
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-mahogany/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
            <div className="bg-cream w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-parchment-dark bg-mahogany">
                <h2 className="font-cinzel font-bold text-gold tracking-wide">
                  {editId ? 'Edit Product' : 'Add New Candle'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-cream/50 hover:text-cream transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* Name + Collection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Candle Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                      className="input-field" placeholder="e.g. Moonwind" required />
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Collection</label>
                    <select value={form.collection} onChange={e => setForm(p => ({...p, collection: e.target.value}))} className="input-field">
                      <option>Standard</option>
                      <option>Turnbow Collection</option>
                      <option>Coffee House Collection</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Product Type</label>
                    <select value={form.product_type} onChange={e => setForm(p => ({...p, product_type: e.target.value}))} className="input-field">
                      <option value="candle">🕯️ Candle</option>
                      <option value="wax_melt">🫧 Wax Melt</option>
                      <option value="room_spray">🌿 Room Spray</option>
                      <option value="car_freshener">🚗 Car Freshener</option>
                    </select>
                  </div>
                </div>

                {/* Price + Size + Stock */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Price ($) *</label>
                    <input value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))}
                      type="number" step="0.01" min="0" className="input-field" placeholder="24.00" required />
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Size (oz)</label>
                    <input value={form.size_oz} onChange={e => setForm(p => ({...p, size_oz: e.target.value}))}
                      type="number" step="0.5" min="1" className="input-field" placeholder="7" />
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Stock *</label>
                    <input value={form.stock} onChange={e => setForm(p => ({...p, stock: e.target.value}))}
                      type="number" min="0" className="input-field" placeholder="20" required />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                    className="input-field h-24 resize-none" placeholder="Describe this candle..." />
                </div>

                {/* Scent Notes */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Scent Notes</label>
                  <input value={form.scent_notes} onChange={e => setForm(p => ({...p, scent_notes: e.target.value}))}
                    className="input-field" placeholder="Cedar, Vanilla, Warm Amber..." />
                </div>

                {/* Images */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-2">Product Images</label>

                  {/* Existing Images */}
                  {existingImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {existingImages.map((img, i) => (
                        <div key={i} className="relative w-20 h-20">
                          <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeExistingImage(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-full">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New image previews */}
                  {previewUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {previewUrls.map((url, i) => (
                        <div key={i} className="relative w-20 h-20">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removePendingImage(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 flex items-center justify-center text-xs rounded-full">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex items-center gap-2 border-2 border-dashed border-parchment-dark p-4 cursor-pointer hover:border-gold transition-colors">
                    <svg className="w-5 h-5 text-mahogany/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-raleway text-xs text-mahogany/50">Click to upload images</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                  </label>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(p => ({...p, is_active: !p.is_active}))}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${form.is_active ? 'bg-teal' : 'bg-mahogany/20'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <span className="font-raleway text-xs text-mahogany/60 uppercase tracking-wider">
                    {form.is_active ? 'Visible on site' : 'Hidden from site'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving || uploadingImages}
                    className="btn-gold flex-1 flex items-center justify-center gap-2"
                  >
                    {(saving || uploadingImages) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                        {uploadingImages ? 'Uploading...' : 'Saving...'}
                      </>
                    ) : (editId ? 'Save Changes' : 'Add Candle')}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-mahogany/60 z-50 flex items-center justify-center px-4">
            <div className="bg-cream p-8 max-w-sm w-full text-center space-y-4">
              <h3 className="font-cinzel font-bold text-xl text-mahogany">Delete Product?</h3>
              <p className="font-lora text-sm text-mahogany/60 italic">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDelete(deleteConfirm)}
                  className="btn-dark flex-1 bg-red-600 hover:bg-red-700">Delete</button>
                <button onClick={() => setDeleteConfirm(null)}
                  className="btn-outline flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🕯️</div>
            <h3 className="font-cinzel text-xl text-mahogany mb-2">No products yet</h3>
            <button onClick={openNew} className="btn-gold mt-4">Add Your First Candle</button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="bg-white border border-parchment-dark flex items-center gap-4 p-4">
                {/* Image */}
                <div className="w-16 h-16 bg-parchment shrink-0 overflow-hidden">
                  {product.images && product.images[0] ? (
                    <img src={getImageUrl(product.images[0])} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🕯️</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-cinzel font-semibold text-mahogany">{product.name}</h3>
                      <p className="font-raleway text-xs text-mahogany/40 mt-0.5 uppercase tracking-wider">{product.collection}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-cinzel font-bold text-gold">${Number(product.price).toFixed(2)}</p>
                      <p className="font-raleway text-xs text-mahogany/40">Stock: {product.stock}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle Active */}
                  <button
                    onClick={() => toggleActive(product)}
                    title={product.is_active ? 'Click to hide' : 'Click to show'}
                    className={`font-raleway text-xs font-semibold uppercase tracking-wider px-3 py-1.5 transition-colors ${
                      product.is_active
                        ? 'bg-teal/10 text-teal-dark hover:bg-teal/20'
                        : 'bg-mahogany/10 text-mahogany/40 hover:bg-mahogany/20'
                    }`}
                  >
                    {product.is_active ? 'Live' : 'Hidden'}
                  </button>

                  <button
                    onClick={() => openEdit(product)}
                    className="font-raleway text-xs text-mahogany/50 hover:text-gold transition-colors px-3 py-1.5 border border-parchment-dark hover:border-gold"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteConfirm(product.id)}
                    className="font-raleway text-xs text-mahogany/30 hover:text-red-500 transition-colors p-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
