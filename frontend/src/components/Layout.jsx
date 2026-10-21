import { NavLink, useLocation, useNavigate } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/profile", label: "Resume & Profile" },
  { to: "/preferences", label: "Preferences" },
  { to: "/jobs", label: "Top Jobs" },
  { to: "/reports", label: "Reports" },
];

export function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-line bg-ink text-paper md:flex md:flex-col">
          <div className="px-6 py-8">
            <p className="font-serif text-2xl tracking-tight">Huntline</p>
            <p className="mt-2 text-sm text-paper/70">Daily AI job search agent</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2.5 text-sm transition ${
                    isActive ? "bg-paper/10 text-white" : "text-paper/75 hover:bg-paper/5 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <p className="px-6 py-6 text-xs text-paper/50">Finds and ranks jobs. You apply yourself.</p>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-line px-4 py-4 md:hidden">
            <p className="font-serif text-xl">Huntline</p>
            <select
              className="rounded-md border border-line bg-card px-2 py-1 text-sm"
              value={location.pathname.startsWith("/jobs/") ? "/jobs" : location.pathname}
              onChange={(event) => navigate(event.target.value)}
            >
              {links.map((link) => (
                <option key={link.to} value={link.to}>
                  {link.label}
                </option>
              ))}
            </select>
          </header>
          <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
