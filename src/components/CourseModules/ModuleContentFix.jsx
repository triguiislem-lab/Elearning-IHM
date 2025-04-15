import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { database } from "../../../firebaseConfig";
import { ref, get } from "firebase/database";
import ModuleResources from "./ModuleResources";
import ModuleEvaluation from "../Evaluation/ModuleEvaluation";
import { motion } from "framer-motion";
import {
  MdInfo,
  MdWarning,
  MdErrorOutline,
  MdPlayCircle,
  MdPictureAsPdf,
  MdLink,
} from "react-icons/md";

// Improved resource normalization function that handles various data formats
const normalizeResources = (moduleData) => {
  if (!moduleData) return [];

  // If resources is already an array, use it
  if (Array.isArray(moduleData.resources)) {
    return moduleData.resources.map((resource) => ({
      ...resource,
      id:
        resource.id ||
        `resource_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      title: resource.title || "Ressource sans titre",
      type: resource.type || "document",
      description:
        resource.description ||
        `Ressource de type ${resource.type || "document"}`,
    }));
  }

  // If resources is an object, convert it to an array
  if (
    typeof moduleData.resources === "object" &&
    moduleData.resources !== null
  ) {
    return Object.entries(moduleData.resources)
      .filter(([_, resource]) => typeof resource === "object") // Filter out boolean values
      .map(([id, resource]) => ({
        id: id,
        title: resource.title || `Ressource ${id}`,
        type: resource.type || "document",
        description:
          resource.description ||
          `Ressource de type ${resource.type || "document"}`,
        url: resource.url || "",
        ...resource,
      }));
  }

  return [];
};

// Improved evaluation normalization function that handles various data formats
const normalizeEvaluations = (moduleData) => {
  if (!moduleData) return [];

  // If evaluations is already an array, use it
  if (Array.isArray(moduleData.evaluations)) {
    return moduleData.evaluations.map((evaluation) => ({
      ...evaluation,
      id:
        evaluation.id ||
        `eval_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      title: evaluation.title || "Évaluation sans titre",
      type: evaluation.type || "quiz",
      description:
        evaluation.description ||
        `Évaluation de type ${evaluation.type || "quiz"}`,
    }));
  }

  // If evaluations is an object, convert it to an array
  if (
    typeof moduleData.evaluations === "object" &&
    moduleData.evaluations !== null
  ) {
    return Object.entries(moduleData.evaluations)
      .filter(([_, evaluation]) => typeof evaluation === "object") // Filter out boolean values
      .map(([id, evaluation]) => ({
        id: id,
        title: evaluation.title || `Évaluation ${id}`,
        type: evaluation.type || "quiz",
        description:
          evaluation.description ||
          `Évaluation de type ${evaluation.type || "quiz"}`,
        questions: evaluation.questions || [],
        ...evaluation,
      }));
  }

  return [];
};

const ModuleContentFix = ({
  module,
  onComplete,
  isEnrolled = true,
  courseId,
}) => {
  const { user } = useAuth();
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("content"); // "content" or "evaluations"
  const [evaluationAttempts, setEvaluationAttempts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh

  // Fetch the latest module data directly from the database
  useEffect(() => {
    const fetchModuleData = async () => {
      if (!module || !module.id || !courseId) {
        setError("Module data is missing");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try multiple paths to find the module
        const moduleId = module.id;
        console.log("Fetching module data:", { moduleId, courseId });

        // Path 1: Direct module path
        const modulePath = `elearning/courses/${courseId}/modules/${moduleId}`;
        console.log("Trying path 1:", modulePath);
        const moduleRef = ref(database, modulePath);
        const snapshot = await get(moduleRef);

        if (snapshot.exists()) {
          console.log("Module found at direct path");
          const data = snapshot.val();
          setModuleData({
            ...data,
            id: moduleId,
            courseId: courseId,
          });
          setLoading(false);
          return;
        }

        // Path 2: Check if module is in the course object
        const coursePath = `elearning/courses/${courseId}`;
        console.log("Trying path 2:", coursePath);
        const courseRef = ref(database, coursePath);
        const courseSnapshot = await get(courseRef);

        if (courseSnapshot.exists()) {
          const courseData = courseSnapshot.val();
          console.log("Course data found:", {
            hasModules: !!courseData.modules,
            modulesType: courseData.modules
              ? typeof courseData.modules
              : "undefined",
          });

          if (courseData.modules) {
            // If modules is an array
            if (Array.isArray(courseData.modules)) {
              console.log(
                "Modules is an array, looking for moduleId:",
                moduleId
              );
              const foundModule = courseData.modules.find(
                (m) => m && m.id === moduleId
              );
              if (foundModule) {
                console.log("Module found in array");
                setModuleData({
                  ...foundModule,
                  courseId: courseId,
                });
                setLoading(false);
                return;
              }
            }
            // If modules is an object
            else if (typeof courseData.modules === "object") {
              console.log("Modules is an object, checking for key:", moduleId);
              if (courseData.modules[moduleId]) {
                console.log("Module found in object with key:", moduleId);
                setModuleData({
                  ...courseData.modules[moduleId],
                  id: moduleId,
                  courseId: courseId,
                });
                setLoading(false);
                return;
              }
            }
          }
        }

        // Path 3: Try numeric index if moduleId looks like a number
        if (!isNaN(moduleId)) {
          console.log("Module ID is numeric, trying to find by index");
          const numericIndex = parseInt(moduleId, 10);

          if (courseSnapshot.exists()) {
            const courseData = courseSnapshot.val();

            if (courseData.modules) {
              // If modules is an array and index exists
              if (
                Array.isArray(courseData.modules) &&
                courseData.modules[numericIndex]
              ) {
                console.log("Module found by numeric index in array");
                const foundModule = courseData.modules[numericIndex];
                setModuleData({
                  ...foundModule,
                  id: moduleId,
                  courseId: courseId,
                });
                setLoading(false);
                return;
              }
              // If modules is an object, try keys by index
              else if (typeof courseData.modules === "object") {
                const moduleKeys = Object.keys(courseData.modules);
                if (moduleKeys[numericIndex]) {
                  console.log("Module found by numeric index in object keys");
                  const key = moduleKeys[numericIndex];
                  const foundModule = courseData.modules[key];
                  setModuleData({
                    ...foundModule,
                    id: key,
                    courseId: courseId,
                  });
                  setLoading(false);
                  return;
                }
              }
            }
          }
        }

        // If we get here, module was not found
        console.error("Module not found after trying all paths:", {
          moduleId,
          courseId,
          moduleType: typeof moduleId,
        });
        setError(`Module non trouvé (ID: ${moduleId})`);
      } catch (err) {
        console.error("Error fetching module data:", err);
        setError("Error loading module data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [module, courseId, refreshKey]);

  // Fetch evaluation attempts for the current user and module
  useEffect(() => {
    const fetchEvaluationAttempts = async () => {
      if (!user || !moduleData) return;

      try {
        const attemptsRef = ref(
          database,
          `users/${user.uid}/evaluationAttempts/${moduleData.id}`
        );
        const snapshot = await get(attemptsRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const attemptsList = Array.isArray(data)
            ? data
            : Object.values(data || {});

          setEvaluationAttempts(attemptsList);
        }
      } catch (err) {
        console.error("Error fetching evaluation attempts:", err);
      }
    };

    fetchEvaluationAttempts();
  }, [user, moduleData]);

  // Get normalized resources and evaluations
  const normalizedResources = useMemo(() => {
    return normalizeResources(moduleData);
  }, [moduleData]);

  const normalizedEvaluations = useMemo(() => {
    return normalizeEvaluations(moduleData);
  }, [moduleData]);

  // Check if there are resources and evaluations
  const hasResources = normalizedResources.length > 0;
  const hasEvaluations = normalizedEvaluations.length > 0;

  // Force refresh the module data
  const refreshModuleData = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // Handle resource completion
  const handleResourceComplete = (resourceId) => {
    console.log("Resource completed:", resourceId);
    // Implement resource completion logic if needed
    if (onComplete) {
      onComplete("resource", resourceId);
    }
  };

  // Handle evaluation completion
  const handleEvaluationComplete = (evaluationId, score) => {
    console.log("Evaluation completed:", { evaluationId, score });
    if (onComplete) {
      onComplete("evaluation", evaluationId, score);
    }
  };

  if (loading) {
    return <div className="animate-pulse p-4">Loading module content...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <button
          onClick={refreshModuleData}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
        <p>No module data available.</p>
        <button
          onClick={refreshModuleData}
          className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  // If there are no resources or evaluations, show a message
  if (!hasResources && !hasEvaluations) {
    return (
      <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
        <p>This module has no resources or evaluations yet.</p>
        <button
          onClick={refreshModuleData}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === "content"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("content")}
        >
          Resources ({normalizedResources.length})
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === "evaluations"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("evaluations")}
        >
          Evaluations ({normalizedEvaluations.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "content" ? (
          hasResources ? (
            <ModuleResources
              resources={normalizedResources}
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
            module={{ ...moduleData, evaluations: normalizedEvaluations }}
            onComplete={handleEvaluationComplete}
            attempts={evaluationAttempts}
            isEnrolled={isEnrolled}
          />
        )}
      </div>
    </div>
  );
};

export default ModuleContentFix;
