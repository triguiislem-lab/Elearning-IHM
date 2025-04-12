import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { NavbarMenu } from "../../mockData/data.js";
import {
  MdLogout,
  MdPerson,
  MdBook,
  MdMessage,
  MdDashboard,
  MdClose,
  MdArrowForward,
  MdHome,
} from "react-icons/md";
import { getAvatarUrl } from "../../utils/avatarUtils";

const ResponsiveMenu = ({
  isOpen,
  user,
  userRole,
  isAuthenticated,
  handleLogout,
  setIsOpen,
  handleSmoothScroll,
  setActiveLink,
}) => {
  const location = useLocation();

  // Fonction pour vérifier si un lien est actif
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" && !location.hash;
    }

    // Gestion des liens d'ancrage
    if (path.includes("#")) {
      const anchor = path.split("#")[1];
      return location.hash === `#${anchor}`;
    }

    return location.pathname.startsWith(path);
  };

  // Empêcher le défilement de la page lorsque le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLinkClick = (e, link) => {
    if (link.includes("#")) {
      handleSmoothScroll(e, link);
    } else {
      setIsOpen(false);
      setActiveLink(link);
    }
  };

  // Récupérer le prénom et le nom de l'utilisateur
  const userFirstName = user?.firstName || user?.prenom || "";
  const userLastName = user?.lastName || user?.nom || "";
  const displayName = userFirstName
    ? `${userFirstName} ${userLastName}`
    : "Utilisateur";

  // Animations pour le menu
  const menuVariants = {
    closed: {
      x: "-100%",
      opacity: 0,
      transition: {
        type: "tween",
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: "tween",
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    closed: { x: -20, opacity: 0 },
    open: { x: 0, opacity: 1 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="fixed top-0 left-0 w-4/5 max-w-xs h-screen bg-white z-50 lg:hidden overflow-y-auto shadow-xl"
          >
            <div className="p-6 flex flex-col h-full">
              {/* Header section */}
              <div className="flex justify-between items-center mb-8">
                <Link
                  to="/"
                  className="text-xl font-bold flex items-center gap-2 text-secondary"
                  onClick={(e) => {
                    handleLinkClick(e, "/");
                    setActiveLink("/");
                  }}
                >
                  <MdHome size={24} />
                  E-Tutor
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Fermer le menu"
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* User info */}
              {isAuthenticated && user && (
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-secondary">
                    <img
                      src={getAvatarUrl(user)}
                      alt={`Avatar de ${displayName}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://ui-avatars.com/api/?name=U&background=0D8ABC&color=fff&size=256";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-base truncate">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email || ""}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Main navigation links */}
              <nav className="mb-6">
                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-2">
                  Navigation
                </h3>
                <ul className="space-y-1">
                  {NavbarMenu.map((item) => (
                    <motion.li key={item.id} variants={itemVariants}>
                      <Link
                        to={item.link}
                        className={`flex items-center gap-3 py-3 px-2 rounded-md ${
                          isActive(item.link)
                            ? "bg-secondary/10 text-secondary font-medium"
                            : "hover:bg-gray-100 text-gray-700"
                        } transition-colors duration-200`}
                        onClick={(e) => handleLinkClick(e, item.link)}
                      >
                        {item.title}
                        {isActive(item.link) && (
                          <MdArrowForward className="ml-auto" size={16} />
                        )}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* User specific links */}
              {isAuthenticated && (
                <nav className="mb-auto">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-2">
                    Votre compte
                  </h3>
                  <ul className="space-y-1">
                    <motion.li variants={itemVariants}>
                      <Link
                        to={`/${userRole.toLowerCase()}/dashboard`}
                        className={`flex items-center gap-3 py-3 px-2 rounded-md ${
                          isActive(`/${userRole.toLowerCase()}/dashboard`)
                            ? "bg-secondary/10 text-secondary font-medium"
                            : "hover:bg-gray-100 text-gray-700"
                        } transition-colors duration-200`}
                        onClick={(e) =>
                          handleLinkClick(
                            e,
                            `/${userRole.toLowerCase()}/dashboard`
                          )
                        }
                      >
                        <MdDashboard size={20} />
                        Tableau de bord
                      </Link>
                    </motion.li>
                    <motion.li variants={itemVariants}>
                      <Link
                        to="/profile"
                        className={`flex items-center gap-3 py-3 px-2 rounded-md ${
                          isActive("/profile")
                            ? "bg-secondary/10 text-secondary font-medium"
                            : "hover:bg-gray-100 text-gray-700"
                        } transition-colors duration-200`}
                        onClick={(e) => handleLinkClick(e, "/profile")}
                      >
                        <MdPerson size={20} />
                        Mon profil
                      </Link>
                    </motion.li>
                    {userRole === "student" && (
                      <motion.li variants={itemVariants}>
                        <Link
                          to="/student/enrollments"
                          className={`flex items-center gap-3 py-3 px-2 rounded-md ${
                            isActive("/student/enrollments")
                              ? "bg-secondary/10 text-secondary font-medium"
                              : "hover:bg-gray-100 text-gray-700"
                          } transition-colors duration-200`}
                          onClick={(e) =>
                            handleLinkClick(e, "/student/enrollments")
                          }
                        >
                          <MdBook size={20} />
                          Mes formations
                        </Link>
                      </motion.li>
                    )}
                    {userRole === "instructor" && (
                      <motion.li variants={itemVariants}>
                        <Link
                          to="/instructor/courses"
                          className={`flex items-center gap-3 py-3 px-2 rounded-md ${
                            isActive("/instructor/courses")
                              ? "bg-secondary/10 text-secondary font-medium"
                              : "hover:bg-gray-100 text-gray-700"
                          } transition-colors duration-200`}
                          onClick={(e) =>
                            handleLinkClick(e, "/instructor/courses")
                          }
                        >
                          <MdBook size={20} />
                          Mes cours
                        </Link>
                      </motion.li>
                    )}
                    {userRole === "admin" && (
                      <motion.li variants={itemVariants}>
                        <Link
                          to="/admin/courses"
                          className={`flex items-center gap-3 py-3 px-2 rounded-md ${
                            isActive("/admin/courses")
                              ? "bg-secondary/10 text-secondary font-medium"
                              : "hover:bg-gray-100 text-gray-700"
                          } transition-colors duration-200`}
                          onClick={(e) => handleLinkClick(e, "/admin/courses")}
                        >
                          <MdBook size={20} />
                          Gestion des cours
                        </Link>
                      </motion.li>
                    )}
                    <motion.li variants={itemVariants}>
                      <Link
                        to="/messages"
                        className={`flex items-center gap-3 py-3 px-2 rounded-md ${
                          isActive("/messages")
                            ? "bg-secondary/10 text-secondary font-medium"
                            : "hover:bg-gray-100 text-gray-700"
                        } transition-colors duration-200`}
                        onClick={(e) => handleLinkClick(e, "/messages")}
                      >
                        <MdMessage size={20} />
                        Messages
                      </Link>
                    </motion.li>
                  </ul>
                </nav>
              )}

              {/* Bottom section with logout button or login/register options */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {isAuthenticated ? (
                  <motion.button
                    variants={itemVariants}
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 w-full py-3 px-4 text-red-600 font-medium rounded-md hover:bg-red-50 transition-colors duration-200"
                  >
                    <MdLogout size={20} />
                    Déconnexion
                  </motion.button>
                ) : (
                  <div className="space-y-3">
                    <motion.div variants={itemVariants}>
                      <Link
                        to="/login"
                        className="block w-full py-3 px-4 text-center font-medium text-secondary border border-secondary rounded-md hover:bg-secondary/10 transition-colors duration-200"
                        onClick={(e) => handleLinkClick(e, "/login")}
                      >
                        Connexion
                      </Link>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Link
                        to="/register"
                        className="block w-full py-3 px-4 text-center font-medium text-white bg-secondary rounded-md hover:bg-secondary/90 transition-colors duration-200"
                        onClick={(e) => handleLinkClick(e, "/register")}
                      >
                        Inscription
                      </Link>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ResponsiveMenu;
