import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjects } from "../services/projectService";
import ProjectCard from "../components/ProjectCard";

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [skill, setSkill] = useState("");
  const [status, setStatus] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (tag.trim()) params.tag = tag.trim();
      if (skill.trim()) params.skill = skill.trim();
      if (status) params.status = status;
      if (mineOnly && user) params.owner = user._id;
      const res = await getProjects(params);
      setProjects(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchProjects, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tag, skill, status, mineOnly]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Research projects</h1>
          <p className="mt-1 text-slate-500">
            {mineOnly
              ? "Your posted projects, including ones awaiting admin review."
              : "Browse open projects looking for collaborators."}
          </p>
        </div>
        <Link to="/projects/new" className="btn-primary">
          + Post a project
        </Link>
      </div>

      {user && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMineOnly(false)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              !mineOnly ? "bg-primary-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            All projects
          </button>
          <button
            onClick={() => setMineOnly(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              mineOnly ? "bg-primary-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            My projects
          </button>
        </div>
      )}

      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="input-field"
          placeholder="Search projects..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Filter by interest tag (e.g. machine learning)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Filter by skill (e.g. python)"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        />
        <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          {mineOnly ? (
            "You haven't posted any projects yet."
          ) : (
            <>
              No projects found. Try adjusting your filters or{" "}
              <Link to="/projects/new" className="text-primary-600 hover:underline">
                post one
              </Link>
              .
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p._id} project={p} showApprovalStatus={mineOnly} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
