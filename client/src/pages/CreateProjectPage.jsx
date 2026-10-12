import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../services/projectService";
import { getAllTags } from "../services/userService";
import TagInput from "../components/TagInput";
import { SUGGESTED_INTERESTS, SUGGESTED_SKILLS } from "../utils/constants";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, must match server/middleware/uploadMiddleware.js
const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const CreateProjectPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    tags: [],
    requiredSkills: [],
    maxCollaborators: 5,
    deadline: "",
  });
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState({
    tags: SUGGESTED_INTERESTS,
    skills: SUGGESTED_SKILLS,
  });

  // Merge curated suggestions with tags already in use across researcher
  // profiles, so project tags line up with how people actually search.
  useEffect(() => {
    const loadTags = async () => {
      try {
        const { interests, skills } = await getAllTags();
        setSuggestions({
          tags: Array.from(new Set([...SUGGESTED_INTERESTS, ...interests])),
          skills: Array.from(new Set([...SUGGESTED_SKILLS, ...skills])),
        });
      } catch {
        // fall back to curated defaults if this fails - non-critical
      }
    };
    loadTags();
  }, []);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFileError("");

    if (selected.length > MAX_FILES) {
      setFileError(`You can attach at most ${MAX_FILES} files.`);
      return;
    }
    const oversized = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setFileError(`"${oversized.name}" is larger than 5MB.`);
      return;
    }
    setFiles(selected);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const project = await createProject({ ...form, files });
      navigate(`/projects/${project._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Post a research project</h1>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Project title</label>
          <input required className="input-field" value={form.title} onChange={update("title")} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            required
            rows={5}
            className="input-field"
            placeholder="Describe the project's goals, scope, and what kind of collaborators you need..."
            value={form.description}
            onChange={update("description")}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Interest tags</label>
          <TagInput
            value={form.tags}
            onChange={(tags) => setForm({ ...form, tags })}
            placeholder="e.g. computer vision, public health..."
            suggestions={suggestions.tags}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Required skills
          </label>
          <TagInput
            value={form.requiredSkills}
            onChange={(requiredSkills) => setForm({ ...form, requiredSkills })}
            placeholder="e.g. python, statistics, survey design..."
            suggestions={suggestions.skills}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Max collaborators
            </label>
            <input
              type="number"
              min={1}
              className="input-field"
              value={form.maxCollaborators}
              onChange={update("maxCollaborators")}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Deadline (optional)
            </label>
            <input
              type="date"
              className="input-field"
              value={form.deadline}
              onChange={update("deadline")}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Attachments (optional)
          </label>
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="mt-1 text-xs text-slate-400">
            Up to {MAX_FILES} files, 5MB each. Images, PDF, Word docs, or plain text.
          </p>
          {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                >
                  <span className="truncate">
                    {f.name} <span className="text-slate-400">({formatSize(f.size)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="ml-2 shrink-0 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={saving || !!fileError} className="btn-primary">
            {saving ? "Posting..." : "Post project"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
