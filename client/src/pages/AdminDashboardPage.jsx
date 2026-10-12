import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardStats,
  getPendingProjects,
  getAllProjectsAdmin,
  approveProject,
  rejectProject,
  deleteProjectAdmin,
  getAllUsersAdmin,
  toggleUserActive,
} from "../services/adminService";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "pending", label: "Pending Approvals" },
  { id: "projects", label: "All Projects" },
  { id: "users", label: "Users" },
];

const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-sm font-bold text-white">
              🛡
            </div>
            <span className="text-lg font-bold text-white">BUBT Nexus Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{user?.name}</span>
            <button onClick={logout} className="btn-secondary !py-1.5 !text-xs">
              Logout
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-primary-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {tab === "overview" && <OverviewTab />}
        {tab === "pending" && <PendingApprovalsTab />}
        {tab === "projects" && <AllProjectsTab />}
        {tab === "users" && <UsersTab />}
      </main>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="card p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-1 text-3xl font-bold text-slate-900">{value ?? "—"}</p>
  </div>
);

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats?.totalUsers} />
        <StatCard label="Total Projects" value={stats?.totalProjects} />
        <StatCard label="Pending Approvals" value={stats?.pendingApprovals} />
        <StatCard label="Collaboration Requests" value={stats?.totalCollabRequests} />
      </div>
      {stats?.pendingApprovals > 0 && (
        <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {stats.pendingApprovals} project{stats.pendingApprovals === 1 ? "" : "s"}{" "}
          waiting for review — check the "Pending Approvals" tab.
        </div>
      )}
    </div>
  );
};

const PendingApprovalsTab = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id) => {
    setActingId(id);
    try {
      await approveProject(id);
      await load();
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    setActingId(id);
    try {
      await rejectProject(id, reason);
      setRejectingId(null);
      setReason("");
      await load();
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-400">Loading...</div>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Pending Approvals</h1>
      <p className="mb-6 text-slate-500">
        New projects stay hidden from everyone else until you review them here.
      </p>

      {projects.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          Nothing waiting for review right now.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p._id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    by {p.owner?.name} ({p.owner?.email}) — {p.owner?.department}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                  pending
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-700">{p.description}</p>

              {p.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="tag-pill">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {rejectingId === p._id ? (
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <textarea
                    rows={2}
                    className="input-field"
                    placeholder="Reason for rejection (shown to the project owner)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(p._id)}
                      disabled={actingId === p._id}
                      className="btn-primary !bg-red-600 hover:!bg-red-700 !py-1.5 !text-xs"
                    >
                      Confirm reject
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setReason("");
                      }}
                      className="btn-secondary !py-1.5 !text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleApprove(p._id)}
                    disabled={actingId === p._id}
                    className="btn-primary !py-1.5 !text-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectingId(p._id)}
                    disabled={actingId === p._id}
                    className="btn-secondary !py-1.5 !text-xs"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AllProjectsTab = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.approvalStatus = statusFilter;
      if (q) params.q = q;
      const data = await getAllProjectsAdmin(params);
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, q]);

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this project? This cannot be undone.")) return;
    await deleteProjectAdmin(id);
    load();
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">All Projects</h1>
      <p className="mb-6 text-slate-500">Every project on the platform, any status.</p>

      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-2">
        <input
          className="input-field"
          placeholder="Search title/description..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="input-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading...</div>
      ) : projects.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">No projects found.</div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p._id} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{p.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {p.owner?.name} ({p.owner?.email})
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[p.approvalStatus]}`}
                >
                  {p.approvalStatus}
                </span>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [actingId, setActingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersAdmin(q ? { q } : {});
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleToggle = async (id) => {
    setActingId(id);
    try {
      await toggleUserActive(id);
      await load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Users</h1>
      <p className="mb-6 text-slate-500">Suspend accounts that violate platform rules.</p>

      <input
        className="input-field mb-6"
        placeholder="Search by name or email..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading...</div>
      ) : users.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">No users found.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u._id} className="card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{u.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {u.email} · {u.role} · {u.department}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!u.isVerified && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                    unverified
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {u.isActive ? "active" : "suspended"}
                </span>
                <button
                  onClick={() => handleToggle(u._id)}
                  disabled={actingId === u._id}
                  className={`text-xs font-medium hover:underline ${
                    u.isActive ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {u.isActive ? "Suspend" : "Reactivate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
