import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getDatabase, ref, get } from 'firebase/database';
import { Link } from 'react-router-dom';
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
	MdSearch,
	MdLabel,
	MdStar,
	MdStarBorder,
	MdFilterList,
	MdArrowBack,
	MdMoreVert,
	MdArchive,
	MdReply,
	MdForward,
	MdMessage,
	MdEmail,
} from 'react-icons/md';
import {
	getReceivedMessages,
	getSentMessages,
	markMessageAsRead,
	deleteMessage,
	getAvailableRecipients,
	sendMessage,
} from '../../utils/messageUtils';
import OptimizedLoadingSpinner from '../../components/Common/OptimizedLoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const MessagesPage = () => {
	const { user, userRole, loading: authLoading } = useAuth();
	const [messages, setMessages] = useState([]);
	const [sentMessages, setSentMessages] = useState([]);
	const [loadingMessages, setLoadingMessages] = useState(true);
	const [error, setError] = useState('');
	const [activeTab, setActiveTab] = useState('inbox');
	const [selectedMessage, setSelectedMessage] = useState(null);
	const [showNewMessageModal, setShowNewMessageModal] = useState(false);
	const [recipients, setRecipients] = useState({
		admins: [],
		instructors: [],
		students: [],
	});
	const [selectedRecipientId, setSelectedRecipientId] = useState('');
	const [subject, setSubject] = useState('');
	const [messageContent, setMessageContent] = useState('');
	const [sending, setSending] = useState(false);
	const [success, setSuccess] = useState('');

	// New state variables for enhanced inbox
	const [searchQuery, setSearchQuery] = useState('');
	const [activeCategory, setActiveCategory] = useState('all');
	const [showSidebar, setShowSidebar] = useState(true);
	const [isReplying, setIsReplying] = useState(false);
	const [replyContent, setReplyContent] = useState('');

	const database = getDatabase();

	// Filter and search messages
	const filteredMessages = useMemo(() => {
		const baseMessages = activeTab === 'inbox' ? messages : sentMessages;

		return baseMessages.filter((msg) => {
			// Apply search filter if query exists
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const nameToSearch =
					activeTab === 'inbox'
						? msg.senderName || msg.sender?.firstName || msg.senderEmail || ''
						: msg.recipientName ||
						  msg.recipient?.firstName ||
						  msg.recipientEmail ||
						  '';

				return (
					nameToSearch.toLowerCase().includes(query) ||
					(msg.subject || '').toLowerCase().includes(query) ||
					(msg.message || msg.content || '').toLowerCase().includes(query)
				);
			}

			// Apply category filter
			if (activeCategory === 'unread' && activeTab === 'inbox') {
				return !msg.read;
			} else if (activeCategory === 'important') {
				return msg.important;
			}

			return true; // 'all' category or no search query
		});
	}, [activeTab, messages, sentMessages, searchQuery, activeCategory]);

	const fetchMessages = useCallback(async () => {
		if (!user) {
			console.log('fetchMessages: Aucun utilisateur connecté');
			return;
		}

		setLoadingMessages(true);
		setError('');

		try {
			console.log(`fetchMessages: Récupération des messages pour ${user.uid}`);
			const [received, sent] = await Promise.all([
				getReceivedMessages(user.uid),
				getSentMessages(user.uid),
			]);
			console.log(
				`fetchMessages: ${received.length} messages reçus, ${sent.length} messages envoyés`,
			);
			setMessages(received || []);
			setSentMessages(sent || []);
		} catch (err) {
			console.error('fetchMessages error:', err);
			setError('Erreur lors de la récupération des messages');
			setMessages([]);
			setSentMessages([]);
		} finally {
			setLoadingMessages(false);
		}
	}, [user]);

	useEffect(() => {
		fetchMessages();
	}, [fetchMessages]);

	useEffect(() => {
		if (!user || !userRole) {
			console.log('fetchRecipients: Utilisateur ou rôle manquant');
			return;
		}

		const fetchRecipients = async () => {
			try {
				console.log(
					`fetchRecipients: Récupération des destinataires pour ${user.uid} (${userRole})`,
				);
				const availableRecipients = await getAvailableRecipients(
					user.uid,
					userRole,
				);
				console.log(
					'fetchRecipients: Destinataires récupérés',
					availableRecipients,
				);
				setRecipients(
					availableRecipients || {
						admins: [],
						instructors: [],
						students: [],
					},
				);
			} catch (err) {
				console.error('fetchRecipients error:', err);
				setRecipients({
					admins: [],
					instructors: [],
					students: [],
				});
			}
		};

		fetchRecipients();
	}, [user, userRole]);

	const handleMarkAsRead = useCallback(
		async (messageId, isRead = true) => {
			if (!user) return;
			try {
				await markMessageAsRead(user.uid, messageId, isRead);

				setMessages((prev) =>
					prev.map((message) =>
						message.id === messageId ? { ...message, read: isRead } : message,
					),
				);

				if (selectedMessage && selectedMessage.id === messageId) {
					setSelectedMessage((prev) =>
						prev ? { ...prev, read: isRead } : null,
					);
				}
			} catch (err) {
				setError('Erreur lors de la mise à jour du statut du message');
			}
		},
		[user, selectedMessage],
	);

	const handleDeleteMessage = useCallback(
		async (messageId, messageType) => {
			if (
				!user ||
				!window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')
			) {
				return;
			}

			try {
				await deleteMessage(user.uid, messageId, messageType);

				if (messageType === 'received') {
					setMessages((prev) =>
						prev.filter((message) => message.id !== messageId),
					);
				} else {
					setSentMessages((prev) =>
						prev.filter((message) => message.id !== messageId),
					);
				}

				if (selectedMessage && selectedMessage.id === messageId) {
					setSelectedMessage(null);
				}
				setSuccess('Message supprimé.');
				setTimeout(() => setSuccess(''), 3000);
			} catch (err) {
				setError('Erreur lors de la suppression du message');
			}
		},
		[user, selectedMessage],
	);

	const handleSendMessage = async (e) => {
		e.preventDefault();
		if (!user) {
			setError('Authentification requise.');
			return;
		}

		if (!selectedRecipientId) {
			setError('Veuillez sélectionner un destinataire');
			return;
		}

		const allRecipients = [
			...(recipients.admins || []),
			...(recipients.instructors || []),
			...(recipients.students || []),
		];
		const recipient = allRecipients.find((r) => r.id === selectedRecipientId);

		if (!recipient) {
			setError('Destinataire invalide.');
			return;
		}

		if (!subject.trim()) {
			setError('Veuillez saisir un sujet');
			return;
		}

		if (!messageContent.trim()) {
			setError('Veuillez saisir un message');
			return;
		}

		setSending(true);
		setError('');
		setSuccess('');

		try {
			await sendMessage(
				user.uid,
				recipient.id,
				recipient.role,
				subject,
				messageContent,
			);

			setSelectedRecipientId('');
			setSubject('');
			setMessageContent('');
			setShowNewMessageModal(false);
			setSuccess('Message envoyé avec succès');

			const sent = await getSentMessages(user.uid);
			setSentMessages(sent);

			setTimeout(() => setSuccess(''), 3000);
		} catch (err) {
			setError(`Erreur lors de l'envoi du message: ${err.message}`);
		} finally {
			setSending(false);
		}
	};

	const openMessage = (message) => {
		setSelectedMessage(message);
		if (activeTab === 'inbox' && !message.read) {
			handleMarkAsRead(message.id, true);
		}
	};

	const closeMessage = () => {
		setSelectedMessage(null);
		setIsReplying(false);
		setReplyContent('');
	};

	const closeNewMessageModal = () => {
		setShowNewMessageModal(false);
		setSelectedRecipientId('');
		setSubject('');
		setMessageContent('');
		setError('');
	};

	const handleReply = async (e) => {
		e.preventDefault();
		if (!user || !selectedMessage || !replyContent.trim()) {
			return;
		}

		setSending(true);
		setError('');

		try {
			// Get recipient info from the selected message
			const recipientId =
				activeTab === 'inbox'
					? selectedMessage.senderId
					: selectedMessage.recipientId;
			const recipientRole =
				activeTab === 'inbox'
					? selectedMessage.senderType
					: selectedMessage.recipientType;
			const replySubject = `Re: ${selectedMessage.subject}`;

			await sendMessage(
				user.uid,
				recipientId,
				recipientRole,
				replySubject,
				replyContent,
			);

			// Refresh sent messages
			const sent = await getSentMessages(user.uid);
			setSentMessages(sent);

			// Reset reply state
			setIsReplying(false);
			setReplyContent('');
			setSuccess('Réponse envoyée avec succès');
			setTimeout(() => setSuccess(''), 3000);
		} catch (err) {
			setError(`Erreur lors de l'envoi de la réponse: ${err.message}`);
		} finally {
			setSending(false);
		}
	};

	const isLoading = authLoading || loadingMessages;

	if (isLoading) {
		return <OptimizedLoadingSpinner />;
	}

	if (!user) {
		return (
			<div className='min-h-screen flex flex-col items-center justify-center'>
				<h1 className='text-2xl font-bold mb-4'>Accès non autorisé</h1>
				<p className='text-gray-600 mb-8'>
					Veuillez vous connecter pour accéder à la messagerie.
				</p>
				<Link
					to='/login'
					className='bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors duration-300'>
					Connexion
				</Link>
			</div>
		);
	}

	const currentMessages = filteredMessages;

	const renderName = (msg) => {
		if (activeTab === 'inbox') {
			return (
				msg.senderName || msg.sender?.firstName || msg.senderEmail || 'Inconnu'
			);
		}
		return (
			msg.recipientName ||
			msg.recipient?.firstName ||
			msg.recipientEmail ||
			'Inconnu'
		);
	};

	// Get message preview text
	const getMessagePreview = (msg) => {
		const content = msg.message || msg.content || '';
		return content.length > 100 ? content.substring(0, 100) + '...' : content;
	};

	const recipientOptions = [
		{ label: 'Administrateurs', options: recipients.admins || [] },
		{ label: 'Formateurs', options: recipients.instructors || [] },
		{ label: 'Étudiants', options: recipients.students || [] },
	];

	return (
		<div className='container mx-auto px-4 py-6 h-[calc(100vh-100px)] flex flex-col'>
			{/* Success message */}
			{success && (
				<div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center'>
					<span>{success}</span>
					<button
						onClick={() => setSuccess('')}
						className='text-green-700'>
						<MdClose size={20} />
					</button>
				</div>
			)}

			{/* Error message */}
			{error && (
				<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center'>
					<span>{error}</span>
					<button
						onClick={() => setError('')}
						className='text-red-700'>
						<MdClose size={20} />
					</button>
				</div>
			)}

			<div className='flex flex-col md:flex-row gap-4 flex-grow overflow-hidden'>
				{/* Sidebar */}
				<aside
					className={`${
						showSidebar ? 'w-full md:w-1/4 lg:w-1/5' : 'hidden'
					} flex flex-col border rounded-lg shadow-sm bg-white overflow-hidden`}>
					<div className='p-4 border-b bg-gray-50'>
						<button
							onClick={() => setShowNewMessageModal(true)}
							className='w-full bg-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center gap-2'>
							<MdSend /> Nouveau Message
						</button>
					</div>

					{/* Search box */}
					<div className='p-3 border-b'>
						<div className='relative'>
							<input
								type='text'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder='Rechercher des messages...'
								className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary'
							/>
							<MdSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl' />
						</div>
					</div>

					{/* Message categories */}
					<div className='p-2 border-b'>
						<button
							onClick={() => {
								setActiveTab('inbox');
								setActiveCategory('all');
								setSelectedMessage(null);
							}}
							className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
								activeTab === 'inbox' && activeCategory === 'all'
									? 'bg-blue-50 text-blue-700'
									: 'text-gray-700 hover:bg-gray-100'
							}`}>
							<MdInbox className='text-xl' /> Boîte de réception
							<span className='ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full'>
								{messages.length}
							</span>
						</button>

						<button
							onClick={() => {
								setActiveTab('inbox');
								setActiveCategory('unread');
								setSelectedMessage(null);
							}}
							className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
								activeTab === 'inbox' && activeCategory === 'unread'
									? 'bg-blue-50 text-blue-700'
									: 'text-gray-700 hover:bg-gray-100'
							}`}>
							<MdMarkEmailUnread className='text-xl' /> Non lus
							<span className='ml-auto bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full'>
								{messages.filter((m) => !m.read).length}
							</span>
						</button>

						<button
							onClick={() => {
								setActiveTab('sent');
								setActiveCategory('all');
								setSelectedMessage(null);
							}}
							className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
								activeTab === 'sent'
									? 'bg-blue-50 text-blue-700'
									: 'text-gray-700 hover:bg-gray-100'
							}`}>
							<MdOutbox className='text-xl' /> Messages envoyés
							<span className='ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full'>
								{sentMessages.length}
							</span>
						</button>
					</div>

					{/* Message list */}
					<div className='overflow-y-auto flex-grow'>
						{currentMessages.length === 0 ? (
							<div className='flex flex-col items-center justify-center h-40 p-4'>
								<div className='text-gray-400 mb-2'>
									{activeTab === 'inbox' ? (
										<MdInbox size={40} />
									) : (
										<MdOutbox size={40} />
									)}
								</div>
								<p className='text-gray-500 text-center'>
									{searchQuery
										? 'Aucun message ne correspond à votre recherche.'
										: activeTab === 'inbox'
										? 'Votre boîte de réception est vide.'
										: "Vous n'avez envoyé aucun message."}
								</p>
							</div>
						) : (
							currentMessages.map((msg) => (
								<div
									key={msg.id}
									onClick={() => openMessage(msg)}
									className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
										selectedMessage?.id === msg.id ? 'bg-blue-50' : 'bg-white'
									}`}>
									<div className='flex items-start gap-3'>
										{/* Avatar or icon */}
										<div
											className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
												activeTab === 'inbox' && !msg.read
													? 'bg-blue-100 text-blue-600'
													: 'bg-gray-100 text-gray-600'
											}`}>
											{activeTab === 'inbox' ? (
												msg.senderType === 'admin' ? (
													<MdAdminPanelSettings size={20} />
												) : msg.senderType === 'instructor' ? (
													<MdSchool size={20} />
												) : (
													<MdPerson size={20} />
												)
											) : msg.recipientType === 'admin' ? (
												<MdAdminPanelSettings size={20} />
											) : msg.recipientType === 'instructor' ? (
												<MdSchool size={20} />
											) : (
												<MdPerson size={20} />
											)}
										</div>

										{/* Message content */}
										<div className='flex-grow min-w-0'>
											<div className='flex justify-between items-center mb-1'>
												<span
													className={`text-sm truncate max-w-[70%] ${
														activeTab === 'inbox' && !msg.read
															? 'font-semibold text-gray-900'
															: 'text-gray-700'
													}`}>
													{renderName(msg)}
												</span>
												<span className='text-xs text-gray-400 whitespace-nowrap'>
													{new Date(msg.timestamp).toLocaleDateString()}
												</span>
											</div>
											<h3
												className={`text-sm mb-1 truncate ${
													activeTab === 'inbox' && !msg.read
														? 'font-semibold text-gray-900'
														: 'font-medium text-gray-800'
												}`}>
												{msg.subject}
											</h3>
											<p className='text-xs text-gray-500 truncate'>
												{getMessagePreview(msg)}
											</p>
										</div>

										{/* Status indicators */}
										<div className='flex-shrink-0 flex flex-col items-center gap-2'>
											{activeTab === 'inbox' && !msg.read && (
												<span
													className='w-3 h-3 rounded-full bg-blue-600'
													title='Non lu'></span>
											)}
										</div>
									</div>
								</div>
							))
						)}
					</div>

					{/* Footer with refresh button */}
					<div className='p-2 border-t bg-gray-50 flex justify-center'>
						<button
							onClick={fetchMessages}
							title='Rafraîchir les messages'
							className='text-gray-500 hover:text-secondary p-2 rounded-full transition-colors duration-200'>
							<MdRefresh size={20} />
						</button>
					</div>
				</aside>

				{/* Main content area */}
				<main className='w-full md:w-3/4 lg:w-4/5 flex flex-col border rounded-lg shadow-sm bg-white overflow-hidden'>
					{selectedMessage ? (
						<div className='flex flex-col h-full'>
							{/* Message header */}
							<div className='p-4 border-b flex justify-between items-center bg-gray-50'>
								<div className='flex items-center gap-3'>
									<button
										onClick={closeMessage}
										className='md:hidden text-gray-500 hover:text-gray-700 p-1 rounded-full'>
										<MdArrowBack size={24} />
									</button>
									<div>
										<h2 className='text-lg font-semibold truncate max-w-md'>
											{selectedMessage.subject}
										</h2>
										<div className='flex items-center gap-2 text-sm text-gray-600'>
											<span>
												{activeTab === 'inbox' ? 'De' : 'À'}:{' '}
												<span className='font-medium'>
													{renderName(selectedMessage)}
												</span>
											</span>
											{activeTab === 'inbox' && selectedMessage.read && (
												<span className='text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full'>
													Lu
												</span>
											)}
										</div>
										<p className='text-xs text-gray-500'>
											{new Date(selectedMessage.timestamp).toLocaleString()}
										</p>
									</div>
								</div>

								{/* Action buttons */}
								<div className='flex items-center gap-1'>
									{activeTab === 'inbox' && (
										<button
											onClick={() => setIsReplying(true)}
											title='Répondre'
											className='text-gray-500 hover:text-secondary p-2 rounded-full transition-colors duration-200'>
											<MdReply size={20} />
										</button>
									)}

									{activeTab === 'inbox' && (
										<button
											onClick={() =>
												handleMarkAsRead(
													selectedMessage.id,
													!selectedMessage.read,
												)
											}
											title={
												selectedMessage.read
													? 'Marquer comme non lu'
													: 'Marquer comme lu'
											}
											className='text-gray-500 hover:text-secondary p-2 rounded-full transition-colors duration-200'>
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
										title='Supprimer le message'
										className='text-gray-500 hover:text-red-600 p-2 rounded-full transition-colors duration-200'>
										<MdDelete size={20} />
									</button>

									<button
										onClick={closeMessage}
										title='Fermer'
										className='hidden md:block text-gray-500 hover:text-gray-800 p-2 rounded-full transition-colors duration-200'>
										<MdClose size={20} />
									</button>
								</div>
							</div>

							{/* Message content */}
							<div className='p-6 overflow-y-auto flex-grow'>
								<div className='max-w-3xl mx-auto'>
									{/* Sender info card */}
									<div className='flex items-center gap-4 mb-6'>
										<div
											className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
												activeTab === 'inbox'
													? 'bg-blue-100 text-blue-600'
													: 'bg-gray-100 text-gray-600'
											}`}>
											{activeTab === 'inbox' ? (
												selectedMessage.senderType === 'admin' ? (
													<MdAdminPanelSettings size={24} />
												) : selectedMessage.senderType === 'instructor' ? (
													<MdSchool size={24} />
												) : (
													<MdPerson size={24} />
												)
											) : selectedMessage.recipientType === 'admin' ? (
												<MdAdminPanelSettings size={24} />
											) : selectedMessage.recipientType === 'instructor' ? (
												<MdSchool size={24} />
											) : (
												<MdPerson size={24} />
											)}
										</div>
										<div>
											<h3 className='font-medium'>
												{renderName(selectedMessage)}
											</h3>
											<p className='text-sm text-gray-500'>
												{activeTab === 'inbox'
													? selectedMessage.senderEmail
													: selectedMessage.recipientEmail || ''}
											</p>
										</div>
									</div>

									{/* Message body */}
									<div className='prose max-w-none whitespace-pre-wrap text-gray-800 mb-8'>
										{selectedMessage.message || selectedMessage.content}
									</div>

									{/* Reply form */}
									{isReplying && activeTab === 'inbox' && (
										<div className='mt-6 border-t pt-6'>
											<h3 className='font-medium mb-3 flex items-center gap-2'>
												<MdReply /> Répondre à {renderName(selectedMessage)}
											</h3>
											<form onSubmit={handleReply}>
												<textarea
													value={replyContent}
													onChange={(e) => setReplyContent(e.target.value)}
													placeholder='Votre réponse...'
													rows={6}
													className='w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary'
													required></textarea>
												<div className='flex justify-end gap-3 mt-3'>
													<button
														type='button'
														onClick={() => {
															setIsReplying(false);
															setReplyContent('');
														}}
														className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200'>
														Annuler
													</button>
													<button
														type='submit'
														disabled={sending || !replyContent.trim()}
														className='px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'>
														{sending ? 'Envoi en cours...' : 'Envoyer'}
														{!sending && <MdSend />}
													</button>
												</div>
											</form>
										</div>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className='flex flex-col items-center justify-center h-full p-8 text-gray-500'>
							<div className='text-gray-300 mb-4'>
								<MdEmail size={64} />
							</div>
							<h3 className='text-xl font-medium mb-2'>
								Aucun message sélectionné
							</h3>
							<p className='text-center max-w-md'>
								Sélectionnez un message dans la liste pour le lire ou cliquez
								sur "Nouveau Message" pour en rédiger un.
							</p>
						</div>
					)}
				</main>

				{/* New Message Modal */}
				<AnimatePresence>
					{showNewMessageModal && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
							onClick={closeNewMessageModal}>
							<motion.div
								initial={{ scale: 0.9, y: 20 }}
								animate={{ scale: 1, y: 0 }}
								exit={{ scale: 0.9, y: 20 }}
								className='bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden'
								onClick={(e) => e.stopPropagation()}>
								<form onSubmit={handleSendMessage}>
									<div className='p-6 border-b flex justify-between items-center bg-gray-50'>
										<h2 className='text-xl font-semibold flex items-center gap-2'>
											<MdSend className='text-secondary' /> Nouveau Message
										</h2>
										<button
											type='button'
											onClick={closeNewMessageModal}
											className='text-gray-400 hover:text-gray-600 p-1 rounded-full'>
											<MdClose size={24} />
										</button>
									</div>
									<div className='p-6 space-y-4'>
										{error && (
											<div className='bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg text-sm flex items-start'>
												<MdClose className='text-red-500 mr-2 mt-0.5 flex-shrink-0' />
												<span>{error}</span>
											</div>
										)}

										{/* Recipient selection */}
										<div>
											<label
												htmlFor='recipient'
												className='flex items-center gap-1 text-sm font-medium text-gray-700 mb-1'>
												<MdPerson className='text-secondary' /> Destinataire
											</label>
											<select
												id='recipient'
												value={selectedRecipientId}
												onChange={(e) => setSelectedRecipientId(e.target.value)}
												required
												className='w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary bg-white'>
												<option value=''>
													-- Sélectionnez un destinataire --
												</option>
												{recipientOptions.map(
													(group, index) =>
														group.options.length > 0 && (
															<optgroup
																key={index}
																label={group.label}>
																{group.options.map((recipient) => (
																	<option
																		key={recipient.id}
																		value={recipient.id}>
																		{recipient.firstName || ''}{' '}
																		{recipient.lastName || ''} (
																		{recipient.email})
																	</option>
																))}
															</optgroup>
														),
												)}
											</select>
										</div>

										{/* Subject field */}
										<div>
											<label
												htmlFor='subject'
												className='flex items-center gap-1 text-sm font-medium text-gray-700 mb-1'>
												<MdLabel className='text-secondary' /> Sujet
											</label>
											<input
												type='text'
												id='subject'
												value={subject}
												onChange={(e) => setSubject(e.target.value)}
												placeholder='Saisissez le sujet de votre message'
												required
												className='w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary'
											/>
										</div>

										{/* Message content */}
										<div>
											<label
												htmlFor='messageContent'
												className='flex items-center gap-1 text-sm font-medium text-gray-700 mb-1'>
												<MdMessage className='text-secondary' /> Message
											</label>
											<textarea
												id='messageContent'
												rows={8}
												value={messageContent}
												onChange={(e) => setMessageContent(e.target.value)}
												placeholder='Saisissez votre message ici...'
												required
												className='w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary'
											/>
										</div>
									</div>

									{/* Action buttons */}
									<div className='p-4 bg-gray-50 flex justify-end gap-3 border-t'>
										<button
											type='button'
											onClick={closeNewMessageModal}
											className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200'>
											Annuler
										</button>
										<button
											type='submit'
											disabled={sending}
											className='px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'>
											{sending ? 'Envoi en cours...' : 'Envoyer'}
											{!sending && <MdSend />}
										</button>
									</div>
								</form>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
};

export default MessagesPage;
