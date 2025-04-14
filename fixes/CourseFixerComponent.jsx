import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../../firebaseConfig';
import { ref, get } from 'firebase/database';
import { fixCourseStructure, fixAllCourses, fixSpecificCourse } from './DatabaseMigrationUtil';
import { MdWarning, MdCheckCircle, MdError, MdRefresh } from 'react-icons/md';

const CourseFixerComponent = () => {
  const { user, userRole } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [fixingAll, setFixingAll] = useState(false);
  const [fixResults, setFixResults] = useState(null);

  // Check if user is admin
  const isAdmin = userRole === 'admin';

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      if (!isAdmin) return;

      setLoading(true);
      setError(null);

      try {
        const coursesRef = ref(database, 'elearning/courses');
        const snapshot = await get(coursesRef);

        if (snapshot.exists()) {
          const coursesData = snapshot.val();
          const coursesArray = Object.entries(coursesData).map(([id, course]) => ({
            id,
            title: course.title || 'Cours sans titre',
            hasModules: !!course.modules,
            moduleCount: course.modules ? 
              (Array.isArray(course.modules) ? 
                course.modules.length : 
                Object.keys(course.modules).length) 
              : 0
          }));

          setCourses(coursesArray);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Erreur lors du chargement des cours');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [isAdmin]);

  // Handle fix single course
  const handleFixCourse = async (courseId) => {
    if (!isAdmin || !courseId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await fixCourseStructure(courseId);
      
      if (result) {
        setSuccess(`Le cours ${courseId} a été corrigé avec succès`);
      } else {
        setError(`Erreur lors de la correction du cours ${courseId}`);
      }
    } catch (err) {
      console.error(`Error fixing course ${courseId}:`, err);
      setError(`Erreur lors de la correction du cours ${courseId}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle fix all courses
  const handleFixAllCourses = async () => {
    if (!isAdmin) return;

    setLoading(true);
    setFixingAll(true);
    setError(null);
    setSuccess(null);
    setFixResults(null);

    try {
      const results = await fixAllCourses();
      
      setFixResults(results);
      
      if (results.success > 0) {
        setSuccess(`${results.success} cours ont été corrigés avec succès`);
      }
      
      if (results.failure > 0) {
        setError(`${results.failure} cours n'ont pas pu être corrigés`);
      }
    } catch (err) {
      console.error('Error fixing all courses:', err);
      setError(`Erreur lors de la correction de tous les cours: ${err.message}`);
    } finally {
      setLoading(false);
      setFixingAll(false);
    }
  };

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <div className="flex items-center">
          <MdError className="text-red-500 text-xl mr-2" />
          <p className="text-red-700">Accès refusé. Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Outil de correction des cours</h2>
      
      {/* Status messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <MdError className="text-red-500 text-xl mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <MdCheckCircle className="text-green-500 text-xl mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}
      
      {/* Fix all courses button */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Corriger tous les cours</h3>
        <p className="text-gray-600 mb-4">
          Cette action va corriger la structure de tous les cours dans la base de données pour s'assurer que les modules, ressources et évaluations sont correctement formatés.
        </p>
        <button
          onClick={handleFixAllCourses}
          disabled={loading || fixingAll}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {fixingAll ? (
            <>
              <MdRefresh className="animate-spin mr-2" />
              Correction en cours...
            </>
          ) : (
            <>Corriger tous les cours</>
          )}
        </button>
        
        {fixResults && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Résultats:</h4>
            <p className="text-green-600">{fixResults.success} cours corrigés avec succès</p>
            {fixResults.failure > 0 && (
              <p className="text-red-600">{fixResults.failure} cours n'ont pas pu être corrigés</p>
            )}
          </div>
        )}
      </div>
      
      {/* Course list */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Corriger un cours spécifique</h3>
        
        {loading && !fixingAll ? (
          <p className="text-gray-600">Chargement des cours...</p>
        ) : courses.length === 0 ? (
          <p className="text-gray-600">Aucun cours trouvé</p>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{course.title}</h4>
                    <p className="text-sm text-gray-600">
                      ID: {course.id} | 
                      {course.hasModules 
                        ? `${course.moduleCount} module(s)` 
                        : 'Aucun module'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFixCourse(course.id)}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Corriger
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseFixerComponent;
