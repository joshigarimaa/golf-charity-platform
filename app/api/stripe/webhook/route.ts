import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.supabase_user_id
    const plan = session.metadata?.plan

    if (userId) {
      const renewalDate = new Date()
      if (plan === 'monthly') {
        renewalDate.setMonth(renewalDate.getMonth() + 1)
      } else {
        renewalDate.setFullYear(renewalDate.getFullYear() + 1)
      }

      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_plan: plan,
        stripe_subscription_id: session.subscription as string,
        subscription_renewal_date: renewalDate.toISOString(),
      }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase.from('profiles').update({
      subscription_status: 'cancelled',
      stripe_subscription_id: null,
    }).eq('stripe_subscription_id', subscription.id)
  }

  return NextResponse.json({ received: true })
}