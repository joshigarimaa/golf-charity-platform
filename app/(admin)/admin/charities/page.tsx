'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Charity = {
  id: string
  name: string
  description: string
  website_url: string
  is_featured: boolean
  is_active: boolean
}

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const fetchCharities = async () => {
    const { data } = await supabase
      .from('charities')
      .select('*')
      .order('is_featured', { ascending: false })
    if (data) setCharities(data)
  }

  useEffect(() => { fetchCharities() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('charities').insert({
      name,
      description,
      website_url: websiteUrl,
      is_featured: isFeatured,
      is_active: true,
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('✅ Charity added!')
      setName('')
      setDescription('')
      setWebsiteUrl('')
      setIsFeatured(false)
      fetchCharities()
    }
    setLoading(false)
  }

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('charities').update({ is_featured: !current }).eq('id', id)
    fetchCharities()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('charities').update({ is_active: !current }).eq('id', id)
    fetchCharities()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this charity?')) return
    await supabase.from('charities').delete().eq('id', id)
    fetchCharities()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Manage Charities</h1>
        <p className="text-gray-400 mt-1">Add, edit and feature charities on the platform</p>
      </div>

      {/* Add charity form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add New Charity</h2>

        {message && (
          <div className={`rounded-lg p-3 mb-4 text-sm ${
            message.startsWith('✅')
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Charity Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Cancer Research UK"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.org"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the charity..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 accent-green-500"
              />
              <span className="text-gray-300 text-sm">Feature this charity on homepage</span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Adding...' : 'Add Charity'}
            </button>
          </div>
        </form>
      </div>

      {/* Charities list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">All Charities ({charities.length})</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Name</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Description</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Featured</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Active</th>
              <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {charities.length > 0 ? charities.map((charity) => (
              <tr key={charity.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{charity.name}</p>
                  {charity.website_url && (
                    <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 text-xs">
                      Visit →
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm max-w-xs truncate">{charity.description}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleFeatured(charity.id, charity.is_featured)}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                      charity.is_featured
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {charity.is_featured ? '★ Featured' : 'Set featured'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(charity.id, charity.is_active)}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                      charity.is_active
                        ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {charity.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(charity.id)}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No charities yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}