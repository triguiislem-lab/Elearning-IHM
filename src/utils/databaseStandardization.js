import { getDatabase, ref, get, set, remove } from 'firebase/database';

/**
 * Utility to standardize database paths from legacy capitalized paths to lowercase paths
 * This helps resolve the issue of having both 'Elearning' and 'elearning' collections
 */

// Map of legacy paths to standardized paths
const pathMappings = {
  // Users
  'Elearning/Utilisateurs': 'elearning/users',
  'Elearning/Administrateurs': 'elearning/users', // Admins go to users with role=admin
  'Elearning/Formateurs': 'elearning/users', // Instructors go to users with role=instructor
  'Elearning/Apprenants': 'elearning/users', // Students go to users with role=student
  
  // Courses and related data
  'Elearning/Cours': 'elearning/courses',
  'Elearning/Formations': 'elearning/specialites',
  'Elearning/Disciplines': 'elearning/disciplines',
  'Elearning/Inscriptions': 'elearning/enrollments',
  
  // Other collections
  'Elearning/Messages': 'elearning/messages',
  'Elearning/Evaluations': 'elearning/evaluations',
  'Elearning/Progression': 'elearning/progress'
};

/**
 * Standardize the database structure by migrating data from legacy paths to standardized paths
 */
export const standardizeDatabase = async () => {
  const database = getDatabase();
  const results = {
    success: true,
    migrated: [],
    errors: []
  };
  
  try {
    // Process each legacy path
    for (const [legacyPath, standardPath] of Object.entries(pathMappings)) {
      try {
        // Get data from legacy path
        const legacyRef = ref(database, legacyPath);
        const legacySnapshot = await get(legacyRef);
        
        if (legacySnapshot.exists()) {
          const legacyData = legacySnapshot.val();
          
          // Special handling for different entity types
          if (legacyPath === 'Elearning/Administrateurs') {
            // Migrate admins to users with role=admin
            await migrateAdmins(legacyData, standardPath);
          } else if (legacyPath === 'Elearning/Formateurs') {
            // Migrate instructors to users with role=instructor
            await migrateInstructors(legacyData, standardPath);
          } else if (legacyPath === 'Elearning/Apprenants') {
            // Migrate students to users with role=student
            await migrateStudents(legacyData, standardPath);
          } else {
            // Standard migration for other entity types
            await migrateStandardEntity(legacyData, standardPath);
          }
          
          results.migrated.push(legacyPath);
        }
      } catch (error) {
        console.error(`Error migrating ${legacyPath}:`, error);
        results.errors.push({ path: legacyPath, error: error.message });
        results.success = false;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error standardizing database:', error);
    return {
      success: false,
      migrated: results.migrated,
      errors: [...results.errors, { path: 'general', error: error.message }]
    };
  }
};

/**
 * Migrate admin users to the standardized users collection
 */
const migrateAdmins = async (adminsData, usersPath) => {
  const database = getDatabase();
  
  for (const [userId, adminData] of Object.entries(adminsData)) {
    const standardUserRef = ref(database, `${usersPath}/${userId}`);
    
    // Check if user already exists in standard path
    const userSnapshot = await get(standardUserRef);
    
    if (!userSnapshot.exists()) {
      // Create standardized user object
      const standardUser = {
        ...adminData,
        role: 'admin',
        createdAt: adminData.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      
      // Save to standard path
      await set(standardUserRef, standardUser);
    }
  }
};

/**
 * Migrate instructor users to the standardized users collection
 */
const migrateInstructors = async (instructorsData, usersPath) => {
  const database = getDatabase();
  
  for (const [userId, instructorData] of Object.entries(instructorsData)) {
    const standardUserRef = ref(database, `${usersPath}/${userId}`);
    
    // Check if user already exists in standard path
    const userSnapshot = await get(standardUserRef);
    
    if (!userSnapshot.exists()) {
      // Create standardized user object
      const standardUser = {
        ...instructorData,
        role: 'instructor',
        createdAt: instructorData.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      
      // Save to standard path
      await set(standardUserRef, standardUser);
    }
  }
};

/**
 * Migrate student users to the standardized users collection
 */
const migrateStudents = async (studentsData, usersPath) => {
  const database = getDatabase();
  
  for (const [userId, studentData] of Object.entries(studentsData)) {
    const standardUserRef = ref(database, `${usersPath}/${userId}`);
    
    // Check if user already exists in standard path
    const userSnapshot = await get(standardUserRef);
    
    if (!userSnapshot.exists()) {
      // Create standardized user object
      const standardUser = {
        ...studentData,
        role: 'student',
        createdAt: studentData.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      
      // Save to standard path
      await set(standardUserRef, standardUser);
    }
  }
};

/**
 * Migrate standard entities (courses, specialites, etc.)
 */
const migrateStandardEntity = async (entityData, standardPath) => {
  const database = getDatabase();
  
  for (const [entityId, data] of Object.entries(entityData)) {
    const standardEntityRef = ref(database, `${standardPath}/${entityId}`);
    
    // Check if entity already exists in standard path
    const entitySnapshot = await get(standardEntityRef);
    
    if (!entitySnapshot.exists()) {
      // Add timestamps if not present
      const standardEntity = {
        ...data,
        updatedAt: Date.now()
      };
      
      if (!standardEntity.createdAt) {
        standardEntity.createdAt = Date.now();
      }
      
      // Save to standard path
      await set(standardEntityRef, standardEntity);
    }
  }
};

/**
 * Run the database standardization process
 */
export const runDatabaseStandardization = async () => {
  try {
    const results = await standardizeDatabase();
    
    return {
      success: results.success,
      message: results.success 
        ? `Migration completed successfully. Migrated: ${results.migrated.join(', ')}` 
        : `Migration completed with errors: ${results.errors.map(e => `${e.path}: ${e.error}`).join('; ')}`,
      details: results
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error.message}`,
      details: { error: error.message }
    };
  }
};
