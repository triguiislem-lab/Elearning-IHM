// This file contains the fixes needed for the CourseForm.jsx file

// 1. Fix the module structure conversion in the handleSubmit function
// Replace the existing modulesObject conversion with this improved version:

const modulesObject = {};
courseModules.forEach((module, index) => {
  // Ensure module has an id
  const moduleId = module.id || `module_${Date.now()}_${index}`;
  
  // Create a properly structured module object
  modulesObject[moduleId] = {
    ...module,
    id: moduleId, // Keep the ID in the object
    courseId: courseId, // Ensure courseId is set
    order: index, // Ensure order is set based on array index
    status: module.status || 'active',
    createdAt: module.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Ensure resources is an array
  if (!Array.isArray(modulesObject[moduleId].resources)) {
    modulesObject[moduleId].resources = [];
  }

  // Ensure evaluations is an object
  if (!modulesObject[moduleId].evaluations || Array.isArray(modulesObject[moduleId].evaluations)) {
    modulesObject[moduleId].evaluations = {};
  }

  // Remove temporary properties
  delete modulesObject[moduleId].evaluationsArray;
});

// 2. Add this validation function to check module structure before saving
const validateModuleStructure = (modules) => {
  let isValid = true;
  let errorMessage = '';

  if (!modules || modules.length === 0) {
    return { isValid: true, errorMessage: '' }; // No modules is valid
  }

  modules.forEach((module, index) => {
    // Check required fields
    if (!module.title || module.title.trim() === '') {
      isValid = false;
      errorMessage = `Le module ${index + 1} n'a pas de titre.`;
      return;
    }

    // Check resources structure
    if (module.resources) {
      if (!Array.isArray(module.resources)) {
        isValid = false;
        errorMessage = `Les ressources du module "${module.title}" ne sont pas dans un format valide.`;
        return;
      }

      module.resources.forEach((resource, resIndex) => {
        if (!resource.title || !resource.type) {
          isValid = false;
          errorMessage = `La ressource ${resIndex + 1} du module "${module.title}" est incomplète.`;
          return;
        }
        
        if ((resource.type === 'video' || resource.type === 'link') && !resource.url) {
          isValid = false;
          errorMessage = `La ressource "${resource.title}" du module "${module.title}" n'a pas d'URL.`;
          return;
        }
      });
    }

    // Check evaluations structure
    if (module.evaluations) {
      if (typeof module.evaluations !== 'object' || Array.isArray(module.evaluations)) {
        isValid = false;
        errorMessage = `Les évaluations du module "${module.title}" ne sont pas dans un format valide.`;
        return;
      }

      Object.values(module.evaluations).forEach((evaluation) => {
        if (!evaluation.title || !evaluation.type) {
          isValid = false;
          errorMessage = `Une évaluation du module "${module.title}" est incomplète.`;
          return;
        }
        
        if (evaluation.type === 'quiz' && (!evaluation.questions || evaluation.questions.length === 0)) {
          isValid = false;
          errorMessage = `Le quiz "${evaluation.title}" du module "${module.title}" n'a pas de questions.`;
          return;
        }
      });
    }
  });

  return { isValid, errorMessage };
};

// 3. Add this function to normalize module data when loading a course
const normalizeModuleData = (courseData) => {
  if (!courseData.modules) {
    courseData.modules = [];
    return courseData;
  }

  // Convert modules object to array if needed
  if (!Array.isArray(courseData.modules)) {
    const modulesArray = Object.entries(courseData.modules).map(([id, moduleData]) => {
      // Handle case where moduleData is just a boolean (true)
      if (typeof moduleData === 'boolean') {
        return null; // Skip this module
      }

      // Ensure module has an id
      const module = { ...moduleData, id: id };

      // Normalize resources if they exist
      if (module.resources && !Array.isArray(module.resources)) {
        module.resources = Object.entries(module.resources).map(([resId, resource]) => ({
          id: resId,
          ...resource
        }));
      } else if (!module.resources) {
        module.resources = [];
      }

      // Ensure evaluations is an object
      if (!module.evaluations) {
        module.evaluations = {};
      }

      return module;
    }).filter(Boolean); // Remove null entries

    courseData.modules = modulesArray;
  }

  return courseData;
};
