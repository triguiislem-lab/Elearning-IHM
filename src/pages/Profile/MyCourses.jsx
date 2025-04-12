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
import { getUserCourseProgress } from "../../utils/progressUtils";
import { Link } from "react-router-dom";
import {
  MdPlayCircle,
  MdPerson,
  MdCheckCircle,
  MdAccessTime,
} from "react-icons/md";
import CourseProgressBar from "../../components/CourseProgress/CourseProgressBar";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";
import { getDatabase } from "firebase/database";
import { ref, get, set } from "firebase/database";

const MyCourses = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  // Fonction pour charger la progression des cours
  const loadCoursesProgress = async (userId, courseIds) => {
    const progressData = {};
    const database = getDatabase();

    try {
      // Pour chaque cours, essayer de récupérer les données de progression
      await Promise.all(
        courseIds.map(async (courseId) => {
          try {
            // Essayer d'abord le nouveau chemin standardisé
            const progressRef = ref(
              database,
              `elearning/progress/${userId}/${courseId}`
            );
            let snapshot = await get(progressRef);

            // Si aucun résultat, essayer l'ancien chemin
            if (!snapshot.exists()) {
              const legacyProgressRef = ref(
                database,
                `Elearning/Progression/${userId}/${courseId}`
              );
              snapshot = await get(legacyProgressRef);
            }

            if (snapshot.exists()) {
              // Si les données existent, les utiliser
              const data = snapshot.val();
              progressData[courseId] = {
                progress: data.progress || 0,
                completed: data.completed || false,
                score: data.score || 0,
                lastUpdated: data.lastUpdated || new Date().toISOString(),
              };
            } else {
              // Créer des données de progression par défaut
              const moduleRef = ref(
                database,
                `elearning/courses/${courseId}/modules`
              );
              let moduleSnapshot = await get(moduleRef);

              // Vérifier aussi l'ancien chemin si nécessaire
              if (!moduleSnapshot.exists()) {
                const legacyModuleRef = ref(
                  database,
                  `Elearning/Cours/${courseId}/modules`
                );
                moduleSnapshot = await get(legacyModuleRef);
              }

              const moduleCount = moduleSnapshot.exists()
                ? Object.keys(moduleSnapshot.val()).length
                : 0;

              // Définir une progression par défaut à 0%
              progressData[courseId] = {
                progress: 0,
                completed: false,
                score: 0,
                totalModules: moduleCount,
                completedModules: 0,
                lastUpdated: new Date().toISOString(),
              };

              // Initialiser la progression dans Firebase si elle n'existe pas
              await set(progressRef, {
                courseId,
                userId,
                progress: 0,
                completed: false,
                score: 0,
                startDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                details: {
                  totalModules: moduleCount,
                  completedModules: 0,
                  moduleScores: {},
                },
              });
            }
          } catch (error) {
            console.error(
              `Erreur lors du chargement de la progression pour le cours ${courseId}:`,
              error
            );
            // En cas d'erreur, définir une progression par défaut
            progressData[courseId] = {
              progress: 0,
              completed: false,
              score: 0,
              lastUpdated: new Date().toISOString(),
            };
          }
        })
      );

      console.log("Données de progression réelles chargées:", progressData);
      setCourseProgress(progressData);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des progressions des cours:",
        error
      );

      // Même en cas d'erreur, utiliser des données à 0%
      const defaultData = {};
      courseIds.forEach((courseId) => {
        defaultData[courseId] = {
          progress: 0,
          completed: false,
          score: 0,
          lastUpdated: new Date().toISOString(),
        };
      });
      setCourseProgress(defaultData);
    }
  };

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

                // Définir les cours
                setCourses(uniqueCoursesData);

                // Charger la progression pour tous les cours est maintenant géré par CourseProgressBar
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
        setCourseProgress({});
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
                // Vérifier si le cours a des modules
                const hasModules = course?.modules && course.modules.length > 0;

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
                      </div>

                      {/* Utilisation du composant CourseProgressBar pour afficher la progression réelle */}
                      <div className="mb-6">
                        <CourseProgressBar courseId={course.id} />
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
                                Modules du cours
                              </h3>
                              <div className="space-y-3">
                                {Object.entries(course.modules).map(
                                  ([moduleId, module], idx) => (
                                    <div
                                      key={moduleId}
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
                                      </div>
                                    </div>
                                  )
                                )}
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
                className="inline-block bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary/90 transition-colors duration-300"
              >
                Explorer les formations
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyCourses;
