/**
 * Enhanced module fetching logic to ensure all resources and evaluations are retrieved correctly
 */

import { database } from "../../firebaseConfig";
import { ref, get } from "firebase/database";

/**
 * Fetches a module with all its resources and evaluations
 * @param {string} courseId - The course ID
 * @param {string} moduleId - The module ID
 * @returns {Promise<Object|null>} - The module data or null if not found
 */
export const fetchModuleWithContent = async (courseId, moduleId) => {
  if (!courseId || !moduleId) {
    console.error("Missing parameters for fetchModuleWithContent:", { courseId, moduleId });
    return null;
  }

  try {
    console.log(`Fetching module: courseId=${courseId}, moduleId=${moduleId}`);
    
    // Try direct module path first
    const modulePath = `elearning/courses/${courseId}/modules/${moduleId}`;
    const moduleRef = ref(database, modulePath);
    const snapshot = await get(moduleRef);

    if (snapshot.exists()) {
      const moduleData = snapshot.val();
      console.log("Module found at direct path:", moduleData);
      
      // Ensure resources is properly structured
      if (moduleData.resources) {
        if (typeof moduleData.resources === 'object' && !Array.isArray(moduleData.resources)) {
          // Convert object to array
          moduleData.resources = Object.entries(moduleData.resources)
            .filter(([_, resource]) => typeof resource === 'object') // Filter out boolean values
            .map(([id, resource]) => ({
              id,
              ...resource
            }));
        }
      } else {
        moduleData.resources = [];
      }
      
      // Ensure evaluations is properly structured
      if (moduleData.evaluations) {
        if (Array.isArray(moduleData.evaluations)) {
          // Convert array to object
          const evaluationsObj = {};
          moduleData.evaluations.forEach(eval => {
            if (eval && eval.id) {
              evaluationsObj[eval.id] = eval;
            }
          });
          moduleData.evaluations = evaluationsObj;
        }
      } else {
        moduleData.evaluations = {};
      }
      
      return {
        ...moduleData,
        id: moduleId,
        courseId
      };
    }
    
    // If not found at direct path, check in course object
    const coursePath = `elearning/courses/${courseId}`;
    const courseRef = ref(database, coursePath);
    const courseSnapshot = await get(courseRef);
    
    if (courseSnapshot.exists()) {
      const courseData = courseSnapshot.val();
      
      if (courseData.modules) {
        // If modules is an array
        if (Array.isArray(courseData.modules)) {
          const foundModule = courseData.modules.find(m => m && m.id === moduleId);
          if (foundModule) {
            console.log("Module found in course modules array:", foundModule);
            
            // Ensure resources is properly structured
            if (foundModule.resources) {
              if (typeof foundModule.resources === 'object' && !Array.isArray(foundModule.resources)) {
                // Convert object to array
                foundModule.resources = Object.entries(foundModule.resources)
                  .filter(([_, resource]) => typeof resource === 'object')
                  .map(([id, resource]) => ({
                    id,
                    ...resource
                  }));
              }
            } else {
              foundModule.resources = [];
            }
            
            // Ensure evaluations is properly structured
            if (foundModule.evaluations) {
              if (Array.isArray(foundModule.evaluations)) {
                // Convert array to object
                const evaluationsObj = {};
                foundModule.evaluations.forEach(eval => {
                  if (eval && eval.id) {
                    evaluationsObj[eval.id] = eval;
                  }
                });
                foundModule.evaluations = evaluationsObj;
              }
            } else {
              foundModule.evaluations = {};
            }
            
            return {
              ...foundModule,
              courseId
            };
          }
        }
        // If modules is an object
        else if (typeof courseData.modules === 'object') {
          if (courseData.modules[moduleId] && typeof courseData.modules[moduleId] === 'object') {
            const foundModule = courseData.modules[moduleId];
            console.log("Module found in course modules object:", foundModule);
            
            // Ensure resources is properly structured
            if (foundModule.resources) {
              if (typeof foundModule.resources === 'object' && !Array.isArray(foundModule.resources)) {
                // Convert object to array
                foundModule.resources = Object.entries(foundModule.resources)
                  .filter(([_, resource]) => typeof resource === 'object')
                  .map(([id, resource]) => ({
                    id,
                    ...resource
                  }));
              }
            } else {
              foundModule.resources = [];
            }
            
            // Ensure evaluations is properly structured
            if (foundModule.evaluations) {
              if (Array.isArray(foundModule.evaluations)) {
                // Convert array to object
                const evaluationsObj = {};
                foundModule.evaluations.forEach(eval => {
                  if (eval && eval.id) {
                    evaluationsObj[eval.id] = eval;
                  }
                });
                foundModule.evaluations = evaluationsObj;
              }
            } else {
              foundModule.evaluations = {};
            }
            
            return {
              ...foundModule,
              id: moduleId,
              courseId
            };
          }
        }
      }
    }
    
    // If still not found, try legacy path
    const legacyPath = `Elearning/Cours/${courseId}/modules/${moduleId}`;
    const legacyRef = ref(database, legacyPath);
    const legacySnapshot = await get(legacyRef);
    
    if (legacySnapshot.exists()) {
      const moduleData = legacySnapshot.val();
      console.log("Module found at legacy path:", moduleData);
      
      // Apply the same normalization as above
      if (moduleData.resources) {
        if (typeof moduleData.resources === 'object' && !Array.isArray(moduleData.resources)) {
          moduleData.resources = Object.entries(moduleData.resources)
            .filter(([_, resource]) => typeof resource === 'object')
            .map(([id, resource]) => ({
              id,
              ...resource
            }));
        }
      } else {
        moduleData.resources = [];
      }
      
      if (moduleData.evaluations) {
        if (Array.isArray(moduleData.evaluations)) {
          const evaluationsObj = {};
          moduleData.evaluations.forEach(eval => {
            if (eval && eval.id) {
              evaluationsObj[eval.id] = eval;
            }
          });
          moduleData.evaluations = evaluationsObj;
        }
      } else {
        moduleData.evaluations = {};
      }
      
      return {
        ...moduleData,
        id: moduleId,
        courseId
      };
    }
    
    console.log(`Module not found: courseId=${courseId}, moduleId=${moduleId}`);
    return null;
  } catch (error) {
    console.error("Error fetching module with content:", error);
    return null;
  }
};
