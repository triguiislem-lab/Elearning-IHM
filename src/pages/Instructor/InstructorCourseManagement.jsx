import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getDatabase, ref, get } from "firebase/database";
import {
  MdArrowBack,
  MdEdit,
  MdPeople,
  MdSchool,
  MdAccessTime,
  MdCalendarToday,
} from "react-icons/md";
import { motion } from "framer-motion";
import ModuleManager from "../../components/CourseModules/ModuleManager";
import { getCachedData, setCachedData } from "../../utils/cacheUtils";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";
import {
  fetchCourseById,
  fetchCourseEnrollments,
} from "../../utils/firebaseUtils";

const InstructorCourseManagement = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const database = getDatabase();

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCourseData = useCallback(async () => {
    // Vérifier si l'utilisateur est un formateur (plusieurs formats possibles)
    const isInstructor =
      role === "instructor" ||
      role === "formateur" ||
      user?.userType === "formateur" ||
      user?.role === "instructor" ||
      user?.role === "formateur" ||
      user?.normalizedRole === "instructor";

    if (authLoading) {
      return; // Attendre que l'authentification soit chargée
    }

    if (!user) {
      setPermissionError("Vous devez être connecté pour accéder à cette page.");
      setLoadingData(false);
      return;
    }

    if (!isInstructor) {
      setPermissionError("Accès réservé aux formateurs.");
      setLoadingData(false);
      return;
    }

    try {
      setLoadingData(true);
      setError("");
      setPermissionError("");

      // Vérifier si les données sont en cache
      const cacheKey = `course_${courseId}`;
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        setCourse(cachedData);
        setLoadingData(false);
        return;
      }

      const courseData = await fetchCourseById(courseId);

      if (!courseData) {
        setError("Cours non trouvé.");
        setLoadingData(false);
        return;
      }

      // Mettre en cache les données du cours
      setCachedData(cacheKey, courseData);

      const instructorId = courseData.instructorId || courseData.formateur;
      if (instructorId !== user.uid) {
        setPermissionError("Vous n'êtes pas autorisé à gérer ce cours.");
        setLoadingData(false);
        return;
      }

      const courseEnrollments = await fetchCourseEnrollments(courseId);

      setCourse(courseData);
      setEnrollments(courseEnrollments);
    } catch (err) {
      setError(`Erreur lors du chargement des données: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  }, [courseId, user, role, authLoading, navigate]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  const handleModulesUpdated = useCallback(async () => {
    try {
      setLoadingData(true);
      const updatedCourse = await fetchCourseById(courseId);
      setCourse(updatedCourse);
      setSuccess("Modules mis à jour avec succès");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Erreur lors de la mise à jour: ${err.message}`);
    } finally {
      setLoadingData(false);
    }
  }, [courseId]);

  const isLoading = authLoading || loadingData;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col justify-center items-center min-h-[60vh]">
        <OptimizedLoadingSpinner size="large" text="Chargement du cours..." />
        <p className="text-gray-500 text-sm mt-4">
          Chargement des modules et des ressources...
        </p>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {permissionError}
        </div>
        <button
          onClick={() => navigate("/instructor/courses")}
          className="flex items-center justify-center mx-auto gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-300"
        >
          <MdArrowBack />
          Retour à mes cours
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate("/instructor/courses")}
          className="flex items-center justify-center mx-auto gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-300"
        >
          <MdArrowBack />
          Retour à mes cours
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Cours non trouvé ou inaccessible.
        </div>
        <button
          onClick={() => navigate("/instructor/courses")}
          className="flex items-center justify-center mx-auto gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-300"
        >
          <MdArrowBack />
          Retour à mes cours
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {course.title || course.titre || "Cours sans titre"}
          </h1>
          <p className="text-gray-600">Gestion des modules et évaluations</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/instructor/courses")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-300 text-sm"
          >
            <MdArrowBack />
            Mes cours
          </button>
          <Link
            to={`/instructor/course-form/${course.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 text-sm"
          >
            <MdEdit />
            Modifier Infos Cours
          </Link>
        </div>
      </div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 shadow-sm"
        >
          {success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <MdSchool className="text-3xl text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-700">
              Informations
            </h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Titre:</strong> {course.title || course.titre || "N/A"}
            </p>
            <p>
              <strong>Niveau:</strong> {course.level || "N/A"}
            </p>
            <p>
              <strong>Spécialité:</strong> {course.specialiteName || "N/A"}
            </p>
            <p>
              <strong>Discipline:</strong> {course.disciplineName || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <MdPeople className="text-3xl text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-700">
              Inscriptions
            </h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Étudiants inscrits:</strong> {enrollments.length}
            </p>
            <p>
              <strong>Dernière inscription:</strong>{" "}
              {enrollments.length > 0
                ? new Date(
                    Math.max(
                      ...enrollments.map(
                        (e) => new Date(e.enrolledAt || e.date || 0)
                      )
                    )
                  ).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <MdCalendarToday className="text-3xl text-green-600" />
            <h2 className="text-xl font-semibold text-gray-700">
              Infos Temporelles
            </h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Créé le:</strong>{" "}
              {course.createdAt
                ? new Date(course.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>Mise à jour:</strong>{" "}
              {course.updatedAt
                ? new Date(course.updatedAt).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>Durée:</strong> {course.duration || "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <MdAccessTime className="text-3xl text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-700">
            Gestion des Modules & Évaluations
          </h2>
        </div>

        <ModuleManager
          course={course}
          onModulesUpdated={handleModulesUpdated}
          instructorId={user.uid}
        />
      </div>
    </div>
  );
};

export default InstructorCourseManagement;
