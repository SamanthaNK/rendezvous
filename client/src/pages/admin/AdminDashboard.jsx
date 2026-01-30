import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { adminAPI } from '../../services/api';
import Spinner from '../../components/common/Spinner';

const COLORS = ['#028090', '#63132b', '#bde585', '#f59e0b', '#10b981', '#ef4444'];

const StatsCard = ({ label, value }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="font-heading text-3xl font-bold text-ink-black mb-1">{value}</p>
        <p className="font-body text-sm text-gray-600">{label}</p>
    </div>
);

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getDashboard();
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-error font-body text-base">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h1 className="font-heading text-4xl font-bold text-ink-black">Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard label="Total Users" value={data.users.total} />
                <StatsCard label="Organizers" value={data.users.organizers} />
                <StatsCard label="Total Events" value={data.events.total} />
                <StatsCard label="Active Events" value={data.events.active} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-heading text-xl font-bold text-ink-black mb-4">Events by Category</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data.eventsByCategory}
                                dataKey="count"
                                nameKey="category"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {data.eventsByCategory.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-heading text-xl font-bold text-ink-black mb-4">Trending Events</h2>
                    <div className="space-y-3">
                        {data.trendingEvents.slice(0, 5).map((event) => (
                            <div key={event._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                                <div className="flex-1">
                                    <p className="font-body text-sm font-semibold text-ink-black line-clamp-1">{event.title}</p>
                                    <p className="font-body text-xs text-gray-500">{event.categories[0]}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-body text-sm font-bold text-teal">{event.metrics.views} views</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-heading text-xl font-bold text-ink-black mb-4">Engagement</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-body text-sm text-gray-600">Daily Active Users</span>
                            <span className="font-body text-lg font-bold text-ink-black">{data.engagement.dailyActiveUsers}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-body text-sm text-gray-600">Monthly Active Users</span>
                            <span className="font-body text-lg font-bold text-ink-black">{data.engagement.monthlyActiveUsers}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-heading text-xl font-bold text-ink-black mb-4">Pending Moderation</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-body text-sm text-gray-600">Flagged Events</span>
                            <span className="font-body text-lg font-bold text-error">{data.events.flagged}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-body text-sm text-gray-600">User Reports</span>
                            <span className="font-body text-lg font-bold text-warning">{data.pendingModeration.reports}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-body text-sm text-gray-600">Verification Requests</span>
                            <span className="font-body text-lg font-bold text-info">{data.pendingModeration.verifications}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;