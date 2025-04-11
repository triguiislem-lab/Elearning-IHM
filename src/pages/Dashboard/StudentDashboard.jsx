import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { getUserOverallProgress } from "../../utils/progressUtils";
import { MdSchool, MdAssignment, MdBarChart } from "react-icons/md";
import { Link } from "react-router-dom";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";

const StudentDashboard = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState("");

  useEffect(() => {
    const loadProgressData = async (userId) => {
      try {
        setProgressLoading(true);
        setProgressError("");
        const progressData = await getUserOverallProgress(userId);
        setProgress(progressData);
      } catch (error) {
        setProgressError(
          "Une erreur s&apos;est produite lors du chargement de la progression."
        );
      } finally {
        setProgressLoading(false);
      }
    };

    if (user) {
      loadProgressData(user.uid);
    } else if (!authLoading) {
      setProgressLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading) {
    return <OptimizedLoadingSpinner />;
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 p-4 rounded-lg text-red-700">
          <p>Erreur d&apos;authentification: {authError}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Veuillez vous connecter pour accéder au tableau de bord.</p>
      </div>
    );
  }

  if (progressLoading) {
    return <OptimizedLoadingSpinner />;
  }

  if (progressError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 p-4 rounded-lg text-red-700">
          <p>{progressError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-8">Tableau de bord étudiant</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Bienvenue, {user?.prenom || user?.displayName || "Étudiant"}!
          </h2>
          <p className="text-gray-600">
            Voici un aperçu de votre progression et de vos activités récentes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <MdSchool className="text-blue-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Cours inscrits</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {progress?.enrolledCourses || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <MdAssignment className="text-green-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Cours complétés</h3>
                <p className="text-3xl font-bold text-green-600">
                  {progress?.completedCourses || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <MdBarChart className="text-purple-600 text-2xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Progression globale</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {progress?.overallProgress || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/student/courses"
              className="bg-secondary text-white p-4 rounded-lg text-center hover:bg-secondary/90 transition-colors duration-300"
            >
              Mes cours
            </Link>
            <Link
              to="/courses"
              className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors duration-300"
            >
              Explorer les cours
            </Link>
            <Link
              to="/student/profile"
              className="bg-green-600 text-white p-4 rounded-lg text-center hover:bg-green-700 transition-colors duration-300"
            >
              Mon profil
            </Link>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <p className="text-blue-800 text-center">
            Continuez à apprendre et à progresser ! N&apos;hésitez pas à
            explorer de nouveaux cours pour enrichir vos connaissances.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
