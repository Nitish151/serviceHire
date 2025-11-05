'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Event } from '@/types';
import { formatDateTimeRange, getStatusBadgeClass, getStatusLabel } from '@/utils/helpers';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

export default function MarketplacePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <MarketplaceContent />
      </Layout>
    </ProtectedRoute>
  );
}

function MarketplaceContent() {
  const [swappableSlots, setSwappableSlots] = useState<Event[]>([]);
  const [mySwappableSlots, setMySwappableSlots] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Event | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsResponse, myEventsResponse] = await Promise.all([
        api.get('/swappable-slots'),
        api.get('/events'),
      ]);

      setSwappableSlots(slotsResponse.data);
      setMySwappableSlots(
        myEventsResponse.data.filter((event: Event) => event.status === 'SWAPPABLE')
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = (slot: Event) => {
    if (mySwappableSlots.length === 0) {
      alert('You need to have at least one swappable slot to request a swap');
      return;
    }
    setSelectedSlot(slot);
    setShowSwapModal(true);
  };

  const handleConfirmSwap = async (mySlotId: string) => {
    if (!selectedSlot) return;

    try {
      await api.post('/swap-request', {
        mySlotId,
        theirSlotId: selectedSlot.id,
      });

      setSuccess('Swap request sent successfully!');
      setShowSwapModal(false);
      setSelectedSlot(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send swap request');
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Marketplace</h1>
        <p className="text-white/90">Browse and request swappable slots from other users</p>
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

      {loading ? (
        <div className="text-center py-10 text-white text-lg">Loading available slots...</div>
      ) : swappableSlots.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No swappable slots available</h3>
          <p className="text-gray-500">Check back later for available slots</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {swappableSlots.map((slot) => (
            <div key={slot.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex-1">{slot.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(slot.status)}`}>
                  {getStatusLabel(slot.status)}
                </span>
              </div>

              <div className="mb-3 text-gray-700">
                <span>👤 <strong>{slot.user?.name}</strong></span>
              </div>

              <div className="text-gray-600 mb-4 text-sm">
                🕐 {formatDateTimeRange(slot.startTime, slot.endTime)}
              </div>

              <button
                onClick={() => handleRequestSwap(slot)}
                className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      {showSwapModal && selectedSlot && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowSwapModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Request Swap</h2>
            <p className="text-gray-600 mb-6">Select one of your swappable slots to offer in exchange:</p>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Their Slot:</h4>
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                <strong className="text-gray-800 block mb-1">{selectedSlot.title}</strong>
                <div className="text-sm text-gray-600">
                  {formatDateTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Swappable Slots:</h4>
              {mySwappableSlots.length === 0 ? (
                <p className="text-gray-500 text-center py-6">You don't have any swappable slots</p>
              ) : (
                <div className="space-y-3">
                  {mySwappableSlots.map((mySlot) => (
                    <div
                      key={mySlot.id}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <strong className="text-gray-800 block mb-1">{mySlot.title}</strong>
                        <div className="text-sm text-gray-600">
                          {formatDateTimeRange(mySlot.startTime, mySlot.endTime)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleConfirmSwap(mySlot.id)}
                        className="ml-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSwapModal(false)}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
