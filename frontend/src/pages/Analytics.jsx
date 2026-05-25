import {
  BarChart3,
  BrainCircuit,
  Clock3,
  Flame,
  Globe2,
  MonitorUp,
  Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { safeGet } from "../api/client.js";
import { MetricCard } from "../components/MetricCard.jsx";

const fallback = {
  productivity_score: 0,
  focus_hours: 0,
  distraction_count: 0,
  screen_time_hours: 0,
  daily_trend: [],
  top_distracting_websites: [],
  top_productive_apps: [],
  heatmap: [],
  ai_insights: []
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(fallback);
  const [streak, setStreak] = useState({ streak_days: 0, burnout_risk: 0, burnout_label: "low" });

  useEffect(() => {
    safeGet(`/analytics/summary?days=${days}`, fallback).then(setSummary);
    safeGet("/analytics/streak", { streak_days: 0, burnout_risk: 0, burnout_label: "low" }).then(setStreak);
  }, [days]);

  // Build full 7×24 heatmap matrix
  const heatMatrix = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const cell = summary.heatmap.find(
        (h) => h.weekday === day && h.hour === hour
      );
      return cell?.count || 0;
    })
  );
  const heatMax = Math.max(1, ...heatMatrix.flat());

  return (
    <div className="space-y-6 animate-fadein">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-mint">Analytics</p>
          <h2 className="text-2xl font-semibold text-white">Productivity intelligence</h2>
        </div>
        <select
          className="input max-w-40"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BarChart3} label="AI score" value={`${summary.productivity_score}%`} detail="period average" />
        <MetricCard icon={Flame} label="Focus streak" value={`${streak.streak_days} days`} detail="goal met" tone="leaf" />
        <MetricCard icon={Globe2} label="Top risks" value={summary.top_distracting_websites.length} detail="web domains" tone="danger" />
        <MetricCard icon={MonitorUp} label="App signals" value={summary.top_productive_apps.length} detail="productive apps" tone="sun" />
      </div>

      {/* Burnout indicator */}
      {streak.burnout_risk > 0.3 && (
        <div className={`surface rounded-lg p-4 flex items-center gap-4 border-l-4 ${
          streak.burnout_label === "high" ? "border-l-danger" : "border-l-sun"
        }`}>
          <BrainCircuit size={24} className={streak.burnout_label === "high" ? "text-danger" : "text-sun"} />
          <div>
            <p className="font-semibold text-white">
              {streak.burnout_label === "high" ? "⚠ High burnout risk detected" : "Moderate screen fatigue"}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">
              Burnout score: {Math.round(streak.burnout_risk * 100)}% — Consider scheduling a proper recovery break.
            </p>
          </div>
        </div>
      )}

      {/* Daily trend line chart */}
      {summary.daily_trend.length > 0 && (
        <section className="surface rounded-lg p-4">
          <h3 className="text-base font-semibold text-white mb-4">Daily trend (minutes)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.daily_trend}>
                <CartesianGrid stroke="#26364d" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#101c2f", border: "1px solid #26364d", color: "#e5edf7", borderRadius: "8px" }}
                />
                <Line type="monotone" dataKey="productive" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="distracting" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="neutral" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-3">
            {[["Productive", "#2dd4bf"], ["Distracting", "#ef4444"], ["Neutral", "#f59e0b"]].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-2 w-4 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Activity heatmap (7 days × 24 hours) */}
      <section className="surface rounded-lg p-4">
        <h3 className="text-base font-semibold text-white mb-1">Activity heatmap</h3>
        <p className="text-xs text-slate-500 mb-4">Hours of the day (x) vs day of week (y) — brighter = more events</p>
        <div className="overflow-x-auto">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `48px repeat(24, 1fr)` }}>
            {/* Hour labels */}
            <div className="text-xs text-slate-600" />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-center text-[9px] text-slate-600 pb-1">
                {h % 3 === 0 ? `${h}h` : ""}
              </div>
            ))}
            {/* Rows */}
            {DAYS.map((day, dayIdx) => (
              <>
                <div key={`lbl-${day}`} className="flex items-center text-xs text-slate-500 pr-2">{day}</div>
                {heatMatrix[dayIdx].map((count, hour) => (
                  <div
                    key={`${dayIdx}-${hour}`}
                    title={`${day} ${hour}:00 — ${count} events`}
                    className="aspect-square rounded-sm border border-line/30"
                    style={{
                      backgroundColor: count === 0
                        ? "rgba(38, 54, 77, 0.3)"
                        : `rgba(45, 212, 191, ${0.08 + (count / heatMax) * 0.85})`
                    }}
                  />
                ))}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* Bar charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Top distracting websites"
          data={summary.top_distracting_websites}
          dataKey="count"
          labelKey="domain"
          color="#ef4444"
        />
        <ChartPanel
          title="Top productive applications"
          data={summary.top_productive_apps}
          dataKey="count"
          labelKey="app"
          color="#22c55e"
        />
      </div>

      {/* AI insights */}
      {summary.ai_insights.length > 0 && (
        <section className="surface rounded-lg p-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-mint" />
            AI productivity insights
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {summary.ai_insights.map((item, i) => (
              <div key={i} className="rounded-lg border border-line bg-ink/70 p-4 text-sm leading-6 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ChartPanel({ title, data, dataKey, labelKey, color }) {
  if (!data?.length) return null;
  return (
    <section className="surface rounded-lg p-4">
      <h3 className="text-base font-semibold text-white mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid stroke="#26364d" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <YAxis dataKey={labelKey} type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={90} />
            <Tooltip contentStyle={{ background: "#101c2f", border: "1px solid #26364d", color: "#e5edf7", borderRadius: "8px" }} />
            <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
