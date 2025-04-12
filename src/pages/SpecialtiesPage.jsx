import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaComputer, FaBook } from 'react-icons/fa6';
import { fetchSpecialitesFromDatabase } from '../utils/firebaseUtils';
import { Link } from 'react-router-dom';
import OptimizedLoadingSpinner from '../components/Common/OptimizedLoadingSpinner';

const SpecialtiesPage = () => {
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const specialitesData = await fetchSpecialitesFromDatabase();
        setSpecialites(specialitesData);
      } catch (error) {
        console.error('Erreur lors du chargement des spécialités:', error);
        setError('Une erreur est survenue lors du chargement des spécialités.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fonction pour déterminer l'icône à afficher
  const getIcon = (iconName) => {
    if (iconName === 'FaComputer') return <FaComputer className="text-secondary text-xl" />;
    return <FaBook className="text-secondary text-xl" />;
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header section */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Nos Spécialités</h1>
            <p className="text-gray-600">
              Découvrez toutes nos spécialités de formation et trouvez celle qui correspond à vos besoins et objectifs professionnels.
            </p>
          </div>

          {/* Content section */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <OptimizedLoadingSpinner size="large" text="Chargement des spécialités..." />
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          ) : specialites.length === 0 ? (
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <p className="text-gray-600">Aucune spécialité disponible pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {specialites.map((specialite) => (
                <Link
                  key={specialite.id}
                  to={`/specialite/${specialite.id}`}
                  className="block"
                >
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full"
                  >
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-secondary/10 mb-4">
                        {getIcon(specialite.icon || 'FaBook')}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        {specialite.name}
                      </h3>
                      <p className="text-gray-600 text-sm flex-grow">
                        {specialite.description || 'Explorez les cours dans cette spécialité pour développer vos compétences.'}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-secondary font-medium text-sm flex items-center justify-end">
                          Voir les formations
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SpecialtiesPage;
