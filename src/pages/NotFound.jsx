import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { MdHome, MdArrowBack, MdSearch } from "react-icons/md";

const NotFound = () => {
  const { user, getDashboardPath } = useAuth();
  const dashboardPath = user ? getDashboardPath() : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-light py-16 px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-50 text-red-500 rounded-full mb-6">
            <span className="text-6xl font-bold">404</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Page introuvable
          </h1>
          <p className="text-gray-600 mb-8">
            La page que vous recherchez n'existe pas ou a été déplacée. Veuillez
            vérifier l'URL ou utiliser les liens ci-dessous.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={dashboardPath}
            className="secondary-btn flex items-center justify-center gap-2"
          >
            <MdHome size={20} />
            {user ? "Tableau de bord" : "Accueil"}
          </Link>

          <button
            onClick={() => window.history.back()}
            className="outline-btn flex items-center justify-center gap-2"
          >
            <MdArrowBack size={20} />
            Retour
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-4">
            Vous cherchez quelque chose de spécifique ?
          </p>
          <Link
            to="/courses"
            className="text-btn flex items-center justify-center gap-2 mx-auto w-fit"
          >
            <MdSearch size={18} />
            Parcourir les cours
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
