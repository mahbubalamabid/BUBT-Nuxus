import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getReceivedRequests,
  getSentRequests,
  respondToRequest,
} from "../services/collabService";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const RequestsPage = () => {
  const [tab, setTab] = useState("received");
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([getReceivedRequests(), getSentRequests()]);
      setReceived(r);
      setSent(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRespond = async (id, status) => {
    setActingId(id);
    try {
      await respondToRequest(id, status);
      await loadAll();
    } finally {
      setActingId(null);
    }
  };

  const list = tab === "received" ? received : sent;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Collaboration requests</h1>
      <p className="mb-6 text-slate-500">
        Manage requests to join your projects, or track ones you've sent.
      </p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("received")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "received" ? "bg-primary-600 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          Received ({received.length})
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === "sent" ? "bg-primary-600 text-white" : "bg-white text-slate-600 border border-slate-200"
          }`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading...</div>
      ) : list.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          No {tab} requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((req) => (
            <div key={req._id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">
                    {tab === "received" ? (
                      <>
                        <Link to={`/profile/${req.sender?._id}`} className="font-semibold text-slate-900 hover:underline">
                          {req.sender?.name}
                        </Link>{" "}
                        wants to collaborate on
                      </>
                    ) : (
                      <>
                        You requested to collaborate on
                      </>
                    )}{" "}
                    <Link to={`/projects/${req.project?._id}`} className="font-medium text-primary-600 hover:underline">
                      {req.project?.title}
                    </Link>
                  </p>
                  {req.message && (
                    <p className="mt-2 text-sm text-slate-700">"{req.message}"</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[req.status]}`}
                >
                  {req.status}
                </span>
              </div>

              {tab === "received" && req.status === "pending" && (
                <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleRespond(req._id, "accepted")}
                    disabled={actingId === req._id}
                    className="btn-primary !py-1.5 !text-xs"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(req._id, "rejected")}
                    disabled={actingId === req._id}
                    className="btn-secondary !py-1.5 !text-xs"
                  >
                    Decline
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

export default RequestsPage;
