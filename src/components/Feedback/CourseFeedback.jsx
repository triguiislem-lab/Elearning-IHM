import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, push, get, set } from "firebase/database";
import { MdStar, MdStarBorder, MdSend, MdThumbUp } from "react-icons/md";

const CourseFeedback = ({ courseId, courseName }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const database = getDatabase();

  // Récupérer les feedbacks existants pour ce cours
  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!courseId) return;

      setLoading(true);
      try {
        let userFeedbackData = null;
        let allFeedbacksData = [];

        // Vérifier si l'utilisateur a déjà donné un feedback (chemin standardisé)
        if (auth.currentUser) {
          // Vérifier d'abord dans le chemin standardisé (lowercase)
          const standardUserFeedbackRef = ref(
            database,
            `elearning/feedback/${courseId}/${auth.currentUser.uid}`
          );
          const standardUserFeedbackSnapshot = await get(
            standardUserFeedbackRef
          );

          if (standardUserFeedbackSnapshot.exists()) {
            userFeedbackData = standardUserFeedbackSnapshot.val();
          } else {
            // Vérifier ensuite dans le chemin hérité (capitalized)
            const legacyUserFeedbackRef = ref(
              database,
              `Elearning/Feedback/${courseId}/${auth.currentUser.uid}`
            );
            const legacyUserFeedbackSnapshot = await get(legacyUserFeedbackRef);

            if (legacyUserFeedbackSnapshot.exists()) {
              userFeedbackData = legacyUserFeedbackSnapshot.val();

              // Synchroniser avec le chemin standardisé
              await set(standardUserFeedbackRef, userFeedbackData);
            }
          }

          if (userFeedbackData) {
            setExistingFeedback(userFeedbackData);
            setRating(userFeedbackData.rating || 0);
            setComment(userFeedbackData.comment || "");
          }
        }

        // Récupérer tous les feedbacks pour ce cours (chemin standardisé)
        const standardFeedbacksRef = ref(
          database,
          `elearning/feedback/${courseId}`
        );
        const standardFeedbacksSnapshot = await get(standardFeedbacksRef);

        if (standardFeedbacksSnapshot.exists()) {
          const feedbacksData = standardFeedbacksSnapshot.val();
          console.log("Standard path feedbacks:", feedbacksData);

          // Convert to array with userId included
          allFeedbacksData = Object.entries(feedbacksData).map(
            ([userId, data]) => ({
              ...data,
              userId: data.userId || userId, // Ensure userId is set
            })
          );
        }

        // Vérifier aussi dans le chemin hérité
        const legacyFeedbacksRef = ref(
          database,
          `Elearning/Feedback/${courseId}`
        );
        const legacyFeedbacksSnapshot = await get(legacyFeedbacksRef);

        if (legacyFeedbacksSnapshot.exists()) {
          const legacyFeedbacksData = legacyFeedbacksSnapshot.val();
          console.log("Legacy path feedbacks:", legacyFeedbacksData);

          // Fusionner avec les données standardisées en évitant les doublons
          const legacyFeedbacks = Object.entries(legacyFeedbacksData).map(
            ([userId, feedback]) => {
              // S'assurer que le feedback a un userId
              const feedbackWithUserId = {
                ...feedback,
                userId: feedback.userId || userId, // Utiliser le userId existant ou celui de la clé
              };

              // Synchroniser avec le chemin standardisé si pas déjà présent
              const standardUserFeedbackRef = ref(
                database,
                `elearning/feedback/${courseId}/${userId}`
              );
              set(standardUserFeedbackRef, feedbackWithUserId);

              return feedbackWithUserId;
            }
          );

          // Ajouter uniquement les feedbacks qui ne sont pas déjà dans allFeedbacksData
          // Vérifier d'abord si les feedbacks dans allFeedbacksData ont un userId
          const enhancedAllFeedbacksData = allFeedbacksData.map((feedback) => {
            if (!feedback.userId && feedback.userEmail) {
              // Essayer de trouver le userId correspondant dans les feedbacks hérités
              const matchingLegacyFeedback = legacyFeedbacks.find(
                (lf) => lf.userEmail === feedback.userEmail
              );
              if (matchingLegacyFeedback && matchingLegacyFeedback.userId) {
                return { ...feedback, userId: matchingLegacyFeedback.userId };
              }
            }
            return feedback;
          });

          // Maintenant, filtrer les doublons
          const existingUserIds = new Set(
            enhancedAllFeedbacksData
              .filter((f) => f.userId) // Filtrer uniquement ceux qui ont un userId
              .map((f) => f.userId)
          );

          const existingEmails = new Set(
            enhancedAllFeedbacksData
              .filter((f) => f.userEmail && !f.userId) // Ceux qui ont un email mais pas d'userId
              .map((f) => f.userEmail)
          );

          const uniqueLegacyFeedbacks = legacyFeedbacks.filter((f) => {
            // Garder si l'userId n'existe pas déjà ET si l'email n'existe pas déjà (pour ceux sans userId)
            return (
              !existingUserIds.has(f.userId) &&
              (!f.userEmail || !existingEmails.has(f.userEmail))
            );
          });

          allFeedbacksData = [
            ...enhancedAllFeedbacksData,
            ...uniqueLegacyFeedbacks,
          ];
        }

        if (allFeedbacksData.length > 0) {
          // Formater les dates et trier
          const formattedFeedbacks = allFeedbacksData.map((feedback) => ({
            ...feedback,
            date: feedback.date ? new Date(feedback.date) : new Date(),
          }));

          // Trier par date (plus récent d'abord)
          formattedFeedbacks.sort((a, b) => b.date - a.date);

          console.log("Final merged feedbacks:", formattedFeedbacks);
          setAllFeedbacks(formattedFeedbacks);
        }
      } catch (error) {
        setError("Erreur lors de la récupération des feedbacks");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [courseId, auth.currentUser, database]);

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      setError("Vous devez être connecté pour laisser un feedback");
      return;
    }

    if (rating === 0) {
      setError("Veuillez sélectionner une note");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const feedbackData = {
        userId: auth.currentUser.uid, // Assurez-vous que l'userId est toujours défini
        userName: auth.currentUser.displayName || "Utilisateur anonyme",
        userEmail: auth.currentUser.email,
        courseId,
        courseName,
        rating,
        comment,
        date: new Date().toISOString(),
      };

      console.log("Submitting feedback data:", feedbackData);

      // Enregistrer le feedback dans Firebase (chemin standardisé)
      const standardFeedbackRef = ref(
        database,
        `elearning/feedback/${courseId}/${auth.currentUser.uid}`
      );
      await set(standardFeedbackRef, feedbackData);

      // Enregistrer aussi dans le chemin hérité pour la compatibilité
      const legacyFeedbackRef = ref(
        database,
        `Elearning/Feedback/${courseId}/${auth.currentUser.uid}`
      );
      await set(legacyFeedbackRef, feedbackData);

      // Mettre à jour la note moyenne du cours (chemin standardisé)
      const standardCourseRef = ref(database, `elearning/courses/${courseId}`);
      const standardCourseSnapshot = await get(standardCourseRef);

      // Vérifier d'abord dans le chemin standardisé
      if (standardCourseSnapshot.exists()) {
        const courseData = standardCourseSnapshot.val();
        const currentRating = courseData.rating || 0;
        const totalRatings = courseData.totalRatings || 0;

        // Calculer la nouvelle note moyenne
        let newRating;
        let newTotalRatings;

        if (existingFeedback) {
          // Mettre à jour un feedback existant
          const oldRating = existingFeedback.rating || 0;
          const totalScore = currentRating * totalRatings;
          const newTotalScore = totalScore - oldRating + rating;
          newRating = totalRatings > 0 ? newTotalScore / totalRatings : rating;
          newTotalRatings = totalRatings;
        } else {
          // Ajouter un nouveau feedback
          const totalScore = currentRating * totalRatings;
          const newTotalScore = totalScore + rating;
          newTotalRatings = totalRatings + 1;
          newRating =
            newTotalRatings > 0 ? newTotalScore / newTotalRatings : rating;
        }

        // Mettre à jour la note moyenne du cours (chemin standardisé)
        await set(
          ref(database, `elearning/courses/${courseId}/rating`),
          parseFloat(newRating.toFixed(1))
        );
        await set(
          ref(database, `elearning/courses/${courseId}/totalRatings`),
          newTotalRatings
        );
      }

      // Vérifier aussi dans le chemin hérité
      const legacyCourseRef = ref(database, `Elearning/Cours/${courseId}`);
      const legacyCourseSnapshot = await get(legacyCourseRef);

      if (legacyCourseSnapshot.exists()) {
        const courseData = legacyCourseSnapshot.val();
        const currentRating = courseData.rating || 0;
        const totalRatings = courseData.totalRatings || 0;

        // Calculer la nouvelle note moyenne
        let newRating;
        let newTotalRatings;

        if (existingFeedback) {
          // Mettre à jour un feedback existant
          const oldRating = existingFeedback.rating || 0;
          const totalScore = currentRating * totalRatings;
          const newTotalScore = totalScore - oldRating + rating;
          newRating = totalRatings > 0 ? newTotalScore / totalRatings : rating;
          newTotalRatings = totalRatings;
        } else {
          // Ajouter un nouveau feedback
          const totalScore = currentRating * totalRatings;
          const newTotalScore = totalScore + rating;
          newTotalRatings = totalRatings + 1;
          newRating =
            newTotalRatings > 0 ? newTotalScore / newTotalRatings : rating;
        }

        // Mettre à jour la note moyenne du cours
        await set(
          ref(database, `Elearning/Cours/${courseId}/rating`),
          parseFloat(newRating.toFixed(1))
        );
        await set(
          ref(database, `Elearning/Cours/${courseId}/totalRatings`),
          newTotalRatings
        );
      }

      setSuccess(true);
      setExistingFeedback(feedbackData);

      // Ajouter le nouveau feedback à la liste
      if (!existingFeedback) {
        console.log("Adding new feedback to list:", feedbackData);
        const newFeedbacksList = [feedbackData, ...allFeedbacks];
        console.log("New feedbacks list:", newFeedbacksList);
        setAllFeedbacks(newFeedbacksList);
      } else {
        // Mettre à jour le feedback existant dans la liste
        console.log("Updating existing feedback in list");
        const updatedFeedbacks = allFeedbacks.map((feedback) => {
          if (feedback.userId === auth.currentUser.uid) {
            console.log("Found feedback to update:", feedback);
            return feedbackData;
          }
          return feedback;
        });
        console.log("Updated feedbacks list:", updatedFeedbacks);
        setAllFeedbacks(updatedFeedbacks);
      }

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      setError("Erreur lors de l'envoi du feedback");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculer la note moyenne
  const averageRating =
    allFeedbacks.length > 0
      ? (
          allFeedbacks.reduce(
            (sum, feedback) => sum + (feedback.rating || 0),
            0
          ) / allFeedbacks.length
        ).toFixed(1)
      : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Avis et commentaires</h2>

      {/* Résumé des avis */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-800">
                {averageRating}
              </span>
              <div className="ml-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                      {star <= Math.round(averageRating) ? (
                        <MdStar className="text-yellow-400 text-xl" />
                      ) : (
                        <MdStarBorder className="text-yellow-400 text-xl" />
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {allFeedbacks.length}{" "}
                  {allFeedbacks.length === 1 ? "avis" : "avis"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de feedback */}
      {auth.currentUser ? (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">
            {existingFeedback ? "Modifier votre avis" : "Laisser un avis"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Note</label>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="focus:outline-none mr-1"
                  >
                    {star <= rating ? (
                      <MdStar className="text-yellow-400 text-3xl" />
                    ) : (
                      <MdStarBorder className="text-yellow-400 text-3xl" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="comment" className="block text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                rows="4"
                placeholder="Partagez votre expérience avec ce cours..."
              ></textarea>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
                <MdThumbUp className="mr-2" />
                Merci pour votre avis !
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <MdSend className="mr-2" />
                  {existingFeedback ? "Mettre à jour" : "Envoyer"}
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-md">
          Connectez-vous pour laisser un avis sur ce cours.
        </div>
      )}

      {/* Liste des avis */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Avis des participants ({allFeedbacks.length})
        </h3>
        {console.log("Rendering feedback list, count:", allFeedbacks.length)}
        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary"></div>
          </div>
        ) : allFeedbacks.length > 0 ? (
          <div className="space-y-4">
            {allFeedbacks.map((feedback, index) => {
              console.log("Rendering feedback item:", feedback);
              return (
                <div
                  key={feedback.userId || index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="font-medium mr-2">
                          {feedback.userName || "Utilisateur"}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>
                              {star <= feedback.rating ? (
                                <MdStar className="text-yellow-400 text-sm" />
                              ) : (
                                <MdStarBorder className="text-yellow-400 text-sm" />
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {feedback.date instanceof Date
                          ? feedback.date.toLocaleDateString()
                          : new Date(feedback.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {feedback.comment && (
                    <p className="text-gray-700 mt-2">{feedback.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600">
            Aucun avis pour le moment. Soyez le premier à donner votre avis !
          </p>
        )}
      </div>
    </div>
  );
};

export default CourseFeedback;
