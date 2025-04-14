import React, { useState, useEffect } from "react";
import {
  MdRestore,
  MdSearch,
  MdFilterList,
  MdSchool,
  MdBook,
} from "react-icons/md";
import { database } from "../../../firebaseConfig";
import { ref, get } from "firebase/database";
import { restoreEntity } from "../../utils/databaseUtils";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

/**
 * Component to display and manage archived courses
 */
const ArchivedCoursesView = ({ onClose, onSuccess, onError }) => {
  const [archivedCourses, setArchivedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [processingCourseId, setProcessingCourseId] = useState(null);
  const [filter, setFilter] = useState("all");

  // Load archived courses
  useEffect(() => {
    const loadArchivedCourses = async () => {
      setLoading(true);
      try {
        // Get all courses including archived ones
        const coursesRef = ref(database, "elearning/courses");
        const snapshot = await get(coursesRef);

        if (!snapshot.exists()) {
          setArchivedCourses([]);
          return;
        }

        // Filter only archived courses
        const coursesData = snapshot.val();
        const archivedCoursesList = Object.entries(coursesData)
          .filter(([_, courseData]) => courseData.archived)
          .map(([id, courseData]) => ({
            id,
            ...courseData,
            title: courseData.title || "Cours sans titre",
            description: courseData.description || "Aucune description",
          }));

        // Fetch instructor names for each course
        const coursesWithInstructors = await Promise.all(
          archivedCoursesList.map(async (course) => {
            if (course.instructorId) {
              try {
                const instructorRef = ref(
                  database,
                  `elearning/users/${course.instructorId}`
                );
                const instructorSnapshot = await get(instructorRef);
                if (instructorSnapshot.exists()) {
                  const instructorData = instructorSnapshot.val();
                  return {
                    ...course,
                    instructorName:
                      `${instructorData.firstName || ""} ${
                        instructorData.lastName || ""
                      }`.trim() ||
                      instructorData.email ||
                      "Formateur inconnu",
                  };
                }
              } catch (error) {
                console.error("Error fetching instructor:", error);
              }
            }
            return {
              ...course,
              instructorName: "Formateur inconnu",
            };
          })
        );

        setArchivedCourses(coursesWithInstructors);
      } catch (error) {
        console.error("Error loading archived courses:", error);
        onError && onError("Erreur lors du chargement des cours archivés");
      } finally {
        setLoading(false);
      }
    };

    loadArchivedCourses();
  }, [onError]);

  // Handle course restoration
  const handleRestoreCourse = async (courseId) => {
    if (!courseId) return;

    if (!window.confirm("Êtes-vous sûr de vouloir restaurer ce cours ?")) {
      return;
    }

    setProcessingCourseId(courseId);
    try {
      const success = await restoreEntity("courses", courseId, {
        restoredAt: new Date().toISOString(),
      });

      if (success) {
        // Remove from list
        setArchivedCourses((prev) =>
          prev.filter((course) => course.id !== courseId)
        );

        if (selectedCourse && selectedCourse.id === courseId) {
          setSelectedCourse(null);
        }

        // Force refresh when calling onSuccess
        onSuccess && onSuccess("Cours restauré avec succès");
      } else {
        onError && onError("Erreur lors de la restauration du cours");
      }
    } catch (error) {
      console.error("Error restoring course:", error);
      onError && onError("Erreur lors de la restauration du cours");
    } finally {
      setProcessingCourseId(null);
    }
  };

  // Filter courses by search term and category
  const filteredCourses = archivedCourses.filter((course) => {
    const matchesSearch =
      (course.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (course.instructorName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;

    // Add more filters if needed
    if (filter === "recent") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return matchesSearch && new Date(course.archivedAt) > oneMonthAgo;
    }

    return matchesSearch;
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Cours archivés</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          Fermer
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Rechercher un cours..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MdSearch
            className="absolute left-3 top-2.5 text-gray-400"
            size={20}
          />
        </div>

        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">Tous les cours</option>
            <option value="recent">Archivés récemment</option>
          </select>
          <MdFilterList
            className="absolute left-3 top-2.5 text-gray-400"
            size={20}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <OptimizedLoadingSpinner />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-[500px] gap-4">
          {/* Courses list */}
          <div className="w-full md:w-1/3 border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b font-medium">
              Cours archivés ({filteredCourses.length})
            </div>
            <div className="overflow-y-auto h-[calc(500px-3rem)]">
              {filteredCourses.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MdBook size={48} className="mx-auto mb-2 text-gray-400" />
                  <p>Aucun cours archivé trouvé</p>
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedCourse && selectedCourse.id === course.id
                        ? "bg-blue-50"
                        : ""
                    }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <h3 className="font-medium text-gray-800 truncate">
                      {course.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MdSchool className="mr-1" />
                      <span className="truncate">{course.instructorName}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Course details */}
          <div className="w-full md:w-2/3 border rounded-lg overflow-hidden">
            {selectedCourse ? (
              <div className="h-full flex flex-col">
                <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">Détails du cours</h3>
                  <button
                    onClick={() => handleRestoreCourse(selectedCourse.id)}
                    disabled={processingCourseId === selectedCourse.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    {processingCourseId === selectedCourse.id ? (
                      <OptimizedLoadingSpinner size="small" />
                    ) : (
                      <>
                        <MdRestore size={16} />
                        <span>Restaurer</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Informations du cours
                      </h4>
                      <div className="space-y-2">
                        <p>
                          <strong>Titre:</strong> {selectedCourse.title}
                        </p>
                        <p>
                          <strong>Formateur:</strong>{" "}
                          {selectedCourse.instructorName}
                        </p>
                        <p>
                          <strong>Catégorie:</strong>{" "}
                          {selectedCourse.category || "Non spécifiée"}
                        </p>
                        <p>
                          <strong>Niveau:</strong>{" "}
                          {selectedCourse.level || "Non spécifié"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Informations d'archivage
                      </h4>
                      <div className="space-y-2">
                        <p>
                          <strong>Archivé le:</strong>{" "}
                          {selectedCourse.archivedAt
                            ? new Date(
                                selectedCourse.archivedAt
                              ).toLocaleString()
                            : "Date inconnue"}
                        </p>
                        <p>
                          <strong>Archivé par:</strong>{" "}
                          {selectedCourse.archivedBy || "Utilisateur inconnu"}
                        </p>
                        <p>
                          <strong>Raison:</strong>{" "}
                          {selectedCourse.archivedReason || "Non spécifiée"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Description
                      </h4>
                      <p className="text-gray-600">
                        {selectedCourse.description}
                      </p>
                    </div>

                    {selectedCourse.modules &&
                      selectedCourse.modules.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                          <h4 className="font-medium text-gray-700 mb-2">
                            Modules (
                            {Array.isArray(selectedCourse.modules)
                              ? selectedCourse.modules.length
                              : Object.keys(selectedCourse.modules).length}
                            )
                          </h4>
                          <ul className="list-disc pl-5 text-gray-600">
                            {Array.isArray(selectedCourse.modules)
                              ? selectedCourse.modules.map((module, index) => (
                                  <li key={index}>
                                    {module.title || `Module ${index + 1}`}
                                  </li>
                                ))
                              : Object.entries(selectedCourse.modules).map(
                                  ([id, module]) => (
                                    <li key={id}>
                                      {module.title || `Module ${id}`}
                                    </li>
                                  )
                                )}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <MdBook size={64} className="mb-4 text-gray-300" />
                <p>Sélectionnez un cours pour voir ses détails</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivedCoursesView;
