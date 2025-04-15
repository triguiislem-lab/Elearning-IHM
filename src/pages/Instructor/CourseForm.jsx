import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  fetchCourseById,
  fetchSpecialitesFromDatabase,
  fetchDisciplinesFromDatabase,
} from "../../utils/firebaseUtils";
import { database } from "../../../firebaseConfig";
import { ref, set, update } from "firebase/database";
import { useAuth } from "../../hooks/useAuth";
import ModuleManagerCreation from "../../components/CourseModules/ModuleManagerCreation";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";
import ModuleContentFix from "../../components/CourseModules/ModuleContentFix";
import { MdPreview, MdClose, MdVisibility } from "react-icons/md";

// Fonction pour générer un ID unique
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const CourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const isEditMode = !!id;

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [specialites, setSpecialites] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState([]);

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    image: "",
    level: "Débutant",
    duration: "",
    price: 0,
    specialiteId: "",
    disciplineId: "",
    instructorId: "",
  });

  // État pour les modules du cours
  const [courseModules, setCourseModules] = useState([]);

  // État pour suivre l'onglet actif
  const [activeTab, setActiveTab] = useState("info"); // "info", "modules", "preview"
  const [selectedModule, setSelectedModule] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Helper for logging with timestamps
  const log = (message, data = null) => {
    const timestamp = new Date().toISOString().split("T")[1].substring(0, 8);
    console.log(`[${timestamp}] CourseForm: ${message}`);
    if (data) {
      console.log(`[${timestamp}] Data:`, data);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Attendre que l'authentification soit chargée
        if (loading) return;

        // Vérifier si l'utilisateur est connecté
        if (!user) {
          log("Utilisateur non connecté, redirection vers la page de login");
          setError("Vous devez être connecté pour accéder à cette page");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
          return;
        }

        // Vérifier si l'utilisateur est un instructeur ou un admin
        log(`Vérification des droits, userRole: ${userRole}, uid: ${user.uid}`);

        const isInstructor =
          userRole === "instructor" ||
          userRole === "formateur" ||
          user?.userType === "formateur" ||
          user?.role === "instructor" ||
          user?.role === "formateur" ||
          user?.normalizedRole === "instructor";

        const isAdmin =
          userRole === "admin" ||
          userRole === "administrateur" ||
          user?.userType === "administrateur" ||
          user?.role === "admin" ||
          user?.role === "administrateur" ||
          user?.normalizedRole === "admin";

        if (!isInstructor && !isAdmin) {
          log("Utilisateur sans droits d'instructeur ou admin");
          setError(
            "Vous n'avez pas les droits pour créer ou modifier un cours"
          );
          setTimeout(() => {
            if (isAdmin) {
              navigate("/admin/dashboard");
            } else if (isInstructor) {
              navigate("/instructor/dashboard");
            } else {
              navigate("/student/dashboard");
            }
          }, 2000);
          return;
        }

        setLoadingData(true);

        // Charger les spécialités
        log("Début du chargement des spécialités");
        const specialitesData = await fetchSpecialitesFromDatabase();
        log(`${specialitesData.length} spécialités chargées`);

        if (!specialitesData || specialitesData.length === 0) {
          log("Aucune spécialité trouvée", { specialitesData });
          setError(
            "Aucune spécialité disponible. Veuillez contacter l'administrateur."
          );
        } else {
          setSpecialites(specialitesData);
        }

        // Charger les disciplines
        log("Début du chargement des disciplines");
        const disciplinesData = await fetchDisciplinesFromDatabase();
        log(`${disciplinesData.length} disciplines chargées`);

        if (!disciplinesData || disciplinesData.length === 0) {
          log("Aucune discipline trouvée", { disciplinesData });
          setError(
            "Aucune discipline disponible. Veuillez contacter l'administrateur."
          );
        } else {
          setDisciplines(disciplinesData);
        }

        // Si on est en mode édition, charger les données du cours
        if (isEditMode) {
          log(`Chargement du cours en mode édition, ID: ${id}`);
          const course = await fetchCourseById(id);
          if (course) {
            log("Cours trouvé", {
              courseId: course.id,
              title: course.title,
              hasModules: !!course.modules,
              moduleCount: course.modules
                ? Array.isArray(course.modules)
                  ? course.modules.length
                  : typeof course.modules === "object"
                  ? Object.keys(course.modules).length
                  : 0
                : 0,
            });

            // Vérifier si l'utilisateur est l'instructeur du cours ou un admin
            if (course.instructorId !== user.uid && !isAdmin) {
              log(
                `Utilisateur ${user.uid} n'est pas l'instructeur du cours ${course.instructorId}`
              );
              setError("Vous n'avez pas les droits pour modifier ce cours");
              setTimeout(() => {
                if (isAdmin) {
                  navigate("/admin/dashboard");
                } else if (isInstructor) {
                  navigate("/instructor/dashboard");
                } else {
                  navigate("/student/dashboard");
                }
              }, 2000);
              return;
            }

            setCourseData({
              title: course.title || course.titre || "",
              description: course.description || "",
              image: course.image || "",
              level: course.level || "Débutant",
              duration: course.duration || course.duree || "",
              price: course.price || 0,
              specialiteId: course.specialiteId || "",
              disciplineId: course.disciplineId || "",
              instructorId: course.instructorId || user.uid || "",
            });

            // Filtrer les disciplines en fonction de la spécialité sélectionnée
            if (course.specialiteId) {
              const filtered = disciplinesData.filter(
                (discipline) => discipline.specialiteId === course.specialiteId
              );
              log(
                `${filtered.length} disciplines filtrées pour la spécialité ${course.specialiteId}`
              );
              setFilteredDisciplines(filtered);
            }

            // Charger les modules du cours s'ils existent
            if (course.modules) {
              log("Traitement des modules du cours");

              // Log la structure de données des modules
              if (Array.isArray(course.modules)) {
                log(
                  `Les modules sont un tableau de ${course.modules.length} éléments`
                );
              } else if (typeof course.modules === "object") {
                log(
                  `Les modules sont un objet avec ${
                    Object.keys(course.modules).length
                  } clés`,
                  { moduleKeys: Object.keys(course.modules) }
                );
              } else {
                log(`Format de modules non reconnu: ${typeof course.modules}`);
              }

              // Convertir les modules de format objet à tableau
              const modulesArray = Object.entries(course.modules).map(
                ([moduleId, moduleData]) => {
                  // Log pour chaque module
                  log(`Traitement du module ${moduleId}`, {
                    hasResources: !!moduleData.resources,
                    resourceCount: moduleData.resources
                      ? Array.isArray(moduleData.resources)
                        ? moduleData.resources.length
                        : typeof moduleData.resources === "object"
                        ? Object.keys(moduleData.resources).length
                        : 0
                      : 0,
                    hasEvaluations: !!moduleData.evaluations,
                    evalCount: moduleData.evaluations
                      ? Array.isArray(moduleData.evaluations)
                        ? moduleData.evaluations.length
                        : typeof moduleData.evaluations === "object"
                        ? Object.keys(moduleData.evaluations).length
                        : 0
                      : 0,
                  });

                  // Convertir les évaluations de format objet à tableau si elles existent
                  let evaluations = {};
                  if (moduleData.evaluations) {
                    evaluations = moduleData.evaluations;
                  }

                  return {
                    ...moduleData,
                    id: moduleId,
                    evaluations: evaluations,
                  };
                }
              );

              // Trier les modules par ordre
              const sortedModules = modulesArray.sort(
                (a, b) => (a.order || 0) - (b.order || 0)
              );

              // Filtrer les modules pour éliminer les doublons potentiels
              const uniqueModules = sortedModules.filter(
                (module, index, self) =>
                  index === self.findIndex((m) => m.id === module.id)
              );

              log(`${uniqueModules.length} modules chargés après nettoyage`);
              setCourseModules(uniqueModules);
            } else {
              log("Le cours n'a pas de modules");
            }
          } else {
            log(`Cours non trouvé avec l'ID: ${id}`);
            setError("Cours non trouvé");
          }
        } else {
          // En mode création, définir l'instructeur actuel comme instructeur par défaut
          log("Mode création de cours");
          setCourseData((prev) => ({
            ...prev,
            instructorId: user.uid || "",
          }));
        }
      } catch (error) {
        log("Erreur lors du chargement des données", {
          error: error.message,
          stack: error.stack,
        });
        setError("Erreur lors du chargement des données");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [id, isEditMode, navigate, user, userRole, loading]);

  // Effet pour filtrer les disciplines lorsque la spécialité change
  useEffect(() => {
    if (courseData.specialiteId) {
      const filtered = disciplines.filter(
        (discipline) => discipline.specialiteId === courseData.specialiteId
      );
      setFilteredDisciplines(filtered);
      if (
        courseData.disciplineId &&
        !filtered.some((d) => d.id === courseData.disciplineId)
      ) {
        setCourseData((prev) => ({ ...prev, disciplineId: "" }));
      }
    } else {
      setFilteredDisciplines([]);
      setCourseData((prev) => ({ ...prev, disciplineId: "" }));
    }
  }, [courseData.specialiteId, disciplines, courseData.disciplineId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    log("Soumission du formulaire de cours");
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      log("Validation des champs du formulaire");
      if (!courseData.title || courseData.title.trim().length < 5) {
        throw new Error(
          "Le titre est obligatoire et doit contenir au moins 5 caractères"
        );
      }
      if (
        !courseData.description ||
        courseData.description.trim().length < 10
      ) {
        throw new Error(
          "La description est obligatoire et doit contenir au moins 10 caractères"
        );
      }
      if (!courseData.duration) {
        throw new Error("La durée estimée est obligatoire");
      }
      if (courseData.price < 0) {
        throw new Error("Le prix ne peut pas être négatif");
      }
      if (!courseData.specialiteId) {
        throw new Error("Veuillez sélectionner une spécialité");
      }
      if (!courseData.disciplineId) {
        throw new Error("Veuillez sélectionner une discipline");
      }

      const timestamp = new Date().toISOString();
      const courseId = isEditMode ? id : generateUniqueId();
      log(
        `${
          isEditMode ? "Mise à jour" : "Création"
        } du cours avec ID: ${courseId}`
      );

      // Préparer les modules
      log(`Préparation de ${courseModules.length} modules pour sauvegarde`);
      const modulesData = {};
      courseModules.forEach((module, index) => {
        const moduleId = module.id || generateUniqueId();
        log(
          `Préparation du module ${index + 1}/${
            courseModules.length
          }: ${moduleId}`,
          {
            title: module.title,
            hasResources: !!module.resources,
            resourceCount: module.resources ? module.resources.length : 0,
            hasEvaluations: !!module.evaluations,
            evaluationType: typeof module.evaluations,
          }
        );

        modulesData[moduleId] = {
          ...module,
          order: index,
          updatedAt: timestamp,
        };
        // Ne pas supprimer l'id du module
        delete modulesData[moduleId].evaluationsArray;
        modulesData[moduleId].evaluations = module.evaluations || {};
      });

      // Nettoyer les données du cours
      const cleanCourseData = {
        ...courseData,
        updatedAt: timestamp,
        modules: modulesData,
      };

      // Supprimer uniquement les champs inutiles
      delete cleanCourseData.createdAt;

      log("Données prêtes pour la sauvegarde", {
        courseId,
        moduleCount: Object.keys(modulesData).length,
      });

      // Sauvegarder le cours dans la base de données
      log("Sauvegarde du cours dans la base de données");
      const courseRef = ref(database, `elearning/courses/${courseId}`);
      await update(courseRef, cleanCourseData);
      log("Cours sauvegardé avec succès");

      // Mettre à jour la référence du cours dans la liste des cours de l'instructeur
      log("Mise à jour des références");
      const instructorCoursesRef = ref(
        database,
        `elearning/users/${courseData.instructorId}/courses/${courseId}`
      );
      await update(instructorCoursesRef, {
        title: courseData.title,
        updatedAt: timestamp,
      });

      // Mettre à jour les références par spécialité et discipline
      if (courseData.specialiteId) {
        const specialiteCoursesRef = ref(
          database,
          `elearning/specialites/${courseData.specialiteId}/courses/${courseId}`
        );
        await update(specialiteCoursesRef, {
          title: courseData.title,
          updatedAt: timestamp,
        });
      }

      if (courseData.disciplineId) {
        const disciplineCoursesRef = ref(
          database,
          `elearning/disciplines/${courseData.disciplineId}/courses/${courseId}`
        );
        await update(disciplineCoursesRef, {
          title: courseData.title,
          updatedAt: timestamp,
        });
      }

      log("Toutes les mises à jour ont réussi");
      setSuccess(`Cours ${isEditMode ? "mis à jour" : "créé"} avec succès!`);
      setTimeout(() => {
        navigate("/instructor/courses");
      }, 1500);
    } catch (error) {
      log("Erreur lors de la sauvegarde", {
        error: error.message,
        stack: error.stack,
      });
      setError(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Add a new function to handle module preview
  const handleModulePreview = (module) => {
    log("Prévisualisation de module", {
      moduleId: module.id,
      title: module.title,
    });
    setSelectedModule(module);
    setPreviewMode(true);
  };

  // Add a function to simulate completion for preview
  const handlePreviewComplete = (type, itemId, score) => {
    log("Simulation de complétion en mode aperçu", { type, itemId, score });
    console.log(
      `Preview mode: ${type} completed, id: ${itemId}, score: ${score || "N/A"}`
    );
    alert(
      `${
        type === "resource" ? "Ressource" : "Évaluation"
      } complétée avec succès${score ? ` (Score: ${score})` : ""}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OptimizedLoadingSpinner
          size="large"
          text="Chargement du formulaire..."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? "Modifier le cours" : "Créer un nouveau cours"}
      </h1>

      {/* Tab Buttons */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-4 py-2 ${
            activeTab === "info"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Informations générales
        </button>
        <button
          onClick={() => setActiveTab("modules")}
          className={`px-4 py-2 ${
            activeTab === "modules"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Modules et contenu
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {activeTab === "info" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Titre du cours *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={courseData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
              placeholder="Ex: Introduction à React"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={courseData.description}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
              placeholder="Décrivez le contenu et les objectifs du cours"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="level"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Niveau *
              </label>
              <select
                id="level"
                name="level"
                value={courseData.level}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
              >
                <option value="Débutant">Débutant</option>
                <option value="Intermédiaire">Intermédiaire</option>
                <option value="Avancé">Avancé</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Durée estimée *
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={courseData.duration}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
                placeholder="Ex: 10 heures, 3 semaines"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Prix (0 pour gratuit) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={courseData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
              />
            </div>
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                URL de l'image (optionnel)
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value={courseData.image}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="specialiteId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Spécialité *
              </label>
              <select
                id="specialiteId"
                name="specialiteId"
                value={courseData.specialiteId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
              >
                <option value="">-- Sélectionnez une spécialité --</option>
                {specialites.map((specialite) => (
                  <option key={specialite.id} value={specialite.id}>
                    {specialite.name || specialite.description || "Sans nom"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="disciplineId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Discipline *
              </label>
              <select
                id="disciplineId"
                name="disciplineId"
                value={courseData.disciplineId}
                onChange={handleChange}
                required
                disabled={!courseData.specialiteId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary disabled:bg-gray-100"
              >
                <option value="">-- Sélectionnez une discipline --</option>
                {filteredDisciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name || "Sans nom"}
                  </option>
                ))}
              </select>
              {!courseData.specialiteId && (
                <p className="text-sm text-gray-500 mt-1">
                  Veuillez d'abord sélectionner une spécialité
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link
              to="/instructor/courses"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 disabled:opacity-50"
            >
              {saving
                ? "Sauvegarde en cours..."
                : isEditMode
                ? "Mettre à jour le cours"
                : "Créer le cours"}
            </button>
          </div>
        </form>
      )}

      {activeTab === "modules" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Gestion des modules</h2>
          <p className="mb-4 text-sm text-gray-600">
            Ajoutez, modifiez et organisez les modules de votre cours. Chaque
            module peut contenir des ressources (vidéos, documents, etc.) et des
            évaluations.
          </p>

          {/* Debug Info Panel */}
          <div className="mb-6 p-2 bg-blue-50 rounded text-sm border border-blue-200">
            <details>
              <summary className="cursor-pointer text-blue-700">
                Informations techniques (pour le débogage)
              </summary>
              <div className="mt-2 text-gray-700">
                <p>
                  <strong>ID du cours:</strong> {id || "Nouveau cours"}
                </p>
                <p>
                  <strong>Nombre de modules:</strong> {courseModules.length}
                </p>
                <div className="mt-2 overflow-auto max-h-40">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-1 border">Index</th>
                        <th className="p-1 border">ID</th>
                        <th className="p-1 border">Titre</th>
                        <th className="p-1 border">Ressources</th>
                        <th className="p-1 border">Évaluations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseModules.map((module, index) => (
                        <tr
                          key={module.id || index}
                          className="hover:bg-gray-50"
                        >
                          <td className="p-1 border text-center">{index}</td>
                          <td className="p-1 border">{module.id || "N/A"}</td>
                          <td className="p-1 border">
                            {module.title || "Sans titre"}
                          </td>
                          <td className="p-1 border text-center">
                            {module.resources
                              ? Array.isArray(module.resources)
                                ? module.resources.length
                                : typeof module.resources === "object"
                                ? Object.keys(module.resources).length
                                : "?"
                              : 0}
                          </td>
                          <td className="p-1 border text-center">
                            {module.evaluations
                              ? Array.isArray(module.evaluations)
                                ? module.evaluations.length
                                : typeof module.evaluations === "object"
                                ? Object.keys(module.evaluations).length
                                : "?"
                              : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  * Ces informations sont utiles pour le débogage en cas de
                  problème avec l'affichage des modules.
                </p>
              </div>
            </details>
          </div>

          <ModuleManagerCreation
            modules={courseModules}
            setModules={setCourseModules}
            courseId={id}
          />

          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 disabled:opacity-50"
            >
              {saving
                ? "Sauvegarde en cours..."
                : "Sauvegarder le cours et les modules"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseForm;
