import api from "./api";

export const getConversations = async () => {
  const { data } = await api.get("/messages/conversations");
  return data.data;
};

export const startConversation = async (userId) => {
  const { data } = await api.post("/messages/conversations", { userId });
  return data.data;
};

export const getMessages = async (conversationId) => {
  const { data } = await api.get(`/messages/${conversationId}`);
  return data.data;
};

export const sendMessage = async (conversationId, text) => {
  const { data } = await api.post(`/messages/${conversationId}`, { text });
  return data.data;
};
