import api from "./api";

export const getUsers = async (params) => {
  const { data } = await api.get("/users", { params });
  return data;
};

export const getUserById = async (id) => {
  const { data } = await api.get(`/users/${id}`);
  return data.data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put("/users/profile", payload);
  return data.data;
};

export const getAllTags = async () => {
  const { data } = await api.get("/users/meta/tags");
  return data.data;
};
