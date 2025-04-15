/**
 * Constantes pour les chemins Firebase
 * Centralise tous les chemins pour éviter les incohérences
 * UTILISE EXCLUSIVEMENT LE CHEMIN elearning/courses/[courseId]/modules
 */

// Préfixe principal pour toutes les données
export const ROOT_PATH = 'elearning';

// Chemins pour les utilisateurs
export const USERS_PATH = `${ROOT_PATH}/users`;
export const USER_PATH = (userId) => `${USERS_PATH}/${userId}`;
export const USER_COURSES_PATH = (userId) => `${USER_PATH(userId)}/courses`;

// Chemins pour les cours - CHEMIN EXCLUSIF
export const COURSES_PATH = `${ROOT_PATH}/courses`;
export const COURSE_PATH = (courseId) => `${COURSES_PATH}/${courseId}`;
export const COURSE_MODULES_PATH = (courseId) => `${COURSE_PATH(courseId)}/modules`;
export const MODULE_PATH = (courseId, moduleId) => `${COURSE_MODULES_PATH(courseId)}/${moduleId}`;

// Chemins pour les inscriptions
export const ENROLLMENTS_PATH = `${ROOT_PATH}/enrollments`;
export const ENROLLMENTS_BY_USER_PATH = `${ENROLLMENTS_PATH}/byUser`;
export const ENROLLMENTS_BY_COURSE_PATH = `${ENROLLMENTS_PATH}/byCourse`;
export const USER_ENROLLMENTS_PATH = (userId) => `${ENROLLMENTS_BY_USER_PATH}/${userId}`;
export const COURSE_ENROLLMENTS_PATH = (courseId) => `${ENROLLMENTS_BY_COURSE_PATH}/${courseId}`;

// Chemins pour la progression
export const PROGRESS_PATH = `${ROOT_PATH}/progress`;
export const USER_PROGRESS_PATH = (userId) => `${PROGRESS_PATH}/${userId}`;
export const USER_COURSE_PROGRESS_PATH = (userId, courseId) => `${USER_PROGRESS_PATH(userId)}/${courseId}`;
export const MODULE_PROGRESS_PATH = (userId, courseId, moduleId) => `${USER_COURSE_PROGRESS_PATH(userId, courseId)}/${moduleId}`;
export const RESOURCE_PROGRESS_PATH = (userId, courseId, moduleId, resourceId) =>
  `${MODULE_PROGRESS_PATH(userId, courseId, moduleId)}/resources/${resourceId}`;

// Chemins pour les évaluations - UTILISE LE CHEMIN EXCLUSIF
export const MODULE_EVALUATIONS_PATH = (courseId, moduleId) => `${MODULE_PATH(courseId, moduleId)}/evaluations`;
export const USER_MODULE_EVALUATIONS_PATH = (courseId, moduleId, userId) => `${MODULE_EVALUATIONS_PATH(courseId, moduleId)}/${userId}`;
export const USER_MODULE_EVALUATION_ATTEMPTS_PATH = (courseId, moduleId, userId) => `${USER_MODULE_EVALUATIONS_PATH(courseId, moduleId, userId)}/attempts`;

// Chemins pour les spécialités et disciplines
export const SPECIALTIES_PATH = `${ROOT_PATH}/specialites`;
export const DISCIPLINES_PATH = `${ROOT_PATH}/disciplines`;

// Chemins pour les messages
export const MESSAGES_PATH = `${ROOT_PATH}/messages`;
export const USER_MESSAGES_PATH = (userId) => `${MESSAGES_PATH}/${userId}`;

// Chemins pour les statistiques
export const STATS_PATH = `${ROOT_PATH}/stats`;
export const COURSE_STATS_PATH = (courseId) => `${STATS_PATH}/courses/${courseId}`;

// Chemins legacy (à utiliser uniquement pour la migration)
export const LEGACY_ROOT_PATH = 'Elearning';
export const LEGACY_COURSE_PATH = (courseId) => `${LEGACY_ROOT_PATH}/Cours/${courseId}`;
export const LEGACY_MODULES_PATH = (courseId) => `${LEGACY_COURSE_PATH(courseId)}/modules`;
export const LEGACY_MODULE_PATH = (courseId, moduleId) => `${LEGACY_MODULES_PATH(courseId)}/${moduleId}`;
export const LEGACY_EVALUATIONS_PATH = (moduleId) => `${LEGACY_ROOT_PATH}/Evaluations/${moduleId}`;
export const LEGACY_RESOURCES_PATH = (courseId, moduleId) => `${LEGACY_ROOT_PATH}/Resources/${courseId}/${moduleId}`;
