import { createClient } from '@/lib/supabase/server'

export default async function DrawsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: draws } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('draw_date', { ascending: false })

  const { data: myEntries } = await supabase
    .from('draw_entries')
    .select('*, draws(*)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  const { data: myWins } = await supabase
    .from('winners')
    .select('*, draws(*)')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Monthly Draws</h1>
        <p className="text-gray-400 mt-1">View published draw results and your participation history</p>
      </div>

      {/* My wins */}
      {myWins && myWins.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-green-500/20 border border-yellow-500/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">🏆 Your Winnings</h2>
          <div className="space-y-3">
            {myWins.map((win) => (
              <div key={win.id} className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-3">
                <div>
                  <p className="text-white font-bold">{win.match_type}</p>
                  <p className="text-gray-400 text-sm">
                    {win.draws?.draw_date ? new Date(win.draws.draw_date).toLocaleDateString('en-GB', {
                      month: 'long', year: 'numeric'
                    }) : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-xl">£{Number(win.prize_amount).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    win.payment_status === 'paid'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {win.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published draws */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Published Draw Results</h2>

        {draws && draws.length > 0 ? (
          <div className="space-y-4">
            {draws.map((draw) => (
              <div key={draw.id} className="bg-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">
                      {new Date(draw.draw_date).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-400 text-sm capitalize">{draw.draw_mode} draw</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Total pool</p>
                    <p className="text-white font-bold">£{Number(draw.total_pool).toFixed(2)}</p>
                  </div>
                </div>

                {/* Winning numbers */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-400 text-sm">Winning numbers:</span>
                  {draw.winning_numbers?.map((num: number, i: number) => (
                    <span key={i} className="w-10 h-10 bg-green-500 text-black font-bold rounded-full flex items-center justify-center text-sm">
                      {num}
                    </span>
                  ))}
                </div>

                {/* Jackpot rollover */}
                {draw.jackpot_rolled_over && (
                  <p className="text-yellow-400 text-sm mt-2">⚡ Jackpot rolled over to next month!</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🎰</p>
            <p className="text-gray-400">No draws published yet — check back after the next monthly draw!</p>
          </div>
        )}
      </div>

      {/* My participation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">My Participation History</h2>

        {myEntries && myEntries.length > 0 ? (
          <div className="space-y-3">
            {myEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-white font-medium">
                    {entry.draws?.draw_date ? new Date(entry.draws.draw_date).toLocaleDateString('en-GB', {
                      month: 'long', year: 'numeric'
                    }) : ''}
                  </p>
                  <p className="text-gray-500 text-sm">Scores: {entry.scores?.join(', ')}</p>
                </div>
                <div className="text-right">
                  {entry.is_winner ? (
                    <span className="bg-green-500/20 text-green-400 text-sm px-3 py-1 rounded-full font-medium">
                      🏆 Winner!
                    </span>
                  ) : (
                    <span className="bg-gray-700 text-gray-400 text-sm px-3 py-1 rounded-full">
                      {entry.match_count} matches
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400">You haven&apos;t participated in any draws yet</p>
            <p className="text-gray-500 text-sm mt-1">Subscribe and enter scores to join the next draw</p>
          </div>
        )}
      </div>
    </div>
  )
}
