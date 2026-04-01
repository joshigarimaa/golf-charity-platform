'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Charity = {
  id: string
  name: string
  description: string
}

export default function DonatePage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [selectedCharity, setSelectedCharity] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [donations, setDonations] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: charitiesData } = await supabase
        .from('charities')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
      if (charitiesData) setCharities(charitiesData)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: donationsData } = await supabase
        .from('charity_contributions')
        .select('*, charities(name)')
        .eq('user_id', user.id)
        .order('contribution_date', { ascending: false })
      if (donationsData) setDonations(donationsData)
    }
    fetchData()
  }, [])

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess('')

    const amountNum = parseFloat(amount)
    if (amountNum < 1) {
      setMessage('Minimum donation is £1')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('charity_contributions')
      .insert({
        user_id: user.id,
        charity_id: selectedCharity,
        amount: amountNum,
      })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setSuccess(`✅ Thank you! Your donation of £${amountNum.toFixed(2)} has been recorded.`)
      setAmount('')
      setMessage('')

      // Refresh donations
      const { data: donationsData } = await supabase
        .from('charity_contributions')
        .select('*, charities(name)')
        .eq('user_id', user.id)
        .order('contribution_date', { ascending: false })
      if (donationsData) setDonations(donationsData)
    }
    setLoading(false)
  }

  const presetAmounts = [5, 10, 25, 50]
  const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Independent Donation</h1>
        <p className="text-gray-400 mt-1">Make a one-off donation to any charity — not tied to your subscription</p>
      </div>

      {/* Total donated */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total donated</p>
          <p className="text-2xl font-bold text-green-400 mt-1">£{totalDonated.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Number of donations</p>
          <p className="text-2xl font-bold text-white mt-1">{donations.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Charities supported</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {new Set(donations.map(d => d.charity_id)).size}
          </p>
        </div>
      </div>

      {/* Donation form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">Make a Donation</h2>

        {message && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {message}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-4 mb-4 text-sm font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleDonate} className="space-y-6">
          {/* Charity selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Choose a charity</label>
            <select
              value={selectedCharity}
              onChange={(e) => setSelectedCharity(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value="">Select a charity...</option>
              {charities.map((charity) => (
                <option key={charity.id} value={charity.id}>{charity.name}</option>
              ))}
            </select>
          </div>

          {/* Preset amounts */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select amount</label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset.toString())}
                  className={`py-3 rounded-lg font-bold transition-colors ${
                    amount === preset.toString()
                      ? 'bg-green-500 text-black'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  £{preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="0.01"
              placeholder="Or enter custom amount (£)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Leave a message with your donation..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedCharity || !amount}
            className="w-full bg-green-500 hover:bg-green-400 disabled:bg-green-500/30 disabled:cursor-not-allowed text-black font-bold py-4 rounded-xl transition-colors text-lg"
          >
            {loading ? 'Processing...' : `Donate ${amount ? `£${parseFloat(amount).toFixed(2)}` : ''}`}
          </button>
        </form>
      </div>

      {/* Donation history */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Donation History</h2>
        {donations.length > 0 ? (
          <div className="space-y-3">
            {donations.map((donation) => (
              <div key={donation.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-white font-medium">{donation.charities?.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(donation.contribution_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                </div>
                <p className="text-green-400 font-bold">£{Number(donation.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">💝</p>
            <p className="text-gray-400">No donations yet</p>
            <p className="text-gray-500 text-sm mt-1">Make your first independent donation above!</p>
          </div>
        )}
      </div>
    </div>
  )
}