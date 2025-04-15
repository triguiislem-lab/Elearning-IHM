import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { database } from "../../../firebaseConfig";
import { ref, set, get } from "firebase/database";
import ModuleResources from "./ModuleResources";
import ModuleEvaluation from "../Evaluation/ModuleEvaluation";
import { motion } from "framer-motion";
import {
  MdInfo,
  MdWarning,
  MdErrorOutline,
  MdNotStarted,
} from "react-icons/md";
import { synchronizeProgressPaths } from "../../utils/progressUtils";

const ModuleContent = ({ module, onComplete, isEnrolled, courseId }) => {
  const { user } = useAuth();
  const [currentProgress, setCurrentProgress] = useState(0);
  const [progressUpdating, setProgressUpdating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("content");
  const [evaluationAttempts, setEvaluationAttempts] = useState([]);
  const [moduleData, setModuleData] = useState(module);
  const [loading, setLoading] = useState(false);

  // Define these variables at the top to avoid reference errors
  let hasResources = false;
  let hasEvaluations = false;

  // Vérifier si le module est valide
  const isModuleValid =
    moduleData && moduleData.id && (moduleData.title || moduleData.titre);

  // Log module data for debugging
  useEffect(() => {
    if (moduleData) {
      console.log("Module data:", moduleData);
      console.log("Module resources:", moduleData.resources);
      console.log("Module evaluations:", moduleData.evaluations);
    }
  }, [moduleData]);

  // Effet pour tenter de charger le module si celui-ci est incomplet
  useEffect(() => {
    if ((!module || !module.title) && courseId && module?.id) {
      fetchModuleData(courseId, module.id);
    } else if (module) {
      // Create a deep copy to avoid modifying the original
      const normalizedModule = JSON.parse(JSON.stringify(module || {}));

      // Only set moduleData if it's different from current to avoid infinite loops
      setModuleData(normalizedModule);
    }
  }, [module, courseId]);

  // Separate effect to handle normalization after moduleData is set
  useEffect(() => {
    if (!moduleData) return;

    // Create a copy to avoid modifying the original
    const updatedModule = { ...moduleData };
    let needsUpdate = false;

    // Only update resources if they exist in an object format that needs normalization
    if (
      updatedModule.resources &&
      typeof updatedModule.resources === "object" &&
      !Array.isArray(updatedModule.resources)
    ) {
      try {
        // Convert resources object to array
        updatedModule.resources = Object.entries(updatedModule.resources)
          .filter(
            ([_, value]) => value !== null && typeof value !== "undefined"
          )
          .map(([id, resource]) => {
            // Handle case where resource is just a boolean (true)
            if (typeof resource === "boolean") {
              return { id, title: `Resource ${id}`, type: "document" };
            }
            // Handle string values (URLs, etc.)
            if (typeof resource === "string") {
              return {
                id,
                title: `Resource ${id}`,
                type: "link",
                url: resource,
              };
            }
            return {
              id,
              ...resource,
              title: resource.title || `Resource ${id}`,
            };
          });
        needsUpdate = true;
      } catch (error) {
        console.error("Error normalizing resources:", error);
      }
    }

    // Only update evaluations if they exist in an object format that needs normalization
    if (
      updatedModule.evaluations &&
      typeof updatedModule.evaluations === "object" &&
      !Array.isArray(updatedModule.evaluations)
    ) {
      try {
        // Convert evaluations object to array
        updatedModule.evaluations = Object.entries(updatedModule.evaluations)
          .filter(
            ([_, value]) => value !== null && typeof value !== "undefined"
          )
          .map(([id, evaluation]) => {
            // Handle case where evaluation is just a boolean (true)
            if (typeof evaluation === "boolean") {
              return {
                id,
                title: `Evaluation ${id}`,
                type: "quiz",
                questions: [],
                maxScore: 100,
              };
            }
            // Handle quiz data that might be nested
            if (evaluation && typeof evaluation === "object") {
              // Make sure questions is an array
              const questions = evaluation.questions || [];
              return {
                id,
                ...evaluation,
                title: evaluation.title || `Evaluation ${id}`,
                type: evaluation.type || "quiz",
                questions: Array.isArray(questions)
                  ? questions
                  : Object.values(questions || {}),
                maxScore: evaluation.maxScore || 100,
              };
            }
            return {
              id,
              title: `Evaluation ${id}`,
              type: "quiz",
              questions: [],
              maxScore: 100,
            };
          });
        needsUpdate = true;
      } catch (error) {
        console.error("Error normalizing evaluations:", error);
      }
    }

    // Only update if something actually changed
    if (needsUpdate) {
      setModuleData(updatedModule);
    }
  }, [moduleData?.id]); // Only run this when moduleData.id changes, which indicates a new module

  useEffect(() => {
    if (user && isModuleValid) {
      loadProgress();
      loadEvaluationAttempts();
    }
  }, [user, isModuleValid, moduleData]);

  useEffect(() => {
    // Si le module n'a pas d'évaluations, définissez l'onglet actif sur "content"
    if (!hasEvaluations && activeTab === "evaluation") {
      setActiveTab("content");
    }
  }, [hasEvaluations, activeTab]);

  // Nouvelle logique pour normaliser les ressources pour l'affichage
  const normalizeResourcesForDisplay = (resourcesData) => {
    if (!resourcesData) return [];

    // Si c'est déjà un tableau, s'assurer que chaque élément est correctement formaté
    if (Array.isArray(resourcesData)) {
      return resourcesData.map((resource) => ({
        id:
          resource.id ||
          `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: resource.title || "Ressource sans titre",
        type: resource.type || "document",
        url: resource.url || "",
        description: resource.description || "",
        ...resource,
      }));
    }

    // Si c'est un objet, convertir en tableau
    if (typeof resourcesData === "object") {
      return Object.entries(resourcesData)
        .filter(([_, res]) => res !== null && typeof res !== "undefined")
        .map(([id, resource]) => {
          // Si c'est juste une valeur booléenne ou une chaîne
          if (typeof resource === "boolean") {
            return {
              id,
              title: `Ressource ${id}`,
              type: "document",
              description: "",
            };
          }

          if (typeof resource === "string") {
            return {
              id,
              title: `Ressource ${id}`,
              type: "link",
              url: resource,
              description: "",
            };
          }

          // Sinon c'est un objet
          return {
            id: resource.id || id,
            title: resource.title || `Ressource ${id}`,
            type: resource.type || "document",
            url: resource.url || "",
            description: resource.description || "",
            ...resource,
          };
        });
    }

    return [];
  };

  // Nouvelle logique pour normaliser les évaluations pour l'affichage
  const normalizeEvaluationsForDisplay = (evaluationsData) => {
    if (!evaluationsData) return [];

    // Si c'est déjà un tableau, s'assurer que chaque élément est correctement formaté
    if (Array.isArray(evaluationsData)) {
      return evaluationsData.map((evaluation) => ({
        id:
          evaluation.id ||
          `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: evaluation.title || "Évaluation sans titre",
        type: evaluation.type || "quiz",
        maxScore: evaluation.maxScore || 100,
        questions: Array.isArray(evaluation.questions)
          ? evaluation.questions
          : evaluation.questions
          ? Object.values(evaluation.questions)
          : [],
        ...evaluation,
      }));
    }

    // Si c'est un objet, convertir en tableau
    if (typeof evaluationsData === "object") {
      return Object.entries(evaluationsData)
        .filter(
          ([_, evalItem]) =>
            evalItem !== null && typeof evalItem !== "undefined"
        )
        .map(([id, evaluation]) => {
          // Si c'est juste une valeur booléenne
          if (typeof evaluation === "boolean") {
            return {
              id,
              title: `Évaluation ${id}`,
              type: "quiz",
              maxScore: 100,
              questions: [],
            };
          }

          // Sinon c'est un objet
          return {
            id: evaluation.id || id,
            title: evaluation.title || `Évaluation ${id}`,
            type: evaluation.type || "quiz",
            maxScore: evaluation.maxScore || 100,
            questions: Array.isArray(evaluation.questions)
              ? evaluation.questions
              : evaluation.questions
              ? Object.values(evaluation.questions)
              : [],
            ...evaluation,
          };
        });
    }

    return [];
  };

  // Calculer les ressources et évaluations normalisées une seule fois pour l'affichage
  const moduleSafe = moduleData || {};
  const normalizedResourcesForDisplay = normalizeResourcesForDisplay(
    moduleSafe.resources
  );
  const normalizedEvaluationsForDisplay = normalizeEvaluationsForDisplay(
    moduleSafe.evaluations
  );

  // Utiliser ces variables pour calculer hasResources et hasEvaluations
  hasResources = normalizedResourcesForDisplay.length > 0;
  hasEvaluations = normalizedEvaluationsForDisplay.length > 0;

  // Nouvelle fonction pour récupérer les données du module directement depuis Firebase
  const fetchModuleData = async (courseId, moduleId) => {
    if (!courseId || !moduleId) return;

    setLoading(true);
    try {
      // Essayer de récupérer le module depuis le chemin modules du cours
      const modulePath = `elearning/courses/${courseId}/modules/${moduleId}`;
      const moduleRef = ref(database, modulePath);
      const snapshot = await get(moduleRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        setModuleData({
          ...data,
          id: moduleId,
          courseId: courseId,
        });
        return;
      }

      // Si le module n'est pas trouvé, essayer un chemin alternatif
      const alternativePath = `elearning/modules/${courseId}/${moduleId}`;
      const altModuleRef = ref(database, alternativePath);
      const altSnapshot = await get(altModuleRef);

      if (altSnapshot.exists()) {
        const data = altSnapshot.val();
        setModuleData({
          ...data,
          id: moduleId,
          courseId: courseId,
        });
        return;
      }

      // Si toujours pas trouvé, vérifier dans le cours lui-même
      const coursePath = `elearning/courses/${courseId}`;
      const courseRef = ref(database, coursePath);
      const courseSnapshot = await get(courseRef);

      if (courseSnapshot.exists()) {
        const courseData = courseSnapshot.val();
        if (courseData.modules) {
          // Si les modules sont dans un tableau
          if (Array.isArray(courseData.modules)) {
            const foundModule = courseData.modules.find(
              (m) => m.id === moduleId
            );
            if (foundModule) {
              setModuleData({
                ...foundModule,
                courseId: courseId,
              });
              return;
            }
          }
          // Si les modules sont dans un objet
          else if (typeof courseData.modules === "object") {
            if (courseData.modules[moduleId]) {
              setModuleData({
                ...courseData.modules[moduleId],
                id: moduleId,
                courseId: courseId,
              });
              return;
            }
          }
        }
      }

      // Essayer de chercher dans le chemin hérité (Elearning avec E majuscule)
      const legacyCoursePath = `Elearning/Cours/${courseId}`;
      const legacyCourseRef = ref(database, legacyCoursePath);
      const legacyCourseSnapshot = await get(legacyCourseRef);

      if (legacyCourseSnapshot.exists()) {
        const legacyCourseData = legacyCourseSnapshot.val();

        // Chercher dans les modules du cours
        if (legacyCourseData.modules) {
          let moduleData = null;

          // Cas 1: modules est un tableau
          if (Array.isArray(legacyCourseData.modules)) {
            moduleData = legacyCourseData.modules.find(
              (m) => m.id === moduleId
            );
          }
          // Cas 2: modules est un objet
          else if (typeof legacyCourseData.modules === "object") {
            moduleData = legacyCourseData.modules[moduleId];
          }

          if (moduleData) {
            console.log(
              `Module ${moduleId} trouvé dans le cours hérité ${courseId}`
            );

            // Ensure resources exists
            if (!moduleData.resources) {
              moduleData.resources = [];
            }

            // Normaliser les ressources si elles existent
            if (
              moduleData.resources &&
              typeof moduleData.resources === "object" &&
              !Array.isArray(moduleData.resources)
            ) {
              moduleData.resources = Object.entries(moduleData.resources).map(
                ([id, resource]) => {
                  // Handle case where resource is just a boolean (true)
                  if (typeof resource === "boolean") {
                    return { id, title: `Resource ${id}`, type: "document" };
                  }
                  return {
                    id,
                    ...resource,
                  };
                }
              );
            }

            // Ensure evaluations exists
            if (!moduleData.evaluations) {
              moduleData.evaluations = [];
            }

            // Normaliser les évaluations si elles existent
            if (
              moduleData.evaluations &&
              typeof moduleData.evaluations === "object" &&
              !Array.isArray(moduleData.evaluations)
            ) {
              console.log(
                "Normalizing evaluations in fetchModuleData:",
                moduleData.evaluations
              );
              moduleData.evaluations = Object.entries(
                moduleData.evaluations
              ).map(([id, evaluation]) => {
                // Handle case where evaluation is just a boolean (true)
                if (typeof evaluation === "boolean") {
                  return { id, title: `Evaluation ${id}`, type: "quiz" };
                }
                return {
                  id,
                  ...evaluation,
                };
              });
              console.log(
                "Normalized evaluations result in fetchModuleData:",
                moduleData.evaluations
              );
            }

            setModuleData({
              ...moduleData,
              id: moduleId,
              courseId: courseId,
            });
            return;
          }
        }
      }

      // Si aucun module n'est trouvé, définir une erreur
      setError(`Module non trouvé. Veuillez contacter le formateur.`);
    } catch (err) {
      console.error("Erreur lors du chargement du module:", err);
      setError(
        "Erreur lors du chargement du module. Veuillez réessayer plus tard."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!user || !moduleData || !moduleData.id || !moduleData.courseId) return;

    try {
      // Synchroniser les chemins de progression d'abord
      await synchronizeProgressPaths(user.uid, moduleData.courseId);

      // Vérifier dans le nouveau chemin standardisé
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${moduleData.courseId}/${moduleData.id}`
      );
      const snapshot = await get(progressRef);

      if (snapshot.exists()) {
        const progressData = snapshot.val();
        setCurrentProgress(progressData.progress || 0);
      } else {
        // Si toujours pas trouvé, réinitialiser à 0
        setCurrentProgress(0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la progression:", error);
      setError("Erreur lors du chargement de la progression");
    }
  };

  const loadEvaluationAttempts = async () => {
    if (!user || !moduleData || !moduleData.id) return;

    try {
      const attemptsRef = ref(
        database,
        `elearning/evaluations/${moduleData.id}/${user.uid}/attempts`
      );
      const snapshot = await get(attemptsRef);

      if (snapshot.exists()) {
        const attempts = Object.values(snapshot.val());
        setEvaluationAttempts(attempts);
      }
    } catch (error) {
      console.error("Error loading evaluation attempts:", error);
    }
  };

  const updateProgress = async (newProgress, score = null) => {
    if (
      !user ||
      progressUpdating ||
      !moduleData ||
      !moduleData.id ||
      !moduleData.courseId
    )
      return;

    try {
      setProgressUpdating(true);
      setError("");

      // Synchroniser d'abord les chemins de progression
      await synchronizeProgressPaths(user.uid, moduleData.courseId);

      const progressData = {
        moduleId: moduleData.id,
        courseId: moduleData.courseId,
        userId: user.uid,
        progress: newProgress,
        completed: newProgress === 100,
        lastUpdated: new Date().toISOString(),
      };

      if (score !== null) {
        progressData.score = score;
      }

      // Mettre à jour dans le nouveau chemin
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${moduleData.courseId}/${moduleData.id}`
      );
      await set(progressRef, progressData);

      // Mettre à jour aussi dans l'ancien chemin pour garantir la synchronisation
      const legacyProgressRef = ref(
        database,
        `Elearning/Progression/${user.uid}/${moduleData.courseId}/${moduleData.id}`
      );
      await set(legacyProgressRef, progressData);

      setCurrentProgress(newProgress);

      if (newProgress === 100 && onComplete) {
        onComplete(score);
      }

      await checkCourseCompletion();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la progression:", error);
      setError("Erreur lors de la mise à jour de la progression");
    } finally {
      setProgressUpdating(false);
    }
  };

  const checkCourseCompletion = async () => {
    if (!user || !moduleData || !moduleData.courseId) return;

    try {
      // Récupérer la progression du cours dans le nouveau chemin
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${moduleData.courseId}`
      );
      const snapshot = await get(progressRef);

      if (snapshot.exists()) {
        const modules = Object.values(snapshot.val()).filter(
          (m) => m && typeof m === "object" && m.moduleId
        );

        if (modules.length === 0) return;

        const allModulesCompleted = modules.every((mod) => mod.completed);

        if (allModulesCompleted) {
          const validModules = modules.filter(
            (mod) => typeof mod.score === "number" && !isNaN(mod.score)
          );
          const averageScore =
            validModules.length > 0
              ? validModules.reduce((sum, mod) => sum + (mod.score || 0), 0) /
                validModules.length
              : 0;

          // Mettre à jour le statut du cours dans le nouveau chemin
          const courseStatusRef = ref(
            database,
            `elearning/courses/${moduleData.courseId}/status/${user.uid}`
          );

          const statusData = {
            completed: true,
            score: Math.round(averageScore),
            completedAt: new Date().toISOString(),
            passed: averageScore >= 70,
          };

          // Mettre à jour dans le nouveau chemin
          await set(courseStatusRef, statusData);

          // Mettre à jour aussi dans l'ancien chemin
          const legacyCourseStatusRef = ref(
            database,
            `Elearning/Cours/${moduleData.courseId}/status/${user.uid}`
          );

          await set(legacyCourseStatusRef, statusData);
        }
      }
    } catch (error) {
      console.error("Error checking course completion:", error);
    }
  };

  const handleResourceComplete = async () => {
    const newProgress = Math.min(currentProgress + 25, 100);
    await updateProgress(newProgress);
  };

  const handleEvaluationComplete = async (score) => {
    await updateProgress(100, score);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Chargement du module...</span>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded flex items-center gap-2">
        <MdWarning className="text-yellow-700 text-lg" />
        <p>Vous devez être inscrit au cours pour accéder à ce contenu.</p>
      </div>
    );
  }

  if (!isModuleValid) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-lg flex flex-col items-center gap-3">
        <MdErrorOutline className="text-red-500 text-4xl" />
        <h3 className="text-lg font-medium text-red-800">Module non trouvé</h3>
        <p className="text-center max-w-md">
          {error ||
            `Le module demandé n'existe pas ou n'est plus disponible. Veuillez revenir à la liste des modules du cours.`}
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-all"
        >
          Retour aux modules
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <MdWarning className="text-red-700 text-lg" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {moduleData.title || moduleData.titre || "Module sans titre"}
          </h2>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Progression: {currentProgress}%
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full">
              <motion.div
                className="h-2 bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        <div className="border-b mb-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("content")}
              className={`py-2 px-4 ${
                activeTab === "content"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Contenu
            </button>
            <button
              onClick={() => setActiveTab("evaluation")}
              disabled={!hasEvaluations}
              className={`py-2 px-4 ${
                activeTab === "evaluation"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : !hasEvaluations
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Évaluation {!hasEvaluations && "(Aucune)"}
            </button>
          </nav>
        </div>

        {!isEnrolled ? (
          <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 flex items-center gap-3">
            <MdWarning className="text-yellow-500 text-xl" />
            <div>
              <p className="font-medium">Accès limité</p>
              <p className="text-sm">
                Vous devez être inscrit à ce cours pour accéder aux ressources
                et aux évaluations.
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="mt-2 px-3 py-1 bg-secondary text-white text-sm rounded hover:bg-secondary/90 transition-colors"
              >
                S'inscrire maintenant
              </button>
            </div>
          </div>
        ) : activeTab === "content" ? (
          hasResources ? (
            <ModuleResources
              resources={normalizedResourcesForDisplay}
              onResourceComplete={handleResourceComplete}
              moduleId={moduleData.id}
              courseId={moduleData.courseId}
              isEnrolled={isEnrolled}
            />
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 flex items-center gap-3">
              <MdInfo className="text-blue-500 text-xl" />
              <div>
                <p className="font-medium">Aucune ressource disponible</p>
                <p className="text-sm">
                  Le formateur n'a pas encore ajouté de ressources à ce module.
                </p>
              </div>
            </div>
          )
        ) : (
          <ModuleEvaluation
            module={{
              ...moduleData,
              evaluations: normalizedEvaluationsForDisplay,
            }}
            onComplete={handleEvaluationComplete}
            attempts={evaluationAttempts}
            isEnrolled={isEnrolled}
          />
        )}
      </div>
    </div>
  );
};

export default ModuleContent;
