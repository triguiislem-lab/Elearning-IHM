import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userRole, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return <OptimizedLoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if the user's role is included in the allowedRoles array
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on user's actual role, or login if role is somehow null
    const dashboardPath = userRole ? `/${userRole}/dashboard` : '/login';
    // If already on the dashboard path for their role, prevent infinite redirect loop
    if (location.pathname === dashboardPath) {
        // Redirect to home page if they are stuck in a loop
        return <Navigate to="/" replace />;
    }
    return <Navigate to={dashboardPath} replace />;
  }

  // If all checks pass, render the protected content
  return children;
};

export default ProtectedRoute;
