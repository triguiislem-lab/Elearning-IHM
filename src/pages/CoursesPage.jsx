import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
	Search,
	SlidersHorizontal,
	Clock,
	Star,
	Library,
	BookOpen,
	Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
	fetchCoursesFromDatabase,
	fetchSpecialitesFromDatabase,
	fetchDisciplinesFromDatabase,
	fetchCourseEnrollments,
} from '../utils/firebaseUtils';
import OptimizedLoadingSpinner from '../components/Common/OptimizedLoadingSpinner';
import { getDatabase, ref, get } from 'firebase/database';

const CoursesPage = () => {
	const [courses, setCourses] = useState([]);
	const [coursesWithMetadata, setCoursesWithMetadata] = useState([]);
	const [specialites, setSpecialites] = useState([]);
	const [disciplines, setDisciplines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedLevel, setSelectedLevel] = useState('');
	const [selectedSpecialite, setSelectedSpecialite] = useState('');
	const [selectedDiscipline, setSelectedDiscipline] = useState('');
	const levels = ['Débutant', 'Intermédiaire', 'Avancé'];

	useEffect(() => {
		const loadData = async () => {
			try {
				// Charger les cours
				const coursesData = await fetchCoursesFromDatabase(true);
				setCourses(coursesData);

				// Enrichir les cours avec des métadonnées (nombre d'étudiants, de leçons, etc.)
				const database = getDatabase();
				const coursesWithExtra = await Promise.all(
					coursesData.map(async (course) => {
						try {
							// Récupérer le nombre d'inscriptions pour ce cours
							const enrollments = await fetchCourseEnrollments(course.id);
							const studentsCount = enrollments.length;

							// Compter le nombre de leçons (modules)
							let lessonsCount = 0;
							if (course.modules && typeof course.modules === 'object') {
								// Si modules est un tableau
								if (Array.isArray(course.modules)) {
									lessonsCount = course.modules.length;
								}
								// Si modules est un objet
								else {
									lessonsCount = Object.keys(course.modules).length;
								}
							}

							// Récupérer les données de feedback depuis Firebase
							let rating = course.rating || 0;
							let totalRatings = course.totalRatings || 0;

							// Vérifier si les ratings ne sont pas déjà présents dans l'objet course
							if (!course.rating || !course.totalRatings) {
								// Essayer de récupérer les ratings depuis le chemin Elearning/Cours
								const feedbackRef = ref(
									database,
									`Elearning/Cours/${course.id}`,
								);
								const feedbackSnapshot = await get(feedbackRef);

								if (feedbackSnapshot.exists()) {
									const courseData = feedbackSnapshot.val();
									rating = courseData.rating || 0;
									totalRatings = courseData.totalRatings || 0;
								}

								// Si toujours pas de ratings, essayer de récupérer depuis le chemin elearning/courses
								if (rating === 0 && totalRatings === 0) {
									const altFeedbackRef = ref(
										database,
										`elearning/courses/${course.id}`,
									);
									const altFeedbackSnapshot = await get(altFeedbackRef);

									if (altFeedbackSnapshot.exists()) {
										const altCourseData = altFeedbackSnapshot.val();
										rating = altCourseData.rating || 0;
										totalRatings = altCourseData.totalRatings || 0;
									}
								}

								// Si toujours pas de ratings, essayer de calculer depuis les feedbacks existants
								if (rating === 0 && totalRatings === 0) {
									const feedbacksRef = ref(
										database,
										`Elearning/Feedback/${course.id}`,
									);
									const feedbacksSnapshot = await get(feedbacksRef);

									if (feedbacksSnapshot.exists()) {
										const feedbacks = feedbacksSnapshot.val();
										const feedbacksList = Object.values(feedbacks);

										if (feedbacksList.length > 0) {
											const sum = feedbacksList.reduce(
												(acc, fb) => acc + (fb.rating || 0),
												0,
											);
											rating = parseFloat(
												(sum / feedbacksList.length).toFixed(1),
											);
											totalRatings = feedbacksList.length;
										}
									}
								}
							}

							// Calculer aussi un score de popularité pour un tri futur si nécessaire
							const popularityScore = rating * 10 + studentsCount;

							return {
								...course,
								students: studentsCount,
								lessons: lessonsCount,
								rating: rating,
								totalRatings: totalRatings,
								popularityScore: popularityScore,
								createdAt: course.createdAt || new Date().toISOString(),
							};
						} catch (error) {
							console.error(
								`Erreur lors de la récupération des métadonnées pour le cours ${course.id}:`,
								error,
							);
							return course;
						}
					}),
				);

				// Option pour trier par popularité si souhaité
				// const sortedCourses = coursesWithExtra.sort((a, b) => b.popularityScore - a.popularityScore);
				// setCoursesWithMetadata(sortedCourses);

				setCoursesWithMetadata(coursesWithExtra);

				// Charger les spécialités
				const specialitesData = await fetchSpecialitesFromDatabase();
				setSpecialites(specialitesData);

				// Charger les disciplines
				const disciplinesData = await fetchDisciplinesFromDatabase();
				setDisciplines(disciplinesData);
			} catch (error) {
				console.error('Erreur lors du chargement des données:', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	// Filtrer les disciplines en fonction de la spécialité sélectionnée
	const filteredDisciplines = disciplines.filter(
		(discipline) =>
			selectedSpecialite === '' ||
			discipline.specialiteId === selectedSpecialite,
	);

	const filteredCourses = coursesWithMetadata.filter((course) => {
		// Vérifier si le cours a un titre ou utiliser un titre alternatif (titre ou "")
		const title = (course.title || course.titre || '').toLowerCase();
		// Vérifier si le cours a une description ou utiliser une chaîne vide
		const description = (course.description || '').toLowerCase();
		// Convertir le terme de recherche en minuscules
		const term = searchTerm.toLowerCase();

		const matchesSearch =
			term === '' || title.includes(term) || description.includes(term);
		const matchesLevel =
			selectedLevel === '' || (course.level || 'Beginner') === selectedLevel;
		const matchesSpecialite =
			selectedSpecialite === '' || course.specialiteId === selectedSpecialite;
		const matchesDiscipline =
			selectedDiscipline === '' || course.disciplineId === selectedDiscipline;

		return (
			matchesSearch && matchesLevel && matchesSpecialite && matchesDiscipline
		);
	});

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<OptimizedLoadingSpinner
					size='large'
					text='Chargement des cours...'
				/>
			</div>
		);
	}

	return (
		<section className='bg-[#f9f9f9] py-14 md:py-24'>
			<div className='container'>
				{/* Header */}
				<div className='space-y-4 text-center max-w-[600px] mx-auto mb-12'>
					<h3 className='uppercase font-semibold text-orange-500'>Nos Cours</h3>
					<h2 className='text-4xl font-semibold'>
						Explorez Nos Cours Populaires
					</h2>
				</div>

				{/* Filters */}
				<div className='flex flex-col md:flex-row gap-4 mb-8'>
					<div className='relative flex-1'>
						<input
							type='text'
							placeholder='Rechercher des cours...'
							className='w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/20'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
						<Search
							className='absolute left-3 top-2.5 text-gray-400'
							size={20}
						/>
					</div>
					<div className='flex gap-4'>
						<div className='relative'>
							<select
								className='pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20'
								value={selectedLevel}
								onChange={(e) => setSelectedLevel(e.target.value)}>
								<option value=''>Tous les niveaux</option>
								{levels.map((level) => (
									<option
										key={level}
										value={level}>
										{level}
									</option>
								))}
							</select>
							<SlidersHorizontal
								className='absolute left-3 top-2.5 text-gray-400'
								size={20}
							/>
						</div>
						<div className='relative'>
							<select
								className='pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20'
								value={selectedSpecialite}
								onChange={(e) => {
									setSelectedSpecialite(e.target.value);
									setSelectedDiscipline(''); // Réinitialiser la discipline lorsqu'on change de spécialité
								}}>
								<option value=''>Toutes les spécialités</option>
								{specialites.map((specialite) => (
									<option
										key={specialite.id}
										value={specialite.id}>
										{specialite.name}
									</option>
								))}
							</select>
							<Library
								className='absolute left-3 top-2.5 text-gray-400'
								size={20}
							/>
						</div>

						<div className='relative'>
							<select
								className='pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-secondary/20'
								value={selectedDiscipline}
								onChange={(e) => setSelectedDiscipline(e.target.value)}
								disabled={selectedSpecialite === ''}>
								<option value=''>Toutes les disciplines</option>
								{filteredDisciplines.map((discipline) => (
									<option
										key={discipline.id}
										value={discipline.id}>
										{discipline.name}
									</option>
								))}
							</select>
							<BookOpen
								className='absolute left-3 top-2.5 text-gray-400'
								size={20}
							/>
						</div>
					</div>
				</div>

				{/* Courses Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
					{filteredCourses.map((course, index) => (
						<motion.div
							key={course.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: index * 0.1 }}
							className='bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300'>
							<div className='relative'>
								<img
									src={
										course.image ||
										'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'
									}
									alt={course.title || course.titre || 'Course'}
									className='w-full h-56 object-cover'
									onError={(e) => {
										e.target.src =
											'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80';
									}}
								/>
								<div className='absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-md'>
									<Clock className='w-4 h-4 text-secondary' />
									<span className='text-sm'>
										{course.duration || '40 heures'}
									</span>
								</div>
							</div>

							<div className='p-6'>
								<span className='inline-block bg-secondary/5 text-secondary px-4 py-1 rounded-full text-sm font-medium mb-4'>
									{course.level || 'Intermédiaire'}
								</span>

								<Link to={`/course/${course.id}`}>
									<h3 className='text-xl font-bold mb-4 hover:text-secondary transition-colors duration-300'>
										{course.title || course.titre || 'Cours'}
									</h3>
								</Link>

								<div className='flex items-center gap-2 mb-4'>
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
									<p className='text-sm text-gray-600'>
										({course.rating || 0}/{course.totalRatings || 0}{' '}
										Évaluations)
									</p>
								</div>

								<div className='flex justify-between items-center mb-4'>
									<span className='text-2xl font-bold text-secondary'>
										${(parseFloat(course.price) || 29.99).toFixed(2)}
									</span>
								</div>

								<div className='flex items-center justify-between pt-4 border-t'>
									<div className='flex items-center gap-2 text-gray-600'>
										<Library className='w-4 h-4' />
										<span className='text-sm'>
											{course.lessons || 0} Leçons
										</span>
									</div>
									<div className='flex items-center gap-2 text-gray-600'>
										<Users className='w-4 h-4' />
										<span className='text-sm'>
											{course.students || 0} Étudiants
										</span>
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>

				{/* No Results Message */}
				{filteredCourses.length === 0 && (
					<div className='text-center py-12'>
						<h3 className='text-xl font-semibold text-gray-600'>
							No courses found
						</h3>
						<p className='text-gray-500 mt-2'>
							Try adjusting your search or filters
						</p>
					</div>
				)}
			</div>
		</section>
	);
};

export default CoursesPage;
