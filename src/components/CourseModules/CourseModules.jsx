import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  MdExpandMore,
  MdExpandLess,
  MdCheckCircle,
  MdAccessTime,
  MdPlayCircle,
  MdAssignment,
  MdQuiz,
  MdArrowForward,
  MdInfo,
  MdHelpOutline,
} from "react-icons/md";
import {
  calculateCourseScore,
  calculateCourseProgress,
  isCourseCompleted,
} from "../../utils/firebaseUtils";
import { useAuth } from "../../hooks/useAuth";
import { database } from "../../../firebaseConfig";
import { ref, get } from "firebase/database";

const CourseModules = ({ course, onModuleSelect, isEnrolled = false }) => {
  const [expandedModules, setExpandedModules] = useState({});
  const [moduleProgress, setModuleProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Vérifier si le cours a des modules
  const hasModules =
    course?.modules &&
    ((Array.isArray(course.modules) && course.modules.length > 0) ||
      (!Array.isArray(course.modules) &&
        Object.keys(course.modules).length > 0));

  // Calculer le score total du cours
  const courseScore = hasModules ? calculateCourseScore(course.modules) : 0;

  // Calculer le taux de progression
  const progressPercentage = hasModules
    ? calculateCourseProgress(course.modules)
    : 0;

  // Déterminer si le cours est complété
  const courseCompleted = hasModules
    ? isCourseCompleted(course.modules)
    : false;

  // Charger les données de progression de l'utilisateur si connecté
  useEffect(() => {
    if (user && isEnrolled && course?.id && hasModules) {
      loadUserProgress();
    }
  }, [user, isEnrolled, course?.id, hasModules]);

  const loadUserProgress = async () => {
    try {
      setLoading(true);
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${course.id}`
      );
      const snapshot = await get(progressRef);

      if (snapshot.exists()) {
        const progressData = snapshot.val();
        setModuleProgress(progressData);

        // Mise à jour du statut des modules avec les données de progression
        if (hasModules) {
          // Handle both array and object formats
          if (Array.isArray(course.modules)) {
            course.modules = course.modules.map((module) => {
              const moduleId = module.id;
              const moduleProgressData = progressData[moduleId];

              if (moduleProgressData) {
                return {
                  ...module,
                  status: moduleProgressData.completed
                    ? "completed"
                    : "in-progress",
                  progress: moduleProgressData.progress || 0,
                  score: moduleProgressData.score || module.score || 0,
                };
              }
              return module;
            });
          } else {
            // Handle object format
            Object.keys(course.modules).forEach((moduleId) => {
              const module = course.modules[moduleId];
              // Skip if module is just a boolean
              if (typeof module === "boolean") return;

              const moduleProgressData = progressData[moduleId];

              if (moduleProgressData) {
                course.modules[moduleId] = {
                  ...module,
                  status: moduleProgressData.completed
                    ? "completed"
                    : "in-progress",
                  progress: moduleProgressData.progress || 0,
                  score: moduleProgressData.score || module.score || 0,
                };
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la progression:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Fonction pour obtenir la couleur en fonction du score
  const getScoreColor = (score) => {
    if (typeof score !== "number" || isNaN(score)) return "text-gray-500";
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score > 0) return "text-red-600";
    return "text-gray-500";
  };

  // Fonction pour obtenir le statut en français
  const getStatusText = (status, progress) => {
    if (status === "completed") return "Complété";
    if (progress && progress > 0) return `En cours (${progress}%)`;
    return "Non commencé";
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status, progress) => {
    if (status === "completed") return "bg-green-100 text-green-800";
    if (progress && progress > 0) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  // Obtenir le statut d'un module
  const getModuleStatus = (module) => {
    if (!module) return { status: "not-started", progress: 0 };

    // Si le module est marqué comme complété
    if (module.status === "completed" || module.completed === true) {
      return { status: "completed", progress: 100 };
    }

    // Si le module a une progression
    if (typeof module.progress === "number" && !isNaN(module.progress)) {
      const progress = Math.min(Math.max(0, module.progress), 100);
      return {
        status: progress === 100 ? "completed" : "in-progress",
        progress,
      };
    }

    // Si les données de progression sont disponibles via l'état moduleProgress
    if (moduleProgress[module.id]) {
      const progress = moduleProgress[module.id].progress || 0;
      return {
        status: moduleProgress[module.id].completed
          ? "completed"
          : "in-progress",
        progress,
      };
    }

    // Par défaut, le module n'est pas commencé
    return { status: "not-started", progress: 0 };
  };

  if (!hasModules) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MdInfo className="text-blue-500 text-2xl" />
          <h2 className="text-xl font-bold">Modules du cours</h2>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-gray-700">
            Aucun module n'a encore été ajouté à ce cours.
          </p>
          <p className="text-gray-600 mt-2">
            Le formateur est en train de préparer le contenu qui sera bientôt
            disponible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Modules du cours</h2>
        <div className="flex items-center space-x-4">
          <div className="text-center group relative">
            <p className="text-sm text-gray-600">Score total</p>
            <p className={`text-lg font-bold ${getScoreColor(courseScore)}`}>
              {courseScore > 0 ? `${courseScore}%` : "N/A"}
            </p>
            {courseScore === 0 && (
              <div className="invisible group-hover:visible absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Aucune évaluation complétée
              </div>
            )}
          </div>
          <div className="text-center relative group">
            <p className="text-sm text-gray-600">Progression</p>
            <div className="flex items-center">
              <p className="text-lg font-bold text-blue-600">
                {progressPercentage}%
              </p>
              {isEnrolled && (
                <MdHelpOutline className="ml-1 text-gray-400 text-sm" />
              )}
            </div>
            {isEnrolled && (
              <div className="invisible group-hover:visible absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded w-48">
                Pourcentage de modules complétés ou modules partiellement
                achevés
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Statut</p>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                courseCompleted
                  ? "bg-green-100 text-green-800"
                  : progressPercentage > 0
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {courseCompleted
                ? "Réussi"
                : progressPercentage > 0
                ? "En cours"
                : "Non commencé"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Array.isArray(course.modules)
          ? // Handle array format
            course.modules.map((module, index) => {
              const { status, progress } = getModuleStatus(module);

              return (
                <motion.div
                  key={module.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Module Header */}
                  <div
                    className={`flex justify-between items-center p-4 cursor-pointer ${
                      status === "completed" ? "bg-green-50" : "bg-gray-50"
                    }`}
                    onClick={() => toggleModule(module.id)}
                  >
                    <div className="flex-1 flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          status === "completed"
                            ? "bg-green-100 text-green-600"
                            : status === "in-progress"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {status === "completed" ? (
                          <MdCheckCircle className="w-5 h-5" />
                        ) : (
                          <MdAccessTime className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          Module {index + 1}:{" "}
                          {module.title || module.titre || "Module sans titre"}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                              status,
                              progress
                            )}`}
                          >
                            {getStatusText(status, progress)}
                          </span>
                          <span
                            className={`font-medium ${getScoreColor(
                              module.score
                            )}`}
                          >
                            {typeof module.score === "number" &&
                            module.score > 0
                              ? `Score: ${module.score}%`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEnrolled) {
                            navigate(
                              `/course/${course.id}/module/${module.id}`
                            );
                          } else {
                            // Si l'utilisateur n'est pas inscrit, utiliser le callback onModuleSelect
                            if (onModuleSelect) {
                              onModuleSelect(module);
                            }
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors duration-300"
                      >
                        <span>{isEnrolled ? "Accéder" : "Aperçu"}</span>
                        <MdArrowForward size={16} />
                      </button>
                      {onModuleSelect && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher le toggle du module
                            onModuleSelect(module);
                          }}
                          className="bg-secondary text-white px-3 py-1 rounded-md text-sm hover:bg-secondary/90 transition-colors duration-300 mr-2"
                        >
                          Ouvrir
                        </button>
                      )}
                      {expandedModules[module.id] ? (
                        <MdExpandLess className="w-6 h-6 text-gray-600" />
                      ) : (
                        <MdExpandMore className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {/* Module Content */}
                  {expandedModules[module.id] && (
                    <div className="p-4 bg-white border-t">
                      <div className="mb-4">
                        <p className="text-gray-700">
                          {module.description ||
                            "Aucune description disponible."}
                        </p>
                      </div>

                      {/* Module Resources */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Ressources</h4>
                        {module.resources && module.resources.length > 0 ? (
                          <ul className="space-y-2">
                            {module.resources.map((resource, idx) => (
                              <li
                                key={resource.id || idx}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                              >
                                <MdPlayCircle className="w-5 h-5" />
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {resource.title || "Ressource"}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="bg-gray-50 p-3 rounded-lg text-gray-600">
                            <p>
                              Aucune ressource n'a encore été ajoutée à ce
                              module.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Module Evaluations */}
                      <div>
                        <h4 className="font-medium mb-2">Évaluations</h4>
                        {module.evaluations &&
                        (Array.isArray(module.evaluations)
                          ? module.evaluations.length > 0
                          : Object.keys(module.evaluations).length > 0) ? (
                          <div className="space-y-3">
                            {Array.isArray(module.evaluations)
                              ? module.evaluations.map((evaluation, idx) => (
                                  <div
                                    key={evaluation.id || idx}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      {evaluation.type === "quiz" ? (
                                        <MdQuiz className="w-5 h-5 text-blue-600" />
                                      ) : (
                                        <MdAssignment className="w-5 h-5 text-orange-600" />
                                      )}
                                      <div>
                                        <p className="font-medium">
                                          {evaluation.title ||
                                            `Évaluation ${idx + 1}`}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {evaluation.type === "quiz"
                                            ? "Quiz"
                                            : "Devoir"}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-gray-600">
                                      Score max: {evaluation.maxScore || 100}
                                    </span>
                                  </div>
                                ))
                              : Object.entries(module.evaluations).map(
                                  ([id, evaluation], idx) => (
                                    <div
                                      key={id}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center space-x-3">
                                        {evaluation.type === "quiz" ? (
                                          <MdQuiz className="w-5 h-5 text-blue-600" />
                                        ) : (
                                          <MdAssignment className="w-5 h-5 text-orange-600" />
                                        )}
                                        <div>
                                          <p className="font-medium">
                                            {evaluation.title ||
                                              `Évaluation ${idx + 1}`}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {evaluation.type === "quiz"
                                              ? "Quiz"
                                              : "Devoir"}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="text-gray-600">
                                        Score max: {evaluation.maxScore || 100}
                                      </span>
                                    </div>
                                  )
                                )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-3 rounded-lg text-gray-600">
                            <p>
                              Aucune évaluation n'a encore été ajoutée à ce
                              module.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          : // Handle object format
            Object.entries(course.modules).map(
              ([moduleId, moduleData], index) => {
                // Skip if moduleData is just a boolean
                if (typeof moduleData === "boolean") return null;

                const module = { ...moduleData, id: moduleId };
                const { status, progress } = getModuleStatus(module);

                return (
                  <motion.div
                    key={moduleId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Module Header */}
                    <div
                      className={`flex justify-between items-center p-4 cursor-pointer ${
                        status === "completed" ? "bg-green-50" : "bg-gray-50"
                      }`}
                      onClick={() => toggleModule(moduleId)}
                    >
                      <div className="flex-1 flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            status === "completed"
                              ? "bg-green-100 text-green-600"
                              : status === "in-progress"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {status === "completed" ? (
                            <MdCheckCircle className="w-5 h-5" />
                          ) : (
                            <MdAccessTime className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            Module {index + 1}:{" "}
                            {module.title ||
                              module.titre ||
                              "Module sans titre"}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                                status,
                                progress
                              )}`}
                            >
                              {getStatusText(status, progress)}
                            </span>
                            <span
                              className={`font-medium ${getScoreColor(
                                module.score
                              )}`}
                            >
                              {typeof module.score === "number" &&
                              module.score > 0
                                ? `Score: ${module.score}%`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEnrolled) {
                              navigate(
                                `/course/${course.id}/module/${moduleId}`
                              );
                            } else {
                              // Si l'utilisateur n'est pas inscrit, utiliser le callback onModuleSelect
                              if (onModuleSelect) {
                                onModuleSelect(module);
                              }
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors duration-300"
                        >
                          <span>{isEnrolled ? "Accéder" : "Aperçu"}</span>
                          <MdArrowForward size={16} />
                        </button>
                        {onModuleSelect && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Empêcher le toggle du module
                              onModuleSelect(module);
                            }}
                            className="bg-secondary text-white px-3 py-1 rounded-md text-sm hover:bg-secondary/90 transition-colors duration-300 mr-2"
                          >
                            Ouvrir
                          </button>
                        )}
                        {expandedModules[moduleId] ? (
                          <MdExpandLess className="w-6 h-6 text-gray-600" />
                        ) : (
                          <MdExpandMore className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                    </div>

                    {/* Module Content (Expanded) */}
                    {expandedModules[moduleId] && (
                      <div className="p-4 bg-white border-t">
                        {/* Module Description */}
                        {module.description && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-gray-600">
                              {module.description}
                            </p>
                          </div>
                        )}

                        {/* Module Resources */}
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Ressources</h4>
                          {module.resources && module.resources.length > 0 ? (
                            <ul className="space-y-2">
                              {module.resources.map((resource, idx) => (
                                <li
                                  key={resource.id || idx}
                                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                                >
                                  <MdPlayCircle className="w-5 h-5" />
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {resource.title || "Ressource"}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="bg-gray-50 p-3 rounded-lg text-gray-600">
                              <p>
                                Aucune ressource n'a encore été ajoutée à ce
                                module.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Module Evaluations */}
                        <div>
                          <h4 className="font-medium mb-2">Évaluations</h4>
                          {module.evaluations &&
                          (Array.isArray(module.evaluations)
                            ? module.evaluations.length > 0
                            : Object.keys(module.evaluations).length > 0) ? (
                            <div className="space-y-3">
                              {Array.isArray(module.evaluations)
                                ? module.evaluations.map((evaluation, idx) => (
                                    <div
                                      key={evaluation.id || idx}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center space-x-3">
                                        {evaluation.type === "quiz" ? (
                                          <MdQuiz className="w-5 h-5 text-blue-600" />
                                        ) : (
                                          <MdAssignment className="w-5 h-5 text-orange-600" />
                                        )}
                                        <div>
                                          <p className="font-medium">
                                            {evaluation.title ||
                                              `Évaluation ${idx + 1}`}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {evaluation.type === "quiz"
                                              ? "Quiz"
                                              : "Devoir"}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="text-gray-600">
                                        Score max: {evaluation.maxScore || 100}
                                      </span>
                                    </div>
                                  ))
                                : Object.entries(module.evaluations).map(
                                    ([id, evaluation], idx) => (
                                      <div
                                        key={id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                      >
                                        <div className="flex items-center space-x-3">
                                          {evaluation.type === "quiz" ? (
                                            <MdQuiz className="w-5 h-5 text-blue-600" />
                                          ) : (
                                            <MdAssignment className="w-5 h-5 text-orange-600" />
                                          )}
                                          <div>
                                            <p className="font-medium">
                                              {evaluation.title ||
                                                `Évaluation ${idx + 1}`}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                              {evaluation.type === "quiz"
                                                ? "Quiz"
                                                : "Devoir"}
                                            </p>
                                          </div>
                                        </div>
                                        <span className="text-gray-600">
                                          Score max:{" "}
                                          {evaluation.maxScore || 100}
                                        </span>
                                      </div>
                                    )
                                  )}
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-3 rounded-lg text-gray-600">
                              <p>
                                Aucune évaluation n'a encore été ajoutée à ce
                                module.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              }
            )}
      </div>
    </div>
  );
};

export default CourseModules;
