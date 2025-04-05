import { database } from '../../firebaseConfig';
import { ref, get, set, remove } from 'firebase/database';

/**
 * Fonction pour nettoyer et standardiser la structure de la base de données Firebase
 */
export const cleanupDatabase = async () => {
  try {
    console.log("Début du nettoyage de la base de données...");
    
    // 1. Centraliser les inscriptions
    await centralizeEnrollments();
    
    // 2. Standardiser la structure des modules
    await standardizeModules();
    
    // 3. Centraliser les évaluations
    await centralizeEvaluations();
    
    // 4. Standardiser la progression
    await standardizeProgression();
    
    // 5. Nettoyer les collections obsolètes
    await removeObsoletePaths();
    
    console.log("Nettoyage de la base de données terminé avec succès!");
    return true;
  } catch (error) {
    console.error("Erreur lors du nettoyage de la base de données:", error);
    return false;
  }
};

/**
 * Centraliser toutes les inscriptions dans Elearning/Enrollments
 */
const centralizeEnrollments = async () => {
  console.log("Centralisation des inscriptions...");
  
  try {
    // Récupérer toutes les inscriptions existantes
    const enrollmentPaths = [
      'enrollments',
      'Inscriptions',
      'Elearning/Inscriptions'
    ];
    
    // Récupérer tous les cours pour vérifier les inscriptions directement dans les cours
    const coursesRef = ref(database, 'Elearning/Cours');
    const coursesSnapshot = await get(coursesRef);
    
    if (coursesSnapshot.exists()) {
      const courses = coursesSnapshot.val();
      
      // Pour chaque cours, vérifier s'il contient des inscriptions
      for (const [courseId, courseData] of Object.entries(courses)) {
        if (courseData.enrollments) {
          // Migrer les inscriptions vers la structure centralisée
          for (const [userId, enrollmentData] of Object.entries(courseData.enrollments)) {
            // Créer l'inscription dans la structure centralisée
            const enrollmentRef = ref(database, `Elearning/Enrollments/${courseId}/${userId}`);
            
            // Préparer les données d'inscription
            const enrollmentInfo = {
              userId,
              courseId,
              enrolledAt: enrollmentData.enrolledAt || new Date().toISOString(),
              enrollmentId: Date.now().toString()
            };
            
            // Ajouter des informations supplémentaires si disponibles
            if (enrollmentData.userName) enrollmentInfo.userName = enrollmentData.userName;
            if (enrollmentData.userEmail) enrollmentInfo.userEmail = enrollmentData.userEmail;
            if (enrollmentData.courseName) enrollmentInfo.courseName = courseData.titre || courseData.title;
            
            // Enregistrer l'inscription
            await set(enrollmentRef, enrollmentInfo);
            
            // Ajouter également une référence dans byUser
            const userEnrollmentRef = ref(database, `Elearning/Enrollments/byUser/${userId}/${courseId}`);
            await set(userEnrollmentRef, {
              courseId,
              enrolledAt: enrollmentInfo.enrolledAt
            });
            
            console.log(`Inscription migrée pour l'utilisateur ${userId} au cours ${courseId}`);
          }
        }
      }
    }
    
    // Parcourir tous les chemins d'inscriptions
    for (const path of enrollmentPaths) {
      const enrollmentsRef = ref(database, path);
      const enrollmentsSnapshot = await get(enrollmentsRef);
      
      if (enrollmentsSnapshot.exists()) {
        const enrollments = enrollmentsSnapshot.val();
        
        // Migrer chaque inscription vers la structure centralisée
        for (const [enrollmentId, enrollmentData] of Object.entries(enrollments)) {
          // Extraire les informations nécessaires
          const userId = enrollmentData.userId || enrollmentData.apprenant;
          const courseId = enrollmentData.courseId || enrollmentData.course?.id || enrollmentData.course || enrollmentData.formation;
          
          if (userId && courseId) {
            // Créer l'inscription dans la structure centralisée
            const enrollmentRef = ref(database, `Elearning/Enrollments/${courseId}/${userId}`);
            
            // Préparer les données d'inscription
            const enrollmentInfo = {
              userId,
              courseId,
              enrolledAt: enrollmentData.enrolledAt || enrollmentData.date || enrollmentData.dateInscription || new Date().toISOString(),
              enrollmentId: enrollmentData.enrollmentId || Date.now().toString()
            };
            
            // Ajouter des informations supplémentaires si disponibles
            if (enrollmentData.userName) enrollmentInfo.userName = enrollmentData.userName;
            if (enrollmentData.userEmail) enrollmentInfo.userEmail = enrollmentData.userEmail;
            if (enrollmentData.courseName) enrollmentInfo.courseName = enrollmentData.courseName;
            if (enrollmentData.statut) enrollmentInfo.status = enrollmentData.statut;
            
            // Enregistrer l'inscription
            await set(enrollmentRef, enrollmentInfo);
            
            // Ajouter également une référence dans byUser
            const userEnrollmentRef = ref(database, `Elearning/Enrollments/byUser/${userId}/${courseId}`);
            await set(userEnrollmentRef, {
              courseId,
              enrolledAt: enrollmentInfo.enrolledAt
            });
            
            console.log(`Inscription migrée depuis ${path} pour l'utilisateur ${userId} au cours ${courseId}`);
          }
        }
      }
    }
    
    console.log("Centralisation des inscriptions terminée");
  } catch (error) {
    console.error("Erreur lors de la centralisation des inscriptions:", error);
    throw error;
  }
};

/**
 * Standardiser la structure des modules
 */
const standardizeModules = async () => {
  console.log("Standardisation des modules...");
  
  try {
    // Récupérer tous les cours
    const coursesRef = ref(database, 'Elearning/Cours');
    const coursesSnapshot = await get(coursesRef);
    
    if (coursesSnapshot.exists()) {
      const courses = coursesSnapshot.val();
      
      // Pour chaque cours, standardiser la structure des modules
      for (const [courseId, courseData] of Object.entries(courses)) {
        if (courseData.modules) {
          // Vérifier si les modules sont sous forme de tableau ou d'objet
          if (Array.isArray(courseData.modules)) {
            // Convertir le tableau en objet
            const modulesObject = {};
            
            for (let i = 0; i < courseData.modules.length; i++) {
              const moduleData = courseData.modules[i];
              
              // Si c'est un objet avec un ID
              if (typeof moduleData === 'object' && moduleData !== null) {
                const moduleId = moduleData.id || `m${i + 1}_${courseId}`;
                
                // Créer le module standardisé
                const standardizedModule = {
                  ...moduleData,
                  id: moduleId,
                  courseId,
                  order: i + 1
                };
                
                // Ajouter le module à l'objet
                modulesObject[moduleId] = standardizedModule;
              } 
              // Si c'est juste un ID de module
              else if (typeof moduleData === 'string') {
                // Récupérer les données du module depuis Elearning/Modules
                const moduleRef = ref(database, `Elearning/Modules/${moduleData}`);
                const moduleSnapshot = await get(moduleRef);
                
                if (moduleSnapshot.exists()) {
                  const moduleInfo = moduleSnapshot.val();
                  
                  // Créer le module standardisé
                  const standardizedModule = {
                    ...moduleInfo,
                    id: moduleData,
                    courseId,
                    order: i + 1
                  };
                  
                  // Ajouter le module à l'objet
                  modulesObject[moduleData] = standardizedModule;
                } else {
                  // Créer un module par défaut
                  modulesObject[moduleData] = {
                    id: moduleData,
                    courseId,
                    order: i + 1,
                    title: `Module ${i + 1}`,
                    description: `Description du module ${i + 1}`
                  };
                }
              }
            }
            
            // Mettre à jour les modules du cours
            const courseModulesRef = ref(database, `Elearning/Cours/${courseId}/modules`);
            await set(courseModulesRef, modulesObject);
            
            console.log(`Modules standardisés pour le cours ${courseId}`);
          }
        }
      }
    }
    
    console.log("Standardisation des modules terminée");
  } catch (error) {
    console.error("Erreur lors de la standardisation des modules:", error);
    throw error;
  }
};

/**
 * Centraliser toutes les évaluations
 */
const centralizeEvaluations = async () => {
  console.log("Centralisation des évaluations...");
  
  try {
    // Récupérer tous les cours
    const coursesRef = ref(database, 'Elearning/Cours');
    const coursesSnapshot = await get(coursesRef);
    
    if (coursesSnapshot.exists()) {
      const courses = coursesSnapshot.val();
      
      // Pour chaque cours, vérifier les modules et leurs évaluations
      for (const [courseId, courseData] of Object.entries(courses)) {
        if (courseData.modules) {
          // Parcourir les modules
          for (const [moduleId, moduleData] of Object.entries(courseData.modules)) {
            if (moduleData.evaluations) {
              // Migrer les évaluations vers la structure centralisée
              for (const [evalId, evalData] of Object.entries(moduleData.evaluations)) {
                // Créer l'évaluation dans la structure centralisée
                const evaluationRef = ref(database, `Elearning/Evaluations/${moduleId}/${evalId}`);
                
                // Préparer les données d'évaluation
                const evaluationInfo = {
                  ...evalData,
                  moduleId,
                  courseId
                };
                
                // Enregistrer l'évaluation
                await set(evaluationRef, evaluationInfo);
                
                console.log(`Évaluation migrée pour le module ${moduleId}, évaluation ${evalId}`);
              }
            }
          }
        }
      }
    }
    
    // Vérifier également les évaluations dans Elearning/Evaluations
    const evaluationsRef = ref(database, 'Elearning/Evaluations');
    const evaluationsSnapshot = await get(evaluationsRef);
    
    if (evaluationsSnapshot.exists()) {
      const evaluations = evaluationsSnapshot.val();
      
      // Parcourir les évaluations
      for (const [evalId, evalData] of Object.entries(evaluations)) {
        // Si c'est un objet avec des évaluations par utilisateur
        if (typeof evalData === 'object' && evalData !== null) {
          for (const [userId, userEvalData] of Object.entries(evalData)) {
            // Vérifier si les données contiennent moduleId
            if (userEvalData.moduleId) {
              // Créer l'évaluation dans la structure centralisée
              const evaluationRef = ref(database, `Elearning/Evaluations/${userEvalData.moduleId}/${userId}`);
              
              // Préparer les données d'évaluation
              const evaluationInfo = {
                ...userEvalData
              };
              
              // Enregistrer l'évaluation
              await set(evaluationRef, evaluationInfo);
              
              console.log(`Évaluation migrée pour le module ${userEvalData.moduleId}, utilisateur ${userId}`);
            }
          }
        }
      }
    }
    
    console.log("Centralisation des évaluations terminée");
  } catch (error) {
    console.error("Erreur lors de la centralisation des évaluations:", error);
    throw error;
  }
};

/**
 * Standardiser la progression des utilisateurs
 */
const standardizeProgression = async () => {
  console.log("Standardisation de la progression...");
  
  try {
    // Récupérer la progression existante
    const progressionRef = ref(database, 'Elearning/Progression');
    const progressionSnapshot = await get(progressionRef);
    
    if (progressionSnapshot.exists()) {
      const progression = progressionSnapshot.val();
      
      // Parcourir la progression par utilisateur
      for (const [userId, userProgress] of Object.entries(progression)) {
        // Parcourir la progression par cours
        for (const [courseId, courseProgress] of Object.entries(userProgress)) {
          // Vérifier si la progression du cours est un objet
          if (typeof courseProgress === 'object' && courseProgress !== null) {
            // Vérifier si la progression contient des modules
            const moduleKeys = Object.keys(courseProgress).filter(key => 
              key !== 'completed' && 
              key !== 'score' && 
              key !== 'progress' && 
              key !== 'lastUpdated' && 
              key !== 'startDate' && 
              key !== 'userId' && 
              key !== 'courseId' &&
              key !== 'details'
            );
            
            // Si des modules sont présents, calculer la progression globale
            if (moduleKeys.length > 0) {
              let completedModules = 0;
              let totalScore = 0;
              
              // Parcourir les modules
              for (const moduleId of moduleKeys) {
                const moduleProgress = courseProgress[moduleId];
                
                // Vérifier si le module est complété
                if (moduleProgress.completed) {
                  completedModules++;
                  totalScore += moduleProgress.score || moduleProgress.bestScore || 0;
                }
              }
              
              // Calculer la progression globale
              const progress = moduleKeys.length > 0 ? (completedModules / moduleKeys.length) * 100 : 0;
              const averageScore = completedModules > 0 ? totalScore / completedModules : 0;
              
              // Mettre à jour la progression globale du cours
              const courseProgressRef = ref(database, `Elearning/Progression/${userId}/${courseId}`);
              
              // Préparer les données de progression
              const progressInfo = {
                ...courseProgress,
                completed: completedModules === moduleKeys.length && completedModules > 0,
                progress,
                score: averageScore,
                lastUpdated: new Date().toISOString(),
                details: {
                  totalModules: moduleKeys.length,
                  completedModules,
                  moduleScores: moduleKeys.reduce((acc, moduleId) => {
                    if (courseProgress[moduleId].score || courseProgress[moduleId].bestScore) {
                      acc[moduleId] = courseProgress[moduleId].bestScore || courseProgress[moduleId].score || 0;
                    }
                    return acc;
                  }, {})
                }
              };
              
              // Supprimer les propriétés qui ne devraient pas être au niveau racine
              moduleKeys.forEach(moduleId => {
                delete progressInfo[moduleId];
              });
              
              // Enregistrer la progression
              await set(courseProgressRef, progressInfo);
              
              console.log(`Progression standardisée pour l'utilisateur ${userId}, cours ${courseId}`);
            }
          }
        }
      }
    }
    
    console.log("Standardisation de la progression terminée");
  } catch (error) {
    console.error("Erreur lors de la standardisation de la progression:", error);
    throw error;
  }
};

/**
 * Supprimer les chemins obsolètes
 */
const removeObsoletePaths = async () => {
  console.log("Suppression des chemins obsolètes...");
  
  try {
    // Liste des chemins à supprimer
    const obsoletePaths = [
      'enrollments',
      'Inscriptions',
      'Elearning/Inscriptions'
    ];
    
    // Supprimer chaque chemin
    for (const path of obsoletePaths) {
      const pathRef = ref(database, path);
      await remove(pathRef);
      console.log(`Chemin supprimé: ${path}`);
    }
    
    console.log("Suppression des chemins obsolètes terminée");
  } catch (error) {
    console.error("Erreur lors de la suppression des chemins obsolètes:", error);
    throw error;
  }
};

/**
 * Exécuter le nettoyage de la base de données
 */
export const runDatabaseCleanup = async () => {
  try {
    const result = await cleanupDatabase();
    return { success: result, message: result ? "Base de données nettoyée avec succès" : "Échec du nettoyage de la base de données" };
  } catch (error) {
    return { success: false, message: `Erreur: ${error.message}` };
  }
};
