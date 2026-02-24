import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-mahogany flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-cinzel text-3xl font-bold text-gold tracking-wider">Native Flame</h1>
          <p className="font-raleway text-xs tracking-widest uppercase text-cream/40 mt-1">Admin Portal</p>
          <div className="w-16 h-px bg-gold/40 mx-auto mt-4" />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="font-raleway text-xs uppercase tracking-wider text-cream/50 block mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-mahogany-light border border-cream/10 px-4 py-3 font-lora text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors"
              placeholder="nativeflamecandles@gmail.com"
              required
            />
          </div>
          <div>
            <label className="font-raleway text-xs uppercase tracking-wider text-cream/50 block mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              className="w-full bg-mahogany-light border border-cream/10 px-4 py-3 font-lora text-cream placeholder-cream/30 focus:outline-none focus:border-gold transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="font-raleway text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                Signing In...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center font-raleway text-xs text-cream/20 mt-8">
          Native Flame Candle Co. · Admin Only
        </p>
      </div>
    </div>
  )
}
