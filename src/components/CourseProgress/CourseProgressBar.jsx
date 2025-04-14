import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";

const CourseProgressBar = ({ courseId }) => {
  const [progress, setProgress] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [completedModules, setCompletedModules] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const auth = getAuth();
  const database = getDatabase();

  useEffect(() => {
    const fetchCourseProgress = async () => {
      if (!auth.currentUser || !courseId) return;

      try {
        setLoading(true);
        setError("");

        // Récupérer tous les modules du cours - vérifier le nouveau chemin d'abord
        let modulesRef = ref(database, `elearning/courses/${courseId}/modules`);
        let modulesSnapshot = await get(modulesRef);

        // Si aucun module trouvé, vérifier l'ancien chemin
        if (!modulesSnapshot.exists()) {
          modulesRef = ref(database, `Elearning/Cours/${courseId}/modules`);
          modulesSnapshot = await get(modulesRef);
        }

        if (modulesSnapshot.exists()) {
          const modules = modulesSnapshot.val();
          const moduleIds = Object.keys(modules);
          setTotalModules(moduleIds.length);

          let completed = 0;
          let totalModuleScore = 0;

          // Vérifier d'abord s'il existe une progression globale du cours dans le nouveau chemin
          let courseProgressRef = ref(
            database,
            `elearning/progress/${auth.currentUser.uid}/${courseId}`
          );
          let courseProgressSnapshot = await get(courseProgressRef);

          // Si non trouvé, vérifier l'ancien chemin
          if (!courseProgressSnapshot.exists()) {
            courseProgressRef = ref(
              database,
              `Elearning/Progression/${auth.currentUser.uid}/${courseId}`
            );
            courseProgressSnapshot = await get(courseProgressRef);
          }

          if (courseProgressSnapshot.exists()) {
            const courseProgress = courseProgressSnapshot.val();

            // Si la progression contient des détails complets, utiliser ces informations
            if (
              courseProgress.details &&
              courseProgress.details.completedModules
            ) {
              setCompletedModules(courseProgress.details.completedModules);
              setProgress(
                (courseProgress.details.completedModules / moduleIds.length) *
                  100
              );
              setTotalScore(courseProgress.score || 0);
              setLoading(false);
              return;
            }
          }

          // Sinon, vérifier la progression de chaque module individuellement
          for (const moduleId of moduleIds) {
            try {
              // Vérifier le nouveau chemin d'abord
              let progressionRef = ref(
                database,
                `elearning/progress/${auth.currentUser.uid}/${courseId}/${moduleId}`
              );
              let progressionSnapshot = await get(progressionRef);

              // Si non trouvé, vérifier l'ancien chemin
              if (!progressionSnapshot.exists()) {
                progressionRef = ref(
                  database,
                  `Elearning/Progression/${auth.currentUser.uid}/${courseId}/${moduleId}`
                );
                progressionSnapshot = await get(progressionRef);
              }

              if (progressionSnapshot.exists()) {
                const moduleProgress = progressionSnapshot.val();
                if (moduleProgress.completed) {
                  completed++;
                  // Utiliser le meilleur score disponible
                  const moduleScore =
                    moduleProgress.bestScore || moduleProgress.score || 0;
                  totalModuleScore += moduleScore;
                }
              }
            } catch (moduleError) {}
          }

          setCompletedModules(completed);

          // Calculer le pourcentage de progression
          const progressPercentage =
            moduleIds.length > 0 ? (completed / moduleIds.length) * 100 : 0;

          // Calculer le score moyen
          const averageScore = completed > 0 ? totalModuleScore / completed : 0;

          setProgress(progressPercentage);
          setTotalScore(averageScore);
        } else {
          setTotalModules(0);
          setCompletedModules(0);
          setProgress(0);
          setTotalScore(0);
        }
      } catch (error) {
        setError("Erreur lors de la récupération de la progression du cours");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseProgress();
  }, [auth.currentUser, courseId, database]);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Progression du cours</h3>
        <span className="text-sm font-medium">
          {completedModules}/{totalModules} modules
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div
          className="h-4 rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm text-gray-600">Progression:</span>
          <span className="ml-2 font-medium">{Math.round(progress)}%</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Score moyen:</span>
          <span
            className={`ml-2 font-medium ${
              totalScore >= 70 ? "text-green-600" : "text-orange-600"
            }`}
          >
            {totalScore.toFixed(1)}%
          </span>
        </div>
      </div>

      {progress === 100 && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            totalScore >= 70
              ? "bg-green-50 text-green-700"
              : "bg-yellow-50 text-yellow-700"
          }`}
        >
          {totalScore >= 70
            ? "Félicitations ! Vous avez complété ce cours avec succès."
            : "Vous avez terminé tous les modules, mais votre score moyen est inférieur à 70%. Essayez de refaire certains quiz pour améliorer votre score."}
        </div>
      )}
    </div>
  );
};

export default CourseProgressBar;
