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
  const [activeTab, setActiveTab] = useState("info"); // "info" ou "modules"

  useEffect(() => {
    const loadData = async () => {
      try {
        // Attendre que l'authentification soit chargée
        if (loading) return;

        // Vérifier si l'utilisateur est connecté
        if (!user) {
          setError("Vous devez être connecté pour accéder à cette page");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
          return;
        }

        // Vérifier si l'utilisateur est un instructeur ou un admin

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
        console.log("Début du chargement des spécialités...");
        const specialitesData = await fetchSpecialitesFromDatabase();
        console.log("Spécialités chargées:", specialitesData);

        if (!specialitesData || specialitesData.length === 0) {
          console.warn("Aucune spécialité trouvée dans la base de données");
          setError(
            "Aucune spécialité disponible. Veuillez contacter l'administrateur."
          );
        } else {
          console.log("Nombre de spécialités:", specialitesData.length);
          console.log("Première spécialité:", specialitesData[0]);
          setSpecialites(specialitesData);
        }

        // Charger les disciplines
        console.log("Début du chargement des disciplines...");
        const disciplinesData = await fetchDisciplinesFromDatabase();
        console.log("Disciplines chargées:", disciplinesData);

        if (!disciplinesData || disciplinesData.length === 0) {
          console.warn("Aucune discipline trouvée dans la base de données");
          setError(
            "Aucune discipline disponible. Veuillez contacter l'administrateur."
          );
        } else {
          console.log("Nombre de disciplines:", disciplinesData.length);
          console.log("Première discipline:", disciplinesData[0]);
          setDisciplines(disciplinesData);
        }

        // Si on est en mode édition, charger les données du cours
        if (isEditMode) {
          const course = await fetchCourseById(id);
          if (course) {
            // Vérifier si l'utilisateur est l'instructeur du cours ou un admin
            if (course.instructorId !== user.uid && !isAdmin) {
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
              setFilteredDisciplines(filtered);
            }

            // Charger les modules du cours s'ils existent
            if (course.modules) {
              // Convertir les modules de format objet à tableau
              const modulesArray = Object.entries(course.modules).map(
                ([moduleId, moduleData]) => {
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

              setCourseModules(uniqueModules);
            }
          } else {
            setError("Cours non trouvé");
          }
        } else {
          // En mode création, définir l'instructeur actuel comme instructeur par défaut
          setCourseData((prev) => ({
            ...prev,
            instructorId: user.uid || "",
          }));
        }
      } catch (error) {
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
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Validation
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

      // Préparer les modules
      const modulesData = {};
      courseModules.forEach((module, index) => {
        const moduleId = module.id || generateUniqueId();
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

      // Sauvegarder le cours dans la base de données
      const courseRef = ref(database, `elearning/courses/${courseId}`);
      await update(courseRef, cleanCourseData);

      // Mettre à jour la référence du cours dans la liste des cours de l'instructeur
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

      setSuccess(`Cours ${isEditMode ? "mis à jour" : "créé"} avec succès!`);
      setTimeout(() => {
        navigate("/instructor/courses");
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? "Modifier le cours" : "Créer un nouveau cours"}
      </h1>

      {/* Onglets */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("info")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "info"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Informations générales
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "modules"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Modules et contenu
          </button>
        </nav>
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
