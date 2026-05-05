// app/api/subscriptions/checkout/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getPlan } from '@/lib/stripe/plans'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { planId, interval = 'monthly' } = await request.json()
    const plan = getPlan(planId)

    if (!plan || planId === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = interval === 'annual'
      ? plan.stripe_price_id_annual
      : plan.stripe_price_id_monthly

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', user.id)
        .single()

      const customer = await stripe.customers.create({
        email:    userData?.email,
        name:     userData?.full_name,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer:              customerId,
      mode:                  'subscription',
      payment_method_types:  ['card'],
      line_items:            [{ price: priceId, quantity: 1 }],
      success_url:           `${process.env.NEXT_PUBLIC_APP_URL}/parent/dashboard?upgraded=true`,
      cancel_url:            `${process.env.NEXT_PUBLIC_APP_URL}/parent/subscription`,
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan_id: planId },
        trial_period_days: 7,
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ data: { url: session.url }, error: null })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
