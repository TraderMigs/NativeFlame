import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, getImageUrl } from '../../lib/supabase'

// Product types loaded from Supabase
// ── Variants Editor Sub-Component ──────────────────────────────────
function VariantsEditor({ productId, variants, setVariants, variantsRef }) {
  const EMPTY_VAR = { color_style: '', size: '', price: '', stock: '0' }
  const [newVar,   setNewVar]   = useState(EMPTY_VAR)
  const [saving,   setSaving]   = useState(false)
  const [editVar,  setEditVar]  = useState(null) // id being edited inline

  function fv(k, v) { setNewVar(p => ({ ...p, [k]: v })) }

  async function addVariant() {
    if (!newVar.color_style.trim() || !newVar.size.trim() || !newVar.price) return
    setSaving(true)
    const payload = {
      color_style: newVar.color_style.trim(),
      size:        newVar.size.trim(),
      price:       parseFloat(newVar.price),
      stock:       parseInt(newVar.stock) || 0,
      sort_order:  variants.length,
      is_active:   true,
    }
    try {
      if (productId) {
        // Generate UUID client-side — same ID used in DB and local state
        // This means remove/update always find the right row, no read-back needed
        const variantId = crypto.randomUUID()
        const { error } = await supabase
          .from('product_variants')
          .insert({ ...payload, product_id: productId, id: variantId })
        if (error) {
          alert('Error saving variant: ' + error.message)
          return
        }
        // Add to local state with the EXACT same ID that's now in the DB
        setVariants(prev => [
          ...prev,
          { ...payload, product_id: productId, id: variantId }
        ])
      } else {
        // Temp state — product not yet in DB (should not happen in phase 2)
        setVariants(prev => {
          const next = [...prev, { ...payload, id: `temp_${Date.now()}` }]
          variantsRef.current = next
          return next
        })
      }
      setNewVar(EMPTY_VAR)
    } catch (err) {
      alert('Error saving variant: ' + (err.message || 'Unknown error. Please try again.'))
    } finally {
      // ALWAYS resets — button never gets permanently stuck disabled
      setSaving(false)
    }
  }

  async function removeVariant(id) {
    if (!id.startsWith('temp_') && productId) {
      await supabase.from('product_variants').delete().eq('id', id)
    }
    setVariants(prev => prev.filter(v => v.id !== id))
  }

  async function updateVariantStock(id, stock) {
    const qty = parseInt(stock) || 0
    setVariants(prev => prev.map(v => v.id === id ? { ...v, stock: qty } : v))
    if (!id.startsWith('temp_') && productId) {
      await supabase.from('product_variants').update({ stock: qty }).eq('id', id)
    }
  }

  return (
    <div className="space-y-4 border-t border-parchment-dark pt-4">
      <div className="flex items-center gap-2">
        <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/50">👕 T-Shirt Variants</p>
        <span className="font-raleway text-xs text-mahogany/30">— each combo of style/color + size is one variant</span>
      </div>

      {/* Existing variants */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 px-2">
            {['Style / Color','Size','Price','Stock',''].map(h => (
              <p key={h} className="font-raleway text-xs text-mahogany/40 uppercase tracking-wider">{h}</p>
            ))}
          </div>
          {variants.map(v => (
            <div key={v.id} className="grid grid-cols-5 gap-2 items-center bg-parchment px-2 py-2">
              <p className="font-lora text-sm text-mahogany">{v.color_style}</p>
              <p className="font-cinzel text-sm text-mahogany">{v.size}</p>
              <p className="font-cinzel text-sm text-gold">${Number(v.price).toFixed(2)}</p>
              <input type="number" min="0" value={v.stock}
                onChange={e => updateVariantStock(v.id, e.target.value)}
                className="input-field text-sm py-1 w-full"/>
              <button type="button" onClick={() => removeVariant(v.id)}
                className="text-mahogany/30 hover:text-red-500 transition-colors text-center">
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new variant row */}
      <div className="bg-white border border-parchment-dark p-3 space-y-3">
        <p className="font-raleway text-xs uppercase tracking-wider text-mahogany/50">Add Variant</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-raleway text-xs text-mahogany/40 block mb-1">Style / Color *</label>
            <input value={newVar.color_style} onChange={e => fv('color_style', e.target.value)}
              className="input-field text-sm" placeholder="Indian, Black Eagle, Purple..."/>
          </div>
          <div>
            <label className="font-raleway text-xs text-mahogany/40 block mb-1">Size *</label>
            <input value={newVar.size} onChange={e => fv('size', e.target.value)}
              className="input-field text-sm" placeholder="S, M, L, XL, 2XL, Youth M..."/>
          </div>
          <div>
            <label className="font-raleway text-xs text-mahogany/40 block mb-1">Price ($) *</label>
            <input type="number" step="0.01" min="0" value={newVar.price} onChange={e => fv('price', e.target.value)}
              className="input-field text-sm" placeholder="35.00"/>
          </div>
          <div>
            <label className="font-raleway text-xs text-mahogany/40 block mb-1">Stock *</label>
            <input type="number" min="0" value={newVar.stock} onChange={e => fv('stock', e.target.value)}
              className="input-field text-sm" placeholder="10"/>
          </div>
        </div>
        <button type="button" onClick={addVariant} disabled={saving || !newVar.color_style.trim() || !newVar.size.trim() || !newVar.price}
          className="btn-outline text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-40">
          {saving ? <><div className="w-3 h-3 border border-mahogany border-t-transparent rounded-full animate-spin"/>Adding...</> : '+ Add Variant'}
        </button>
      </div>

      {variants.length === 0 && (
        <p className="font-raleway text-xs text-amber-600">⚠️ Add at least one variant so customers can order this shirt.</p>
      )}
    </div>
  )
}

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
  const [deleteConfirm,   setDeleteConfirm]   = useState(null)
  const [variants,        setVariants]        = useState([])
  const variantsRef = useRef([])  // Always current — avoids stale closure in handleSave
  const [editProductId,   setEditProductId]   = useState(null)
  const [variantPhase,    setVariantPhase]    = useState(false)  // true = product saved, now add variants
  const [productTypes,    setProductTypes]    = useState([])
  const [collections,     setCollections]     = useState([])

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/admin/login'); return }
      await Promise.all([loadProducts(), loadProductTypes()])
    }
    check()
  }, [navigate])

  async function loadVariants(productId) {
    if (!productId) { setVariants([]); return }
    const { data } = await supabase.from('product_variants')
      .select('*').eq('product_id', productId).eq('is_active', true)
      .order('sort_order', { ascending: true })
    setVariants(data || [])
  }

  async function loadProductTypes() {
    const [{ data: types }, { data: cols }] = await Promise.all([
      supabase.from('product_types').select('*').order('sort_order', { ascending: true }),
      supabase.from('collections').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    ])
    setProductTypes(types || [])
    setCollections(cols || [])
  }

  async function loadProducts() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setEditProductId(null)
    variantsRef.current = []
    setVariants([])
    setPendingImages([])
    setPreviewUrls([])
    setExistingImages([])
    setShowForm(true)
  }

  function openEdit(product) {
    setForm({
      name: product.name || '',
      collection: product.collection || 'Standard',
      product_type: product.product_type || 'candle',
      description: product.description || '',
      scent_notes: product.scent_notes || '',
      price: String(product.price || ''),
      size_oz: String(product.size_oz || '7'),
      stock: String(product.stock || ''),
      is_active: product.is_active ?? true,
    })
    setEditId(product.id)
    setEditProductId(product.id)
    setVariantPhase(false)
    loadVariants(product.id)
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
    const isVariantProduct = form.product_type && form.product_type.includes('tshirt')
    if (!form.name || !form.price || (!isVariantProduct && !form.stock)) {
      alert('Name and price are required.' + (!isVariantProduct ? ' Stock is also required.' : ''))
      return
    }
    setSaving(true)

    const productId = editId || crypto.randomUUID()
    const allImages = await uploadImages(productId)

    const payload = {
      name: form.name,
      collection: form.collection,
      product_type: form.product_type || 'candle',
      description: form.description,
      scent_notes: form.scent_notes,
      price: parseFloat(form.price),
      size_oz: isVariantProduct ? 0 : parseFloat(form.size_oz),
      stock: isVariantProduct ? 0 : parseInt(form.stock),
      has_variants: isVariantProduct,
      is_active: form.is_active,
      images: allImages,
      updated_at: new Date().toISOString()
    }

    let error
    if (editId) {
      ;({ error } = await supabase.from('products').update(payload).eq('id', editId))
    } else {
      // productId = editProductId pre-generated in openNew
      ;({ error } = await supabase.from('products').insert({ ...payload, id: productId }))
    }

    if (error) {
      alert('Error saving product: ' + error.message)
    } else {
      await loadProducts()
      if (isVariantProduct && !editId) {
        // Phase 1 complete for NEW t-shirt — keep modal open for variants
        setEditId(productId)
        setEditProductId(productId)
        setVariants([])
        variantsRef.current = []
        setVariantPhase(true)
      } else {
        // Non-variant product, or editing existing — close normally
        setShowForm(false)
        setVariantPhase(false)
      }
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
          + Add New Product
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-mahogany/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
            <div className="bg-cream w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-parchment-dark bg-mahogany">
                <h2 className="font-cinzel font-bold text-gold tracking-wide">
                  {variantPhase ? 'Add Variants' : editId ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-cream/50 hover:text-cream transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {variantPhase ? (
                /* ── PHASE 2: Product saved — add variants ── */
                <div className="p-6 space-y-5">
                  <div className="bg-teal/10 border border-teal/30 px-4 py-3 flex items-center gap-3">
                    <svg className="w-5 h-5 text-teal-dark shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-cinzel text-sm font-semibold text-mahogany">Product saved!</p>
                      <p className="font-raleway text-xs text-mahogany/60 mt-0.5">Now add your sizes and styles below. Each one saves instantly.</p>
                    </div>
                  </div>

                  <VariantsEditor
                    productId={editProductId}
                    variants={variants}
                    setVariants={setVariants}
                    variantsRef={variantsRef}
                  />

                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setVariantPhase(false) }}
                    className="btn-gold w-full"
                  >
                    Done
                  </button>
                </div>
              ) : (
              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* Name + Collection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Product Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                      className="input-field" placeholder="e.g. Moonwind" required />
                  </div>
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Collection</label>
                    <select value={form.collection} onChange={e => setForm(p => ({...p, collection: e.target.value}))} className="input-field">
                      {collections.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Product Type</label>
                    <select value={form.product_type} onChange={e => setForm(p => ({...p, product_type: e.target.value}))} className="input-field">
                      {productTypes.map(t => (
                        <option key={t.slug} value={t.slug}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price + Size + Stock — hide size/stock for t-shirt variants */}
                {form.product_type && form.product_type.includes('tshirt') ? (
                  <div className="max-w-48">
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Base Price ($) *</label>
                    <input value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))}
                      type="number" step="0.01" min="0" className="input-field" placeholder="35.00" required />
                    <p className="font-raleway text-xs text-mahogany/30 mt-1">Each variant can have its own price below</p>
                  </div>
                ) : (
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
                )}

                {/* ── VARIANTS SECTION — only when EDITING existing t-shirt ── */}
                {editId && form.product_type && form.product_type.includes('tshirt') && (
                  <VariantsEditor
                    productId={editProductId}
                    variants={variants}
                    setVariants={setVariants}
                    variantsRef={variantsRef}
                  />
                )}

                {/* Description */}
                <div>
                  <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                    className="input-field h-24 resize-none" placeholder="Describe this product..." />
                </div>

                {/* Scent Notes — hidden for t-shirt products */}
                {!(form.product_type && form.product_type.includes('tshirt')) && (
                  <div>
                    <label className="font-raleway text-xs uppercase tracking-wider text-mahogany/50 block mb-1">Scent Notes</label>
                    <input value={form.scent_notes} onChange={e => setForm(p => ({...p, scent_notes: e.target.value}))}
                      className="input-field" placeholder="Cedar, Vanilla, Warm Amber..." />
                  </div>
                )}

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
                    ) : (editId ? 'Save Changes' : 'Save Product')}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">
                    Cancel
                  </button>
                </div>
              </form>
              )}
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

        {/* Low Stock Banner */}
        {products.filter(p => p.stock <= 5 && p.is_active && !p.has_variants).length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="font-cinzel text-sm font-semibold text-amber-800 mb-1">Low Stock Alert</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {products.filter(p => p.stock <= 5 && p.is_active && !p.has_variants).map(p => (
                  <span key={p.id}
                    className={`font-raleway text-xs px-3 py-1 border ${
                      p.stock === 0
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-amber-50 border-amber-300 text-amber-700'
                    }`}>
                    {p.name} — {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                  </span>
                ))}
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
            <button onClick={openNew} className="btn-gold mt-4">Add Your First Product</button>
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
                      <p className={`font-raleway text-xs font-semibold ${
                        product.has_variants
                          ? 'text-teal-dark'
                          : product.stock === 0
                          ? 'text-red-500'
                          : product.stock <= 3
                          ? 'text-red-400'
                          : product.stock <= 10
                          ? 'text-amber-500'
                          : 'text-mahogany/40'
                      }`}>
                        {product.has_variants
                          ? 'Variants'
                          : product.stock === 0
                          ? 'Out of Stock'
                          : product.stock <= 3
                          ? `Only ${product.stock} left!`
                          : product.stock <= 10
                          ? `Low: ${product.stock}`
                          : `Stock: ${product.stock}`
                        }
                      </p>
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
