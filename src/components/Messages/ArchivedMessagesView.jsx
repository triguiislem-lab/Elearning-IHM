import React, { useState, useEffect } from 'react';
import { MdRestore, MdDelete, MdArchive, MdSearch } from 'react-icons/md';
import { getReceivedMessages, getSentMessages, restoreMessage } from '../../utils/messageUtils';
import OptimizedLoadingSpinner from '../Common/OptimizedLoadingSpinner';

/**
 * Component to display and manage archived messages
 */
const ArchivedMessagesView = ({ user, onClose, onSuccess, onError }) => {
  const [archivedMessages, setArchivedMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [processingMessageId, setProcessingMessageId] = useState(null);

  // Load archived messages
  useEffect(() => {
    const loadArchivedMessages = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        let messages = [];
        if (activeTab === 'received') {
          messages = await getReceivedMessages(user.uid, true); // includeArchived = true
        } else {
          messages = await getSentMessages(user.uid, true); // includeArchived = true
        }
        
        // Filter only archived messages
        const archived = messages.filter(msg => msg.archived);
        setArchivedMessages(archived);
      } catch (error) {
        console.error('Error loading archived messages:', error);
        onError && onError('Erreur lors du chargement des messages archivés');
      } finally {
        setLoading(false);
      }
    };

    loadArchivedMessages();
  }, [user, activeTab, onError]);

  // Handle message restoration
  const handleRestoreMessage = async (messageId) => {
    if (!user || !messageId) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir restaurer ce message ?')) {
      return;
    }
    
    setProcessingMessageId(messageId);
    try {
      await restoreMessage(user.uid, messageId, activeTab);
      
      // Remove from list
      setArchivedMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage(null);
      }
      
      onSuccess && onSuccess('Message restauré avec succès');
    } catch (error) {
      console.error('Error restoring message:', error);
      onError && onError('Erreur lors de la restauration du message');
    } finally {
      setProcessingMessageId(null);
    }
  };

  // Filter messages by search term
  const filteredMessages = archivedMessages.filter(message => {
    const searchFields = [
      message.subject,
      message.content,
      message.senderName,
      message.recipientName
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchFields.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Messages archivés</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          Fermer
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'received'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('received')}
        >
          Reçus
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'sent'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('sent')}
        >
          Envoyés
        </button>
      </div>
      
      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Rechercher dans les messages archivés..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <MdSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <OptimizedLoadingSpinner />
        </div>
      ) : (
        <div className="flex h-[500px]">
          {/* Messages list */}
          <div className="w-1/3 border-r pr-4 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MdArchive size={48} className="mx-auto mb-2 text-gray-400" />
                <p>Aucun message archivé</p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedMessage && selectedMessage.id === message.id
                      ? 'bg-blue-50'
                      : ''
                  }`}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800 truncate">
                        {message.subject || 'Sans objet'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {activeTab === 'received'
                          ? `De: ${message.senderName || 'Inconnu'}`
                          : `À: ${message.recipientName || 'Inconnu'}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {message.date
                        ? new Date(message.date).toLocaleDateString()
                        : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {message.content}
                  </p>
                </div>
              ))
            )}
          </div>
          
          {/* Message detail */}
          <div className="w-2/3 pl-4 overflow-y-auto">
            {selectedMessage ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    {selectedMessage.subject || 'Sans objet'}
                  </h3>
                  <button
                    onClick={() => handleRestoreMessage(selectedMessage.id)}
                    disabled={processingMessageId === selectedMessage.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {processingMessageId === selectedMessage.id ? (
                      <OptimizedLoadingSpinner size="small" />
                    ) : (
                      <>
                        <MdRestore size={18} />
                        <span>Restaurer</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <div>
                      <p>
                        <strong>
                          {activeTab === 'received' ? 'De:' : 'À:'}
                        </strong>{' '}
                        {activeTab === 'received'
                          ? selectedMessage.senderName || 'Inconnu'
                          : selectedMessage.recipientName || 'Inconnu'}
                      </p>
                      <p>
                        <strong>Date:</strong>{' '}
                        {selectedMessage.date
                          ? new Date(selectedMessage.date).toLocaleString()
                          : 'Inconnue'}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Archivé le:</strong>{' '}
                        {selectedMessage.archivedAt
                          ? new Date(selectedMessage.archivedAt).toLocaleString()
                          : 'Inconnu'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border p-4 rounded-lg whitespace-pre-wrap">
                  {selectedMessage.content}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MdArchive size={64} className="mb-4 text-gray-300" />
                <p>Sélectionnez un message pour voir son contenu</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivedMessagesView;
