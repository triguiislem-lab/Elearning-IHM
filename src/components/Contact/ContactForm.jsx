import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, push, get } from "firebase/database";
import {
  MdSend,
  MdPerson,
  MdEmail,
  MdSubject,
  MdMessage,
  MdCheck,
} from "react-icons/md";

const ContactForm = ({
  recipientId,
  recipientType,
  recipientName,
  courseId,
  courseName,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [recipientInfo, setRecipientInfo] = useState(null);

  const auth = getAuth();
  const database = getDatabase();

  // Récupérer les informations du destinataire
  useEffect(() => {
    const fetchRecipientInfo = async () => {
      if (!recipientId || !recipientType) return;

      try {
        let path;
        if (recipientType === "admin") {
          path = `Elearning/Administrateurs/${recipientId}`;
        } else if (recipientType === "instructor") {
          path = `Elearning/Formateurs/${recipientId}`;
        } else {
          return;
        }

        const recipientRef = ref(database, path);
        const snapshot = await get(recipientRef);

        if (snapshot.exists()) {
          const data = snapshot.val();

          // Si nous n'avons pas toutes les informations, récupérer les informations utilisateur
          if (!data.email || !data.nom || !data.prenom) {
            const userRef = ref(
              database,
              `Elearning/Utilisateurs/${recipientId}`
            );
            const userSnapshot = await get(userRef);

            if (userSnapshot.exists()) {
              const userData = userSnapshot.val();
              setRecipientInfo({
                ...data,
                email: userData.email || data.email,
                nom: userData.nom || data.nom,
                prenom: userData.prenom || data.prenom,
              });
            } else {
              setRecipientInfo(data);
            }
          } else {
            setRecipientInfo(data);
          }
        }
      } catch (error) {
        setError(
          "Erreur lors de la récupération des informations du destinataire"
        );
      }
    };

    fetchRecipientInfo();
  }, [recipientId, recipientType, database]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      setError("Vous devez être connecté pour envoyer un message");
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
      const messageData = {
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || "Utilisateur anonyme",
        senderEmail: auth.currentUser.email,
        recipientId,
        recipientType,
        recipientName:
          recipientName ||
          (recipientInfo
            ? `${recipientInfo.prenom} ${recipientInfo.nom}`
            : "Destinataire"),
        subject,
        message,
        courseId,
        courseName,
        date: new Date().toISOString(),
        read: false,
      };

      // Enregistrer le message dans Firebase
      const messagesRef = ref(database, "Elearning/Messages");
      await push(messagesRef, messageData);

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">
        Contacter{" "}
        {recipientType === "admin" ? "l'administrateur" : "le formateur"}
      </h2>

      {auth.currentUser ? (
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
              className="form-input"
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
              className="form-input"
              rows="5"
              placeholder="Votre message..."
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
              Votre message a été envoyé avec succès !
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
                <span>
                  À:{" "}
                  {recipientName ||
                    (recipientInfo
                      ? `${recipientInfo.prenom} ${recipientInfo.nom}`
                      : "Destinataire")}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="secondary-btn"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <MdSend className="mr-2" />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
          Connectez-vous pour envoyer un message.
        </div>
      )}
    </div>
  );
};

export default ContactForm;
