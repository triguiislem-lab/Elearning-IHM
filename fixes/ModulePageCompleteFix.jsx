// Complete fix for the ModulePage component to ensure resources and evaluations display correctly

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import ModuleContentEnhanced from "../components/CourseModules/ModuleContentEnhanced";
import { fetchUserEnrollments, fetchCourseById } from "../utils/firebaseUtils";
import { fetchModuleWithContent } from "../utils/ModuleFetchingFix";
import { getRealModuleId } from "../utils/ModuleIdMappingFix";
import OptimizedLoadingSpinner from "../components/Common/OptimizedLoadingSpinner";

const ModulePageFixed = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseData, setCourseData] = useState(null);
  const [moduleData, setModuleData] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // For forcing refresh

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !courseId || !moduleId) return;

      try {
        setLoading(true);
        setError("");

        // Fetch course data
        console.log("Fetching course data for:", courseId);
        const course = await fetchCourseById(courseId);
        if (!course) {
          const errorMessage = `Cours non trouvé (ID: ${courseId})`;
          console.error(errorMessage);
          setError(errorMessage);
          setLoading(false);
          return;
        }
        console.log("Course data retrieved:", course);
        setCourseData(course);

        // Get the real module ID using our mapping utility if it's a numeric ID
        let realModuleId = moduleId;
        if (/^\d+$/.test(moduleId)) {
          console.log(`Numeric module ID detected: ${moduleId}, attempting to map to real ID`);
          const mappedId = await getRealModuleId(courseId, moduleId);
          
          if (mappedId) {
            console.log(`Mapped numeric ID ${moduleId} to real ID ${mappedId}`);
            realModuleId = mappedId;
          } else {
            console.log(`No mapping found for numeric ID ${moduleId}, using as-is`);
            
            // As a fallback, try to find the module by index in the modules array/object
            if (course.modules) {
              if (Array.isArray(course.modules) && course.modules.length > parseInt(moduleId, 10)) {
                realModuleId = course.modules[parseInt(moduleId, 10)].id;
                console.log(`Found module at index ${moduleId} with ID ${realModuleId}`);
              } else if (typeof course.modules === 'object') {
                // Sort modules by order and find the one at the specified index
                const sortedModules = Object.values(course.modules)
                  .filter(m => typeof m === 'object') // Filter out boolean values
                  .sort((a, b) => (a.order || 0) - (b.order || 0));
                
                const index = parseInt(moduleId, 10);
                if (index >= 0 && index < sortedModules.length) {
                  realModuleId = sortedModules[index].id;
                  console.log(`Found module at index ${moduleId} with ID ${realModuleId}`);
                }
              }
            }
          }
        }

        // Fetch module data with the real module ID using our enhanced fetching function
        console.log("Fetching module data for:", {
          courseId,
          moduleId: realModuleId,
        });
        const module = await fetchModuleWithContent(courseId, realModuleId);
        if (!module) {
          const errorMessage = `Module non trouvé (Cours: ${courseId}, Module: ${realModuleId})`;
          console.error(errorMessage);
          setError(errorMessage);
          setLoading(false);
          return;
        }
        console.log("Module data retrieved:", module);
        setModuleData(module);

        // Check enrollment
        console.log("Checking enrollment for user:", user.uid);
        const enrollments = await fetchUserEnrollments(user.uid);
        const isUserEnrolled = enrollments.some((e) => e.courseId === courseId);
        console.log("Enrollment status:", isUserEnrolled);
        setIsEnrolled(isUserEnrolled);

        if (!isUserEnrolled) {
          console.warn("User not enrolled in course:", {
            userId: user.uid,
            courseId,
          });
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Une erreur est survenue lors du chargement des données.");
        setLoading(false);
      }
    };

    fetchData();
  }, [user, courseId, moduleId, refreshKey]);

  const handleModuleComplete = async (completedModuleId, score) => {
    console.log("Module completed:", { completedModuleId, score });
    
    // Force refresh to update the UI
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <OptimizedLoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link
          to={`/course/${courseId}`}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au cours
        </Link>
        
        <button
          onClick={handleRefresh}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Rafraîchir
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">{moduleData?.title}</h1>
        <p className="text-gray-600 mb-6">{moduleData?.description}</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {!isEnrolled ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Vous devez être inscrit au cours pour accéder à ce module.
          </div>
        ) : (
          <ModuleContentEnhanced
            module={moduleData}
            onComplete={handleModuleComplete}
            isEnrolled={isEnrolled}
            courseId={courseId}
          />
        )}
      </div>
    </div>
  );
};

export default ModulePageFixed;
