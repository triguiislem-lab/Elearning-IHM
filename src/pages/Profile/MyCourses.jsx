import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAuth } from "firebase/auth";
import {
  fetchCompleteUserInfo,
  fetchCourseById,
  calculateCourseScore,
  calculateCourseProgress,
  isCourseCompleted,
  fetchUserEnrollments,
} from "../../utils/firebaseUtils";
import { Link } from "react-router-dom";
import {
  MdPlayCircle,
  MdPerson,
  MdCheckCircle,
  MdAccessTime,
} from "react-icons/md";
import CourseModules from "../../components/CourseModules/CourseModules";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";

const MyCourses = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const user = auth.currentUser;

        if (user) {
          // Récupérer les informations utilisateur depuis Firebase
          const info = await fetchCompleteUserInfo(user.uid);

          // S'assurer que info n'est pas null avant de continuer
          if (info) {
            setUserInfo(info);

            // Récupérer les inscriptions de l'utilisateur directement
            const directEnrollments = await fetchUserEnrollments(user.uid);

            // Utiliser les inscriptions récupérées directement ou celles de l'utilisateur
            const enrollments =
              directEnrollments.length > 0
                ? directEnrollments
                : info.enrollments || [];

            if (enrollments.length > 0) {
              try {
                // Récupérer les détails des cours
                const coursePromises = enrollments.map(async (enrollment) => {
                  try {
                    const courseData = await fetchCourseById(
                      enrollment.courseId
                    );

                    return {
                      ...courseData,
                      enrolledAt: enrollment.enrolledAt,
                    };
                  } catch (courseError) {
                    // Retourner un objet de cours par défaut en cas d'erreur
                    return {
                      id: enrollment.courseId,
                      title: enrollment.courseName || "Cours",
                      description: "Description non disponible",
                      image:
                        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
                      enrolledAt: enrollment.enrolledAt,
                    };
                  }
                });

                const coursesData = await Promise.all(coursePromises);

                // Filtrer les cours null ou undefined et éliminer les doublons
                const validCoursesData = coursesData.filter((course) => course);

                // Éliminer les doublons en utilisant l'ID du cours comme clé unique
                const uniqueCoursesMap = new Map();
                validCoursesData.forEach((course) => {
                  if (course && course.id && !uniqueCoursesMap.has(course.id)) {
                    uniqueCoursesMap.set(course.id, course);
                  }
                });

                // Convertir la Map en tableau
                const uniqueCoursesData = Array.from(uniqueCoursesMap.values());

                setCourses(uniqueCoursesData);
              } catch (coursesError) {
                setCourses([]);
              }
            } else {
              setCourses([]);
            }
          } else {
            setUserInfo({
              prenom: "Utilisateur",
              nom: "",
              email: user.email || "",
              userType: "apprenant",
              enrollments: [],
            });
            setCourses([]);
          }
        } else {
          setUserInfo(null);
          setCourses([]);
        }
      } catch (error) {
        // Afficher l'erreur complète pour le débogage

        // Essayer de récupérer les inscriptions directement en cas d'erreur
        try {
          if (auth.currentUser) {
            const directEnrollments = await fetchUserEnrollments(
              auth.currentUser.uid
            );

            if (directEnrollments && directEnrollments.length > 0) {
              // Récupérer les détails des cours
              const coursePromises = directEnrollments.map(
                async (enrollment) => {
                  try {
                    const courseData = await fetchCourseById(
                      enrollment.courseId
                    );
                    return {
                      ...courseData,
                      enrolledAt: enrollment.enrolledAt,
                    };
                  } catch (courseError) {
                    return {
                      id: enrollment.courseId,
                      title: enrollment.courseName || "Cours",
                      description: "Description non disponible",
                      image:
                        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=700&q=80",
                      enrolledAt: enrollment.enrolledAt,
                    };
                  }
                }
              );

              const coursesData = await Promise.all(coursePromises);

              // Filtrer les cours null ou undefined
              const validCoursesData = coursesData.filter((course) => course);
              setCourses(validCoursesData);
            } else {
              setCourses([]);
            }

            // Créer un utilisateur par défaut
            setUserInfo({
              prenom: "Utilisateur",
              nom: "",
              email: auth.currentUser.email || "",
              userType: "apprenant",
              enrollments: directEnrollments || [],
            });
          } else {
            setUserInfo(null);
            setCourses([]);
          }
        } catch (fallbackError) {
          // Créer un utilisateur par défaut en cas d'erreur
          if (auth.currentUser) {
            setUserInfo({
              prenom: "Utilisateur",
              nom: "",
              email: auth.currentUser.email || "",
              userType: "apprenant",
              enrollments: [],
            });
          } else {
            setUserInfo(null);
          }
          setCourses([]);
        }
      } finally {
        setLoading(false);
      }
    };

    // Ajouter un écouteur d'événement pour les changements d'authentification
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserInfo();
      } else {
        setUserInfo(null);
        setCourses([]);
        setLoading(false);
      }
    });

    // Nettoyer l'écouteur lors du démontage du composant
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OptimizedLoadingSpinner size="large" text="Chargement en cours..." />
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Utilisateur non connecté</h1>
        <p className="text-gray-600 mb-8">
          Veuillez vous connecter pour accéder à vos formations.
        </p>
        <Link
          to="/login"
          className="bg-secondary text-white px-6 py-2 rounded-full hover:bg-secondary/90 transition-colors duration-300"
        >
          Connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-8">Mes formations</h1>

          {courses.length > 0 ? (
            <div className="space-y-8">
              {courses.map((course, index) => {
                // Calculer le score et la progression si le cours a des modules
                const hasModules = course?.modules && course.modules.length > 0;
                const courseScore = hasModules
                  ? calculateCourseScore(course.modules)
                  : 0;
                const progressPercentage = hasModules
                  ? calculateCourseProgress(course.modules)
                  : 0;
                const courseCompleted = hasModules
                  ? isCourseCompleted(course.modules)
                  : false;

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-2xl font-bold">
                            {course.title || course.titre || "Cours sans titre"}
                          </h2>
                          <p className="text-gray-600 mt-1">
                            Inscrit le{" "}
                            {new Date(course.enrolledAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              courseCompleted
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {courseCompleted ? "Réussi" : "En cours"}
                          </span>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-secondary h-2 rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">
                              {progressPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6 mt-6">
                        <div className="md:col-span-1">
                          <div className="relative rounded-lg overflow-hidden">
                            <img
                              src={
                                course.image ||
                                "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
                              }
                              alt={course.title || course.titre}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80";
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                              <Link
                                to={`/course/${course.id}`}
                                className="bg-white text-secondary p-3 rounded-full"
                              >
                                <MdPlayCircle size={24} />
                              </Link>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MdAccessTime className="text-secondary" />
                                <span>
                                  {course.duration ||
                                    course.duree ||
                                    "40 heures"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MdPerson className="text-secondary" />
                                <span>{course.students || 20} étudiants</span>
                              </div>
                            </div>

                            <Link
                              to={`/course/${course.id}`}
                              className="block w-full bg-secondary text-white text-center py-2 rounded-lg hover:bg-secondary/90 transition-colors duration-300"
                            >
                              Continuer la formation
                            </Link>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          {hasModules ? (
                            <div>
                              <h3 className="text-lg font-semibold mb-3">
                                Progression des modules
                              </h3>
                              <div className="space-y-3">
                                {course.modules.map((module, idx) => (
                                  <div
                                    key={module.id}
                                    className="border rounded-lg p-3"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            module.status === "completed"
                                              ? "bg-green-100 text-green-600"
                                              : "bg-yellow-100 text-yellow-600"
                                          }`}
                                        >
                                          {module.status === "completed" ? (
                                            <MdCheckCircle />
                                          ) : (
                                            <MdAccessTime />
                                          )}
                                        </div>
                                        <span className="font-medium">
                                          Module {idx + 1}:{" "}
                                          {module.title ||
                                            module.titre ||
                                            "Module sans titre"}
                                        </span>
                                      </div>
                                      <span
                                        className={`text-sm font-medium ${
                                          module.score >= 70
                                            ? "text-green-600"
                                            : "text-yellow-600"
                                        }`}
                                      >
                                        {module.score}%
                                      </span>
                                    </div>
                                    {module.evaluations &&
                                      module.evaluations.length > 0 && (
                                        <div className="mt-2 pl-8">
                                          <p className="text-xs text-gray-500 mb-1">
                                            {module.evaluations.length}{" "}
                                            évaluation(s)
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {module.evaluations.map(
                                              (evaluation, evalIdx) => (
                                                <span
                                                  key={evalIdx}
                                                  className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                                                >
                                                  {evaluation.title ||
                                                    `Évaluation ${evalIdx + 1}`}
                                                  : {evaluation.score || 0}%
                                                </span>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col h-full justify-center items-center text-center p-6 bg-gray-50 rounded-lg">
                              <p className="text-gray-600 mb-4">
                                Aucun module disponible pour ce cours.
                              </p>
                              <p className="text-sm text-gray-500">
                                Les modules et évaluations seront disponibles
                                prochainement.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">
                Vous n'êtes inscrit à aucune formation
              </h2>
              <p className="text-gray-600 mb-6">
                Parcourez notre catalogue de formations et inscrivez-vous pour
                commencer votre apprentissage.
              </p>
              <Link
                to="/courses"
                className="bg-secondary text-white px-6 py-2 rounded-full hover:bg-secondary/90 transition-colors duration-300 inline-block"
              >
                Parcourir les formations
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyCourses;
