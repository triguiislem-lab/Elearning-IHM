import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { database } from "../../../firebaseConfig";
import { ref, get } from "firebase/database";
import ModuleContentFix from "./ModuleContentFix";
import { MdVisibility, MdClose, MdCheck } from "react-icons/md";

/**
 * This component allows instructors to test how their module resources and evaluations
 * will appear to students. It renders a preview of the module using ModuleContentFix.
 */
const StudentViewTester = ({ courseId, moduleId }) => {
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resourcesFound, setResourcesFound] = useState(false);
  const [evaluationsFound, setEvaluationsFound] = useState(false);

  // Fetch module data when preview is shown
  useEffect(() => {
    if (showPreview && moduleId && courseId) {
      setLoading(true);
      setError("");

      const fetchModuleData = async () => {
        try {
          // Try multiple paths to find the module
          const modulePath = `elearning/courses/${courseId}/modules/${moduleId}`;
          console.log("Testing student view - Trying path:", modulePath);
          const moduleRef = ref(database, modulePath);
          const snapshot = await get(moduleRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            setModuleData({
              ...data,
              id: moduleId,
              courseId: courseId,
            });

            // Check if resources and evaluations exist
            if (data.resources) {
              const resourcesArray = Array.isArray(data.resources)
                ? data.resources
                : Object.values(data.resources);
              setResourcesFound(resourcesArray.length > 0);
            }

            if (data.evaluations) {
              const evaluationsArray = Array.isArray(data.evaluations)
                ? data.evaluations
                : Object.values(data.evaluations);
              setEvaluationsFound(evaluationsArray.length > 0);
            }

            setLoading(false);
            return;
          }

          // Try alternative path
          const coursePath = `elearning/courses/${courseId}`;
          console.log("Testing student view - Trying course path:", coursePath);
          const courseRef = ref(database, coursePath);
          const courseSnapshot = await get(courseRef);

          if (courseSnapshot.exists()) {
            const courseData = courseSnapshot.val();

            if (courseData.modules) {
              if (Array.isArray(courseData.modules)) {
                const foundModule = courseData.modules.find(
                  (m) => m && m.id === moduleId
                );
                if (foundModule) {
                  setModuleData({
                    ...foundModule,
                    courseId: courseId,
                  });

                  // Check resources and evaluations
                  setResourcesFound(
                    !!foundModule.resources &&
                      (Array.isArray(foundModule.resources)
                        ? foundModule.resources.length > 0
                        : Object.keys(foundModule.resources).length > 0)
                  );

                  setEvaluationsFound(
                    !!foundModule.evaluations &&
                      (Array.isArray(foundModule.evaluations)
                        ? foundModule.evaluations.length > 0
                        : Object.keys(foundModule.evaluations).length > 0)
                  );

                  setLoading(false);
                  return;
                }
              } else if (typeof courseData.modules === "object") {
                if (courseData.modules[moduleId]) {
                  const foundModule = courseData.modules[moduleId];
                  setModuleData({
                    ...foundModule,
                    id: moduleId,
                    courseId: courseId,
                  });

                  // Check resources and evaluations
                  setResourcesFound(
                    !!foundModule.resources &&
                      (Array.isArray(foundModule.resources)
                        ? foundModule.resources.length > 0
                        : Object.keys(foundModule.resources).length > 0)
                  );

                  setEvaluationsFound(
                    !!foundModule.evaluations &&
                      (Array.isArray(foundModule.evaluations)
                        ? foundModule.evaluations.length > 0
                        : Object.keys(foundModule.evaluations).length > 0)
                  );

                  setLoading(false);
                  return;
                }
              }
            }
          }

          setError(
            "Module non trouvé. Vérifiez que vous avez bien ajouté des ressources et des évaluations."
          );
          setLoading(false);
        } catch (err) {
          console.error("Error fetching module data:", err);
          setError("Erreur lors du chargement des données du module");
          setLoading(false);
        }
      };

      fetchModuleData();
    }
  }, [showPreview, moduleId, courseId]);

  // Mock completion handler for testing
  const handleComplete = (type, itemId, score) => {
    console.log(
      `Preview: Item completed - type=${type}, id=${itemId}, score=${
        score || "N/A"
      }`
    );
    alert(
      `Preview: ${
        type === "resource" ? "Ressource" : "Évaluation"
      } ${itemId} complétée${score ? ` avec un score de ${score}` : ""}`
    );
  };

  // Don't render anything if there's no module ID or course ID
  if (!moduleId || !courseId) {
    return null;
  }

  return (
    <div className="mt-4">
      {!showPreview ? (
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          <MdVisibility />
          <span>Tester la vue étudiant</span>
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Aperçu Vue Étudiant</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <MdClose />
            </button>
          </div>

          {loading ? (
            <div className="py-4 text-center">Chargement de l'aperçu...</div>
          ) : error ? (
            <div className="bg-red-50 p-3 rounded-md text-red-700">{error}</div>
          ) : moduleData ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <div
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                    resourcesFound
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {resourcesFound ? <MdCheck /> : <MdClose />}
                  Ressources: {resourcesFound ? "Trouvées" : "Non trouvées"}
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                    evaluationsFound
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {evaluationsFound ? <MdCheck /> : <MdClose />}
                  Évaluations: {evaluationsFound ? "Trouvées" : "Non trouvées"}
                </div>
              </div>

              <ModuleContentFix
                module={moduleData}
                courseId={courseId}
                isEnrolled={true}
                onComplete={handleComplete}
              />
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              Aucune donnée de module disponible
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentViewTester;
