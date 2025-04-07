import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { database } from "../../../firebaseConfig";
import { ref, get } from "firebase/database";
import {
  fetchCompleteUserInfo,
  fetchCourseById,
  fetchCourseEnrollments,
} from "../../utils/firebaseUtils";
import { MdAdd, MdEdit, MdDelete, MdPeople, MdDashboard } from "react-icons/md";

const MyCourses = () => {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Vérifier si l'utilisateur est connecté
        if (!auth.currentUser) {
          setError("Vous devez être connecté pour accéder à cette page");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
          return;
        }

        // Récupérer les informations de l'utilisateur
        const userInfoData = await fetchCompleteUserInfo(auth.currentUser.uid);
        setUserInfo(userInfoData);

        // Vérifier si l'utilisateur est un instructeur
        const isInstructor =
          userInfoData?.role === "instructor" ||
          userInfoData?.role === "formateur" ||
          userInfoData?.userType === "formateur";

        if (!isInstructor && userInfoData?.role !== "admin" && userInfoData?.userType !== "administrateur") {
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
          const coursesWithDetails = await Promise.all(
            Object.keys(coursesData).map(async (courseId) => {
              try {
                const courseDetails = await fetchCourseById(courseId);
                const enrollments = await fetchCourseEnrollments(courseId);
                
                return {
                  ...courseDetails,
                  students: enrollments.length,
                  enrollments: enrollments,
                };
              } catch (error) {
                console.error(`Error fetching details for course ${courseId}:`, error);
                return {
                  id: courseId,
                  title: coursesData[courseId].title || "Cours sans titre",
                  students: 0,
                  enrollments: [],
                };
              }
            })
          );
          
          // Trier les cours par date de création (du plus récent au plus ancien)
          const sortedCourses = coursesWithDetails.sort((a, b) => {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          });
          
          setCourses(sortedCourses);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error("Error loading instructor courses:", error);
        setError("Erreur lors du chargement des cours");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [auth.currentUser, navigate]);

  // Calculer les statistiques
  const totalStudents = courses.reduce((total, course) => total + (course.students || 0), 0);
  const totalCourses = courses.length;
  const averageStudentsPerCourse = totalCourses > 0 ? Math.round(totalStudents / totalCourses) : 0;

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
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
            to="/dashboard"
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors duration-300"
          >
            <MdDashboard className="mr-2" />
            Tableau de bord
          </Link>
          <Link
            to="/admin/course/new"
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
              <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
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
              <p className="text-3xl font-bold text-green-600">{totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <MdPeople className="text-purple-600 text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Moyenne d'étudiants</h3>
              <p className="text-3xl font-bold text-purple-600">{averageStudentsPerCourse}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Liste de mes cours ({courses.length})</h2>

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
                    <td className="py-3 px-4">{course.level || "Intermédiaire"}</td>
                    <td className="py-3 px-4">
                      {course.specialiteName || course.disciplineName || "Non spécifié"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{course.students || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      {course.createdAt
                        ? new Date(course.createdAt).toLocaleDateString()
                        : "Non spécifié"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Link
                          to={`/course/${course.id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="Voir"
                        >
                          Voir
                        </Link>
                        <Link
                          to={`/admin/course/edit/${course.id}`}
                          className="text-orange-600 hover:text-orange-800"
                          title="Modifier"
                        >
                          <MdEdit />
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
            <p className="text-gray-600 mb-4">Vous n'avez pas encore créé de cours.</p>
            <Link
              to="/admin/course/new"
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
