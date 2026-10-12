import { useNavigate } from "react-router-dom";

const ProfileCard = ({ profile }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/profile/${profile._id}`)}
      className="card cursor-pointer p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-700">
          {profile.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">
            {profile.name}
          </h3>
          <p className="truncate text-xs text-slate-500">
            {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)}
            {profile.department ? ` · ${profile.department}` : ""}
          </p>
        </div>
        {profile.isAvailableForCollab && (
          <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700">
            Open to collab
          </span>
        )}
      </div>

      {profile.bio && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
          {profile.bio}
        </p>
      )}

      {profile.interests?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.interests.slice(0, 4).map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
            </span>
          ))}
          {profile.interests.length > 4 && (
            <span className="text-xs text-slate-400">
              +{profile.interests.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
