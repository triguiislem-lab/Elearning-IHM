import React, { useState, useEffect, useRef } from "react";
import { NavbarMenu } from "../../mockData/data.js";
import {
  MdComputer,
  MdMenu,
  MdLogout,
  MdPerson,
  MdBook,
  MdMessage,
  MdDashboard,
  MdNotifications,
  MdClose,
} from "react-icons/md";
import { getAvatarUrl } from "../../utils/avatarUtils";
import { motion, AnimatePresence } from "framer-motion";
import ResponsiveMenu from "./ResponsiveMenu.jsx";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useAuth } from "../../hooks/useAuth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("/");
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const { user, userRole, isAuthenticated } = useAuth();
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Fonction pour vérifier si un lien est actif
  const isActive = (path) => {
    // Vérifier si c'est le lien actif que nous avons défini (pour l'ancre)
    if (activeLink === path) {
      return true;
    }

    // Pour la page d'accueil
    if (path === "/") {
      return location.pathname === "/" && !location.hash && activeLink === "/";
    }

    // Pour les liens d'ancrage
    if (path.includes("#")) {
      const anchor = path.split("#")[1];
      return location.hash === `#${anchor}`;
    }

    // Pour les autres pages
    return location.pathname.startsWith(path);
  };

  // Mettre à jour activeLink lorsque la location change
  useEffect(() => {
    if (location.hash) {
      setActiveLink(`/#${location.hash.substring(1)}`);
    } else {
      setActiveLink(location.pathname);
    }
  }, [location]);

  // Fonction pour le défilement fluide vers les ancres
  const handleSmoothScroll = (e, path) => {
    // Si c'est un lien d'ancrage et que nous sommes sur la page d'accueil
    if (path.includes("#")) {
      e.preventDefault();

      // Si nous ne sommes pas sur la page d'accueil, naviguer d'abord
      if (location.pathname !== "/") {
        navigate("/");
        // Attendre que la navigation se termine avant de défiler
        setTimeout(() => {
          const anchor = path.split("#")[1];
          const element = document.getElementById(anchor);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        const anchor = path.split("#")[1];
        const element = document.getElementById(anchor);

        if (element) {
          // Fermer les menus
          setUserMenuOpen(false);
          setIsOpen(false);

          // Scroll en douceur
          element.scrollIntoView({ behavior: "smooth", block: "start" });

          // Mettre à jour l'URL sans recharger la page
          window.history.pushState({}, "", path);

          // Définir ce lien comme actif
          setActiveLink(path);
        }
      }
    }
  };

  const toggleUserMenu = (e) => {
    e.stopPropagation();
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Gestion du clic en dehors du menu utilisateur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Empêcher le défilement de la page lorsque le menu mobile est ouvert
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

  // Récupérer le prénom et le nom de l'utilisateur
  const userFirstName = user?.firstName || user?.prenom || "";
  const userLastName = user?.lastName || user?.nom || "";
  const displayName = userFirstName
    ? `${userFirstName} ${userLastName.charAt(0)}.`
    : "Utilisateur";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 bg-white shadow-md z-50"
      >
        <div className="container mx-auto flex justify-between items-center py-4">
          {/* Logo section */}
          <div className="text-2xl flex items-center gap-2 font-bold">
            <MdComputer className="text-3xl text-secondary" />
            <Link
              to="/"
              className="hover:text-secondary transition-colors"
              onClick={() => setActiveLink("/")}
            >
              E-Tutor
            </Link>
          </div>

          {/* Menu section */}
          <div className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {NavbarMenu.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.link}
                    className={`inline-block py-1 px-3 hover:text-secondary transition-all duration-300 font-semibold relative 
                      ${
                        isActive(item.link) ? "text-secondary" : "text-gray-600"
                      }`}
                    onClick={(e) => {
                      if (item.link.includes("#")) {
                        handleSmoothScroll(e, item.link);
                      } else {
                        setActiveLink(item.link);
                      }
                    }}
                  >
                    {item.title}
                    {isActive(item.link) && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button section */}
          <div className="hidden lg:flex items-center space-x-6">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center gap-3 py-2 px-3 rounded-full hover:bg-gray-100 transition-colors duration-300"
                    aria-label="Menu utilisateur"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden shadow">
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
                    <span className="font-medium hidden md:block">
                      {displayName}
                    </span>
                  </button>
                </div>

                {/* User Menu Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-50 border border-gray-100"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email || ""}
                        </p>
                      </div>
                      <Link
                        to={`/${userRole.toLowerCase()}/dashboard`}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveLink(`/${userRole.toLowerCase()}/dashboard`);
                        }}
                      >
                        <MdDashboard className="mr-2 h-5 w-5 text-gray-500" />
                        Tableau de bord
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveLink("/profile");
                        }}
                      >
                        <MdPerson className="mr-2 h-5 w-5 text-gray-500" />
                        Mon profil
                      </Link>
                      {userRole === "student" && (
                        <Link
                          to="/student/enrollments"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setActiveLink("/student/enrollments");
                          }}
                        >
                          <MdBook className="mr-2 h-5 w-5 text-gray-500" />
                          Mes formations
                        </Link>
                      )}
                      {userRole === "instructor" && (
                        <Link
                          to="/instructor/courses"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setActiveLink("/instructor/courses");
                          }}
                        >
                          <MdBook className="mr-2 h-5 w-5 text-gray-500" />
                          Mes cours
                        </Link>
                      )}
                      {userRole === "admin" && (
                        <Link
                          to="/admin/courses"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setActiveLink("/admin/courses");
                          }}
                        >
                          <MdBook className="mr-2 h-5 w-5 text-gray-500" />
                          Gestion des cours
                        </Link>
                      )}
                      <Link
                        to="/messages"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveLink("/messages");
                        }}
                      >
                        <MdMessage className="mr-2 h-5 w-5 text-gray-500" />
                        Messages
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
                      >
                        <MdLogout className="mr-2 h-5 w-5" />
                        Déconnexion
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-semibold hover:text-secondary transition-colors duration-300"
                  onClick={() => setActiveLink("/login")}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="text-white bg-secondary font-semibold rounded-full px-6 py-2 hover:bg-secondary/90 transition-colors duration-300"
                  onClick={() => setActiveLink("/register")}
                >
                  Inscription
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <button
            className="lg:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isOpen ? (
              <MdClose className="text-3xl" />
            ) : (
              <MdMenu className="text-3xl" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Mobile Sidebar section */}
      <ResponsiveMenu
        isOpen={isOpen}
        user={user}
        userRole={userRole}
        isAuthenticated={isAuthenticated}
        handleLogout={handleLogout}
        setIsOpen={setIsOpen}
        handleSmoothScroll={handleSmoothScroll}
        setActiveLink={setActiveLink}
      />
    </>
  );
};

export default Navbar;
