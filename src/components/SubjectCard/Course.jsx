import React, { useState, useEffect } from "react";
import { Clock, Star, Library, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { fetchCoursesFromDatabase } from "../../utils/firebaseUtils";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

const Course = ({ course, index }) => {
  // Définir des valeurs par défaut pour les propriétés manquantes
  const rating = course.rating || 4.5;
  const totalRatings = course.totalRatings || 10;
  const price =
    typeof course.price === "number"
      ? course.price
      : parseFloat(course.price) || 29.99;
  const lessons = course.lessons || 8;
  const students = course.students || 20;
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
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await fetchCoursesFromDatabase();
        setCourses(coursesData);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OptimizedLoadingSpinner size="large" text="Chargement des cours..." />
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
          {courses.map((course, index) => (
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
