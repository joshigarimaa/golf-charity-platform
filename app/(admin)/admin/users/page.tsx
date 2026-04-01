import { createClient } from '@/lib/supabase/server'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: allScores } = await supabase
    .from('scores')
    .select('*')
    .order('played_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="text-gray-400 mt-1">All registered users and their scores</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Name</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Email</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Role</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Subscription</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Plan</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? users.map((user) => (
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
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(user.created_at).toLocaleDateString('en-GB')}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User scores section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">All User Scores</h2>
        {users && users.map((user) => {
          const userScores = allScores?.filter(s => s.user_id === user.id) || []
          if (userScores.length === 0) return null
          return (
            <div key={user.id} className="mb-6 last:mb-0">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-white font-medium">{user.full_name || user.email}</p>
                <span className="text-gray-500 text-sm">({userScores.length} scores)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {userScores.map((score) => (
                  <div key={score.id} className="bg-gray-800 rounded-lg px-3 py-2 text-center">
                    <p className="text-white font-bold text-lg">{score.score}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(score.played_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {(!allScores || allScores.length === 0) && (
          <p className="text-gray-500 text-center py-8">No scores entered yet</p>
        )}
      </div>
    </div>
  )
}