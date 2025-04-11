import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MdAdd, MdDelete, MdEdit, MdSave, MdCancel } from "react-icons/md";
import {
  fetchSpecialitesFromDatabase,
  fetchDisciplinesFromDatabase,
} from "../../utils/firebaseUtils";
import { database } from "../../../firebaseConfig";
import { ref, set, remove } from "firebase/database";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";

const SpecialitesManager = () => {
  const [specialites, setSpecialites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(null);
  const [newSpecialite, setNewSpecialite] = useState({ name: "", description: "" });

  useEffect(() => {
    loadSpecialites();
  }, []);

  const loadSpecialites = async () => {
    try {
      setLoading(true);
      const data = await fetchSpecialitesFromDatabase();
      setSpecialites(data);
    } catch (err) {
      setError("Erreur lors du chargement des spécialités");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      if (!newSpecialite.name.trim()) {
        setError("Le nom de la spécialité est requis");
        return;
      }

      const specialiteId = Date.now().toString(36);
      const specialiteRef = ref(database, `elearning/specialites/${specialiteId}`);
      
      await set(specialiteRef, {
        ...newSpecialite,
        createdAt: new Date().toISOString()
      });

      setNewSpecialite({ name: "", description: "" });
      await loadSpecialites();
    } catch (err) {
      setError("Erreur lors de l'ajout de la spécialité");
    }
  };

  const handleEdit = async (specialite) => {
    try {
      const specialiteRef = ref(database, `elearning/specialites/${specialite.id}`);
      await set(specialiteRef, {
        ...specialite,
        updatedAt: new Date().toISOString()
      });

      setEditMode(null);
      await loadSpecialites();
    } catch (err) {
      setError("Erreur lors de la modification de la spécialité");
    }
  };

  const handleDelete = async (specialiteId) => {
    try {
      const specialiteRef = ref(database, `elearning/specialites/${specialiteId}`);
      await remove(specialiteRef);
      await loadSpecialites();
    } catch (err) {
      setError("Erreur lors de la suppression de la spécialité");
    }
  };

  if (loading) {
    return <OptimizedLoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Ajouter une spécialité</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Nom de la spécialité"
            className="flex-1 border rounded px-3 py-2"
            value={newSpecialite.name}
            onChange={(e) => setNewSpecialite({ ...newSpecialite, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description"
            className="flex-2 border rounded px-3 py-2"
            value={newSpecialite.description}
            onChange={(e) => setNewSpecialite({ ...newSpecialite, description: e.target.value })}
          />
          <button
            onClick={handleAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <MdAdd className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 p-6">
          {specialites.map((specialite) => (
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
                        s.id === specialite.id ? { ...s, name: e.target.value } : s
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
                        s.id === specialite.id ? { ...s, description: e.target.value } : s
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
                <>
                  <div>
                    <h3 className="font-semibold">{specialite.name}</h3>
                    <p className="text-gray-600">{specialite.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditMode(specialite.id)}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <MdEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(specialite.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpecialitesManager;
