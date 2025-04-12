import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { fetchTestimonialsFromDatabase } from "../../utils/firebaseUtils";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

// Testimonials par défaut pour le fallback
const defaultTestimonials = [
  {
    id: 1,
    name: "John Doe",
    role: "Étudiant",
    comment:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eaque reiciendis inventore iste ratione ex alias quis magni at optio",
    avatar: "https://picsum.photos/101/101",
    rating: 5,
    delay: 0.2,
  },
  {
    id: 2,
    name: "Steve Smith",
    role: "Développeur Web",
    comment:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eaque reiciendis inventore iste ratione ex alias quis magni at optio",
    avatar: "https://picsum.photos/102/102",
    rating: 5,
    delay: 0.5,
  },
  {
    id: 3,
    name: "Kristen",
    role: "Designer",
    comment:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eaque reiciendis inventore iste ratione ex alias quis magni at optio",
    avatar: "https://picsum.photos/104/104",
    rating: 4,
    delay: 0.8,
  },
  {
    id: 4,
    name: "Ariana",
    role: "Étudiante",
    comment:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eaque reiciendis inventore iste ratione ex alias quis magni at optio",
    avatar: "https://picsum.photos/103/103",
    rating: 5,
    delay: 1.1,
  },
];

const Testimonial = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        setLoading(true);
        // Récupérer jusqu'à 8 témoignages depuis la base de données
        const data = await fetchTestimonialsFromDatabase(8);
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

  // Configuration du slider basée sur le nouveau design
  const setting = {
    dots: true,
    arrow: false,
    infinite: true,
    speed: 500,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    cssEase: "linear",
    pauseOnHover: true,
    pauseOnFocus: true,
    responsive: [
      {
        breakpoint: 10000,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  // Fonction pour générer les étoiles en fonction de la note
  const renderStars = (rating) => {
    return "⭐".repeat(rating);
  };

  return (
    <div className="py-14 mb-10">
      <div className="container">
        {/* header section */}
        <div className="space-y-4 p-6 text-center max-w-[600px] mx-auto mb-6">
          <h1 className="uppercase font-semibold text-orange-600">
            AVIS DES ÉTUDIANTS
          </h1>
          <p className="font-semibold text-3xl">
            Ce Que Nos Étudiants Disent De Nous
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
            <Slider {...setting}>
              {testimonials.map((item) => (
                <div key={item.id}>
                  <div className="flex flex-col gap-4 p-8 shadow-lg mx-4 rounded-xl bg-secondary/10">
                    {/* upper section */}
                    <div className="flex justify-start items-center gap-5">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-16 h-16 rounded-full"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://ui-avatars.com/api/?name=" +
                            encodeURIComponent(item.name) +
                            "&background=random";
                        }}
                      />
                      <div>
                        <p className="text-xl font-bold text-black/80">
                          {item.name}
                        </p>
                        <p>{item.role}</p>
                      </div>
                    </div>
                    {/* bottom section */}
                    <div className="py-6 space-y-4">
                      <p className="text-sm text-gray-500">{item.comment}</p>
                      <p>{renderStars(item.rating)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          )}
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
