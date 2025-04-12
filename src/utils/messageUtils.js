import { getDatabase } from 'firebase/database';
import {
	ref,
	push,
	get,
	update,
	query,
	orderByChild,
	equalTo,
	serverTimestamp,
	set,
} from 'firebase/database';
import { fetchCompleteUserInfo } from './fetchCompleteUserInfo';

/**
 * Envoie un message à un destinataire
 * @param {string} senderId - ID de l'expéditeur
 * @param {string} recipientId - ID du destinataire
 * @param {string} recipientRole - Rôle du destinataire (peut être utilisé pour la logique future)
 * @param {string} subject - Sujet du message
 * @param {string} message - Contenu du message
 * @param {string} courseId - ID du cours (optionnel)
 * @param {string} courseName - Nom du cours (optionnel)
 * @returns {Promise<string>} - ID du message créé
 */
export const sendMessage = async (
	senderId,
	recipientId,
	recipientRole,
	subject,
	message,
	courseId = null,
	courseName = null,
) => {
	try {
		const database = getDatabase();
		if (!senderId) {
			throw new Error("ID de l'expéditeur manquant");
		}

		const senderData = await fetchCompleteUserInfo(senderId);
		if (!senderData) {
			throw new Error('Informations expéditeur non trouvées');
		}
		const senderName =
			`${senderData.firstName || ''} ${senderData.lastName || ''}`.trim() ||
			senderData.email ||
			'Utilisateur';
		const senderRole = senderData.role || 'student';
		const senderEmail = senderData.email || '';

		const recipientData = await fetchCompleteUserInfo(recipientId);
		let recipientName = 'Destinataire Inconnu';
		if (recipientData) {
			recipientName =
				`${recipientData.firstName || ''} ${
					recipientData.lastName || ''
				}`.trim() || recipientData.email;
		}

		const messageData = {
			senderId: senderId,
			senderName,
			senderEmail,
			senderType: senderRole,
			recipientId,
			recipientType: recipientRole,
			recipientName,
			subject,
			message,
			courseId,
			courseName,
			date: new Date().toISOString(),
			read: false,
			deleted: false,
		};

		const messagesRef = ref(database, 'elearning/messages');
		const newMessageRef = push(messagesRef);
		await set(newMessageRef, messageData);

		return newMessageRef.key;
	} catch (error) {
		console.error('sendMessage error:', error);
		throw error;
	}
};

/**
 * Récupère les messages reçus par l'utilisateur spécifié
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} - Liste des messages reçus
 */
export const getReceivedMessages = async (userId) => {
	try {
		const database = getDatabase();
		if (!userId) {
			console.error('getReceivedMessages: ID utilisateur manquant');
			return [];
		}

		// Get all messages and filter client-side
		const messagesRef = ref(database, 'elearning/messages');
		const snapshot = await get(messagesRef);

		if (!snapshot.exists()) {
			console.log(
				`getReceivedMessages: Aucun message trouvé dans la base de données`,
			);
			return [];
		}

		const messagesData = snapshot.val();
		const messagesArray = Object.entries(messagesData)
			.map(([id, message]) => ({
				id,
				...message,
				timestamp: message.date ? new Date(message.date).getTime() : Date.now(),
			}))
			.filter((message) => message.recipientId === userId && !message.deleted);

		messagesArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

		console.log(
			`getReceivedMessages: ${messagesArray.length} messages trouvés pour l'utilisateur ${userId}`,
		);
		return messagesArray;
	} catch (error) {
		console.error('getReceivedMessages error:', error);
		return [];
	}
};

/**
 * Récupère les messages envoyés par l'utilisateur spécifié
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} - Liste des messages envoyés
 */
export const getSentMessages = async (userId) => {
	try {
		const database = getDatabase();
		if (!userId) {
			console.error('getSentMessages: ID utilisateur manquant');
			return [];
		}

		// Get all messages and filter client-side
		const messagesRef = ref(database, 'elearning/messages');
		const snapshot = await get(messagesRef);

		if (!snapshot.exists()) {
			console.log(
				`getSentMessages: Aucun message trouvé dans la base de données`,
			);
			return [];
		}

		const messagesData = snapshot.val();
		const messagesArray = Object.entries(messagesData)
			.map(([id, message]) => ({
				id,
				...message,
				timestamp: message.date ? new Date(message.date).getTime() : Date.now(),
			}))
			.filter((message) => message.senderId === userId && !message.deleted);

		messagesArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

		console.log(
			`getSentMessages: ${messagesArray.length} messages trouvés envoyés par l'utilisateur ${userId}`,
		);
		return messagesArray;
	} catch (error) {
		console.error('getSentMessages error:', error);
		return [];
	}
};

/**
 * Marque un message comme lu ou non lu par le destinataire
 * @param {string} userId - ID de l'utilisateur (destinataire)
 * @param {string} messageId - ID du message
 * @param {boolean} isRead - État de lecture du message
 * @returns {Promise<void>}
 */
export const markMessageAsRead = async (userId, messageId, isRead = true) => {
	try {
		const database = getDatabase();
		if (!userId) {
			throw new Error('ID utilisateur manquant');
		}

		const messageRef = ref(database, `elearning/messages/${messageId}`);

		const snapshot = await get(messageRef);
		if (!snapshot.exists()) {
			throw new Error('Message non trouvé.');
		}
		const messageData = snapshot.val();
		if (messageData.recipientId !== userId) {
			throw new Error(
				"Permission refusée: Vous n'êtes pas le destinataire de ce message.",
			);
		}

		await update(messageRef, { read: isRead });
	} catch (error) {
		console.error('markMessageAsRead error:', error);
		throw error;
	}
};

/**
 * Supprime un message pour l'utilisateur actuel (marque comme supprimé pour cet utilisateur)
 * @param {string} userId - ID de l'utilisateur actuel
 * @param {string} messageId - ID du message
 * @param {'received' | 'sent'} messageType - Indique si le message est dans la boîte de réception ou envoyés
 * @returns {Promise<void>}
 */
export const deleteMessage = async (userId, messageId, messageType) => {
	try {
		const database = getDatabase();
		if (!userId) {
			throw new Error('ID utilisateur manquant');
		}
		if (
			!messageType ||
			(messageType !== 'received' && messageType !== 'sent')
		) {
			throw new Error('Type de message invalide pour la suppression.');
		}

		const messageRef = ref(database, `elearning/messages/${messageId}`);

		const snapshot = await get(messageRef);
		if (!snapshot.exists()) {
			return;
		}
		const messageData = snapshot.val();

		// Check permissions
		if (
			(messageType === 'received' && messageData.recipientId !== userId) ||
			(messageType === 'sent' && messageData.senderId !== userId)
		) {
			throw new Error(
				'Permission refusée: Vous ne pouvez pas supprimer ce message.',
			);
		}

		// Mark as deleted
		const updateData = { deleted: true };

		await update(messageRef, updateData);
		console.log(
			`deleteMessage: Message ${messageId} marqué comme supprimé pour l'utilisateur ${userId}`,
		);
	} catch (error) {
		console.error('deleteMessage error:', error);
		throw error;
	}
};

/**
 * Récupère les utilisateurs disponibles pour l'envoi de messages selon le rôle de l'utilisateur actuel
 * @param {string} userId - ID de l'utilisateur actuel
 * @param {string} userRole - Rôle de l'utilisateur actuel
 * @returns {Promise<Object>} - Listes d'utilisateurs par rôle { admins: [], instructors: [], students: [] }
 */
export const getAvailableRecipients = async (userId, userRole) => {
	try {
		// const auth = getAuth(); // Removed
		const database = getDatabase();
		if (!userId || !userRole) {
			// Check passed arguments
			throw new Error(
				'User ID ou Role manquant pour récupérer les destinataires',
			);
		}

		// 1. Fetch all users
		const usersRef = ref(database, 'elearning/users');
		const usersSnapshot = await get(usersRef);

		if (!usersSnapshot.exists()) {
			return { admins: [], instructors: [], students: [] };
		}

		const usersData = usersSnapshot.val();
		// 2. Filter out the current user and format
		const allOtherUsers = Object.entries(usersData)
			.filter(([id]) => id !== userId)
			.map(([id, user]) => ({
				id,
				...user,
				displayName:
					`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
					user.email ||
					'Utilisateur',
			}));

		// 3. Separate users by role
		const admins = allOtherUsers.filter((user) => user.role === 'admin');
		const instructors = allOtherUsers.filter(
			(user) => user.role === 'instructor',
		);
		const students = allOtherUsers.filter((user) => user.role === 'student');

		// 4. Determine final lists based on userRole

		// 4a. Admin can message everyone else
		if (userRole === 'admin') {
			return { admins, instructors, students };
		}

		// 4b. Instructor can message Admins and their enrolled Students
		if (userRole === 'instructor') {
			let enrolledStudentIds = new Set();

			// Get instructor's courses first (efficiently, if possible)
			// Using a less efficient query for now: filter all courses client-side
			const coursesRef = ref(database, 'elearning/courses');
			const coursesSnapshot = await get(
				query(coursesRef, orderByChild('instructorId'), equalTo(userId)),
			);

			if (coursesSnapshot.exists()) {
				const instructorCoursesData = coursesSnapshot.val();
				const courseIds = Object.keys(instructorCoursesData);

				// For each course, get enrollments (can be parallelized)
				const enrollmentPromises = courseIds.map((courseId) =>
					get(ref(database, `elearning/enrollments/byCourse/${courseId}`)),
				);
				const enrollmentSnapshots = await Promise.all(enrollmentPromises);

				enrollmentSnapshots.forEach((snapshot) => {
					if (snapshot.exists()) {
						const courseEnrollments = snapshot.val();
						Object.keys(courseEnrollments).forEach((studentId) =>
							enrolledStudentIds.add(studentId),
						);
					}
				});
			}

			const enrolledStudents = students.filter((student) =>
				enrolledStudentIds.has(student.id),
			);
			return { admins, instructors: [], students: enrolledStudents }; // Instructors don't message other instructors usually
		}

		// 4c. Student can message Admins and Instructors of their courses
		if (userRole === 'student') {
			let courseInstructorIds = new Set();

			// Get student's enrollments
			const studentEnrollmentsRef = ref(
				database,
				`elearning/enrollments/byUser/${userId}`,
			);
			const enrollmentsSnapshot = await get(studentEnrollmentsRef);

			if (enrollmentsSnapshot.exists()) {
				const enrollmentsData = enrollmentsSnapshot.val();
				const enrolledCourseIds = Object.keys(enrollmentsData);

				// Get instructor IDs for these courses (can be parallelized)
				const coursePromises = enrolledCourseIds.map((courseId) =>
					get(ref(database, `elearning/courses/${courseId}/instructorId`)),
				);
				const courseSnapshots = await Promise.all(coursePromises);

				courseSnapshots.forEach((snapshot) => {
					if (snapshot.exists()) {
						courseInstructorIds.add(snapshot.val());
					}
				});
			}

			const courseInstructors = instructors.filter((instructor) =>
				courseInstructorIds.has(instructor.id),
			);
			return { admins, instructors: courseInstructors, students: [] };
		}

		// Default: Should not happen if role is valid

		return { admins: [], instructors: [], students: [] };
	} catch (error) {
		throw error; // Rethrow error to be handled by the calling component
	}
};
