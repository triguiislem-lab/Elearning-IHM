import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  fetchCourseById,
  fetchSpecialitesFromDatabase,
  fetchDisciplinesFromDatabase,
  // fetchInstructorById, // Likely no longer needed directly
  // fetchCompleteUserInfo, // Replaced by useAuth
} from "../../utils/firebaseUtils";
import { database } from "../../../firebaseConfig";
import { ref, set } from "firebase/database";
// import { getAuth } from "firebase/auth"; // Replaced by useAuth
import { useAuth } from "../../hooks/useAuth"; // Import useAuth
import ModuleManagerCreation from "../../components/CourseModules/ModuleManagerCreation";
import LoadingSpinner from "../../components/Common/LoadingSpinner"; // Import LoadingSpinner

// Fonction pour générer un ID unique sans dépendre de la bibliothèque uuid
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const CourseForm = () => {
  const { id: courseIdParam } = useParams(); // Rename id to avoid conflict
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth(); // Use the hook
  const isEditMode = !!courseIdParam;

  const [loadingData, setLoadingData] = useState(true); // Renamed component loading state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [permissionError, setPermissionError] = useState(""); // Specific error for permissions
  const [success, setSuccess] = useState("");
  const [specialites, setSpecialites] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [filteredDisciplines, setFilteredDisciplines] = useState([]);
  // const [userInfo, setUserInfo] = useState(null); // Removed, use user & role from useAuth

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
    // Ensure user is authenticated and role is loaded before proceeding
    if (authLoading) {
      return; // Wait for auth state to resolve
    }

    // If no user or role, likely redirecting via ProtectedRoute, but handle defensively
    if (!user || !role) {
      setPermissionError("Authentification requise.");
      setLoadingData(false);
      // Optional: Redirect after a delay, but ProtectedRoute should handle this
      // setTimeout(() => navigate('/login'), 1000);
      return;
    }

    // Basic role check (Admin or Instructor)
    const isAdmin = role === "admin";
    const isInstructor = role === "instructor";

    if (!isAdmin && !isInstructor) {
      setPermissionError(
        "Vous n'avez pas les permissions nécessaires pour accéder à cette page."
      );
      setLoadingData(false);
      // Optional: Redirect or show message
      // setTimeout(() => navigate(getDashboardPath(role)), 1000);
      return;
    }

    // Now load course-specific data
    const loadCourseData = async () => {
      try {
        setLoadingData(true);
        setPermissionError(""); // Clear previous errors
        setError("");

        // Fetch Specialites and Disciplines (needed for both create and edit)
        const [specialitesData, disciplinesData] = await Promise.all([
          fetchSpecialitesFromDatabase(),
          fetchDisciplinesFromDatabase(),
        ]);
        setSpecialites(specialitesData);
        setDisciplines(disciplinesData);

        // If Edit Mode: Fetch course data and perform specific permission check
        if (isEditMode) {
          const course = await fetchCourseById(courseIdParam);
          if (course) {
            // Edit Permission Check: Must be Admin OR the course's instructor
            if (course.instructorId !== user.uid && !isAdmin) {
              setPermissionError(
                "Vous n'avez pas les permissions pour modifier ce cours."
              );
              setLoadingData(false);
              return; // Stop loading if no permission
            }

            // Set form data from fetched course
            setCourseData({
              title: course.title || course.titre || "",
              description: course.description || "",
              image: course.image || "",
              level: course.level || "Débutant",
              duration: course.duration || course.duree || "",
              price: course.price || 0,
              specialiteId: course.specialiteId || "",
              disciplineId: course.disciplineId || "",
              instructorId: course.instructorId || user.uid, // Ensure instructorId is set
            });

            // Filter disciplines based on fetched speciality
            if (course.specialiteId) {
              const filtered = disciplinesData.filter(
                (discipline) => discipline.specialiteId === course.specialiteId
              );
              setFilteredDisciplines(filtered);
            }

            // Load modules if they exist
            if (course.modules) {
              const modulesArray = Object.entries(course.modules).map(
                ([moduleId, moduleData]) => ({
                  ...moduleData,
                  id: moduleId,
                  evaluations: moduleData.evaluations || {},
                })
              );
              const sortedModules = modulesArray.sort(
                (a, b) => (a.order || 0) - (b.order || 0)
              );
              setCourseModules(sortedModules);
            }
          } else {
            setError("Cours non trouvé.");
          }
        } else {
          // Create Mode: Set current user as default instructor
          setCourseData((prev) => ({
            ...prev,
            instructorId: user.uid,
          }));
        }
      } catch (err) {
        
        setError("Erreur lors du chargement des données du cours.");
      } finally {
        setLoadingData(false);
      }
    };

    loadCourseData();
  }, [courseIdParam, isEditMode, user, role, authLoading, navigate]); // Add dependencies

  // Effect to filter disciplines when speciality changes (remains the same)
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
  }, [courseData.specialiteId, courseData.disciplineId, disciplines]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: value }));
  };

  // handleSubmit logic remains largely the same, but uses user.uid implicitly via courseData.instructorId
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure user is still valid before saving
    if (!user || !role) {
      setError("Erreur d'authentification. Impossible de sauvegarder.");
      return;
    }

    // Permission check before saving (Admin or Instructor who owns the course)
    const isAdmin = role === "admin";
    const isOwnerInstructor =
      role === "instructor" && courseData.instructorId === user.uid;

    // In edit mode, only admin or owner instructor can save
    if (isEditMode && !isAdmin && !isOwnerInstructor) {
      setError(
        "Vous n'avez pas les droits pour sauvegarder les modifications de ce cours."
      );
      return;
    }
    // In create mode, only admin or instructor can save (already checked initially, but double-check)
    if (!isEditMode && role !== "admin" && role !== "instructor") {
      setError("Vous n'avez pas les droits pour créer un cours.");
      return;
    }

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

      const courseId = isEditMode ? courseIdParam : generateUniqueId();

      // Convert modules array back to object for Firebase
      const modulesObject = courseModules.reduce((acc, module, index) => {
        // Ensure module has an id, generate if missing (shouldn't happen with ModuleManagerCreation)
        const moduleId = module.id || generateUniqueId();
        acc[moduleId] = {
          ...module,
          order: index, // Ensure order is set based on array index
          id: undefined, // Remove temporary array ID before saving
        };
        // Remove potential temporary 'evaluationsArray' if it exists from ModuleManagerCreation
        delete acc[moduleId].evaluationsArray;
        // Ensure evaluations are stored correctly (assuming they are an object)
        acc[moduleId].evaluations = module.evaluations || {};

        return acc;
      }, {});

      const dataToSave = {
        ...courseData,
        id: courseId,
        // Ensure instructorId is correctly set from state (already updated)
        instructorId: courseData.instructorId || user.uid,
        modules: modulesObject,
        // Add/update timestamps
        createdAt: isEditMode
          ? courseData.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Remove legacy fields before saving if they sneaked in
      delete dataToSave.titre;
      delete dataToSave.duree;

      const courseRef = ref(database, `elearning/courses/${courseId}`);
      await set(courseRef, dataToSave);

      setSuccess(`Cours ${isEditMode ? "mis à jour" : "créé"} avec succès!`);
      setTimeout(() => {
        navigate(`/courses/${courseId}`); // Redirect to course page
      }, 1500);
    } catch (err) {
      
      setError(`Erreur lors de la sauvegarde: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Render Loading Spinner if auth is loading or initial data is loading
  if (authLoading || loadingData) {
    return <LoadingSpinner />;
  }

  // Render Permission Error message if exists
  if (permissionError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <p>{permissionError}</p>
        <Link
          to="/"
          className="text-blue-500 hover:underline mt-4 inline-block"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  // Main form rendering
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Modifier le Cours" : "Créer un Nouveau Cours"}
      </h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("info")}
            className={
              (activeTab === "info"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300") +
              " whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            }
          >
            Infos Générales
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            className={
              (activeTab === "modules"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300") +
              " whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            }
          >
            Modules du Cours
          </button>
        </nav>
      </div>

      {/* Display General Errors/Success */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {success && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {/* Form Content based on Active Tab */}
      {activeTab === "info" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Course Info Fields --- */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Titre du Cours
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={courseData.title}
              onChange={handleChange}
              required
              minLength={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ex: Introduction à React"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={courseData.description}
              onChange={handleChange}
              required
              minLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Décrivez le contenu et les objectifs du cours"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="level"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Niveau
              </label>
              <select
                id="level"
                name="level"
                value={courseData.level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
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
                Durée Estimée
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={courseData.duration}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                Prix (0 pour gratuit)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={courseData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                URL de l'Image de Couverture (Optionnel)
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value={courseData.image}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                Spécialité
              </label>
              <select
                id="specialiteId"
                name="specialiteId"
                value={courseData.specialiteId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">-- Sélectionnez une spécialité --</option>
                {specialites.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="disciplineId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Discipline
              </label>
              <select
                id="disciplineId"
                name="disciplineId"
                value={courseData.disciplineId}
                onChange={handleChange}
                required
                disabled={
                  !courseData.specialiteId || filteredDisciplines.length === 0
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100"
              >
                <option value="">
                  {courseData.specialiteId
                    ? "-- Sélectionnez une discipline --"
                    : "-- Sélectionnez d&apos;abord une spécialité --"}
                </option>
                {filteredDisciplines.map((disc) => (
                  <option key={disc.id} value={disc.id}>
                    {disc.name}
                  </option>
                ))}
              </select>
              {!courseData.specialiteId && (
                <p className="text-xs text-gray-500 mt-1">
                  Veuillez sélectionner une spécialité pour voir les
                  disciplines.
                </p>
              )}
            </div>
          </div>

          {/* Hidden instructorId - could also be displayed as read-only */}
          <input
            type="hidden"
            name="instructorId"
            value={courseData.instructorId}
          />

          {/* --- Form Actions --- */}
          <div className="flex justify-end space-x-4 pt-4">
            <Link
              to={isEditMode ? `/courses/${courseIdParam}` : "/admin/dashboard"} // Adjust cancel path
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Sauvegarde en cours..."
                : isEditMode
                ? "Mettre à jour les informations"
                : "Créer le cours"}
            </button>
          </div>
        </form>
      )}

      {/* Module Manager Tab */}
      {activeTab === "modules" && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Gestion des Modules</h2>
          <p className="mb-4 text-sm text-gray-600">
            Ajoutez, modifiez, supprimez et réorganisez les modules de votre
            cours. N&apos;oubliez pas de sauvegarder les informations générales
            du cours (même si inchangées) pour enregistrer les modifications
            apportées aux modules.
          </p>
          <ModuleManagerCreation
            modules={courseModules}
            setModules={setCourseModules}
            courseId={courseIdParam || null} // Pass courseId if available
          />
          {/* Add a save button specifically for modules if needed, or rely on the main form save */}
          <div className="flex justify-end space-x-4 pt-4">
            {/* Optional: Add a separate save button just for modules if workflow demands it */}
            {/* For simplicity now, we save everything via the main form's submit */}
            <button
              onClick={handleSubmit} // Trigger the main form save
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? "Sauvegarde en cours..."
                : "Sauvegarder Cours et Modules"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseForm;
