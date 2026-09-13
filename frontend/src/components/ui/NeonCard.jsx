/**
 * NeonCard — the Uiverse.io "pulse card" (by Spacious74), adapted to a
 * reusable skin: white→black radial border, a roaming glow dot, a soft light
 * ray and hairline rules, over a dark radial-gradient card face.
 *
 * Always-dark by design (like the app's .panel-ink showpieces) — content
 * inside should use literal light colors (text-white, white/70, …), not theme
 * tokens. Size is fluid: the original 300×250 stat-card proportions become
 * width:100% with content-driven height.
 */

export default function NeonCard({ children, className = "" }) {
  return (
    <div className={`uvc ${className}`}>
      <span className="uvc-dot" aria-hidden="true" />
      <span className="uvc-ray" aria-hidden="true" />
      <span className="uvc-line uvc-line-t" aria-hidden="true" />
      <span className="uvc-line uvc-line-b" aria-hidden="true" />
      <span className="uvc-line uvc-line-l" aria-hidden="true" />
      <span className="uvc-line uvc-line-r" aria-hidden="true" />
      <div className="uvc-card">{children}</div>
    </div>
  );
}
