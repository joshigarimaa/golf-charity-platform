'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Charity = {
  id: string
  name: string
  description: string
  image_url: string
  website_url: string
  is_featured: boolean
}

export default function CharityPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null)
  const [currentCharity, setCurrentCharity] = useState<string | null>(null)
  const [percentage, setPercentage] = useState(10)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('charity_id, charity_percentage')
        .eq('id', user.id)
        .single()

      if (profile) {
        setCurrentCharity(profile.charity_id)
        setSelectedCharity(profile.charity_id)
        setPercentage(profile.charity_percentage || 10)
      }

      const { data: charitiesData } = await supabase
        .from('charities')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })

      if (charitiesData) setCharities(charitiesData)
    }

    fetchData()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({
        charity_id: selectedCharity,
        charity_percentage: percentage,
      })
      .eq('id', user.id)

    setCurrentCharity(selectedCharity)
    setSuccess('Charity preferences saved!')
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Choose Your Charity</h1>
        <p className="text-gray-400 mt-1">A portion of your subscription goes directly to your chosen charity</p>
      </div>

      {/* Contribution slider */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Your Contribution</h2>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400 text-sm">Charity contribution</span>
              <span className="text-green-400 font-bold text-lg">{percentage}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value))}
              className="w-full accent-green-500"
            />
            <div className="flex justify-between mt-1">
              <span className="text-gray-500 text-xs">Min 10%</span>
              <span className="text-gray-500 text-xs">Max 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charity list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Select a Charity</h2>

        {charities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {charities.map((charity) => (
              <div
                key={charity.id}
                onClick={() => setSelectedCharity(charity.id)}
                className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${
                  selectedCharity === charity.id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                {charity.is_featured && (
                  <span className="absolute top-3 right-3 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    Featured
                  </span>
                )}
                <h3 className="text-white font-bold text-lg">{charity.name}</h3>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{charity.description}</p>
                {charity.website_url && (
                  <a
                    href={charity.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-green-400 hover:text-green-300 text-xs mt-2 inline-block"
                  >
                    Visit website →
                  </a>
                )}
                {selectedCharity === charity.id && (
                  <div className="absolute top-3 left-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-black text-xs">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🤝</p>
            <p className="text-gray-400">No charities listed yet — check back soon!</p>
          </div>
        )}
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-400 rounded-lg p-3 text-sm">
          {success}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading || !selectedCharity}
        className="bg-green-500 hover:bg-green-400 disabled:bg-green-500/30 disabled:cursor-not-allowed text-black font-bold px-8 py-3 rounded-lg transition-colors"
      >
        {loading ? 'Saving...' : 'Save Charity Preferences'}
      </button>
    </div>
  )
}