import { useEffect, useState } from "react";
import { getUsers } from "../services/userService";
import ProfileCard from "../components/ProfileCard";

const ExplorePage = () => {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [interest, setInterest] = useState("");
  const [skill, setSkill] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (interest.trim()) params.interest = interest.trim();
      if (skill.trim()) params.skill = skill.trim();
      const res = await getUsers(params);
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, interest, skill]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">
        Explore researchers
      </h1>
      <p className="mb-6 text-slate-500">
        Find collaborators by research interest, skill, or name.
      </p>

      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-3">
        <input
          className="input-field"
          placeholder="Search by name or bio..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Filter by interest tag (e.g. machine learning)"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Filter by skill (e.g. python)"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Searching...</div>
      ) : users.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          No researchers matched your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <ProfileCard key={u._id} profile={u} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
