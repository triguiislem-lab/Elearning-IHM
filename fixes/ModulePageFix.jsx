// This file contains fixes for the ModulePage.jsx component to handle both numeric and UUID-style module IDs

import { getRealModuleId } from '../utils/ModuleIdMappingFix';

// Replace the existing module ID resolution logic in the useEffect of ModulePage.jsx with this improved version:

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

      // Get the real module ID using our mapping utility
      let realModuleId = moduleId;
      
      // If moduleId looks like a numeric ID (0, 1, 2, etc.), try to map it to a UUID-style ID
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

      // Fetch module data with the real module ID
      console.log("Fetching module data for:", {
        courseId,
        moduleId: realModuleId,
      });
      const module = await fetchModuleDetails(courseId, realModuleId);
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
}, [user, courseId, moduleId]);
