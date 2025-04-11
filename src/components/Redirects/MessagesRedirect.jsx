import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

const MessagesRedirect = () => {
  const navigate = useNavigate();
  const { userRole, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      if (userRole === "admin") {
        navigate("/admin/messages");
      } else if (userRole === "instructor") {
        navigate("/instructor/messages");
      } else if (userRole === "student") {
        navigate("/student/messages");
      } else {
        // Default to home if role is not recognized
        navigate("/");
      }
    }
  }, [userRole, loading, navigate, isAuthenticated]);

  // Show loading spinner while redirecting
  return <OptimizedLoadingSpinner />;
};

export default MessagesRedirect;
