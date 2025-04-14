/**
 * Schema validation utilities for the E-Learning platform
 * This ensures data conforms to the schema defined in /docs/DATABASE_SCHEMA.md
 */

/**
 * Validate user data against the schema
 * @param {Object} userData - User data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateUser = (userData) => {
  const errors = [];
  
  // Required fields
  if (!userData.id) errors.push("User ID is required");
  if (!userData.firstName) errors.push("First name is required");
  if (!userData.lastName) errors.push("Last name is required");
  if (!userData.email) errors.push("Email is required");
  if (!userData.userType) errors.push("User type is required");
  
  // Field type validation
  if (userData.email && !isValidEmail(userData.email)) {
    errors.push("Email format is invalid");
  }
  
  // Enum validation
  if (userData.userType && !["student", "instructor", "admin"].includes(userData.userType)) {
    errors.push("User type must be one of: student, instructor, admin");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate course data against the schema
 * @param {Object} courseData - Course data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateCourse = (courseData) => {
  const errors = [];
  
  // Required fields
  if (!courseData.id) errors.push("Course ID is required");
  if (!courseData.title) errors.push("Title is required");
  if (!courseData.description) errors.push("Description is required");
  
  // Field type validation
  if (courseData.price && typeof courseData.price !== 'number') {
    errors.push("Price must be a number");
  }
  
  if (courseData.rating && (typeof courseData.rating !== 'number' || courseData.rating < 0 || courseData.rating > 5)) {
    errors.push("Rating must be a number between 0 and 5");
  }
  
  // Enum validation
  if (courseData.level && !["beginner", "intermediate", "advanced"].includes(courseData.level)) {
    errors.push("Level must be one of: beginner, intermediate, advanced");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate module data against the schema
 * @param {Object} moduleData - Module data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateModule = (moduleData) => {
  const errors = [];
  
  // Required fields
  if (!moduleData.id) errors.push("Module ID is required");
  if (!moduleData.courseId) errors.push("Course ID is required");
  if (!moduleData.title) errors.push("Title is required");
  
  // Field type validation
  if (moduleData.order && typeof moduleData.order !== 'number') {
    errors.push("Order must be a number");
  }
  
  // Validate resources if present
  if (moduleData.resources && Array.isArray(moduleData.resources)) {
    moduleData.resources.forEach((resource, index) => {
      if (!resource.title) errors.push(`Resource ${index + 1} title is required`);
      if (!resource.type) errors.push(`Resource ${index + 1} type is required`);
      if (!resource.url) errors.push(`Resource ${index + 1} URL is required`);
      
      if (resource.type && !["video", "pdf", "link"].includes(resource.type)) {
        errors.push(`Resource ${index + 1} type must be one of: video, pdf, link`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate evaluation data against the schema
 * @param {Object} evalData - Evaluation data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateEvaluation = (evalData) => {
  const errors = [];
  
  // Required fields
  if (!evalData.id) errors.push("Evaluation ID is required");
  if (!evalData.moduleId) errors.push("Module ID is required");
  if (!evalData.title) errors.push("Title is required");
  if (!evalData.type) errors.push("Type is required");
  
  // Field type validation
  if (evalData.maxScore && typeof evalData.maxScore !== 'number') {
    errors.push("Max score must be a number");
  }
  
  if (evalData.passingScore && typeof evalData.passingScore !== 'number') {
    errors.push("Passing score must be a number");
  }
  
  // Enum validation
  if (evalData.type && !["quiz", "assignment"].includes(evalData.type)) {
    errors.push("Type must be one of: quiz, assignment");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate enrollment data against the schema
 * @param {Object} enrollmentData - Enrollment data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateEnrollment = (enrollmentData) => {
  const errors = [];
  
  // Required fields
  if (!enrollmentData.userId) errors.push("User ID is required");
  if (!enrollmentData.courseId) errors.push("Course ID is required");
  if (!enrollmentData.enrolledAt) errors.push("Enrolled at timestamp is required");
  
  // Enum validation
  if (enrollmentData.status && !["active", "completed", "paused"].includes(enrollmentData.status)) {
    errors.push("Status must be one of: active, completed, paused");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate progress data against the schema
 * @param {Object} progressData - Progress data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateProgress = (progressData) => {
  const errors = [];
  
  // Required fields
  if (!progressData.courseId) errors.push("Course ID is required");
  if (!progressData.userId) errors.push("User ID is required");
  
  // Field type validation
  if (progressData.progress && (typeof progressData.progress !== 'number' || progressData.progress < 0 || progressData.progress > 100)) {
    errors.push("Progress must be a number between 0 and 100");
  }
  
  if (progressData.completed && typeof progressData.completed !== 'boolean') {
    errors.push("Completed must be a boolean");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate feedback data against the schema
 * @param {Object} feedbackData - Feedback data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateFeedback = (feedbackData) => {
  const errors = [];
  
  // Required fields
  if (!feedbackData.userId) errors.push("User ID is required");
  if (!feedbackData.courseId) errors.push("Course ID is required");
  
  // Field type validation
  if (feedbackData.rating && (typeof feedbackData.rating !== 'number' || feedbackData.rating < 1 || feedbackData.rating > 5)) {
    errors.push("Rating must be a number between 1 and 5");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper function to validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Helper function to validate ISO date format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - Whether the date string is valid ISO format
 */
const isValidISODate = (dateString) => {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.includes('T');
  } catch (e) {
    return false;
  }
};

/**
 * Standardize a user object to match the schema
 * @param {Object} userData - User data to standardize
 * @returns {Object} - Standardized user data
 */
export const standardizeUser = (userData) => {
  return {
    id: userData.id || '',
    firstName: userData.firstName || userData.prenom || '',
    lastName: userData.lastName || userData.nom || '',
    email: userData.email || '',
    userType: userData.userType || 'student',
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: userData.updatedAt || new Date().toISOString(),
    avatar: userData.avatar || ''
  };
};

/**
 * Standardize a course object to match the schema
 * @param {Object} courseData - Course data to standardize
 * @returns {Object} - Standardized course data
 */
export const standardizeCourse = (courseData) => {
  return {
    id: courseData.id || '',
    title: courseData.title || courseData.titre || '',
    description: courseData.description || '',
    content: courseData.content || courseData.contenu || '',
    duration: courseData.duration || courseData.duree || '0',
    image: courseData.image || '',
    instructorId: courseData.instructorId || courseData.formateur || '',
    category: courseData.category || '',
    level: courseData.level || 'beginner',
    price: courseData.price || 0,
    rating: courseData.rating || 0,
    totalRatings: courseData.totalRatings || 0,
    createdAt: courseData.createdAt || new Date().toISOString(),
    updatedAt: courseData.updatedAt || new Date().toISOString(),
    modules: courseData.modules || {}
  };
};

/**
 * Standardize a module object to match the schema
 * @param {Object} moduleData - Module data to standardize
 * @returns {Object} - Standardized module data
 */
export const standardizeModule = (moduleData) => {
  return {
    id: moduleData.id || '',
    courseId: moduleData.courseId || '',
    title: moduleData.title || '',
    description: moduleData.description || '',
    order: moduleData.order || 0,
    content: moduleData.content || '',
    duration: moduleData.duration || 0,
    resources: moduleData.resources || [],
    createdAt: moduleData.createdAt || new Date().toISOString(),
    updatedAt: moduleData.updatedAt || new Date().toISOString()
  };
};

/**
 * Standardize an evaluation object to match the schema
 * @param {Object} evalData - Evaluation data to standardize
 * @returns {Object} - Standardized evaluation data
 */
export const standardizeEvaluation = (evalData) => {
  return {
    id: evalData.id || '',
    moduleId: evalData.moduleId || '',
    title: evalData.title || '',
    type: evalData.type || 'quiz',
    description: evalData.description || '',
    questions: evalData.questions || [],
    maxScore: evalData.maxScore || 100,
    passingScore: evalData.passingScore || 70,
    createdAt: evalData.createdAt || evalData.date || new Date().toISOString(),
    updatedAt: evalData.updatedAt || new Date().toISOString()
  };
};

/**
 * Standardize an enrollment object to match the schema
 * @param {Object} enrollmentData - Enrollment data to standardize
 * @returns {Object} - Standardized enrollment data
 */
export const standardizeEnrollment = (enrollmentData) => {
  return {
    userId: enrollmentData.userId || enrollmentData.apprenant || '',
    courseId: enrollmentData.courseId || enrollmentData.course || enrollmentData.formation || '',
    enrolledAt: enrollmentData.enrolledAt || enrollmentData.dateInscription || new Date().toISOString(),
    status: enrollmentData.status || enrollmentData.statut || 'active'
  };
};

/**
 * Standardize a progress object to match the schema
 * @param {Object} progressData - Progress data to standardize
 * @returns {Object} - Standardized progress data
 */
export const standardizeProgress = (progressData) => {
  return {
    courseId: progressData.courseId || '',
    userId: progressData.userId || '',
    startDate: progressData.startDate || new Date().toISOString(),
    progress: progressData.progress || 0,
    completed: progressData.completed || false,
    lastUpdated: progressData.lastUpdated || new Date().toISOString()
  };
};

/**
 * Standardize a feedback object to match the schema
 * @param {Object} feedbackData - Feedback data to standardize
 * @returns {Object} - Standardized feedback data
 */
export const standardizeFeedback = (feedbackData) => {
  return {
    userId: feedbackData.userId || feedbackData.utilisateur || '',
    courseId: feedbackData.courseId || feedbackData.cours || '',
    rating: feedbackData.rating || feedbackData.note || 0,
    comment: feedbackData.comment || feedbackData.commentaire || '',
    createdAt: feedbackData.createdAt || feedbackData.date || new Date().toISOString()
  };
};
