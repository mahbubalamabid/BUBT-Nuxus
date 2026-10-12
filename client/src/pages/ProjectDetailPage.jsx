import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjectById, deleteProject, updateProject } from "../services/projectService";
import { sendCollabRequest } from "../services/collabService";
import { getFileUrl, formatFileSize, isImageFile } from "../utils/fileUrl";

const statusStyles = {
  open: "bg-green-50 text-green-700",
  "in-progress": "bg-amber-50 text-amber-700",
  closed: "bg-slate-100 text-slate-600",
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestMessage, setRequestMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getProjectById(id);
        setProject(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const isOwner = project?.owner?._id === user?._id;
  const isCollaborator = project?.collaborators?.some((c) => c._id === user?._id);

  const handleRequest = async () => {
    setSending(true);
    setError("");
    try {
      await sendCollabRequest({ projectId: id, message: requestMessage });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    await deleteProject(id);
    navigate("/projects");
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatusUpdating(true);
    try {
      const updated = await updateProject(id, { status: newStatus });
      setProject((prev) => ({ ...prev, status: updated.status }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;
  if (!project) return <div className="py-20 text-center text-slate-400">Project not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
          {isOwner ? (
            <select
              value={project.status}
              onChange={handleStatusChange}
              disabled={statusUpdating}
              className={`shrink-0 rounded-full border-0 px-3 py-1 text-xs font-semibold ${
                statusStyles[project.status] || statusStyles.open
              }`}
            >
              <option value="open">open</option>
              <option value="in-progress">in-progress</option>
              <option value="closed">closed</option>
            </select>
          ) : (
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                statusStyles[project.status] || statusStyles.open
              }`}
            >
              {project.status}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <Link to={`/profile/${project.owner?._id}`} className="hover:underline">
            Posted by {project.owner?.name}
          </Link>
          <span>·</span>
          <span>{project.owner?.department}</span>
        </div>

        {project.approvalStatus === "pending" && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Awaiting admin approval.</strong> This project is only visible to
            you right now — it'll appear to others once an admin approves it.
          </div>
        )}
        {project.approvalStatus === "rejected" && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            <strong>Rejected by admin.</strong>{" "}
            {project.rejectionReason || "No reason was provided."} Edit the project to
            resubmit it for review.
          </div>
        )}

        <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {project.description}
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Interest tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {project.tags?.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Required skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {project.requiredSkills?.map((tag) => (
                <span key={tag} className="skill-pill">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {project.collaborators?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Collaborators</h3>
            <div className="flex flex-wrap gap-2">
              {project.collaborators.map((c) => (
                <Link
                  key={c._id}
                  to={`/profile/${c._id}`}
                  className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-sm hover:bg-slate-50"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {project.attachments?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Attachments</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {project.attachments.map((file, i) =>
                isImageFile(file.mimetype) ? (
                  <a
                    key={i}
                    href={getFileUrl(file.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg border border-slate-200 hover:opacity-90"
                  >
                    <img
                      src={getFileUrl(file.url)}
                      alt={file.filename}
                      className="h-32 w-full object-cover"
                    />
                    <div className="truncate px-2 py-1.5 text-xs text-slate-600">
                      {file.filename}
                    </div>
                  </a>
                ) : (
                  <a
                    key={i}
                    href={getFileUrl(file.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <span className="text-lg">📎</span>
                    <span className="min-w-0 flex-1 truncate text-slate-700">{file.filename}</span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatFileSize(file.size)}
                    </span>
                  </a>
                )
              )}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5">
          {isOwner ? (
            <div>
              <div className="flex gap-3">
                <span className="text-sm text-slate-500">
                  You own this project.{" "}
                  <Link to="/requests" className="text-primary-600 hover:underline">
                    View collaboration requests
                  </Link>
                </span>
                <Link
                  to={`/projects/${id}/edit`}
                  className="ml-auto text-sm font-medium text-primary-600 hover:underline"
                >
                  Edit project
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Delete project
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Use the status dropdown above to update this project as it moves along —{" "}
                <strong>open</strong> (still looking for collaborators),{" "}
                <strong>in-progress</strong> (team is set, work has started), or{" "}
                <strong>closed</strong> (finished, or no longer accepting collaborators).
                This is separate from admin approval and only affects how the project is
                labeled.
              </p>
            </div>
          ) : isCollaborator ? (
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              You're a collaborator on this project.
            </div>
          ) : sent ? (
            <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-700">
              Your collaboration request has been sent.
            </div>
          ) : !user ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">
                Sign in to request collaboration on this project.
              </span>
              <Link
                to="/login"
                state={{ from: `/projects/${id}` }}
                className="btn-primary shrink-0 !py-1.5 !text-xs"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Request to collaborate
              </h3>
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              <textarea
                rows={3}
                className="input-field"
                placeholder="Introduce yourself and explain how you can contribute..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
              />
              <button onClick={handleRequest} disabled={sending} className="btn-primary">
                {sending ? "Sending..." : "Send collaboration request"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
