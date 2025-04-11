import React, { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { MdFileDownload, MdOpenInNew, MdError } from "react-icons/md";

const SimpleModuleResource = ({ resource }) => {
  const [resourceError, setResourceError] = useState(false);

  useEffect(() => {
    // Reset error state when resource changes
    setResourceError(false);
  }, [resource]);
  // Fonction pour déterminer le type de ressource
  const getResourceType = (url) => {
    if (!url) return "unknown";

    if (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com") ||
      url.endsWith(".mp4") ||
      url.endsWith(".webm") ||
      url.endsWith(".ogg")
    ) {
      return "video";
    }

    if (url.endsWith(".pdf")) {
      return "pdf";
    }

    if (
      url.endsWith(".jpg") ||
      url.endsWith(".jpeg") ||
      url.endsWith(".png") ||
      url.endsWith(".gif") ||
      url.endsWith(".webp")
    ) {
      return "image";
    }

    return "link";
  };

  // Rendu en fonction du type de ressource
  const renderResource = () => {
    if (!resource) {
      return (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <p className="text-gray-500">Aucune ressource disponible</p>
        </div>
      );
    }

    if (!resource.url) {
      return (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <MdError className="text-yellow-500" size={32} />
            <p className="text-gray-700">URL de ressource manquante</p>
            <p className="text-gray-500 text-sm">
              La ressource "{resource.title || "Sans titre"}" n'a pas d'URL
              valide.
            </p>
          </div>
        </div>
      );
    }

    if (resourceError) {
      return (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <MdError className="text-red-500" size={32} />
            <p className="text-gray-700">Erreur de chargement</p>
            <p className="text-gray-500 text-sm">
              Impossible de charger la ressource. Veuillez réessayer plus tard.
            </p>
          </div>
        </div>
      );
    }

    const resourceType = getResourceType(resource.url);

    switch (resourceType) {
      case "video":
        return (
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
            <ReactPlayer
              url={resource.url}
              controls
              width="100%"
              height="100%"
              config={{
                youtube: {
                  playerVars: { showinfo: 1 },
                },
              }}
              onError={(e) => {
                console.error("Video playback error:", e);
                setResourceError(true);
              }}
            />
          </div>
        );

      case "pdf":
        return (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-700 mb-4">
              Cliquez sur le bouton ci-dessous pour ouvrir le document PDF.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary text-white px-4 py-2 rounded-md inline-flex items-center justify-center gap-2 hover:bg-secondary/90"
              >
                <MdOpenInNew />
                Ouvrir le PDF
              </a>
              <a
                href={resource.url}
                download
                className="bg-blue-600 text-white px-4 py-2 rounded-md inline-flex items-center justify-center gap-2 hover:bg-blue-700"
              >
                <MdFileDownload />
                Télécharger le PDF
              </a>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="bg-gray-100 p-4 rounded-lg">
            <img
              src={resource.url}
              alt={resource.title || "Image du cours"}
              className="max-w-full h-auto rounded-lg mx-auto"
              onError={(e) => {
                console.error("Image load error:", e);
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/800x600?text=Image+non+disponible";
                // Don't set resourceError here as we're providing a fallback image
              }}
            />
          </div>
        );

      case "link":
        return (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-700 mb-4">
              Cette ressource est disponible via un lien externe.
            </p>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90"
            >
              Accéder à la ressource
            </a>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-500">
              Type de ressource non pris en charge
            </p>
          </div>
        );
    }
  };

  return (
    <div className="module-resource mb-8">
      {resource?.title && (
        <h3 className="text-xl font-semibold mb-4">{resource.title}</h3>
      )}
      {resource?.description && (
        <p className="text-gray-600 mb-4">{resource.description}</p>
      )}
      {renderResource()}
    </div>
  );
};

export default SimpleModuleResource;
