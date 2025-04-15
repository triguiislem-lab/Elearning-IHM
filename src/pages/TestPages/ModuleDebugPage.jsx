import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { database } from "../../../firebaseConfig";
import { ref, get, set } from "firebase/database";
import * as paths from "../../utils/firebasePaths";
import {
  getModuleFromAllPaths,
  saveModuleToAllPaths,
  standardizeModule,
} from "../../utils/moduleStandardization";
import {
  debugModulesAndResources,
  debugModuleDetails,
} from "../../utils/debugUtils";

const ModuleDebugPage = () => {
  const { courseId } = useParams();
  const [customCourseId, setCustomCourseId] = useState(courseId || "");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [modules, setModules] = useState([]);
  const [pathsData, setPathsData] = useState([]);
  const [debugResults, setDebugResults] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [moduleDetails, setModuleDetails] = useState(null);
  const [moduleData, setModuleData] = useState({
    title: "Module de test",
    description: "Description du module de test",
    order: 1,
  });

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    if (!courseId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Utiliser notre fonction de débogage pour récupérer toutes les informations
      console.log("Démarrage du débogage pour le cours:", courseId);
      const debugData = await debugModulesAndResources(courseId);
      setDebugResults(debugData);

      // Récupérer les données du cours
      const courseRef = ref(database, paths.COURSE_PATH(courseId));
      const courseSnapshot = await get(courseRef);

      if (courseSnapshot.exists()) {
        const data = courseSnapshot.val();
        setCourseData(data);

        // Récupérer les modules
        if (data.modules) {
          if (Array.isArray(data.modules)) {
            setModules(data.modules);
          } else {
            setModules(Object.values(data.modules));
          }
        } else {
          setModules([]);
        }
      } else {
        // Essayer le chemin alternatif
        const legacyCourseRef = ref(
          database,
          paths.LEGACY_COURSE_PATH(courseId)
        );
        const legacySnapshot = await get(legacyCourseRef);

        if (legacySnapshot.exists()) {
          const data = legacySnapshot.val();
          setCourseData(data);

          // Récupérer les modules
          if (data.modules) {
            if (Array.isArray(data.modules)) {
              setModules(data.modules);
            } else {
              setModules(Object.values(data.modules));
            }
          } else {
            setModules([]);
          }
        } else {
          // Si les modules ont été trouvés par le débogage mais pas le cours
          if (debugData.modules && debugData.modules.length > 0) {
            setModules(debugData.modules);
          } else {
            setError("Cours non trouvé");
          }
        }
      }

      // Récupérer tous les chemins possibles pour les modules
      const possiblePaths = [
        `elearning/courses/${courseId}/modules`,
        `elearning/modules/${courseId}`,
        `Elearning/Cours/${courseId}/modules`,
        `Elearning/Modules/${courseId}`,
      ];

      const pathResults = [];

      for (const path of possiblePaths) {
        const pathRef = ref(database, path);
        const pathSnapshot = await get(pathRef);

        if (pathSnapshot.exists()) {
          const data = pathSnapshot.val();
          pathResults.push({
            path,
            exists: true,
            count: Array.isArray(data) ? data.length : Object.keys(data).length,
            data: data,
          });
        } else {
          pathResults.push({
            path,
            exists: false,
            count: 0,
            data: null,
          });
        }
      }

      setPathsData(pathResults);
      setSuccess(
        "Débogage terminé avec succès. Consultez la console pour plus de détails."
      );
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/test/module-debug/${customCourseId}`);
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!courseId) {
        throw new Error("Course ID is required");
      }

      if (!moduleData.title.trim()) {
        throw new Error("Title is required");
      }

      // Créer un module standardisé
      const moduleToCreate = {
        ...moduleData,
        courseId: courseId,
      };

      // Sauvegarder le module dans tous les chemins
      const savedModule = await saveModuleToAllPaths(moduleToCreate, courseId);

      setSuccess(`Module "${savedModule.title}" créé avec succès!`);

      // Rafraîchir les données
      await fetchData();
    } catch (err) {
      console.error("Error creating module:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestModule = async (moduleId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSelectedModuleId(moduleId);
    setModuleDetails(null);

    try {
      // Utiliser notre fonction de débogage pour récupérer les détails du module
      console.log("Démarrage du débogage pour le module:", moduleId);
      const details = await debugModuleDetails(courseId, moduleId);
      setModuleDetails(details);

      // Récupérer le module depuis tous les chemins possibles
      const module = await getModuleFromAllPaths(courseId, moduleId);

      if (module.notFound) {
        setError(`Module ${moduleId} non trouvé`);
      } else {
        setSuccess(`Module ${moduleId} trouvé: ${module.title}`);
      }
    } catch (err) {
      console.error("Error testing module:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 bg-red-50 text-red-700 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
        <p>You must be logged in to use this test page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Module Debug Page</h1>

      <div className="mb-8 bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Different Course</h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Course ID</label>
            <input
              type="text"
              value={customCourseId}
              onChange={(e) => setCustomCourseId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter course ID"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-blue-700">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {courseId ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Course Info</h2>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p>
                <strong>Course ID:</strong> {courseId}
              </p>
              <p>
                <strong>Course Title:</strong>{" "}
                {courseData?.title || "Not found"}
              </p>
              <p>
                <strong>Module Count:</strong> {modules.length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Create Test Module</h2>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Module Title
                </label>
                <input
                  type="text"
                  value={moduleData.title}
                  onChange={(e) =>
                    setModuleData({ ...moduleData, title: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Enter module title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={moduleData.description}
                  onChange={(e) =>
                    setModuleData({
                      ...moduleData,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Enter module description"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <input
                  type="number"
                  value={moduleData.order}
                  onChange={(e) =>
                    setModuleData({
                      ...moduleData,
                      order: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border rounded"
                  min="1"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Test Module"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Module Paths</h2>
            <div className="space-y-4">
              {paths.map((path, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    path.exists ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <p>
                    <strong>Path:</strong> {path.path}
                  </p>
                  <p>
                    <strong>Exists:</strong> {path.exists ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Module Count:</strong> {path.count}
                  </p>
                  {path.exists && path.data && (
                    <div className="mt-2">
                      <p>
                        <strong>Modules:</strong>
                      </p>
                      <ul className="list-disc pl-5 mt-1">
                        {Array.isArray(path.data)
                          ? path.data.map((module, idx) => (
                              <li key={idx}>
                                {module.title || "Unnamed"} (ID: {module.id})
                                <button
                                  onClick={() => handleTestModule(module.id)}
                                  className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                                >
                                  Test
                                </button>
                              </li>
                            ))
                          : Object.entries(path.data).map(([key, module]) => (
                              <li key={key}>
                                {module.title || "Unnamed"} (ID:{" "}
                                {module.id || key})
                                <button
                                  onClick={() =>
                                    handleTestModule(module.id || key)
                                  }
                                  className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
                                >
                                  Test
                                </button>
                              </li>
                            ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Modules</h2>
            {modules.length > 0 ? (
              <div className="space-y-4">
                {modules.map((module, index) => (
                  <div key={index} className="border p-4 rounded-lg">
                    <div className="flex justify-between">
                      <h3 className="font-semibold">{module.title}</h3>
                      <button
                        onClick={() => handleTestModule(module.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                      >
                        Test
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {module.description}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>ID: {module.id}</p>
                      <p>Order: {module.order}</p>
                      <p>
                        Resources:{" "}
                        {module.resources
                          ? Array.isArray(module.resources)
                            ? module.resources.length
                            : Object.keys(module.resources).length
                          : 0}
                      </p>
                      <p>
                        Evaluations:{" "}
                        {module.evaluations
                          ? Array.isArray(module.evaluations)
                            ? module.evaluations.length
                            : Object.keys(module.evaluations).length
                          : 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No modules found for this course.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 p-4 rounded-lg">
          <p>Enter a course ID to debug modules.</p>
        </div>
      )}
    </div>
  );
};

export default ModuleDebugPage;
