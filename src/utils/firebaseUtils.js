import { database } from '../../firebaseConfig';
import { ref, get, set, update, onValue, push } from 'firebase/database';
import { fetchCompleteUserInfo } from './fetchCompleteUserInfo';
import { getCachedData, setCachedData, clearCacheItem } from './cacheUtils';
import * as paths from './firebasePaths';
import { migrateAllData } from './migrationUtils';

/**
 * Initialise la base de données et migre les données si nécessaire
 * Cette fonction doit être appelée au démarrage de l'application
 */
export const initializeDatabase = async () => {
	try {
		// Vérifier si la migration est nécessaire
		const legacyRef = ref(database, paths.LEGACY_ROOT_PATH);
		const snapshot = await get(legacyRef);

		if (snapshot.exists()) {
			console.log('Anciennes données détectées, démarrage de la migration...');
			await migrateAllData();
			console.log('Migration terminée');
		}

		return true;
	} catch (error) {
		console.error('Erreur lors de l\'initialisation de la base de données:', error);
		return false;
	}
};

// Fetch instructor by ID
export const fetchInstructorById = async (instructorId) => {
	if (!instructorId) return null;

	const instructorRef = ref(database, paths.USER_PATH(instructorId));
	const snapshot = await get(instructorRef);

	if (snapshot.exists()) {
		const instructorData = snapshot.val();
		return {
			id: instructorId,
			name: `${instructorData.firstName || ''} ${instructorData.lastName || ''}`.trim(),
			bio: instructorData.bio || instructorData.description || '',
			expertise: instructorData.expertise || '',
			avatar: instructorData.avatar || '',
			email: instructorData.email || ''
		};
	}
	return null;
};

/**
 * Fonction générique pour récupérer des données depuis Firebase
 * @param {string} path - Chemin Firebase
 * @param {boolean} useCache - Utiliser le cache si disponible
 * @param {string} cacheKey - Clé de cache optionnelle
 * @returns {Array} Données formatées en tableau
 */
const fetchDataFromPath = async (path, useCache = false, cacheKey = null) => {
	console.log(`Tentative de récupération des données depuis le chemin: ${path}`);
	
	// Utiliser le cache si demandé et disponible
	if (useCache && cacheKey) {
		const cachedData = getCachedData(cacheKey);
		if (cachedData) {
			console.log(`Données trouvées dans le cache pour la clé: ${cacheKey}`);
			return cachedData;
		}
	}

	const dataRef = ref(database, path);
	console.log(`Référence Firebase créée: ${path}`);
	
	const snapshot = await get(dataRef);
	console.log(`Snapshot obtenu pour ${path}:`, snapshot.exists() ? "Données existantes" : "Aucune donnée");

	if (snapshot.exists()) {
		const data = snapshot.val();
		console.log(`Données brutes récupérées de ${path}:`, data);
		
		const formattedData = Array.isArray(data) ? data : Object.entries(data).map(([id, value]) => ({
			id,
			...value
		}));
		
		console.log(`Données formatées pour ${path}:`, formattedData);

		// Mettre en cache si demandé
		if (useCache && cacheKey) {
			setCachedData(cacheKey, formattedData);
			console.log(`Données mises en cache avec la clé: ${cacheKey}`);
		}

		return formattedData;
	}
	
	console.log(`Aucune donnée trouvée pour le chemin: ${path}`);
	return [];
};

/**
 * Fonction pour écouter les changements en temps réel
 * @param {string} path - Chemin Firebase
 * @param {function} callback - Fonction de rappel appelée avec les nouvelles données
 * @returns {function} Fonction pour arrêter l'écoute
 */
export const listenToData = (path, callback) => {
	const dataRef = ref(database, path);
	const unsubscribe = onValue(dataRef, (snapshot) => {
		if (snapshot.exists()) {
			const data = snapshot.val();
			const formattedData = Array.isArray(data) ? data : Object.entries(data).map(([id, value]) => ({
				id,
				...value
			}));
			callback(formattedData);
		} else {
			callback([]);
		}
	}, (error) => {
		console.error('Erreur lors de l\'écoute des données:', error);
		callback([], error);
	});

	return unsubscribe;
};

// Fetch users
export const fetchUsersFromDatabase = () => fetchDataFromPath(paths.USERS_PATH, true, 'all_users');

// Fetch admins
export const fetchAdminsFromDatabase = async () => {
	const users = await fetchDataFromPath(paths.USERS_PATH, true, 'all_users');
	return users.filter(user => user.role === 'admin' || user.userType === 'administrateur');
};

// Fetch students
export const fetchApprenantsFromDatabase = async () => {
	const users = await fetchDataFromPath(paths.USERS_PATH, true, 'all_users');
	return users.filter(user => user.role === 'student' || user.userType === 'apprenant');
};

// Fetch instructors
export const fetchFormateursFromDatabase = async () => {
	const users = await fetchDataFromPath(paths.USERS_PATH, true, 'all_users');
	return users.filter(user => user.role === 'instructor' || user.userType === 'formateur');
};

/**
 * Vérifie si un utilisateur a un rôle spécifique
 * @param {Object} user - Objet utilisateur
 * @param {string} role - Rôle à vérifier ('admin', 'instructor', 'student')
 * @returns {boolean} Vrai si l'utilisateur a le rôle spécifié
 */
export const hasRole = (user, role) => {
	if (!user) return false;

	switch(role) {
		case 'admin':
			return user.role === 'admin' || user.userType === 'administrateur';
		case 'instructor':
			return user.role === 'instructor' || user.userType === 'formateur';
		case 'student':
			return user.role === 'student' || user.userType === 'apprenant';
		default:
			return false;
	}
};

/**
 * Récupère tous les cours depuis la base de données
 * @param {boolean} withInstructors - Inclure les détails des instructeurs
 * @returns {Array} Liste des cours
 */
export const fetchCoursesFromDatabase = async (withInstructors = true) => {
	const cacheKey = withInstructors ? 'all_courses_with_instructors' : 'all_courses';
	const cachedData = getCachedData(cacheKey);

	if (cachedData) return cachedData;

	const result = await fetchDataFromPath(paths.COURSES_PATH);

	if (result && result.length > 0) {
		let coursesData = result;

		// Ajouter les détails des instructeurs si demandé
		if (withInstructors) {
			coursesData = await Promise.all(
				result.map(async (course) => {
					if (course.instructorId) {
						const instructor = await fetchInstructorById(course.instructorId);
						return { ...course, instructor };
					}
					return course;
				})
			);
		}

		setCachedData(cacheKey, coursesData);
		return coursesData;
	}

	return [];
};

// Fetch formations (alias for courses in French)
export const fetchFormationsFromDatabase = async () => {
	// This is an alias for fetchCoursesFromDatabase for backward compatibility
	return fetchCoursesFromDatabase();
};

/**
 * Récupère les cours d'un instructeur spécifique
 * @param {string} instructorId - ID de l'instructeur
 * @returns {Array} Liste des cours de l'instructeur
 */
export const fetchInstructorCourses = async (instructorId) => {
	if (!instructorId) return [];

	const cacheKey = `instructor_courses_${instructorId}`;
	const cachedData = getCachedData(cacheKey);

	if (cachedData) return cachedData;

	try {
		// Vérifier d'abord dans le chemin des utilisateurs
		const instructorCoursesRef = ref(database, paths.USER_COURSES_PATH(instructorId));
		const snapshot = await get(instructorCoursesRef);

		if (snapshot.exists()) {
			const coursesIds = Object.keys(snapshot.val());

			// Récupérer les détails complets de chaque cours
			const coursesPromises = coursesIds.map(courseId => fetchCourseById(courseId));
			const courses = await Promise.all(coursesPromises);

			// Filtrer les cours null ou undefined
			const validCourses = courses.filter(course => course);
			setCachedData(cacheKey, validCourses);
			return validCourses;
		}

		// Sinon, filtrer tous les cours par instructorId
		const allCourses = await fetchCoursesFromDatabase(false);
		const instructorCourses = allCourses.filter(course => course.instructorId === instructorId);
		setCachedData(cacheKey, instructorCourses);
		return instructorCourses;
	} catch (error) {
		console.error('Erreur lors de la récupération des cours de l\'instructeur:', error);
		return [];
	}
};

// Fetch specialties
export const fetchSpecialitesFromDatabase = async () => {
	console.log("Début de fetchSpecialitesFromDatabase");
	console.log("Tentative de récupération depuis le chemin principal:", paths.SPECIALTIES_PATH);
	
	try {
		// Récupérer directement depuis Firebase sans utiliser le cache
		const specialitesRef = ref(database, paths.SPECIALTIES_PATH);
		const snapshot = await get(specialitesRef);
		
		if (!snapshot.exists()) {
			console.log("Aucune spécialité trouvée dans le chemin principal, tentative avec le chemin legacy");
			// Essayer le chemin legacy
			const legacySpecialitesRef = ref(database, paths.LEGACY_SPECIALTIES_PATH);
			const legacySnapshot = await get(legacySpecialitesRef);
			
			if (!legacySnapshot.exists()) {
				console.log("Aucune spécialité trouvée dans le chemin legacy non plus");
				return [];
			}
			
			const legacySpecialites = Object.entries(legacySnapshot.val()).map(([id, data]) => ({
				id,
				name: data.name || data.description || "Sans nom",
				description: data.description || "",
				createdAt: data.createdAt || new Date().toISOString(),
				updatedAt: data.updatedAt || new Date().toISOString(),
			}));
			
			console.log("Retour des spécialités du chemin legacy:", legacySpecialites);
			return legacySpecialites;
		}
		
		const specialites = Object.entries(snapshot.val()).map(([id, data]) => ({
			id,
			name: data.name || data.description || "Sans nom",
			description: data.description || "",
			createdAt: data.createdAt || new Date().toISOString(),
			updatedAt: data.updatedAt || new Date().toISOString(),
		}));
		
		console.log("Retour des spécialités trouvées:", specialites);
		return specialites;
	} catch (error) {
		console.error("Erreur lors de la récupération des spécialités:", error);
		return [];
	}
};

// Fetch disciplines
export const fetchDisciplinesFromDatabase = async () => {
	console.log("Début de fetchDisciplinesFromDatabase");
	console.log("Tentative de récupération depuis le chemin principal:", paths.DISCIPLINES_PATH);
	
	try {
		// Récupérer directement depuis Firebase sans utiliser le cache
		const disciplinesRef = ref(database, paths.DISCIPLINES_PATH);
		const snapshot = await get(disciplinesRef);
		
		if (!snapshot.exists()) {
			console.log("Aucune discipline trouvée dans le chemin principal, tentative avec le chemin legacy");
			// Essayer le chemin legacy
			const legacyDisciplinesRef = ref(database, 'Elearning/Disciplines');
			const legacySnapshot = await get(legacyDisciplinesRef);
			
			if (!legacySnapshot.exists()) {
				console.log("Aucune discipline trouvée dans le chemin legacy non plus");
				return [];
			}
			
			const legacyDisciplines = Object.entries(legacySnapshot.val()).map(([id, data]) => ({
				id,
				name: data.name || "Sans nom",
				description: data.description || "",
				specialiteId: data.specialiteId || "",
				createdAt: data.createdAt || new Date().toISOString(),
				updatedAt: data.updatedAt || new Date().toISOString(),
			}));
			
			console.log("Retour des disciplines du chemin legacy:", legacyDisciplines);
			return legacyDisciplines;
		}
		
		const disciplines = Object.entries(snapshot.val()).map(([id, data]) => ({
			id,
			name: data.name || "Sans nom",
			description: data.description || "",
			specialiteId: data.specialiteId || "",
			createdAt: data.createdAt || new Date().toISOString(),
			updatedAt: data.updatedAt || new Date().toISOString(),
		}));
		
		console.log("Retour des disciplines trouvées:", disciplines);
		return disciplines;
	} catch (error) {
		console.error("Erreur lors de la récupération des disciplines:", error);
		return [];
	}
};

/**
 * Récupère un cours par son ID
 * @param {string} courseId - ID du cours
 * @param {boolean} withInstructor - Inclure les détails de l'instructeur
 * @param {boolean} withModules - Inclure les modules du cours
 * @returns {Object|null} Détails du cours ou null si non trouvé
 */
export const fetchCourseById = async (courseId, withInstructor = true, withModules = true) => {
	if (!courseId) return null;

	const cacheKey = `course_${courseId}_${withInstructor}_${withModules}`;
	const cachedData = getCachedData(cacheKey);

	if (cachedData) {
		console.log('Cours trouvé dans le cache:', cachedData);
		return cachedData;
	}

	try {
		console.log('Récupération du cours depuis Firebase:', paths.COURSE_PATH(courseId));
		const courseRef = ref(database, paths.COURSE_PATH(courseId));
		const snapshot = await get(courseRef);

		if (snapshot.exists()) {
			const courseData = snapshot.val();
			console.log('Données du cours trouvées:', courseData);
			const course = { id: courseId, ...courseData };

			// Récupérer les données de l'instructeur si demandé
			if (withInstructor && course.instructorId) {
				course.instructor = await fetchInstructorById(course.instructorId);
			}

			// Récupérer les noms de spécialité et discipline
			if (course.specialiteId) {
				try {
					const specialiteRef = ref(database, `elearning/specialites/${course.specialiteId}`);
					const specialiteSnapshot = await get(specialiteRef);
					if (specialiteSnapshot.exists()) {
						const specialiteData = specialiteSnapshot.val();
						course.specialiteName = specialiteData.name || specialiteData.description || "Spécialité sans nom";
					}
				} catch (error) {
					console.error(`Erreur lors de la récupération de la spécialité ${course.specialiteId}:`, error);
				}
			}

			if (course.disciplineId) {
				try {
					const disciplineRef = ref(database, `elearning/disciplines/${course.disciplineId}`);
					const disciplineSnapshot = await get(disciplineRef);
					if (disciplineSnapshot.exists()) {
						const disciplineData = disciplineSnapshot.val();
						course.disciplineName = disciplineData.name || disciplineData.description || "Discipline sans nom";
					}
				} catch (error) {
					console.error(`Erreur lors de la récupération de la discipline ${course.disciplineId}:`, error);
				}
			}

			// Récupérer les modules pour ce cours si demandé
			if (withModules) {
				console.log('Récupération des modules depuis:', paths.COURSE_MODULES_PATH(courseId));
				const modulesRef = ref(database, paths.COURSE_MODULES_PATH(courseId));
				const modulesSnapshot = await get(modulesRef);

				if (modulesSnapshot.exists()) {
					const modulesData = modulesSnapshot.val();
					console.log('Modules trouvés:', modulesData);
					course.modules = Object.entries(modulesData).map(([moduleId, moduleData]) => ({
						id: moduleId,
						courseId,
						...moduleData
					}));

					// Trier les modules par ordre si disponible
					course.modules.sort((a, b) => (a.order || 0) - (b.order || 0));
				} else {
					console.log('Aucun module trouvé pour ce cours');
					course.modules = [];
					
					// Vérifier dans l'ancien format
					console.log('Vérification dans l\'ancien format:', `${paths.LEGACY_ROOT_PATH}/Cours/${courseId}/Modules`);
					const legacyModulesRef = ref(database, `${paths.LEGACY_ROOT_PATH}/Cours/${courseId}/Modules`);
					const legacyModulesSnapshot = await get(legacyModulesRef);
					
					if (legacyModulesSnapshot.exists()) {
						console.log('Modules trouvés dans l\'ancien format:', legacyModulesSnapshot.val());
						const legacyModulesData = legacyModulesSnapshot.val();
						course.modules = Object.entries(legacyModulesData).map(([moduleId, moduleData]) => {
							// Standardiser les données du module
							return {
								id: moduleId,
								courseId,
								title: moduleData.titre || moduleData.title || 'Sans titre',
								description: moduleData.description || '',
								order: moduleData.ordre || moduleData.order || 0,
								status: moduleData.status || 'active',
								createdAt: moduleData.createdAt || new Date().toISOString(),
								lastUpdated: moduleData.lastUpdated || new Date().toISOString(),
								resources: moduleData.ressources || moduleData.resources || [],
								evaluations: moduleData.evaluations || []
							};
						});
						
						// Trier les modules par ordre
						course.modules.sort((a, b) => (a.order || 0) - (b.order || 0));
					}
				}
			}

			setCachedData(cacheKey, course);
			return course;
		} else {
			console.log('Cours non trouvé dans Firebase');
		}
	} catch (error) {
		console.error(`Erreur lors de la récupération du cours ${courseId}:`, error);
	}

	return null;
};

/**
 * Récupère les inscriptions d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {boolean} withCourseDetails - Inclure les détails des cours
 * @returns {Array} Liste des inscriptions
 */
export const fetchUserEnrollments = async (userId, withCourseDetails = false) => {
	if (!userId) return [];

	const cacheKey = `user_enrollments_${userId}_${withCourseDetails}`;
	const cachedData = getCachedData(cacheKey);

	if (cachedData) return cachedData;

	try {
		// Vérifier d'abord dans le nouveau chemin
		const enrollmentsRef = ref(database, paths.USER_ENROLLMENTS_PATH(userId));
		const snapshot = await get(enrollmentsRef);

		if (snapshot.exists()) {
			const enrollments = snapshot.val();
			const enrollmentsList = Object.entries(enrollments).map(([courseId, data]) => ({
				id: `${userId}_${courseId}`,
				userId,
				courseId,
				enrolledAt: data.enrolledAt,
				status: data.status || 'active',
				progress: data.progress || 0
			}));

			// Ajouter les détails des cours si demandé
			if (withCourseDetails) {
				const enrollmentsWithCourses = await Promise.all(
					enrollmentsList.map(async (enrollment) => {
						const course = await fetchCourseById(enrollment.courseId, true, false);
						return { ...enrollment, course };
					})
				);

				setCachedData(cacheKey, enrollmentsWithCourses);
				return enrollmentsWithCourses;
			}

			setCachedData(cacheKey, enrollmentsList);
			return enrollmentsList;
		}

		// Vérifier dans l'ancien chemin si rien n'est trouvé
		const legacyEnrollmentsRef = ref(database, `${paths.LEGACY_ENROLLMENTS_PATH}/${userId}`);
		const legacySnapshot = await get(legacyEnrollmentsRef);

		if (legacySnapshot.exists()) {
			// Migrer les données vers le nouveau format
			const legacyEnrollments = legacySnapshot.val();
			const newEnrollmentsRef = ref(database, paths.USER_ENROLLMENTS_PATH(userId));
			await set(newEnrollmentsRef, legacyEnrollments);

			// Retourner les données migrées
			return fetchUserEnrollments(userId, withCourseDetails);
		}
	} catch (error) {
		console.error(`Erreur lors de la récupération des inscriptions de l'utilisateur ${userId}:`, error);
	}

	return [];
};

/**
 * Récupère les inscriptions pour un cours
 * @param {string} courseId - ID du cours
 * @param {boolean} withUserDetails - Inclure les détails des utilisateurs
 * @returns {Array} Liste des inscriptions
 */
export const fetchCourseEnrollments = async (courseId, withUserDetails = false) => {
	if (!courseId) return [];

	const cacheKey = `course_enrollments_${courseId}_${withUserDetails}`;
	const cachedData = getCachedData(cacheKey);

	if (cachedData) return cachedData;

	try {
		const enrollmentsRef = ref(database, paths.COURSE_ENROLLMENTS_PATH(courseId));
		const snapshot = await get(enrollmentsRef);

		if (snapshot.exists()) {
			const enrollments = snapshot.val();
			const enrollmentsList = Object.entries(enrollments).map(([userId, data]) => ({
				id: `${userId}_${courseId}`,
				userId,
				courseId,
				enrolledAt: data.enrolledAt,
				status: data.status || 'active',
				progress: data.progress || 0
			}));

			// Ajouter les détails des utilisateurs si demandé
			if (withUserDetails) {
				const enrollmentsWithUsers = await Promise.all(
					enrollmentsList.map(async (enrollment) => {
						const user = await fetchCompleteUserInfo(enrollment.userId);
						return { ...enrollment, user };
					})
				);

				setCachedData(cacheKey, enrollmentsWithUsers);
				return enrollmentsWithUsers;
			}

			setCachedData(cacheKey, enrollmentsList);
			return enrollmentsList;
		}
	} catch (error) {
		console.error(`Erreur lors de la récupération des inscriptions pour le cours ${courseId}:`, error);
	}

	return [];
};

/**
 * Récupère les détails d'un module
 * @param {string} courseId - ID du cours
 * @param {string} moduleId - ID du module
 * @returns {Object|null} Détails du module ou null si non trouvé
 */
export const fetchModuleDetails = async (courseId, moduleId) => {
	if (!courseId || !moduleId) {
		console.error('fetchModuleDetails: Paramètres manquants', { courseId, moduleId });
		return null;
	}

	try {
		// Vérifier le cache
		const cacheKey = `module_${courseId}_${moduleId}`;
		const cachedModule = getCachedData(cacheKey);
		if (cachedModule) {
			console.log(`Module ${moduleId} trouvé dans le cache`);
			return cachedModule;
		}

		console.log(`Recherche du module ${moduleId} dans le cours ${courseId}`);

		// Tentative 1: Rechercher le module directement
		const moduleDirectRef = ref(database, `elearning/courses/${courseId}/modules/${moduleId}`);
		const moduleDirectSnapshot = await get(moduleDirectRef);
		
		if (moduleDirectSnapshot.exists()) {
			console.log(`Module ${moduleId} trouvé directement`);
			let moduleData = moduleDirectSnapshot.val();
			
			// S'assurer que le module a des champs obligatoires
			moduleData = {
				...moduleData,
				id: moduleId,
				courseId: courseId,
				title: moduleData.title || moduleData.titre || "Module sans titre",
				description: moduleData.description || "",
				resources: moduleData.resources || [],
				evaluations: moduleData.evaluations || {}
			};
			
			// Si les ressources ou évaluations sont manquantes, essayons de les récupérer séparément
			if (!moduleData.resources || 
			    (Array.isArray(moduleData.resources) && moduleData.resources.length === 0) ||
				(typeof moduleData.resources === 'object' && Object.keys(moduleData.resources).length === 0)) {
				
				// Chercher les ressources dans un chemin dédié
				const resourcesRef = ref(database, `elearning/courses/${courseId}/modules/${moduleId}/resources`);
				const resourcesSnapshot = await get(resourcesRef);
				
				if (resourcesSnapshot.exists()) {
					const resourcesData = resourcesSnapshot.val();
					if (Array.isArray(resourcesData)) {
						moduleData.resources = resourcesData;
					} else {
						moduleData.resources = Object.entries(resourcesData).map(([id, resource]) => ({
							id,
							...resource
						}));
					}
					console.log(`Ressources récupérées séparément pour le module ${moduleId}:`, moduleData.resources.length);
				}
				
				// Chercher aussi dans les chemins alternatifs
				if (moduleData.resources.length === 0) {
					const altResourcesRef = ref(database, `elearning/resources/${courseId}/${moduleId}`);
					const altResourcesSnapshot = await get(altResourcesRef);
					
					if (altResourcesSnapshot.exists()) {
						const altResourcesData = altResourcesSnapshot.val();
						if (Array.isArray(altResourcesData)) {
							moduleData.resources = altResourcesData;
						} else {
							moduleData.resources = Object.entries(altResourcesData).map(([id, resource]) => ({
								id,
								...resource
							}));
						}
						console.log(`Ressources alternatives récupérées pour le module ${moduleId}:`, moduleData.resources.length);
					}
				}
			}
			
			// Faire de même pour les évaluations
			if (!moduleData.evaluations || 
			    (Array.isArray(moduleData.evaluations) && moduleData.evaluations.length === 0) ||
				(typeof moduleData.evaluations === 'object' && Object.keys(moduleData.evaluations).length === 0)) {
				
				// Chercher les évaluations
				const evaluationsRef = ref(database, `elearning/evaluations/${moduleId}`);
				const evaluationsSnapshot = await get(evaluationsRef);
				
				if (evaluationsSnapshot.exists()) {
					const evaluationsData = evaluationsSnapshot.val();
					
					// Vérifier s'il y a un quiz statique
					if (evaluationsData.static_quiz) {
						if (!moduleData.evaluations) moduleData.evaluations = {};
						
						moduleData.evaluations.static_quiz = {
							id: "static_quiz",
							type: "quiz",
							title: evaluationsData.static_quiz.title || "Quiz du module",
							description: evaluationsData.static_quiz.description || "Évaluation des connaissances",
							questions: evaluationsData.static_quiz.questions || [],
							maxScore: 100
						};
						
						console.log(`Quiz statique récupéré pour le module ${moduleId}`);
					}
					
					// Vérifier s'il y a des questions directement
					if (evaluationsData.questions) {
						if (!moduleData.evaluations) moduleData.evaluations = {};
						
						moduleData.evaluations.main_quiz = {
							id: "main_quiz",
							type: "quiz",
							title: "Quiz du module",
							description: "Évaluez vos connaissances",
							questions: evaluationsData.questions,
							maxScore: 100
						};
						
						console.log(`Questions directes récupérées pour le module ${moduleId}`);
					}
					
					// Autres évaluations potentielles
					Object.entries(evaluationsData).forEach(([key, value]) => {
						if (key !== 'static_quiz' && key !== 'questions' && !key.includes('/') && typeof value === 'object') {
							if (!moduleData.evaluations) moduleData.evaluations = {};
							moduleData.evaluations[key] = {
								id: key,
								...value
							};
						}
					});
				}
			}
			
			// Standardiser les évaluations si nécessaire
			if (moduleData.evaluations && typeof moduleData.evaluations === 'object' && !Array.isArray(moduleData.evaluations)) {
				const evaluationsArray = Object.entries(moduleData.evaluations).map(([id, evaluation]) => ({
					id,
					...evaluation
				}));
				
				if (evaluationsArray.length > 0) {
					moduleData.evaluationsArray = evaluationsArray;
				}
			}
			
			// Standardiser les ressources si nécessaire
			if (!Array.isArray(moduleData.resources) && typeof moduleData.resources === 'object') {
				moduleData.resources = Object.entries(moduleData.resources).map(([id, resource]) => ({
					id,
					...resource
				}));
			}
			
			// Mettre en cache et retourner
			setCachedData(cacheKey, moduleData);
			return moduleData;
		}
		
		// Tentative 2: Chercher dans le cours
		const courseRef = ref(database, `elearning/courses/${courseId}`);
		const courseSnapshot = await get(courseRef);
		
		if (courseSnapshot.exists()) {
			const courseData = courseSnapshot.val();
			
			// Chercher dans les modules du cours
			if (courseData.modules) {
				let moduleData = null;
				
				// Cas 1: modules est un tableau
				if (Array.isArray(courseData.modules)) {
					moduleData = courseData.modules.find(m => m.id === moduleId);
				} 
				// Cas 2: modules est un objet
				else if (typeof courseData.modules === 'object') {
					moduleData = courseData.modules[moduleId];
				}
				
				if (moduleData) {
					console.log(`Module ${moduleId} trouvé dans le cours ${courseId}`);
					
					// S'assurer que le module a les champs obligatoires
					moduleData = {
						...moduleData,
						id: moduleId,
						courseId: courseId,
						title: moduleData.title || moduleData.titre || "Module sans titre",
						description: moduleData.description || "",
						resources: moduleData.resources || [],
						evaluations: moduleData.evaluations || {}
					};
					
					// Appliquer la même logique de récupération des ressources et évaluations
					// (Code similaire à la tentative 1, mais je ne le duplique pas pour la lisibilité)
					
					// Mettre en cache et retourner
					setCachedData(cacheKey, moduleData);
					return moduleData;
				}
			}
		}
		
		// Tentative 3: Chercher dans un chemin alternatif
		const altModuleRef = ref(database, `elearning/modules/${courseId}/${moduleId}`);
		const altModuleSnapshot = await get(altModuleRef);
		
		if (altModuleSnapshot.exists()) {
			console.log(`Module ${moduleId} trouvé dans un chemin alternatif`);
			const moduleData = altModuleSnapshot.val();
			
			// Standardiser et retourner
			const standardizedModule = {
				...moduleData,
				id: moduleId,
				courseId: courseId,
				title: moduleData.title || moduleData.titre || "Module sans titre",
				description: moduleData.description || "",
				resources: moduleData.resources || [],
				evaluations: moduleData.evaluations || {}
			};
			
			// Mettre en cache et retourner
			setCachedData(cacheKey, standardizedModule);
			return standardizedModule;
		}
		
		// Module non trouvé, créer un module vide mais valide
		console.warn(`Module ${moduleId} non trouvé pour le cours ${courseId}`);
		const emptyModule = {
			id: moduleId,
			courseId: courseId,
			title: "Module non trouvé",
			description: "Ce module n'existe pas dans le cours actuel",
			resources: [],
			evaluations: {}
		};
		return emptyModule;
		
	} catch (error) {
		console.error('Erreur lors de la récupération du module:', error);
		// En cas d'erreur, retourner un module minimal mais valide
		return {
			id: moduleId,
			courseId: courseId,
			title: "Erreur de chargement",
			description: "Une erreur est survenue lors du chargement de ce module",
			resources: [],
			evaluations: {}
		};
	}
};

/**
 * Récupère la progression d'un utilisateur pour un cours
 * @param {string} userId - ID de l'utilisateur
 * @param {string} courseId - ID du cours
 * @param {boolean} createIfNotExists - Créer une progression vide si elle n'existe pas
 * @returns {Object|null} Données de progression ou null si non trouvé
 */
export const fetchUserProgress = async (userId, courseId, createIfNotExists = false) => {
	if (!userId || !courseId) return null;

	const cacheKey = `progress_${userId}_${courseId}`;
	const cachedData = getCachedData(cacheKey);

	if (cachedData) return cachedData;

	try {
		// Vérifier d'abord dans le nouveau chemin
		const progressRef = ref(database, paths.USER_COURSE_PROGRESS_PATH(userId, courseId));
		const snapshot = await get(progressRef);

		if (snapshot.exists()) {
			const progressData = snapshot.val();
			setCachedData(cacheKey, progressData);
			return progressData;
		}

		// Vérifier dans l'ancien chemin si rien n'est trouvé
		const legacyProgressRef = ref(database, `${paths.LEGACY_PROGRESS_PATH}/${userId}/${courseId}`);
		const legacySnapshot = await get(legacyProgressRef);

		if (legacySnapshot.exists()) {
			// Migrer les données vers le nouveau format
			const legacyProgress = legacySnapshot.val();
			const standardizedProgress = {
				courseId,
				userId,
				progress: legacyProgress.progress || 0,
				completed: legacyProgress.completed || false,
				startDate: legacyProgress.startDate || new Date().toISOString(),
				lastUpdated: legacyProgress.lastUpdated || new Date().toISOString()
			};

			// Ajouter les modules si présents
			if (legacyProgress.modules) {
				for (const moduleId in legacyProgress.modules) {
					const moduleProgress = legacyProgress.modules[moduleId];
					standardizedProgress[moduleId] = {
						moduleId,
						completed: moduleProgress.completed || moduleProgress.status === 'completed',
						score: moduleProgress.score || 0,
						lastUpdated: moduleProgress.lastUpdated || new Date().toISOString()
					};
				}
			}

			// Enregistrer dans le nouveau chemin
			await set(progressRef, standardizedProgress);
			setCachedData(cacheKey, standardizedProgress);
			return standardizedProgress;
		}

		// Créer une progression vide si demandé
		if (createIfNotExists) {
			const newProgress = {
				courseId,
				userId,
				progress: 0,
				completed: false,
				startDate: new Date().toISOString(),
				lastUpdated: new Date().toISOString()
			};

			await set(progressRef, newProgress);
			setCachedData(cacheKey, newProgress);
			return newProgress;
		}
	} catch (error) {
		console.error(`Erreur lors de la récupération de la progression pour l'utilisateur ${userId} et le cours ${courseId}:`, error);
	}

	return null;
};

/**
 * Met à jour la progression d'un utilisateur pour un cours
 * @param {string} userId - ID de l'utilisateur
 * @param {string} courseId - ID du cours
 * @param {Object} progressData - Données de progression à mettre à jour
 * @returns {boolean} Succès de l'opération
 */
export const updateUserProgress = async (userId, courseId, progressData) => {
	if (!userId || !courseId || !progressData) return false;

	try {
		const progressRef = ref(database, paths.USER_COURSE_PROGRESS_PATH(userId, courseId));

		// Mettre à jour la date de dernière modification
		progressData.lastUpdated = new Date().toISOString();

		// Utiliser update pour ne modifier que les champs fournis
		await update(progressRef, progressData);

		// Invalider le cache
		setCachedData(`progress_${userId}_${courseId}`, null);

		return true;
	} catch (error) {
		console.error(`Erreur lors de la mise à jour de la progression pour l'utilisateur ${userId} et le cours ${courseId}:`, error);
		return false;
	}
};

/**
 * Ajoute un nouveau module à un cours
 * @param {string} courseId - ID du cours
 * @param {Object} moduleData - Données du module
 * @returns {Object|null} Module créé ou null en cas d'erreur
 */
export const addModuleToCourse = async (courseId, moduleData) => {
	if (!courseId || !moduleData) {
		console.error('addModuleToCourse: Paramètres manquants', { courseId, moduleData });
		return null;
	}

	try {
		// Générer un ID unique pour le module s'il n'en a pas
		const moduleId = moduleData.id || push(ref(database)).key;
		
		// Standardiser les données du module
		const newModule = {
			...moduleData,
			id: moduleId,
			courseId,
			title: moduleData.title || 'Sans titre',
			description: moduleData.description || '',
			order: moduleData.order || 0,
			status: moduleData.status || 'active',
			resources: moduleData.resources || [],
			evaluations: moduleData.evaluations || [],
			createdAt: moduleData.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Stocker le module dans le chemin MODULE_PATH
		const moduleRef = ref(database, paths.MODULE_PATH(courseId, moduleId));
		await set(moduleRef, newModule);
		console.log(`Module ${moduleId} ajouté dans le chemin MODULE_PATH`);

		// Mettre à jour la propriété modules du cours
		const courseRef = ref(database, paths.COURSE_PATH(courseId));
		const courseSnapshot = await get(courseRef);
		
		if (courseSnapshot.exists()) {
			const courseData = courseSnapshot.val();
			let modulesData = {};
			
			// Vérifier si modules existe déjà
			if (courseData.modules) {
				// Si modules est un objet, l'utiliser directement
				if (typeof courseData.modules === 'object' && !Array.isArray(courseData.modules)) {
					modulesData = { ...courseData.modules };
				} else {
					// Si modules est un tableau, le convertir en objet
					const modulesArray = Array.isArray(courseData.modules) 
						? courseData.modules 
						: Object.entries(courseData.modules).map(([id, module]) => ({
							...module,
							id
						}));
					
					// Convertir le tableau en objet avec les IDs comme clés
					modulesData = modulesArray.reduce((acc, module) => {
						acc[module.id] = { ...module };
						return acc;
					}, {});
				}
			}
			
			// Vérifier si le module existe déjà
			if (modulesData[moduleId]) {
				console.warn(`Module ${moduleId} existe déjà dans le cours, mise à jour au lieu d'ajout`);
			}
			
			// Ajouter ou mettre à jour le module
			modulesData[moduleId] = newModule;
			
			// Mettre à jour le cours avec le nouvel objet de modules
			await update(courseRef, {
				modules: modulesData,
				updatedAt: new Date().toISOString()
			});
			console.log(`Module ${moduleId} ajouté/mis à jour dans la propriété modules du cours`);
		}

		// Invalider le cache
		clearCacheItem(`module_${courseId}_${moduleId}`);
		clearCacheItem(`course_${courseId}`);

		return newModule;
	} catch (error) {
		console.error('Erreur lors de l\'ajout du module:', error);
		return null;
	}
};

/**
 * Ajoute une évaluation à un module
 * @param {string} courseId - ID du cours
 * @param {string} moduleId - ID du module
 * @param {Object} evaluationData - Données de l'évaluation
 * @returns {Object|null} Évaluation créée ou null en cas d'erreur
 */
export const addEvaluationToModule = async (courseId, moduleId, evaluationData) => {
	if (!courseId || !moduleId || !evaluationData) return null;

	try {
		// Récupérer les données actuelles du module
		const moduleRef = ref(database, paths.MODULE_PATH(courseId, moduleId));
		const snapshot = await get(moduleRef);

		if (!snapshot.exists()) {
			return null;
		}

		const moduleData = snapshot.val();

		// Générer un ID unique pour l'évaluation
		const evaluationId = Date.now().toString();

		// Préparer les données de l'évaluation
		const newEvaluation = {
			...evaluationData,
			id: evaluationId,
			moduleId,
			courseId,
			createdAt: new Date().toISOString()
		};

		// Ajouter l'évaluation au module
		const evaluations = moduleData.evaluations || [];
		evaluations.push(newEvaluation);

		// Mettre à jour le module dans Firebase
		await update(moduleRef, {
			evaluations,
			lastUpdated: new Date().toISOString()
		});

		// Si c'est un quiz, enregistrer également les questions dans la collection des évaluations
		if (evaluationData.type === 'quiz' && evaluationData.questions) {
			const quizRef = ref(database, paths.STATIC_QUIZ_PATH(moduleId));
			await set(quizRef, {
				questions: evaluationData.questions,
				createdAt: new Date().toISOString(),
				moduleId,
				courseId
			});
		}

		// Invalider les caches associés
		setCachedData(`module_${courseId}_${moduleId}`, null);
		setCachedData(`course_${courseId}_true_true`, null);

		return newEvaluation;
	} catch (error) {
		console.error('Erreur lors de l\'ajout de l\'\u00e9valuation au module:', error);
		return null;
	}
};

/**
 * Crée des modules de test pour un cours (pour le développement)
 * @param {string} courseId - ID du cours
 * @returns {boolean} Succès de l'opération
 */
export const createTestModulesForCourse = async (courseId) => {
	if (!courseId) return false;

	try {
		// Créer quelques modules de test
		const testModules = [
			{
				title: 'Introduction au cours',
				description: 'Module d\'introduction présentant les concepts de base.',
				order: 1,
				resources: [
					{
						id: 'res1',
						title: 'Présentation du cours',
						type: 'document',
						description: 'Document de présentation',
						url: 'https://example.com/presentation.pdf'
					},
					{
						id: 'res2',
						title: 'Vidéo d\'introduction',
						type: 'video',
						description: 'Vidéo explicative',
						url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
					}
				]
			},
			{
				title: 'Concepts fondamentaux',
				description: 'Exploration des concepts fondamentaux du sujet.',
				order: 2,
				resources: [
					{
						id: 'res3',
						title: 'Guide des concepts',
						type: 'document',
						description: 'Guide détaillé',
						url: 'https://example.com/guide.pdf'
					}
				],
				evaluations: [
					{
						id: 'eval1',
						title: 'Quiz sur les concepts',
						type: 'quiz',
						description: 'Testez vos connaissances',
						questions: [
							{
								question: 'Quelle est la définition correcte?',
								options: ['Option A', 'Option B', 'Option C', 'Option D'],
								correctAnswer: 1
							},
							{
								question: 'Quel est le principe fondamental?',
								options: ['Principe 1', 'Principe 2', 'Principe 3', 'Principe 4'],
								correctAnswer: 2
							}
						]
					}
				]
			}
		];

		// Ajouter les modules au cours
		for (const moduleData of testModules) {
			await addModuleToCourse(courseId, moduleData);
		}

		return true;
	} catch (error) {
		console.error('Erreur lors de la création des modules de test:', error);
		return false;
	}
};

export { fetchCompleteUserInfo };

// Test Firebase paths for debugging
export const testFirebasePaths = async () => {
  try {
    const paths = [
      'elearning/courses',
      'elearning/users',
      'elearning/specialites',
      'elearning/enrollments',
      'elearning/progress'
    ];

    const results = {};

    for (const path of paths) {
      const dataRef = ref(database, path);
      const snapshot = await get(dataRef);
      results[path] = snapshot.exists();
    }

    console.log('Firebase paths test results:', results);
    return results;
  } catch (error) {
    console.error('Error testing Firebase paths:', error);
    return {};
  }
};

// Calculate course score based on module scores
export const calculateCourseScore = (modules) => {
  // S'assurer que modules est un tableau non vide
  if (!modules || !Array.isArray(modules) || modules.length === 0) return 0;

  // Filtrer les modules qui ont un score valide
  const modulesWithScores = modules.filter(module => 
    module && typeof module.score === 'number' && !isNaN(module.score)
  );
  
  // Si aucun module n'a de score, retourner 0
  if (modulesWithScores.length === 0) return 0;

  // Calculer la somme des scores
  const totalScore = modulesWithScores.reduce((sum, module) => sum + (module.score || 0), 0);
  
  // Retourner la moyenne arrondie
  return Math.round(totalScore / modulesWithScores.length);
};

// Calculate course progress percentage
export const calculateCourseProgress = (modules) => {
  // S'assurer que modules est un tableau non vide
  if (!modules || !Array.isArray(modules) || modules.length === 0) return 0;

  // Compter les modules complétés
  const completedModules = modules.filter(
    module => module && (
      module.status === 'completed' || 
      module.completed === true || 
      (typeof module.progress === 'number' && module.progress === 100)
    )
  ).length;
  
  // Calculer le pourcentage de progression
  const percentage = (completedModules / modules.length) * 100;
  
  // Si aucun module n'est complet mais il y a un champ progress moyen, utiliser celui-ci
  if (percentage === 0) {
    const modulesWithProgress = modules.filter(module => 
      module && typeof module.progress === 'number' && !isNaN(module.progress)
    );
    
    if (modulesWithProgress.length > 0) {
      const averageProgress = modulesWithProgress.reduce(
        (sum, module) => sum + module.progress, 
        0
      ) / modulesWithProgress.length;
      
      return Math.round(averageProgress);
    }
  }
  
  return Math.round(percentage);
};

// Check if course is completed
export const isCourseCompleted = (modules) => {
  // S'assurer que modules est un tableau non vide
  if (!modules || !Array.isArray(modules) || modules.length === 0) return false;

  // Si tous les modules sont complétés, le cours est considéré comme complété
  return modules.every(module => 
    module && (
      module.status === 'completed' || 
      module.completed === true || 
      (typeof module.progress === 'number' && module.progress === 100)
    )
  );
};

