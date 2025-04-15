import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import ModuleContent from "../components/CourseModules/ModuleContent";
import {
  fetchModuleDetails,
  fetchUserEnrollments,
  fetchCourseById,
} from "../utils/firebaseUtils";
import { database } from "../../firebaseConfig";
import { ref, set, get } from "firebase/database";
import OptimizedLoadingSpinner from "../components/Common/OptimizedLoadingSpinner";

const ModulePage = () => {
  const params = useParams();
  const courseId = params.id;
  const moduleId = params.moduleId;

  const navigate = useNavigate();
  const { user } = useAuth();
  const [moduleData, setModuleData] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const loadModuleData = async () => {
      console.log("Loading module data with:", {
        courseId,
        moduleId,
        userId: user?.uid,
      });

      // Validation des paramètres
      if (!courseId || !moduleId || !user) {
        const missingParams = [];
        if (!courseId) missingParams.push("courseId");
        if (!moduleId) missingParams.push("moduleId");
        if (!user) missingParams.push("user");

        const errorMessage = `Informations manquantes: ${missingParams.join(
          ", "
        )}`;
        console.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Fetch course data
        console.log("Fetching course data for:", courseId);
        const course = await fetchCourseById(courseId);
        if (!course) {
          const errorMessage = `Cours non trouvé (ID: ${courseId})`;
          console.error(errorMessage);
          setError(errorMessage);
          setLoading(false);
          return;
        }
        console.log("Course data retrieved:", course);
        setCourseData(course);

        // Chercher le vrai ID du module si c'est un index
        let realModuleId = moduleId;

        // Récupérer tous les modules disponibles directement depuis la base de données
        const modulesRef = ref(
          database,
          `elearning/courses/${courseId}/modules`
        );
        const modulesSnapshot = await get(modulesRef);

        let availableModules = [];
        if (modulesSnapshot.exists()) {
          const modulesData = modulesSnapshot.val();

          // Convertir les modules en tableau
          if (typeof modulesData === "object") {
            Object.entries(modulesData).forEach(([id, module]) => {
              availableModules.push({
                id,
                title: module.title || "Module sans titre",
                order: module.order || 0,
              });
            });

            // Trier les modules par ordre si disponible
            availableModules.sort((a, b) => a.order - b.order);
            console.log("Modules disponibles:", availableModules);
          }
        }

        // Gérer le cas spécial où moduleId est "0"
        if (moduleId === "0") {
          // Si nous avons des modules disponibles, utiliser le premier
          if (availableModules.length > 0) {
            realModuleId = availableModules[0].id;
            console.log(
              `Utilisation du premier module disponible (ID: ${realModuleId})`
            );
          } else {
            // Si aucun module n'est disponible, afficher une erreur
            const errorMessage = `Aucun module trouvé dans ce cours (ID: ${courseId})`;
            console.error(errorMessage);
            setError(errorMessage);
            setLoading(false);
            return;
          }
        }
        // Pour tous les autres cas numériques qui ne sont pas "0"
        else if (!isNaN(parseInt(moduleId)) && availableModules.length > 0) {
          const moduleIndex = parseInt(moduleId);
          // Vérifier si le moduleIndex est valide dans le tableau des modules
          if (moduleIndex >= 0 && moduleIndex < availableModules.length) {
            // Utiliser l'ID réel du module plutôt que l'index
            realModuleId = availableModules[moduleIndex].id;
            console.log(
              `Converted module index ${moduleId} to module ID ${realModuleId}`
            );
          }
        }

        // Fetch module data with the real module ID
        console.log("Fetching module data for:", {
          courseId,
          moduleId: realModuleId,
        });
        const module = await fetchModuleDetails(courseId, realModuleId);
        if (!module) {
          let errorMessage = `Module non trouvé (Cours: ${courseId}, Module: ${realModuleId})`;

          // Ajouter la liste des modules disponibles
          if (availableModules.length > 0) {
            errorMessage += "\n\nModules disponibles:";
            availableModules.forEach((m, index) => {
              errorMessage += `\n${index}: ${m.title} (ID: ${m.id})`;
            });
          }

          console.error(errorMessage);
          setError(errorMessage);
          setLoading(false);
          return;
        }
        console.log("Module data retrieved:", module);
        setModuleData(module);

        // Check enrollment
        console.log("Checking enrollment for user:", user.uid);
        const enrollments = await fetchUserEnrollments(user.uid);
        const isUserEnrolled = enrollments.some((e) => e.courseId === courseId);
        console.log("Enrollment status:", isUserEnrolled);
        setIsEnrolled(isUserEnrolled);

        if (!isUserEnrolled) {
          console.warn("User not enrolled in course:", {
            userId: user.uid,
            courseId,
          });
        }
      } catch (error) {
        console.error("Error loading module data:", error);
        setError(`Erreur lors du chargement des données: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadModuleData();
  }, [courseId, moduleId, user]);

  const handleModuleComplete = async (score) => {
    if (!user || !courseId || !moduleId) return;

    try {
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${courseId}/modules/${moduleId}`
      );
      await set(progressRef, {
        completed: true,
        score: score,
        completedAt: new Date().toISOString(),
      });

      // Optionally navigate to next module or show completion message
      navigate(`/course/${courseId}`);
    } catch (error) {
      setError("Erreur lors de la mise à jour de la progression");
    }
  };

  if (loading) {
    return <OptimizedLoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to={`/course/${courseId}`}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au cours
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">{moduleData?.title}</h1>
        <p className="text-gray-600 mb-6">{moduleData?.description}</p>

        {!isEnrolled ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Vous devez être inscrit au cours pour accéder à ce module.
          </div>
        ) : (
          <ModuleContent
            module={moduleData}
            onComplete={handleModuleComplete}
            isEnrolled={isEnrolled}
            courseId={courseId}
          />
        )}
      </div>
    </div>
  );
};

export default ModulePage;
