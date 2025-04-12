import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OptimizedLoadingSpinner from '../Common/OptimizedLoadingSpinner';
import {
	ArrowLeft,
	Clock,
	Star,
	Library,
	Users,
	X,
	ChevronLeft,
	BarChart2,
	MessageCircle,
	MessageSquare,
	UserCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
	fetchCoursesFromDatabase,
	fetchFormationsFromDatabase,
	testFirebasePaths,
	fetchCourseById,
	fetchCourseEnrollments,
} from '../../utils/firebaseUtils';
import { getAuth } from 'firebase/auth';
import { database } from '../../../firebaseConfig';
import { ref, get, set } from 'firebase/database';
import CourseModules from '../CourseModules/CourseModules';
import ModuleContent from '../CourseModules/ModuleContent';
import CourseProgressBar from '../CourseProgress/CourseProgressBar';
import ModuleProgressCard from '../CourseProgress/ModuleProgressCard';
import CourseFeedback from '../Feedback/CourseFeedback';
import ContactButtons from '../Contact/ContactButtons';

const CourseDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [course, setCourse] = useState(null);
	const [loading, setLoading] = useState(true);
	const [showEnrollPopup, setShowEnrollPopup] = useState(false);
	const [enrollmentLoading, setEnrollmentLoading] = useState(false);
	const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
	const [enrollmentError, setEnrollmentError] = useState(null);
	// Nous utilisons isEnrolled pour déterminer si l'utilisateur est inscrit au cours
	const [activeModule, setActiveModule] = useState(null);
	const [showModuleContent, setShowModuleContent] = useState(false);
	const [isEnrolled, setIsEnrolled] = useState(false);

	// Firebase refs
	const auth = getAuth();

	// Vérifier si l'utilisateur est un formateur et s'il est inscrit au cours
	useEffect(() => {
		// Définir isEnrolled à false par défaut
		setIsEnrolled(false);

		const checkUserRoleAndEnrollment = async () => {
			try {
				const user = auth.currentUser;
				if (!user) {
					return;
				}

				// Vérifier d'abord dans le stockage local
				const enrolledInLocalStorage =
					localStorage.getItem(`enrolled_${user.uid}_${id}`) === 'true';
				if (enrolledInLocalStorage) {
					setIsEnrolled(true);
					return;
				}
				// Vérifier si l'utilisateur est un formateur
				const formateurRef = ref(database, `elearning/users/${user.uid}`);
				const formateurSnapshot = await get(formateurRef);
				const userData = formateurSnapshot.exists()
					? formateurSnapshot.val()
					: null;

				// Vérifier le rôle de l'utilisateur
				const userRole = userData?.role || userData?.userType;
				const isUserFormateur =
					userRole === 'instructor' || userRole === 'formateur';

				// Si l'utilisateur est un formateur, il a accès à tous les cours
				if (isUserFormateur) {
					setIsEnrolled(true);
					localStorage.setItem(`enrolled_${user.uid}_${id}`, 'true');
					return;
				}

				// Vérifier si l'utilisateur est inscrit au cours

				// Chemins à vérifier pour l'inscription
				const enrollmentPaths = [
					`elearning/enrollments/byCourse/${id}/${user.uid}`,
					`elearning/enrollments/byUser/${user.uid}/${id}`,
					`elearning/progress/${user.uid}/${id}`,
					`Elearning/Enrollments/${id}/${user.uid}`,
					`Elearning/Enrollments/byUser/${user.uid}/${id}`,
					`Elearning/Cours/${id}/enrollments/${user.uid}`,
					`Elearning/Progression/${user.uid}/${id}`,
				];

				// Vérifier chaque chemin
				for (const path of enrollmentPaths) {
					try {
						const pathRef = ref(database, path);
						const snapshot = await get(pathRef);

						if (snapshot.exists()) {
							setIsEnrolled(true);
							localStorage.setItem(`enrolled_${user.uid}_${id}`, 'true');
							return;
						}
					} catch (error) {}
				}

				// Si nous arrivons ici, l'utilisateur n'est pas inscrit au cours

				setIsEnrolled(false);
				localStorage.removeItem(`enrolled_${user.uid}_${id}`);

				// Essayer de migrer les données d'inscription si elles existent dans d'autres formats
				try {
					// Vérifier s'il y a des données d'inscription dans un format générique
					const genericEnrollmentsRef = ref(database, 'elearning/enrollments');
					const genericSnapshot = await get(genericEnrollmentsRef);

					if (genericSnapshot.exists()) {
						const enrollments = genericSnapshot.val();
						const userEnrollment = Object.values(enrollments).find(
							(e) => e.userId === user.uid && e.courseId === id,
						);

						if (userEnrollment) {
							// Migrer vers le nouveau format
							const newEnrollmentRef = ref(
								database,
								`elearning/enrollments/byCourse/${id}/${user.uid}`,
							);
							await set(newEnrollmentRef, {
								userId: user.uid,
								courseId: id,
								enrolledAt:
									userEnrollment.enrolledAt || new Date().toISOString(),
								enrollmentId:
									userEnrollment.enrollmentId || Date.now().toString(),
							});

							const userEnrollmentRef = ref(
								database,
								`elearning/enrollments/byUser/${user.uid}/${id}`,
							);
							await set(userEnrollmentRef, {
								courseId: id,
								enrolledAt:
									userEnrollment.enrolledAt || new Date().toISOString(),
							});

							setIsEnrolled(true);
							localStorage.setItem(`enrolled_${user.uid}_${id}`, 'true');
						}
					}
				} catch (error) {}
			} catch (error) {}
		};

		checkUserRoleAndEnrollment();
	}, [auth, id]);

	// Ajouter un effet pour vérifier l'état d'inscription lorsque le cours change
	useEffect(() => {
		if (course && auth.currentUser) {
			const userId = auth.currentUser.uid;
			const courseId = course.id;

			// Vérifier si l'utilisateur est inscrit au cours dans le stockage local
			const enrolledInLocalStorage =
				localStorage.getItem(`enrolled_${userId}_${courseId}`) === 'true';

			if (enrolledInLocalStorage && !isEnrolled) {
				setIsEnrolled(true);
			}
		}
	}, [course, auth.currentUser, isEnrolled]);

	// Charger les détails du cours
	useEffect(() => {
		const loadCourse = async () => {
			try {
				// Utiliser la nouvelle fonction fetchCourseById qui récupère également les modules et évaluations
				const courseWithModules = await fetchCourseById(id, true, true);

				if (courseWithModules) {
					// Récupérer les données dynamiques (nombre d'étudiants inscrits)
					const enrollments = await fetchCourseEnrollments(
						courseWithModules.id,
					);
					const studentsCount = enrollments ? enrollments.length : 0;

					// Compter le nombre de leçons/modules
					let lessonsCount = 0;
					if (
						courseWithModules.modules &&
						typeof courseWithModules.modules === 'object'
					) {
						if (Array.isArray(courseWithModules.modules)) {
							lessonsCount = courseWithModules.modules.length;
						} else {
							lessonsCount = Object.keys(courseWithModules.modules).length;
						}
					}

					// Mettre à jour le cours avec les données dynamiques
					const enrichedCourse = {
						...courseWithModules,
						students: studentsCount,
						lessons: lessonsCount,
					};

					setCourse(enrichedCourse);
					return;
				}

				// Si le cours n'est pas trouvé avec fetchCourseById, essayer les anciennes méthodes

				// Tester les chemins Firebase disponibles
				await testFirebasePaths();

				// Essayer d'abord de charger depuis les cours
				const coursesData = await fetchCoursesFromDatabase();

				let foundCourse = coursesData.find((c) => c.id === id);

				// Si pas trouvé dans les cours, essayer dans les formations
				if (!foundCourse) {
					const formationsData = await fetchFormationsFromDatabase();

					foundCourse = formationsData.find((f) => f.id === id);

					// Adapter le format si c'est une formation
					if (foundCourse) {
						// Récupérer les données dynamiques
						const enrollments = await fetchCourseEnrollments(foundCourse.id);
						const studentsCount = enrollments ? enrollments.length : 0;

						// Compter le nombre de leçons/modules
						let lessonsCount = 0;
						if (
							foundCourse.modules &&
							typeof foundCourse.modules === 'object'
						) {
							if (Array.isArray(foundCourse.modules)) {
								lessonsCount = foundCourse.modules.length;
							} else {
								lessonsCount = Object.keys(foundCourse.modules).length;
							}
						}

						// Adapter les propriétés pour correspondre au format attendu
						foundCourse.title = foundCourse.titre || 'Formation';
						foundCourse.duration = foundCourse.duree
							? `${foundCourse.duree} heures`
							: '40 heures';
						foundCourse.lessons = lessonsCount || 0;
						foundCourse.students = studentsCount || 0;
						foundCourse.category = foundCourse.category || 'Formation';
						foundCourse.level = foundCourse.level || 'Intermédiaire';
						foundCourse.topics = foundCourse.description
							? foundCourse.description
									.split('. ')
									.filter((topic) => topic.trim() !== '')
							: ['Module 1', 'Module 2', 'Module 3'];
						foundCourse.instructor = {
							name: 'Formateur',
							bio: 'Expert dans ce domaine',
							avatar:
								'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
						};
						foundCourse.updatedAt =
							foundCourse.dateFin || new Date().toISOString();
					}
				}

				// Si aucun cours n'est trouvé, créer un cours factice basé sur l'ID
				if (!foundCourse) {
					foundCourse = {
						id: id,
						title: `Formation ${id}`,
						description:
							"Cette formation complète vous permettra d'acquérir les compétences nécessaires pour maîtriser les technologies modernes. Vous apprendrez les fondamentaux et les techniques avancées à travers des projets pratiques et des études de cas réelles.",
						duration: '40 heures',
						lessons: 0,
						students: 0,
						rating: 0,
						totalRatings: 0,
						price: 49.99,
						category: 'Formation',
						level: 'Intermédiaire',
						topics: [
							'Module 1: Introduction aux concepts de base',
							'Module 2: Techniques avancées',
							'Module 3: Applications pratiques',
							'Module 4: Projets et études de cas',
						],
						instructor: {
							name: 'Formateur Expert',
							bio: "Expert dans ce domaine avec plus de 10 ans d'expérience dans l'industrie et l'enseignement. Certifié et reconnu par les plus grandes entreprises du secteur.",
							avatar:
								'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
						},
						image:
							'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
						updatedAt: new Date().toISOString(),
						objectives: [
							'Comprendre les concepts fondamentaux de la discipline',
							'Maîtriser les outils et technologies essentiels',
							'Développer des compétences pratiques à travers des projets réels',
							'Acquérir une expérience professionnelle valorisable sur le marché du travail',
						],
						prerequisites: [
							'Connaissances de base en informatique',
							"Familiarité avec l'environnement de travail numérique",
							"Motivation et engagement pour l'apprentissage",
						],
						targetAudience: [
							'Étudiants souhaitant acquérir des compétences professionnelles',
							'Professionnels en reconversion',
							'Employés cherchant à améliorer leurs compétences',
						],
						testimonials: [
							{
								name: 'Sophie Martin',
								role: 'Développeuse Web',
								comment:
									"Cette formation a transformé ma carrière. Les compétences acquises m'ont permis de trouver un emploi dans une entreprise innovante.",
								avatar:
									'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
								rating: 5,
							},
							{
								name: 'Thomas Dubois',
								role: 'Chef de projet',
								comment:
									'Formation complète et bien structurée. Les projets pratiques sont particulièrement utiles pour consolider les connaissances.',
								avatar:
									'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
								rating: 4.5,
							},
						],
						faq: [
							{
								question:
									'Combien de temps faut-il pour compléter la formation ?',
								answer:
									'La durée moyenne est de 3 mois à raison de 25 heures par semaine. Cependant, vous pouvez adapter votre rythme selon vos disponibilités.',
							},
							{
								question: 'Y a-t-il un certificat à la fin de la formation ?',
								answer:
									"Oui, vous recevrez un certificat de réussite reconnu par l'industrie après avoir complété tous les modules et projets.",
							},
							{
								question:
									'Est-ce que je peux accéder au contenu après la fin de la formation ?',
								answer:
									'Oui, vous aurez un accès à vie au contenu de la formation, y compris aux mises à jour futures.',
							},
						],
					};
				}

				// S'assurer que l'objet course a toujours un instructor défini
				if (foundCourse && !foundCourse.instructor) {
					foundCourse.instructor = {
						name: 'Formateur',
						bio: 'Expert dans ce domaine',
						avatar:
							'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
					};
				}

				setCourse(foundCourse);
			} catch (error) {
				// En cas d'erreur, créer un cours factice
				const dummyCourse = {
					id: id,
					title: `Formation ${id}`,
					description:
						"Cette formation complète vous permettra d'acquérir les compétences nécessaires pour maîtriser les technologies modernes. Vous apprendrez les fondamentaux et les techniques avancées à travers des projets pratiques et des études de cas réelles.",
					duration: '40 heures',
					lessons: 0,
					students: 0,
					rating: 0,
					totalRatings: 0,
					price: 49.99,
					category: 'Formation',
					level: 'Intermédiaire',
					topics: [
						'Module 1: Introduction aux concepts de base',
						'Module 2: Techniques avancées',
						'Module 3: Applications pratiques',
						'Module 4: Projets et études de cas',
					],
					instructor: {
						name: 'Formateur Expert',
						bio: "Expert dans ce domaine avec plus de 10 ans d'expérience dans l'industrie et l'enseignement. Certifié et reconnu par les plus grandes entreprises du secteur.",
						avatar:
							'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
					},
					image:
						'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
					updatedAt: new Date().toISOString(),
					objectives: [
						'Comprendre les concepts fondamentaux de la discipline',
						'Maîtriser les outils et technologies essentiels',
						'Développer des compétences pratiques à travers des projets réels',
						'Acquérir une expérience professionnelle valorisable sur le marché du travail',
					],
					prerequisites: [
						'Connaissances de base en informatique',
						"Familiarité avec l'environnement de travail numérique",
						"Motivation et engagement pour l'apprentissage",
					],
					targetAudience: [
						'Étudiants souhaitant acquérir des compétences professionnelles',
						'Professionnels en reconversion',
						'Employés cherchant à améliorer leurs compétences',
					],
					testimonials: [
						{
							name: 'Sophie Martin',
							role: 'Développeuse Web',
							comment:
								"Cette formation a transformé ma carrière. Les compétences acquises m'ont permis de trouver un emploi dans une entreprise innovante.",
							avatar:
								'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
							rating: 5,
						},
						{
							name: 'Thomas Dubois',
							role: 'Chef de projet',
							comment:
								'Formation complète et bien structurée. Les projets pratiques sont particulièrement utiles pour consolider les connaissances.',
							avatar:
								'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
							rating: 4.5,
						},
					],
					faq: [
						{
							question:
								'Combien de temps faut-il pour compléter la formation ?',
							answer:
								'La durée moyenne est de 3 mois à raison de 25 heures par semaine. Cependant, vous pouvez adapter votre rythme selon vos disponibilités.',
						},
						{
							question: 'Y a-t-il un certificat à la fin de la formation ?',
							answer:
								"Oui, vous recevrez un certificat de réussite reconnu par l'industrie après avoir complété tous les modules et projets.",
						},
						{
							question:
								'Est-ce que je peux accéder au contenu après la fin de la formation ?',
							answer:
								'Oui, vous aurez un accès à vie au contenu de la formation, y compris aux mises à jour futures.',
						},
					],
				};
				setCourse(dummyCourse);
			} finally {
				setLoading(false);
			}
		};

		loadCourse();
	}, [id]);

	const handleEnrollClick = async () => {
		const currentUser = auth.currentUser;

		if (!currentUser) {
			navigate('/login', {
				state: {
					returnPath: `/course/${id}`,
					message: 'Please login to enroll in this course',
				},
			});
			return;
		}

		// Vérifier si l'utilisateur est déjà inscrit au cours
		try {
			// Vérifier directement dans elearning/enrollments/byCourse/{courseId}/{userId}
			const enrollmentRef = ref(
				database,
				`elearning/enrollments/byCourse/${course.id}/${currentUser.uid}`,
			);
			const enrollmentSnapshot = await get(enrollmentRef);

			if (enrollmentSnapshot.exists()) {
				setEnrollmentError('Vous êtes déjà inscrit à ce cours.');
				setIsEnrolled(true);
				return;
			}

			// Vérifier également dans Elearning/Enrollments/byUser/{userId}/{courseId}
			const userEnrollmentRef = ref(
				database,
				`Elearning/Enrollments/byUser/${currentUser.uid}/${course.id}`,
			);
			const userEnrollmentSnapshot = await get(userEnrollmentRef);

			if (userEnrollmentSnapshot.exists()) {
				setEnrollmentError('Vous êtes déjà inscrit à ce cours.');
				setIsEnrolled(true);
				return;
			}

			// Vérifier dans la progression de l'utilisateur
			const progressionRef = ref(
				database,
				`Elearning/Progression/${currentUser.uid}/${course.id}`,
			);
			const progressionSnapshot = await get(progressionRef);

			if (progressionSnapshot.exists()) {
				setEnrollmentError('Vous êtes déjà inscrit à ce cours.');
				setIsEnrolled(true);
				return;
			}

			// Vérifier dans les anciens chemins pour la compatibilité
			const legacyPaths = [
				'enrollments',
				'Inscriptions',
				'Elearning/Inscriptions',
				`Elearning/Cours/${course.id}/enrollments`,
			];

			for (const path of legacyPaths) {
				try {
					const legacyRef = ref(database, path);
					const legacySnapshot = await get(legacyRef);

					if (legacySnapshot.exists()) {
						const legacyData = legacySnapshot.val();

						// Si c'est un chemin spécifique au cours
						if (path.includes(`Cours/${course.id}/enrollments`)) {
							if (legacyData[currentUser.uid]) {
								// Migrer l'inscription vers le nouveau format
								try {
									await set(enrollmentRef, {
										userId: currentUser.uid,
										courseId: course.id,
										enrolledAt: new Date().toISOString(),
										enrollmentId: Date.now().toString(),
									});

									await set(userEnrollmentRef, {
										courseId: course.id,
										enrolledAt: new Date().toISOString(),
									});
								} catch (migrationError) {}

								setEnrollmentError('Vous êtes déjà inscrit à ce cours.');
								setIsEnrolled(true);
								return;
							}
						} else {
							// Pour les autres chemins
							const isEnrolled = Object.values(legacyData).some(
								(enrollment) => {
									const enrollmentUserId = enrollment.userId;
									const enrollmentCourseId =
										enrollment.courseId ||
										enrollment.course?.id ||
										enrollment.course;

									return (
										enrollmentUserId === currentUser.uid &&
										enrollmentCourseId === course.id
									);
								},
							);

							if (isEnrolled) {
								// Migrer l'inscription vers le nouveau format
								try {
									await set(enrollmentRef, {
										userId: currentUser.uid,
										courseId: course.id,
										enrolledAt: new Date().toISOString(),
										enrollmentId: Date.now().toString(),
									});

									await set(userEnrollmentRef, {
										courseId: course.id,
										enrolledAt: new Date().toISOString(),
									});
								} catch (migrationError) {}

								setEnrollmentError('Vous êtes déjà inscrit à ce cours.');
								setIsEnrolled(true);
								return;
							}
						}
					}
				} catch (pathError) {}
			}
		} catch (error) {}

		setShowEnrollPopup(true);
	};

	const handleConfirmEnrollment = async () => {
		const currentUser = auth.currentUser;

		if (!currentUser || !course) return;

		try {
			setEnrollmentLoading(true);

			// Préparer les données d'inscription avec des valeurs par défaut pour éviter les undefined
			const enrollmentData = {
				userId: currentUser.uid,
				userName: currentUser.displayName || 'Unknown User',
				userEmail: currentUser.email || '',
				courseId: course.id,
				courseName: course.title || course.titre || `Cours ${course.id}`,
				enrolledAt: new Date().toISOString(),
			};

			// Vérifier que toutes les propriétés sont définies

			// Enregistrer l'inscription uniquement dans Elearning/Enrollments
			let enrollmentSuccess = false;

			try {
				// 1. Enregistrer l'inscription dans elearning/enrollments/byCourse/{courseId}/{userId}
				// Cette structure permet de facilement vérifier si un utilisateur est inscrit à un cours spécifique

				const enrollmentRef = ref(
					database,
					`elearning/enrollments/byCourse/${course.id}/${currentUser.uid}`,
				);
				await set(enrollmentRef, {
					...enrollmentData,
					enrollmentId: Date.now().toString(), // Ajouter un ID unique pour l'inscription
				});

				// 2. Ajouter également une référence dans elearning/enrollments/byUser/{userId}/{courseId}
				// Cette structure permet de facilement récupérer tous les cours auxquels un utilisateur est inscrit

				const userEnrollmentRef = ref(
					database,
					`elearning/enrollments/byUser/${currentUser.uid}/${course.id}`,
				);
				await set(userEnrollmentRef, {
					courseId: course.id,
					enrolledAt: new Date().toISOString(),
				});

				enrollmentSuccess = true;
			} catch (error) {
				setEnrollmentError(`Erreur lors de l'inscription: ${error.message}`);
			}

			// Si l'inscription a réussi, initialiser la progression de l'étudiant pour ce cours
			if (enrollmentSuccess) {
				try {
					const progressionRef = ref(
						database,
						`elearning/progress/${currentUser.uid}/${course.id}`,
					);
					await set(progressionRef, {
						courseId: course.id,
						userId: currentUser.uid,
						startDate: new Date().toISOString(),
						progress: 0,
						completed: false,
						lastUpdated: new Date().toISOString(),
					});
				} catch (error) {
					// Une erreur ici n'est pas critique, l'inscription a déjà réussi
				}

				// Ajouter une référence dans le cours pour faciliter la gestion côté formateur
				try {
					const courseEnrollmentRef = ref(
						database,
						`elearning/courses/${course.id}/enrollments/${currentUser.uid}`,
					);
					await set(courseEnrollmentRef, {
						userId: currentUser.uid,
						enrolledAt: new Date().toISOString(),
					});
				} catch (error) {
					// Une erreur ici n'est pas critique, l'inscription a déjà réussi
				}
			} else {
				// L'inscription a échoué

				setEnrollmentError(
					"Une erreur s'est produite lors de l'inscription. Veuillez réessayer.",
				);
				setEnrollmentLoading(false);
				return;
			}

			// Mettre à jour l'état isEnrolled immédiatement
			setIsEnrolled(true);

			// Sauvegarder l'état d'inscription dans le stockage local
			localStorage.setItem(`enrolled_${currentUser.uid}_${course.id}`, 'true');

			// Forcer un rafraîchissement de la page pour s'assurer que tous les états sont correctement mis à jour
			// Cela garantit que l'utilisateur verra le contenu du cours après l'inscription
			setTimeout(() => {
				window.location.reload();
			}, 2000); // Attendre 2 secondes pour que l'utilisateur voie le message de succès

			// Show success message
			setEnrollmentSuccess(true);

			// Ne pas fermer automatiquement le popup, laisser l'utilisateur cliquer sur le bouton
			// pour qu'il puisse voir le message de succès et comprendre qu'il est maintenant inscrit
		} catch (error) {
		} finally {
			setEnrollmentLoading(false);
		}
	};

	const EnrollmentPopup = () => (
		<div className='fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm'>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
				className='bg-white rounded-xl p-6 w-full max-w-md shadow-xl'>
				<div className='flex justify-between items-center mb-6'>
					<h3 className='text-2xl font-bold text-secondary'>
						{enrollmentSuccess
							? 'Inscription réussie !'
							: "Confirmer l'inscription"}
					</h3>
					<button
						onClick={() => setShowEnrollPopup(false)}
						className='p-2 rounded-full hover:bg-gray-100 transition-colors duration-200'>
						<X className='w-5 h-5' />
					</button>
				</div>

				{enrollmentSuccess ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
						className='text-center py-6'>
						<div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
							<svg
								className='w-10 h-10 text-green-500'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth='2'
									d='M5 13l4 4L19 7'></path>
							</svg>
						</div>
						<h4 className='text-xl font-semibold mb-3 text-gray-800'>
							Félicitations !
						</h4>
						<p className='text-gray-600 mb-6'>
							Vous êtes maintenant inscrit au cours{' '}
							<span className='font-medium text-secondary'>{course.title}</span>
						</p>
						<p className='text-sm text-gray-500 mb-4'>
							Vous pouvez maintenant accéder à tous les modules et ressources du
							cours.
						</p>
						<button
							onClick={() => {
								setShowEnrollPopup(false);
								setIsEnrolled(true);

								// Mettre à jour l'interface sans recharger la page complète
								// Cela permet de conserver l'état isEnrolled
								if (course.modules && course.modules.length > 0) {
									// Naviguer vers le premier module
									setActiveModule(course.modules[0]);
									setShowModuleContent(true);
									window.scrollTo({ top: 0, behavior: 'smooth' });
								}
							}}
							className='bg-secondary text-white px-6 py-2 rounded-md hover:bg-secondary/90 transition-colors duration-300'>
							Commencer à apprendre
						</button>
					</motion.div>
				) : (
					<>
						<div className='mb-6'>
							<p className='text-gray-600 mb-4'>
								Vous êtes sur le point de vous inscrire au cours :
							</p>
							<div className='bg-gray-50 p-4 rounded-lg border border-gray-100'>
								<div className='flex items-center gap-4'>
									<div className='w-12 h-12 rounded-md overflow-hidden flex-shrink-0'>
										<img
											src={
												course?.image ||
												'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'
											}
											alt={course?.title}
											className='w-full h-full object-cover'
											onError={(e) => {
												e.target.src =
													'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80';
											}}
										/>
									</div>
									<div>
										<h4 className='font-medium text-lg'>{course?.title}</h4>
										<p className='text-gray-600 text-sm'>
											{course?.instructor?.name || 'Formateur'}
										</p>
									</div>
								</div>
							</div>
						</div>

						{enrollmentError && (
							<div className='mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-100'>
								{enrollmentError}
							</div>
						)}

						<div className='text-sm text-gray-500 mb-6'>
							<p className='mb-2'>
								En vous inscrivant à ce cours, vous aurez accès à :
							</p>
							<ul className='list-disc pl-5 space-y-1'>
								<li>Tous les modules et ressources du cours</li>
								<li>Les évaluations et quiz</li>
								<li>Un suivi de votre progression</li>
								<li>Un certificat après complétion</li>
							</ul>
						</div>

						<div className='flex gap-3'>
							<button
								onClick={() => setShowEnrollPopup(false)}
								className='flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200'>
								Annuler
							</button>
							<button
								onClick={handleConfirmEnrollment}
								className='flex-1 py-2 px-4 bg-secondary text-white rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2'
								disabled={enrollmentLoading}>
								{enrollmentLoading ? (
									<>
										<OptimizedLoadingSpinner
											size='small'
											text='Traitement...'
										/>
									</>
								) : (
									"Confirmer l'inscription"
								)}
							</button>
						</div>
					</>
				)}
			</motion.div>
		</div>
	);

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<OptimizedLoadingSpinner
					size='large'
					text='Chargement du cours...'
				/>
			</div>
		);
	}

	if (!course) {
		return (
			<div className='min-h-screen flex flex-col'>
				<div className='flex-1 flex flex-col items-center justify-center p-6'>
					<h1 className='text-2xl font-bold mb-4'>Cours non trouvé</h1>
					<p className='text-gray-600 mb-8'>
						Le cours que vous recherchez n'existe pas.
					</p>
					<button
						onClick={() => navigate('/')}
						className='primary-btn flex items-center gap-2'>
						<ArrowLeft size={16} />
						Retour à l'accueil
					</button>
				</div>
			</div>
		);
	}

	// Vérification finale de l'état d'inscription avant le rendu
	// Cette vérification est déjà faite dans un autre useEffect, donc nous n'avons pas besoin de la faire ici

	return (
		<div className='min-h-screen flex flex-col'>
			<main className='flex-1'>
				<section className='bg-[#f9f9f9] py-14 md:py-24'>
					<div className='container'>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className='max-w-4xl mx-auto'>
							{/* Course Header */}
							<div className='mb-8'>
								<span className='inline-block bg-primary/10 text-secondary px-4 py-1 rounded-full text-sm font-medium mb-4'>
									{course.category || 'Formation'}
								</span>
								<h1 className='text-3xl font-bold mb-4'>{course.title}</h1>
								<div className='flex items-center gap-4 text-gray-600'>
									<div className='flex items-center gap-1'>
										<Clock className='w-4 h-4' />
										<span>{course.duration || '40 heures'}</span>
									</div>
									<div className='flex items-center gap-1'>
										<Library className='w-4 h-4' />
										<span>{course.lessons || 0} Leçons</span>
									</div>
									<div className='flex items-center gap-1'>
										<Users className='w-4 h-4' />
										<span>{course.students || 0} Étudiants</span>
									</div>
								</div>
							</div>

							{/* Course Image */}
							<img
								src={
									course.image ||
									'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'
								}
								alt={course.title}
								className='w-full h-[400px] object-cover rounded-xl mb-8'
								onError={(e) => {
									e.target.src =
										'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80';
								}}
							/>

							<div className='grid md:grid-cols-3 gap-8'>
								{/* Course Main Content */}
								<div className='md:col-span-2'>
									{/* Course Description */}
									<div className='bg-white p-6 rounded-xl shadow-sm mb-8'>
										<h2 className='text-xl font-semibold mb-4'>
											Description du cours
										</h2>
										<p className='text-gray-600'>{course.description}</p>
									</div>

									{/* Module Content (when a module is selected) */}
									{showModuleContent && activeModule && (
										<div className='mb-8'>
											<div className='flex justify-between items-center mb-4'>
												<h2 className='text-xl font-semibold'>
													Contenu du module
												</h2>
												<button
													onClick={() => {
														setShowModuleContent(false);
														setActiveModule(null);
													}}
													className='text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm'>
													<ChevronLeft size={16} />
													Retour aux modules
												</button>
											</div>
											<ModuleContent
												module={activeModule}
												isEnrolled={isEnrolled}
												onComplete={() => {
													// Mettre à jour le statut du module

													// Recharger le cours pour mettre à jour les modules
													fetchCourseById(id).then((updatedCourse) => {
														if (updatedCourse) {
															setCourse(updatedCourse);
														}
													});
													setShowModuleContent(false);
													setActiveModule(null);
												}}
											/>
										</div>
									)}

									{/* Course Progress (when enrolled and no module is selected) */}
									{!showModuleContent && isEnrolled && (
										<div className='mb-8'>
											<CourseProgressBar courseId={id} />
										</div>
									)}

									{/* Course Modules and Evaluations (when no module is selected) */}
									{!showModuleContent &&
										(course.modules && course.modules.length > 0 ? (
											<div>
												{isEnrolled ? (
													<div className='mb-6'>
														<h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
															<BarChart2 size={20} />
															Progression des modules
														</h2>
														<div className='space-y-4'>
															{Object.entries(course.modules).map(
																([moduleId, moduleData], index) => (
																	<ModuleProgressCard
																		key={moduleId}
																		moduleId={moduleId}
																		courseId={id}
																		moduleData={moduleData}
																		index={index}
																	/>
																),
															)}
														</div>
													</div>
												) : (
													<CourseModules
														course={{ ...course, id }}
														isEnrolled={isEnrolled}
														onModuleSelect={(module) => {
															if (isEnrolled) {
																setActiveModule(module);
																setShowModuleContent(true);
															} else {
																// Afficher un message d'inscription si l'utilisateur n'est pas inscrit
																alert(
																	'Vous devez être inscrit à ce cours pour accéder au contenu des modules.',
																);
																setShowEnrollPopup(true);
															}
														}}
													/>
												)}

												{!isEnrolled && (
													<div className='bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4 mb-8'>
														<p className='text-gray-700 mb-2 flex items-center'>
															<svg
																xmlns='http://www.w3.org/2000/svg'
																className='h-5 w-5 text-yellow-500 mr-2'
																viewBox='0 0 20 20'
																fill='currentColor'>
																<path
																	fillRule='evenodd'
																	d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
																	clipRule='evenodd'
																/>
															</svg>
															Vous pouvez voir les modules, mais vous devez être
															inscrit pour accéder aux ressources et aux
															évaluations.
														</p>
														<button
															onClick={() => setShowEnrollPopup(true)}
															className='bg-secondary text-white px-4 py-2 rounded-md text-sm hover:bg-secondary/90 transition-colors duration-300 mt-2 flex items-center gap-2'>
															<svg
																xmlns='http://www.w3.org/2000/svg'
																className='h-4 w-4'
																viewBox='0 0 20 20'
																fill='currentColor'>
																<path
																	fillRule='evenodd'
																	d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z'
																	clipRule='evenodd'
																/>
															</svg>
															S&apos;inscrire maintenant
														</button>
													</div>
												)}
											</div>
										) : (
											<div className='bg-white p-6 rounded-xl shadow-sm mb-8'>
												<h2 className='text-xl font-semibold mb-4'>
													Modules du cours
												</h2>
												<div className='text-center py-8 bg-gray-50 rounded-lg'>
													<p className='text-gray-600 mb-4'>
														Aucun module n&apos;a été ajouté à ce cours.
													</p>
													<p className='text-sm text-gray-500'>
														Ce cours ne contient pas encore de modules.
													</p>
												</div>
											</div>
										))}

									{/* Topics */}
									<div className='bg-white p-6 rounded-xl shadow-sm mb-8'>
										<h2 className='text-xl font-semibold mb-4'>
											Ce que vous apprendrez
										</h2>
										<div className='grid grid-cols-2 gap-3'>
											{course.topics?.map((topic, index) => (
												<div
													key={index}
													className='flex items-center gap-2'>
													<div className='w-2 h-2 bg-secondary rounded-full'></div>
													<span>{topic}</span>
												</div>
											))}
										</div>
									</div>

									{/* Instructor */}
									<div className='bg-white p-6 rounded-xl shadow-sm mb-8'>
										<h2 className='text-xl font-semibold mb-4'>Formateur</h2>
										<div className='flex items-center gap-4'>
											<img
												src={
													course.instructor?.avatar ||
													'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
												}
												alt={course.instructor?.name || 'Formateur'}
												className='w-16 h-16 rounded-full object-cover'
												onError={(e) => {
													e.target.src =
														'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
												}}
											/>
											<div>
												<h3 className='font-semibold'>
													{course.instructor?.name || 'Formateur'}
												</h3>
												<p className='text-gray-600'>
													{course.instructor?.bio ||
														'Informations du formateur non disponibles'}
												</p>
												{course.instructor?.expertise && (
													<p className='text-sm text-gray-500 mt-1'>
														<span className='font-medium'>Expertise:</span>{' '}
														{course.instructor.expertise}
													</p>
												)}
											</div>
										</div>
									</div>

									{/* Objectifs du cours */}
									{course.objectives && course.objectives.length > 0 && (
										<div className='bg-white p-6 rounded-xl shadow-sm mb-8'>
											<h2 className='text-xl font-semibold mb-4'>
												Objectifs du cours
											</h2>
											<ul className='space-y-2'>
												{course.objectives.map((objective, index) => (
													<li
														key={index}
														className='flex items-start gap-2'>
														<div className='text-secondary mt-1'>
															<svg
																xmlns='http://www.w3.org/2000/svg'
																className='h-5 w-5'
																viewBox='0 0 20 20'
																fill='currentColor'>
																<path
																	fillRule='evenodd'
																	d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
																	clipRule='evenodd'
																/>
															</svg>
														</div>
														<span>{objective}</span>
													</li>
												))}
											</ul>
										</div>
									)}

									{/* Prérequis */}
									{course.prerequisites && course.prerequisites.length > 0 && (
										<div className='bg-white p-6 rounded-xl shadow-sm mb-8'>
											<h2 className='text-xl font-semibold mb-4'>Prérequis</h2>
											<ul className='space-y-2'>
												{course.prerequisites.map((prerequisite, index) => (
													<li
														key={index}
														className='flex items-start gap-2'>
														<div className='text-primary mt-1'>
															<svg
																xmlns='http://www.w3.org/2000/svg'
																className='h-5 w-5'
																viewBox='0 0 20 20'
																fill='currentColor'>
																<path
																	fillRule='evenodd'
																	d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z'
																	clipRule='evenodd'
																/>
															</svg>
														</div>
														<span>{prerequisite}</span>
													</li>
												))}
											</ul>
										</div>
									)}

									{/* Public cible */}
									{course.targetAudience &&
										course.targetAudience.length > 0 && (
											<div className='bg-white p-6 rounded-xl shadow-sm mb-8'>
												<h2 className='text-xl font-semibold mb-4'>
													Public cible
												</h2>
												<ul className='space-y-2'>
													{course.targetAudience.map((audience, index) => (
														<li
															key={index}
															className='flex items-start gap-2'>
															<div className='text-secondary mt-1'>
																<svg
																	xmlns='http://www.w3.org/2000/svg'
																	className='h-5 w-5'
																	viewBox='0 0 20 20'
																	fill='currentColor'>
																	<path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' />
																</svg>
															</div>
															<span>{audience}</span>
														</li>
													))}
												</ul>
											</div>
										)}

									{/* Témoignages d'étudiants */}
									{course.testimonials && course.testimonials.length > 0 && (
										<div className='bg-white p-6 rounded-xl shadow-sm mb-8'>
											<h2 className='text-xl font-semibold mb-4'>
												Témoignages d'étudiants
											</h2>
											<div className='space-y-6'>
												{course.testimonials.map((testimonial, index) => (
													<div
														key={index}
														className='border-l-4 border-secondary pl-4 py-2'>
														<p className='text-gray-600 italic mb-3'>
															"{testimonial.comment}"
														</p>
														<div className='flex items-center gap-3'>
															<img
																src={testimonial.avatar}
																alt={testimonial.name}
																className='w-10 h-10 rounded-full object-cover'
																onError={(e) => {
																	e.target.src =
																		'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
																}}
															/>
															<div>
																<h4 className='font-medium'>
																	{testimonial.name}
																</h4>
																<p className='text-sm text-gray-500'>
																	{testimonial.role}
																</p>
															</div>
															<div className='ml-auto flex text-primary'>
																{[...Array(5)].map((_, i) => (
																	<Star
																		key={i}
																		className={`w-4 h-4 ${
																			i < Math.round(testimonial.rating)
																				? 'fill-current'
																				: ''
																		}`}
																	/>
																))}
															</div>
														</div>
													</div>
												))}
											</div>
										</div>
									)}

									{/* Feedback et avis */}
									<CourseFeedback
										courseId={id}
										courseName={course?.titre || course?.title || 'Cours'}
									/>

									{/* Un seul composant de contact unifié */}
									<ContactButtons
										courseId={id}
										courseName={course?.titre || course?.title || 'Cours'}
										instructorId={course?.formateur || course?.instructorId}
										instructorName={
											course?.formateurNom ||
											course?.instructorName ||
											course?.instructor?.name
										}
									/>

									{/* FAQ */}
									{course.faq && course.faq.length > 0 && (
										<div className='bg-white p-6 rounded-xl shadow-sm mb-8'>
											<h2 className='text-xl font-semibold mb-4'>
												Questions fréquentes
											</h2>
											<div className='space-y-4'>
												{course.faq.map((item, index) => (
													<div
														key={index}
														className='border-b pb-4 last:border-b-0 last:pb-0'>
														<h3 className='font-medium text-lg mb-2'>
															{item.question}
														</h3>
														<p className='text-gray-600'>{item.answer}</p>
													</div>
												))}
											</div>
										</div>
									)}
								</div>

								{/* Course Sidebar */}
								<div>
									<div className='bg-white p-6 rounded-xl shadow-lg sticky top-4'>
										<div className='mb-6'>
											<h3 className='text-3xl font-bold mb-4'>
												$
												{(typeof course.price === 'number'
													? course.price
													: parseFloat(course.price) || 49.99
												).toFixed(2)}
											</h3>

											{isEnrolled ? (
												<div className='mb-4'>
													<div className='bg-green-100 text-green-800 p-3 rounded-lg flex items-center gap-2 mb-3'>
														<svg
															xmlns='http://www.w3.org/2000/svg'
															className='h-5 w-5'
															viewBox='0 0 20 20'
															fill='currentColor'>
															<path
																fillRule='evenodd'
																d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
																clipRule='evenodd'
															/>
														</svg>
														<span>Vous êtes inscrit à ce cours</span>
													</div>
													<button
														className='w-full bg-secondary text-white py-3 px-4 rounded-lg font-medium hover:bg-secondary/90 transition-colors duration-300 flex items-center justify-center gap-2'
														onClick={() => {
															// Naviguer vers le premier module du cours
															if (course.modules && course.modules.length > 0) {
																setActiveModule(course.modules[0]);
																setShowModuleContent(true);
																window.scrollTo({ top: 0, behavior: 'smooth' });
															}
														}}>
														<svg
															xmlns='http://www.w3.org/2000/svg'
															className='h-5 w-5'
															viewBox='0 0 20 20'
															fill='currentColor'>
															<path
																fillRule='evenodd'
																d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z'
																clipRule='evenodd'
															/>
														</svg>
														Continuer à apprendre
													</button>
												</div>
											) : (
												<button
													className='w-full bg-secondary text-white py-3 px-4 rounded-lg font-medium hover:bg-secondary/90 transition-colors duration-300 flex items-center justify-center gap-2 mb-4'
													onClick={handleEnrollClick}>
													<svg
														xmlns='http://www.w3.org/2000/svg'
														className='h-5 w-5'
														viewBox='0 0 20 20'
														fill='currentColor'>
														<path d='M10 12a2 2 0 100-4 2 2 0 000 4z' />
														<path
															fillRule='evenodd'
															d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z'
															clipRule='evenodd'
														/>
													</svg>
													S&apos;inscrire maintenant
												</button>
											)}

											{enrollmentError && (
												<div className='bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 text-sm'>
													{enrollmentError}
												</div>
											)}
										</div>

										<div className='space-y-4 border-t pt-4'>
											<div className='flex justify-between'>
												<span className='text-gray-600'>Level</span>
												<span className='font-medium'>
													{course.level || 'Intermédiaire'}
												</span>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-600'>Rating</span>
												<div className='flex items-center gap-1'>
													<div className='flex text-primary'>
														{[...Array(5)].map((_, i) => (
															<Star
																key={i}
																className={`w-4 h-4 ${
																	i < Math.round(course.rating || 0)
																		? 'fill-current'
																		: ''
																}`}
															/>
														))}
													</div>
													<span>({course.totalRatings || 0})</span>
												</div>
											</div>
											<div className='flex justify-between'>
												<span className='text-gray-600'>Last Updated</span>
												<span className='font-medium'>
													{course.updatedAt
														? new Date(course.updatedAt).toLocaleDateString()
														: new Date().toLocaleDateString()}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					</div>
				</section>
			</main>

			{/* Enrollment Popup */}
			{showEnrollPopup && <EnrollmentPopup />}
		</div>
	);
};

export default CourseDetails;
