import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import RootLayout from './layouts/RootLayout';
import AdminLayout from './layouts/AdminLayout';
import HomePage from './pages/HomePage';
import EventDetailsPage from './pages/EventDetailsPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SavedEventsPage from './pages/SavedEventsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyEmailNoticePage from './pages/VerifyEmailNoticePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleRoute from './components/routing/RoleRoute';
import AdminRoute from './components/routing/AdminRoute';
import OrganizerDashboard from './pages/OrganizerDashboard';
import EventAnalyticsPage from './pages/EventAnalyticsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFlaggedEvents from './pages/admin/AdminFlaggedEvents';
import AdminReports from './pages/admin/AdminReports';
import AdminVerificationRequests from './pages/admin/AdminVerificationRequests';

window.__REDUX_STORE__ = store;

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="events/:id" element={<EventDetailsPage />} />
            <Route path="search" element={<SearchResultsPage />} />

            <Route
              path="events/create"
              element={
                <RoleRoute allowedRoles={['organizer', 'admin']}>
                  <CreateEventPage />
                </RoleRoute>
              }
            />

            <Route
              path="events/:id/edit"
              element={
                <RoleRoute allowedRoles={['organizer', 'admin']}>
                  <EditEventPage />
                </RoleRoute>
              }
            />

            <Route
              path="organizer/dashboard"
              element={
                <RoleRoute allowedRoles={['organizer', 'admin']}>
                  <OrganizerDashboard />
                </RoleRoute>
              }
            />

            <Route
              path="organizer/analytics/:eventId"
              element={
                <RoleRoute allowedRoles={['organizer', 'admin']}>
                  <EventAnalyticsPage />
                </RoleRoute>
              }
            />

            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen pt-20">Profile Page (Coming Soon)</div>
                </ProtectedRoute>
              }
            />

            <Route
              path="saved"
              element={
                <ProtectedRoute>
                  <SavedEventsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="planner"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen pt-20">Event Planner (Coming Soon)</div>
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <div className="min-h-screen pt-20 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="font-heading text-4xl font-bold text-ink-black mb-4">
                      404 - Page Not Found
                    </h1>
                    <a href="/" className="text-teal hover:underline">
                      Return to Homepage
                    </a>
                  </div>
                </div>
              }
            />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="flagged-events" element={<AdminFlaggedEvents />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="verification-requests" element={<AdminVerificationRequests />} />
            <Route path="users" element={<div className="p-8">Users (Coming Soon)</div>} />
            <Route path="logs" element={<div className="p-8">Logs (Coming Soon)</div>} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/verify-email-notice"
            element={
              <ProtectedRoute>
                <VerifyEmailNoticePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;