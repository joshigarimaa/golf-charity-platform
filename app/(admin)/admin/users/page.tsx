'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  full_name: string
  email: string
  role: string
  subscription_status: string
  subscription_plan: string
  created_at: string
}

type Score = {
  id: string
  user_id: string
  score: number
  played_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [allScores, setAllScores] = useState<Score[]>([])
  const [editingScore, setEditingScore] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const fetchData = async () => {
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (usersData) setUsers(usersData)

    const { data: scoresData } = await supabase
      .from('scores')
      .select('*')
      .order('played_at', { ascending: false })
    if (scoresData) setAllScores(scoresData)
  }

  useEffect(() => { fetchData() }, [])

  const handleEditScore = async (scoreId: string) => {
    const newScore = parseInt(editValue)
    if (newScore < 1 || newScore > 45) {
      setMessage('Score must be between 1 and 45')
      return
    }

    const { error } = await supabase
      .from('scores')
      .update({ score: newScore })
      .eq('id', scoreId)

    if (error) {
      setMessage('Error updating score: ' + error.message)
    } else {
      setMessage('✅ Score updated successfully!')
      setEditingScore(null)
      setEditValue('')
      fetchData()
    }

    setTimeout(() => setMessage(''), 3000)
  }

  const handleDeleteScore = async (scoreId: string) => {
    if (!confirm('Delete this score?')) return
    await supabase.from('scores').delete().eq('id', scoreId)
    fetchData()
  }

  const handleUpdateSubscription = async (userId: string, status: string) => {
    await supabase
      .from('profiles')
      .update({ subscription_status: status })
      .eq('id', userId)
    fetchData()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="text-gray-400 mt-1">Manage users, subscriptions and scores</p>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm font-medium ${
          message.startsWith('✅')
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message}
        </div>
      )}

      {/* Users table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">All Users ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Name</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Email</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Role</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Subscription</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Plan</th>
                <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{user.full_name || '—'}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      user.role === 'admin'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      user.subscription_status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {user.subscription_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm capitalize">{user.subscription_plan || '—'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.subscription_status}
                      onChange={(e) => handleUpdateSubscription(user.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-green-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="lapsed">Lapsed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User scores with inline editing */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">User Scores — Inline Edit</h2>
        {users.map((user) => {
          const userScores = allScores.filter(s => s.user_id === user.id)
          if (userScores.length === 0) return null
          return (
            <div key={user.id} className="mb-8 last:mb-0">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-white font-medium">{user.full_name || user.email}</p>
                <span className="text-gray-500 text-sm">({userScores.length} scores)</span>
              </div>
              <div className="space-y-2">
                {userScores.map((score) => (
                  <div key={score.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <span className="text-gray-400 text-sm">
                      {new Date(score.played_at).toLocaleDateString('en-GB')}
                    </span>

                    {editingScore === score.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          min={1}
                          max={45}
                          className="w-20 bg-gray-700 border border-green-500 rounded-lg px-2 py-1 text-white text-center focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditScore(score.id)}
                          className="bg-green-500 hover:bg-green-400 text-black text-xs font-bold px-3 py-1 rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingScore(null); setEditValue('') }}
                          className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold text-xl">{score.score}</span>
                        <span className="text-gray-500 text-xs">Stableford</span>
                        <button
                          onClick={() => { setEditingScore(score.id); setEditValue(score.score.toString()) }}
                          className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteScore(score.id)}
                          className="text-red-400 hover:text-red-300 text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {allScores.length === 0 && (
          <p className="text-gray-500 text-center py-8">No scores entered yet</p>
        )}
      </div>
    </div>
  )
}