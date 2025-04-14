import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import {
	fetchCoursesFromDatabase,
	fetchUsersFromDatabase,
	fetchCourseEnrollments,
	fetchSpecialitesFromDatabase,
	fetchDisciplinesFromDatabase,
} from '../../utils/firebaseUtils';
import {
	MdSchool,
	MdPeople,
	MdPerson,
	MdSettings,
	MdStorage,
	MdMessage,
	MdCategory,
	MdAddCircle,
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import OptimizedLoadingSpinner from '../../components/Common/OptimizedLoadingSpinner';

const AdminDashboard = () => {
	const { user, userRole, loading: authLoading } = useAuth();

	const [courses, setCourses] = useState([]);
	const [students, setStudents] = useState([]);
	const [instructors, setInstructors] = useState([]);
	const [totalEnrollments, setTotalEnrollments] = useState(0);
	const [loadingData, setLoadingData] = useState(true);
	const [error, setError] = useState('');

	const loadAdminData = useCallback(async () => {
		if (authLoading || !user || userRole !== 'admin') {
			if (!authLoading && userRole !== 'admin') {
				setError('Accès non autorisé.');
				setLoadingData(false);
			}
			return;
		}

		try {
			setLoadingData(true);
			setError('');

			const [specialites, disciplines, allCoursesRaw, allUsers] =
				await Promise.all([
					fetchSpecialitesFromDatabase(),
					fetchDisciplinesFromDatabase(),
					fetchCoursesFromDatabase(),
					fetchUsersFromDatabase(),
				]);

			const coursesWithDetails = await Promise.all(
				allCoursesRaw.map(async (course) => {
					try {
						const enrollments = await fetchCourseEnrollments(course.id);
						const specialite = specialites.find(
							(s) => s.id === course.specialiteId,
						);
						const discipline = disciplines.find(
							(d) => d.id === course.disciplineId,
						);

						return {
							...course,
							students: enrollments.length,
							enrollments: enrollments,
							specialiteName: specialite?.name || '',
							disciplineName: discipline?.name || '',
						};
					} catch (error) {
						return {
							...course,
							students: 0,
							enrollments: [],
							specialiteName: '',
							disciplineName: '',
						};
					}
				}),
			);

			const sortedCourses = [...coursesWithDetails].sort(
				(a, b) => (b.students || 0) - (a.students || 0),
			);
			setCourses(sortedCourses);

			const totalEnrollmentsCount = coursesWithDetails.reduce(
				(total, course) => total + (course.students || 0),
				0,
			);
			setTotalEnrollments(totalEnrollmentsCount);

			const studentsList = allUsers.filter((u) => u.role === 'student');
			setStudents(studentsList);
			const instructorsList = allUsers.filter((u) => u.role === 'instructor');
			setInstructors(instructorsList);
		} catch (err) {
			setError("Une erreur s'est produite lors du chargement des données.");
		} finally {
			setLoadingData(false);
		}
	}, [user, userRole, authLoading]);

	useEffect(() => {
		loadAdminData();
	}, [loadAdminData]);

	const isLoading = authLoading || loadingData;

	if (isLoading) {
		return <OptimizedLoadingSpinner />;
	}

	if (error) {
		return (
			<div className='container mx-auto px-4 py-8 text-center'>
				<div className='bg-red-100 p-4 rounded-lg text-red-700'>
					<p>{error}</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className='container mx-auto px-4 py-8 text-center'>
				<p>Utilisateur non trouvé.</p>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}>
			<h1 className='text-3xl font-bold mb-8'>
				Tableau de bord administrateur
			</h1>

			<div className='bg-white rounded-lg shadow-md p-6 mb-8'>
				<h2 className='text-xl font-semibold mb-4'>
					Bienvenue, {user?.firstName || 'Admin'}!
				</h2>
				<p className='text-gray-600'>
					Gérez la plateforme, les utilisateurs et les cours.
				</p>
			</div>

			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<div className='bg-white rounded-lg shadow-md p-6 flex items-center gap-4 border border-gray-200'>
					<div className='bg-blue-100 p-3 rounded-full'>
						<MdSchool className='text-blue-600 text-2xl' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-700'>
							Cours Actifs
						</h3>
						<p className='text-3xl font-bold text-blue-600'>{courses.length}</p>
					</div>
				</div>
				<div className='bg-white rounded-lg shadow-md p-6 flex items-center gap-4 border border-gray-200'>
					<div className='bg-green-100 p-3 rounded-full'>
						<MdPerson className='text-green-600 text-2xl' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-700'>Étudiants</h3>
						<p className='text-3xl font-bold text-green-600'>
							{students.length}
						</p>
					</div>
				</div>
				<div className='bg-white rounded-lg shadow-md p-6 flex items-center gap-4 border border-gray-200'>
					<div className='bg-purple-100 p-3 rounded-full'>
						<MdPeople className='text-purple-600 text-2xl' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-700'>Formateurs</h3>
						<p className='text-3xl font-bold text-purple-600'>
							{instructors.length}
						</p>
					</div>
				</div>
				<div className='bg-white rounded-lg shadow-md p-6 flex items-center gap-4 border border-gray-200'>
					<div className='bg-yellow-100 p-3 rounded-full'>
						<MdPeople className='text-yellow-600 text-2xl' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-700'>
							Inscriptions
						</h3>
						<p className='text-3xl font-bold text-yellow-600'>
							{totalEnrollments}
						</p>
					</div>
				</div>
			</div>

			<div className='bg-white rounded-lg shadow-md p-6 mb-8'>
				<h2 className='text-xl font-semibold mb-6 text-gray-700'>
					Formateurs ({instructors.length})
				</h2>
				{instructors.length > 0 ? (
					<div className='overflow-x-auto'>
						<table className='min-w-full bg-white'>
							<thead className='bg-gray-100'>
								<tr>
									<th className='py-3 px-4 text-left'>Nom</th>
									<th className='py-3 px-4 text-left'>Email</th>
									<th className='py-3 px-4 text-left'>Expertise</th>
									<th className='py-3 px-4 text-left'>Actions</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200'>
								{instructors.map((user) => (
									<tr
										key={user.id || user.uid}
										className='hover:bg-gray-50'>
										<td className='py-3 px-4'>
											{user.firstName || user.prenom || ''}{' '}
											{user.lastName || user.nom || ''}
										</td>
										<td className='py-3 px-4'>{user.email}</td>
										<td className='py-3 px-4'>
											{user.expertise || 'Non spécifié'}
										</td>
										<td className='py-3 px-4'>
											<Link
												to={`#`}
												onClick={(e) => e.preventDefault()}
												className='text-indigo-600 hover:text-indigo-800 hover:underline text-sm cursor-not-allowed opacity-50'>
												Détails
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className='text-center py-8 bg-gray-50 rounded-lg'>
						<p className='text-gray-600'>Aucun formateur trouvé.</p>
					</div>
				)}
			</div>

			<div className='bg-white rounded-lg shadow-md p-6 mb-8'>
				<h2 className='text-xl font-semibold mb-6 text-gray-700'>
					Étudiants ({students.length}) - 10 derniers
				</h2>
				{students.length > 0 ? (
					<div className='overflow-x-auto'>
						<table className='min-w-full bg-white'>
							<thead className='bg-gray-100'>
								<tr>
									<th className='py-3 px-4 text-left'>Nom</th>
									<th className='py-3 px-4 text-left'>Email</th>
									<th className='py-3 px-4 text-left'>Inscriptions</th>
									<th className='py-3 px-4 text-left'>Actions</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200'>
								{students.slice(0, 10).map((user) => (
									<tr
										key={user.id || user.uid}
										className='hover:bg-gray-50'>
										<td className='py-3 px-4'>
											{user.firstName || user.prenom || ''}{' '}
											{user.lastName || user.nom || ''}
										</td>
										<td className='py-3 px-4'>{user.email}</td>
										<td className='py-3 px-4'>
											{user.enrollments?.length || 0}
										</td>
										<td className='py-3 px-4'>
											<Link
												to={`#`}
												onClick={(e) => e.preventDefault()}
												className='text-indigo-600 hover:text-indigo-800 hover:underline text-sm cursor-not-allowed opacity-50'>
												Détails
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className='text-center py-8 bg-gray-50 rounded-lg'>
						<p className='text-gray-600'>Aucun étudiant trouvé.</p>
					</div>
				)}
			</div>

			<div className='bg-white rounded-lg shadow-md p-6'>
				<h2 className='text-xl font-semibold mb-6 text-gray-700'>
					Cours Actifs ({courses.length})
				</h2>
				{courses.length > 0 ? (
					<div className='overflow-x-auto'>
						<table className='min-w-full bg-white'>
							<thead className='bg-gray-100'>
								<tr>
									<th className='py-3 px-4 text-left'>Titre</th>
									<th className='py-3 px-4 text-left'>Niveau</th>
									<th className='py-3 px-4 text-left'>Spécialité/Discipline</th>
									<th className='py-3 px-4 text-left'>Étudiants inscrits</th>
									<th className='py-3 px-4 text-left'>Actions</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200'>
								{courses.map((course) => (
									<tr
										key={course.id}
										className='hover:bg-gray-50'>
										<td className='py-3 px-4'>
											{course.title || course.titre || 'Cours sans titre'}
										</td>
										<td className='py-3 px-4'>
											{course.level || 'Intermédiaire'}
										</td>
										<td className='py-3 px-4'>
											{course.specialiteName ||
												course.disciplineName ||
												'Non spécifié'}
										</td>
										<td className='py-3 px-4'>
											<span className='font-semibold'>
												{course.students || 0}
											</span>
											{course.students > 0 && (
												<Link
													to={`#`}
													onClick={(e) => e.preventDefault()}
													className='ml-2 text-xs text-blue-600 hover:underline cursor-not-allowed opacity-50'>
													(Voir liste)
												</Link>
											)}
										</td>
										<td className='py-3 px-4 flex space-x-3 whitespace-nowrap'>
											<Link
												to={`/course/${course.id}`}
												className='text-blue-600 hover:text-blue-800 hover:underline text-sm'
												target='_blank'
												rel='noopener noreferrer'>
												Voir Public
											</Link>
											<Link
												to={`/admin/course-form/${course.id}`}
												className='text-orange-600 hover:text-orange-800 hover:underline text-sm'>
												Éditer
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className='text-center py-8 bg-gray-50 rounded-lg'>
						<p className='text-gray-600'>Aucun cours trouvé.</p>
					</div>
				)}
			</div>
		</motion.div>
	);
};

export default AdminDashboard;
