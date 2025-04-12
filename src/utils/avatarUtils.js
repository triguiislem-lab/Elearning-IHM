/**
 * Génère une URL d'avatar basée sur les initiales de l'utilisateur
 * @param {string} firstName - Prénom de l'utilisateur
 * @param {string} lastName - Nom de l'utilisateur
 * @param {string} email - Email de l'utilisateur (utilisé comme fallback)
 * @param {string} role - Rôle de l'utilisateur (pour personnaliser la couleur d'arrière-plan)
 * @returns {string} URL de l'avatar généré
 */
export const generateInitialsAvatar = (firstName, lastName, email, role = '') => {
  // Définir la couleur d'arrière-plan en fonction du rôle
  let bgColor;
  switch (role.toLowerCase()) {
    case 'student':
    case 'apprenant':
      bgColor = '4285F4'; // Bleu pour les étudiants
      break;
    case 'instructor':
    case 'formateur':
      bgColor = '0F9D58'; // Vert pour les instructeurs
      break;
    case 'admin':
      bgColor = 'DB4437'; // Rouge pour les administrateurs
      break;
    default:
      bgColor = '0D8ABC'; // Couleur par défaut
  }

  // Si le prénom et le nom sont disponibles, utiliser les initiales
  if (firstName && lastName) {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=${bgColor}&color=fff&size=256`;
  }

  // Si seulement le prénom est disponible
  if (firstName) {
    const initial = firstName.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initial}&background=${bgColor}&color=fff&size=256`;
  }

  // Si seulement le nom est disponible
  if (lastName) {
    const initial = lastName.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initial}&background=${bgColor}&color=fff&size=256`;
  }

  // Si l'email est disponible, utiliser la première lettre de l'email
  if (email) {
    const initial = email.charAt(0).toUpperCase();
    return `https://ui-avatars.com/api/?name=${initial}&background=${bgColor}&color=fff&size=256`;
  }

  // Fallback: utiliser un avatar générique
  return `https://ui-avatars.com/api/?name=U&background=${bgColor}&color=fff&size=256`;
};

/**
 * Détermine l'avatar à utiliser en fonction des informations de l'utilisateur
 * @param {Object} userInfo - Informations de l'utilisateur
 * @returns {string} URL de l'avatar à utiliser
 */
export const getAvatarUrl = (userInfo) => {
  if (!userInfo) {
    return `https://ui-avatars.com/api/?name=U&background=0D8ABC&color=fff&size=256`;
  }

  // Essayer toutes les sources possibles d'avatars personnalisés
  const customAvatar = 
    (userInfo.photoURL) || 
    (userInfo.roleInfo?.avatar) || 
    (userInfo.avatar) || 
    (userInfo.profilePicture);

  // Vérifier que l'URL de l'avatar n'est pas l'URL par défaut
  const defaultUrls = [
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    "https://api.dicebear.com/7.x/avataaars/svg",
    "https://ui-avatars.com/api"
  ];

  const isDefaultUrl = customAvatar && defaultUrls.some(url => customAvatar.includes(url));

  // Si un avatar personnalisé valide est trouvé, l'utiliser
  if (customAvatar && !isDefaultUrl) {
    return customAvatar;
  }

  // Déterminer les noms et rôle
  const firstName = userInfo.firstName || userInfo.prenom || '';
  const lastName = userInfo.lastName || userInfo.nom || '';
  const email = userInfo.email || '';
  const role = userInfo.role || userInfo.userType || '';

  // Générer un avatar basé sur les initiales
  return generateInitialsAvatar(firstName, lastName, email, role);
};
