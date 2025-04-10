import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProfileRedirect = () => {
  const navigate = useNavigate();
  const { userRole, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (userRole === 'admin') {
        navigate('/admin/profile');
      } else if (userRole === 'instructor') {
        navigate('/instructor/profile');
      } else if (userRole === 'student') {
        navigate('/student/profile');
      } else {
        // Redirection par défaut si le rôle n'est pas reconnu
        navigate('/');
      }
    }
  }, [userRole, loading, navigate]);

  // Afficher un indicateur de chargement pendant la redirection
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default ProfileRedirect;
