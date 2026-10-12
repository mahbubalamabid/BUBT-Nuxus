import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Renders Google's official "Continue with Google" button and completes
 * sign-in by sending the resulting ID token to our backend for verification.
 * Requires VITE_GOOGLE_CLIENT_ID to be set and the GSI script
 * (https://accounts.google.com/gsi/client) loaded in index.html.
 */
const GoogleSignInButton = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    const handleCredentialResponse = async (response) => {
      setError("");
      try {
        await loginWithGoogle(response.credential);
        navigate("/");
      } catch (err) {
        setError(err.response?.data?.message || "Google sign-in failed");
      }
    };

    const renderButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
        text: "continue_with",
      });
    };

    // The GSI script loads async - poll briefly until it's ready.
    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderButton();
        }
      }, 200);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-center text-xs text-slate-500">
        "Continue with Google" isn't set up yet — add{" "}
        <code className="rounded bg-slate-200 px-1 py-0.5">VITE_GOOGLE_CLIENT_ID</code>{" "}
        to <code className="rounded bg-slate-200 px-1 py-0.5">client/.env</code>{" "}
        to enable it (see README).
      </div>
    );
  }

  return (
    <div>
      <div ref={buttonRef} className="flex w-full justify-center" />
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default GoogleSignInButton;
