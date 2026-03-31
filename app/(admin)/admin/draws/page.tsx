'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type DrawResult = {
  winning_numbers: number[]
  total_pool: number
  jackpot_amount: number
  entries: { user_id: string; scores: number[]; match_count: number }[]
}

export default function AdminDrawsPage() {
  const [drawMode, setDrawMode] = useState<'random' | 'weighted'>('random')
  const [simResult, setSimResult] = useState<DrawResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const runSimulation = async () => {
    setLoading(true)
    setMessage('')
    setSimResult(null)

    // Fetch all active subscribers and their scores
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active')

    const { data: scores } = await supabase
      .from('scores')
      .select('user_id, score')

    if (!profiles || profiles.length === 0) {
      setMessage('No active subscribers found.')
      setLoading(false)
      return
    }

    // Build per-user score arrays
    const userScores: Record<string, number[]> = {}
    scores?.forEach(({ user_id, score }) => {
      if (!userScores[user_id]) userScores[user_id] = []
      userScores[user_id].push(score)
    })

    // Generate winning numbers
    let winningNumbers: number[] = []
    if (drawMode === 'random') {
      const nums = new Set<number>()
      while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1)
      winningNumbers = Array.from(nums)
    } else {
      // Weighted: favour most frequently submitted scores
      const freq: Record<number, number> = {}
      scores?.forEach(({ score }) => { freq[score] = (freq[score] || 0) + 1 })
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
      const pool = sorted.map(([n]) => parseInt(n))
      const nums = new Set<number>()
      let i = 0
      while (nums.size < 5 && i < pool.length) { nums.add(pool[i]); i++ }
      while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1)
      winningNumbers = Array.from(nums)
    }

    // Calculate prize pool (£10 per active subscriber, 40/35/25 split)
    const totalPool = profiles.length * 10
    const jackpotAmount = totalPool * 0.4

    // Score each entry
    const entries = profiles.map((p) => {
      const userScoreList = userScores[p.id] || []
      const matchCount = userScoreList.filter((s) => winningNumbers.includes(s)).length
      return { user_id: p.id, scores: userScoreList, match_count: matchCount }
    })

    setSimResult({ winning_numbers: winningNumbers, total_pool: totalPool, jackpot_amount: jackpotAmount, entries })
    setLoading(false)
  }

  const publishDraw = async () => {
    if (!simResult) return
    setPublishing(true)
    setMessage('')

    const today = new Date().toISOString().split('T')[0]

    const { data: draw, error } = await supabase
      .from('draws')
      .insert({
        draw_date: today,
        status: 'published',
        draw_mode: drawMode,
        winning_numbers: simResult.winning_numbers,
        total_pool: simResult.total_pool,
        jackpot_amount: simResult.jackpot_amount,
      })
      .select()
      .single()

    if (error || !draw) {
      setMessage('Error publishing draw: ' + error?.message)
      setPublishing(false)
      return
    }

    // Insert draw entries and winners
    const entries = simResult.entries.map((e) => ({
      draw_id: draw.id,
      user_id: e.user_id,
      scores: e.scores,
      match_count: e.match_count,
      is_winner: e.match_count >= 3,
    }))

    await supabase.from('draw_entries').insert(entries)

    const winners = simResult.entries
      .filter((e) => e.match_count >= 3)
      .map((e) => {
        const matchType = e.match_count === 5 ? '5-match' : e.match_count === 4 ? '4-match' : '3-match'
        const prize = e.match_count === 5
          ? simResult.total_pool * 0.4
          : e.match_count === 4
          ? simResult.total_pool * 0.35
          : simResult.total_pool * 0.25
        return { draw_id: draw.id, user_id: e.user_id, match_type: matchType, prize_amount: prize }
      })

    if (winners.length > 0) await supabase.from('winners').insert(winners)

    setMessage(`✅ Draw published! ${winners.length} winner(s) found.`)
    setSimResult(null)
    setPublishing(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Draw Engine</h1>
        <p className="text-gray-400 mt-1">Configure, simulate and publish the monthly draw</p>
      </div>

      {/* Config */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Draw Configuration</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setDrawMode('random')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              drawMode === 'random'
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🎲 Random Draw
          </button>
          <button
            onClick={() => setDrawMode('weighted')}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              drawMode === 'weighted'
                ? 'bg-green-500 text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            📊 Weighted (by score frequency)
          </button>
        </div>
      </div>

      {/* Simulate */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Simulation</h2>
          <button
            onClick={runSimulation}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white font-bold px-6 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Simulating...' : '▶ Run Simulation'}
          </button>
        </div>

        {simResult && (
          <div className="space-y-6">
            {/* Winning numbers */}
            <div>
              <p className="text-gray-400 text-sm mb-3">Winning Numbers</p>
              <div className="flex gap-3">
                {simResult.winning_numbers.map((n, i) => (
                  <span key={i} className="w-12 h-12 bg-green-500 text-black font-bold rounded-full flex items-center justify-center text-lg">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Pool breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-xs">Total Pool</p>
                <p className="text-white font-bold text-xl mt-1">£{simResult.total_pool.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-xs">Jackpot (40%)</p>
                <p className="text-green-400 font-bold text-xl mt-1">£{(simResult.total_pool * 0.4).toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-xs">Winners Found</p>
                <p className="text-yellow-400 font-bold text-xl mt-1">
                  {simResult.entries.filter((e) => e.match_count >= 3).length}
                </p>
              </div>
            </div>

            {/* Matches */}
            <div>
              <p className="text-gray-400 text-sm mb-3">Match Breakdown</p>
              <div className="space-y-2">
                {[5, 4, 3].map((n) => {
                  const count = simResult.entries.filter((e) => e.match_count === n).length
                  return (
                    <div key={n} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                      <span className="text-white font-medium">{n}-Number Match</span>
                      <span className={`font-bold ${count > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                        {count} winner{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Publish button */}
            <button
              onClick={publishDraw}
              disabled={publishing}
              className="w-full bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold py-4 rounded-lg transition-colors text-lg"
            >
              {publishing ? 'Publishing...' : '🚀 Publish Draw Results'}
            </button>
          </div>
        )}

        {!simResult && !loading && (
          <p className="text-gray-500 text-center py-8">Run a simulation to preview results before publishing</p>
        )}
      </div>

      {message && (
        <div className={`rounded-lg p-4 text-sm font-medium ${
          message.startsWith('✅')
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}