'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Score = {
  id: string
  score: number
  played_at: string
}

export default function ScoresPage() {
  const [scores, setScores] = useState<Score[]>([])
  const [newScore, setNewScore] = useState('')
  const [playedAt, setPlayedAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  const fetchScores = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })

    if (data) setScores(data)
  }

  useEffect(() => {
    fetchScores()
  }, [])

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const scoreNum = parseInt(newScore)
    if (scoreNum < 1 || scoreNum > 45) {
      setError('Score must be between 1 and 45')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('scores')
      .insert({
        user_id: user.id,
        score: scoreNum,
        played_at: playedAt,
      })

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Score added successfully!')
      setNewScore('')
      setPlayedAt('')
      fetchScores()
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('scores').delete().eq('id', id)
    fetchScores()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Scores</h1>
        <p className="text-gray-400 mt-1">Enter your Stableford scores — last 5 are kept automatically</p>
      </div>

      {/* Add score form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add New Score</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-400 rounded-lg p-3 mb-4 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleAddScore} className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Stableford Score (1-45)
            </label>
            <input
              type="number"
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              required
              min={1}
              max={45}
              placeholder="e.g. 36"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div className="flex-1 min-w-[140px]">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Date Played
            </label>
            <input
              type="date"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold px-6 py-3 rounded-lg transition-colors"
            >
              {loading ? 'Adding...' : 'Add Score'}
            </button>
          </div>
        </form>
      </div>

      {/* Scores list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Your Scores</h2>
          <span className="text-gray-400 text-sm">{scores.length} / 5 stored</span>
        </div>

        {scores.length > 0 ? (
          <div className="space-y-3">
            {scores.map((score, index) => (
              <div key={score.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm w-6">#{index + 1}</span>
                  <div>
                    <p className="text-white font-bold text-xl">{score.score}</p>
                    <p className="text-gray-500 text-xs">Stableford points</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm">
                    {new Date(score.played_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                  <button
                    onClick={() => handleDelete(score.id)}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⛳</p>
            <p className="text-gray-400">No scores yet — add your first score above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
