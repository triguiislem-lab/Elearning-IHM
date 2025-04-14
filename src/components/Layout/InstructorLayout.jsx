import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
// Assuming an InstructorSidebar component exists or will be created
import InstructorSidebar from '../Instructor/InstructorSidebar'; 
import { useAuth } from '../../hooks/useAuth';
import OptimizedLoadingSpinner from '../Common/OptimizedLoadingSpinner';

const InstructorLayout = () => {
  const { userRole, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <OptimizedLoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow only instructors
  if (userRole !== 'instructor') {
    const dashboardPath = userRole ? `/${userRole}/dashboard` : '/login';
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4 lg:w-1/5">
          <InstructorSidebar />
        </div>
        <div className="md:w-3/4 lg:w-4/5">
          <Outlet /> 
        </div>
      </div>
    </div>
  );
};

export default InstructorLayout; 