import api from './index';
import { getGuestSessionId } from '../utils/guestSessionStorage';
import { compressFileIfNeeded } from '../utils/imageCompression';

// Helper to add guestSessionId to request data
const addGuestSessionId = (data = {}) => {
  const guestSessionId = getGuestSessionId();
  if (guestSessionId) {
    return { ...data, guestSessionId };
  }
  return data;
};

export const uploadChatAttachment = async (chatId, file) => {
  const formData = new FormData();
  formData.append("file", await compressFileIfNeeded(file));
  const guestSessionId = getGuestSessionId();
  const response = await api.post(`/chats/${chatId}/attachments`, formData, {
    params: guestSessionId ? { guestSessionId } : {},
    headers: { "Content-Type": "multipart/form-data" }, timeout: 60000,
  });
  return response.data.data;
};

export const startChat = async (data) => {
    const payload = addGuestSessionId(data);
    const response = await api.post('/chats', payload);
    return response.data;
};

export const getMyChats = async ({ page = 1, limit = 20, status } = {}) => {
    const params = new URLSearchParams();
    const guestSessionId = getGuestSessionId();
    if (guestSessionId) params.append('guestSessionId', guestSessionId);
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);

    const response = await api.get(`/chats/my?${params}`);
    return response.data;
};

export const getChatDetails = async (chatId) => {
    const guestSessionId = getGuestSessionId();
    const response = await api.get(`/chats/${chatId}`, {
      params: guestSessionId ? { guestSessionId } : undefined,
    });
    return response.data;
};

export const getChatMessages = async ({ chatId, page = 1, limit = 50 }) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    
    // Add guest session ID if guest
    const guestSessionId = getGuestSessionId();
    if (guestSessionId) {
      params.append('guestSessionId', guestSessionId);
    }

    const response = await api.get(`/chats/${chatId}/messages?${params}`);
    return response.data;
};

export const sendMessage = async ({ chatId, content, attachments, clientMessageId }) => {
    // Attachments are now just metadata with Cloudinary URLs (already uploaded)
    const payload = { content, attachments: attachments || [], clientMessageId, ...addGuestSessionId() };
    const response = await api.post(`/chats/${chatId}/messages`, payload);
    return response.data;
};

export const markMessagesAsRead = async (chatId) => {
    const payload = addGuestSessionId();
    const response = await api.patch(`/chats/${chatId}/read`, payload);
    return response.data;
};

export const closeChat = async (chatId) => {
    const response = await api.patch(`/chats/${chatId}/close`, addGuestSessionId());
    return response.data;
};

export const getAllChats = async ({ page = 1, limit = 20, status, priority, sortBy = 'lastMessageAt' } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    params.append('sortBy', sortBy);

    const response = await api.get(`/chats/admin/all?${params}`);
    return response.data;
};

export const getWaitingQueue = async () => {
    const response = await api.get('/chats/admin/queue');
    return response.data;
};

export const resolveChat = async (chatId) => {
    const response = await api.patch(`/chats/${chatId}/resolve`);
    return response.data;
};

export const getChatStats = async () => {
    const response = await api.get('/chats/admin/stats');
    return response.data;
};

export const toggleBot = async ({ chatId, botActive }) => {
    const response = await api.patch(`/chats/${chatId}/toggle-bot`, { botActive });
    return response.data;
};

/**
 * Update message attachments with real Cloudinary URLs after upload completes
 * Syncs temporary blob URLs to permanent Cloudinary URLs in the database
 */
export const updateMessageAttachments = async (chatId, messageId, attachments) => {
    const payload = { 
        attachments: attachments || [], 
        ...addGuestSessionId() 
    };
    const response = await api.patch(`/chats/${chatId}/messages/${messageId}/attachments`, payload);
    return response.data;
};

export default {
    uploadChatAttachment,
    startChat,
    getMyChats,
    getChatDetails,
    getChatMessages,
    sendMessage,
    markMessagesAsRead,
    closeChat,
    getAllChats,
    getWaitingQueue,
    resolveChat,
    getChatStats,
    toggleBot,
    updateMessageAttachments,
};
