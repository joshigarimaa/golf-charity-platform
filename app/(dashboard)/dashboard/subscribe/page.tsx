'use client'

import { useState } from 'react'

export default function SubscribePage() {
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setLoading(plan)

    const priceId = plan === 'monthly'
      ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, plan }),
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      alert('Something went wrong. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Choose your plan</h1>
        <p className="text-gray-400 mt-1">Subscribe to join the monthly prize draws and support your charity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">

        {/* Monthly */}
        <div className="bg-gray-900 border border-gray-800 hover:border-green-500/50 rounded-2xl p-8 transition-colors">
          <div className="mb-6">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Monthly</p>
            <div className="flex items-end gap-1 mt-2">
              <span className="text-5xl font-black text-white">£10</span>
              <span className="text-gray-400 mb-1">/month</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">Cancel anytime</p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              'Monthly prize draw entry',
              'Enter up to 5 Stableford scores',
              'Support your chosen charity',
              'Access to draw results',
              'Winner verification system',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="text-green-400">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSubscribe('monthly')}
            disabled={loading !== null}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold py-3 rounded-xl transition-colors"
          >
            {loading === 'monthly' ? 'Redirecting...' : 'Subscribe Monthly'}
          </button>
        </div>

        {/* Yearly */}
        <div className="bg-gray-900 border-2 border-green-500 rounded-2xl p-8 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-green-500 text-black text-xs font-black px-4 py-1 rounded-full">
              BEST VALUE — SAVE 20%
            </span>
          </div>

          <div className="mb-6">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Yearly</p>
            <div className="flex items-end gap-1 mt-2">
              <span className="text-5xl font-black text-white">£96</span>
              <span className="text-gray-400 mb-1">/year</span>
            </div>
            <p className="text-green-400 text-sm mt-1">Only £8/month — save £24</p>
          </div>

          <ul className="space-y-3 mb-8">
            {[
              'Everything in Monthly',
              '12 months of draw entries',
              'Priority winner processing',
              'Higher charity impact',
              'Locked-in low price',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="text-green-400">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSubscribe('yearly')}
            disabled={loading !== null}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold py-3 rounded-xl transition-colors"
          >
            {loading === 'yearly' ? 'Redirecting...' : 'Subscribe Yearly'}
          </button>
        </div>
      </div>

      <p className="text-gray-500 text-sm max-w-lg">
        🔒 Payments are processed securely by Stripe. Your card details are never stored on our servers. You can cancel your subscription at any time from your dashboard.
      </p>
    </div>
  )
}