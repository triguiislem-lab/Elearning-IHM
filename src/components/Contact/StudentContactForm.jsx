import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import {
  MdSend,
  MdPerson,
  MdEmail,
  MdSubject,
  MdMessage,
  MdCheck,
  MdSchool,
} from "react-icons/md";
import { sendMessage } from "../../utils/messageUtils";

const StudentContactForm = ({ courseId, courseName }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [instructor, setInstructor] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const auth = getAuth();
  const database = getDatabase();

  // Vérifier si l'étudiant est inscrit au cours et récupérer les informations du formateur
  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser || !courseId) return;

      try {
        // Vérifier si l'étudiant est inscrit au cours (vérification complète)
        // Chemins à vérifier pour l'inscription
        const enrollmentPaths = [
          `elearning/enrollments/${auth.currentUser.uid}/${courseId}`,
          `elearning/enrollments/byCourse/${courseId}/${auth.currentUser.uid}`,
          `elearning/enrollments/byUser/${auth.currentUser.uid}/${courseId}`,
          `elearning/progress/${auth.currentUser.uid}/${courseId}`,
          `Elearning/Enrollments/${courseId}/${auth.currentUser.uid}`,
          `Elearning/Enrollments/byUser/${auth.currentUser.uid}/${courseId}`,
          `Elearning/Cours/${courseId}/enrollments/${auth.currentUser.uid}`,
          `Elearning/Progression/${auth.currentUser.uid}/${courseId}`,
        ];

        // Vérifier chaque chemin
        let isUserEnrolled = false;
        for (const path of enrollmentPaths) {
          try {
            
            const pathRef = ref(database, path);
            const snapshot = await get(pathRef);

            if (snapshot.exists()) {
              
              isUserEnrolled = true;
              break;
            }
          } catch (error) {
            
          }
        }

        // Vérifier également dans le stockage local
        const enrolledInLocalStorage =
          localStorage.getItem(
            `enrolled_${auth.currentUser.uid}_${courseId}`
          ) === "true";
        if (enrolledInLocalStorage) {
          
          isUserEnrolled = true;
        }

        setIsEnrolled(isUserEnrolled);

        // Si l'utilisateur est inscrit, stocker cette information dans le stockage local
        if (isUserEnrolled) {
          localStorage.setItem(
            `enrolled_${auth.currentUser.uid}_${courseId}`,
            "true"
          );
        } else {
          setError(
            "Vous devez être inscrit à ce cours pour contacter le formateur."
          );
          return;
        }

        // Récupérer les informations du cours pour trouver le formateur (nouvelle structure)
        const courseRef = ref(database, `elearning/courses/${courseId}`);
        const courseSnapshot = await get(courseRef);

        let courseData;
        let instructorId;

        if (courseSnapshot.exists()) {
          courseData = courseSnapshot.val();
          instructorId = courseData.instructorId;
        } else {
          // Vérifier l'ancienne structure
          const oldCourseRef = ref(database, `Elearning/Cours/${courseId}`);
          const oldCourseSnapshot = await get(oldCourseRef);

          if (oldCourseSnapshot.exists()) {
            courseData = oldCourseSnapshot.val();
            instructorId = courseData.formateur || courseData.instructorId;
          } else {
            setError("Informations du cours non disponibles.");
            return;
          }
        }

        if (!instructorId) {
          setError("Ce cours n'a pas de formateur assigné.");
          return;
        }

        // Récupérer les informations du formateur (nouvelle structure)
        const instructorRef = ref(database, `elearning/users/${instructorId}`);
        const instructorSnapshot = await get(instructorRef);

        if (instructorSnapshot.exists()) {
          const instructorData = instructorSnapshot.val();

          // Fusionner les données
          const mergedData = {
            ...instructorData,
            id: instructorId,
            role: "instructor",
            prenom: instructorData.firstName || "",
            nom: instructorData.lastName || "",
            email: instructorData.email || "",
          };

          setInstructor(mergedData);

          // Préremplir le sujet avec le nom du cours
          setSubject(`Question sur le cours: ${courseName}`);
        } else {
          // Vérifier l'ancienne structure
          const oldInstructorRef = ref(
            database,
            `Elearning/Formateurs/${instructorId}`
          );
          const oldInstructorSnapshot = await get(oldInstructorRef);

          if (oldInstructorSnapshot.exists()) {
            const instructorData = oldInstructorSnapshot.val();

            // Récupérer les informations utilisateur supplémentaires si nécessaire
            const userRef = ref(
              database,
              `Elearning/Utilisateurs/${instructorId}`
            );
            const userSnapshot = await get(userRef);

            let userData = {};
            if (userSnapshot.exists()) {
              userData = userSnapshot.val();
            }

            // Fusionner les données
            const mergedData = {
              ...instructorData,
              id: instructorId,
              role: "instructor",
              prenom: userData.prenom || instructorData.prenom || "",
              nom: userData.nom || instructorData.nom || "",
              email: userData.email || instructorData.email || "",
            };

            setInstructor(mergedData);

            // Préremplir le sujet avec le nom du cours
            setSubject(`Question sur le cours: ${courseName}`);
          } else {
            setError("Informations du formateur non disponibles.");
            return;
          }
        }
      } catch (error) {
        
        setError("Erreur lors de la récupération des données.");
      }
    };

    fetchData();
  }, [auth.currentUser, courseId, courseName, database]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      setError("Vous devez être connecté pour envoyer un message");
      return;
    }

    if (!isEnrolled) {
      setError(
        "Vous devez être inscrit à ce cours pour contacter le formateur"
      );
      return;
    }

    if (!instructor) {
      setError("Informations du formateur non disponibles");
      return;
    }

    if (!subject.trim()) {
      setError("Veuillez saisir un sujet");
      return;
    }

    if (!message.trim()) {
      setError("Veuillez saisir un message");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Utiliser la nouvelle fonction sendMessage
      await sendMessage(
        instructor.id,
        "instructor",
        subject,
        message,
        courseId,
        courseName
      );

      setSuccess(true);
      setSubject("");
      setMessage("");

      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (error) {
      
      setError("Erreur lors de l'envoi du message");
    } finally {
      setSubmitting(false);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="bg-blue-50 p-4 rounded-md text-blue-700">
        Connectez-vous pour contacter le formateur de ce cours.
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md text-yellow-700">
        Vous devez être inscrit à ce cours pour contacter le formateur.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <MdSchool className="mr-2 text-secondary" />
        Contacter le formateur
      </h2>

      {instructor && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <div className="flex items-center">
            <img
              src={instructor.avatar || "https://via.placeholder.com/40"}
              alt={`${instructor.prenom} ${instructor.nom}`}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <p className="font-medium">
                {`${instructor.prenom} ${instructor.nom}`.trim() || "Formateur"}
              </p>
              <p className="text-sm text-gray-600">
                {instructor.specialite || "Formateur du cours"}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="subject"
            className="flex items-center text-gray-700 mb-2"
          >
            <MdSubject className="mr-2" />
            Sujet
          </label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            placeholder="Sujet de votre message"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="message"
            className="flex items-center text-gray-700 mb-2"
          >
            <MdMessage className="mr-2" />
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
            rows="5"
            placeholder="Votre question ou commentaire sur le cours..."
            required
          ></textarea>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
            <MdCheck className="mr-2" />
            Votre message a été envoyé avec succès ! Le formateur vous répondra
            prochainement.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <div className="flex items-center mb-1">
              <MdPerson className="mr-1" />
              <span>
                De: {auth.currentUser.displayName || auth.currentUser.email}
              </span>
            </div>
            <div className="flex items-center">
              <MdEmail className="mr-1" />
              <span>Cours: {courseName}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !instructor}
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
                Envoyer au formateur
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentContactForm;
