import React, { useState, useEffect } from "react";
import {
  MdRestore,
  MdSearch,
  MdFilterList,
  MdPerson,
  MdSchool,
  MdAdminPanelSettings,
} from "react-icons/md";
import { database } from "../../../firebaseConfig";
import { ref, get } from "firebase/database";
import { restoreEntity } from "../../utils/databaseUtils";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

/**
 * Component to display and manage archived users
 */
const ArchivedUsersView = ({ onClose, onSuccess, onError }) => {
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [processingUserId, setProcessingUserId] = useState(null);
  const [filter, setFilter] = useState("all");

  // Load archived users
  useEffect(() => {
    const loadArchivedUsers = async () => {
      setLoading(true);
      try {
        // Get all users including archived ones
        const usersRef = ref(database, "elearning/users");
        const snapshot = await get(usersRef);

        if (!snapshot.exists()) {
          setArchivedUsers([]);
          return;
        }

        // Filter only archived users
        const usersData = snapshot.val();
        const archivedUsersList = Object.entries(usersData)
          .filter(([_, userData]) => userData.archived)
          .map(([id, userData]) => ({
            id,
            ...userData,
            displayName:
              `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
              userData.email ||
              "Utilisateur sans nom",
          }));

        setArchivedUsers(archivedUsersList);
      } catch (error) {
        console.error("Error loading archived users:", error);
        onError &&
          onError("Erreur lors du chargement des utilisateurs archivés");
      } finally {
        setLoading(false);
      }
    };

    loadArchivedUsers();
  }, [onError]);

  // Handle user restoration
  const handleRestoreUser = async (userId) => {
    if (!userId) return;

    if (
      !window.confirm("Êtes-vous sûr de vouloir restaurer cet utilisateur ?")
    ) {
      return;
    }

    setProcessingUserId(userId);
    try {
      const success = await restoreEntity("users", userId, {
        restoredAt: new Date().toISOString(),
      });

      if (success) {
        // Remove from list
        setArchivedUsers((prev) => prev.filter((user) => user.id !== userId));

        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(null);
        }

        // Force refresh when calling onSuccess
        onSuccess && onSuccess("Utilisateur restauré avec succès");
      } else {
        onError && onError("Erreur lors de la restauration de l'utilisateur");
      }
    } catch (error) {
      console.error("Error restoring user:", error);
      onError && onError("Erreur lors de la restauration de l'utilisateur");
    } finally {
      setProcessingUserId(null);
    }
  };

  // Get role icon
  const getRoleIcon = (user) => {
    const role = user.role || user.userType;
    if (role === "admin" || role === "administrateur") {
      return <MdAdminPanelSettings className="text-red-600" size={20} />;
    } else if (role === "instructor" || role === "formateur") {
      return <MdSchool className="text-blue-600" size={20} />;
    } else {
      return <MdPerson className="text-green-600" size={20} />;
    }
  };

  // Filter users by search term and role
  const filteredUsers = archivedUsers.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchesSearch;

    const role = user.role || user.userType;
    if (filter === "admin")
      return matchesSearch && (role === "admin" || role === "administrateur");
    if (filter === "instructor")
      return matchesSearch && (role === "instructor" || role === "formateur");
    if (filter === "student")
      return matchesSearch && (role === "student" || role === "apprenant");

    return matchesSearch;
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Utilisateurs archivés
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          Fermer
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MdSearch
            className="absolute left-3 top-2.5 text-gray-400"
            size={20}
          />
        </div>

        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="instructor">Formateurs</option>
            <option value="student">Apprenants</option>
          </select>
          <MdFilterList
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
          {/* Users list */}
          <div className="w-full md:w-1/3 border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b font-medium">
              Utilisateurs archivés ({filteredUsers.length})
            </div>
            <div className="overflow-y-auto h-[calc(500px-3rem)]">
              {filteredUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MdPerson size={48} className="mx-auto mb-2 text-gray-400" />
                  <p>Aucun utilisateur archivé trouvé</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                      selectedUser && selectedUser.id === user.id
                        ? "bg-blue-50"
                        : ""
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    {getRoleIcon(user)}
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-800">
                        {user.displayName}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User details */}
          <div className="w-full md:w-2/3 border rounded-lg overflow-hidden">
            {selectedUser ? (
              <div className="h-full flex flex-col">
                <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">Détails de l'utilisateur</h3>
                  <button
                    onClick={() => handleRestoreUser(selectedUser.id)}
                    disabled={processingUserId === selectedUser.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    {processingUserId === selectedUser.id ? (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Informations personnelles
                      </h4>
                      <div className="space-y-2">
                        <p>
                          <strong>Nom:</strong>{" "}
                          {selectedUser.lastName || "Non spécifié"}
                        </p>
                        <p>
                          <strong>Prénom:</strong>{" "}
                          {selectedUser.firstName || "Non spécifié"}
                        </p>
                        <p>
                          <strong>Email:</strong>{" "}
                          {selectedUser.email || "Non spécifié"}
                        </p>
                        <p>
                          <strong>Rôle:</strong>{" "}
                          {selectedUser.role ||
                            selectedUser.userType ||
                            "Non spécifié"}
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
                          {selectedUser.archivedAt
                            ? new Date(selectedUser.archivedAt).toLocaleString()
                            : "Date inconnue"}
                        </p>
                        <p>
                          <strong>Archivé par:</strong>{" "}
                          {selectedUser.archivedBy || "Utilisateur inconnu"}
                        </p>
                        <p>
                          <strong>Raison:</strong>{" "}
                          {selectedUser.archivedReason || "Non spécifiée"}
                        </p>
                      </div>
                    </div>

                    {selectedUser.bio && (
                      <div className="bg-gray-50 p-3 rounded-lg md:col-span-2">
                        <h4 className="font-medium text-gray-700 mb-2">
                          Biographie
                        </h4>
                        <p className="text-gray-600">{selectedUser.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <MdPerson size={64} className="mb-4 text-gray-300" />
                <p>Sélectionnez un utilisateur pour voir ses détails</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivedUsersView;
