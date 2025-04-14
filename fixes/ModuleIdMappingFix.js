/**
 * This file contains utilities to handle module ID mapping between numeric IDs and UUID-style IDs
 * This ensures backward compatibility with existing URLs while standardizing the database structure
 */

import { database } from "../../firebaseConfig";
import { ref, get, set } from "firebase/database";

/**
 * Creates a mapping between numeric module IDs (0, 1, 2) and UUID-style IDs
 * @param {string} courseId - The ID of the course
 * @param {Object} modules - The modules object with UUID-style IDs
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const createModuleIdMapping = async (courseId, modules) => {
  try {
    if (!courseId || !modules) {
      console.error('Missing parameters for createModuleIdMapping');
      return false;
    }

    // Create a mapping object
    const moduleMapping = {};
    
    // Sort modules by order
    const sortedModules = Object.entries(modules)
      .map(([id, module]) => ({ id, order: module.order || 0 }))
      .sort((a, b) => a.order - b.order);
    
    // Create mapping from numeric IDs to UUID-style IDs
    sortedModules.forEach((module, index) => {
      moduleMapping[index.toString()] = module.id;
    });
    
    // Store the mapping in the database
    const mappingRef = ref(database, `elearning/courses/${courseId}/moduleIdMapping`);
    await set(mappingRef, moduleMapping);
    
    console.log(`Module ID mapping created for course ${courseId}:`, moduleMapping);
    return true;
  } catch (error) {
    console.error(`Error creating module ID mapping for course ${courseId}:`, error);
    return false;
  }
};

/**
 * Gets the real module ID from a numeric ID using the mapping
 * @param {string} courseId - The ID of the course
 * @param {string} numericId - The numeric module ID (0, 1, 2, etc.)
 * @returns {Promise<string|null>} - The UUID-style module ID or null if not found
 */
export const getRealModuleId = async (courseId, numericId) => {
  try {
    if (!courseId || numericId === undefined) {
      console.error('Missing parameters for getRealModuleId');
      return null;
    }
    
    // Check if the ID is already a UUID-style ID
    if (numericId.includes('_')) {
      return numericId; // Already a UUID-style ID
    }
    
    // Get the mapping from the database
    const mappingRef = ref(database, `elearning/courses/${courseId}/moduleIdMapping`);
    const snapshot = await get(mappingRef);
    
    if (snapshot.exists()) {
      const mapping = snapshot.val();
      const realId = mapping[numericId];
      
      if (realId) {
        console.log(`Mapped numeric ID ${numericId} to real ID ${realId}`);
        return realId;
      }
    }
    
    // If no mapping exists, try to find the module by index
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);
    
    if (courseSnapshot.exists()) {
      const courseData = courseSnapshot.val();
      
      if (courseData.modules) {
        // If modules is an object, convert to array and sort by order
        if (typeof courseData.modules === 'object' && !Array.isArray(courseData.modules)) {
          const modulesArray = Object.entries(courseData.modules)
            .map(([id, module]) => ({ id, order: module.order || 0 }))
            .sort((a, b) => a.order - b.order);
          
          const index = parseInt(numericId, 10);
          if (index >= 0 && index < modulesArray.length) {
            const realId = modulesArray[index].id;
            console.log(`Found module at index ${index} with ID ${realId}`);
            return realId;
          }
        }
        // If modules is already an array
        else if (Array.isArray(courseData.modules)) {
          const index = parseInt(numericId, 10);
          if (index >= 0 && index < courseData.modules.length) {
            const realId = courseData.modules[index].id;
            console.log(`Found module at index ${index} with ID ${realId}`);
            return realId;
          }
        }
      }
    }
    
    console.warn(`No mapping found for numeric ID ${numericId} in course ${courseId}`);
    return null;
  } catch (error) {
    console.error(`Error getting real module ID for course ${courseId}, numeric ID ${numericId}:`, error);
    return null;
  }
};

/**
 * Updates the module ID mapping for a course after fixing module IDs
 * @param {string} courseId - The ID of the course
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const updateModuleIdMapping = async (courseId) => {
  try {
    if (!courseId) {
      console.error('Missing courseId for updateModuleIdMapping');
      return false;
    }
    
    // Get the course data
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);
    
    if (!courseSnapshot.exists()) {
      console.error(`Course ${courseId} not found`);
      return false;
    }
    
    const courseData = courseSnapshot.val();
    
    // If no modules, nothing to map
    if (!courseData.modules) {
      return true;
    }
    
    // Create the mapping
    return await createModuleIdMapping(courseId, courseData.modules);
  } catch (error) {
    console.error(`Error updating module ID mapping for course ${courseId}:`, error);
    return false;
  }
};
