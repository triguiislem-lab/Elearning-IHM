import { getDatabase, ref, get } from 'firebase/database';
import { getCachedData, setCachedData } from './cacheUtils';
import { fetchInstructorById } from './firebaseUtils';

/**
 * Fonction pour récupérer un cours par son ID avec normalisation des modules, ressources et évaluations
 * @param {string} courseId - ID du cours
 * @param {boolean} includeModules - Inclure les modules du cours
 * @param {boolean} includeInstructor - Inclure les détails de l'instructeur
 * @returns {Object|null} Détails du cours ou null si non trouvé
 */
export const fetchCourseByIdFixed = async (
  courseId,
  includeModules = false,
  includeInstructor = false
) => {
  if (!courseId) return null;

  const database = getDatabase();
  const cacheKey = `course_${courseId}_${includeInstructor}_${includeModules}`;
  const cachedData = getCachedData(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    // Vérifier d'abord le nouveau chemin
    let courseRef = ref(database, `elearning/courses/${courseId}`);
    let snapshot = await get(courseRef);

    // Si non trouvé, vérifier l'ancien chemin
    if (!snapshot.exists()) {
      courseRef = ref(database, `Elearning/Cours/${courseId}`);
      snapshot = await get(courseRef);
    }

    if (snapshot.exists()) {
      const courseData = snapshot.val();

      // Ajouter une date de création par défaut si elle n'existe pas
      if (!courseData.createdAt) {
        // Utiliser updatedAt en priorité, sinon une date par défaut (30 jours avant aujourd'hui)
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() - 30);

        courseData.createdAt = courseData.updatedAt || defaultDate.toISOString();
      }

      // S'assurer que l'ID est inclus
      const course = { id: courseId, ...courseData };

      // Récupérer les données de l'instructeur si demandé
      if (includeInstructor && course.instructorId) {
        try {
          course.instructor = await fetchInstructorById(course.instructorId);
        } catch (error) {
          console.error("Erreur lors de la récupération de l'instructeur:", error);
        }
      }

      // Si les modules sont demandés
      if (includeModules) {
        if (course.modules && typeof course.modules === 'object') {
          console.log('Raw course modules:', course.modules);
          
          // Convertir l'objet modules en tableau avec normalisation des ressources et évaluations
          course.modules = Object.entries(course.modules).map(([moduleId, moduleData]) => {
            // Normaliser les ressources si elles existent
            let resources = moduleData.resources || [];
            if (typeof resources === 'object' && !Array.isArray(resources)) {
              resources = Object.entries(resources).map(([resId, resource]) => ({
                id: resId,
                ...resource
              }));
            }
            
            // Normaliser les évaluations si elles existent
            let evaluations = moduleData.evaluations || [];
            if (typeof evaluations === 'object' && !Array.isArray(evaluations)) {
              evaluations = Object.entries(evaluations).map(([evalId, evaluation]) => ({
                id: evalId,
                ...evaluation
              }));
            }
            
            return {
              id: moduleId,
              courseId,
              ...moduleData,
              resources: resources,
              evaluations: evaluations
            };
          });

          // Trier les modules par ordre si disponible
          course.modules.sort((a, b) => (a.order || 0) - (b.order || 0));
          
          console.log('Normalized course modules:', course.modules);
        } else {
          course.modules = [];
        }
      }

      setCachedData(cacheKey, course);
      return course;
    }

    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du cours:", error);
    throw error;
  }
};

export default fetchCourseByIdFixed;
