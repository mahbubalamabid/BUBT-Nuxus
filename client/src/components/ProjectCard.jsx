import { useNavigate } from "react-router-dom";

const statusStyles = {
  open: "bg-green-50 text-green-700",
  "in-progress": "bg-amber-50 text-amber-700",
  closed: "bg-slate-100 text-slate-600",
};

const approvalStyles = {
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
};

const ProjectCard = ({ project, showApprovalStatus = false }) => {
  const navigate = useNavigate();
  const showApprovalBadge =
    showApprovalStatus && project.approvalStatus && project.approvalStatus !== "approved";

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      className="card cursor-pointer p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{project.title}</h3>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {showApprovalBadge && (
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                approvalStyles[project.approvalStatus]
              }`}
            >
              {project.approvalStatus === "pending" ? "awaiting review" : "rejected"}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
              statusStyles[project.status] || statusStyles.open
            }`}
          >
            {project.status}
          </span>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
        {project.description}
      </p>

      {project.tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">
            {project.owner?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-500">{project.owner?.name}</span>
        </div>
        <span className="text-xs text-slate-400">
          {project.collaborators?.length || 0} collaborator
          {project.collaborators?.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
};

export default ProjectCard;
