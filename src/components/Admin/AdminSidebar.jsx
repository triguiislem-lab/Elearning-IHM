import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdPeople,
  MdSchool,
  MdCategory,
  MdStorage,
  MdSettings,
  MdMessage,
  MdPerson,
  // MdDatabaseAdd is not available in this version of react-icons
} from "react-icons/md";

const AdminSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    return currentPath.includes(path);
  };

  const menuItems = [
    {
      path: "/admin/dashboard",
      icon: <MdDashboard />,
      label: "Tableau de bord",
    },
    {
      path: "/admin/users",
      icon: <MdPeople />,
      label: "Utilisateurs",
    },
    {
      path: "/admin/courses",
      icon: <MdSchool />,
      label: "Formations",
    },
    {
      path: "/admin/specialites",
      icon: <MdCategory />,
      label: "Spécialités",
    },
    {
      path: "/admin/profile",
      icon: <MdPerson />,
      label: "Mon Profil",
    },
    {
      path: "/admin/messages",
      icon: <MdMessage />,
      label: "Messages",
    },
    {
      path: "/admin/database-standardization",
      icon: <MdStorage />,
      label: "Base de Données",
    },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sticky top-4">
      <h2 className="text-xl font-semibold mb-6 px-4">Administration</h2>
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-300 ${
                  isActive(item.path)
                    ? "bg-secondary text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
