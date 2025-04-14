import React, { useState, useEffect } from "react";
import { fetchTestimonialsFromDatabase } from "../../utils/firebaseUtils";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";
import { motion } from "framer-motion";
import TestimonialCard from "./TestimonialCard";

// Testimonials par défaut pour le fallback
const defaultTestimonials = [
  {
    id: 1,
    name: "Sophie Martin",
    role: "Étudiante en Marketing Digital",
    comment:
      "Cette plateforme d'apprentissage a transformé ma façon d'étudier. Les cours sont interactifs et les instructeurs sont très compétents. J'ai pu acquérir de nouvelles compétences en seulement quelques mois.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    rating: 5,
  },
  {
    id: 2,
    name: "Thomas Dubois",
    role: "Développeur Web",
    comment:
      "Le meilleur investissement que j'ai fait pour ma carrière. La qualité des cours et le support de la communauté sont exceptionnels. Je recommande vivement !",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    rating: 5,
  },
  {
    id: 3,
    name: "Marie Laurent",
    role: "Designer UX/UI",
    comment:
      "J'apprécie particulièrement la flexibilité de la plateforme. Je peux apprendre à mon rythme et les ressources sont toujours à jour avec les dernières tendances.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    rating: 5,
  },
];

const Testimonial = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        setLoading(true);
        // Récupérer jusqu'à 6 témoignages depuis la base de données
        const data = await fetchTestimonialsFromDatabase(6);
        if (data && data.length > 0) {
          // Ajouter la propriété delay aux témoignages chargés
          const testimonialsWithDelay = data.map((item, index) => ({
            ...item,
            delay: 0.2 + index * 0.3,
          }));
          setTestimonials(testimonialsWithDelay);
        } else {
          setTestimonials(defaultTestimonials);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des témoignages:", error);
        setTestimonials(defaultTestimonials);
      } finally {
        setLoading(false);
      }
    };

    loadTestimonials();
  }, []);

  // Fonction pour générer les étoiles en fonction de la note
  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <span key={index} className={`text-yellow-400 text-xl`}>
        {index < Math.floor(rating) ? "★" : "☆"}
      </span>
    ));
  };

  return (
    <div className="section bg-light">
      <div className="container">
        {/* header section */}
        <div className="space-y-4 p-6 text-center max-w-[700px] mx-auto mb-16">
          <h3 className="uppercase font-semibold text-accent">
            AVIS DES ÉTUDIANTS
          </h3>
          <h2 className="section-title">Ce Que Nos Étudiants Disent De Nous</h2>
          <p className="section-subtitle">
            Découvrez les témoignages de nos étudiants qui ont suivi nos
            formations et partagent leur expérience.
          </p>
        </div>

        {/* Testimonial cards section */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <OptimizedLoadingSpinner
                size="large"
                text="Chargement des témoignages..."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map((item, index) => (
                <TestimonialCard
                  key={item.id}
                  testimonial={item}
                  index={index}
                  renderStars={renderStars}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
