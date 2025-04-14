import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { registerUser } from "../../utils/authUtils";

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    bio: "",
    phone: "",
    userType: "student", // Par défaut: étudiant
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      await registerUser(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.bio,
        formData.phone,
        formData.userType // Ajout du type d'utilisateur
      );

      navigate("/login");
    } catch (error) {
      // Handle specific errors
      if (error.code === "auth/email-already-in-use") {
        setError(
          "Cette adresse email est déjà utilisée. Veuillez en utiliser une autre ou vous connecter."
        );
      } else if (error.code === "auth/invalid-email") {
        setError("Adresse email invalide. Veuillez vérifier votre saisie.");
      } else if (error.code === "auth/weak-password") {
        setError(
          "Mot de passe trop faible. Veuillez choisir un mot de passe plus fort."
        );
      } else {
        setError(`Erreur lors de l'inscription: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#f9f9f9] py-14 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8">
          <div className="text-center mb-8">
            <h3 className="uppercase font-semibold text-orange-500">
              Rejoignez-nous
            </h3>
            <h2 className="text-3xl font-semibold mt-2">Créez votre compte</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {/* Type d'utilisateur */}
            <div>
              <label
                htmlFor="userType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Je m&apos;inscris en tant que
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="radio"
                    id="student"
                    name="userType"
                    value="student"
                    checked={formData.userType === "student"}
                    onChange={handleInputChange}
                    className="hidden peer"
                  />
                  <label
                    htmlFor="student"
                    className="flex justify-center items-center p-4 border rounded-lg cursor-pointer peer-checked:border-secondary peer-checked:bg-secondary/10 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-center font-medium">Étudiant</span>
                  </label>
                </div>
                <div className="flex-1">
                  <input
                    type="radio"
                    id="instructor"
                    name="userType"
                    value="instructor"
                    checked={formData.userType === "instructor"}
                    onChange={handleInputChange}
                    className="hidden peer"
                  />
                  <label
                    htmlFor="instructor"
                    className="flex justify-center items-center p-4 border rounded-lg cursor-pointer peer-checked:border-secondary peer-checked:bg-secondary/10 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-center font-medium">Formateur</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Prénom
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  className="form-input"
                  placeholder="Entrez votre prénom"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nom
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  className="form-input"
                  placeholder="Entrez votre nom"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="form-input"
                placeholder="Entrez votre email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  className="form-input"
                  placeholder="Créez un mot de passe"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirmez le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  className="form-input"
                  placeholder="Confirmez votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Numéro de téléphone (Optionnel)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-input"
                  placeholder="Entrez votre numéro de téléphone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Bio (Optionnel)
                </label>
                <input
                  type="text"
                  id="bio"
                  name="bio"
                  className="form-input"
                  placeholder="Parlez-nous de vous"
                  value={formData.bio}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="secondary-btn w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Inscription en cours..." : "S'inscrire"}
            </button>

            <div className="text-center text-sm text-gray-600">
              Vous avez déjà un compte ?{" "}
              <Link to="/login" className="text-link font-medium">
                Se connecter
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Register;
