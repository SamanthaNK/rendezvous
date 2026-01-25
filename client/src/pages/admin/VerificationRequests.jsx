import React, { useEffect, useState } from 'react';

// Mock verification requests for testing
const mockRequests = [
  {
    _id: 'vr1',
    organizer: {
      name: 'Acme Events',
      email: 'acme@events.com',
      socialLinks: {
        facebook: 'https://facebook.com/acme',
        instagram: 'https://instagram.com/acme',
      },
      previousEvents: [
        { title: 'Music Fest', rating: 4.5 },
        { title: 'Tech Expo', rating: 4.2 },
      ],
      averageRating: 4.3,
    },
    submittedAt: '2026-01-20T10:00:00Z',
    documents: [
      { name: 'Business License.pdf', url: '#' },
      { name: 'ID Card.jpg', url: '#' },
    ],
    status: 'pending',
  },
  {
    _id: 'vr2',
    organizer: {
      name: 'Jane Smith',
      email: 'jane@smith.com',
      socialLinks: {
        facebook: '',
        instagram: 'https://instagram.com/jane',
      },
      previousEvents: [
        { title: 'Food Carnival', rating: 4.0 },
      ],
      averageRating: 4.0,
    },
    submittedAt: '2026-01-19T15:30:00Z',
    documents: [
      { name: 'ID Card.jpg', url: '#' },
    ],
    status: 'pending',
  },
];

const VerificationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Replace with real API call
    setTimeout(() => {
      setRequests(mockRequests);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold mb-6">Verification Requests</h2>
      {loading ? (
        <div className="p-12 text-center">Loading requests...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left mb-6">
            <thead>
              <tr className="text-gray-500 text-sm">
                <th className="py-2">Organizer</th>
                <th className="py-2">Email</th>
                <th className="py-2">Submitted</th>
                <th className="py-2">Documents</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req._id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{req.organizer.name}</td>
                  <td className="py-2">{req.organizer.email}</td>
                  <td className="py-2">{new Date(req.submittedAt).toLocaleString()}</td>
                  <td className="py-2">
                    {req.documents.map((doc, idx) => (
                      <a key={idx} href={doc.url} className="text-teal underline mr-2" target="_blank" rel="noopener noreferrer">{doc.name}</a>
                    ))}
                  </td>
                  <td className="py-2">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">{req.status}</span>
                  </td>
                  <td className="py-2">
                    <button className="px-3 py-1 bg-teal text-white rounded hover:bg-teal/80 text-xs font-bold" onClick={() => setSelected(req)}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <VerificationModal request={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

const VerificationModal = ({ request, onClose }) => {
  const [decision, setDecision] = useState('approve');
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h3 className="font-heading text-xl font-bold mb-4">Verification Request</h3>
        <div className="mb-3">
          <div className="font-semibold">Organizer:</div>
          <div>{request.organizer.name} ({request.organizer.email})</div>
        </div>
        <div className="mb-3">
          <div className="font-semibold">Documents:</div>
          <ul className="list-disc ml-6">
            {request.documents.map((doc, idx) => (
              <li key={idx}><a href={doc.url} className="text-teal underline" target="_blank" rel="noopener noreferrer">{doc.name}</a></li>
            ))}
          </ul>
        </div>
        <div className="mb-3">
          <div className="font-semibold">Previous Events & Ratings:</div>
          <ul className="list-disc ml-6">
            {request.organizer.previousEvents.map((ev, idx) => (
              <li key={idx}>{ev.title} (Rating: {ev.rating})</li>
            ))}
          </ul>
          <div className="text-sm text-gray-500 mt-1">Average Rating: {request.organizer.averageRating}</div>
        </div>
        <div className="mb-3">
          <div className="font-semibold">Social Media:</div>
          <div className="flex gap-3">
            {request.organizer.socialLinks.facebook && <a href={request.organizer.socialLinks.facebook} className="text-teal underline" target="_blank" rel="noopener noreferrer">Facebook</a>}
            {request.organizer.socialLinks.instagram && <a href={request.organizer.socialLinks.instagram} className="text-teal underline" target="_blank" rel="noopener noreferrer">Instagram</a>}
          </div>
        </div>
        <div className="mb-3">
          <div className="font-semibold mb-1">Decision:</div>
          <select className="border rounded px-2 py-1" value={decision} onChange={e => setDecision(e.target.value)}>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </div>
        <div className="mb-3">
          <div className="font-semibold mb-1">Reason (optional):</div>
          <textarea className="border rounded px-2 py-1 w-full" rows={2} value={reason} onChange={e => setReason(e.target.value)} />
        </div>
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 bg-teal text-white rounded hover:bg-teal/80 font-bold" onClick={onClose}>Submit</button>
          <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 font-bold" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default VerificationRequests;
