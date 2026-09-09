const VARIANTS = {
  neutral: "bg-ink-100 text-ink-700 border-ink-950/10",
  copper: "bg-copper-50 text-copper-600 border-copper-200",
  moss: "bg-moss-50 text-moss-600 border-moss-100",
  rust: "bg-rust-50 text-rust-600 border-rust-400/30",
  amber: "bg-amber-50 text-amber-500 border-amber-400/30",
};

export default function Badge({ variant = "neutral", className = "", children, icon: Icon }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-medium leading-none ${VARIANTS[variant]} ${className}`}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function statusVariant(status) {
  switch (status) {
    case "ACTIVE":
    case "SUBMITTED":
      return "amber";
    case "SUCCESSFUL":
    case "APPROVED":
    case "RELEASED":
    case "COMPLETED":
      return "moss";
    case "FAILED":
    case "REJECTED":
    case "CANCELLED":
      return "rust";
    default:
      return "neutral";
  }
}
