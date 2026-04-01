import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: analytics } = await supabase
    .from('admin_analytics')
    .select('*')
    .single()

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentDraws } = await supabase
    .from('draws')
    .select('*')
    .order('draw_date', { ascending: false })
    .limit(3)

  const { data: charityTotals } = await supabase
    .from('charity_contributions')
    .select('amount, charities(name)')
    .order('contribution_date', { ascending: false })

  const charityBreakdown = charityTotals?.reduce((acc: Record<string, number>, item) => {
    const name = (item.charities as any)?.name || 'Unknown'
    acc[name] = (acc[name] || 0) + Number(item.amount)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
        <p className="text-gray-400 mt-1">Platform statistics and quick actions</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total users</p>
          <p className="text-3xl font-bold text-white mt-1">{analytics?.total_users || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Active subscribers</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{analytics?.active_subscribers || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Draws published</p>
          <p className="text-3xl font-bold text-white mt-1">{analytics?.total_draws || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Pending verifications</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{analytics?.pending_verifications || 0}</p>
        </div>
      </div>

      {/* Financial stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total prize pool distributed</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            £{Number(analytics?.total_prize_pool || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total charity contributions</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            £{Number(analytics?.total_charity_donations || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total prizes paid out</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            £{Number(analytics?.total_paid_out || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Charity contribution breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Charity Contribution Totals</h2>
        {charityBreakdown && Object.keys(charityBreakdown).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(charityBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([name, total]) => (
                <div key={name} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🤝</span>
                    <span className="text-white font-medium">{name}</span>
                  </div>
                  <span className="text-green-400 font-bold">£{total.toFixed(2)}</span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No charity contributions yet</p>
        )}
      </div>

      {/* Draw statistics */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Draw Statistics</h2>
        {recentDraws && recentDraws.length > 0 ? (
          <div className="space-y-3">
            {recentDraws.map((draw) => (
              <div key={draw.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-white font-medium">
                    {new Date(draw.draw_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-500 text-xs capitalize mt-0.5">{draw.draw_mode} draw</p>
                </div>
                <div className="flex items-center gap-4">
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
        ) : (
          <p className="text-gray-500 text-center py-6">No draws yet</p>
        )}
      </div>

      {/* Recent users */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Signups</h2>
          <a href="/admin/users" className="text-green-400 hover:text-green-300 text-sm">View all →</a>
        </div>
        <div className="space-y-3">
          {recentUsers?.map((user) => (
            <div key={user.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
              <div>
                <p className="text-white font-medium">{user.full_name || '—'}</p>
                <p className="text-gray-500 text-xs">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.subscription_status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {user.subscription_status}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(user.created_at).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/admin/draws" className="bg-gray-900 border border-gray-800 hover:border-green-500/50 rounded-xl p-6 transition-colors block">
          <p className="text-2xl mb-2">🎰</p>
          <h3 className="text-white font-bold text-lg">Run a draw</h3>
          <p className="text-gray-400 text-sm mt-1">Configure, simulate and publish the monthly draw</p>
        </a>
        <a href="/admin/winners" className="bg-gray-900 border border-gray-800 hover:border-yellow-500/50 rounded-xl p-6 transition-colors block">
          <p className="text-2xl mb-2">🏆</p>
          <h3 className="text-white font-bold text-lg">Verify winners</h3>
          <p className="text-gray-400 text-sm mt-1">Review proof submissions and approve payouts</p>
        </a>
        <a href="/admin/users" className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-xl p-6 transition-colors block">
          <p className="text-2xl mb-2">👥</p>
          <h3 className="text-white font-bold text-lg">Manage users</h3>
          <p className="text-gray-400 text-sm mt-1">View and edit user profiles and subscriptions</p>
        </a>
        <a href="/admin/charities" className="bg-gray-900 border border-gray-800 hover:border-pink-500/50 rounded-xl p-6 transition-colors block">
          <p className="text-2xl mb-2">🤝</p>
          <h3 className="text-white font-bold text-lg">Manage charities</h3>
          <p className="text-gray-400 text-sm mt-1">Add, edit and feature charities on the platform</p>
        </a>
      </div>
    </div>
  )
}