import React, { useState, useEffect } from "react";
import { Clock, Star, Library, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  fetchCoursesFromDatabase,
  fetchCourseEnrollments,
} from "../../utils/firebaseUtils";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";
import { getDatabase, ref, get } from "firebase/database";

const Course = ({ course, index }) => {
  // Utiliser les données réelles sans valeurs par défaut artificielles
  const rating = course.rating || 0;
  const totalRatings = course.totalRatings || 0;
  const price =
    typeof course.price === "number"
      ? course.price
      : parseFloat(course.price) || 29.99;
  const lessons = course.lessons || 0;
  const students = course.students || 0;
  const level = course.level || "Intermédiaire";
  const duration = course.duree ? `${course.duree} heures` : "40 heures";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <div className="relative">
        <img
          src={
            course.image ||
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
          }
          alt={course.titre || course.title}
          className="w-full h-56 object-cover"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80";
          }}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-md">
          <Clock className="w-4 h-4 text-secondary" />
          <span className="text-sm">{duration}</span>
        </div>
      </div>

      <div className="p-6">
        <span className="inline-block bg-primary/10 text-secondary px-4 py-1 rounded-full text-sm font-medium mb-4">
          {level}
        </span>

        <Link to={`/course/${course.id}`}>
          <h3 className="text-xl font-bold mb-4 hover:text-secondary transition-colors duration-300">
            {course.titre || course.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-primary">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(rating) ? "fill-current" : ""
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">
            ({rating}/{totalRatings} Rating)
          </p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-secondary">
            ${price.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-gray-600">
            <Library className="w-4 h-4" />
            <span className="text-sm">{lessons} Lessons</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">{students} Students</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const Courses = () => {
  const [popularCourses, setPopularCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        // Récupérer tous les cours
        const coursesData = await fetchCoursesFromDatabase(true);

        // Enrichir les cours avec des métadonnées (nombre d'étudiants, notes, etc.)
        const database = getDatabase();
        const enrichedCourses = await Promise.all(
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

              // Récupérer les données de feedback depuis Firebase
              let rating = course.rating || 0;
              let totalRatings = course.totalRatings || 0;

              // Vérifier si les ratings ne sont pas déjà présents dans l'objet course
              if (!course.rating || !course.totalRatings) {
                // Essayer de récupérer les ratings depuis différents chemins
                const feedbackRef = ref(
                  database,
                  `Elearning/Cours/${course.id}`
                );
                const feedbackSnapshot = await get(feedbackRef);

                if (feedbackSnapshot.exists()) {
                  const courseData = feedbackSnapshot.val();
                  rating = courseData.rating || 0;
                  totalRatings = courseData.totalRatings || 0;
                }

                // Si toujours pas de ratings, essayer le chemin alternatif
                if (rating === 0 && totalRatings === 0) {
                  const altFeedbackRef = ref(
                    database,
                    `elearning/courses/${course.id}`
                  );
                  const altFeedbackSnapshot = await get(altFeedbackRef);

                  if (altFeedbackSnapshot.exists()) {
                    const altCourseData = altFeedbackSnapshot.val();
                    rating = altCourseData.rating || 0;
                    totalRatings = altCourseData.totalRatings || 0;
                  }
                }

                // Si toujours pas de ratings, calculer à partir des feedbacks
                if (rating === 0 && totalRatings === 0) {
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
                }
              }

              // Ajouter les métriques de popularité
              return {
                ...course,
                students: studentsCount,
                lessons: lessonsCount,
                rating: rating,
                totalRatings: totalRatings,
                // Créer un score de popularité basé sur les notes et le nombre d'inscriptions
                // La formule peut être ajustée selon les besoins
                popularityScore: rating * 10 + studentsCount,
                // S'assurer que nous avons une date pour le tri par récence
                createdAt: course.createdAt || new Date().toISOString(),
              };
            } catch (error) {
              console.error(`Erreur pour le cours ${course.id}:`, error);
              return course;
            }
          })
        );

        // Tri des cours par score de popularité (notes + inscriptions)
        // Ou par date (le plus récent en premier) si demandé
        // Vous pouvez changer cette ligne pour modifier le critère de tri
        const sortedCourses = enrichedCourses.sort((a, b) => {
          // Pour trier par popularité (meilleurs feedbacks)
          return b.popularityScore - a.popularityScore;

          // Pour trier par date (plus récents)
          // return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Ne garder que les 3 premiers cours
        const topThreeCourses = sortedCourses.slice(0, 3);
        setPopularCourses(topThreeCourses);
      } catch (error) {
        console.error("Erreur lors du chargement des cours populaires:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="py-14 flex items-center justify-center">
        <OptimizedLoadingSpinner
          size="large"
          text="Chargement des cours populaires..."
        />
      </div>
    );
  }

  return (
    <section className="bg-[#f9f9f9] py-14 md:py-24">
      <div className="container">
        <div className="space-y-4 text-center max-w-[600px] mx-auto mb-12">
          <h3 className="uppercase font-semibold text-orange-500">
            Cours Populaires
          </h3>
          <h2 className="text-4xl font-semibold">
            Choisissez un cours pour commencer
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {popularCourses.map((course, index) => (
            <Course key={course.id} course={course} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mt-12"
        >
          <Link
            to="/courses"
            className="primary-btn inline-flex items-center gap-2 text-white"
          >
            <span>Voir plus de cours</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
