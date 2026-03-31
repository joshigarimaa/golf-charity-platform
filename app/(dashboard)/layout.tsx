import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            ⛳ GolfCharity
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
              Dashboard
            </Link>
            <Link href="/dashboard/scores" className="text-gray-400 hover:text-white transition-colors text-sm">
              My Scores
            </Link>
            <Link href="/dashboard/charity" className="text-gray-400 hover:text-white transition-colors text-sm">
              Charity
            </Link>
            <Link href="/dashboard/draws" className="text-gray-400 hover:text-white transition-colors text-sm">
              Draws
            </Link>
            <Link href="/dashboard/winners" className="text-gray-400 hover:text-white transition-colors text-sm">
              Winnings
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">{profile?.full_name || user.email}</span>
              <form action="/api/auth/signout" method="POST">
                <button className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      {/* Page content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}