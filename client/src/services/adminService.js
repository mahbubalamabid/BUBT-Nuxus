import api from "./api";

export const adminLogin = async (credentials) => {
  const { data } = await api.post("/admin/login", credentials);
  return data.data;
};

export const getDashboardStats = async () => {
  const { data } = await api.get("/admin/stats");
  return data.data;
};

export const getPendingProjects = async () => {
  const { data } = await api.get("/admin/projects/pending");
  return data.data;
};

export const getAllProjectsAdmin = async (params) => {
  const { data } = await api.get("/admin/projects", { params });
  return data.data;
};

export const approveProject = async (id) => {
  const { data } = await api.put(`/admin/projects/${id}/approve`);
  return data.data;
};

export const rejectProject = async (id, reason) => {
  const { data } = await api.put(`/admin/projects/${id}/reject`, { reason });
  return data.data;
};

export const deleteProjectAdmin = async (id) => {
  const { data } = await api.delete(`/admin/projects/${id}`);
  return data;
};

export const getAllUsersAdmin = async (params) => {
  const { data } = await api.get("/admin/users", { params });
  return data.data;
};

export const toggleUserActive = async (id) => {
  const { data } = await api.put(`/admin/users/${id}/toggle-active`);
  return data.data;
};
