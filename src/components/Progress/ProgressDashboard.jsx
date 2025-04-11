import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAuth } from "firebase/auth";
import {
  getUserOverallProgress,
  getUserAllCoursesProgress,
} from "../../utils/progressUtils";
import { fetchCourseById } from "../../utils/firebaseUtils";
import {
  MdCheckCircle,
  MdAccessTime,
  MdPlayCircle,
  MdBarChart,
} from "react-icons/md";
import { Link } from "react-router-dom";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

const ProgressDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(null);
  const [courseProgress, setCourseProgress] = useState([]);
  const [error, setError] = useState("");

  const auth = getAuth();

  useEffect(() => {
    const loadProgress = async () => {
      if (!auth.currentUser) return;

      try {
        setLoading(true);
        setError("");

        // Récupérer la progression globale
        const overall = await getUserOverallProgress(auth.currentUser.uid);
        setOverallProgress(overall);

        // Récupérer la progression par cours
        const allProgress = await getUserAllCoursesProgress(
          auth.currentUser.uid
        );

        if (allProgress && Object.keys(allProgress).length > 0) {
          const courseIds = Object.keys(allProgress).filter(
            (key) => key !== "userId" && key !== "overallProgress"
          );

          // Récupérer les détails de chaque cours
          const coursesWithProgress = await Promise.all(
            courseIds.map(async (courseId) => {
              try {
                const courseData = await fetchCourseById(courseId);
                return {
                  ...courseData,
                  progress: allProgress[courseId].progress || 0,
                  completed: allProgress[courseId].completed || false,
                  lastUpdated: allProgress[courseId].lastUpdated,
                };
              } catch (error) {
                return null;
              }
            })
          );

          // Filtrer les cours null (en cas d'erreur)
          const validCourses = coursesWithProgress.filter((course) => course);
          setCourseProgress(validCourses);
        } else {
          setCourseProgress([]);
        }
      } catch (error) {
        setError(
          "Impossible de charger votre progression. Veuillez réessayer."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [auth.currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <OptimizedLoadingSpinner
          size="medium"
          text="Chargement de la progression..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-lg text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progression globale */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-6">Votre progression globale</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <MdBarChart className="text-blue-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Progression globale</p>
              <p className="text-xl font-bold">
                {overallProgress?.overallProgress || 0}%
              </p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <MdCheckCircle className="text-green-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cours complétés</p>
              <p className="text-xl font-bold">
                {overallProgress?.completedCourses || 0} /{" "}
                {overallProgress?.enrolledCourses || 0}
              </p>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <MdPlayCircle className="text-purple-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cours en cours</p>
              <p className="text-xl font-bold">
                {(overallProgress?.enrolledCourses || 0) -
                  (overallProgress?.completedCourses || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des cours avec progression */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-6">Progression par cours</h2>

        {courseProgress.length > 0 ? (
          <div className="space-y-4">
            {courseProgress.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border rounded-lg overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4">
                    <img
                      src={
                        course.image ||
                        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80"
                      }
                      alt={course.title || course.titre}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80";
                      }}
                    />
                  </div>

                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold">
                        {course.title || course.titre || `Cours ${course.id}`}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.completed
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {course.completed ? "Complété" : "En cours"}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {course.description || "Aucune description disponible."}
                    </p>

                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">
                          Progression
                        </span>
                        <span className="text-sm font-medium">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            course.completed ? "bg-green-600" : "bg-secondary"
                          }`}
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="text-xs text-gray-500">
                        Dernière activité:{" "}
                        {course.lastUpdated
                          ? new Date(course.lastUpdated).toLocaleDateString()
                          : "Jamais"}
                      </div>
                      <Link
                        to={`/course/${course.id}`}
                        className="text-secondary hover:text-secondary/80 font-medium text-sm"
                      >
                        Continuer
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">
              Vous n'êtes inscrit à aucun cours pour le moment.
            </p>
            <Link
              to="/"
              className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors duration-300"
            >
              Découvrir les cours
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;
