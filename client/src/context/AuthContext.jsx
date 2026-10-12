import { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../services/authService";
import * as adminService from "../services/adminService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("bubtnexus_token");
      const cachedUser = localStorage.getItem("bubtnexus_user");

      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
        } catch {
          // token invalid, interceptor will redirect
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    // The /login response only carries a few fields alongside the token.
    // Store the token first so the next request can authenticate, then pull
    // the complete profile (bio, interests, skills, publications, links...).
    localStorage.setItem("bubtnexus_token", data.token);
    const fullUser = await authService.getMe();
    const merged = { ...fullUser, token: data.token };
    localStorage.setItem("bubtnexus_user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  };

  const loginWithGoogle = async (credential) => {
    const data = await authService.googleAuth(credential);
    localStorage.setItem("bubtnexus_token", data.token);
    const fullUser = await authService.getMe();
    const merged = { ...fullUser, token: data.token };
    localStorage.setItem("bubtnexus_user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  };

  const loginAdmin = async (credentials) => {
    const data = await adminService.adminLogin(credentials);
    localStorage.setItem("bubtnexus_token", data.token);
    const fullUser = await authService.getMe();
    // Extra client-side check on top of the backend's own role gate - if
    // this ever mismatches, don't leave a token sitting around.
    if (fullUser.role !== "admin") {
      localStorage.removeItem("bubtnexus_token");
      throw new Error("Not an admin account");
    }
    const merged = { ...fullUser, token: data.token };
    localStorage.setItem("bubtnexus_user", JSON.stringify(merged));
    setUser(merged);
    return merged;
  };

  const register = async (payload) => {
    // Account is created unverified - no token is issued until the email link is clicked.
    const data = await authService.register(payload);
    return data;
  };

  // Called after a successful /verify-email/:token response, which does return a token.
  const completeVerification = async (data) => {
    localStorage.setItem("bubtnexus_token", data.token);
    const fullUser = await authService.getMe();
    const merged = { ...fullUser, token: data.token };
    localStorage.setItem("bubtnexus_user", JSON.stringify(merged));
    setUser(merged);
  };

  const logout = () => {
    const wasAdmin = user?.role === "admin";
    localStorage.removeItem("bubtnexus_token");
    localStorage.removeItem("bubtnexus_user");
    setUser(null);
    window.location.href = wasAdmin ? "/admin/login" : "/login";
  };

  const updateLocalUser = (updated) => {
    setUser((prev) => ({ ...prev, ...updated }));
    const cached = JSON.parse(localStorage.getItem("bubtnexus_user") || "{}");
    localStorage.setItem(
      "bubtnexus_user",
      JSON.stringify({ ...cached, ...updated })
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        loginAdmin,
        register,
        logout,
        updateLocalUser,
        completeVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
