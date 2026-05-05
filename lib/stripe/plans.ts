// lib/stripe/plans.ts
import type { Plan } from '@/types'

export const PLANS: Plan[] = [
  {
    id:                     'free',
    name:                   'Free',
    price_monthly:          0,
    price_annual:           0,
    max_children:           1,
    features: [
      '1 child',
      'Math & Reading only',
      '10 lessons/month',
      'Basic progress tracking',
    ],
    stripe_price_id_monthly: '',
    stripe_price_id_annual:  '',
  },
  {
    id:                     'starter',
    name:                   'Starter',
    price_monthly:          12,
    price_annual:           99,   // ~$8.25/month
    max_children:           1,
    features: [
      '1 child',
      'All 5 subjects',
      'Unlimited lessons',
      'AI tutor (10 sessions/day)',
      'Progress reports',
      'Streak system',
    ],
    stripe_price_id_monthly: process.env.STRIPE_STARTER_MONTHLY ?? '',
    stripe_price_id_annual:  process.env.STRIPE_STARTER_ANNUAL ?? '',
    is_popular:             false,
  },
  {
    id:                     'family',
    name:                   'Family',
    price_monthly:          25,
    price_annual:           199,  // ~$16.58/month
    max_children:           3,
    features: [
      'Up to 3 children',
      'All 5 subjects',
      'Unlimited lessons',
      'Unlimited AI tutor',
      'Weekly parent reports',
      'Progress comparison',
      'Priority support',
    ],
    stripe_price_id_monthly: process.env.STRIPE_FAMILY_MONTHLY ?? '',
    stripe_price_id_annual:  process.env.STRIPE_FAMILY_ANNUAL ?? '',
    is_popular:             true,
  },
  {
    id:                     'premium',
    name:                   'Premium AI',
    price_monthly:          39,
    price_annual:           299,  // ~$24.92/month
    max_children:           5,
    features: [
      'Up to 5 children',
      'All 5 subjects',
      'Unlimited everything',
      'Advanced AI personalization',
      'Printable worksheets',
      'Sleep tracking',
      'Detailed analytics',
      'Early access to new features',
    ],
    stripe_price_id_monthly: process.env.STRIPE_PREMIUM_MONTHLY ?? '',
    stripe_price_id_annual:  process.env.STRIPE_PREMIUM_ANNUAL ?? '',
    is_popular:             false,
  },
]

export function getPlan(planId: string): Plan | undefined {
  return PLANS.find(p => p.id === planId)
}

export function canAddChild(planId: string, currentChildCount: number): boolean {
  const plan = getPlan(planId)
  return !!plan && currentChildCount < plan.max_children
}

export function hasFeature(planId: string, feature: string): boolean {
  const featureMap: Record<string, string[]> = {
    ai_tutor:           ['starter', 'family', 'premium'],
    unlimited_ai:       ['family', 'premium'],
    weekly_reports:     ['family', 'premium'],
    worksheets:         ['premium'],
    sleep_tracking:     ['premium'],
    advanced_analytics: ['premium'],
  }
  return featureMap[feature]?.includes(planId) ?? false
}
