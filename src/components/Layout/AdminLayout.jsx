import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../Admin/AdminSidebar';
import { useAuth } from '../../hooks/useAuth';
import OptimizedLoadingSpinner from '../Common/OptimizedLoadingSpinner';

const AdminLayout = () => {
  const { userRole, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <OptimizedLoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userRole !== 'admin') {
    const dashboardPath = userRole ? `/${userRole}/dashboard` : '/login';
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4 lg:w-1/5">
          <AdminSidebar />
        </div>
        <div className="md:w-3/4 lg:w-4/5">
          {/* Remove the debug heading */}
          {/* <h2>DEBUG: Inside AdminLayout Content Area</h2> */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout; 