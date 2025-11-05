'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Event } from '@/types';
import { formatDateTimeRange, getStatusBadgeClass, getStatusLabel } from '@/utils/helpers';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <DashboardContent />
      </Layout>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/events', {
        title,
        startTime,
        endTime,
        status: 'BUSY',
      });

      setSuccess('Event created successfully!');
      setTitle('');
      setStartTime('');
      setEndTime('');
      setShowForm(false);
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleToggleSwappable = async (eventId: string, currentStatus: string) => {
    if (currentStatus === 'SWAP_PENDING') {
      alert('Cannot modify an event with pending swap request');
      return;
    }

    const newStatus = currentStatus === 'BUSY' ? 'SWAPPABLE' : 'BUSY';

    try {
      await api.put(`/events/${eventId}`, { status: newStatus });
      setSuccess(`Event marked as ${newStatus === 'SWAPPABLE' ? 'swappable' : 'busy'}!`);
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await api.delete(`/events/${eventId}`);
      setSuccess('Event deleted successfully!');
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete event');
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">My Calendar</h1>
        <p className="text-white/90">Manage your events and mark them as swappable</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg border border-green-200 text-sm mb-4">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Events</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            {showForm ? 'Cancel' : '+ New Event'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateEvent} className="space-y-4 border-t pt-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g., Team Meeting"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Create Event
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-white text-lg">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No events yet</h3>
          <p className="text-gray-500">Create your first event to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex-1">{event.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(event.status)}`}>
                  {getStatusLabel(event.status)}
                </span>
              </div>

              <div className="text-gray-600 mb-4 text-sm">
                🕐 {formatDateTimeRange(event.startTime, event.endTime)}
              </div>

              <div className="flex flex-col gap-2">
                {event.status !== 'SWAP_PENDING' && (
                  <>
                    <button
                      onClick={() => handleToggleSwappable(event.id, event.status)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        event.status === 'SWAPPABLE'
                          ? 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      {event.status === 'SWAPPABLE' ? 'Mark as Busy' : 'Make Swappable'}
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
                {event.status === 'SWAP_PENDING' && (
                  <p className="text-blue-600 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                    This event has a pending swap request
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
