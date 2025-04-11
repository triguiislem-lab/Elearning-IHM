import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MdCheckCircle, MdCancel, MdHelp } from "react-icons/md";

export const QuizComponent = ({
  questions,
  onComplete,
  initialScore = null,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // Si un score initial est fourni, on est en mode révision
  useEffect(() => {
    if (initialScore !== null) {
      setReviewing(true);
    }
  }, [initialScore]);

  // Si questions est vide ou null, retourner un message d'erreur
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 p-4 rounded-lg">
        <p className="font-medium">Aucune question disponible</p>
        <p className="text-sm mt-1">
          Ce quiz ne contient pas de questions. Veuillez contacter le formateur.
        </p>
      </div>
    );
  }

  const handleAnswerSelection = (questionIndex, answerIndex) => {
    if (showResults) return; // Ne rien faire si les résultats sont affichés

    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    // Calculer le score
    let correctAnswers = 0;
    const totalQuestions = questions.length;

    questions.forEach((question, index) => {
      if (
        selectedAnswers[index] !== undefined &&
        selectedAnswers[index] === question.correctAnswer
      ) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    setQuizScore(score);
    setIsSubmitted(true);
    setShowResults(true);

    // Notifier le parent du score
    if (onComplete) {
      onComplete({ score, answers: selectedAnswers });
    }
  };

  const handleShowResults = () => {
    setShowResults(true);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setIsSubmitted(false);
    setShowResults(false);
    setQuizScore(0);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const hasSelectedAnswer = selectedAnswers[currentQuestionIndex] !== undefined;
  const allQuestionsAnswered =
    Object.keys(selectedAnswers).length === questions.length;

  // Rendre la vue des résultats si le quiz est terminé
  if (showResults) {
    return (
      <div className="space-y-6">
        <div
          className={`p-6 rounded-lg ${
            quizScore >= 70
              ? "bg-green-50 border border-green-100"
              : "bg-yellow-50 border border-yellow-100"
          }`}
        >
          <div className="flex items-center mb-4">
            {quizScore >= 70 ? (
              <MdCheckCircle className="text-green-500 text-3xl mr-3" />
            ) : (
              <MdHelp className="text-yellow-500 text-3xl mr-3" />
            )}
            <div>
              <h3 className="text-xl font-medium">
                {quizScore >= 70 ? "Quiz réussi!" : "Quiz à améliorer"}
              </h3>
              <p className="text-lg">
                Votre score: <span className="font-bold">{quizScore}%</span>
              </p>
              <p className="text-sm text-gray-600">
                {quizScore >= 70
                  ? "Félicitations! Vous avez réussi ce quiz."
                  : "Vous pourriez revoir ce module et réessayer."}
              </p>
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleResetQuiz}
              className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90"
            >
              Refaire le quiz
            </button>
            <button
              onClick={() => setCurrentQuestionIndex(0)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Voir les réponses
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-xl font-medium mb-4">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </h3>
          <div className="mb-6">
            <p className="text-lg font-medium mb-2">
              {currentQuestion.question}
            </p>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  onClick={() =>
                    handleAnswerSelection(currentQuestionIndex, index)
                  }
                  className={`p-3 rounded-lg border cursor-pointer
                    ${
                      selectedAnswers[currentQuestionIndex] === index
                        ? currentQuestion.correctAnswer === index
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                        : currentQuestion.correctAnswer === index
                        ? "bg-green-50 border-green-200"
                        : "hover:bg-gray-50"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {selectedAnswers[currentQuestionIndex] === index &&
                      currentQuestion.correctAnswer !== index && (
                        <MdCancel className="text-red-500 text-xl" />
                      )}
                    {currentQuestion.correctAnswer === index && (
                      <MdCheckCircle className="text-green-500 text-xl" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
            >
              Question précédente
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
            >
              Question suivante
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rendre le quiz normal
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium">
            Question {currentQuestionIndex + 1} sur {questions.length}
          </h3>
          <div className="flex items-center">
            <div className="w-40 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-500 rounded-full"
                style={{
                  width: `${
                    (Object.keys(selectedAnswers).length / questions.length) *
                    100
                  }%`,
                }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-gray-600">
              {Object.keys(selectedAnswers).length}/{questions.length} réponses
            </span>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                onClick={() =>
                  handleAnswerSelection(currentQuestionIndex, index)
                }
                className={`p-3 rounded-lg border cursor-pointer transition-colors
                  ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? "bg-blue-50 border-blue-300"
                      : "hover:bg-gray-50"
                  }
                `}
              >
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Question précédente
          </button>
          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={!allQuestionsAnswered || isSubmitted}
              className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
            >
              {isSubmitted ? "Quiz terminé" : "Terminer le quiz"}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              disabled={!hasSelectedAnswer}
              className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
            >
              Question suivante
            </button>
          )}
        </div>
      </div>

      {allQuestionsAnswered &&
        currentQuestionIndex !== questions.length - 1 && (
          <div className="flex justify-center">
            <button
              onClick={handleSubmitQuiz}
              disabled={isSubmitted}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              {isSubmitted ? "Quiz terminé" : "Terminer le quiz"}
            </button>
          </div>
        )}

      {reviewing && (
        <div className="flex justify-center">
          <button
            onClick={handleShowResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Voir les résultats
          </button>
        </div>
      )}
    </motion.div>
  );
};
