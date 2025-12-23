import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import RootLayout from './layouts/RootLayout';
import HomePage from './pages/HomePage';
import EventDetailsPage from './pages/EventDetailsPage';
import CreateEventPage from './pages/CreateEventPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VerifyEmailNoticePage from './pages/VerifyEmailNoticePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './components/routing/ProtectedRoute';
import RoleRoute from './components/routing/RoleRoute';

window.__REDUX_STORE__ = store;

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />

            <Route
              path="events/:id"
              element={<EventDetailsPage />}
            />

            <Route
              path="create-event"
              element={
                <RoleRoute allowedRoles={['organizer', 'admin']}>
                  <CreateEventPage />
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
                  <div className="min-h-screen pt-20">Saved Events (Coming Soon)</div>
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
              path="organizer/dashboard"
              element={
                <RoleRoute allowedRoles={['organizer', 'admin']}>
                  <div className="min-h-screen pt-20">Organizer Dashboard (Coming Soon)</div>
                </RoleRoute>
              }
            />

            <Route
              path="admin/dashboard"
              element={
                <RoleRoute allowedRoles={['admin']}>
                  <div className="min-h-screen pt-20">Admin Dashboard (Coming Soon)</div>
                </RoleRoute>
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
