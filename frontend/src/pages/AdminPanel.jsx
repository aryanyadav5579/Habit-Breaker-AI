import {
  Activity,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  UserCog,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";

import { api, safeGet } from "../api/client.js";
import { MetricCard } from "../components/MetricCard.jsx";

const fallbackSystem = {
  users: 0,
  children: 0,
  activity_logs: 0,
  open_alerts: 0,
  focus_sessions: 0
};

export default function AdminPanel() {
  const [system, setSystem] = useState(fallbackSystem);
  const [users, setUsers] = useState([]);
  const [toggling, setToggling] = useState(null);
  const [message, setMessage] = useState("");

  function load() {
    safeGet("/admin/system", fallbackSystem).then(setSystem);
    safeGet("/admin/users", []).then(setUsers);
  }

  useEffect(() => { load(); }, []);

  async function toggleUser(userId) {
    setToggling(userId);
    try {
      const { data } = await api.patch(`/admin/users/${userId}/toggle`);
      setUsers((list) => list.map((u) => (u.id === data.id ? data : u)));
      setMessage(`${data.full_name} is now ${data.is_active ? "active" : "disabled"}.`);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not toggle user.");
    } finally {
      setToggling(null);
    }
  }

  const roleColor = {
    admin: "badge-danger",
    parent: "badge-streak",
    child: "badge-green",
    user: "badge"
  };

  return (
    <div className="space-y-6 animate-fadein">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-mint">Admin panel</p>
          <h2 className="text-2xl font-semibold text-white">System activity and user management</h2>
        </div>
        <button onClick={load} className="button-secondary">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* System metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Users} label="Users" value={system.users} detail="registered" />
        <MetricCard icon={ShieldCheck} label="Children" value={system.children} detail="linked accounts" tone="leaf" />
        <MetricCard icon={Activity} label="Activity logs" value={system.activity_logs} detail="tracked events" tone="sun" />
        <MetricCard icon={Zap} label="Open alerts" value={system.open_alerts} detail="needs review" tone="danger" />
        <MetricCard icon={CheckCircle2} label="Focus sessions" value={system.focus_sessions} detail="completed" />
      </div>

      {message && (
        <div className="rounded-lg border border-line bg-ink/70 px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {/* Users table */}
      <section className="surface rounded-lg p-5">
        <div className="mb-4 flex items-center gap-3">
          <UserCog size={18} className="text-mint" />
          <h3 className="text-base font-semibold text-white">Platform users</h3>
          <span className="ml-auto text-xs text-slate-500">{users.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-line pb-3 pr-4">Name</th>
                <th className="border-b border-line pb-3 pr-4">Email</th>
                <th className="border-b border-line pb-3 pr-4">Role</th>
                <th className="border-b border-line pb-3 pr-4">Joined</th>
                <th className="border-b border-line pb-3 pr-4">Status</th>
                <th className="border-b border-line pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-white/2">
                  <td className="border-b border-line py-3 pr-4 font-medium text-white">
                    {user.full_name}
                  </td>
                  <td className="border-b border-line py-3 pr-4 text-slate-300">{user.email}</td>
                  <td className="border-b border-line py-3 pr-4">
                    <span className={roleColor[user.role] || "badge"}>
                      {user.role}
                    </span>
                  </td>
                  <td className="border-b border-line py-3 pr-4 text-slate-500 text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="border-b border-line py-3 pr-4">
                    <span className={`text-xs font-medium ${user.is_active ? "text-leaf" : "text-slate-500"}`}>
                      {user.is_active ? "● Active" : "○ Disabled"}
                    </span>
                  </td>
                  <td className="border-b border-line py-3">
                    <button
                      onClick={() => toggleUser(user.id)}
                      disabled={toggling === user.id}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                      title={user.is_active ? "Disable user" : "Enable user"}
                    >
                      {user.is_active
                        ? <ToggleRight size={16} className="text-leaf" />
                        : <ToggleLeft size={16} className="text-slate-500" />}
                      {toggling === user.id ? "..." : user.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && (
            <p className="py-6 text-center text-sm text-slate-500">No users found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
