import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  History,
  LockKeyhole,
  Play,
  Square,
  Zap
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api, safeGet } from "../api/client.js";

export default function FocusMode() {
  const [session, setSession] = useState(null);
  const [minutes, setMinutes] = useState(50);
  const [pomodoro, setPomodoro] = useState(false);
  const [status, setStatus] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState([]);
  const [distractionCount, setDistractionCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    safeGet("/focus/current", null).then(setSession);
    safeGet("/settings/me", null).then((s) => {
      if (s?.focus_mode_duration) setMinutes(s.focus_mode_duration);
    });
    // Load last 5 sessions
    safeGet("/activity/recent?limit=50", []).then((logs) => {
      const dist = logs.filter((l) => l.category === "distracting").length;
      setDistractionCount(dist);
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (session) {
      const start = new Date(session.started_at).getTime();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [session]);

  async function start() {
    const duration = pomodoro ? 25 : minutes;
    const { data } = await api.post("/focus/start", { planned_duration_minutes: duration });
    setSession(data);
    setStatus(`Focus mode started — ${duration} min block. Distraction warnings are active.`);
  }

  async function stop() {
    const { data } = await api.post("/focus/stop");
    setSession(null);
    setStatus(
      `Session complete — productivity score: ${data.productivity_score}% · distractions: ${data.distraction_count}`
    );
    setHistory((h) => [data, ...h].slice(0, 5));
  }

  const plannedSeconds = (pomodoro ? 25 : minutes) * 60;
  const remaining = Math.max(plannedSeconds - elapsed, 0);
  const remainMins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const remainSecs = String(remaining % 60).padStart(2, "0");
  const progress = session ? Math.min((elapsed / plannedSeconds) * 100, 100) : 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr] animate-fadein">
      <section className="surface rounded-lg p-6">
        <p className="text-sm uppercase tracking-wide text-mint">Focus Mode</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Protect the next deep-work block
        </h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          When enabled, distracting websites and apps create warnings, optional blocking, desktop
          notifications, and live dashboard events.
        </p>

        {/* Timer ring */}
        {session && (
          <div className="mt-6 flex flex-col items-center">
            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#26364d" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white tabular-nums">
                  {remainMins}:{remainSecs}
                </span>
                <span className="text-xs text-slate-400 mt-1">remaining</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="pulse-dot" />
              <span className="text-sm text-mint">Focus session active</span>
            </div>
          </div>
        )}

        {/* Controls row */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ControlCard icon={Clock3} label="Duration" value={`${pomodoro ? 25 : minutes} min`} />
          <ControlCard icon={BellRing} label="Warnings" value="Browser + desktop" />
          <ControlCard icon={LockKeyhole} label="Blocking" value="Policy aware" />
        </div>

        {/* Duration slider */}
        {!session && !pomodoro && (
          <label className="mt-6 block">
            <span className="mb-2 block text-sm text-slate-300">
              Focus duration: <strong className="text-white">{minutes} min</strong>
            </span>
            <input
              className="w-full accent-teal-300"
              type="range"
              min="15"
              max="180"
              step="5"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>15m</span><span>60m</span><span>120m</span><span>180m</span>
            </div>
          </label>
        )}

        {/* Pomodoro toggle */}
        {!session && (
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-ink/70 px-4 py-3 w-fit">
            <input
              type="checkbox"
              className="h-4 w-4 accent-teal-300"
              checked={pomodoro}
              onChange={(e) => setPomodoro(e.target.checked)}
            />
            <span className="text-sm text-slate-300">
              🍅 Pomodoro mode <span className="text-slate-500">(25 min)</span>
            </span>
          </label>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {session ? (
            <button onClick={stop} className="button-danger">
              <Square size={16} />
              Stop session
            </button>
          ) : (
            <button onClick={start} className="button-primary">
              <Play size={16} />
              Start focus mode
            </button>
          )}
        </div>

        {status && (
          <p className="mt-4 rounded-lg border border-line bg-ink/70 p-3 text-sm text-slate-300">
            {status}
          </p>
        )}
      </section>

      <div className="space-y-4">
        {/* Live stats */}
        <section className="surface rounded-lg p-5">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Zap size={16} className="text-sun" />
            Live stats
          </h3>
          <div className="mt-4 space-y-3">
            <StatRow label="Distractions detected" value={distractionCount} color="text-danger" />
            <StatRow label="Session progress" value={`${Math.round(progress)}%`} color="text-mint" />
            <StatRow label="Elapsed time" value={`${Math.floor(elapsed / 60)}m ${elapsed % 60}s`} color="text-slate-300" />
          </div>
        </section>

        {/* Active enforcement */}
        <section className="surface rounded-lg p-5">
          <h3 className="text-base font-semibold text-white">Active enforcement</h3>
          <div className="mt-4 space-y-2">
            {[
              "Warn on distracting website switches",
              "Return user to selected work context",
              "Send parent alert for child restrictions",
              "Update realtime dashboard stream"
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-line bg-ink/70 p-3">
                <CheckCircle2 size={14} className="text-mint flex-shrink-0" />
                <p className="text-sm text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Session history */}
        {history.length > 0 && (
          <section className="surface rounded-lg p-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <History size={16} className="text-mint" />
              Recent sessions
            </h3>
            <div className="mt-4 space-y-2">
              {history.map((s, i) => (
                <div key={i} className="rounded-lg border border-line bg-ink/70 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{s.planned_duration_minutes} min session</span>
                    <span className="text-mint font-semibold">{s.productivity_score}%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {s.distraction_count} distractions · {s.status}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ControlCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-line bg-ink/70 p-4">
      <Icon size={20} className="text-mint" />
      <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-ink/70 px-3 py-2">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}
