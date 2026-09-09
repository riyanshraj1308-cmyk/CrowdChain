export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-ink-950/15 px-6 py-16 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-950/5">
          <Icon className="h-6 w-6 text-ink-500" aria-hidden="true" />
        </div>
      )}
      <h3 className="font-display text-lg text-ink-950">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-600">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sublabel, className = "" }) {
  return (
    <div className={`rounded-lg border border-ink-950/10 bg-paper-50 p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ink-600">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-copper-500" aria-hidden="true" />}
      </div>
      <p className="font-display text-3xl text-ink-950">{value}</p>
      {sublabel && <p className="mt-1 text-sm text-ink-500">{sublabel}</p>}
    </div>
  );
}
