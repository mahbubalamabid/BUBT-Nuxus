import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProjects } from "../services/projectService";
import { getUsers } from "../services/userService";
import ProjectCard from "../components/ProjectCard";
import ProfileCard from "../components/ProfileCard";

const DashboardPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [projectsRes, usersRes] = await Promise.all([
          getProjects({ status: "open", limit: 6 }),
          user?.interests?.length
            ? getUsers({ interest: user.interests[0], limit: 4 })
            : getUsers({ limit: 4 }),
        ]);
        setProjects(projectsRes.data);
        setMatches(usersRes.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {user ? `Welcome back, ${user.name?.split(" ")[0]} 👋` : "Welcome to BUBT Nexus 👋"}
        </h1>
        <p className="mt-1 text-slate-500">
          {user
            ? "Here's what's happening across BUBT Nexus."
            : "Browse open projects and researchers below. Sign in to post, collaborate, or message anyone."}
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading...</div>
      ) : (
        <>
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Open research projects
              </h2>
              <Link to="/projects" className="text-sm font-medium text-primary-600 hover:underline">
                View all
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="card p-8 text-center text-sm text-slate-500">
                No open projects yet.{" "}
                <Link to="/projects/new" className="text-primary-600 hover:underline">
                  Post the first one
                </Link>
                .
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard key={p._id} project={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {user?.interests?.length
                  ? `Researchers interested in "${user.interests[0]}"`
                  : "Discover researchers"}
              </h2>
              <Link to="/explore" className="text-sm font-medium text-primary-600 hover:underline">
                Explore all
              </Link>
            </div>
            {matches.length === 0 ? (
              <div className="card p-8 text-center text-sm text-slate-500">
                No matches yet. Add interest tags to your profile to find collaborators.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {matches.map((m) => (
                  <ProfileCard key={m._id} profile={m} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
