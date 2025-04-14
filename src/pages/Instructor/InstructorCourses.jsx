import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { motion } from "framer-motion";
import {
  MdEdit,
  MdDelete,
  MdAdd,
  MdSchool,
  MdBook,
  MdPeople,
  MdAccessTime,
  MdArrowBack,
  MdDashboard,
  MdMessage,
  MdAssignment,
  MdBarChart,
  MdSettings,
  MdNotifications,
  MdPerson,
  MdArchive,
} from "react-icons/md";
import { fetchInstructorCourses, archiveCourse } from "../../utils/moduleUtils";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";
import LazyImage from "../../components/Common/LazyImage";
import { useAuth } from "../../hooks/useAuth";

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalModules: 0,
    completionRate: 0,
    unreadMessages: 3, // Placeholder value, should be fetched from a messages API
  });
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Fonction optimisée pour charger les cours et calculer les statistiques
  const loadCourses = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const instructorCourses = await fetchInstructorCourses(user.uid);
      setCourses(instructorCourses);

      // Calculer les statistiques
      let totalStudents = 0;
      let totalModules = 0;

      instructorCourses.forEach((course) => {
        totalStudents += course.students || 0;
        totalModules += course.modules?.length || 0;
      });

      // Mettre à jour les statistiques
      setStats({
        totalStudents,
        totalCourses: instructorCourses.length,
        totalModules,
        completionRate:
          instructorCourses.length > 0
            ? Math.round((totalModules / (instructorCourses.length * 5)) * 100)
            : 0, // Estimation basée sur 5 modules par cours
        unreadMessages: 3, // Placeholder, should be fetched from a messages API
      });
    } catch (error) {
      console.error("Error loading courses:", error);
      setError("Erreur lors du chargement des cours. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, navigate]);

  const handleArchiveCourse = async (courseId) => {
    if (window.confirm("Êtes-vous sûr de vouloir archiver ce cours ?")) {
      try {
        setDeletingCourseId(courseId);
        await archiveCourse(courseId);
        // Recharger les cours après l'archivage
        await loadCourses();
        setSuccess("Cours archivé avec succès");
      } catch (error) {
        console.error("Erreur lors de l'archivage du cours:", error);
        setError("Erreur lors de l'archivage du cours");
      } finally {
        setDeletingCourseId(null);
      }
    }
  };

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Afficher un état de chargement optimisé
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center h-64">
          <OptimizedLoadingSpinner
            size="large"
            text="Chargement de vos cours..."
          />
          <p className="text-gray-500 text-sm mt-4">
            Chargement des données depuis Firebase...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with title and actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord formateur</h1>
          <p className="text-gray-600">
            Gérez vos cours, étudiants, modules et évaluations
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/messages"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 relative"
          >
            <MdMessage />
            <span>Messages</span>
            {stats.unreadMessages > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {stats.unreadMessages}
              </span>
            )}
          </Link>
          <Link
            to="/instructor/course-form"
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors duration-300"
          >
            <MdAdd />
            Nouveau cours
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <MdSchool className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Cours</h3>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalCourses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <MdPeople className="text-green-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Étudiants</h3>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <MdBook className="text-purple-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Modules</h3>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalModules}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <MdBarChart className="text-amber-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Complétion</h3>
              <p className="text-3xl font-bold text-amber-600">
                {stats.completionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/instructor/course-form"
            className="bg-secondary text-white p-4 rounded-lg text-center hover:bg-secondary/90 transition-colors duration-300 flex flex-col items-center justify-center gap-2"
          >
            <MdAdd className="text-2xl" />
            <span>Créer un cours</span>
          </Link>
          <Link
            to="/messages"
            className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors duration-300 flex flex-col items-center justify-center gap-2"
          >
            <MdMessage className="text-2xl" />
            <span>Messages</span>
          </Link>
          <Link
            to="/instructor/profile"
            className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 transition-colors duration-300 flex flex-col items-center justify-center gap-2"
          >
            <MdPerson className="text-2xl" />
            <span>Mon profil</span>
          </Link>
          <Link
            to="/instructor/dashboard"
            className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700 transition-colors duration-300 flex flex-col items-center justify-center gap-2"
          >
            <MdDashboard className="text-2xl" />
            <span>Tableau de bord</span>
          </Link>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Mes cours section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Mes cours</h2>
          <Link
            to="/instructor/courses"
            className="text-secondary hover:underline text-sm flex items-center"
          >
            Voir tous
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <MdSchool className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun cours trouvé</h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore créé de cours. Commencez par en créer un
              nouveau.
            </p>
            <Link
              to="/instructor/course-form"
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors duration-300 mx-auto"
            >
              <MdAdd />
              Créer mon premier cours
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 6).map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="relative h-32 bg-gray-200">
                  <LazyImage
                    src={course.image}
                    alt={course.title || course.titre}
                    className="w-full h-full object-cover"
                    fallbackIcon={MdBook}
                    fallbackClassName="w-full h-full"
                  />
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 truncate">
                    {course.title || course.titre || "Cours sans titre"}
                  </h3>

                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MdPeople className="mr-1" />
                    <span>{course.students || 0} étudiants</span>
                    <span className="mx-2">•</span>
                    <MdAccessTime className="mr-1" />
                    <span>{course.modules?.length || 0} modules</span>
                  </div>

                  <div className="flex justify-between gap-2 mt-4">
                    <Link
                      to={`/instructor/course-management/${course.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors duration-300 flex-1 justify-center text-sm"
                    >
                      <MdBook />
                    </Link>

                    <Link
                      to={`/instructor/course-form/${course.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 flex-1 justify-center text-sm"
                    >
                      <MdEdit />
                    </Link>

                    <button
                      onClick={() => handleArchiveCourse(course.id)}
                      disabled={deletingCourseId === course.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 flex-1 justify-center text-sm disabled:opacity-50"
                    >
                      {deletingCourseId === course.id ? (
                        <OptimizedLoadingSpinner size="small" />
                      ) : (
                        <MdArchive />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {courses.length > 6 && (
          <div className="text-center mt-6">
            <Link
              to="/instructor/courses"
              className="inline-flex items-center justify-center px-4 py-2 border border-secondary text-secondary rounded-md hover:bg-secondary hover:text-white transition-colors duration-300"
            >
              Voir tous les cours ({courses.length})
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorCourses;
