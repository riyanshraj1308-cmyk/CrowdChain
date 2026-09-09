const PALETTE = ["#B75B12", "#3F6B2E", "#7C3B0C", "#325623", "#9A4A0E", "#5C8A46"];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function Avatar({ address = "", name, size = 40, className = "" }) {
  const seed = address || name || "0x0";
  const hash = hashString(seed);
  const color = PALETTE[hash % PALETTE.length];
  const initials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : address
    ? address.slice(2, 4).toUpperCase()
    : "?";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-display text-paper-50 ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
