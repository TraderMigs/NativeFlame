import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const sig     = req.headers['stripe-signature']
  const rawBody = await getRawBody(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed' })
      .eq('payment_id', pi.id)
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object
    await supabase
      .from('orders')
      .update({ payment_status: 'unpaid', status: 'cancelled' })
      .eq('payment_id', pi.id)
  }

  res.status(200).json({ received: true })
}
