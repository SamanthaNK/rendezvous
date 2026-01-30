import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import { adminAPI } from '../../services/api';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getReports({ status: 'all' });
      if (response.data.success) {
        setReports(response.data.data.reports);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedReport) return;

    const resolution = prompt('Enter resolution notes:');
    if (!resolution) return;

    try {
      setResolving(true);
      await adminAPI.resolveReport(selectedReport._id, { resolution });
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      alert('Failed to resolve: ' + err.message);
    } finally {
      setResolving(false);
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
      <h1 className="font-heading text-4xl font-bold text-ink-black">User Reports</h1>

      {reports.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-body text-base text-gray-600">No reports</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Event</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Reporter</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link to={`/events/${report.event._id}`} className="font-body text-sm font-semibold text-teal hover:underline">
                        {report.event.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-body text-xs font-semibold px-2 py-1 rounded-full bg-dark-amaranth/10 text-dark-amaranth">
                        {report.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-body text-sm text-gray-700">{report.reportedBy.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-body text-xs font-semibold px-2 py-1 rounded-full ${report.status === 'resolved' ? 'bg-success/10 text-success' :
                        report.status === 'investigating' ? 'bg-info/10 text-info' :
                          'bg-warning/10 text-warning'
                        }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {report.status !== 'resolved' && (
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="font-body text-sm text-teal font-semibold hover:underline"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport && (
        <Modal isOpen={true} onClose={() => setSelectedReport(null)} title="Resolve Report">
          <div className="space-y-4">
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Event</p>
              <p className="font-body text-base text-ink-black">{selectedReport.event.title}</p>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Category</p>
              <p className="font-body text-base text-ink-black">{selectedReport.category}</p>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Description</p>
              <p className="font-body text-base text-gray-700">{selectedReport.description}</p>
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-600">Reporter</p>
              <p className="font-body text-base text-ink-black">{selectedReport.reportedBy.name}</p>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleResolve}
                disabled={resolving}
              >
                {resolving ? 'Resolving...' : 'Resolve Report'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminReports;