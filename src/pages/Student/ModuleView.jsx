import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database } from "../../../firebaseConfig";
import { ref, get, update } from "firebase/database";
import { MdArrowBack, MdMenu, MdWarning } from "react-icons/md";
import ModuleContentFix from "../../components/CourseModules/ModuleContentFix";
import { useAuth } from "../../hooks/useAuth";
import { fetchModuleDetails, fetchCourseById } from "../../utils/firebaseUtils";

// Debug helper to visualize objects
const debugObject = (obj, label) => {
  console.log(`-------- DEBUG ${label} START --------`);
  console.log(label, JSON.stringify(obj, null, 2));
  console.log(`-------- DEBUG ${label} END --------`);
};

// Data normalization helpers
const normalizeResources = (resources) => {
  if (!resources) return [];

  console.log(
    "Normalizing resources:",
    typeof resources,
    Array.isArray(resources)
  );

  // If resources is already an array, ensure it has consistent format
  if (Array.isArray(resources)) {
    console.log(`Resource count in array: ${resources.length}`);
    return resources.map((resource) => ({
      id:
        resource.id ||
        `resource_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      title: resource.title || "Resource",
      type: resource.type || "document",
      description: resource.description || "No description",
      url: resource.url || "",
      ...resource,
    }));
  }

  // If resources is an object, convert to array with consistent format
  if (typeof resources === "object" && resources !== null) {
    console.log(
      `Resource properties in object: ${Object.keys(resources).join(", ")}`
    );
    return Object.entries(resources)
      .filter(
        ([_, resource]) => typeof resource === "object" && resource !== null
      )
      .map(([id, resource]) => ({
        id: id,
        title: resource.title || `Resource ${id}`,
        type: resource.type || "document",
        description: resource.description || "No description",
        url: resource.url || "",
        ...resource,
      }));
  }

  console.log("Resources is not in a recognized format:", resources);
  return [];
};

const normalizeEvaluations = (evaluations) => {
  if (!evaluations) return [];

  console.log(
    "Normalizing evaluations:",
    typeof evaluations,
    Array.isArray(evaluations)
  );

  // If evaluations is already an array, ensure it has consistent format
  if (Array.isArray(evaluations)) {
    console.log(`Evaluation count in array: ${evaluations.length}`);
    return evaluations.map((evaluation) => ({
      id:
        evaluation.id ||
        `eval_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      title: evaluation.title || "Evaluation",
      type: evaluation.type || "quiz",
      description: evaluation.description || "No description",
      questions: evaluation.questions || [],
      ...evaluation,
    }));
  }

  // If evaluations is an object, convert to array with consistent format
  if (typeof evaluations === "object" && evaluations !== null) {
    console.log(
      `Evaluation properties in object: ${Object.keys(evaluations).join(", ")}`
    );
    return Object.entries(evaluations)
      .filter(
        ([_, evaluation]) =>
          typeof evaluation === "object" && evaluation !== null
      )
      .map(([id, evaluation]) => ({
        id: id,
        title: evaluation.title || `Evaluation ${id}`,
        type: evaluation.type || "quiz",
        description: evaluation.description || "No description",
        questions: evaluation.questions || [],
        ...evaluation,
      }));
  }

  console.log("Evaluations is not in a recognized format:", evaluations);
  return [];
};

const ModuleView = () => {
  const { courseId, moduleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [dataFetchRetries, setDataFetchRetries] = useState(0);
  const [debugInfo, setDebugInfo] = useState(null);

  // Improved function to try fetching module data from different paths
  const fetchModuleDataEnhanced = async (courseId, moduleId) => {
    console.log("========================================");
    console.log(
      `Enhanced module data fetching for: courseId=${courseId}, moduleId=${moduleId}`
    );

    try {
      // Get the course first to know what modules are available
      console.log("First fetching course data to determine available modules");
      const courseRef = ref(database, `elearning/courses/${courseId}`);
      const courseSnapshot = await get(courseRef);

      let availableModules = [];
      let realModuleId = moduleId;

      if (courseSnapshot.exists()) {
        const courseData = courseSnapshot.val();
        console.log("Course data found for module lookup");

        // Check if modules exist and extract info
        if (courseData.modules) {
          if (Array.isArray(courseData.modules)) {
            console.log(
              "Course has modules as array, length:",
              courseData.modules.length
            );
            availableModules = courseData.modules.map((m, index) => ({
              id: m.id || String(index),
              order: m.order || index,
              title: m.title || `Module ${index + 1}`,
            }));
          } else if (typeof courseData.modules === "object") {
            console.log(
              "Course has modules as object, keys:",
              Object.keys(courseData.modules).length
            );
            availableModules = Object.entries(courseData.modules)
              .filter(([_, module]) => typeof module === "object")
              .map(([id, module], index) => ({
                id,
                order: module.order || index,
                title: module.title || `Module ${index + 1}`,
              }));
          }

          // Sort modules by order
          availableModules.sort((a, b) => (a.order || 0) - (b.order || 0));
          console.log(
            "Available modules:",
            availableModules.map((m) => `${m.id} (${m.title})`).join(", ")
          );

          // If moduleId is numeric and out of bounds or doesn't exist,
          // use the module at that position instead of literal ID
          if (/^\d+$/.test(moduleId)) {
            const numericIndex = parseInt(moduleId, 10);
            console.log(
              `Module ID is numeric (${numericIndex}), checking if it's an index`
            );

            if (numericIndex < availableModules.length) {
              const moduleAtIndex = availableModules[numericIndex];
              console.log(
                `Using module at index ${numericIndex}: ID ${moduleAtIndex.id}, title "${moduleAtIndex.title}"`
              );
              realModuleId = moduleAtIndex.id;
            } else {
              console.log(
                `Index ${numericIndex} is out of bounds, using first module instead`
              );
              if (availableModules.length > 0) {
                realModuleId = availableModules[0].id;
              }
            }
          }
        } else {
          console.log("⚠️ Course has no modules property");
        }
      }

      console.log(`Using real module ID: ${realModuleId}`);

      // Now try the official utility function with the real module ID
      console.log("Attempting to fetch via utility function");
      const moduleData = await fetchModuleDetails(courseId, realModuleId);
      if (moduleData) {
        console.log("✅ Module data found via utility function");
        debugObject(moduleData, "Module from utility");

        // Ensure resources and evaluations are properly formatted
        const normalizedModule = {
          ...moduleData,
          resources: normalizeResources(moduleData.resources),
          evaluations: normalizeEvaluations(moduleData.evaluations),
        };

        console.log(
          `Resources after normalization: ${normalizedModule.resources.length}`
        );
        console.log(
          `Evaluations after normalization: ${normalizedModule.evaluations.length}`
        );

        return normalizedModule;
      } else {
        console.log(
          "❌ Module not found via utility function, trying direct paths"
        );
      }

      // If that fails, try our own direct fetch with multiple paths
      let foundModule = null;

      // Path 1: Direct module path with real module ID
      const modulePath = `elearning/courses/${courseId}/modules/${realModuleId}`;
      console.log("Trying direct path:", modulePath);
      const moduleRef = ref(database, modulePath);
      const snapshot = await get(moduleRef);

      if (snapshot.exists()) {
        console.log("✅ Module found at direct path");
        const data = snapshot.val();
        foundModule = {
          ...data,
          id: realModuleId,
          courseId: courseId,
          resources: normalizeResources(data.resources),
          evaluations: normalizeEvaluations(data.evaluations),
        };
      } else {
        console.log("❌ Module not found at direct path");
      }

      // Path 2: Check for direct resources and evaluations paths
      if (
        foundModule &&
        (!foundModule.resources || foundModule.resources.length === 0)
      ) {
        console.log(
          "Module found but no resources, checking separate resource paths"
        );

        const resourcePaths = [
          `elearning/resources/${courseId}/${realModuleId}`,
          `elearning/courses/${courseId}/resources/${realModuleId}`,
          `Elearning/Cours/${courseId}/resources/${realModuleId}`,
        ];

        for (const path of resourcePaths) {
          console.log("Checking resources at path:", path);
          const resourcesRef = ref(database, path);
          const resourcesSnapshot = await get(resourcesRef);

          if (resourcesSnapshot.exists()) {
            console.log("✅ Resources found at separate path:", path);
            const resourcesData = resourcesSnapshot.val();
            foundModule.resources = normalizeResources(resourcesData);
            break;
          }
        }
      }

      if (
        foundModule &&
        (!foundModule.evaluations || foundModule.evaluations.length === 0)
      ) {
        console.log(
          "Module found but no evaluations, checking separate evaluation paths"
        );

        const evaluationPaths = [
          `elearning/evaluations/${realModuleId}`,
          `elearning/courses/${courseId}/evaluations/${realModuleId}`,
          `Elearning/Cours/${courseId}/evaluations/${realModuleId}`,
        ];

        for (const path of evaluationPaths) {
          console.log("Checking evaluations at path:", path);
          const evaluationsRef = ref(database, path);
          const evaluationsSnapshot = await get(evaluationsRef);

          if (evaluationsSnapshot.exists()) {
            console.log("✅ Evaluations found at separate path:", path);
            const evaluationsData = evaluationsSnapshot.val();
            foundModule.evaluations = normalizeEvaluations(evaluationsData);
            break;
          }
        }
      }

      // If still not found, try legacy paths with real module ID
      if (!foundModule) {
        const legacyPaths = [
          `Elearning/Cours/${courseId}/modules/${realModuleId}`,
          `Elearning/modules/${courseId}/${realModuleId}`,
          `elearning/modules/${courseId}/${realModuleId}`,
        ];

        for (const path of legacyPaths) {
          console.log("Trying legacy path:", path);
          const legacyRef = ref(database, path);
          const legacySnapshot = await get(legacyRef);

          if (legacySnapshot.exists()) {
            console.log("✅ Module found at legacy path:", path);
            const data = legacySnapshot.val();
            foundModule = {
              ...data,
              id: realModuleId,
              courseId: courseId,
              resources: normalizeResources(data.resources),
              evaluations: normalizeEvaluations(data.evaluations),
            };
            break;
          } else {
            console.log("❌ Module not found at legacy path:", path);
          }
        }
      }

      // Final checks and make sure module has resources and evaluations arrays
      if (foundModule) {
        // Ensure we have resources and evaluations arrays even if empty
        if (!foundModule.resources) {
          console.log("⚠️ Adding empty resources array");
          foundModule.resources = [];
        }

        if (!foundModule.evaluations) {
          console.log("⚠️ Adding empty evaluations array");
          foundModule.evaluations = [];
        }

        debugObject(foundModule, "Final normalized module");
        console.log(`Final resource count: ${foundModule.resources.length}`);
        console.log(
          `Final evaluation count: ${foundModule.evaluations.length}`
        );
        return foundModule;
      }

      // If we got here and still no module found, see if we can create a minimal one from course data
      if (!foundModule && availableModules.length > 0) {
        console.log(
          "No module found through direct paths, creating one from course data"
        );
        const moduleInfo =
          availableModules.find((m) => m.id === realModuleId) ||
          availableModules[0];

        foundModule = {
          id: moduleInfo.id,
          courseId: courseId,
          title: moduleInfo.title,
          order: moduleInfo.order,
          resources: [],
          evaluations: [],
        };

        console.log(
          `Created minimal module with ID ${foundModule.id} and title "${foundModule.title}"`
        );
        return foundModule;
      }

      console.log("❌ No module data found after trying all paths");
      return null;
    } catch (error) {
      console.error("❌ Error in enhanced module data fetching:", error);
      return null;
    } finally {
      console.log("========================================");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !moduleId) {
        setError("Paramètres manquants dans l'URL");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(
          `Starting data fetch for course=${courseId}, module=${moduleId}`
        );

        // Récupérer les données du cours
        console.log("Fetching course data");
        const courseData = await fetchCourseById(courseId);
        if (!courseData) {
          setError(`Cours non trouvé (ID: ${courseId})`);
          setLoading(false);
          return;
        }
        console.log("Course data retrieved successfully");
        debugObject(courseData, "Course Data");
        setCourse(courseData);

        // Vérifier si l'utilisateur est inscrit au cours - Check all possible paths
        if (user) {
          // Check multiple enrollment paths to be thorough
          const enrollmentPaths = [
            `elearning/enrollments/byCourse/${courseId}/${user.uid}`,
            `elearning/enrollments/byUser/${user.uid}/${courseId}`,
            `Elearning/Enrollments/byUser/${user.uid}/${courseId}`,
            `Elearning/Cours/${courseId}/enrollments/${user.uid}`,
            `Elearning/Progression/${user.uid}/${courseId}`,
          ];

          let userIsEnrolled = false;

          // Check each path until we find enrollment
          for (const path of enrollmentPaths) {
            console.log("Checking enrollment path:", path);
            const pathRef = ref(database, path);
            try {
              const snapshot = await get(pathRef);
              if (snapshot.exists()) {
                userIsEnrolled = true;
                console.log("✅ User enrollment found at path:", path);
                break;
              }
            } catch (error) {
              console.warn(`⚠️ Error checking enrollment path ${path}:`, error);
            }
          }

          // If we have local storage enrollment info, use that as a backup
          if (!userIsEnrolled) {
            const localEnrollment = localStorage.getItem(
              `enrolled_${user.uid}_${courseId}`
            );
            if (localEnrollment === "true") {
              userIsEnrolled = true;
              console.log("✅ User enrollment found in localStorage");
            }
          }

          // Set enrollment status and save to localStorage for future reference
          setIsEnrolled(userIsEnrolled);
          if (userIsEnrolled) {
            localStorage.setItem(`enrolled_${user.uid}_${courseId}`, "true");
          }
          console.log("Enrollment status set to:", userIsEnrolled);
        }

        // Récupérer le module spécifique avec méthode améliorée
        console.log("Fetching module data with enhanced method");
        const moduleData = await fetchModuleDataEnhanced(courseId, moduleId);

        if (moduleData) {
          console.log("✅ Module data fetched successfully");

          // Store debug info for troubleshooting
          setDebugInfo({
            moduleId: moduleData.id,
            requestedModuleId: moduleId,
            actualModuleId:
              moduleData.id !== moduleId
                ? `${moduleId} → ${moduleData.id}`
                : moduleId,
            title: moduleData.title || "No title",
            resourceCount: moduleData.resources?.length || 0,
            evaluationCount: moduleData.evaluations?.length || 0,
            hasResources:
              !!moduleData.resources && moduleData.resources.length > 0,
            hasEvaluations:
              !!moduleData.evaluations && moduleData.evaluations.length > 0,
            resourceTypes: moduleData.resources
              ? Array.from(
                  new Set(moduleData.resources.map((r) => r.type))
                ).join(", ")
              : "none",
            evaluationTypes: moduleData.evaluations
              ? Array.from(
                  new Set(moduleData.evaluations.map((e) => e.type))
                ).join(", ")
              : "none",
            availableModulesInCourse: course.modules
              ? Array.isArray(course.modules)
                ? course.modules.length
                : typeof course.modules === "object"
                ? Object.keys(course.modules).length
                : 0
              : 0,
          });

          console.log("Final module data being set:", {
            requestedId: moduleId,
            actualId: moduleData.id,
            title: moduleData.title,
            resourceCount: moduleData.resources?.length || 0,
            evaluationCount: moduleData.evaluations?.length || 0,
          });

          setModule(moduleData);
        } else {
          // Si moduleData est null, créer un objet minimum pour l'afficher
          // ModuleContentFix tentera de charger les données complètes
          console.log("❌ Module data not found, creating minimal object");
          const minimalModule = {
            id: moduleId,
            courseId: courseId,
            resources: [],
            evaluations: [],
          };

          setDebugInfo({
            error: "Module data not found after multiple attempts",
            createdMinimalObject: true,
            moduleId: moduleId,
            courseId: courseId,
          });

          setModule(minimalModule);
        }
      } catch (err) {
        console.error("❌ Error during data fetching:", err);
        setError("Erreur lors du chargement des données. Veuillez réessayer.");
        setDebugInfo({
          error: err.message,
          stack: err.stack,
          moduleId: moduleId,
          courseId: courseId,
          retryCount: dataFetchRetries,
        });

        // Add retry logic for module data
        if (dataFetchRetries < 3) {
          console.log(
            `Retrying data fetch (attempt ${dataFetchRetries + 1}/3)...`
          );
          setDataFetchRetries((prev) => prev + 1);
          setTimeout(() => fetchData(), 1000);
        } else {
          console.log("❌ Max retry attempts reached");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, moduleId, user, dataFetchRetries]);

  const handleModuleComplete = async (type, itemId, score) => {
    try {
      if (!user || !course) return;

      console.log(
        `Module item completed: type=${type}, id=${itemId}, score=${
          score || "N/A"
        }`
      );

      // Store the completion in the user's progress
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${courseId}/modules/${moduleId}/${type}s/${itemId}`
      );

      const completionData = {
        completedAt: new Date().toISOString(),
        itemId: itemId,
        type: type,
      };

      if (type === "evaluation" && score !== undefined) {
        completionData.score = score;
      }

      await update(progressRef, completionData);

      // If this is an evaluation with a score, check if it's the module's final evaluation
      if (type === "evaluation" && score !== undefined) {
        // Update overall module progress
        const moduleProgressRef = ref(
          database,
          `elearning/progress/${user.uid}/${courseId}/modules/${moduleId}`
        );

        await update(moduleProgressRef, {
          lastActivity: new Date().toISOString(),
          score: score,
          status: score >= 70 ? "completed" : "in-progress", // Assuming 70% is passing
        });

        // If the score is high enough, consider showing a completion message or navigating
        if (score >= 70) {
          setTimeout(() => {
            const confirmNext = window.confirm(
              "Évaluation réussie! Voulez-vous continuer au module suivant?"
            );
            if (confirmNext && course.modules) {
              // Find the next module if there is one
              const currentModuleIndex = course.modules.findIndex(
                (m) => m.id === moduleId
              );
              if (
                currentModuleIndex >= 0 &&
                currentModuleIndex < course.modules.length - 1
              ) {
                const nextModule = course.modules[currentModuleIndex + 1];
                navigate(`/course/${courseId}/module/${nextModule.id}`);
              } else {
                // This was the last module
                navigate(`/course/${courseId}`);
              }
            }
          }, 1000);
        }
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
          onClick={() => {
            setError("");
            setDataFetchRetries((prev) => prev + 1);
          }}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-all"
        >
          Réessayer
        </button>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 ml-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-all"
        >
          Retour
        </button>

        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-xs font-mono overflow-auto">
            <details>
              <summary className="cursor-pointer text-gray-700 font-semibold">
                Informations de débogage (pour développeurs)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}
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

      {debugInfo && (
        <div className="mb-4 p-2 bg-blue-50 rounded text-sm border border-blue-200">
          <details>
            <summary className="cursor-pointer text-blue-700">
              Informations techniques
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2 text-gray-700">
              <div>
                <strong>ID Module:</strong>{" "}
                {debugInfo.actualModuleId || debugInfo.moduleId}
              </div>
              <div>
                <strong>Ressources:</strong> {debugInfo.resourceCount}
              </div>
              <div>
                <strong>Évaluations:</strong> {debugInfo.evaluationCount}
              </div>
              <div>
                <strong>Types de ressources:</strong> {debugInfo.resourceTypes}
              </div>
              {debugInfo.requestedModuleId &&
                debugInfo.requestedModuleId !== debugInfo.moduleId && (
                  <div className="col-span-2 bg-yellow-50 p-1 rounded text-yellow-700">
                    Note: ID demandé ({debugInfo.requestedModuleId}) a été
                    converti en ID réel ({debugInfo.moduleId})
                  </div>
                )}
              <div className="col-span-2 text-xs text-gray-500 mt-1">
                {debugInfo.availableModulesInCourse
                  ? `${debugInfo.availableModulesInCourse} module(s) disponible(s) dans ce cours`
                  : "Aucun module disponible dans ce cours"}
              </div>
            </div>
          </details>
        </div>
      )}

      <ModuleContentFix
        module={module}
        onComplete={handleModuleComplete}
        isEnrolled={isEnrolled}
        courseId={courseId}
      />
    </div>
  );
};

export default ModuleView;
