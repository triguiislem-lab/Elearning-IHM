// This file contains utility functions to fix existing courses in the database

import { database } from "../../firebaseConfig";
import { ref, get, set, update } from "firebase/database";
import { createModuleIdMapping } from "./ModuleIdMappingFix";

/**
 * Generates a unique module ID
 * @returns {string} - A unique ID for a module
 */
const generateModuleId = () => {
  return `module_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

/**
 * Fixes the structure of a course to ensure modules, resources, and evaluations are properly formatted
 * @param {string} courseId - The ID of the course to fix
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const fixCourseStructure = async (courseId) => {
  try {
    // Get the course data
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      console.error(`Course ${courseId} not found`);
      return false;
    }

    const courseData = courseSnapshot.val();

    // Fix the modules structure
    if (!courseData.modules) {
      // No modules, nothing to fix
      return true;
    }

    // Convert modules to a standardized format
    const fixedModules = {};

    // Handle array format
    if (Array.isArray(courseData.modules)) {
      courseData.modules.forEach((module, index) => {
        if (!module) return; // Skip null/undefined modules

        const moduleId = module.id || `module_${Date.now()}_${index}`;
        const fixedModule = fixModuleStructure(module, moduleId, courseId, index);
        fixedModules[fixedModule.id] = fixedModule; // Use the potentially new module ID as the key
      });
    }
    // Handle object format
    else if (typeof courseData.modules === 'object') {
      Object.entries(courseData.modules).forEach(([moduleId, moduleData]) => {
        // Skip boolean values (references)
        if (typeof moduleData === 'boolean') return;

        const moduleEntries = Object.entries(courseData.modules);
        const index = moduleEntries.findIndex(([id]) => id === moduleId);
        const fixedModule = fixModuleStructure(moduleData, moduleId, courseId, index);
        fixedModules[fixedModule.id] = fixedModule; // Use the potentially new module ID as the key
      });
    }

    // Update the course with fixed modules
    await update(courseRef, {
      modules: fixedModules,
      updatedAt: new Date().toISOString()
    });

    // Create module ID mapping for backward compatibility
    await createModuleIdMapping(courseId, fixedModules);

    console.log(`Course ${courseId} structure fixed successfully`);
    return true;
  } catch (error) {
    console.error(`Error fixing course ${courseId} structure:`, error);
    return false;
  }
};

/**
 * Fixes the structure of a module
 * @param {Object} moduleData - The module data to fix
 * @param {string} moduleId - The ID of the module
 * @param {string} courseId - The ID of the course
 * @param {number} index - The index of the module in the array (for order)
 * @returns {Object} - The fixed module data
 */
const fixModuleStructure = (moduleData, moduleId, courseId, index = 0) => {
  // Create a copy to avoid modifying the original
  const fixedModule = { ...moduleData };

  // Check if the moduleId is numeric (like "0", "1", etc.)
  const isNumericId = /^\d+$/.test(moduleId);

  // Generate a new UUID-style ID if the current one is numeric
  const newModuleId = isNumericId ? generateModuleId() : moduleId;

  // Ensure required fields
  fixedModule.id = newModuleId;
  fixedModule.courseId = courseId;
  fixedModule.title = fixedModule.title || fixedModule.titre || 'Module sans titre';
  fixedModule.description = fixedModule.description || '';
  fixedModule.order = index; // Set order based on array index
  fixedModule.status = fixedModule.status || 'active';
  fixedModule.createdAt = fixedModule.createdAt || new Date().toISOString();
  fixedModule.updatedAt = new Date().toISOString();

  // Fix resources
  if (fixedModule.resources) {
    // Convert object to array if needed
    if (!Array.isArray(fixedModule.resources) && typeof fixedModule.resources === 'object') {
      const resourcesArray = [];
      Object.entries(fixedModule.resources).forEach(([resId, resource]) => {
        // Skip boolean values
        if (typeof resource === 'boolean') return;

        resourcesArray.push({
          id: resId,
          title: resource.title || `Ressource ${resId}`,
          type: resource.type || 'document',
          description: resource.description || `Ressource de type ${resource.type || 'document'}`,
          url: resource.url || '',
          createdAt: resource.createdAt || new Date().toISOString(),
          updatedAt: resource.updatedAt || new Date().toISOString(),
          moduleId: newModuleId, // Use the new module ID
          courseId: courseId,
          ...resource
        });
      });
      fixedModule.resources = resourcesArray;
    }
    // Ensure array items have all required fields
    else if (Array.isArray(fixedModule.resources)) {
      fixedModule.resources = fixedModule.resources.map((resource, index) => {
        if (!resource) return null; // Skip null/undefined resources

        return {
          id: resource.id || `resource_${Date.now()}_${index}`,
          title: resource.title || `Ressource ${index + 1}`,
          type: resource.type || 'document',
          description: resource.description || `Ressource de type ${resource.type || 'document'}`,
          url: resource.url || '',
          createdAt: resource.createdAt || new Date().toISOString(),
          updatedAt: resource.updatedAt || new Date().toISOString(),
          moduleId: newModuleId, // Use the new module ID
          courseId: courseId,
          ...resource
        };
      }).filter(Boolean); // Remove null items
    }
  } else {
    fixedModule.resources = [];
  }

  // Fix evaluations
  if (fixedModule.evaluations) {
    // Convert array to object if needed
    if (Array.isArray(fixedModule.evaluations)) {
      const evaluationsObj = {};
      fixedModule.evaluations.forEach((evaluation, index) => {
        if (!evaluation) return; // Skip null/undefined evaluations

        const evalId = evaluation.id || `eval_${Date.now()}_${index}`;
        evaluationsObj[evalId] = {
          id: evalId,
          title: evaluation.title || `Évaluation ${index + 1}`,
          type: evaluation.type || 'quiz',
          description: evaluation.description || `Évaluation de type ${evaluation.type || 'quiz'}`,
          maxScore: evaluation.maxScore || 100,
          questions: evaluation.questions || [],
          createdAt: evaluation.createdAt || new Date().toISOString(),
          updatedAt: evaluation.updatedAt || new Date().toISOString(),
          date: evaluation.date || new Date().toISOString(),
          moduleId: newModuleId, // Use the new module ID
          ...evaluation
        };
      });
      fixedModule.evaluations = evaluationsObj;
    }
    // Ensure object values have all required fields
    else if (typeof fixedModule.evaluations === 'object') {
      Object.entries(fixedModule.evaluations).forEach(([evalId, evaluation]) => {
        // Skip boolean values
        if (typeof evaluation === 'boolean') {
          fixedModule.evaluations[evalId] = {
            id: evalId,
            title: `Évaluation ${evalId}`,
            type: 'quiz',
            description: 'Évaluation',
            maxScore: 100,
            questions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            date: new Date().toISOString(),
            moduleId: newModuleId // Use the new module ID
          };
          return;
        }

        fixedModule.evaluations[evalId] = {
          id: evalId,
          title: evaluation.title || `Évaluation ${evalId}`,
          type: evaluation.type || 'quiz',
          description: evaluation.description || `Évaluation de type ${evaluation.type || 'quiz'}`,
          maxScore: evaluation.maxScore || 100,
          questions: evaluation.questions || [],
          createdAt: evaluation.createdAt || new Date().toISOString(),
          updatedAt: evaluation.updatedAt || new Date().toISOString(),
          date: evaluation.date || new Date().toISOString(),
          moduleId: newModuleId, // Use the new module ID
          ...evaluation
        };
      });
    }
  } else {
    fixedModule.evaluations = {};
  }

  return fixedModule;
};

/**
 * Fixes all courses in the database
 * @returns {Promise<Object>} - Object with success and failure counts
 */
export const fixAllCourses = async () => {
  try {
    // Get all courses
    const coursesRef = ref(database, 'elearning/courses');
    const coursesSnapshot = await get(coursesRef);

    if (!coursesSnapshot.exists()) {
      console.error('No courses found');
      return { success: 0, failure: 0 };
    }

    const courses = coursesSnapshot.val();
    const courseIds = Object.keys(courses);

    let successCount = 0;
    let failureCount = 0;

    // Fix each course
    for (const courseId of courseIds) {
      const success = await fixCourseStructure(courseId);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log(`Fixed ${successCount} courses successfully, ${failureCount} failures`);
    return { success: successCount, failure: failureCount };
  } catch (error) {
    console.error('Error fixing all courses:', error);
    return { success: 0, failure: 0 };
  }
};

/**
 * Fixes a specific course using the data from our fixed JSON files
 * @param {string} courseId - The ID of the course to fix
 * @param {Object} fixedData - The fixed course data
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const fixSpecificCourse = async (courseId, fixedData) => {
  try {
    // Get the current course data
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      console.error(`Course ${courseId} not found`);
      return false;
    }

    const currentCourse = courseSnapshot.val();

    // Merge the fixed data with the current course data
    const updatedCourse = {
      ...currentCourse,
      modules: fixedData.modules,
      updatedAt: new Date().toISOString()
    };

    // Update the course
    await set(courseRef, updatedCourse);

    console.log(`Course ${courseId} updated successfully with fixed data`);
    return true;
  } catch (error) {
    console.error(`Error fixing course ${courseId} with specific data:`, error);
    return false;
  }
};
