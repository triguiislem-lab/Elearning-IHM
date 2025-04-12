import {
	getAuth,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	updateProfile,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { database } from '../../firebaseConfig';

const auth = getAuth();

export const registerUser = async (email, password, firstName, lastName, bio, phone, userType = 'student') => {
	// Create user with email and password
	const userCredential = await createUserWithEmailAndPassword(
		auth,
		email,
		password,
	);
	const user = userCredential.user;

	// Update user profile with full name
	const fullName = `${firstName} ${lastName}`.trim();
	await updateProfile(user, {
		displayName: fullName,
	});

	// Store additional user data in Realtime Database using standardized path
	const userRef = ref(database, `elearning/users/${user.uid}`);
	await set(userRef, {
		id: user.uid,
		firstName,
		lastName,
		email,
		bio: bio || '',
		phone: phone || '',
		role: userType, // Utilisez le type d'utilisateur fourni
		userType: userType, // Également enregistrer comme userType pour la compatibilité
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	});

	return user;
};

export const loginUser = async (email, password) => {
	const userCredential = await signInWithEmailAndPassword(
		auth,
		email,
		password,
	);
	const user = userCredential.user;

	// Fetch user data from database using standardized path
	const userRef = ref(database, `elearning/users/${user.uid}`);
	const snapshot = await get(userRef);
	let userData = snapshot.val();

	// If not found in standardized path, try legacy path
	if (!userData) {
		const legacyUserRef = ref(database, `users/${user.uid}`);
		const legacySnapshot = await get(legacyUserRef);
		userData = legacySnapshot.val();
	}

	return {
		user,
		userType: userData?.role || userData?.userType, // Check both role and userType fields
	};
};
