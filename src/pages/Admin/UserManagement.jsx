import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { fetchUsersFromDatabase } from "../../utils/firebaseUtils";
import { database } from "../../../firebaseConfig";
import { ref, update } from "firebase/database";
import { archiveEntity } from "../../utils/databaseUtils";
import { useToast } from "../../contexts/ToastContext";
import {
  MdEdit,
  MdDelete,
  MdSave,
  MdCancel,
  MdArrowBack,
  MdPerson,
  MdSchool,
  MdAdminPanelSettings,
  MdSearch,
  MdFilterList,
  MdArchive,
} from "react-icons/md";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";
import ArchivedUsersView from "../../components/Admin/ArchivedUsersView";

const UserManagement = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const toast = useToast();
  const [editMode, setEditMode] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showArchivedUsers, setShowArchivedUsers] = useState(false);

  // Form for editing user
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    phone: "",
    bio: "",
  });

  const loadUsers = useCallback(
    async (forceRefresh = false) => {
      if (authLoading || !user || userRole !== "admin") {
        if (!authLoading && userRole !== "admin") {
          toast.error("Accès non autorisé.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");
        const allUsers = await fetchUsersFromDatabase(forceRefresh);
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (err) {
        console.error("Error loading users:", err);
        toast.error(
          "Une erreur s'est produite lors du chargement des utilisateurs."
        );
      } finally {
        setLoading(false);
      }
    },
    [authLoading, user, userRole]
  );

  useEffect(() => {
    // Force refresh when component mounts
    loadUsers(true);
  }, [loadUsers]);

  // Filter users based on search term and role filter
  useEffect(() => {
    let result = users;

    // Filter by role
    if (roleFilter !== "all") {
      result = result.filter(
        (user) =>
          user.role === roleFilter ||
          (roleFilter === "admin" && user.userType === "administrateur") ||
          (roleFilter === "instructor" && user.userType === "formateur") ||
          (roleFilter === "student" && user.userType === "apprenant")
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (user) =>
          (user.firstName && user.firstName.toLowerCase().includes(term)) ||
          (user.lastName && user.lastName.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term))
      );
    }

    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter]);

  const handleEdit = (userData) => {
    setEditMode(userData.id);
    setFormData({
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email || "",
      role: userData.role || userData.userType || "student",
      phone: userData.phone || "",
      bio: userData.bio || "",
    });
  };

  const handleSave = async (userId) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Normalize role if needed
      let normalizedRole = formData.role;
      if (formData.role === "formateur") normalizedRole = "instructor";
      if (formData.role === "administrateur") normalizedRole = "admin";
      if (formData.role === "apprenant") normalizedRole = "student";

      const userRef = ref(database, `elearning/users/${userId}`);
      await update(userRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: normalizedRole,
        phone: formData.phone || "",
        bio: formData.bio || "",
        updatedAt: new Date().toISOString(),
      });

      toast.success("Utilisateur mis à jour avec succès.");
      setEditMode(null);
      await loadUsers(true);
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error(
        "Une erreur s'est produite lors de la mise à jour de l'utilisateur."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (userId) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir archiver cet utilisateur ?")
    ) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // Archive the user instead of deleting
      const success = await archiveEntity("users", userId, {
        archivedBy: user.uid,
        archivedReason: "Archived by administrator",
      });

      if (success) {
        toast.success("Utilisateur archivé avec succès.");
        await loadUsers(true);
      } else {
        toast.error(
          "Une erreur s'est produite lors de l'archivage de l'utilisateur."
        );
      }
    } catch (err) {
      console.error("Error archiving user:", err);
      toast.error(
        "Une erreur s'est produite lors de l'archivage de l'utilisateur."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCancel = () => {
    setEditMode(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      phone: "",
      bio: "",
    });
  };

  if (loading && users.length === 0) {
    return <OptimizedLoadingSpinner />;
  }

  // Return only the content part, without the layout divs
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-300"
          >
            <MdArrowBack />
            Retour au tableau de bord
          </Link>
        </div>

        {/* Error and success messages are now handled by the Toast component */}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold">Liste des Utilisateurs</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">Tous les rôles</option>
                  <option value="admin">Administrateurs</option>
                  <option value="instructor">Formateurs</option>
                  <option value="student">Étudiants</option>
                </select>
              </div>
              <button
                onClick={() => setShowArchivedUsers(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300"
              >
                <MdArchive />
                Utilisateurs archivés
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Nom</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Rôle</th>
                  <th className="py-3 px-4 text-left">Téléphone</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    {editMode === userData.id ? (
                      <>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              name="firstName"
                              placeholder="Prénom"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={formData.firstName}
                              onChange={handleInputChange}
                            />
                            <input
                              type="text"
                              name="lastName"
                              placeholder="Nom"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={formData.lastName}
                              onChange={handleInputChange}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            name="role"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={formData.role}
                            onChange={handleInputChange}
                          >
                            <option value="student">Étudiant</option>
                            <option value="instructor">Formateur</option>
                            <option value="admin">Administrateur</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            name="phone"
                            placeholder="Téléphone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={formData.phone}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSave(userData.id)}
                              className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                              title="Enregistrer"
                            >
                              <MdSave />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                              title="Annuler"
                            >
                              <MdCancel />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4">
                          {userData.firstName || ""} {userData.lastName || ""}
                        </td>
                        <td className="py-3 px-4">{userData.email}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {userData.role === "admin" ||
                            userData.userType === "administrateur" ? (
                              <>
                                <MdAdminPanelSettings className="mr-2 text-red-500" />
                                <span>Administrateur</span>
                              </>
                            ) : userData.role === "instructor" ||
                              userData.userType === "formateur" ? (
                              <>
                                <MdSchool className="mr-2 text-blue-500" />
                                <span>Formateur</span>
                              </>
                            ) : (
                              <>
                                <MdPerson className="mr-2 text-green-500" />
                                <span>Étudiant</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {userData.phone || "Non spécifié"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(userData)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Modifier"
                            >
                              <MdEdit />
                            </button>
                            <button
                              onClick={() => handleArchive(userData.id)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Archiver"
                            >
                              <MdArchive />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg mt-4">
              <p className="text-gray-600">Aucun utilisateur trouvé.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Archived Users Modal */}
      {showArchivedUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <ArchivedUsersView
            onClose={() => setShowArchivedUsers(false)}
            onSuccess={() => {
              // Refresh users after restoration with force refresh
              loadUsers(true);
            }}
            onError={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default UserManagement;
