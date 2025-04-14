import React, { useState, useEffect } from "react";
import { runDatabaseStandardization } from "../../utils/databaseStandardization";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";
import { MdWarning, MdCheckCircle, MdError } from "react-icons/md";

const DatabaseStandardization = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmRun, setConfirmRun] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const database = getDatabase();

  // Vérifier si l'utilisateur est un administrateur
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      try {
        // Check in the standardized lowercase path first
        const standardAdminRef = ref(
          database,
          `elearning/users/${auth.currentUser.uid}`
        );
        const standardAdminSnapshot = await get(standardAdminRef);

        if (standardAdminSnapshot.exists() &&
            (standardAdminSnapshot.val().role === "admin" ||
             standardAdminSnapshot.val().userType === "administrateur")) {
          setIsAdmin(true);
        } else {
          // Check in legacy capitalized paths as fallback
          const legacyAdminRef = ref(
            database,
            `Elearning/Administrateurs/${auth.currentUser.uid}`
          );
          const legacyAdminSnapshot = await get(legacyAdminRef);

          if (legacyAdminSnapshot.exists()) {
            setIsAdmin(true);
          } else {
            // Check in legacy Users collection
            const legacyUserRef = ref(
              database,
              `Elearning/Utilisateurs/${auth.currentUser.uid}`
            );
            const legacyUserSnapshot = await get(legacyUserRef);

            if (
              legacyUserSnapshot.exists() &&
              legacyUserSnapshot.val().userType === "administrateur"
            ) {
              setIsAdmin(true);
            } else {
              navigate("/");
            }
          }
        }
      } catch (error) {
        navigate("/");
      }
    };

    checkAdminStatus();
  }, [auth, database, navigate]);

  const handleStandardization = async () => {
    setLoading(true);
    setResult(null);

    try {
      const standardizationResult = await runDatabaseStandardization();
      setResult(standardizationResult);
    } catch (error) {
      setResult({
        success: false,
        message: `Erreur: ${error.message}`,
        details: { error: error.message }
      });
    } finally {
      setLoading(false);
      setConfirmRun(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <OptimizedLoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="bg-white rounded-xl shadow-md p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Standardisation de la Base de Données
        </h1>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <MdWarning className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Attention:</strong> Cette opération va migrer les données des chemins hérités (Elearning avec E majuscule) 
                vers les chemins standardisés (elearning avec e minuscule). Assurez-vous d'avoir une sauvegarde de votre base de données 
                avant de continuer.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Qu'est-ce que cela fait?</h2>
          <p className="text-gray-600 mb-4">
            Cette opération va:
          </p>
          <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-1">
            <li>Migrer les utilisateurs des collections <code>Elearning/Administrateurs</code>, <code>Elearning/Formateurs</code> et <code>Elearning/Apprenants</code> vers <code>elearning/users</code></li>
            <li>Migrer les cours de <code>Elearning/Cours</code> vers <code>elearning/courses</code></li>
            <li>Migrer les formations de <code>Elearning/Formations</code> vers <code>elearning/specialites</code></li>
            <li>Migrer les inscriptions de <code>Elearning/Inscriptions</code> vers <code>elearning/enrollments</code></li>
            <li>Migrer d'autres collections comme les messages et les évaluations</li>
          </ul>
          <p className="text-gray-600">
            <strong>Note:</strong> Les données existantes dans les chemins standardisés ne seront pas écrasées.
          </p>
        </div>

        {!confirmRun ? (
          <button
            onClick={() => setConfirmRun(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Lancer la standardisation
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-700 mb-4">
              Êtes-vous sûr de vouloir lancer la standardisation de la base de données? Cette opération ne peut pas être annulée.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleStandardization}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                disabled={loading}
              >
                {loading ? "Standardisation en cours..." : "Confirmer la standardisation"}
              </button>
              <button
                onClick={() => setConfirmRun(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex items-center justify-center">
            <OptimizedLoadingSpinner size="medium" />
            <span className="ml-3 text-gray-600">Standardisation en cours...</span>
          </div>
        )}

        {result && (
          <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {result.success ? (
                  <MdCheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <MdError className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Standardisation réussie' : 'Erreur de standardisation'}
                </h3>
                <div className="mt-2 text-sm">
                  <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                    {result.message}
                  </p>
                </div>
                {result.details && result.details.migrated && result.details.migrated.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Chemins migrés:</h4>
                    <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                      {result.details.migrated.map((path, index) => (
                        <li key={index}>{path}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.details && result.details.errors && result.details.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Erreurs:</h4>
                    <ul className="mt-1 list-disc pl-5 text-sm text-red-600">
                      {result.details.errors.map((error, index) => (
                        <li key={index}>{error.path}: {error.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DatabaseStandardization;
