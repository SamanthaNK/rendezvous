import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { adminAPI } from '../../services/api';

const AdminFlaggedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [moderating, setModerating] = useState(false);

  useEffect(() => {
    fetchFlaggedEvents();
  }, []);

  const fetchFlaggedEvents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getFlaggedEvents({ sortBy: 'flagConfidenceScore' });
      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (action, reason = '') => {
    if (!selectedEvent) return;

    try {
      setModerating(true);
      await adminAPI.moderateEvent(selectedEvent._id, { action, reason });
      setSelectedEvent(null);
      fetchFlaggedEvents();
    } catch (err) {
      alert('Moderation failed: ' + err.message);
    } finally {
      setModerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-4xl font-bold text-ink-black">Flagged Events</h1>

      {events.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-body text-base text-gray-600">No flagged events</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Event</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Organizer</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Confidence</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/events/${event._id}`} className="font-body text-sm font-semibold text-teal hover:underline">
                        {event.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-body text-sm text-gray-700">{event.organizer.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-body text-sm text-gray-700 line-clamp-2">{event.flagReason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-body text-sm font-bold text-error">
                        {Math.round((event.flagConfidenceScore || 0) * 100)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="font-body text-sm text-teal font-semibold hover:underline"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEvent && (
        <Modal isOpen={true} onClose={() => setSelectedEvent(null)} title="Moderate Event">
          <div className="space-y-4">
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Event Title</p>
              <p className="font-body text-base text-ink-black">{selectedEvent.title}</p>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Organizer</p>
              <p className="font-body text-base text-ink-black">{selectedEvent.organizer.name}</p>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Flag Reason</p>
              <p className="font-body text-base text-gray-700">{selectedEvent.flagReason}</p>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Confidence Score</p>
              <p className="font-body text-base text-error">{Math.round((selectedEvent.flagConfidenceScore || 0) * 100)}%</p>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => handleModerate('approve')}
                disabled={moderating}
              >
                {moderating ? 'Processing...' : 'Approve Event'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => handleModerate('keep-flagged')}
                disabled={moderating}
              >
                Keep Flagged
              </Button>
              <Button
                variant="danger"
                size="lg"
                fullWidth
                onClick={() => {
                  const reason = prompt('Enter removal reason:');
                  if (reason) handleModerate('remove', reason);
                }}
                disabled={moderating}
              >
                Remove Event
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminFlaggedEvents;