import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjectById, updateProject } from "../services/projectService";
import { getAllTags } from "../services/userService";
import TagInput from "../components/TagInput";
import { SUGGESTED_INTERESTS, SUGGESTED_SKILLS } from "../utils/constants";
import { getFileUrl, formatFileSize, isImageFile } from "../utils/fileUrl";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB, must match server/middleware/uploadMiddleware.js
const ACCEPTED_TYPES =
  "image/png,image/jpeg,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// API gives deadline as a full ISO datetime; <input type="date"> needs YYYY-MM-DD.
const toDateInputValue = (isoString) => (isoString ? isoString.slice(0, 10) : "");

const EditProjectPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);
  const [wasApproved, setWasApproved] = useState(false);
  const [form, setForm] = useState(null);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState({
    tags: SUGGESTED_INTERESTS,
    skills: SUGGESTED_SKILLS,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const project = await getProjectById(id);
        if (project.owner?._id !== user?._id) {
          setNotAllowed(true);
          return;
        }
        setWasApproved(project.approvalStatus === "approved");
        setForm({
          title: project.title,
          description: project.description,
          tags: project.tags || [],
          requiredSkills: project.requiredSkills || [],
          maxCollaborators: project.maxCollaborators || 5,
          deadline: toDateInputValue(project.deadline),
        });
        setExistingAttachments(project.attachments || []);
      } catch {
        setNotAllowed(true);
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [id, user]);

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

  const remainingSlots = MAX_FILES - (existingAttachments.length - removedIds.length);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFileError("");

    if (selected.length > remainingSlots) {
      setFileError(`You can only add ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"} (max ${MAX_FILES} total).`);
      return;
    }
    const oversized = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setFileError(`"${oversized.name}" is larger than 5MB.`);
      return;
    }
    setNewFiles(selected);
  };

  const toggleRemoveExisting = (attachmentId) => {
    setRemovedIds((prev) =>
      prev.includes(attachmentId) ? prev.filter((i) => i !== attachmentId) : [...prev, attachmentId]
    );
    setFileError("");
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateProject(id, {
        ...form,
        files: newFiles,
        removedAttachmentIds: removedIds,
      });
      navigate(`/projects/${updated._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  if (notAllowed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <div className="card p-8">
          <p className="text-sm text-slate-600">
            You don't have permission to edit this project (or it doesn't exist).
          </p>
          <Link to="/projects" className="btn-secondary mt-4 inline-flex">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Edit project</h1>
      <p className="mb-6 text-slate-500">
        {wasApproved
          ? "This project is currently live. Changing the title, description, or tags will send it back for admin review before it's visible to others again."
          : "Update your project details below."}
      </p>

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
          <label className="mb-1 block text-sm font-medium text-slate-700">Attachments</label>

          {existingAttachments.length > 0 && (
            <ul className="mb-2 space-y-1">
              {existingAttachments.map((file) => {
                const isRemoved = removedIds.includes(file._id);
                return (
                  <li
                    key={file._id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs ${
                      isRemoved
                        ? "border-red-200 bg-red-50 text-red-400 line-through"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <a
                      href={getFileUrl(file.url)}
                      target="_blank"
                      rel="noreferrer"
                      className={isRemoved ? "pointer-events-none truncate" : "truncate hover:underline"}
                    >
                      {file.filename} <span className="text-slate-400">({formatFileSize(file.size)})</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => toggleRemoveExisting(file._id)}
                      className={`ml-2 shrink-0 font-medium ${
                        isRemoved ? "text-slate-500 hover:text-slate-700" : "text-red-500 hover:text-red-700"
                      }`}
                    >
                      {isRemoved ? "Undo" : "Remove"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {remainingSlots > 0 ? (
            <input
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
            />
          ) : (
            <p className="text-xs text-slate-400">
              Max {MAX_FILES} attachments reached — remove one above to add another.
            </p>
          )}
          <p className="mt-1 text-xs text-slate-400">
            Up to {MAX_FILES} files total, 5MB each. Images, PDF, Word docs, or plain text.
          </p>
          {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
          {newFiles.length > 0 && (
            <ul className="mt-2 space-y-1">
              {newFiles.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs text-primary-700"
                >
                  <span className="truncate">
                    {f.name} <span className="text-primary-400">({formatSize(f.size)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
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
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProjectPage;
