'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { SwapRequest } from '@/types';
import { formatDateTimeRange, getStatusBadgeClass, getStatusLabel } from '@/utils/helpers';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

export default function RequestsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RequestsContent />
      </Layout>
    </ProtectedRoute>
  );
}

function RequestsContent() {
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/swap-requests');
      setIncomingRequests(response.data.incoming);
      setOutgoingRequests(response.data.outgoing);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, accepted: boolean) => {
    try {
      await api.post(`/swap-response/${requestId}`, { accepted });
      setSuccess(accepted ? 'Swap request accepted!' : 'Swap request rejected');
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process request');
    }
  };

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2">Swap Requests</h1>
        <p className="text-white/90">Manage your incoming and outgoing swap requests</p>
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
        <div className="text-center py-10 text-white text-lg">Loading requests...</div>
      ) : (
        <div className="space-y-8">
          {/* Incoming Requests */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Incoming Requests</h2>
            {incomingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No incoming swap requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-end mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        👤 From: {request.requester?.name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">They Offer:</h5>
                        <strong className="block text-gray-800 mb-1">{request.mySlot.title}</strong>
                        <div className="text-sm text-gray-600">
                          {formatDateTimeRange(request.mySlot.startTime, request.mySlot.endTime)}
                        </div>
                      </div>

                      <div className="flex items-center justify-center text-4xl text-indigo-600">
                        ⇄
                      </div>

                      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">For Your:</h5>
                        <strong className="block text-gray-800 mb-1">{request.theirSlot.title}</strong>
                        <div className="text-sm text-gray-600">
                          {formatDateTimeRange(request.theirSlot.startTime, request.theirSlot.endTime)}
                        </div>
                      </div>
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleResponse(request.id, true)}
                          className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleResponse(request.id, false)}
                          className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Outgoing Requests</h2>
            {outgoingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No outgoing swap requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-end mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        👤 To: {request.recipient?.name}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">You Offered:</h5>
                        <strong className="block text-gray-800 mb-1">{request.mySlot.title}</strong>
                        <div className="text-sm text-gray-600">
                          {formatDateTimeRange(request.mySlot.startTime, request.mySlot.endTime)}
                        </div>
                      </div>

                      <div className="flex items-center justify-center text-4xl text-indigo-600">
                        ⇄
                      </div>

                      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">For Their:</h5>
                        <strong className="block text-gray-800 mb-1">{request.theirSlot.title}</strong>
                        <div className="text-sm text-gray-600">
                          {formatDateTimeRange(request.theirSlot.startTime, request.theirSlot.endTime)}
                        </div>
                      </div>
                    </div>

                    {request.status === 'PENDING' && (
                      <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-200 text-sm">
                        Waiting for {request.recipient?.name} to respond...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
