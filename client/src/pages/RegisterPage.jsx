import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";
import PasswordInput from "../components/PasswordInput";
import { DEPARTMENTS } from "../utils/constants";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    departmentOther: "",
    studentOrEmployeeId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const department =
        form.department === "Other" ? form.departmentOther.trim() : form.department;
      const data = await register({ ...form, department });
      setSubmittedEmail(data.email);
      setInfoMessage(data.message || "");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (submittedEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-md p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-2xl">
            ✉️
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Check your email</h2>
          <p className="mt-2 text-sm text-slate-600">
            We've sent a verification link to <strong>{submittedEmail}</strong>. Click
            it to activate your account, then come back and sign in.
          </p>
          {infoMessage && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {infoMessage}
            </p>
          )}
          <Link to="/login" className="btn-primary mt-5 inline-flex">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
            BN
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Join BUBT Nexus</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create your research profile and start collaborating
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <GoogleSignInButton />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">or register with email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input required className="input-field" value={form.name} onChange={update("name")} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={update("email")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <PasswordInput
              required
              minLength={6}
              value={form.password}
              onChange={update("password")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <select className="input-field" value={form.role} onChange={update("role")}>
                <option value="student">Student</option>
                <option value="researcher">Researcher</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ID (optional)
              </label>
              <input
                className="input-field"
                value={form.studentOrEmployeeId}
                onChange={update("studentOrEmployeeId")}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Department
            </label>
            <select className="input-field" value={form.department} onChange={update("department")}>
              <option value="" disabled>
                Select department
              </option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {form.department === "Other" && (
              <input
                className="input-field mt-2"
                placeholder="Enter your department"
                value={form.departmentOther}
                onChange={update("departmentOther")}
              />
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
