import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdSchool,
  MdPerson,
  MdMessage,
  MdAdd,
  MdAssignment,
  MdSettings,
} from "react-icons/md";

const InstructorSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    return currentPath.includes(path);
  };

  const menuItems = [
    {
      path: "/instructor/courses",
      icon: <MdDashboard />,
      label: "Tableau de bord",
    },
    {
      path: "/instructor/course-form",
      icon: <MdAdd />,
      label: "Créer un cours",
    },
    {
      path: "/instructor/profile",
      icon: <MdPerson />,
      label: "Mon Profil",
    },
    {
      path: "/instructor/messages",
      icon: <MdMessage />,
      label: "Messages",
    },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sticky top-4">
      <h2 className="text-xl font-semibold mb-6 px-4">Espace Formateur</h2>
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

export default InstructorSidebar;
