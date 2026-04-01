'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Charity = {
  id: string
  name: string
}

type Event = {
  id: string
  charity_id: string
  title: string
  description: string
  event_date: string
  location: string
  charities?: { name: string }
}

export default function AdminEventsPage() {
  const [charities, setCharities] = useState<Charity[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [charityId, setCharityId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const fetchData = async () => {
    const { data: charitiesData } = await supabase
      .from('charities')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    if (charitiesData) setCharities(charitiesData)

    const { data: eventsData } = await supabase
      .from('charity_events')
      .select('*, charities(name)')
      .order('event_date', { ascending: true })
    if (eventsData) setEvents(eventsData as Event[])
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('charity_events').insert({
      charity_id: charityId,
      title,
      description,
      event_date: eventDate,
      location,
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('✅ Event added!')
      setTitle('')
      setDescription('')
      setEventDate('')
      setLocation('')
      setCharityId('')
      fetchData()
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await supabase.from('charity_events').delete().eq('id', id)
    fetchData()
  }

  const isPast = (date: string) => new Date(date) < new Date()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Charity Events</h1>
          <p className="text-gray-400 mt-1">Manage upcoming golf days and fundraising events</p>
        </div>
        <Link href="/admin/charities" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to charities
        </Link>
      </div>

      {/* Add event form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Add New Event</h2>

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
              <label className="block text-sm font-medium text-gray-300 mb-1">Charity</label>
              <select
                value={charityId}
                onChange={(e) => setCharityId(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
              >
                <option value="">Select a charity...</option>
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Event title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Annual Charity Golf Day"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Event date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Wentworth Club, Surrey"
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
              placeholder="Brief description of the event..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-400 disabled:bg-green-500/50 text-black font-bold px-6 py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Adding...' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>

      {/* Events list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">All Events ({events.length})</h2>
        </div>
        {events.length > 0 ? (
          <div className="divide-y divide-gray-800">
            {events.map((event) => (
              <div key={event.id} className={`px-6 py-5 flex items-start justify-between gap-4 ${isPast(event.event_date) ? 'opacity-50' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <p className="text-white font-bold">{event.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      {event.charities?.name}
                    </span>
                    {isPast(event.event_date) && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Past</span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-gray-400 text-sm">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-gray-500 text-xs mt-1">📍 {event.location}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-white font-bold">
                      {new Date(event.event_date).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-400">No events yet — add one above!</p>
          </div>
        )}
      </div>
    </div>
  )
}