import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Heart, Bookmark, TrendingUp, MapPin, Star } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { organizerAPI } from '../services/api';
import Container from '../layouts/Container';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import { formatDate } from '../utils/dateHelpers';

const EventAnalyticsPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (eventId) {
            fetchAnalytics();
        }
    }, [eventId]);


    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await organizerAPI.getEventAnalytics(eventId);
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (err) {
            console.error('Fetch analytics error:', err);
            setError('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="pt-20 min-h-screen bg-bright-snow flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="pt-20 min-h-screen bg-bright-snow">
                <Container className="py-12">
                    <div className="text-center">
                        <h2 className="font-heading text-2xl font-bold text-ink-black mb-4">
                            {error || 'Failed to load analytics'}
                        </h2>
                        <Button variant="primary" size="lg" onClick={() => navigate('/organizer/dashboard')}>
                            Back to Dashboard
                        </Button>
                    </div>
                </Container>
            </div>
        );
    }

    const { event, metrics, viewsOverTime, savesOverTime, interestedOverTime, geographicDistribution, ratings } = data;

    return (
        <div className="pt-20 min-h-screen bg-bright-snow">
            <Container className="py-12">
                <div className="mb-8">
                    <Link to="/organizer/dashboard">
                        <button className="flex items-center gap-2 font-body text-sm text-teal font-semibold hover:underline mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="font-heading text-4xl font-bold text-ink-black mb-2">
                                Event Analytics
                            </h1>
                            <p className="font-body text-base text-gray-600">
                                {event.title}
                            </p>
                            <p className="font-body text-sm text-gray-500 mt-1">
                                {formatDate(event.date, 'long')} • {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </p>
                        </div>
                        <Link to={`/events/${event.id}`}>
                            <Button variant="secondary" size="lg">
                                View Event
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Eye className="w-5 h-5 text-info" />
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black mb-1">
                            {metrics.totalViews.toLocaleString()}
                        </p>
                        <p className="font-body text-sm text-gray-600">Total Views</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Bookmark className="w-5 h-5 text-teal" />
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black mb-1">
                            {metrics.totalSaves.toLocaleString()}
                        </p>
                        <p className="font-body text-sm text-gray-600">Saves</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Heart className="w-5 h-5 text-lime-cream fill-lime-cream" />
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black mb-1">
                            {metrics.totalInterested.toLocaleString()}
                        </p>
                        <p className="font-body text-sm text-gray-600">Interested</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <TrendingUp className="w-5 h-5 text-success" />
                        </div>
                        <p className="font-heading text-3xl font-bold text-ink-black mb-1">
                            {metrics.engagementRate}%
                        </p>
                        <p className="font-body text-sm text-gray-600">Engagement Rate</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-heading text-xl font-bold text-ink-black mb-6">
                            Views Over Time
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={viewsOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                />
                                <Line type="monotone" dataKey="views" stroke="#028090" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-heading text-xl font-bold text-ink-black mb-6">
                            Engagement Over Time
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={savesOverTime}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                />
                                <Bar dataKey="saves" fill="#028090" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5 text-teal" />
                            <h2 className="font-heading text-xl font-bold text-ink-black">
                                Geographic Distribution
                            </h2>
                        </div>
                        {geographicDistribution.length > 0 ? (
                            <div className="space-y-3">
                                {geographicDistribution.map((location, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="font-body text-sm text-gray-700">{location.city}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-teal rounded-full"
                                                    style={{
                                                        width: `${(location.count / geographicDistribution[0].count) * 100}%`
                                                    }}
                                                />
                                            </div>
                                            <span className="font-body text-sm font-semibold text-ink-black w-8 text-right">
                                                {location.count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="font-body text-sm text-gray-500 text-center py-8">
                                No geographic data available yet
                            </p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Star className="w-5 h-5 text-warning" />
                            <h2 className="font-heading text-xl font-bold text-ink-black">
                                Ratings Summary
                            </h2>
                        </div>
                        {ratings.totalReviews > 0 ? (
                            <div className="space-y-4">
                                <div className="text-center pb-4 border-b border-gray-200">
                                    <p className="font-heading text-5xl font-bold text-ink-black mb-2">
                                        {ratings.averageRating.toFixed(1)}
                                    </p>
                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i < Math.round(ratings.averageRating)
                                                    ? 'text-warning fill-warning'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="font-body text-sm text-gray-600">
                                        Based on {ratings.totalReviews} {ratings.totalReviews === 1 ? 'review' : 'reviews'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {Object.entries(ratings.distribution)
                                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                                        .map(([stars, count]) => (
                                            <div key={stars} className="flex items-center gap-3">
                                                <span className="font-body text-sm text-gray-600 w-8">
                                                    {stars} ★
                                                </span>
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-warning rounded-full"
                                                        style={{
                                                            width: `${(count / ratings.totalReviews) * 100}%`
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-body text-sm text-gray-600 w-8 text-right">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ) : (
                            <p className="font-body text-sm text-gray-500 text-center py-8">
                                No ratings available yet
                            </p>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );
};

export default EventAnalyticsPage;