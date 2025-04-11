import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

const ProfileRedirect = () => {
  const navigate = useNavigate();
  const { userRole, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      if (userRole === "admin") {
        navigate("/admin/profile");
      } else if (userRole === "instructor") {
        navigate("/instructor/profile");
      } else if (userRole === "student") {
        navigate("/student/profile");
      } else {
        // Default to home if role is not recognized
        navigate("/");
      }
    }
  }, [userRole, loading, navigate, isAuthenticated]);

  // Show loading spinner while redirecting
  return <OptimizedLoadingSpinner />;
};

export default ProfileRedirect;
