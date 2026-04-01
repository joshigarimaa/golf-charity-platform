import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CharitiesPage() {
  const supabase = await createClient()

  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">⛳ GolfCharity</Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-pink-500/10 border border-pink-500/30 text-pink-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Our Charity Partners
          </div>
          <h1 className="text-5xl font-black mb-4">Causes that <span className="text-green-400">matter.</span></h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Every subscription supports one of these incredible organisations. Choose the cause closest to your heart.
          </p>
        </div>

        {/* Featured charities */}
        {charities && charities.some(c => c.is_featured) && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">⭐ Featured Charities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {charities.filter(c => c.is_featured).map((charity) => (
                <Link
                  href={`/charities/${charity.id}`}
                  key={charity.id}
                  className="bg-gray-900 border-2 border-green-500/40 hover:border-green-500 rounded-2xl p-8 relative block transition-colors"
                >
                  <span className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
                    ⭐ Featured
                  </span>
                  <span className="text-4xl block mb-4">🤝</span>
                  <h3 className="text-xl font-bold text-white mb-2">{charity.name}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{charity.description}</p>
                  <div className="flex items-center gap-4">
                    {charity.website_url && (
                      <span className="text-green-400 text-sm">
                        Visit website →
                      </span>
                    )}
                    <span className="bg-green-500 text-black font-bold px-4 py-2 rounded-lg text-sm">
                      View profile →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All charities */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">All Charities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {charities && charities.map((charity) => (
              <Link
                href={`/charities/${charity.id}`}
                key={charity.id}
                className="bg-gray-900 border border-gray-800 hover:border-green-500/40 rounded-xl p-6 transition-colors block"
              >
                <span className="text-3xl block mb-3">🤝</span>
                <h3 className="text-white font-bold text-lg mb-2">{charity.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">{charity.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 text-xs">View profile →</span>
                  {charity.is_featured && (
                    <span className="text-green-400 text-xs">⭐ Featured</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-br from-green-500/20 to-blue-500/10 border border-green-500/20 rounded-3xl p-12">
          <h2 className="text-3xl font-black mb-4">Ready to make a difference?</h2>
          <p className="text-gray-400 mb-8">Subscribe today and choose the charity you want to support.</p>
          <Link href="/signup" className="inline-block bg-green-500 hover:bg-green-400 text-black font-black px-8 py-4 rounded-xl text-lg transition-colors">
            Get started →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-500 text-sm mt-16">
        <p>© 2026 GolfCharity · <Link href="/" className="hover:text-gray-300 transition-colors">Home</Link> · <Link href="/login" className="hover:text-gray-300 transition-colors">Sign in</Link></p>
      </footer>

    </main>
  )
}