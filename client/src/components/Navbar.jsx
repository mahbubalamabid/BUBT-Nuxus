import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary-50 text-primary-700"
      : "text-slate-600 hover:bg-slate-100"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const NavLinks = () => (
    <>
      <NavLink to="/" end className={navLinkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/explore" className={navLinkClass}>
        Explore
      </NavLink>
      <NavLink to="/projects" className={navLinkClass}>
        Projects
      </NavLink>
      {user && (
        <>
          <NavLink to="/requests" className={navLinkClass}>
            Requests
          </NavLink>
          <NavLink to="/messages" className={navLinkClass}>
            Messages
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div
          className="flex cursor-pointer items-center gap-2"
          onClick={() => navigate("/")}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            BN
          </div>
          <span className="text-lg font-bold text-slate-900">BUBT Nexus</span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLinks />
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 hover:bg-slate-50"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700">
                {user.name?.split(" ")[0]}
              </span>
            </button>
            <button onClick={logout} className="btn-secondary !py-1.5 !text-xs">
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/login")} className="btn-secondary !py-1.5 !text-xs">
              Sign in
            </button>
            <button onClick={() => navigate("/register")} className="btn-primary !py-1.5 !text-xs">
              Register
            </button>
          </div>
        )}
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        <NavLinks />
      </nav>
    </header>
  );
};

export default Navbar;
