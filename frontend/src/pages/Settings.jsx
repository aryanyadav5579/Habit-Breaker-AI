import {
  Globe,
  Monitor,
  Plus,
  Save,
  Shield,
  SlidersHorizontal,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

import { api, safeGet } from "../api/client.js";

const defaults = {
  productive_websites: ["github.com", "stackoverflow.com", "docs.google.com", "chat.openai.com", "notion.so"],
  distracting_websites: ["youtube.com", "instagram.com", "netflix.com", "reddit.com", "facebook.com"],
  productive_apps: ["Code.exe", "pycharm64.exe", "EXCEL.EXE", "Photoshop.exe"],
  distracting_apps: ["Discord.exe", "Steam.exe", "TikTok.exe"],
  focus_mode_duration: 50,
  alert_sound: "soft-bell",
  productivity_goal_minutes: 300,
  distraction_sensitivity: 0.65,
  blocking_enabled: false,
  child_safe_mode: false,
  work_schedule: { start: "09:00", end: "17:30" },
  daily_limits: { social: 45, video: 30, games: 0 },
  bedtime_schedule: { start: "21:30", end: "06:30" }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    safeGet("/settings/me", defaults).then(setSettings);
  }, []);

  function setList(key, arr) {
    setSettings({ ...settings, [key]: arr });
  }

  async function save() {
    try {
      setError("");
      const { data } = await api.put("/settings/me", settings);
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save settings");
    }
  }

  return (
    <div className="space-y-6 animate-fadein">
      <div>
        <p className="text-sm uppercase tracking-wide text-mint">Settings</p>
        <h2 className="text-2xl font-semibold text-white">Customize productivity rules</h2>
      </div>

      {/* Website & App Lists */}
      <div className="grid gap-4 xl:grid-cols-2">
        <TagListEditor
          title="Productive websites"
          icon={Globe}
          color="text-leaf"
          value={settings.productive_websites}
          onChange={(arr) => setList("productive_websites", arr)}
          placeholder="e.g. github.com"
        />
        <TagListEditor
          title="Distracting websites"
          icon={Globe}
          color="text-danger"
          value={settings.distracting_websites}
          onChange={(arr) => setList("distracting_websites", arr)}
          placeholder="e.g. youtube.com"
        />
        <TagListEditor
          title="Productive desktop apps"
          icon={Monitor}
          color="text-leaf"
          value={settings.productive_apps}
          onChange={(arr) => setList("productive_apps", arr)}
          placeholder="e.g. Code.exe"
        />
        <TagListEditor
          title="Distracting desktop apps"
          icon={Monitor}
          color="text-danger"
          value={settings.distracting_apps}
          onChange={(arr) => setList("distracting_apps", arr)}
          placeholder="e.g. Discord.exe"
        />
      </div>

      {/* Focus & Safety Controls */}
      <section className="surface rounded-lg p-5">
        <div className="mb-5 flex items-center gap-3">
          <SlidersHorizontal size={18} className="text-mint" />
          <h3 className="text-base font-semibold text-white">Focus and safety controls</h3>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <NumField
            label="Focus duration (min)"
            value={settings.focus_mode_duration}
            min={5} max={240}
            onChange={(v) => setSettings({ ...settings, focus_mode_duration: v })}
          />
          <NumField
            label="Daily goal (min)"
            value={settings.productivity_goal_minutes}
            min={15} max={1440}
            onChange={(v) => setSettings({ ...settings, productivity_goal_minutes: v })}
          />
          <label>
            <span className="mb-2 block text-sm text-slate-300">
              Distraction sensitivity: <strong className="text-white">{settings.distraction_sensitivity}</strong>
            </span>
            <input
              type="range" min="0.05" max="1" step="0.05"
              value={settings.distraction_sensitivity}
              onChange={(e) => setSettings({ ...settings, distraction_sensitivity: Number(e.target.value) })}
              className="w-full accent-teal-300"
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>Relaxed</span><span>Strict</span>
            </div>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-4">
          <Toggle
            label="Enable website/app blocking"
            description="Redirect blocked sites to warning page"
            checked={settings.blocking_enabled}
            onChange={(v) => setSettings({ ...settings, blocking_enabled: v })}
          />
          <Toggle
            label="Child-safe mode"
            description="Stricter distraction scoring"
            checked={settings.child_safe_mode}
            onChange={(v) => setSettings({ ...settings, child_safe_mode: v })}
          />
        </div>
      </section>

      {/* Schedules */}
      <div className="grid gap-4 xl:grid-cols-3">
        <section className="surface rounded-lg p-5">
          <div className="mb-4 flex items-center gap-3">
            <Shield size={18} className="text-mint" />
            <h3 className="text-sm font-semibold text-white">Work schedule</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1.5 block text-xs text-slate-400">Start</span>
              <input
                type="time" className="input"
                value={settings.work_schedule?.start || "09:00"}
                onChange={(e) => setSettings({ ...settings, work_schedule: { ...settings.work_schedule, start: e.target.value } })}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs text-slate-400">End</span>
              <input
                type="time" className="input"
                value={settings.work_schedule?.end || "17:30"}
                onChange={(e) => setSettings({ ...settings, work_schedule: { ...settings.work_schedule, end: e.target.value } })}
              />
            </label>
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <div className="mb-4 flex items-center gap-3">
            <Shield size={18} className="text-sun" />
            <h3 className="text-sm font-semibold text-white">Bedtime schedule</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="mb-1.5 block text-xs text-slate-400">Lock at</span>
              <input
                type="time" className="input"
                value={settings.bedtime_schedule?.start || "21:30"}
                onChange={(e) => setSettings({ ...settings, bedtime_schedule: { ...settings.bedtime_schedule, start: e.target.value } })}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs text-slate-400">Unlock at</span>
              <input
                type="time" className="input"
                value={settings.bedtime_schedule?.end || "06:30"}
                onChange={(e) => setSettings({ ...settings, bedtime_schedule: { ...settings.bedtime_schedule, end: e.target.value } })}
              />
            </label>
          </div>
        </section>

        <section className="surface rounded-lg p-5">
          <div className="mb-4 flex items-center gap-3">
            <Shield size={18} className="text-danger" />
            <h3 className="text-sm font-semibold text-white">Daily limits (min)</h3>
          </div>
          <div className="space-y-3">
            {[["Social media", "social"], ["Video streaming", "video"], ["Games", "games"]].map(([label, key]) => (
              <label key={key}>
                <span className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>{label}</span>
                  <span className="text-white">{settings.daily_limits?.[key] ?? 0}m</span>
                </span>
                <input
                  type="range" min="0" max="240" step="5"
                  value={settings.daily_limits?.[key] ?? 0}
                  onChange={(e) => setSettings({
                    ...settings,
                    daily_limits: { ...settings.daily_limits, [key]: Number(e.target.value) }
                  })}
                  className="w-full accent-red-400"
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Alert sound */}
      <section className="surface rounded-lg p-5">
        <div className="mb-4 flex items-center gap-3">
          <SlidersHorizontal size={18} className="text-mint" />
          <h3 className="text-sm font-semibold text-white">Alert sound</h3>
        </div>
        <select
          className="input max-w-60"
          value={settings.alert_sound}
          onChange={(e) => setSettings({ ...settings, alert_sound: e.target.value })}
        >
          <option value="soft-bell">Soft bell</option>
          <option value="chime">Chime</option>
          <option value="ping">Ping</option>
          <option value="none">Silent</option>
        </select>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} className="button-primary">
          <Save size={16} />
          Save settings
        </button>
        {saved && <span className="text-sm text-leaf">✓ Saved successfully</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}

// Tag chip input component
function TagListEditor({ title, icon: Icon, color, value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  function add() {
    const tag = input.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  }

  function remove(tag) {
    onChange(value.filter((v) => v !== tag));
  }

  return (
    <section className="surface rounded-lg p-5">
      <div className="mb-3 flex items-center gap-3">
        <Icon size={18} className={color} />
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <span className="ml-auto text-xs text-slate-500">{value.length} entries</span>
      </div>
      <div className="flex flex-wrap gap-2 min-h-12 mb-3">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-line px-2.5 py-1 text-xs text-slate-200"
          >
            {tag}
            <button onClick={() => remove(tag)} className="text-slate-500 hover:text-danger transition-colors">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={input}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button onClick={add} className="button-secondary px-3">
          <Plus size={16} />
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-600">Press Enter or + to add. Syncs to extension and desktop monitor.</p>
    </section>
  );
}

function NumField({ label, value, min, max, onChange }) {
  return (
    <label>
      <span className="mb-2 block text-sm text-slate-300">{label}</span>
      <input
        className="input"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-ink/70 px-4 py-3">
      <input
        className="mt-0.5 h-4 w-4 accent-teal-300 flex-shrink-0"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <p className="text-sm text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}
