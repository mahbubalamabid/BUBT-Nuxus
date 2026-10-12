import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resendVerification } from "../services/authService";
import GoogleSignInButton from "../components/GoogleSignInButton";
import PasswordInput from "../components/PasswordInput";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState("idle"); // idle | sending | sent
  const [resendMessage, setResendMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setLoading(true);
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      if (err.response?.status === 403) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendState("sending");
    try {
      const res = await resendVerification(form.email);
      setResendMessage(res.message || "");
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
            BN
          </div>
          <h1 className="text-2xl font-bold text-slate-900">BUBT Nexus</h1>
          <p className="mt-1 text-sm text-slate-500">
            Find collaborators for your next research project
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Sign in to your account
          </h2>

          <GoogleSignInButton />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or sign in with email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
              {needsVerification && (
                <div className="mt-2">
                  {resendState === "sent" ? (
                    <span className="text-green-700">
                      {resendMessage || "Verification email sent — check your inbox."}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendState === "sending"}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {resendState === "sending" ? "Sending..." : "Resend verification email"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@bubt.edu.bd"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <PasswordInput
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-primary-600 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
