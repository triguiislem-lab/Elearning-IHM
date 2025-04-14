/**
 * Generates a unique module ID
 * @returns {string} - A unique ID for a module
 */
const generateModuleId = () => {
  return `module_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

/**
 * Fixes the structure of a module and ensures consistent ID format
 * @param {Object} moduleData - The module data to fix
 * @param {string} moduleId - The current ID of the module
 * @param {string} courseId - The ID of the course
 * @param {number} index - The index of the module in the array (for order)
 * @returns {Object} - The fixed module data with standardized ID
 */
const fixModuleStructure = (moduleData, moduleId, courseId, index) => {
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
      fixedModule.resources = fixedModule.resources.map((resource, idx) => {
        if (!resource) return null; // Skip null/undefined resources
        
        return {
          id: resource.id || `resource_${Date.now()}_${idx}`,
          title: resource.title || `Ressource ${idx + 1}`,
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
      fixedModule.evaluations.forEach((evaluation, idx) => {
        if (!evaluation) return; // Skip null/undefined evaluations
        
        const evalId = evaluation.id || `eval_${Date.now()}_${idx}`;
        evaluationsObj[evalId] = {
          id: evalId,
          title: evaluation.title || `Évaluation ${idx + 1}`,
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
 * Fixes the structure of a course to ensure modules have consistent ID format
 * @param {string} courseId - The ID of the course to fix
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const fixCourseModuleIds = async (courseId) => {
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
    
    // Convert modules to a standardized format with consistent IDs
    const fixedModules = {};
    
    // Handle array format
    if (Array.isArray(courseData.modules)) {
      courseData.modules.forEach((module, index) => {
        if (!module) return; // Skip null/undefined modules
        
        const moduleId = module.id || `${index}`;
        const fixedModule = fixModuleStructure(module, moduleId, courseId, index);
        fixedModules[fixedModule.id] = fixedModule;
      });
    } 
    // Handle object format
    else if (typeof courseData.modules === 'object') {
      const moduleEntries = Object.entries(courseData.modules);
      moduleEntries.forEach(([moduleId, moduleData], index) => {
        // Skip boolean values (references)
        if (typeof moduleData === 'boolean') return;
        
        const fixedModule = fixModuleStructure(moduleData, moduleId, courseId, index);
        fixedModules[fixedModule.id] = fixedModule;
      });
    }
    
    // Update the course with fixed modules
    await update(courseRef, { 
      modules: fixedModules,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Course ${courseId} module IDs fixed successfully`);
    return true;
  } catch (error) {
    console.error(`Error fixing course ${courseId} module IDs:`, error);
    return false;
  }
};
