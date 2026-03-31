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
  draws: { draw_date: string } | null
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const fetchWinners = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('winners')
      .select('*, draws(draw_date)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setWinners(data as Winner[])
  }

  useEffect(() => { fetchWinners() }, [])

  const handleProofUpload = async (winnerId: string, file: File) => {
    setUploading(winnerId)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt = file.name.split('.').pop()
    const filePath = `proofs/${user.id}/${winnerId}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setMessage('Upload error: ' + uploadError.message)
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('winner-proofs')
      .getPublicUrl(filePath)

    await supabase
      .from('winners')
      .update({ proof_url: publicUrl })
      .eq('id', winnerId)

    setMessage('✅ Proof uploaded successfully! Admin will review shortly.')
    setUploading(null)
    fetchWinners()
  }

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (status === 'rejected') return 'bg-red-500/20 text-red-400 border-red-500/30'
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">My Winnings</h1>
        <p className="text-gray-400 mt-1">Upload proof and track your prize payouts</p>
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

      {winners.length > 0 ? (
        <div className="space-y-4">
          {winners.map((winner) => (
            <div key={winner.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                      winner.match_type === '5-match'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : winner.match_type === '4-match'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-gray-700 text-gray-300 border-gray-600'
                    }`}>
                      🏆 {winner.match_type}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${statusColor(winner.verification_status)}`}>
                      {winner.verification_status === 'pending' ? '⏳ Pending review' :
                       winner.verification_status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                    </span>
                    {winner.payment_status === 'paid' && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        💸 Paid
                      </span>
                    )}
                  </div>

                  <p className="text-gray-400 text-sm">
                    Draw date: {winner.draws?.draw_date
                      ? new Date(winner.draws.draw_date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })
                      : '—'}
                  </p>
                </div>

                <p className="text-green-400 font-black text-3xl">
                  £{Number(winner.prize_amount).toFixed(2)}
                </p>
              </div>

              {/* Proof upload section */}
              <div className="mt-5 pt-5 border-t border-gray-800">
                {winner.proof_url ? (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <span>✓</span>
                      <span>Proof uploaded</span>
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={winner.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        View proof →
                      </a>
                      {winner.verification_status !== 'approved' && (
                        <label className="text-gray-400 hover:text-white text-sm cursor-pointer transition-colors">
                          Replace
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleProofUpload(winner.id, file)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-white text-sm font-medium">Upload proof of your score</p>
                      <p className="text-gray-500 text-xs mt-0.5">Screenshot from your golf platform (image or PDF)</p>
                    </div>
                    <label className={`cursor-pointer px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
                      uploading === winner.id
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-400 text-black'
                    }`}>
                      {uploading === winner.id ? 'Uploading...' : '📎 Upload proof'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        disabled={uploading === winner.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleProofUpload(winner.id, file)
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
          <p className="text-5xl mb-4">🏆</p>
          <p className="text-white font-bold text-lg">No winnings yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Enter your scores and participate in the monthly draw to win prizes!
          </p>
          <a href="/dashboard/scores" className="inline-block mt-6 bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-lg transition-colors text-sm">
            Enter scores →
          </a>
        </div>
      )}
    </div>
  )
}