import { motion } from "framer-motion";

export function MetricCard({ icon: Icon, label, value, detail, tone = "mint" }) {
  const tones = {
    mint: "text-mint bg-mint/10",
    leaf: "text-leaf bg-leaf/10",
    sun: "text-sun bg-sun/10",
    danger: "text-danger bg-danger/10"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface rounded-lg p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          {detail ? <p className="mt-1 text-sm text-slate-400">{detail}</p> : null}
        </div>
        {Icon ? (
          <span className={`rounded-lg p-2 ${tones[tone]}`}>
            <Icon size={20} />
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
