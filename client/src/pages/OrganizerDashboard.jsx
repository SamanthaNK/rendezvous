import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Eye, Heart, TrendingUp, Users, X, AlertCircle } from 'lucide-react';
import { organizerAPI, eventsAPI } from '../services/api';
import Container from '../layouts/Container';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { formatDate } from '../utils/dateHelpers';

const OrganizerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [eventToDelete, setEventToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [publishLoading, setPublishLoading] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [activeTab]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await organizerAPI.getDashboard();
            if (response.data.success) {
                setStats(response.data.data.stats);
            }
        } catch (error) {
            console.error('Fetch dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            setEventsLoading(true);
            let params = {};

            if (activeTab === 'upcoming') {
                params.status = 'published';
            } else if (activeTab === 'draft') {
                params.status = 'draft';
            } else if (activeTab === 'past') {
                params.status = 'past';
            } else if (activeTab === 'cancelled') {
                params.status = 'cancelled';
            }

            const response = await organizerAPI.getEvents(params);
            if (response.data.success) {
                setEvents(response.data.data.events);
            }
        } catch (error) {
            console.error('Fetch events error:', error);
        } finally {
            setEventsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!eventToDelete) return;

        try {
            setDeleteLoading(true);
            await eventsAPI.delete(eventToDelete);
            setEventToDelete(null);
            fetchEvents();
            fetchDashboard();
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete event');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handlePublish = async (eventId) => {
        try {
            setPublishLoading(eventId);
            await eventsAPI.update(eventId, { isDraft: false });
            fetchEvents();
            fetchDashboard();
        } catch (error) {
            console.error('Publish error:', error);
            alert('Failed to publish event');
        } finally {
            setPublishLoading(null);
        }
    };

    const getStatusBadge = (event) => {
        if (event.isDraft) {
            return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Draft</span>;
        }
        if (event.status === 'published') {
            return <span className="px-2 py-1 bg-success/10 text-success text-xs font-semibold rounded-full">Published</span>;
        }
        if (event.status === 'past') {
            return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Past</span>;
        }
        if (event.status === 'cancelled') {
            return <span className="px-2 py-1 bg-error/10 text-error text-xs font-semibold rounded-full">Cancelled</span>;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="pt-20 min-h-screen bg-bright-snow flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="pt-20 min-h-screen bg-bright-snow">
            <Container className="py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-heading text-4xl font-bold text-ink-black mb-2">
                            Dashboard
                        </h1>
                        <p className="font-body text-base text-gray-600">
                            Manage your events and view analytics
                        </p>
                    </div>
                    <Link to="/events/create">
                        <Button variant="primary" size="lg" icon={Plus} iconPosition="left">
                            Create Event
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Calendar className="w-5 h-5 text-teal" />
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black mb-1">
                            {stats?.totalEvents || 0}
                        </p>
                        <p className="font-body text-sm text-gray-600">Total Events</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <TrendingUp className="w-5 h-5 text-success" />
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black mb-1">
                            {stats?.upcomingEvents || 0}
                        </p>
                        <p className="font-body text-sm text-gray-600">Upcoming</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Eye className="w-5 h-5 text-info" />
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black mb-1">
                            {stats?.totalViews || 0}
                        </p>
                        <p className="font-body text-sm text-gray-600">Total Views</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Users className="w-5 h-5 text-dark-amaranth" />
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black mb-1">
                            {stats?.followerCount || 0}
                        </p>
                        <p className="font-body text-sm text-gray-600">Followers</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                            Your Events
                        </h2>
                        <div className="flex gap-2 overflow-x-auto">
                            {['upcoming', 'draft', 'past', 'cancelled'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-md font-body text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab
                                        ? 'bg-teal text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {eventsLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Spinner size="lg" />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-16 px-6">
                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="font-heading text-xl font-bold text-ink-black mb-2">
                                No Events Found
                            </h3>
                            <p className="font-body text-base text-gray-600 mb-6">
                                {activeTab === 'upcoming' && "You don't have any upcoming events"}
                                {activeTab === 'draft' && "You don't have any draft events"}
                                {activeTab === 'past' && "You don't have any past events"}
                                {activeTab === 'cancelled' && "You don't have any cancelled events"}
                            </p>
                            <Link to="/events/create">
                                <Button variant="primary" size="lg">
                                    Create Your First Event
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Event</th>
                                            <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Views</th>
                                            <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Interested</th>
                                            <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {events.map((event) => (
                                            <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {event.images?.[0] && (
                                                            <img src={event.images[0]} alt={event.title} className="w-12 h-12 rounded-md object-cover" />
                                                        )}
                                                        <div>
                                                            <p className="font-body text-sm font-semibold text-ink-black line-clamp-1">{event.title}</p>
                                                            <p className="font-body text-xs text-gray-500">{event.categories?.[0]}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="font-body text-sm text-gray-700">{formatDate(event.date, 'short')}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(event)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="font-body text-sm text-gray-700">{event.metrics?.views || 0}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="font-body text-sm text-gray-700">{event.metrics?.interested || 0}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {event.isDraft && (
                                                            <button
                                                                onClick={() => handlePublish(event._id)}
                                                                disabled={publishLoading === event._id}
                                                                className="font-body text-sm text-success font-semibold hover:underline disabled:opacity-50"
                                                            >
                                                                {publishLoading === event._id ? 'Publishing...' : 'Publish'}
                                                            </button>
                                                        )}
                                                        <Link to={`/events/${event._id}`}>
                                                            <button className="font-body text-sm text-teal font-semibold hover:underline">View</button>
                                                        </Link>
                                                        {(event.isDraft || event.status === 'published') && (
                                                            <Link to={`/events/${event._id}/edit`}>
                                                                <button className="font-body text-sm text-gray-600 font-semibold hover:underline">Edit</button>
                                                            </Link>
                                                        )}
                                                        {!event.isDraft && event.status !== 'cancelled' && (
                                                            <Link to={`/organizer/analytics/${event._id}`}>
                                                                <button className="font-body text-sm text-info font-semibold hover:underline">Analytics</button>
                                                            </Link>
                                                        )}
                                                        <button onClick={() => setEventToDelete(event._id)} className="font-body text-sm text-error font-semibold hover:underline">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="md:hidden divide-y divide-gray-200">
                                {events.map((event) => (
                                    <div key={event._id} className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            {event.images?.[0] && (
                                                <img src={event.images[0]} alt={event.title} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-body text-sm font-semibold text-ink-black mb-1">{event.title}</p>
                                                <p className="font-body text-xs text-gray-500 mb-2">{event.categories?.[0]}</p>
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getStatusBadge(event)}
                                                    <span className="font-body text-xs text-gray-600">{formatDate(event.date, 'short')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                                            <span><Eye className="w-3 h-3 inline mr-1" />{event.metrics?.views || 0}</span>
                                            <span><Heart className="w-3 h-3 inline mr-1" />{event.metrics?.interested || 0}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {event.isDraft && (
                                                <button
                                                    onClick={() => handlePublish(event._id)}
                                                    disabled={publishLoading === event._id}
                                                    className="px-3 py-1 bg-success/10 text-success text-xs font-semibold rounded-md disabled:opacity-50"
                                                >
                                                    {publishLoading === event._id ? 'Publishing...' : 'Publish'}
                                                </button>
                                            )}
                                            <Link to={`/events/${event._id}`}>
                                                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">View</button>
                                            </Link>
                                            {(event.isDraft || event.status === 'published') && (
                                                <Link to={`/events/${event._id}/edit`}>
                                                    <button className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">Edit</button>
                                                </Link>
                                            )}
                                            {!event.isDraft && event.status !== 'cancelled' && (
                                                <Link to={`/organizer/analytics/${event._id}`}>
                                                    <button className="px-3 py-1 bg-info/10 text-info text-xs font-semibold rounded-md">Analytics</button>
                                                </Link>
                                            )}
                                            <button onClick={() => setEventToDelete(event._id)} className="px-3 py-1 bg-error/10 text-error text-xs font-semibold rounded-md">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </Container>

            <Modal isOpen={!!eventToDelete} onClose={() => setEventToDelete(null)} title="Delete Event">
                <div className="flex items-start gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-body text-base text-gray-700">
                            Are you sure you want to delete this event? This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="space-y-3">
                    <Button variant="danger" size="lg" fullWidth onClick={handleDelete} disabled={deleteLoading}>
                        {deleteLoading ? 'Deleting...' : 'Delete Event'}
                    </Button>
                    <Button variant="ghost" size="lg" fullWidth onClick={() => setEventToDelete(null)}>
                        Cancel
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default OrganizerDashboard;