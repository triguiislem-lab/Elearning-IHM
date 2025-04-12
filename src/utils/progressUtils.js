import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, set, update } from "firebase/database";

// Base path for progress data
const PROGRESS_PATH = "elearning/progress";
const LEGACY_PROGRESS_PATH = "Elearning/Progression";

// Fonction pour récupérer la progression d'un utilisateur pour un cours spécifique
export const getUserCourseProgress = async (userId, courseId) => {
  try {
    const database = getDatabase();
    // Try the standardized path first
    const progressRef = ref(database, `${PROGRESS_PATH}/${userId}/${courseId}`);
    const snapshot = await get(progressRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    // Fallback to legacy path if not found
    const legacyProgressRef = ref(database, `${LEGACY_PROGRESS_PATH}/${userId}/${courseId}`);
    const legacySnapshot = await get(legacyProgressRef);

    if (legacySnapshot.exists()) {
      // Migrate data to new path
      const progressData = legacySnapshot.val();
      await set(progressRef, progressData);
      return progressData;
    }

    return null;
  } catch (error) {
    console.error("Error fetching course progress:", error);
    return null;
  }
};

// Fonction pour récupérer la progression d'un utilisateur pour tous ses cours
export const getUserAllCoursesProgress = async (userId) => {
  try {
    const database = getDatabase();
    // Try the standardized path first
    const progressRef = ref(database, `${PROGRESS_PATH}/${userId}`);
    const snapshot = await get(progressRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    // Fallback to legacy path if not found
    const legacyProgressRef = ref(database, `${LEGACY_PROGRESS_PATH}/${userId}`);
    const legacySnapshot = await get(legacyProgressRef);

    if (legacySnapshot.exists()) {
      // Migrate data to new path
      const progressData = legacySnapshot.val();
      await set(progressRef, progressData);
      return progressData;
    }

    return {};
  } catch (error) {
    console.error("Error fetching all courses progress:", error);
    return {};
  }
};

// Fonction pour mettre à jour la progression d'un module
export const updateModuleProgress = async (userId, courseId, moduleId, data) => {
  try {
    const database = getDatabase();
    const moduleProgressRef = ref(database, `${PROGRESS_PATH}/${userId}/${courseId}/${moduleId}`);
    const legacyModuleProgressRef = ref(database, `${LEGACY_PROGRESS_PATH}/${userId}/${courseId}/${moduleId}`);
    
    const updatedData = {
      ...data,
      lastUpdated: new Date().toISOString()
    };

    // Mettre à jour les données du module dans les deux chemins pour assurer la synchronisation
    await update(moduleProgressRef, updatedData);
    await update(legacyModuleProgressRef, updatedData);

    // Recalculer la progression globale du cours
    await recalculateCourseProgress(userId, courseId);

    return true;
  } catch (error) {
    console.error("Error updating module progress:", error);
    return false;
  }
};

// Fonction pour recalculer la progression globale d'un cours
export const recalculateCourseProgress = async (userId, courseId) => {
  try {
    const database = getDatabase();
    const courseProgressRef = ref(database, `${PROGRESS_PATH}/${userId}/${courseId}`);
    const legacyCourseProgressRef = ref(database, `${LEGACY_PROGRESS_PATH}/${userId}/${courseId}`);
    
    const snapshot = await get(courseProgressRef);

    if (snapshot.exists()) {
      const progressData = snapshot.val();

      // Filtrer les clés qui sont des modules (pas des métadonnées du cours)
      const moduleKeys = Object.keys(progressData).filter(key =>
        key !== 'courseId' &&
        key !== 'userId' &&
        key !== 'startDate' &&
        key !== 'progress' &&
        key !== 'completed' &&
        key !== 'lastUpdated' &&
        key !== 'details' &&
        key !== 'score'
      );

      // Calculer le nombre de modules complétés
      const completedModules = moduleKeys.filter(key => progressData[key].completed).length;

      // Calculer le pourcentage de progression
      const progressPercentage = moduleKeys.length > 0
        ? Math.round((completedModules / moduleKeys.length) * 100)
        : 0;

      // Calculer le score moyen
      let totalScore = 0;
      let modulesWithScore = 0;

      moduleKeys.forEach(key => {
        if (progressData[key].completed && progressData[key].score) {
          totalScore += progressData[key].score;
          modulesWithScore++;
        }
      });

      const averageScore = modulesWithScore > 0 
        ? Math.round(totalScore / modulesWithScore) 
        : 0;

      // Déterminer si le cours est complété
      const isCompleted = moduleKeys.length > 0 && completedModules === moduleKeys.length;

      // Préparer les données à mettre à jour
      const updatedData = {
        progress: progressPercentage,
        completed: isCompleted,
        score: averageScore,
        lastUpdated: new Date().toISOString(),
        details: {
          totalModules: moduleKeys.length,
          completedModules,
          moduleScores: moduleKeys.reduce((acc, key) => {
            if (progressData[key].score) {
              acc[key] = progressData[key].score;
            }
            return acc;
          }, {})
        }
      };

      // Mettre à jour la progression du cours dans les deux chemins pour assurer la synchronisation
      await update(courseProgressRef, updatedData);
      await update(legacyCourseProgressRef, updatedData);

      return {
        progress: progressPercentage,
        completed: isCompleted,
        totalModules: moduleKeys.length,
        completedModules,
        score: averageScore
      };
    }

    return null;
  } catch (error) {
    console.error("Error recalculating course progress:", error);
    return null;
  }
};

// Fonction pour initialiser la progression d'un cours pour un utilisateur
export const initializeCourseProgress = async (userId, courseId, modules = []) => {
  try {
    const database = getDatabase();
    const courseProgressRef = ref(database, `${PROGRESS_PATH}/${userId}/${courseId}`);
    const legacyCourseProgressRef = ref(database, `${LEGACY_PROGRESS_PATH}/${userId}/${courseId}`);

    // Créer l'objet de progression initial
    const initialProgress = {
      courseId,
      userId,
      startDate: new Date().toISOString(),
      progress: 0,
      completed: false,
      lastUpdated: new Date().toISOString()
    };

    // Ajouter des entrées pour chaque module si fourni
    if (modules.length > 0) {
      modules.forEach(module => {
        initialProgress[module.id] = {
          moduleId: module.id,
          completed: false,
          score: 0,
          lastUpdated: new Date().toISOString()
        };
      });
    }

    // Enregistrer la progression initiale dans les deux chemins
    await set(courseProgressRef, initialProgress);
    await set(legacyCourseProgressRef, initialProgress);

    return true;
  } catch (error) {
    console.error("Error initializing course progress:", error);
    return false;
  }
};

// Fonction pour synchroniser la progression entre l'ancien et le nouveau chemin
export const synchronizeProgressPaths = async (userId, courseId) => {
  try {
    const database = getDatabase();
    
    // Vérifier la progression dans le nouveau chemin
    const newPathRef = ref(database, `${PROGRESS_PATH}/${userId}/${courseId}`);
    const newPathSnapshot = await get(newPathRef);
    
    // Vérifier la progression dans l'ancien chemin
    const oldPathRef = ref(database, `${LEGACY_PROGRESS_PATH}/${userId}/${courseId}`);
    const oldPathSnapshot = await get(oldPathRef);
    
    // Si les deux existent, utiliser les données les plus récentes
    if (newPathSnapshot.exists() && oldPathSnapshot.exists()) {
      const newData = newPathSnapshot.val();
      const oldData = oldPathSnapshot.val();
      
      // Comparer les dates de dernière mise à jour
      const newLastUpdated = new Date(newData.lastUpdated || 0);
      const oldLastUpdated = new Date(oldData.lastUpdated || 0);
      
      if (newLastUpdated >= oldLastUpdated) {
        // Les données du nouveau chemin sont plus récentes ou égales
        await set(oldPathRef, newData);
        return newData;
      } else {
        // Les données de l'ancien chemin sont plus récentes
        await set(newPathRef, oldData);
        return oldData;
      }
    } 
    // Si seulement le nouveau chemin existe, copier vers l'ancien
    else if (newPathSnapshot.exists()) {
      const data = newPathSnapshot.val();
      await set(oldPathRef, data);
      return data;
    } 
    // Si seulement l'ancien chemin existe, copier vers le nouveau
    else if (oldPathSnapshot.exists()) {
      const data = oldPathSnapshot.val();
      await set(newPathRef, data);
      return data;
    }
    
    // Aucune donnée trouvée
    return null;
  } catch (error) {
    console.error("Error synchronizing progress paths:", error);
    return null;
  }
};

// Fonction pour obtenir le taux d'accomplissement global d'un utilisateur
export const getUserOverallProgress = async (userId) => {
  try {
    const allProgress = await getUserAllCoursesProgress(userId);

    if (!allProgress || Object.keys(allProgress).length === 0) {
      return {
        enrolledCourses: 0,
        completedCourses: 0,
        overallProgress: 0
      };
    }

    const courseIds = Object.keys(allProgress);
    let totalProgress = 0;
    let completedCourses = 0;

    courseIds.forEach(courseId => {
      const courseProgress = allProgress[courseId];

      if (courseProgress.progress) {
        totalProgress += courseProgress.progress;
      }

      if (courseProgress.completed) {
        completedCourses++;
      }
    });

    const overallProgress = courseIds.length > 0
      ? Math.round(totalProgress / courseIds.length)
      : 0;

    return {
      enrolledCourses: courseIds.length,
      completedCourses,
      overallProgress
    };
  } catch (error) {
    console.error("Error calculating overall progress:", error);
    return {
      enrolledCourses: 0,
      completedCourses: 0,
      overallProgress: 0
    };
  }
};
