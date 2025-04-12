import React, { useState, useEffect } from 'react';
import { fetchTestimonialsFromDatabase } from '../../utils/firebaseUtils';
import OptimizedLoadingSpinner from '../Common/OptimizedLoadingSpinner';
import { motion } from 'framer-motion';

// Testimonials par défaut pour le fallback
const defaultTestimonials = [
	{
		id: 1,
		name: 'Sophie Martin',
		role: 'Étudiante en Marketing Digital',
		comment:
			"Cette plateforme d'apprentissage a transformé ma façon d'étudier. Les cours sont interactifs et les instructeurs sont très compétents. J'ai pu acquérir de nouvelles compétences en seulement quelques mois.",
		avatar:
			'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
		rating: 5,
	},
	{
		id: 2,
		name: 'Thomas Dubois',
		role: 'Développeur Web',
		comment:
			"Le meilleur investissement que j'ai fait pour ma carrière. La qualité des cours et le support de la communauté sont exceptionnels. Je recommande vivement !",
		avatar:
			'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
		rating: 5,
	},
	{
		id: 3,
		name: 'Marie Laurent',
		role: 'Designer UX/UI',
		comment:
			"J'apprécie particulièrement la flexibilité de la plateforme. Je peux apprendre à mon rythme et les ressources sont toujours à jour avec les dernières tendances.",
		avatar:
			'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
		rating: 5,
	},
];

const Testimonial = () => {
	const [testimonials, setTestimonials] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadTestimonials = async () => {
			try {
				setLoading(true);
				// Récupérer jusqu'à 6 témoignages depuis la base de données
				const data = await fetchTestimonialsFromDatabase(6);
				if (data && data.length > 0) {
					// Ajouter la propriété delay aux témoignages chargés
					const testimonialsWithDelay = data.map((item, index) => ({
						...item,
						delay: 0.2 + index * 0.3,
					}));
					setTestimonials(testimonialsWithDelay);
				} else {
					setTestimonials(defaultTestimonials);
				}
			} catch (error) {
				console.error('Erreur lors du chargement des témoignages:', error);
				setTestimonials(defaultTestimonials);
			} finally {
				setLoading(false);
			}
		};

		loadTestimonials();
	}, []);

	// Fonction pour générer les étoiles en fonction de la note
	const renderStars = (rating) => {
		return Array.from({ length: 5 }).map((_, index) => (
			<span
				key={index}
				className={`text-yellow-400 text-xl`}>
				{index < Math.floor(rating) ? '★' : '☆'}
			</span>
		));
	};

	return (
		<div className='py-14 mb-10 bg-gray-50'>
			<div className='container'>
				{/* header section */}
				<div className='space-y-4 p-6 text-center max-w-[600px] mx-auto mb-10'>
					<h1 className='uppercase font-semibold text-orange-600'>
						AVIS DES ÉTUDIANTS
					</h1>
					<p className='font-semibold text-3xl'>
						Ce Que Nos Étudiants Disent De Nous
					</p>
				</div>

				{/* Testimonial cards section */}
				<div>
					{loading ? (
						<div className='flex justify-center items-center h-40'>
							<OptimizedLoadingSpinner
								size='large'
								text='Chargement des témoignages...'
							/>
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{testimonials.slice(0, 3).map((item, index) => (
								<motion.div
									key={item.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: index * 0.1 }}
									className='bg-white rounded-lg shadow-md overflow-hidden'>
									<div className='p-6'>
										{/* Avatar and identity section */}
										<div className='flex items-center gap-4 mb-3'>
											<img
												src={item.avatar}
												alt={item.name}
												className='w-14 h-14 rounded-full object-cover'
												onError={(e) => {
													e.target.onerror = null;
													e.target.src =
														'https://ui-avatars.com/api/?name=' +
														encodeURIComponent(item.name) +
														'&background=random';
												}}
											/>
											<div>
												<h3 className='font-bold text-gray-900'>{item.name}</h3>
												<p className='text-sm text-gray-600'>{item.role}</p>
											</div>
										</div>

										{/* Rating stars */}
										<div className='flex mb-4'>{renderStars(item.rating)}</div>

										{/* Testimonial content */}
										<p className='text-gray-700 leading-relaxed'>
											"{item.comment}"
										</p>
									</div>
								</motion.div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Testimonial;
