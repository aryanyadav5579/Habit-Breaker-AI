import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  CalendarCheck,
  FileText,
  Home,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCog,
  Users,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { safeGet } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/focus", label: "Focus Mode", icon: CalendarCheck },
  { to: "/settings", label: "Settings", icon: SlidersHorizontal },
  { to: "/parent", label: "Parent Panel", icon: Users, roles: ["parent", "admin"] },
  { to: "/child", label: "Child View", icon: ShieldCheck, roles: ["child", "parent", "admin"] },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/admin", label: "Admin", icon: UserCog, roles: ["admin"] }
];

export function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    safeGet("/alerts?limit=20", []).then((alerts) => {
      setAlertCount(alerts.filter((a) => !a.acknowledged).length);
    });
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-line bg-ink/98 p-4 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <NavLink to="/" className="mb-6 flex items-center gap-3 rounded-lg px-2 py-3" onClick={closeMobile}>
          <span className="rounded-lg bg-mint p-2 text-ink">
            <BrainCircuit size={22} />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide text-mint">Habit Breaker</span>
            <span className="block text-xs text-slate-400">AI Focus Platform</span>
          </span>
        </NavLink>

        {/* Nav links */}
        <nav className="space-y-0.5">
          {nav
            .filter((item) => !item.roles || item.roles.includes(user?.role))
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "nav-link-active" : ""}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
        </nav>

        {/* User card */}
        <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-line bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-leaf/15 p-2 text-leaf">
              <Activity size={18} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.full_name || "Workspace"}</p>
              <p className="text-xs capitalize text-slate-400">{user?.role || "secure"} account</p>
            </div>
          </div>
          <button onClick={handleLogout} className="button-secondary mt-3 w-full">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-line bg-ink/85 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="button-secondary lg:hidden"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2">
                  <span className="pulse-dot" />
                  Realtime protection
                </p>
                <h1 className="text-base font-semibold text-white hidden sm:block">Habit Breaker AI</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* AI status badge */}
              <span className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-slate-300 sm:flex">
                <Sparkles size={16} className="text-mint" />
                AI monitoring online
              </span>

              {/* Notification bell */}
              <NavLink to="/dashboard" className="relative button-secondary px-3">
                <Bell size={16} />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </NavLink>

              {/* Dark mode toggle */}
              <button
                className="button-secondary"
                onClick={() => document.documentElement.classList.toggle("dark")}
              >
                <Moon size={16} />
                <span className="hidden sm:inline">Theme</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
