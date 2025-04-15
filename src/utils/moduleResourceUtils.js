import { database } from '../../firebaseConfig';
import { ref, get, set, push, update } from 'firebase/database';
import * as paths from './firebasePaths';
import { getModuleFromAllPaths } from './moduleStandardization';

/**
 * Génère un ID unique pour une ressource
 * @returns {string} Un ID unique
 */
const generateResourceId = () => {
  return `resource_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Génère un ID unique pour une évaluation
 * @returns {string} Un ID unique
 */
const generateEvaluationId = () => {
  return `evaluation_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Ajoute une ressource à un module
 * @param {string} courseId - L'ID du cours
 * @param {string} moduleId - L'ID du module
 * @param {Object} resourceData - Les données de la ressource
 * @returns {Promise<Object>} La ressource ajoutée
 */
export const addResourceToModule = async (courseId, moduleId, resourceData) => {
  try {
    console.log(`Adding resource to module ${moduleId} in course ${courseId}`);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    // Récupérer le module depuis le chemin principal
    const module = await getModuleFromAllPaths(courseId, moduleId);

    if (module.notFound) {
      throw new Error(`Module ${moduleId} not found for course ${courseId}`);
    }

    // Générer un ID unique pour la ressource
    const resourceId = generateResourceId();

    // Créer l'objet ressource
    const resource = {
      id: resourceId,
      title: resourceData.title,
      description: resourceData.description || '',
      type: resourceData.type || 'video',
      url: resourceData.url || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Utiliser uniquement le chemin principal comme demandé
    // elearning/courses/[courseId]/modules/[moduleId]/resources
    const moduleResourcesRef = ref(database, `${paths.MODULE_PATH(courseId, moduleId)}/resources`);
    const moduleResourcesSnapshot = await get(moduleResourcesRef);

    if (moduleResourcesSnapshot.exists()) {
      // Si resources existe déjà, ajouter la nouvelle ressource
      const resources = moduleResourcesSnapshot.val();
      let updatedResources = {};

      if (Array.isArray(resources)) {
        // Si resources est un tableau, convertir en objet
        updatedResources = {};
        resources.forEach((res, index) => {
          updatedResources[res.id || `resource_${index}`] = res;
        });
        updatedResources[resourceId] = resource;
      } else {
        // Si resources est un objet, ajouter la nouvelle ressource
        updatedResources = {
          ...resources,
          [resourceId]: resource
        };
      }

      await set(moduleResourcesRef, updatedResources);
      console.log(`Resource added to existing resources at ${paths.MODULE_PATH(courseId, moduleId)}/resources`);
    } else {
      // Si resources n'existe pas, créer un nouvel objet avec la ressource
      await set(moduleResourcesRef, {
        [resourceId]: resource
      });
      console.log(`Created new resources object at ${paths.MODULE_PATH(courseId, moduleId)}/resources`);
    }

    // Mettre à jour le module dans le cours pour maintenir la cohérence
    try {
      // Récupérer le module à jour depuis le chemin principal
      const updatedModuleRef = ref(database, paths.MODULE_PATH(courseId, moduleId));
      const updatedModuleSnapshot = await get(updatedModuleRef);

      if (updatedModuleSnapshot.exists()) {
        const updatedModule = updatedModuleSnapshot.val();

        // Mettre à jour le module dans le tableau des modules du cours
        const courseModulesRef = ref(database, `${paths.COURSE_PATH(courseId)}/modules`);
        const courseModulesSnapshot = await get(courseModulesRef);

        if (courseModulesSnapshot.exists()) {
          const modules = courseModulesSnapshot.val();

          if (Array.isArray(modules)) {
            // Si modules est un tableau, trouver et mettre à jour le module
            const moduleIndex = modules.findIndex(m => m.id === moduleId);

            if (moduleIndex >= 0) {
              modules[moduleIndex] = updatedModule;
              await set(courseModulesRef, modules);
              console.log(`Updated module in course modules array`);
            }
          } else if (typeof modules === 'object') {
            // Si modules est un objet, mettre à jour le module
            modules[moduleId] = updatedModule;
            await set(courseModulesRef, modules);
            console.log(`Updated module in course modules object`);
          }
        }
      }
    } catch (courseUpdateError) {
      console.warn('Could not update course modules:', courseUpdateError);
      // Continue even if course update fails
    }

    console.log(`Resource ${resourceId} added to module ${moduleId} in course ${courseId}`);
    return resource;
  } catch (error) {
    console.error('Error adding resource to module:', error);
    throw error;
  }
};

/**
 * Ajoute une évaluation à un module
 * @param {string} courseId - L'ID du cours
 * @param {string} moduleId - L'ID du module
 * @param {Object} evaluationData - Les données de l'évaluation
 * @returns {Promise<Object>} L'évaluation ajoutée
 */
export const addEvaluationToModule = async (courseId, moduleId, evaluationData) => {
  try {
    console.log(`Adding evaluation to module ${moduleId} in course ${courseId}`);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    // Récupérer le module depuis le chemin principal
    const module = await getModuleFromAllPaths(courseId, moduleId);

    if (module.notFound) {
      throw new Error(`Module ${moduleId} not found for course ${courseId}`);
    }

    // Générer un ID unique pour l'évaluation
    const evaluationId = generateEvaluationId();

    // Créer l'objet évaluation
    const evaluation = {
      id: evaluationId,
      title: evaluationData.title,
      description: evaluationData.description || '',
      type: evaluationData.type || 'quiz',
      maxScore: evaluationData.maxScore || 100,
      questions: evaluationData.questions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Utiliser uniquement le chemin principal comme demandé
    // elearning/courses/[courseId]/modules/[moduleId]/evaluations
    const moduleEvaluationsRef = ref(database, `${paths.MODULE_PATH(courseId, moduleId)}/evaluations`);
    const moduleEvaluationsSnapshot = await get(moduleEvaluationsRef);

    if (moduleEvaluationsSnapshot.exists()) {
      // Si evaluations existe déjà, ajouter la nouvelle évaluation
      const evaluations = moduleEvaluationsSnapshot.val();
      let updatedEvaluations = {};

      if (Array.isArray(evaluations)) {
        // Si evaluations est un tableau, convertir en objet
        updatedEvaluations = {};
        evaluations.forEach((evalItem, index) => {
          updatedEvaluations[evalItem.id || `evaluation_${index}`] = evalItem;
        });
        updatedEvaluations[evaluationId] = evaluation;
      } else {
        // Si evaluations est un objet, ajouter la nouvelle évaluation
        updatedEvaluations = {
          ...evaluations,
          [evaluationId]: evaluation
        };
      }

      await set(moduleEvaluationsRef, updatedEvaluations);
      console.log(`Evaluation added to existing evaluations at ${paths.MODULE_PATH(courseId, moduleId)}/evaluations`);
    } else {
      // Si evaluations n'existe pas, créer un nouvel objet avec l'évaluation
      await set(moduleEvaluationsRef, {
        [evaluationId]: evaluation
      });
      console.log(`Created new evaluations object at ${paths.MODULE_PATH(courseId, moduleId)}/evaluations`);
    }

    // Mettre à jour le module dans le cours pour maintenir la cohérence
    try {
      // Récupérer le module à jour depuis le chemin principal
      const updatedModuleRef = ref(database, paths.MODULE_PATH(courseId, moduleId));
      const updatedModuleSnapshot = await get(updatedModuleRef);

      if (updatedModuleSnapshot.exists()) {
        const updatedModule = updatedModuleSnapshot.val();

        // Mettre à jour le module dans le tableau des modules du cours
        const courseModulesRef = ref(database, `${paths.COURSE_PATH(courseId)}/modules`);
        const courseModulesSnapshot = await get(courseModulesRef);

        if (courseModulesSnapshot.exists()) {
          const modules = courseModulesSnapshot.val();

          if (Array.isArray(modules)) {
            // Si modules est un tableau, trouver et mettre à jour le module
            const moduleIndex = modules.findIndex(m => m.id === moduleId);

            if (moduleIndex >= 0) {
              modules[moduleIndex] = updatedModule;
              await set(courseModulesRef, modules);
              console.log(`Updated module in course modules array`);
            }
          } else if (typeof modules === 'object') {
            // Si modules est un objet, mettre à jour le module
            modules[moduleId] = updatedModule;
            await set(courseModulesRef, modules);
            console.log(`Updated module in course modules object`);
          }
        }
      }
    } catch (courseUpdateError) {
      console.warn('Could not update course modules:', courseUpdateError);
      // Continue even if course update fails
    }

    console.log(`Evaluation ${evaluationId} added to module ${moduleId} in course ${courseId}`);
    return evaluation;
  } catch (error) {
    console.error('Error adding evaluation to module:', error);
    throw error;
  }
};

/**
 * Récupère les ressources d'un module
 * @param {string} courseId - L'ID du cours
 * @param {string} moduleId - L'ID du module
 * @returns {Promise<Array>} Les ressources du module
 */
export const getModuleResources = async (courseId, moduleId) => {
  try {
    console.log(`Getting resources for module ${moduleId} in course ${courseId}`);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    // Utiliser uniquement le chemin principal comme demandé
    // elearning/courses/[courseId]/modules/[moduleId]/resources
    const resourcesRef = ref(database, `${paths.MODULE_PATH(courseId, moduleId)}/resources`);
    const resourcesSnapshot = await get(resourcesRef);

    if (resourcesSnapshot.exists()) {
      const resources = resourcesSnapshot.val();
      console.log(`Resources found at main path: ${paths.MODULE_PATH(courseId, moduleId)}/resources`);

      if (Array.isArray(resources)) {
        return resources;
      } else {
        return Object.values(resources);
      }
    }

    // Si aucune ressource n'est trouvée directement, essayer de récupérer le module et ses ressources
    const module = await getModuleFromAllPaths(courseId, moduleId);

    if (!module.notFound && module.resources) {
      console.log(`Resources found in module data`);

      // Sauvegarder les ressources dans le chemin principal pour les futures requêtes
      try {
        await set(resourcesRef, module.resources);
        console.log(`Resources saved to main path for future requests`);
      } catch (saveError) {
        console.warn('Could not save resources to main path:', saveError);
      }

      if (Array.isArray(module.resources)) {
        return module.resources;
      } else {
        return Object.values(module.resources);
      }
    }

    // Aucune ressource trouvée
    console.log(`No resources found for module ${moduleId} in course ${courseId}`);
    return [];
  } catch (error) {
    console.error('Error getting module resources:', error);
    return [];
  }
};

/**
 * Récupère les évaluations d'un module
 * @param {string} courseId - L'ID du cours
 * @param {string} moduleId - L'ID du module
 * @returns {Promise<Array>} Les évaluations du module
 */
export const getModuleEvaluations = async (courseId, moduleId) => {
  try {
    console.log(`Getting evaluations for module ${moduleId} in course ${courseId}`);

    if (!courseId) {
      throw new Error('Course ID is required');
    }

    if (!moduleId) {
      throw new Error('Module ID is required');
    }

    // Utiliser uniquement le chemin principal comme demandé
    // elearning/courses/[courseId]/modules/[moduleId]/evaluations
    const evaluationsRef = ref(database, `${paths.MODULE_PATH(courseId, moduleId)}/evaluations`);
    const evaluationsSnapshot = await get(evaluationsRef);

    if (evaluationsSnapshot.exists()) {
      const evaluations = evaluationsSnapshot.val();
      console.log(`Evaluations found at main path: ${paths.MODULE_PATH(courseId, moduleId)}/evaluations`);

      if (Array.isArray(evaluations)) {
        return evaluations;
      } else {
        return Object.values(evaluations);
      }
    }

    // Si aucune évaluation n'est trouvée directement, essayer de récupérer le module et ses évaluations
    const module = await getModuleFromAllPaths(courseId, moduleId);

    if (!module.notFound && module.evaluations) {
      console.log(`Evaluations found in module data`);

      // Sauvegarder les évaluations dans le chemin principal pour les futures requêtes
      try {
        await set(evaluationsRef, module.evaluations);
        console.log(`Evaluations saved to main path for future requests`);
      } catch (saveError) {
        console.warn('Could not save evaluations to main path:', saveError);
      }

      if (Array.isArray(module.evaluations)) {
        return module.evaluations;
      } else {
        return Object.values(module.evaluations);
      }
    }

    // Aucune évaluation trouvée
    console.log(`No evaluations found for module ${moduleId} in course ${courseId}`);
    return [];
  } catch (error) {
    console.error('Error getting module evaluations:', error);
    return [];
  }
};
