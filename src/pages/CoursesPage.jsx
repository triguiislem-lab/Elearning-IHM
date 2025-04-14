import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Clock,
  Star,
  Library,
  BookOpen,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  fetchCoursesFromDatabase,
  fetchSpecialitesFromDatabase,
  fetchDisciplinesFromDatabase,
  fetchCourseEnrollments,
} from "../utils/firebaseUtils";
import OptimizedLoadingSpinner from "../components/Common/OptimizedLoadingSpinner";
import Breadcrumb from "../components/Common/Breadcrumb";
import { getDatabase, ref, get } from "firebase/database";

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [coursesWithMetadata, setCoursesWithMetadata] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSpecialite, setSelectedSpecialite] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const levels = ["Débutant", "Intermédiaire", "Avancé"];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les cours
        const coursesData = await fetchCoursesFromDatabase(true);
        setCourses(coursesData);

        // Enrichir les cours avec des métadonnées (nombre d'étudiants, de leçons, etc.)
        const database = getDatabase();
        const coursesWithExtra = await Promise.all(
          coursesData.map(async (course) => {
            try {
              // Récupérer le nombre d'inscriptions pour ce cours
              const enrollments = await fetchCourseEnrollments(course.id);
              const studentsCount = enrollments.length;

              // Compter le nombre de leçons (modules)
              let lessonsCount = 0;
              if (course.modules && typeof course.modules === "object") {
                if (Array.isArray(course.modules)) {
                  lessonsCount = course.modules.length;
                } else {
                  lessonsCount = Object.keys(course.modules).length;
                }
              }

              // Récupérer la note moyenne si disponible
              let rating = 0;
              let totalRatings = 0;

              // Vérifier d'abord dans le chemin standardisé
              if (course.id) {
                try {
                  const feedbacksRef = ref(
                    database,
                    `elearning/feedback/${course.id}`
                  );
                  const feedbacksSnapshot = await get(feedbacksRef);

                  if (feedbacksSnapshot.exists()) {
                    const feedbacks = feedbacksSnapshot.val();
                    const feedbacksList = Object.values(feedbacks);

                    if (feedbacksList.length > 0) {
                      const sum = feedbacksList.reduce(
                        (acc, fb) => acc + (fb.rating || 0),
                        0
                      );
                      rating = parseFloat(
                        (sum / feedbacksList.length).toFixed(1)
                      );
                      totalRatings = feedbacksList.length;
                    }
                  }
                } catch (error) {
                  console.error(
                    `Erreur lors de la récupération des avis pour le cours ${course.id}:`,
                    error
                  );
                }

                // Si aucun avis trouvé dans le chemin standardisé, vérifier dans le chemin hérité
                if (rating === 0) {
                  try {
                    const feedbacksRef = ref(
                      database,
                      `Elearning/Feedback/${course.id}`
                    );
                    const feedbacksSnapshot = await get(feedbacksRef);

                    if (feedbacksSnapshot.exists()) {
                      const feedbacks = feedbacksSnapshot.val();
                      const feedbacksList = Object.values(feedbacks);

                      if (feedbacksList.length > 0) {
                        const sum = feedbacksList.reduce(
                          (acc, fb) => acc + (fb.rating || 0),
                          0
                        );
                        rating = parseFloat(
                          (sum / feedbacksList.length).toFixed(1)
                        );
                        totalRatings = feedbacksList.length;
                      }
                    }
                  } catch (error) {
                    console.error(
                      `Erreur lors de la récupération des avis pour le cours ${course.id}:`,
                      error
                    );
                  }
                }
              }

              // Calculer aussi un score de popularité pour un tri futur si nécessaire
              const popularityScore = rating * 10 + studentsCount;

              return {
                ...course,
                students: studentsCount,
                lessons: lessonsCount,
                rating: rating,
                totalRatings: totalRatings,
                popularityScore: popularityScore,
                createdAt: course.createdAt || new Date().toISOString(),
              };
            } catch (error) {
              console.error(
                `Erreur lors de la récupération des métadonnées pour le cours ${course.id}:`,
                error
              );
              return course;
            }
          })
        );

        // Option pour trier par popularité si souhaité
        // const sortedCourses = coursesWithExtra.sort((a, b) => b.popularityScore - a.popularityScore);
        // setCoursesWithMetadata(sortedCourses);

        setCoursesWithMetadata(coursesWithExtra);

        // Charger les spécialités et disciplines
        const specialitesData = await fetchSpecialitesFromDatabase();
        setSpecialites(specialitesData);

        const disciplinesData = await fetchDisciplinesFromDatabase();
        setDisciplines(disciplinesData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrer les disciplines en fonction de la spécialité sélectionnée
  const filteredDisciplines = disciplines.filter(
    (discipline) =>
      !selectedSpecialite || discipline.specialiteId === selectedSpecialite
  );

  // Filtrer les cours en fonction des critères de recherche
  const filteredCourses = coursesWithMetadata.filter((course) => {
    // Filtre par terme de recherche
    const matchesSearchTerm =
      !searchTerm ||
      (course.title &&
        course.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.description &&
        course.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtre par niveau
    const matchesLevel =
      !selectedLevel ||
      (course.level &&
        course.level.toLowerCase() === selectedLevel.toLowerCase());

    // Filtre par spécialité
    const matchesSpecialite =
      !selectedSpecialite || course.specialiteId === selectedSpecialite;

    // Filtre par discipline
    const matchesDiscipline =
      !selectedDiscipline || course.disciplineId === selectedDiscipline;

    return (
      matchesSearchTerm &&
      matchesLevel &&
      matchesSpecialite &&
      matchesDiscipline
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OptimizedLoadingSpinner size="large" text="Chargement des cours..." />
      </div>
    );
  }

  return (
    <section className="bg-light py-8 md:py-16">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb customPaths={[{ name: "Cours", url: "/courses" }]} />

        {/* Header */}
        <div className="space-y-4 text-center max-w-[700px] mx-auto mb-12">
          <h3 className="uppercase font-semibold text-accent">Nos Cours</h3>
          <h2 className="section-title">Explorez Nos Cours Populaires</h2>
          <p className="section-subtitle">
            Découvrez notre sélection de cours conçus pour vous aider à
            développer vos compétences et atteindre vos objectifs
            professionnels.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-secondary" />
              Filtrer les cours
              {(searchTerm ||
                selectedLevel ||
                selectedSpecialite ||
                selectedDiscipline) && (
                <span className="ml-2 bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full">
                  Filtres actifs
                </span>
              )}
            </h3>

            <div className="text-sm text-gray-600">
              {filteredCourses.length} cours trouvé
              {filteredCourses.length !== 1 ? "s" : ""}
              {filteredCourses.length !== coursesWithMetadata.length && (
                <span className="text-secondary">
                  {" "}
                  sur {coursesWithMetadata.length}
                </span>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="lg:w-1/3 flex-grow">
              <label htmlFor="search" className="form-label">
                Rechercher
              </label>
              <div className="flex">
                <div className="bg-secondary/10 flex items-center justify-center px-3 rounded-l-md border border-r-0 border-secondary/20">
                  <Search size={20} className="text-secondary" />
                </div>
                <input
                  id="search"
                  type="text"
                  placeholder="Rechercher des cours..."
                  className="form-input rounded-l-none w-full border-secondary/20 focus:border-secondary focus:ring focus:ring-secondary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Level Filter */}
            <div className="lg:w-1/5">
              <label htmlFor="level" className="form-label">
                Niveau
              </label>
              <select
                id="level"
                className="form-input focus:border-secondary focus:ring focus:ring-secondary/20"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="">Tous les niveaux</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Specialite Filter */}
            <div className="lg:w-1/5">
              <label htmlFor="specialite" className="form-label">
                Spécialité
              </label>
              <select
                id="specialite"
                className="form-input focus:border-secondary focus:ring focus:ring-secondary/20"
                value={selectedSpecialite}
                onChange={(e) => {
                  setSelectedSpecialite(e.target.value);
                  setSelectedDiscipline(""); // Réinitialiser la discipline lorsqu'on change de spécialité
                }}
              >
                <option value="">Toutes les spécialités</option>
                {specialites.map((specialite) => (
                  <option key={specialite.id} value={specialite.id}>
                    {specialite.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Discipline Filter */}
            <div
              className={`lg:w-1/5 ${
                selectedSpecialite === "" ? "opacity-70" : ""
              }`}
            >
              <label htmlFor="discipline" className="form-label">
                Discipline
              </label>
              <select
                id="discipline"
                className="form-input focus:border-secondary focus:ring focus:ring-secondary/20"
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                disabled={selectedSpecialite === ""}
              >
                <option value="">Toutes les disciplines</option>
                {filteredDisciplines.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
              </select>
              {selectedSpecialite === "" && (
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez une spécialité d'abord
                </p>
              )}
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end mt-6 border-t border-gray-100 pt-6">
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedLevel("");
                setSelectedSpecialite("");
                setSelectedDiscipline("");
              }}
              className="outline-btn btn-sm flex items-center gap-1"
              disabled={
                !searchTerm &&
                !selectedLevel &&
                !selectedSpecialite &&
                !selectedDiscipline
              }
            >
              <X size={16} />
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Courses Section */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src={
                      course.image ||
                      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
                    }
                    alt={course.title || course.titre || "Course"}
                    className="w-full h-56 object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-md">
                    <Clock className="w-4 h-4 text-secondary" />
                    <span className="text-sm">
                      {course.duration || "40 heures"}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <span className="inline-block bg-secondary/5 text-secondary px-4 py-1 rounded-full text-sm font-medium mb-4">
                    {course.level || "Intermédiaire"}
                  </span>

                  <Link to={`/course/${course.id}`}>
                    <h3 className="text-xl font-bold mb-4 hover:text-secondary transition-colors duration-300">
                      {course.title || course.titre || "Cours"}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex text-primary">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(course.rating || 0)
                              ? "fill-current"
                              : ""
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      ({course.rating || 0}/{course.totalRatings || 0}{" "}
                      Évaluations)
                    </p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-secondary">
                      ${(parseFloat(course.price) || 29.99).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Library className="w-4 h-4" />
                      <span className="text-sm">
                        {course.lessons || 0} Leçons
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">
                        {course.students || 0} Étudiants
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center py-12">
            <div className="flex justify-center mb-4">
              <Search size={48} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun cours ne correspond à vos critères
            </h3>
            <p className="text-gray-500 mb-6">
              Essayez d'ajuster votre recherche ou vos filtres pour trouver des
              cours.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedLevel("");
                setSelectedSpecialite("");
                setSelectedDiscipline("");
              }}
              className="secondary-btn"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesPage;
