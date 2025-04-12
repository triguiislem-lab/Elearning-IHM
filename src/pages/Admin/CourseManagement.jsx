import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import {
	fetchCoursesFromDatabase,
	fetchSpecialitesFromDatabase,
	fetchUsersFromDatabase,
} from '../../utils/firebaseUtils';
import { database } from '../../../firebaseConfig';
import { ref, remove } from 'firebase/database';
import {
	MdEdit,
	MdDelete,
	MdArrowBack,
	MdAdd,
	MdSearch,
	MdFilterList,
	MdVisibility,
	MdSchool,
} from 'react-icons/md';
import OptimizedLoadingSpinner from '../../components/Common/OptimizedLoadingSpinner';

const CourseManagement = () => {
	const { user, userRole, loading: authLoading } = useAuth();
	const [courses, setCourses] = useState([]);
	const [filteredCourses, setFilteredCourses] = useState([]);
	const [specialites, setSpecialites] = useState([]);
	const [instructors, setInstructors] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [searchTerm, setSearchTerm] = useState('');
	const [specialiteFilter, setSpecialiteFilter] = useState('all');
	const [instructorFilter, setInstructorFilter] = useState('all');
	const navigate = useNavigate();

	const loadData = useCallback(async () => {
		if (authLoading || !user || userRole !== 'admin') {
			if (!authLoading && userRole !== 'admin') {
				setError('Accès non autorisé.');
				setLoading(false);
			}
			return;
		}

		try {
			setLoading(true);
			setError('');

			// Fetch courses
			const allCourses = await fetchCoursesFromDatabase();
			setCourses(allCourses);
			setFilteredCourses(allCourses);

			// Fetch specialites for filtering
			const allSpecialites = await fetchSpecialitesFromDatabase();
			setSpecialites(allSpecialites);

			// Fetch instructors for filtering
			const allUsers = await fetchUsersFromDatabase();
			const instructorsList = allUsers.filter(
				(u) => u.role === 'instructor' || u.userType === 'formateur',
			);
			setInstructors(instructorsList);
		} catch (err) {
			console.error('Error loading data:', err);
			setError("Une erreur s'est produite lors du chargement des données.");
		} finally {
			setLoading(false);
		}
	}, [authLoading, user, userRole]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	// Filter courses based on search term and filters
	useEffect(() => {
		let result = courses;

		// Filter by specialite
		if (specialiteFilter !== 'all') {
			result = result.filter(
				(course) =>
					course.specialite === specialiteFilter ||
					course.specialiteId === specialiteFilter,
			);
		}

		// Filter by instructor
		if (instructorFilter !== 'all') {
			result = result.filter(
				(course) => course.instructorId === instructorFilter,
			);
		}

		// Filter by search term
		if (searchTerm) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(course) =>
					(course.title && course.title.toLowerCase().includes(term)) ||
					(course.titre && course.titre.toLowerCase().includes(term)) ||
					(course.description &&
						course.description.toLowerCase().includes(term)),
			);
		}

		setFilteredCourses(result);
	}, [courses, searchTerm, specialiteFilter, instructorFilter]);

	const handleDelete = async (courseId) => {
		if (
			!window.confirm(
				'Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.',
			)
		) {
			return;
		}

		try {
			setLoading(true);
			setError('');
			setSuccess('');

			const courseRef = ref(database, `elearning/courses/${courseId}`);
			await remove(courseRef);

			setSuccess('Cours supprimé avec succès.');
			await loadData();
		} catch (err) {
			console.error('Error deleting course:', err);
			setError("Une erreur s'est produite lors de la suppression du cours.");
		} finally {
			setLoading(false);
		}
	};

	const getSpecialiteName = (specialiteId) => {
		const specialite = specialites.find((s) => s.id === specialiteId);
		return specialite ? specialite.name : 'Non spécifié';
	};

	const getInstructorName = (instructorId) => {
		const instructor = instructors.find((i) => i.id === instructorId);
		return instructor
			? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() ||
					instructor.email
			: 'Non spécifié';
	};

	if (loading && courses.length === 0) {
		return <OptimizedLoadingSpinner />;
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}>
				<div className='flex justify-between items-center mb-6'>
					<h1 className='text-3xl font-bold'>Gestion des Formations</h1>
					<div className='flex gap-2'>
						<Link
							to='/admin/dashboard'
							className='flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-300'>
							<MdArrowBack />
							Retour au tableau de bord
						</Link>
						<Link
							to='/admin/course-form'
							className='flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors duration-300'>
							<MdAdd />
							Ajouter un cours
						</Link>
					</div>
				</div>

				{error && (
					<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
						{error}
					</div>
				)}

				{success && (
					<div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4'>
						{success}
					</div>
				)}

				<div className='bg-white rounded-lg shadow-md p-6 mb-8'>
					<div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
						<h2 className='text-xl font-semibold'>Liste des Formations</h2>
						<div className='flex flex-col sm:flex-row gap-4'>
							<div className='relative'>
								<MdSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
								<input
									type='text'
									placeholder='Rechercher...'
									className='pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
							<div className='relative'>
								<MdFilterList className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
								<select
									className='pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
									value={specialiteFilter}
									onChange={(e) => setSpecialiteFilter(e.target.value)}>
									<option value='all'>Toutes les spécialités</option>
									{specialites.map((specialite) => (
										<option
											key={specialite.id}
											value={specialite.id}>
											{specialite.name}
										</option>
									))}
								</select>
							</div>
							<div className='relative'>
								<MdFilterList className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
								<select
									className='pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
									value={instructorFilter}
									onChange={(e) => setInstructorFilter(e.target.value)}>
									<option value='all'>Tous les formateurs</option>
									{instructors.map((instructor) => (
										<option
											key={instructor.id}
											value={instructor.id}>
											{instructor.firstName || ''} {instructor.lastName || ''} (
											{instructor.email})
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					<div className='overflow-x-auto'>
						<table className='min-w-full bg-white'>
							<thead className='bg-gray-100'>
								<tr>
									<th className='py-3 px-4 text-left'>Titre</th>
									<th className='py-3 px-4 text-left'>Spécialité</th>
									<th className='py-3 px-4 text-left'>Formateur</th>
									<th className='py-3 px-4 text-left'>Durée</th>
									<th className='py-3 px-4 text-left'>Actions</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200'>
								{filteredCourses.map((course) => (
									<tr
										key={course.id}
										className='hover:bg-gray-50'>
										<td className='py-3 px-4'>
											<div className='flex items-center'>
												<div className='w-10 h-10 mr-3 bg-gray-200 rounded-md overflow-hidden'>
													{course.imageUrl ? (
														<img
															src={course.imageUrl}
															alt={course.title || course.titre}
															className='w-full h-full object-cover'
														/>
													) : (
														<div className='w-full h-full flex items-center justify-center bg-gray-300'>
															<MdSchool className='text-gray-500' />
														</div>
													)}
												</div>
												<div>
													<p className='font-medium'>
														{course.title || course.titre || 'Sans titre'}
													</p>
													<p className='text-sm text-gray-500'>
														{course.modules?.length || 0} module(s)
													</p>
												</div>
											</div>
										</td>
										<td className='py-3 px-4'>
											{getSpecialiteName(
												course.specialiteId || course.specialite,
											)}
										</td>
										<td className='py-3 px-4'>
											{getInstructorName(course.instructorId)}
										</td>
										<td className='py-3 px-4'>
											{course.duration || course.duree || 'Non spécifié'}
										</td>
										<td className='py-3 px-4'>
											<div className='flex space-x-2'>
												<Link
													to={`/course/${course.id}`}
													className='text-blue-500 hover:text-blue-700'
													title='Voir'
													target='_blank'
													rel='noopener noreferrer'>
													<MdVisibility />
												</Link>
												<Link
													to={`/admin/course-form/${course.id}`}
													className='text-orange-500 hover:text-orange-700'
													title='Modifier'>
													<MdEdit />
												</Link>
												<button
													onClick={() => handleDelete(course.id)}
													className='text-red-500 hover:text-red-700'
													title='Supprimer'>
													<MdDelete />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{filteredCourses.length === 0 && (
						<div className='text-center py-8 bg-gray-50 rounded-lg mt-4'>
							<p className='text-gray-600'>Aucun cours trouvé.</p>
						</div>
					)}
				</div>
			</motion.div>
		</div>
	);
};

export default CourseManagement;
