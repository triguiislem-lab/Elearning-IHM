import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  PlayCircle,
  FileText,
  Download,
  ExternalLink,
  Book,
  Video,
  File,
  AlertCircle,
  Loader,
  Info,
} from "lucide-react";
import { database } from "../../../firebaseConfig";
import { ref, set, get } from "firebase/database";
import { useAuth } from "../../hooks/useAuth";

const ResourceTypes = {
  VIDEO: "video",
  DOCUMENT: "document",
  DOWNLOAD: "download",
  LINK: "link",
  ARTICLE: "article",
  EXERCISE: "exercise",
  PDF: "pdf",
};

const ModuleResources = ({
  resources,
  onResourceComplete,
  moduleId,
  courseId,
}) => {
  const { user } = useAuth();
  const [completedResources, setCompletedResources] = useState(new Set());
  const [activeResource, setActiveResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasResources = Array.isArray(resources) && resources.length > 0;

  useEffect(() => {
    if (courseId && moduleId && user) {
      loadCompletedResources();
    } else {
      setLoading(false);
    }
  }, [courseId, moduleId, user]);

  const loadCompletedResources = async () => {
    if (!user || !moduleId) {
      setLoading(false);
      return;
    }

    try {
      const progressRef = ref(
        database,
        `elearning/progress/${user.uid}/${courseId}/${moduleId}/resources`
      );
      const snapshot = await get(progressRef);

      if (snapshot.exists()) {
        const completed = new Set(Object.keys(snapshot.val()));
        setCompletedResources(completed);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la progression:", error);
      setError("Erreur lors du chargement de la progression");
    } finally {
      setLoading(false);
    }
  };

  const handleResourceView = async (resourceId) => {
    if (!user || !moduleId || !courseId) return;

    try {
      if (!completedResources.has(resourceId)) {
        const newCompleted = new Set(completedResources);
        newCompleted.add(resourceId);
        setCompletedResources(newCompleted);

        // Update progress in Firebase
        const progressRef = ref(
          database,
          `elearning/progress/${user.uid}/${courseId}/${moduleId}/resources/${resourceId}`
        );
        await set(progressRef, {
          completed: true,
          completedAt: new Date().toISOString(),
        });

        if (onResourceComplete) {
          onResourceComplete();
        }
      }

      setActiveResource((current) =>
        current === resourceId ? null : resourceId
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la progression:", error);
      setError("Erreur lors de la mise à jour de la progression");
    }
  };

  const handleResourceOpen = (resource) => {
    if (!resource || !resource.url) return;

    // Marquer la ressource comme consultée
    handleResourceView(resource.id);

    // Ouvrir l'URL dans un nouvel onglet
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  const getResourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case ResourceTypes.VIDEO:
        return <Video className="w-5 h-5 text-red-500" />;
      case ResourceTypes.DOCUMENT:
        return <FileText className="w-5 h-5 text-blue-500" />;
      case ResourceTypes.DOWNLOAD:
        return <Download className="w-5 h-5 text-green-500" />;
      case ResourceTypes.LINK:
        return <ExternalLink className="w-5 h-5 text-purple-500" />;
      case ResourceTypes.ARTICLE:
        return <Book className="w-5 h-5 text-orange-500" />;
      case ResourceTypes.EXERCISE:
        return <File className="w-5 h-5 text-yellow-500" />;
      case ResourceTypes.PDF:
        return <FileText className="w-5 h-5 text-red-600" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getResourceProgress = () => {
    if (!hasResources) return 0;
    return Math.round((completedResources.size / resources.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Chargement des ressources...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <p>{error}</p>
      </div>
    );
  }

  if (!hasResources) {
    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800">
            Aucune ressource disponible
          </h3>
          <p className="text-blue-600 text-sm mt-1">
            Le formateur n'a pas encore ajouté de ressources à ce module.
            Consultez cette section ultérieurement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Ressources du module</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {completedResources.size} / {resources.length} complétées
          </span>
          <div className="w-24 h-2 bg-gray-200 rounded-full">
            <motion.div
              className="h-2 bg-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getResourceProgress()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {resources.map((resource, index) => (
          <motion.div
            key={resource.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white p-4 rounded-lg shadow-sm border
              ${
                activeResource === resource.id
                  ? "border-blue-500"
                  : "hover:shadow-md"
              }
              transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getResourceIcon(resource.type)}
                <div>
                  <h3 className="font-medium">
                    {resource.title || "Ressource sans titre"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {resource.description ||
                      `Ressource de type ${resource.type || "document"}`}
                  </p>
                  {resource.duration && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <PlayCircle className="w-3 h-3" />
                      Durée: {resource.duration}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {completedResources.has(resource.id) && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <button
                  onClick={() => handleResourceOpen(resource)}
                  className={`px-3 py-1 text-sm rounded-full
                    ${
                      completedResources.has(resource.id)
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    } transition-colors duration-200`}
                >
                  {completedResources.has(resource.id) ? "Revoir" : "Ouvrir"}
                </button>
                <button
                  onClick={() => handleResourceView(resource.id)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  {activeResource === resource.id ? "Masquer" : "Détails"}
                </button>
              </div>
            </div>

            {activeResource === resource.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 border-t"
              >
                {resource.content ? (
                  <div className="resource-content">{resource.content}</div>
                ) : resource.url ? (
                  <div className="flex flex-col space-y-3">
                    <p className="text-sm text-gray-700">
                      {resource.description ||
                        "Cliquez sur le bouton ci-dessous pour accéder à cette ressource."}
                    </p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-fit"
                      onClick={() => handleResourceView(resource.id)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Accéder à la ressource
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Aucun contenu détaillé disponible pour cette ressource.
                  </p>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ModuleResources;
