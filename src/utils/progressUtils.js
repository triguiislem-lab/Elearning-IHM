import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, set, update } from "firebase/database";

// Base path for progress data
const PROGRESS_PATH = "elearning/progress";

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
    const legacyProgressRef = ref(database, `Elearning/Progression/${userId}/${courseId}`);
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
    const legacyProgressRef = ref(database, `Elearning/Progression/${userId}`);
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

    // Mettre à jour les données du module
    await update(moduleProgressRef, {
      ...data,
      lastUpdated: new Date().toISOString()
    });

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
        key !== 'lastUpdated'
      );

      // Calculer le nombre de modules complétés
      const completedModules = moduleKeys.filter(key => progressData[key].completed).length;

      // Calculer le pourcentage de progression
      const progressPercentage = moduleKeys.length > 0
        ? Math.round((completedModules / moduleKeys.length) * 100)
        : 0;

      // Déterminer si le cours est complété
      const isCompleted = moduleKeys.length > 0 && completedModules === moduleKeys.length;

      // Mettre à jour la progression du cours
      await update(courseProgressRef, {
        progress: progressPercentage,
        completed: isCompleted,
        lastUpdated: new Date().toISOString()
      });

      return {
        progress: progressPercentage,
        completed: isCompleted,
        totalModules: moduleKeys.length,
        completedModules
      };
    }

    return null;
  } catch (error) {

    return null;
  }
};

// Fonction pour initialiser la progression d'un cours pour un utilisateur
export const initializeCourseProgress = async (userId, courseId, modules = []) => {
  try {
    const database = getDatabase();
    const courseProgressRef = ref(database, `${PROGRESS_PATH}/${userId}/${courseId}`);

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

    // Enregistrer la progression initiale
    await set(courseProgressRef, initialProgress);

    return true;
  } catch (error) {
    console.error("Error initializing course progress:", error);
    return false;
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
