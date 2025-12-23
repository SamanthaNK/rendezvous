import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '../../store/authSlice';

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = currentUser?.role;
  const hasRequiredRole = allowedRoles.includes(userRole);

  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen bg-bright-snow flex items-center justify-center py-12 px-5">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-4xl font-bold text-ink-black mb-4">
                        Access Denied
          </h1>
          <p className="font-body text-base text-gray-700 mb-6">
                        You don't have permission to access this page.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-teal text-white font-body font-semibold rounded-md hover:bg-teal/90 transition-colors"
          >
                        Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleRoute;
