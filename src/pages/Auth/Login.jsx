import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { getDatabase, ref, get } from "firebase/database";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { getDashboardPath } = useAuth();

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    const hasRememberedCredentials = localStorage.getItem(
      "hasRememberedCredentials"
    );

    if (rememberedEmail && hasRememberedCredentials) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Fonction auxiliaire pour rediriger l'utilisateur en fonction de son rôle
  const redirectBasedOnRole = async (userId) => {
    try {
      const database = getDatabase();

      // Vérifier dans tous les chemins possibles pour trouver le rôle de l'utilisateur
      let userData = null;
      let role = null;

      // 1. Vérifier d'abord dans le chemin standardisé (elearning/users)
      const standardUserRef = ref(database, `elearning/users/${userId}`);
      const standardSnapshot = await get(standardUserRef);

      if (standardSnapshot.exists()) {
        userData = standardSnapshot.val();
        role = userData.role || userData.userType;
      }

      // 2. Si non trouvé, vérifier dans Elearning/Administrateurs
      if (!role) {
        const adminRef = ref(database, `Elearning/Administrateurs/${userId}`);
        const adminSnapshot = await get(adminRef);

        if (adminSnapshot.exists()) {
          userData = adminSnapshot.val();
          role = "admin";
        }
      }

      // 3. Si non trouvé, vérifier dans Elearning/Formateurs
      if (!role) {
        const instructorRef = ref(database, `Elearning/Formateurs/${userId}`);
        const instructorSnapshot = await get(instructorRef);

        if (instructorSnapshot.exists()) {
          userData = instructorSnapshot.val();
          role = "instructor";
        }
      }

      // 4. Si non trouvé, vérifier dans Elearning/Apprenants
      if (!role) {
        const studentRef = ref(database, `Elearning/Apprenants/${userId}`);
        const studentSnapshot = await get(studentRef);

        if (studentSnapshot.exists()) {
          userData = studentSnapshot.val();
          role = "student";
        }
      }

      // 5. Si non trouvé, vérifier dans Elearning/Utilisateurs
      if (!role) {
        const legacyUserRef = ref(database, `Elearning/Utilisateurs/${userId}`);
        const legacySnapshot = await get(legacyUserRef);

        if (legacySnapshot.exists()) {
          userData = legacySnapshot.val();
          role = userData.userType || "student";
        }
      }

      // 6. Si non trouvé, vérifier dans le chemin hérité users
      if (!role) {
        const legacyUserRef = ref(database, `users/${userId}`);
        const legacySnapshot = await get(legacyUserRef);

        if (legacySnapshot.exists()) {
          userData = legacySnapshot.val();
          role = userData.userType || userData.role || "student";
        }
      }

      // Si toujours pas de rôle trouvé, utiliser student par défaut
      if (!role) {
        role = "student";
      }
      let redirectPath = "/";

      switch (role.toLowerCase()) {
        case "admin":
        case "administrateur":
          redirectPath = "/admin/dashboard";
          break;
        case "instructor":
        case "formateur":
          redirectPath = "/instructor/courses";
          break;
        case "student":
        case "etudiant":
          redirectPath = "/student/enrollments";
          break;
        default:
          // Fallback vers la page d'accueil
          redirectPath = "/";
      }

      console.log("Redirecting to:", redirectPath, "with role:", role);

      // Use window.location.replace instead of href to prevent adding to browser history
      // This ensures the login page isn't in the history stack and forces a full page reload
      window.location.replace(redirectPath);
    } catch (error) {
      console.error("Erreur lors de la redirection:", error);
      // En cas d'erreur, rediriger vers la page d'accueil
      console.log("Error fallback redirect to: /");
      window.location.replace("/");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = getAuth();

      // Set persistence based on rememberMe option
      if (rememberMe) {
        // Save credentials in localStorage
        localStorage.setItem("rememberedEmail", email);
        // We don't store the actual password for security reasons
        localStorage.setItem("hasRememberedCredentials", "true");
      } else {
        // Clear any saved credentials
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("hasRememberedCredentials");
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Vérifier si la redirection est demandée par une autre page (ex: page protégée)
      if (location.state?.from?.pathname) {
        navigate(location.state.from.pathname, { replace: true });
      } else {
        // Rediriger en fonction du rôle
        await redirectBasedOnRole(user.uid);
        // No need to reload - the redirectBasedOnRole function already uses window.location.href
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);

      // Gérer les différents types d'erreurs pour des messages plus précis
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError("Email ou mot de passe incorrect");
      } else if (error.code === "auth/invalid-email") {
        setError("Format d'email invalide");
      } else if (error.code === "auth/too-many-requests") {
        setError("Trop de tentatives échouées. Veuillez réessayer plus tard.");
      } else {
        setError("Une erreur est survenue lors de la connexion");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-light py-14 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="uppercase font-semibold text-orange-500">
              Bienvenue
            </h3>
            <h2 className="text-3xl font-semibold mt-2">
              Connexion à votre compte
            </h2>
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

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Adresse Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="form-input"
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-secondary focus:ring-secondary/20 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Se souvenir de moi
                </label>
              </div>
              <div className="text-sm">
                <Link to="/reset-password" className="text-link">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="secondary-btn w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>

            <div className="text-center text-sm text-gray-600">
              Vous n&apos;avez pas de compte ?{" "}
              <Link to="/register" className="text-link font-medium">
                S'inscrire maintenant
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
