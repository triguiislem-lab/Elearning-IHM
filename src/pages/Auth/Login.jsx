import { useState } from "react";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { getDashboardPath } = useAuth();

  // Fonction auxiliaire pour rediriger l'utilisateur en fonction de son rôle
  const redirectBasedOnRole = async (userId) => {
    try {
      const database = getDatabase();

      // Vérifier d'abord dans le chemin standardisé
      const userRef = ref(database, `elearning/users/${userId}`);
      const snapshot = await get(userRef);
      let userData = snapshot.val();

      // Si non trouvé, vérifier dans le chemin hérité
      if (!userData) {
        const legacyUserRef = ref(database, `users/${userId}`);
        const legacySnapshot = await get(legacyUserRef);
        userData = legacySnapshot.val();
      }

      if (!userData) {
        // Si toujours pas de données utilisateur trouvées, utiliser la méthode par défaut
        const defaultPath = getDashboardPath();
        navigate(defaultPath, { replace: true });
        return;
      }

      // Déterminer le rôle et rediriger en conséquence
      const role = userData.role || userData.userType || "student";

      switch (role.toLowerCase()) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "instructor":
        case "formateur":
          navigate("/instructor/courses", { replace: true });
          break;
        case "student":
        case "etudiant":
          navigate("/student/enrollments", { replace: true });
          break;
        default:
          // Fallback vers la page d'accueil
          navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Erreur lors de la redirection:", error);
      // En cas d'erreur, utiliser la redirection par défaut
      const defaultPath = getDashboardPath();
      navigate(defaultPath, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = getAuth();
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
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Se souvenir de moi
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="text-link">
                  Mot de passe oublié ?
                </a>
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
