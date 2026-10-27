import api from './index';
import { getGuestSessionId } from '../utils/guestSessionStorage';
import { compressFileIfNeeded } from '../utils/imageCompression';
import { validateChatFilesSniffed } from '../utils/chatAttachmentPolicy';

// Helper to add guestSessionId to request data
const addGuestSessionId = (data = {}) => {
  const guestSessionId = getGuestSessionId();
  if (guestSessionId) {
    return { ...data, guestSessionId };
  }
  return data;
};

// Helper for guest GET reads: the server resolves the session id from
// the x-guest-session-id header first (always accepted, not flag-gated);
// the query-string transport is off by default (server FA-33), so GET
// reads must never put the id in the URL.
const guestSessionHeaders = () => {
  const guestSessionId = getGuestSessionId();
  return guestSessionId ? { 'x-guest-session-id': guestSessionId } : undefined;
};

export const uploadChatAttachment = async (chatId, file, { signal, onProgress } = {}) => {
  // FE-11: validate the file's CONTENT (magic-byte sniff), not just
  // its declared type, before anything else — a spoofed file is
  // rejected here, before any network call.
  const originalError = await validateChatFilesSniffed([file]);
  if (originalError) throw new Error(originalError);
  const prepared = await compressFileIfNeeded(file);
  // FE-11: what is validated must be what is uploaded — re-validate
  // the post-compression substitute file with the same policy.
  const preparedError = await validateChatFilesSniffed([prepared]);
  if (preparedError) throw new Error(preparedError);
  const formData = new FormData();
  formData.append("file", prepared);
  const guestSessionId = getGuestSessionId();
  const response = await api.post(`/chats/${encodeURIComponent(chatId)}/attachments`, formData, {
    params: guestSessionId ? { guestSessionId } : {},
    headers: { "Content-Type": "multipart/form-data" }, timeout: 60000,
    // FE-31: callers upload in parallel and need per-file progress and
    // an abort path; both ride the axios config.
    signal,
    onUploadProgress: onProgress
      ? (event) => {
          if (event.total) onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        }
      : undefined,
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
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);

    const headers = guestSessionHeaders();
    const response = await api.get(`/chats/my?${params}`, headers ? { headers } : undefined);
    return response.data;
};

export const getChatDetails = async (chatId) => {
    const headers = guestSessionHeaders();
    const response = await api.get(`/chats/${encodeURIComponent(chatId)}`, headers ? { headers } : undefined);
    return response.data;
};

export const getChatMessages = async ({ chatId, page = 1, limit = 50 }) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);

    const headers = guestSessionHeaders();
    const response = await api.get(`/chats/${encodeURIComponent(chatId)}/messages?${params}`, headers ? { headers } : undefined);
    return response.data;
};

export const sendMessage = async ({ chatId, content, attachments, clientMessageId }) => {
    // Attachments are now just metadata with Cloudinary URLs (already uploaded)
    const payload = { content, attachments: attachments || [], clientMessageId, ...addGuestSessionId() };
    const response = await api.post(`/chats/${encodeURIComponent(chatId)}/messages`, payload);
    return response.data;
};

export const markMessagesAsRead = async (chatId) => {
    const payload = addGuestSessionId();
    const response = await api.patch(`/chats/${encodeURIComponent(chatId)}/read`, payload);
    return response.data;
};

export const closeChat = async (chatId) => {
    const response = await api.patch(`/chats/${encodeURIComponent(chatId)}/close`, addGuestSessionId());
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
    const response = await api.patch(`/chats/${encodeURIComponent(chatId)}/resolve`);
    return response.data;
};

export const getChatStats = async () => {
    const response = await api.get('/chats/admin/stats');
    return response.data;
};

export const toggleBot = async ({ chatId, botActive }) => {
    const response = await api.patch(`/chats/${encodeURIComponent(chatId)}/toggle-bot`, { botActive });
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
    const response = await api.patch(`/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/attachments`, payload);
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
