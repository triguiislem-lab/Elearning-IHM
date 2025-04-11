import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

const ProtectedRoute = ({ children, requiredRole }) => {
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

  if (requiredRole && userRole !== requiredRole) {
    // Redirect to appropriate dashboard based on user's role
    const dashboardPath = `/${userRole}/dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  // If all checks pass, render the protected content
  return children;
};

export default ProtectedRoute;
