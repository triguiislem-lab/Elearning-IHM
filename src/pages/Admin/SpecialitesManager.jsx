import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdSave,
  MdCancel,
  MdArchive,
  MdBook,
  MdCategory,
  MdSearch,
} from "react-icons/md";
import {
  fetchSpecialitesFromDatabase,
  fetchDisciplinesFromDatabase,
} from "../../utils/firebaseUtils";
import { database } from "../../../firebaseConfig";
import { ref, set } from "firebase/database";
import { archiveEntity } from "../../utils/databaseUtils";
import { useToast } from "../../contexts/ToastContext";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";
import ArchivedSpecialitesView from "../../components/Admin/ArchivedSpecialitesView";

const SpecialitesManager = () => {
  const [specialites, setSpecialites] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const toast = useToast();
  const [editMode, setEditMode] = useState(null);
  const [newSpecialite, setNewSpecialite] = useState({
    name: "",
    description: "",
  });
  const [newDiscipline, setNewDiscipline] = useState({
    name: "",
    description: "",
    specialiteId: "",
  });
  const [editingDiscipline, setEditingDiscipline] = useState(null);
  const [showArchivedSpecialites, setShowArchivedSpecialites] = useState(false);
  const [showAddSpecialiteModal, setShowAddSpecialiteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Force refresh when component mounts
    loadSpecialites(true);
  }, []);

  const loadSpecialites = async (forceRefresh = false) => {
    try {
      setLoading(true);
      // Pass false to exclude archived specialites and forceRefresh to force data refresh
      const specialitesData = await fetchSpecialitesFromDatabase(
        false,
        forceRefresh
      );
      setSpecialites(specialitesData);

      const disciplinesData = await fetchDisciplinesFromDatabase(forceRefresh);
      setDisciplines(disciplinesData);
    } catch (err) {
      toast.error("Erreur lors du chargement des spécialités");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      if (!newSpecialite.name.trim()) {
        toast.error("Le nom de la spécialité est requis");
        return;
      }

      const specialiteId = Date.now().toString(36);
      const specialiteRef = ref(
        database,
        `elearning/specialites/${specialiteId}`
      );

      await set(specialiteRef, {
        ...newSpecialite,
        createdAt: new Date().toISOString(),
      });

      setNewSpecialite({ name: "", description: "" });
      toast.success("Spécialité ajoutée avec succès");
      await loadSpecialites(true);
      setShowAddSpecialiteModal(false);
    } catch (err) {
      toast.error("Erreur lors de l'ajout de la spécialité");
    }
  };

  const handleEdit = async (specialite) => {
    try {
      const specialiteRef = ref(
        database,
        `elearning/specialites/${specialite.id}`
      );
      await set(specialiteRef, {
        ...specialite,
        updatedAt: new Date().toISOString(),
      });

      setEditMode(null);
      await loadSpecialites(true);
    } catch (err) {
      toast.error("Erreur lors de la modification de la spécialité");
    }
  };

  const handleArchive = async (specialiteId) => {
    try {
      // Archive the specialite instead of deleting
      const success = await archiveEntity("specialites", specialiteId, {
        archivedReason: "Archived by administrator",
      });

      if (success) {
        await loadSpecialites(true);
      } else {
        toast.error("Erreur lors de l'archivage de la spécialité");
      }
    } catch (err) {
      toast.error("Erreur lors de l'archivage de la spécialité");
    }
  };

  // Handle adding a new discipline
  const handleAddDiscipline = async () => {
    try {
      if (!newDiscipline.name.trim()) {
        toast.error("Le nom de la discipline est requis");
        return;
      }

      if (!newDiscipline.specialiteId) {
        toast.error(
          "Veuillez sélectionner une spécialité pour cette discipline"
        );
        return;
      }

      const disciplineId = Date.now().toString(36);
      const disciplineRef = ref(
        database,
        `elearning/disciplines/${disciplineId}`
      );

      await set(disciplineRef, {
        ...newDiscipline,
        createdAt: new Date().toISOString(),
      });

      setNewDiscipline({
        name: "",
        description: "",
        specialiteId: newDiscipline.specialiteId,
      });
      toast.success("Discipline ajoutée avec succès");
      await loadSpecialites(true);
    } catch (err) {
      toast.error("Erreur lors de l'ajout de la discipline");
    }
  };

  // Handle editing a discipline
  const handleEditDiscipline = async (discipline) => {
    try {
      if (!discipline.name.trim()) {
        setError("Le nom de la discipline est requis");
        return;
      }

      const disciplineRef = ref(
        database,
        `elearning/disciplines/${discipline.id}`
      );

      await set(disciplineRef, {
        ...discipline,
        updatedAt: new Date().toISOString(),
      });

      setEditingDiscipline(null);
      toast.success("Discipline modifiée avec succès");
      await loadSpecialites(true);
    } catch (err) {
      toast.error("Erreur lors de la modification de la discipline");
    }
  };

  // Handle archiving a discipline
  const handleArchiveDiscipline = async (disciplineId) => {
    try {
      // Archive the discipline instead of deleting
      const success = await archiveEntity("disciplines", disciplineId, {
        archivedReason: "Archived by administrator",
      });

      if (success) {
        toast.success("Discipline archivée avec succès");
        await loadSpecialites(true);
      } else {
        toast.error("Erreur lors de l'archivage de la discipline");
      }
    } catch (err) {
      toast.error("Erreur lors de l'archivage de la discipline");
    }
  };

  // Get disciplines for a speciality
  const getDisciplinesForSpecialite = (specialiteId) => {
    return disciplines.filter((d) => d.specialiteId === specialiteId);
  };

  // Filter specialites by search term
  const filteredSpecialites = specialites.filter((specialite) => {
    if (!searchTerm) return true;
    return (
      specialite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialite.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return <OptimizedLoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Error and success messages are now handled by the Toast component */}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h2 className="text-xl font-bold">Gestion des spécialités</h2>

          <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
            <button
              onClick={() => setShowAddSpecialiteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300"
            >
              <MdAdd />
              Ajouter une spécialité
            </button>
            <button
              onClick={() => setShowArchivedSpecialites(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
            >
              <MdArchive />
              Spécialités archivées
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium">Liste des spécialités</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              className="pl-8 pr-4 py-1 border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MdSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6">
          {filteredSpecialites.map((specialite) => {
            const specialiteDisciplines = getDisciplinesForSpecialite(
              specialite.id
            );

            return (
              <motion.div
                key={specialite.id}
                className="border rounded p-4 flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {editMode === specialite.id ? (
                  <div className="flex-1 flex gap-4">
                    <input
                      type="text"
                      className="flex-1 border rounded px-3 py-2"
                      value={specialite.name}
                      onChange={(e) => {
                        const updatedSpecialites = specialites.map((s) =>
                          s.id === specialite.id
                            ? { ...s, name: e.target.value }
                            : s
                        );
                        setSpecialites(updatedSpecialites);
                      }}
                    />
                    <input
                      type="text"
                      className="flex-2 border rounded px-3 py-2"
                      value={specialite.description}
                      onChange={(e) => {
                        const updatedSpecialites = specialites.map((s) =>
                          s.id === specialite.id
                            ? { ...s, description: e.target.value }
                            : s
                        );
                        setSpecialites(updatedSpecialites);
                      }}
                    />
                    <button
                      onClick={() => handleEdit(specialite)}
                      className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
                    >
                      <MdSave className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setEditMode(null)}
                      className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
                    >
                      <MdCancel className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{specialite.name}</h3>
                        <p className="text-gray-600">
                          {specialite.description}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MdBook className="mr-1" />
                          <span>
                            {specialiteDisciplines.length} discipline
                            {specialiteDisciplines.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditMode(specialite.id)}
                          className="text-blue-500 hover:text-blue-600"
                          title="Modifier"
                        >
                          <MdEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleArchive(specialite.id)}
                          className="text-blue-500 hover:text-blue-600"
                          title="Archiver"
                        >
                          <MdArchive className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pl-3 border-l-2 border-gray-200">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium text-gray-700">
                          Disciplines: ({specialiteDisciplines.length})
                        </h4>
                        <button
                          onClick={() => {
                            setNewDiscipline((prev) => ({
                              ...prev,
                              specialiteId: specialite.id,
                            }));
                            document
                              .getElementById("add-discipline-modal")
                              .showModal();
                          }}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          title="Ajouter une discipline"
                        >
                          <MdAdd className="inline" /> Ajouter
                        </button>
                      </div>
                      {specialiteDisciplines.length > 0 ? (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {specialiteDisciplines.map((discipline) => (
                            <li
                              key={discipline.id}
                              className="text-sm text-gray-600 flex justify-between items-center group"
                            >
                              <span>• {discipline.name}</span>
                              <div className="hidden group-hover:flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingDiscipline(discipline);
                                    document
                                      .getElementById("edit-discipline-modal")
                                      .showModal();
                                  }}
                                  className="text-blue-500 hover:text-blue-600"
                                  title="Modifier"
                                >
                                  <MdEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Êtes-vous sûr de vouloir archiver la discipline "${discipline.name}" ?`
                                      )
                                    ) {
                                      handleArchiveDiscipline(discipline.id);
                                    }
                                  }}
                                  className="text-blue-500 hover:text-blue-600"
                                  title="Archiver"
                                >
                                  <MdArchive className="w-4 h-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Aucune discipline pour cette spécialité
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Archived Specialites Modal */}
      {showArchivedSpecialites && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ArchivedSpecialitesView
            onClose={() => setShowArchivedSpecialites(false)}
            onSuccess={(message) => {
              // Refresh specialites after restoration with force refresh
              loadSpecialites(true);
            }}
            onError={() => {}}
          />
        </div>
      )}

      {/* Add Discipline Modal */}
      <dialog
        id="add-discipline-modal"
        className="modal bg-transparent rounded-lg shadow-lg"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-auto">
          <h3 className="text-xl font-bold mb-4">Ajouter une discipline</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spécialité
              </label>
              {newDiscipline.specialiteId ? (
                <div className="w-full border rounded-md px-3 py-2 bg-gray-100">
                  {specialites.find((s) => s.id === newDiscipline.specialiteId)
                    ?.name || "Spécialité sélectionnée"}
                </div>
              ) : (
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={newDiscipline.specialiteId}
                  onChange={(e) =>
                    setNewDiscipline({
                      ...newDiscipline,
                      specialiteId: e.target.value,
                    })
                  }
                >
                  <option value="">Sélectionnez une spécialité</option>
                  {specialites.map((specialite) => (
                    <option key={specialite.id} value={specialite.id}>
                      {specialite.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la discipline
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2"
                value={newDiscipline.name}
                onChange={(e) =>
                  setNewDiscipline({ ...newDiscipline, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optionnelle)
              </label>
              <textarea
                className="w-full border rounded-md px-3 py-2"
                value={newDiscipline.description}
                onChange={(e) =>
                  setNewDiscipline({
                    ...newDiscipline,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() =>
                document.getElementById("add-discipline-modal").close()
              }
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                handleAddDiscipline();
                document.getElementById("add-discipline-modal").close();
                // Reset the form but keep the specialiteId if it was pre-selected from a speciality
                const currentSpecialiteId = newDiscipline.specialiteId;
                setNewDiscipline({
                  name: "",
                  description: "",
                  specialiteId: currentSpecialiteId,
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Ajouter
            </button>
          </div>
        </div>
      </dialog>

      {/* Edit Discipline Modal */}
      <dialog
        id="edit-discipline-modal"
        className="modal bg-transparent rounded-lg shadow-lg"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-auto">
          <h3 className="text-xl font-bold mb-4">Modifier la discipline</h3>
          {editingDiscipline && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spécialité
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={editingDiscipline.specialiteId}
                  onChange={(e) =>
                    setEditingDiscipline({
                      ...editingDiscipline,
                      specialiteId: e.target.value,
                    })
                  }
                >
                  {specialites.map((specialite) => (
                    <option key={specialite.id} value={specialite.id}>
                      {specialite.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la discipline
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={editingDiscipline.name}
                  onChange={(e) =>
                    setEditingDiscipline({
                      ...editingDiscipline,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  value={editingDiscipline.description || ""}
                  onChange={(e) =>
                    setEditingDiscipline({
                      ...editingDiscipline,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() =>
                document.getElementById("edit-discipline-modal").close()
              }
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                handleEditDiscipline(editingDiscipline);
                document.getElementById("edit-discipline-modal").close();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </dialog>

      {/* Add Specialite Modal */}
      {showAddSpecialiteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-auto">
            <h3 className="text-xl font-bold mb-4">Ajouter une spécialité</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la spécialité
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  value={newSpecialite.name}
                  onChange={(e) =>
                    setNewSpecialite({ ...newSpecialite, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  className="w-full border rounded-md px-3 py-2"
                  value={newSpecialite.description}
                  onChange={(e) =>
                    setNewSpecialite({
                      ...newSpecialite,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddSpecialiteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialitesManager;
