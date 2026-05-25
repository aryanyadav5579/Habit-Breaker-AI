import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Flame,
  Lock,
  ShieldCheck,
  Target
} from "lucide-react";
import { useEffect, useState } from "react";

import { safeGet } from "../api/client.js";
import { MetricCard } from "../components/MetricCard.jsx";

const fallback = {
  productivity_score: 0,
  focus_hours: 0,
  distraction_count: 0,
  screen_time_hours: 0,
  top_distracting_websites: [],
  top_productive_apps: [],
  daily_trend: [],
  heatmap: [],
  ai_insights: [
    "Study-only mode is active.",
    "Take a break after the next completed focus block."
  ]
};

export default function ChildDashboard() {
  const [summary, setSummary] = useState(fallback);
  const [streak, setStreak] = useState({ streak_days: 0 });
  const [restrictions, setRestrictions] = useState([]);
  const [blockedSites, setBlockedSites] = useState([]);

  useEffect(() => {
    safeGet("/analytics/summary?days=1", fallback).then(setSummary);
    safeGet("/analytics/streak", { streak_days: 0 }).then(setStreak);
    safeGet("/settings/me", null).then((s) => {
      if (s) {
        setBlockedSites(s.distracting_websites || []);
        const rules = [];
        if (s.child_safe_mode) rules.push("Child-safe mode active");
        if (s.blocking_enabled) rules.push("Website & app blocking enabled");
        if (s.bedtime_schedule?.start) rules.push(`Bedtime lock: ${s.bedtime_schedule.start}`);
        if (s.work_schedule?.start) rules.push(`Study window: ${s.work_schedule.start} – ${s.work_schedule.end}`);
        if (s.daily_limits?.social) rules.push(`Social media limit: ${s.daily_limits.social} min`);
        setRestrictions(rules);
      }
    });
  }, []);

  const dailyGoalMins = 120;
  const goalProgress = Math.min(Math.round((summary.focus_hours * 60) / dailyGoalMins * 100), 100);

  return (
    <div className="space-y-6 animate-fadein">
      <div>
        <p className="text-sm uppercase tracking-wide text-mint">Child dashboard</p>
        <h2 className="text-2xl font-semibold text-white">Study-safe focus view</h2>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ShieldCheck} label="Safety mode" value="Active" detail="parent policy" tone="leaf" />
        <MetricCard icon={BookOpenCheck} label="Study score" value={`${summary.productivity_score}%`} detail="today" />
        <MetricCard icon={Clock3} label="Focus time" value={`${summary.focus_hours}h`} detail="tracked" tone="sun" />
        <MetricCard icon={AlertTriangle} label="Warnings" value={summary.distraction_count} detail="today" tone="danger" />
      </div>

      {/* Goal progress */}
      <div className="surface rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium text-white flex items-center gap-2">
            <Target size={16} className="text-mint" />
            Today's study goal
          </p>
          <span className="text-sm font-semibold text-mint">{goalProgress}%</span>
        </div>
        <div className="h-3 rounded-full bg-ink/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mint to-teal-300 transition-all duration-700"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {summary.focus_hours}h focused of {dailyGoalMins / 60}h daily goal
        </p>

        {/* Streak */}
        {streak.streak_days > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
            <Flame size={14} className="text-amber-400" />
            <span className="text-sm text-amber-300 font-medium">{streak.streak_days}-day streak!</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Active restrictions */}
        <section className="surface rounded-lg p-5">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <Lock size={16} className="text-mint" />
            Active restrictions
          </h3>
          {restrictions.length ? (
            <div className="space-y-2">
              {restrictions.map((rule) => (
                <div key={rule} className="flex items-center gap-3 rounded-lg border border-line bg-ink/70 px-3 py-2">
                  <CheckCircle2 size={14} className="text-mint flex-shrink-0" />
                  <p className="text-sm text-slate-300">{rule}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No restrictions currently applied.</p>
          )}
        </section>

        {/* AI guidance */}
        <section className="surface rounded-lg p-5">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <BookOpenCheck size={16} className="text-mint" />
            Study guidance
          </h3>
          <div className="space-y-3">
            {summary.ai_insights.map((insight, i) => (
              <p key={i} className="rounded-lg border border-line bg-ink/70 p-4 text-sm leading-6 text-slate-300">
                {insight}
              </p>
            ))}
          </div>

          {/* Blocked sites list */}
          {blockedSites.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Blocked sites</p>
              <div className="flex flex-wrap gap-2">
                {blockedSites.slice(0, 8).map((site) => (
                  <span key={site} className="badge-danger">{site}</span>
                ))}
                {blockedSites.length > 8 && (
                  <span className="badge text-slate-400">+{blockedSites.length - 8} more</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
