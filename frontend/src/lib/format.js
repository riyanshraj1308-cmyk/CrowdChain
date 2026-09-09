export function shortAddress(address = "") {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const WEI_PER_ETH = 1_000_000_000_000_000_000n;

/** Formats a wei-denominated string/bigint amount as a trimmed ETH string. */
export function formatEth(weiValue, { maxDecimals = 3 } = {}) {
  if (weiValue === undefined || weiValue === null) return "0";
  const wei = typeof weiValue === "bigint" ? weiValue : BigInt(weiValue);
  const whole = wei / WEI_PER_ETH;
  const fraction = wei % WEI_PER_ETH;
  if (fraction === 0n) return whole.toString();

  const fractionStr = fraction.toString().padStart(18, "0").slice(0, maxDecimals);
  const trimmed = fractionStr.replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole.toString();
}

export function ethToWei(ethAmount) {
  const [whole, fraction = ""] = String(ethAmount).split(".");
  const paddedFraction = (fraction + "0".repeat(18)).slice(0, 18);
  const wei = BigInt(whole || "0") * WEI_PER_ETH + BigInt(paddedFraction || "0");
  return wei.toString();
}

export function formatUsd(ethAmountString, ethPriceUsd = 3200) {
  const value = Number(ethAmountString) * ethPriceUsd;
  return value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function percentFunded(totalRaisedWei, goalWei) {
  const raised = Number(formatEth(totalRaisedWei, { maxDecimals: 8 }));
  const goal = Number(formatEth(goalWei, { maxDecimals: 8 }));
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

export function daysRemaining(deadlineIso) {
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatDate(dateIso) {
  return new Date(dateIso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(dateIso) {
  const seconds = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [name, secondsInUnit] of units) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${name}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
}
