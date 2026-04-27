const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase  = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const sig  = req.headers['stripe-signature']
  const body = req.body

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  // Handle payment success — mark order as paid
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed' })
      .eq('payment_id', pi.id)
  }

  // Handle payment failure — mark as failed
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object
    await supabase
      .from('orders')
      .update({ payment_status: 'unpaid', status: 'cancelled' })
      .eq('payment_id', pi.id)
  }

  res.status(200).json({ received: true })
}
