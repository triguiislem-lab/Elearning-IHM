import { database } from '../../firebaseConfig';
import { ref, get, set, remove } from 'firebase/database';

/**
 * Utility for migrating the database to the standardized schema
 * This follows the schema defined in /docs/DATABASE_SCHEMA.md
 */

/**
 * Main migration function to standardize the database structure
 */
export const migrateDatabase = async () => {
  try {
    
    
    // 1. Migrate users
    await migrateUsers();
    
    // 2. Migrate courses
    await migrateCourses();
    
    // 3. Migrate modules
    await migrateModules();
    
    // 4. Migrate evaluations
    await migrateEvaluations();
    
    // 5. Migrate enrollments
    await migrateEnrollments();
    
    // 6. Migrate progress data
    await migrateProgress();
    
    // 7. Migrate feedback
    await migrateFeedback();
    
    
    return { success: true, message: "Database migration completed successfully" };
  } catch (error) {
    
    return { success: false, message: `Migration error: ${error.message}` };
  }
};

/**
 * Migrate user data to the standardized structure
 */
const migrateUsers = async () => {
  
  
  try {
    // Create the new users path if it doesn't exist
    const newUsersRef = ref(database, '/elearning/users');
    await set(newUsersRef, {});
    
    // Paths to check for user data
    const userPaths = [
      '/users',
      '/Elearning/Utilisateurs',
      '/Elearning/Apprenants',
      '/Elearning/Formateurs',
      '/Elearning/Administrateurs'
    ];
    
    // Process each path
    for (const path of userPaths) {
      const usersRef = ref(database, path);
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        
        // Process each user
        for (const [userId, userData] of Object.entries(users)) {
          // Skip if not a valid user object
          if (!userData || typeof userData !== 'object') continue;
          
          // Determine user type
          let userType = userData.userType || 'student';
          if (path.includes('Formateurs')) userType = 'instructor';
          if (path.includes('Administrateurs')) userType = 'admin';
          if (path.includes('Apprenants')) userType = 'student';
          
          // Create standardized user object
          const standardizedUser = {
            id: userId,
            firstName: userData.prenom || userData.firstName || (userData.fullName ? userData.fullName.split(' ')[0] : ''),
            lastName: userData.nom || userData.lastName || (userData.fullName ? userData.fullName.split(' ')[1] || '' : ''),
            email: userData.email || '',
            userType: userType,
            createdAt: userData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            avatar: userData.avatar || userData.roleInfo?.avatar || 'https://example.com/default-avatar.jpg'
          };
          
          // Save to new path
          const newUserRef = ref(database, `/elearning/users/${userId}`);
          await set(newUserRef, standardizedUser);
          
          // Create role-specific entry
          if (userType === 'student') {
            const studentRef = ref(database, `/elearning/students/${userId}`);
            await set(studentRef, {
              userId: userId,
              progress: userData.progression || userData.roleInfo?.progression || 0,
              enrollments: []
            });
          } else if (userType === 'instructor') {
            const instructorRef = ref(database, `/elearning/instructors/${userId}`);
            await set(instructorRef, {
              userId: userId,
              bio: userData.bio || '',
              expertise: userData.expertise || '',
              courses: []
            });
          } else if (userType === 'admin') {
            const adminRef = ref(database, `/elearning/admins/${userId}`);
            await set(adminRef, {
              userId: userId,
              permissions: 'full'
            });
          }
        }
      }
    }
    
    
  } catch (error) {
    
    throw error;
  }
};

/**
 * Migrate course data to the standardized structure
 */
const migrateCourses = async () => {
  
  
  try {
    // Create the new courses path if it doesn't exist
    const newCoursesRef = ref(database, '/elearning/courses');
    await set(newCoursesRef, {});
    
    // Paths to check for course data
    const coursePaths = [
      '/Elearning/Cours',
      '/Elearning/Formations',
      '/courses',
      '/Formations',
      '/Formations/Formations'
    ];
    
    // Process each path
    for (const path of coursePaths) {
      const coursesRef = ref(database, path);
      const snapshot = await get(coursesRef);
      
      if (snapshot.exists()) {
        const courses = snapshot.val();
        
        // Process each course
        for (const [courseId, courseData] of Object.entries(courses)) {
          // Skip if not a valid course object
          if (!courseData || typeof courseData !== 'object') continue;
          
          // Create standardized course object
          const standardizedCourse = {
            id: courseId,
            title: courseData.title || courseData.titre || `Course ${courseId}`,
            description: courseData.description || '',
            content: courseData.contenu || courseData.content || '',
            duration: courseData.duration || courseData.duree || '0',
            image: courseData.image || 'https://example.com/default-course.jpg',
            instructorId: courseData.instructorId || courseData.formateur || '',
            category: courseData.category || '',
            level: courseData.level || 'beginner',
            price: courseData.price || 0,
            rating: courseData.rating || 0,
            totalRatings: courseData.totalRatings || 0,
            createdAt: courseData.createdAt || new Date().toISOString(),
            updatedAt: courseData.updatedAt || new Date().toISOString(),
            modules: {}
          };
          
          // Handle modules if they exist
          if (courseData.modules && typeof courseData.modules === 'object') {
            for (const moduleId of Object.keys(courseData.modules)) {
              standardizedCourse.modules[moduleId] = true;
            }
          }
          
          // Save to new path
          const newCourseRef = ref(database, `/elearning/courses/${courseId}`);
          await set(newCourseRef, standardizedCourse);
          
          // Update instructor's courses list if instructor exists
          if (standardizedCourse.instructorId) {
            const instructorRef = ref(database, `/elearning/instructors/${standardizedCourse.instructorId}`);
            const instructorSnapshot = await get(instructorRef);
            
            if (instructorSnapshot.exists()) {
              const instructorData = instructorSnapshot.val();
              const courses = instructorData.courses || [];
              
              if (!courses.includes(courseId)) {
                courses.push(courseId);
                await set(ref(database, `/elearning/instructors/${standardizedCourse.instructorId}/courses`), courses);
              }
            }
          }
        }
      }
    }
    
    
  } catch (error) {
    
    throw error;
  }
};

/**
 * Migrate module data to the standardized structure
 */
const migrateModules = async () => {
  
  
  try {
    // Create the new modules path if it doesn't exist
    const newModulesRef = ref(database, '/elearning/modules');
    await set(newModulesRef, {});
    
    // Paths to check for module data
    const modulePaths = [
      '/Elearning/Modules',
      '/Elearning/Cours'  // Some courses have modules nested inside
    ];
    
    // First, check standalone modules
    const modulesRef = ref(database, '/Elearning/Modules');
    const modulesSnapshot = await get(modulesRef);
    
    if (modulesSnapshot.exists()) {
      const modules = modulesSnapshot.val();
      
      // Process each module
      for (const [moduleId, moduleData] of Object.entries(modules)) {
        // Skip if not a valid module object
        if (!moduleData || typeof moduleData !== 'object') continue;
        
        await migrateModuleData(moduleId, moduleData);
      }
    }
    
    // Then check for modules inside courses
    const coursesRef = ref(database, '/Elearning/Cours');
    const coursesSnapshot = await get(coursesRef);
    
    if (coursesSnapshot.exists()) {
      const courses = coursesSnapshot.val();
      
      // Process each course
      for (const [courseId, courseData] of Object.entries(courses)) {
        // Skip if course has no modules
        if (!courseData.modules || typeof courseData.modules !== 'object') continue;
        
        // Process each module in the course
        for (const [moduleId, moduleData] of Object.entries(courseData.modules)) {
          // Add courseId to module data if not present
          const enrichedModuleData = {
            ...moduleData,
            courseId: moduleData.courseId || courseId
          };
          
          await migrateModuleData(moduleId, enrichedModuleData);
        }
      }
    }
    
    
  } catch (error) {
    
    throw error;
  }
};

/**
 * Helper function to migrate a single module
 */
const migrateModuleData = async (moduleId, moduleData) => {
  // Create standardized module object
  const standardizedModule = {
    id: moduleId,
    courseId: moduleData.courseId || '',
    title: moduleData.title || `Module ${moduleId}`,
    description: moduleData.description || '',
    order: moduleData.order || 0,
    content: moduleData.content || '',
    duration: moduleData.duration || 0,
    resources: [],
    createdAt: moduleData.createdAt || new Date().toISOString(),
    updatedAt: moduleData.updatedAt || new Date().toISOString()
  };
  
  // Handle resources if they exist
  if (moduleData.resources && Array.isArray(moduleData.resources)) {
    standardizedModule.resources = moduleData.resources.map(resource => ({
      title: resource.title || 'Resource',
      type: resource.type || 'link',
      url: resource.url || ''
    }));
  }
  
  // Save to new path
  const newModuleRef = ref(database, `/elearning/modules/${moduleId}`);
  await set(newModuleRef, standardizedModule);
  
  // Ensure the module is referenced in its course
  if (standardizedModule.courseId) {
    const courseModulesRef = ref(database, `/elearning/courses/${standardizedModule.courseId}/modules/${moduleId}`);
    await set(courseModulesRef, true);
  }
};

/**
 * Migrate evaluation data to the standardized structure
 */
const migrateEvaluations = async () => {
  
  
  try {
    // Create the new evaluations path if it doesn't exist
    const newEvaluationsRef = ref(database, '/elearning/evaluations');
    await set(newEvaluationsRef, {});
    
    // Paths to check for evaluation data
    const evaluationPaths = [
      '/Elearning/Evaluations',
      '/Elearning/Modules'  // Some modules have evaluations nested inside
    ];
    
    // First, check standalone evaluations
    const evaluationsRef = ref(database, '/Elearning/Evaluations');
    const evaluationsSnapshot = await get(evaluationsRef);
    
    if (evaluationsSnapshot.exists()) {
      const evaluations = evaluationsSnapshot.val();
      
      // Process each evaluation
      for (const [evalId, evalData] of Object.entries(evaluations)) {
        // Skip if not a valid evaluation object
        if (!evalData || typeof evalData !== 'object') continue;
        
        await migrateEvaluationData(evalId, evalData);
      }
    }
    
    // Then check for evaluations inside modules
    const modulesRef = ref(database, '/Elearning/Modules');
    const modulesSnapshot = await get(modulesRef);
    
    if (modulesSnapshot.exists()) {
      const modules = modulesSnapshot.val();
      
      // Process each module
      for (const [moduleId, moduleData] of Object.entries(modules)) {
        // Skip if module has no evaluations
        if (!moduleData.evaluations || typeof moduleData.evaluations !== 'object') continue;
        
        // Process each evaluation in the module
        for (const [evalId, evalData] of Object.entries(moduleData.evaluations)) {
          // Add moduleId to evaluation data if not present
          const enrichedEvalData = {
            ...evalData,
            moduleId: evalData.moduleId || moduleId
          };
          
          await migrateEvaluationData(evalId, enrichedEvalData);
        }
      }
    }
    
    
  } catch (error) {
    
    throw error;
  }
};

/**
 * Helper function to migrate a single evaluation
 */
const migrateEvaluationData = async (evalId, evalData) => {
  // Create standardized evaluation object
  const standardizedEval = {
    id: evalId,
    moduleId: evalData.moduleId || '',
    title: evalData.title || `Evaluation ${evalId}`,
    type: evalData.type || 'quiz',
    description: evalData.description || '',
    questions: evalData.questions || [],
    maxScore: evalData.maxScore || 100,
    passingScore: evalData.passingScore || 70,
    createdAt: evalData.createdAt || evalData.date || new Date().toISOString(),
    updatedAt: evalData.updatedAt || new Date().toISOString()
  };
  
  // Save to new path
  const newEvalRef = ref(database, `/elearning/evaluations/${evalId}`);
  await set(newEvalRef, standardizedEval);
};

/**
 * Migrate enrollment data to the standardized structure
 */
const migrateEnrollments = async () => {
  
  
  try {
    // Create the new enrollments paths if they don't exist
    const newEnrollmentsByCourseRef = ref(database, '/elearning/enrollments/byCourse');
    await set(newEnrollmentsByCourseRef, {});
    
    const newEnrollmentsByUserRef = ref(database, '/elearning/enrollments/byUser');
    await set(newEnrollmentsByUserRef, {});
    
    // Paths to check for enrollment data
    const enrollmentPaths = [
      '/Elearning/Enrollments',
      '/Elearning/Enrollments/byUser',
      '/Elearning/Inscriptions',
      '/enrollments',
      '/Inscriptions'
    ];
    
    // Process each path
    for (const path of enrollmentPaths) {
      const enrollmentsRef = ref(database, path);
      const snapshot = await get(enrollmentsRef);
      
      if (snapshot.exists()) {
        const enrollments = snapshot.val();
        
        // Handle different enrollment data structures
        if (path.includes('byUser')) {
          // Handle byUser structure
          for (const [userId, userEnrollments] of Object.entries(enrollments)) {
            for (const [courseId, enrollmentData] of Object.entries(userEnrollments)) {
              await migrateEnrollmentData(userId, courseId, enrollmentData);
            }
          }
        } else {
          // Handle flat enrollment structure
          for (const [enrollmentId, enrollmentData] of Object.entries(enrollments)) {
            // Skip if not a valid enrollment object
            if (!enrollmentData || typeof enrollmentData !== 'object') continue;
            
            const userId = enrollmentData.userId || enrollmentData.apprenant;
            const courseId = enrollmentData.courseId || enrollmentData.course?.id || enrollmentData.course || enrollmentData.formation;
            
            if (userId && courseId) {
              await migrateEnrollmentData(userId, courseId, enrollmentData);
            }
          }
        }
      }
    }
    
    
  } catch (error) {
    
    throw error;
  }
};

/**
 * Helper function to migrate a single enrollment
 */
const migrateEnrollmentData = async (userId, courseId, enrollmentData) => {
  // Create standardized enrollment object
  const standardizedEnrollment = {
    userId: userId,
    courseId: courseId,
    enrolledAt: enrollmentData.enrolledAt || enrollmentData.dateInscription || enrollmentData.date || new Date().toISOString(),
    status: enrollmentData.status || enrollmentData.statut || 'active'
  };
  
  // Save to byCourse path
  const byCourseRef = ref(database, `/elearning/enrollments/byCourse/${courseId}/${userId}`);
  await set(byCourseRef, standardizedEnrollment);
  
  // Save to byUser path
  const byUserRef = ref(database, `/elearning/enrollments/byUser/${userId}/${courseId}`);
  await set(byUserRef, {
    courseId: courseId,
    enrolledAt: standardizedEnrollment.enrolledAt,
    status: standardizedEnrollment.status
  });
  
  // Update student's enrollments list
  const studentRef = ref(database, `/elearning/students/${userId}`);
  const studentSnapshot = await get(studentRef);
  
  if (studentSnapshot.exists()) {
    const studentData = studentSnapshot.val();
    const enrollments = studentData.enrollments || [];
    
    if (!enrollments.includes(courseId)) {
      enrollments.push(courseId);
      await set(ref(database, `/elearning/students/${userId}/enrollments`), enrollments);
    }
  }
};

/**
 * Migrate progress data to the standardized structure
 */
const migrateProgress = async () => {
  
  
  try {
    // Create the new progress path if it doesn't exist
    const newProgressRef = ref(database, '/elearning/progress');
    await set(newProgressRef, {});
    
    // Paths to check for progress data
    const progressPaths = [
      '/Elearning/Progression'
    ];
    
    // Process each path
    for (const path of progressPaths) {
      const progressRef = ref(database, path);
      const snapshot = await get(progressRef);
      
      if (snapshot.exists()) {
        const progressData = snapshot.val();
        
        // Process each user's progress
        for (const [userId, userProgress] of Object.entries(progressData)) {
          // Skip if not a valid progress object
          if (!userProgress || typeof userProgress !== 'object') continue;
          
          // Process each course progress
          for (const [courseId, courseProgress] of Object.entries(userProgress)) {
            // Skip if not a valid course progress object
            if (!courseProgress || typeof courseProgress !== 'object') continue;
            
            // Create standardized course progress object
            const standardizedCourseProgress = {
              courseId: courseId,
              userId: userId,
              startDate: courseProgress.startDate || new Date().toISOString(),
              progress: courseProgress.progress || 0,
              completed: courseProgress.completed || false,
              lastUpdated: courseProgress.lastUpdated || new Date().toISOString()
            };
            
            // Save course progress
            const newCourseProgressRef = ref(database, `/elearning/progress/${userId}/${courseId}`);
            await set(newCourseProgressRef, standardizedCourseProgress);
            
            // Process module progress
            for (const [key, value] of Object.entries(courseProgress)) {
              // Skip non-module entries
              if (['courseId', 'userId', 'startDate', 'progress', 'completed', 'lastUpdated'].includes(key)) continue;
              
              // Assume this is a module ID
              const moduleId = key;
              const moduleProgress = value;
              
              // Skip if not a valid module progress object
              if (!moduleProgress || typeof moduleProgress !== 'object') continue;
              
              // Create standardized module progress object
              const standardizedModuleProgress = {
                moduleId: moduleId,
                completed: moduleProgress.completed || false,
                score: moduleProgress.score || 0,
                lastUpdated: moduleProgress.lastUpdated || new Date().toISOString()
              };
              
              // Save module progress
              const newModuleProgressRef = ref(database, `/elearning/progress/${userId}/${courseId}/${moduleId}`);
              await set(newModuleProgressRef, standardizedModuleProgress);
            }
          }
        }
      }
    }
    
    
  } catch (error) {
    
    throw error;
  }
};

/**
 * Migrate feedback data to the standardized structure
 */
const migrateFeedback = async () => {
  
  
  try {
    // Create the new feedback path if it doesn't exist
    const newFeedbackRef = ref(database, '/elearning/feedback');
    await set(newFeedbackRef, {});
    
    // Paths to check for feedback data
    const feedbackPaths = [
      '/Elearning/Feedback'
    ];
    
    // Process each path
    for (const path of feedbackPaths) {
      const feedbackRef = ref(database, path);
      const snapshot = await get(feedbackRef);
      
      if (snapshot.exists()) {
        const feedbackData = snapshot.val();
        
        // Process each feedback entry
        for (const [feedbackId, feedback] of Object.entries(feedbackData)) {
          // Skip if not a valid feedback object
          if (!feedback || typeof feedback !== 'object') continue;
          
          // Create standardized feedback object
          const standardizedFeedback = {
            userId: feedback.userId || feedback.utilisateur || '',
            courseId: feedback.courseId || feedback.cours || '',
            rating: feedback.rating || feedback.note || 0,
            comment: feedback.comment || feedback.commentaire || '',
            createdAt: feedback.createdAt || feedback.date || new Date().toISOString()
          };
          
          // Save to new path
          const newFeedbackEntryRef = ref(database, `/elearning/feedback/${feedbackId}`);
          await set(newFeedbackEntryRef, standardizedFeedback);
        }
      }
    }
    
    
  } catch (error) {
    
    throw error;
  }
};

/**
 * Execute the database migration
 */
export const runDatabaseMigration = async () => {
  try {
    const result = await migrateDatabase();
    return result;
  } catch (error) {
    return { success: false, message: `Migration error: ${error.message}` };
  }
};
