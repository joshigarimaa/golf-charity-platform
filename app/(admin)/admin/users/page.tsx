import { createClient } from '@/lib/supabase/server'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="text-gray-400 mt-1">All registered users on the platform</p>
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
    </div>
  )
}