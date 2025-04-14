import { database } from '../../firebaseConfig';
import { ref, get, set, remove } from 'firebase/database';
import * as paths from './firebasePaths';

/**
 * Utilitaire pour migrer les données des anciens chemins vers les nouveaux
 */

// Migrer les données d'un chemin à un autre
export const migrateData = async (oldPath, newPath) => {
  try {
    const oldRef = ref(database, oldPath);
    const snapshot = await get(oldRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const newRef = ref(database, newPath);
      await set(newRef, data);
      console.log(`Migration réussie de ${oldPath} vers ${newPath}`);
      return true;
    } else {
      console.log(`Aucune donnée à migrer depuis ${oldPath}`);
      return false;
    }
  } catch (error) {
    console.error(`Erreur lors de la migration de ${oldPath} vers ${newPath}:`, error);
    return false;
  }
};

// Migrer les inscriptions
export const migrateEnrollments = async () => {
  try {
    const legacyRef = ref(database, paths.LEGACY_ENROLLMENTS_PATH);
    const snapshot = await get(legacyRef);
    
    if (snapshot.exists()) {
      const enrollments = snapshot.val();
      
      // Restructurer les données pour le nouveau format
      for (const userId in enrollments) {
        const userEnrollments = enrollments[userId];
        const userEnrollmentsRef = ref(database, paths.USER_ENROLLMENTS_PATH(userId));
        
        // Migrer les inscriptions par utilisateur
        await set(userEnrollmentsRef, userEnrollments);
        
        // Migrer les inscriptions par cours
        for (const courseId in userEnrollments) {
          const enrollment = userEnrollments[courseId];
          const courseEnrollmentRef = ref(database, `${paths.COURSE_ENROLLMENTS_PATH(courseId)}/${userId}`);
          await set(courseEnrollmentRef, enrollment);
        }
      }
      
      console.log('Migration des inscriptions réussie');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de la migration des inscriptions:', error);
    return false;
  }
};

// Migrer les données de progression
export const migrateProgress = async () => {
  try {
    const legacyRef = ref(database, paths.LEGACY_PROGRESS_PATH);
    const snapshot = await get(legacyRef);
    
    if (snapshot.exists()) {
      const progressData = snapshot.val();
      
      // Restructurer les données pour le nouveau format
      for (const userId in progressData) {
        const userProgress = progressData[userId];
        
        for (const courseId in userProgress) {
          const courseProgress = userProgress[courseId];
          const newPath = paths.USER_COURSE_PROGRESS_PATH(userId, courseId);
          const newRef = ref(database, newPath);
          
          // Standardiser le format de progression
          const standardizedProgress = {
            courseId,
            userId,
            progress: courseProgress.progress || 0,
            completed: courseProgress.completed || false,
            startDate: courseProgress.startDate || new Date().toISOString(),
            lastUpdated: courseProgress.lastUpdated || new Date().toISOString()
          };
          
          // Ajouter les modules si présents
          if (courseProgress.modules) {
            for (const moduleId in courseProgress.modules) {
              const moduleProgress = courseProgress.modules[moduleId];
              standardizedProgress[moduleId] = {
                moduleId,
                completed: moduleProgress.completed || moduleProgress.status === 'completed',
                score: moduleProgress.score || 0,
                lastUpdated: moduleProgress.lastUpdated || new Date().toISOString()
              };
            }
          }
          
          await set(newRef, standardizedProgress);
        }
      }
      
      console.log('Migration des données de progression réussie');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors de la migration des données de progression:', error);
    return false;
  }
};

// Migrer les spécialités
export const migrateSpecialties = async () => {
  return migrateData(paths.LEGACY_SPECIALTIES_PATH, paths.SPECIALTIES_PATH);
};

// Fonction principale pour exécuter toutes les migrations
export const migrateAllData = async () => {
  try {
    const results = {
      enrollments: await migrateEnrollments(),
      progress: await migrateProgress(),
      specialties: await migrateSpecialties()
    };
    
    console.log('Résultats de la migration:', results);
    return results;
  } catch (error) {
    console.error('Erreur lors de la migration des données:', error);
    return {
      enrollments: false,
      progress: false,
      specialties: false,
      error: error.message
    };
  }
};
