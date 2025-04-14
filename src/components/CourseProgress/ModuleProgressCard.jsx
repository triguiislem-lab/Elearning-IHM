import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { Link } from "react-router-dom";
import {
  MdCheckCircle,
  MdWarning,
  MdLock,
  MdPlayCircleFilled,
} from "react-icons/md";

const ModuleProgressCard = ({ moduleId, courseId, moduleData, index }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const auth = getAuth();
  const database = getDatabase();

  useEffect(() => {
    const fetchModuleProgress = async () => {
      if (!auth.currentUser || !moduleId || !courseId) return;

      try {
        setLoading(true);
        setError("");

        // Vérifier la progression du module dans le nouveau chemin standardisé
        let progressionRef = ref(
          database,
          `elearning/progress/${auth.currentUser.uid}/${courseId}/${moduleId}`
        );
        let progressionSnapshot = await get(progressionRef);

        // Si aucun résultat, essayer le chemin hérité
        if (!progressionSnapshot.exists()) {
          progressionRef = ref(
            database,
            `Elearning/Progression/${auth.currentUser.uid}/${courseId}/${moduleId}`
          );
          progressionSnapshot = await get(progressionRef);
        }

        if (progressionSnapshot.exists()) {
          setProgress(progressionSnapshot.val());
        } else {
          setProgress(null);
        }
      } catch (error) {
        setError("Erreur lors de la récupération de la progression du module");
      } finally {
        setLoading(false);
      }
    };

    fetchModuleProgress();
  }, [auth.currentUser, moduleId, courseId, database]);

  // Déterminer si le module est accessible
  // Le premier module est toujours accessible
  // Les modules suivants sont accessibles si le module précédent est complété ou si l'utilisateur a déjà commencé ce module
  const isAccessible = index === 0 || (index > 0 && progress !== null);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md animate-pulse mb-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-700 mb-4">
        {error}
      </div>
    );
  }

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-md mb-4 ${
        !isAccessible ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {progress && progress.completed ? (
            <MdCheckCircle className="text-green-600 text-2xl" />
          ) : progress ? (
            <MdWarning className="text-orange-500 text-2xl" />
          ) : isAccessible ? (
            <MdPlayCircleFilled className="text-blue-600 text-2xl" />
          ) : (
            <MdLock className="text-gray-400 text-2xl" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg">
              {moduleData.title || `Module ${index + 1}`}
            </h3>
            {progress && (
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full ${
                  progress.completed
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {progress.bestScore
                  ? `${progress.bestScore.toFixed(0)}%`
                  : progress.score
                  ? `${progress.score.toFixed(0)}%`
                  : "En cours"}
              </span>
            )}
          </div>

          <p className="text-gray-600 text-sm mb-3">
            {moduleData.description || "Aucune description disponible"}
          </p>

          {progress && (
            <div className="mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    progress.completed ? "bg-green-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${progress.progress || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">
                  Progression: {progress.progress || 0}%
                </span>
                {progress.lastUpdated && (
                  <span className="text-xs text-gray-500">
                    Dernière activité:{" "}
                    {new Date(progress.lastUpdated).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            {isAccessible ? (
              <Link
                to={`/course/${courseId}/module/${moduleId}`}
                className="text-sm bg-secondary text-white px-3 py-1 rounded hover:bg-secondary/90 transition-colors duration-300"
              >
                {progress && progress.completed
                  ? "Revoir le module"
                  : "Continuer"}
              </Link>
            ) : (
              <span className="text-sm bg-gray-300 text-gray-600 px-3 py-1 rounded cursor-not-allowed">
                Module verrouillé
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleProgressCard;
