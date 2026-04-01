'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type DrawResult = {
  winning_numbers: number[]
  total_pool: number
  jackpot_amount: number
  rolled_over_jackpot: number
  entries: { user_id: string; scores: number[]; match_count: number }[]
}

export default function AdminDrawsPage() {
  const [drawMode, setDrawMode] = useState<'random' | 'weighted'>('random')
  const [simResult, setSimResult] = useState<DrawResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const [previousJackpot, setPreviousJackpot] = useState(0)
  const [pastDraws, setPastDraws] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: draws } = await supabase
        .from('draws')
        .select('*')
        .order('draw_date', { ascending: false })
        .limit(5)

      if (draws) setPastDraws(draws)

      const lastDraw = draws?.[0]
      if (lastDraw?.jackpot_rolled_over) {
        setPreviousJackpot(Number(lastDraw.jackpot_amount))
      }
    }
    fetchData()
  }, [])

  const runSimulation = async () => {
    setLoading(true)
    setMessage('')
    setSimResult(null)

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

    const userScores: Record<string, number[]> = {}
    scores?.forEach(({ user_id, score }) => {
      if (!userScores[user_id]) userScores[user_id] = []
      userScores[user_id].push(score)
    })

    let winningNumbers: number[] = []
    if (drawMode === 'random') {
      const nums = new Set<number>()
      while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1)
      winningNumbers = Array.from(nums)
    } else {
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

    const basePool = profiles.length * 10
    const currentJackpot = (basePool * 0.4) + previousJackpot
    const totalPool = basePool

    const entries = profiles.map((p) => {
      const userScoreList = userScores[p.id] || []
      const matchCount = userScoreList.filter((s) => winningNumbers.includes(s)).length
      return { user_id: p.id, scores: userScoreList, match_count: matchCount }
    })

    setSimResult({
      winning_numbers: winningNumbers,
      total_pool: totalPool,
      jackpot_amount: currentJackpot,
      rolled_over_jackpot: previousJackpot,
      entries,
    })
    setLoading(false)
  }

  const publishDraw = async () => {
    if (!simResult) return
    setPublishing(true)
    setMessage('')

    const today = new Date().toISOString().split('T')[0]
    const hasJackpotWinner = simResult.entries.some(e => e.match_count === 5)
    const jackpotRolledOver = !hasJackpotWinner

    const { data: draw, error } = await supabase
      .from('draws')
      .insert({
        draw_date: today,
        status: 'published',
        draw_mode: drawMode,
        winning_numbers: simResult.winning_numbers,
        total_pool: simResult.total_pool,
        jackpot_amount: simResult.jackpot_amount,
        jackpot_rolled_over: jackpotRolledOver,
      })
      .select()
      .single()

    if (error || !draw) {
      setMessage('Error publishing draw: ' + error?.message)
      setPublishing(false)
      return
    }

    const entries = simResult.entries.map((e) => ({
      draw_id: draw.id,
      user_id: e.user_id,
      scores: e.scores,
      match_count: e.match_count,
      is_winner: e.match_count >= 3,
    }))

    await supabase.from('draw_entries').insert(entries)

    const winnerEntries = simResult.entries.filter((e) => e.match_count >= 3)

    const winners = winnerEntries.map((e) => {
      const matchType = e.match_count === 5 ? '5-match' : e.match_count === 4 ? '4-match' : '3-match'
      const prize = e.match_count === 5
        ? simResult.jackpot_amount
        : e.match_count === 4
        ? simResult.total_pool * 0.35
        : simResult.total_pool * 0.25
      return { draw_id: draw.id, user_id: e.user_id, match_type: matchType, prize_amount: prize }
    })

    if (winners.length > 0) await supabase.from('winners').insert(winners)

    // Send winner emails
    for (const winner of winnerEntries) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', winner.user_id)
        .single()

      if (profile?.email) {
        const matchType = winner.match_count === 5 ? '5-match' : winner.match_count === 4 ? '4-match' : '3-match'
        const prize = winner.match_count === 5
          ? simResult.jackpot_amount
          : winner.match_count === 4
          ? simResult.total_pool * 0.35
          : simResult.total_pool * 0.25

        try {
          await fetch('/api/resend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'winner_alert',
              to: profile.email,
              data: {
                name: profile.full_name || 'Golfer',
                match_type: matchType,
                prize_amount: prize.toFixed(2)
              }
            })
          })
        } catch {
          // Email failure shouldn't block draw publishing
        }
      }
    }

    // Send draw results to all subscribers
    const { data: allSubscribers } = await supabase
      .from('profiles')
      .select('email, full_name, id')
      .eq('subscription_status', 'active')

    for (const subscriber of (allSubscribers || [])) {
      const entry = simResult.entries.find(e => e.user_id === subscriber.id)
      try {
        await fetch('/api/resend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'draw_results',
            to: subscriber.email,
            data: {
              name: subscriber.full_name || 'Golfer',
              winning_numbers: simResult.winning_numbers,
              match_count: entry?.match_count || 0
            }
          })
        })
      } catch {
        // Continue even if email fails
      }
    }

    const rolloverMsg = jackpotRolledOver
      ? ` Jackpot of £${simResult.jackpot_amount.toFixed(2)} rolled over to next month!`
      : ''

    setMessage(`✅ Draw published! ${winners.length} winner(s) found. Emails sent to all subscribers.${rolloverMsg}`)
    setSimResult(null)
    setPreviousJackpot(jackpotRolledOver ? simResult.jackpot_amount : 0)
    setPublishing(false)

    const { data: draws } = await supabase
      .from('draws')
      .select('*')
      .order('draw_date', { ascending: false })
      .limit(5)
    if (draws) setPastDraws(draws)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Draw Engine</h1>
        <p className="text-gray-400 mt-1">Configure, simulate and publish the monthly draw</p>
      </div>

      {previousJackpot > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-yellow-400 font-bold">Jackpot Rolled Over!</p>
            <p className="text-gray-400 text-sm">
              £{previousJackpot.toFixed(2)} carried forward from last month's unclaimed jackpot
            </p>
          </div>
        </div>
      )}

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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-xs">Base Pool</p>
                <p className="text-white font-bold text-xl mt-1">£{simResult.total_pool.toFixed(2)}</p>
              </div>
              {simResult.rolled_over_jackpot > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <p className="text-yellow-400 text-xs">Rolled Over</p>
                  <p className="text-yellow-400 font-bold text-xl mt-1">+£{simResult.rolled_over_jackpot.toFixed(2)}</p>
                </div>
              )}
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-xs">Jackpot (40%{simResult.rolled_over_jackpot > 0 ? ' + rollover' : ''})</p>
                <p className="text-green-400 font-bold text-xl mt-1">£{simResult.jackpot_amount.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-xs">Winners Found</p>
                <p className="text-yellow-400 font-bold text-xl mt-1">
                  {simResult.entries.filter((e) => e.match_count >= 3).length}
                </p>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-3">Match Breakdown</p>
              <div className="space-y-2">
                {[5, 4, 3].map((n) => {
                  const count = simResult.entries.filter((e) => e.match_count === n).length
                  return (
                    <div key={n} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                      <span className="text-white font-medium">{n}-Number Match</span>
                      <div className="flex items-center gap-3">
                        {n === 5 && !count && (
                          <span className="text-yellow-400 text-xs">⚡ Jackpot will roll over</span>
                        )}
                        <span className={`font-bold ${count > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                          {count} winner{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <button
              onClick={publishDraw}
              disabled={publishing}
              className="w-full bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold py-4 rounded-lg transition-colors text-lg"
            >
              {publishing ? 'Publishing & sending emails...' : '🚀 Publish Draw Results'}
            </button>
          </div>
        )}

        {!simResult && !loading && (
          <p className="text-gray-500 text-center py-8">Run a simulation to preview results before publishing</p>
        )}
      </div>

      {pastDraws.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Draws</h2>
          <div className="space-y-3">
            {pastDraws.map((draw) => (
              <div key={draw.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-white font-medium">
                    {new Date(draw.draw_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-500 text-xs capitalize">{draw.draw_mode} draw</p>
                </div>
                <div className="flex items-center gap-3">
                  {draw.jackpot_rolled_over && (
                    <span className="text-yellow-400 text-xs">⚡ Jackpot rolled</span>
                  )}
                  <span className="text-white font-bold">£{Number(draw.total_pool).toFixed(2)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    draw.status === 'published'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {draw.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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