import { ArrowRight, BellRing, BrainCircuit, Chrome, LockKeyhole, MonitorCheck, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  { icon: MonitorCheck, title: "Live activity intelligence", text: "Track app, website, idle, switching, focus, and screen-time signals in one command center." },
  { icon: LockKeyhole, title: "Blocking that enforces", text: "Redirect blocked sites, close restricted apps, and apply study or bedtime policies." },
  { icon: ShieldCheck, title: "Parent-child controls", text: "Create child accounts, review activity, receive alerts, and remotely adjust restrictions." },
  { icon: BellRing, title: "Realtime alerts", text: "Browser, desktop, and dashboard notifications arrive as soon as risky activity is detected." }
];

export default function Landing() {
  return (
    <main className="min-h-screen bg-ink text-slate-100">
      <section className="mx-auto grid min-h-[92vh] max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-[1fr_1.05fr] lg:px-8">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-mint/30 bg-mint/10 px-3 py-2 text-sm text-mint">
            <BrainCircuit size={16} />
            AI-powered focus, safety, and productivity control
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white md:text-6xl">Habit Breaker AI</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            A commercial-grade productivity monitoring platform for teams, families, students, and deep-work professionals.
            It combines web SaaS dashboards, a Chrome extension, desktop monitoring, AI distraction prediction, and parental controls.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="button-primary">
              Launch platform
              <ArrowRight size={16} />
            </Link>
            <a href="#stack" className="button-secondary">
              <Chrome size={16} />
              View system
            </a>
          </div>
        </div>

        <div className="surface rounded-lg p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-line bg-ink/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Productivity</p>
              <p className="mt-2 text-4xl font-semibold text-mint">86</p>
              <p className="text-sm text-slate-400">score today</p>
            </div>
            <div className="rounded-lg border border-line bg-ink/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Focus</p>
              <p className="mt-2 text-4xl font-semibold text-leaf">5.4h</p>
              <p className="text-sm text-slate-400">deep work</p>
            </div>
            <div className="rounded-lg border border-line bg-ink/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Alerts</p>
              <p className="mt-2 text-4xl font-semibold text-sun">12</p>
              <p className="text-sm text-slate-400">resolved</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-line bg-ink/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Realtime activity stream</p>
                <p className="text-xs text-slate-400">Chrome Extension + Desktop Agent + AI Classifier</p>
              </div>
              <span className="rounded-lg bg-leaf/10 px-3 py-1 text-xs text-leaf">online</span>
            </div>
            {["VS Code marked productive", "youtube.com blocked during study hours", "Discord app warning sent", "Child bedtime lock activated"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                <span className="h-2 w-2 rounded-full bg-mint" />
                <span className="text-sm text-slate-300">{item}</span>
                <span className="ml-auto text-xs text-slate-500">{index + 1}m ago</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stack" className="border-t border-line bg-panel/30 py-14">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-lg border border-line bg-ink/70 p-5">
              <span className="mb-4 inline-flex rounded-lg bg-mint/10 p-2 text-mint">
                <Icon size={20} />
              </span>
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

