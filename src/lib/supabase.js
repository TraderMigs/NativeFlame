import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper: get public URL for a product image stored in Supabase Storage
export function getImageUrl(img) {
  if (!img) return null
  // Accepts either a plain path string (legacy) or a tagged object { path, color }
  const path = typeof img === 'string' ? img : img.path
  if (!path) return null
  if (path.startsWith('http')) return path
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

// Helpers for tagged product images — safe on both legacy strings and objects
export function imgPath(img)  { return typeof img === 'string' ? img : (img?.path ?? null) }
export function imgColor(img) { return typeof img === 'string' ? null : (img?.color ?? null) }
