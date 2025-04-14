import React, { useState } from "react";
import { createTestModulesForCourse, fetchCourseById } from "../../utils/firebaseUtils";

const TestModuleCreator = ({ courseId, onModulesCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreateTestModules = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      
      const result = await createTestModulesForCourse(courseId);
      
      if (result) {
        setSuccess("Modules de test créés avec succès!");
        
        
        // Récupérer le cours mis à jour
        const updatedCourse = await fetchCourseById(courseId);
        
        if (updatedCourse && onModulesCreated) {
          onModulesCreated(updatedCourse);
        }
      } else {
        setError("Erreur lors de la création des modules de test");
      }
    } catch (error) {
      
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <h2 className="text-xl font-bold mb-4">Créer des modules de test</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <p className="text-gray-600 mb-4">
        Cliquez sur le bouton ci-dessous pour créer automatiquement des modules et des évaluations de test pour ce cours.
      </p>
      
      <button
        onClick={handleCreateTestModules}
        disabled={loading}
        className="bg-secondary text-white px-6 py-2 rounded-md flex items-center justify-center hover:bg-secondary/90 transition-colors duration-300 w-full md:w-auto"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          "Créer des modules de test"
        )}
      </button>
    </div>
  );
};

export default TestModuleCreator;
