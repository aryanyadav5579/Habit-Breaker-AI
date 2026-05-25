import {
  AlertTriangle,
  Clock3,
  Flame,
  Gauge,
  Monitor,
  ShieldAlert,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  api,
  safeGet
} from "../api/client.js";

import {
  MetricCard
} from "../components/MetricCard.jsx";

import {
  useRealtime
} from "../hooks/useRealtime.js";


const demoSummary = {
  productivity_score: 0,
  focus_hours: 0,
  distraction_count: 0,
  screen_time_hours: 0,
  daily_trend: [],
  top_distracting_websites: [],
  top_productive_apps: [],
  heatmap: [],
  ai_insights: [
    "Realtime AI monitoring active.",
    "Open productive websites to improve score."
  ],
  recent_activity: []
};

const demoStreak = { streak_days: 0, burnout_risk: 0, burnout_label: "low" };


export default function Dashboard() {

  const [summary, setSummary] = useState(demoSummary);
  const [streak, setStreak] = useState(demoStreak);
  const [recent, setRecent] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [goalMinutes] = useState(300);


  // ------------------------------------
  // Load backend dashboard data
  // ------------------------------------

  const loadDashboard = useCallback(
    async () => {
      try {
        // FIX: use authenticated /analytics/summary instead of old /dashboard/stats
        const summaryData = await safeGet("/analytics/summary?days=7", demoSummary);
        setSummary({ ...demoSummary, ...summaryData });

        // FIX: use authenticated /activity/recent instead of old /activity/all
        const recentData = await safeGet("/activity/recent?limit=8", []);
        setRecent(recentData);

        // Load streak
        const streakData = await safeGet("/analytics/streak", demoStreak);
        setStreak(streakData);

        // Load unacknowledged alerts
        const alertsData = await safeGet("/alerts?limit=6", []);
        setAlerts(alertsData.filter((a) => !a.acknowledged).slice(0, 6));
      } catch (err) {
        console.error("Dashboard load failed", err);
      }
    },
    []
  );


  // ------------------------------------
  // Realtime websocket updates
  // ------------------------------------

  const handleRealtime = useCallback((event) => {
    if (event.type === "activity") {
      setRecent((items) => [
        {
          id: Date.now(),
          domain: event.activity?.domain,
          app_name: event.activity?.app_name,
          category: event.activity?.category || "neutral",
          source: event.activity?.source || "realtime",
          distraction_probability: event.activity?.distraction_probability || 0
        },
        ...items
      ].slice(0, 8));
      loadDashboard();
    }

    if (event.type === "alert") {
      setAlerts((items) => [event.alert, ...items].slice(0, 6));
    }
  }, [loadDashboard]);


  useRealtime(handleRealtime);


  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);


  // ------------------------------------
  // Test distraction generator
  // ------------------------------------

  async function simulateDistraction() {
    try {
      await api.post("/activity/log", {
        source: "browser",
        url: "https://youtube.com/watch?v=test",
        domain: "youtube.com",
        app_name: "Chrome",
        window_title: "YouTube — Distraction Test",
        duration_seconds: 45,
        idle_seconds: 0,
        metadata: { simulated: true }
      });
      loadDashboard();
    } catch (err) {
      console.error("Simulation failed", err);
    }
  }

  // Productivity goal progress
  const goalProgress = Math.min(
    Math.round((summary.focus_hours * 60 / goalMinutes) * 100),
    100
  );

  const burnoutColor =
    streak.burnout_label === "high"
      ? "text-danger"
      : streak.burnout_label === "medium"
      ? "text-sun"
      : "text-leaf";


  // ------------------------------------
  // UI
  // ------------------------------------

  return (
    <div className="space-y-6 animate-fadein">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-mint flex items-center gap-2">
            <span className="pulse-dot" />
            Command center
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Realtime productivity dashboard
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Streak badge */}
          {streak.streak_days > 0 && (
            <span className="badge-streak">
              <Flame size={14} />
              {streak.streak_days} day streak
            </span>
          )}

          {/* Burnout risk */}
          <span className={`badge ${burnoutColor}`}>
            <Zap size={14} />
            {streak.burnout_label} burnout risk
          </span>

          <button
            onClick={simulateDistraction}
            className="button-secondary"
          >
            <ShieldAlert size={16} />
            Test alert
          </button>
        </div>
      </div>


      {/* Goal progress bar */}
      <div className="surface rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-white flex items-center gap-2">
            <Target size={16} className="text-mint" />
            Daily productivity goal
          </p>
          <span className="text-sm font-semibold text-mint">{goalProgress}%</span>
        </div>
        <div className="h-2 rounded-full bg-ink/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mint to-teal-300 transition-all duration-700"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {summary.focus_hours}h focused of {Math.round(goalMinutes / 60)}h daily goal
        </p>
      </div>


      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Gauge}
          label="Productivity score"
          value={`${summary.productivity_score}%`}
          detail="AI weighted"
        />

        <MetricCard
          icon={Clock3}
          label="Focus hours"
          value={`${summary.focus_hours}h`}
          detail="last 7 days"
          tone="leaf"
        />

        <MetricCard
          icon={AlertTriangle}
          label="Distractions"
          // FIX: was summary.distracting_count — correct key is distraction_count
          value={summary.distraction_count}
          detail="detected events"
          tone="danger"
        />

        <MetricCard
          icon={Monitor}
          label="Screen time"
          value={`${summary.screen_time_hours || 0}h`}
          detail="tracked usage"
          tone="sun"
        />
      </div>


      {/* Charts + AI */}
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">

        <section className="surface rounded-lg p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-mint" />
              Weekly trend
            </h3>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.daily_trend || []}>
                <defs>
                  <linearGradient id="gProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#26364d" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#101c2f",
                    border: "1px solid #26364d",
                    color: "#e5edf7",
                    borderRadius: "8px"
                  }}
                />
                <Area
                  dataKey="productive"
                  stackId="1"
                  stroke="#2dd4bf"
                  fill="url(#gProd)"
                />
                <Area
                  dataKey="distracting"
                  stackId="1"
                  stroke="#ef4444"
                  fill="url(#gDist)"
                />
                <Area
                  dataKey="neutral"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>


        {/* AI insights */}
        <section className="surface rounded-lg p-4">
          <h3 className="text-base font-semibold text-white mb-4">AI insights</h3>
          <div className="space-y-3">
            {(summary.ai_insights || []).map((item) => (
              <div
                key={item}
                className="rounded-lg border border-line bg-ink/70 p-3 text-sm leading-6 text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

      </div>


      {/* Recent Activity + Alerts */}
      <div className="grid gap-4 xl:grid-cols-2">

        <section className="surface rounded-lg p-4">
          <h3 className="text-base font-semibold text-white mb-4">Recent activity</h3>
          <div className="divide-y divide-line">
            {recent.length ? (
              recent.map((item, i) => (
                <ActivityRow key={item.id || i} item={item} />
              ))
            ) : (
              <p className="text-sm text-slate-400 py-4">
                No activity yet. Install the Chrome extension to start tracking.
              </p>
            )}
          </div>
        </section>


        {/* Alerts */}
        <section className="surface rounded-lg p-4">
          <h3 className="text-base font-semibold text-white mb-4">Live alerts</h3>
          <div className="divide-y divide-line">
            {alerts.length ? (
              alerts.map((alert, i) => (
                <AlertRow key={alert.id || i} alert={alert} />
              ))
            ) : (
              <p className="text-sm text-slate-400 py-4">
                No open alerts. All clear! ✅
              </p>
            )}
          </div>
        </section>

      </div>

    </div>
  );
}


function ActivityRow({ item }) {
  const colors = {
    distracting: "bg-danger",
    productive: "bg-leaf",
    neutral: "bg-sun"
  };

  return (
    <div className="flex items-center gap-3 py-3">
      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${colors[item.category] || "bg-sun"}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white">
          {item.domain || item.app_name || item.window_title || "Unknown activity"}
        </p>
        <p className="text-xs capitalize text-slate-400">
          {item.source} · {item.category}
        </p>
      </div>
      <span className={`ml-auto text-xs font-medium ${
        item.distraction_probability > 0.65 ? "text-danger" : "text-slate-400"
      }`}>
        {Math.round((item.distraction_probability || 0) * 100)}%
      </span>
    </div>
  );
}


function AlertRow({ alert }) {
  return (
    <div className="py-3">
      <div className="flex items-center gap-2">
        <AlertTriangle
          size={16}
          className={alert.severity === "high" ? "text-danger" : "text-sun"}
        />
        <p className="text-sm font-medium text-white capitalize">
          {alert.event_type?.replaceAll("_", " ")}
        </p>
        {!alert.acknowledged && (
          <span className="ml-auto rounded-full bg-danger/20 px-2 py-0.5 text-xs text-danger">
            New
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
    </div>
  );
}