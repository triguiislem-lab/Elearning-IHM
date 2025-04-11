import { initializeDatabase } from './firebaseUtils';

/**
 * Initialise l'application
 * - Migre les données Firebase si nécessaire
 * - Configure les écouteurs en temps réel
 * - Initialise les caches
 */
export const initializeApp = async () => {
  console.log('Initialisation de l\'application...');
  
  try {
    // Initialiser la base de données et migrer les données si nécessaire
    await initializeDatabase();
    
    console.log('Initialisation terminée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'application:', error);
    return false;
  }
};

/**
 * Vérifie si l'utilisateur a les autorisations nécessaires
 * @param {Object} user - Objet utilisateur
 * @param {string} role - Rôle requis ('admin', 'instructor', 'student')
 * @param {Object} additionalChecks - Vérifications supplémentaires (courseId, moduleId, etc.)
 * @returns {boolean} Vrai si l'utilisateur a les autorisations
 */
export const checkUserPermissions = (user, role, additionalChecks = {}) => {
  if (!user) return false;
  
  // Vérifier le rôle de base
  const hasRequiredRole = 
    (role === 'admin' && (user.role === 'admin' || user.userType === 'administrateur')) ||
    (role === 'instructor' && (user.role === 'instructor' || user.userType === 'formateur')) ||
    (role === 'student' && (user.role === 'student' || user.userType === 'apprenant'));
  
  if (!hasRequiredRole) return false;
  
  // Vérifications supplémentaires spécifiques au contexte
  if (additionalChecks.courseId) {
    // Vérifications spécifiques au cours
    if (role === 'instructor' && additionalChecks.ownCourseOnly) {
      // Vérifier si l'instructeur est propriétaire du cours
      return user.courses && user.courses[additionalChecks.courseId];
    }
    
    if (role === 'student' && additionalChecks.enrolledOnly) {
      // Vérifier si l'étudiant est inscrit au cours
      return user.enrollments && user.enrollments[additionalChecks.courseId];
    }
  }
  
  return true;
};

/**
 * Affiche une notification à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification ('success', 'error', 'warning', 'info')
 * @param {number} duration - Durée d'affichage en millisecondes
 */
export const showNotification = (message, type = 'info', duration = 3000) => {
  // Créer un élément de notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Ajouter la notification au DOM
  const container = document.querySelector('.notification-container') || document.body;
  container.appendChild(notification);
  
  // Afficher la notification avec une animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Supprimer la notification après la durée spécifiée
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
};

export default {
  initializeApp,
  checkUserPermissions,
  showNotification
};
