import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getDatabase, ref, get } from "firebase/database";
import { Link } from "react-router-dom";
import {
  MdInbox,
  MdOutbox,
  MdRefresh,
  MdMarkEmailRead,
  MdMarkEmailUnread,
  MdDelete,
  MdSend,
  MdPerson,
  MdPeople,
  MdAdminPanelSettings,
  MdSchool,
  MdClose,
} from "react-icons/md";
import {
  getReceivedMessages,
  getSentMessages,
  markMessageAsRead,
  deleteMessage,
  getAvailableRecipients,
  sendMessage,
} from "../../utils/messageUtils";
import OptimizedLoadingSpinner from "../../components/Common/OptimizedLoadingSpinner";
import { motion, AnimatePresence } from "framer-motion";

const MessagesPage = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [recipients, setRecipients] = useState({
    admins: [],
    instructors: [],
    students: [],
  });
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");

  const database = getDatabase();

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    setLoadingMessages(true);
    setError("");

    try {
      const [received, sent] = await Promise.all([
        getReceivedMessages(user.uid),
        getSentMessages(user.uid),
      ]);
      setMessages(received);
      setSentMessages(sent);
    } catch (err) {
      setError("Erreur lors de la récupération des messages");
    } finally {
      setLoadingMessages(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!user || !role) return;

    const fetchRecipients = async () => {
      try {
        const availableRecipients = await getAvailableRecipients(
          user.uid,
          role
        );
        setRecipients(availableRecipients);
      } catch (err) {}
    };

    fetchRecipients();
  }, [user, role]);

  const handleMarkAsRead = useCallback(
    async (messageId, isRead = true) => {
      if (!user) return;
      try {
        await markMessageAsRead(user.uid, messageId, isRead);

        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, read: isRead } : message
          )
        );

        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage((prev) =>
            prev ? { ...prev, read: isRead } : null
          );
        }
      } catch (err) {
        setError("Erreur lors de la mise à jour du statut du message");
      }
    },
    [user, selectedMessage]
  );

  const handleDeleteMessage = useCallback(
    async (messageId, messageType) => {
      if (
        !user ||
        !window.confirm("Êtes-vous sûr de vouloir supprimer ce message ?")
      ) {
        return;
      }

      try {
        await deleteMessage(user.uid, messageId, messageType);

        if (messageType === "received") {
          setMessages((prev) =>
            prev.filter((message) => message.id !== messageId)
          );
        } else {
          setSentMessages((prev) =>
            prev.filter((message) => message.id !== messageId)
          );
        }

        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage(null);
        }
        setSuccess("Message supprimé.");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        setError("Erreur lors de la suppression du message");
      }
    },
    [user, selectedMessage]
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Authentification requise.");
      return;
    }

    if (!selectedRecipientId) {
      setError("Veuillez sélectionner un destinataire");
      return;
    }

    const allRecipients = [
      ...(recipients.admins || []),
      ...(recipients.instructors || []),
      ...(recipients.students || []),
    ];
    const recipient = allRecipients.find((r) => r.id === selectedRecipientId);

    if (!recipient) {
      setError("Destinataire invalide.");
      return;
    }

    if (!subject.trim()) {
      setError("Veuillez saisir un sujet");
      return;
    }

    if (!messageContent.trim()) {
      setError("Veuillez saisir un message");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      await sendMessage(
        user.uid,
        recipient.id,
        recipient.role,
        subject,
        messageContent
      );

      setSelectedRecipientId("");
      setSubject("");
      setMessageContent("");
      setShowNewMessageModal(false);
      setSuccess("Message envoyé avec succès");

      const sent = await getSentMessages(user.uid);
      setSentMessages(sent);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(`Erreur lors de l'envoi du message: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const openMessage = (message) => {
    setSelectedMessage(message);
    if (activeTab === "inbox" && !message.read) {
      handleMarkAsRead(message.id, true);
    }
  };

  const closeMessage = () => {
    setSelectedMessage(null);
  };

  const closeNewMessageModal = () => {
    setShowNewMessageModal(false);
    setSelectedRecipientId("");
    setSubject("");
    setMessageContent("");
    setError("");
  };

  const isLoading = authLoading || loadingMessages;

  if (isLoading) {
    return <OptimizedLoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
        <p className="text-gray-600 mb-8">
          Veuillez vous connecter pour accéder à la messagerie.
        </p>
        <Link
          to="/login"
          className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors duration-300"
        >
          Connexion
        </Link>
      </div>
    );
  }

  const currentMessages = activeTab === "inbox" ? messages : sentMessages;

  const renderName = (msg) => {
    if (activeTab === "inbox") {
      return (
        msg.senderName || msg.sender?.firstName || msg.senderEmail || "Inconnu"
      );
    }
    return (
      msg.recipientName ||
      msg.recipient?.firstName ||
      msg.recipientEmail ||
      "Inconnu"
    );
  };

  const recipientOptions = [
    { label: "Administrateurs", options: recipients.admins || [] },
    { label: "Formateurs", options: recipients.instructors || [] },
    { label: "Étudiants", options: recipients.students || [] },
  ];

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 h-[calc(100vh-100px)]">
      <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col border rounded-lg shadow-sm bg-white">
        <div className="p-4 border-b">
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <MdSend /> Nouveau Message
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => {
              setActiveTab("inbox");
              setSelectedMessage(null);
            }}
            className={`flex-1 p-3 text-center flex items-center justify-center gap-2 ${
              activeTab === "inbox"
                ? "border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <MdInbox /> Boîte de réception (
            {messages.filter((m) => !m.read).length})
          </button>
          <button
            onClick={() => {
              setActiveTab("sent");
              setSelectedMessage(null);
            }}
            className={`flex-1 p-3 text-center flex items-center justify-center gap-2 ${
              activeTab === "sent"
                ? "border-b-2 border-indigo-500 text-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <MdOutbox /> Messages envoyés
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {currentMessages.length === 0 ? (
            <p className="text-center text-gray-500 p-4">Aucun message.</p>
          ) : (
            currentMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedMessage?.id === msg.id ? "bg-indigo-50" : "bg-white"
                } ${
                  activeTab === "inbox" && !msg.read
                    ? "font-semibold text-gray-900"
                    : "text-gray-700"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm truncate max-w-[70%]">
                    {renderName(msg)}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(msg.timestamp).toLocaleDateString()}{" "}
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm truncate font-normal text-gray-800">
                  {msg.subject}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="p-2 border-t text-center">
          <button
            onClick={fetchMessages}
            title="Rafraîchir les messages"
            className="text-gray-500 hover:text-indigo-600 p-2 rounded-full"
          >
            <MdRefresh size={20} />
          </button>
        </div>
      </aside>

      <main className="w-full md:w-2/3 lg:w-3/4 flex flex-col border rounded-lg shadow-sm bg-white overflow-hidden">
        {selectedMessage ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold truncate max-w-md">
                  {selectedMessage.subject}
                </h2>
                <p className="text-sm text-gray-600">
                  {activeTab === "inbox" ? "De" : "À"}:{" "}
                  <span className="font-medium">
                    {renderName(selectedMessage)}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(selectedMessage.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === "inbox" && (
                  <button
                    onClick={() =>
                      handleMarkAsRead(
                        selectedMessage.id,
                        !selectedMessage.read
                      )
                    }
                    title={
                      selectedMessage.read
                        ? "Marquer comme non lu"
                        : "Marquer comme lu"
                    }
                    className="text-gray-500 hover:text-indigo-600 p-2 rounded-full"
                  >
                    {selectedMessage.read ? (
                      <MdMarkEmailUnread size={20} />
                    ) : (
                      <MdMarkEmailRead size={20} />
                    )}
                  </button>
                )}
                <button
                  onClick={() =>
                    handleDeleteMessage(selectedMessage.id, activeTab)
                  }
                  title="Supprimer le message"
                  className="text-gray-500 hover:text-red-600 p-2 rounded-full"
                >
                  <MdDelete size={20} />
                </button>
                <button
                  onClick={closeMessage}
                  title="Fermer"
                  className="text-gray-500 hover:text-gray-800 p-2 rounded-full"
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-grow whitespace-pre-wrap">
              {selectedMessage.content}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Sélectionnez un message pour le lire.
          </div>
        )}
      </main>

      <AnimatePresence>
        {showNewMessageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeNewMessageModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSendMessage}>
                <div className="p-6 border-b flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Nouveau Message</h2>
                  <button
                    type="button"
                    onClick={closeNewMessageModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MdClose size={24} />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="recipient"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Destinataire
                    </label>
                    <select
                      id="recipient"
                      value={selectedRecipientId}
                      onChange={(e) => setSelectedRecipientId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">
                        -- Sélectionnez un destinataire --
                      </option>
                      {recipientOptions.map(
                        (group, index) =>
                          group.options.length > 0 && (
                            <optgroup key={index} label={group.label}>
                              {group.options.map((recipient) => (
                                <option key={recipient.id} value={recipient.id}>
                                  {recipient.firstName || ""}{" "}
                                  {recipient.lastName || ""} ({recipient.email})
                                </option>
                              ))}
                            </optgroup>
                          )
                      )}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Sujet
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="messageContent"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Message
                    </label>
                    <textarea
                      id="messageContent"
                      rows={6}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeNewMessageModal}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MdSend className="mr-2 -ml-1" />
                    {sending ? "Envoi en cours..." : "Envoyer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagesPage;
