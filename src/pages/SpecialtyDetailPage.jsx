import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	fetchSpecialitesFromDatabase,
	fetchCoursesFromDatabase,
} from '../utils/firebaseUtils';
import OptimizedLoadingSpinner from '../components/Common/OptimizedLoadingSpinner';
import { Star, Clock, Users, Library } from 'lucide-react';

const SpecialtyDetailPage = () => {
	const { id } = useParams();
	const [specialty, setSpecialty] = useState(null);
	const [courses, setCourses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);

				// Fetch the specialty details
				const specialties = await fetchSpecialitesFromDatabase();
				const currentSpecialty = specialties.find((s) => s.id === id);

				if (!currentSpecialty) {
					setError('Spécialité non trouvée');
					setLoading(false);
					return;
				}

				setSpecialty(currentSpecialty);

				// Fetch courses for this specialty
				const allCourses = await fetchCoursesFromDatabase(true);
				const specialtyCourses = allCourses.filter(
					(course) => course.specialiteId === id,
				);

				setCourses(specialtyCourses);
			} catch (error) {
				console.error('Erreur lors du chargement des données:', error);
				setError('Une erreur est survenue lors du chargement des données.');
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [id]);

	if (loading) {
		return (
			<div className='min-h-screen pt-24 pb-12 flex justify-center items-center'>
				<OptimizedLoadingSpinner
					size='large'
					text='Chargement des données...'
				/>
			</div>
		);
	}

	if (error) {
		return (
			<div className='min-h-screen pt-24 pb-12'>
				<div className='container mx-auto px-4'>
					<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center'>
						{error}
					</div>
					<div className='mt-6 text-center'>
						<Link
							to='/specialites'
							className='text-secondary hover:underline'>
							Retour aux spécialités
						</Link>
					</div>
				</div>
			</div>
		);
	}

	if (!specialty) {
		return (
			<div className='min-h-screen pt-24 pb-12'>
				<div className='container mx-auto px-4'>
					<div className='bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg text-center'>
						Spécialité non trouvée
					</div>
					<div className='mt-6 text-center'>
						<Link
							to='/specialites'
							className='text-secondary hover:underline'>
							Retour aux spécialités
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen pt-24 pb-12'>
			<div className='container mx-auto px-4'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}>
					{/* Back link */}
					<div className='mb-6'>
						<Link
							to='/specialites'
							className='text-secondary hover:underline flex items-center gap-2'>
							<svg
								className='w-4 h-4'
								xmlns='http://www.w3.org/2000/svg'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth='2'
									d='M15 19l-7-7 7-7'
								/>
							</svg>
							Retour aux spécialités
						</Link>
					</div>

					{/* Header section */}
					<div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 mb-10'>
						<h1 className='text-3xl md:text-4xl font-bold mb-4'>
							{specialty.name}
						</h1>
						<p className='text-gray-600 max-w-3xl'>
							{specialty.description ||
								'Explorez les cours dans cette spécialité pour développer vos compétences.'}
						</p>
					</div>

					{/* Courses section */}
					<div className='mb-10'>
						<h2 className='text-2xl font-bold mb-6'>Formations disponibles</h2>

						{courses.length === 0 ? (
							<div className='bg-gray-100 p-8 rounded-lg text-center'>
								<p className='text-gray-600'>
									Aucune formation disponible dans cette spécialité pour le
									moment.
								</p>
								<Link
									to='/courses'
									className='mt-4 inline-block text-secondary hover:underline'>
									Voir toutes les formations
								</Link>
							</div>
						) : (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
								{courses.map((course, index) => (
									<motion.div
										key={course.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3, delay: index * 0.1 }}
										className='bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300'>
										<div className='relative'>
											<img
												src={
													course.image ||
													'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'
												}
												alt={course.title || course.titre}
												className='w-full h-56 object-cover'
												onError={(e) => {
													e.target.src =
														'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80';
												}}
											/>
										</div>

										<div className='p-6'>
											<span className='inline-block bg-secondary/5 text-secondary px-4 py-1 rounded-full text-sm font-medium mb-4'>
												{course.level || 'Intermédiaire'}
											</span>

											<Link to={`/course/${course.id}`}>
												<h3 className='text-xl font-bold mb-4 hover:text-secondary transition-colors duration-300'>
													{course.title || course.titre}
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
													{course.price
														? `$${parseFloat(course.price).toFixed(2)}`
														: 'Gratuit'}
												</span>
											</div>

											<div className='flex items-center justify-between pt-4 border-t'>
												<div className='flex items-center gap-2 text-gray-600'>
													<Clock className='w-4 h-4' />
													<span className='text-sm'>
														{course.duration || course.duree || '40 heures'}
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
						)}
					</div>

					{/* Back to specialties button */}
					<div className='text-center'>
						<Link
							to='/specialites'
							className='inline-block bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors duration-300'>
							Voir toutes les spécialités
						</Link>
					</div>
				</motion.div>
			</div>
		</div>
	);
};

export default SpecialtyDetailPage;
