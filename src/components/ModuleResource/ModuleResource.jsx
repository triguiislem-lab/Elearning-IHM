import React, { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { Document, Page, pdfjs } from "react-pdf";
import { MdArrowBack, MdArrowForward, MdFileDownload } from "react-icons/md";
import OptimizedLoadingSpinner from "../Common/OptimizedLoadingSpinner";

// Configuration pour react-pdf sera faite dans useEffect

const ModuleResource = ({ resource }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  // Configuration de pdfjs
  useEffect(() => {
    // Configuration pour react-pdf
    if (typeof window !== "undefined" && !pdfReady) {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      setPdfReady(true);
    }
  }, [pdfReady]);

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

  // Fonctions pour la navigation dans le PDF
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfError(false);
  };

  const onDocumentLoadError = (error) => {
    
    setPdfError(true);
  };

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(newPageNumber, numPages || 1));
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  // Rendu en fonction du type de ressource
  const renderResource = () => {
    if (!resource || !resource.url) {
      return (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <p className="text-gray-500">Aucune ressource disponible</p>
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
              onError={(e) => 

      case "pdf":
        return (
          <div className="bg-gray-100 p-4 rounded-lg">
            {pdfError ? (
              <div className="text-center p-8">
                <p className="text-red-500 mb-4">
                  Impossible de charger le PDF. Essayez de le télécharger
                  directement.
                </p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary text-white px-4 py-2 rounded-md inline-flex items-center gap-2 hover:bg-secondary/90"
                >
                  <MdFileDownload />
                  Télécharger le PDF
                </a>
              </div>
            ) : !pdfReady ? (
              <div className="flex justify-center p-8">
                <OptimizedLoadingSpinner size="medium" text="Chargement du lecteur PDF..." />
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <Document
                    file={resource.url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex justify-center p-8">
                        <OptimizedLoadingSpinner size="medium" text="Chargement du document..." />
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={Math.min(800, window.innerWidth - 40)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>

                {numPages && (
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={previousPage}
                      disabled={pageNumber <= 1}
                      className={`flex items-center gap-1 px-3 py-1 rounded ${
                        pageNumber <= 1
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-secondary text-white hover:bg-secondary/90"
                      }`}
                    >
                      <MdArrowBack />
                      Précédent
                    </button>
                    <p className="text-gray-700">
                      Page {pageNumber} sur {numPages}
                    </p>
                    <button
                      onClick={nextPage}
                      disabled={pageNumber >= numPages}
                      className={`flex items-center gap-1 px-3 py-1 rounded ${
                        pageNumber >= numPages
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-secondary text-white hover:bg-secondary/90"
                      }`}
                    >
                      Suivant
                      <MdArrowForward />
                    </button>
                  </div>
                )}

                <div className="mt-4 text-center">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline inline-flex items-center gap-1"
                  >
                    <MdFileDownload />
                    Télécharger le PDF
                  </a>
                </div>
              </div>
            )}
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
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/800x600?text=Image+non+disponible";
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

export default ModuleResource;
