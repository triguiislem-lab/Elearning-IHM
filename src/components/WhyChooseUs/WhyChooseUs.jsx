import React from 'react';
import { GrYoga } from 'react-icons/gr';
import { FaDumbbell } from 'react-icons/fa6';
import { GiGymBag } from 'react-icons/gi';
import { motion } from 'framer-motion';
import { SlideLeft } from '../../utility/animation';

const WhyChooseData = [
	{
		id: 1,
		title: 'Cours personnalisés',
		desc: "Tous nos experts en formation disposent d'un diplôme dans leur domaine d'enseignement.",
		icon: <GrYoga />,
		bgColor: '#0063ff',
		delay: 0.3,
	},
	{
		id: 2,
		title: 'Disponibilité 24/7',
		desc: "Notre plateforme est accessible à tout moment pour vous permettre d'apprendre à votre rythme.",
		link: '/',
		icon: <FaDumbbell />,
		bgColor: '#73bc00',
		delay: 0.6,
	},
	{
		id: 3,
		title: 'Outils interactifs',
		desc: "Notre plateforme est équipée d'outils interactifs avec fonctionnalités audio et vidéo.",
		link: '/',
		icon: <GiGymBag />,
		bgColor: '#fa6400',
		delay: 0.9,
	},
	{
		id: 4,
		title: 'Prix abordables',
		desc: 'Choisissez parmi nos formations selon votre budget et vos besoins.',
		link: '/',
		icon: <GiGymBag />,
		bgColor: '#fe6baa',
		delay: 0.9,
	},
];
const WhyChooseUs = () => {
	return (
		<div className='bg-[#f9fafc]'>
			<div className='container py-24'>
				{/* header section */}
				<div className='space-y-4 p-6 text-center max-w-[500px] mx-auto mb-5'>
					<h1 className='uppercase font-semibold text-orange-600'>
						Pourquoi nous choisir
					</h1>
					<p className='font-semibold text-3xl'>
						Les avantages de notre plateforme d'apprentissage en ligne
					</p>
				</div>
				{/* cards section */}
				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6'>
					{WhyChooseData.map((item) => {
						return (
							<motion.div
								key={item.id}
								variants={SlideLeft(item.delay)}
								initial='hidden'
								whileInView={'visible'}
								className='space-y-4 p-6 rounded-xl shadow-[0_0_22px_rgba(0,0,0,0.15)]'>
								{/* icon section */}
								<div
									style={{ backgroundColor: item.bgColor }}
									className='w-10 h-10 rounded-lg flex justify-center items-center text-white'>
									<div className='text-2xl'>{item.icon}</div>
								</div>
								<p className='font-semibold'>{item.title}</p>
								<p className='text-sm text-gray-500'>{item.desc}</p>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default WhyChooseUs;
