import { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { adminAPI } from '../../services/api';

const AdminVerificationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getVerificationRequests({ status: 'pending' });
      if (response.data.success) {
        setRequests(response.data.data.requests);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      await adminAPI.approveVerification(selectedRequest._id, { badge: 'verified' });
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert('Approval failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    const suggestions = prompt('Improvement suggestions (optional):') || '';

    try {
      setProcessing(true);
      await adminAPI.rejectVerification(selectedRequest._id, { reason, suggestions });
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert('Rejection failed: ' + err.message);
    } finally {
      setProcessing(false);
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
      <h1 className="font-heading text-4xl font-bold text-ink-black">Verification Requests</h1>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-body text-base text-gray-600">No pending verification requests</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Organization</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-body text-sm font-semibold text-ink-black">{request.organizationName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-body text-sm text-gray-700">{request.contactPerson.fullName}</p>
                      <p className="font-body text-xs text-gray-500">{request.contactPerson.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-body text-sm text-gray-700">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedRequest(request)}
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

      {selectedRequest && (
        <Modal isOpen={true} onClose={() => setSelectedRequest(null)} title="Verification Request" size="lg">
          <div className="space-y-4">
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Organization Name</p>
              <p className="font-body text-base text-ink-black">{selectedRequest.organizationName}</p>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Contact Person</p>
              <p className="font-body text-base text-ink-black">{selectedRequest.contactPerson.fullName}</p>
              <p className="font-body text-sm text-gray-600">{selectedRequest.contactPerson.email}</p>
              <p className="font-body text-sm text-gray-600">{selectedRequest.contactPerson.phone}</p>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Physical Address</p>
              <p className="font-body text-base text-gray-700">{selectedRequest.physicalAddress}</p>
            </div>
            {selectedRequest.previousEvents && (
              <div>
                <p className="font-body text-sm font-semibold text-gray-600">Previous Events</p>
                <p className="font-body text-base text-gray-700">{selectedRequest.previousEvents}</p>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleApprove}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Approve Verification'}
              </Button>
              <Button
                variant="danger"
                size="lg"
                fullWidth
                onClick={handleReject}
                disabled={processing}
              >
                Reject Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminVerificationRequests;