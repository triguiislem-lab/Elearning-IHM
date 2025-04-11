import React, { useState, useEffect } from "react";
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

const ModuleContent = ({ module, onComplete, isEnrolled, courseId }) => {
  const { user } = useAuth();
  const [currentProgress, setCurrentProgress] = useState(0);
  const [progressUpdating, setProgressUpdating] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("content");
  const [evaluationAttempts, setEvaluationAttempts] = useState([]);
  const [moduleData, setModuleData] = useState(module);
  const [loading, setLoading] = useState(false);

  // Vérifier si le module est valide
  const isModuleValid =
    moduleData && moduleData.id && (moduleData.title || moduleData.titre);

  // Vérifier si le module a des ressources et des évaluations
  const hasResources =
    isModuleValid &&
    moduleData.resources &&
    ((Array.isArray(moduleData.resources) && moduleData.resources.length > 0) ||
      (typeof moduleData.resources === "object" &&
        Object.keys(moduleData.resources).length > 0));

  const hasEvaluations =
    isModuleValid &&
    moduleData.evaluations &&
    ((Array.isArray(moduleData.evaluations) &&
      moduleData.evaluations.length > 0) ||
      (typeof moduleData.evaluations === "object" &&
        Object.keys(moduleData.evaluations).length > 0));

  // Effet pour tenter de charger le module si celui-ci est incomplet
  useEffect(() => {
    if ((!module || !module.title) && courseId && module?.id) {
      fetchModuleData(courseId, module.id);
    } else {
      setModuleData(module);
    }
  }, [module, courseId]);

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
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${moduleData.courseId}/${moduleData.id}`
      );
      const snapshot = await get(progressRef);

      if (snapshot.exists()) {
        const progressData = snapshot.val();
        setCurrentProgress(progressData.progress || 0);
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

      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${moduleData.courseId}/${moduleData.id}`
      );

      await set(progressRef, progressData);
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
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${moduleData.courseId}`
      );
      const snapshot = await get(progressRef);

      if (snapshot.exists()) {
        const modules = Object.values(snapshot.val()).filter(
          (m) => m && typeof m === "object"
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

          const courseStatusRef = ref(
            database,
            `elearning/courses/${moduleData.courseId}/status/${user.uid}`
          );

          await set(courseStatusRef, {
            completed: true,
            score: Math.round(averageScore),
            completedAt: new Date().toISOString(),
            passed: averageScore >= 70,
          });
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
                transition={{ duration: 0.5 }}
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

        {activeTab === "content" ? (
          hasResources ? (
            <ModuleResources
              resources={moduleData.resources}
              onResourceComplete={handleResourceComplete}
              moduleId={moduleData.id}
              courseId={moduleData.courseId}
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
            module={moduleData}
            onComplete={handleEvaluationComplete}
            attempts={evaluationAttempts}
          />
        )}
      </div>
    </div>
  );
};

export default ModuleContent;
