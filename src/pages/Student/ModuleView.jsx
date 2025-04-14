import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../../../firebaseConfig";
import { ref, get, update } from "firebase/database";
import { MdArrowBack, MdMenu, MdWarning } from "react-icons/md";
import ModuleContent from "../../components/CourseModules/ModuleContent";
import { useAuth } from "../../hooks/useAuth";
import { fetchModuleDetails, fetchCourseById } from "../../utils/firebaseUtils";

const ModuleView = () => {
  const { courseId, moduleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !moduleId) {
        setError("Paramètres manquants dans l'URL");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Récupérer les données du cours
        const courseData = await fetchCourseById(courseId);
        if (!courseData) {
          setError(`Cours non trouvé (ID: ${courseId})`);
          setLoading(false);
          return;
        }
        setCourse(courseData);

        // Vérifier si l'utilisateur est inscrit au cours
        if (user) {
          const enrollmentRef = ref(
            database,
            `elearning/enrollments/courses/${courseId}/${user.uid}`
          );
          const enrollmentSnapshot = await get(enrollmentRef);
          const userIsEnrolled = enrollmentSnapshot.exists();
          setIsEnrolled(userIsEnrolled);
        }

        // Récupérer le module spécifique
        const moduleData = await fetchModuleDetails(courseId, moduleId);

        if (moduleData) {
          setModule(moduleData);
        } else {
          // Si moduleData est null, créer un objet minimum pour l'afficher
          // ModuleContent tentera de charger les données complètes
          setModule({
            id: moduleId,
            courseId: courseId,
          });
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError("Erreur lors du chargement des données. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, moduleId, user]);

  const handleModuleComplete = async (score) => {
    try {
      if (!course || !course.modules) return;

      // Mettre à jour la progression du module
      const moduleIndex = course.modules.findIndex((m) => m.id === moduleId);
      if (moduleIndex === -1) return;

      // Créer une copie des modules
      const updatedModules = [...course.modules];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        status: "completed",
        score: score,
      };

      // Mettre à jour le cours
      setCourse({
        ...course,
        modules: updatedModules,
      });

      // Si c'est le dernier module, naviguer vers la page de félicitations
      const currentModuleIndex = course.modules.findIndex(
        (m) => m.id === moduleId
      );
      const nextModuleIndex = currentModuleIndex + 1;

      if (nextModuleIndex >= course.modules.length) {
        // C'était le dernier module
        setTimeout(() => {
          navigate(`/course/${courseId}/completed`);
        }, 1500);
      } else {
        // Proposer de passer au module suivant
        const nextModule = course.modules[nextModuleIndex];
        setTimeout(() => {
          const confirmNext = window.confirm(
            "Module terminé ! Voulez-vous passer au module suivant ?"
          );
          if (confirmNext) {
            navigate(`/course/${courseId}/module/${nextModule.id}`);
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la progression:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-700">Chargement du module...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <MdWarning className="text-red-700 text-lg" />
          <div>
            <p className="font-medium">Erreur</p>
            <p>{error}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-all"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <MdArrowBack className="mr-2" />
          Retour au cours
        </button>

        {course && (
          <div className="text-gray-600">
            <span className="font-medium">{course.title || "Cours"}</span>
            {module && (
              <span> &gt; {module.title || module.titre || "Module"}</span>
            )}
          </div>
        )}
      </div>

      <ModuleContent
        module={module}
        onComplete={handleModuleComplete}
        isEnrolled={isEnrolled}
        courseId={courseId}
      />
    </div>
  );
};

export default ModuleView;
