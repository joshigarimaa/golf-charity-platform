import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CharityProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: charity } = await supabase
    .from('charities')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!charity) notFound()

  const { data: supporters } = await supabase
    .from('profiles')
    .select('id')
    .eq('charity_id', charity.id)

  const { data: events } = await supabase
    .from('charity_events')
    .select('*')
    .eq('charity_id', charity.id)
    .gte('event_date', new Date().toISOString().split('T')[0])
    .order('event_date', { ascending: true })

  const { data: contributions } = await supabase
    .from('charity_contributions')
    .select('amount')
    .eq('charity_id', charity.id)

  const totalContributed = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">⛳ GolfCharity</Link>
          <div className="flex items-center gap-4">
            <Link href="/charities" className="text-gray-400 hover:text-white text-sm transition-colors">
              ← All charities
            </Link>
            <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors">
              Support this charity
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-5xl">🤝</span>
                {charity.is_featured && (
                  <span className="bg-green-500/20 text-green-400 text-sm font-bold px-3 py-1 rounded-full border border-green-500/30">
                    ⭐ Featured Charity
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">{charity.name}</h1>
              <p className="text-gray-400 text-xl leading-relaxed max-w-2xl">{charity.description}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-3xl font-black text-green-400">{supporters?.length || 0}</p>
            <p className="text-gray-400 text-sm mt-1">GolfCharity supporters</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-3xl font-black text-blue-400">10%+</p>
            <p className="text-gray-400 text-sm mt-1">Of every subscription</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-3xl font-black text-purple-400">£{totalContributed.toFixed(2)}</p>
            <p className="text-gray-400 text-sm mt-1">Total contributed</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-3xl font-black text-amber-400">{events?.length || 0}</p>
            <p className="text-gray-400 text-sm mt-1">Upcoming events</p>
          </div>
        </div>

        {/* About */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">About {charity.name}</h2>
          <p className="text-gray-400 leading-relaxed text-lg">{charity.description}</p>
          {charity.website_url && (
            <a
              href={charity.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Visit official website →
            </a>
          )}
        </div>

        {/* Upcoming events */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">⛳ Upcoming Golf Events</h2>
          {events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{event.title}</h3>
                      {event.description && (
                        <p className="text-gray-400 text-sm mt-1 leading-relaxed">{event.description}</p>
                      )}
                      {event.location && (
                        <p className="text-gray-500 text-sm mt-2">
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="bg-green-500/20 border border-green-500/30 rounded-xl px-4 py-3 text-center">
                        <p className="text-green-400 font-black text-2xl">
                          {new Date(event.event_date).getDate()}
                        </p>
                        <p className="text-green-400 text-sm font-medium">
                          {new Date(event.event_date).toLocaleDateString('en-GB', {
                            month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-gray-400">No upcoming events scheduled</p>
              <p className="text-gray-500 text-sm mt-1">Check back soon for golf days and fundraising events</p>
            </div>
          )}
        </div>

        {/* How contributions work */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">How your contribution works</h2>
          <div className="space-y-4">
            {[
              { step: '01', title: 'You subscribe', desc: 'Choose a monthly (£10) or yearly (£96) plan on GolfCharity' },
              { step: '02', title: 'You choose', desc: `Select ${charity.name} as your chosen charity at signup or in your dashboard` },
              { step: '03', title: 'We contribute', desc: 'A minimum of 10% of your subscription goes directly to this charity every month' },
              { step: '04', title: 'You give more', desc: 'You can increase your contribution percentage anytime from your dashboard' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <span className="bg-green-500 text-black font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {item.step}
                </span>
                <div>
                  <p className="text-white font-bold">{item.title}</p>
                  <p className="text-gray-400 text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-green-500/20 to-blue-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-black mb-4">Support {charity.name}</h2>
          <p className="text-gray-400 mb-8">
            Subscribe to GolfCharity and choose this charity — play golf, win prizes, and make a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 rounded-xl transition-colors">
              Subscribe & support →
            </Link>
            <Link href="/charities" className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-4 rounded-xl transition-colors">
              View all charities
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-500 text-sm mt-16">
        <p>© 2026 GolfCharity · <Link href="/" className="hover:text-gray-300">Home</Link> · <Link href="/charities" className="hover:text-gray-300">Charities</Link></p>
      </footer>
    </main>
  )
}