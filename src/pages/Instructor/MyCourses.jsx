import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { database } from "../../../firebaseConfig";
import { ref, get } from "firebase/database";
import {
  fetchCompleteUserInfo,
  fetchCourseById,
  fetchCourseEnrollments,
} from "../../utils/firebaseUtils";
import {
  MdAdd,
  MdEdit,
  MdPeople,
  MdSchool,
  MdAssignment,
} from "react-icons/md";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";

const MyCourses = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        // Vérifier si l'utilisateur est connecté
        if (!auth.currentUser) {
          setError("Vous devez être connecté pour accéder à cette page");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
          return;
        }

        // Récupérer les informations de l'utilisateur
        const userInfo = await fetchCompleteUserInfo(auth.currentUser.uid);
        if (!userInfo) {
          setError("Impossible de récupérer les informations utilisateur");
          setLoading(false);
          return;
        }

        // Vérifier si l'utilisateur est un instructeur
        const isInstructor =
          userInfo?.role === "instructor" ||
          userInfo?.role === "formateur" ||
          userInfo?.userType === "formateur";

        if (
          !isInstructor &&
          userInfo?.role !== "admin" &&
          userInfo?.userType !== "administrateur"
        ) {
          setError("Vous n'avez pas les droits pour accéder à cette page");
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
          return;
        }

        // Récupérer les cours de l'instructeur
        const instructorCoursesRef = ref(
          database,
          `elearning/users/${auth.currentUser.uid}/courses`
        );
        const snapshot = await get(instructorCoursesRef);

        if (snapshot.exists()) {
          const coursesData = snapshot.val();

          // Récupérer les détails complets de chaque cours et les inscriptions
          const coursesPromises = Object.keys(coursesData).map(
            async (courseId) => {
              try {
                const courseDetails = await fetchCourseById(
                  courseId,
                  true,
                  true
                );
                if (!courseDetails) {
                  console.warn(`Cours introuvable: ${courseId}`);
                  return null;
                }

                const enrollments = await fetchCourseEnrollments(courseId);

                // Ajouter une date de création par défaut si elle n'existe pas
                if (!courseDetails.createdAt) {
                  console.log(
                    `Date de création manquante pour le cours ${courseId}, ajout d'une date par défaut`
                  );

                  // Utiliser en priorité updatedAt si disponible, sinon la date actuelle moins 30 jours
                  const defaultCreatedAt =
                    courseDetails.updatedAt ||
                    // Si aucune date disponible, utiliser une date antérieure (30 jours avant aujourd'hui)
                    (() => {
                      const date = new Date();
                      date.setDate(date.getDate() - 30);
                      return date.toISOString();
                    })();

                  courseDetails.createdAt = defaultCreatedAt;
                }

                return {
                  ...courseDetails,
                  students: enrollments.length,
                  enrollments: enrollments,
                };
              } catch (fetchError) {
                console.error(
                  `Erreur lors de la récupération du cours ${courseId}:`,
                  fetchError
                );
                return {
                  id: courseId,
                  title: coursesData[courseId].title || "Cours sans titre",
                  students: 0,
                  enrollments: [],
                  error: true,
                };
              }
            }
          );

          const coursesWithDetails = await Promise.all(coursesPromises);

          // Filtrer les cours null (non trouvés)
          const validCourses = coursesWithDetails.filter(
            (course) => course !== null
          );

          // Trier les cours par date de création (du plus récent au plus ancien)
          const sortedCourses = validCourses.sort((a, b) => {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });

          setCourses(sortedCourses);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des cours:", error);
        setError("Erreur lors du chargement des cours");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [auth.currentUser, navigate]);

  // Calculer les statistiques
  const totalStudents = courses.reduce(
    (total, course) => total + (course.students || 0),
    0
  );
  const totalCourses = courses.length;
  const averageStudentsPerCourse =
    totalCourses > 0 ? Math.round(totalStudents / totalCourses) : 0;

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <OptimizedLoadingSpinner
            size="large"
            text="Chargement des cours..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mes cours</h1>
        <div className="flex space-x-2">
          <Link
            to="/instructor/course-form"
            className="bg-secondary text-white px-4 py-2 rounded-md flex items-center hover:bg-secondary/90 transition-colors duration-300"
          >
            <MdAdd className="mr-2" />
            Créer un cours
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <MdPeople className="text-blue-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Étudiants</h3>
              <p className="text-3xl font-bold text-blue-600">
                {totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-full">
              <MdPeople className="text-green-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Nombre de cours</h3>
              <p className="text-3xl font-bold text-green-600">
                {totalCourses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <MdPeople className="text-purple-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Moyenne d&apos;étudiants
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {averageStudentsPerCourse}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">
          Liste de mes cours ({courses.length})
        </h2>

        {courses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Titre</th>
                  <th className="py-3 px-4 text-left">Niveau</th>
                  <th className="py-3 px-4 text-left">Spécialité/Discipline</th>
                  <th className="py-3 px-4 text-left">Étudiants inscrits</th>
                  <th className="py-3 px-4 text-left">Date de création</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {course.title || course.titre || "Cours sans titre"}
                    </td>
                    <td className="py-3 px-4">
                      {course.level || "Intermédiaire"}
                    </td>
                    <td className="py-3 px-4">
                      {course.specialiteName ||
                        course.disciplineName ||
                        "Non spécifié"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">
                        {course.students || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {course.createdAt
                        ? new Date(course.createdAt).toLocaleDateString()
                        : "Non spécifié"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-3">
                        <Link
                          to={`/course/${course.id}`}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                          title="Voir le cours"
                        >
                          <MdSchool className="mr-1" size={16} />
                        </Link>
                        <Link
                          to={`/instructor/course-form/${course.id}`}
                          className="text-orange-600 hover:text-orange-800 flex items-center"
                          title="Modifier les informations du cours"
                        >
                          <MdEdit className="mr-1" size={16} />
                        </Link>
                        <Link
                          to={`/instructor/course-management/${course.id}`}
                          className="text-green-600 hover:text-green-800 flex items-center"
                          title="Gérer les modules et évaluations"
                        >
                          <MdAssignment className="mr-1" size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">
              Vous n&apos;avez pas encore créé de cours.
            </p>
            <Link
              to="/instructor/course-form"
              className="bg-secondary text-white px-4 py-2 rounded-md inline-flex items-center hover:bg-secondary/90 transition-colors duration-300"
            >
              <MdAdd className="mr-2" />
              Créer mon premier cours
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
