import api from "./api";

export const register = async (payload) => {
  const { data } = await api.post("/auth/register", payload);
  return { ...data.data, message: data.message };
};

export const login = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data.data;
};

export const getMe = async () => {
  const { data } = await api.get("/auth/me");
  return data.data;
};

export const verifyEmail = async (token) => {
  const { data } = await api.get(`/auth/verify-email/${token}`);
  return data.data;
};

export const resendVerification = async (email) => {
  const { data } = await api.post("/auth/resend-verification", { email });
  return data;
};

export const googleAuth = async (credential) => {
  const { data } = await api.post("/auth/google", { credential });
  return data.data;
};
