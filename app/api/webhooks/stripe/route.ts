// app/api/webhooks/stripe/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.subscription_data?.metadata?.supabase_user_id
        ?? (session as unknown as { metadata: Record<string, string> }).metadata?.supabase_user_id
      const planId  = session.subscription_data?.metadata?.plan_id ?? 'starter'

      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        await supabase.from('subscriptions').update({
          stripe_subscription_id: subscription.id,
          stripe_customer_id:     subscription.customer as string,
          plan_id:                planId,
          status:                 subscription.status,
          current_period_end:     new Date(subscription.current_period_end * 1000).toISOString(),
          max_children:           getPlanMaxChildren(planId),
        }).eq('user_id', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.supabase_user_id

      if (userId) {
        await supabase.from('subscriptions').update({
          status:             subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('stripe_subscription_id', subscription.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase.from('subscriptions').update({
        status:  'canceled',
        plan_id: 'free',
      }).eq('stripe_subscription_id', subscription.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.subscription) {
        await supabase.from('subscriptions').update({
          status: 'past_due',
        }).eq('stripe_subscription_id', invoice.subscription as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

function getPlanMaxChildren(planId: string): number {
  const map: Record<string, number> = { free: 1, starter: 1, family: 3, premium: 5, school: 999 }
  return map[planId] ?? 1
}
