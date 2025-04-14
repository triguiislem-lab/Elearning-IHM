import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { getCachedData, setCachedData } from '../utils/cacheUtils';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to normalize user role
  const normalizeRole = (userData) => {
    if (!userData) return null;

    if (userData.role) {
      return userData.role.toLowerCase();
    }
    if (userData.userType) {
      const roleMap = {
        'formateur': 'instructor',
        'administrateur': 'admin',
        'etudiant': 'student',
        'instructor': 'instructor',
        'admin': 'admin',
        'student': 'student'
      };
      return roleMap[userData.userType.toLowerCase()] || null;
    }
    return null;
  };

  // Function to fetch user info with improved error handling
  const fetchUserInfo = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setUserRole(null);
      return;
    }

    try {
      const cacheKey = `user_info_${firebaseUser.uid}`;
      const cachedData = getCachedData(cacheKey);

      if (cachedData && cachedData.normalizedRole) {
        setUser(cachedData);
        setUserRole(cachedData.normalizedRole);
        return;
      }

      const database = getDatabase();

      // Check standardized path first (lowercase)
      const standardUserRef = ref(database, `elearning/users/${firebaseUser.uid}`);
      const standardSnapshot = await get(standardUserRef);

      if (standardSnapshot.exists()) {
        // User found in standardized path
        const userData = standardSnapshot.val();
        const normalizedRole = normalizeRole(userData);

        if (!normalizedRole) {
          throw new Error('Invalid user role');
        }

        const userInfo = {
          ...firebaseUser,
          ...userData,
          normalizedRole,
          id: firebaseUser.uid,
          dataPath: 'standardized' // Mark as coming from standardized path
        };

        setCachedData(cacheKey, userInfo);
        setUser(userInfo);
        setUserRole(normalizedRole);
        return; // Exit early if found in standardized path
      }

      // Check legacy paths if not found in standardized path
      let userData = null;
      let dataSource = null;

      // Check in Elearning/Administrateurs
      const adminRef = ref(database, `Elearning/Administrateurs/${firebaseUser.uid}`);
      const adminSnapshot = await get(adminRef);

      if (adminSnapshot.exists()) {
        userData = adminSnapshot.val();
        userData.role = 'admin'; // Ensure role is set
        dataSource = 'legacy_admin';
      } else {
        // Check in Elearning/Formateurs
        const instructorRef = ref(database, `Elearning/Formateurs/${firebaseUser.uid}`);
        const instructorSnapshot = await get(instructorRef);

        if (instructorSnapshot.exists()) {
          userData = instructorSnapshot.val();
          userData.role = 'instructor'; // Ensure role is set
          dataSource = 'legacy_instructor';
        } else {
          // Check in Elearning/Apprenants
          const studentRef = ref(database, `Elearning/Apprenants/${firebaseUser.uid}`);
          const studentSnapshot = await get(studentRef);

          if (studentSnapshot.exists()) {
            userData = studentSnapshot.val();
            userData.role = 'student'; // Ensure role is set
            dataSource = 'legacy_student';
          } else {
            // Check in Elearning/Utilisateurs
            const userRef = ref(database, `Elearning/Utilisateurs/${firebaseUser.uid}`);
            const userSnapshot = await get(userRef);

            if (userSnapshot.exists()) {
              userData = userSnapshot.val();
              dataSource = 'legacy_user';
            }
          }
        }
      }

      if (userData) {
        // User found in one of the legacy paths
        const normalizedRole = normalizeRole(userData);

        const userInfo = {
          ...firebaseUser,
          ...userData,
          normalizedRole: normalizedRole || 'student',
          id: firebaseUser.uid,
          dataPath: dataSource // Mark the source of the data
        };

        setCachedData(cacheKey, userInfo);
        setUser(userInfo);
        setUserRole(normalizedRole || 'student');

        // Log that user was found in legacy path
        console.log(`User found in legacy path: ${dataSource}. Consider running database standardization.`);
      } else {
        // User not found in any path, create default profile
        const defaultUser = {
          ...firebaseUser,
          id: firebaseUser.uid,
          role: 'student',
          normalizedRole: 'student',
          firstName: '',
          lastName: '',
          email: firebaseUser.email,
          dataPath: 'default'
        };

        setUser(defaultUser);
        setUserRole('student');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError(error);
      setUser(null);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        await fetchUserInfo(firebaseUser);
      } catch (error) {
        console.error('Auth state change error:', error);
        setError(error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserInfo]);

  const getDashboardPath = useCallback(() => {
    if (!userRole) return '/login';

    switch (userRole.toLowerCase()) {
      case 'admin':
        return '/admin/dashboard';
      case 'instructor':
        return '/instructor/courses';
      case 'student':
        return '/student/enrollments';
      default:
        return '/';
    }
  }, [userRole]);

  return {
    user,
    userRole,
    loading,
    error,
    getDashboardPath,
    isAuthenticated: !!user && !!userRole,
    isAdmin: userRole === 'admin',
    isInstructor: userRole === 'instructor',
    isStudent: userRole === 'student'
  };
};