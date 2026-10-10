/**
 * NeonCard — the shared dark panel skin for vote and escrow surfaces.
 *
 * A luminous violet border lighting a deep near-black face, an ember sheen
 * entering from the top-left, and the roaming glow dot as the signature.
 * Always-dark by design (like .panel-ink showpieces): content inside uses
 * literal light colors (text-white, white/70, …), not theme tokens. Size is
 * fluid — width:100% with content-driven height.
 */

export default function NeonCard({ children, className = "" }) {
  return (
    <div className={`uvc ${className}`}>
      <span className="uvc-dot" aria-hidden="true" />
      <div className="uvc-card">{children}</div>
    </div>
  );
}
