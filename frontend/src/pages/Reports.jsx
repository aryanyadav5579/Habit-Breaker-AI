import {
  Download,
  FileText,
  Flame,
  Sparkles,
  TrendingUp,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { safeGet } from "../api/client.js";

const fallback = {
  title: "Weekly Productivity Intelligence Report",
  generated_at: new Date().toISOString(),
  summary: {
    productivity_score: 0,
    focus_hours: 0,
    distraction_count: 0,
    screen_time_hours: 0,
    daily_trend: [],
    ai_insights: []
  },
  recommendations: [
    "Start a focus session to build your productivity baseline.",
    "Add your productive websites in Settings for better AI scoring."
  ]
};

export default function Reports() {
  const [report, setReport] = useState(fallback);
  const [streak, setStreak] = useState({ streak_days: 0, burnout_risk: 0, burnout_label: "low" });

  useEffect(() => {
    safeGet("/reports/weekly", fallback).then((data) => {
      // Flatten nested summary if backend returns {title, summary: {summary: {...}}}
      const r = {
        ...data,
        summary: data.summary?.summary || data.summary || fallback.summary,
        recommendations: data.recommendations || []
      };
      setReport(r);
    });
    safeGet("/analytics/streak", { streak_days: 0, burnout_risk: 0, burnout_label: "low" }).then(setStreak);
  }, []);

  const burnoutColor =
    streak.burnout_label === "high" ? "text-danger" :
    streak.burnout_label === "medium" ? "text-sun" : "text-leaf";

  const burnoutBg =
    streak.burnout_label === "high" ? "border-danger/30 bg-danger/5" :
    streak.burnout_label === "medium" ? "border-sun/30 bg-sun/5" : "border-leaf/30 bg-leaf/5";

  return (
    <div className="space-y-6 animate-fadein">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-mint">Reports</p>
          <h2 className="text-2xl font-semibold text-white">{report.title}</h2>
        </div>
        <button onClick={() => window.print()} className="button-secondary">
          <Download size={16} />
          Export PDF
        </button>
      </div>

      {/* Summary stats */}
      <section className="surface rounded-lg p-6">
        <div className="mb-5 flex items-center gap-3">
          <FileText size={20} className="text-mint" />
          <p className="text-sm text-slate-400">
            Generated {new Date(report.generated_at).toLocaleString()}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <ReportStat label="Productivity score" value={`${report.summary.productivity_score}%`} icon="🧠" />
          <ReportStat label="Focus hours" value={`${report.summary.focus_hours}h`} icon="⏱" />
          <ReportStat label="Distractions" value={report.summary.distraction_count} icon="⚠️" />
          <ReportStat label="Screen time" value={`${report.summary.screen_time_hours}h`} icon="🖥" />
        </div>
      </section>

      {/* Streak + Burnout */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="surface rounded-lg p-5 flex items-center gap-4">
          <div className="rounded-xl bg-amber-500/10 p-3">
            <Flame size={28} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Focus streak</p>
            <p className="text-3xl font-bold text-white mt-1">{streak.streak_days} <span className="text-base font-normal text-slate-400">days</span></p>
          </div>
        </div>

        <div className={`surface rounded-lg p-5 flex items-center gap-4 border-l-4 ${burnoutBg}`}>
          <div className="rounded-xl bg-white/5 p-3">
            <Zap size={28} className={burnoutColor} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Burnout risk</p>
            <p className={`text-3xl font-bold mt-1 capitalize ${burnoutColor}`}>{streak.burnout_label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{Math.round(streak.burnout_risk * 100)}% risk score</p>
          </div>
        </div>
      </div>

      {/* Weekly trend chart */}
      {report.summary.daily_trend?.length > 0 && (
        <section className="surface rounded-lg p-5">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-mint" />
            Weekly activity trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.summary.daily_trend}>
                <defs>
                  <linearGradient id="gProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#26364d" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#101c2f", border: "1px solid #26364d", color: "#e5edf7", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="productive" stroke="#2dd4bf" fill="url(#gProd)" />
                <Area type="monotone" dataKey="distracting" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* AI Recommendations */}
      <section className="surface rounded-lg p-6">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles size={20} className="text-mint" />
          <h3 className="text-base font-semibold text-white">AI recommendations</h3>
        </div>
        <div className="space-y-3">
          {(report.recommendations || []).map((item, i) => (
            <div key={i} className="flex gap-3 rounded-lg border border-line bg-ink/70 p-4">
              <span className="text-mint mt-0.5 flex-shrink-0">→</span>
              <p className="text-sm leading-6 text-slate-300">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportStat({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-line bg-ink/70 p-4">
      <p className="text-lg">{icon}</p>
      <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
