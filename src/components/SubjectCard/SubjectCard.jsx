import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaComputer, FaBook } from "react-icons/fa6";
import { fetchSpecialitesFromDatabase } from "../../utils/firebaseUtils";
import { Link } from "react-router-dom";
import { getIcon } from "../../utils/iconUtils";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

const SubjectCard = () => {
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les spécialités

        const specialitesData = await fetchSpecialitesFromDatabase();

        setSpecialites(specialitesData);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fonction pour déterminer l'icône à afficher
  const getIcon = (iconName) => {
    if (iconName === "FaComputer") return <FaComputer />;
    return <FaBook />;
  };

  if (loading) {
    return (
      <div className="container py-14 md:py-24 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <div className="container py-14 md:py-24">
      {/* header section */}
      <div className="space-y-4 p-6 text-center max-w-[600px] mx-auto mb-5">
        <h1 className="uppercase font-semibold text-orange-500">
          Nos formations
        </h1>
        <p className="font-semibold text-3xl">
          Trouvez la formation qui vous convient
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <OptimizedLoadingSpinner
            size="medium"
            text="Chargement du sujet..."
          />
        </div>
      ) : specialites.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">
            Aucune spécialité disponible pour le moment.
          </p>
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
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
                    {getIcon(specialite.icon || "FaBook")}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {specialite.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {specialite.description || "Description non disponible"}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectCard;
