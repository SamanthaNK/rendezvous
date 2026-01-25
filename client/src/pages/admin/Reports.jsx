import React, { useEffect, useState } from 'react';

// Mock reports data for testing
const mockReports = [
  {
    _id: 'rep1',
    type: 'scam',
    event: { _id: 'evt1', title: 'Suspicious Event' },
    reportedBy: { name: 'Alice', _id: 'u1' },
    description: 'This event is a scam.',
    createdAt: '2026-01-20T10:00:00Z',
    status: 'pending',
  },
  {
    _id: 'rep2',
    type: 'spam',
    event: { _id: 'evt2', title: 'Fake Giveaway' },
    reportedBy: { name: 'Bob', _id: 'u2' },
    description: 'Spam event.',
    createdAt: '2026-01-19T15:30:00Z',
    status: 'investigating',
  },
  {
    _id: 'rep3',
    type: 'inappropriate',
    event: { _id: 'evt1', title: 'Suspicious Event' },
    reportedBy: { name: 'Carol', _id: 'u3' },
    description: 'Inappropriate content.',
    createdAt: '2026-01-21T09:00:00Z',
    status: 'pending',
  },
];

const typeLabels = {
  scam: 'Scam',
  inappropriate: 'Inappropriate',
  incorrect: 'Incorrect',
  spam: 'Spam',
  duplicate: 'Duplicate',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-700',
};

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with real API call
    setTimeout(() => {
      setReports(mockReports);
      setLoading(false);
    }, 800);
  }, []);

  // Group by event for priority sorting
  const grouped = reports.reduce((acc, r) => {
    acc[r.event._id] = acc[r.event._id] || { event: r.event, reports: [] };
    acc[r.event._id].reports.push(r);
    return acc;
  }, {});
  const sortedGroups = Object.values(grouped).sort((a, b) => b.reports.length - a.reports.length);

  if (loading) return <div className="p-12 text-center">Loading reports...</div>;

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">User Reports</h2>
      {sortedGroups.map((group) => (
        <div key={group.event._id} className="mb-8">
          <div className="font-semibold text-lg mb-2">{group.event.title} <span className="text-sm text-gray-500">({group.reports.length} report{group.reports.length > 1 ? 's' : ''})</span></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left mb-2">
              <thead>
                <tr className="text-gray-500 text-sm">
                  <th className="py-2">Type</th>
                  <th className="py-2">Reporter</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Timestamp</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {group.reports.map((r) => (
                  <tr key={r._id} className="border-b last:border-0">
                    <td className="py-2">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-fuchsia-100 text-fuchsia-700">
                        {typeLabels[r.type] || r.type}
                      </span>
                    </td>
                    <td className="py-2">{r.reportedBy.name}</td>
                    <td className="py-2">{r.description}</td>
                    <td className="py-2">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusColors[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="py-2">
                      {r.status !== 'resolved' && r.status !== 'dismissed' && (
                        <button className="px-3 py-1 bg-teal text-white rounded hover:bg-teal/80 text-xs font-bold">Resolve</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reports;
