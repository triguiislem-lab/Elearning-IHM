// This file contains the fixes needed for the evaluation creation in ModuleManagerCreation.jsx

// 1. Fix the handleAddEvaluation function to ensure proper evaluation structure
const handleAddEvaluation = (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setSuccess("");

  try {
    if (!selectedModule) {
      throw new Error("Veuillez sélectionner un module");
    }

    // Validation des champs d'évaluation
    if (!evaluationData.title.trim()) {
      throw new Error("Le titre de l'évaluation est requis");
    }

    if (!evaluationData.type) {
      throw new Error("Le type d'évaluation est requis");
    }

    // Validation spécifique pour les quiz
    if (
      evaluationData.type === "quiz" &&
      (!evaluationData.questions || evaluationData.questions.length === 0)
    ) {
      throw new Error("Veuillez ajouter au moins une question à ce quiz");
    }

    // Vérifier si une évaluation avec le même titre existe déjà dans ce module
    const evaluationExists = selectedModule.evaluations
      ? Object.values(selectedModule.evaluations).some(
          (eval) =>
            eval.title.toLowerCase() === evaluationData.title.toLowerCase()
        )
      : false;

    if (evaluationExists) {
      throw new Error(
        "Une évaluation avec ce titre existe déjà dans ce module"
      );
    }

    // Générer un ID unique pour l'évaluation
    const evalId = `eval_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2)}`;

    // Créer la nouvelle évaluation avec tous les champs requis
    const newEvaluation = {
      id: evalId,
      title: evaluationData.title.trim(),
      type: evaluationData.type,
      description: evaluationData.description.trim() || `Évaluation de type ${evaluationData.type}`,
      maxScore: parseInt(evaluationData.maxScore, 10) || 100,
      score: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      date: new Date().toISOString(),
      moduleId: selectedModule.id, // Ensure moduleId is set
      questions: evaluationData.questions || []
    };

    // Mise à jour du module avec la nouvelle évaluation
    setModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === selectedModule.id) {
          // Ensure evaluations is an object
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

    setShowAddQuestion(false);
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

// 2. Fix the handleAddQuestion function to ensure proper question structure
const handleAddQuestion = (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    // Validation des champs de question
    if (!currentQuestion.question.trim()) {
      throw new Error("La question est requise");
    }

    // Vérifier que toutes les options ont une valeur
    const emptyOptionIndex = currentQuestion.options.findIndex(
      (option) => !option.trim()
    );
    if (emptyOptionIndex !== -1) {
      throw new Error(`L'option ${emptyOptionIndex + 1} est vide`);
    }

    // S'assurer que evaluationData.questions existe
    if (!evaluationData.questions) {
      evaluationData.questions = [];
    }

    // Ajouter ou mettre à jour la question
    const updatedQuestions = [...evaluationData.questions];

    // Create a properly structured question
    const questionToAdd = {
      ...currentQuestion,
      id: editingQuestionIndex >= 0 && updatedQuestions[editingQuestionIndex]?.id
        ? updatedQuestions[editingQuestionIndex].id
        : `q_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      // Ensure all required fields are present
      question: currentQuestion.question.trim(),
      options: currentQuestion.options.map(opt => opt.trim()),
      correctAnswer: parseInt(currentQuestion.correctAnswer, 10) || 0,
      explanation: currentQuestion.explanation.trim() || ""
    };

    if (editingQuestionIndex >= 0) {
      // Mise à jour d'une question existante
      updatedQuestions[editingQuestionIndex] = questionToAdd;
    } else {
      // Ajout d'une nouvelle question
      updatedQuestions.push(questionToAdd);
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
    setShowAddQuestion(false);
    setSuccess(
      editingQuestionIndex >= 0
        ? "Question mise à jour avec succès"
        : "Question ajoutée avec succès"
    );

    // Effacer le message de succès après 3 secondes
    setTimeout(() => setSuccess(""), 3000);
  } catch (error) {
    console.error("Erreur lors de l'ajout de la question:", error);
    setError(`Erreur: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
