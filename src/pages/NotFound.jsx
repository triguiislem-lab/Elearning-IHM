import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const NotFound = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          to={user ? `/${user.role}/dashboard` : "/login"}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {user ? "Go to Dashboard" : "Go to Login"}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
