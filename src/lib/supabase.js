import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper: get public URL for a product image stored in Supabase Storage
// Self-heal: if an image entry is a stringified JSON object (bad legacy write),
// parse it back into a real { path, color } object. Plain paths pass through.
function normalizeImg(img) {
  if (typeof img === 'string' && img.startsWith('{') && img.includes('"path"')) {
    try { return JSON.parse(img) } catch { return img }
  }
  return img
}

export function getImageUrl(img) {
  if (!img) return null
  const n = normalizeImg(img)
  // Accepts either a plain path string (legacy) or a tagged object { path, color }
  const path = typeof n === 'string' ? n : n.path
  if (!path) return null
  if (path.startsWith('http')) return path
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

// Helpers for tagged product images — safe on strings, objects, and stringified objects
export function imgPath(img) {
  const n = normalizeImg(img)
  return typeof n === 'string' ? n : (n?.path ?? null)
}
export function imgColor(img) {
  const n = normalizeImg(img)
  return typeof n === 'string' ? null : (n?.color ?? null)
}
