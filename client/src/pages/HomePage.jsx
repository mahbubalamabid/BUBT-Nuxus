import { useAuth } from "../context/AuthContext";
import LandingPage from "./LandingPage";
import DashboardPage from "./DashboardPage";

// "/" is smart: a logged-in user sees their personalized dashboard directly;
// a guest sees the marketing landing page instead. Guests can still reach the
// dashboard content itself (read-only) at /dashboard.
const HomePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return user ? <DashboardPage /> : <LandingPage />;
};

export default HomePage;
