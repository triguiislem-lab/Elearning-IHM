import React, { useState, useEffect } from "react";
import {
  MdRestore,
  MdSearch,
  MdFilterList,
  MdBook,
  MdCategory,
} from "react-icons/md";
import { database } from "../../../firebaseConfig";
import { ref, get } from "firebase/database";
import {
  fetchSpecialitesFromDatabase,
  fetchDisciplinesFromDatabase,
} from "../../utils/firebaseUtils";
import { restoreEntity } from "../../utils/databaseUtils";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";
import { useToast } from "../../contexts/ToastContext";

/**
 * Component to display and manage archived specialities
 */
const ArchivedSpecialitesView = ({ onClose, onSuccess, onError }) => {
  const toast = useToast();
  const [archivedSpecialites, setArchivedSpecialites] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialite, setSelectedSpecialite] = useState(null);
  const [processingSpecialiteId, setProcessingSpecialiteId] = useState(null);

  // Load archived specialites and all disciplines
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get all specialites including archived ones (true parameter) and force refresh
        const specialitesData = await fetchSpecialitesFromDatabase(true, true);

        // Get all disciplines with force refresh
        const disciplinesList = await fetchDisciplinesFromDatabase(true);
        setDisciplines(disciplinesList);

        if (!specialitesData || specialitesData.length === 0) {
          setArchivedSpecialites([]);
          setLoading(false);
          return;
        }

        // Filter only archived specialites
        const archivedSpecialitesList = specialitesData
          .filter((specialite) => specialite.archived)
          .map((specialite) => {
            // Count disciplines for this specialite
            const relatedDisciplines = disciplinesList.filter(
              (d) => d.specialiteId === specialite.id
            );

            return {
              ...specialite,
              name: specialite.name || "Spécialité sans nom",
              description: specialite.description || "Aucune description",
              disciplinesCount: relatedDisciplines.length,
              disciplines: relatedDisciplines,
            };
          });

        setArchivedSpecialites(archivedSpecialitesList);
      } catch (error) {
        console.error("Error loading archived specialites:", error);
        toast.error("Erreur lors du chargement des spécialités archivées");
        onError &&
          onError("Erreur lors du chargement des spécialités archivées");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [onError]);

  // Handle specialite restoration
  const handleRestoreSpecialite = async (specialiteId) => {
    if (!specialiteId) return;

    if (
      !window.confirm("Êtes-vous sûr de vouloir restaurer cette spécialité ?")
    ) {
      return;
    }

    setProcessingSpecialiteId(specialiteId);
    try {
      const success = await restoreEntity("specialites", specialiteId, {
        restoredAt: new Date().toISOString(),
      });

      if (success) {
        // Remove from list
        setArchivedSpecialites((prev) =>
          prev.filter((s) => s.id !== specialiteId)
        );

        if (selectedSpecialite && selectedSpecialite.id === specialiteId) {
          setSelectedSpecialite(null);
        }

        // Show success toast and notify parent
        toast.success("Spécialité restaurée avec succès");
        onSuccess && onSuccess("Spécialité restaurée avec succès");
      } else {
        toast.error("Erreur lors de la restauration de la spécialité");
        onError && onError("Erreur lors de la restauration de la spécialité");
      }
    } catch (error) {
      console.error("Error restoring specialite:", error);
      toast.error("Erreur lors de la restauration de la spécialité");
      onError && onError("Erreur lors de la restauration de la spécialité");
    } finally {
      setProcessingSpecialiteId(null);
    }
  };

  // Filter specialites by search term
  const filteredSpecialites = archivedSpecialites.filter((specialite) => {
    const matchesSearch =
      (specialite.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (specialite.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Spécialités archivées
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          Fermer
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Rechercher une spécialité..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MdSearch
            className="absolute left-3 top-2.5 text-gray-400"
            size={20}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <OptimizedLoadingSpinner />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row h-[500px] gap-4">
          {/* Specialites list */}
          <div className="w-full md:w-1/3 border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b font-medium">
              Spécialités archivées ({filteredSpecialites.length})
            </div>
            <div className="overflow-y-auto h-[calc(500px-3rem)]">
              {filteredSpecialites.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MdCategory
                    size={48}
                    className="mx-auto mb-2 text-gray-400"
                  />
                  <p>Aucune spécialité archivée trouvée</p>
                </div>
              ) : (
                filteredSpecialites.map((specialite) => (
                  <div
                    key={specialite.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSpecialite &&
                      selectedSpecialite.id === specialite.id
                        ? "bg-blue-50"
                        : ""
                    }`}
                    onClick={() => setSelectedSpecialite(specialite)}
                  >
                    <h3 className="font-medium text-gray-800">
                      {specialite.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MdBook className="mr-1" />
                      <span>
                        {specialite.disciplinesCount} discipline
                        {specialite.disciplinesCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Specialite details */}
          <div className="w-full md:w-2/3 border rounded-lg overflow-hidden">
            {selectedSpecialite ? (
              <div className="h-full flex flex-col">
                <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">Détails de la spécialité</h3>
                  <button
                    onClick={() =>
                      handleRestoreSpecialite(selectedSpecialite.id)
                    }
                    disabled={processingSpecialiteId === selectedSpecialite.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    {processingSpecialiteId === selectedSpecialite.id ? (
                      <OptimizedLoadingSpinner size="small" />
                    ) : (
                      <>
                        <MdRestore size={16} />
                        <span>Restaurer</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-grow">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Informations de la spécialité
                      </h4>
                      <div className="space-y-2">
                        <p>
                          <strong>Nom:</strong> {selectedSpecialite.name}
                        </p>
                        <p>
                          <strong>Description:</strong>{" "}
                          {selectedSpecialite.description}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Informations d'archivage
                      </h4>
                      <div className="space-y-2">
                        <p>
                          <strong>Archivé le:</strong>{" "}
                          {selectedSpecialite.archivedAt
                            ? new Date(
                                selectedSpecialite.archivedAt
                              ).toLocaleString()
                            : "Date inconnue"}
                        </p>
                        <p>
                          <strong>Archivé par:</strong>{" "}
                          {selectedSpecialite.archivedBy ||
                            "Utilisateur inconnu"}
                        </p>
                        <p>
                          <strong>Raison:</strong>{" "}
                          {selectedSpecialite.archivedReason || "Non spécifiée"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Disciplines ({selectedSpecialite.disciplines.length})
                      </h4>
                      {selectedSpecialite.disciplines.length === 0 ? (
                        <p className="text-gray-500">
                          Aucune discipline associée à cette spécialité
                        </p>
                      ) : (
                        <ul className="list-disc pl-5 text-gray-600">
                          {selectedSpecialite.disciplines.map((discipline) => (
                            <li key={discipline.id}>{discipline.name}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() =>
                          handleRestoreSpecialite(selectedSpecialite.id)
                        }
                        disabled={
                          processingSpecialiteId === selectedSpecialite.id
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MdRestore />
                        {processingSpecialiteId === selectedSpecialite.id
                          ? "Restauration..."
                          : "Restaurer cette spécialité"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <MdCategory size={64} className="mb-4 text-gray-300" />
                <p>Sélectionnez une spécialité pour voir ses détails</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivedSpecialitesView;
