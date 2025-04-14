import { getDatabase, ref, get, set, update, remove, push, query, orderByChild, equalTo } from 'firebase/database';

// Get all received messages for a user
export const getReceivedMessages = async (userId) => {
  try {
    const database = getDatabase();
    const messagesRef = ref(database, 'elearning/messages');
    const userMessagesQuery = query(messagesRef, orderByChild('recipientId'), equalTo(userId));
    const snapshot = await get(userMessagesQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      if (!message.archived) {
        messages.push({
          id: childSnapshot.key,
          ...message
        });
      }
    });
    
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting received messages:', error);
    throw error;
  }
};

// Get all sent messages for a user
export const getSentMessages = async (userId) => {
  try {
    const database = getDatabase();
    const messagesRef = ref(database, 'elearning/messages');
    const userMessagesQuery = query(messagesRef, orderByChild('senderId'), equalTo(userId));
    const snapshot = await get(userMessagesQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      if (!message.archived) {
        messages.push({
          id: childSnapshot.key,
          ...message
        });
      }
    });
    
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting sent messages:', error);
    throw error;
  }
};

// Get all archived messages for a user
export const getArchivedMessages = async (userId) => {
  try {
    const database = getDatabase();
    const messagesRef = ref(database, 'elearning/messages');
    const snapshot = await get(messagesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      if (
        message.archived && 
        (message.senderId === userId || message.recipientId === userId)
      ) {
        messages.push({
          id: childSnapshot.key,
          ...message
        });
      }
    });
    
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting archived messages:', error);
    throw error;
  }
};

// Send a new message
export const sendMessage = async (message) => {
  try {
    const database = getDatabase();
    const messagesRef = ref(database, 'elearning/messages');
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
      ...message,
      timestamp: Date.now(),
      read: false,
      archived: false
    });
    
    return newMessageRef.key;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Mark a message as read
export const markMessageAsRead = async (messageId) => {
  try {
    const database = getDatabase();
    const messageRef = ref(database, `elearning/messages/${messageId}`);
    
    await update(messageRef, {
      read: true
    });
    
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Archive a message
export const archiveMessage = async (messageId) => {
  try {
    const database = getDatabase();
    const messageRef = ref(database, `elearning/messages/${messageId}`);
    
    await update(messageRef, {
      archived: true
    });
    
    return true;
  } catch (error) {
    console.error('Error archiving message:', error);
    throw error;
  }
};

// Restore a message from archive
export const restoreMessage = async (messageId) => {
  try {
    const database = getDatabase();
    const messageRef = ref(database, `elearning/messages/${messageId}`);
    
    await update(messageRef, {
      archived: false
    });
    
    return true;
  } catch (error) {
    console.error('Error restoring message:', error);
    throw error;
  }
};

// Delete a message permanently
export const deleteMessage = async (messageId) => {
  try {
    const database = getDatabase();
    const messageRef = ref(database, `elearning/messages/${messageId}`);
    
    await remove(messageRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Get all users for message recipients
export const getMessageRecipients = async (currentUserId) => {
  try {
    const database = getDatabase();
    const usersRef = ref(database, 'elearning/users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      return { admins: [], instructors: [], students: [] };
    }
    
    const recipients = {
      admins: [],
      instructors: [],
      students: []
    };
    
    snapshot.forEach((childSnapshot) => {
      const user = childSnapshot.val();
      const userId = childSnapshot.key;
      
      // Don't include current user in recipients
      if (userId === currentUserId) {
        return;
      }
      
      const userInfo = {
        id: userId,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'student'
      };
      
      if (user.role === 'admin') {
        recipients.admins.push(userInfo);
      } else if (user.role === 'instructor') {
        recipients.instructors.push(userInfo);
      } else {
        recipients.students.push(userInfo);
      }
    });
    
    return recipients;
  } catch (error) {
    console.error('Error getting message recipients:', error);
    throw error;
  }
};
