// This file contains fixes for the fetchModuleDetails function to handle both numeric and UUID-style module IDs

import { database } from "../../firebaseConfig";
import { ref, get } from "firebase/database";
import { getRealModuleId } from "./ModuleIdMappingFix";

/**
 * Enhanced version of fetchModuleDetails that handles both numeric and UUID-style module IDs
 * @param {string} courseId - ID of the course
 * @param {string} moduleId - ID of the module (can be numeric or UUID-style)
 * @returns {Object|null} Module details or null if not found
 */
export const fetchModuleDetailsEnhanced = async (courseId, moduleId) => {
  if (!courseId || !moduleId) {
    console.error('fetchModuleDetailsEnhanced: Missing parameters', { courseId, moduleId });
    return null;
  }

  try {
    // First, try to get the real module ID if it's a numeric ID
    let realModuleId = moduleId;
    if (/^\d+$/.test(moduleId)) {
      const mappedId = await getRealModuleId(courseId, moduleId);
      if (mappedId) {
        realModuleId = mappedId;
        console.log(`Using mapped module ID: ${realModuleId} instead of ${moduleId}`);
      }
    }

    // Try to fetch the module directly using the real module ID
    const moduleRef = ref(database, `elearning/courses/${courseId}/modules/${realModuleId}`);
    const snapshot = await get(moduleRef);

    if (snapshot.exists()) {
      const moduleData = snapshot.val();
      return {
        ...moduleData,
        id: realModuleId,
        courseId: courseId
      };
    }

    // If not found, try to fetch the course and find the module
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (courseSnapshot.exists()) {
      const courseData = courseSnapshot.val();
      
      if (courseData.modules) {
        // If modules is an array
        if (Array.isArray(courseData.modules)) {
          // Try to find by ID first
          let moduleData = courseData.modules.find(m => m.id === realModuleId);
          
          // If not found and moduleId is numeric, try to find by index
          if (!moduleData && /^\d+$/.test(moduleId)) {
            const index = parseInt(moduleId, 10);
            if (index >= 0 && index < courseData.modules.length) {
              moduleData = courseData.modules[index];
            }
          }
          
          if (moduleData) {
            return {
              ...moduleData,
              courseId: courseId
            };
          }
        }
        // If modules is an object
        else if (typeof courseData.modules === 'object') {
          // Try to find by ID directly
          if (courseData.modules[realModuleId]) {
            return {
              ...courseData.modules[realModuleId],
              id: realModuleId,
              courseId: courseId
            };
          }
          
          // If not found and moduleId is numeric, try to find by index
          if (/^\d+$/.test(moduleId)) {
            const index = parseInt(moduleId, 10);
            const sortedModules = Object.entries(courseData.modules)
              .filter(([_, module]) => typeof module === 'object') // Filter out boolean values
              .map(([id, module]) => ({ id, order: module.order || 0 }))
              .sort((a, b) => a.order - b.order);
            
            if (index >= 0 && index < sortedModules.length) {
              const foundModuleId = sortedModules[index].id;
              return {
                ...courseData.modules[foundModuleId],
                id: foundModuleId,
                courseId: courseId
              };
            }
          }
        }
      }
    }

    // If still not found, try the legacy path
    const legacyCoursePath = `Elearning/Cours/${courseId}`;
    const legacyCourseRef = ref(database, legacyCoursePath);
    const legacyCourseSnapshot = await get(legacyCourseRef);

    if (legacyCourseSnapshot.exists()) {
      const legacyCourseData = legacyCourseSnapshot.val();
      
      if (legacyCourseData.modules) {
        // Similar logic as above for legacy data
        if (Array.isArray(legacyCourseData.modules)) {
          let moduleData = legacyCourseData.modules.find(m => m.id === realModuleId);
          
          if (!moduleData && /^\d+$/.test(moduleId)) {
            const index = parseInt(moduleId, 10);
            if (index >= 0 && index < legacyCourseData.modules.length) {
              moduleData = legacyCourseData.modules[index];
            }
          }
          
          if (moduleData) {
            return {
              ...moduleData,
              courseId: courseId
            };
          }
        } else if (typeof legacyCourseData.modules === 'object') {
          if (legacyCourseData.modules[realModuleId]) {
            return {
              ...legacyCourseData.modules[realModuleId],
              id: realModuleId,
              courseId: courseId
            };
          }
          
          if (/^\d+$/.test(moduleId)) {
            const index = parseInt(moduleId, 10);
            const sortedModules = Object.entries(legacyCourseData.modules)
              .filter(([_, module]) => typeof module === 'object')
              .map(([id, module]) => ({ id, order: module.order || 0 }))
              .sort((a, b) => a.order - b.order);
            
            if (index >= 0 && index < sortedModules.length) {
              const foundModuleId = sortedModules[index].id;
              return {
                ...legacyCourseData.modules[foundModuleId],
                id: foundModuleId,
                courseId: courseId
              };
            }
          }
        }
      }
    }

    console.error(`Module not found: courseId=${courseId}, moduleId=${moduleId}, realModuleId=${realModuleId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching module details: courseId=${courseId}, moduleId=${moduleId}`, error);
    return null;
  }
};
