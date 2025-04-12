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
      const userRef = ref(database, `elearning/users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const normalizedRole = normalizeRole(userData);

        if (!normalizedRole) {
          throw new Error('Invalid user role');
        }

        const userInfo = {
          ...firebaseUser,
          ...userData,
          normalizedRole,
          id: firebaseUser.uid
        };

        setCachedData(cacheKey, userInfo);
        setUser(userInfo);
        setUserRole(normalizedRole);
      } else {
        // Create default user profile with proper role
        const defaultUser = {
          ...firebaseUser,
          id: firebaseUser.uid,
          role: 'student',
          normalizedRole: 'student',
          firstName: '',
          lastName: '',
          email: firebaseUser.email
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