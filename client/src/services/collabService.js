import api from "./api";

export const sendCollabRequest = async (payload) => {
  const { data } = await api.post("/collab-requests", payload);
  return data.data;
};

export const getReceivedRequests = async () => {
  const { data } = await api.get("/collab-requests/received");
  return data.data;
};

export const getSentRequests = async () => {
  const { data } = await api.get("/collab-requests/sent");
  return data.data;
};

export const respondToRequest = async (id, status) => {
  const { data } = await api.put(`/collab-requests/${id}`, { status });
  return data.data;
};
