import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import CourseFixerComponent from './CourseFixerComponent';
import AdminLayout from '../../components/layouts/AdminLayout';

const AdminCourseFixer = () => {
  const { user, userRole } = useAuth();
  
  // Check if user is admin
  const isAdmin = userRole === 'admin';
  
  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-700">Accès refusé. Vous devez être administrateur pour accéder à cette page.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Outil de correction des cours</h1>
        <p className="text-gray-600 mb-8">
          Cet outil vous permet de corriger la structure des cours dans la base de données pour s'assurer que les modules, ressources et évaluations sont correctement formatés et s'affichent correctement pour les étudiants.
        </p>
        <CourseFixerComponent />
      </div>
    </AdminLayout>
  );
};

export default AdminCourseFixer;
