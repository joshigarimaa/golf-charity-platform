'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Winner = {
  id: string
  match_type: string
  prize_amount: number
  proof_url: string | null
  verification_status: string
  payment_status: string
  created_at: string
  profiles: { full_name: string; email: string } | null
  draws: { draw_date: string } | null
}

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const supabase = createClient()

  const fetchWinners = async () => {
    const { data } = await supabase
      .from('winners')
      .select('*, profiles(full_name, email), draws(draw_date)')
      .order('created_at', { ascending: false })
    if (data) setWinners(data as Winner[])
  }

  useEffect(() => { fetchWinners() }, [])

  const updateVerification = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('winners').update({ verification_status: status }).eq('id', id)
    fetchWinners()
  }

  const updatePayment = async (id: string) => {
    await supabase.from('winners').update({ payment_status: 'paid' }).eq('id', id)
    fetchWinners()
  }

  const filtered = filter === 'all' ? winners : winners.filter(w => w.verification_status === filter)

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-500/20 text-green-400'
    if (status === 'rejected') return 'bg-red-500/20 text-red-400'
    return 'bg-yellow-500/20 text-yellow-400'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Winners & Verification</h1>
        <p className="text-gray-400 mt-1">Review proof submissions and manage payouts</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl p-4 text-left transition-all border ${
              filter === s
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-800 bg-gray-900 hover:border-gray-700'
            }`}
          >
            <p className="text-gray-400 text-xs capitalize">{s === 'all' ? 'Total Winners' : s}</p>
            <p className="text-2xl font-bold text-white mt-1">
              {s === 'all'
                ? winners.length
                : winners.filter(w => w.verification_status === s).length}
            </p>
          </button>
        ))}
      </div>

      {/* Winners table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {filter === 'all' ? 'All Winners' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Winners`}
            <span className="text-gray-500 font-normal text-sm ml-2">({filtered.length})</span>
          </h2>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {filtered.map((winner) => (
              <div key={winner.id} className="px-6 py-5 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-white font-bold">
                        {winner.profiles?.full_name || 'Unknown'}
                      </p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        winner.match_type === '5-match'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : winner.match_type === '4-match'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {winner.match_type}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(winner.verification_status)}`}>
                        {winner.verification_status}
                      </span>
                      {winner.payment_status === 'paid' && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                          Paid
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{winner.profiles?.email}</p>
                    <p className="text-gray-500 text-xs">
                      Draw: {winner.draws?.draw_date
                        ? new Date(winner.draws.draw_date).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })
                        : '—'}
                    </p>
                    {winner.proof_url && (
                      <a
                        href={winner.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs inline-block mt-1"
                      >
                        📎 View proof →
                      </a>
                    )}
                  </div>

                  <div className="text-right space-y-3 shrink-0">
                    <p className="text-green-400 font-bold text-xl">
                      £{Number(winner.prize_amount).toFixed(2)}
                    </p>

                    {winner.verification_status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateVerification(winner.id, 'approved')}
                          className="bg-green-500 hover:bg-green-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateVerification(winner.id, 'rejected')}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {winner.verification_status === 'approved' && winner.payment_status === 'pending' && (
                      <button
                        onClick={() => updatePayment(winner.id)}
                        className="bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-gray-400">No winners found</p>
            <p className="text-gray-500 text-sm mt-1">Run and publish a draw to generate winners</p>
          </div>
        )}
      </div>
    </div>
  )
}