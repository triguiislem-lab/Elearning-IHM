import React, { useState } from "react";
import { runDatabaseCleanup } from "../../utils/databaseCleanup";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";

const DatabaseCleanup = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const database = getDatabase();

  // Vérifier si l'utilisateur est un administrateur
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!auth.currentUser) {
        navigate("/login");
        return;
      }

      try {
        const adminRef = ref(
          database,
          `Elearning/Administrateurs/${auth.currentUser.uid}`
        );
        const adminSnapshot = await get(adminRef);

        if (adminSnapshot.exists()) {
          setIsAdmin(true);
        } else {
          // Vérifier également dans Utilisateurs
          const userRef = ref(
            database,
            `Elearning/Utilisateurs/${auth.currentUser.uid}`
          );
          const userSnapshot = await get(userRef);

          if (
            userSnapshot.exists() &&
            userSnapshot.val().userType === "administrateur"
          ) {
            setIsAdmin(true);
          } else {
            navigate("/");
          }
        }
      } catch (error) {
        navigate("/");
      }
    };

    checkAdminStatus();
  }, [auth.currentUser, database, navigate]);

  const handleCleanup = async () => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir nettoyer la base de données ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const cleanupResult = await runDatabaseCleanup();
      setResult(cleanupResult);
    } catch (error) {
      setResult({ success: false, message: `Erreur: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">
            Accès non autorisé
          </h1>
          <p className="text-gray-600 text-center">
            Vous n'avez pas les autorisations nécessaires pour accéder à cette
            page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Nettoyage de la base de données
          </h1>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Opérations qui seront effectuées :
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>
                Centralisation des inscriptions dans{" "}
                <code>Elearning/Enrollments</code>
              </li>
              <li>Standardisation de la structure des modules</li>
              <li>
                Centralisation des évaluations dans{" "}
                <code>Elearning/Evaluations</code>
              </li>
              <li>Standardisation de la progression des utilisateurs</li>
              <li>Suppression des chemins obsolètes</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Attention :</strong> Cette opération est irréversible.
                  Assurez-vous d'avoir une sauvegarde de votre base de données
                  avant de continuer.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCleanup}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <OptimizedLoadingSpinner
                  size="small"
                  text="Nettoyage en cours..."
                />
              </div>
            ) : (
              "Nettoyer la base de données"
            )}
          </button>

          {result && (
            <div
              className={`mt-6 p-4 rounded-md ${
                result.success
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <svg
                      className="h-5 w-5 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-red-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {result.success ? "Succès" : "Erreur"}
                  </h3>
                  <div className="mt-2 text-sm">
                    <p>{result.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseCleanup;
