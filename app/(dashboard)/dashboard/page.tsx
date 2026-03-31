import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })

  const { data: wins } = await supabase
    .from('winners')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Golfer'} 👋
        </h1>
        <p className="text-gray-400 mt-1">Here's your GolfCharity overview</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Subscription</p>
          <p className={`text-xl font-bold mt-1 ${profile?.subscription_status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
            {profile?.subscription_status === 'active' ? '✓ Active' : '✗ Inactive'}
          </p>
          <p className="text-gray-500 text-xs mt-1">{profile?.subscription_plan || 'No plan'}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Scores entered</p>
          <p className="text-xl font-bold text-white mt-1">{scores?.length || 0} / 5</p>
          <p className="text-gray-500 text-xs mt-1">Rolling last 5</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total winnings</p>
          <p className="text-xl font-bold text-green-400 mt-1">
            £{wins?.reduce((sum, w) => sum + Number(w.prize_amount), 0).toFixed(2) || '0.00'}
          </p>
          <p className="text-gray-500 text-xs mt-1">{wins?.length || 0} prizes won</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Charity contribution</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{profile?.charity_percentage || 10}%</p>
          <p className="text-gray-500 text-xs mt-1">Of subscription</p>
        </div>
      </div>

      {/* Recent scores */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Scores</h2>
          <a href="/dashboard/scores" className="text-green-400 hover:text-green-300 text-sm">
            Manage scores →
          </a>
        </div>
        {scores && scores.length > 0 ? (
          <div className="space-y-3">
            {scores.map((score) => (
              <div key={score.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <span className="text-gray-400 text-sm">{new Date(score.played_at).toLocaleDateString('en-GB')}</span>
                <span className="text-white font-bold text-lg">{score.score}</span>
                <span className="text-gray-500 text-sm">Stableford</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No scores yet</p>
            <a href="/dashboard/scores" className="text-green-400 hover:text-green-300 text-sm mt-2 inline-block">
              Add your first score →
            </a>
          </div>
        )}
      </div>

      {/* Subscription banner */}
      {profile?.subscription_status !== 'active' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold">Subscribe to join the draws</h3>
            <p className="text-gray-400 text-sm mt-1">Get access to monthly prize draws and support your favourite charity</p>
          </div>
          <a href="/dashboard/subscribe" className="bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
            Subscribe now
          </a>
        </div>
      )}
    </div>
  )
}