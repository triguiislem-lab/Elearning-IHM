import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchCoursesFromDatabase,
  fetchSpecialitesFromDatabase,
  fetchUsersFromDatabase,
} from "../../utils/firebaseUtils";
import { database } from "../../../firebaseConfig";
import { ref } from "firebase/database";
import { archiveEntity } from "../../utils/databaseUtils";
import { useToast } from "../../contexts/ToastContext";
import {
  MdEdit,
  MdDelete,
  MdArrowBack,
  MdAdd,
  MdSearch,
  MdFilterList,
  MdVisibility,
  MdSchool,
  MdArchive,
} from "react-icons/md";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";
import ArchivedCoursesView from "../../components/Admin/ArchivedCoursesView";

const CourseManagement = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [specialiteFilter, setSpecialiteFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [showArchivedCourses, setShowArchivedCourses] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(
    async (forceRefresh = false) => {
      if (authLoading || !user || userRole !== "admin") {
        if (!authLoading && userRole !== "admin") {
          toast.error("Accès non autorisé.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Fetch courses with force refresh if needed
        const allCourses = await fetchCoursesFromDatabase(null, forceRefresh);
        setCourses(allCourses);
        setFilteredCourses(allCourses);

        // Fetch specialites for filtering with force refresh if needed
        const allSpecialites = await fetchSpecialitesFromDatabase(
          true,
          forceRefresh
        );
        setSpecialites(allSpecialites);

        // Fetch instructors for filtering with force refresh if needed
        const allUsers = await fetchUsersFromDatabase(forceRefresh);
        const instructorsList = allUsers.filter(
          (u) => u.role === "instructor" || u.userType === "formateur"
        );
        setInstructors(instructorsList);
      } catch (err) {
        console.error("Error loading data:", err);
        toast.error(
          "Une erreur s'est produite lors du chargement des données."
        );
      } finally {
        setLoading(false);
      }
    },
    [authLoading, user, userRole]
  );

  useEffect(() => {
    // Force refresh when component mounts
    loadData(true);
  }, [loadData]);

  // Filter courses based on search term and filters
  useEffect(() => {
    let result = courses;

    // Filter by specialite
    if (specialiteFilter !== "all") {
      result = result.filter(
        (course) =>
          course.specialite === specialiteFilter ||
          course.specialiteId === specialiteFilter
      );
    }

    // Filter by instructor
    if (instructorFilter !== "all") {
      result = result.filter(
        (course) => course.instructorId === instructorFilter
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (course) =>
          (course.title && course.title.toLowerCase().includes(term)) ||
          (course.titre && course.titre.toLowerCase().includes(term)) ||
          (course.description &&
            course.description.toLowerCase().includes(term))
      );
    }

    setFilteredCourses(result);
  }, [courses, searchTerm, specialiteFilter, instructorFilter]);

  const handleArchive = async (courseId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir archiver ce cours ?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Archive the course instead of deleting
      const success = await archiveEntity("courses", courseId, {
        archivedBy: user.uid,
        archivedReason: "Archived by administrator",
      });

      if (success) {
        toast.success("Cours archivé avec succès.");
        await loadData(true);
      } else {
        toast.error("Une erreur s'est produite lors de l'archivage du cours.");
      }
    } catch (err) {
      console.error("Error archiving course:", err);
      toast.error("Une erreur s'est produite lors de l'archivage du cours.");
    } finally {
      setLoading(false);
    }
  };

  const getSpecialiteName = (specialiteId) => {
    const specialite = specialites.find((s) => s.id === specialiteId);
    return specialite ? specialite.name : "Non spécifié";
  };

  const getInstructorName = (instructorId) => {
    const instructor = instructors.find((i) => i.id === instructorId);
    return instructor
      ? `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim() ||
          instructor.email
      : "Non spécifié";
  };

  if (loading && courses.length === 0) {
    return <OptimizedLoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestion des Formations</h1>
          <div className="flex gap-2">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-300"
            >
              <MdArrowBack />
              Retour au tableau de bord
            </Link>
            <Link
              to="/admin/course-form"
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors duration-300"
            >
              <MdAdd />
              Ajouter un cours
            </Link>
          </div>
        </div>

        {/* Error and success messages are now handled by the Toast component */}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold">Liste des Formations</h2>

              <button
                onClick={() => setShowArchivedCourses(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 whitespace-nowrap"
              >
                <MdArchive />
                Cours archivés
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={specialiteFilter}
                  onChange={(e) => setSpecialiteFilter(e.target.value)}
                >
                  <option value="all">Toutes les spécialités</option>
                  {specialites.map((specialite) => (
                    <option key={specialite.id} value={specialite.id}>
                      {specialite.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={instructorFilter}
                  onChange={(e) => setInstructorFilter(e.target.value)}
                >
                  <option value="all">Tous les formateurs</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.firstName || ""} {instructor.lastName || ""} (
                      {instructor.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Titre</th>
                  <th className="py-3 px-4 text-left">Spécialité</th>
                  <th className="py-3 px-4 text-left">Formateur</th>
                  <th className="py-3 px-4 text-left">Durée</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 mr-3 bg-gray-200 rounded-md overflow-hidden">
                          {course.imageUrl ? (
                            <img
                              src={course.imageUrl}
                              alt={course.title || course.titre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300">
                              <MdSchool className="text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {course.title || course.titre || "Sans titre"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {course.modules?.length || 0} module(s)
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getSpecialiteName(
                        course.specialiteId || course.specialite
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getInstructorName(course.instructorId)}
                    </td>
                    <td className="py-3 px-4">
                      {course.duration || course.duree || "Non spécifié"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Link
                          to={`/course/${course.id}`}
                          className="text-blue-500 hover:text-blue-700"
                          title="Voir"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MdVisibility />
                        </Link>
                        <Link
                          to={`/admin/course-form/${course.id}`}
                          className="text-orange-500 hover:text-orange-700"
                          title="Modifier"
                        >
                          <MdEdit />
                        </Link>
                        <button
                          onClick={() => handleArchive(course.id)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Archiver"
                        >
                          <MdArchive />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
              <p className="text-gray-600">Aucun cours trouvé.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Archived Courses Modal */}
      {showArchivedCourses && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ArchivedCoursesView
            onClose={() => setShowArchivedCourses(false)}
            onSuccess={() => {
              // Refresh courses after restoration with force refresh
              loadData(true);
            }}
            onError={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
