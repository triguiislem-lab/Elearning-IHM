import React from 'react';
import { motion } from 'framer-motion';

const NavbarBanner = () => {
	const [isOpen, setIsOpen] = React.useState(true);
	return (
		isOpen && (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5, delay: 0.7 }}
				className='bg-primary text-sm text-center font-semibold p-1 hidden lg:block relative'>
				Vous êtes un établissement d'enseignement intéressé par notre plateforme
				d'apprentissage en ligne ?
				<a
					href='#'
					className='text-secondary ml-2'>
					Contactez-nous
				</a>
				<div
					className='absolute top-1/2 right-10 cursor-pointer -translate-y-1/2'
					onClick={() => setIsOpen(false)}>
					X
				</div>
			</motion.div>
		)
	);
};

export default NavbarBanner;
