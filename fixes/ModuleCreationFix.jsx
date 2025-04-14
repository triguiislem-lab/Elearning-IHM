// This file contains fixes for module creation to ensure consistent ID format

/**
 * Generates a unique module ID
 * @returns {string} - A unique ID for a module
 */
const generateModuleId = () => {
  return `module_${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

// 1. Fix the handleAddModule function to use UUID-style IDs
const handleAddModule = () => {
  // Generate a unique ID for the module
  const moduleId = generateModuleId();
  
  // Create a new module with the generated ID
  const newModule = {
    id: moduleId,
    title: "Nouveau module",
    description: "",
    order: modules.length,
    status: "active",
    resources: [],
    evaluations: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    courseId: courseId
  };
  
  // Add the new module to the modules array
  setModules([...modules, newModule]);
  
  // Select the new module for editing
  setSelectedModule(newModule);
  setShowModuleForm(true);
};

// 2. Fix the handleSubmit function in CourseForm to ensure consistent module IDs
// Replace the existing modulesObject conversion with this improved version:
const modulesObject = {};
courseModules.forEach((module, index) => {
  // Ensure module has a UUID-style ID
  const moduleId = module.id && !(/^\d+$/.test(module.id)) 
    ? module.id 
    : generateModuleId();
  
  // Create a properly structured module object
  modulesObject[moduleId] = {
    ...module,
    id: moduleId, // Use the UUID-style ID
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

  // Update moduleId references in resources
  if (Array.isArray(modulesObject[moduleId].resources)) {
    modulesObject[moduleId].resources = modulesObject[moduleId].resources.map(resource => ({
      ...resource,
      moduleId: moduleId // Update to the new moduleId
    }));
  }

  // Update moduleId references in evaluations
  if (typeof modulesObject[moduleId].evaluations === 'object') {
    Object.keys(modulesObject[moduleId].evaluations).forEach(evalId => {
      modulesObject[moduleId].evaluations[evalId] = {
        ...modulesObject[moduleId].evaluations[evalId],
        moduleId: moduleId // Update to the new moduleId
      };
    });
  }

  // Remove temporary properties
  delete modulesObject[moduleId].evaluationsArray;
});
