interface StatusCardProps {
  title: string
  status: string
  description: string
  tone?: "success" | "warning" | "neutral"
}

const toneClasses: Record<NonNullable<StatusCardProps["tone"]>, string> = {
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
  neutral: "border-white/10 bg-white/5 text-white/80",
}

export default function StatusCard({
  title,
  status,
  description,
  tone = "neutral",
}: StatusCardProps) {
  return (
    <article className="ui-glass-card p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{title}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-lg font-semibold text-white">{status}</span>
        <span className={`ui-status-chip px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
          {tone === "success" ? "Ready" : tone === "warning" ? "Check" : "Info"}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/65">{description}</p>
    </article>
  )
}
