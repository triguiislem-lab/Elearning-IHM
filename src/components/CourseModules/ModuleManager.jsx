import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";
import {
  MdAdd,
  MdSave,
  MdCancel,
  MdDelete,
  MdEdit,
  MdQuiz,
  MdAssignment,
  MdClose,
} from "react-icons/md";
import {
  addModuleToCourse,
  addEvaluationToModule,
  createTestModulesForCourse,
} from "../../utils/firebaseUtils";

const ModuleManager = ({ course, onModulesUpdated, instructorId }) => {
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddEvaluation, setShowAddEvaluation] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // États pour le formulaire d'ajout de module
  const [moduleData, setModuleData] = useState({
    title: "",
    description: "",
    order: course?.modules?.length + 1 || 1, // Default order
  });

  // États pour le formulaire d'ajout d'évaluation
  const [evaluationData, setEvaluationData] = useState({
    title: "",
    type: "quiz",
    description: "",
    maxScore: 100,
    // score: 0, // Score likely calculated elsewhere or upon submission
    questions: [],
  });

  // States for question management
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);

  // --- Permission Check Helper ---
  const canModifyCourse = () => {
    // Basic check: ensure instructorId prop is passed and matches course instructor
    // Note: Assumes parent component verified the user IS an instructor.
    // Add role === 'admin' check here if needed and role is passed down.
    if (!instructorId || !course || course.instructorId !== instructorId) {
      setError("Vous n'avez pas les permissions pour modifier ce cours.");
      return false;
    }
    setError(""); // Clear error if permission is okay
    return true;
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!canModifyCourse()) return; // Permission check

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Ensure order is correctly calculated based on current modules
      const nextOrder = (course?.modules?.length || 0) + 1;
      const dataToSave = { ...moduleData, order: nextOrder };

      // Pass instructorId for potential use in utility (though not currently used there)
      const moduleId = await addModuleToCourse(
        course.id,
        dataToSave,
        instructorId
      );
      if (moduleId) {
        setSuccess(`Module ajouté avec succès`); // Simpler success message
        setModuleData({
          title: "",
          description: "",
          order: nextOrder + 1, // Increment default for next potential add
        });
        setShowAddModule(false);
        if (onModulesUpdated) onModulesUpdated();
      } else {
        setError("Erreur lors de l'ajout du module");
      }
    } catch (error) {
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter une question
  const handleAddQuestion = (e) => {
    e.preventDefault();

    // Vérifier que la question est valide
    if (!currentQuestion.question.trim()) {
      setError("Veuillez saisir une question");
      return;
    }

    // Vérifier que toutes les options sont remplies
    if (currentQuestion.options.some((option) => !option.trim())) {
      setError("Veuillez remplir toutes les options de réponse");
      return;
    }

    try {
      // Ajouter ou mettre à jour la question
      const updatedQuestions = [...evaluationData.questions];

      if (editingQuestionIndex >= 0) {
        // Mise à jour d'une question existante
        updatedQuestions[editingQuestionIndex] = {
          ...currentQuestion,
          id:
            updatedQuestions[editingQuestionIndex].id ||
            `q_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        };
      } else {
        // Ajout d'une nouvelle question
        updatedQuestions.push({
          ...currentQuestion,
          id: `q_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        });
      }

      // Mettre à jour l'évaluation avec la nouvelle question
      setEvaluationData({
        ...evaluationData,
        questions: updatedQuestions,
      });

      // Réinitialiser le formulaire de question
      setCurrentQuestion({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
      });

      setEditingQuestionIndex(-1);
      setShowAddQuestion(false);
      setSuccess("Question ajoutée avec succès");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(`Erreur: ${error.message}`);
    }
  };

  // Fonction pour éditer une question
  const handleEditQuestion = (index) => {
    setCurrentQuestion(evaluationData.questions[index]);
    setEditingQuestionIndex(index);
    setShowAddQuestion(true);
  };

  // Fonction pour supprimer une question
  const handleDeleteQuestion = (index) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette question ?")) {
      const updatedQuestions = [...evaluationData.questions];
      updatedQuestions.splice(index, 1);

      setEvaluationData({
        ...evaluationData,
        questions: updatedQuestions,
      });

      setSuccess("Question supprimée avec succès");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Fonction pour modifier une option de réponse
  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;

    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions,
    });
  };

  const handleAddEvaluation = async (e) => {
    e.preventDefault();
    if (!canModifyCourse() || !selectedModule) return; // Permission & module selection check

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Vérifier que l'évaluation a au moins une question si c'est un quiz
      if (
        evaluationData.type === "quiz" &&
        evaluationData.questions.length === 0
      ) {
        setError("Veuillez ajouter au moins une question à ce quiz");
        setLoading(false);
        return;
      }

      // Pass instructorId for potential use in utility
      const evalId = await addEvaluationToModule(
        course.id,
        selectedModule.id,
        evaluationData,
        instructorId
      );
      if (evalId) {
        setSuccess(`Évaluation ajoutée avec succès`);
        setEvaluationData({
          title: "",
          type: "quiz",
          description: "",
          maxScore: 100,
          questions: [],
        });
        setShowAddQuestion(false);
        setShowAddEvaluation(false);
        setSelectedModule(null);
        if (onModulesUpdated) onModulesUpdated();
      } else {
        setError("Erreur lors de l'ajout de l'évaluation");
      }
    } catch (error) {
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestModules = async () => {
    if (!canModifyCourse()) return; // Permission check

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Pass instructorId for potential use in utility
      const result = await createTestModulesForCourse(course.id, instructorId);
      if (result) {
        setSuccess("Modules de test créés avec succès");
        if (onModulesUpdated) onModulesUpdated();
      } else {
        setError("Erreur lors de la création des modules de test");
      }
    } catch (error) {
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle opening the add evaluation modal
  const openAddEvaluation = (module) => {
    if (!canModifyCourse()) return;
    setSelectedModule(module);
    setEvaluationData({
      // Reset form for new evaluation
      title: "",
      type: "quiz",
      description: "",
      maxScore: 100,
      questions: [], // Initialize with empty questions array
    });
    setError(""); // Clear errors
    setShowAddEvaluation(true);
  };

  // Calculate modules safely
  const modules = Array.isArray(course?.modules) ? course.modules : [];

  return (
    // Style adjusted for consistency
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-sm">
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            if (!canModifyCourse()) return;
            setModuleData({
              // Reset form
              title: "",
              description: "",
              order: (modules.length || 0) + 1,
            });
            setError("");
            setShowAddModule(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 inline-flex items-center gap-2 disabled:opacity-50"
          disabled={loading}
        >
          <MdAdd />
          Ajouter Module
        </button>

        <button
          onClick={handleCreateTestModules}
          className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-blue-600 inline-flex items-center gap-2 disabled:opacity-50"
          disabled={loading}
          title="Ajouter des modules pré-remplis pour tester"
        >
          {loading ? (
            <OptimizedLoadingSpinner size="small" text="" />
          ) : (
            <MdAdd />
          )}
          Créer Modules Test
        </button>
      </div>

      {/* Module List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
          Modules du Cours ({modules.length})
        </h3>
        {modules.length > 0 ? (
          modules.map((module, index) => (
            <motion.div
              key={module.id || index} // Use index as fallback key
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start gap-4">
                {/* Module Info */}
                <div className="flex-grow">
                  <h4 className="font-semibold text-gray-800">
                    {`Module ${module.order || index + 1}: ${
                      module.title || module.titre || "Sans titre"
                    }`}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {module.description || "Pas de description"}
                  </p>
                </div>
                {/* Module Actions */}
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <button
                    onClick={() => openAddEvaluation(module)}
                    className="bg-green-100 text-green-700 p-2 rounded-md hover:bg-green-200 transition-colors duration-200 text-xs inline-flex items-center gap-1 disabled:opacity-50"
                    title="Ajouter une évaluation à ce module"
                    disabled={loading}
                  >
                    <MdQuiz size={16} /> Ajouter Éval.
                  </button>
                  {/* Add Edit/Delete buttons here if needed */}
                  {/* <button className="..." title="Modifier Module"><MdEdit size={16} /></button> */}
                  {/* <button className="..." title="Supprimer Module"><MdDelete size={16} /></button> */}
                </div>
              </div>

              {/* Evaluations List */}
              {module.evaluations &&
                Object.keys(module.evaluations).length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-indigo-100 space-y-2">
                    <h5 className="text-sm font-medium text-gray-500 mb-2">
                      Évaluations
                    </h5>
                    {Object.entries(module.evaluations).map(
                      ([evalId, evaluation]) => (
                        <div
                          key={evalId}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded-md text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {evaluation.type === "quiz" ? (
                              <MdQuiz className="text-blue-600 flex-shrink-0" />
                            ) : (
                              <MdAssignment className="text-orange-600 flex-shrink-0" />
                            )}
                            <span className="truncate" title={evaluation.title}>
                              {evaluation.title || "Évaluation sans titre"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                              Score: {evaluation.score ?? "N/A"} /{" "}
                              {evaluation.maxScore || 100}
                            </span>
                            {/* Add Edit/Delete buttons here if needed */}
                            {/* <button className="..." title="Modifier Évaluation"><MdEdit size={14} /></button> */}
                            {/* <button className="..." title="Supprimer Évaluation"><MdDelete size={14} /></button> */}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-dashed">
            <p className="text-gray-500">Aucun module ajouté pour ce cours.</p>
          </div>
        )}
      </div>

      {/* --- Modals --- */}

      {/* Add Module Modal */}
      <AnimatePresence>
        {showAddModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleAddModule}>
                <div className="p-5 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Ajouter un Nouveau Module
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModule(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Error message specific to modal if needed */}
                  <div>
                    <label
                      htmlFor="moduleTitle"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Titre du Module
                    </label>
                    <input
                      type="text"
                      id="moduleTitle"
                      value={moduleData.title}
                      onChange={(e) =>
                        setModuleData({ ...moduleData, title: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="moduleDescription"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="moduleDescription"
                      rows={3}
                      value={moduleData.description}
                      onChange={(e) =>
                        setModuleData({
                          ...moduleData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="moduleOrder"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Ordre (sera recalculé)
                    </label>
                    <input
                      type="number"
                      id="moduleOrder"
                      value={moduleData.order}
                      readOnly // Order is calculated automatically now
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
                    />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModule(false)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <MdSave className="mr-2 -ml-1" />
                    {loading ? "Ajout..." : "Ajouter Module"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddQuestion && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={() => {
              setShowAddQuestion(false);
              setEditingQuestionIndex(-1);
              setCurrentQuestion({
                question: "",
                options: ["", "", "", ""],
                correctAnswer: 0,
                explanation: "",
              });
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingQuestionIndex >= 0 ? "Modifier" : "Ajouter"} une
                  question
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddQuestion(false);
                    setEditingQuestionIndex(-1);
                    setCurrentQuestion({
                      question: "",
                      options: ["", "", "", ""],
                      correctAnswer: 0,
                      explanation: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MdClose size={24} />
                </button>
              </div>

              <form onSubmit={handleAddQuestion}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="question"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Question
                    </label>
                    <input
                      type="text"
                      id="question"
                      value={currentQuestion.question}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          question: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Options de réponse
                    </label>
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="radio"
                            id={`option-${index}`}
                            name="correctAnswer"
                            checked={currentQuestion.correctAnswer === index}
                            onChange={() =>
                              setCurrentQuestion({
                                ...currentQuestion,
                                correctAnswer: index,
                              })
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(index, e.target.value)
                            }
                            placeholder={`Option ${index + 1}`}
                            required
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Sélectionnez le bouton radio à côté de la bonne réponse.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="explanation"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Explication (optionnelle)
                    </label>
                    <textarea
                      id="explanation"
                      rows={2}
                      value={currentQuestion.explanation}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          explanation: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Explication qui sera affichée après que l'étudiant ait répondu"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddQuestion(false);
                      setEditingQuestionIndex(-1);
                      setCurrentQuestion({
                        question: "",
                        options: ["", "", "", ""],
                        correctAnswer: 0,
                        explanation: "",
                      });
                    }}
                    className="bg-gray-300 text-gray-800 px-6 py-3 rounded-md flex items-center gap-2 hover:bg-gray-400 transition-colors duration-300 font-medium"
                  >
                    <MdCancel size={20} />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-secondary text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-secondary/90 transition-colors duration-300 font-medium"
                  >
                    <MdSave size={20} />
                    {editingQuestionIndex >= 0 ? "Mettre à jour" : "Ajouter"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Evaluation Modal */}
      <AnimatePresence>
        {showAddEvaluation && selectedModule && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleAddEvaluation}>
                <div className="p-5 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Ajouter Évaluation à "{selectedModule.title}"
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEvaluation(false);
                      setSelectedModule(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {/* Error message specific to modal if needed */}
                  <div>
                    <label
                      htmlFor="evalTitle"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Titre Évaluation
                    </label>
                    <input
                      type="text"
                      id="evalTitle"
                      value={evaluationData.title}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          title: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="evalType"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Type
                    </label>
                    <select
                      id="evalType"
                      value={evaluationData.type}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Devoir / Exercice</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="evalDescription"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="evalDescription"
                      rows={3}
                      value={evaluationData.description}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="evalMaxScore"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Score Maximum
                    </label>
                    <input
                      type="number"
                      id="evalMaxScore"
                      value={evaluationData.maxScore}
                      onChange={(e) =>
                        setEvaluationData({
                          ...evaluationData,
                          maxScore: parseInt(e.target.value) || 100,
                        })
                      }
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Questions section (only for quiz type) */}
                  {evaluationData.type === "quiz" && (
                    <div className="mt-6 border-t pt-4">
                      <h4 className="text-lg font-medium mb-3">Questions</h4>

                      {evaluationData.questions &&
                      evaluationData.questions.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {evaluationData.questions.map((q, index) => (
                            <div
                              key={index}
                              className="border rounded-md p-3 bg-gray-50"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{q.question}</p>
                                  <ul className="mt-1 ml-4 text-sm text-gray-600">
                                    {q.options.map((option, i) => (
                                      <li
                                        key={i}
                                        className={
                                          i === q.correctAnswer
                                            ? "text-green-600 font-medium"
                                            : ""
                                        }
                                      >
                                        {i === q.correctAnswer ? "✓ " : ""}
                                        {option}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleEditQuestion(index)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <MdEdit size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuestion(index)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                  >
                                    <MdDelete size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic mb-4">
                          Aucune question ajoutée
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowAddQuestion(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors duration-300"
                      >
                        <MdAdd />
                        Ajouter une question
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEvaluation(false);
                      setSelectedModule(null);
                    }}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <MdSave className="mr-2 -ml-1" />
                    {loading ? "Ajout..." : "Ajouter Évaluation"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModuleManager;
