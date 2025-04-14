import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { database } from "../../../firebaseConfig";
import { ref, set, push, get } from "firebase/database";
import {
  MdHelp,
  MdCheck,
  MdClose,
  MdInfo,
  MdWarning,
  MdQuiz,
  MdAssignment,
} from "react-icons/md";
import { QuizComponent } from "./QuizComponent";

const ModuleEvaluation = ({
  module,
  onComplete,
  attempts = [],
  isEnrolled = true,
}) => {
  const { user } = useAuth();
  const [activeEvaluation, setActiveEvaluation] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userScore, setUserScore] = useState(null);
  const [evaluationData, setEvaluationData] = useState([]);
  const [hasStaticQuiz, setHasStaticQuiz] = useState(false);

  // Normaliser les évaluations en tableau
  useEffect(() => {
    if (!module) return;

    setLoading(true);
    setError(null);

    try {
      let evalsArray = [];

      // Vérifier si les évaluations sont directement dans le module
      if (module.evaluations) {
        console.log("Module evaluations:", module.evaluations);

        if (Array.isArray(module.evaluations)) {
          console.log("Module evaluations is already an array");
          evalsArray = [...module.evaluations];
        } else if (typeof module.evaluations === "object") {
          console.log("Converting module evaluations object to array");
          evalsArray = Object.entries(module.evaluations).map(
            ([id, evalItem]) => ({
              id,
              ...evalItem,
            })
          );
        }

        console.log("Normalized evaluations array:", evalsArray);
      }

      // Si aucune évaluation n'est trouvée, chercher les quiz statiques
      if (evalsArray.length === 0) {
        loadStaticQuizIfAvailable();
      } else {
        setEvaluationData(evalsArray);
      }
    } catch (err) {
      console.error("Erreur lors du traitement des évaluations", err);
      setError("Une erreur est survenue lors du chargement des évaluations");
    } finally {
      setLoading(false);
    }
  }, [module]);

  // Charger le quiz statique associé au module
  const loadStaticQuizIfAvailable = async () => {
    if (!module || !module.id) return;

    try {
      setLoading(true);
      console.log("Looking for static quiz for module:", module.id);

      // Check standard path
      const quizRef = ref(
        database,
        `elearning/evaluations/${module.id}/static_quiz`
      );
      let snapshot = await get(quizRef);

      // If not found, check legacy path
      if (!snapshot.exists()) {
        console.log(
          "Static quiz not found in standard path, checking legacy path"
        );
        const legacyQuizRef = ref(
          database,
          `Elearning/Evaluations/${module.id}/static_quiz`
        );
        snapshot = await get(legacyQuizRef);
      }

      if (snapshot.exists()) {
        setHasStaticQuiz(true);
        const quizData = snapshot.val();

        // Créer une évaluation à partir du quiz statique
        const quizEvaluation = {
          id: "static_quiz",
          type: "quiz",
          title: quizData.title || "Quiz du module",
          description:
            quizData.description || "Évaluez vos connaissances avec ce quiz",
          questions: quizData.questions || [],
        };

        setEvaluationData([quizEvaluation]);

        // Vérifier les tentatives précédentes
        if (attempts && attempts.length > 0) {
          const latestAttempt = attempts[attempts.length - 1];
          setUserScore(latestAttempt.score);
        }
      } else {
        // Vérifier s'il y a des questions directement
        const questionsRef = ref(
          database,
          `elearning/evaluations/${module.id}/questions`
        );
        const questionsSnapshot = await get(questionsRef);

        if (questionsSnapshot.exists()) {
          const questions = questionsSnapshot.val();
          if (Array.isArray(questions) && questions.length > 0) {
            const quizEvaluation = {
              id: "questions_quiz",
              type: "quiz",
              title: "Quiz du module",
              description: "Évaluez vos connaissances avec ce quiz",
              questions: questions,
            };

            setEvaluationData([quizEvaluation]);
            setHasStaticQuiz(true);
          }
        } else {
          // Aucune évaluation trouvée
          console.log("Aucune évaluation trouvée pour ce module");
          setEvaluationData([]);
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement du quiz", err);
      setError("Une erreur est survenue lors du chargement du quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvaluation = (evaluation) => {
    setActiveEvaluation(evaluation);

    if (evaluation.type === "quiz" && evaluation.questions) {
      setQuizQuestions(evaluation.questions);
    } else {
      // Charger les questions depuis Firebase si nécessaire
      loadQuizQuestions(evaluation.id);
    }
  };

  const loadQuizQuestions = async (evaluationId) => {
    if (!module || !module.id) return;

    try {
      setLoading(true);
      setError(null);
      console.log("Loading quiz questions for evaluation:", evaluationId);

      let questionsPath;
      if (evaluationId === "static_quiz") {
        questionsPath = `elearning/evaluations/${module.id}/static_quiz/questions`;
      } else {
        questionsPath = `elearning/evaluations/${module.id}/${evaluationId}/questions`;
      }

      const questionsRef = ref(database, questionsPath);
      let snapshot = await get(questionsRef);

      // If not found, check legacy path
      if (!snapshot.exists()) {
        console.log(
          "Questions not found in standard path, checking legacy path"
        );
        let legacyQuestionsPath;
        if (evaluationId === "static_quiz") {
          legacyQuestionsPath = `Elearning/Evaluations/${module.id}/static_quiz/questions`;
        } else {
          legacyQuestionsPath = `Elearning/Evaluations/${module.id}/${evaluationId}/questions`;
        }

        const legacyQuestionsRef = ref(database, legacyQuestionsPath);
        snapshot = await get(legacyQuestionsRef);
      }

      if (snapshot.exists()) {
        const questions = snapshot.val();
        setQuizQuestions(Array.isArray(questions) ? questions : []);
      } else {
        setError("Aucune question trouvée pour ce quiz");
        setQuizQuestions([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des questions", err);
      setError("Une erreur est survenue lors du chargement des questions");
    } finally {
      setLoading(false);
    }
  };

  const saveQuizResult = async (score, answers) => {
    if (!user || !module || !module.id || !module.courseId) return;

    try {
      const currentTime = new Date().toISOString();

      // Enregistrer la tentative dans Firebase
      const attemptsRef = ref(
        database,
        `elearning/evaluations/${module.id}/${user.uid}/attempts`
      );
      const newAttemptRef = push(attemptsRef);

      await set(newAttemptRef, {
        id: newAttemptRef.key,
        moduleId: module.id,
        courseId: module.courseId,
        userId: user.uid,
        score: score,
        answers: answers,
        timestamp: currentTime,
        evaluationId: activeEvaluation?.id || "unknown",
      });

      // Mettre à jour le score de l'utilisateur
      setUserScore(score);

      // Notifier le parent que l'évaluation est terminée
      if (onComplete) {
        onComplete(score);
      }
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du résultat", err);
      setError(
        "Une erreur est survenue lors de l'enregistrement de votre résultat"
      );
    }
  };

  const handleQuizComplete = ({ score, answers }) => {
    saveQuizResult(score, answers);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Chargement de l'évaluation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center">
        <MdWarning className="w-5 h-5 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (evaluationData.length === 0 && !hasStaticQuiz) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg text-blue-800 flex items-center gap-3">
        <MdInfo className="text-blue-500 text-xl" />
        <div>
          <p className="font-medium">Aucune évaluation disponible</p>
          <p className="text-sm">
            Le formateur n'a pas encore ajouté d'évaluations à ce module.
          </p>
        </div>
      </div>
    );
  }

  if (activeEvaluation && activeEvaluation.type === "quiz") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-medium">{activeEvaluation.title}</h3>
          <button
            onClick={() => setActiveEvaluation(null)}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Retour aux évaluations
          </button>
        </div>

        {activeEvaluation.description && (
          <p className="text-gray-600">{activeEvaluation.description}</p>
        )}

        <QuizComponent
          questions={quizQuestions}
          onComplete={handleQuizComplete}
          initialScore={userScore}
        />
      </div>
    );
  }

  // If user is not enrolled, show a message
  if (!isEnrolled) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 flex items-center gap-3">
        <MdWarning className="text-yellow-500 text-xl" />
        <div>
          <p className="font-medium">Accès limité</p>
          <p className="text-sm">
            Vous devez être inscrit à ce cours pour accéder aux évaluations.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="mt-2 px-3 py-1 bg-secondary text-white text-sm rounded hover:bg-secondary/90 transition-colors"
          >
            S'inscrire maintenant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-xl font-medium">Évaluations du module</h3>
        <p className="text-gray-600">
          Complétez ces évaluations pour valider vos connaissances
        </p>
      </div>

      {userScore !== null && (
        <div
          className={`p-4 rounded-lg ${
            userScore >= 70
              ? "bg-green-50 border border-green-200"
              : "bg-yellow-50 border border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {userScore >= 70 ? (
                <MdCheck className="w-6 h-6 text-green-500 mr-2" />
              ) : (
                <MdInfo className="w-6 h-6 text-yellow-500 mr-2" />
              )}
              <div>
                <p className="font-medium">
                  {userScore >= 70
                    ? "Évaluation réussie!"
                    : "Évaluation à améliorer"}
                </p>
                <p className="text-sm">
                  Votre score: {userScore}% (seuil de réussite: 70%)
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveEvaluation(evaluationData[0])}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {userScore >= 70 ? "Revoir" : "Réessayer"}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {evaluationData.map((evaluation) => (
          <motion.div
            key={evaluation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-lg border hover:shadow-md"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                {evaluation.type === "quiz" ? (
                  <MdQuiz className="w-6 h-6 text-blue-500" />
                ) : (
                  <MdAssignment className="w-6 h-6 text-orange-500" />
                )}
                <div>
                  <h4 className="font-medium">{evaluation.title}</h4>
                  <p className="text-sm text-gray-500">
                    {evaluation.description ||
                      (evaluation.type === "quiz"
                        ? "Quiz à choix multiples"
                        : "Devoir à rendre")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleStartEvaluation(evaluation)}
                className="px-3 py-1 bg-secondary text-white rounded-md hover:bg-secondary/90"
              >
                {userScore !== null ? "Revoir" : "Commencer"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ModuleEvaluation;
