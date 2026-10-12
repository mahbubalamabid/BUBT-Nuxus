import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

const AdminLoginPage = () => {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAdmin(form);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700 text-lg font-bold text-white">
            🛡
          </div>
          <h1 className="text-2xl font-bold text-white">BUBT Nexus Admin</h1>
          <p className="mt-1 text-sm text-slate-400">
            Restricted access — administrators only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 bg-slate-800 p-6 border-slate-700">
          {error && (
            <div className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Admin email
            </label>
            <input
              type="email"
              required
              className="input-field bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@bubtnexus.edu"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Password
            </label>
            <PasswordInput
              required
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in to admin panel"}
          </button>

          <p className="text-center text-xs text-slate-500">
            This is a separate login from regular user accounts.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
