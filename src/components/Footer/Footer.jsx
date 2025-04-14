import React, { useState } from "react";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
} from "react-icons/fa";
import { HiLocationMarker } from "react-icons/hi";
import {
  MdComputer,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdSchool,
  MdSend,
  MdHome,
  MdInfo,
  MdLogin,
  MdPersonAdd,
} from "react-icons/md";
import { Link } from "react-router-dom";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically handle the newsletter subscription
    console.log("Newsletter subscription for:", email);
    setEmail("");
    // Show a success message or toast notification
  };

  return (
    <footer className="bg-dark text-white pt-12">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand section */}
          <div className="space-y-4">
            <div className="text-2xl flex items-center gap-2 font-bold">
              <MdComputer className="text-secondary text-4xl" />
              <p>E-Learning</p>
            </div>
            <p className="text-gray-300 mt-4">
              Développez vos compétences grâce à des expériences d'apprentissage
              en ligne innovantes. Rejoignez des milliers d'apprenants sur leur
              chemin vers la réussite.
            </p>
            <div className="flex items-center justify-start gap-5 !mt-6">
              <a
                href="#"
                className="text-gray-300 hover:text-secondary duration-200"
                aria-label="Location"
              >
                <HiLocationMarker className="text-3xl" />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-secondary duration-200"
                aria-label="Instagram"
              >
                <FaInstagram className="text-3xl" />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-secondary duration-200"
                aria-label="Facebook"
              >
                <FaFacebook className="text-3xl" />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-secondary duration-200"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="text-3xl" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="py-8 px-4">
            <h1 className="sm:text-xl text-xl font-bold sm:text-left text-justify mb-5">
              Liens Rapides
            </h1>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-secondary duration-200 flex items-center gap-2"
                >
                  <MdHome className="text-secondary" />
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-300 hover:text-secondary duration-200 flex items-center gap-2"
                >
                  <MdInfo className="text-secondary" />À Propos
                </Link>
              </li>
              <li>
                <Link
                  to="/courses"
                  className="text-gray-300 hover:text-secondary duration-200 flex items-center gap-2"
                >
                  <MdSchool className="text-secondary" />
                  Formations
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-secondary duration-200 flex items-center gap-2"
                >
                  <MdLogin className="text-secondary" />
                  Connexion
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="py-8 px-4">
            <h1 className="sm:text-xl text-xl font-bold sm:text-left text-justify mb-5">
              Contactez-nous
            </h1>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-3">
                <MdPhone className="text-secondary text-xl" />
                <span className="text-gray-300">+216 71 123 456</span>
              </li>
              <li className="flex items-center gap-3">
                <MdEmail className="text-secondary text-xl" />
                <span className="text-gray-300">contact@e-learning.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MdLocationOn className="text-secondary text-xl mt-1" />
                <span className="text-gray-300">
                  123 Avenue de l'Apprentissage,
                  <br />
                  Tunis, 1002
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="py-8 px-4">
            <h1 className="sm:text-xl text-xl font-bold sm:text-left text-justify mb-5">
              Newsletter
            </h1>
            <p className="text-gray-300 mb-4">
              Abonnez-vous à notre newsletter pour recevoir les dernières mises
              à jour et offres.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Entrez votre email"
                  className="form-input w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                  required
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bg-secondary text-white p-2 rounded-md hover:bg-secondary/90 transition-colors duration-300 flex items-center justify-center"
                  aria-label="S'abonner"
                >
                  <MdSend className="text-xl" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                En vous inscrivant, vous acceptez notre politique de
                confidentialité.
              </p>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-6"></div>

        {/* Copyright and Policies */}
        <div className="flex flex-col md:flex-row justify-between items-center py-6 border-t border-gray-700">
          <span className="text-sm text-gray-400">
            © 2024 E-Learning. Tous droits réservés.
          </span>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
            >
              Politique de confidentialité
            </a>
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
            >
              Conditions d'utilisation
            </a>
            <a
              href="#"
              className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
