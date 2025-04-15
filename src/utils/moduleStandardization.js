import { database } from '../../firebaseConfig';
import { ref, get, set, update } from 'firebase/database';
import * as paths from './firebasePaths';

/**
 * Generates a unique ID for a module
 * @returns {string} A unique module ID
 */
export const generateModuleId = () => {
  return `module_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

/**
 * Standardizes a module object to ensure it has all required fields
 * @param {Object} moduleData - The module data to standardize
 * @param {string} courseId - The ID of the course this module belongs to
 * @returns {Object} A standardized module object
 */
export const standardizeModule = (moduleData, courseId) => {
  // Generate a module ID if one doesn't exist
  const moduleId = moduleData.id || generateModuleId();

  // Create a standardized module object
  const standardizedModule = {
    id: moduleId,
    courseId: courseId,
    title: moduleData.title || 'Module sans titre',
    description: moduleData.description || '',
    order: moduleData.order || 0,
    status: moduleData.status || 'active',
    createdAt: moduleData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resources: Array.isArray(moduleData.resources) ? moduleData.resources : [],
    evaluations: moduleData.evaluations || {}
  };

  return standardizedModule;
};

/**
 * Saves a module to all necessary paths in the database
 * @param {Object} moduleData - The module data to save
 * @param {string} courseId - The ID of the course this module belongs to
 * @returns {Promise<Object>} The saved module
 */
export const saveModuleToAllPaths = async (moduleData, courseId) => {
  try {
    // Standardize the module
    const standardizedData = standardizeModule(moduleData, courseId);

    // Vérifier si l'ID du module est défini
    if (!standardizedData.id) {
      console.error('Module ID is missing after standardization', standardizedData);
      throw new Error('Module ID is missing');
    }
    
    // Vérifier si l'ID du cours est défini DANS LES DONNÉES STANDARDISÉES
    if (standardizedData.courseId === undefined) {
        console.error('!!! courseId is undefined in standardizedData just before saving !!!', JSON.stringify(standardizedData, null, 2));
        // Tentative de correction : réassigner courseId s'il est manquant
        // ATTENTION : Ceci est un patch, la cause première doit être trouvée
        if (courseId) {
            console.warn('Patching missing courseId in standardizedData with passed courseId:', courseId);
            standardizedData.courseId = courseId;
        } else {
            console.error('Cannot patch missing courseId, the passed courseId is also missing!');
            throw new Error('Cannot save module without courseId');
        }
    }

    console.log('--- Debug: Data before saving to Firebase in saveModuleToAllPaths ---');
    console.log('Passed Course ID:', courseId);
    console.log('Standardized Data:', JSON.stringify(standardizedData, null, 2));
    console.log('--- End Debug ---');

    // Définir le chemin exclusif pour la sauvegarde
    const exclusivePath = `elearning/courses/${courseId}/modules/${standardizedData.id}`;
    const moduleRef = ref(database, exclusivePath);

    // Sauvegarder les données standardisées dans le chemin exclusif
    await set(moduleRef, standardizedData);
    console.log(`Module ${standardizedData.id} saved successfully to exclusive path: ${exclusivePath}`);

    // Retourner les données sauvegardées
    return standardizedData;

  } catch (error) {
    console.error(`Error saving module ${moduleData?.id || '(no id)'} for course ${courseId}:`, error);
    // Propager l'erreur pour que l'appelant puisse la gérer
    throw error; 
  }
};

/**
 * Retrieves a module from all possible paths in the database
 * @param {string} courseId - The ID of the course
 * @param {string} moduleId - The ID of the module
 * @returns {Promise<Object>} The module data
 */
export const getModuleFromAllPaths = async (courseId, moduleId) => {
  try {
    console.log(`Retrieving module ${moduleId} for course ${courseId} from exclusive path`);

    // Utiliser EXCLUSIVEMENT le chemin elearning/courses/[courseId]/modules/[moduleId]
    const exclusivePath = `elearning/courses/${courseId}/modules/${moduleId}`;
    const moduleRef = ref(database, exclusivePath);
    const moduleSnapshot = await get(moduleRef);

    if (moduleSnapshot.exists()) {
      const moduleData = moduleSnapshot.val();
      console.log(`Module found at exclusive path: ${exclusivePath}`);
      return standardizeModule(moduleData, courseId);
    }

    // Si le module n'est pas trouvé directement, chercher dans le tableau modules du cours
    const courseModulesPath = `elearning/courses/${courseId}/modules`;
    const courseModulesRef = ref(database, courseModulesPath);
    const courseModulesSnapshot = await get(courseModulesRef);

    if (courseModulesSnapshot.exists()) {
      const modulesData = courseModulesSnapshot.val();
      let foundModule = null;

      if (Array.isArray(modulesData)) {
        foundModule = modulesData.find(m => m.id === moduleId);
      } else if (typeof modulesData === 'object') {
        foundModule = modulesData[moduleId];
      }

      if (foundModule) {
        console.log(`Module found in course modules at ${courseModulesPath}`);

        // Important: Sauvegarder le module trouvé dans le chemin exclusif pour les futures requêtes
        try {
          await set(moduleRef, foundModule);
          console.log(`Module saved to exclusive path for future requests`);
        } catch (saveError) {
          console.warn('Could not save module to exclusive path:', saveError);
        }

        return standardizeModule(foundModule, courseId);
      }
    }

    // Gestion spéciale pour le module 0 (premier module)
    if (moduleId === '0' || moduleId === 0) {
      if (courseModulesSnapshot.exists()) {
        const modulesData = courseModulesSnapshot.val();
        let firstModule = null;

        if (Array.isArray(modulesData) && modulesData.length > 0) {
          firstModule = modulesData[0];
        } else if (typeof modulesData === 'object') {
          const moduleKeys = Object.keys(modulesData);
          if (moduleKeys.length > 0) {
            firstModule = modulesData[moduleKeys[0]];
          }
        }

        if (firstModule) {
          console.log(`First module found for module/0 request`);

          // Sauvegarder le premier module comme module 0 pour les futures requêtes
          try {
            await set(moduleRef, firstModule);
            console.log(`First module saved as module/0 for future requests`);
          } catch (saveError) {
            console.warn('Could not save first module as module/0:', saveError);
          }

          return standardizeModule(firstModule, courseId);
        }
      }
    }

    // Module not found, create a placeholder
    console.warn(`Module ${moduleId} not found for course ${courseId}`);
    return {
      id: moduleId,
      courseId: courseId,
      title: "Module non trouvé",
      description: "Ce module n'existe pas dans le cours actuel",
      resources: [],
      evaluations: {},
      notFound: true
    };
  } catch (error) {
    console.error('Error retrieving module:', error);
    throw error;
  }
};
