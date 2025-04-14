import { database } from '../../firebaseConfig';
import { ref, get, set, push, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getCachedData, setCachedData } from './cacheUtils';
import { archiveEntity } from './databaseUtils';

// Ajouter un nouveau module à un cours
export const addModuleToCourse = async (courseId, moduleData) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur est le formateur du cours
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Cours non trouvé');
    }

    const courseData = courseSnapshot.val();
    const instructorId = courseData.formateur || courseData.instructorId;

    if (instructorId !== auth.currentUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce cours');
    }

    // Préparer les données du module
    const moduleId = Date.now().toString(); // Générer un ID unique
    const newModule = {
      ...moduleData,
      id: moduleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      order: moduleData.order || 0
    };

    // Récupérer les modules existants
    let modules = [];
    if (courseData.modules) {
      if (Array.isArray(courseData.modules)) {
        modules = [...courseData.modules];
      } else {
        // Si modules est un objet, le convertir en tableau
        modules = Object.values(courseData.modules);
      }
    }

    // Ajouter le nouveau module
    modules.push(newModule);

    // Mettre à jour le cours avec le nouveau module
    await update(courseRef, { modules });
    console.log(`Module ${moduleId} added to course ${courseId}`);

    // Initialiser la structure d'évaluation pour ce module
    const evaluationsRef = ref(database, `elearning/evaluations/${moduleId}`);
    await set(evaluationsRef, {
      moduleId,
      courseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log(`Evaluation structure initialized for module ${moduleId}`);

    return newModule;
  } catch (error) {
    console.error("Error adding module to course:", error);
    throw error;
  }
};

// Mettre à jour un module existant
export const updateModule = async (courseId, moduleId, moduleData) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur est le formateur du cours
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Cours non trouvé');
    }

    const courseData = courseSnapshot.val();
    const instructorId = courseData.formateur || courseData.instructorId;

    if (instructorId !== auth.currentUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce cours');
    }

    // Récupérer les modules existants
    let modules = [];
    if (courseData.modules) {
      if (Array.isArray(courseData.modules)) {
        modules = [...courseData.modules];
      } else {
        modules = Object.values(courseData.modules);
      }
    }

    // Trouver l'index du module à mettre à jour
    const moduleIndex = modules.findIndex(module => module.id === moduleId);

    if (moduleIndex === -1) {
      throw new Error('Module non trouvé');
    }

    // Mettre à jour le module
    modules[moduleIndex] = {
      ...modules[moduleIndex],
      ...moduleData,
      updatedAt: new Date().toISOString()
    };

    // Mettre à jour le cours avec le module modifié
    await update(courseRef, { modules });

    return modules[moduleIndex];
  } catch (error) {

    throw error;
  }
};

// Supprimer un module
export const deleteModule = async (courseId, moduleId) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur est le formateur du cours
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Cours non trouvé');
    }

    const courseData = courseSnapshot.val();
    const instructorId = courseData.formateur || courseData.instructorId;

    if (instructorId !== auth.currentUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce cours');
    }

    // Récupérer les modules existants
    let modules = [];
    if (courseData.modules) {
      if (Array.isArray(courseData.modules)) {
        modules = [...courseData.modules];
      } else {
        modules = Object.values(courseData.modules);
      }
    }

    // Filtrer le module à supprimer
    const updatedModules = modules.filter(module => module.id !== moduleId);

    if (modules.length === updatedModules.length) {
      throw new Error('Module non trouvé');
    }

    // Mettre à jour le cours sans le module supprimé
    await update(courseRef, { modules: updatedModules });

    return true;
  } catch (error) {

    throw error;
  }
};

// Ajouter une évaluation à un module
export const addEvaluationToModule = async (courseId, moduleId, evaluationData) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur est le formateur du cours
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Cours non trouvé');
    }

    const courseData = courseSnapshot.val();
    const instructorId = courseData.formateur || courseData.instructorId;

    if (instructorId !== auth.currentUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce cours');
    }

    // Récupérer les modules existants
    let modules = [];
    if (courseData.modules) {
      if (Array.isArray(courseData.modules)) {
        modules = [...courseData.modules];
      } else {
        modules = Object.values(courseData.modules);
      }
    }

    // Trouver l'index du module
    const moduleIndex = modules.findIndex(module => module.id === moduleId);

    if (moduleIndex === -1) {
      throw new Error('Module non trouvé');
    }

    // Préparer les données de l'évaluation
    const evalId = Date.now().toString(); // Générer un ID unique
    const newEvaluation = {
      ...evaluationData,
      id: evalId,
      moduleId,
      courseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Ajouter l'évaluation au module
    if (!modules[moduleIndex].evaluations) {
      modules[moduleIndex].evaluations = [];
    }

    modules[moduleIndex].evaluations.push(newEvaluation);

    // Mettre à jour le cours avec le module modifié
    await update(courseRef, { modules });
    console.log(`Evaluation ${evalId} added to module ${moduleId} in course ${courseId}`);

    // Ajouter l'évaluation dans le chemin standardisé
    const evaluationRef = ref(database, `elearning/evaluations/${moduleId}/${evalId}`);
    await set(evaluationRef, newEvaluation);
    console.log(`Evaluation ${evalId} saved to standardized path`);

    return newEvaluation;
  } catch (error) {
    console.error("Error adding evaluation to module:", error);
    throw error;
  }
};

// Mettre à jour une évaluation
export const updateEvaluation = async (courseId, moduleId, evaluationId, evaluationData) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur est le formateur du cours
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Cours non trouvé');
    }

    const courseData = courseSnapshot.val();
    const instructorId = courseData.formateur || courseData.instructorId;

    if (instructorId !== auth.currentUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce cours');
    }

    // Récupérer les modules existants
    let modules = [];
    if (courseData.modules) {
      if (Array.isArray(courseData.modules)) {
        modules = [...courseData.modules];
      } else {
        modules = Object.values(courseData.modules);
      }
    }

    // Trouver l'index du module
    const moduleIndex = modules.findIndex(module => module.id === moduleId);

    if (moduleIndex === -1) {
      throw new Error('Module non trouvé');
    }

    // Vérifier si le module a des évaluations
    if (!modules[moduleIndex].evaluations || !Array.isArray(modules[moduleIndex].evaluations)) {
      throw new Error('Aucune évaluation trouvée dans ce module');
    }

    // Trouver l'index de l'évaluation
    const evaluationIndex = modules[moduleIndex].evaluations.findIndex(eval => eval.id === evaluationId);

    if (evaluationIndex === -1) {
      throw new Error('Évaluation non trouvée');
    }

    // Mettre à jour l'évaluation
    modules[moduleIndex].evaluations[evaluationIndex] = {
      ...modules[moduleIndex].evaluations[evaluationIndex],
      ...evaluationData,
      updatedAt: new Date().toISOString()
    };

    // Mettre à jour le cours avec le module modifié
    await update(courseRef, { modules });

    return modules[moduleIndex].evaluations[evaluationIndex];
  } catch (error) {

    throw error;
  }
};

// Supprimer une évaluation
export const deleteEvaluation = async (courseId, moduleId, evaluationId) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur est le formateur du cours
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Cours non trouvé');
    }

    const courseData = courseSnapshot.val();
    const instructorId = courseData.formateur || courseData.instructorId;

    if (instructorId !== auth.currentUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce cours');
    }

    // Récupérer les modules existants
    let modules = [];
    if (courseData.modules) {
      if (Array.isArray(courseData.modules)) {
        modules = [...courseData.modules];
      } else {
        modules = Object.values(courseData.modules);
      }
    }

    // Trouver l'index du module
    const moduleIndex = modules.findIndex(module => module.id === moduleId);

    if (moduleIndex === -1) {
      throw new Error('Module non trouvé');
    }

    // Vérifier si le module a des évaluations
    if (!modules[moduleIndex].evaluations || !Array.isArray(modules[moduleIndex].evaluations)) {
      throw new Error('Aucune évaluation trouvée dans ce module');
    }

    // Filtrer l'évaluation à supprimer
    const updatedEvaluations = modules[moduleIndex].evaluations.filter(eval => eval.id !== evaluationId);

    if (modules[moduleIndex].evaluations.length === updatedEvaluations.length) {
      throw new Error('Évaluation non trouvée');
    }

    // Mettre à jour le module avec les évaluations filtrées
    modules[moduleIndex].evaluations = updatedEvaluations;

    // Mettre à jour le cours avec le module modifié
    await update(courseRef, { modules });

    return true;
  } catch (error) {

    throw error;
  }
};

// Récupérer les cours d'un formateur avec mise en cache
export const fetchInstructorCourses = async (instructorId) => {
  try {
    console.log("Début de fetchInstructorCourses pour l'instructeur:", instructorId);

    // Récupérer les spécialités et disciplines en utilisant les fonctions qui gèrent les chemins legacy
    const [specialites, disciplines] = await Promise.all([
      fetchSpecialitesFromDatabase(),
      fetchDisciplinesFromDatabase()
    ]);

    console.log("Spécialités récupérées:", specialites);
    console.log("Disciplines récupérées:", disciplines);

    // Vérifier d'abord dans le chemin des utilisateurs
    const instructorCoursesRef = ref(database, `elearning/users/${instructorId}/courses`);
    const snapshot = await get(instructorCoursesRef);

    if (snapshot.exists()) {
      console.log("Cours trouvés dans le chemin des utilisateurs");
      const coursesData = snapshot.val();
      const coursesWithDetails = [];

      // Récupérer les détails complets de chaque cours
      for (const courseId in coursesData) {
        try {
          const courseDetails = await fetchCourseById(courseId);
          const enrollments = await fetchCourseEnrollments(courseId);

          console.log("Détails du cours:", courseDetails);
          console.log("ID de la spécialité:", courseDetails.specialiteId);
          console.log("ID de la discipline:", courseDetails.disciplineId);

          // Trouver la spécialité et la discipline correspondantes
          const specialite = specialites.find(s => s.id === courseDetails.specialiteId);
          const discipline = disciplines.find(d => d.id === courseDetails.disciplineId);

          console.log("Spécialité trouvée:", specialite);
          console.log("Discipline trouvée:", discipline);

          coursesWithDetails.push({
            ...courseDetails,
            students: enrollments.length,
            enrollments: enrollments,
            specialiteName: specialite?.name || "Non spécifié",
            disciplineName: discipline?.name || "Non spécifié"
          });
        } catch (error) {
          console.error(`Erreur lors de la récupération des détails du cours ${courseId}:`, error);
          coursesWithDetails.push({
            id: courseId,
            title: coursesData[courseId].title || "Cours sans titre",
            students: 0,
            enrollments: [],
            specialiteName: "Non spécifié",
            disciplineName: "Non spécifié"
          });
        }
      }

      // Trier les cours par date de création (du plus récent au plus ancien)
      const sortedCourses = coursesWithDetails.sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      console.log(`Retour de ${sortedCourses.length} cours pour l'instructeur ${instructorId}`);
      return sortedCourses;
    }

    // Si aucun cours n'est trouvé dans le chemin des utilisateurs, vérifier dans le chemin principal
    console.log("Aucun cours trouvé dans le chemin des utilisateurs, vérification dans le chemin principal");
    const allCoursesRef = ref(database, 'elearning/courses');
    const allCoursesSnapshot = await get(allCoursesRef);

    if (allCoursesSnapshot.exists()) {
      const allCourses = allCoursesSnapshot.val();
      const instructorCourses = [];

      for (const courseId in allCourses) {
        const course = allCourses[courseId];
        if (course.formateur === instructorId || course.instructorId === instructorId) {
          try {
            const enrollments = await fetchCourseEnrollments(courseId);

            console.log("Détails du cours:", course);
            console.log("ID de la spécialité:", course.specialiteId);
            console.log("ID de la discipline:", course.disciplineId);

            // Trouver la spécialité et la discipline correspondantes
            const specialite = specialites.find(s => s.id === course.specialiteId);
            const discipline = disciplines.find(d => d.id === course.disciplineId);

            console.log("Spécialité trouvée:", specialite);
            console.log("Discipline trouvée:", discipline);

            instructorCourses.push({
              id: courseId,
              ...course,
              students: enrollments.length,
              enrollments: enrollments,
              specialiteName: specialite?.name || "Non spécifié",
              disciplineName: discipline?.name || "Non spécifié"
            });
          } catch (error) {
            console.error(`Erreur lors de la récupération des inscriptions du cours ${courseId}:`, error);
            instructorCourses.push({
              id: courseId,
              ...course,
              students: 0,
              enrollments: [],
              specialiteName: "Non spécifié",
              disciplineName: "Non spécifié"
            });
          }
        }
      }

      // Trier les cours par date de création
      const sortedCourses = instructorCourses.sort((a, b) => {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

      console.log(`Retour de ${sortedCourses.length} cours pour l'instructeur ${instructorId}`);
      return sortedCourses;
    }

    console.log("Aucun cours trouvé pour l'instructeur");
    return [];
  } catch (error) {
    console.error("Erreur lors de la récupération des cours de l'instructeur:", error);
    return [];
  }
};

// Ajouter une ressource à un module
export const addResourceToModule = async (courseId, moduleId, resourceData) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur est le formateur du cours
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Cours non trouvé');
    }

    const courseData = courseSnapshot.val();
    const instructorId = courseData.formateur || courseData.instructorId;

    if (instructorId !== auth.currentUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce cours');
    }

    // Récupérer les modules existants
    let modules = [];
    if (courseData.modules) {
      if (Array.isArray(courseData.modules)) {
        modules = [...courseData.modules];
      } else {
        modules = Object.values(courseData.modules);
      }
    }

    // Trouver l'index du module
    const moduleIndex = modules.findIndex(module => module.id === moduleId);

    if (moduleIndex === -1) {
      throw new Error('Module non trouvé');
    }

    // Préparer les données de la ressource
    const newResource = {
      ...resourceData,
      id: Date.now().toString(), // Générer un ID unique
      createdAt: new Date().toISOString()
    };

    // Ajouter la ressource au module
    if (!modules[moduleIndex].resources) {
      modules[moduleIndex].resources = [];
    }

    modules[moduleIndex].resources.push(newResource);

    // Mettre à jour le cours avec le module modifié
    await update(courseRef, { modules });

    return newResource;
  } catch (error) {

    throw error;
  }
};

// Supprimer une ressource
export const deleteResource = async (courseId, moduleId, resourceId) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur est le formateur du cours
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Cours non trouvé');
    }

    const courseData = courseSnapshot.val();
    const instructorId = courseData.formateur || courseData.instructorId;

    if (instructorId !== auth.currentUser.uid) {
      throw new Error('Vous n\'êtes pas autorisé à modifier ce cours');
    }

    // Récupérer les modules existants
    let modules = [];
    if (courseData.modules) {
      if (Array.isArray(courseData.modules)) {
        modules = [...courseData.modules];
      } else {
        modules = Object.values(courseData.modules);
      }
    }

    // Trouver l'index du module
    const moduleIndex = modules.findIndex(module => module.id === moduleId);

    if (moduleIndex === -1) {
      throw new Error('Module non trouvé');
    }

    // Vérifier si le module a des ressources
    if (!modules[moduleIndex].resources || !Array.isArray(modules[moduleIndex].resources)) {
      throw new Error('Aucune ressource trouvée dans ce module');
    }

    // Filtrer la ressource à supprimer
    const updatedResources = modules[moduleIndex].resources.filter(resource => resource.id !== resourceId);

    if (modules[moduleIndex].resources.length === updatedResources.length) {
      throw new Error('Ressource non trouvée');
    }

    // Mettre à jour le module avec les ressources filtrées
    modules[moduleIndex].resources = updatedResources;

    // Mettre à jour le cours avec le module modifié
    await update(courseRef, { modules });

    return true;
  } catch (error) {

    throw error;
  }
};

// Archiver un cours au lieu de le supprimer
export const archiveCourse = async (courseId) => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur est le formateur du cours
    const courseRef = ref(database, `elearning/courses/${courseId}`);
    const courseSnapshot = await get(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Cours non trouvé');
    }

    const courseData = courseSnapshot.val();
    const instructorId = courseData.formateur || courseData.instructorId;

    if (instructorId !== auth.currentUser.uid) {
      throw new Error('Vous n\'\u00eates pas autorisé à modifier ce cours');
    }

    // Utiliser la fonction archiveEntity pour archiver le cours
    const success = await archiveEntity('courses', courseId, {
      archivedBy: auth.currentUser.uid,
      archivedReason: 'Archived by instructor',
      status: 'archived'
    });

    if (!success) {
      throw new Error('Erreur lors de l\'archivage du cours');
    }

    return true;
  } catch (error) {
    console.error('Error archiving course:', error);
    throw error;
  }
};

// Fonction dépréciée, à remplacer par archiveCourse
export const deleteCourse = async (courseId) => {
  console.warn('deleteCourse est déprécié. Utilisez archiveCourse à la place.');
  return archiveCourse(courseId);
};