import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdClose, MdRestore, MdDelete, MdSearch, MdInbox, MdOutbox, MdArchive } from 'react-icons/md';
import { getArchivedMessages, restoreMessage, deleteMessage } from '../../services/messageService';

const ArchivedMessagesView = ({ user, onClose, onSuccess, onError }) => {
  const [archivedMessages, setArchivedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchArchivedMessages = async () => {
      try {
        setLoading(true);
        const messages = await getArchivedMessages(user.uid);
        setArchivedMessages(messages);
      } catch (error) {
        console.error('Error fetching archived messages:', error);
        onError('Erreur lors du chargement des messages archivés');
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedMessages();
  }, [user.uid, onError]);

  const handleRestoreMessage = async (messageId) => {
    try {
      setProcessing(true);
      await restoreMessage(messageId, user.uid);
      setArchivedMessages(archivedMessages.filter(msg => msg.id !== messageId));
      onSuccess('Message restauré avec succès');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error restoring message:', error);
      onError('Erreur lors de la restauration du message');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement ce message ?')) {
      return;
    }
    
    try {
      setProcessing(true);
      await deleteMessage(messageId, user.uid);
      setArchivedMessages(archivedMessages.filter(msg => msg.id !== messageId));
      onSuccess('Message supprimé avec succès');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      onError('Erreur lors de la suppression du message');
    } finally {
      setProcessing(false);
    }
  };

  const filteredMessages = archivedMessages.filter(msg => {
    // Filter by tab
    if (activeTab === 'inbox' && msg.recipientId !== user.uid) return false;
    if (activeTab === 'sent' && msg.senderId !== user.uid) return false;
    
    // Filter by search query
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (msg.subject && msg.subject.toLowerCase().includes(query)) ||
      (msg.message && msg.message.toLowerCase().includes(query)) ||
      (msg.senderName && msg.senderName.toLowerCase().includes(query)) ||
      (msg.recipientName && msg.recipientName.toLowerCase().includes(query))
    );
  });

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MdArchive className="text-secondary" /> Messages archivés
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-2 rounded-full"
        >
          <MdClose size={24} />
        </button>
      </div>

      {/* Search and tabs */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans les messages archivés..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          </div>
          
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-1 px-3 py-2 ${
                activeTab === 'inbox' ? 'bg-secondary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MdInbox /> Reçus
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex items-center gap-1 px-3 py-2 ${
                activeTab === 'sent' ? 'bg-secondary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MdOutbox /> Envoyés
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row flex-grow overflow-hidden">
        {/* Message list */}
        <div className="w-full sm:w-1/2 border-r overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <MdArchive size={48} className="mb-2 text-gray-300" />
              <p>Aucun message archivé trouvé</p>
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                  selectedMessage?.id === msg.id ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">
                    {activeTab === 'inbox' ? msg.senderName : msg.recipientName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm font-medium truncate">{msg.subject}</h3>
                <p className="text-xs text-gray-500 truncate">{msg.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Message detail */}
        <div className="w-full sm:w-1/2 overflow-y-auto bg-gray-50 flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-4 border-b bg-white">
                <h3 className="text-lg font-medium mb-1">{selectedMessage.subject}</h3>
                <div className="flex justify-between text-sm text-gray-600">
                  <div>
                    <span className="font-medium">De:</span> {selectedMessage.senderName}
                  </div>
                  <div>
                    {new Date(selectedMessage.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">À:</span> {selectedMessage.recipientName}
                </div>
              </div>
              
              <div className="p-4 flex-grow">
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              
              <div className="p-4 border-t bg-white flex justify-end gap-2">
                <button
                  onClick={() => handleRestoreMessage(selectedMessage.id)}
                  disabled={processing}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <MdRestore /> Restaurer
                </button>
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  disabled={processing}
                  className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <MdDelete /> Supprimer
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MdArchive size={48} className="mb-2 text-gray-300" />
              <p>Sélectionnez un message pour le consulter</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ArchivedMessagesView;
