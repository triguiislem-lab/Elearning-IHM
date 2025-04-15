import { database } from '../../firebaseConfig';
import { ref, get } from 'firebase/database';
import * as paths from './firebasePaths';

/**
 * Fonction qui récupère et affiche les modules et ressources depuis tous les chemins possibles
 * @param {string} courseId - L'ID du cours
 * @returns {Promise<Object>} Un objet contenant les résultats de débogage
 */
export const debugModulesAndResources = async (courseId) => {
  if (!courseId) {
    console.error('courseId est requis pour le débogage');
    return { error: 'courseId est requis' };
  }

  console.log(`=== DÉBUT DU DÉBOGAGE POUR LE COURS ${courseId} ===`);
  
  const results = {
    courseId,
    paths: {},
    modules: [],
    resources: {},
    evaluations: {}
  };

  // Liste des chemins possibles pour les modules
  const possiblePaths = [
    {
      name: 'Chemin principal',
      path: paths.COURSE_MODULES_PATH(courseId),
      type: 'course_modules'
    },
    {
      name: 'Chemin modules indépendant',
      path: `elearning/modules/${courseId}`,
      type: 'standalone_modules'
    },
    {
      name: 'Chemin hérité (Cours)',
      path: `${paths.LEGACY_COURSE_PATH(courseId)}/modules`,
      type: 'legacy_course_modules'
    },
    {
      name: 'Chemin hérité (Modules)',
      path: paths.LEGACY_MODULES_PATH(courseId),
      type: 'legacy_standalone_modules'
    }
  ];

  // Vérifier chaque chemin
  for (const pathInfo of possiblePaths) {
    console.log(`Vérification du chemin: ${pathInfo.name} (${pathInfo.path})`);
    
    try {
      const pathRef = ref(database, pathInfo.path);
      const snapshot = await get(pathRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        results.paths[pathInfo.type] = {
          exists: true,
          path: pathInfo.path,
          name: pathInfo.name,
          count: Array.isArray(data) ? data.length : Object.keys(data).length,
          isArray: Array.isArray(data)
        };
        
        // Traiter les modules
        let modules = [];
        
        if (Array.isArray(data)) {
          modules = data;
        } else {
          modules = Object.values(data);
        }
        
        console.log(`${pathInfo.name}: ${modules.length} modules trouvés`);
        
        // Ajouter les modules au résultat
        modules.forEach(module => {
          // Vérifier si le module a un ID
          if (!module.id) {
            console.warn(`Module sans ID trouvé dans ${pathInfo.name}`);
            return;
          }
          
          // Ajouter le module au résultat s'il n'existe pas déjà
          const existingModule = results.modules.find(m => m.id === module.id);
          
          if (!existingModule) {
            results.modules.push({
              id: module.id,
              title: module.title || 'Sans titre',
              description: module.description || '',
              paths: [{ type: pathInfo.type, path: pathInfo.path }],
              hasResources: module.resources ? true : false,
              resourceCount: module.resources ? 
                (Array.isArray(module.resources) ? module.resources.length : Object.keys(module.resources).length) : 0,
              hasEvaluations: module.evaluations ? true : false,
              evaluationCount: module.evaluations ? 
                (Array.isArray(module.evaluations) ? module.evaluations.length : Object.keys(module.evaluations).length) : 0
            });
          } else {
            // Ajouter le chemin au module existant
            existingModule.paths.push({ type: pathInfo.type, path: pathInfo.path });
          }
          
          // Traiter les ressources du module
          if (module.resources) {
            console.log(`Module ${module.id}: Traitement des ressources`);
            
            let resources = [];
            
            if (Array.isArray(module.resources)) {
              resources = module.resources;
            } else {
              resources = Object.values(module.resources);
            }
            
            console.log(`Module ${module.id}: ${resources.length} ressources trouvées`);
            
            // Ajouter les ressources au résultat
            resources.forEach(resource => {
              if (!resource.id) {
                console.warn(`Ressource sans ID trouvée dans le module ${module.id}`);
                return;
              }
              
              if (!results.resources[module.id]) {
                results.resources[module.id] = [];
              }
              
              // Vérifier si la ressource existe déjà
              const existingResource = results.resources[module.id].find(r => r.id === resource.id);
              
              if (!existingResource) {
                results.resources[module.id].push({
                  id: resource.id,
                  title: resource.title || 'Sans titre',
                  type: resource.type || 'unknown',
                  paths: [{ type: pathInfo.type, path: `${pathInfo.path}/${module.id}/resources` }]
                });
              } else {
                // Ajouter le chemin à la ressource existante
                existingResource.paths.push({ type: pathInfo.type, path: `${pathInfo.path}/${module.id}/resources` });
              }
            });
          }
          
          // Traiter les évaluations du module
          if (module.evaluations) {
            console.log(`Module ${module.id}: Traitement des évaluations`);
            
            let evaluations = [];
            
            if (Array.isArray(module.evaluations)) {
              evaluations = module.evaluations;
            } else {
              evaluations = Object.values(module.evaluations);
            }
            
            console.log(`Module ${module.id}: ${evaluations.length} évaluations trouvées`);
            
            // Ajouter les évaluations au résultat
            evaluations.forEach(evaluation => {
              if (!evaluation.id) {
                console.warn(`Évaluation sans ID trouvée dans le module ${module.id}`);
                return;
              }
              
              if (!results.evaluations[module.id]) {
                results.evaluations[module.id] = [];
              }
              
              // Vérifier si l'évaluation existe déjà
              const existingEvaluation = results.evaluations[module.id].find(e => e.id === evaluation.id);
              
              if (!existingEvaluation) {
                results.evaluations[module.id].push({
                  id: evaluation.id,
                  title: evaluation.title || 'Sans titre',
                  type: evaluation.type || 'unknown',
                  paths: [{ type: pathInfo.type, path: `${pathInfo.path}/${module.id}/evaluations` }]
                });
              } else {
                // Ajouter le chemin à l'évaluation existante
                existingEvaluation.paths.push({ type: pathInfo.type, path: `${pathInfo.path}/${module.id}/evaluations` });
              }
            });
          }
        });
      } else {
        results.paths[pathInfo.type] = {
          exists: false,
          path: pathInfo.path,
          name: pathInfo.name
        };
        console.log(`${pathInfo.name}: Aucun module trouvé`);
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification du chemin ${pathInfo.name}:`, error);
      results.paths[pathInfo.type] = {
        exists: false,
        path: pathInfo.path,
        name: pathInfo.name,
        error: error.message
      };
    }
  }
  
  // Vérifier les modules individuellement
  for (const module of results.modules) {
    console.log(`Vérification du module ${module.id} individuellement`);
    
    // Chemins possibles pour un module individuel
    const modulePathsToCheck = [
      {
        name: 'Chemin principal du module',
        path: paths.MODULE_PATH(courseId, module.id),
        type: 'direct_module'
      },
      {
        name: 'Chemin hérité du module',
        path: paths.LEGACY_MODULE_PATH(courseId, module.id),
        type: 'legacy_direct_module'
      }
    ];
    
    for (const pathInfo of modulePathsToCheck) {
      try {
        const moduleRef = ref(database, pathInfo.path);
        const moduleSnapshot = await get(moduleRef);
        
        if (moduleSnapshot.exists()) {
          const moduleData = moduleSnapshot.val();
          
          // Ajouter le chemin au module
          module.paths.push({ type: pathInfo.type, path: pathInfo.path });
          
          // Vérifier les ressources
          if (moduleData.resources) {
            console.log(`Module ${module.id} (${pathInfo.name}): Vérification des ressources`);
            
            let resources = [];
            
            if (Array.isArray(moduleData.resources)) {
              resources = moduleData.resources;
            } else {
              resources = Object.values(moduleData.resources);
            }
            
            console.log(`Module ${module.id} (${pathInfo.name}): ${resources.length} ressources trouvées`);
            
            // Ajouter les ressources au résultat
            resources.forEach(resource => {
              if (!resource.id) {
                console.warn(`Ressource sans ID trouvée dans le module ${module.id} (${pathInfo.name})`);
                return;
              }
              
              if (!results.resources[module.id]) {
                results.resources[module.id] = [];
              }
              
              // Vérifier si la ressource existe déjà
              const existingResource = results.resources[module.id].find(r => r.id === resource.id);
              
              if (!existingResource) {
                results.resources[module.id].push({
                  id: resource.id,
                  title: resource.title || 'Sans titre',
                  type: resource.type || 'unknown',
                  paths: [{ type: pathInfo.type, path: `${pathInfo.path}/resources` }]
                });
              } else {
                // Ajouter le chemin à la ressource existante
                existingResource.paths.push({ type: pathInfo.type, path: `${pathInfo.path}/resources` });
              }
            });
          }
          
          // Vérifier les évaluations
          if (moduleData.evaluations) {
            console.log(`Module ${module.id} (${pathInfo.name}): Vérification des évaluations`);
            
            let evaluations = [];
            
            if (Array.isArray(moduleData.evaluations)) {
              evaluations = moduleData.evaluations;
            } else {
              evaluations = Object.values(moduleData.evaluations);
            }
            
            console.log(`Module ${module.id} (${pathInfo.name}): ${evaluations.length} évaluations trouvées`);
            
            // Ajouter les évaluations au résultat
            evaluations.forEach(evaluation => {
              if (!evaluation.id) {
                console.warn(`Évaluation sans ID trouvée dans le module ${module.id} (${pathInfo.name})`);
                return;
              }
              
              if (!results.evaluations[module.id]) {
                results.evaluations[module.id] = [];
              }
              
              // Vérifier si l'évaluation existe déjà
              const existingEvaluation = results.evaluations[module.id].find(e => e.id === evaluation.id);
              
              if (!existingEvaluation) {
                results.evaluations[module.id].push({
                  id: evaluation.id,
                  title: evaluation.title || 'Sans titre',
                  type: evaluation.type || 'unknown',
                  paths: [{ type: pathInfo.type, path: `${pathInfo.path}/evaluations` }]
                });
              } else {
                // Ajouter le chemin à l'évaluation existante
                existingEvaluation.paths.push({ type: pathInfo.type, path: `${pathInfo.path}/evaluations` });
              }
            });
          }
        } else {
          console.log(`Module ${module.id} (${pathInfo.name}): Non trouvé`);
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification du module ${module.id} (${pathInfo.name}):`, error);
      }
    }
  }
  
  // Afficher un résumé
  console.log(`=== RÉSUMÉ DU DÉBOGAGE POUR LE COURS ${courseId} ===`);
  console.log(`Nombre de modules trouvés: ${results.modules.length}`);
  
  results.modules.forEach(module => {
    console.log(`- Module ${module.id} (${module.title}): Trouvé dans ${module.paths.length} chemins`);
    console.log(`  Ressources: ${results.resources[module.id] ? results.resources[module.id].length : 0}`);
    console.log(`  Évaluations: ${results.evaluations[module.id] ? results.evaluations[module.id].length : 0}`);
  });
  
  console.log(`=== FIN DU DÉBOGAGE POUR LE COURS ${courseId} ===`);
  
  return results;
};

/**
 * Fonction qui affiche les détails d'un module spécifique
 * @param {string} courseId - L'ID du cours
 * @param {string} moduleId - L'ID du module
 * @returns {Promise<Object>} Un objet contenant les résultats de débogage
 */
export const debugModuleDetails = async (courseId, moduleId) => {
  if (!courseId || !moduleId) {
    console.error('courseId et moduleId sont requis pour le débogage');
    return { error: 'courseId et moduleId sont requis' };
  }

  console.log(`=== DÉBUT DU DÉBOGAGE POUR LE MODULE ${moduleId} DU COURS ${courseId} ===`);
  
  const results = {
    courseId,
    moduleId,
    paths: {},
    module: null,
    resources: [],
    evaluations: []
  };

  // Chemins possibles pour un module
  const possiblePaths = [
    {
      name: 'Chemin principal du module',
      path: paths.MODULE_PATH(courseId, moduleId),
      type: 'direct_module'
    },
    {
      name: 'Chemin hérité du module',
      path: paths.LEGACY_MODULE_PATH(courseId, moduleId),
      type: 'legacy_direct_module'
    },
    {
      name: 'Module dans le cours (principal)',
      path: `${paths.COURSE_PATH(courseId)}/modules/${moduleId}`,
      type: 'course_module'
    },
    {
      name: 'Module dans le cours (hérité)',
      path: `${paths.LEGACY_COURSE_PATH(courseId)}/modules/${moduleId}`,
      type: 'legacy_course_module'
    }
  ];

  // Vérifier chaque chemin
  for (const pathInfo of possiblePaths) {
    console.log(`Vérification du chemin: ${pathInfo.name} (${pathInfo.path})`);
    
    try {
      const pathRef = ref(database, pathInfo.path);
      const snapshot = await get(pathRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        results.paths[pathInfo.type] = {
          exists: true,
          path: pathInfo.path,
          name: pathInfo.name,
          data: data
        };
        
        // Stocker les données du module
        if (!results.module) {
          results.module = {
            id: moduleId,
            title: data.title || 'Sans titre',
            description: data.description || '',
            paths: [{ type: pathInfo.type, path: pathInfo.path }]
          };
        } else {
          results.module.paths.push({ type: pathInfo.type, path: pathInfo.path });
        }
        
        // Vérifier les ressources
        if (data.resources) {
          console.log(`${pathInfo.name}: Vérification des ressources`);
          
          let resources = [];
          
          if (Array.isArray(data.resources)) {
            resources = data.resources;
          } else {
            resources = Object.values(data.resources);
          }
          
          console.log(`${pathInfo.name}: ${resources.length} ressources trouvées`);
          
          // Ajouter les ressources au résultat
          resources.forEach(resource => {
            if (!resource.id) {
              console.warn(`Ressource sans ID trouvée dans ${pathInfo.name}`);
              return;
            }
            
            // Vérifier si la ressource existe déjà
            const existingResource = results.resources.find(r => r.id === resource.id);
            
            if (!existingResource) {
              results.resources.push({
                id: resource.id,
                title: resource.title || 'Sans titre',
                type: resource.type || 'unknown',
                url: resource.url || '',
                description: resource.description || '',
                paths: [{ type: pathInfo.type, path: `${pathInfo.path}/resources` }]
              });
            } else {
              // Ajouter le chemin à la ressource existante
              existingResource.paths.push({ type: pathInfo.type, path: `${pathInfo.path}/resources` });
            }
          });
        }
        
        // Vérifier les évaluations
        if (data.evaluations) {
          console.log(`${pathInfo.name}: Vérification des évaluations`);
          
          let evaluations = [];
          
          if (Array.isArray(data.evaluations)) {
            evaluations = data.evaluations;
          } else {
            evaluations = Object.values(data.evaluations);
          }
          
          console.log(`${pathInfo.name}: ${evaluations.length} évaluations trouvées`);
          
          // Ajouter les évaluations au résultat
          evaluations.forEach(evaluation => {
            if (!evaluation.id) {
              console.warn(`Évaluation sans ID trouvée dans ${pathInfo.name}`);
              return;
            }
            
            // Vérifier si l'évaluation existe déjà
            const existingEvaluation = results.evaluations.find(e => e.id === evaluation.id);
            
            if (!existingEvaluation) {
              results.evaluations.push({
                id: evaluation.id,
                title: evaluation.title || 'Sans titre',
                type: evaluation.type || 'unknown',
                description: evaluation.description || '',
                paths: [{ type: pathInfo.type, path: `${pathInfo.path}/evaluations` }]
              });
            } else {
              // Ajouter le chemin à l'évaluation existante
              existingEvaluation.paths.push({ type: pathInfo.type, path: `${pathInfo.path}/evaluations` });
            }
          });
        }
      } else {
        results.paths[pathInfo.type] = {
          exists: false,
          path: pathInfo.path,
          name: pathInfo.name
        };
        console.log(`${pathInfo.name}: Module non trouvé`);
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification du chemin ${pathInfo.name}:`, error);
      results.paths[pathInfo.type] = {
        exists: false,
        path: pathInfo.path,
        name: pathInfo.name,
        error: error.message
      };
    }
  }
  
  // Vérifier les ressources et évaluations directement
  const resourcesPath = `${paths.MODULE_PATH(courseId, moduleId)}/resources`;
  const evaluationsPath = `${paths.MODULE_PATH(courseId, moduleId)}/evaluations`;
  
  try {
    const resourcesRef = ref(database, resourcesPath);
    const resourcesSnapshot = await get(resourcesRef);
    
    if (resourcesSnapshot.exists()) {
      const resourcesData = resourcesSnapshot.val();
      
      let resources = [];
      
      if (Array.isArray(resourcesData)) {
        resources = resourcesData;
      } else {
        resources = Object.values(resourcesData);
      }
      
      console.log(`Ressources directes: ${resources.length} ressources trouvées`);
      
      // Ajouter les ressources au résultat
      resources.forEach(resource => {
        if (!resource.id) {
          console.warn(`Ressource sans ID trouvée dans les ressources directes`);
          return;
        }
        
        // Vérifier si la ressource existe déjà
        const existingResource = results.resources.find(r => r.id === resource.id);
        
        if (!existingResource) {
          results.resources.push({
            id: resource.id,
            title: resource.title || 'Sans titre',
            type: resource.type || 'unknown',
            url: resource.url || '',
            description: resource.description || '',
            paths: [{ type: 'direct_resources', path: resourcesPath }]
          });
        } else {
          // Ajouter le chemin à la ressource existante
          existingResource.paths.push({ type: 'direct_resources', path: resourcesPath });
        }
      });
    }
  } catch (error) {
    console.error(`Erreur lors de la vérification des ressources directes:`, error);
  }
  
  try {
    const evaluationsRef = ref(database, evaluationsPath);
    const evaluationsSnapshot = await get(evaluationsRef);
    
    if (evaluationsSnapshot.exists()) {
      const evaluationsData = evaluationsSnapshot.val();
      
      let evaluations = [];
      
      if (Array.isArray(evaluationsData)) {
        evaluations = evaluationsData;
      } else {
        evaluations = Object.values(evaluationsData);
      }
      
      console.log(`Évaluations directes: ${evaluations.length} évaluations trouvées`);
      
      // Ajouter les évaluations au résultat
      evaluations.forEach(evaluation => {
        if (!evaluation.id) {
          console.warn(`Évaluation sans ID trouvée dans les évaluations directes`);
          return;
        }
        
        // Vérifier si l'évaluation existe déjà
        const existingEvaluation = results.evaluations.find(e => e.id === evaluation.id);
        
        if (!existingEvaluation) {
          results.evaluations.push({
            id: evaluation.id,
            title: evaluation.title || 'Sans titre',
            type: evaluation.type || 'unknown',
            description: evaluation.description || '',
            paths: [{ type: 'direct_evaluations', path: evaluationsPath }]
          });
        } else {
          // Ajouter le chemin à l'évaluation existante
          existingEvaluation.paths.push({ type: 'direct_evaluations', path: evaluationsPath });
        }
      });
    }
  } catch (error) {
    console.error(`Erreur lors de la vérification des évaluations directes:`, error);
  }
  
  // Afficher un résumé
  console.log(`=== RÉSUMÉ DU DÉBOGAGE POUR LE MODULE ${moduleId} DU COURS ${courseId} ===`);
  console.log(`Module trouvé: ${results.module ? 'Oui' : 'Non'}`);
  
  if (results.module) {
    console.log(`- Titre: ${results.module.title}`);
    console.log(`- Description: ${results.module.description}`);
    console.log(`- Trouvé dans ${results.module.paths.length} chemins`);
    console.log(`- Ressources: ${results.resources.length}`);
    console.log(`- Évaluations: ${results.evaluations.length}`);
  }
  
  console.log(`=== FIN DU DÉBOGAGE POUR LE MODULE ${moduleId} DU COURS ${courseId} ===`);
  
  return results;
};
