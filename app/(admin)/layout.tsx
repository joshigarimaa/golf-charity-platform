import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-xl font-bold text-white">
              ⛳ GolfCharity
            </Link>
            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/30">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors text-sm">
              Overview
            </Link>
            <Link href="/admin/users" className="text-gray-400 hover:text-white transition-colors text-sm">
              Users
            </Link>
            <Link href="/admin/draws" className="text-gray-400 hover:text-white transition-colors text-sm">
              Draws
            </Link>
            <Link href="/admin/charities" className="text-gray-400 hover:text-white transition-colors text-sm">
              Charities
            </Link>
            <Link href="/admin/winners" className="text-gray-400 hover:text-white transition-colors text-sm">
              Winners
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
              ← User view
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}