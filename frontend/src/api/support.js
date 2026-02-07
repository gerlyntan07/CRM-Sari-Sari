// frontend/src/api/support.js
import api from "../api";

// ==================== Support Tickets ====================

export const createSupportTicket = async (ticketData) => {
  const response = await api.post("/support/tickets", ticketData);
  return response.data;
};

export const getSupportTickets = async (params = {}) => {
  const response = await api.get("/support/tickets", { params });
  return response.data;
};

export const getSupportTicket = async (ticketId) => {
  const response = await api.get(`/support/tickets/${ticketId}`);
  return response.data;
};

export const updateSupportTicket = async (ticketId, ticketData) => {
  const response = await api.put(`/support/tickets/${ticketId}`, ticketData);
  return response.data;
};

export const deleteSupportTicket = async (ticketId) => {
  const response = await api.delete(`/support/tickets/${ticketId}`);
  return response.data;
};

export const bulkDeleteSupportTickets = async (ticketIds) => {
  const response = await api.post("/support/tickets/bulk-delete", { ticket_ids: ticketIds });
  return response.data;
};

// ==================== Chat Sessions ====================

export const createChatSession = async (sessionData = {}) => {
  const response = await api.post("/support/chat/sessions", sessionData);
  return response.data;
};

export const getChatSessions = async (params = {}) => {
  const response = await api.get("/support/chat/sessions", { params });
  return response.data;
};

export const getActiveChatSessions = async () => {
  const response = await api.get("/support/chat/sessions/active");
  return response.data;
};

export const assignChatSession = async (sessionId) => {
  const response = await api.put(`/support/chat/sessions/${sessionId}/assign`);
  return response.data;
};

export const closeChatSession = async (sessionId) => {
  const response = await api.put(`/support/chat/sessions/${sessionId}/close`);
  return response.data;
};

// ==================== Chat Messages ====================

export const sendChatMessage = async (messageData) => {
  const response = await api.post("/support/chat/messages", messageData);
  return response.data;
};

export const getChatMessages = async (sessionId) => {
  const response = await api.get(`/support/chat/messages/${sessionId}`);
  return response.data;
};

// ==================== Subscriptions ====================

export const getOverdueSubscriptions = async () => {
  const response = await api.get("/support/subscriptions/overdue");
  return response.data;
};

export const getAllSubscriptions = async () => {
  const response = await api.get("/support/subscriptions/all");
  return response.data;
};

export const sendOverdueEmail = async (subscriptionId) => {
  const response = await api.post(`/support/subscriptions/${subscriptionId}/send-overdue-email`);
  return response.data;
};

export const updateSubscriptionStatus = async (subscriptionId, status) => {
  const response = await api.put(`/support/subscriptions/${subscriptionId}/update-status`, null, {
    params: { status }
  });
  return response.data;
};

// ==================== Stats ====================

export const getSupportStats = async () => {
  const response = await api.get("/support/stats");
  return response.data;
};

// ==================== Team Members ====================

export const getAdminTeamMembers = async () => {
  const response = await api.get("/support/team/members");
  return response.data;
};

// ==================== WebSocket Helper ====================

export const getWebSocketUrl = (sessionId, userId, isSupport = false) => {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = "localhost:8000"; // Update for production
  return `${wsProtocol}//${host}/api/support/ws/chat/${sessionId}?user_id=${userId}&is_support=${isSupport}`;
};
