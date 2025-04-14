import { database } from '../../firebaseConfig';
import { ref, get, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';

/**
 * Récupérer les inscriptions d'un apprenant
 * @param {string} apprenantId - ID de l'apprenant
 * @returns {Promise<Array>} - Liste des inscriptions
 */
const fetchInscriptionsByApprenant = async (apprenantId) => {
  try {
    // Utiliser le nouveau chemin standardisé
    const inscriptionsRef = ref(database, `elearning/enrollments/byUser/${apprenantId}`);
    const snapshot = await get(inscriptionsRef);

    if (snapshot.exists()) {
      const inscriptions = snapshot.val();
      // Convertir en tableau avec format standardisé
      const apprenantInscriptions = Object.entries(inscriptions).map(([courseId, data]) => ({
        id: `${apprenantId}_${courseId}`,
        apprenant: apprenantId,
        formation: courseId,
        dateInscription: data.enrolledAt,
        statut: data.status || 'active'
      }));
      return apprenantInscriptions;
    }
    return [];
  } catch (error) {
    
    return [];
  }
};

/**
 * Récupérer les enrollments d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} - Liste des enrollments
 */
const fetchEnrollmentsByUser = async (userId) => {
  try {
    // Utiliser le chemin standardisé
    const enrollmentsRef = ref(database, `elearning/enrollments/byUser/${userId}`);
    const snapshot = await get(enrollmentsRef);
    
    if (snapshot.exists()) {
      const enrollments = snapshot.val();
      return Object.entries(enrollments).map(([courseId, data]) => ({
        userId,
        courseId,
        ...data
      }));
    }
    
    return [];
  } catch (error) {
    
    return [];
  }
};

/**
 * Récupérer les formations d'un formateur
 * @param {string} formateurId - ID du formateur
 * @returns {Promise<Array>} - Liste des formations
 */
const fetchFormationsByFormateur = async (formateurId) => {
  try {
    // Utiliser le nouveau chemin standardisé
    const formationsRef = ref(database, 'elearning/courses');
    const snapshot = await get(formationsRef);

    if (snapshot.exists()) {
      const formations = snapshot.val();
      const formateurFormations = Object.values(formations).filter(
        (formation) => formation.instructorId === formateurId
      );
      return formateurFormations;
    }
    return [];
  } catch (error) {
    
    return [];
  }
};

/**
 * Récupérer les informations complètes d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object|null>} - Informations complètes de l'utilisateur
 */
export const fetchCompleteUserInfo = async (userId) => {
  try {
    

    // Vérifier si userId est valide
    if (!userId) {
      
      return null;
    }

    // Récupérer l'utilisateur depuis le chemin standardisé
    const userRef = ref(database, `elearning/users/${userId}`);
    const userSnapshot = await get(userRef);
    let user = null;

    if (userSnapshot.exists()) {
      user = userSnapshot.val();
      
    } else {
      // Si l'utilisateur n'est pas trouvé dans le chemin standardisé, créer un profil par défaut
      
      
      
      // Créer un utilisateur par défaut basé sur l'authentification Firebase
      const auth = getAuth();
      if (auth.currentUser && auth.currentUser.uid === userId) {
        user = {
          id: userId,
          firstName: auth.currentUser.displayName?.split(' ')[0] || auth.currentUser.displayName || "User",
          lastName: auth.currentUser.displayName?.split(' ')[1] || "",
          email: auth.currentUser.email || "",
          role: "student",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        
        // Enregistrer l'utilisateur par défaut dans la base de données
        try {
          await set(userRef, user);
          
        } catch (saveError) {
          
        }
      } else {
        return null;
      }
    }

    let roleInfo = null;
    let inscriptions = [];
    let enrollments = [];

    // Déterminer le type d'utilisateur (avec valeur par défaut)
    // Dans la nouvelle structure, nous utilisons 'role' au lieu de 'userType'
    const userRole = user.role || user.userType || "student";
    

    // Récupérer les informations spécifiques au rôle
    try {
      // Dans la nouvelle structure, toutes les informations sont dans l'objet utilisateur
      // Nous n'avons plus besoin de chercher dans des collections séparées
      if (userRole === "student" || userRole === "apprenant") {
        // Utiliser les informations déjà présentes dans l'objet utilisateur
        roleInfo = {
          id: userId,
          utilisateurId: userId,
          progression: user.progress || 0,
          avatar: user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        };

        // Récupérer les inscriptions de l'apprenant
        try {
          inscriptions = await fetchInscriptionsByApprenant(userId);
          
        } catch (inscriptionsError) {
          
          inscriptions = [];
        }

        // Récupérer les enrollments de l'apprenant
        try {
          enrollments = await fetchEnrollmentsByUser(userId);
          
        } catch (enrollmentsError) {
          
          enrollments = [];
        }
      } else if (userRole === "instructor" || userRole === "formateur") {
        // Utiliser les informations déjà présentes dans l'objet utilisateur
        roleInfo = {
          id: userId,
          utilisateurId: userId,
          formations: user.courses || [],
          bio: user.bio || "",
          expertise: user.expertise || "",
          avatar: user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        };
        
        // Récupérer les formations du formateur si nécessaire
        if (!user.courses) {
          try {
            roleInfo.formations = await fetchFormationsByFormateur(userId);
          } catch (formationsError) {
            
            roleInfo.formations = [];
          }
        }
      } else if (userRole === "admin" || userRole === "administrateur") {
        // Utiliser les informations déjà présentes dans l'objet utilisateur
        roleInfo = {
          id: userId,
          utilisateurId: userId,
          permissions: user.permissions || "full",
          avatar: user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        };
      } else {
        
        roleInfo = {
          id: userId,
          utilisateurId: userId,
          avatar: user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
        };
      }
    } catch (roleError) {
      
      roleInfo = {
        id: userId,
        utilisateurId: userId,
        progression: 0,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      };
    }

    // Construire et retourner l'objet utilisateur complet
    const completeUserInfo = {
      ...user,
      roleInfo: roleInfo || {
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        progression: 0
      },
      inscriptions: inscriptions || [],
      enrollments: enrollments || []
    };

    
    return completeUserInfo;
  } catch (error) {
    
    // En cas d'erreur, retourner des données de test
    return {
      id: userId,
      firstName: "User",
      lastName: "",
      email: "user@example.com",
      createdAt: new Date().toISOString(),
      role: "student",
      roleInfo: {
        id: userId,
        utilisateurId: userId,
        progression: 0,
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      inscriptions: [],
      enrollments: []
    };
  }
};
