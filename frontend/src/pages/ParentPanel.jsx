import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Plus,
  RefreshCcw,
  ShieldAlert,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";

import { api, safeGet } from "../api/client.js";

export default function ParentPanel() {
  const [children, setChildren] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [selectedChild, setSelectedChild] = useState(null);
  const [childActivity, setChildActivity] = useState([]);
  const [childAlerts, setChildAlerts] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    display_name: ""
  });

  useEffect(() => {
    safeGet("/parent/children", []).then(setChildren);
  }, []);

  async function createChild(event) {
    event.preventDefault();
    try {
      const { data } = await api.post("/parent/children", form);
      setChildren((items) => [data, ...items]);
      setMessage("Child account created and linked successfully.");
      setMessageType("success");
      setForm({ full_name: "", email: "", password: "", display_name: "" });
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not create child account.");
      setMessageType("error");
    }
  }

  async function viewChild(child) {
    setSelectedChild(child);
    const activity = await safeGet(`/parent/children/${child.child_id}/activity?limit=10`, []);
    setChildActivity(activity);
    const alerts = await safeGet(`/alerts?user_id=${child.child_id}&limit=5`, []);
    setChildAlerts(alerts.filter((a) => !a.acknowledged));
  }

  async function applyStudyMode(childId) {
    try {
      await api.put(`/settings/${childId}`, {
        child_safe_mode: true,
        blocking_enabled: true,
        distracting_websites: ["youtube.com", "instagram.com", "reddit.com", "netflix.com", "facebook.com", "tiktok.com"],
        distracting_apps: ["Discord.exe", "Steam.exe", "RobloxPlayerBeta.exe", "TikTok.exe"],
        bedtime_schedule: { start: "21:30", end: "06:30" },
        daily_limits: { games: 0, social: 30, video: 25 }
      });
      setMessage("Study-only restrictions applied to child account.");
      setMessageType("success");
    } catch {
      setMessage("Could not apply restrictions.");
      setMessageType("error");
    }
  }

  async function refreshChildView(child) {
    const activity = await safeGet(`/parent/children/${child.child_id}/activity?limit=10`, []);
    setChildActivity(activity);
  }

  const catColor = {
    productive: "bg-leaf text-ink",
    distracting: "bg-danger text-white",
    neutral: "bg-sun text-ink"
  };

  return (
    <div className="space-y-6 animate-fadein">
      <div>
        <p className="text-sm uppercase tracking-wide text-mint">Parent control</p>
        <h2 className="text-2xl font-semibold text-white">Family monitoring dashboard</h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

        {/* Create child form */}
        <section className="surface rounded-lg p-5">
          <div className="mb-4 flex items-center gap-3">
            <Plus size={18} className="text-mint" />
            <h3 className="text-base font-semibold text-white">Add child account</h3>
          </div>
          <form onSubmit={createChild} className="space-y-3">
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Child full name" required />
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Child email address" required />
            <input className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Display name (nickname)" />
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Temporary password" required />
            <button className="button-primary w-full">
              <Plus size={16} />
              Create child account
            </button>
          </form>
          {message && (
            <div className={`mt-4 rounded-lg border p-3 text-sm ${
              messageType === "success"
                ? "border-leaf/30 bg-leaf/10 text-leaf"
                : "border-danger/30 bg-danger/10 text-red-300"
            }`}>
              {message}
            </div>
          )}
        </section>

        {/* Children list */}
        <section className="surface rounded-lg p-5">
          <div className="mb-4 flex items-center gap-3">
            <Users size={18} className="text-mint" />
            <h3 className="text-base font-semibold text-white">Linked children</h3>
          </div>
          <div className="space-y-3">
            {children.length ? (
              children.map((child) => (
                <div
                  key={child.id}
                  className={`rounded-lg border p-4 transition-all cursor-pointer ${
                    selectedChild?.id === child.id
                      ? "border-mint/40 bg-mint/5"
                      : "border-line bg-ink/70 hover:border-mint/20"
                  }`}
                  onClick={() => viewChild(child)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{child.display_name}</p>
                      <p className="text-sm text-slate-400">{child.child?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); applyStudyMode(child.child_id); }}
                        className="button-secondary text-xs px-3 py-1.5"
                      >
                        <LockKeyhole size={14} />
                        Study mode
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 grid-cols-3">
                    <Policy label="Bedtime" value={`${child.bedtime_schedule?.start || "21:30"}`} />
                    <Policy label="Study start" value={child.study_schedule?.start || "Not set"} />
                    <Policy label="Social limit" value={`${child.daily_limits?.social || 30}m`} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-line bg-ink/70 p-6 text-center">
                <ShieldAlert size={28} className="mx-auto text-sun" />
                <p className="mt-3 text-sm text-slate-400">No child accounts linked yet.</p>
                <p className="text-xs text-slate-600 mt-1">Create one using the form on the left.</p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Child activity panel */}
      {selectedChild && (
        <section className="surface rounded-lg p-5 animate-fadein">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                {selectedChild.display_name}'s activity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 10 tracked events</p>
            </div>
            <button onClick={() => refreshChildView(selectedChild)} className="button-secondary px-3">
              <RefreshCcw size={14} />
            </button>
          </div>

          {/* Unread alerts */}
          {childAlerts.length > 0 && (
            <div className="mb-4 space-y-2">
              {childAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 rounded-lg border border-danger/20 bg-danger/5 p-3">
                  <AlertTriangle size={16} className="text-danger flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{alert.event_type?.replaceAll("_", " ")}</p>
                    <p className="text-xs text-slate-400">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="divide-y divide-line">
            {childActivity.length ? (
              childActivity.map((log, i) => (
                <div key={log.id || i} className="flex items-center gap-3 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${catColor[log.category] || "bg-line text-white"}`}>
                    {log.category}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">
                      {log.domain || log.app_name || log.window_title || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">{log.source}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {Math.round((log.distraction_probability || 0) * 100)}% risk
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-sm text-slate-400">No activity logged for this child yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Policy({ label, value }) {
  return (
    <div className="rounded border border-line/50 bg-panel/50 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-0.5 text-xs text-slate-300">{value}</p>
    </div>
  );
}
