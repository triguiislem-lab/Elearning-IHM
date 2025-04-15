import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";
import {
  MdAdd,
  MdSave,
  MdCancel,
  MdDelete,
  MdEdit,
  MdQuiz,
  MdAssignment,
  MdDragIndicator,
  MdPlayCircle,
  MdPictureAsPdf,
  MdLink,
  MdAttachFile,
  MdUpload,
  MdClose,
} from "react-icons/md";
import {
  generateModuleId,
  standardizeModule,
  saveModuleToAllPaths,
} from "../../utils/moduleStandardization";

const ModuleManagerCreation = ({ modules, setModules, courseId }) => {
  // Debug log to see what courseId is being passed
  console.log("ModuleManagerCreation received courseId:", courseId);
  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddEvaluation, setShowAddEvaluation] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // États pour le formulaire d'ajout de module
  const [moduleData, setModuleData] = useState({
    title: "",
    description: "",
    order: modules.length + 1,
  });

  // États pour le formulaire d'ajout d'évaluation
  const [evaluationData, setEvaluationData] = useState({
    title: "",
    type: "quiz",
    description: "",
    maxScore: 100,
    score: 0,
    questions: [],
  });

  // États pour la gestion des questions
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);

  // États pour le formulaire d'ajout de ressource
  const [resourceData, setResourceData] = useState({
    title: "",
    type: "video",
    url: "",
    description: "",
    file: null,
  });

  const fileInputRef = useRef(null);

  const [showEvaluationDetails, setShowEvaluationDetails] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [selectedModuleForEdit, setSelectedModuleForEdit] = useState(null);

  const handleAddModule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Début de la création du module avec courseId:", courseId);

      // Vérifier si le titre est vide
      if (!moduleData.title.trim()) {
        throw new Error("Le titre du module est requis");
      }

      // Vérifier si un module avec le même titre existe déjà
      const moduleExists = modules.some(
        (module) =>
          module.title.toLowerCase() === moduleData.title.toLowerCase()
      );

      if (moduleExists) {
        throw new Error("Un module avec ce titre existe déjà");
      }

      // Générer un ID unique pour le module
      const moduleId = generateModuleId();
      console.log("ID du module généré:", moduleId);

      // Créer le nouveau module avec des données standardisées
      const moduleToCreate = {
        id: moduleId,
        courseId: courseId, // Ensure courseId is set
        title: moduleData.title.trim(),
        description: moduleData.description.trim(),
        order: moduleData.order || modules.length + 1,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evaluations: {},
        resources: [],
      };

      console.log("Module à créer:", moduleToCreate);

      // Standardize the module
      const standardizedModule = standardizeModule(moduleToCreate, courseId);
      console.log("Module standardisé:", standardizedModule);

      // Vérifier si le module existe déjà dans la liste (par ID)
      const moduleAlreadyExists = modules.some(
        (module) => module.id === moduleId
      );

      if (moduleAlreadyExists) {
        throw new Error("Ce module existe déjà dans la liste");
      }

      // If courseId is available, save the module to the database
      if (courseId) {
        console.log(
          "Sauvegarde du module dans la base de données avec courseId:",
          courseId
        );
        try {
          // Save the module to all paths in the database
          await saveModuleToAllPaths(standardizedModule, courseId);
          console.log(
            `Module ${moduleId} saved to all paths for course ${courseId}`
          );
        } catch (saveError) {
          console.error("Error saving module to database:", saveError);
          // Continue even if save fails - we'll still add it to the local state
        }
      } else {
        console.warn(
          "Impossible de sauvegarder le module dans la base de données: courseId manquant"
        );
      }

      // Ajouter le module à la liste locale
      setModules((prevModules) => {
        // Vérifier si le module existe déjà par titre
        const exists = prevModules.some(
          (module) =>
            module.title.toLowerCase() ===
            standardizedModule.title.toLowerCase()
        );
        if (exists) {
          throw new Error("Un module avec ce titre existe déjà");
        }
        console.log("Ajout du module à la liste locale");
        return [...prevModules, standardizedModule];
      });

      // Réinitialiser le formulaire
      setModuleData({
        title: "",
        description: "",
        order: modules.length + 2,
      });

      setShowAddModule(false);
      setSuccess("Module ajouté avec succès");

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error adding module:", error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    // Debug log

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
      // S'assurer que evaluationData.questions existe
      if (!evaluationData.questions) {
        evaluationData.questions = [];
      }

      // Ajouter ou mettre à jour la question
      const updatedQuestions = [...evaluationData.questions];

      if (editingQuestionIndex >= 0) {
        // Mise à jour d'une question existante
        updatedQuestions[editingQuestionIndex] = {
          ...currentQuestion,
          id:
            updatedQuestions[editingQuestionIndex]?.id ||
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

      // Si nous sommes en train d'éditer une question depuis le popup d'évaluation
      if (selectedModuleForEdit && selectedEvaluation) {
        // Mettre à jour le module avec la nouvelle liste de questions
        setModules((prevModules) =>
          prevModules.map((module) => {
            if (module.id === selectedModuleForEdit.id) {
              return {
                ...module,
                evaluations: {
                  ...module.evaluations,
                  [selectedEvaluation.id]: {
                    ...selectedEvaluation,
                    questions: updatedQuestions,
                  },
                },
              };
            }
            return module;
          })
        );
      }

      // Réinitialiser le formulaire de question
      setCurrentQuestion({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
      });

      setEditingQuestionIndex(-1);

      // Fermer explicitement le popup
      // Debug log
      setShowAddQuestion(false);

      setSuccess("Question ajoutée avec succès");

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError(`Erreur: ${error.message}`);
    }
  };

  const handleEditQuestion = (index) => {
    setCurrentQuestion(evaluationData.questions[index]);
    setEditingQuestionIndex(index);
    setShowAddQuestion(true);
  };

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

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;

    setCurrentQuestion({
      ...currentQuestion,
      options: updatedOptions,
    });
  };

  const handleAddEvaluation = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!selectedModule) {
        throw new Error("Veuillez sélectionner un module");
      }

      // Validation des champs de l'évaluation
      if (!evaluationData.title.trim()) {
        throw new Error("Le titre de l'évaluation est requis");
      }

      if (!evaluationData.type) {
        throw new Error("Le type d'évaluation est requis");
      }

      if (
        evaluationData.type === "quiz" &&
        (!evaluationData.questions || evaluationData.questions.length === 0)
      ) {
        throw new Error("Vous devez ajouter au moins une question à ce quiz");
      }

      // Vérifier si une évaluation avec le même titre existe déjà dans ce module
      const evaluationExists = Object.values(
        selectedModule.evaluations || {}
      ).some(
        (evaluation) =>
          evaluation.title.toLowerCase() === evaluationData.title.toLowerCase()
      );

      if (evaluationExists) {
        throw new Error(
          "Une évaluation avec ce titre existe déjà dans ce module"
        );
      }

      // Générer un ID unique pour l'évaluation
      const evalId = `eval_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}`;

      // Créer la nouvelle évaluation
      const newEvaluation = {
        id: evalId,
        title: evaluationData.title.trim(),
        type: evaluationData.type,
        description: evaluationData.description.trim(),
        maxScore: parseInt(evaluationData.maxScore, 10) || 100,
        score: 0,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: evaluationData.questions || [],
      };

      // Mise à jour du module avec la nouvelle évaluation
      setModules((prevModules) =>
        prevModules.map((module) => {
          if (module.id === selectedModule.id) {
            // S'assurer que evaluations est un objet
            const moduleEvaluations = module.evaluations || {};

            return {
              ...module,
              evaluations: {
                ...moduleEvaluations,
                [evalId]: newEvaluation,
              },
              updatedAt: new Date().toISOString(),
            };
          }
          return module;
        })
      );

      // Réinitialiser le formulaire
      setEvaluationData({
        title: "",
        type: "quiz",
        description: "",
        maxScore: 100,
        score: 0,
        questions: [],
      });

      setCurrentQuestion({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        explanation: "",
      });

      setShowAddEvaluation(false);
      setSuccess("Évaluation ajoutée avec succès");

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'évaluation:", error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setResourceData({
          ...resourceData,
          file,
          type: "pdf",
          title: file.name,
        });
      } else {
        setError("Seuls les fichiers PDF sont acceptés");
      }
    }
  };

  const handleAddResource = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!selectedModule) {
        throw new Error("Veuillez sélectionner un module");
      }

      // Validation des champs de ressource
      if (!resourceData.title.trim()) {
        throw new Error("Le titre de la ressource est requis");
      }

      if (!resourceData.type) {
        throw new Error("Le type de ressource est requis");
      }

      // Validation spécifique selon le type de ressource
      if (resourceData.type === "link" || resourceData.type === "video") {
        if (!resourceData.url.trim()) {
          throw new Error(
            `L'URL de la ${
              resourceData.type === "video" ? "vidéo" : "ressource"
            } est requise`
          );
        }

        // Validation basique du format URL
        try {
          new URL(resourceData.url);
        } catch (e) {
          throw new Error("L'URL fournie n'est pas valide");
        }
      }

      // Validation pour les fichiers PDF
      if (
        resourceData.type === "pdf" &&
        !resourceData.file &&
        !resourceData.url.trim()
      ) {
        throw new Error(
          "Veuillez sélectionner un fichier PDF ou fournir une URL"
        );
      }

      // Générer un ID unique pour la ressource
      const resourceId = `resource_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}`;

      // Créer la nouvelle ressource
      const newResource = {
        id: resourceId,
        title: resourceData.title.trim(),
        type: resourceData.type,
        url: resourceData.url.trim(),
        description: resourceData.description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Si c'est un fichier, ajouter les métadonnées du fichier
      if (resourceData.file) {
        newResource.fileName = resourceData.file.name;
        newResource.fileSize = resourceData.file.size;
        newResource.fileType = resourceData.file.type;

        // TODO: Implémenter le chargement du fichier vers un stockage (Firebase Storage)
        // Pour l'instant, nous utilisons juste l'URL ou un placeholder
        if (!newResource.url) {
          newResource.url = "#"; // Placeholder URL
        }
      }

      // Ajouter la ressource au module
      setModules((prevModules) =>
        prevModules.map((module) => {
          if (module.id === selectedModule.id) {
            // S'assurer que le tableau resources existe
            const moduleResources = Array.isArray(module.resources)
              ? module.resources
              : [];

            return {
              ...module,
              resources: [...moduleResources, newResource],
              updatedAt: new Date().toISOString(), // Mettre à jour le timestamp du module
            };
          }
          return module;
        })
      );

      // Réinitialiser le formulaire
      setResourceData({
        title: "",
        type: "video",
        url: "",
        description: "",
        file: null,
      });

      // Réinitialiser le champ de fichier si nécessaire
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setShowAddResource(false);
      setSuccess("Ressource ajoutée avec succès");

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la ressource:", error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModule = (moduleId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) {
      try {
        // Filtrer les modules pour supprimer celui avec l'ID spécifié
        const updatedModules = modules.filter(
          (module) => module.id !== moduleId
        );

        // Vérifier si le module a été supprimé
        if (updatedModules.length === modules.length) {
          throw new Error("Module non trouvé ou déjà supprimé");
        }

        // Réorganiser les ordres des modules restants
        const reorderedModules = updatedModules.map((module, index) => ({
          ...module,
          order: index + 1,
        }));

        // Mettre à jour l'état des modules
        setModules(reorderedModules);

        // Réinitialiser le module sélectionné si c'était celui qui vient d'être supprimé
        if (selectedModule && selectedModule.id === moduleId) {
          setSelectedModule(null);
        }

        setSuccess("Module supprimé avec succès");

        // Effacer le message de succès après 3 secondes
        setTimeout(() => setSuccess(""), 3000);
      } catch (error) {
        setError(`Erreur lors de la suppression du module: ${error.message}`);
      }
    }
  };

  const handleDeleteEvaluation = (moduleId, evalId) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette évaluation ?")
    ) {
      const updatedModules = modules.map((module) => {
        if (module.id === moduleId) {
          const { [evalId]: deletedEval, ...remainingEvals } =
            module.evaluations;
          return {
            ...module,
            evaluations: remainingEvals,
          };
        }
        return module;
      });

      setModules(updatedModules);
      setSuccess("Évaluation supprimée avec succès");

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleDeleteResource = (moduleId, resourceId) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette ressource ?")
    ) {
      const updatedModules = modules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            resources: (module.resources || []).filter(
              (resource) => resource.id !== resourceId
            ),
          };
        }
        return module;
      });

      setModules(updatedModules);
      setSuccess("Ressource supprimée avec succès");

      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleMoveModule = (moduleId, direction) => {
    const moduleIndex = modules.findIndex((module) => module.id === moduleId);
    if (moduleIndex === -1) return;

    const newModules = [...modules];

    if (direction === "up" && moduleIndex > 0) {
      // Échanger avec le module précédent
      [newModules[moduleIndex], newModules[moduleIndex - 1]] = [
        newModules[moduleIndex - 1],
        newModules[moduleIndex],
      ];
    } else if (direction === "down" && moduleIndex < modules.length - 1) {
      // Échanger avec le module suivant
      [newModules[moduleIndex], newModules[moduleIndex + 1]] = [
        newModules[moduleIndex + 1],
        newModules[moduleIndex],
      ];
    }

    // Mettre à jour les ordres
    const reorderedModules = newModules.map((module, index) => ({
      ...module,
      order: index + 1,
    }));

    setModules(reorderedModules);
  };

  const handleShowEvaluationDetails = (evaluation, module) => {
    setSelectedEvaluation(evaluation);
    setSelectedModuleForEdit(module);
    setShowEvaluationDetails(true);
  };

  const handleEditQuestionFromPopup = (questionIndex) => {
    if (
      selectedModuleForEdit &&
      selectedEvaluation &&
      selectedEvaluation.questions &&
      selectedEvaluation.questions[questionIndex]
    ) {
      // Copier la question sélectionnée dans le formulaire
      const questionToEdit = selectedEvaluation.questions[questionIndex];
      setCurrentQuestion({
        question: questionToEdit.question || "",
        options: [...(questionToEdit.options || ["", "", "", ""])],
        correctAnswer: questionToEdit.correctAnswer || 0,
        explanation: questionToEdit.explanation || "",
      });

      // Définir l'index de la question en cours d'édition
      setEditingQuestionIndex(questionIndex);

      // Ouvrir le formulaire d'édition
      setShowAddQuestion(true);

      // Fermer le popup d'évaluation
      setShowEvaluationDetails(false);

      // Définir le module sélectionné pour que la mise à jour fonctionne correctement
      setSelectedModule(selectedModuleForEdit);
    } else {
      setError("Impossible d'éditer cette question. Données manquantes.");
    }
  };

  const handleDeleteQuestionFromPopup = (questionIndex) => {
    if (
      selectedModuleForEdit &&
      selectedEvaluation &&
      selectedEvaluation.questions &&
      selectedEvaluation.questions[questionIndex]
    ) {
      if (
        window.confirm("Êtes-vous sûr de vouloir supprimer cette question ?")
      ) {
        const updatedQuestions = [...selectedEvaluation.questions];
        updatedQuestions.splice(questionIndex, 1);

        // Mettre à jour le module avec la nouvelle liste de questions
        setModules((prevModules) =>
          prevModules.map((module) => {
            if (module.id === selectedModuleForEdit.id) {
              return {
                ...module,
                evaluations: {
                  ...module.evaluations,
                  [selectedEvaluation.id]: {
                    ...selectedEvaluation,
                    questions: updatedQuestions,
                  },
                },
              };
            }
            return module;
          })
        );

        setSuccess("Question supprimée avec succès");
        setTimeout(() => setSuccess(""), 3000);
      }
    } else {
      setError("Impossible de supprimer cette question. Données manquantes.");
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Modules et évaluations</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowAddModule(true)}
          className="bg-secondary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-secondary/90 transition-colors duration-300"
          disabled={loading}
        >
          <MdAdd />
          Ajouter un module
        </button>
      </div>

      {/* Liste des modules existants */}
      {modules.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Modules du cours</h3>
          {modules.map((module) => (
            <div
              key={module.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center mt-1">
                    <button
                      onClick={() => handleMoveModule(module.id, "up")}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      disabled={module.order === 1}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <span className="text-xs font-medium my-1">
                      {module.order}
                    </span>
                    <button
                      onClick={() => handleMoveModule(module.id, "down")}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      disabled={module.order === modules.length}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {module.title || "Module sans titre"}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {module.description || "Aucune description"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedModule(module);
                      setShowAddResource(true);
                    }}
                    className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors duration-300"
                    title="Ajouter une ressource"
                  >
                    <MdAttachFile size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedModule(module);
                      setShowAddEvaluation(true);
                    }}
                    className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors duration-300"
                    title="Ajouter une évaluation"
                  >
                    <MdQuiz size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition-colors duration-300"
                    title="Supprimer le module"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              </div>

              {/* Liste des ressources du module */}
              {module.resources && module.resources.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-blue-200">
                  <h5 className="text-sm font-medium mb-2">Ressources</h5>
                  <div className="space-y-2">
                    {module.resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex justify-between items-center p-2 bg-blue-50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {resource.type === "video" ? (
                            <MdPlayCircle className="text-red-600" />
                          ) : resource.type === "pdf" ? (
                            <MdPictureAsPdf className="text-blue-600" />
                          ) : (
                            <MdLink className="text-green-600" />
                          )}
                          <span>{resource.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Voir
                          </a>
                          <button
                            onClick={() =>
                              handleDeleteResource(module.id, resource.id)
                            }
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer la ressource"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste des évaluations du module */}
              {module.evaluations &&
                Object.keys(module.evaluations).length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                    <h5 className="text-sm font-medium mb-2">Évaluations</h5>
                    <div className="space-y-2">
                      {Object.entries(module.evaluations).map(
                        ([evalId, evaluation]) => (
                          <div
                            key={evalId}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                            onClick={() =>
                              handleShowEvaluationDetails(evaluation, module)
                            }
                          >
                            <div className="flex items-center gap-2">
                              {evaluation.type === "quiz" ? (
                                <MdQuiz className="text-blue-600" />
                              ) : (
                                <MdAssignment className="text-orange-600" />
                              )}
                              <span>{evaluation.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Score: {evaluation.score || 0}/
                                {evaluation.maxScore || 100}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvaluation(module.id, evalId);
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="Supprimer l'évaluation"
                              >
                                <MdDelete size={16} />
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            Aucun module n'a été ajouté à ce cours.
          </p>
          <p className="text-sm text-gray-500">
            Utilisez le bouton ci-dessus pour ajouter des modules.
          </p>
        </div>
      )}

      {/* Modal pour ajouter un module */}
      {showAddModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold mb-4">Ajouter un module</h3>
            <form onSubmit={handleAddModule}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={moduleData.title}
                  onChange={(e) =>
                    setModuleData({ ...moduleData, title: e.target.value })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Titre du module"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={moduleData.description}
                  onChange={(e) =>
                    setModuleData({
                      ...moduleData,
                      description: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Description du module"
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Ordre
                </label>
                <input
                  type="number"
                  value={moduleData.order}
                  onChange={(e) =>
                    setModuleData({
                      ...moduleData,
                      order: parseInt(e.target.value),
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModule(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-400 transition-colors duration-300"
                >
                  <MdCancel />
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-secondary text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-secondary/90 transition-colors duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <OptimizedLoadingSpinner size="small" text="" />
                  ) : (
                    <MdSave />
                  )}
                  Enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal pour ajouter une évaluation */}
      {showAddEvaluation && selectedModule && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-10"
          onClick={(e) => {
            // Fermer le popup uniquement si l'utilisateur clique sur l'arrière-plan (pas sur le contenu)
            if (e.target === e.currentTarget) {
              setShowAddEvaluation(false);
              setSelectedModule(null);
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative my-auto"
            onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic vers l'arrière-plan
          >
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
              <h3 className="text-xl font-bold">
                Ajouter une évaluation au module "
                {selectedModule.title || "Module"}"
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddEvaluation(false);
                  setSelectedModule(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                aria-label="Fermer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddEvaluation}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={evaluationData.title}
                  onChange={(e) =>
                    setEvaluationData({
                      ...evaluationData,
                      title: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Titre de l'évaluation"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Type
                </label>
                <select
                  value={evaluationData.type}
                  onChange={(e) =>
                    setEvaluationData({
                      ...evaluationData,
                      type: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Devoir</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={evaluationData.description}
                  onChange={(e) =>
                    setEvaluationData({
                      ...evaluationData,
                      description: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Description de l'évaluation"
                  rows="3"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Score maximum
                </label>
                <input
                  type="number"
                  value={evaluationData.maxScore}
                  onChange={(e) =>
                    setEvaluationData({
                      ...evaluationData,
                      maxScore: parseInt(e.target.value),
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Score obtenu
                </label>
                <input
                  type="number"
                  value={evaluationData.score}
                  onChange={(e) =>
                    setEvaluationData({
                      ...evaluationData,
                      score: parseInt(e.target.value),
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="0"
                  max={evaluationData.maxScore}
                  required
                />
              </div>
              {evaluationData.type === "quiz" && (
                <div className="mb-6 border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-lg font-semibold mb-3">
                    Questions du quiz
                  </h4>

                  {evaluationData.questions.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {evaluationData.questions.map((question, index) => (
                        <div
                          key={question.id || index}
                          className="border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{question.question}</p>
                              <ul className="mt-2 space-y-1 pl-4">
                                {question.options.map((option, optIndex) => (
                                  <li
                                    key={optIndex}
                                    className={
                                      optIndex === question.correctAnswer
                                        ? "text-green-600 font-medium"
                                        : ""
                                    }
                                  >
                                    {option}{" "}
                                    {optIndex === question.correctAnswer &&
                                      "(Réponse correcte)"}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditQuestion(index)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Modifier la question"
                              >
                                <MdEdit size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(index)}
                                className="text-red-600 hover:text-red-800"
                                title="Supprimer la question"
                              >
                                <MdDelete size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-4">
                      Aucune question ajoutée. Utilisez le bouton ci-dessous
                      pour ajouter des questions.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAddQuestion(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition-colors duration-300 mb-4"
                  >
                    <MdAdd />
                    Ajouter une question
                  </button>
                </div>
              )}

              <div className="mt-6 pt-4 border-t sticky bottom-0 bg-white">
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEvaluation(false);
                      setSelectedModule(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 underline"
                  >
                    Fermer sans enregistrer
                  </button>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddEvaluation(false);
                        setSelectedModule(null);
                      }}
                      className="bg-gray-300 text-gray-800 px-6 py-3 rounded-md flex items-center gap-2 hover:bg-gray-400 transition-colors duration-300 font-medium"
                    >
                      <MdCancel size={20} />
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="bg-secondary text-white px-6 py-3 rounded-md flex items-center gap-2 hover:bg-secondary/90 transition-colors duration-300 font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <MdSave size={20} />
                      )}
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal pour ajouter une question */}
      {showAddQuestion && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Fermer le popup uniquement si l'utilisateur clique sur l'arrière-plan (pas sur le contenu)
            if (e.target === e.currentTarget) {
              // Debug log
              setShowAddQuestion(false);
              setEditingQuestionIndex(-1);
              setCurrentQuestion({
                question: "",
                options: ["", "", "", ""],
                correctAnswer: 0,
                explanation: "",
              });
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic vers l'arrière-plan
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
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                aria-label="Fermer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddQuestion}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Question
                </label>
                <input
                  type="text"
                  value={currentQuestion.question}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      question: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Saisissez votre question"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Options de réponse
                </label>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, e.target.value)
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    <div className="ml-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={currentQuestion.correctAnswer === index}
                        onChange={() =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: index,
                          })
                        }
                        className="mr-1"
                      />
                      <label className="text-sm">Correcte</label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Explication (optionnelle)
                </label>
                <textarea
                  value={currentQuestion.explanation}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      explanation: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Explication de la réponse correcte"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
                <button
                  type="button"
                  onClick={() => {
                    // Debug log
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

              {/* Bouton de fermeture supplémentaire */}
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    // Debug log
                    setShowAddQuestion(false);
                    setEditingQuestionIndex(-1);
                    setCurrentQuestion({
                      question: "",
                      options: ["", "", "", ""],
                      correctAnswer: 0,
                      explanation: "",
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700 underline"
                >
                  Fermer sans enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Formulaire d'ajout de ressource */}
      {showAddResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              Ajouter une ressource
            </h3>
            <form onSubmit={handleAddResource}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de ressource
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={resourceData.type}
                  onChange={(e) => {
                    setResourceData({
                      ...resourceData,
                      type: e.target.value,
                      file: null,
                      url: "",
                    });
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  <option value="video">Vidéo YouTube</option>
                  <option value="pdf">PDF</option>
                  <option value="link">Lien externe</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={resourceData.title}
                  onChange={(e) =>
                    setResourceData({ ...resourceData, title: e.target.value })
                  }
                  placeholder="Titre de la ressource"
                />
              </div>

              {resourceData.type === "pdf" ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fichier PDF
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <MdUpload className="mr-2" />
                      Choisir un fichier
                    </button>
                    {resourceData.file && (
                      <span className="text-sm text-gray-600">
                        {resourceData.file.name}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={resourceData.url}
                    onChange={(e) =>
                      setResourceData({ ...resourceData, url: e.target.value })
                    }
                    placeholder={
                      resourceData.type === "video"
                        ? "URL YouTube"
                        : "URL de la ressource"
                    }
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={resourceData.description}
                  onChange={(e) =>
                    setResourceData({
                      ...resourceData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description de la ressource"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddResource(false);
                    setResourceData({
                      title: "",
                      type: "video",
                      url: "",
                      description: "",
                    });
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? (
                    <OptimizedLoadingSpinner size="small" />
                  ) : (
                    "Ajouter"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup pour afficher les détails de l'évaluation */}
      {showEvaluationDetails && selectedEvaluation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedEvaluation.title}</h3>
              <button
                onClick={() => setShowEvaluationDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">
                  {selectedEvaluation.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm">
                    {selectedEvaluation.type === "quiz" ? "Quiz" : "Devoir"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-medium">Score:</span>
                  <span className="text-sm">
                    {selectedEvaluation.score || 0} /{" "}
                    {selectedEvaluation.maxScore || 100}
                  </span>
                </div>
              </div>

              {selectedEvaluation.questions &&
                selectedEvaluation.questions.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-lg">Questions</h4>
                      <button
                        onClick={() => {
                          setShowEvaluationDetails(false);
                          setSelectedModule(selectedModuleForEdit);
                          setShowAddQuestion(true);
                          setCurrentQuestion({
                            question: "",
                            options: ["", "", "", ""],
                            correctAnswer: 0,
                            explanation: "",
                          });
                        }}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        <MdAdd size={20} />
                        Ajouter une question
                      </button>
                    </div>
                    {selectedEvaluation.questions.map((question, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">
                            {index + 1}. {question.question}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditQuestionFromPopup(index)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Modifier la question"
                            >
                              <MdEdit size={20} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteQuestionFromPopup(index)
                              }
                              className="text-red-600 hover:text-red-800"
                              title="Supprimer la question"
                            >
                              <MdDelete size={20} />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`p-2 rounded ${
                                optIndex === question.correctAnswer
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-6 h-6 flex items-center justify-center rounded-full ${
                                    optIndex === question.correctAnswer
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-200"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span
                                  className={
                                    optIndex === question.correctAnswer
                                      ? "text-green-700 font-medium"
                                      : ""
                                  }
                                >
                                  {option}
                                </span>
                                {optIndex === question.correctAnswer && (
                                  <span className="ml-2 text-green-600 text-sm">
                                    (Réponse correcte)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <span className="font-medium">Explication:</span>{" "}
                              {question.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowEvaluationDetails(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ModuleManagerCreation;
