import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserById } from "../services/userService";
import { getMe } from "../services/authService";
import { startConversation } from "../services/messageService";

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  const targetId = id || currentUser?._id;
  const isOwnProfile = !id || id === currentUser?._id;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Always fetch fresh from the API rather than trusting cached context
        // data, so edits made elsewhere (or in another tab) always show up.
        const data = isOwnProfile ? await getMe() : await getUserById(targetId);
        setProfile(data);
      } finally {
        setLoading(false);
      }
    };
    if (targetId) load();
  }, [targetId, isOwnProfile]);

  const handleMessage = async () => {
    setMessaging(true);
    try {
      const convo = await startConversation(targetId);
      navigate(`/messages?conversation=${convo._id}`);
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="py-20 text-center text-slate-400">Profile not found.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
              <p className="text-sm text-slate-500">
                {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)}
                {profile.department ? ` · ${profile.department}` : ""}
              </p>
              {profile.isAvailableForCollab && (
                <span className="mt-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  Open to collaboration
                </span>
              )}
            </div>
          </div>

          {isOwnProfile ? (
            <Link to="/profile/edit" className="btn-secondary">
              Edit profile
            </Link>
          ) : (
            <button onClick={handleMessage} disabled={messaging} className="btn-primary">
              {messaging ? "Opening..." : "Message"}
            </button>
          )}
        </div>

        {profile.bio && (
          <p className="mt-5 text-sm leading-relaxed text-slate-700">{profile.bio}</p>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Research interests</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests?.length ? (
                profile.interests.map((tag) => (
                  <span key={tag} className="tag-pill">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No interests added yet</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills?.length ? (
                profile.skills.map((tag) => (
                  <span key={tag} className="skill-pill">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No skills added yet</span>
              )}
            </div>
          </div>
        </div>

        {profile.publications?.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Publications</h3>
            <ul className="space-y-2">
              {profile.publications.map((pub, i) => (
                <li key={i} className="text-sm text-slate-700">
                  {pub.link ? (
                    <a
                      href={pub.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {pub.title}
                    </a>
                  ) : (
                    pub.title
                  )}
                  {pub.year ? ` (${pub.year})` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(profile.links?.googleScholar || profile.links?.linkedin || profile.links?.website) && (
          <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
            {profile.links?.googleScholar && (
              <a href={profile.links.googleScholar} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                Google Scholar
              </a>
            )}
            {profile.links?.linkedin && (
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                LinkedIn
              </a>
            )}
            {profile.links?.website && (
              <a href={profile.links.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                Personal Website
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
