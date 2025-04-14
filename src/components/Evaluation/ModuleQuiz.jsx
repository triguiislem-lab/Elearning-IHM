import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { database } from "../../../firebaseConfig";
import { ref, set, get } from "firebase/database";
import { motion } from "framer-motion";

const ModuleQuiz = ({
  quiz,
  onComplete,
  previousAttempts,
  moduleId,
  courseId,
}) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    if (previousAttempts && previousAttempts.length > 0) {
      const best = Math.max(
        ...previousAttempts.map((attempt) => attempt.score)
      );
      setBestScore(best);
    }
  }, [previousAttempts]);

  const handleAnswer = (selectedOption) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedOption;
    setAnswers(newAnswers);

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore(newAnswers);
    }
  };

  const calculateScore = (finalAnswers) => {
    const correctAnswers = finalAnswers.reduce((count, answer, index) => {
      return count + (answer === quiz.questions[index].correctAnswer ? 1 : 0);
    }, 0);

    const finalScore = Math.round(
      (correctAnswers / quiz.questions.length) * 100
    );
    setScore(finalScore);
    setCompleted(true);

    if (finalScore >= 70) {
      updateModuleStatus(finalScore);
    }
  };

  const updateModuleStatus = async (finalScore) => {
    if (!user) return;

    try {
      const moduleStatusRef = ref(
        database,
        `elearning/progress/${user.uid}/${courseId}/${moduleId}`
      );
      await set(moduleStatusRef, {
        completed: true,
        score: finalScore,
        lastUpdated: new Date().toISOString(),
      });

      await checkCourseCompletion();
    } catch (error) {
      console.error("Error updating module status:", error);
    }
  };

  const checkCourseCompletion = async () => {
    if (!user || !courseId) return;

    try {
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${courseId}`
      );
      const snapshot = await get(progressRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        // Filtrer les clés qui sont des modules (pas des métadonnées du cours)
        const moduleKeys = Object.keys(data).filter(
          (key) =>
            key !== "courseId" &&
            key !== "userId" &&
            key !== "startDate" &&
            key !== "progress" &&
            key !== "completed" &&
            key !== "lastUpdated"
        );

        const modules = moduleKeys.map((key) => data[key]);
        const allModulesCompleted = modules.every((module) => module.completed);
        const averageScore =
          modules.reduce((sum, module) => sum + (module.score || 0), 0) /
          modules.length;

        if (allModulesCompleted) {
          const courseStatusRef = ref(
            database,
            `elearning/courses/${courseId}/status/${user.uid}`
          );
          await set(courseStatusRef, {
            completed: true,
            score: averageScore,
            completedAt: new Date().toISOString(),
            passed: averageScore >= 70,
          });
        }
      }
    } catch (error) {
      console.error("Error checking course completion:", error);
    }
  };

  const confirmScore = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError("");

      const attemptRef = ref(
        database,
        `elearning/evaluations/${moduleId}/${user.uid}`
      );
      const snapshot = await get(attemptRef);

      if (snapshot.exists()) {
        const attemptData = snapshot.val();
        await set(attemptRef, {
          ...attemptData,
          confirmed: true,
          bestScore: Math.max(attemptData.score, bestScore),
        });
      }

      setConfirmed(true);
      setLoading(false);

      if (onComplete) {
        onComplete(score);
      }
    } catch (error) {
      setError("Une erreur s'est produite lors de la confirmation du score.");
      setLoading(false);
    }
  };

  if (!quiz || !quiz.questions) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        Aucune question disponible pour ce quiz.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!completed ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">
              Question {currentQuestion + 1} sur {quiz.questions.length}
            </div>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((currentQuestion + 1) / quiz.questions.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>

          <h3 className="text-lg font-medium mb-4">
            {quiz.questions[currentQuestion].question}
          </h3>

          <div className="space-y-3">
            {quiz.questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors duration-200"
              >
                {option}
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-lg shadow-sm"
        >
          <h3 className="text-xl font-semibold mb-4">Résultats du quiz</h3>

          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className="w-32 h-32">
                <circle
                  className="text-gray-200"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="64"
                  cy="64"
                />
                <circle
                  className="text-blue-500"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="58"
                  cx="64"
                  cy="64"
                  strokeDasharray={`${score * 3.64} 364`}
                />
              </svg>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">
                {score}%
              </span>
            </div>
          </div>

          {score >= 70 ? (
            <div className="text-green-600 text-center mb-6">
              Félicitations ! Vous avez réussi le quiz !
            </div>
          ) : (
            <div className="text-red-600 text-center mb-6">
              Vous devez obtenir au moins 70% pour valider le module.
            </div>
          )}

          {!confirmed && (
            <button
              onClick={confirmScore}
              disabled={loading}
              className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {loading ? "Confirmation..." : "Confirmer le score"}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ModuleQuiz;
