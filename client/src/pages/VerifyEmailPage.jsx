import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { verifyEmail } from "../services/authService";
import { useAuth } from "../context/AuthContext";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const { completeVerification } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const data = await verifyEmail(token);
        await completeVerification(data);
        setStatus("success");
        setTimeout(() => navigate("/"), 1500);
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "This verification link is invalid or has expired."
        );
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-6 text-center">
        {status === "verifying" && (
          <>
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-sm text-slate-600">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-2xl">
              ✅
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Email verified!</h2>
            <p className="mt-2 text-sm text-slate-600">
              Taking you to your dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-2xl">
              ⚠️
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Verification failed
            </h2>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <Link to="/login" className="btn-secondary mt-5 inline-flex">
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
