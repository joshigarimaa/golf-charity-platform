import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: activeSubCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active')

  const { count: drawCount } = await supabase
    .from('draws')
    .select('*', { count: 'exact', head: true })

  const { count: pendingWinners } = await supabase
    .from('winners')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
        <p className="text-gray-400 mt-1">Platform summary at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-white mt-1">{userCount ?? 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Active Subscribers</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{activeSubCount ?? 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Draws Run</p>
          <p className="text-3xl font-bold text-white mt-1">{drawCount ?? 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Pending Verifications</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{pendingWinners ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/admin/draws" className="bg-gray-900 border border-gray-800 hover:border-green-500/50 rounded-xl p-6 transition-colors block">
          <p className="text-2xl mb-2">🎰</p>
          <h3 className="text-white font-bold text-lg">Run a Draw</h3>
          <p className="text-gray-400 text-sm mt-1">Configure, simulate and publish the monthly draw</p>
        </a>
        <a href="/admin/winners" className="bg-gray-900 border border-gray-800 hover:border-yellow-500/50 rounded-xl p-6 transition-colors block">
          <p className="text-2xl mb-2">🏆</p>
          <h3 className="text-white font-bold text-lg">Verify Winners</h3>
          <p className="text-gray-400 text-sm mt-1">Review proof submissions and approve payouts</p>
        </a>
        <a href="/admin/users" className="bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-xl p-6 transition-colors block">
          <p className="text-2xl mb-2">👥</p>
          <h3 className="text-white font-bold text-lg">Manage Users</h3>
          <p className="text-gray-400 text-sm mt-1">View and edit user profiles and subscriptions</p>
        </a>
        <a href="/admin/charities" className="bg-gray-900 border border-gray-800 hover:border-pink-500/50 rounded-xl p-6 transition-colors block">
          <p className="text-2xl mb-2">🤝</p>
          <h3 className="text-white font-bold text-lg">Manage Charities</h3>
          <p className="text-gray-400 text-sm mt-1">Add, edit and feature charities on the platform</p>
        </a>
      </div>
    </div>
  )
}