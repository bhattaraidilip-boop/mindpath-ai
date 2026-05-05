'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Card, Button, Spinner } from '@/components/ui'
import { PLANS } from '@/lib/stripe/plans'

export default function SubscriptionPage() {
  const supabase = createClient()

  const [currentPlan, setCurrentPlan] = useState('free')
  const [status, setStatus]           = useState('active')
  const [interval, setInterval]       = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading]         = useState(true)
  const [checkoutLoading, setCheckout] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id, status')
        .eq('user_id', user.id)
        .single()
      setCurrentPlan(sub?.plan_id ?? 'free')
      setStatus(sub?.status ?? 'active')
      setLoading(false)
    }
    load()
  }, [supabase])

  async function startCheckout(planId: string) {
    if (planId === 'free') return
    setCheckout(planId)

    const res = await fetch('/api/subscriptions/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ planId, interval }),
    })
    const json = await res.json()

    if (json.data?.url) {
      window.location.href = json.data.url
    } else {
      setCheckout(null)
    }
  }

  async function openPortal() {
    const res = await fetch('/api/subscriptions/portal', { method: 'POST' })
    const json = await res.json()
    if (json.data?.url) window.location.href = json.data.url
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F8F9FF] flex items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  const savings = (plan: (typeof PLANS)[0]) => {
    if (!plan.price_annual || !plan.price_monthly) return 0
    return Math.round(((plan.price_monthly * 12 - plan.price_annual) / (plan.price_monthly * 12)) * 100)
  }

  return (
    <div className="min-h-dvh bg-[#F8F9FF]">
      <div className="page pt-safe-top">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => window.history.back()} className="text-gray-400 p-1 min-h-0">←</button>
          <h1 className="font-display font-black text-2xl text-gray-900">Choose a Plan</h1>
        </div>

        {/* Current plan status */}
        {currentPlan !== 'free' && (
          <Card className="mb-5 border-l-4 border-l-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">
                  Current: {PLANS.find(p => p.id === currentPlan)?.name} plan
                </p>
                <p className="text-sm text-gray-500 capitalize">{status}</p>
              </div>
              <button
                onClick={openPortal}
                className="text-sm text-brand-600 font-semibold"
              >
                Manage →
              </button>
            </div>
          </Card>
        )}

        {/* Billing toggle */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setInterval('monthly')}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${interval === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('annual')}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${interval === 'annual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
          >
            Annual
            <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
              Save 30%
            </span>
          </button>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {PLANS.map((plan, i) => {
            const isCurrent  = plan.id === currentPlan
            const isPopular  = plan.is_popular
            const price      = interval === 'annual' && plan.price_annual > 0
              ? Math.round(plan.price_annual / 12)
              : plan.price_monthly
            const annualSavings = savings(plan)

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={`relative ${isPopular ? 'border-2 border-brand-400' : ''} ${isCurrent ? 'border-2 border-green-400' : ''}`}>
                  {isPopular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Current Plan
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display font-black text-lg text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.max_children === 999 ? 'School accounts' : `Up to ${plan.max_children} child${plan.max_children > 1 ? 'ren' : ''}`}</p>
                    </div>
                    <div className="text-right">
                      {plan.price_monthly === 0 ? (
                        <p className="font-display font-black text-2xl text-gray-900">Free</p>
                      ) : (
                        <>
                          <p className="font-display font-black text-2xl text-gray-900">
                            ${price}<span className="text-sm font-normal text-gray-400">/mo</span>
                          </p>
                          {interval === 'annual' && annualSavings > 0 && (
                            <p className="text-xs text-green-600 font-semibold">Save {annualSavings}%</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-green-500 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="w-full bg-green-50 text-green-700 font-bold rounded-xl py-3 text-center text-sm">
                      ✓ Current plan
                    </div>
                  ) : plan.id === 'free' ? (
                    <div className="w-full bg-gray-100 text-gray-500 font-bold rounded-xl py-3 text-center text-sm">
                      Free forever
                    </div>
                  ) : (
                    <Button
                      variant={isPopular ? 'primary' : 'secondary'}
                      fullWidth
                      loading={checkoutLoading === plan.id}
                      onClick={() => startCheckout(plan.id)}
                    >
                      {plan.id === 'school' ? 'Contact us' : `Start 7-day free trial`}
                    </Button>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Trust signals */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-400">🔒 Secured by Stripe · Cancel anytime</p>
          <p className="text-xs text-gray-400">7-day free trial on all paid plans · No credit card needed to start</p>
          <p className="text-xs text-gray-400">COPPA compliant · Child-safe platform</p>
        </div>

      </div>
    </div>
  )
}
