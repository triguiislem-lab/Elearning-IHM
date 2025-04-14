import React from "react";
import { Link } from "react-router-dom";
import HeroImg from "../../assets/hero.png";
import { FaPlay } from "react-icons/fa";
import { motion } from "framer-motion";
import { SlideRight } from "../../utility/animation";

const Hero = () => {
  return (
    <>
      <div className="container grid grid-cols-1 md:grid-cols-2 min-h-[650px] relative">
        {/* brand info */}
        <div className="flex flex-col justify-center py-14 md:pr-16 xl:pr-40 md:py-0">
          <div className="text-center md:text-left space-y-6">
            <motion.p
              variants={SlideRight(0.4)}
              initial="hidden"
              animate="visible"
              className="text-orange-600 uppercase font-semibold"
            >
              100% Satisfaction Garantie
            </motion.p>
            <motion.h1
              variants={SlideRight(0.6)}
              initial="hidden"
              animate="visible"
              className="text-5xl font-semibold lg:text-6xl !leading-tight"
            >
              Trouvez Votre <span className="text-primary">Formation</span>{" "}
              Idéale
            </motion.h1>
            <motion.p
              variants={SlideRight(0.8)}
              initial="hidden"
              animate="visible"
            >
              Notre plateforme vous aide à trouver des formations adaptées à vos
              besoins. Accédez à des contenus de qualité en toute simplicité
            </motion.p>
            {/* button section */}
            <motion.div
              variants={SlideRight(1.0)}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center md:justify-start !mt-8 items-center"
            >
              <Link to="/courses" className="primary-btn">
                Commencer
              </Link>
              <button
                onClick={() => {
                  // Open a modal or scroll to a section that explains how the platform works
                  document
                    .getElementById("resources")
                    .scrollIntoView({ behavior: "smooth" });
                }}
                className="outline-btn"
              >
                <span className="w-8 h-8 bg-secondary/15 rounded-full flex justify-center items-center mr-2">
                  <FaPlay className="text-secondary" />
                </span>
                Voir comment ça marche
              </button>
            </motion.div>
          </div>
        </div>
        {/* Hero image */}
        <div className="flex justify-center items-center">
          <motion.img
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            src={HeroImg}
            alt=""
            className="w-[350px] md:w-[550px] xl:w-[700px]"
          />
        </div>
      </div>
    </>
  );
};

export default Hero;
