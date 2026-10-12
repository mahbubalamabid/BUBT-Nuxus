import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile, getAllTags } from "../services/userService";
import TagInput from "../components/TagInput";
import { DEPARTMENTS, SUGGESTED_INTERESTS, SUGGESTED_SKILLS } from "../utils/constants";

const EditProfilePage = () => {
  const { user, updateLocalUser } = useAuth();
  const navigate = useNavigate();
  const isKnownDepartment = DEPARTMENTS.includes(user?.department);
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    department: isKnownDepartment ? user.department : user?.department ? "Other" : "",
    departmentOther: isKnownDepartment ? "" : user?.department || "",
    studentOrEmployeeId: user?.studentOrEmployeeId || "",
    interests: user?.interests || [],
    skills: user?.skills || [],
    isAvailableForCollab: user?.isAvailableForCollab ?? true,
    links: {
      googleScholar: user?.links?.googleScholar || "",
      linkedin: user?.links?.linkedin || "",
      website: user?.links?.website || "",
    },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState({
    interests: SUGGESTED_INTERESTS,
    skills: SUGGESTED_SKILLS,
  });

  // Merge the curated suggestion lists with tags already in use across the
  // platform, so the picker reflects what real researchers have actually added.
  useEffect(() => {
    const loadTags = async () => {
      try {
        const { interests, skills } = await getAllTags();
        setTagSuggestions({
          interests: Array.from(new Set([...SUGGESTED_INTERESTS, ...interests])),
          skills: Array.from(new Set([...SUGGESTED_SKILLS, ...skills])),
        });
      } catch {
        // fall back to curated defaults if this fails - non-critical
      }
    };
    loadTags();
  }, []);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const updateLink = (field) => (e) =>
    setForm({ ...form, links: { ...form.links, [field]: e.target.value } });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const department =
        form.department === "Other" ? form.departmentOther.trim() : form.department;
      const updated = await updateProfile({ ...form, department });
      updateLocalUser(updated);
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit your profile</h1>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
          <input className="input-field" value={form.name} onChange={update("name")} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Bio</label>
          <textarea
            rows={4}
            className="input-field"
            placeholder="Tell others about your research background and goals..."
            value={form.bio}
            onChange={update("bio")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
            <select className="input-field" value={form.department} onChange={update("department")}>
              <option value="" disabled>
                Select your department
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
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Student/Employee ID
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
            Research interests
          </label>
          <TagInput
            value={form.interests}
            onChange={(interests) => setForm({ ...form, interests })}
            placeholder="e.g. natural language processing, robotics..."
            suggestions={tagSuggestions.interests}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Skills</label>
          <TagInput
            value={form.skills}
            onChange={(skills) => setForm({ ...form, skills })}
            placeholder="e.g. python, data analysis, latex..."
            suggestions={tagSuggestions.skills}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Google Scholar
            </label>
            <input
              className="input-field"
              value={form.links.googleScholar}
              onChange={updateLink("googleScholar")}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">LinkedIn</label>
            <input
              className="input-field"
              value={form.links.linkedin}
              onChange={updateLink("linkedin")}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Website</label>
            <input
              className="input-field"
              value={form.links.website}
              onChange={updateLink("website")}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isAvailableForCollab}
            onChange={(e) =>
              setForm({ ...form, isAvailableForCollab: e.target.checked })
            }
          />
          I'm currently open to new collaborations
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfilePage;
