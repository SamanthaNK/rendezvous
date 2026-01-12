import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Calendar, Eye, Heart, FileText, CheckCircle } from 'lucide-react';
import { eventsAPI } from '../services/api';
import Container from '../layouts/Container';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { formatDate } from '../utils/dateHelpers';
import EmptyState from '../components/common/EmptyState';

const OrganizerDashboard = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        drafts: 0,
        totalViews: 0,
    });
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchEvents();
    }, [activeTab]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            let params = {};

            if (activeTab === 'draft') {
                // For draft, we need to fetch all and filter, or modify backend
                params = {};
            } else if (activeTab !== 'all') {
                params = { status: activeTab };
            }

            const response = await eventsAPI.getMyEvents(params);

            if (response.data.success) {
                let fetchedEvents = response.data.data.events;

                // Filter drafts on frontend if needed
                if (activeTab === 'draft') {
                    fetchedEvents = fetchedEvents.filter(e => e.isDraft);
                } else if (activeTab === 'published') {
                    fetchedEvents = fetchedEvents.filter(e => !e.isDraft && e.status === 'published');
                } else if (activeTab === 'past') {
                    fetchedEvents = fetchedEvents.filter(e => e.status === 'past');
                }

                setEvents(fetchedEvents);

                const published = fetchedEvents.filter(e => !e.isDraft && e.status === 'published').length;
                const drafts = fetchedEvents.filter(e => e.isDraft).length;
                const totalViews = fetchedEvents.reduce((sum, e) => sum + (e.metrics?.views || 0), 0);

                setStats({
                    total: fetchedEvents.length,
                    published,
                    drafts,
                    totalViews,
                });
            }
        } catch (error) {
            console.error('Fetch events error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formattedDate = formatDate(event.date, 'long');

    const getStatusBadge = (event) => {
        if (event.isDraft) {
            return <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">Draft</span>;
        }
        if (event.status === 'published') {
            return <span className="px-3 py-1 bg-success/10 text-success text-xs font-semibold rounded-full">Published</span>;
        }
        if (event.status === 'past') {
            return <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Past</span>;
        }
        if (event.status === 'cancelled') {
            return <span className="px-3 py-1 bg-error/10 text-error text-xs font-semibold rounded-full">Cancelled</span>;
        }
        return null;
    };

    const handlePublish = async (eventId) => {
        if (!window.confirm('Are you sure you want to publish this event?')) {
            return;
        }

        try {
            await eventsAPI.update(eventId, {
                isDraft: false,
                status: 'published',
                publishedAt: new Date(),
            });

            // Refresh events
            fetchEvents();
        } catch (error) {
            console.error('Publish error:', error);
            alert('Failed to publish event. Please try again.');
        }
    };

    return (
        <div className="pt-20 min-h-screen bg-bright-snow">
            <Container className="py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-heading text-4xl font-bold text-ink-black mb-2">
                            Dashboard
                        </h1>
                    </div>
                    <Link to="/events/create">
                        <Button variant="primary" size="lg" icon={Plus} iconPosition="left">
                            Create Event
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-body text-sm text-gray-600">Total Events</p>
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black">
                            {stats.total}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-body text-sm text-gray-600">Published</p>
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black">
                            {stats.published}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-body text-sm text-gray-600">Total Views</p>
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black">
                            {stats.totalViews}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="font-body text-sm text-gray-600">Drafts</p>
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black">
                            {stats.drafts}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                            Your Events
                        </h2>
                        <div className="flex gap-2 overflow-x-auto">
                            {['all', 'published', 'draft', 'past'].map((tab) => (
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

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Spinner size="lg" />
                            </div>
                        ) : events.length === 0 ? (
                            <EmptyState
                                icon={Calendar}
                                title="No Events Found"
                                description={
                                    activeTab === 'all'
                                        ? "You haven't created any events yet"
                                        : `You have no ${activeTab} events`
                                }
                                actionLabel="Create Your First Event"
                                onAction={() => navigate('/events/create')}
                            />
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Event
                                        </th>
                                        <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Views
                                        </th>
                                        <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Interested
                                        </th>
                                        <th className="px-6 py-3 text-left font-body text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {events.map((event) => (
                                        <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {event.images?.[0] && (
                                                        <img
                                                            src={event.images[0]}
                                                            alt={event.title}
                                                            className="w-12 h-12 rounded-md object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-body text-sm font-semibold text-ink-black">
                                                            {event.title}
                                                        </p>
                                                        <p className="font-body text-xs text-gray-500">
                                                            {event.categories?.[0]}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-body text-sm text-gray-700">
                                                    {formattedDate}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(event)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Eye className="w-4 h-4 text-gray-400" />
                                                    <span className="font-body text-sm text-gray-700">
                                                        {event.metrics?.views || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Heart className="w-4 h-4 text-lime-cream fill-lime-cream" />
                                                    <span className="font-body text-sm text-gray-700">
                                                        {event.metrics?.interested || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link to={`/events/${event._id}`}>
                                                        <button className="font-body text-sm text-teal font-semibold hover:underline">
                                                            View
                                                        </button>
                                                    </Link>

                                                    {event.isDraft && (
                                                        <button
                                                            onClick={() => handlePublish(event._id)}
                                                            className="font-body text-sm text-success font-semibold hover:underline"
                                                        >
                                                            Publish
                                                        </button>
                                                    )}

                                                    {(event.isDraft || event.status === 'published') && (
                                                        <Link to={`/events/${event._id}/edit`}>
                                                            <button className="font-body text-sm text-gray-600 font-semibold hover:underline">
                                                                Edit
                                                            </button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default OrganizerDashboard;