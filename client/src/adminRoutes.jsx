import React from 'react';
import AdminPanel from '../pages/AdminPanel';
import AdminRoute from '../components/routing/AdminRoute';
import Dashboard from './pages/admin/Dashboard';
import FlaggedEvents from './pages/admin/FlaggedEvents';
import Reports from './pages/admin/Reports';
import VerificationRequests from './pages/admin/VerificationRequests';
const Users = () => <div>Users (Coming Soon)</div>;
const Logs = () => <div>Logs (Coming Soon)</div>;

export const adminRoutes = [
  {
    path: '/admin/dashboard',
    element: (
      <AdminRoute>
        <AdminPanel>
          <Dashboard />
        </AdminPanel>
      </AdminRoute>
    ),
  },
  {
    path: '/admin/flagged-events',
    element: (
      <AdminRoute>
        <AdminPanel>
          <FlaggedEvents />
        </AdminPanel>
      </AdminRoute>
    ),
  },
  {
    path: '/admin/reports',
    element: (
      <AdminRoute>
        <AdminPanel>
          <Reports />
        </AdminPanel>
      </AdminRoute>
    ),
  },
  {
    path: '/admin/verification-requests',
    element: (
      <AdminRoute>
        <AdminPanel>
          <VerificationRequests />
        </AdminPanel>
      </AdminRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <AdminRoute>
        <AdminPanel>
          <Users />
        </AdminPanel>
      </AdminRoute>
    ),
  },
  {
    path: '/admin/logs',
    element: (
      <AdminRoute>
        <AdminPanel>
          <Logs />
        </AdminPanel>
      </AdminRoute>
    ),
  },
];
