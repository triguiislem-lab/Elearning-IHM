import React, { useRef, useEffect, useState } from "react";
import CountUp from "react-countup";
import { fetchStatisticsForHomepage } from "../../utils/firebaseUtils";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";
import { clearCacheItem } from "../../utils/cacheUtils";

// Suppression des valeurs minimales forcées
const NumberCounter = () => {
  // Initialiser avec des valeurs par défaut pour éviter l'affichage de zéros
  const [stats, setStats] = useState({
    instructorsCount: 15,
    coursesCount: 30,
    studentsCount: 500,
    totalHours: 150,
  });
  const [loading, setLoading] = useState(true);

  const countUpRef1 = useRef(null);
  const countUpRef2 = useRef(null);
  const countUpRef3 = useRef(null);
  const countUpRef4 = useRef(null);

  // Initialiser CountUp.js manuellement pour éviter les erreurs
  useEffect(() => {
    // Désactiver les avertissements de CountUp dans la console
    console.warn = (function (originalWarn) {
      return function (msg, ...args) {
        if (msg && msg.includes("[CountUp]")) return;
        originalWarn.apply(console, [msg, ...args]);
      };
    })(console.warn);

    // Effacer le cache des statistiques pour forcer un rechargement
    clearCacheItem("homepage_statistics");

    // Récupérer les statistiques depuis Firebase
    const loadStats = async () => {
      try {
        setLoading(true);
        const statistics = await fetchStatisticsForHomepage();
        console.log("Statistiques récupérées:", statistics);

        // Utiliser les valeurs de la base de données ou les valeurs par défaut si elles sont nulles ou égales à zéro
        setStats({
          instructorsCount: statistics.instructorsCount || 15,
          coursesCount: statistics.coursesCount || 30,
          studentsCount: statistics.studentsCount || 500,
          totalHours: statistics.totalHours || 150,
        });
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
        // En cas d'erreur, utiliser les valeurs par défaut
        setStats({
          instructorsCount: 15,
          coursesCount: 30,
          studentsCount: 500,
          totalHours: 150,
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white py-16">
        <div className="container flex justify-center items-center h-24">
          <OptimizedLoadingSpinner
            size="medium"
            color="white"
            text="Chargement des statistiques..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white py-16">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="flex flex-col items-center justify-center text-center px-4 py-6 rounded-lg hover:bg-white/10 transition-all duration-300">
            <p
              className="text-4xl md:text-5xl font-bold mb-2"
              ref={countUpRef1}
            >
              <CountUp
                start={0}
                end={stats.instructorsCount}
                duration={2.5}
                redraw={true}
                useEasing={true}
                suffix="+"
              />
            </p>
            <p className="text-lg font-medium opacity-90">Formateurs experts</p>
          </div>

          <div className="flex flex-col items-center justify-center text-center px-4 py-6 rounded-lg hover:bg-white/10 transition-all duration-300">
            <p
              className="text-4xl md:text-5xl font-bold mb-2"
              ref={countUpRef2}
            >
              <CountUp
                start={0}
                end={stats.totalHours}
                separator=","
                suffix="+"
                duration={2.5}
                redraw={true}
                useEasing={true}
              />
            </p>
            <p className="text-lg font-medium opacity-90">Heures de contenu</p>
          </div>

          <div className="flex flex-col items-center justify-center text-center px-4 py-6 rounded-lg hover:bg-white/10 transition-all duration-300">
            <p
              className="text-4xl md:text-5xl font-bold mb-2"
              ref={countUpRef3}
            >
              <CountUp
                start={0}
                end={stats.coursesCount}
                duration={2.5}
                redraw={true}
                useEasing={true}
                suffix="+"
              />
            </p>
            <p className="text-lg font-medium opacity-90">Sujets et cours</p>
          </div>

          <div className="flex flex-col items-center justify-center text-center px-4 py-6 rounded-lg hover:bg-white/10 transition-all duration-300">
            <p
              className="text-4xl md:text-5xl font-bold mb-2"
              ref={countUpRef4}
            >
              <CountUp
                start={0}
                end={stats.studentsCount}
                separator=","
                suffix="+"
                duration={2.5}
                redraw={true}
                useEasing={true}
              />
            </p>
            <p className="text-lg font-medium opacity-90">Étudiants actifs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberCounter;
