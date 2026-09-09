export default function Card({ className = "", children, as: Comp = "div", ...props }) {
  return (
    <Comp
      className={`rounded-lg border border-ink-950/10 bg-paper-50 shadow-card ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
