import React, { useEffect, useState } from 'react';
import { userAPI } from '../../services/api';

// Mock flagged events data for testing
const mockFlaggedEvents = [
  {
    _id: 'evt1',
    title: 'Suspicious Event',
    organizer: { name: 'John Doe', _id: 'org1' },
    date: '2026-01-20',
    status: 'pending',
    flags: [
      { reason: 'AI: Inappropriate content', confidence: 0.92 },
      { reason: 'User report: Spam', confidence: null },
    ],
    metrics: { views: 120, saves: 10 },
  },
  {
    _id: 'evt2',
    title: 'Fake Giveaway',
    organizer: { name: 'Jane Smith', _id: 'org2' },
    date: '2026-01-18',
    status: 'pending',
    flags: [
      { reason: 'User report: Scam', confidence: null },
    ],
    metrics: { views: 80, saves: 2 },
  },
];

const FlaggedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with real API call:
    // userAPI.getFlaggedEvents().then(...)
    setTimeout(() => {
      setEvents(mockFlaggedEvents);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) return <div className="p-12 text-center">Loading flagged events...</div>;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Flagged Events</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-500 text-sm">
              <th className="py-2">Event</th>
              <th className="py-2">Organizer</th>
              <th className="py-2">Date</th>
              <th className="py-2">Flags</th>
              <th className="py-2">Views</th>
              <th className="py-2">Saves</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev._id} className="border-b last:border-0">
                <td className="py-2 font-medium">{ev.title}</td>
                <td className="py-2">{ev.organizer.name}</td>
                <td className="py-2">{ev.date}</td>
                <td className="py-2">
                  {ev.flags.map((flag, idx) => (
                    <div key={idx} className="mb-1">
                      <span className="inline-block bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded text-xs font-semibold mr-2">
                        {flag.reason}
                        {flag.confidence !== null && (
                          <span className="ml-1 text-gray-500">({Math.round(flag.confidence * 100)}%)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </td>
                <td className="py-2">{ev.metrics.views}</td>
                <td className="py-2">{ev.metrics.saves}</td>
                <td className="py-2">
                  <button className="px-3 py-1 bg-teal text-white rounded hover:bg-teal/80 text-xs font-bold">Moderate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FlaggedEvents;
