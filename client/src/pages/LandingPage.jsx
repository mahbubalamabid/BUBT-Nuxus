import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "🧑‍🔬",
    title: "Research Profiles",
    desc: "Build a profile with your bio, department, interest tags, skills, and publications - so people can find you for the right reasons.",
  },
  {
    icon: "🏷️",
    title: "Interest & Skill Tags",
    desc: "Search and filter researchers and projects by tag, not just keywords - find real matches faster.",
  },
  {
    icon: "📋",
    title: "Project Posting",
    desc: "Post a project with required skills and a collaborator limit. Every post is reviewed by an admin before it goes public.",
  },
  {
    icon: "🤝",
    title: "Collaboration Requests",
    desc: "Send a request to join a project, and the owner can accept or decline - a clear, trackable way to team up.",
  },
  {
    icon: "💬",
    title: "Real-time Messaging",
    desc: "Once you're connected as collaborators, chat instantly - no waiting, no refreshing.",
  },
];

const LandingPage = () => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:pt-24">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold text-white">
          BN
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Find your next research collaborator at BUBT
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          BUBT Nexus connects students, researchers, and faculty by shared research
          interests and skills - so you can stop asking around and start collaborating.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-primary !px-6 !py-3 !text-base">
            Get started - it's free
          </Link>
          <Link to="/dashboard" className="btn-secondary !px-6 !py-3 !text-base">
            Browse without signing in
          </Link>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Everything you need to team up on research
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-1.5 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "Build your profile", desc: "Add your interests, skills, and background." },
              { step: "2", title: "Find or post a project", desc: "Browse open projects or post your own for review." },
              { step: "3", title: "Collaborate", desc: "Send a request, get accepted, and start chatting." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700">
                  {s.step}
                </div>
                <h3 className="mb-1 font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t border-slate-100 bg-primary-600 py-14 text-center">
        <h2 className="text-2xl font-bold text-white">Ready to find your collaborator?</h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-secondary !px-6 !py-3 !text-base">
            Create your profile
          </Link>
          <Link to="/projects" className="rounded-lg border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors">
            Explore open projects
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
