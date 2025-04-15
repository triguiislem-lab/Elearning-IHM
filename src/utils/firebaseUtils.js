import { database } from '../../firebaseConfig';
import { ref, get, set, update, onValue, push } from 'firebase/database';
import { fetchCompleteUserInfo } from './fetchCompleteUserInfo';
import { getCachedData, setCachedData, clearCacheItem } from './cacheUtils';
import * as paths from './firebasePaths';
import { migrateAllData } from './migrationUtils';
import { getDatabase } from 'firebase/database';

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

/**
 * Récupère tous les utilisateurs depuis la base de données
 * @param {boolean} includeArchived - Inclure les utilisateurs archivés (false par défaut)
 * @returns {Promise<Array>} Liste des utilisateurs
 */
export const fetchUsersFromDatabase = async (includeArchived = false) => {
	const cacheKey = includeArchived ? 'all_users_with_archived' : 'all_users';
	const cachedData = getCachedData(cacheKey);

	if (cachedData) return cachedData;

	// Récupérer tous les utilisateurs
	const users = await fetchDataFromPath(paths.USERS_PATH);

	// Filtrer les utilisateurs archivés si nécessaire
	const filteredUsers = includeArchived
		? users
		: users.filter(user => !user.archived);

	// Mettre en cache
	setCachedData(cacheKey, filteredUsers);
	return filteredUsers;
};

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
 * @param {boolean} includeArchived - Inclure les cours archivés (false par défaut)
 * @returns {Array} Liste des cours
 */
export const fetchCoursesFromDatabase = async (withInstructors = true, includeArchived = false) => {
	const cacheKey = `all_courses_${withInstructors ? 'with_instructors' : 'basic'}_${includeArchived ? 'with_archived' : 'active_only'}`;
	const cachedData = getCachedData(cacheKey);

	if (cachedData) return cachedData;

	const result = await fetchDataFromPath(paths.COURSES_PATH);

	if (result && result.length > 0) {
		// Filtrer les cours archivés si nécessaire
		let filteredCourses = includeArchived
			? result
			: result.filter(course => !course.archived);

		let coursesData = filteredCourses;

		// Ajouter les détails des instructeurs si demandé
		if (withInstructors) {
			coursesData = await Promise.all(
				filteredCourses.map(async (course) => {
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
export const fetchSpecialitesFromDatabase = async (includeArchived = true, forceRefresh = false) => {
	console.log("Début de fetchSpecialitesFromDatabase");
	console.log("Tentative de récupération depuis le chemin principal:", paths.SPECIALTIES_PATH);

	// Clear cache if force refresh is requested
	if (forceRefresh) {
		console.log("Force refresh requested, clearing cache");
		clearCacheItem('specialites');
		clearCacheItem('specialites_with_archived');
		clearCacheItem('specialites_without_archived');
	}

	// Check cache first
	const cacheKey = includeArchived ? 'specialites_with_archived' : 'specialites_without_archived';
	const cachedData = getCachedData(cacheKey);

	if (cachedData && !forceRefresh) {
		console.log("Returning cached specialites data");
		return cachedData;
	}

	try {
		// Récupérer depuis Firebase
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
				...data,
				name: data.name || data.description || "Sans nom",
				description: data.description || "",
				createdAt: data.createdAt || new Date().toISOString(),
				updatedAt: data.updatedAt || new Date().toISOString(),
			}));

			console.log("Retour des spécialités du chemin legacy:", legacySpecialites);
			const result = includeArchived ? legacySpecialites : legacySpecialites.filter(s => !s.archived);

			// Store in cache
			setCachedData(cacheKey, result);
			return result;
		}

		const specialites = Object.entries(snapshot.val()).map(([id, data]) => ({
			id,
			...data,
			name: data.name || data.description || "Sans nom",
			description: data.description || "",
			createdAt: data.createdAt || new Date().toISOString(),
			updatedAt: data.updatedAt || new Date().toISOString(),
		}));

		console.log("Retour des spécialités trouvées:", specialites);
		const result = includeArchived ? specialites : specialites.filter(s => !s.archived);

		// Store in cache
		setCachedData(cacheKey, result);
		return result;
	} catch (error) {
		console.error("Erreur lors de la récupération des spécialités:", error);
		return [];
	}
};

// Fetch disciplines
export const fetchDisciplinesFromDatabase = async (forceRefresh = false) => {
	console.log("Début de fetchDisciplinesFromDatabase");
	console.log("Tentative de récupération depuis le chemin principal:", paths.DISCIPLINES_PATH);

	// Clear cache if force refresh is requested
	if (forceRefresh) {
		console.log("Force refresh requested, clearing cache");
		clearCacheItem('disciplines');
	}

	// Check cache first
	const cacheKey = 'disciplines';
	const cachedData = getCachedData(cacheKey);

	if (cachedData && !forceRefresh) {
		console.log("Returning cached disciplines data");
		return cachedData;
	}

	try {
		// Récupérer depuis Firebase
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
			// Store in cache
			setCachedData(cacheKey, legacyDisciplines);
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
		// Store in cache
		setCachedData(cacheKey, disciplines);
		return disciplines;
	} catch (error) {
		console.error("Erreur lors de la récupération des disciplines:", error);
		return [];
	}
};

/**
 * Fonction pour récupérer un cours par son ID
 * @param {string} courseId - ID du cours
 * @param {boolean} includeModules - Inclure les modules du cours
 * @param {boolean} includeInstructor - Inclure les détails de l'instructeur
 * @returns {Object|null} Détails du cours ou null si non trouvé
 */
export const fetchCourseById = async (
	courseId,
	includeModules = false,
	includeInstructor = false
) => {
	if (!courseId) return null;

	const database = getDatabase();
	const cacheKey = `course_${courseId}_${includeInstructor}_${includeModules}`;
	const cachedData = getCachedData(cacheKey);

	if (cachedData) {
		return cachedData;
	}

	try {
		// Vérifier d'abord le nouveau chemin
		let courseRef = ref(database, `elearning/courses/${courseId}`);
		let snapshot = await get(courseRef);

		// Si non trouvé, vérifier l'ancien chemin
		if (!snapshot.exists()) {
			courseRef = ref(database, `Elearning/Cours/${courseId}`);
			snapshot = await get(courseRef);
		}

		if (snapshot.exists()) {
			const courseData = snapshot.val();

			// Ajouter une date de création par défaut si elle n'existe pas
			if (!courseData.createdAt) {
				// Utiliser updatedAt en priorité, sinon une date par défaut (30 jours avant aujourd'hui)
				const defaultDate = new Date();
				defaultDate.setDate(defaultDate.getDate() - 30);

				courseData.createdAt = courseData.updatedAt || defaultDate.toISOString();
			}

			// S'assurer que l'ID est inclus
			const course = { id: courseId, ...courseData };

			// Récupérer les données de l'instructeur si demandé
			if (includeInstructor && course.instructorId) {
				try {
					course.instructor = await fetchInstructorById(course.instructorId);
				} catch (error) {
					console.error("Erreur lors de la récupération de l'instructeur:", error);
				}
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

			// Si les modules sont demandés mais ne sont pas disponibles, initialiser un tableau vide
			if (includeModules) {
				if (course.modules && typeof course.modules === 'object') {
					// Convertir l'objet modules en tableau
					course.modules = Object.entries(course.modules).map(([moduleId, moduleData]) => ({
						id: moduleId,
						courseId,
						...moduleData
					}));

					// Trier les modules par ordre si disponible
					course.modules.sort((a, b) => (a.order || 0) - (b.order || 0));
				} else {
					course.modules = [];
				}
			}

			setCachedData(cacheKey, course);
			return course;
		}

		return null;
	} catch (error) {
		console.error("Erreur lors de la récupération du cours:", error);
		throw error;
	}
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

		// Rechercher le module dans le chemin standardisé
		const moduleRef = ref(database, `elearning/courses/${courseId}/modules/${moduleId}`);
		const snapshot = await get(moduleRef);

		if (snapshot.exists()) {
			console.log(`Module ${moduleId} trouvé`);
			const moduleData = snapshot.val();

			// S'assurer que le module a les champs obligatoires
			const standardizedModule = {
				...moduleData,
				id: moduleId,
				courseId: courseId,
				title: moduleData.title || moduleData.titre || "Module sans titre",
				description: moduleData.description || "",
				resources: moduleData.resources || [],
				evaluations: moduleData.evaluations || {}
			};

			// Standardiser les évaluations si nécessaire
			if (standardizedModule.evaluations && typeof standardizedModule.evaluations === 'object' && !Array.isArray(standardizedModule.evaluations)) {
				standardizedModule.evaluations = Object.entries(standardizedModule.evaluations).map(([id, evaluation]) => ({
					id,
					...evaluation
				}));
			}

			// Standardiser les ressources si nécessaire
			if (!Array.isArray(standardizedModule.resources) && typeof standardizedModule.resources === 'object') {
				standardizedModule.resources = Object.entries(standardizedModule.resources).map(([id, resource]) => ({
					id,
					...resource
				}));
			}

			// Mettre en cache et retourner
			setCachedData(cacheKey, standardizedModule);
			return standardizedModule;
		}

		// Module non trouvé
		console.warn(`Module ${moduleId} non trouvé pour le cours ${courseId}`);
		return null;

	} catch (error) {
		console.error('Erreur lors de la récupération du module:', error);
		return null;
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
 * @param {string} [instructorId] - ID de l'instructeur (facultatif)
 * @returns {string|null} ID du module créé ou null en cas d'erreur
 */
export const addModuleToCourse = async (courseId, moduleData, instructorId = null) => {
	if (!courseId || !moduleData) {
		console.error('addModuleToCourse: Paramètres manquants', { courseId, moduleData });
		return null;
	}

	try {
		// Générer un ID unique temporaire pour le module s'il n'en a pas
		const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
		const moduleId = moduleData.id || tempId;

		// Standardiser les données du module
		const newModule = {
			...moduleData,
			id: moduleId,
			courseId,
			title: moduleData.title || 'Sans titre',
			description: moduleData.description || '',
			order: moduleData.order || 0,
			status: moduleData.status || 'active',
			createdAt: moduleData.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Normaliser les ressources
		if (!newModule.resources) {
			newModule.resources = [];
		} else if (typeof newModule.resources === 'object' && !Array.isArray(newModule.resources)) {
			newModule.resources = Object.entries(newModule.resources).map(([id, resource]) => ({
				id,
				...resource,
				title: resource.title || `Ressource ${id}`
			}));
		}

		// Normaliser les évaluations
		if (!newModule.evaluations) {
			newModule.evaluations = [];
		} else if (typeof newModule.evaluations === 'object' && !Array.isArray(newModule.evaluations)) {
			newModule.evaluations = Object.entries(newModule.evaluations).map(([id, evaluation]) => ({
				id,
				...evaluation,
				title: evaluation.title || `Évaluation ${id}`
			}));
		}

		console.log(`Ajout du module ${moduleId} au cours ${courseId}`);

		// Stocker le module dans le chemin standardisé
		const moduleRef = ref(database, `elearning/courses/${courseId}/modules/${moduleId}`);
		await set(moduleRef, newModule);
		console.log(`Module ${moduleId} ajouté dans le chemin standardisé`);

		// Invalider le cache
		clearCacheItem(`module_${courseId}_${moduleId}`);
		clearCacheItem(`course_${courseId}`);
		clearCacheItem(`course_${courseId}_true_true`);

		return moduleId;
	} catch (error) {
		console.error(`Erreur lors de l'ajout du module: ${error.message}`);
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
		const moduleRef = ref(database, `elearning/courses/${courseId}/modules/${moduleId}`);
		const snapshot = await get(moduleRef);

		if (!snapshot.exists()) {
			console.error(`Module ${moduleId} non trouvé lors de l'ajout d'évaluation`);
			return null;
		}

		const moduleData = snapshot.val();
		
		// Générer un ID unique pour l'évaluation
		const evaluationId = evaluationData.id || `eval_${Date.now()}_${Math.random().toString(36).substring(2)}`;

		// Préparer les données de l'évaluation
		const newEvaluation = {
			...evaluationData,
			id: evaluationId,
			moduleId,
			courseId,
			createdAt: evaluationData.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// Déterminer comment stocker l'évaluation selon la structure actuelle
		let updatedEvaluations;
		
		if (moduleData.evaluations) {
			// Si evaluations est un tableau
			if (Array.isArray(moduleData.evaluations)) {
				// Filtrer les évaluations existantes si l'ID existe déjà
				updatedEvaluations = moduleData.evaluations.filter(
					(evaluation) => evaluation.id !== evaluationId
				);
				// Ajouter la nouvelle évaluation
				updatedEvaluations.push(newEvaluation);
			} 
			// Si evaluations est un objet
			else if (typeof moduleData.evaluations === 'object') {
				updatedEvaluations = { 
					...moduleData.evaluations,
					[evaluationId]: newEvaluation 
				};
			} 
			// Si c'est autre chose, créer un nouveau tableau
			else {
				updatedEvaluations = [newEvaluation];
			}
		} 
		// Si evaluations n'existe pas, créer un nouveau tableau
		else {
			updatedEvaluations = [newEvaluation];
		}

		console.log(`Mise à jour du module ${moduleId} avec la nouvelle évaluation ${evaluationId}`);
		
		// Mettre à jour le module dans Firebase
		await update(moduleRef, {
			evaluations: updatedEvaluations,
			updatedAt: new Date().toISOString()
		});

		// Invalider les caches associés
		clearCacheItem(`module_${courseId}_${moduleId}`);
		clearCacheItem(`course_${courseId}`);
		clearCacheItem(`course_${courseId}_true_true`);

		return newEvaluation;
	} catch (error) {
		console.error(`Erreur lors de l'ajout de l'évaluation au module: ${error.message}`);
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
  // Handle case where modules is undefined or null
  if (!modules) return 0;

  // Handle both array and object formats
  let moduleArray = [];

  if (Array.isArray(modules)) {
    moduleArray = modules;
  } else if (typeof modules === 'object') {
    // Convert object to array, skipping boolean values
    moduleArray = Object.entries(modules)
      .filter(([_, module]) => typeof module !== 'boolean')
      .map(([id, module]) => ({ id, ...module }));
  } else {
    return 0;
  }

  // If no valid modules, return 0
  if (moduleArray.length === 0) return 0;

  // Filtrer les modules qui ont un score valide
  const modulesWithScores = moduleArray.filter(module =>
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
  // Handle case where modules is undefined or null
  if (!modules) return 0;

  // Handle both array and object formats
  let moduleArray = [];

  if (Array.isArray(modules)) {
    moduleArray = modules;
  } else if (typeof modules === 'object') {
    // Convert object to array, skipping boolean values
    moduleArray = Object.entries(modules)
      .filter(([_, module]) => typeof module !== 'boolean')
      .map(([id, module]) => ({ id, ...module }));
  } else {
    return 0;
  }

  // If no valid modules, return 0
  if (moduleArray.length === 0) return 0;

  // Compter les modules complétés
  const completedModules = moduleArray.filter(
    module => module && (
      module.status === 'completed' ||
      module.completed === true ||
      (typeof module.progress === 'number' && module.progress === 100)
    )
  ).length;

  // Calculer le pourcentage de progression
  const percentage = (completedModules / moduleArray.length) * 100;

  // Si aucun module n'est complet mais il y a un champ progress moyen, utiliser celui-ci
  if (percentage === 0) {
    const modulesWithProgress = moduleArray.filter(module =>
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
  // Handle case where modules is undefined or null
  if (!modules) return false;

  // Handle both array and object formats
  let moduleArray = [];

  if (Array.isArray(modules)) {
    moduleArray = modules;
  } else if (typeof modules === 'object') {
    // Convert object to array, skipping boolean values
    moduleArray = Object.entries(modules)
      .filter(([_, module]) => typeof module !== 'boolean')
      .map(([id, module]) => ({ id, ...module }));
  } else {
    return false;
  }

  // If no valid modules, return false
  if (moduleArray.length === 0) return false;

  // Si tous les modules sont complétés, le cours est considéré comme complété
  return moduleArray.every(module =>
    module && (
      module.status === 'completed' ||
      module.completed === true ||
      (typeof module.progress === 'number' && module.progress === 100)
    )
  );
};

/**
 * Récupère des statistiques agrégées pour l'affichage sur la page d'accueil
 * @returns {Object} Statistiques agrégées (formateurs, cours, étudiants, heures)
 */
export const fetchStatisticsForHomepage = async () => {
	try {
		// Forcer un rechargement en effaçant le cache
		const cacheKey = 'homepage_statistics';
		clearCacheItem(cacheKey);

		console.log("Récupération des statistiques pour la page d'accueil...");

		// Récupérer tous les utilisateurs pour compter les formateurs et étudiants
		// Vérifier d'abord les nouveaux chemins
		let users = await fetchUsersFromDatabase();
		let instructorsCount = 0;
		let studentsCount = 0;

		console.log(`Nombre d'utilisateurs trouvés: ${users.length}`);

		// Si aucun utilisateur n'est trouvé dans le nouveau chemin, vérifier les anciens chemins
		if (!users || users.length === 0) {
			try {
				console.log("Aucun utilisateur trouvé dans le nouveau chemin, vérification des anciens chemins");
				// Vérifier dans Elearning/Utilisateurs
				const legacyUsersRef = ref(database, 'Elearning/Utilisateurs');
				const legacySnapshot = await get(legacyUsersRef);

				if (legacySnapshot.exists()) {
					users = Object.entries(legacySnapshot.val()).map(([id, userData]) => ({
						id,
						...userData
					}));
					console.log(`${users.length} utilisateurs trouvés dans l'ancien chemin`);
				}

				// Vérifier aussi spécifiquement les formateurs
				const legacyFormateursRef = ref(database, 'Elearning/Formateurs');
				const legacyFormateursSnapshot = await get(legacyFormateursRef);

				if (legacyFormateursSnapshot.exists()) {
					const formateurs = Object.entries(legacyFormateursSnapshot.val()).map(([id, userData]) => ({
						id,
						...userData,
						role: 'formateur',
						userType: 'formateur'
					}));
					console.log(`${formateurs.length} formateurs trouvés dans l'ancien chemin`);
					instructorsCount += formateurs.length;

					// Fusionner avec les utilisateurs existants
					users = [...users, ...formateurs];
				}

				// Vérifier aussi spécifiquement les apprenants
				const legacyApprenantsRef = ref(database, 'Elearning/Apprenants');
				const legacyApprenantsSnapshot = await get(legacyApprenantsRef);

				if (legacyApprenantsSnapshot.exists()) {
					const apprenants = Object.entries(legacyApprenantsSnapshot.val()).map(([id, userData]) => ({
						id,
						...userData,
						role: 'student',
						userType: 'apprenant'
					}));
					console.log(`${apprenants.length} apprenants trouvés dans l'ancien chemin`);
					studentsCount += apprenants.length;

					// Fusionner avec les utilisateurs existants
					users = [...users, ...apprenants];
				}
			} catch (error) {
				console.error("Erreur lors de la récupération des utilisateurs dans les anciens chemins:", error);
			}
		}

		// Compter les formateurs et étudiants depuis les utilisateurs récupérés
		instructorsCount += users.filter(user =>
			user.role === 'instructor' ||
			user.role === 'formateur' ||
			user.userType === 'formateur'
		).length;

		studentsCount += users.filter(user =>
			user.role === 'student' ||
			user.role === 'etudiant' ||
			user.userType === 'etudiant' ||
			user.userType === 'apprenant'
		).length;

		console.log(`Nombre de formateurs trouvés: ${instructorsCount}`);
		console.log(`Nombre d'étudiants trouvés: ${studentsCount}`);

		// Récupérer tous les cours
		let courses = await fetchCoursesFromDatabase(false);
		let coursesCount = 0;

		if (courses && courses.length > 0) {
			coursesCount = courses.length;
			console.log(`${courses.length} cours trouvés dans le nouveau chemin`);
		}

		// Si aucun cours n'est trouvé, vérifier les anciens chemins
		if (!courses || courses.length === 0) {
			try {
				console.log("Vérification des cours dans les anciens chemins");
				// Vérifier dans Elearning/Cours
				const legacyCoursesRef = ref(database, 'Elearning/Cours');
				const legacySnapshot = await get(legacyCoursesRef);

				if (legacySnapshot.exists()) {
					const legacyCourses = Object.entries(legacySnapshot.val()).map(([id, courseData]) => ({
						id,
						...courseData
					}));
					console.log(`${legacyCourses.length} cours trouvés dans l'ancien chemin`);
					coursesCount += legacyCourses.length;
					courses = legacyCourses;
				}

				// Vérifier aussi dans Elearning/Formations
				const legacyFormationsRef = ref(database, 'Elearning/Formations');
				const legacyFormationsSnapshot = await get(legacyFormationsRef);

				if (legacyFormationsSnapshot.exists()) {
					const formations = Object.entries(legacyFormationsSnapshot.val()).map(([id, formationData]) => ({
						id,
						...formationData
					}));
					console.log(`${formations.length} formations trouvées dans l'ancien chemin`);
					coursesCount += formations.length;

					// Fusionner avec les cours existants
					courses = [...courses, ...formations];
				}
			} catch (error) {
				console.error("Erreur lors de la récupération des cours dans les anciens chemins:", error);
			}
		}

		console.log(`Nombre total de cours: ${coursesCount}`);

		// Calculer le nombre total d'heures de contenu
		let totalHours = 0;

		if (courses && courses.length > 0) {
			for (const course of courses) {
				// Extraire le nombre d'heures à partir du champ duration
				if (course.duration) {
					// Si la durée est au format "X heures"
					const match = course.duration.match(/(\d+)/);
					if (match && match[1]) {
						totalHours += parseInt(match[1], 10);
					}
				} else if (course.duree) {
					// Si c'est un nombre direct
					if (typeof course.duree === 'number') {
						totalHours += course.duree;
					} else {
						// Si c'est une chaîne, essayer de la convertir
						const hours = parseInt(course.duree, 10);
						if (!isNaN(hours)) {
							totalHours += hours;
						}
					}
				}

				// Vérifier aussi les modules pour les heures
				if (course.modules && typeof course.modules === 'object') {
					let modules = [];

					// Convertir les modules en tableau s'ils sont stockés comme un objet
					if (Array.isArray(course.modules)) {
						modules = course.modules;
					} else {
						modules = Object.values(course.modules);
					}

					// Parcourir les modules pour trouver des durées
					for (const module of modules) {
						if (module && module.duration) {
							const moduleMatch = module.duration.match(/(\d+)/);
							if (moduleMatch && moduleMatch[1]) {
								totalHours += parseInt(moduleMatch[1], 10);
							}
						} else if (module && module.duree) {
							if (typeof module.duree === 'number') {
								totalHours += module.duree;
							} else {
								const hours = parseInt(module.duree, 10);
								if (!isNaN(hours)) {
									totalHours += hours;
								}
							}
						}
					}
				}
			}
		}

		// Arrondir le nombre total d'heures
		totalHours = Math.round(totalHours);
		console.log(`Nombre total d'heures de contenu: ${totalHours}`);

		// Préparer l'objet de statistiques avec les vraies données
		const statistics = {
			instructorsCount,
			coursesCount,
			studentsCount,
			totalHours
		};

		console.log("Statistiques finales:", statistics);

		return statistics;
	} catch (error) {
		console.error('Erreur lors de la récupération des statistiques:', error);

		// Retourner des statistiques vides en cas d'erreur
		return {
			instructorsCount: 0,
			coursesCount: 0,
			studentsCount: 0,
			totalHours: 0
		};
	}
};

/**
 * Récupère les témoignages d'étudiants depuis la base de données
 * @param {number} limit - Nombre maximum de témoignages à récupérer (0 pour tous)
 * @returns {Array} Liste des témoignages
 */
export const fetchTestimonialsFromDatabase = async (limit = 0) => {
	try {
		// Vérifier le cache
		const cacheKey = `testimonials_${limit}`;

		// Forcer un rechargement
		clearCacheItem(cacheKey);

		const cachedTestimonials = getCachedData(cacheKey);
		if (cachedTestimonials) {
			return cachedTestimonials;
		}

		console.log("Récupération des témoignages...");

		let allTestimonials = [];

		// 1. PRIORITÉ: Récupérer d'abord les feedbacks des cours
		try {
			console.log("Récupération des feedbacks des cours...");
			// Récupérer tous les cours
			const courses = await fetchCoursesFromDatabase(false);
			console.log(`${courses.length} cours trouvés pour rechercher des feedbacks`);

			// Chemins possibles pour les feedbacks des cours
			const feedbackPaths = [
				'elearning/feedback/courses',
				'Elearning/Feedback',
				'feedback/courses'
			];

			let coursesFeedbacks = [];

			// Pour chaque cours, rechercher des feedbacks dans différents chemins
			for (const course of courses) {
				if (course.id) {
					// Essayer tous les chemins possibles pour ce cours
					for (const basePath of feedbackPaths) {
						try {
							const feedbackRef = ref(database, `${basePath}/${course.id}`);
							const snapshot = await get(feedbackRef);

							if (snapshot.exists()) {
								const feedbacks = snapshot.val();

								// Convertir les feedbacks en témoignages
								const courseTestimonials = Object.entries(feedbacks)
									.map(([userId, feedback]) => {
										// Ne garder que les feedbacks avec des commentaires intéressants
										if (feedback &&
											feedback.comment &&
											feedback.comment.trim() !== '' &&
											feedback.comment.length > 15) {

											return {
												id: `${course.id}_${userId}`,
												name: feedback.userName || feedback.name || 'Étudiant',
												role: feedback.userRole || feedback.role || 'Apprenant',
												comment: feedback.comment,
												rating: feedback.rating || 5,
												courseId: course.id,
												courseName: feedback.courseName || course.title || course.titre || 'Cours',
												// Ajouter un avatar par défaut ou utiliser celui fourni
												avatar: feedback.userAvatar || feedback.avatar ||
													"https://ui-avatars.com/api/?name=" + encodeURIComponent(feedback.userName || feedback.name || 'Étudiant') + "&background=random"
											};
										}
										return null;
									})
									.filter(item => item !== null);

								if (courseTestimonials.length > 0) {
									console.log(`${courseTestimonials.length} témoignages trouvés pour le cours ${course.id}`);
									coursesFeedbacks = [...coursesFeedbacks, ...courseTestimonials];
								}
							}
						} catch (error) {
							console.error(`Erreur lors de la récupération des feedbacks depuis ${basePath}/${course.id}:`, error);
						}
					}
				}
			}

			if (coursesFeedbacks.length > 0) {
				console.log(`Total de ${coursesFeedbacks.length} feedbacks de cours trouvés`);
				allTestimonials = [...allTestimonials, ...coursesFeedbacks];
			}
		} catch (error) {
			console.error('Erreur lors de la récupération des feedbacks des cours:', error);
		}

		// 2. SECONDAIRE: Chemins à vérifier pour les témoignages généraux
		const paths = [
			'elearning/testimonials',
			'Elearning/Testimonials',
			'elearning/feedback/general',
			'Elearning/Feedback/general'
		];

		// Parcourir tous les chemins
		for (const path of paths) {
			try {
				const testimonialsRef = ref(database, path);
				const snapshot = await get(testimonialsRef);

				if (snapshot.exists()) {
					const data = snapshot.val();

					// Le format peut varier selon le chemin
					if (Array.isArray(data)) {
						// Si c'est un tableau
						console.log(`${data.length} témoignages trouvés dans un tableau à ${path}`);
						allTestimonials = [...allTestimonials, ...data];
					} else if (typeof data === 'object') {
						// Si c'est un objet, il peut y avoir différentes structures

						// Format 1: { id1: { ... }, id2: { ... } }
						const testimonials = Object.entries(data).map(([id, testimonial]) => {
							// Vérifier si c'est un témoignage complet ou une collection par cours
							if (testimonial.comment || testimonial.name || testimonial.rating) {
								// C'est un témoignage
								return {
									id,
									...testimonial,
									// Normaliser les champs
									name: testimonial.name || testimonial.userName || 'Étudiant',
									role: testimonial.role || testimonial.userRole || 'Étudiant',
									comment: testimonial.comment || testimonial.text || testimonial.message || '',
									rating: testimonial.rating || 5,
									// Ajouter un avatar par défaut si nécessaire
									avatar: testimonial.avatar || testimonial.userAvatar ||
										"https://ui-avatars.com/api/?name=" + encodeURIComponent(testimonial.name || testimonial.userName || 'Étudiant') + "&background=random"
								};
							} else if (typeof testimonial === 'object') {
								// C'est une collection de témoignages par cours ou par utilisateur
								const subTestimonials = Object.entries(testimonial).map(([subId, subTestimonial]) => {
									return {
										id: `${id}_${subId}`,
										...subTestimonial,
										// Normaliser les champs
										name: subTestimonial.name || subTestimonial.userName || 'Étudiant',
										role: subTestimonial.role || subTestimonial.userRole || 'Étudiant',
										comment: subTestimonial.comment || subTestimonial.text || subTestimonial.message || '',
										rating: subTestimonial.rating || 5,
										// Ajouter un avatar par défaut si nécessaire
										avatar: subTestimonial.avatar || subTestimonial.userAvatar ||
											"https://ui-avatars.com/api/?name=" + encodeURIComponent(subTestimonial.name || subTestimonial.userName || 'Étudiant') + "&background=random"
									};
								});
								return subTestimonials;
							}
							return null;
						})
						.filter(item => item !== null)
						.flat();

						if (testimonials.length > 0) {
							console.log(`${testimonials.length} témoignages trouvés dans un objet à ${path}`);
							allTestimonials = [...allTestimonials, ...testimonials];
						}
					}
				}
			} catch (error) {
				console.error(`Erreur lors de la récupération des témoignages depuis ${path}:`, error);
			}
		}

		console.log(`Total de ${allTestimonials.length} témoignages récupérés avant filtrage`);

		// Filtrer les témoignages avec des commentaires trop courts
		allTestimonials = allTestimonials.filter(testimonial =>
			testimonial.comment &&
			testimonial.comment.trim().length > 15
		);

		// Filtrer les doublons basés sur l'ID
		const uniqueTestimonials = Array.from(
			new Map(allTestimonials.map(item => [item.id, item])).values()
		);

		// Trier par note (les meilleures notes d'abord)
		const sortedTestimonials = uniqueTestimonials.sort((a, b) => {
			// D'abord par note
			const ratingDiff = (b.rating || 5) - (a.rating || 5);
			if (ratingDiff !== 0) return ratingDiff;

			// Ensuite par longueur de commentaire (les plus longs d'abord)
			return (b.comment?.length || 0) - (a.comment?.length || 0);
		});

		// Limiter le nombre de témoignages si demandé
		const limitedTestimonials = limit > 0 ? sortedTestimonials.slice(0, limit) : sortedTestimonials;

		// Si aucun témoignage n'est trouvé, ajouter quelques témoignages par défaut
		if (limitedTestimonials.length === 0) {
			console.log("Aucun témoignage trouvé, utilisation de témoignages par défaut");
			const defaultTestimonials = [
				{
					id: 'default1',
					name: 'Sophie Martin',
					role: 'Développeuse Web',
					comment: 'Cette formation a transformé ma carrière. Les compétences acquises m\'ont permis de trouver un emploi dans une entreprise innovante.',
					rating: 5,
					avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
				},
				{
					id: 'default2',
					name: 'Thomas Dubois',
					role: 'Chef de projet',
					comment: 'Formation complète et bien structurée. Les projets pratiques sont particulièrement utiles pour consolider les connaissances.',
					rating: 4.5,
					avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
				},
				{
					id: 'default3',
					name: 'Camille Leroy',
					role: 'Étudiante',
					comment: 'Excellente plateforme pour apprendre à son rythme. Les formateurs sont disponibles et les ressources très bien faites.',
					rating: 5,
					avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
				}
			];

			return defaultTestimonials;
		}

		console.log(`${limitedTestimonials.length} témoignages finalement retenus`);

		// Mettre en cache les témoignages
		setCachedData(cacheKey, limitedTestimonials, 3600);

		return limitedTestimonials;
	} catch (error) {
		console.error('Erreur lors de la récupération des témoignages:', error);

		// Retourner des témoignages par défaut en cas d'erreur
		return [
			{
				id: 'default1',
				name: 'Sophie Martin',
				role: 'Développeuse Web',
				comment: 'Cette formation a transformé ma carrière. Les compétences acquises m\'ont permis de trouver un emploi dans une entreprise innovante.',
				rating: 5,
				avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
			},
			{
				id: 'default2',
				name: 'Thomas Dubois',
				role: 'Chef de projet',
				comment: 'Formation complète et bien structurée. Les projets pratiques sont particulièrement utiles pour consolider les connaissances.',
				rating: 4,
				avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
			}
		];
	}
};

