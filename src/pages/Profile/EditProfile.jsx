import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { MdArrowBack, MdSave, MdCancel } from "react-icons/md";
import { getDatabase, ref, update } from "firebase/database";
import { getAvatarUrl } from "../../utils/avatarUtils";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";

const EditProfile = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatar: "",
    phone: "",
    country: "",
    expertise: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const database = getDatabase();

  useEffect(() => {
    if (!authLoading && user) {
      setLoadingData(true);
      setFormData({
        firstName: user.firstName || user.prenom || "",
        lastName: user.lastName || user.nom || "",
        email: user.email || "",
        avatar: user.avatar || "",
        phone: user.phone || user.telephone || "",
        country: user.country || user.pays || "",
        expertise: user.expertise || "",
      });
      setLoadingData(false);
    } else if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("Vous devez être connecté pour modifier votre profil");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const userRef = ref(database, `elearning/users/${user.uid}`);

      const userDataToUpdate = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || "",
        country: formData.country || "",
        updatedAt: new Date().toISOString(),
      };

      if (role === "instructor") {
        userDataToUpdate.expertise = formData.expertise || "";
      }

      if (formData.avatar) {
        userDataToUpdate.avatar = formData.avatar;
      }

      await update(userRef, userDataToUpdate);

      setSuccess("Profil mis à jour avec succès");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingData) {
    return <OptimizedLoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Utilisateur non trouvé</h1>
        <p className="text-gray-600 mb-8">Veuillez vous reconnecter.</p>
        <Link
          to="/login"
          className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors duration-300"
        >
          Connexion
        </Link>
      </div>
    );
  }

  const currentAvatarUrl = formData.avatar || getAvatarUrl(user.email);

  const isInstructor = role === "instructor";

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">
                  Modifier le profil
                </h1>
                <Link
                  to="/profile"
                  className="text-white hover:text-indigo-100 transition-colors"
                  title="Retour au profil"
                >
                  <MdArrowBack size={24} />
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <img
                  className="h-16 w-16 rounded-full ring-4 ring-white ring-opacity-50"
                  src={currentAvatarUrl}
                  alt="Avatar"
                />
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {user.displayName ||
                      `${formData.firstName} ${formData.lastName}`}
                  </h2>
                  <p className="text-sm text-indigo-100 capitalize">{role}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {error && (
                <div
                  className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
                  role="alert"
                >
                  <p className="font-bold">Erreur</p>
                  <p>{error}</p>
                </div>
              )}
              {success && (
                <div
                  className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4"
                  role="alert"
                >
                  <p className="font-bold">Succès</p>
                  <p>{success}</p>
                </div>
              )}

              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">
                  Informations de base
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nom
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email (Non modifiable)
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      readOnly
                      disabled
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="avatar"
                      className="block text-sm font-medium text-gray-700"
                    >
                      URL Avatar (Optionnel)
                    </label>
                    <input
                      type="url"
                      name="avatar"
                      id="avatar"
                      value={formData.avatar}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">
                  Coordonnées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Téléphone (Optionnel)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Pays (Optionnel)
                    </label>
                    <input
                      type="text"
                      name="country"
                      id="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </section>

              {isInstructor && (
                <section>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">
                    Informations Formateur
                  </h3>
                  <div>
                    <label
                      htmlFor="expertise"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Domaine d'expertise
                    </label>
                    <textarea
                      name="expertise"
                      id="expertise"
                      rows={3}
                      value={formData.expertise}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Décrivez vos domaines d'expertise..."
                    />
                  </div>
                </section>
              )}

              <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
                <Link
                  to="/profile"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 inline-flex items-center"
                >
                  <MdCancel className="mr-2 -ml-1" size={18} />
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MdSave className="mr-2 -ml-1" size={18} />
                  {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;
