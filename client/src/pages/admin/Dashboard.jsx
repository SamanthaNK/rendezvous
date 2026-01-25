import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { userAPI } from '../../services/api';

const COLORS = ['#14b8a6', '#f43f5e', '#6366f1', '#f59e42', '#10b981', '#fbbf24', '#3b82f6', '#eab308'];

const StatsCard = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center min-w-[160px]">
    <div className="text-3xl font-bold text-ink-black mb-1">{value}</div>
    <div className="text-sm text-gray-500 font-medium">{label}</div>
  </div>
);

const mockDashboard = {
  totalUsers: 1200,
  registeredUsers: 1100,
  organizers: 80,
  totalEvents: 350,
  activeEvents: 200,
  pastEvents: 100,
  upcomingEvents: 40,
  draftEvents: 10,
  eventsByCategory: [
    { category: 'Music', count: 80 },
    { category: 'Sports', count: 60 },
    { category: 'Tech', count: 40 },
    { category: 'Food', count: 30 },
    { category: 'Art', count: 20 },
    { category: 'Other', count: 120 },
  ],
  trendingEvents: [
    { title: 'Music Fest', views: 1200, saves: 300 },
    { title: 'Tech Expo', views: 900, saves: 200 },
    { title: 'Food Carnival', views: 800, saves: 150 },
  ],
  engagement: { DAU: 200, MAU: 900 },
  userGrowth: [
    { date: '2026-01-01', users: 800 },
    { date: '2026-01-08', users: 900 },
    { date: '2026-01-15', users: 1000 },
    { date: '2026-01-22', users: 1200 },
  ],
  eventTrends: [
    { week: 'Week 1', events: 40 },
    { week: 'Week 2', events: 60 },
    { week: 'Week 3', events: 80 },
    { week: 'Week 4', events: 90 },
  ],
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with real API call:
    // userAPI.getAdminDashboard().then(...)
    setTimeout(() => {
      setData(mockDashboard);
      setLoading(false);
    }, 800);
  }, []);

  if (loading || !data) return <div className="p-12 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatsCard label="Total Users" value={data.totalUsers} />
        <StatsCard label="Registered Users" value={data.registeredUsers} />
        <StatsCard label="Organizers" value={data.organizers} />
        <StatsCard label="Total Events" value={data.totalEvents} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-heading text-lg font-bold mb-4">Events by Category</h3>
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
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-heading text-lg font-bold mb-4">User Growth Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#14b8a6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-heading text-lg font-bold mb-4">Event Creation Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.eventTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="events" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-heading text-lg font-bold mb-4">Trending Events</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm">
                <th className="py-2">Event</th>
                <th className="py-2">Views</th>
                <th className="py-2">Saves</th>
              </tr>
            </thead>
            <tbody>
              {data.trendingEvents.map((ev, idx) => (
                <tr key={ev.title} className={idx % 2 ? 'bg-gray-50' : ''}>
                  <td className="py-2 font-medium">{ev.title}</td>
                  <td className="py-2">{ev.views}</td>
                  <td className="py-2">{ev.saves}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
