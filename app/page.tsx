import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: featuredCharities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(4)

  const displayCharities = (featuredCharities && featuredCharities.length > 0)
    ? featuredCharities
    : [
        { name: 'Cancer Research UK', description: 'Leading cancer research organisation' },
        { name: 'British Heart Foundation', description: 'Fighting heart and circulatory diseases' },
        { name: 'Macmillan Cancer Support', description: 'Support for people living with cancer' },
        { name: 'Age UK', description: 'Support for older people across the UK' },
      ]

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold">⛳ GolfCharity</span>
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

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          Play Golf · Win Prizes · Change Lives
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
          Golf that gives
          <span className="block text-green-400">back.</span>
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Subscribe, enter your Stableford scores, and compete in monthly prize draws — while supporting the charity closest to your heart.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors">
            Start your subscription →
          </Link>
          <Link href="#how-it-works" className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-4 rounded-xl text-lg transition-colors">
            How it works
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-800 py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '£40K+', label: 'Prize pool distributed' },
            { value: '2,400+', label: 'Active golfers' },
            { value: '12', label: 'Charity partners' },
            { value: '£18K+', label: 'Donated to charity' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-black text-green-400">{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black">How it works</h2>
          <p className="text-gray-400 mt-3 text-lg">Three simple steps to play, win, and give.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              icon: '💳',
              title: 'Subscribe',
              desc: 'Choose a monthly or yearly plan. A portion of every subscription goes straight to your chosen charity.',
            },
            {
              step: '02',
              icon: '⛳',
              title: 'Enter your scores',
              desc: 'Log your latest Stableford scores after each round. Your last 5 scores are always kept on file.',
            },
            {
              step: '03',
              icon: '🎰',
              title: 'Win the draw',
              desc: 'Each month a draw matches your scores against winning numbers. 3, 4 or 5 matches wins a prize.',
            },
          ].map((item) => (
            <div key={item.step} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 relative overflow-hidden">
              <span className="absolute top-6 right-6 text-6xl font-black text-gray-800">{item.step}</span>
              <span className="text-4xl mb-4 block">{item.icon}</span>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prize pool */}
      <section className="bg-gray-900 border-y border-gray-800 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black">Monthly Prize Pool</h2>
            <p className="text-gray-400 mt-3 text-lg">Every subscriber contributes. Every match wins.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { match: '5-Number Match', share: '40%', color: 'green', note: 'Jackpot — rolls over if unclaimed' },
              { match: '4-Number Match', share: '35%', color: 'blue', note: 'Split equally among winners' },
              { match: '3-Number Match', share: '25%', color: 'purple', note: 'Split equally among winners' },
            ].map((tier) => (
              <div key={tier.match} className={`rounded-2xl p-8 border text-center ${
                tier.color === 'green' ? 'border-green-500/40 bg-green-500/5' :
                tier.color === 'blue' ? 'border-blue-500/40 bg-blue-500/5' :
                'border-purple-500/40 bg-purple-500/5'
              }`}>
                <p className={`text-5xl font-black mb-3 ${
                  tier.color === 'green' ? 'text-green-400' :
                  tier.color === 'blue' ? 'text-blue-400' : 'text-purple-400'
                }`}>{tier.share}</p>
                <p className="text-white font-bold text-lg">{tier.match}</p>
                <p className="text-gray-400 text-sm mt-2">{tier.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charity section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-block bg-pink-500/10 border border-pink-500/30 text-pink-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Charity First
            </div>
            <h2 className="text-4xl font-black leading-tight mb-6">
              Every subscription <span className="text-green-400">funds a cause</span> you believe in.
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              At signup, you choose a charity from our directory. A minimum of 10% of your subscription goes directly to them — and you can choose to give more.
            </p>
            <ul className="space-y-3">
              {[
                'Choose from our verified charity directory',
                'Set your own contribution percentage (10–100%)',
                'Make independent donations anytime',
                'Track your total impact in your dashboard',
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-gray-300">
                  <span className="text-green-400 mt-0.5">✓</span>
                  {point}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="inline-block mt-8 bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-colors">
              Choose your charity →
            </Link>
          </div>

          {/* Featured charities from DB */}
          <div className="grid grid-cols-2 gap-4">
            {displayCharities.map((charity) => (
              <div key={charity.name} className="bg-gray-900 border border-gray-800 hover:border-green-500/40 rounded-xl p-5 text-center transition-colors">
                <span className="text-3xl block mb-2">🤝</span>
                <p className="text-white text-sm font-medium">{charity.name}</p>
                {charity.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{charity.description}</p>
                )}
                {'is_featured' in charity && charity.is_featured && (
                  <span className="text-green-400 text-xs mt-2 block">⭐ Featured</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charity directory CTA */}
      <section className="border-y border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-white">Explore all our charity partners</h3>
            <p className="text-gray-400 mt-1">Browse our full directory and find a cause that matters to you</p>
          </div>
          <Link href="/charities" className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
            View all charities →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-br from-green-500/20 to-blue-500/10 border border-green-500/20 rounded-3xl p-16">
          <h2 className="text-5xl font-black mb-6">
            Ready to play with <span className="text-green-400">purpose?</span>
          </h2>
          <p className="text-gray-400 text-xl mb-10 max-w-xl mx-auto">
            Join thousands of golfers competing for prizes while supporting the causes that matter most.
          </p>
          <Link href="/signup" className="inline-block bg-green-500 hover:bg-green-400 text-black font-black px-10 py-5 rounded-xl text-xl transition-colors">
            Subscribe now — it takes 2 minutes
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-500 text-sm">
        <p>© 2026 GolfCharity · Built with purpose · <Link href="/login" className="hover:text-gray-300 transition-colors">Admin login</Link></p>
      </footer>

    </main>
  )
}