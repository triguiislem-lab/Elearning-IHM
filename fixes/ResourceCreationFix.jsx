// This file contains the fixes needed for the ModuleManagerCreation.jsx file

// 1. Fix the handleAddResource function to ensure proper resource structure
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

    // Créer la nouvelle ressource avec tous les champs requis
    const newResource = {
      id: resourceId,
      title: resourceData.title.trim(),
      type: resourceData.type,
      url: resourceData.url.trim(),
      description: resourceData.description.trim() || `Ressource de type ${resourceData.type}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      moduleId: selectedModule.id, // Ensure moduleId is set
      courseId: selectedModule.courseId // Ensure courseId is set if available
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
          // Ensure resources is an array
          const moduleResources = Array.isArray(module.resources)
            ? module.resources
            : [];

          return {
            ...module,
            resources: [...moduleResources, newResource],
            updatedAt: new Date().toISOString(), // Update module timestamp
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
